/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {CallToolResult} from '../third_party/index.js';

export function withOptionalTraceIdContent(
  content: CallToolResult['content'],
  traceId: string,
  mode: string | undefined,
): CallToolResult['content'] {
  if (mode !== 'all') {
    return content;
  }

  return [
    {
      type: 'text',
      text: JSON.stringify({traceId}, null, 2),
    },
    ...content,
  ];
}
