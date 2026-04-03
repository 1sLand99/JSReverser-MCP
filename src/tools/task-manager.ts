import {listReverseTasks} from '../reverse/ReverseTaskList.js';
import {autoProgressReverseTask} from '../reverse/ReverseTaskAutoProgress.js';
import {getReverseTaskState} from '../reverse/ReverseTaskQuery.js';
import {summarizeReverseTask} from '../reverse/ReverseTaskSummary.js';
import {appendReverseTimeline} from '../reverse/ReverseTaskTimeline.js';
import {updateReverseTaskState} from '../reverse/ReverseTaskState.js';
import {zod} from '../third_party/index.js';

import {ToolCategory} from './categories.js';
import {defineTool} from './ToolDefinition.js';
import {getJSHookRuntime} from './runtime.js';

const stageSchema = zod.enum(['Observe', 'Capture', 'Rebuild', 'Patch', 'DeepDive', 'PureExtraction', 'Port']);

export const manageReverseTaskTool = defineTool({
  name: 'manage_reverse_task',
  description: 'Unified reverse task entry for list/get/summarize/progress/update/timeline actions. Preferred task-management entry to reduce tool-selection overhead.',
  annotations: {category: ToolCategory.REVERSE_ENGINEERING, readOnlyHint: false},
  schema: {
    action: zod.enum(['list', 'get', 'summarize', 'progress', 'update', 'timeline']),
    taskId: zod.string().min(1).optional(),
    limit: zod.number().int().positive().optional(),
    timelineLimit: zod.number().int().positive().optional(),
    evidenceLimit: zod.number().int().positive().optional(),
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

    if (action === 'list') {
      const items = await listReverseTasks(runtime.reverseTaskStore, {
        limit: request.params.limit,
      });
      response.appendResponseLine('```json');
      response.appendResponseLine(JSON.stringify({action, items}, null, 2));
      response.appendResponseLine('```');
      return;
    }

    if (!request.params.taskId) {
      throw new Error(`taskId is required when action="${action}"`);
    }

    if (action === 'get') {
      const result = await getReverseTaskState(runtime.reverseTaskStore, request.params.taskId, {
        timelineLimit: request.params.timelineLimit,
        evidenceLimit: request.params.evidenceLimit,
      });
      response.appendResponseLine('```json');
      response.appendResponseLine(JSON.stringify({action, ...result}, null, 2));
      response.appendResponseLine('```');
      return;
    }

    if (action === 'summarize') {
      const result = await summarizeReverseTask(runtime.reverseTaskStore, request.params.taskId, {
        timelineLimit: request.params.timelineLimit,
        evidenceLimit: request.params.evidenceLimit,
      });
      response.appendResponseLine('```json');
      response.appendResponseLine(JSON.stringify({action, ...result}, null, 2));
      response.appendResponseLine('```');
      return;
    }

    if (action === 'progress') {
      const result = await autoProgressReverseTask(runtime.reverseTaskStore, request.params.taskId);
      response.appendResponseLine('```json');
      response.appendResponseLine(JSON.stringify({ok: true, action, ...result}, null, 2));
      response.appendResponseLine('```');
      return;
    }

    if (action === 'update') {
      const result = await updateReverseTaskState(runtime.reverseTaskStore, {
        taskId: request.params.taskId,
        taskSlug: request.params.taskSlug,
        targetUrl: request.params.targetUrl,
        goal: request.params.goal,
        currentStage: request.params.currentStage,
        status: request.params.status,
        currentSummary: request.params.currentSummary,
        nextStepHint: request.params.nextStepHint,
        successCriteria: request.params.successCriteria,
      });
      response.appendResponseLine('```json');
      response.appendResponseLine(JSON.stringify({ok: true, action, ...result}, null, 2));
      response.appendResponseLine('```');
      return;
    }

    if (action === 'timeline') {
      if (!request.params.stage || !request.params.timelineAction || !request.params.timelineStatus) {
        throw new Error('stage, timelineAction, and timelineStatus are required when action="timeline"');
      }
      const result = await appendReverseTimeline(runtime.reverseTaskStore, {
        taskId: request.params.taskId,
        taskSlug: request.params.taskSlug,
        targetUrl: request.params.targetUrl,
        goal: request.params.goal,
        stage: request.params.stage,
        action: request.params.timelineAction,
        status: request.params.timelineStatus,
        result: request.params.result,
        next: request.params.next,
        detail: request.params.detail,
      });
      response.appendResponseLine('```json');
      response.appendResponseLine(JSON.stringify({ok: true, action, ...result}, null, 2));
      response.appendResponseLine('```');
    }
  },
});
