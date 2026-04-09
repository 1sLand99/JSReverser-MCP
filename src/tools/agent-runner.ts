import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

import {getReverseTaskState} from '../reverse/ReverseTaskQuery.js';
import {
  appendReverseAgentLog,
  markReverseAgentStop,
  type ReverseAgentRunResult,
  type ReverseAgentRoundResult,
  type ReverseAgentStopReason,
} from '../reverse/ReverseAgentRunner.js';
import {buildRunReverseAgentHints} from '../reverse/ReverseTaskAgentProtocol.js';
import {orchestrateReverseTask} from '../reverse/ReverseTaskOrchestrator.js';
import {updateReverseTaskState} from '../reverse/ReverseTaskState.js';
import {zod} from '../third_party/index.js';

import {deobfuscateCode, locateSignatureFunction, understandCode} from './analyzer.js';
import {ToolCategory} from './categories.js';
import {extractFunctionTree, searchInSources} from './debugger.js';
import {manageReverseTaskTool} from './task-manager.js';
import {buildOrchestrationContinuation, compactAgentPayload, withSchemaVersion} from './response-builder.js';
import {defineTool} from './ToolDefinition.js';
import {getJSHookRuntime} from './runtime.js';

type AgentToolContext = Parameters<typeof searchInSources.handler>[2];

function makeToolResponse() {
  return {
    lines: [] as string[],
    appendResponseLine(value: string) {
      this.lines.push(value);
    },
    setIncludePages: () => undefined,
    setIncludeNetworkRequests: () => undefined,
    setIncludeConsoleData: () => undefined,
    attachImage: () => undefined,
    attachNetworkRequest: () => undefined,
    attachConsoleMessage: () => undefined,
    setIncludeWebSocketConnections: () => undefined,
    attachWebSocket: () => undefined,
  };
}

function extractJsonPayload(lines: string[]): Record<string, unknown> | undefined {
  const start = lines.indexOf('```json');
  const end = lines.indexOf('```', start + 1);
  if (start < 0 || end < 0) {
    return undefined;
  }
  return JSON.parse(lines.slice(start + 1, end).join('\n')) as Record<string, unknown>;
}

function classifyFailure(errorMessage: string): {failureType: string; retryable: boolean} {
  const normalized = errorMessage.toLowerCase();
  if (normalized.includes('timed out') || normalized.includes('fetch failed') || normalized.includes('browser failed')) {
    return {failureType: 'external_error', retryable: true};
  }
  if (normalized.includes('not implemented')) {
    return {failureType: 'tool_error', retryable: true};
  }
  if (normalized.includes('invalid') || normalized.includes('required')) {
    return {failureType: 'validation_error', retryable: false};
  }
  if (normalized.includes('window is not defined') || normalized.includes('localstorage is not defined') || normalized.includes('subtle')) {
    return {failureType: 'env_error', retryable: true};
  }
  return {failureType: 'unknown', retryable: false};
}

async function readTaskDescriptor(taskId: string): Promise<{
  taskSlug: string;
  targetUrl: string;
  goal: string;
}> {
  const runtime = getJSHookRuntime();
  const task = await runtime.reverseTaskStore.readSnapshot<Record<string, unknown>>(taskId, 'task.json');
  return {
    taskSlug: String(task?.slug ?? taskId),
    targetUrl: String(task?.targetUrl ?? ''),
    goal: String(task?.goal ?? ''),
  };
}

async function executeRoundStep(
  step: {tool: string; params: Record<string, unknown>},
  taskId: string,
  context: AgentToolContext,
): Promise<Record<string, unknown> | undefined> {
  const response = makeToolResponse();
  const taskMeta = await readTaskDescriptor(taskId);

  if (step.tool === 'manage_reverse_task') {
    await manageReverseTaskTool.handler({
      params: {
        ...step.params,
        outputMode: 'compact',
      },
    } as Parameters<typeof manageReverseTaskTool.handler>[0], response as unknown as Parameters<typeof manageReverseTaskTool.handler>[1], {} as Parameters<typeof manageReverseTaskTool.handler>[2]);
    return extractJsonPayload(response.lines);
  }

  if (step.tool === 'locate_signature_function') {
    await locateSignatureFunction.handler({
      params: {
        ...step.params,
        taskId,
        taskSlug: taskMeta.taskSlug,
        goal: taskMeta.goal,
        persistResult: true,
      },
    } as Parameters<typeof locateSignatureFunction.handler>[0], response as unknown as Parameters<typeof locateSignatureFunction.handler>[1], {} as Parameters<typeof locateSignatureFunction.handler>[2]);
    return extractJsonPayload(response.lines);
  }

  if (step.tool === 'search_in_sources') {
    await searchInSources.handler({
      params: {
        ...step.params,
        taskId,
        taskSlug: taskMeta.taskSlug,
        targetUrl: taskMeta.targetUrl,
        goal: taskMeta.goal,
        persistResult: true,
      },
    } as Parameters<typeof searchInSources.handler>[0], response as unknown as Parameters<typeof searchInSources.handler>[1], context);
    return extractJsonPayload(response.lines);
  }

  if (step.tool === 'extract_function_tree') {
    await extractFunctionTree.handler({
      params: {
        ...step.params,
        taskId,
        taskSlug: taskMeta.taskSlug,
        targetUrl: taskMeta.targetUrl,
        goal: taskMeta.goal,
        persistResult: true,
      },
    } as Parameters<typeof extractFunctionTree.handler>[0], response as unknown as Parameters<typeof extractFunctionTree.handler>[1], context);
    return extractJsonPayload(response.lines);
  }

  if (step.tool === 'understand_code') {
    await understandCode.handler({
      params: step.params,
    } as Parameters<typeof understandCode.handler>[0], response as unknown as Parameters<typeof understandCode.handler>[1], {} as Parameters<typeof understandCode.handler>[2]);
    const payload = extractJsonPayload(response.lines);
    const runtime = getJSHookRuntime();
    const task = await runtime.reverseTaskStore.openTask({
      taskId,
      slug: taskMeta.taskSlug,
      targetUrl: taskMeta.targetUrl,
      goal: taskMeta.goal,
    });
    await task.writeSnapshot('understand-code.json', {
      input: step.params,
      result: payload,
      persistedAt: Date.now(),
    });
    await task.appendLog('runtime-evidence', {
      source: 'understand_code',
      kind: 'understand-code',
      focus: step.params.focus,
      note: 'persisted structure understanding result',
    });
    const deobfuscateResponse = makeToolResponse();
    await deobfuscateCode.handler({
      params: {
        code: String(step.params.code ?? ''),
        aggressive: true,
        renameVariables: false,
      },
    } as Parameters<typeof deobfuscateCode.handler>[0], deobfuscateResponse as unknown as Parameters<typeof deobfuscateCode.handler>[1], {} as Parameters<typeof deobfuscateCode.handler>[2]);
    const deobfuscatePayload = extractJsonPayload(deobfuscateResponse.lines);
    await task.writeSnapshot('deobfuscate-code.json', {
      input: {
        code: String(step.params.code ?? ''),
        aggressive: true,
        renameVariables: false,
      },
      result: deobfuscatePayload,
      persistedAt: Date.now(),
    });
    const functionSlice = await runtime.reverseTaskStore.readSnapshot<Record<string, unknown>>(taskId, 'function-slice.json');
    await task.writeSnapshot('pure-extraction.json', {
      stage: 'PureExtraction',
      mainFunction: functionSlice?.mainFunction ?? 'unknown',
      scriptId: functionSlice?.scriptId,
      scriptUrl: functionSlice?.scriptUrl,
      boundary: {
        explicitInputsRequired: 'pending fixture freeze',
        runtimeOnlyState: 'pending manual confirmation',
        pureImplementationStatus: 'ready-to-start',
      },
      derivedFrom: ['understand-code.json', 'deobfuscate-code.json', 'function-slice.json'],
      nextRecommendedFiles: ['run/fixtures.json', 'run/pure-main.js'],
      persistedAt: Date.now(),
    });
    await materializePureExtractionDrafts(taskId);
    await task.appendLog('runtime-evidence', {
      source: 'deobfuscate_code',
      kind: 'deobfuscate-code',
      note: 'persisted deobfuscation result for pure extraction prep',
    });
    await task.appendLog('runtime-evidence', {
      source: 'run_reverse_agent',
      kind: 'pure-draft',
      note: 'generated run/fixtures.json and run/pure-main.js skeletons',
    });
    await updateReverseTaskState(runtime.reverseTaskStore, {
      taskId,
      currentStage: 'PureExtraction',
      currentSummary: `已完成函数切片结构理解与去混淆预处理，可开始固化 fixture 和 Node pure implementation。`,
      nextStepHint: 'manage_reverse_task:summarize',
      status: 'partial',
    });
    return payload;
  }

  throw new Error(`run_reverse_agent does not support automatic step "${step.tool}" yet`);
}

function buildStepFingerprint(step: {tool: string; params?: Record<string, unknown>}): string {
  return `${step.tool}:${JSON.stringify(step.params ?? {})}`;
}

function tryParseJsonObject(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : undefined;
  } catch {
    return undefined;
  }
}

async function readCaptureSnapshot(taskId: string): Promise<Record<string, unknown> | undefined> {
  const runtime = getJSHookRuntime();
  const capturePath = path.join(runtime.reverseTaskStore.getTaskDir(taskId), 'env', 'capture.json');
  try {
    return JSON.parse(await readFile(capturePath, 'utf8')) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

async function materializePureExtractionDrafts(taskId: string): Promise<void> {
  const runtime = getJSHookRuntime();
  const runDir = path.join(runtime.reverseTaskStore.getTaskDir(taskId), 'run');
  await mkdir(runDir, {recursive: true});

  const [functionSlice, understandSnapshot, deobfuscateSnapshot, targetContext, runtimeEvidence, captureSnapshot] = await Promise.all([
    runtime.reverseTaskStore.readSnapshot<Record<string, unknown>>(taskId, 'function-slice.json'),
    runtime.reverseTaskStore.readSnapshot<Record<string, unknown>>(taskId, 'understand-code.json'),
    runtime.reverseTaskStore.readSnapshot<Record<string, unknown>>(taskId, 'deobfuscate-code.json'),
    runtime.reverseTaskStore.readSnapshot<Record<string, unknown>>(taskId, 'target-context.json'),
    runtime.reverseTaskStore.readLog('runtime-evidence', taskId),
    readCaptureSnapshot(taskId),
  ]);

  const mainFunction = String(functionSlice?.mainFunction ?? 'main');
  const scriptUrl = typeof functionSlice?.scriptUrl === 'string' ? functionSlice.scriptUrl : '';
  const extractedClosure = typeof functionSlice?.code === 'string' ? functionSlice.code : '';
  const deobfuscatedCode =
    typeof deobfuscateSnapshot?.result === 'object' &&
    deobfuscateSnapshot?.result &&
    typeof (deobfuscateSnapshot.result as Record<string, unknown>).code === 'string'
      ? String((deobfuscateSnapshot.result as Record<string, unknown>).code)
      : extractedClosure;
  const deobfuscateAnalysis =
    typeof deobfuscateSnapshot?.result === 'object' &&
    deobfuscateSnapshot?.result &&
    typeof (deobfuscateSnapshot.result as Record<string, unknown>).analysis === 'string'
      ? String((deobfuscateSnapshot.result as Record<string, unknown>).analysis)
      : 'pending';
  const targetRequest =
    targetContext?.targetRequest && typeof targetContext.targetRequest === 'object'
      ? targetContext.targetRequest as Record<string, unknown>
      : undefined;
  const firstEvidenceWithBody = runtimeEvidence.find((entry) =>
    typeof entry.bodyPreview === 'string' || typeof entry.body === 'string',
  );
  const inferredInput =
    tryParseJsonObject(firstEvidenceWithBody?.bodyPreview) ??
    tryParseJsonObject(firstEvidenceWithBody?.body) ??
    (
      captureSnapshot?.runtimeEvidence &&
      Array.isArray(captureSnapshot.runtimeEvidence) &&
      captureSnapshot.runtimeEvidence[0] &&
      typeof captureSnapshot.runtimeEvidence[0] === 'object'
        ? tryParseJsonObject((captureSnapshot.runtimeEvidence[0] as Record<string, unknown>).bodyPreview)
        : undefined
    ) ??
    {};
  const inferredExpected = {
    requestUrl:
      typeof firstEvidenceWithBody?.requestUrl === 'string'
        ? firstEvidenceWithBody.requestUrl
        : (typeof targetRequest?.url === 'string' ? targetRequest.url : scriptUrl),
    targetParam:
      typeof (targetContext?.locatedSignature as Record<string, unknown> | undefined)?.targetParam === 'string'
        ? (targetContext?.locatedSignature as Record<string, unknown>).targetParam
        : 'TODO',
  };
  const runtimeContext = {
    request: {
      method: typeof targetRequest?.method === 'string' ? targetRequest.method : 'POST',
      url: typeof targetRequest?.url === 'string' ? targetRequest.url : scriptUrl,
    },
    page: captureSnapshot?.page ?? {},
  };

  const fixtures = {
    version: 1,
    generatedBy: 'run_reverse_agent',
    stage: 'PureExtraction',
    mainFunction,
    scriptUrl,
    boundary: {
      explicitInputsRequired: ['TODO'],
      runtimeContext: ['TODO'],
      expectedOutput: 'TODO',
    },
    samples: [
      {
        caseId: 'fixture-001',
        description: 'Auto-generated fixture draft inferred from task artifacts. Replace or verify against a browser-verified sample before claiming pure extraction complete.',
        input: inferredInput,
        runtimeContext,
        expected: inferredExpected,
      },
    ],
    derivedFrom: {
      functionSlice: 'function-slice.json',
      understand: 'understand-code.json',
      deobfuscate: 'deobfuscate-code.json',
    },
  };

  const pureMainSource = `/**
 * Auto-generated by run_reverse_agent for PureExtraction.
 * Replace TODO sections with the verified pure algorithm.
 */

export const PURE_STAGE = 'PureExtraction';
export const MAIN_FUNCTION = ${JSON.stringify(mainFunction)};
export const SOURCE_SCRIPT_URL = ${JSON.stringify(scriptUrl)};
export const FIXTURE_PATH = './fixtures.json';

/**
 * understand_code result snapshot:
 * ${JSON.stringify(understandSnapshot?.result ?? null, null, 2)}
 *
 * deobfuscate_code analysis:
 * ${JSON.stringify(deobfuscateAnalysis)}
 */
export function ${mainFunction}(input, runtimeContext = {}) {
  void runtimeContext;
  // TODO: keep only explicit algorithm inputs here.
  // TODO: remove remaining environment-derived fields after fixture verification.
  return {
    input,
    note: 'auto-generated pure skeleton',
  };
}

export const extractedClosure = ${JSON.stringify(extractedClosure)};
export const deobfuscatedDraft = ${JSON.stringify(deobfuscatedCode)};

export function runFixture(fixture) {
  return ${mainFunction}(fixture.input ?? {}, fixture.runtimeContext ?? {});
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  const fixtureArg = process.argv[2];
  const fixture = fixtureArg ? JSON.parse(fixtureArg) : {input: {}, runtimeContext: {}};
  const result = runFixture(fixture);
  console.log(JSON.stringify({ok: true, result}, null, 2));
}
`;

  const selftestSource = `import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

import {runFixture} from './pure-main.js';

test('runs first auto-generated fixture', async () => {
  const fixtures = JSON.parse(await readFile(new URL('./fixtures.json', import.meta.url), 'utf8'));
  const fixture = fixtures.samples?.[0];
  assert.ok(fixture, 'expected at least one fixture sample');
  const result = runFixture(fixture);
  assert.ok(result && typeof result === 'object');
});
`;

  await Promise.all([
    writeFile(path.join(runDir, 'fixtures.json'), `${JSON.stringify(fixtures, null, 2)}\n`, 'utf8'),
    writeFile(path.join(runDir, 'pure-main.js'), pureMainSource, 'utf8'),
    writeFile(path.join(runDir, 'pure-selftest.test.mjs'), selftestSource, 'utf8'),
  ]);
}

function shouldStopAfterRound(result: ReverseAgentRunResult['lastOrchestration']): ReverseAgentStopReason | undefined {
  if (result.execution?.failedStep) {
    return result.execution.recovery?.shouldResume ? 'checkpoint_required' : 'blocked';
  }
  if (result.status === 'pass') {
    return 'task_passed';
  }
  if (result.orchestration.primaryStep.tool === 'understand_code') {
    return 'pure_extraction_ready';
  }
  return undefined;
}

export const runReverseAgentTool = defineTool({
  name: 'run_reverse_agent',
  description: 'One-shot reverse agent entry: repeatedly plans and executes the main reverse chain until blocked, stalled, or reaching the analysis checkpoint.',
  annotations: {category: ToolCategory.REVERSE_ENGINEERING, readOnlyHint: false},
  schema: {
    taskId: zod.string().min(1),
    maxRounds: zod.number().int().positive().max(20).optional().default(6),
    strategy: zod.enum(['observe-first', 'rebuild-first', 'env-fix', 'artifact-sync', 'evidence-only']).optional(),
    outputMode: zod.enum(['compact', 'verbose']).optional().default('verbose'),
    includeSummary: zod.boolean().optional().default(true),
  },
  handler: async (request, response, context) => {
    const runtime = getJSHookRuntime();
    const rounds: ReverseAgentRoundResult[] = [];
    const fingerprints: string[] = [];
    let lastResult: Awaited<ReturnType<typeof orchestrateReverseTask>> | undefined;
    let stopReason: ReverseAgentStopReason = 'max_rounds';

    for (let round = 1; round <= (request.params.maxRounds ?? 6); round++) {
      const result = await orchestrateReverseTask(runtime.reverseTaskStore, request.params.taskId, {
        persistState: true,
        includeSummary: false,
        outputMode: 'verbose',
        strategy: round === 1 ? request.params.strategy : undefined,
      });
      lastResult = result;

      const fingerprint = buildStepFingerprint(result.orchestration.primaryStep);
      if (fingerprints.includes(fingerprint)) {
        stopReason = 'stalled';
        rounds.push({
          round,
          stage: result.currentStage,
          status: result.status,
          primaryTool: result.orchestration.primaryStep.tool,
          nextStepHint: result.nextStepHint,
          completedStepCount: 0,
        });
        await markReverseAgentStop(runtime.reverseTaskStore, request.params.taskId, result.currentStage, stopReason, {
          round,
          primaryTool: result.orchestration.primaryStep.tool,
          nextStepHint: result.nextStepHint,
        });
        break;
      }
      fingerprints.push(fingerprint);

      try {
        for (const step of result.orchestration.suggestedSteps) {
          await executeRoundStep(step, request.params.taskId, context);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const failureMeta = classifyFailure(message);
        rounds.push({
          round,
          stage: result.currentStage,
          status: failureMeta.retryable ? 'partial' : 'blocked',
          primaryTool: result.orchestration.primaryStep.tool,
          nextStepHint: result.nextStepHint,
          completedStepCount: 0,
          failedStep: {
            tool: result.orchestration.primaryStep.tool,
            failureType: failureMeta.failureType,
            retryable: failureMeta.retryable,
          },
        });
        stopReason = failureMeta.retryable ? 'checkpoint_required' : 'blocked';
        await markReverseAgentStop(runtime.reverseTaskStore, request.params.taskId, result.currentStage, stopReason, {
          round,
          primaryTool: result.orchestration.primaryStep.tool,
          failureType: failureMeta.failureType,
          retryable: failureMeta.retryable,
          error: message,
          nextStepHint: result.nextStepHint,
        });
        break;
      }

      const postState = await getReverseTaskState(runtime.reverseTaskStore, request.params.taskId, {
        timelineLimit: 10,
        evidenceLimit: 10,
      });
      rounds.push({
        round,
        stage: String(postState.state?.currentStage ?? result.currentStage),
        status: String(postState.state?.status ?? result.status),
        primaryTool: result.orchestration.primaryStep.tool,
        nextStepHint: String(postState.state?.nextStepHint ?? result.nextStepHint),
        completedStepCount: result.orchestration.suggestedSteps.length,
      });

      const stop = shouldStopAfterRound(result);
      if (stop) {
        stopReason = stop;
        await markReverseAgentStop(runtime.reverseTaskStore, request.params.taskId, String(postState.state?.currentStage ?? result.currentStage), stop, {
          round,
          primaryTool: result.orchestration.primaryStep.tool,
          nextStepHint: String(postState.state?.nextStepHint ?? result.nextStepHint),
          status: String(postState.state?.status ?? result.status),
        });
        break;
      }

      if (round === (request.params.maxRounds ?? 6)) {
        stopReason = 'max_rounds';
        await markReverseAgentStop(runtime.reverseTaskStore, request.params.taskId, String(postState.state?.currentStage ?? result.currentStage), stopReason, {
          round,
          primaryTool: result.orchestration.primaryStep.tool,
          nextStepHint: String(postState.state?.nextStepHint ?? result.nextStepHint),
          status: String(postState.state?.status ?? result.status),
        });
      }
    }

    if (!lastResult) {
      throw new Error(`Task ${request.params.taskId} could not be planned.`);
    }

    const finalState = await getReverseTaskState(runtime.reverseTaskStore, request.params.taskId, {
      timelineLimit: 20,
      evidenceLimit: 20,
    });
    const agentGuidance = buildRunReverseAgentHints({
      taskId: request.params.taskId,
      stopReason,
      finalState,
      lastPrimaryStep: lastResult.orchestration.primaryStep,
      roundsExecuted: rounds.length,
      maxRounds: request.params.maxRounds ?? 6,
    });
    const payload = withSchemaVersion(compactAgentPayload({
      ok: true,
      responseSummary: `已自动执行 task ${request.params.taskId} 的 reverse agent，共 ${rounds.length} 轮，停止原因：${stopReason}。`,
      diagnostics: {
        responseStatus: 'ok',
        outputMode: request.params.outputMode ?? 'verbose',
        taskId: request.params.taskId,
        roundsExecuted: rounds.length,
        stopReason,
      },
      ...buildOrchestrationContinuation({
        shouldResume: stopReason === 'checkpoint_required',
        failedStep: stopReason === 'checkpoint_required' || stopReason === 'blocked'
          ? rounds[rounds.length - 1]?.failedStep
          : undefined,
        agentGuidance,
      }),
      taskId: request.params.taskId,
      outputMode: request.params.outputMode ?? 'verbose',
      run: {
        roundsExecuted: rounds.length,
        maxRounds: request.params.maxRounds ?? 6,
        stopReason,
        rounds,
      },
      currentStage: String(finalState.state?.currentStage ?? lastResult.currentStage),
      status: String(finalState.state?.status ?? lastResult.status),
      nextStepHint: String(finalState.state?.nextStepHint ?? lastResult.nextStepHint),
      currentSummary: String(finalState.state?.currentSummary ?? lastResult.currentSummary),
      ...(request.params.includeSummary === false ? {} : {summary: finalState}),
      agentGuidance,
    }, request.params.outputMode ?? 'verbose'));

    response.appendResponseLine('```json');
    response.appendResponseLine(JSON.stringify(payload, null, 2));
    response.appendResponseLine('```');
  },
});
