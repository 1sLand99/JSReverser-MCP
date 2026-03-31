/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {describe, it} from 'node:test';

const repoRoot = process.cwd();

async function readJson<T>(relativePath: string): Promise<T> {
  const content = await readFile(path.join(repoRoot, relativePath), 'utf8');
  return JSON.parse(content) as T;
}

describe('parameter workflow knowledge base docs', () => {
  it('defines the workflow library index and starter workflows', async () => {
    const index = await readJson<{
      schemaVersion: string;
      libraryVersion: string;
      workflows: Array<{id: string; path: string}>;
    }>('docs/knowledge/parameter-workflows/index.json');

    assert.strictEqual(index.schemaVersion, '1.0');
    assert.ok(index.libraryVersion);

    const workflowIds = index.workflows.map((item) => item.id).sort();
    assert.deepStrictEqual(workflowIds, [
      'douyin-a-bogus',
      'generic-header-sign',
      'generic-query-token',
      'jd-h5st',
      'ks-hxfalcon',
    ]);

    for (const item of index.workflows) {
      const metadata = await readJson<{
        id: string;
        title: string;
        aliases: string[];
        category: string;
        status: string;
        version: string;
        lastUpdated: string;
        summary: string;
      }>(`docs/knowledge/parameter-workflows/${item.path}/metadata.json`);
      const workflow = await readFile(
        path.join(repoRoot, `docs/knowledge/parameter-workflows/${item.path}/workflow.md`),
        'utf8',
      );

      assert.strictEqual(metadata.id, item.id);
      assert.ok(metadata.title);
      assert.ok(Array.isArray(metadata.aliases));
      assert.ok(metadata.category);
      assert.ok(metadata.status);
      assert.ok(metadata.version);
      assert.ok(metadata.lastUpdated);
      assert.ok(metadata.summary);
      assert.ok(workflow.includes('## 适用范围'));
      assert.ok(workflow.includes('## 成功判定'));
      assert.ok(workflow.includes('## 禁止事项'));
    }
  });
});
