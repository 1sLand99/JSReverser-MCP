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
import {listReverseTasks} from '../../../src/reverse/ReverseTaskList.js';
import {ReverseTaskStore} from '../../../src/reverse/ReverseTaskStore.js';

describe('ReverseTaskList', () => {
  it('lists reverse tasks sorted by updatedAt desc', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'jsreverser-task-list-'));
    try {
      const store = new ReverseTaskStore({rootDir});
      await startReverseTask(store, {
        taskId: 'task-list-001',
        taskSlug: 'first',
        targetUrl: 'https://example.com/1',
        goal: 'first task',
      });
      await startReverseTask(store, {
        taskId: 'task-list-002',
        taskSlug: 'second',
        targetUrl: 'https://example.com/2',
        goal: 'second task',
      });

      const items = await listReverseTasks(store);
      assert.strictEqual(items.length, 2);
      assert.strictEqual(items[0]?.taskId, 'task-list-002');
      assert.strictEqual(items[1]?.taskId, 'task-list-001');
    } finally {
      await rm(rootDir, {recursive: true, force: true});
    }
  });
});
