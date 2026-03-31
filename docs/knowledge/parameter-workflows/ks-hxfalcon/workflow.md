# Kuaishou __NS_hxfalcon Workflow

## 适用范围

- 目标请求中出现 `__NS_hxfalcon`
- 风控链路依赖 VM bridge、`$encode`、cat-version 或 route metadata
- 成功判定不能只看 HTTP 200，必须看业务返回

## 识别特征

- 同时能抓到 weak-check 与 strict-check 请求
- initiator 链上常出现 VM 对象、`Ee.call("$encode", ...)`、callback bridge
- 严格校验接口比弱校验接口更能暴露链路缺失

## 前置输入

- 一组 weak-check 请求样本
- 一组 strict-check 请求样本
- 已确认页面中可观察到 VM bridge、请求 patch 时机

## 分阶段流程

### 1. Dual Sample Capture

- 同时记录 weak-check 与 strict-check 请求
- 带上 response body preview，后续做 A/B 校验

### 2. Initiator / VM Bridge Locate

- 回溯到 VM bridge 调用点
- 确认 encoder wrapper、cat-version 读取路径、callback 形式

### 3. Hook Encode Path

- 观察 payload before encode
- 记录 VM bridge 参数、callback wiring、最终 sign 写入点

### 4. Source Correlation

- 搜索 `$encode`、`__NS_hxfalcon`、cat-version
- 对比 weak-check 与 strict-check 是否走同一编码路径

### 5. Local Rebuild

- 只补最小 host：`window/document/navigator/storage/performance`
- 重点修复 VM host 方法、storage/performance 读取和 callback 差异

### 6. Strict-Check Acceptance

- 必须用 strict-check 作为主验收
- weak-check 只能作为早期路径验证，不可单独视为通过

### 7. Pure Extraction Gate

- strict-check 已通过后，才进入 portable runtime / pure runtime

## 常见分叉

- weak-check 通过但 strict-check 失败
- cat-version 改变 payload 形状或 signer 分支
- VM bridge 是 callback/async，但本地按 sync 处理
- storage/performance 依赖未补全

## 最小 artifacts 契约

- `request-summary.json`
- `network.jsonl`
- `scripts.jsonl`
- `hooks.jsonl`
- `notes.md`
- `divergence.md`
- `report.md`

## 成功判定

- 已确认 VM bridge 调用形状
- 本地 signer 可生成候选 `__NS_hxfalcon`
- strict-check 返回 `result=1` 且 `hasData=true`

## 禁止事项

- 不以 weak-check 单独通过作为最终结论
- 不提交完整 VM/encoder 实现
- 不在 strict-check 通过前直接讨论纯算法迁移
