# reverse task 自动化编排

这份文档说明 `orchestrate_reverse_task` / `--orchestrateReverseTask` 的职责、执行方式、checkpoint 行为，以及它和 `codex --resume` 的边界。

## 适用场景

当你已经有一个 `taskId`，并且希望系统按逆向阶段自动决定下一批步骤时，用它。

它适合：

- 先同步 task 状态，再生成下一批步骤
- 直接串行执行 `manage_reverse_task`、`export_rebuild_bundle`、`diff_env_requirements` 等标准步骤
- 失败后从 checkpoint 续跑，而不是重新手工拼步骤

只想查状态时，优先继续用 `manage_reverse_task`。

## 生命周期

一次 orchestration 通常包含 4 个阶段：

1. 读取 task artifact 与最近 evidence
2. 通过 `manage_reverse_task` 同步阶段 / 状态 / 下一步
3. 生成 `plannedSteps`
4. 可选执行 `plannedSteps`，并把结果写回 checkpoint

执行结果会落到 task 目录下的 `orchestration-checkpoint.json`，用于后续 `resume=true` 或 CLI `--resume`。

## `manage_reverse_task` 和 `orchestrate_reverse_task` 的区别

- `manage_reverse_task`：单步 task 管理入口，适合 `list/get/summarize/progress/update/timeline`
- `orchestrate_reverse_task`：编排入口，适合“先判断下一步，再批量执行标准步骤”

建议分工：

- 日常查看状态：`manage_reverse_task`
- 想减少 tool 选择、按阶段连续推进：`orchestrate_reverse_task`

## `record_reverse_evidence` 在这套流程里的作用

`record_reverse_evidence` 不是另一个编排器，它的作用是把本轮观察写回 task artifact，避免关键信息只留在对话里。

典型用途：

- 记录 hook / network / script 的关键命中
- 给后续 `manage_reverse_task summarize` / `progress` 提供稳定输入
- 让下次 `orchestrate_reverse_task` 规划时能复用已沉淀证据

可以把它理解成“证据落盘”，而 `orchestrate_reverse_task` 负责“决定下一步并执行”。

## MCP 调用方式

只做规划，不立即执行：

```json
{
  "taskId": "task-001"
}
```

生成步骤并直接执行：

```json
{
  "taskId": "task-001",
  "execute": true,
  "includeSummary": true,
  "persistState": true
}
```

从上次失败步骤续跑：

```json
{
  "taskId": "task-001",
  "execute": true,
  "resume": true
}
```

遇到错误继续跑后续步骤：

```json
{
  "taskId": "task-001",
  "execute": true,
  "stopOnError": false
}
```

只执行指定步骤：

```json
{
  "taskId": "task-001",
  "execute": true,
  "onlySteps": ["understand_code"]
}
```

从指定步骤开始：

```json
{
  "taskId": "task-001",
  "execute": true,
  "fromStep": "diff_env_requirements"
}
```

跳过某一步继续跑：

```json
{
  "taskId": "task-001",
  "execute": true,
  "skipSteps": ["export_rebuild_bundle"]
}
```

## CLI 调用方式

只生成当前任务的编排结果：

```bash
node build/src/index.js --orchestrateReverseTask task-001
```

直接执行并把状态写回 artifact：

```bash
node build/src/index.js --orchestrateReverseTask task-001 --execute --includeSummary --persistState
```

从 checkpoint 续跑：

```bash
node build/src/index.js --orchestrateReverseTask task-001 --execute --resume
```

失败后不中断整批步骤：

```bash
node build/src/index.js --orchestrateReverseTask task-001 --execute --stopOnError=false
```

注入步骤级 override，适合测试、演示或临时跳过尚未实现的执行器：

```bash
node build/src/index.js   --orchestrateReverseTask task-001   --execute   --resume   --executionOverrides '{"inject_hook":{"status":"ok","result":"done"}}'
```

## CLI cheatsheet

最常抄的几条命令：

```bash
# 只看当前编排建议
node build/src/index.js --orchestrateReverseTask task-001

# 直接执行
node build/src/index.js --orchestrateReverseTask task-001 --execute

# 从失败点续跑
node build/src/index.js --orchestrateReverseTask task-001 --execute --resume

# 不中断，尽量跑完整批步骤
node build/src/index.js --orchestrateReverseTask task-001 --execute --stopOnError=false

# 执行后顺带返回 summary
node build/src/index.js --orchestrateReverseTask task-001 --execute --includeSummary

# 只执行某一个步骤
node build/src/index.js --orchestrateReverseTask task-001 --execute --onlyStep understand_code

# 从指定步骤开始
node build/src/index.js --orchestrateReverseTask task-001 --execute --fromStep diff_env_requirements

# 跳过某一步
node build/src/index.js --orchestrateReverseTask task-001 --execute --skipStep export_rebuild_bundle
```

## checkpoint 与失败分类

执行阶段会为每个 step 记录：

- 失败时还会返回 recovery 建议，包括 `recommendedNextAction`、`recommendedCommand`、`shouldResume`、`shouldInspectSummary`

- `status`
- `startedAt` / `finishedAt`
- `failureType`
- `retryable`
- `retryCount`
- `lastErrorAt`

当前失败分类包括：

| failureType | 常见含义 | 默认 retryable | 典型例子 |
| --- | --- | --- | --- |
| `tool_error` | 执行器未实现或工具侧失败 | `true` | `not implemented` |
| `env_error` | 本地补环境缺失 | `true` | `window is not defined` / `localStorage is not defined` |
| `validation_error` | 参数或输入不合法 | `false` | `invalid` / `required` |
| `external_error` | 外部依赖或浏览器链路异常 | `true` | `timed out` / `fetch failed` / `browser failed` |
| `unknown` | 目前规则未命中的异常 | `false` | 其他未分类错误 |

这让你可以快速判断：

- 是工具未实现 / 参数错误
- 还是页面环境缺失
- 还是外部依赖超时
- 以及该失败是否适合重试

## `executionOverrides` 有什么用

`executionOverrides` 的优先级高于真实执行器，主要用于：

- 在测试里稳定复现某一步成功 / 失败
- 某个 adapter 尚未实现时，先占位打通整体编排
- 演示流程时跳过昂贵或依赖真实浏览器上下文的步骤

注意：它更适合测试、回放、过渡期接线，不建议长期替代真实执行器。

## 和 `codex --resume` 会不会冲突

不会，二者恢复的层级不同：

- `codex --resume`：恢复 Codex CLI 自己的会话上下文
- `orchestrate_reverse_task resume=true` / `--resume`：恢复某个 reverse task 的执行 checkpoint

推荐组合：

1. 先用 `codex --resume` 回到之前的工作会话
2. 再执行 `--orchestrateReverseTask <taskId> --execute --resume`
3. 这样既保留会话上下文，也从 task 的失败步骤继续跑

换句话说，前者恢复“你和 Codex 的对话现场”，后者恢复“task artifact 的执行现场”。

## 实践建议

- 首次跑编排时保留 `stopOnError=true`，先让第一处失败暴露出来
- 需要批量收集更多失败信号时，再改成 `--stopOnError=false`
- 对真实任务建议保留 `persistState=true`
- 续跑前先看一次 `manage_reverse_task summarize`，确认 task 目标没有漂移
- 如果步骤规划本身需要重算，先不要 `resume=true`，而是重新做一次 fresh orchestration
