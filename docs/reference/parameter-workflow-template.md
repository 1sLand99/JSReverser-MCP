# Parameter Workflow Template

用于新增公开参数工作流时的统一模板。

## 必填文件

- `metadata.json`
- `workflow.md`

## `metadata.json` 必填字段

- `id`
- `title`
- `aliases`
- `keywords`
- `category`
- `status`
- `version`
- `lastUpdated`
- `summary`

## `workflow.md` 建议章节

1. 适用范围
2. 识别特征
3. 前置输入
4. 分阶段流程
5. 常见分叉
6. 最小 artifacts 契约
7. 成功判定
8. 禁止事项

## 禁止内容

- 完整可运行实现
- 站点私有密钥、常量、补丁
- task-local 的敏感环境细节
