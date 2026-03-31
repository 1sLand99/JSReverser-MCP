# JD H5ST Workflow

## 适用范围

- 请求头或参数中出现 `h5st`
- 目标链路依赖时间、环境、请求体摘要、UA、cookie 等多种输入
- 需要优先用页面证据回收参数组成，而不是直接本地猜测

## 识别特征

- `search_in_scripts` 能命中 `h5st`
- 请求发起前存在参数拼接、摘要、编码与环境读取
- 升级后常表现为结果整体不同，但结构仍接近旧链路

## 前置输入

- 至少一份真实请求样本
- 已确认目标接口和参数位置
- 页面可正常调用 hook、network、script 相关工具

## 分阶段流程

### 1. Request Identify

- 固定目标请求样本
- 记录 header、query、body、cookie、时间字段、UA

### 2. Script Locate

- `list_scripts`
- `search_in_scripts` 搜索 `h5st`
- 追请求 initiator 和包装层

### 3. Hook Capture

- 观察请求发送前的参数组装
- 记录原始输入对象、中间串、摘要前文本、最终输出

### 4. Dependency Trace

- 明确哪些依赖来自 cookie、storage、navigator、location、request body
- 未确认来源前不进入纯本地猜测

### 5. Local Rebuild

- 用最小输入重建链路
- 只保留页面证据已确认的依赖

### 6. Upgrade Playbook

- 先复用旧流程
- 再抓新样本
- 对比旧新链路的最早分叉点

## 常见分叉

- 时间精度变化
- body 摘要拼接顺序变化
- header 参与签名的字段集合变化
- cookie / UA / sec-ch-ua 被新增或改位置
- 原有同步链路变成异步摘要链路

## 最小 artifacts 契约

- `request-summary.json`
- `network.jsonl`
- `scripts.jsonl`
- `hooks.jsonl`
- `notes.md`
- `rebuild/input-output.json`
- `divergence.md`

## 成功判定

- 能说明 h5st 的输入边界和中间链路
- 能稳定复算或明确 first divergence
- 能解释升级后差异属于哪一阶段

## 禁止事项

- 不在公开 workflow 中存放 h5st 完整可运行实现
- 不把站点私有 patch、密钥或常量映射写进公共知识库
- 不跳过 request/hook 证据直接硬猜算法
