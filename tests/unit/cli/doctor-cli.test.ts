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

import {executeKnowledgeCliCommand, parseArguments} from '../../../src/cli.js';
import {startReverseTask} from '../../../src/reverse/ReverseTaskBootstrap.js';
import {ReverseTaskStore} from '../../../src/reverse/ReverseTaskStore.js';

describe('doctor cli', () => {
  it('parses --doctor', () => {
    const parsed = parseArguments('1.2.3', ['node', 'cli.js', '--doctor']);
    assert.strictEqual(parsed.doctor, true);
  });

  it('prints diagnostics json and exits through standalone command path', async () => {
    const lines: string[] = [];
    const handled = await executeKnowledgeCliCommand({doctor: true}, (line) => lines.push(line));

    assert.strictEqual(handled, true);
    assert.strictEqual(lines.length, 1);
    const parsed = JSON.parse(lines[0]) as {status: string; checks: unknown[]};
    assert.ok(['ok', 'warn', 'fail'].includes(parsed.status));
    assert.ok(Array.isArray(parsed.checks));
  });

  it('supports unified manageReverseTask CLI actions', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'jsreverser-cli-task-'));
    const originalArtifactsDir = process.env.JSREVERSER_ARTIFACTS_DIR;

    try {
      process.env.JSREVERSER_ARTIFACTS_DIR = rootDir;
      const store = new ReverseTaskStore({rootDir});
      await startReverseTask(store, {
        taskId: 'task-cli-001',
        taskSlug: 'cli-demo',
        targetUrl: 'https://example.com/api/sign',
        goal: 'cli task flow',
        targetContext: {
          targetRequest: {
            method: 'POST',
            url: 'https://example.com/api/sign',
          },
        },
      });
      const opened = await store.openTask({
        taskId: 'task-cli-001',
        slug: 'cli-demo',
        targetUrl: 'https://example.com/api/sign',
        goal: 'cli task flow',
      });
      await opened.appendLog('runtime-evidence', {
        source: 'hook',
        kind: 'hook-hit',
        note: 'captured from CLI flow',
      });

      const listLines: string[] = [];
      const listHandled = await executeKnowledgeCliCommand({manageReverseTask: 'list'}, (line) => listLines.push(line));
      assert.strictEqual(listHandled, true);
      const listPayload = JSON.parse(listLines[0]) as {action: string; items: Array<{taskId: string}>};
      assert.strictEqual(listPayload.action, 'list');
      assert.strictEqual(listPayload.items[0]?.taskId, 'task-cli-001');

      const stateLines: string[] = [];
      const stateHandled = await executeKnowledgeCliCommand(
        {manageReverseTask: 'get', taskId: 'task-cli-001', reverseTimelineLimit: 3, reverseEvidenceLimit: 3},
        (line) => stateLines.push(line),
      );
      assert.strictEqual(stateHandled, true);
      const statePayload = JSON.parse(stateLines[0]) as {action: string; taskId: string; recentEvidence: Array<{source: string}>};
      assert.strictEqual(statePayload.action, 'get');
      assert.strictEqual(statePayload.taskId, 'task-cli-001');
      assert.strictEqual(statePayload.recentEvidence[0]?.source, 'hook');

      const summaryLines: string[] = [];
      const summaryHandled = await executeKnowledgeCliCommand({manageReverseTask: 'summarize', taskId: 'task-cli-001'}, (line) => summaryLines.push(line));
      assert.strictEqual(summaryHandled, true);
      const summaryPayload = JSON.parse(summaryLines[0]) as {action: string; taskId: string; goal: string};
      assert.strictEqual(summaryPayload.action, 'summarize');
      assert.strictEqual(summaryPayload.taskId, 'task-cli-001');
      assert.strictEqual(summaryPayload.goal, 'cli task flow');

      const progressLines: string[] = [];
      const progressHandled = await executeKnowledgeCliCommand({manageReverseTask: 'progress', taskId: 'task-cli-001'}, (line) => progressLines.push(line));
      assert.strictEqual(progressHandled, true);
      const progressPayload = JSON.parse(progressLines[0]) as {action: string; currentStage: string; nextStepHint: string; reasoning: string[]; schemaVersion?: string; outcome?: string; shouldResume?: boolean; nextBestTool?: string; detailLevel?: string; routeGuard?: {preferredToolClass?: string; routeHint?: string}; continuation?: {tool?: string; ready?: boolean; actionKey?: string; toolClass?: string; routeHint?: string; invoke?: {tool?: string; params?: Record<string, unknown>}}; agentGuidance?: {recommendedTool?: string; recommendedStrategy?: string; toolClass?: string; routeHint?: string}};
      assert.strictEqual(progressPayload.action, 'progress');
      assert.strictEqual(progressPayload.schemaVersion, '1.0');
      assert.strictEqual(progressPayload.currentStage, 'Rebuild');
      assert.strictEqual(progressPayload.nextStepHint, 'export_rebuild_bundle');
      assert.ok(Array.isArray(progressPayload.reasoning));
      assert.strictEqual(progressPayload.outcome, 'success');
      assert.strictEqual(progressPayload.shouldResume, true);
      assert.strictEqual(progressPayload.nextBestTool, 'export_rebuild_bundle');
      assert.strictEqual(progressPayload.detailLevel, 'standard');
      assert.strictEqual(progressPayload.routeGuard?.preferredToolClass, 'rebuild');
      assert.strictEqual(progressPayload.routeGuard?.routeHint, 'switch_to_rebuild');
      assert.strictEqual(progressPayload.continuation?.ready, true);
      assert.strictEqual(progressPayload.continuation?.tool, 'export_rebuild_bundle');
      assert.strictEqual(progressPayload.continuation?.actionKey, 'export_rebuild_bundle');
      assert.strictEqual(progressPayload.continuation?.invoke?.tool, 'export_rebuild_bundle');
      assert.deepStrictEqual(progressPayload.continuation?.invoke?.params, {taskId: 'task-cli-001'});
      assert.strictEqual(progressPayload.continuation?.toolClass, 'rebuild');
      assert.strictEqual(progressPayload.continuation?.routeHint, 'switch_to_rebuild');
      assert.strictEqual(progressPayload.agentGuidance?.recommendedTool, 'export_rebuild_bundle');
      assert.strictEqual(progressPayload.agentGuidance?.recommendedStrategy, 'rebuild-first');
      assert.strictEqual(progressPayload.agentGuidance?.toolClass, 'rebuild');
      assert.strictEqual(progressPayload.agentGuidance?.routeHint, 'switch_to_rebuild');

      const compactLines: string[] = [];
      const compactHandled = await executeKnowledgeCliCommand(
        {manageReverseTask: 'summarize', taskId: 'task-cli-001', outputMode: 'compact'},
        (line) => compactLines.push(line),
      );
      assert.strictEqual(compactHandled, true);
      const compactPayload = JSON.parse(compactLines[0]) as {outputMode?: string; recentTimeline?: unknown[]; recentEvidence?: unknown[]};
      assert.strictEqual(compactPayload.outputMode, 'compact');
      assert.strictEqual(compactPayload.recentTimeline, undefined);
      assert.strictEqual(compactPayload.recentEvidence, undefined);

      await assert.rejects(
        () => executeKnowledgeCliCommand({manageReverseTask: 'search'}, () => undefined),
        /query or tag is required/,
      );
    } finally {
      if (originalArtifactsDir === undefined) {
        delete process.env.JSREVERSER_ARTIFACTS_DIR;
      } else {
        process.env.JSREVERSER_ARTIFACTS_DIR = originalArtifactsDir;
      }
      await rm(rootDir, {recursive: true, force: true});
    }
  });

  it('resumes orchestrateReverseTask CLI execution from a failed checkpoint', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'jsreverser-cli-orchestrate-resume-'));
    const originalArtifactsDir = process.env.JSREVERSER_ARTIFACTS_DIR;

    try {
      process.env.JSREVERSER_ARTIFACTS_DIR = rootDir;
      const store = new ReverseTaskStore({rootDir});
      await startReverseTask(store, {
        taskId: 'task-cli-orchestrate-resume-001',
        taskSlug: 'cli-orchestrate-resume-demo',
        targetUrl: 'https://example.com/api/sign',
        goal: 'cli orchestrate resume flow',
        targetContext: {
          targetRequest: {
            method: 'POST',
            url: 'https://example.com/api/sign',
          },
        },
      });

      const firstLines: string[] = [];
      const firstHandled = await executeKnowledgeCliCommand({
        orchestrateReverseTask: 'task-cli-orchestrate-resume-001',
        execute: true,
      }, (line) => firstLines.push(line));
      assert.strictEqual(firstHandled, true);
      const firstPayload = JSON.parse(firstLines[0]) as {
        errorCode?: string;
        errorType?: string;
        retryable?: boolean;
        blockedBy?: string;
        execution?: {
          checkpoint?: {status: string; failedStepKey?: string; failureType?: string; retryable?: boolean};
          failedStep?: {tool: string; failureType?: string; retryable?: boolean};
          recovery?: {recommendedCommand?: string; shouldResume?: boolean};
        };
      };
      assert.strictEqual(firstPayload.execution?.checkpoint?.status, 'failed');
      assert.strictEqual(firstPayload.execution?.checkpoint?.failedStepKey, 'inject_hook');
      assert.strictEqual(firstPayload.execution?.checkpoint?.failureType, 'tool_error');
      assert.strictEqual(firstPayload.execution?.checkpoint?.retryable, true);
      assert.strictEqual(firstPayload.execution?.failedStep?.tool, 'inject_hook');
      assert.strictEqual(firstPayload.errorCode, 'tool_error');
      assert.strictEqual(firstPayload.errorType, 'tool_error');
      assert.strictEqual(firstPayload.retryable, true);
      assert.strictEqual(firstPayload.blockedBy, 'tooling');
      assert.ok(firstPayload.execution?.recovery?.recommendedCommand?.includes('--execute --resume'));
      assert.strictEqual(firstPayload.execution?.recovery?.shouldResume, true);

      const resumedLines: string[] = [];
      const resumedHandled = await executeKnowledgeCliCommand({
        orchestrateReverseTask: 'task-cli-orchestrate-resume-001',
        execute: true,
        resume: true,
        includeSummary: false,
        executionOverrides: {
          inject_hook: {
            status: 'ok',
            result: 'synthetic hook injection completed after resume',
          },
        },
      }, (line) => resumedLines.push(line));
      assert.strictEqual(resumedHandled, true);
      const resumedPayload = JSON.parse(resumedLines[0]) as {
        execution?: {
          resumed: boolean;
          checkpoint?: {status: string};
          stepResults: Array<{key: string; status: string; retryCount?: number}>;
        };
        summary?: unknown;
      };
      assert.strictEqual(resumedPayload.execution?.resumed, true);
      assert.strictEqual(resumedPayload.execution?.checkpoint?.status, 'passed');
      assert.strictEqual(resumedPayload.summary, undefined);
      assert.ok(resumedPayload.execution?.stepResults.some((entry) => entry.key === 'inject_hook' && entry.status === 'failed' && entry.retryCount === 1));
      assert.ok(resumedPayload.execution?.stepResults.some((entry) => entry.key === 'inject_hook' && entry.status === 'passed'));
    } finally {
      if (originalArtifactsDir === undefined) {
        delete process.env.JSREVERSER_ARTIFACTS_DIR;
      } else {
        process.env.JSREVERSER_ARTIFACTS_DIR = originalArtifactsDir;
      }
      await rm(rootDir, {recursive: true, force: true});
    }
  });

  it('supports orchestrateReverseTask CLI execution and extended flags', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'jsreverser-cli-orchestrate-'));
    const originalArtifactsDir = process.env.JSREVERSER_ARTIFACTS_DIR;

    try {
      process.env.JSREVERSER_ARTIFACTS_DIR = rootDir;
      const store = new ReverseTaskStore({rootDir});
      await startReverseTask(store, {
        taskId: 'task-cli-orchestrate-001',
        taskSlug: 'cli-orchestrate-demo',
        targetUrl: 'https://example.com/api/sign',
        goal: 'cli orchestrate flow',
        targetContext: {
          targetRequest: {
            method: 'POST',
            url: 'https://example.com/api/sign',
          },
        },
      });

      const lines: string[] = [];
      const handled = await executeKnowledgeCliCommand({
        orchestrateReverseTask: 'task-cli-orchestrate-001',
        execute: true,
        resume: true,
        outputMode: 'compact',
        stopOnError: false,
        onlyStep: ['inject_hook'],
        includeSummary: true,
        persistState: true,
        executionOverrides: {
          inject_hook: {
            status: 'ok',
            result: 'synthetic hook injection completed',
          },
        },
      }, (line) => lines.push(line));
      assert.strictEqual(handled, true);
      const payload = JSON.parse(lines[0]) as {
        taskId: string;
        outputMode?: string;
        outcome?: string;
        shouldResume?: boolean;
        nextBestTool?: string;
        detailLevel?: string;
        agentGuidance?: unknown;
        continuation?: {tool?: string; ready?: boolean; actionKey?: string};
        execution?: {executed: boolean; resumed: boolean; checkpoint?: {status: string}};
        summary?: {taskId: string};
        orchestration: {primaryStep: {tool: string}};
      };
      assert.strictEqual(payload.taskId, 'task-cli-orchestrate-001');
      assert.strictEqual(payload.outputMode, 'compact');
      assert.strictEqual(payload.outcome, 'success');
      assert.strictEqual(payload.shouldResume, false);
      assert.strictEqual(payload.nextBestTool, undefined);
      assert.strictEqual(payload.detailLevel, 'minimal');
      assert.strictEqual(payload.agentGuidance, undefined);
      assert.strictEqual(payload.continuation?.ready, true);
      assert.strictEqual(payload.continuation?.tool, 'inject_hook');
      assert.strictEqual(payload.continuation?.actionKey, 'inject_hook');
      assert.strictEqual(payload.execution?.executed, true);
      assert.strictEqual(payload.execution?.resumed, true);
      assert.strictEqual(payload.execution?.checkpoint?.status, 'passed');
      assert.strictEqual(payload.summary, undefined);
      assert.strictEqual(payload.orchestration.primaryStep.tool, 'inject_hook');
    } finally {
      if (originalArtifactsDir === undefined) {
        delete process.env.JSREVERSER_ARTIFACTS_DIR;
      } else {
        process.env.JSREVERSER_ARTIFACTS_DIR = originalArtifactsDir;
      }
      await rm(rootDir, {recursive: true, force: true});
    }
  });

  it('returns env-error recovery guidance when a filtered orchestration step fails', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'jsreverser-cli-orchestrate-env-'));
    const originalArtifactsDir = process.env.JSREVERSER_ARTIFACTS_DIR;

    try {
      process.env.JSREVERSER_ARTIFACTS_DIR = rootDir;
      const store = new ReverseTaskStore({rootDir});
      await startReverseTask(store, {
        taskId: 'task-cli-orchestrate-env-001',
        taskSlug: 'cli-orchestrate-env-demo',
        targetUrl: 'https://example.com/api/sign',
        goal: 'cli orchestrate env flow',
        targetContext: {
          targetRequest: {
            method: 'POST',
            url: 'https://example.com/api/sign',
          },
        },
      });

      const lines: string[] = [];
      const handled = await executeKnowledgeCliCommand({
        orchestrateReverseTask: 'task-cli-orchestrate-env-001',
        execute: true,
        onlyStep: ['inject_hook'],
        executionOverrides: {
          inject_hook: {
            status: 'error',
            error: 'window is not defined',
          },
        },
      }, (line) => lines.push(line));
      assert.strictEqual(handled, true);
      const payload = JSON.parse(lines[0]) as {
        execution?: {
          failedStep?: {failureType?: string};
          recovery?: {recommendedCommand?: string; shouldInspectSummary?: boolean; shouldResume?: boolean};
        };
      };
      assert.strictEqual(payload.execution?.failedStep?.failureType, 'env_error');
      assert.ok(payload.execution?.recovery?.recommendedCommand?.includes('--manageReverseTask summarize'));
      assert.strictEqual(payload.execution?.recovery?.shouldInspectSummary, true);
      assert.strictEqual(payload.execution?.recovery?.shouldResume, true);
    } finally {
      if (originalArtifactsDir === undefined) {
        delete process.env.JSREVERSER_ARTIFACTS_DIR;
      } else {
        process.env.JSREVERSER_ARTIFACTS_DIR = originalArtifactsDir;
      }
      await rm(rootDir, {recursive: true, force: true});
    }
  });
});
