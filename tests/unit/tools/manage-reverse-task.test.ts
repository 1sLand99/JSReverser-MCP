/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {describe, it} from 'node:test';

import {ReverseTaskStore} from '../../../src/reverse/ReverseTaskStore.js';
import {getJSHookRuntime} from '../../../src/tools/runtime.js';
import {manageReverseTaskTool} from '../../../src/tools/task-manager.js';
import {startReverseTaskTool} from '../../../src/tools/task.js';

function makeResponse() {
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

describe('manage_reverse_task tool', () => {
  it('supports list/get/summarize/progress/update/timeline actions', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'jsreverser-manage-task-tool-'));
    const runtime = getJSHookRuntime();
    const originalStore = runtime.reverseTaskStore;
    runtime.reverseTaskStore = new ReverseTaskStore({rootDir});
    try {
      await startReverseTaskTool.handler({
        params: {
          taskId: 'task-manage-001',
          taskSlug: 'manage-demo',
          targetUrl: 'https://example.com/api/sign',
          goal: 'manage task tool',
          targetContext: {
            targetRequest: {
              method: 'POST',
              url: 'https://example.com/api/sign',
            },
          },
        },
      }, makeResponse() as unknown as Parameters<typeof startReverseTaskTool.handler>[1], {} as Parameters<typeof startReverseTaskTool.handler>[2]);

      const opened = await runtime.reverseTaskStore.openTask({
        taskId: 'task-manage-001',
        slug: 'manage-demo',
        targetUrl: 'https://example.com/api/sign',
        goal: 'manage task tool',
      });
      await opened.appendLog('runtime-evidence', {source: 'hook', kind: 'hook-hit', note: 'aggregate path'});

      const listResponse = makeResponse();
      await manageReverseTaskTool.handler({
        params: {action: 'list'},
      }, listResponse as unknown as Parameters<typeof manageReverseTaskTool.handler>[1], {} as Parameters<typeof manageReverseTaskTool.handler>[2]);
      const listPayload = JSON.parse(listResponse.lines[1] ?? '{}') as {action: string; items: Array<{taskId: string}>};
      assert.strictEqual(listPayload.action, 'list');
      assert.strictEqual(listPayload.items[0]?.taskId, 'task-manage-001');

      const getResponse = makeResponse();
      await manageReverseTaskTool.handler({
        params: {action: 'get', taskId: 'task-manage-001'},
      }, getResponse as unknown as Parameters<typeof manageReverseTaskTool.handler>[1], {} as Parameters<typeof manageReverseTaskTool.handler>[2]);
      const getPayload = JSON.parse(getResponse.lines[1] ?? '{}') as {action: string; taskId: string};
      assert.strictEqual(getPayload.action, 'get');
      assert.strictEqual(getPayload.taskId, 'task-manage-001');

      const progressResponse = makeResponse();
      await manageReverseTaskTool.handler({
        params: {action: 'progress', taskId: 'task-manage-001'},
      }, progressResponse as unknown as Parameters<typeof manageReverseTaskTool.handler>[1], {} as Parameters<typeof manageReverseTaskTool.handler>[2]);
      const progressPayload = JSON.parse(progressResponse.lines[1] ?? '{}') as {action: string; currentStage: string};
      assert.strictEqual(progressPayload.action, 'progress');
      assert.strictEqual(progressPayload.currentStage, 'Rebuild');

      const updateResponse = makeResponse();
      await manageReverseTaskTool.handler({
        params: {
          action: 'update',
          taskId: 'task-manage-001',
          currentStage: 'Patch',
          status: 'partial',
          currentSummary: '已开始补环境',
        },
      }, updateResponse as unknown as Parameters<typeof manageReverseTaskTool.handler>[1], {} as Parameters<typeof manageReverseTaskTool.handler>[2]);
      const updatePayload = JSON.parse(updateResponse.lines[1] ?? '{}') as {ok: boolean; action: string};
      assert.strictEqual(updatePayload.ok, true);
      assert.strictEqual(updatePayload.action, 'update');

      const timelineResponse = makeResponse();
      await manageReverseTaskTool.handler({
        params: {
          action: 'timeline',
          taskId: 'task-manage-001',
          stage: 'patch',
          timelineAction: 'diff env',
          timelineStatus: 'ok',
          result: 'found first divergence',
        },
      }, timelineResponse as unknown as Parameters<typeof manageReverseTaskTool.handler>[1], {} as Parameters<typeof manageReverseTaskTool.handler>[2]);
      const timelinePayload = JSON.parse(timelineResponse.lines[1] ?? '{}') as {ok: boolean; action: string};
      assert.strictEqual(timelinePayload.ok, true);
      assert.strictEqual(timelinePayload.action, 'timeline');

      const summarizeResponse = makeResponse();
      await manageReverseTaskTool.handler({
        params: {action: 'summarize', taskId: 'task-manage-001'},
      }, summarizeResponse as unknown as Parameters<typeof manageReverseTaskTool.handler>[1], {} as Parameters<typeof manageReverseTaskTool.handler>[2]);
      const summarizePayload = JSON.parse(summarizeResponse.lines[1] ?? '{}') as {action: string; taskId: string; reasoning: string[]};
      assert.strictEqual(summarizePayload.action, 'summarize');
      assert.strictEqual(summarizePayload.taskId, 'task-manage-001');

      const state = JSON.parse(await readFile(path.join(rootDir, 'task-manage-001', 'state.json'), 'utf8')) as Record<string, unknown>;
      assert.strictEqual(state.currentStage, 'Patch');
    } finally {
      runtime.reverseTaskStore = originalStore;
      await rm(rootDir, {recursive: true, force: true});
    }
  });
});
