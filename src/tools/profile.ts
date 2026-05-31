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
  'emulate_device',
  'evaluate_script',
  'explain_reverse_stage',
  'export_portable_bundle',
  'export_rebuild_bundle',
  'extract_function_tree',
  'get_all_links',
  'get_hook_data',
  'get_parameter_workflow',
  'get_rebuild_health_report',
  'get_reference',
  'get_reference_route',
  'hover_element',
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
  'press_key',
  'run_reverse_agent',
  'search_in_scripts',
  'search_in_sources',
  'select_page',
  'select_option',
  'session_state',
  'set_viewport',
  'scroll_page',
  'start_reverse_task',
  'take_screenshot',
  'understand_code',
  'upload_file',
  'wait_for_network_idle',
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

export function describeToolProfileSelection(
  tools: ToolDefinition[],
  profile: ToolProfile = 'compact',
): {
  profile: ToolProfile;
  selectedToolNames: string[];
  hiddenToolNames: string[];
  hint: string;
} {
  const selected = selectToolsForProfile(tools, profile).map(tool => tool.name);
  const selectedSet = new Set(selected);
  const hidden =
    profile === 'full'
      ? []
      : tools
          .map(tool => tool.name)
          .filter(name => !selectedSet.has(name))
          .sort();

  return {
    profile,
    selectedToolNames: selected,
    hiddenToolNames: hidden,
    hint:
      hidden.length > 0
        ? `Compact profile hid ${hidden.length} tools. Restart with --toolProfile full or set toolProfile=full when you need low-level debugging controls.`
        : 'All registered tools are available in this profile.',
  };
}
