import {orchestrateReverseTask} from '../reverse/ReverseTaskOrchestrator.js';
import {buildOrchestrationAgentHints} from '../reverse/ReverseTaskAgentProtocol.js';
import {zod} from '../third_party/index.js';

import {ToolCategory} from './categories.js';
import {defineTool} from './ToolDefinition.js';
import {getJSHookRuntime} from './runtime.js';

function buildOrchestrationContinuationFields(result: {
  fallbackPlan?: {steps: Array<{tool: string; params: Record<string, unknown>}>; recommendedStrategy?: string};
  execution?: {failedStep?: unknown; recovery?: {shouldResume?: boolean}};
  agentGuidance?: {recommendedTool?: string; recommendedParams?: Record<string, unknown>};
}): {
  outcome: 'success' | 'partial' | 'blocked';
  shouldResume: boolean;
  shouldSwitchStrategy: boolean;
  nextBestTool?: string;
  nextBestParams?: Record<string, unknown>;
} {
  const shouldResume = Boolean(result.execution?.recovery?.shouldResume);
  const nextStep = result.fallbackPlan?.steps[0];
  return {
    outcome: result.execution?.failedStep
      ? (shouldResume ? 'partial' : 'blocked')
      : 'success',
    shouldResume,
    shouldSwitchStrategy: Boolean(result.fallbackPlan?.recommendedStrategy),
    ...(nextStep?.tool
      ? {nextBestTool: nextStep.tool, nextBestParams: nextStep.params}
      : result.agentGuidance?.recommendedTool
        ? {
          nextBestTool: result.agentGuidance.recommendedTool,
          ...(result.agentGuidance.recommendedParams ? {nextBestParams: result.agentGuidance.recommendedParams} : {}),
        }
        : {}),
  };
}

export const orchestrateReverseTaskTool = defineTool({
  name: 'orchestrate_reverse_task',
  description: 'High-level reverse-task orchestrator that syncs task state, picks the primary next step, and returns a compact execution plan.',
  annotations: {category: ToolCategory.REVERSE_ENGINEERING, readOnlyHint: false},
  schema: {
    taskId: zod.string().min(1),
    persistState: zod.boolean().optional(),
    includeSummary: zod.boolean().optional(),
    execute: zod.boolean().optional(),
    resume: zod.boolean().optional(),
    stopOnError: zod.boolean().optional(),
    strategy: zod.enum(['observe-first', 'rebuild-first', 'env-fix', 'artifact-sync', 'evidence-only']).optional(),
    outputMode: zod.enum(['compact', 'verbose']).optional(),
    skipSteps: zod.array(zod.string()).optional(),
    fromStep: zod.string().optional(),
    onlySteps: zod.array(zod.string()).optional(),
    executionOverrides: zod.record(zod.string(), zod.object({
      status: zod.enum(['ok', 'error']),
      result: zod.string().optional(),
      error: zod.string().optional(),
    })).optional(),
  },
  handler: async (request, response) => {
    const runtime = getJSHookRuntime();
    const result = await orchestrateReverseTask(runtime.reverseTaskStore, request.params.taskId, {
      persistState: request.params.persistState,
      includeSummary: request.params.includeSummary,
      execute: request.params.execute,
      resume: request.params.resume,
      stopOnError: request.params.stopOnError,
      strategy: request.params.strategy,
      outputMode: request.params.outputMode,
      skipSteps: request.params.skipSteps,
      fromStep: request.params.fromStep,
      onlySteps: request.params.onlySteps,
      executionOverrides: request.params.executionOverrides,
    });
    response.appendResponseLine('```json');
    const agentGuidance = buildOrchestrationAgentHints({
      taskId: result.taskId,
      primaryStep: result.orchestration.primaryStep,
      execution: result.execution,
      confidence: result.advice.confidence,
    });
    response.appendResponseLine(JSON.stringify({
      ok: true,
      responseSummary: request.params.outputMode === 'compact'
        ? `已生成任务 ${result.taskId} 的 compact orchestration plan。`
        : `已生成任务 ${result.taskId} 的 orchestration plan。`,
      diagnostics: {
        responseStatus: 'ok',
        outputMode: result.outputMode,
        taskId: result.taskId,
        hasFallbackPlan: Boolean(result.fallbackPlan),
        executed: Boolean(result.execution?.executed),
      },
      ...buildOrchestrationContinuationFields({
        fallbackPlan: result.fallbackPlan,
        execution: result.execution,
        agentGuidance,
      }),
      ...result,
      agentGuidance,
    }, null, 2));
    response.appendResponseLine('```');
  },
});
