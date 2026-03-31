# Generic Query Token Workflow

## 适用范围

- query string 中出现 `token`、`sign`、`_signature`、`a_bogus` 等字段
- 参数通常与 URL、body 摘要、时间戳、设备环境共同生成

## 识别特征

- 同一请求重复发起时 query 参数会变化
- 请求发起点附近常见 URL 拼接、编码、排序和摘要逻辑

## 前置输入

- 已定位目标请求
- 至少一份真实请求样本
- 当前页面可被 MCP 观察与 hook

## 分阶段流程

### 1. Request Identify

- 固定一组样本
- 记录 query 各字段及其变化规律

### 2. Locate Builder

- 搜参数名
- 搜 URL builder、router、request wrapper
- 关联请求 initiator

### 3. Hook Capture

- 捕获 query 对象构造前后值
- 记录编码前字符串、排序结果、最终 URL

### 4. Rebuild

- 只重建必要拼接链路
- 明确哪些值来自页面环境，哪些值来自请求输入

### 5. Divergence Check

- 先对比参数输入集合
- 再对比排序、编码、摘要、时间和环境读取

## 常见分叉

- query 排序策略变化
- URL 编码时机不同
- 时间戳或随机数来源不同
- request body/hash 被隐式并入 query sign

## 最小 artifacts 契约

- `request-summary.json`
- `network.jsonl`
- `hooks.jsonl`
- `notes.md`
- `rebuild/input-output.json`

## 成功判定

- 能稳定复算目标 query 参数
- 能指出最早不一致位置
- 能解释字段来源与拼接顺序

## 禁止事项

- 不直接沉淀完整站点实现
- 不跳过 hook 直接手抄压缩逻辑
