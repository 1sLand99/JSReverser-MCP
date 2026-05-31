# Case Index

仓库内公开的参数 / 链路沉淀入口正在从 `scripts/cases/` 逐步迁移到 `docs/knowledge/parameter-blueprints/`。

这里仅保留抽象 case、方法论和验收口径，不放可直接复用的完整实现代码。

## 迁移状态

- **新主入口**：`docs/knowledge/parameter-blueprints/`
- **当前状态**：`scripts/cases/*` 仍保留兼容索引，后续会逐步退场
- **新增公开 workflow**：优先写入 `docs/knowledge/parameter-blueprints/`
- **旧 case**：作为过渡参考保留，待知识库与文档引用全部切换后再逐步删除

## 已公开链路

> 通用模板与参数级旧 case 已迁移到 `docs/knowledge/parameter-blueprints/`。
>
> **参数级旧 case 已全部退役**，本目录现在只保留迁移说明，避免旧入口继续分散维护。

## 字段规范

- 参数蓝图统一放在 `docs/knowledge/parameter-blueprints/<id>/`
- 每个参数蓝图至少包含：
  - `metadata.json`
  - `parts.json`
  - `mutations.json`
  - `workflow.md`

## 使用约束

- 新会话先读：`docs/reference/reverse-bootstrap.md`
- 读取优先级：先读本地 `artifacts/tasks/<task-id>/`，再读这里的抽象 case
- 如果新增公开参数 / 链路入口，统一更新本文件；迁移期内同时优先更新 `docs/knowledge/parameter-blueprints/`
- 推荐顺序：先看参数蓝图中的 `parts.json` / `mutations.json`，再看 `workflow.md`
- 真实 page/api host 不直写；统一用 Base64 文本保存，推荐字段名为 `entry_url_b64` 或 `api_host_b64`，并在使用前先解码
- 可执行脚本和真实任务产物默认保留在本地 `artifacts/tasks/<task-id>/`
- 仓库内不提交真实 Cookie、Storage、可直接复用的生产参数组合

更多工具入口请看：

- [docs/knowledge/parameter-blueprints/](../../docs/knowledge/parameter-blueprints/)
- [docs/reference/reverse-bootstrap.md](../../docs/reference/reverse-bootstrap.md)
- [docs/reference/reverse-task-index.md](../../docs/reference/reverse-task-index.md)
- [docs/reference/tool-reference.md](../../docs/reference/tool-reference.md)
- [docs/reference/case-safety-policy.md](../../docs/reference/case-safety-policy.md)
