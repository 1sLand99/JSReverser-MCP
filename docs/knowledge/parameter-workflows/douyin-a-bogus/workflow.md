# Douyin a_bogus Workflow

## 适用范围

- 目标请求中出现 `a_bogus`
- 常见于 query 参数签名、资源列表或页面数据拉取链路
- 需要区分 query 写点和 send-time patch

## 识别特征

- 请求里常伴随 `msToken`、`webid`、route query 字段
- `search_in_scripts` 能命中 `a_bogus`、`bdms`、`secsdk`、`sdk-glue`
- 写点可能发生在 `URLSearchParams.append/set` 或发送前补丁路径

## 前置输入

- 一条成功的 resource-list 请求样本
- 已确认目标 API 与 query 字段
- 页面可用 hook、network、script 工具

## 分阶段流程

### 1. Request Identify

- 找到携带 `a_bogus` 的成功请求
- 固定 query、headers、companion fields、返回结果

### 2. Initiator Chain

- 用 `get_request_initiator` 回溯到 runtime loader 与 security bundle
- 记录 business entry -> runtime.js -> sdk-glue.js -> secsdk -> bdms 等链路

### 3. Write Point / Send-Time Patch

- hook `URLSearchParams.append/set`
- hook `XMLHttpRequest.open/send`
- 判断是请求构造时写入，还是发送前二次补丁

### 4. Source Correlation

- 搜索 `a_bogus`、`resource/list`、send-time helper
- 确认 query 归一化和 patch helper 所在 bundle

### 5. Local Rebuild

- 在 `artifacts/tasks/<task-id>/run/` 搭最小 host
- 只补 `window/document/navigator/location/history/screen/storage/crypto/fetch/XMLHttpRequest`

### 6. Portable Runtime / Pure Extraction Gate

- 先导出 portable runtime
- 只有在 env-pass 且服务端校验通过后，再进入纯算法提取

## 常见分叉

- `msToken` / `webid` 来源未确认
- query 归一化顺序不同
- `location` / `URL` brand check 导致本地 host 崩溃
- send-time patch 漏抓，导致本地只复现到半链路

## 最小 artifacts 契约

- `request-summary.json`
- `network.jsonl`
- `scripts.jsonl`
- `hooks.jsonl`
- `notes.md`
- `divergence.md`
- `run/exported-runtime.js`

## 成功判定

- 已确认 `a_bogus` 写点或 send-time patch 点
- 本地 signer 能生成非空 `a_bogus`
- 生成请求可通过目标资源请求校验

## 禁止事项

- 不提交完整 signer 实现
- 不把真实请求值、私有 cookie、task-local runtime 直接放进公开 workflow
- 不在 env-pass 前直接跳 pure extraction
