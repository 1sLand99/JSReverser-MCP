# JSReverser-MCP

[English README](README.en.md)

一个把前端 JavaScript 逆向流程标准化的 MCP 服务。  
目标不是只做页面调试，而是把页面观察、运行时采样、本地复现、补环境和证据沉淀串成一套可复用工作流。

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

### 参数工作流知识库

- 主入口：[docs/knowledge/parameter-workflows/](docs/knowledge/parameter-workflows/)
- 模板规范：[docs/reference/parameter-workflow-template.md](docs/reference/parameter-workflow-template.md)
- 贡献指南：[docs/guides/parameter-workflow-contribution.md](docs/guides/parameter-workflow-contribution.md)
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

### 页面状态与运行前检查

补看页面运行状态、控制台输出和本地状态依赖。

- `check_browser_health`：检查浏览器连接和当前页是否可控，适合作为起手验证。
- `console_message`：统一查看 console 输出，支持 `action=list` 和 `action=get`。
- `get_storage`：读取 cookie、`localStorage`、`sessionStorage`，确认状态依赖。
- `evaluate_script`：在当前选中 frame 内执行一段函数，做小范围运行时验证。
- `search_in_sources`：在所有已加载源码中搜索关键字，快速缩小可疑代码范围。

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
- `diff_env_requirements`：根据报错和观测能力比对当前缺失的环境能力。
- `record_reverse_evidence`：把关键观察结果写入 task artifact，避免证据只留在对话里。

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
- 可选增强：`detect_crypto`、`analyze_target`、`risk_panel`、`deobfuscate_code`
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
- 参数工作流知识库：[docs/knowledge/parameter-workflows/](docs/knowledge/parameter-workflows/)
- 参数工作流贡献：[docs/guides/parameter-workflow-contribution.md](docs/guides/parameter-workflow-contribution.md)
- 工作流入口：[docs/reference/reverse-bootstrap.md](docs/reference/reverse-bootstrap.md)
- 工具参数总表：[docs/reference/tool-reference.md](docs/reference/tool-reference.md)
- 任务产物说明：[docs/reference/reverse-artifacts.md](docs/reference/reverse-artifacts.md)
- 续跑提示模板：`reverse-update-prompt-template`
- 结果报告模板：`reverse-report-template`

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
