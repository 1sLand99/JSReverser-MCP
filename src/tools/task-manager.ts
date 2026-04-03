import {listReverseTasks} from '../reverse/ReverseTaskList.js';
import {archiveReverseTask, pruneReverseTasks, restoreReverseTask, searchReverseTasks, tagReverseTask} from '../reverse/ReverseTaskAdmin.js';
import {buildManageTaskAgentHints} from '../reverse/ReverseTaskAgentProtocol.js';
import {validateReverseTaskActionInput} from '../reverse/ReverseTaskActionValidation.js';
import {autoProgressReverseTask} from '../reverse/ReverseTaskAutoProgress.js';
import {compareReverseTasks} from '../reverse/ReverseTaskCompare.js';
import {getReverseTaskState} from '../reverse/ReverseTaskQuery.js';
import {summarizeReverseTask} from '../reverse/ReverseTaskSummary.js';
import {appendReverseTimeline} from '../reverse/ReverseTaskTimeline.js';
import {updateReverseTaskState} from '../reverse/ReverseTaskState.js';
import {zod} from '../third_party/index.js';

import {ToolCategory} from './categories.js';
import {defineTool} from './ToolDefinition.js';
import {getJSHookRuntime} from './runtime.js';

const stageSchema = zod.enum(['Observe', 'Capture', 'Rebuild', 'Patch', 'DeepDive', 'PureExtraction', 'Port']);
type OutputMode = 'compact' | 'verbose';
type AgentOutcome = 'success' | 'partial' | 'blocked';
const taskArtifacts = ['task.json', 'state.json', 'report.md', 'timeline.jsonl', 'runtime-evidence.jsonl'];

function compactManagePayload(
  action: string,
  payload: Record<string, unknown>,
  outputMode: OutputMode,
): Record<string, unknown> {
  if (outputMode !== 'compact') {
    return payload;
  }
  if (action === 'get') {
    const {recentTimeline: _recentTimeline, recentEvidence: _recentEvidence, targetContext: _targetContext, ...rest} = payload;
    return rest;
  }
  if (action === 'summarize') {
    const {recentTimeline: _recentTimeline, recentEvidence: _recentEvidence, reasoning: _reasoning, signals: _signals, ...rest} = payload;
    return rest;
  }
  return payload;
}

function buildManageDiagnostics(action: string, outputMode: OutputMode, taskId?: string): Record<string, unknown> {
  return {
    responseStatus: 'ok',
    action,
    outputMode,
    ...(taskId ? {taskId} : {}),
  };
}

function buildManageSummary(action: string, payload: Record<string, unknown>): string {
  if (action === 'list') {
    return `已返回 ${(payload.items as unknown[] | undefined)?.length ?? 0} 个 reverse task。`;
  }
  if (action === 'search') {
    return `已返回 ${(payload.items as unknown[] | undefined)?.length ?? 0} 个搜索命中。`;
  }
  if (action === 'get' || action === 'summarize') {
    return `已返回任务 ${String(payload.taskId ?? '')} 的 ${action === 'get' ? '快照' : '摘要'}。`;
  }
  if (action === 'compare') {
    return `已完成任务 ${String(payload.leftTaskId ?? '')} 与 ${String(payload.rightTaskId ?? '')} 的对比。`;
  }
  return `已完成 ${action} 动作。`;
}

function inferOutcomeFromStatus(status: unknown): AgentOutcome {
  if (status === 'blocked') {
    return 'blocked';
  }
  if (status === 'partial') {
    return 'partial';
  }
  return 'success';
}

function buildManageContinuationFields(
  action: string,
  payload: Record<string, unknown>,
): {
  outcome: AgentOutcome;
  shouldResume: boolean;
  shouldSwitchStrategy: boolean;
  nextBestTool?: string;
  nextBestParams?: Record<string, unknown>;
} {
  const hints = payload.agentGuidance as
    | {recommendedTool?: string; recommendedParams?: Record<string, unknown>; recommendedStrategy?: string}
    | undefined;
  const status = payload.status
    ?? (payload.state && typeof payload.state === 'object' ? (payload.state as Record<string, unknown>).status : undefined);
  const outcome = action === 'get' || action === 'summarize' || action === 'progress' || action === 'update'
    ? inferOutcomeFromStatus(status)
    : 'success';
  return {
    outcome,
    shouldResume: Boolean(action === 'progress' && outcome !== 'blocked' && hints?.recommendedTool),
    shouldSwitchStrategy: ['rebuild-first', 'env-fix', 'artifact-sync', 'evidence-only'].includes(String(hints?.recommendedStrategy ?? '')),
    ...(hints?.recommendedTool ? {nextBestTool: hints.recommendedTool} : {}),
    ...(hints?.recommendedParams ? {nextBestParams: hints.recommendedParams} : {}),
  };
}

export const manageReverseTaskTool = defineTool({
  name: 'manage_reverse_task',
  description: 'Unified reverse task entry for list/get/summarize/progress/update/timeline/archive/restore/search/tag/prune/compare actions. Preferred task-management entry to reduce tool-selection overhead.',
  annotations: {category: ToolCategory.REVERSE_ENGINEERING, readOnlyHint: false},
  schema: {
    action: zod.enum(['list', 'get', 'summarize', 'progress', 'update', 'timeline', 'archive', 'restore', 'search', 'tag', 'prune', 'compare']),
    taskId: zod.string().min(1).optional(),
    otherTaskId: zod.string().min(1).optional(),
    outputMode: zod.enum(['compact', 'verbose']).optional(),
    limit: zod.number().int().positive().optional(),
    timelineLimit: zod.number().int().positive().optional(),
    evidenceLimit: zod.number().int().positive().optional(),
    includeArchived: zod.boolean().optional(),
    query: zod.string().optional(),
    tag: zod.string().optional(),
    tags: zod.array(zod.string()).optional(),
    replaceTags: zod.boolean().optional(),
    pruneOlderThanDays: zod.number().int().positive().optional(),
    taskSlug: zod.string().optional(),
    targetUrl: zod.string().optional(),
    goal: zod.string().optional(),
    currentStage: stageSchema.optional(),
    status: zod.enum(['active', 'blocked', 'partial', 'pass']).optional(),
    currentSummary: zod.string().optional(),
    nextStepHint: zod.string().optional(),
    successCriteria: zod.object({
      localRebuild: zod.enum(['pass', 'partial', 'unknown']).optional(),
      serverAcceptance: zod.enum(['pass', 'partial', 'unknown']).optional(),
      browserAlignment: zod.enum(['pass', 'partial', 'unknown']).optional(),
      notes: zod.string().optional(),
    }).optional(),
    stage: zod.string().min(1).optional(),
    timelineAction: zod.string().min(1).optional(),
    timelineStatus: zod.string().min(1).optional(),
    result: zod.string().optional(),
    next: zod.string().optional(),
    detail: zod.record(zod.string(), zod.unknown()).optional(),
  },
  handler: async (request, response) => {
    const runtime = getJSHookRuntime();
    const {action} = request.params;
    const outputMode = request.params.outputMode ?? 'verbose';
    const requireTaskId = (): string => {
      if (!request.params.taskId) {
        throw new Error(`taskId is required when action="${action}"`);
      }
      return request.params.taskId;
    };
    const requireTimelineField = (
      value: string | undefined,
      fieldName: 'stage' | 'timelineAction' | 'timelineStatus',
    ): string => {
      if (!value) {
        throw new Error(`${fieldName} is required when action="timeline"`);
      }
      return value;
    };
    const writeJson = (payload: Record<string, unknown>) => {
      response.appendResponseLine('```json');
      response.appendResponseLine(JSON.stringify(compactManagePayload(action, {
        responseSummary: buildManageSummary(action, payload),
        diagnostics: buildManageDiagnostics(action, outputMode, typeof payload.taskId === 'string' ? payload.taskId : undefined),
        ...buildManageContinuationFields(action, payload),
        ...payload,
        outputMode,
      }, outputMode), null, 2));
      response.appendResponseLine('```');
    };

    validateReverseTaskActionInput({
      action,
      taskId: request.params.taskId,
      otherTaskId: request.params.otherTaskId,
      query: request.params.query,
      tag: request.params.tag,
      tags: request.params.tags,
      stage: request.params.stage,
      timelineAction: request.params.timelineAction,
      timelineStatus: request.params.timelineStatus,
      taskSlug: request.params.taskSlug,
      targetUrl: request.params.targetUrl,
      goal: request.params.goal,
      currentStage: request.params.currentStage,
      status: request.params.status,
      currentSummary: request.params.currentSummary,
      nextStepHint: request.params.nextStepHint,
      successCriteria: request.params.successCriteria,
    });

    if (action === 'list') {
      const items = await listReverseTasks(runtime.reverseTaskStore, {
        limit: request.params.limit,
        includeArchived: request.params.includeArchived,
      });
      writeJson({
        action,
        items,
        artifacts: ['artifacts/tasks/<taskId>/'],
        agentGuidance: buildManageTaskAgentHints({action, itemCount: items.length}),
      });
      return;
    }

    if (action === 'get') {
      const result = await getReverseTaskState(runtime.reverseTaskStore, requireTaskId(), {
        timelineLimit: request.params.timelineLimit,
        evidenceLimit: request.params.evidenceLimit,
      });
      writeJson({
        action,
        ...result,
        artifacts: taskArtifacts,
        agentGuidance: buildManageTaskAgentHints({
          action,
          taskId: result.taskId,
          nextStepHint: String((result.state?.nextStepHint ?? 'manage_reverse_task:progress')),
        }),
      });
      return;
    }

    if (action === 'summarize') {
      const result = await summarizeReverseTask(runtime.reverseTaskStore, requireTaskId(), {
        timelineLimit: request.params.timelineLimit,
        evidenceLimit: request.params.evidenceLimit,
      });
      writeJson({
        action,
        ...result,
        artifacts: taskArtifacts,
        agentGuidance: buildManageTaskAgentHints({
          action,
          taskId: result.taskId,
          nextStepHint: result.nextStepHint,
          currentStage: result.currentStage,
          status: result.status,
        }),
      });
      return;
    }

    if (action === 'progress') {
      const result = await autoProgressReverseTask(runtime.reverseTaskStore, requireTaskId());
      writeJson({
        ok: true,
        action,
        ...result,
        artifacts: ['state.json', 'report.md'],
        agentGuidance: buildManageTaskAgentHints({
          action,
          taskId: result.taskId,
          nextStepHint: result.nextStepHint,
          currentStage: result.currentStage,
          status: result.status,
        }),
      });
      return;
    }

    if (action === 'archive') {
      const result = await archiveReverseTask(runtime.reverseTaskStore, requireTaskId());
      writeJson({ok: true, action, ...result, artifacts: ['task.json'], agentGuidance: buildManageTaskAgentHints({action, taskId: result.taskId})});
      return;
    }

    if (action === 'restore') {
      const result = await restoreReverseTask(runtime.reverseTaskStore, requireTaskId());
      writeJson({ok: true, action, ...result, artifacts: ['task.json'], agentGuidance: buildManageTaskAgentHints({action, taskId: result.taskId})});
      return;
    }

    if (action === 'search') {
      const items = await searchReverseTasks(runtime.reverseTaskStore, {
        query: request.params.query,
        tag: request.params.tag,
        includeArchived: request.params.includeArchived,
        limit: request.params.limit,
      });
      writeJson({
        ok: true,
        action,
        items,
        artifacts: ['task.json'],
        agentGuidance: buildManageTaskAgentHints({action, itemCount: items.length}),
      });
      return;
    }

    if (action === 'tag') {
      const result = await tagReverseTask(
        runtime.reverseTaskStore,
        requireTaskId(),
        request.params.tags ?? [],
        {replace: request.params.replaceTags},
      );
      writeJson({ok: true, action, ...result, artifacts: ['task.json'], agentGuidance: buildManageTaskAgentHints({action, taskId: result.taskId})});
      return;
    }

    if (action === 'prune') {
      const result = await pruneReverseTasks(runtime.reverseTaskStore, {
        olderThanDays: request.params.pruneOlderThanDays,
      });
      writeJson({ok: true, action, ...result, artifacts: ['artifacts/tasks/<archived-task-id>/'], agentGuidance: buildManageTaskAgentHints({action})});
      return;
    }

    if (action === 'compare') {
      const result = await compareReverseTasks(runtime.reverseTaskStore, requireTaskId(), request.params.otherTaskId!);
      writeJson({
        ok: true,
        action,
        ...result,
        artifacts: taskArtifacts,
        agentGuidance: buildManageTaskAgentHints({
          action,
          taskId: result.leftTaskId,
          otherTaskId: result.rightTaskId,
        }),
      });
      return;
    }

    if (action === 'update') {
      const result = await updateReverseTaskState(runtime.reverseTaskStore, {
        taskId: requireTaskId(),
        taskSlug: request.params.taskSlug,
        targetUrl: request.params.targetUrl,
        goal: request.params.goal,
        currentStage: request.params.currentStage,
        status: request.params.status,
        currentSummary: request.params.currentSummary,
        nextStepHint: request.params.nextStepHint,
        successCriteria: request.params.successCriteria,
      });
      writeJson({ok: true, action, ...result, artifacts: ['state.json', 'report.md'], agentGuidance: buildManageTaskAgentHints({action, taskId: result.taskId})});
      return;
    }

    if (action === 'timeline') {
      const result = await appendReverseTimeline(runtime.reverseTaskStore, {
        taskId: requireTaskId(),
        taskSlug: request.params.taskSlug,
        targetUrl: request.params.targetUrl,
        goal: request.params.goal,
        stage: requireTimelineField(request.params.stage, 'stage'),
        action: requireTimelineField(request.params.timelineAction, 'timelineAction'),
        status: requireTimelineField(request.params.timelineStatus, 'timelineStatus'),
        result: request.params.result,
        next: request.params.next,
        detail: request.params.detail,
      });
      writeJson({ok: true, action, ...result, artifacts: ['timeline.jsonl', 'report.md'], agentGuidance: buildManageTaskAgentHints({action, taskId: result.taskId})});
    }
  },
});
