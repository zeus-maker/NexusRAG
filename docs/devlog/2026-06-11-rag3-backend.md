## 1. 移除检索流水线 Mock 回落，引用来源与知识库一致

### 背景与目标

用户发现对话「引用来源」出现 `Wiki: 供应商违约金 · P0`、`供应商合同模板V5.pdf · P3` 等条目，在真实知识库中不存在。根因是 vector/pageindex/wiki/graph 四条流水线在真实检索无结果时注入硬编码 `mock_hits`（原型演示 ID 如 `doc-001`、`wiki-penalty`），经 RRF 融合后仍生成 `event: citation` 推给前端。

### 改动摘要

- `wiki_pipeline` / `pageindex_pipeline` / `vector_pipeline` / `graph_pipeline`：检索失败或无命中时返回 `hits=[]`，不再回落 Mock。
- 无检索结果时沿用既有 `generate_answer` / `generate_answer_stream` 逻辑：不发出 citation 事件，回答为「未在知识库中找到与问题相关的内容。」（或 LLM 在无上下文时的等价行为）。

### 验证与风险

- `python3 -m py_compile` 四条 pipeline 文件通过。
- 手动：空库或无关问题对话 → `searching` 各通道 `results_count: 0`，无 citation 事件，引用区不展示假文档。
- 风险：开发演示环境在未入库时不再「假装有结果」，需真实 ingest 后才能看到引用。

### 涉及文件

- `backend/ragflow_rag30/pipelines/wiki_pipeline.py`
- `backend/ragflow_rag30/pipelines/pageindex_pipeline.py`
- `backend/ragflow_rag30/pipelines/vector_pipeline.py`
- `backend/ragflow_rag30/pipelines/graph_pipeline.py`

---

## 2. 修复对话检索有库数据却快速返回「未找到」

### 背景与目标

移除 Mock 后，采购等知识库已有文档的对话快速返回「未在知识库中找到与问题相关的内容」。根因是对话向量检索与「检索测试」API 参数不一致，且 `similarity_threshold` 默认 0.2 过滤掉有效 chunk。

### 改动摘要

- `vector_pipeline` 对齐 `dataset_api_service.search`：嵌入模型解析（`tenant_embd_id`）、`label_question`/`rank_feature`、`top=max(top_k,64)`；精排失败自动降级；阈值为 0 仍无结果时打 warning。
- 首次检索在 `similarity_threshold>0` 无命中时自动以 `0.0` 重试。
- 对话默认阈值保持 `similarity_threshold=0.2`、`vector_weight=0.7`；前端 `ChatSettingsPanel` 同步。
- `search_wiki_hits` 中文查询改用 bigram/整词匹配，不再依赖空格分词。

### 验证与风险

- `py_compile` 通过；重启后端后对话应能命中与检索测试相近的 chunk。
- 自动重试阈值为 0 可能召回噪声；旧会话 settings 若曾存 `similarity_threshold: 0` 需手动调回或新建对话。

### 涉及文件

- `backend/ragflow_rag30/pipelines/vector_pipeline.py`
- `backend/ragflow_rag30/rag3/chat_service.py`
- `backend/ragflow_rag30/rag3/conversation_models.py`
- `backend/ragflow_rag30/rag3/index_service.py`
- `frontend/rag3-web/src/components/ChatSettingsPanel.tsx`

---

## 3. 排查并修复对话检索向量库/标签过滤误伤

### 背景与目标

用户反馈上一轮「对齐检索测试」改动后问题更严重。需确认是向量索引租户错误、嵌入模型不一致，还是标签/元数据过滤导致空结果。

### 根因分析

1. **KB 绑定错误**：`send_message` 始终用会话创建时的 `conv.kb_ids[0]`，用户在设置里切换采购库后检索仍打旧库。
2. **索引租户**：向量索引为 `ragflow_{tenant_id}`，须用 KB 所属租户（与 dataset search 一致），不能混用 requester id。
3. **标签过滤**：`label_question` 仅在 `parser_config.tag_kb_ids` 配置时生效；真正误伤来自 `_prepare_query` 对含 `:` 查询**自动套用** metadata_filters，以及前端高级语法显式传入的 filters。
4. **诊断缺失**：vector 流水线异常被吞掉，Trace 看不出 index/embd/filters 状态。

### 改动摘要

- 新增 `rag3/retrieval_context.py`：解析 `index_tenant_id`、嵌入模型、`tag_kb_ids` 条件 rank_feature。
- `vector_pipeline` 使用上述上下文；`PipelineResult.debug` 写入 index/embd/es_total。
- `_prepare_query` 仅使用**显式** `metadata_filters`，不再因 `:` 自动过滤。
- `send_message` 接受请求体 `kb_ids`（前端随消息发送 `settings.kbIds`）并同步会话。
- Trace 增加 `kb_id`、`search_query`、`metadata_filter_dropped`、各 channel `debug`。

### 验证与风险

- `py_compile` 通过；重启后端 + 刷新前端。
- 对话 Trace 展开：看 `channels[].debug.index_name`、`embd_model`、`es_total`；`metadata_filter_dropped>0` 表示标签过滤删光了结果。
- 确认设置中选中的 KB 与 Trace 中 `kb_id` 一致。

### 涉及文件

- `backend/ragflow_rag30/rag3/retrieval_context.py`（新）
- `backend/ragflow_rag30/pipelines/vector_pipeline.py`
- `backend/ragflow_rag30/pipelines/base_pipeline.py`
- `backend/ragflow_rag30/rag3/chat_service.py`
- `backend/ragflow_rag30/api/apps/restful_apis/conversations_api.py`
- `frontend/rag3-web/src/services/chatService.ts`
