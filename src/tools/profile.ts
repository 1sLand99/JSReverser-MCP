/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ToolDefinition} from './ToolDefinition.js';

export type ToolProfile = 'compact' | 'full';

export const COMPACT_TOOL_NAMES = new Set([
  'check_browser_health',
  'collect_code',
  'console_message',
  'create_hook',
  'create_reverse_task_from_request',
  'diagnose_environment',
  'diff_env_requirements',
  'evaluate_script',
  'explain_reverse_stage',
  'export_portable_bundle',
  'export_rebuild_bundle',
  'extract_function_tree',
  'get_hook_data',
  'get_parameter_workflow',
  'get_rebuild_health_report',
  'get_reference',
  'get_reference_route',
  'inject_hook',
  'list_pages',
  'list_parameter_workflows',
  'locate_signature_function',
  'manage_reverse_task',
  'navigate_page',
  'network_request',
  'new_page',
  'orchestrate_reverse_task',
  'recommend_next_step',
  'recommend_parameter_workflow',
  'record_reverse_evidence',
  'remove_hook',
  'run_reverse_agent',
  'search_in_scripts',
  'search_in_sources',
  'select_page',
  'session_state',
  'start_reverse_task',
  'take_screenshot',
  'understand_code',
]);

export function selectToolsForProfile(
  tools: ToolDefinition[],
  profile: ToolProfile = 'compact',
): ToolDefinition[] {
  if (profile === 'full') {
    return tools;
  }

  return tools.filter(tool => COMPACT_TOOL_NAMES.has(tool.name));
}
