# JSReverser-MCP

[中文 README](README.md)

An MCP server that standardizes frontend JavaScript reverse-engineering workflows.
The goal is not just page debugging. It is to connect page observation, runtime sampling, local reproduction, environment patching, and evidence capture into one reusable workflow.

## First-run recommendation

For a first successful run, use this order:

1. Start the server
2. Run `--doctor` or `diagnose_environment`
3. Run `check_browser_health`
4. Then continue with `list_pages`, `network_request`, and `list_scripts`

This catches the most common setup issues early:

- Node / build problems
- browser connectivity problems
- AI provider misconfiguration
- artifacts directory issues

## Core Methodology

This project follows these defaults:

- `Observe-first`
- `Hook-preferred`
- `Breakpoint-last`
- `Rebuild-oriented`
- `Evidence-first`
- `Pure-extraction-after-pass`

In practice, that means:

1. Confirm requests, scripts, functions, and dependencies in the browser first.
2. Use the smallest possible hook-based sampling.
3. Export a local rebuild bundle.
4. Patch the Node environment step by step.
5. Persist every step into task artifacts instead of leaving it only in chat history.

## Indexed Cases

The following parameter chains already have public in-repo entry points:

### parameter blueprint knowledge base

- Main entry: [docs/knowledge/parameter-blueprints/](docs/knowledge/parameter-blueprints/)
- Template: [docs/reference/parameter-blueprint-template.md](docs/reference/parameter-blueprint-template.md)
- Contribution guide: [docs/guides/parameter-workflow-contribution.md](docs/guides/parameter-workflow-contribution.md)
- Note: blueprint is the main asset; `workflow.md` is only one execution-oriented file inside a blueprint
- CLI:
  - `node build/src/index.js --list-parameter-workflows`
  - `node build/src/index.js --show-parameter-workflow jd-h5st`

- JD `h5st`
  - Index: [scripts/cases/README.md](scripts/cases/README.md)
  - Case: [scripts/cases/jd-h5st-pure-node.mjs](scripts/cases/jd-h5st-pure-node.mjs)

- Kuaishou `falcon`
  - Index: [scripts/cases/README.md](scripts/cases/README.md)
  - Case: [scripts/cases/ks-hxfalcon-pure-node.mjs](scripts/cases/ks-hxfalcon-pure-node.mjs)

- Douyin `a-bogus`
  - Index: [scripts/cases/README.md](scripts/cases/README.md)
  - Case: [scripts/cases/douyin-a-bogus-pure-node.mjs](scripts/cases/douyin-a-bogus-pure-node.mjs)

Notes:

- The homepage only shows sanitized parameter categories and public entry points.
- Real `artifacts/tasks/<task-id>/` directories are treated as local/private task folders by default.
- Git only tracks `artifacts/tasks/_TEMPLATE/` by default.

## Capabilities

### Page Observation and Script Discovery

Use these tools to answer: what scripts are loaded, and where the target logic likely lives.

- `list_scripts`
- `get_script_source`
- `find_in_script`
- `search_in_scripts`

### Hooking and Runtime Sampling

Use lightweight observation before stepping into paused debugging.

- `create_hook`
- `inject_hook`
- `get_hook_data`
- `hook_function`
- `trace_function`

### Breakpoints and Debug Control

Use paused debugging only when hooks are not enough.

- `breakpoint` — unified breakpoint management with `set` / `remove` / `list`
- `set_breakpoint_on_text`
- `resume`
- `pause`
- `step_over` / `step_into` / `step_out`

### Request and Network Analysis

Locate the target request and identify what triggers it.

- `network_request` — unified request inspection with `action=list` and `action=get`
- `get_request_initiator`
- `xhr_breakpoint` — unified XHR / Fetch breakpoint management with `action=set` and `action=remove`

### Page State and Runtime Checks

Inspect browser state, logs, and storage dependencies.

- `check_browser_health`
- `diagnose_environment`
- `console_message` — unified console inspection with `action=list` and `action=get`
- `get_storage`
- `evaluate_script`
- `search_in_sources`

### Stage Guidance and Next-Step Advice

If you do not want to rely on an external skill/playbook, start with:

- `recommend_next_step`
- `explain_reverse_stage`

### Task Initialization and State Management

For durable task artifacts and resumable work:

- `start_reverse_task`
- **Use `manage_reverse_task` as the default entry** for all list / get / summarize / progress / update / timeline task flows.
- `manage_reverse_task`: aggregated reverse-task entry for list/get/summarize/progress/update/timeline flows
  - `action: "list"`
  - `action: "get"`
  - `action: "summarize"`
  - `action: "progress"`
  - `action: "update"`
  - `action: "timeline"`
- `orchestrate_reverse_task`: high-level orchestration entry that syncs task state, returns the next-step plan, and can also run it directly with `execute=true`, persist a checkpoint, and continue from it with `resume=true`
- Task CLI shortcuts:
  - `--manageReverseTask list`
  - `--manageReverseTask get --taskId <taskId>`
  - `--manageReverseTask summarize --taskId <taskId>`
  - `--manageReverseTask progress --taskId <taskId>`
  - `--orchestrateReverseTask <taskId>`
  - `--orchestrateReverseTask <taskId> --execute --resume`
  - `--orchestrateReverseTask <taskId> --execute --stopOnError=false`
  - `--orchestrateReverseTask <taskId> --execute --executionOverrides '{"inject_hook":{"status":"ok","result":"done"}}'`
- See [docs/guides/reverse-task-orchestration.md](docs/guides/reverse-task-orchestration.md) for the CLI cheatsheet, checkpoint behavior, failure classification table, and how it works with `codex --resume`.

Notes:

- Some page-scoped tools now accept an explicit `pageIdx`; when omitted, they still use the page selected via `select_page`
- `navigate_page` and `evaluate_script` also support explicit `pageIdx`
- `list_scripts`, `get_script_source`, `find_in_script`, `search_in_sources`, `get_storage`, and `get_request_initiator` also support explicit `pageIdx`
- `breakpoint`, `set_breakpoint_on_text`, `pause`, `resume`, `step_over`, `step_into`, `step_out`, `xhr_breakpoint`, `trace_function`, and `hook_function` also support explicit `pageIdx`
- `console_message` uses `targetPageIdx` for explicit page targeting so it does not conflict with result pagination `pageIdx`
- `network_request` and the WebSocket tools also use `targetPageIdx` when you need explicit browser-page targeting

### WebSocket Inspection

Useful for long-lived connections, streaming flows, and binary frames.

- `list_websocket_connections`
- `analyze_websocket_messages`
- `get_websocket_messages`

### Local Rebuild and Environment Patching

Bring browser evidence back to a local Node workflow.

- `export_rebuild_bundle`
- `diff_env_requirements`
- `record_reverse_evidence`: persist key hook / network / script observations into task artifacts so later summarize / progress / orchestration steps can reuse them.

### Page Automation

Use the minimum page actions needed to reproduce a flow.

- `navigate_page`
- `query_dom`
- `click_element`
- `type_text`
- `take_screenshot`

### Deep Analysis

Once code and runtime evidence are available:

- `collect_code`
- `understand_code`
- `deobfuscate_code`
- `risk_panel`

### Session and Login-State Reuse

- `session_state` — unified snapshot management with `save` / `restore` / `list` / `delete` / `dump` / `load`

For full parameter details, see [docs/reference/tool-reference.md](docs/reference/tool-reference.md).
For workflow-oriented tool selection, see [docs/reference/reverse-workflow.md](docs/reference/reverse-workflow.md).

## External AI Configuration

The project supports external LLMs as an analysis enhancement layer.
Currently supported providers:

- `openai`
- `anthropic`
- `gemini`

The real configuration surface is environment variables.
Whether you start from source or via `npx jsreverser-mcp@latest`, **the env values belong to the MCP server process**.

Minimal example:

```toml
[mcp_servers.jsreverser-mcp]
command = "npx"
args = ["-y", "jsreverser-mcp@latest"]

[mcp_servers.jsreverser-mcp.env]
DEFAULT_LLM_PROVIDER = "openai"
OPENAI_API_KEY = "your_key"
OPENAI_MODEL = "gpt-4o"
```

If you use an OpenAI-compatible model, add `OPENAI_BASE_URL`.

Full client examples and detailed configuration are documented in:

- [docs/guides/client-configuration.md](docs/guides/client-configuration.md)
- [docs/guides/getting-started.md](docs/guides/getting-started.md)
- [docs/guides/parameter-workflow-contribution.md](docs/guides/parameter-workflow-contribution.md)

## Task and Workflow Docs

Detailed task layout, execution flow, environment-patching boundaries, and safety rules live in:

- [docs/knowledge/parameter-blueprints/](docs/knowledge/parameter-blueprints/)
- [docs/reference/reverse-workflow.md](docs/reference/reverse-workflow.md)
- [docs/reference/reverse-artifacts.md](docs/reference/reverse-artifacts.md)
- [docs/reference/env-patching.md](docs/reference/env-patching.md)
- [docs/reference/case-safety-policy.md](docs/reference/case-safety-policy.md)
- `reverse-update-prompt-template`
- `reverse-report-template`

## Default artifacts location

- **Running from source checkout**: defaults to `<repo>/artifacts/tasks`
- **Running via `npx -y jsreverser-mcp@latest`**: defaults to  
  `~/.local/state/jsreverser-mcp/artifacts/tasks`
- Override with:

```bash
export JSREVERSER_ARTIFACTS_DIR=/your/path/artifacts/tasks
```

## 3-Minute Quick Start

### 1) Fastest launch path

```bash
npx -y jsreverser-mcp@latest
```

If you want a startup self-check first:

```bash
npx -y jsreverser-mcp@latest --doctor
```

### 2) If you want to run from source

```bash
npm install
npm run build
```

Build entry:

```bash
build/src/index.js
```

### 3) Configure your MCP client

Minimal examples:

#### Claude Code (`npx`)

```bash
claude mcp add jsreverser-mcp npx -y jsreverser-mcp@latest
```

#### Claude Code (source)

```bash
claude mcp add jsreverser-mcp node /ABSOLUTE/PATH/JSReverser-MCP/build/src/index.js
```

#### Cursor (`npx`)

- Command: `npx`
- Args: `["-y", "jsreverser-mcp@latest"]`

#### Cursor (source)

- Command: `node`
- Args: `[/ABSOLUTE/PATH/JSReverser-MCP/build/src/index.js]`

#### Codex (`npx`)

```toml
[mcp_servers.jsreverser-mcp]
command = "npx"
args = ["-y", "jsreverser-mcp@latest"]
```

#### Codex (source)

```toml
[mcp_servers.jsreverser-mcp]
command = "node"
args = ["/ABSOLUTE/PATH/JSReverser-MCP/build/src/index.js"]
```

See the guides for full details:

- Quick start: [docs/guides/getting-started.md](docs/guides/getting-started.md)
- Browser connection: [docs/guides/browser-connection.md](docs/guides/browser-connection.md)
- Client configuration: [docs/guides/client-configuration.md](docs/guides/client-configuration.md)

## Documentation Entry Points

For reverse-engineering tasks, start with:

- [docs/reference/reverse-bootstrap.md](docs/reference/reverse-bootstrap.md)

That entry will further route you to:

- [docs/reference/case-safety-policy.md](docs/reference/case-safety-policy.md)
- [docs/reference/reverse-workflow.md](docs/reference/reverse-workflow.md)
- [docs/reference/pure-extraction.md](docs/reference/pure-extraction.md) when you are already in the post-`env-pass` stage

Common entry points:

- [docs/guides/getting-started.md](docs/guides/getting-started.md)
- [docs/guides/browser-connection.md](docs/guides/browser-connection.md)
- [docs/guides/client-configuration.md](docs/guides/client-configuration.md)
- [docs/reference/reverse-bootstrap.md](docs/reference/reverse-bootstrap.md)
- [docs/reference/tool-reference.md](docs/reference/tool-reference.md)
- [docs/reference/reverse-artifacts.md](docs/reference/reverse-artifacts.md)

## Development and Test

```bash
npm run build
npm run test:unit
npm run test:property
npm run coverage:full
```

## Troubleshooting

See:

- [docs/guides/browser-connection.md](docs/guides/browser-connection.md)

## Upstream References

This project references the following upstream projects during design and implementation.
Actual licenses such as MIT should be checked in the corresponding upstream repositories.

- https://github.com/wuji66dde/jshook-skill
- https://github.com/NoOne-hub/JSReverser-MCP
- https://github.com/ChromeDevTools/chrome-devtools-mcp

## License

Apache-2.0
