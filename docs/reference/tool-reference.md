<!-- AUTO GENERATED DO NOT EDIT - run 'npm run docs' to update-->

# Chrome DevTools MCP Tool Reference

> 快速按逆向目标查工具，请先看：[`docs/reference/reverse-task-index.md`](./reverse-task-index.md)

- **[Navigation automation](#navigation-automation)** (14 tools)
  - [`check_browser_health`](#check_browser_health)
  - [`click_element`](#click_element)
  - [`diagnose_environment`](#diagnose_environment)
  - [`find_clickable_elements`](#find_clickable_elements)
  - [`get_dom_structure`](#get_dom_structure)
  - [`get_performance_metrics`](#get_performance_metrics)
  - [`list_pages`](#list_pages)
  - [`navigate_page`](#navigate_page)
  - [`new_page`](#new_page)
  - [`query_dom`](#query_dom)
  - [`select_page`](#select_page)
  - [`session_state`](#session_state)
  - [`type_text`](#type_text)
  - [`wait_for_element`](#wait_for_element)
- **[Network](#network)** (5 tools)
  - [`analyze_websocket_messages`](#analyze_websocket_messages)
  - [`get_websocket_message`](#get_websocket_message)
  - [`get_websocket_messages`](#get_websocket_messages)
  - [`list_websocket_connections`](#list_websocket_connections)
  - [`network_request`](#network_request)
- **[Debugging](#debugging)** (4 tools)
  - [`console_message`](#console_message)
  - [`evaluate_script`](#evaluate_script)
  - [`inject_preload_script`](#inject_preload_script)
  - [`take_screenshot`](#take_screenshot)
- **[JS Reverse Engineering](#js-reverse-engineering)** (53 tools)
  - [`analyze_target`](#analyze_target)
  - [`breakpoint`](#breakpoint)
  - [`collect_code`](#collect_code)
  - [`collection_diff`](#collection_diff)
  - [`create_hook`](#create_hook)
  - [`create_reverse_task_from_request`](#create_reverse_task_from_request)
  - [`deobfuscate_code`](#deobfuscate_code)
  - [`detect_crypto`](#detect_crypto)
  - [`evaluate_on_callframe`](#evaluate_on_callframe)
  - [`explain_reverse_stage`](#explain_reverse_stage)
  - [`export_session_report`](#export_session_report)
  - [`find_in_script`](#find_in_script)
  - [`get_hook_data`](#get_hook_data)
  - [`get_parameter_workflow`](#get_parameter_workflow)
  - [`get_paused_info`](#get_paused_info)
  - [`get_reference`](#get_reference)
  - [`get_reference_route`](#get_reference_route)
  - [`get_request_initiator`](#get_request_initiator)
  - [`get_script_source`](#get_script_source)
  - [`get_storage`](#get_storage)
  - [`hook_function`](#hook_function)
  - [`inject_hook`](#inject_hook)
  - [`inject_stealth`](#inject_stealth)
  - [`inspect_object`](#inspect_object)
  - [`list_hooks`](#list_hooks)
  - [`list_parameter_workflows`](#list_parameter_workflows)
  - [`list_scripts`](#list_scripts)
  - [`list_stealth_features`](#list_stealth_features)
  - [`list_stealth_presets`](#list_stealth_presets)
  - [`manage_reverse_task`](#manage_reverse_task)
  - [`monitor_events`](#monitor_events)
  - [`orchestrate_reverse_task`](#orchestrate_reverse_task)
  - [`pause`](#pause)
  - [`recommend_next_step`](#recommend_next_step)
  - [`recommend_parameter_workflow`](#recommend_parameter_workflow)
  - [`record_reverse_evidence`](#record_reverse_evidence)
  - [`remove_hook`](#remove_hook)
  - [`resume`](#resume)
  - [`risk_panel`](#risk_panel)
  - [`search_in_scripts`](#search_in_scripts)
  - [`search_in_sources`](#search_in_sources)
  - [`set_breakpoint_on_text`](#set_breakpoint_on_text)
  - [`set_user_agent`](#set_user_agent)
  - [`start_reverse_task`](#start_reverse_task)
  - [`step_into`](#step_into)
  - [`step_out`](#step_out)
  - [`step_over`](#step_over)
  - [`stop_monitor`](#stop_monitor)
  - [`summarize_code`](#summarize_code)
  - [`trace_function`](#trace_function)
  - [`understand_code`](#understand_code)
  - [`unhook_function`](#unhook_function)
  - [`xhr_breakpoint`](#xhr_breakpoint)

## Navigation automation

### `check_browser_health`

**Description:** Check browser connectivity and active page readiness before running reverse workflows.

**Parameters:**

- `pageIdx`

### `click_element`

**Description:** Click an element by selector.

**Parameters:**

- `pageIdx`
- `selector`

### `diagnose_environment`

**Description:** Run static environment diagnostics for startup, AI provider setup, and artifact output paths.

### `find_clickable_elements`

**Description:** Find clickable buttons/links, optionally filtered by text.

**Parameters:**

- `pageIdx`
- `filterText`

### `get_dom_structure`

**Description:** Get DOM tree structure for current page.

**Parameters:**

- `pageIdx`
- `maxDepth`
- `includeText`

### `get_performance_metrics`

**Description:** Get page performance metrics from Performance API.

**Parameters:**

- `pageIdx`

### `list_pages`

**Description:** Get a list of pages open in the browser.

### `navigate_page`

**Description:** Navigates the currently selected page to a URL, or performs back/forward/reload navigation. Waits for DOMContentLoaded event (not full page load). Default timeout is 10 seconds.

**Parameters:**

- `pageIdx`
- `type`
- `url`
- `ignoreCache`
- `timeout`

### `new_page`

**Description:** Creates a new page and navigates to the specified URL. Waits for DOMContentLoaded event (not full page load). Default timeout is 10 seconds.

**Parameters:**

- `url`
- `timeout`

### `query_dom`

**Description:** Query one or multiple elements by CSS selector.

**Parameters:**

- `pageIdx`
- `selector`
- `all`
- `limit`

### `select_page`

**Description:** Select a page as a context for future tool calls.

**Parameters:**

- `pageIdx`

### `session_state`

**Description:** Manage in-memory session snapshots: save, restore, list, delete, dump, or load.

**Parameters:**

- `action`
- `pageIdx`
- `sessionId`
- `includeCookies`
- `includeLocalStorage`
- `includeSessionStorage`
- `navigateToSavedUrl`
- `clearStorageBeforeRestore`
- `path`
- `pretty`
- `encrypt`
- `snapshotJson`
- `overwrite`

### `type_text`

**Description:** Type text into an input element.

**Parameters:**

- `pageIdx`
- `selector`
- `text`
- `delay`

### `wait_for_element`

**Description:** Wait for selector to appear.

**Parameters:**

- `pageIdx`
- `selector`
- `timeout`

## Network

### `analyze_websocket_messages`

**Description:** Group WebSocket messages by pattern/fingerprint and return stats plus sample indices for each type.

**Parameters:**

- `wsid`
- `direction`
- `targetPageIdx`

### `get_websocket_message`

**Description:** Gets a single WebSocket message by its frame index. Use get_websocket_messages or analyze_websocket_messages first to find the frame index.

**Parameters:**

- `wsid`
- `frameIndex`
- `targetPageIdx`

### `get_websocket_messages`

**Description:** Gets messages for a WebSocket connection. IMPORTANT: For binary/protobuf messages (like live streaming), use analyze_websocket_messages FIRST to understand message types, then use groupId parameter to filter specific types. Default mode shows summary only.

**Parameters:**

- `wsid`
- `direction`
- `groupId`
- `pageSize`
- `pageIdx`
- `targetPageIdx`
- `show_content`

### `list_websocket_connections`

**Description:** List all WebSocket connections. After getting wsid, use analyze_websocket_messages(wsid) FIRST to understand message patterns before viewing individual messages.

**Parameters:**

- `pageSize`
- `pageIdx`
- `targetPageIdx`
- `urlFilter`
- `includePreservedConnections`

### `network_request`

**Description:** List network requests, or get one request by reqid.

**Parameters:**

- `action`
- `reqid`
- `pageSize`
- `pageIdx`
- `targetPageIdx`
- `resourceTypes`
- `includePreservedRequests`

## Debugging

### `console_message`

**Description:** List console messages, or get one message by msgid.

**Parameters:**

- `action`
- `msgid`
- `targetPageIdx`
- `pageSize`
- `pageIdx`
- `types`
- `includePreservedMessages`

### `evaluate_script`

**Description:** Evaluate a JavaScript function inside the currently selected page. Returns the response as JSON
so returned values have to JSON-serializable.

**Parameters:**

- `pageIdx`
- `function`

### `inject_preload_script`

**Description:** Register a JavaScript snippet that will run on future document loads before page scripts execute. Use this for preload hooks, environment patches, and early instrumentation.

**Parameters:**

- `script`

### `take_screenshot`

**Description:** Take a screenshot of the page or element.

**Parameters:**

- `pageIdx`
- `format`
- `quality`
- `fullPage`
- `filePath`

## JS Reverse Engineering

### `analyze_target`

**Description:** One-shot reverse workflow: collect code, run security/crypto analysis, optional deobfuscation, and hook timeline correlation.

**Parameters:**

- `url`
- `topN`
- `useAI`
- `runDeobfuscation`
- `hookPreset`
- `autoInjectHooks`
- `waitAfterHookMs`
- `correlationWindowMs`
- `maxCorrelatedFlows`
- `maxFingerprints`
- `autoReplayActions`
- `collect`

### `breakpoint`

**Description:** Manage JavaScript breakpoints: set, remove, or list active breakpoints.

**Parameters:**

- `action`
- `pageIdx`
- `url`
- `lineNumber`
- `columnNumber`
- `condition`
- `isRegex`
- `breakpointId`

### `collect_code`

**Description:** Collect JavaScript code from a page with smart modes (summary/priority/incremental/full).

**Parameters:**

- `url`
- `smartMode`
- `returnMode`
- `includeInline`
- `includeExternal`
- `includeDynamic`
- `maxTotalSize`
- `maxFileSize`
- `pattern`
- `limit`
- `topN`

### `collection_diff`

**Description:** Compare previous and current collected file summaries.

**Parameters:**

- `previous`
- `current`
- `includeUnchanged`

### `create_hook`

**Description:** RECOMMENDED: Create hook script for function/fetch/xhr/property/cookie/websocket/eval/timer. Hooks run without pausing page execution and are the preferred approach over breakpoints for monitoring and interception.

**Parameters:**

- `type`
- `params`
- `description`
- `action`

### `create_reverse_task_from_request`

**Description:** Create a reverse task directly from one captured network request.

**Parameters:**

- `requestId`
- `targetPageIdx`
- `taskId`
- `taskSlug`
- `goal`

### `deobfuscate_code`

**Description:** AI-assisted JavaScript deobfuscation.

**Parameters:**

- `code`
- `aggressive`
- `renameVariables`

### `detect_crypto`

**Description:** Detect cryptographic algorithms/libraries from JavaScript source.

**Parameters:**

- `code`
- `useAI`

### `evaluate_on_callframe`

**Description:** Evaluates a JavaScript expression in the context of a specific call frame while paused. This allows you to inspect variables and execute code in the paused scope.

**Parameters:**

- `expression`
- `frameIndex`

### `explain_reverse_stage`

**Description:** Explain a reverse-engineering stage with goals, entry criteria, avoid list, and recommended tools.

**Parameters:**

- `stage`
- `includeDocs`

### `export_session_report`

**Description:** Export current reverse-engineering session as JSON or Markdown.

**Parameters:**

- `format`
- `includeHookData`

### `find_in_script`

**Description:** Finds a string in a specific script and returns its exact line/column position with surrounding context. Ideal for setting breakpoints in minified files where the entire code is on one line.

**Parameters:**

- `pageIdx`
- `scriptId`
- `query`
- `contextChars`
- `occurrence`
- `caseSensitive`

### `get_hook_data`

**Description:** Get captured data for one hook or all hooks. Supports raw view and summary view for noise reduction.

**Parameters:**

- `hookId`
- `view`
- `maxRecords`

### `get_parameter_workflow`

**Description:** Get one packaged parameter workflow by id or alias.

**Parameters:**

- `id`

### `get_paused_info`

**Description:** Gets information about the current paused state including call stack, current location, and scope variables. Use this after a breakpoint is hit to understand the execution context.

**Parameters:**

- `pageIdx`
- `includeScopes`
- `maxScopeDepth`

### `get_reference`

**Description:** Read one packaged reference doc, or return its compact summary.

**Parameters:**

- `mode`
- `docId`
- `maxSections`

### `get_reference_route`

**Description:** Route by stage, topic, or natural-language query to the most relevant reference docs.

**Parameters:**

- `mode`
- `stage`
- `topic`
- `query`

### `get_request_initiator`

**Description:** Gets the JavaScript call stack that initiated a network request. This helps trace which code triggered an API call.

**Parameters:**

- `requestId`
- `pageIdx`
- `taskId`
- `taskSlug`
- `targetUrl`
- `goal`

### `get_script_source`

**Description:** Gets the source code of a JavaScript script by its script ID. Supports line range (for normal files) or character offset (for minified single-line files). Use list_scripts first to find the script ID.

**Parameters:**

- `pageIdx`
- `scriptId`
- `startLine`
- `endLine`
- `offset`
- `length`

### `get_storage`

**Description:** Gets browser storage data including cookies, localStorage, and sessionStorage.

**Parameters:**

- `pageIdx`
- `type`
- `filter`

### `hook_function`

**Description:** Recommended default for reverse engineering: hook a function and log calls/args/results without pausing execution.

**Parameters:**

- `pageIdx`
- `target`
- `logArgs`
- `logResult`
- `logStack`
- `hookId`

### `inject_hook`

**Description:** Inject an existing hook into the current page.

**Parameters:**

- `hookId`

### `inject_stealth`

**Description:** Inject anti-detection stealth scripts to current page.

**Parameters:**

- `preset`

### `inspect_object`

**Description:** Deeply inspects a JavaScript object, showing its properties, prototype chain, and methods. Useful for understanding object structure.

**Parameters:**

- `expression`
- `depth`
- `showMethods`
- `showPrototype`

### `list_hooks`

**Description:** Lists all active function hooks.

### `list_parameter_workflows`

**Description:** List packaged parameter workflows that can guide reverse-engineering and rebuild steps.

### `list_scripts`

**Description:** Lists all JavaScript scripts loaded in the current page. Returns script ID, URL, and source map information. Use this to find scripts before setting breakpoints or searching.

**Parameters:**

- `pageIdx`
- `filter`

### `list_stealth_features`

**Description:** List available stealth feature toggles.

### `list_stealth_presets`

**Description:** List available stealth presets.

### `manage_reverse_task`

**Description:** Unified reverse task entry for list/get/summarize/progress/update/timeline/archive/restore/search/tag/prune/compare actions. Preferred task-management entry to reduce tool-selection overhead.

**Response note:** Returns `agentGuidance` for agent-ready next-step hints, including `recommendedStrategy`, plus `artifacts` for the main task files touched/read by the action. Also exposes top-level `responseSummary`, `diagnostics`, `outcome`, `shouldResume`, `shouldSwitchStrategy`, `nextBestTool`, and `nextBestParams` for agent callers. Some actions also enforce action-specific validation such as `search => query|tag`, `tag => tags`, and `update => at least one mutable field`.

**Parameters:**

- `action`
- `taskId`
- `otherTaskId`
- `outputMode`
- `limit`
- `timelineLimit`
- `evidenceLimit`
- `includeArchived`
- `query`
- `tag`
- `tags`
- `replaceTags`
- `pruneOlderThanDays`
- `taskSlug`
- `targetUrl`
- `goal`
- `currentStage`
- `status`
- `currentSummary`
- `nextStepHint`
- `successCriteria`
- `stage`
- `timelineAction`
- `timelineStatus`
- `result`
- `next`
- `detail`

### `monitor_events`

**Description:** Monitors DOM events on a specified element or window. Events will be logged to console.

**Parameters:**

- `selector`
- `events`
- `monitorId`
- `taskId`
- `taskSlug`
- `targetUrl`
- `goal`

### `orchestrate_reverse_task`

**Description:** High-level reverse-task orchestrator that syncs task state, picks the primary next step, and returns a compact execution plan.

**Response note:** Returns `agentGuidance` with a recommended next tool / params / strategy / resume hint, plus top-level `responseSummary`, `diagnostics`, `outcome`, `shouldResume`, `shouldSwitchStrategy`, `nextBestTool`, and `nextBestParams` for low-token continuation.

**Parameters:**

- `taskId`
- `persistState`
- `includeSummary`
- `outputMode`
- `execute`
- `resume`
- `stopOnError`
- `skipSteps`
- `fromStep`
- `onlySteps`
- `strategy`
- `executionOverrides`

**Failure note:** May also return `fallbackPlan` when execution fails and the orchestrator can suggest a safer next path. `fallbackPlan` may include `recommendedStrategy`.

### `get_rebuild_health_report`

**Description:** Produce a compact rebuild health report for one reverse task, including env blockers, evidence aggregates, and next fixes.

**Response note:** Returns `agentGuidance` plus a top-level `recommendedNextAction`, `artifacts`, `responseSummary`, `diagnostics`, `outcome`, `shouldResume`, `shouldSwitchStrategy`, `nextBestTool`, and `nextBestParams`; `agentGuidance.recommendedStrategy` can be used to pick the next orchestration template.

**Parameters:**

- `taskId`
- `outputMode`
- `observedCapabilities`

### `pause`

**Description:** Pauses JavaScript execution at the current point. Use this to interrupt running code.

**Parameters:**

- `pageIdx`

### `recommend_next_step`

**Description:** Recommend the next reverse-engineering action from lightweight workflow signals.

**Parameters:**

- `taskId`
- `browserHealthy`
- `pageReady`
- `taskGoal`
- `currentStage`
- `taskStatus`
- `hasTargetRequest`
- `hookRecordCount`
- `hasRebuildBundle`
- `hasPassingRebuild`
- `firstDivergenceKnown`

### `recommend_parameter_workflow`

**Description:** Recommend the closest packaged parameter workflow from a keyword, alias, or short natural-language query.

**Parameters:**

- `query`

### `record_reverse_evidence`

**Description:** Append structured reverse-engineering evidence to a task artifact log.

**Parameters:**

- `taskId`
- `taskSlug`
- `targetUrl`
- `goal`
- `channel`
- `targetKeywords`
- `targetUrlPatterns`
- `targetFunctionNames`
- `targetActionDescription`
- `entry`

### `remove_hook`

**Description:** Remove a hook by id.

**Parameters:**

- `hookId`

### `resume`

**Description:** Resumes JavaScript execution after being paused at a breakpoint. Execution continues until the next breakpoint or completion.

**Parameters:**

- `pageIdx`

### `risk_panel`

**Description:** Build a combined risk score from analyzer, crypto detector and hook signals.

**Parameters:**

- `code`
- `useAI`
- `includeHookSignals`
- `hookId`
- `topN`

### `search_in_scripts`

**Description:** Search in collected script cache with regex pattern.

**Parameters:**

- `pattern`
- `limit`
- `maxTotalSize`

### `search_in_sources`

**Description:** Searches for a string or regex pattern in all loaded JavaScript sources. Returns matching lines with script ID, URL, and line number. Use get_script_source with startLine/endLine to view full context around matches.

**Parameters:**

- `pageIdx`
- `query`
- `caseSensitive`
- `isRegex`
- `maxResults`
- `maxLineLength`
- `excludeMinified`
- `urlFilter`

### `set_breakpoint_on_text`

**Description:** Sets a breakpoint on specific code (function name, statement, etc.) by searching for it and automatically determining the exact position. Works with both normal and minified files. NOTE: Prefer hook_function for monitoring function calls — it captures args/results without pausing execution. Use this only when you need to inspect local variables at a specific code location.

**Parameters:**

- `pageIdx`
- `text`
- `urlFilter`
- `occurrence`
- `condition`

### `set_user_agent`

**Description:** Set custom user-agent for active page.

**Parameters:**

- `userAgent`

### `start_reverse_task`

**Description:** Initialize a task artifact directory with task.json, state.json, report.md, and first timeline entry.

**Parameters:**

- `taskId`
- `taskSlug`
- `targetUrl`
- `goal`
- `currentStage`
- `currentSummary`
- `successCriteria`
- `targetContext`

### `step_into`

**Description:** Steps into the next function call. Use this to enter and debug function bodies.

**Parameters:**

- `pageIdx`

### `step_out`

**Description:** Steps out of the current function, continuing until the function returns. Use this to quickly exit a function.

**Parameters:**

- `pageIdx`

### `step_over`

**Description:** Steps over to the next statement, treating function calls as a single step. Use this to move through code without entering function bodies.

**Parameters:**

- `pageIdx`

### `stop_monitor`

**Description:** Stops an event monitor.

**Parameters:**

- `monitorId`

### `summarize_code`

**Description:** Summarize one code file, multiple files, or project-level context.

**Parameters:**

- `mode`
- `code`
- `url`
- `files`

### `trace_function`

**Description:** Traces calls to a function by its name in the source code. Works for ANY function including module-internal functions (webpack/rollup bundled). Uses "logpoints" (conditional breakpoints) to log arguments without pausing execution.

**Parameters:**

- `pageIdx`
- `functionName`
- `urlFilter`
- `logArgs`
- `logThis`
- `pause`
- `traceId`
- `taskId`
- `taskSlug`
- `targetUrl`
- `goal`

### `understand_code`

**Description:** Analyze code structure/business/security with AI + static analysis.

**Parameters:**

- `code`
- `focus`

### `unhook_function`

**Description:** Removes a previously installed function hook.

**Parameters:**

- `hookId`

### `xhr_breakpoint`

**Description:** Set or remove an XHR/Fetch breakpoint by URL substring match.

**Parameters:**

- `action`
- `pageIdx`
- `url`
