# CLAUDE.md — RAG 3.0 企业级混合架构（agentic-rag）

本文件为 **全仓库** AI 协作规范。子目录另有专项说明时，以本文件为总纲。

## 项目定位

基于 **RAGFlow 0.25.x** 深度文档理解，扩展 **PageIndex 推理检索**、**LLM Wiki 知识编译**、**四分类器路由** 与 **多通道融合**，实现 RAG 3.0 混合架构。

| 目录 | 角色 | 是否改动 |
|------|------|----------|
| `rag3-bolt-v1.5/` | 交互原型（mock，只读参考） | **禁止修改** |
| `frontend/rag3-web/` | 生产前端（从 bolt 复制，接真实 API） | 主要开发 |
| `backend/ragflow_rag30/` | RAG 3.0 后端（RAGFlow 二开 + 新模块） | 主要开发 |
| `ragflow-0.25.6/` | 上游 RAGFlow 镜像（同步官方用） | **只读**，不直接改 |
| `docs/` | PRD、技术方案、Devlog | 随功能更新 |

权威设计：`docs/tech/5-企业级RAG知识库3.0实现方案.md`、`docs/prd/后端逻辑开发方案.md`、`docs/prd/前端界面实现方案.md`。

## Monorepo 架构

```
用户 → frontend/rag3-web (React+Vite+Tailwind)
         ↓ /api/v1/*
       backend/ragflow_rag30 (Quart/Flask, RAGFlow 入口 api/ragflow_server.py)
         ├─ router/          【RAG3 新增】四分类器 + 路由引擎
         ├─ pipelines/       【RAG3 新增】向量/PageIndex/Graph/Wiki/Tool 五流水线
         ├─ fusion/          【RAG3 新增】RRF + Cross-Encoder
         ├─ security/        【RAG3 新增】块级 ACL、注入防御
         ├─ eval/            【RAG3 新增】RAGAS/DeepEval
         ├─ observability/   【RAG3 新增】Prometheus/OTel
         ├─ rag/ deepdoc/ agent/ graphrag/  【RAGFlow 复用】
         └─ api/apps/rag3_app.py             【RAG3 API 扩展】
```

### 与上游 RAGFlow 同步策略

1. 官方源码放在 `ragflow-0.25.6/`（本地镜像，不入库）。
2. 可复用模块通过 `scripts/sync-from-ragflow.sh` 对比/拷贝到 `backend/ragflow_rag30/`。
3. **修改原则**：在 RAGFlow 文件上打 `[RAG3]` 注释标记扩展点；全新能力放 `router/`、`pipelines/` 等独立包，避免大面积改 upstream 文件。
4. `backend/ragflow_rag30/src/` 为历史 RAGFlow Web 前端残留，**新 UI 一律用 `frontend/rag3-web`**，勿再改 `src/`。

## 前端规范（frontend/rag3-web）

- 技术栈：React 18 + TypeScript + Vite + Tailwind；暗色设计系统见 `rag3-bolt-v1.5` 原型。
- 原型对照：`docs/prd/前端原型实现进度.md`；页面契约：`docs/prd/前端界面实现方案.md`。
- API：统一走 `src/services/api.ts`；开发时代理到 `http://localhost:9380`（RAGFlow 默认端口）。
- 替换 mock：按模块将 `src/data/*Mock.ts` 逐步换为 API 调用；保留 mock 作 Storybook/离线演示。`VITE_USE_REAL_API=true` 时知识库管理已接 `/v1/datasets/*`。
- 命名：页面组件 `*Page.tsx`；Hub 页 `pages/Hub/`；系统子导航对齐 `SystemSubNav`。
- 语言：UI 中文为主；代码与 commit 中文 subject。

## 后端规范（backend/ragflow_rag30）

- Python 3.11+；入口 `api/ragflow_server.py`；新 API 遵循 `api/apps/*_app.py` 自动注册（`@manager.route`）。
- RAG3 查询主路径：`router` → `pipelines`（并行）→ `fusion` → 生成；权限在 `security/chunk_acl` 各通道出口过滤。
- 配置：`conf/service_conf.yaml` + 环境变量；RAG3 段见 `docs/prd/后端逻辑开发方案.md` §1.4。
- 测试：`pytest`；lint：`ruff`（与 RAGFlow 一致）。
- 本地源码启动：见 `backend/README.md`（Docker 中间件 + `ragflow_rag30` 内 `uv sync` + API/task_executor）。

## 通用开发原则

1. **最小 diff**：只改任务相关文件；不重构无关模块。
2. **契约优先**：先对齐 PRD/API 文档再写代码。
3. **原型不动**：`rag3-bolt-v1.5` 仅作 UX 参考，功能在 `frontend/rag3-web` 实现。
4. **Devlog**：代码/配置变更收尾写 `docs/devlog/YYYY-MM-DD-*.md` 并 commit（见 `.cursor/rules/devlog.mdc`）。
5. **验证**：前端 `npm run build`；后端至少 `ruff check` 新增模块。

## 常用命令

```bash
# 前端
cd frontend/rag3-web && npm install && npm run dev

# 前端构建
cd frontend/rag3-web && npm run build

# 后端 RAG3 模块语法检查
cd backend/ragflow_rag30 && ruff check router pipelines fusion api/apps/rag3_app.py

# 对比上游（需本地 ragflow-0.25.6）
./scripts/sync-from-ragflow.sh --dry-run api rag deepdoc
```

## 关键 API 前缀（RAG3 扩展）

| 路径 | 说明 |
|------|------|
| `/v1/rag3/query` | 分类器路由 + 多通道检索 + 融合（核心） |
| `/v1/rag3/classify` | 仅四分类器调试 |
| `/v1/rag3/health` | RAG3 模块健康检查 |

RAGFlow 原有 API 保持 `/v1/*` 不变，前端通过适配层逐步迁移。
