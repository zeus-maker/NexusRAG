# DeepDoc 文档处理与检索微服务架构设计

> **文档类型**：系统架构设计 + 技术实施指导  
> **基础项目**：RAGFlow v0.25.4（主体）+ Vibe-RAG（辅助参考）  
> **设计原则**：最大化复用 RAGFlow 核心模块，以独立微服务形式对外暴露标准 HTTP 接口  
> **适用团队**：希望将深度文档理解能力独立部署、对接已有系统的工程团队

---

## 目录

1. [设计背景与目标](#一设计背景与目标)
2. [整体微服务拆分方案](#二整体微服务拆分方案)
3. [模块复用策略](#三模块复用策略)
4. [文档处理服务（DocParseService）](#四文档处理服务-docparseservice)
5. [检索服务（RetrievalService）](#五检索服务-retrievalservice)
6. [任务队列与状态管理](#六任务队列与状态管理)
7. [API 接口规范](#七api-接口规范)
8. [部署指导](#八部署指导)
9. [关键伪代码实现](#九关键伪代码实现)

---

## 一、设计背景与目标

### 1.1 背景说明

RAGFlow 是一套功能完整的 RAG 引擎，但其架构是以"单体应用 + Redis Streams 异步任务"的方式组织的，所有核心能力（文档解析、分块、向量化、检索）都深度耦合在同一个 Python 进程中，并通过共享数据库（MySQL）和消息队列（Redis Streams）协调。

对于已有系统（如 Vibe-RAG、其他业务平台）的工程团队来说，需要的不是完整部署 RAGFlow，而是：

- 一个**标准 REST 接口**：传入文件，返回解析好的文本块（Chunk）
- 一个**标准检索接口**：传入查询文本，返回相关文档块及相似度分数
- 可**独立水平扩展**的处理节点
- 能与**已有存储系统（Milvus / ES / 自建）** 对接

### 1.2 设计目标

| 目标 | 说明 |
|------|------|
| **接口标准化** | 对外提供 OpenAPI 兼容的 REST 接口，解耦下游调用方 |
| **核心能力复用** | 直接复用 RAGFlow 的 DeepDoc 解析引擎和 Dealer 检索类，不重复造轮子 |
| **状态无关** | 处理节点本身不保存业务状态，状态由 Redis + 数据库持久化 |
| **渐进式解耦** | 不强制要求下游使用 ES，支持通过适配器对接 Milvus / FAISS |
| **异步优先** | 文档处理走异步任务队列，检索走同步请求-响应 |
| **可观测** | 提供任务状态查询、进度推送（WebSocket / SSE）接口 |

---

## 二、整体微服务拆分方案

### 2.1 服务边界设计

根据职责单一原则，将 RAGFlow 的核心能力拆分为两个独立微服务：

```mermaid
flowchart TD
    Client["调用方<br/>（Vibe-RAG / 业务系统）"]

    subgraph Gateway["API 网关层（Nginx）"]
        GW["路由 / 限流 / 认证"]
    end

    subgraph DocSvc["文档处理服务 doc-parse-svc :8201"]
        direction TB
        DP_API["FastAPI 接口层<br/>POST /v1/documents/parse"]
        DP_QUEUE["任务队列消费者<br/>Redis Streams XREADGROUP"]
        DP_PARSE["DeepDoc 解析引擎<br/>deepdoc/parser/"]
        DP_CHUNK["分块策略工厂<br/>rag/app/naive|paper|book..."]
        DP_EMBED["Embedding 向量化<br/>rag/llm/embedding_model.py"]
        DP_STORE["写入向量引擎<br/>common/doc_store/"]
        DP_CB["回调 / 进度推送<br/>SSE / WebSocket"]

        DP_API --> DP_QUEUE
        DP_QUEUE --> DP_PARSE
        DP_PARSE --> DP_CHUNK
        DP_CHUNK --> DP_EMBED
        DP_EMBED --> DP_STORE
        DP_STORE --> DP_CB
    end

    subgraph RetSvc["检索服务 retrieval-svc :8202"]
        direction TB
        RT_API["FastAPI 接口层<br/>POST /v1/retrieval/search"]
        RT_QP["查询预处理<br/>分词 + 向量化"]
        RT_HYBRID["混合检索<br/>rag/nlp/search.py Dealer"]
        RT_RERANK["精排（可选）<br/>Reranker 模型"]
        RT_RESP["结果格式化返回"]

        RT_API --> RT_QP
        RT_QP --> RT_HYBRID
        RT_HYBRID --> RT_RERANK
        RT_RERANK --> RT_RESP
    end

    subgraph Infra["基础设施层"]
        REDIS["Redis 7<br/>任务队列 / 进度缓存 / 分布式锁"]
        ES["Elasticsearch 8 / Infinity<br/>BM25 + 向量双引擎"]
        MINIO["MinIO / S3<br/>原始文件存储"]
        MYSQL["MySQL / SQLite<br/>任务元数据"]
    end

    Client --> Gateway
    Gateway --> DocSvc
    Gateway --> RetSvc
    DocSvc --> Infra
    RetSvc --> ES
```

### 2.2 服务职责划分

| 服务名 | 职责 | 端口 | 同步/异步 | 核心复用模块 |
|--------|------|------|-----------|-------------|
| **doc-parse-svc** | 文件接收 → 解析 → 分块 → 向量化 → 写索引 | 8201 | 异步（Redis Streams） | `deepdoc/`, `rag/app/`, `rag/llm/`, `common/doc_store/` |
| **retrieval-svc** | 查询 → 混合检索 → 精排 → 返回 | 8202 | 同步（请求-响应） | `rag/nlp/search.py`, `rag/llm/` |

### 2.3 数据流总览

```mermaid
flowchart TD
    U1["用户上传文件"] -->|"POST /v1/documents/parse"| DocSvc
    DocSvc -->|"生成 task_id 入队"| Redis
    DocSvc -->|"返回 task_id"| U1
    Redis -->|"XREADGROUP 消费"| Worker
    Worker -->|"读取文件二进制"| MinIO
    Worker -->|"DeepDoc 解析 + 分块"| Chunks
    Chunks -->|"批量 Embedding"| EmbedModel
    EmbedModel -->|"写入向量 + BM25 索引"| ES
    ES -->|"索引完成"| Worker
    Worker -->|"更新任务状态"| MySQL
    Worker -->|"SSE 进度推送"| U1

    U2["用户发起检索"] -->|"POST /v1/retrieval/search"| RetSvc
    RetSvc -->|"分词 + 向量化 Query"| EmbedModel2["Embedding 模型"]
    EmbedModel2 -->|"BM25 + 向量混合检索"| ES
    ES -->|"返回候选 Chunks"| RetSvc
    RetSvc -->|"Rerank 精排（可选）"| RerankModel
    RerankModel -->|"Top-N 结果"| U2
```

---

## 三、模块复用策略

### 3.1 可直接复用模块清单

以下模块可以**零修改或极少修改**直接 `import` 复用：

| 模块路径 | 功能 | 复用方式 | 注意事项 |
|---------|------|---------|---------|
| `deepdoc/parser/pdf_parser.py` | PDF 解析（ONNX 版式 + XGBoost 阅读序 + OCR） | 直接 import `RAGFlowPdfParser` | 首次启动需下载 ONNX 模型文件 |
| `deepdoc/parser/docx_parser.py` | DOCX 解析 | 直接 import `DocxParser` | 无依赖 |
| `deepdoc/parser/excel_parser.py` | Excel 解析 | 直接 import `RAGFlowExcelParser` | 无依赖 |
| `deepdoc/parser/ppt_parser.py` | PPT 解析 | 直接 import `RAGFlowPptParser` | 无依赖 |
| `deepdoc/parser/html_parser.py` | HTML 解析 | 直接 import `RAGFlowHtmlParser` | 无依赖 |
| `deepdoc/parser/markdown_parser.py` | Markdown 解析 | 直接 import `RAGFlowMarkdownParser` | 无依赖 |
| `deepdoc/parser/txt_parser.py` | 纯文本解析 | 直接 import `RAGFlowTxtParser` | 无依赖 |
| `rag/app/naive.py` | 通用分块策略（chunk 函数） | 直接 import `chunk` 函数 | 依赖 `deepdoc/` |
| `rag/app/paper.py` | 论文分块策略 | 直接 import `chunk` 函数 | 依赖 PDF parser |
| `rag/app/table.py` | 表格分块策略 | 直接 import `chunk` 函数 | 依赖 Excel parser |
| `rag/nlp/search.py` | 混合检索 Dealer 类 | 直接 import `Dealer` | 依赖 `common/doc_store/` |
| `rag/nlp/rag_tokenizer.py` | 中英文分词 | 直接 import `tokenize`, `fine_grained_tokenize` | 依赖 `infinity` C++ 扩展 |
| `rag/llm/embedding_model.py` | Embedding 模型工厂 | 直接 import | 需配置 API Key |
| `rag/llm/rerank_model.py` | Rerank 模型工厂 | 直接 import | 需配置模型 |
| `common/doc_store/es_conn.py` | ES 连接 + 操作 | 直接 import | 需 ES 环境 |
| `common/doc_store/infinity_conn.py` | Infinity 向量引擎 | 直接 import | 需 Infinity 环境 |
| `common/ssrf_guard.py` | SSRF 防护 | 直接 import `assert_url_is_safe` | 无依赖 |
| `rag/utils/redis_conn.py` | Redis Streams 客户端 | 直接 import `REDIS_CONN` | 需 Redis 环境 |

### 3.2 需要适配/裁剪的模块

| 模块路径 | 问题 | 适配方案 |
|---------|------|---------|
| `rag/svr/task_executor.py` | 深度依赖 MySQL `TaskService`, `DocumentService` | **裁剪**：提取核心逻辑，替换 DB 操作为轻量 SQLite/PostgreSQL 模型 |
| `api/db/services/` | 依赖 RAGFlow 完整数据库 schema | **不复用**：在新服务中定义最小化数据模型 |
| `api/apps/` | Flask/Quart Blueprint | **不复用**：用 FastAPI 重写接口层 |
| `rag/llm/` 工厂初始化 | 依赖 `conf/llm_factories.json` | **直接复用**：将 `conf/` 目录一并打包 |

### 3.3 模块依赖关系图

```mermaid
flowchart TD
    subgraph 新服务代码["新增代码层（FastAPI）"]
        API["接口层<br/>routers/"]
        SVC["业务逻辑层<br/>services/"]
        MODEL["数据模型层<br/>models/"]
    end

    subgraph RAGFlow核心["RAGFlow 核心模块（直接复用）"]
        DD["deepdoc/<br/>parser/ + vision/"]
        RAGAPP["rag/app/<br/>naive / paper / book / table ..."]
        RAGNLP["rag/nlp/<br/>search.py + rag_tokenizer.py"]
        RAGLLM["rag/llm/<br/>embedding + rerank 工厂"]
        COMMON["common/<br/>doc_store/ + ssrf_guard + settings"]
        UTILS["rag/utils/<br/>redis_conn.py"]
    end

    subgraph 基础设施
        ES2["Elasticsearch / Infinity"]
        REDIS2["Redis 7"]
        MINIO2["MinIO / S3"]
        DB["MySQL / SQLite"]
    end

    API --> SVC
    SVC --> MODEL
    SVC --> DD
    SVC --> RAGAPP
    SVC --> RAGNLP
    SVC --> RAGLLM
    SVC --> COMMON
    SVC --> UTILS
    COMMON --> ES2
    UTILS --> REDIS2
    SVC --> MINIO2
    MODEL --> DB
```

---

## 四、文档处理服务（DocParseService）

### 4.1 职责与边界

**doc-parse-svc** 负责完整的"文件 → 可检索 Chunk"管线，包括：

1. **文件接收**：接受 multipart/form-data 上传或 URL 拉取
2. **格式转换**（可选）：DOC/PPT 旧格式通过 LibreOffice 转 PDF
3. **内容解析**：使用 RAGFlow DeepDoc 引擎解析文档结构
4. **智能分块**：根据文档类型选择最优分块策略
5. **向量化**：批量 Embedding，标题向量加权
6. **索引写入**：写入 ES/Infinity，同时建立 BM25 全文索引
7. **进度通知**：通过 SSE 推送实时进度，支持回调 URL

### 4.2 内部处理管线

```mermaid
flowchart TD
    UPLOAD["文件上传<br/>POST /v1/documents/parse"] 
    VALIDATE["输入校验<br/>文件大小 / 格式白名单 / SSRF 防护"]
    STORE_RAW["存储原始文件<br/>MinIO bucket/tenant/uuid.ext"]
    ENQUEUE["创建任务记录<br/>task_id 写入 MySQL<br/>消息推入 Redis Streams"]
    RESP["返回 202 Accepted<br/>{ task_id, sse_url }"]

    CONSUME["Worker 消费消息<br/>XREADGROUP BLOCK 0"]
    FETCH["拉取文件二进制<br/>MinIO.get(bucket, key)"]
    FORMAT_CHECK{"格式判断"}
    CONVERT["格式转换（可选）<br/>LibreOffice unoserver"]

    subgraph PARSE_STAGE["解析阶段（复用 deepdoc/）"]
        DETECT["文档类型检测<br/>扩展名 + magic bytes"]
        PARSER_SELECT{"选择解析器"}
        PDF_PARSE["RAGFlowPdfParser<br/>ONNX + XGBoost + OCR"]
        DOCX_PARSE["DocxParser<br/>XML 级解析"]
        EXCEL_PARSE["RAGFlowExcelParser<br/>行列结构保留"]
        OTHER_PARSE["其他格式解析器<br/>PPT / HTML / MD / TXT"]
        DETECT --> PARSER_SELECT
        PARSER_SELECT -->|PDF| PDF_PARSE
        PARSER_SELECT -->|DOCX| DOCX_PARSE
        PARSER_SELECT -->|Excel| EXCEL_PARSE
        PARSER_SELECT -->|其他| OTHER_PARSE
    end

    subgraph CHUNK_STAGE["分块阶段（复用 rag/app/）"]
        STRATEGY_SELECT{"选择分块策略<br/>parser_id"}
        NAIVE_CHUNK["naive.chunk()<br/>通用智能分块"]
        PAPER_CHUNK["paper.chunk()<br/>学术论文分块"]
        TABLE_CHUNK["table.chunk()<br/>表格行级分块"]
        QA_CHUNK["qa.chunk()<br/>问答对提取"]
        MERGE["段落合并 + 去重<br/>避免碎片化"]
        STRATEGY_SELECT -->|naive/book/manual| NAIVE_CHUNK
        STRATEGY_SELECT -->|paper| PAPER_CHUNK
        STRATEGY_SELECT -->|table| TABLE_CHUNK
        STRATEGY_SELECT -->|qa| QA_CHUNK
        NAIVE_CHUNK --> MERGE
        PAPER_CHUNK --> MERGE
        TABLE_CHUNK --> MERGE
        QA_CHUNK --> MERGE
    end

    subgraph EMBED_STAGE["向量化阶段（复用 rag/llm/）"]
        BATCH["批量构造<br/>[title + content]"]
        TITLE_EMBED["标题 Embedding<br/>filename_embd_weight=0.1"]
        CONTENT_EMBED["内容 Embedding<br/>批量 encode()"]
        WEIGHTED["加权合并向量<br/>v = 0.1*title + 0.9*content"]
        BATCH --> TITLE_EMBED
        BATCH --> CONTENT_EMBED
        TITLE_EMBED --> WEIGHTED
        CONTENT_EMBED --> WEIGHTED
    end

    subgraph INDEX_STAGE["索引阶段（复用 common/doc_store/）"]
        BM25_IDX["BM25 全文索引<br/>rag_tokenizer 分词"]
        VEC_IDX["向量索引<br/>HNSW / IVF_FLAT"]
        META_IDX["元数据字段<br/>doc_id / kb_id / tenant_id"]
        BM25_IDX --> META_IDX
        VEC_IDX --> META_IDX
    end

    ACK["XACK 确认消息<br/>更新任务状态 = DONE"]
    NOTIFY["回调通知<br/>POST callback_url"]

    UPLOAD --> VALIDATE --> STORE_RAW --> ENQUEUE --> RESP
    ENQUEUE -.->|"异步"| CONSUME
    CONSUME --> FETCH --> FORMAT_CHECK
    FORMAT_CHECK -->|"需要转换"| CONVERT --> PARSE_STAGE
    FORMAT_CHECK -->|"直接解析"| PARSE_STAGE
    PARSE_STAGE --> CHUNK_STAGE
    CHUNK_STAGE --> EMBED_STAGE
    EMBED_STAGE --> INDEX_STAGE
    INDEX_STAGE --> ACK --> NOTIFY
```

### 4.3 分块策略选择逻辑

系统根据文件类型和用户配置自动选择最优分块策略。这是直接复用 RAGFlow `rag/app/` 目录下的策略工厂：

```mermaid
flowchart TD
    INPUT["输入：parser_id + 文件类型"]
    A{"parser_id 是否指定?"}
    B{"文件扩展名"}
    C["paper.chunk()"]
    D["table.chunk()"]
    E["qa.chunk()"]
    F["manual.chunk()"]
    G["book.chunk()"]
    H["naive.chunk()<br/>（默认兜底）"]

    INPUT --> A
    A -->|"paper"| C
    A -->|"table / excel"| D
    A -->|"qa"| E
    A -->|"manual"| F
    A -->|"book"| G
    A -->|"naive / 未指定"| B
    B -->|".pdf 多页"| B1{"页数 > 100?"}
    B1 -->|"是"| G
    B1 -->|"否"| H
    B -->|".docx"| H
    B -->|".xlsx / .csv"| D
    B -->|".pptx"| H
    B -->|"其他"| H
```

### 4.4 错误处理与重试策略

```mermaid
flowchart TD
    TASK_START["任务开始执行"]
    TRY_PARSE["尝试解析文档"]
    PARSE_OK{"解析成功?"}
    TRY_EMBED["尝试批量 Embedding"]
    EMBED_OK{"Embedding 成功?"}
    RETRY_EMBED{"重试次数 < 3?"}
    BACKOFF["指数退避等待<br/>2^n 秒（1/2/4）"]
    TRY_INDEX["写入向量引擎"]
    INDEX_OK{"写入成功?"}
    SET_DONE["状态 = DONE<br/>XACK 消息"]
    SET_FAILED["状态 = FAILED<br/>保留 PEL 消息<br/>记录错误日志"]
    XAUTOCLAIM["其他 Worker 认领<br/>XAUTOCLAIM 超时消息"]

    TASK_START --> TRY_PARSE
    TRY_PARSE --> PARSE_OK
    PARSE_OK -->|"是"| TRY_EMBED
    PARSE_OK -->|"否"| SET_FAILED
    TRY_EMBED --> EMBED_OK
    EMBED_OK -->|"是"| TRY_INDEX
    EMBED_OK -->|"否"| RETRY_EMBED
    RETRY_EMBED -->|"是"| BACKOFF --> TRY_EMBED
    RETRY_EMBED -->|"否"| SET_FAILED
    TRY_INDEX --> INDEX_OK
    INDEX_OK -->|"是"| SET_DONE
    INDEX_OK -->|"否"| SET_FAILED
    SET_FAILED -.->|"Worker 崩溃 > 30min"| XAUTOCLAIM
    XAUTOCLAIM --> TASK_START
```

---

## 五、检索服务（RetrievalService）

### 5.1 职责与边界

**retrieval-svc** 负责完整的"查询 → 相关 Chunk"流程：

1. **查询预处理**：分词、向量化、指代消解（可选）
2. **混合检索**：BM25 全文 + 向量近邻，RRF 加权融合
3. **后过滤**：租户隔离、删除文档过滤、相似度阈值
4. **精排**：Rerank 模型二次排序（可选）
5. **结果格式化**：高亮、分页、元数据附加

### 5.2 检索管线

```mermaid
flowchart TD
    QUERY_IN["检索请求<br/>POST /v1/retrieval/search<br/>{ query, kb_ids, top_k, mode }"]

    subgraph PREPROCESS["查询预处理"]
        TOKENIZE["rag_tokenizer 分词<br/>关键词提取 + 停用词过滤"]
        EMBED_Q["Query 向量化<br/>emb_mdl.encode_queries(query)"]
        TOKENIZE --> EMBED_Q
    end

    subgraph SEARCH_CORE["核心检索（复用 Dealer.search()）"]
        BM25_MATCH["BM25 全文匹配<br/>MatchTextExpr<br/>min_match=0.3"]
        VEC_MATCH["向量近邻搜索<br/>MatchDenseExpr<br/>cosine, topk=1024"]
        FUSION["加权融合<br/>FusionExpr('weighted_sum')<br/>BM25:0.05 + 向量:0.95"]
        FALLBACK{"结果为空?"}
        RETRY_SEARCH["降低 min_match=0.1<br/>similarity=0.17 重试"]
        BM25_MATCH --> FUSION
        VEC_MATCH --> FUSION
        FUSION --> FALLBACK
        FALLBACK -->|"是"| RETRY_SEARCH
        FALLBACK -->|"否"| FILTER
        RETRY_SEARCH --> FILTER
    end

    subgraph FILTER["后过滤层"]
        TENANT_FILTER["租户/知识库过滤<br/>kb_ids 白名单"]
        DELETE_FILTER["删除文档过滤<br/>_prune_deleted_chunks()"]
        SCORE_FILTER["相似度阈值过滤<br/>similarity >= 0.2"]
        TENANT_FILTER --> DELETE_FILTER --> SCORE_FILTER
    end

    subgraph RERANK["精排层（可选）"]
        RERANK_CHECK{"启用 Rerank?"}
        MODEL_RERANK["Rerank 模型打分<br/>rerank_by_model()<br/>tkweight*tksim + vtweight*vtsim + rank_fea"]
        SKIP_RERANK["直接截断 Top-N"]
        RERANK_CHECK -->|"是"| MODEL_RERANK
        RERANK_CHECK -->|"否"| SKIP_RERANK
    end

    FORMAT["结果格式化<br/>高亮 + 元数据 + 分页"]
    RESP["返回检索结果<br/>{ chunks, total, keywords }"]

    QUERY_IN --> PREPROCESS
    PREPROCESS --> SEARCH_CORE
    SEARCH_CORE --> FILTER
    FILTER --> RERANK
    RERANK --> FORMAT --> RESP
```

### 5.3 检索模式配置

支持三种检索模式，通过请求参数 `mode` 指定：

| 模式 | BM25 | 向量 | 说明 | 适用场景 |
|------|------|------|------|---------|
| `hybrid`（默认） | ✅ weight=0.05 | ✅ weight=0.95 | 混合检索，RRF 融合 | 通用场景，兼顾精确与语义 |
| `vector` | ❌ | ✅ weight=1.0 | 纯向量检索 | 语义相似度优先场景 |
| `fulltext` | ✅ weight=1.0 | ❌ | 纯 BM25 检索 | 精确关键词、法律条文、产品型号 |

### 5.4 多轮对话增强（可选集成 Vibe-RAG 策略）

借鉴 Vibe-RAG 的 LangGraph QualityJudgeNode，可在检索服务中集成轻量的多轮质量判断：

```mermaid
flowchart TD
    INPUT["输入：query + chat_history（可选）"]
    HAS_HISTORY{"有对话历史?"}
    CONTEXT_RESOLVE["指代消解<br/>LLM 重写 query<br/>消解 '它' / '这个' 等代词"]
    STANDARD_SEARCH["执行标准混合检索"]
    QUALITY_CHECK{"召回数量 >= min_chunks?"}
    RETRY_CHECK{"重试次数 < max_retry?"}
    EXPAND_QUERY["查询扩展<br/>LLM 生成子查询<br/>合并多路结果"]
    FINAL_RESULT["返回最终 Chunks"]

    INPUT --> HAS_HISTORY
    HAS_HISTORY -->|"是"| CONTEXT_RESOLVE
    HAS_HISTORY -->|"否"| STANDARD_SEARCH
    CONTEXT_RESOLVE --> STANDARD_SEARCH
    STANDARD_SEARCH --> QUALITY_CHECK
    QUALITY_CHECK -->|"满足"| FINAL_RESULT
    QUALITY_CHECK -->|"不满足"| RETRY_CHECK
    RETRY_CHECK -->|"可以重试"| EXPAND_QUERY
    RETRY_CHECK -->|"超限"| FINAL_RESULT
    EXPAND_QUERY --> STANDARD_SEARCH
```

---

## 六、任务队列与状态管理

### 6.1 Redis Streams 任务队列设计

复用 RAGFlow 的 Redis Streams 消费者组模式（`rag/utils/redis_conn.py`），关键机制说明：

```mermaid
flowchart TD
    subgraph 生产者["doc-parse-svc API 层（生产者）"]
        P1["接收上传请求"]
        P2["写入 task 元数据 → MySQL"]
        P3["XADD SVR_QUEUE_NAME<br/>{ task_id, tenant_id, kb_id, bucket, key }"]
        P1 --> P2 --> P3
    end

    subgraph Stream["Redis Streams<br/>SVR_QUEUE_NAME（多队列分片）"]
        MSG["消息体<br/>{ id, task_id, ... }"]
        PEL["PEL 待确认列表<br/>Pending Entry List"]
        MSG --> PEL
    end

    subgraph 消费者组["Task Worker 消费者组（可多实例）"]
        direction TB
        W1["Worker-0<br/>XREADGROUP GROUP ragflow worker-0 BLOCK 0"]
        W2["Worker-1<br/>XREADGROUP GROUP ragflow worker-1 BLOCK 0"]
        W3["Worker-N<br/>..."]
        W1 -->|"处理成功"| ACK1["XACK → 从 PEL 移除"]
        W2 -->|"处理成功"| ACK2["XACK → 从 PEL 移除"]
    end

    subgraph 故障恢复["故障自动恢复"]
        CRASH["Worker 崩溃<br/>消息留在 PEL > 30min"]
        AUTOCLAIM["XAUTOCLAIM<br/>其他 Worker 认领"]
        REPROCESS["重新处理任务"]
        CRASH --> AUTOCLAIM --> REPROCESS
    end

    生产者 --> Stream
    Stream --> 消费者组
    消费者组 -.->|"崩溃"| 故障恢复
    故障恢复 --> Stream
```

### 6.2 任务状态机

```mermaid
flowchart TD
    INIT["PENDING<br/>（已入队，等待消费）"]
    RUNNING["RUNNING<br/>（Worker 正在处理）"]
    DONE["DONE<br/>（处理完成，已 XACK）"]
    FAILED["FAILED<br/>（处理失败，记录错误）"]
    CANCELED["CANCELED<br/>（用户主动取消）"]

    INIT -->|"Worker XREADGROUP 获取"| RUNNING
    RUNNING -->|"处理成功 XACK"| DONE
    RUNNING -->|"处理失败 > 3 次"| FAILED
    RUNNING -->|"用户调用 DELETE /tasks/{id}"| CANCELED
    FAILED -->|"手动重试"| INIT
    CANCELED -->|"重新提交"| INIT
```

### 6.3 进度推送（SSE）

```mermaid
sequenceDiagram
    participant Client as 调用方
    participant API as doc-parse-svc
    participant Redis as Redis Pub/Sub
    participant Worker as Task Worker

    Client->>API: POST /v1/documents/parse
    API-->>Client: 202 { task_id, sse_url }
    Client->>API: GET /v1/tasks/{task_id}/progress （SSE 长连接）

    Worker->>Redis: PUBLISH task:{task_id}:progress {"prog": 0.3, "msg": "解析中..."}
    Redis-->>API: 推送进度事件
    API-->>Client: data: {"progress": 0.3, "message": "解析中..."}

    Worker->>Redis: PUBLISH task:{task_id}:progress {"prog": 0.6, "msg": "分块完成"}
    Redis-->>API: 推送进度事件
    API-->>Client: data: {"progress": 0.6, "message": "分块完成"}

    Worker->>Redis: PUBLISH task:{task_id}:progress {"prog": 0.9, "msg": "向量化中..."}
    Redis-->>API: 推送进度事件
    API-->>Client: data: {"progress": 0.9, "message": "向量化中..."}

    Worker->>Redis: PUBLISH task:{task_id}:progress {"prog": 1.0, "msg": "完成"}
    Redis-->>API: 推送完成事件
    API-->>Client: data: {"progress": 1.0, "message": "完成", "done": true}
    Note over Client,API: SSE 连接关闭
```

---

## 七、API 接口规范

### 7.1 文档处理服务接口

#### POST `/v1/documents/parse` — 提交文档解析任务

**请求（multipart/form-data）**：

```
file         : 文件二进制（与 url 二选一）
url          : 文件远程 URL（与 file 二选一，经 SSRF 防护校验）
kb_id        : 知识库 ID（用于索引隔离）
parser_id    : 分块策略（naive/paper/book/manual/table/qa，默认 naive）
chunk_size   : 块大小 token 数（默认 512）
chunk_overlap: 块重叠 token 数（默认 128）
callback_url : 完成后的回调地址（可选）
language     : 文档语言（Chinese/English，影响分词，默认 Chinese）
```

**响应 202 Accepted**：

```json
{
  "task_id": "tid_abc123",
  "status": "PENDING",
  "sse_url": "/v1/tasks/tid_abc123/progress",
  "created_at": "2026-06-03T10:00:00Z"
}
```

---

#### GET `/v1/tasks/{task_id}` — 查询任务状态

**响应 200**：

```json
{
  "task_id": "tid_abc123",
  "status": "DONE",
  "progress": 1.0,
  "chunk_count": 42,
  "token_count": 18560,
  "elapsed_ms": 3200,
  "error": null,
  "done_at": "2026-06-03T10:00:03Z"
}
```

---

#### GET `/v1/tasks/{task_id}/progress` — SSE 进度流

```
Content-Type: text/event-stream

data: {"progress": 0.2, "message": "Page(1~10): 版式识别中..."}

data: {"progress": 0.5, "message": "分块完成，共 42 块"}

data: {"progress": 0.8, "message": "向量化中 32/42..."}

data: {"progress": 1.0, "message": "完成", "done": true, "chunk_count": 42}
```

---

#### DELETE `/v1/tasks/{task_id}` — 取消任务

**响应 200**：

```json
{ "task_id": "tid_abc123", "status": "CANCELED" }
```

---

#### GET `/v1/documents/{doc_id}/chunks` — 查看文档分块结果

**Query Params**：`page=1&page_size=20`

**响应 200**：

```json
{
  "total": 42,
  "chunks": [
    {
      "chunk_id": "ck_001",
      "content": "本文提出一种基于深度学习的...",
      "doc_id": "doc_xyz",
      "kb_id": "kb_001",
      "page_num": [1, 2],
      "bbox": [[120, 80, 540, 320]],
      "token_count": 128
    }
  ]
}
```

---

### 7.2 检索服务接口

#### POST `/v1/retrieval/search` — 混合检索

**请求（JSON）**：

```json
{
  "query": "深度学习在自然语言处理中的应用",
  "kb_ids": ["kb_001", "kb_002"],
  "top_k": 10,
  "mode": "hybrid",
  "similarity_threshold": 0.2,
  "rerank": true,
  "highlight": true,
  "chat_history": [
    { "role": "user", "content": "上一个问题" },
    { "role": "assistant", "content": "上一个回答" }
  ]
}
```

**响应 200**：

```json
{
  "query": "深度学习在自然语言处理中的应用",
  "keywords": ["深度学习", "自然语言处理", "NLP", "应用"],
  "total": 156,
  "chunks": [
    {
      "chunk_id": "ck_001",
      "content": "Transformer 架构在 NLP 领域取得了...",
      "highlight": "<em>深度学习</em>在<em>自然语言处理</em>中...",
      "similarity": 0.94,
      "bm25_score": 0.72,
      "vector_score": 0.96,
      "doc_name": "attention_is_all_you_need.pdf",
      "doc_id": "doc_001",
      "kb_id": "kb_001",
      "page_num": [3]
    }
  ],
  "elapsed_ms": 128
}
```

---

#### POST `/v1/retrieval/embedding` — 文本向量化

用于调用方需要自行管理向量的场景：

**请求**：

```json
{
  "texts": ["第一段文本", "第二段文本"],
  "model": "BAAI/bge-large-zh-v1.5"
}
```

**响应**：

```json
{
  "embeddings": [[0.12, -0.34, ...], [0.56, 0.78, ...]],
  "dimension": 1024,
  "token_count": 48
}
```

---

### 7.3 时序图：完整文档入库流程

```mermaid
sequenceDiagram
    participant C as 调用方系统
    participant API as doc-parse-svc
    participant Redis as Redis Streams
    participant Worker as Task Worker
    participant MinIO as MinIO
    participant DeepDoc as DeepDoc 引擎
    participant Embed as Embedding 模型
    participant ES as Elasticsearch

    C->>API: POST /v1/documents/parse (file, kb_id, parser_id)
    API->>API: 校验文件格式 + SSRF 防护
    API->>MinIO: PUT bucket/tenant/uuid.pdf
    API->>MySQL: INSERT task (status=PENDING)
    API->>Redis: XADD SVR_QUEUE { task_id, bucket, key }
    API-->>C: 202 { task_id, sse_url }

    C->>API: GET /v1/tasks/{task_id}/progress (SSE)
    Note over C,API: 建立 SSE 长连接

    Worker->>Redis: XREADGROUP BLOCK 0 (获取消息)
    Worker->>MySQL: UPDATE task status=RUNNING
    Worker->>Redis: PUBLISH progress {0.1, "开始处理"}
    API-->>C: SSE: progress=0.1

    Worker->>MinIO: GET bucket/tenant/uuid.pdf
    Worker->>DeepDoc: RAGFlowPdfParser.__call__(binary)
    Note over DeepDoc: ONNX 版式识别<br/>XGBoost 阅读序<br/>OCR（扫描件）
    DeepDoc-->>Worker: 结构化文本块列表

    Worker->>Worker: naive.chunk() / paper.chunk() 按策略分块
    Worker->>Redis: PUBLISH progress {0.6, "分块完成 42 块"}
    API-->>C: SSE: progress=0.6

    Worker->>Embed: encode(titles + contents, batch=32)
    Embed-->>Worker: 向量列表 [[...], ...]
    Worker->>Redis: PUBLISH progress {0.9, "向量化完成"}
    API-->>C: SSE: progress=0.9

    Worker->>ES: bulk upsert (BM25 + 向量 + 元数据)
    ES-->>Worker: 写入成功
    Worker->>Redis: XACK 消息
    Worker->>MySQL: UPDATE task status=DONE, chunk_count=42
    Worker->>Redis: PUBLISH progress {1.0, "完成", done=true}
    API-->>C: SSE: progress=1.0, done=true
    Note over C,API: SSE 连接关闭
```

### 7.4 时序图：检索流程

```mermaid
sequenceDiagram
    participant C as 调用方系统
    participant API as retrieval-svc
    participant Tokenizer as rag_tokenizer
    participant Embed as Embedding 模型
    participant Dealer as Dealer (search.py)
    participant ES as Elasticsearch
    participant Reranker as Rerank 模型

    C->>API: POST /v1/retrieval/search { query, kb_ids, top_k, mode }
    API->>Tokenizer: fine_grained_tokenize(query) → keywords
    API->>Embed: encode_queries(query) → query_vector

    API->>Dealer: dealer.search(req, idx_names, kb_ids)
    Dealer->>ES: MatchTextExpr (BM25) weight=0.05
    Dealer->>ES: MatchDenseExpr (向量) weight=0.95
    Dealer->>ES: FusionExpr("weighted_sum") 合并
    ES-->>Dealer: 候选 Chunks（最多 1024）

    Dealer->>Dealer: _prune_deleted_chunks() 过滤已删除文档
    Dealer->>Dealer: 相似度阈值过滤 >= 0.2

    alt 启用 Rerank
        Dealer->>Reranker: rerank_by_model(chunks, query)
        Note over Reranker: tkweight*tksim + vtweight*vtsim + rank_fea
        Reranker-->>Dealer: 精排后的 Top-N 分数
    end

    Dealer-->>API: SearchResult { ids, field, highlight, keywords }
    API->>API: 格式化：高亮 + 分页 + 元数据附加
    API-->>C: 200 { chunks, total, keywords, elapsed_ms }
```

---

## 八、部署指导

### 8.1 目录结构设计

```
deepdoc-services/
├── doc-parse-svc/               # 文档处理服务
│   ├── main.py                  # FastAPI 应用入口
│   ├── routers/
│   │   ├── documents.py         # POST /v1/documents/parse
│   │   └── tasks.py             # GET /v1/tasks/{id}
│   ├── services/
│   │   ├── parse_service.py     # 解析业务逻辑
│   │   └── embed_service.py     # 向量化业务逻辑
│   ├── worker/
│   │   └── task_worker.py       # Redis Streams 消费者
│   ├── models/
│   │   └── task.py              # SQLAlchemy 任务模型
│   └── Dockerfile
│
├── retrieval-svc/               # 检索服务
│   ├── main.py                  # FastAPI 应用入口
│   ├── routers/
│   │   └── retrieval.py         # POST /v1/retrieval/search
│   ├── services/
│   │   └── search_service.py    # 检索业务逻辑
│   └── Dockerfile
│
├── ragflow-core/                # RAGFlow 核心模块（git submodule 或 symlink）
│   ├── deepdoc/                 # 直接复用
│   ├── rag/app/                 # 直接复用
│   ├── rag/nlp/                 # 直接复用
│   ├── rag/llm/                 # 直接复用
│   ├── rag/utils/redis_conn.py  # 直接复用
│   ├── common/                  # 直接复用
│   └── conf/                    # llm_factories.json 等配置
│
├── docker-compose.yml           # 完整部署编排
└── .env                         # 环境变量配置
```

### 8.2 Docker Compose 部署编排

```mermaid
flowchart TD
    subgraph DockerCompose["docker-compose.yml"]
        direction TB
        SVC_PARSE["doc-parse-svc<br/>image: deepdoc/parse:latest<br/>port: 8201<br/>replicas: 2"]
        SVC_RET["retrieval-svc<br/>image: deepdoc/retrieval:latest<br/>port: 8202<br/>replicas: 2"]
        SVC_WORKER["task-worker<br/>image: deepdoc/parse:latest<br/>command: python worker/task_worker.py<br/>replicas: 4"]
        NGINX["nginx<br/>image: nginx:latest<br/>port: 80/443<br/>路由 /v1/documents → 8201<br/>路由 /v1/retrieval → 8202"]
        ES2["elasticsearch<br/>image: elasticsearch:8.x<br/>port: 9200"]
        REDIS2["redis<br/>image: redis:7<br/>port: 6379"]
        MINIO2["minio<br/>image: minio/minio:latest<br/>port: 9000"]
        MYSQL2["mysql<br/>image: mysql:8<br/>port: 3306"]

        NGINX --> SVC_PARSE
        NGINX --> SVC_RET
        SVC_PARSE --> REDIS2
        SVC_PARSE --> MINIO2
        SVC_PARSE --> MYSQL2
        SVC_WORKER --> REDIS2
        SVC_WORKER --> MINIO2
        SVC_WORKER --> ES2
        SVC_WORKER --> MYSQL2
        SVC_RET --> ES2
    end
```

### 8.3 环境变量配置说明

```bash
# ============= 向量引擎 =============
DOC_ENGINE=elasticsearch           # elasticsearch | infinity | oceanbase
ES_HOST=elasticsearch:9200
ES_USERNAME=elastic
ES_PASSWORD=changeme

# ============= Redis =============
REDIS_HOST=redis
REDIS_PORT=6379
SVR_QUEUE_NAME=deepdoc_parse_queue
SVR_CONSUMER_GROUP=deepdoc_workers

# ============= 对象存储 =============
MINIO_HOST=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=deepdoc

# ============= Embedding 模型 =============
EMBEDDING_MODEL=BAAI/bge-large-zh-v1.5   # 使用 Ollama 本地模型
EMBEDDING_API_KEY=                        # 留空表示本地
EMBEDDING_BASE_URL=http://ollama:11434/v1
EMBEDDING_BATCH_SIZE=32                   # 批量向量化大小

# ============= Rerank 模型（可选）=============
RERANK_MODEL=BAAI/bge-reranker-v2-m3
RERANK_API_KEY=
RERANK_BASE_URL=http://ollama:11434/v1

# ============= 任务执行 =============
MAX_CONCURRENT_TASKS=5                    # 单 Worker 最大并发任务数
MAX_CONCURRENT_CHUNK_BUILDERS=2           # 最大并发解析数
WORKER_HEARTBEAT_TIMEOUT=120              # Worker 心跳超时秒数（用于 XAUTOCLAIM）

# ============= 任务元数据库 =============
DB_URL=mysql+pymysql://root:root@mysql:3306/deepdoc
```

---

## 九、关键伪代码实现

### 9.1 文档处理服务主路由

```python
# doc-parse-svc/routers/documents.py
# 功能：接收文档上传请求，验证后入队返回 task_id

from fastapi import APIRouter, UploadFile, Form, BackgroundTasks
from services.parse_service import ParseService
from common.ssrf_guard import assert_url_is_safe  # 直接复用 RAGFlow SSRF 防护

router = APIRouter(prefix="/v1/documents")

@router.post("/parse", status_code=202)
async def submit_parse_task(
    file: UploadFile | None = None,           # 上传文件（与 url 二选一）
    url: str | None = Form(None),             # 远程 URL（与 file 二选一）
    kb_id: str = Form(...),                   # 知识库 ID
    parser_id: str = Form("naive"),           # 分块策略，默认 naive
    chunk_size: int = Form(512),              # 块大小（token 数）
    chunk_overlap: int = Form(128),           # 块重叠（token 数）
    callback_url: str | None = Form(None),    # 完成回调 URL
    language: str = Form("Chinese"),          # 文档语言
):
    # ① SSRF 防护：如果传入的是 URL，校验不能指向内网地址
    if url:
        assert_url_is_safe(url)               # 直接复用 common/ssrf_guard.py

    # ② 文件格式白名单校验
    ALLOWED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".pptx", ".html", ".md", ".txt"}
    if file:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(400, f"不支持的文件格式: {ext}")

    # ③ 调用 ParseService 完成存储 + 入队
    task = await ParseService.create_task(
        file=file,
        url=url,
        kb_id=kb_id,
        parser_config={
            "parser_id": parser_id,
            "chunk_size": chunk_size,
            "chunk_overlap": chunk_overlap,
            "language": language,
        },
        callback_url=callback_url,
    )

    # ④ 返回 202 + task_id + SSE 进度订阅地址
    return {
        "task_id": task.id,
        "status": "PENDING",
        "sse_url": f"/v1/tasks/{task.id}/progress",
    }
```

### 9.2 任务 Worker 核心逻辑

```python
# doc-parse-svc/worker/task_worker.py
# 功能：消费 Redis Streams 队列，执行文档解析 → 分块 → 向量化 → 写索引的完整管线

import asyncio
from rag.utils.redis_conn import REDIS_CONN                  # 直接复用
from common import settings

# ==================== 解析器工厂（直接复用 RAGFlow rag/app/ 目录） ====================
# RAGFlow 每个 parser_id 对应一个 rag/app/*.py 模块，模块内有统一的 chunk() 函数
from rag.app import naive, paper, book, manual, qa, table, presentation

CHUNK_FACTORY = {
    "naive":        naive,          # 通用智能分块（默认）
    "paper":        paper,          # 学术论文：摘要单独成块
    "book":         book,           # 书籍：按章节切分
    "manual":       manual,         # 操作手册：按标题层级切分
    "qa":           qa,             # 问答对：从 Excel/Word 提取问题-答案
    "table":        table,          # 表格：行级分块 + 表头保留
    "presentation": presentation,   # PPT：按幻灯片分块
}

async def process_one_task(task_msg: dict, progress_cb):
    """
    处理单个任务的完整流水线
    task_msg 包含：task_id, kb_id, bucket, file_key, parser_config, callback_url
    """
    task_id    = task_msg["task_id"]
    kb_id      = task_msg["kb_id"]
    bucket     = task_msg["bucket"]
    file_key   = task_msg["file_key"]
    parser_cfg = task_msg["parser_config"]
    parser_id  = parser_cfg.get("parser_id", "naive")

    # ── 阶段 1：从对象存储拉取原始文件 ─────────────────────────────────
    await progress_cb(task_id, prog=0.05, msg="读取文件...")
    file_binary = await settings.STORAGE_IMPL.get(bucket, file_key)
    filename    = file_key.split("/")[-1]

    # ── 阶段 2：选择分块模块，调用 chunk() 函数进行解析+分块 ──────────────
    # chunk() 函数内部已经封装了 DeepDoc 解析逻辑（deepdoc/parser/）
    # 它会根据文件扩展名自动选择合适的解析器，并按策略进行分块
    await progress_cb(task_id, prog=0.1, msg="开始解析文档...")
    parse_module = CHUNK_FACTORY.get(parser_id, naive)

    try:
        # chunk() 返回 (sections, tables) 两部分
        # sections：普通文本块列表，每项含 content_with_weight 等字段
        # tables：  表格块列表
        sections, tables = parse_module.chunk(
            filename   = filename,
            binary     = file_binary,
            lang       = parser_cfg.get("language", "Chinese"),
            callback   = lambda prog, msg: progress_cb(task_id, prog=0.1 + prog*0.4, msg=msg),
            **parser_cfg,   # 传递 chunk_size, chunk_overlap 等参数
        )
    except Exception as e:
        await progress_cb(task_id, prog=-1, msg=f"解析失败: {e}")
        raise

    all_chunks = sections + tables
    await progress_cb(task_id, prog=0.55, msg=f"分块完成，共 {len(all_chunks)} 块")

    # ── 阶段 3：批量向量化 ──────────────────────────────────────────────
    # 直接复用 rag/svr/task_executor.py 中的 embedding() 函数逻辑
    await progress_cb(task_id, prog=0.6, msg="开始向量化...")
    embed_model = get_embedding_model(kb_id)  # 从配置中获取 Embedding 模型

    # 按批次向量化，避免超过模型 token 限制
    for i in range(0, len(all_chunks), settings.EMBEDDING_BATCH_SIZE):
        batch = all_chunks[i : i + settings.EMBEDDING_BATCH_SIZE]
        titles   = [c.get("docnm_kwd", "")              for c in batch]
        contents = [c.get("content_with_weight", "")    for c in batch]

        # 内容 Embedding（主向量）
        content_vecs, _ = await asyncio.to_thread(
            embed_model.encode,
            [truncate(c, embed_model.max_length - 10) for c in contents]
        )
        # 标题 Embedding（辅助权重 0.1）
        title_vecs, _ = await asyncio.to_thread(embed_model.encode, titles[:1])
        title_vecs = np.tile(title_vecs[0], (len(batch), 1))

        # 加权合并：最终向量 = 0.1 * 标题向量 + 0.9 * 内容向量
        w = parser_cfg.get("filename_embd_weight", 0.1)
        final_vecs = w * title_vecs + (1 - w) * content_vecs

        # 将向量写回 chunk 字典，字段名格式为 q_{维度}_vec
        for j, chunk in enumerate(batch):
            chunk[f"q_{len(final_vecs[j])}_vec"] = final_vecs[j].tolist()

        prog = 0.6 + 0.2 * (i + len(batch)) / len(all_chunks)
        await progress_cb(task_id, prog=prog, msg=f"向量化 {i+len(batch)}/{len(all_chunks)}")

    # ── 阶段 4：写入向量引擎（ES / Infinity） ───────────────────────────
    await progress_cb(task_id, prog=0.82, msg="写入索引...")

    # 直接复用 common/doc_store/ 的连接和写入逻辑
    index_name = f"deepdoc_{kb_id}"
    await asyncio.to_thread(
        settings.docStoreConn.insert,
        all_chunks,
        index_name
    )

    await progress_cb(task_id, prog=1.0, msg=f"完成！共索引 {len(all_chunks)} 块")


async def main_loop():
    """
    主消费循环：不断从 Redis Streams 拉取任务执行
    复用 RAGFlow rag/utils/redis_conn.py 中的 REDIS_CONN 实现
    """
    consumer_name  = f"worker_{os.getpid()}"
    queue_names    = settings.get_svr_queue_names()       # 支持多队列分片
    consumer_group = settings.SVR_CONSUMER_GROUP_NAME

    # ① 启动时先认领超时的未确认消息（崩溃恢复机制）
    # 复用 REDIS_CONN.get_unacked_iterator() → XAUTOCLAIM
    unacked_iter = REDIS_CONN.get_unacked_iterator(
        queue_names, consumer_group, consumer_name
    )

    while True:
        # ② 优先处理 PEL 中的遗留消息，再获取新消息
        redis_msg = None
        try:
            redis_msg = next(unacked_iter)           # 获取未确认的遗留消息
        except StopIteration:
            for qname in queue_names:
                redis_msg = REDIS_CONN.queue_consumer(
                    qname, consumer_group, consumer_name
                )                                    # XREADGROUP BLOCK 获取新消息
                if redis_msg:
                    break

        if not redis_msg:
            await asyncio.sleep(0.5)                 # 队列为空时短暂等待
            continue

        task_msg = redis_msg.get_message()
        try:
            # ③ 使用信号量控制并发数，避免资源耗尽
            async with task_limiter:
                await process_one_task(
                    task_msg,
                    progress_cb=partial(publish_progress, redis_conn=REDIS_CONN)
                )
            redis_msg.ack()                          # ④ 处理成功后 XACK 确认
        except Exception as e:
            logging.exception(f"任务处理失败 {task_msg.get('task_id')}: {e}")
            # 失败后不 XACK，消息留在 PEL，等待超时后被其他 Worker 认领
```

### 9.3 检索服务核心逻辑

```python
# retrieval-svc/services/search_service.py
# 功能：封装 RAGFlow Dealer 类，对外提供标准化检索接口

from rag.nlp.search import Dealer                      # 直接复用 RAGFlow 核心检索类
from rag.nlp import rag_tokenizer                      # 直接复用分词器
from common import settings

class SearchService:
    """
    检索服务：封装 RAGFlow Dealer 的混合检索能力
    支持 hybrid / vector / fulltext 三种检索模式
    """

    def __init__(self):
        # ① 初始化 Dealer，注入文档存储连接
        # Dealer 内部封装了 BM25 + 向量 + RRF 融合逻辑
        self.dealer = Dealer(settings.docStoreConn)

    async def search(
        self,
        query: str,                    # 用户查询文本
        kb_ids: list[str],             # 知识库 ID 列表（支持多库联合检索）
        top_k: int = 10,               # 返回结果数
        mode: str = "hybrid",          # 检索模式：hybrid / vector / fulltext
        similarity_threshold: float = 0.2,   # 相似度过滤阈值
        rerank: bool = False,          # 是否启用 Rerank 精排
        highlight: bool = True,        # 是否返回高亮片段
        chat_history: list = None,     # 对话历史（用于指代消解）
        emb_model=None,                # Embedding 模型实例
        rerank_model=None,             # Rerank 模型实例（可选）
    ) -> dict:

        # ② 指代消解（可选）：有对话历史时，利用 LLM 重写 query
        # 借鉴 Vibe-RAG 的 ContextNode 思路
        effective_query = query
        if chat_history and len(chat_history) > 0:
            effective_query = await self._resolve_coreference(
                query, chat_history[-5:]   # 最近 5 轮历史
            )

        # ③ 根据 mode 构造检索请求参数
        # 直接映射到 Dealer.search() 期望的 req 字典格式
        req = {
            "question": effective_query,
            "kb_ids": kb_ids,
            "size": top_k * 10,        # 过检索 10 倍，给 Rerank 留足候选空间
            "similarity": similarity_threshold,
            "highlight": highlight,
        }

        # 根据模式调整权重
        if mode == "vector":
            # 纯向量：不传 BM25 权重，Dealer 内部会跳过 matchText
            req["vector"] = True
            req["vector_similarity_weight"] = 1.0
        elif mode == "fulltext":
            # 纯全文：不传向量，Dealer 内部会跳过 matchDense
            req["vector"] = False
        else:
            # hybrid（默认）：BM25:0.05 + 向量:0.95
            req["vector"] = True
            req["vector_similarity_weight"] = 0.95

        # ④ 构造索引名列表（每个 kb_id 对应一个 ES 索引）
        idx_names = [f"deepdoc_{kb_id}" for kb_id in kb_ids]

        # ⑤ 调用 Dealer.search()：BM25 + 向量 + FusionExpr 融合
        # 这里直接复用 RAGFlow rag/nlp/search.py 的 Dealer.search() 方法
        # 它内部完成：查询向量化 → BM25 匹配 → 向量检索 → RRF 融合 → 过滤 → 高亮
        sres = await self.dealer.search(
            req       = req,
            idx_names = idx_names,
            kb_ids    = kb_ids,
            emb_mdl   = emb_model,
            highlight = highlight,
        )

        # ⑥ Rerank 精排（可选）
        if rerank and rerank_model and len(sres.ids) > 0:
            # 直接复用 Dealer.rerank_by_model()
            # 公式：tkweight(0.3) * tksim + vtweight(0.7) * vtsim + rank_fea
            scores, tksim, vtsim = self.dealer.rerank_by_model(
                rerank_mdl    = rerank_model,
                sres          = sres,
                query         = effective_query,
                tkweight      = 0.3,               # BM25 词汇相似度权重
                vtweight      = 0.7,               # Reranker 交叉编码器权重
                rank_feature  = None,              # PageRank 加权（可选）
            )
            # 按 Rerank 分数重新排序，截取 Top-K
            ranked_ids = [sres.ids[i] for i in np.argsort(scores)[::-1][:top_k]]
        else:
            ranked_ids = sres.ids[:top_k]

        # ⑦ 格式化返回结果
        chunks = []
        for chunk_id in ranked_ids:
            field = sres.field.get(chunk_id, {})
            chunks.append({
                "chunk_id":     chunk_id,
                "content":      field.get("content_with_weight", ""),
                "highlight":    sres.highlight.get(chunk_id, "") if highlight else "",
                "similarity":   field.get("similarity", 0.0),
                "doc_name":     field.get("docnm_kwd", ""),
                "doc_id":       field.get("doc_id", ""),
                "kb_id":        field.get("kb_id", ""),
                "page_num":     field.get("page_num", []),
            })

        return {
            "query":    effective_query,
            "keywords": sres.keywords or [],
            "total":    sres.total,
            "chunks":   chunks,
        }

    async def _resolve_coreference(self, query: str, history: list) -> str:
        """
        指代消解：利用 LLM 将代词还原为具体实体
        例如：'它的核心算法是什么?' → 'Transformer 的核心算法是什么?'

        此为可选增强，借鉴 Vibe-RAG 的 ContextNode 设计
        如果不需要多轮对话增强，可以直接返回 query 原文
        """
        history_text = "\n".join([
            f"{'用户' if m['role']=='user' else '助手'}: {m['content']}"
            for m in history
        ])
        prompt = f"""根据以下对话历史，改写最新问题，将代词还原为明确的实体，使其可以独立理解：

对话历史：
{history_text}

最新问题：{query}

改写后的独立问题（只输出改写结果，不要解释）："""

        # 调用 LLM（复用 RAGFlow rag/llm/ 工厂）
        chat_model = get_chat_model()
        rewritten  = await asyncio.to_thread(chat_model.chat, "", [{"role": "user", "content": prompt}], {})
        return rewritten.strip() or query  # 失败时返回原始 query
```

### 9.4 分块策略工厂适配器

```python
# doc-parse-svc/services/chunk_factory.py
# 功能：封装 RAGFlow rag/app/ 各策略模块的调用，提供统一接口
# 无需修改 RAGFlow 源码，仅做薄包装

import importlib
from typing import Callable

# RAGFlow 分块策略映射表
# 每个 parser_id 对应 rag/app/ 下的一个模块
# 每个模块都有统一的 chunk(filename, binary, lang, callback, **kwargs) 接口
STRATEGY_MAP = {
    "naive":        "rag.app.naive",
    "paper":        "rag.app.paper",
    "book":         "rag.app.book",
    "manual":       "rag.app.manual",
    "qa":           "rag.app.qa",
    "table":        "rag.app.table",
    "presentation": "rag.app.presentation",
    "resume":       "rag.app.resume",
    "laws":         "rag.app.laws",
    "email":        "rag.app.email",
    "picture":      "rag.app.picture",
    "one":          "rag.app.one",
}

def get_chunk_function(parser_id: str) -> Callable:
    """
    根据 parser_id 返回对应的 chunk() 函数
    直接从 RAGFlow rag/app/ 模块动态导入，无需修改源码
    """
    module_path = STRATEGY_MAP.get(parser_id, "rag.app.naive")
    module = importlib.import_module(module_path)
    return module.chunk


def auto_detect_parser_id(filename: str, page_count: int = 0) -> str:
    """
    自动检测最合适的分块策略
    规则：文件扩展名 + 启发式特征
    """
    ext = Path(filename).suffix.lower()
    
    if ext in {".xlsx", ".xls", ".csv"}:
        return "table"          # 表格文件 → 表格分块
    if ext in {".pptx", ".ppt"}:
        return "presentation"   # 演示文稿 → 幻灯片分块
    if ext == ".pdf":
        if page_count > 100:
            return "book"       # 超长 PDF → 书籍分块（按章节）
        return "naive"          # 普通 PDF → 通用智能分块
    if ext in {".docx", ".doc"}:
        return "manual"         # Word 文档 → 操作手册分块（保留标题层级）
    return "naive"              # 其他格式 → 通用兜底
```

---

## 附录：RAGFlow 模块复用快速参考

### 复用验证清单

在启动服务前，确认以下模块可正常导入：

```python
# 验证脚本：verify_imports.py
# 运行：python verify_imports.py

print("验证 DeepDoc 解析器...")
from deepdoc.parser.pdf_parser import RAGFlowPdfParser       # PDF 解析
from deepdoc.parser.docx_parser import DocxParser            # DOCX 解析
from deepdoc.parser.excel_parser import RAGFlowExcelParser   # Excel 解析
print("✅ DeepDoc 解析器 OK")

print("验证分块策略...")
from rag.app.naive import chunk as naive_chunk
from rag.app.paper import chunk as paper_chunk
from rag.app.table import chunk as table_chunk
print("✅ 分块策略 OK")

print("验证检索核心...")
from rag.nlp.search import Dealer
from rag.nlp.rag_tokenizer import tokenize, fine_grained_tokenize
print("✅ 检索核心 OK")

print("验证 LLM 工厂...")
from rag.llm.embedding_model import DefaultEmbedding
from rag.llm.rerank_model import DefaultRerank
print("✅ LLM 工厂 OK")

print("验证基础设施...")
from common.doc_store.es_conn import ESConnection
from common.ssrf_guard import assert_url_is_safe
from rag.utils.redis_conn import REDIS_CONN
print("✅ 基础设施 OK")

print("\n所有模块验证通过，可以启动服务！")
```

### 最小运行环境

```bash
# 最小化安装（仅用于解析 + 检索，不含 RAGFlow 完整依赖）
pip install \
    fastapi uvicorn           `# API 框架` \
    redis[hiredis]            `# Redis 客户端` \
    elasticsearch==8.*        `# ES 客户端` \
    minio                     `# MinIO 客户端` \
    pymysql sqlalchemy        `# MySQL ORM` \
    xgboost                   `# XGBoost 阅读序模型` \
    onnxruntime               `# ONNX 版式模型推理` \
    python-docx openpyxl      `# Office 文档解析` \
    pymupdf                   `# PDF 解析` \
    pillow                    `# 图片处理` \
    numpy                     `# 向量计算` \
    infinity-sdk              `# Infinity 引擎（可选）`

# ONNX 模型文件下载（首次运行必须）
python download_deps.py
```