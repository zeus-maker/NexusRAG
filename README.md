# agentic-rag — 企业级 RAG 3.0 混合架构

以 [RAGFlow](https://github.com/infiniflow/ragflow) 为基座，结合 PageIndex、LLM Wiki 与四分类器路由，实现「复合路由 · 多通道检索 · 持久化记忆 · 混合融合」的新一代企业知识库。

## 仓库结构

```
agentic-rag/
├── CLAUDE.md                 # AI 协作全局规范（必读）
├── rag3-bolt-v1.5/           # 交互原型（mock，只读参考）
├── frontend/rag3-web/        # 生产前端（Vite + React + Tailwind）
├── backend/ragflow_rag30/    # RAG 3.0 后端（RAGFlow 二开）
├── ragflow-0.25.6/           # 上游 RAGFlow 镜像（本地，gitignore）
├── docs/                     # PRD、技术方案、Devlog
└── scripts/                  # 同步/工具脚本
```

## 快速开始

### 前端（对接 mock → API 渐进迁移）

```bash
cd frontend/rag3-web
npm install
npm run dev          # http://localhost:5173
```

### 后端（本地源码）

完整步骤见 **[backend/README.md](./backend/README.md)**（Docker 中间件 + `uv` 依赖 + API / task_executor）。

```bash
# 中间件
cd ragflow-0.25.6/docker && docker compose -f docker-compose-base.yml up -d

# 依赖 + API（见 backend/README.md）
./backend/ragflow_rag30/scripts/install.sh
./backend/ragflow_rag30/scripts/start.sh
```

RAG3 健康检查：`curl http://localhost:9380/v1/rag3/health`

### 原型参考

```bash
cd rag3-bolt-v1.5 && npm install && npm run dev
```

## 文档索引

| 文档 | 说明 |
|------|------|
| [CLAUDE.md](./CLAUDE.md) | 开发规范与目录约定 |
| [docs/tech/5-企业级RAG知识库3.0实现方案.md](./docs/tech/5-企业级RAG知识库3.0实现方案.md) | 架构总纲 |
| [docs/prd/后端逻辑开发方案.md](./docs/prd/后端逻辑开发方案.md) | 后端模块与 API |
| [docs/prd/前端界面实现方案.md](./docs/prd/前端界面实现方案.md) | 前端页面契约 |
| [docs/prd/前端原型实现进度.md](./docs/prd/前端原型实现进度.md) | 原型落地进度 |
| [backend/README.md](./backend/README.md) | 后端二开说明 |

## 上游同步

本地放置官方 RAGFlow 于 `ragflow-0.25.6/` 后：

```bash
./scripts/sync-from-ragflow.sh --dry-run api rag deepdoc
```

## License

后端核心遵循 RAGFlow Apache-2.0；RAG3 扩展模块同仓库发布。
