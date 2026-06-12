# NexusRAG · rag3-web

NexusRAG 生产前端（[`../../README.md`](../../README.md)）。

从 [`web/rag3-bolt-v1.5`](../web/rag3-bolt-v1.5) 复制演进，**唯一前端开发入口**。页面契约见 [`docs/prd/前端界面实现方案.md`](../../docs/prd/前端界面实现方案.md)。

技术栈：React 18 · TypeScript · Vite · Tailwind · 无 React Router（`store.ts` 页面 state + Hash 深链）。

---

## 开发

```bash
npm install
cp .env.example .env.local
npm run dev    # http://localhost:5173
```

Vite 将 `/api/*` 代理到 RAGFlow（默认 `http://localhost:9380`）。

### 环境变量（`.env.local`）

| 变量 | 说明 |
|------|------|
| `VITE_USE_REAL_API=true` | 启用真实 API（推荐本地联调） |
| `VITE_PROXY_TARGET` | 开发代理目标，默认 `http://localhost:9380` |
| `VITE_RAGFLOW_AUTH_TOKEN` | 可选，跳过登录（调试） |
| `VITE_API_BASE` | 生产构建直连 API 根路径 |

API 模式判定见 `src/services/http.ts`：`VITE_USE_REAL_API`、token 或已登录任一满足即 `useApiMode() === true`。

---

## 已对接 API（`useApiMode()` 为真）

| 域 | 服务层 | 后端前缀 |
|----|--------|----------|
| 认证 | `http.ts` | `/v1/auth/*` |
| 知识库 | `datasetService.ts` 等 | `/v1/datasets/*` |
| 文档/分块 | `documentService.ts` | `/v1/datasets/:id/documents/*` |
| 检索测试 | `searchService.ts` | `POST .../search` |
| 增强索引 | `indexService.ts` | `/v1/rag3/datasets/:id/index` |
| PageIndex Hub | `pageIndexService.ts` | `/v1/rag3/.../pageindex/*` |
| Wiki Hub | `wikiService.ts` | `/v1/rag3/.../wiki/*` |
| 智能对话 | `chatService.ts` | `/v1/conversations/*` |
| 评测中心 | `evalService.ts` + `useEvalData.ts` | `/v1/eval/*` |
| 系统管理 | `systemService.ts` + `useSystemData.ts` | `/v1/admin/*` |

启动后端见 [`backend/README.md`](../../backend/README.md)。默认登录：`admin@ragflow.io` / `admin`。

---

## 仍为 mock 或部分 mock

- 知识库：权限 ACL、外部数据源、批量导出任务
- Agent 编排、搜索应用（整页 mock 交互）
- 系统监控：部分趋势图、成本 PDF 导出
- 工作台部分 Widget 统计（未全量接 usage API）

mock 数据位于 `src/data/*Mock.ts`；API 模式下上述页面不应静默展示 mock 样例数据（系统管理/评测中心已 enforce）。

---

## 构建

```bash
npm run build    # 产物 dist/
```

---

## 目录约定

```
src/
├── pages/           # 页面组件（*Page.tsx）
├── pages/Hub/       # Wiki / PageIndex / GraphRAG Hub
├── components/      # 布局、SystemSubNav、hubUi…
├── services/        # API 客户端（http.ts、*Service.ts）
├── hooks/           # useEvalData、useSystemData、useLlmData…
├── data/            # Mock 数据（离线演示）
└── store.ts         # 全局页面路由 state
```

---

## 与原型关系

| `web/rag3-bolt-v1.5` | `rag3-web` |
|------------------|------------|
| mock 驱动 | API + mock 双模式 |
| 只读 UX 参考 | 唯一开发入口 |
| 禁止修改 | 持续迭代 |

根目录总览：[../../README.md](../../README.md)
