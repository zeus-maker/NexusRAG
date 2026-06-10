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

---

## 4. 修复 API 模式仍展示 mock 知识库 ID

### 背景与目标

用户登录后对话/设置仍显示 `kb-001` 等 mock 知识库，且 `GET /datasets` 虽 200 但 UI 不回填真实列表。根因：`useRealApi` 为模块加载时常量（登录后不刷新）；`useAsyncData` 在 API 请求前用 mock 作初始 state 且失败时不清理；`Chat.tsx` 在 `kbOptions` 为空时回退 `mockKBs`。

### 改动摘要

- **http.ts**：`getRealApiMode()` 含 `localStorage` token；新增 `useApiMode()` 响应式 hook + `AUTH_CHANGED_EVENT`；登录/登出触发刷新。
- **useKbData**：API 模式初始/失败用空列表，不再预填 mock；各 hook 改用 `useApiMode()`。
- **useChatData / Chat / ChatSettingsPanel**：剔除无效 mock id、仅展示真实 `kbOptions`；加载中与空态提示。
- **`.env.development`**：默认 `VITE_USE_REAL_API=true`。

### 验证与风险

- `npm run build` 通过。
- 手动：登录后打开智能对话 → 知识库选择器应显示 `/datasets` 返回的真实名称与 UUID id；不应出现 `kb-001`。
- 风险：未登录且未设 env 时仍为 mock 演示模式；KB 列表 API 失败时显示空态+错误提示。

### 涉及文件

- `frontend/rag3-web/src/services/http.ts`、`auth.ts`
- `frontend/rag3-web/src/hooks/useKbData.ts`、`useChatData.ts`
- `frontend/rag3-web/src/pages/Chat.tsx`、`components/ChatSettingsPanel.tsx`
- `frontend/rag3-web/.env.development`

---

## 5. 修复知识库列表 orderby=name 导致 code 101

### 背景与目标

登录后智能对话提示「知识库加载失败」，左侧对话列表也为空。`GET /api/v1/datasets` 返回 `code:101`：`orderby` 仅接受 `create_time` 或 `update_time`，前端 `sortKeyToOrderby` 将 `name` 原样传给后端导致整表请求失败，进而 KB 选择器无数据、无法创建会话。

### 改动摘要

- **kbMappers**：`sortKeyToOrderby` 仅映射为 `create_time` | `update_time`；新增 `sortKnowledgeBases` 对 `name`/`docs`/`chunks`/`updated` 做客户端排序。
- **useKbData**：列表拉取成功后按 `sortBy`/`sortDesc` 客户端排序再返回。
- **useChatData / Chat**：`refreshConversations` 增加 catch 与 `convError`；侧栏展示加载失败提示与「暂无历史对话」空态。

### 验证与风险

- 验证：`npm run build` 通过。
- 手动：登录 → 智能对话 → 知识库下拉应显示真实 dataset；侧栏无历史时显示「点击新对话开始」；若 conversations API 失败则显示「对话加载失败」。
- 风险：大列表（>100）客户端排序仅作用于当前页；分页场景下 name 排序非全局。

### 反思与沉淀

- RAGFlow `BaseListReq.orderby` 白名单与 UI 排序字段不一致时，应在 mapper 层收敛 API 参数，排序语义在前端补齐，避免静默 101。

### 涉及文件

- `frontend/rag3-web/src/services/kbMappers.ts`
- `frontend/rag3-web/src/hooks/useKbData.ts`、`useChatData.ts`
- `frontend/rag3-web/src/pages/Chat.tsx`

---

## 6. 修复智能对话 SSE 流式无输出

### 背景与目标

用户发送消息后助手气泡仅有光标闪烁、无文字流式出现。根因包括：`LLMBundle.async_chat_streamly` 返回累积全文而前端按 delta 拼接导致错乱；同步检索阻塞 asyncio 事件循环使 SSE 无法及时 flush；LLM 无 token 时无回退；`conversations_api` 保存消息时错误拼接 token；Vite 代理可能缓冲 event-stream。

### 改动摘要

- **generation_service**：改用 `async_chat_streamly_delta` 输出增量 token；无 token 时回退 `template_answer`。
- **chat_service**：`tid` 优先 `kb.tenant_id`；检索/精排放入 `thread_pool_exec`；各 SSE 事件后 `asyncio.sleep(0)` 促 flush。
- **conversations_api**：token 合并兼容 delta/cumulative；补 `Content-Type: text/event-stream; charset=utf-8`。
- **前端**：`mergeStreamToken` 兼容两种 token 格式；处理 `error`/`routing` 事件；SSE 解析支持 `\r\n`；Vite 代理对 event-stream 禁用缓冲；流式时展示路由标签。

### 验证与风险

- `python3 -m py_compile` + `npm run build` 通过。
- 手动：重启后端 → 登录 → 智能对话发消息 → 应先见 routing/检索，再逐字流式输出；LLM 未配置时应回退模板答案而非空白。
- 风险：未配置 Chat 模型时始终走模板回退；长检索阶段仍可能数秒无 token（属正常，现已有 routing 提示）。

### 反思与沉淀

- RAGFlow 流式 LLM 应统一走 `async_chat_streamly_delta`，勿直接把 `async_chat_streamly` 当 delta 用。
- 在 async SSE 生成器内跑同步 pipeline 必须 `thread_pool_exec`，否则 Quart 无法向客户端推送中间事件。

### 涉及文件

- `backend/ragflow_rag30/rag3/generation_service.py`、`chat_service.py`
- `backend/ragflow_rag30/api/apps/restful_apis/conversations_api.py`
- `frontend/rag3-web/src/hooks/useChatData.ts`、`services/sseClient.ts`、`vite.config.ts`、`pages/Chat.tsx`
