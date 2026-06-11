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

---

## 4. 评测中心全栈 API（数据集/任务/RAGAS/满意度/成本/回放/路由学习）

### 背景与目标

评测中心 8 个子页此前均为前端 mock，`EvaluationService` 与 ORM 表存在但无 HTTP 暴露。需实现 `/api/v1/eval/*` 全套 REST，对话写入 `query_logs` 支撑满意度/成本/回放，评测执行走 RAG3 pipeline + RAGAS。

### 改动摘要

- 扩展 `EvaluationRun`（`kb_id`、`evaluation_type`、`progress` 等）；新增 `QueryLog`、`EvalReplayTask`、`EvalAbTest`、`RouteLearningState`、`EvalCostBudget` 表。
- 新建 `evaluation_api.py`：dashboard、datasets CRUD/import、runs 生命周期、scores/export、ab-tests、satisfaction、cost、replay、route-learning；`/evaluations/*` 别名。
- `evaluation_runner.py` 后台线程批跑用例，检索指标 + `RAGASEvaluator`；`query_log_service` 在 `conversations_api` 落库，反馈同步更新。
- 服务层：`satisfaction_service`、`cost_service`、`replay_service`、`route_learning_service`；`pyproject.toml` 增加 `ragas`。

### 验证与风险

- `python3 -m py_compile` 新模块通过。
- RAGAS 依赖租户 LLM，单条评测耗时较长；需 UI 轮询 progress。
- 旧 `evaluation_runs` 无 `tenant_id` 时列表可能为空，新任务会写入 tenant。

### 涉及文件

- `api/apps/restful_apis/evaluation_api.py`（新）
- `rag3/evaluation_runner.py`、`query_log_service.py`、`satisfaction_service.py`、`cost_service.py`、`replay_service.py`、`route_learning_service.py`
- `eval/metrics.py`、`eval/ragas_evaluator.py`
- `api/db/db_models.py`、`conversations_api.py`、`pyproject.toml`

---

## 5. 修复评测 API 报 Unknown column tenant_id

### 背景与目标

访问 `/api/v1/eval/dashboard` 时 MySQL 报错 `Unknown column 't1.tenant_id'`：ORM 已扩展 `evaluation_runs` 字段，但存量库未执行迁移。

### 改动摘要

- 在 `migrate_db()` 追加 `evaluation_runs`（tenant_id、kb_id、evaluation_type、metrics、config_override、progress、error_message、dialog_id 可空）与 `evaluation_results`（question、reference_answer）列迁移。
- `evaluation_api` 用 `_runs_for_tenant()` 兼容 `tenant_id` 为空的历史 run（按 `created_by` 回退）。

### 验证与风险

- 执行 `init_database_tables()` 后迁移成功；重启后端后 dashboard 应可加载。
- 新表（query_logs 等）由 `init_database_tables` 自动 `create_table`，首次启动后即存在。

### 涉及文件

- `api/db/db_models.py` — migrate_db 条目
- `api/apps/restful_apis/evaluation_api.py` — 租户查询兼容

---

## 6. 修复评测列表 API 误传 total 导致 500

### 背景与目标

切换评测中心 Tab 时后端抛 `TypeError: get_json_result() got an unexpected keyword argument 'total'`，`/eval/datasets`、`/eval/runs`、`/eval/runs/{id}/scores` 均返回 500，前端各页连锁加载失败。

### 改动摘要

- `get_json_result(code, message, data)` 仅接受 `data` 载荷，不支持顶层 `total` 关键字（与 `agent_api` 等将 `total` 放入 `data` 对象的做法不同）。
- 移除 `list_eval_datasets`、`list_runs`、`list_run_scores` 三处 `total=` 参数，列表直接返回 `data` 数组；前端 `evalService` 以 `data.length` 使用，无需顶层 total。

### 验证与风险

- `py_compile api/apps/restful_apis/evaluation_api.py` 通过；重启后端后上述三个 GET 应返回 `code:0` 而非 500。
- 若未来需要分页元数据，应使用 `get_result(data=..., total=...)` 或将 `{ items, total }` 包在 `data` 内，勿向 `get_json_result` 传 `total`。

### 涉及文件

- `api/apps/restful_apis/evaluation_api.py` — 列表响应格式

---

## 7. 评测数据集 API 补全（标签/样本更新/JSON 导入）

### 背景与目标

数据集页前后端契约不完整：标签无法持久化、样本不能编辑、multipart 仅解析 CSV、删除样本未校验归属。需对齐计划 §3.1 全量端点行为。

### 改动摘要

- `evaluation_datasets` 新增 `metadata` JSON 列（migrate_db），`tags` 存于 `metadata.tags`；创建/更新 API 接受 `tags`，列表支持 `?tag=` 筛选。
- 新增 `PUT /eval/datasets/{id}/samples/{sample_id}`；删除样本校验 `dataset_id` 归属。
- `import` 统一 `_parse_import_cases()`：支持 UTF-8 BOM、CSV、JSON 文件及 JSON body `{samples:[]}`；过滤空 question。
- `EvaluationService` 增加 `update_test_case`、`touch_dataset`；增删改样本后刷新 `update_time`。

### 验证与风险

- `init_database_tables()` 迁移成功；`py_compile` 通过。
- 旧库无 `metadata` 列时须重启后端触发 migrate；标签为空数组时行为与 mock 一致。

### 涉及文件

- `api/db/db_models.py` — metadata 列 + migrate
- `api/db/services/evaluation_service.py` — 样本更新/删除/touch
- `api/apps/restful_apis/evaluation_api.py` — 导入解析、PUT 样本、tag 筛选

---

## 8. 修复评测集 CSV 导入 await file.read() 报错

### 背景与目标

上传 `docs/example/eval/*.csv` 时 API 返回 `code:100`，`TypeError: object bytes can't be used in 'await' expression`。

### 改动摘要

- `import_samples` 中 `await file.read()` 改为同步 `file.read()`；`await request.files` 保留（Quart 异步属性）。
- 与 `file_service.upload_info` 等现有上传路径一致。

### 验证与风险

- `py_compile` 通过；重启后端后 multipart 导入应返回 `{imported, failed}`。

### 涉及文件

- `api/apps/restful_apis/evaluation_api.py` — import_samples 读文件

---

## 9. 评测任务进度/ETA 与失败案例绑定数据集

### 背景与目标

评测任务运行中前端无进度条与剩余时间；失败案例展示 mock 合同问答而非所选评测集结果；`test_set_size` 运行期为 0。

### 改动摘要

- `_run_to_api` 补充 `dataset_name`、`completed_cases`、`test_set_size`（来自数据集样本数）、`eta_seconds`（按 progress 线性估算）。
- `GET /eval/runs/{id}/scores` 默认 `failures_only=true&threshold=0.7`，仅返回低分样本；引用格式化为 `doc · snippet`。
- 创建任务前校验数据集非空；runner 启动时写入 `metrics_summary.total_cases`。

### 验证与风险

- `py_compile` 通过；运行中任务应显示 progress 递增与 ETA。
- ETA 为线性外推，首批样本耗时不均时误差较大。

### 涉及文件

- `api/apps/restful_apis/evaluation_api.py`
- `rag3/evaluation_runner.py`

---

## 10. 评测指标全为 0：根因分析与修复

### 背景与目标

用户创建评测任务并完成后，卡片上 faithfulness、recall@10、mrr 等全部为 0，但知识库中已有文档。需判断是否为 rerank 模型配置问题，并修复可观测性与指标计算。

### 根因结论（rerank 通常不是主因）

1. **精排失败不会清空检索**：`fusion/reranker.py` 在 rerank 模型不可用或调用异常时回退为 RRF 融合顺序并截断 top_n；`vector_pipeline.py` 在带 rerank 检索异常时会**重试无 rerank** 路径。因此「未配置 rerank」最多影响排序，不会导致 fusion 为空。
2. **更常见根因 — 检索为空**：嵌入模型未配置（`resolve_kb_embedding_config` 抛错）、文档仅上传未解析入库、评测所选 KB 与数据集文档不一致、`similarity_threshold` 过高、索引租户解析失败等，导致 `fusion=[]`，答案走「未找到」模板，所有生成类指标为 0。
3. **指标计算层面的「假 0」**：示例 CSV 无 `relevant_chunk_ids` 时，旧版 `compute_retrieval_metrics` 直接返回 `{}`，聚合后 UI 的 recall@10/mrr 缺省为 0（并非检索失败，而是无 gold 标注）。
4. **RAGAS 与 LLMBundle 不兼容**：`ragas_evaluator.py` 捕获异常后返回空 dict，faithfulness 等保持 0；无 contexts 时也不会调用 RAGAS。

### 改动摘要

- 新增 `rag3/eval_settings.py`：`build_eval_config_override` 对齐 KB/租户模型；评测固定 `pipeline_ids=["vector"]`、关闭 wiki/graph 通道；无租户默认 rerank 时设 `use_rerank=false`；`similarity_threshold=0.15` 提高召回。
- 重写 `evaluation_runner` 指标路径：无 gold chunk 时用 `compute_proxy_retrieval_metrics`（hit_rate、retrieval_hit_count）；RAGAS 失败或无 contexts 时用 `compute_basic_generation_metrics` 词重叠代理；汇总写入 `zero_retrieval_cases` 与 `diagnosis` 文案。
- `evaluation_api` 创建任务时合并 `build_eval_config_override`；`_run_to_api` 暴露 `diagnosis`、`zero_retrieval_cases`，recall@10/mrr 回退 hit_rate。
- 前端任务卡片在 completed 且 faithfulness=0 时展示 `error_message`/`diagnosis` 提示。

### 验证与风险

- `py_compile rag3/eval_settings.py rag3/evaluation_runner.py eval/metrics.py` 通过。
- **建议复现检查**：重启后端 → 确认租户已配置**嵌入模型**与**对话 LLM** → 确认 KB 文档状态为已解析 → 用同一 KB 跑评测 → 查看 run 详情 `diagnosis` 与 `zero_retrieval_cases`。
- 若 `zero_retrieval_cases == total_cases`，优先查嵌入与解析，而非 rerank。
- proxy 指标非 gold recall，仅表示「是否检索到片段」；要准确 Recall@K 须在 CSV 补充 `relevant_chunk_ids`。

### 反思与沉淀

评测与对话共用 `execute_chat_turn`，但此前未强制对齐 KB parser_config 与 pipeline 策略；多通道 immediate 策略在 wiki/graph 无数据时会稀释融合。将评测配置集中到 `eval_settings` 便于后续与对话设置 UI 对齐。

### 涉及文件

- `rag3/eval_settings.py`（新建）
- `rag3/evaluation_runner.py`
- `eval/metrics.py`
- `api/apps/restful_apis/evaluation_api.py`
- `frontend/rag3-web/src/pages/Evaluation.tsx`
- `frontend/rag3-web/src/types/eval.ts`
- `frontend/rag3-web/src/services/evalMappers.ts`

---

## 11. 修复 RAGAS 评测卡住与 LLM 生成解包

### 背景与目标

用户反馈 RAGAS 评测进度条长期停在 `Evaluating: 0%`；怀疑未配置大模型。需在租户 `8eef29f…` / 知识库 `cf99d0e8…` 环境下打通 judge LLM 与指标计算。

### 根因（非「未配大模型」）

1. **租户模型已配置**：默认对话 `qwen3.5-plus@Tongyi-Qianwen`、嵌入 `text-embedding-v2`、rerank `gte-rerank-v2`，`tenant_llm.api_key` 已存在；单次 `agenerate_text` 约 1s 可返回。
2. **用户提供的「KEY」与 KB ID 相同**（`cf99d0e8…`），实为知识库 UUID，不是 DashScope API Key；无需在代码中写入。
3. **卡住主因**：`ragas.evaluate()` 的 `Executor` 在 Python 3.13 + 评测异步线程中与 `asyncio.run()` 冲突，导致 event loop 死锁或 `There is no current event loop`。
4. **次要耗时**：`faithfulness` 每条样本需 2～3 次 judge LLM 调用，单条约 12～20s，进度条在单 job 完成前会停在 `0/1`，易被误判为卡死。

### 改动摘要

- `rag3/generation_service.py`：`LLMBundle.async_chat` 仅返回文本，修复 `content, tokens = await …` 解包错误，恢复真实 LLM 答案生成。
- 新增 `eval/ragflow_ragas_llm.py`、`eval/ragflow_ragas_embeddings.py`：RAGFlow LLMBundle → RAGAS judge LLM / embeddings。
- 重写 `eval/ragas_evaluator.py`：**不再调用 `ragas.evaluate()`**，在独立线程内 `asyncio.run(metric.ascore())` 逐指标打分；中文答案 `。` 归一化为 `.` 以兼容 faithfulness 分句；默认超时 120s。
- `evaluation_runner.py`：`asyncio.to_thread(evaluator.evaluate_single, …)` 避免阻塞主事件循环。
- `pyproject.toml`：固定 `ragas==0.1.21` 并显式依赖 `datasets`。

### 验证

```bash
cd backend/ragflow_rag30 && .venv/bin/python -m py_compile eval/ragas_evaluator.py
# faithfulness ~12.5s → {'faithfulness': 1.0}
# faithfulness+answer_relevancy ~17s → {'faithfulness': 1.0, 'answer_relevancy': 0.7751}
```

重启后端后重新跑评测任务；单样本 RAGAS 约 15～20s 属正常。

### 涉及文件

- `rag3/generation_service.py`
- `eval/ragflow_ragas_llm.py`（新建）
- `eval/ragflow_ragas_embeddings.py`（新建）
- `eval/ragas_evaluator.py`
- `rag3/evaluation_runner.py`
- `pyproject.toml`

## 12. 评测失败案例 citations 结构化

`GET /eval/runs/{id}/scores` 中 `citations` 原为 `list[str]`（`doc · snippet`），前端无法跳转分块页。

### 改动摘要

- `_format_citations` 返回与对话引用一致的对象列表：含 `doc_id`、`chunk_id`、`wrrf_score`→`relevance_score`、`metadata` 中的页码/章节等，最多 10 条。

### 验证

- `py_compile evaluation_api.py` 通过；需重启后端后前端侧栏引用跳转才生效。

### 涉及文件

- `api/apps/restful_apis/evaluation_api.py`
