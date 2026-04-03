/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {YargsOptions} from './third_party/index.js';
import {yargs, hideBin} from './third_party/index.js';

export const cliOptions = {
  doctor: {
    type: 'boolean',
    description: 'Run startup diagnostics and exit.',
    default: false,
  },
  manageReverseTask: {
    type: 'string',
    description: 'Unified reverse task CLI entry. Actions: list|get|summarize|progress|update|timeline.',
  },

  orchestrateReverseTask: {
    type: 'string',
    description: 'Run the reverse-task orchestrator for one task id.',
  },
  execute: {
    type: 'boolean',
    description: 'When used with --orchestrateReverseTask, execute the generated plan.',
    default: false,
  },
  resume: {
    type: 'boolean',
    description: 'When used with --orchestrateReverseTask, resume from the saved checkpoint.',
    default: false,
  },
  stopOnError: {
    type: 'boolean',
    description: 'When used with --orchestrateReverseTask, stop immediately after the first step failure.',
    default: true,
  },
  includeSummary: {
    type: 'boolean',
    description: 'When used with --orchestrateReverseTask, include the post-run task summary in CLI output.',
    default: true,
  },
  persistState: {
    type: 'boolean',
    description: 'When used with --orchestrateReverseTask, sync task state before planning/execution.',
    default: true,
  },
  executionOverrides: {
    type: 'string',
    description: 'JSON object of execution overrides for orchestrated tool steps.',
    coerce: (val: string | undefined) => {
      if (!val) {
        return;
      }
      try {
        const parsed = JSON.parse(val);
        if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
          throw new Error('Overrides must be a JSON object');
        }
        return parsed as Record<string, {status: string; result?: string; error?: string}>;
      } catch (error) {
        throw new Error(`Invalid JSON for executionOverrides: ${(error as Error).message}`);
      }
    },
  },
  reverseTaskLimit: {
    type: 'number',
    description: 'Limit number of items when using --manageReverseTask list.',
  },
  reverseTimelineLimit: {
    type: 'number',
    description: 'Timeline item limit for reverse task query/summary CLI commands.',
  },
  reverseEvidenceLimit: {
    type: 'number',
    description: 'Evidence item limit for reverse task query/summary CLI commands.',
  },
  taskId: {
    type: 'string',
    description: 'Reverse task id for --manageReverseTask actions that target one task.',
  },
  taskSlug: {
    type: 'string',
    description: 'Optional reverse task slug for --manageReverseTask update/timeline.',
  },
  taskTargetUrl: {
    type: 'string',
    description: 'Optional reverse task target URL for --manageReverseTask update/timeline.',
  },
  taskGoal: {
    type: 'string',
    description: 'Optional reverse task goal for --manageReverseTask update/timeline.',
  },
  taskStage: {
    type: 'string',
    choices: ['Observe', 'Capture', 'Rebuild', 'Patch', 'DeepDive', 'PureExtraction', 'Port'] as const,
    description: 'Reverse task stage for --manageReverseTask update.',
  },
  taskStatus: {
    type: 'string',
    choices: ['active', 'blocked', 'partial', 'pass'] as const,
    description: 'Reverse task status for --manageReverseTask update.',
  },
  taskSummary: {
    type: 'string',
    description: 'Reverse task summary for --manageReverseTask update.',
  },
  taskNextStep: {
    type: 'string',
    description: 'Reverse task next-step hint for --manageReverseTask update.',
  },
  timelineStage: {
    type: 'string',
    description: 'Timeline stage for --manageReverseTask timeline.',
  },
  timelineAction: {
    type: 'string',
    description: 'Timeline action for --manageReverseTask timeline.',
  },
  timelineStatus: {
    type: 'string',
    description: 'Timeline status for --manageReverseTask timeline.',
  },
  timelineResult: {
    type: 'string',
    description: 'Timeline result for --manageReverseTask timeline.',
  },
  timelineNext: {
    type: 'string',
    description: 'Timeline next hint for --manageReverseTask timeline.',
  },
  listParameterWorkflows: {
    type: 'boolean',
    description: 'List packaged parameter workflows and exit.',
    default: false,
  },
  showParameterWorkflow: {
    type: 'string',
    description: 'Show one packaged parameter workflow by id or alias and exit.',
  },
  exportParameterWorkflowTemplate: {
    type: 'string',
    description: 'Export a starter parameter workflow template directory and exit.',
  },
  validateParameterWorkflow: {
    type: 'string',
    description: 'Validate a parameter workflow directory and exit.',
  },
  browserUrl: {
    type: 'string',
    description:
      'Connect to a running Chrome instance using port forwarding. For more details see: https://developer.chrome.com/docs/devtools/remote-debugging/local-server.',
    alias: 'u',
    conflicts: 'wsEndpoint',
    coerce: (url: string | undefined) => {
      if (!url) {
        return;
      }
      try {
        new URL(url);
      } catch {
        throw new Error(`Provided browserUrl ${url} is not valid URL.`);
      }
      return url;
    },
  },
  wsEndpoint: {
    type: 'string',
    description:
      'WebSocket endpoint to connect to a running Chrome instance (e.g., ws://127.0.0.1:9222/devtools/browser/<id>). Alternative to --browserUrl.',
    alias: 'w',
    conflicts: 'browserUrl',
    coerce: (url: string | undefined) => {
      if (!url) {
        return;
      }
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
          throw new Error(
            `Provided wsEndpoint ${url} must use ws:// or wss:// protocol.`,
          );
        }
        return url;
      } catch (error) {
        if ((error as Error).message.includes('ws://')) {
          throw error;
        }
        throw new Error(`Provided wsEndpoint ${url} is not valid URL.`);
      }
    },
  },
  wsHeaders: {
    type: 'string',
    description:
      'Custom headers for WebSocket connection in JSON format (e.g., \'{"Authorization":"Bearer token"}\'). Only works with --wsEndpoint.',
    implies: 'wsEndpoint',
    coerce: (val: string | undefined) => {
      if (!val) {
        return;
      }
      try {
        const parsed = JSON.parse(val);
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Headers must be a JSON object');
        }
        return parsed as Record<string, string>;
      } catch (error) {
        throw new Error(
          `Invalid JSON for wsHeaders: ${(error as Error).message}`,
        );
      }
    },
  },
  autoConnect: {
    type: 'boolean',
    description:
      'Auto-detect a locally running Chrome DevTools endpoint before launching a new browser.',
    default: false,
  },
  headless: {
    type: 'boolean',
    description: 'Whether to run in headless (no UI) mode.',
    default: false,
  },
  executablePath: {
    type: 'string',
    description: 'Path to custom Chrome executable.',
    conflicts: ['browserUrl', 'wsEndpoint'],
    alias: 'e',
  },
  isolated: {
    type: 'boolean',
    description:
      'If specified, creates a temporary user-data-dir that is automatically cleaned up after the browser is closed.',
    default: false,
  },
  channel: {
    type: 'string',
    description:
      'Specify a different Chrome channel that should be used. The default is the stable channel version.',
    choices: ['stable', 'canary', 'beta', 'dev'] as const,
    conflicts: ['browserUrl', 'wsEndpoint', 'executablePath'],
  },
  logFile: {
    type: 'string',
    describe:
      'Path to a file to write debug logs to. Set the env variable `DEBUG` to `*` to enable verbose logs. Useful for submitting bug reports.',
  },
  viewport: {
    type: 'string',
    describe:
      'Initial viewport size for the Chrome instances started by the server. For example, `1280x720`. In headless mode, max size is 3840x2160px.',
    coerce: (arg: string | undefined) => {
      if (arg === undefined) {
        return;
      }
      const [width, height] = arg.split('x').map(Number);
      if (!width || !height || Number.isNaN(width) || Number.isNaN(height)) {
        throw new Error('Invalid viewport. Expected format is `1280x720`.');
      }
      return {
        width,
        height,
      };
    },
  },
  proxyServer: {
    type: 'string',
    description: `Proxy server configuration for Chrome passed as --proxy-server when launching the browser. See https://www.chromium.org/developers/design-documents/network-settings/ for details.`,
  },
  acceptInsecureCerts: {
    type: 'boolean',
    description: `If enabled, ignores errors relative to self-signed and expired certificates. Use with caution.`,
  },
  experimentalDevtools: {
    type: 'boolean',
    describe: 'Whether to enable automation over DevTools targets',
    hidden: true,
  },
  experimentalIncludeAllPages: {
    type: 'boolean',
    describe:
      'Whether to include all kinds of pages such as webviews or background pages as pages.',
    hidden: true,
  },
  chromeArg: {
    type: 'array',
    describe:
      'Additional arguments for Chrome. Only applies when Chrome is launched by JSReverser-MCP.',
  },
  categoryNetwork: {
    type: 'boolean',
    default: true,
    describe: 'Set to false to exclude tools related to network.',
  },
} satisfies Record<string, YargsOptions>;

export function parseArguments(version: string, argv = process.argv) {
  const yargsInstance = yargs(hideBin(argv))
    .scriptName('npx jsreverser-mcp@latest')
    .options(cliOptions)
    .check(args => {
      // We can't set default in the options else
      // Yargs will complain
      if (
        !args.channel &&
        !args.browserUrl &&
        !args.wsEndpoint &&
        !args.autoConnect &&
        !args.executablePath
      ) {
        args.channel = 'stable';
      }
      return true;
    })
    .example([
      [
        '$0 --browserUrl http://127.0.0.1:9222',
        'Connect to an existing browser instance via HTTP',
      ],
      [
        '$0 --wsEndpoint ws://127.0.0.1:9222/devtools/browser/abc123',
        'Connect to an existing browser instance via WebSocket',
      ],
      [
        `$0 --wsEndpoint ws://127.0.0.1:9222/devtools/browser/abc123 --wsHeaders '{"Authorization":"Bearer token"}'`,
        'Connect via WebSocket with custom headers',
      ],
      ['$0 --channel beta', 'Use Chrome Beta installed on this system'],
      ['$0 --channel canary', 'Use Chrome Canary installed on this system'],
      ['$0 --channel dev', 'Use Chrome Dev installed on this system'],
      ['$0 --channel stable', 'Use stable Chrome installed on this system'],
      ['$0 --logFile /tmp/log.txt', 'Save logs to a file'],
      ['$0 --help', 'Print CLI options'],
      [
        '$0 --viewport 1280x720',
        'Launch Chrome with the initial viewport size of 1280x720px',
      ],
      [
        `$0 --chrome-arg='--no-sandbox' --chrome-arg='--disable-setuid-sandbox'`,
        'Launch Chrome without sandboxes. Use with caution.',
      ],
      ['$0 --no-category-network', 'Disable tools in the network category'],
    ]);

  return yargsInstance
    .wrap(Math.min(120, yargsInstance.terminalWidth()))
    .help()
    .version(version)
    .parseSync();
}

export type CliArguments = ReturnType<typeof parseArguments>;

export async function executeKnowledgeCliCommand(
  args: Partial<CliArguments>,
  writeLine: (line: string) => void = (line) => console.log(line),
): Promise<boolean> {

  if (args.orchestrateReverseTask) {
    const {ReverseTaskStore} = await import('./reverse/ReverseTaskStore.js');
    const {orchestrateReverseTask} = await import('./reverse/ReverseTaskOrchestrator.js');
    const store = new ReverseTaskStore();
    const result = await orchestrateReverseTask(store, String(args.orchestrateReverseTask), {
      execute: Boolean(args.execute),
      resume: Boolean(args.resume),
      stopOnError: args.stopOnError,
      includeSummary: args.includeSummary,
      persistState: args.persistState,
      executionOverrides: args.executionOverrides as Record<string, {status: 'ok' | 'error'; result?: string; error?: string}> | undefined,
    });
    writeLine(JSON.stringify(result, null, 2));
    return true;
  }

  if (args.manageReverseTask) {
    const {ReverseTaskStore} = await import('./reverse/ReverseTaskStore.js');
    const {listReverseTasks} = await import('./reverse/ReverseTaskList.js');
    const {getReverseTaskState} = await import('./reverse/ReverseTaskQuery.js');
    const {summarizeReverseTask} = await import('./reverse/ReverseTaskSummary.js');
    const {autoProgressReverseTask} = await import('./reverse/ReverseTaskAutoProgress.js');
    const {appendReverseTimeline} = await import('./reverse/ReverseTaskTimeline.js');
    const {updateReverseTaskState} = await import('./reverse/ReverseTaskState.js');

    const store = new ReverseTaskStore();
    const timelineLimit = Number(args.reverseTimelineLimit ?? 10);
    const evidenceLimit = Number(args.reverseEvidenceLimit ?? 10);
    const action = String(args.manageReverseTask);

    if (action === 'list') {
      const items = await listReverseTasks(store, {
        limit: typeof args.reverseTaskLimit === 'number' ? args.reverseTaskLimit : undefined,
      });
      writeLine(JSON.stringify({action, items}, null, 2));
      return true;
    }

    if (!args.taskId) {
      throw new Error(`--taskId is required when --manageReverseTask=${action}`);
    }

    if (action === 'get') {
      const result = await getReverseTaskState(store, String(args.taskId), {
        timelineLimit,
        evidenceLimit,
      });
      writeLine(JSON.stringify({action, ...result}, null, 2));
      return true;
    }

    if (action === 'summarize') {
      const result = await summarizeReverseTask(store, String(args.taskId), {
        timelineLimit,
        evidenceLimit,
      });
      writeLine(JSON.stringify({action, ...result}, null, 2));
      return true;
    }

    if (action === 'progress') {
      const result = await autoProgressReverseTask(store, String(args.taskId));
      writeLine(JSON.stringify({action, ...result}, null, 2));
      return true;
    }

    if (action === 'update') {
      const result = await updateReverseTaskState(store, {
        taskId: String(args.taskId),
        taskSlug: args.taskSlug,
        targetUrl: args.taskTargetUrl,
        goal: args.taskGoal,
        currentStage: args.taskStage,
        status: args.taskStatus as 'active' | 'blocked' | 'partial' | 'pass' | undefined,
        currentSummary: args.taskSummary,
        nextStepHint: args.taskNextStep,
      });
      writeLine(JSON.stringify({action, ...result}, null, 2));
      return true;
    }

    if (action === 'timeline') {
      if (!args.timelineStage || !args.timelineAction || !args.timelineStatus) {
        throw new Error('--timelineStage, --timelineAction, and --timelineStatus are required when --manageReverseTask=timeline');
      }
      const result = await appendReverseTimeline(store, {
        taskId: String(args.taskId),
        taskSlug: args.taskSlug,
        targetUrl: args.taskTargetUrl,
        goal: args.taskGoal,
        stage: String(args.timelineStage),
        action: String(args.timelineAction),
        status: String(args.timelineStatus),
        result: args.timelineResult,
        next: args.timelineNext,
      });
      writeLine(JSON.stringify({action, ...result}, null, 2));
      return true;
    }

    throw new Error(`Unsupported --manageReverseTask action: ${action}`);
  }

  if (args.doctor) {
    const {runEnvironmentDiagnostics} = await import('./diagnostics/environment.js');
    writeLine(JSON.stringify(runEnvironmentDiagnostics(), null, 2));
    return true;
  }

  const workflowModule = await import('./modules/workflows/ParameterWorkflowLibrary.js');

  if (args.listParameterWorkflows) {
    const items = await workflowModule.listParameterWorkflows();
    writeLine(JSON.stringify(items, null, 2));
    return true;
  }

  if (args.showParameterWorkflow) {
    const workflow = await workflowModule.showParameterWorkflow(String(args.showParameterWorkflow));
    writeLine(JSON.stringify(workflow, null, 2));
    return true;
  }

  if (args.exportParameterWorkflowTemplate) {
    await workflowModule.exportParameterWorkflowTemplate(String(args.exportParameterWorkflowTemplate));
    writeLine(`Exported parameter workflow template to ${args.exportParameterWorkflowTemplate}`);
    return true;
  }

  if (args.validateParameterWorkflow) {
    const result = await workflowModule.validateParameterWorkflow(String(args.validateParameterWorkflow));
    writeLine(JSON.stringify(result, null, 2));
    return true;
  }

  return false;
}
