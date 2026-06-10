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

---

## 2. 智能对话 P2：高级语法 / 附件 / Graph 检索 / ACL

### 背景与目标

P0/P1 智能对话已接通会话与 SSE，但计划 Phase 5 四项 P2 仍空缺：§4.6 高级检索语法、Chat 附件上传、Graph 通道 mock、融合后 chunk ACL 透传。目标在不改 PRD 契约前提下补齐后端解析与过滤链路，并在 `Chat.tsx` 暴露语法浮层与 Paperclip 真实上传。

### 改动摘要

- **高级语法**：新增 `rag3/query_parser.py`（`field:value`、引号短语、`page:N-M`、AND/OR/NOT AST）；`POST /rag3/query/parse`；`execute_chat_turn` 解析后分离 `free_text` 与 `metadata_filters`，经 `filter_utils.apply_metadata_filters` 过滤融合结果；前端 `ChatQuerySyntax` 防抖调 parse API 展示过滤标签与自动补全。
- **Graph 通道**：`graph_pipeline` 接 RAGFlow `settings.kg_retriever.retrieval`（实体/关系/社区报告 CSV），失败回退 mock。
- **ACL**：`security/chunk_acl.py` 实现角色密级矩阵；向量命中携带 `acl_level` 元数据；融合精排后 `filter_fused_hits_by_acl`；Trace 记录 `acl_filtered_count`。
- **附件**：`Chat.tsx` Paperclip 触发隐藏 file input → `kbApi.uploadDocuments` 写入当前 KB → 发送时附 `[附件: …]` 标注；`useChatData` 支持 `attachmentNote`/`metadataFilters` 透传 settings。

### 验证与风险

- 验证：`python3 -m py_compile` 新模块通过；`npm run build` 通过。
- 手动：输入 `department:法务 type:合同 违约金` 应出现语法浮层与解析标签；开启 Graph 通道后 Trace 含 graph 通道；无 confidential 角色时含 `acl_level:confidential` 的块被剔除（若元数据存在）。
- 风险：元数据过滤在无 chunk 字段时回退 snippet 子串匹配，可能误杀/漏杀；附件仅入库未触发自动解析队列；ACL 规则未接 KB 权限 API，角色矩阵为内置默认值。

### 反思与沉淀

- 查询解析与 ACL 均挂在 `execute_chat_turn` 单入口，检索测试台与 conversations 自动受益。
- P2 附件采用「先入库再提问」最小路径，避免在会话层复制 ingest 状态机。

### 涉及文件

- `backend/ragflow_rag30/rag3/query_parser.py`、`filter_utils.py`、`chat_service.py`
- `backend/ragflow_rag30/pipelines/graph_pipeline.py`、`vector_pipeline.py`
- `backend/ragflow_rag30/security/chunk_acl.py`、`api/apps/rag3_app.py`
- `frontend/rag3-web/src/components/ChatQuerySyntax.tsx`、`pages/Chat.tsx`
- `frontend/rag3-web/src/services/chatService.ts`、`hooks/useChatData.ts`

---

## 3. 修复对话 Redis 封装不匹配与 API 模式默认 kb-001

### 背景与目标

`GET /conversations` 报 `RedisDB` 无 `zrevrange`；`POST /conversations` 因默认 `kb-001` mock ID 返回「知识库不存在」。根因是 `conversation_store` 直接调用了 `RedisDB` 未封装的方法，且 `zadd` 参数签名错误；前端 API 模式仍沿用 mock 默认知识库。

### 改动摘要

- `conversation_store.py`：新增 `_zrevrange/_zadd/_zrem/_lrange/_rpush/_expire` 辅助函数，经 `REDIS_CONN.REDIS` 调用原生 redis-py；`zadd` 改为 `(key, member, score)` 三参数。
- `useChatData`：KB 列表加载后将 mock `kb-*` 替换为首个真实 dataset id；`resolveKbIds()` 在设置为空时回退 `kbs[0]`。
- `ChatSettingsPanel` 默认 `kbIds` 改为 `[]`，避免 API 模式误提交 mock id。

### 验证与风险

- `python3 -m py_compile rag3/conversation_store.py` 通过；`npm run build` 通过。
- 手动：重启后端后 `GET /conversations` 应 200 且 `items: []`；选真实 KB 后新建对话不再 3001。
- 风险：日志中 `your-token` JWT 警告为前端未配置有效登录 token，需单独登录/配置 `Authorization`。

### 涉及文件

- `backend/ragflow_rag30/rag3/conversation_store.py`
- `frontend/rag3-web/src/hooks/useChatData.ts`
- `frontend/rag3-web/src/components/ChatSettingsPanel.tsx`
