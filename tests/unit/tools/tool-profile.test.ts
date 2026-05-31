/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import {describe, it} from 'node:test';

import {ToolCategory} from '../../../src/tools/categories.js';
import {
  COMPACT_TOOL_NAMES,
  selectToolsForProfile,
} from '../../../src/tools/profile.js';
import type {ToolDefinition} from '../../../src/tools/ToolDefinition.js';

function tool(name: string): ToolDefinition {
  return {
    name,
    description: name,
    annotations: {
      category: ToolCategory.REVERSE_ENGINEERING,
      readOnlyHint: true,
    },
    schema: {},
    handler: async () => undefined,
  };
}

describe('tool profile selection', () => {
  it('keeps full profile unchanged', () => {
    const tools = [tool('evaluate_script'), tool('step_over')];
    assert.deepStrictEqual(selectToolsForProfile(tools, 'full'), tools);
  });

  it('exposes only compact workflow tools by default', () => {
    const tools = [
      tool('run_reverse_agent'),
      tool('orchestrate_reverse_task'),
      tool('network_request'),
      tool('step_over'),
      tool('pause'),
    ];

    assert.deepStrictEqual(
      selectToolsForProfile(tools).map(selected => selected.name),
      ['run_reverse_agent', 'orchestrate_reverse_task', 'network_request'],
    );
  });

  it('compact profile includes the high-level reverse workflow entry points', () => {
    for (const name of [
      'diagnose_environment',
      'start_reverse_task',
      'manage_reverse_task',
      'orchestrate_reverse_task',
      'run_reverse_agent',
      'get_reference_route',
      'export_portable_bundle',
    ]) {
      assert.ok(COMPACT_TOOL_NAMES.has(name), `${name} should be compact`);
    }
  });

  it('compact profile intentionally omits token-heavy step debugging controls', () => {
    for (const name of ['pause', 'step_over', 'step_into', 'step_out']) {
      assert.strictEqual(COMPACT_TOOL_NAMES.has(name), false);
    }
  });
});
