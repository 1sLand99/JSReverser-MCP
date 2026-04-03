/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ReverseTaskState} from '../types/index.js';
import type {ReverseTaskStore} from './ReverseTaskStore.js';
import {buildReverseTaskEvidenceIndex, type ReverseTaskEvidenceAggregates} from './ReverseTaskEvidenceIndex.js';

function isNonEmptyRecord(value: Record<string, unknown> | undefined): value is Record<string, unknown> {
  return value !== undefined && Object.keys(value).length > 0;
}

export async function getReverseTaskState(
  store: ReverseTaskStore,
  taskId: string,
  options: {timelineLimit?: number; evidenceLimit?: number} = {},
): Promise<{
  taskId: string;
  task: Record<string, unknown> | undefined;
  state: ReverseTaskState | undefined;
  targetContext: Record<string, unknown> | undefined;
  recentTimeline: Record<string, unknown>[];
  recentEvidence: Record<string, unknown>[];
  evidenceAggregates: ReverseTaskEvidenceAggregates;
}> {
  const [task, state, targetContext, timeline, evidence] = await Promise.all([
    store.readSnapshot<Record<string, unknown>>(taskId, 'task.json'),
    store.readSnapshot<ReverseTaskState>(taskId, 'state.json'),
    store.readSnapshot<Record<string, unknown>>(taskId, 'target-context.json'),
    store.readLog('timeline', taskId),
    store.readLog('runtime-evidence', taskId),
  ]);

  const timelineLimit = options.timelineLimit ?? 10;
  const evidenceLimit = options.evidenceLimit ?? 10;
  const evidenceIndex = buildReverseTaskEvidenceIndex(evidence);

  return {
    taskId,
    task,
    state,
    targetContext: isNonEmptyRecord(targetContext)
      ? targetContext
      : (task?.targetContext as Record<string, unknown> | undefined),
    recentTimeline: timeline.slice(-timelineLimit),
    recentEvidence: evidenceIndex.dedupedEntries.slice(-evidenceLimit),
    evidenceAggregates: evidenceIndex.aggregates,
  };
}
