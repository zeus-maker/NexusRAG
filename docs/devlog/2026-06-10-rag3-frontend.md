# Devlog — 2026-06-10

> 接续 `2026-06-08-rag3-frontend.md` §4（dev 局域网访问）。

## 1. 智能对话全功能 RAG3 原生 API 接入

### 背景与目标

智能对话 UI 已覆盖 PRD §4 三栏/设置/Trace/对比/纠错，但除薄层 `rag3/query` 外均为 mock。需按 RAG3 原生路线新建 `/api/v1/conversations/*`、增强 `/rag3/query` 为 Router→多通道→LLM 生成，并补齐 SSE 流式与前端 service 层。

### 改动摘要

- **后端**：`conversation_store`（Redis 会话/消息/设置/反馈）；`chat_service` + `generation_service` 编排；`conversations_api` CRUD/发消息/对比/反馈；`/rag3/query` 改调 `execute_chat_turn` 并加鉴权；新增 `/query/stream`、`/query/rewrite`、`/query/compare`；`vector_pipeline` 接真实检索；`fusion/reranker` 接 TenantLLM rerank。
- **前端**：`chatService` + `sseClient` + `useChatData`；`Chat.tsx` 接会话列表/多轮/真 SSE/设置持久化/对比/反馈/查询增强；`ChatSettingsPanel` KB 列表接 `useKnowledgeBaseList`。

### 验证与风险

- 验证：`npm run build` 通过；`python3 -m py_compile` 新模块通过；API 模式：登录后新建对话→流式问答→Trace 有通道数据→设置保存→赞/踩/对比。
- 风险：会话存 Redis 非 MySQL；LLM 未配置时回退模板答案；`/rag3/query` 现需登录（检索测试台需带 Authorization）。

### 反思与沉淀

- 统一 `execute_chat_turn` 供 conversations 与 rag3/query 复用，避免双轨逻辑分叉。
- SSE 事件与 PRD §4.2 对齐，前端 `postSseStream` 解析 `event:` 行而非 RAGFlow `data:{code}` 包装。

### 涉及文件

- `backend/ragflow_rag30/rag3/conversation_*.py`、`chat_service.py`、`generation_service.py`
- `backend/ragflow_rag30/api/apps/restful_apis/conversations_api.py`、`rag3_app.py`
- `backend/ragflow_rag30/fusion/reranker.py`、`pipelines/vector_pipeline.py`
- `frontend/rag3-web/src/services/chatService.ts`、`sseClient.ts`
- `frontend/rag3-web/src/hooks/useChatData.ts`、`pages/Chat.tsx`、`components/ChatSettingsPanel.tsx`
