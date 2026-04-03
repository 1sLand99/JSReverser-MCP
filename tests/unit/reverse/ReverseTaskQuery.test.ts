/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {describe, it} from 'node:test';

import {startReverseTask} from '../../../src/reverse/ReverseTaskBootstrap.js';
import {getReverseTaskState} from '../../../src/reverse/ReverseTaskQuery.js';
import {ReverseTaskStore} from '../../../src/reverse/ReverseTaskStore.js';

describe('ReverseTaskQuery', () => {
  it('returns task state with recent timeline and evidence', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'jsreverser-task-query-'));
    try {
      const store = new ReverseTaskStore({rootDir});
      const task = await startReverseTask(store, {
        taskId: 'task-query-001',
        taskSlug: 'query-demo',
        targetUrl: 'https://example.com/api/sign',
        goal: 'query task state',
      });
      const opened = await store.openTask({
        taskId: 'task-query-001',
        slug: 'query-demo',
        targetUrl: 'https://example.com/api/sign',
        goal: 'query task state',
      });
      await opened.appendLog('runtime-evidence', {source: 'hook', kind: 'hook-hit'});

      const result = await getReverseTaskState(store, 'task-query-001', {timelineLimit: 5, evidenceLimit: 5});
      assert.strictEqual(result.taskId, 'task-query-001');
      assert.ok(result.state);
      assert.ok(result.recentTimeline.length >= 1);
      assert.strictEqual(result.recentEvidence[0]?.source, 'hook');
      void task;
    } finally {
      await rm(rootDir, {recursive: true, force: true});
    }
  });
});
