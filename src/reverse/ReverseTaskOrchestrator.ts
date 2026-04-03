/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {recommendNextStep} from '../modules/workflows/NextStepAdvisor.js';
import type {ReverseTaskStore} from './ReverseTaskStore.js';
import {autoProgressReverseTask} from './ReverseTaskAutoProgress.js';
import {getReverseTaskState} from './ReverseTaskQuery.js';
import {executeReverseTaskPlan, type ReverseTaskExecutableStep, type ReverseTaskExecutionOverride} from './ReverseTaskExecutor.js';

type OrchestrationStep = ReverseTaskExecutableStep;

function buildStepKey(tool: string, params: Record<string, unknown>): string {
  if (tool === 'manage_reverse_task') {
    return `manage_reverse_task:${String(params.action ?? 'get')}`;
  }
  return tool;
}

function buildPrimaryStep(taskId: string, nextStepHint: string, currentStage: string): OrchestrationStep {
  if (nextStepHint.startsWith('manage_reverse_task:')) {
    const action = nextStepHint.split(':')[1] ?? 'summarize';
    return {
      key: buildStepKey('manage_reverse_task', {action, taskId}),
      tool: 'manage_reverse_task',
      reason: '下一步仍属于任务编排域，继续通过统一 task 入口完成。',
      params: {action, taskId},
    };
  }

  return {
    key: buildStepKey(nextStepHint, {taskId}),
    tool: nextStepHint,
    reason: `当前阶段为 ${currentStage}，优先执行状态机推断出的下一步。`,
    params: {taskId},
  };
}

function buildManageTaskStep(taskId: string, action: 'get' | 'summarize' | 'progress' | 'timeline', currentStage: string): OrchestrationStep {
  return {
    key: buildStepKey('manage_reverse_task', {action, taskId}),
    tool: 'manage_reverse_task',
    reason: `策略要求优先执行 manage_reverse_task:${action}。`,
    params: action === 'timeline'
      ? {
        action,
        taskId,
        stage: currentStage.toLowerCase(),
        timelineAction: 'artifact-sync',
        timelineStatus: 'ok',
      }
      : {action, taskId},
  };
}

function buildStrategyPrimaryStep(
  taskId: string,
  strategy: 'observe-first' | 'rebuild-first' | 'env-fix' | 'artifact-sync' | 'evidence-only' | undefined,
  nextStepHint: string,
  currentStage: string,
): OrchestrationStep {
  if (!strategy) {
    return buildPrimaryStep(taskId, nextStepHint, currentStage);
  }
  if (strategy === 'rebuild-first') {
    return {
      key: buildStepKey('export_rebuild_bundle', {taskId}),
      tool: 'export_rebuild_bundle',
      reason: 'rebuild-first 策略优先产出本地 rebuild bundle。',
      params: {taskId},
    };
  }
  if (strategy === 'env-fix') {
    return {
      key: buildStepKey('diff_env_requirements', {taskId}),
      tool: 'diff_env_requirements',
      reason: 'env-fix 策略优先分析当前补环境缺口。',
      params: {taskId},
    };
  }
  if (strategy === 'artifact-sync') {
    return buildManageTaskStep(taskId, 'timeline', currentStage);
  }
  if (strategy === 'evidence-only') {
    return buildManageTaskStep(taskId, 'summarize', currentStage);
  }
  if (strategy === 'observe-first') {
    return buildManageTaskStep(taskId, 'get', currentStage);
  }
  return buildPrimaryStep(taskId, nextStepHint, currentStage);
}

export async function orchestrateReverseTask(
  store: ReverseTaskStore,
  taskId: string,
  options: {
    persistState?: boolean;
    includeSummary?: boolean;
    execute?: boolean;
    resume?: boolean;
    stopOnError?: boolean;
    executionOverrides?: Record<string, ReverseTaskExecutionOverride>;
    strategy?: 'observe-first' | 'rebuild-first' | 'env-fix' | 'artifact-sync' | 'evidence-only';
    skipSteps?: string[];
    fromStep?: string;
    onlySteps?: string[];
  } = {},
): Promise<{
  taskId: string;
  currentStage: string;
  status: string;
  nextStepHint: string;
  currentSummary: string;
  advice: {
    stage: string;
    confidence: number;
    nextStep: string;
    why: string;
    alternatives: string[];
    avoid: string[];
  };
  orchestration: {
    primaryStep: OrchestrationStep;
    suggestedSteps: OrchestrationStep[];
  };
  execution?: Awaited<ReturnType<typeof executeReverseTaskPlan>>;
  summary?: Awaited<ReturnType<typeof getReverseTaskState>>;
}> {
  const persistState = options.persistState ?? true;
  const progressed = persistState ? await autoProgressReverseTask(store, taskId) : undefined;
  const snapshot = await getReverseTaskState(store, taskId, {timelineLimit: 20, evidenceLimit: 20});
  const successCriteria = (snapshot.state?.successCriteria ?? snapshot.task?.successCriteria ?? {}) as Record<string, unknown>;
  const advice = recommendNextStep({
    taskId,
    currentStage: progressed?.currentStage ?? String(snapshot.state?.currentStage ?? snapshot.task?.currentStage ?? 'Observe'),
    taskStatus: progressed?.status ?? String(snapshot.state?.status ?? 'active'),
    taskGoal: String(snapshot.task?.goal ?? ''),
    hasTargetRequest: Boolean(
      snapshot.targetContext?.targetRequest ||
      snapshot.recentEvidence.some((entry) => Boolean(entry.request)),
    ),
    hookRecordCount: snapshot.recentEvidence.filter((entry) => entry.kind === 'hook-hit' || entry.source === 'hook').length,
    hasRebuildBundle:
      ['Rebuild', 'Patch', 'PureExtraction', 'Port'].includes(
        String(progressed?.currentStage ?? snapshot.state?.currentStage ?? snapshot.task?.currentStage ?? ''),
      ) ||
      ['partial', 'pass'].includes(String(successCriteria.localRebuild ?? '')),
    hasPassingRebuild: String(successCriteria.localRebuild ?? '') === 'pass',
    firstDivergenceKnown:
      snapshot.recentEvidence.some((entry) => entry.kind === 'env-gap') ||
      snapshot.recentTimeline.some((entry) => String(entry.result ?? '').toLowerCase().includes('divergence')),
  });

  const currentStage = progressed?.currentStage ?? String(snapshot.state?.currentStage ?? snapshot.task?.currentStage ?? advice.stage);
  const status = progressed?.status ?? String(snapshot.state?.status ?? 'active');
  const nextStepHint = progressed?.nextStepHint ?? advice.nextStep;
  const currentSummary = progressed?.currentSummary ??
    String(snapshot.state?.currentSummary ?? snapshot.task?.currentSummary ?? '任务已初始化，等待补充更多证据。');
  const primaryStep = buildStrategyPrimaryStep(taskId, options.strategy, nextStepHint, currentStage);
  const suggestedSteps: OrchestrationStep[] = [
    {
      key: buildStepKey('manage_reverse_task', {action: persistState ? 'progress' : 'get', taskId}),
      tool: 'manage_reverse_task',
      reason: persistState ? '先同步任务状态，避免基于旧状态继续执行。' : '先读取最新任务快照，避免误判当前阶段。',
      params: {action: persistState ? 'progress' : 'get', taskId},
    },
    primaryStep,
  ];

  if (primaryStep.tool !== 'manage_reverse_task') {
    suggestedSteps.push({
      key: buildStepKey('manage_reverse_task', {action: 'timeline', taskId}),
      tool: 'manage_reverse_task',
      reason: '执行主步骤后，建议把结论写回 task artifact，保证可续跑。',
      params: {
        action: 'timeline',
        taskId,
        stage: currentStage.toLowerCase(),
        timelineAction: primaryStep.tool,
        timelineStatus: 'ok',
      },
    });
  }

  const filteredSteps = filterPlannedSteps(suggestedSteps, {
    skipSteps: options.skipSteps,
    fromStep: options.fromStep,
    onlySteps: options.onlySteps,
  });

  const execution = options.execute
    ? await executeReverseTaskPlan(store, taskId, filteredSteps, {
      resume: options.resume,
      stopOnError: options.stopOnError,
      currentStage,
      executionOverrides: options.executionOverrides,
    })
    : undefined;
  const postExecution = options.execute ? await getReverseTaskState(store, taskId, {timelineLimit: 20, evidenceLimit: 20}) : snapshot;
  const summary = options.includeSummary === false ? undefined : postExecution;
  const filtersApplied = Boolean(
    (options.skipSteps && options.skipSteps.length > 0) ||
    options.fromStep ||
    (options.onlySteps && options.onlySteps.length > 0),
  );

  return {
    taskId,
    currentStage,
    status,
    nextStepHint,
    currentSummary,
    advice,
    orchestration: {
      primaryStep: filtersApplied ? (filteredSteps[0] ?? primaryStep) : primaryStep,
      suggestedSteps: filteredSteps,
    },
    ...(execution ? {execution} : {}),
    ...(summary ? {summary} : {}),
  };
}

function matchesStepSelector(step: OrchestrationStep, selector: string): boolean {
  return step.key === selector || step.tool === selector;
}

function ensureStepExists(steps: OrchestrationStep[], selector: string, optionName: string): void {
  if (!steps.some((step) => matchesStepSelector(step, selector))) {
    throw new Error(`${optionName} references unknown step: ${selector}`);
  }
}

function filterPlannedSteps(
  steps: OrchestrationStep[],
  options: {
    skipSteps?: string[];
    fromStep?: string;
    onlySteps?: string[];
  },
): OrchestrationStep[] {
  let filtered = [...steps];
  const onlySteps = options.onlySteps ?? [];
  const skipSteps = options.skipSteps ?? [];

  for (const selector of onlySteps) {
    ensureStepExists(steps, selector, 'onlySteps');
  }
  for (const selector of skipSteps) {
    ensureStepExists(steps, selector, 'skipSteps');
  }
  if (options.fromStep) {
    ensureStepExists(steps, options.fromStep, 'fromStep');
  }

  if (onlySteps.length > 0) {
    filtered = filtered.filter((step) => onlySteps.some((selector) => matchesStepSelector(step, selector)));
  }

  if (options.fromStep) {
    const startIndex = filtered.findIndex((step) => matchesStepSelector(step, options.fromStep!));
    if (startIndex < 0) {
      throw new Error(`fromStep references a step excluded by onlySteps: ${options.fromStep}`);
    }
    filtered = filtered.slice(startIndex);
  }

  if (skipSteps.length > 0) {
    filtered = filtered.filter((step) => !skipSteps.some((selector) => matchesStepSelector(step, selector)));
  }

  if (filtered.length === 0) {
    throw new Error('Step filters removed every planned step; adjust onlySteps/fromStep/skipSteps.');
  }

  return filtered;
}
