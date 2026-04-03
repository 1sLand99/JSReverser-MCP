import {startReverseTask} from '../reverse/ReverseTaskBootstrap.js';
import {zod} from '../third_party/index.js';

import {ToolCategory} from './categories.js';
import {defineTool} from './ToolDefinition.js';
import {getJSHookRuntime} from './runtime.js';

export const startReverseTaskTool = defineTool({
  name: 'start_reverse_task',
  description: 'Initialize a task artifact directory with task.json, state.json, report.md, and first timeline entry.',
  annotations: {category: ToolCategory.REVERSE_ENGINEERING, readOnlyHint: false},
  schema: {
    taskId: zod.string().min(1),
    taskSlug: zod.string().min(1),
    targetUrl: zod.string().min(1),
    goal: zod.string().min(1),
    currentStage: zod.enum(['Observe', 'Capture', 'Rebuild', 'Patch', 'DeepDive', 'PureExtraction', 'Port']).optional(),
    currentSummary: zod.string().optional(),
    successCriteria: zod.object({
      localRebuild: zod.enum(['pass', 'partial', 'unknown']).optional(),
      serverAcceptance: zod.enum(['pass', 'partial', 'unknown']).optional(),
      browserAlignment: zod.enum(['pass', 'partial', 'unknown']).optional(),
      notes: zod.string().optional(),
    }).optional(),
    targetContext: zod.object({
      pageUrl: zod.string().optional(),
      triggerAction: zod.string().optional(),
      candidateScripts: zod.array(zod.string()).optional(),
      targetRequest: zod.object({
        method: zod.string().optional(),
        url: zod.string().optional(),
        notes: zod.string().optional(),
      }).optional(),
    }).optional(),
  },
  handler: async (request, response) => {
    const runtime = getJSHookRuntime();
    const result = await startReverseTask(runtime.reverseTaskStore, request.params);
    response.appendResponseLine('```json');
    response.appendResponseLine(JSON.stringify({
      ok: true,
      ...result,
      nextRecommendedTools: ['manage_reverse_task', 'recommend_next_step', 'check_browser_health', 'record_reverse_evidence'],
    }, null, 2));
    response.appendResponseLine('```');
  },
});
