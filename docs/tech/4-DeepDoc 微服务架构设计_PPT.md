# DeepDoc 微服务架构设计 — PowerPoint 逐页演示大纲

> **编排原则**：每页 **5～9 条**精炼要点，每条承载独特信息，杜绝冗余重复。
> **页码**：下列「第 N 页」即 PPT 页序，可直接逐页建片。
> **来源**：DeepDoc 文档处理与检索微服务架构设计.md（9 章 + 附录，53KB）
> **页数概览**：全文共 **17 页**（封面 1 + 导航 1 + 摘要 1 + 内容 13 + 结尾 1）

---

## 第 1 页｜封面

- **主标题**：DeepDoc 文档处理与检索——微服务架构设计
- **副标题**：基于 RAGFlow v0.25.4 核心模块的独立微服务化方案
- **关键词**：DeepDoc / 微服务化 / RAGFlow 模块复用 / 文档解析 / 混合检索
- **版本**：v1.0
- **适用团队**：希望将深度文档理解能力独立部署、对接已有系统的工程团队
- **核心价值**：不用完整部署 RAGFlow，通过标准 REST API 即可享用其 DeepDoc 解析引擎 + Dealer 检索能力

---

## 第 2 页｜汇报结构

- **Part 1 设计目标**：背景→核心诉求→六大设计目标（P4）
- **Part 2 微服务拆分**：服务边界→2 微服务职责→数据流总览（P5-6）
- **Part 3 模块复用**：18 个可复用模块 + 4 个需适配模块 + 依赖关系图（P7）
- **Part 4 文档处理服务**：6 段管线→解析阶段→分块阶段→向量化阶段→索引阶段（P8-9）
- **Part 5 检索服务**：检索管线→3 种检索模式→多轮对话增强（P10-11）
- **Part 6 任务队列**：Redis Streams 消费者组→状态机→SSE 进度推送（P12）
- **Part 7 API 规范**：5 个文档接口→2 个检索接口→2 个时序图（P13-14）
- **Part 8 部署与实现**：Docker Compose 编排→环境变量→核心伪代码（P15-16）

---

## 第 3 页｜执行摘要

- **核心问题**：RAGFlow 是单体架构（深度耦合在同一个 Python 进程中），已有系统需要的是独立的标准 REST 接口
- **解决方案**：将 RAGFlow 的核心能力拆分为 2 个独立微服务——doc-parse-svc(:8201) 文档处理 + retrieval-svc(:8202) 检索
- **复用策略**：18 个模块零修改直接 import（DeepDoc 解析器/分块工厂/Dealer 检索/分词器/Embedding 工厂/ES 连接等）
- **文档处理管线（6 段）**：文件接收→格式转换→DeepDoc解析→智能分块(9种模板)→向量化(标题0.1+内容0.9加权)→ES/Infinity 索引写入
- **检索管线（5 段）**：查询预处理→BM25+向量混合检索(RRF加权0.05/0.95)→后过滤(租户+删除+阈值)→Rerank精排(tkweight*vtsim+tksim*vtweight+rank_fea)→格式化返回
- **可靠性设计**：Redis Streams + PEL 未确认消息追踪 + XAUTOCLAIM 超时自动认领 + SSE 实时进度推送
- **标准接口**：POST /v1/documents/parse(文件入库) / POST /v1/retrieval/search(混合检索) / POST /v1/retrieval/embedding(文本向量化)

---

## 第 4 页｜第一章 设计背景与六大目标

- **背景痛点**：RAGFlow 单体架构 → Python 进程深度耦合 → 已有系统(Vibe-RAG/业务平台)无法直接调用核心能力
- **工程团队真实需求**：不需要完整部署 RAGFlow，只需要①标准 REST 接口(传入文件→返回 Chunk) ②标准检索接口(传入 Query→返回相关块) ③可独立水平扩展 ④能与已有存储(Milvus/ES/自建)对接
- **设计目标 ①接口标准化**：对外提供 OpenAPI 兼容的 REST 接口，解耦下游调用方
- **设计目标 ②核心能力复用**：直接复用 RAGFlow 的 DeepDoc 解析引擎和 Dealer 检索类，不重复造轮子
- **设计目标 ③状态无关**：处理节点本身不保存业务状态，状态由 Redis + 数据库持久化
- **设计目标 ④渐进式解耦**：不强制要求下游使用 ES，支持通过适配器对接 Milvus/FAISS
- **设计目标 ⑤异步优先**：文档处理走异步任务队列，检索走同步请求-响应
- **设计目标 ⑥可观测**：提供任务状态查询、进度推送(WebSocket/SSE)接口

---

## 第 5 页｜第二章 微服务拆分：服务边界与数据流

- **2 微服务拆分**：doc-parse-svc(:8201) 异步文档处理 + retrieval-svc(:8202) 同步检索
- **doc-parse-svc 职责**：文件接收→解析(DeepDoc)→分块→向量化→写索引→进度推送
- **retrieval-svc 职责**：查询→分词→向量化→混合检索(BM25+向量)→Rerank精排→格式化返回
- **doc-parse-svc 内部 6 层**：FastAPI接口层→任务队列消费者→DeepDoc解析引擎→分块策略工厂→Embedding向量化→ES/Infinity索引
- **retrieval-svc 内部 5 层**：FastAPI接口层→查询预处理(分词+向量化)→Dealer混合检索→Rerank精排→结果格式化
- **基础设施层 4 组件**：Redis 7(任务队列+进度缓存+分布式锁) / ES/Infinity(BM25+向量双引擎) / MinIO(原始文件) / MySQL(任务元数据)
- **数据流总览**：用户上传→API生成task_id入队Redis→Worker消费→MinIO取文件→DeepDoc解析→分块→Embedding→写ES→SSE推送进度→完成；用户检索→Query向量化→BM25+向量双路→RRF融合→过滤→Rerank→返回

---

## 第 6 页｜第二章 架构图：服务拓扑与职责对照

- **doc-parse-svc 核心复用模块**：`deepdoc/parser/`(9种解析器) + `rag/app/`(分块工厂) + `rag/llm/`(Embedding) + `common/doc_store/`(ES连接)
- **retrieval-svc 核心复用模块**：`rag/nlp/search.py`(Dealer) + `rag/nlp/rag_tokenizer.py`(分词) + `rag/llm/`(Embedding/Rerank)
- **服务职责对比表**：

| 服务 | 端口 | 同步/异步 | 核心复用 |
|------|------|-----------|---------|
| doc-parse-svc | 8201 | 异步(Redis Streams) | deepdoc/ / rag/app/ / rag/llm/ / common/doc_store/ |
| retrieval-svc | 8202 | 同步(请求-响应) | rag/nlp/search.py / rag/nlp/rag_tokenizer.py / rag/llm/ |

- **架构亮点**：API Server(接口接收)与 Worker(任务执行)分离→Worker 通过 Redis Streams 消费者组可多实例水平扩展
- **Nginx 路由**：`/v1/documents` → doc-parse-svc :8201 / `/v1/retrieval` → retrieval-svc :8202 / 统一认证+限流
- **关键决策**：文档处理走异步(文件大/OCR分钟级)→Redis Streams 可靠持久化；检索走同步(毫秒级)→直接请求-响应

---

## 第 7 页｜第三章 模块复用策略：18个可复用 + 4个需适配

- **可零修改直接 import 的 18 个模块**（按功能分组）：
- **解析器组(7个)**：`deepdoc/parser/` → PDF(DOCX/Excel/PPT/HTML/Markdown/TXT) → 直接 import RAGFlowXxxParser
- **分块组(3个)**：`rag/app/` → naive/paper/table → 直接 import chunk()函数
- **检索组(2个)**：`rag/nlp/search.py`(Dealer) + `rag_tokenizer.py`(分词) → 依赖 ES + infinity C++ 扩展
- **模型工厂组(2个)**：`rag/llm/` → embedding_model.py + rerank_model.py → 需配置 API Key
- **工具组(4个)**：`common/doc_store/es_conn.py`(ES连接) / `infinity_conn.py`(Infinity) / `common/ssrf_guard.py`(SSRF防护) / `rag/utils/redis_conn.py`(Redis Streams)
- **需适配/裁剪的 4 个模块**：①task_executor.py(深度依赖 MySQL 完整 schema→裁剪替换) ②api/db/services/(不复用→自定义最小数据模型) ③api/apps/(Flask Blueprint→FastAPI 重写) ④rag/llm/ 工厂初始化(需一并打包 conf/llm_factories.json)
- **模块依赖关系**：新增代码层(FastAPI routers+services+models) → 直接调用 RAGFlow 核心模块层(deepdoc/ / rag/ / common/) → 依赖基础设施层(ES/Redis/MinIO/MySQL)

---

## 第 8 页｜第四章 文档处理服务：7 段完整管线

- **doc-parse-svc 入口 → 7 段管线**：文件接收(multipart或URL拉取)→输入校验(格式白名单+SSRF防护)→存储MinIO(tenant/uuid.ext)→创建任务(MySQL+Redis入队)→Worker消费(XREADGROUP BLOCK 0)→完整解析管线(4阶段)→进度推送(SSE)+ACK确认
- **阶段 1：解析(复用 deepdoc/)**：文档类型检测(扩展名+magic bytes)→选择解析器→PDF走ONNX版式+XGBoost阅读序+OCR→DOCX→Excel→PPT/HTML/MD/TXT
- **阶段 2：分块(复用 rag/app/)**：按 parser_id 选择策略→naive通用智能分块→paper学术论文→table表格行级→qa问答对提取→段落合并+去重避免碎片化
- **阶段 3：向量化(复用 rag/llm/)**：批量构造[title+content]→标题Embedding(权重0.1)+内容Embedding(权重0.9)→加权合并 `v = 0.1*title + 0.9*content`
- **阶段 4：索引写入(复用 common/doc_store/)**：BM25全文索引(rag_tokenizer分词) + 向量索引(HNSW/IVF_FLAT) + 元数据字段(doc_id/kb_id/tenant_id)

---

## 第 9 页｜第四章 管线流程图说明

- **文件接收 → 202 响应 → Worker 异步处理**：API 仅做校验+存储+入队(毫秒级返回task_id)，真正耗时处理在 Worker 中异步执行
- **解析阶段核心优势**：直接复用 RAGFlow RAGFlowPdfParser(ONNX版式模型+XGBoost阅读序+独立表格识别+OCR)，解析精度保持最高水平
- **分块工厂设计**：`CHUNK_FACTORY = {"naive": naive, "paper": paper, "book": book, "manual": manual, "qa": qa, "table": table, "presentation": presentation}` → parser_id 驱动策略选择
- **向量化细节**：标题 Embedding 作辅助权重 → `v = w * title_vec + (1-w) * content_vec`(w 默认 0.1)→提升标题关键词的检索相关性
- **索引写入**：BM25 建立全文倒排索引(精确术语匹配) + 向量建立 HNSW 近似近邻索引(语义相似度) → 双引擎同库存储
- **进度推送**：Worker 每个关键节点(10%/55%/82%/100%)→Redis Pub/Sub → SSE 长连接实时推送给调用方

---

## 第 10 页｜第五章 检索服务：5 段检索管线

- **retrieval-svc 入口 → 5 段管线**：检索请求(POST)→查询预处理(分词+向量化)→核心检索(Dealer BM25+向量RRF融合)→后过滤(租户/删除/阈值)→精排(Rerank可选)→格式化(高亮+元数据+分页)→返回结果
- **核心检索(复用 Dealer.search())**：BM25 MatchTextExpr(min_match=0.3) + 向量 MatchDenseExpr(cosine/topk=1024)→加权融合 FusionExpr('weighted_sum', BM25:0.05+向量:0.95)→结果为空时降级重试(min_match=0.1/similarity=0.17)
- **后过滤 3 层**：租户/知识库过滤(kb_ids白名单)→删除文档过滤(_prune_deleted_chunks)→相似度阈值过滤(>=0.2)
- **Rerank 精排(可选)**：`tkweight(0.3)*tksim + vtweight(0.7)*vtsim + rank_fea(PageRank)` → 文本相似度+向量相似度+图重要性三特征融合
- **3 种检索模式**：hybrid(默认/BM25 0.05+向量0.95/通用) / vector(纯向量1.0/语义优先) / fulltext(纯BM25 1.0/精确关键词)

---

## 第 11 页｜第五章 多轮对话增强（借鉴 Vibe-RAG）

- **可选集成策略**：借鉴 Vibe-RAG 的 LangGraph ContextNode + QualityJudgeNode
- **指代消解**：有对话历史→LLM 重写 query(消解"它""这个"等代词)→最近5轮历史→提升多轮对话连续性
- **查询扩展循环**：标准混合检索→召回数量不足→LLM生成子查询(最多3次)→合并多路结果→返回最终 Chunks
- **流程控制**：输入→有历史？→指代消解→标准检索→召回>=min_chunks？→不满足+重试<max_retry？→查询扩展→循环
- **与 RAGFlow 原生模式关系**：此功能为可选增强模块，不影响标准检索管线(hybrid/vector/fulltext 三大模式不受影响)
- **关键参数**：chat_history(最近5轮) / max_retry(默认3) / min_chunks(默认3)→全部通过请求参数控制

---

## 第 12 页｜第六章 任务队列与状态管理

- **Redis Streams 消费者组**：复用 RAGFlow `rag/utils/redis_conn.py` → 多队列分片 → XREADGROUP BLOCK 获取 → 处理成功 XACK → 失败不 ACK(留在 PEL)
- **PEL 机制**：Pending Entry List 待确认列表 → 跟踪每个 Worker 未确认的消息 → 消息在 PEL 超过 30 分钟 → 被判定为 Worker 崩溃
- **XAUTOCLAIM 自动恢复**：其他 Worker 启动时 `get_unacked_iterator()` → 自动认领 PEL 中超时消息 → 重新处理 → 保障任务不丢失
- **任务状态机 5 状态**：PENDING(已入队等待)→RUNNING(Worker处理中)→DONE(完成XACK)→FAILED(失败>3次)→CANCELED(用户主动取消)
- **状态转换**：FAILED→手动重试→PENDING / CANCELED→重新提交→PENDING / RUNNING→失败>3次→FAILED
- **SSE 进度推送流程**：Client GET /v1/tasks/{id}/progress(长连接)→Worker PUBLISH task:{id}:progress→API 中转→Client SSE 事件(progress/message/done)
- **关键里程碑**：0.1"解析中"→0.55"分块完成N块"→0.82"向量化中"→1.0"完成+done=true"

---

## 第 13 页｜第七章 API 规范：文档处理 5 接口

- **① POST /v1/documents/parse**——提交解析任务(202 Accepted)
- **请求参数**：file(二进制)/url(经SSRF防护) / kb_id(知识库隔离) / parser_id(naive/paper/book/manual/table/qa) / chunk_size(默认512 token) / chunk_overlap(默认128) / callback_url / language(Chinese/English)
- **响应**：`{ task_id, status:"PENDING", sse_url, created_at }`
- **② GET /v1/tasks/{task_id}**——查询任务状态(200)
- **响应**：`{ task_id, status:"DONE", progress:1.0, chunk_count:42, token_count:18560, elapsed_ms:3200, error:null }`
- **③ GET /v1/tasks/{task_id}/progress**——SSE 进度流
- **SSE 事件**：`data: {"progress":0.2, "message":"版式识别中..."}` → 0.5"分块完成"→0.8"向量化中"→1.0"完成done=true"
- **④ DELETE /v1/tasks/{task_id}**——取消任务(200) → `{ task_id, status:"CANCELED" }`
- **⑤ GET /v1/documents/{doc_id}/chunks**——查看分块结果(page/page_size分页)
- **响应字段**：chunk_id/content/doc_id/kb_id/page_num/bbox/token_count → 共42块

---

## 第 14 页｜第七章 API 规范：检索 2 接口 + 2 时序图

- **① POST /v1/retrieval/search**——混合检索
- **请求**：`{ query, kb_ids, top_k:10, mode:"hybrid", similarity_threshold:0.2, rerank:true, highlight:true, chat_history }`
- **响应**：`{ query, keywords["深度学习","NLP"...], total:156, chunks[{chunk_id, content, highlight, similarity:0.94, bm25_score:0.72, vector_score:0.96, doc_name, page_num}], elapsed_ms:128 }`
- **② POST /v1/retrieval/embedding**——文本向量化(自管理向量场景)
- **请求**：`{ texts:["段落1","段落2"], model:"BAAI/bge-large-zh-v1.5" }` → **响应**：`{ embeddings:[[...],[...]], dimension:1024, token_count:48 }`
- **时序图：完整文档入库流程**：调用方→API(校验+存MinIO+入队Redis+返回202)→建立SSE→Worker(XREADGROUP→取文件→DeepDoc解析→分块→Embedding→写ES→XACK)→SSE推送完成
- **时序图：检索流程**：调用方→API→分词→向量化→Dealer(BM25+向量双路→RRF融合→过滤→Rerank→Top-N)→格式化高亮+元数据→返回200

---

## 第 15 页｜第八章 部署指导

- **目录结构**：doc-parse-svc/(main/routers/services/worker/models/Dockerfile) + retrieval-svc/(main/routers/services/Dockerfile) + ragflow-core/(deepdoc+rag+common 子模块) + docker-compose.yml + .env
- **Docker Compose 7 容器编排**：Nginx(80/443) → doc-parse-svc(:8201/replicas:2) + retrieval-svc(:8202/replicas:2) + task-worker(4副本) → ES + Redis + MinIO + MySQL → 内部网络隔离
- **doc-parse-svc replicas:2**：API 层面负载均衡(接收请求+入队) / **task-worker replicas:4**：消费者组多实例并行处理(实际计算资源)
- **关键环境变量**：DOC_ENGINE(elasticsearch/infinity) / EMBEDDING_MODEL(BAAI/bge-large-zh-v1.5) / EMBEDDING_BATCH_SIZE(32) / MAX_CONCURRENT_TASKS(5) / WORKER_HEARTBEAT_TIMEOUT(120s用于XAUTOCLAIM)
- **向量引擎选择**：ES(全文+向量一体/适合同时需要BM25) / Infinity(轻量自研/免运维) / OceanBase(HTAP混合负载)
- **Embedding 配置**：支持 Ollama 本地模型(EMBEDDING_BASE_URL=http://ollama:11434/v1) 或云端 API(EMBEDDING_API_KEY) → 通过 API Key 留空自动判断

---

## 第 16 页｜第九章 关键伪代码核心逻辑

- **① parse_service.py 提交任务核心**：SSRF 防护(assert_url_is_safe)→格式白名单校验(7种)→ParseService.create_task(存MinIO+写MySQL+Redis XADD入队)→返回 202+task_id+sse_url
- **② task_worker.py 消费处理核心**：主循环 while True→优先 XAUTOCLAIM 认领超时消息→XREADGROUP 获取新消息→Semaphore 控制并发→process_one_task(4阶段处理)→成功 XACK / 失败不 ACK(留在PEL被其他Worker认领)
- **process_one_task 4 阶段**：①MinIO取文件→②CHUNK_FACTORY[parser_id].chunk()(自动选解析器+按策略分块)→③批量 Embedding(title_weight=0.1+content_weight=0.9加权)→④ES bulk upsert(BM25+向量+元数据)
- **③ search_service.py 检索核心**：指代消解(有历史→LLM重写query)→构造Dealer.search() req→按mode设置权重(hybrid/vector/fulltext)→过检索 top_k*10→可选Rerank→格式化(高亮+分页+元数据+elapsed_ms)
- **关键复用点**：DeepDoc 解析器(RAGFlowPdfParser/DocxParser...)、分块工厂(CHUNK_FACTORY)、Dealer 检索(混合检索+RRF融合)、分词器(rag_tokenizer)、ES连接(common/doc_store/)、Redis Streams(rag/utils/redis_conn.py)

---

## 第 17 页｜总结与关键数据

- **核心价值**：2 个微服务 + 18 个零修改复用模块 = 将 RAGFlow 的核心能力"拆出来"，通过标准 REST API 对接到任何已有系统
- **架构亮点1**：完全复用 RAGFlow DeepDoc 解析精度(ONNX+XGBoost+OCR)，不重复造轮子
- **架构亮点2**：Redis Streams 消费者组 + PEL + XAUTOCLAIM → 任务不丢失、故障自动恢复
- **架构亮点3**：API 层(replicas:2)与 Worker 层(replicas:4)分离 → 请求接收与计算资源独立扩缩容
- **架构亮点4**：3 种检索模式(hybrid/vector/fulltext) + 可选 Rerank(三特征融合) + 可选多轮对话增强(借鉴 Vibe-RAG QualityJudge)
- **架构亮点5**：SSE+Redis Pub/Sub 实时进度推送 → 调用方全程感知处理进度(10%/55%/82%/100%)
- **标准接口总览**：5个文档接口 + 2个检索接口 = 完整文档入库+检索能力
- **部署资源**：Docker Compose 7 容器 / ES 内存建议 8GB+ / 支持 Ollama 本地模型 / 支持 GPU(NVIDIA ONNX 推理)

### 使用建议

| 时长 | 建议页码组合 | 约页数 |
|------|----------------|--------|
| **约 8 分钟** | P3, P4, P6, P8-9, P10, P14, P16-17 | **约 9** |
| **约 15 分钟** | P3-7, P8-9, P10-11, P12, P13-14, P16-17 | **约 14** |
| **完整汇报** | 全文 1～17 | **17** |

原报告文件：`4-DeepDoc 文档处理与检索微服务架构设计.md`
