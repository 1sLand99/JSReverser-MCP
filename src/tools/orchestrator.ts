import {orchestrateReverseTask} from '../reverse/ReverseTaskOrchestrator.js';
import {zod} from '../third_party/index.js';

import {ToolCategory} from './categories.js';
import {defineTool} from './ToolDefinition.js';
import {getJSHookRuntime} from './runtime.js';

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
      skipSteps: request.params.skipSteps,
      fromStep: request.params.fromStep,
      onlySteps: request.params.onlySteps,
      executionOverrides: request.params.executionOverrides,
    });
    response.appendResponseLine('```json');
    response.appendResponseLine(JSON.stringify({ok: true, ...result}, null, 2));
    response.appendResponseLine('```');
  },
});
