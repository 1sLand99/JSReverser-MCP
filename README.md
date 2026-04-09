# JSReverser-MCP

[English README](README.en.md)

一个把前端 JavaScript 逆向流程标准化的 MCP 服务。  
目标不是只做页面调试，而是把页面观察、运行时采样、本地复现、补环境和证据沉淀串成一套可复用工作流。

## 第一次启动建议

如果你是第一次接触这个项目，建议先走这条最短路径：

1. 启动服务
2. 运行 `--doctor` 或 `diagnose_environment`
3. 调 `check_browser_health`
4. 再开始 `list_pages` / `network_request` / `list_scripts`

这样可以先排除：

- Node / build 问题
- 浏览器连接问题
- AI provider 配置问题
- artifacts 目录问题

## 核心方法论

本项目默认遵循以下方法论：

- `Observe-first`
- `Hook-preferred`
- `Breakpoint-last`
- `Rebuild-oriented`
- `Evidence-first`
- `Pure-extraction-after-pass`

这意味着：

1. 先在浏览器里确认请求、脚本、函数和依赖来源
2. 再做最小化 Hook 采样
3. 再导出 local rebuild
4. 再在 Node 里逐项补环境
5. 每一步都沉淀为 task artifact，而不是只留在对话里

## 已沉淀链路

以下参数链路已有公开索引，可作为仓库内复用入口：

### 参数蓝图库

- 主入口：[docs/knowledge/parameter-blueprints/](docs/knowledge/parameter-blueprints/)
- 模板规范：[docs/reference/parameter-blueprint-template.md](docs/reference/parameter-blueprint-template.md)
- 贡献指南：[docs/guides/parameter-workflow-contribution.md](docs/guides/parameter-workflow-contribution.md)
- 说明：蓝图是主体资产，`workflow.md` 只是蓝图中的执行步骤文件
- CLI：
  - `node build/src/index.js --list-parameter-workflows`
  - `node build/src/index.js --show-parameter-workflow jd-h5st`

- 某东 `h5st` 参数
  - 索引：[scripts/cases/README.md](scripts/cases/README.md)
  - Case：[scripts/cases/jd-h5st-pure-node.mjs](scripts/cases/jd-h5st-pure-node.mjs)

- 某手 `falcon` 风控参数
  - 索引：[scripts/cases/README.md](scripts/cases/README.md)
  - Case：[scripts/cases/ks-hxfalcon-pure-node.mjs](scripts/cases/ks-hxfalcon-pure-node.mjs)

- 某音 `a-bogus` 参数
  - 索引：[scripts/cases/README.md](scripts/cases/README.md)
  - Case：[scripts/cases/douyin-a-bogus-pure-node.mjs](scripts/cases/douyin-a-bogus-pure-node.mjs)

说明：

- README 首页只展示脱敏后的参数类型和公开入口
- 真实 `artifacts/tasks/<task-id>/` 默认视为本地私有任务目录
- Git 默认只提交 `artifacts/tasks/_TEMPLATE/`

## 支持的能力

### 页面观察与脚本定位

先回答“页面里有哪些脚本、目标代码大概在哪”。

- `list_scripts`：列出当前页面已加载的脚本，先建立脚本范围。
- `get_script_source`：查看指定脚本源码，适合继续阅读具体实现。
- `find_in_script`：在单个脚本里定位字符串、变量名或特征片段。
- `search_in_scripts`：在已采集脚本缓存中批量搜索，适合缩小候选脚本范围。
- `extract_function_tree`：从指定脚本里提取目标函数和最小依赖闭包，避免全量阅读大 bundle。

### Hook 与运行时采样

先做最小侵入式观测，确认运行时到底调用了什么。

- `create_hook`：创建可复用的 hook 定义，用于后续注入页面。
- `inject_hook`：把已有 hook 注入当前页面，开始采样目标行为。
- `get_hook_data`：读取 hook 采集到的调用记录和摘要结果。
- `hook_function`：直接 hook 全局函数或对象方法，记录参数和返回值。
- `trace_function`：按源码函数名做调用追踪，适合跟调用链。

### 断点与调试控制

当 hook 不够时，再进入暂停式调试。

- `breakpoint`：统一管理断点，支持 `set` / `remove` / `list`。
- `set_breakpoint_on_text`：按代码文本自动定位并设置断点。
- `resume`：继续执行到下一个断点或执行结束。
- `pause`：手动暂停当前页面的 JavaScript 执行。
- `step_over` / `step_into` / `step_out`：单步控制执行路径，分别对应跳过、进入、跳出函数。

### 请求链路与网络分析

定位目标请求，确认是谁发起、带了什么参数。

- `network_request`：统一查看网络请求，支持 `action=list` 和 `action=get`。
- `get_request_initiator`：追溯某个请求是谁触发的，帮助定位调用链。
- `xhr_breakpoint`：统一管理 XHR / Fetch 断点，支持 `action=set` 和 `action=remove`。
- `locate_signature_function`：在候选脚本里自动排序可能的签名函数，适合已知目标参数但还没开始 Hook 的场景。

### 页面状态与运行前检查

补看页面运行状态、控制台输出和本地状态依赖。

- `check_browser_health`：检查浏览器连接和当前页是否可控，适合作为起手验证。
- `diagnose_environment`：静态检查启动环境、AI provider 和 artifacts 落点，适合作为真正的第一步。
- `console_message`：统一查看 console 输出，支持 `action=list` 和 `action=get`。
- `get_storage`：读取 cookie、`localStorage`、`sessionStorage`，确认状态依赖。
- `evaluate_script`：在当前选中 frame 内执行一段函数，做小范围运行时验证。
- `search_in_sources`：在所有已加载源码中搜索关键字，快速缩小可疑代码范围。

### 阶段建议与下一步决策

当你不想依赖外部 skill / playbook 时，可以先用这两个工具：

- `recommend_next_step`：根据当前轻量信号给出下一步建议，避免过早断点或过早补环境。
- `explain_reverse_stage`：解释当前阶段的目标、进入条件、禁止事项和推荐工具。

### 任务初始化与状态管理

如果你想把一次逆向任务变成可持续续跑的 artifact，优先用：

- `start_reverse_task`：初始化 `task.json`、`state.json`、`report.md` 和首条 `timeline`
- `create_reverse_task_from_request`：从一条已捕获的 network request 直接生成 reverse task，自动带上 target request、pageUrl、candidateScripts 和首轮 task context
- **默认入口就是 `manage_reverse_task`**：除初始化外，task 的 list / get / summarize / progress / update / timeline / archive / restore / search / tag / prune / compare 全部统一走这个入口
- `manage_reverse_task`：聚合 task 相关常用动作，减少模型在多个 task tools 之间来回选择的 token 开销
  - 返回里会统一带 `agentGuidance`，包含 `status / summary / recommendedNextAction / recommendedTool / recommendedParams / confidence / resumeHint`
  - `agentGuidance.recommendedStrategy` 会直接提示下一轮更适合的 orchestration 模板
  - 返回里也会统一带 `artifacts`，提示本轮主要读取/写入了哪些 task 产物
  - `outputMode: "compact" | "verbose"`：对大模型默认推荐 `compact`，尤其是 `get / summarize`
  - `action: "list"`：查看所有 task 的阶段、状态、下一步和最近更新时间
  - `action: "get"`：读取任务状态、目标上下文、最近 timeline 和 evidence 摘要
  - `action: "summarize"`：把当前任务压缩成一页摘要，方便续跑前快速对齐上下文
  - `action: "progress"`：根据最近 evidence / timeline / successCriteria 自动推断阶段、状态和下一步
  - `action: "update"`：更新当前阶段、状态、摘要和成功判据
  - `action: "timeline"`：显式追加一条 timeline，适合把“本轮动作 / 观察结果 / 下一步”写回 artifact
  - `action: "archive" / "restore"`：归档或恢复任务，便于清理长期积累的本地 artifacts
  - `action: "search"`：按 query / tag 检索历史任务
  - `action: "tag"`：给任务打标签，便于后续筛选和分组
  - `action: "prune"`：删除已归档任务
  - `action: "compare"`：比较两个任务的目标请求、函数命中和证据差异
- `orchestrate_reverse_task`：高层自动编排入口；默认先同步 task 状态并生成执行序列，也支持 `execute=true` 直接串行执行、写回 checkpoint，并在 `resume=true` 时从上次失败步骤续跑；失败时会返回 recovery 建议，还支持 `skipSteps` / `fromStep` / `onlySteps` 做步骤级控制，也支持通过 `strategy` 快速切到 `observe-first` / `rebuild-first` / `env-fix` / `artifact-sync` / `evidence-only` 模板
  - `outputMode: "compact" | "verbose"`：给大模型时可优先用 `compact`，减少非必要字段和说明文字
  - 执行失败时会补 `fallbackPlan`，帮助模型直接切换到下一条更稳的链路
- `run_reverse_agent`：一键 reverse agent 入口；会自动串起 `locate_signature_function -> search_in_sources -> extract_function_tree -> understand_code -> deobfuscate_code`，并在进入 `PureExtraction` 时自动落 `run/fixtures.json`、`run/pure-main.js`、`run/pure-selftest.test.mjs`
- CLI 也统一成一个 task 入口：
  - `--manageReverseTask list`
  - `--manageReverseTask get --taskId <taskId>`
  - `--manageReverseTask summarize --taskId <taskId>`
  - `--manageReverseTask progress --taskId <taskId>`
  - `--manageReverseTask search --query sign --tag jd`
  - `--manageReverseTask tag --taskId <taskId> --tags jd,blocked`
  - `--manageReverseTask archive --taskId <taskId>`
  - `--manageReverseTask restore --taskId <taskId>`
  - `--manageReverseTask compare --taskId <taskId> --otherTaskId <otherTaskId>`
  - `--manageReverseTask prune --pruneOlderThanDays 7`
  - `--orchestrateReverseTask <taskId>`
  - `--orchestrateReverseTask <taskId> --execute --resume`
  - `--orchestrateReverseTask <taskId> --strategy env-fix`
  - `--orchestrateReverseTask <taskId> --execute --stopOnError=false`
  - `--orchestrateReverseTask <taskId> --execute --executionOverrides '{"inject_hook":{"status":"ok","result":"done"}}'`
  - `--runReverseAgent <taskId>`
  - `--runReverseAgent <taskId> --maxRounds 4 --outputMode compact`
- 自动化编排的 checkpoint、CLI cheatsheet、失败分类对照表、`codex --resume` 协同方式见 [docs/guides/reverse-task-orchestration.md](docs/guides/reverse-task-orchestration.md)

说明：

- 上述部分页面级工具已支持显式 `pageIdx`，未传时默认继续使用当前 `select_page` 选中的页面
- `navigate_page`、`evaluate_script` 也已支持显式 `pageIdx`
- `list_scripts`、`get_script_source`、`find_in_script`、`search_in_sources`、`get_storage`、`get_request_initiator` 也已支持显式 `pageIdx`
- `breakpoint`、`set_breakpoint_on_text`、`pause`、`resume`、`step_over`、`step_into`、`step_out`、`xhr_breakpoint`、`trace_function`、`hook_function` 也已支持显式 `pageIdx`
- `console_message` 使用显式页面参数时请传 `targetPageIdx`，避免和结果分页参数 `pageIdx` 混淆
- `network_request` 以及 WebSocket 相关工具在需要显式指定浏览器页面时也使用 `targetPageIdx`

### WebSocket 观察与消息分组

处理长连接、直播流或二进制帧时，用这组工具先分流再细看。

- `list_websocket_connections`：列出当前页面的 WebSocket 连接，先拿到目标 `wsid`。
- `analyze_websocket_messages`：按帧特征做消息分组，适合先识别不同消息类型。
- `get_websocket_messages`：查看某个连接或某个分组下的消息摘要和内容。

### 本地复现与补环境

把页面证据带回本地，逐步补齐 Node 运行环境。

- `export_rebuild_bundle`：导出本地复现工程所需的入口、补环境和证据材料。
- `diff_env_requirements`：根据报错和观测能力比对当前缺失的环境能力，并返回 `patchSuggestions`，直接给出最小补环境片段。
- `get_rebuild_health_report`：聚合当前阶段、env blockers、首个 divergence、`patchSuggestions` 和 `evidenceAggregates`，用于补环境前先做一次体检。
- `get_rebuild_health_report` 也支持 `outputMode: "compact"`，适合把它作为 orchestration 失败后的快速诊断输入。
- 现在 `agentGuidance` 还会直接给出 `recommendedStrategy`，方便下一轮直接调用 `--orchestrateReverseTask <taskId> --strategy ...`
- `orchestrate_reverse_task` 的失败返回里，`fallbackPlan` 现在也会带 `recommendedStrategy`
- `manage_reverse_task` / `orchestrate_reverse_task` / `get_rebuild_health_report` 现在都补了统一的 `agentGuidance`，更适合大模型直接续推而不是先自己解释一遍结果。
- `agentGuidance` 现在还会补 `toolClass / routeHint / avoidTools`，用于把模型继续约束在 reverse 主链路，减少误跳到无关工具。
- 这三个工具现在也统一补了 `responseSummary` 和 `diagnostics` 顶层字段；其中 `responseSummary` 专门留给模型快速判断结果，而不会覆盖业务语义上的 `summary` 对象。
- 运行时响应现在统一带 `schemaVersion: "1.0"`，外部 client / agent 可以先做版本校验，再决定是否继续自动续跑。
- 现在还会补统一的续推字段：`outcome`、`shouldResume`、`shouldSwitchStrategy`、`nextBestTool`、`nextBestParams`，进一步减少模型自己读长结果做判断的成本。
- 另外新增统一 `continuation` 对象：`{ ready, reason, tool, params, strategy, resumeCommand }`，方便模型直接取“下一跳”。
- `continuation` 现在还会带 `invoke: { tool, params }`，方便模型零拼装直接调用下一跳。
- `continuation.invokeHint` 现在会补 `requiredParams / optionalParams / example`，方便模型在执行前先做参数完整性检查。
- 现在又补了一层统一失败契约：`errorCode` / `errorType` / `retryable` / `blockedBy`，并固定返回 `detailLevel` 与 `continuation.actionKey`，方便模型做更稳定的分支判断。
- `compact` 模式现在进一步收紧：优先保留 `responseSummary`、`diagnostics`、关键状态和 `continuation`，去掉重复 next-step 冗余块，`detailLevel` 会降到 `minimal`。
- 同时统一补 `routeGuard`，把 `preferredToolClass / routeHint / avoidTools` 直接提升到顶层，方便模型先做路由决策。
- `record_reverse_evidence`：把 hook / network / script 的关键观察正式写回 task artifact，供后续 summarize / progress / orchestration 复用。现在 summary/query 还会给出去重后的 `evidenceAggregates`，方便快速看 top URLs、top functions 和 env blockers。

### 页面自动化

做最小必要的页面操作，复现触发条件并辅助取证。

- `navigate_page`：跳转、回退、刷新当前页面。
- `query_dom`：查询页面元素，确认选择器和节点状态。
- `click_element`：按选择器触发点击，复现页面动作。
- `type_text`：向输入框写入文本，驱动表单交互。
- `take_screenshot`：截取页面当前状态，保留可视化证据。

### 深度分析

在拿到代码和运行时证据后，继续做结构理解与去混淆。

- `collect_code`：采集页面代码，支持按优先级或范围控制采样量。
- `understand_code`：结合静态分析和 AI 做代码结构、业务逻辑与风险理解。
- `deobfuscate_code`：对混淆代码做清理、还原和辅助分析。
- `risk_panel`：聚合代码分析、加密检测和 hook 信号，输出综合风险视图。

### 会话与登录态复用

- `session_state`：统一管理会话快照，支持 `save` / `restore` / `list` / `delete` / `dump` / `load`。

完整参数说明见 [docs/reference/tool-reference.md](docs/reference/tool-reference.md)。
按逆向流程选工具可继续看 [docs/reference/reverse-workflow.md](docs/reference/reverse-workflow.md)。


### 外部 AI 怎么配置

这个项目支持把外部 LLM 作为“分析增强层”接进来，当前支持：

- `openai`
- `anthropic`
- `gemini`

配置入口本质上是进程环境变量。  
无论你是源码启动还是 `npx jsreverser-mcp@latest` 启动，**env 都是传给 MCP server 进程的**。

最小示例：

```toml
[mcp_servers.jsreverser-mcp]
command = "npx"
args = ["-y", "jsreverser-mcp@latest"]

[mcp_servers.jsreverser-mcp.env]
DEFAULT_LLM_PROVIDER = "openai"
OPENAI_API_KEY = "your_key"
OPENAI_MODEL = "gpt-4o"
```

如果你接的是兼容 OpenAI API 的模型，可额外传 `OPENAI_BASE_URL`。

详细配置、不同客户端示例、`npx` / `node` / `.env` / OpenAI-compatible 用法，统一放在：

- [docs/guides/client-configuration.md](docs/guides/client-configuration.md)
- [docs/guides/getting-started.md](docs/guides/getting-started.md)

### 哪些功能依赖外部 AI

- 强依赖：`understand_code`
- 可选增强：`detect_crypto`、`analyze_target`、`locate_signature_function`、`risk_panel`、`deobfuscate_code`
- 不依赖外部 AI：浏览器接管、Hook / 断点 / Console / Storage / Network / WebSocket、`collect_code`、`export_rebuild_bundle`、`diff_env_requirements`、`record_reverse_evidence`

如果没配外部 AI，最直接的影响通常是：

- `understand_code` 无法使用
- 部分 AI 增强分析会退回本地规则或降级运行

详细说明建议看：

- [docs/guides/client-configuration.md](docs/guides/client-configuration.md)

## 任务与流程文档

详细的 task 目录结构、执行流程、补环境边界、安全规则不再堆在 README 首页，统一看：

- [docs/reference/reverse-workflow.md](docs/reference/reverse-workflow.md)
- [docs/reference/reverse-artifacts.md](docs/reference/reverse-artifacts.md)
- [docs/reference/env-patching.md](docs/reference/env-patching.md)
- [docs/reference/case-safety-policy.md](docs/reference/case-safety-policy.md)

## 3 分钟快速开始

### 1) 最快启动方式

```bash
npx -y jsreverser-mcp@latest
```

如果你想先做启动自检：

```bash
npx -y jsreverser-mcp@latest --doctor
```

### 2) 如果你要源码运行

```bash
npm install
npm run build
```

构建入口：

```bash
build/src/index.js
```

### 3) 配置客户端

最小配置示例：

#### Claude Code（`npx`）

```bash
claude mcp add jsreverser-mcp npx -y jsreverser-mcp@latest
```

#### Claude Code（源码版）

```bash
claude mcp add jsreverser-mcp node /ABSOLUTE/PATH/JSReverser-MCP/build/src/index.js
```

#### Cursor（`npx`）

- Command: `npx`
- Args: `["-y", "jsreverser-mcp@latest"]`

#### Cursor（源码版）

- Command: `node`
- Args: `[/ABSOLUTE/PATH/JSReverser-MCP/build/src/index.js]`

#### Codex（`npx`）

```toml
[mcp_servers.jsreverser-mcp]
command = "npx"
args = ["-y", "jsreverser-mcp@latest"]
```

#### Codex（源码版）

```toml
[mcp_servers.jsreverser-mcp]
command = "node"
args = ["/ABSOLUTE/PATH/JSReverser-MCP/build/src/index.js"]
```

更完整的内容请看：

- 快速开始：[docs/guides/getting-started.md](docs/guides/getting-started.md)
- 浏览器连接：[docs/guides/browser-connection.md](docs/guides/browser-connection.md)
- 客户端配置：[docs/guides/client-configuration.md](docs/guides/client-configuration.md)

## 文档入口

逆向相关任务开场先读：`docs/reference/reverse-bootstrap.md`。该入口会继续要求模型读取 `docs/reference/case-safety-policy.md`、`docs/reference/reverse-workflow.md`；若已进入 `env-pass` 后的提纯阶段，再读 `docs/reference/pure-extraction.md`。

常用入口：

- 快速开始：[docs/guides/getting-started.md](docs/guides/getting-started.md)
- 浏览器连接：[docs/guides/browser-connection.md](docs/guides/browser-connection.md)
- 客户端配置：[docs/guides/client-configuration.md](docs/guides/client-configuration.md)
- 启动自检：`--doctor` / `diagnose_environment`
- 阶段建议：`recommend_next_step` / `explain_reverse_stage`
- 任务状态：`start_reverse_task` / `manage_reverse_task`
- 自动编排：`orchestrate_reverse_task`
- 一键 agent：`run_reverse_agent`
- 任务摘要：`manage_reverse_task`
- 参数蓝图库：[docs/knowledge/parameter-blueprints/](docs/knowledge/parameter-blueprints/)
- 参数蓝图贡献：[docs/guides/parameter-workflow-contribution.md](docs/guides/parameter-workflow-contribution.md)
- 工作流入口：[docs/reference/reverse-bootstrap.md](docs/reference/reverse-bootstrap.md)
- 工具参数总表：[docs/reference/tool-reference.md](docs/reference/tool-reference.md)
- 任务产物说明：[docs/reference/reverse-artifacts.md](docs/reference/reverse-artifacts.md)
- 续跑提示模板：`reverse-update-prompt-template`
- 结果报告模板：`reverse-report-template`

## Artifacts 默认落点

- **源码仓库运行**：默认写到 `<repo>/artifacts/tasks`
- **`npx -y jsreverser-mcp@latest` 运行**：默认写到  
  `~/.local/state/jsreverser-mcp/artifacts/tasks`
- 如果你想自定义，设置：

```bash
export JSREVERSER_ARTIFACTS_DIR=/your/path/artifacts/tasks
```

## 开发与测试

```bash
npm run build
npm run test:unit
npm run test:property
npm run coverage:full
```

## 故障排查

更多问题排查请看：

- [docs/guides/browser-connection.md](docs/guides/browser-connection.md)

## 参考项目

本项目在设计和实现过程中参考了以下项目，具体协议声明（如 MIT 等）以对应上游仓库为准：

- https://github.com/wuji66dde/jshook-skill
- https://github.com/NoOne-hub/JSReverser-MCP
- https://github.com/ChromeDevTools/chrome-devtools-mcp

## License

Apache-2.0
