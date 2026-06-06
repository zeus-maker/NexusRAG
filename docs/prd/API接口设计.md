# API接口设计文档：企业级RAG 3.0知识库系统

> **文档编号**：API-RAG3.0-20260605
> **版本**：v1.0
> **编制日期**：2026年6月5日
> **编制部门**：AI平台事业部
> **关联文档**：TAD-技术架构设计.md / DBD-数据库设计.md / PRD-产品需求文档.md

---

## 目录

1. [API设计原则](#1-api设计原则)
2. [知识库管理API](#2-知识库管理api)
3. [文档管理API](#3-文档管理api)
4. [查询API（核心）](#4-查询api核心)
5. [权限管理API](#5-权限管理api)
6. [评测API](#6-评测api)
7. [管理API](#7-管理api)
8. [鉴权与安全](#8-鉴权与安全)
9. [SDK与客户端示例](#9-sdk与客户端示例)

---

## 1. API设计原则

### 1.1 RESTful资源导向设计

所有API遵循RESTful架构风格，资源URL使用名词复数形式，HTTP方法语义化：

| HTTP方法 | 语义 | 幂等性 | 示例 |
|----------|------|--------|------|
| GET | 读取资源 | 是 | `GET /api/v1/knowledge-bases` |
| POST | 创建资源 | 否 | `POST /api/v1/knowledge-bases` |
| PUT | 全量更新资源 | 是 | `PUT /api/v1/knowledge-bases/{kb_id}` |
| PATCH | 部分更新资源 | 否 | `PATCH /api/v1/knowledge-bases/{kb_id}` |
| DELETE | 删除资源 | 是 | `DELETE /api/v1/knowledge-bases/{kb_id}` |

### 1.2 URL版本管理

API版本通过URL路径前缀管理：`/api/v1/...`。后续版本（v2、v3）与v1并行运行，通过API Gateway路由分发，旧版本设弃用过渡期（最低12个月）。

### 1.3 统一响应格式

所有API响应遵循统一信封格式：

```json
{
  "code": 0,
  "message": "success",
  "data": { ... },
  "request_id": "req_a1b2c3d4e5f6g7h8",
  "timestamp": "2026-06-05T10:30:00Z"
}
```

分页响应额外包含分页信息：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [ ... ],
    "pagination": {
      "total": 150,
      "page": 1,
      "page_size": 20,
      "total_pages": 8
    }
  },
  "request_id": "req_a1b2c3d4e5f6g7h8"
}
```

### 1.4 统一错误码体系

五层错误码架构，每个错误返回明确的code、message和可选的detail字段：

| 范围 | 类别 | 说明 | 示例 |
|------|------|------|------|
| 0 | 成功 | 请求处理成功 | `{"code": 0, "message": "success"}` |
| 1000-1999 | 参数错误 | 请求参数缺失、格式非法、校验失败 | 1001=必填参数缺失, 1002=格式非法, 1003=参数值越界 |
| 2000-2999 | 认证错误 | Token过期、无效、签名验证失败 | 2001=Token过期, 2002=Token无效, 2003=签名验证失败 |
| 3000-3999 | 权限错误 | 无资源访问权限、角色不足 | 3001=无知识库访问权限, 3002=无文档访问权限, 3003=操作被ACL拒绝 |
| 4000-4999 | 业务错误 | 资源不存在、状态冲突、配额超限 | 4001=知识库不存在, 4002=文档解析失败, 4003=存储配额超限 |
| 5000-5999 | 系统错误 | 内部服务异常、数据库故障、第三方依赖超时 | 5001=服务内部错误, 5002=向量数据库超时, 5003=LLM服务不可用 |

错误响应示例：

```json
{
  "code": 3001,
  "message": "无知识库访问权限",
  "detail": "用户 user_12345 无权访问知识库 kb_finance_2024 的检索功能",
  "request_id": "req_a1b2c3d4e5f6g7h8"
}
```

### 1.5 鉴权方式

支持两种鉴权方式，优先级：API Key > Bearer Token。

#### Bearer Token (JWT)

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### API Key

```
X-API-Key: rag_kb3v1_a1b2c3d4e5f6g7h8i9j0k
```

### 1.6 速率限制

三层限流架构，使用Token Bucket算法：

| 层级 | 维度 | 默认限制 | 响应头 |
|------|------|----------|--------|
| 用户级 | 每用户每API | 100 req/s, 10000 req/h | `X-RateLimit-User-Remaining` |
| 租户级 | 每租户全局 | 1000 req/s, 100000 req/h | `X-RateLimit-Tenant-Remaining` |
| API级 | 每端点全局 | 5000 req/s | `X-RateLimit-API-Remaining` |

触发限流时返回HTTP 429：

```json
{
  "code": 4290,
  "message": "请求频率超限，请稍后重试",
  "detail": {
    "retry_after": 30,
    "limit_type": "user",
    "current_usage": 105,
    "limit": 100
  },
  "request_id": "req_a1b2c3d4e5f6g7h8"
}
```

### 1.7 分页规范

#### Cursor-based分页（推荐，用于高频查询和实时数据）

```
GET /api/v1/knowledge-bases/{kb_id}/documents?cursor=doc_123&limit=20
```

响应中包含 `next_cursor` 和 `has_more`：

```json
{
  "pagination": {
    "cursor": null,
    "next_cursor": "doc_143",
    "limit": 20,
    "has_more": true
  }
}
```

#### Offset-based分页（用于管理后台列表）

```
GET /api/v1/knowledge-bases?page=1&page_size=20
```

---

## 2. 知识库管理API

### 2.1 创建知识库

**POST** `/api/v1/knowledge-bases`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 知识库名称，2-50字符，支持中英文及特殊符号 |
| description | string | 否 | 知识库描述，最多200字符 |
| icon_url | string | 否 | 图标URL |
| embedding_model | string | 否 | 嵌入模型标识，默认"BAAI/bge-m3" |
| chunk_strategy | string | 否 | 默认分块策略：general/template/hierarchical/semantic/qa/parent_child，默认"general" |
| llm_model | string | 否 | 默认LLM模型，默认"deepseek-v4" |
| language | string | 否 | 默认语言：zh/en/ja，默认"zh" |

#### 请求示例

```bash
curl -X POST https://api.rag3.example.com/api/v1/knowledge-bases \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "法务合同知识库",
    "description": "公司标准合同模板与历史合同条款知识库",
    "embedding_model": "BAAI/bge-m3",
    "chunk_strategy": "template",
    "llm_model": "deepseek-v4",
    "language": "zh"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "kb_id": "kb_3f7a8b2c1d4e",
    "tenant_id": "tenant_9x2y5z",
    "name": "法务合同知识库",
    "description": "公司标准合同模板与历史合同条款知识库",
    "icon_url": null,
    "embedding_model": "BAAI/bge-m3",
    "chunk_strategy": "template",
    "llm_model": "deepseek-v4",
    "language": "zh",
    "status": "active",
    "doc_count": 0,
    "chunk_count": 0,
    "total_size_bytes": 0,
    "creator_id": "user_8a3f2b1c",
    "created_at": "2026-06-05T10:30:00Z",
    "updated_at": "2026-06-05T10:30:00Z"
  },
  "request_id": "req_a1b2c3d4e5f6g7h8"
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 1001 | 知识库名称为必填项 |
| 1002 | 知识库名称长度不符合要求（2-50字符） |
| 1003 | 不支持的分块策略 |
| 4003 | 租户知识库数量已达上限 |
| 5001 | 创建知识库时发生内部错误 |

---

### 2.2 获取知识库列表

**GET** `/api/v1/knowledge-bases`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认20，最大100 |
| status | string | 否 | 按状态筛选：active/indexing/archived |
| search | string | 否 | 按名称模糊搜索 |
| sort_by | string | 否 | 排序字段：created_at/updated_at/doc_count，默认updated_at |
| sort_order | string | 否 | 排序方向：asc/desc，默认desc |

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/knowledge-bases?page=1&page_size=10&status=active&sort_by=updated_at&sort_order=desc" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "kb_id": "kb_3f7a8b2c1d4e",
        "name": "法务合同知识库",
        "description": "公司标准合同模板与历史合同条款知识库",
        "icon_url": "https://static.example.com/icons/law.svg",
        "status": "active",
        "doc_count": 156,
        "chunk_count": 12840,
        "total_size_bytes": 524288000,
        "creator_id": "user_8a3f2b1c",
        "created_at": "2026-06-01T08:00:00Z",
        "updated_at": "2026-06-05T09:15:00Z"
      },
      {
        "kb_id": "kb_9d5e1f6a3b7c",
        "name": "财务报告知识库",
        "description": "历年财报、审计报告与财务分析文档",
        "status": "active",
        "doc_count": 89,
        "chunk_count": 6230,
        "total_size_bytes": 314572800,
        "creator_id": "user_5c7e9a1b",
        "created_at": "2026-05-15T10:00:00Z",
        "updated_at": "2026-06-04T16:30:00Z"
      }
    ],
    "pagination": {
      "total": 12,
      "page": 1,
      "page_size": 10,
      "total_pages": 2
    }
  },
  "request_id": "req_e5f6g7h8i9j0k1l2"
}
```

---

### 2.3 获取知识库详情

**GET** `/api/v1/knowledge-bases/{kb_id}`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID，路径参数 |

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "kb_id": "kb_3f7a8b2c1d4e",
    "tenant_id": "tenant_9x2y5z",
    "name": "法务合同知识库",
    "description": "公司标准合同模板与历史合同条款知识库",
    "icon_url": "https://static.example.com/icons/law.svg",
    "embedding_model": "BAAI/bge-m3",
    "chunk_strategy": "template",
    "reranker_model": "BAAI/bge-reranker-v2-m3",
    "llm_model": "deepseek-v4",
    "language": "zh",
    "status": "active",
    "doc_count": 156,
    "chunk_count": 12840,
    "total_size_bytes": 524288000,
    "creator_id": "user_8a3f2b1c",
    "created_at": "2026-06-01T08:00:00Z",
    "updated_at": "2026-06-05T09:15:00Z",
    "acl_rules_count": 12,
    "pipeline_config": {
      "parser_type": "deepdoc",
      "chunker_type": "template",
      "chunk_size": 512,
      "chunk_overlap": 50,
      "hybrid_weight": 0.6,
      "top_k": 10
    }
  },
  "request_id": "req_e5f6g7h8i9j0k1l2"
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 3001 | 无该知识库的访问权限 |
| 4001 | 知识库不存在 |

---

### 2.4 更新知识库

**PUT** `/api/v1/knowledge-bases/{kb_id}`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID，路径参数 |
| name | string | 否 | 知识库名称 |
| description | string | 否 | 知识库描述 |
| icon_url | string | 否 | 图标URL |
| embedding_model | string | 否 | 嵌入模型（变更后将触发全量重建索引） |
| chunk_strategy | string | 否 | 分块策略 |
| llm_model | string | 否 | LLM模型 |
| language | string | 否 | 默认语言 |

#### 请求示例

```bash
curl -X PUT "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "法务合同与合规知识库",
    "description": "公司标准合同模板、历史合同条款与合规政策知识库",
    "chunk_strategy": "hierarchical"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "kb_id": "kb_3f7a8b2c1d4e",
    "name": "法务合同与合规知识库",
    "chunk_strategy": "hierarchical",
    "updated_at": "2026-06-05T10:35:00Z",
    "reindex_required": true
  },
  "request_id": "req_m3n4o5p6q7r8s9t0"
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 1002 | 名称长度不符合要求 |
| 3001 | 无该知识库的管理权限 |
| 4001 | 知识库不存在 |

---

### 2.5 删除知识库（软删除）

**DELETE** `/api/v1/knowledge-bases/{kb_id}`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID，路径参数 |
| confirm_name | string | 是 | 需输入知识库名称确认删除（防误删），查询参数 |

#### 请求示例

```bash
curl -X DELETE "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e?confirm_name=%E6%B3%95%E5%8A%A1%E5%90%88%E5%90%8C%E4%B8%8E%E5%90%88%E8%A7%84%E7%9F%A5%E8%AF%86%E5%BA%93" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "知识库已移入回收站，30天内可恢复",
  "data": {
    "kb_id": "kb_3f7a8b2c1d4e",
    "status": "deleted",
    "deleted_at": "2026-06-05T10:40:00Z",
    "recoverable_until": "2026-07-05T10:40:00Z",
    "deleted_by": "user_8a3f2b1c"
  },
  "request_id": "req_u1v2w3x4y5z6a7b8"
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 1001 | 缺少确认名称参数 |
| 4004 | 确认名称与知识库名称不匹配 |
| 3001 | 无该知识库的删除权限 |
| 4001 | 知识库不存在或已被删除 |

---

### 2.6 知识库统计

**GET** `/api/v1/knowledge-bases/{kb_id}/stats`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID，路径参数 |
| period | string | 否 | 统计周期：7d/30d/90d，默认30d |

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/stats?period=30d" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "summary": {
      "total_documents": 156,
      "total_chunks": 12840,
      "total_storage_bytes": 524288000,
      "total_storage_display": "500 MB",
      "avg_parse_quality_score": 92.5,
      "index_health_score": 98
    },
    "trends": {
      "documents_added_30d": 23,
      "documents_updated_30d": 15,
      "queries_30d": 2840,
      "unique_users_30d": 45
    },
    "document_type_distribution": {
      "pdf": 85,
      "docx": 42,
      "xlsx": 18,
      "pptx": 8,
      "md": 3
    },
    "chunk_strategy_distribution": {
      "template": 78,
      "semantic": 45,
      "parent_child": 33
    },
    "top_queries_30d": [
      {"query": "供应商延迟交货违约金条款", "count": 143},
      {"query": "知识产权归属条款模板", "count": 98}
    ],
    "top_cited_documents_30d": [
      {"doc_id": "doc_8f2a3c1b", "original_name": "标准采购合同模板V5.pdf", "citation_count": 234},
      {"doc_id": "doc_5d7e9f1a", "original_name": "软件许可协议模板V3.pdf", "citation_count": 187}
    ]
  },
  "request_id": "req_c9d0e1f2g3h4i5j6"
}
```

---

### 2.7 触发外部数据源同步

**POST** `/api/v1/knowledge-bases/{kb_id}/sync`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID，路径参数 |
| sync_type | string | 否 | 同步类型：full=全量同步, incremental=增量同步，默认incremental |
| source | string | 否 | 指定同步源ID，不指定则同步所有已配置数据源 |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/sync" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "sync_type": "incremental",
    "source": "conn_s3_finance_bucket"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "同步任务已触发",
  "data": {
    "sync_task_id": "sync_8a3f2b1c4d5e",
    "kb_id": "kb_3f7a8b2c1d4e",
    "sync_type": "incremental",
    "status": "running",
    "started_at": "2026-06-05T10:45:00Z",
    "estimated_completion": "2026-06-05T10:48:00Z"
  },
  "request_id": "req_k7l8m9n0o1p2q3r4"
}
```

---

## 3. 文档管理API

### 3.1 上传文档

**POST** `/api/v1/knowledge-bases/{kb_id}/documents`

Content-Type: `multipart/form-data`，支持批量上传（最多100个文件）。

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID，路径参数 |
| files | file[] | 是 | 文档文件列表，单文件上限100MB |
| parser_type | string | 否 | 解析器类型：deepdoc/mineru/docling/paddleocr，默认使用流水线配置 |
| chunk_strategy | string | 否 | 分块策略覆盖，默认使用知识库配置 |
| tags | string | 否 | 标签列表，逗号分隔，如"合同,供应商,2024" |
| metadata | string | 否 | 扩展元数据JSON字符串 |

支持的格式：PDF、DOCX、PPTX、XLSX、CSV、TXT、MD、HTML、XML、JSON、EML、MSG、PNG、JPG、TIFF、BMP、RTF、Log、源代码文件(.py/.js/.java/.cpp/.go)

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/documents" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -F "files=@供应商合同模板V5.pdf" \
  -F "files=@采购协议标准条款.docx" \
  -F "parser_type=deepdoc" \
  -F "tags=合同,供应商,标准模板" \
  -F 'metadata={"author":"法务部","confidentiality":"internal","version":"V5"}'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "文档上传成功，正在解析",
  "data": {
    "documents": [
      {
        "doc_id": "doc_8a3f2b1c4d5e",
        "original_name": "供应商合同模板V5.pdf",
        "file_type": "pdf",
        "file_size": 2457600,
        "parse_status": "parsing",
        "version": 1,
        "uploaded_at": "2026-06-05T10:50:00Z"
      },
      {
        "doc_id": "doc_9b4c3d2e5f6a",
        "original_name": "采购协议标准条款.docx",
        "file_type": "docx",
        "file_size": 1024000,
        "parse_status": "parsing",
        "version": 1,
        "uploaded_at": "2026-06-05T10:50:00Z"
      }
    ],
    "total_uploaded": 2,
    "total_failed": 0
  },
  "request_id": "req_s5t6u7v8w9x0y1z2"
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 1001 | 未上传任何文件 |
| 1003 | 单次上传文件数超过上限(100) |
| 1003 | 单文件大小超过上限(100MB) |
| 1002 | 不支持的文件格式 |
| 4003 | 知识库存储配额已满 |
| 4002 | 文档解析引擎不可用 |

---

### 3.2 URL导入

**POST** `/api/v1/knowledge-bases/{kb_id}/documents/import`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID，路径参数 |
| urls | string[] | 是 | 待导入的文档URL列表，最多20个 |
| parser_type | string | 否 | 解析器类型覆盖 |
| tags | string | 否 | 标签列表 |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/documents/import" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://laws.example.com/regulations/2024/commercial-code-chapter5.pdf",
      "https://docs.internal.example.com/templates/nda-template-v3.docx"
    ],
    "tags": "法规,模板,2024"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "URL导入任务已创建",
  "data": {
    "import_task_id": "import_5e6f7a8b9c0d",
    "urls": [
      {"url": "https://laws.example.com/regulations/2024/commercial-code-chapter5.pdf", "status": "downloading"},
      {"url": "https://docs.internal.example.com/templates/nda-template-v3.docx", "status": "downloading"}
    ],
    "started_at": "2026-06-05T10:52:00Z"
  },
  "request_id": "req_a3b4c5d6e7f8g9h0"
}
```

---

### 3.3 文档列表

**GET** `/api/v1/knowledge-bases/{kb_id}/documents`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID，路径参数 |
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认20，最大100 |
| status | string | 否 | 解析状态：pending/parsing/parsed/failed |
| file_type | string | 否 | 文件类型筛选：pdf/docx/xlsx等 |
| search | string | 否 | 文档名称模糊搜索 |
| tags | string | 否 | 按标签筛选，逗号分隔 |
| uploaded_by | string | 否 | 按上传者筛选 |
| sort_by | string | 否 | 排序字段：uploaded_at/doc_name/file_size，默认uploaded_at |
| sort_order | string | 否 | 排序方向，默认desc |

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/documents?page=1&page_size=20&status=parsed&file_type=pdf&sort_by=uploaded_at&sort_order=desc" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "doc_id": "doc_8a3f2b1c4d5e",
        "original_name": "供应商合同模板V5.pdf",
        "file_type": "pdf",
        "file_size": 2457600,
        "parse_status": "parsed",
        "parse_engine": "deepdoc",
        "chunk_count": 85,
        "page_count": 42,
        "word_count": 18500,
        "language": "zh",
        "version": 1,
        "tags": ["合同", "供应商", "标准模板"],
        "uploaded_by": "user_8a3f2b1c",
        "uploaded_at": "2026-06-05T10:50:00Z",
        "parsed_at": "2026-06-05T10:51:30Z",
        "parse_quality_score": 96
      },
      {
        "doc_id": "doc_7f6e5d4c3b2a",
        "original_name": "2024年度法律合规审查报告.pdf",
        "file_type": "pdf",
        "file_size": 5120000,
        "parse_status": "parsed",
        "parse_engine": "deepdoc",
        "chunk_count": 156,
        "page_count": 78,
        "word_count": 42000,
        "language": "zh",
        "version": 1,
        "tags": ["法律", "合规", "报告", "2024"],
        "uploaded_by": "user_8a3f2b1c",
        "uploaded_at": "2026-06-04T14:30:00Z",
        "parsed_at": "2026-06-04T14:33:45Z",
        "parse_quality_score": 94
      }
    ],
    "pagination": {
      "total": 156,
      "page": 1,
      "page_size": 20,
      "total_pages": 8
    }
  },
  "request_id": "req_i1j2k3l4m5n6o7p8"
}
```

---

### 3.4 文档详情

**GET** `/api/v1/knowledge-bases/{kb_id}/documents/{doc_id}`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID，路径参数 |
| doc_id | string | 是 | 文档ID，路径参数 |

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/documents/doc_8a3f2b1c4d5e" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "doc_id": "doc_8a3f2b1c4d5e",
    "kb_id": "kb_3f7a8b2c1d4e",
    "original_name": "供应商合同模板V5.pdf",
    "file_type": "pdf",
    "file_size": 2457600,
    "file_hash": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "parse_status": "parsed",
    "parse_engine": "deepdoc",
    "chunk_count": 85,
    "page_count": 42,
    "word_count": 18500,
    "language": "zh",
    "version": 1,
    "is_active": true,
    "tags": ["合同", "供应商", "标准模板"],
    "metadata": {
      "author": "法务部",
      "confidentiality": "internal",
      "version_tag": "V5",
      "effective_date": "2024-01-01"
    },
    "uploaded_by": "user_8a3f2b1c",
    "uploaded_at": "2026-06-05T10:50:00Z",
    "parsed_at": "2026-06-05T10:51:30Z",
    "parse_quality_score": 96,
    "index_status": {
      "vector_index": "completed",
      "fulltext_index": "completed",
      "pageindex_tree": "not_applicable"
    },
    "version_history": [
      {"version": 1, "change_type": "created", "changed_by": "user_8a3f2b1c", "changed_at": "2026-06-05T10:50:00Z"}
    ]
  },
  "request_id": "req_q9r0s1t2u3v4w5x6"
}
```

---

### 3.5 删除文档

**DELETE** `/api/v1/knowledge-bases/{kb_id}/documents/{doc_id}`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID |
| doc_id | string | 是 | 文档ID |
| permanent | boolean | 否 | 是否永久删除（跳过回收站），默认false（30天可恢复） |

#### 请求示例

```bash
curl -X DELETE "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/documents/doc_8a3f2b1c4d5e" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "文档已删除",
  "data": {
    "doc_id": "doc_8a3f2b1c4d5e",
    "status": "deleted",
    "deleted_at": "2026-06-05T11:00:00Z",
    "recoverable": true,
    "cascade_deleted": {
      "chunks_removed": 85,
      "vector_index_entries_removed": 85,
      "fulltext_index_entries_removed": 85
    }
  },
  "request_id": "req_y7z8a9b0c1d2e3f4"
}
```

---

### 3.6 重新解析文档

**POST** `/api/v1/knowledge-bases/{kb_id}/documents/{doc_id}/reparse`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID |
| doc_id | string | 是 | 文档ID |
| parser_type | string | 否 | 指定解析器覆盖，默认使用原始解析器 |
| chunk_strategy | string | 否 | 指定分块策略覆盖 |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/documents/doc_8a3f2b1c4d5e/reparse" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "parser_type": "mineru",
    "chunk_strategy": "semantic"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "文档重新解析任务已创建",
  "data": {
    "doc_id": "doc_8a3f2b1c4d5e",
    "parse_status": "parsing",
    "reparse_task_id": "reparse_8f2b3c4d5e6a",
    "started_at": "2026-06-05T11:05:00Z",
    "previous_version": 1,
    "new_version": 2
  },
  "request_id": "req_g5h6i7j8k9l0m1n2"
}
```

---

### 3.7 分块预览

**GET** `/api/v1/knowledge-bases/{kb_id}/documents/{doc_id}/chunks`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID |
| doc_id | string | 是 | 文档ID |
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认50，最大200 |
| content_type | string | 否 | 按内容类型筛选：text/table/image_description/formula/code |
| min_token_count | integer | 否 | 最小Token数过滤 |
| max_token_count | integer | 否 | 最大Token数过滤 |

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/documents/doc_8a3f2b1c4d5e/chunks?page=1&page_size=20" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "doc_id": "doc_8a3f2b1c4d5e",
    "chunk_summary": {
      "total_chunks": 85,
      "avg_token_count": 487,
      "max_token_count": 512,
      "min_token_count": 128,
      "overlap_chunk_count": 84
    },
    "items": [
      {
        "chunk_id": "chunk_1a2b3c4d5e6f",
        "chunk_index": 0,
        "content_preview": "第一条 定义 1.1 \"供应商\"系指根据本合同约定向采购方提供货物或服务的法人、其他组织或自然人。1.2 \"货物\"系指...",
        "content_type": "text",
        "chunk_strategy": "template",
        "token_count": 512,
        "page_number": 1,
        "section_title": "第一条 定义",
        "embedding_status": "embedded",
        "acl_tags": [
          {"tag_type": "confidentiality", "tag_value": "internal"},
          {"tag_type": "department", "tag_value": "legal"}
        ]
      },
      {
        "chunk_id": "chunk_2b3c4d5e6f7a",
        "chunk_index": 1,
        "content_preview": "第五条 违约责任 5.1 供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金。5.2 供应商交货不符合约定...",
        "content_type": "text",
        "chunk_strategy": "template",
        "token_count": 508,
        "page_number": 3,
        "section_title": "第五条 违约责任",
        "embedding_status": "embedded",
        "acl_tags": [
          {"tag_type": "confidentiality", "tag_value": "internal"},
          {"tag_type": "department", "tag_value": "legal"}
        ]
      }
    ],
    "pagination": {
      "total": 85,
      "page": 1,
      "page_size": 20,
      "total_pages": 5
    }
  },
  "request_id": "req_o3p4q5r6s7t8u9v0"
}
```

---

### 3.8 文档解析状态

**GET** `/api/v1/knowledge-bases/{kb_id}/documents/{doc_id}/status`

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/documents/doc_8a3f2b1c4d5e/status" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "doc_id": "doc_8a3f2b1c4d5e",
    "parse_status": "parsed",
    "parse_engine": "deepdoc",
    "parse_progress": {
      "stage": "completed",
      "percentage": 100,
      "sub_stages": {
        "ocr": "completed",
        "layout_detection": "completed",
        "table_extraction": "completed",
        "chunking": "completed",
        "embedding": "completed",
        "vector_index": "completed",
        "fulltext_index": "completed"
      }
    },
    "parse_quality_score": 96,
    "parse_errors": [],
    "timing": {
      "started_at": "2026-06-05T10:50:00Z",
      "completed_at": "2026-06-05T10:51:30Z",
      "duration_seconds": 90
    }
  },
  "request_id": "req_w1x2y3z4a5b6c7d8"
}
```

---

## 4. 查询API（核心）

### 4.1 单次RAG查询

**POST** `/api/v1/knowledge-bases/{kb_id}/query`

#### 请求体Schema

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| query | string | 是 | 用户查询文本，1-5000字符 |
| retrieval_mode | string | 否 | 检索模式：auto/hybrid/vector/bm25/pageindex/graphrag/wiki，默认auto |
| top_k | integer | 否 | 返回Top-K个检索结果，默认10，最大50 |
| rerank | boolean | 否 | 是否启用Cross-Encoder精排，默认true |
| doc_ids | string[] | 否 | 限定检索文档ID范围，不指定则检索整个知识库 |
| filters | object | 否 | 元数据过滤条件，如 `{"file_type": "pdf", "tags": ["合同"]}` |
| stream | boolean | 否 | 是否流式返回，默认false |
| temperature | number | 否 | LLM温度参数覆盖，默认0.3 |
| max_tokens | integer | 否 | 最大生成Token数，默认2048 |
| citations | boolean | 否 | 是否返回引用列表，默认true |
| confidence_score | boolean | 否 | 是否返回置信度评分，默认true |
| language | string | 否 | 回答语言覆盖：zh/en/ja/auto |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/query" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "query": "供应商延迟交货的违约金如何计算？标准合同模板中的规定是什么？",
    "retrieval_mode": "auto",
    "top_k": 5,
    "rerank": true,
    "citations": true,
    "confidence_score": true
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "query": "供应商延迟交货的违约金如何计算？标准合同模板中的规定是什么？",
    "answer": "根据公司标准采购合同模板（V5）第五条第5.1款规定：\n\n**违约金计算规则**：\n- 供应商迟延交货的，每迟延一日应按迟延交付货物价值的**千分之五（0.5%）**向采购方支付违约金[1]\n- 迟延超过30日的，采购方有权单方解除合同，供应商除支付前述违约金外，还应赔偿采购方因此遭受的全部损失[2]\n\n**违约金上限**：\n- 违约金总额不超过合同总金额的20%[3]\n- 如违约金不足以弥补采购方实际损失的，采购方有权另行主张损害赔偿\n\n另有《采购协议标准条款》第12.3条[4]也对此进行了补充规定。",
    "routing_info": {
      "classified_tier": "tier_2",
      "primary_channel": "pageindex",
      "secondary_channels": ["vector"],
      "model_used": "deepseek-v4",
      "reranker_used": "BAAI/bge-reranker-v2-m3"
    },
    "citations": [
      {
        "index": 1,
        "doc_id": "doc_8a3f2b1c4d5e",
        "doc_name": "供应商合同模板V5.pdf",
        "chunk_id": "chunk_2b3c4d5e6f7a",
        "section": "第五条 违约责任",
        "page_number": 3,
        "snippet": "5.1 供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金。",
        "relevance_score": 0.956,
        "bbox_coordinates": [120, 450, 580, 520]
      },
      {
        "index": 2,
        "doc_id": "doc_8a3f2b1c4d5e",
        "doc_name": "供应商合同模板V5.pdf",
        "chunk_id": "chunk_3c4d5e6f7a8b",
        "section": "第五条 违约责任",
        "page_number": 3,
        "snippet": "5.3 迟延交货超过30日的，采购方有权单方解除合同，供应商应赔偿采购方因此遭受的全部损失。",
        "relevance_score": 0.912,
        "bbox_coordinates": [120, 580, 580, 650]
      },
      {
        "index": 3,
        "doc_id": "doc_8a3f2b1c4d5e",
        "doc_name": "供应商合同模板V5.pdf",
        "chunk_id": "chunk_4d5e6f7a8b9c",
        "section": "第五条 违约责任",
        "page_number": 4,
        "snippet": "5.5 供应商承担的违约金总额不超过合同总金额的20%。",
        "relevance_score": 0.884,
        "bbox_coordinates": [120, 200, 580, 270]
      },
      {
        "index": 4,
        "doc_id": "doc_9b4c3d2e5f6a",
        "doc_name": "采购协议标准条款.docx",
        "chunk_id": "chunk_5e6f7a8b9c0d",
        "section": "第十二条 违约责任与赔偿",
        "page_number": 8,
        "snippet": "12.3 供应商逾期交付货物的，应按逾期交付部分货值的每日0.3%支付违约金，同时承担...",
        "relevance_score": 0.867,
        "bbox_coordinates": null
      }
    ],
    "confidence": {
      "score": 0.92,
      "level": "high",
      "factors": {
        "retrieval_quality": 0.95,
        "generation_consistency": 0.93,
        "source_authority": 0.90,
        "cross_encoder_score": 0.91
      }
    },
    "token_usage": {
      "prompt_tokens": 1840,
      "completion_tokens": 412,
      "total_tokens": 2252
    },
    "latency_ms": {
      "total": 1850,
      "classify": 120,
      "route": 15,
      "retrieve": 450,
      "rerank": 180,
      "generate": 980,
      "postprocess": 105
    }
  },
  "request_id": "req_e9f0g1h2i3j4k5l6"
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 1001 | 查询文本为必填项 |
| 1003 | 查询文本长度超过上限(5000字符) |
| 3001 | 无该知识库的查询权限 |
| 4001 | 知识库不存在 |
| 5002 | 向量数据库检索超时 |
| 5003 | LLM服务不可用 |

---

### 4.2 流式查询（SSE）

**POST** `/api/v1/knowledge-bases/{kb_id}/query/stream`

请求参数与单次查询相同，`stream`参数固定为`true`。响应使用Server-Sent Events。

#### SSE事件格式说明

流式查询通过SSE协议推送如下事件类型：

| 事件类型 | 说明 | 数据格式 |
|----------|------|----------|
| `routing` | 路由决策完成 | `{"tier": "tier_2", "channels": ["pageindex", "vector"], "model": "deepseek-v4"}` |
| `searching` | 检索进度 | `{"channel": "pageindex", "status": "completed", "results_count": 5}` |
| `token` | LLM生成的Token | `{"content": "根", "index": 0}` |
| `citation` | 引用标注 | `{"index": 1, "doc_name": "供应商合同模板V5.pdf", "page": 3, "snippet": "..."}` |
| `confidence` | 置信度评估 | `{"score": 0.92, "level": "high"}` |
| `done` | 生成完成 | `{"total_tokens": 2252, "latency_ms": 1850}` |
| `error` | 错误 | `{"code": 5003, "message": "LLM服务超时"}` |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/query/stream" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "query": "供应商延迟交货的违约金如何计算？",
    "top_k": 5
  }'
```

#### SSE流示例

```
event: routing
data: {"tier":"tier_2","channels":["pageindex","vector"],"model":"deepseek-v4","timestamp":"2026-06-05T11:10:00.100Z"}

event: searching
data: {"channel":"pageindex","status":"completed","results_count":3,"latency_ms":320}

event: searching
data: {"channel":"vector","status":"completed","results_count":5,"latency_ms":280}

event: token
data: {"content":"根据","index":0}

event: token
data: {"content":"公司","index":1}

event: token
data: {"content":"标准采购合同模板（V5）第五条第5.1款规定：","index":2}

event: citation
data: {"index":1,"doc_name":"供应商合同模板V5.pdf","page":3,"chunk_id":"chunk_2b3c4d5e6f7a","snippet":"5.1 供应商迟延交货的，每迟延一日应按...","relevance_score":0.956}

event: token
data: {"content":"\n\n供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金[1]。","index":15}

event: token
data: {"content":"","index":-1}

event: confidence
data: {"score":0.92,"level":"high"}

event: done
data: {"total_tokens":2252,"latency_ms":1850,"request_id":"req_a1b2c3d4e5f6g7h8"}
```

#### SSE连接管理

- 连接超时：120秒无数据则自动关闭
- 重连支持：客户端断连后可在30秒内通过`Last-Event-Id`请求头续接
- 心跳包：每15秒发送`: heartbeat\n\n`保持连接

---

### 4.3 创建对话

**POST** `/api/v1/conversations`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_ids | string[] | 是 | 关联知识库ID列表 |
| title | string | 否 | 对话标题，不指定则由LLM自动生成 |
| model | string | 否 | LLM模型覆盖，默认使用知识库配置 |
| strategy | string | 否 | 路由策略：auto/immediate/precise/comprehensive，默认auto |
| metadata | object | 否 | 扩展元数据 |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/conversations" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "kb_ids": ["kb_3f7a8b2c1d4e"],
    "model": "deepseek-v4",
    "strategy": "auto"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "conversation_id": "conv_8a3f2b1c4d5e",
    "user_id": "user_8a3f2b1c",
    "kb_ids": ["kb_3f7a8b2c1d4e"],
    "title": "新对话",
    "model": "deepseek-v4",
    "strategy": "auto",
    "status": "active",
    "message_count": 0,
    "created_at": "2026-06-05T11:15:00Z"
  },
  "request_id": "req_m7n8o9p0q1r2s3t4"
}
```

---

### 4.4 发送消息（多轮对话）

**POST** `/api/v1/conversations/{conv_id}/messages`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| conv_id | string | 是 | 对话ID，路径参数 |
| message | string | 是 | 用户消息内容，1-10000字符 |
| stream | boolean | 否 | 是否流式返回，默认false |
| citations | boolean | 否 | 是否返回引用，默认true |
| context_window | integer | 否 | 上下文窗口大小（历史消息数），默认10，最大50 |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/conversations/conv_8a3f2b1c4d5e/messages" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "如果供应商延迟交货15天，货物价值100万元，违约金总额是多少？",
    "stream": false,
    "citations": true
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message_id": "msg_9b4c3d2e5f6a",
    "conversation_id": "conv_8a3f2b1c4d5e",
    "role": "assistant",
    "content": "根据《供应商合同模板V5》第五条第5.1款规定，供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五（0.5%）向采购方支付违约金[1]。\n\n**计算过程**：\n- 货物价值：1,000,000元\n- 迟延天数：15天\n- 每日违约金：1,000,000 × 0.5% = 5,000元\n- 违约金总额：5,000 × 15 = **75,000元**\n\n**注意事项**：\n- 根据第5.5条，违约金总额不超过合同总金额的20%[2]，即200,000元上限\n- 75,000元未超过上限，因此实际应付75,000元\n- 如违约金不足以弥补实际损失的，采购方有权另行主张损害赔偿[3]",
    "citations": [
      {
        "index": 1,
        "doc_id": "doc_8a3f2b1c4d5e",
        "doc_name": "供应商合同模板V5.pdf",
        "page_number": 3,
        "snippet": "5.1 供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金。",
        "relevance_score": 0.956
      }
    ],
    "routing_tier": "tier_2",
    "retrieval_channels": ["pageindex", "vector"],
    "tokens_used": 2840,
    "latency_ms": 2100,
    "feedback_status": "none",
    "created_at": "2026-06-05T11:16:00Z"
  },
  "request_id": "req_u5v6w7x8y9z0a1b2"
}
```

---

### 4.5 获取对话历史

**GET** `/api/v1/conversations/{conv_id}/messages`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| conv_id | string | 是 | 对话ID |
| cursor | string | 否 | 分页游标 |
| limit | integer | 否 | 每页数量，默认50，最大200 |

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/conversations/conv_8a3f2b1c4d5e/messages?limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "message_id": "msg_8a3f2b1c4d5e",
        "role": "user",
        "content": "供应商延迟交货的违约金如何计算？",
        "created_at": "2026-06-05T11:15:30Z"
      },
      {
        "message_id": "msg_9b4c3d2e5f6a",
        "role": "assistant",
        "content": "根据公司标准采购合同模板（V5）第五条第5.1款规定...",
        "citations": [{"index": 1, "doc_name": "供应商合同模板V5.pdf", "page": 3}],
        "routing_tier": "tier_2",
        "tokens_used": 2252,
        "latency_ms": 1850,
        "feedback_status": "thumbs_up",
        "created_at": "2026-06-05T11:15:32Z"
      }
    ],
    "pagination": {
      "has_more": false,
      "total": 2
    }
  },
  "request_id": "req_c3d4e5f6g7h8i9j0"
}
```

---

### 4.6 删除对话

**DELETE** `/api/v1/conversations/{conv_id}`

#### 请求示例

```bash
curl -X DELETE "https://api.rag3.example.com/api/v1/conversations/conv_8a3f2b1c4d5e" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "对话已删除",
  "data": {
    "conversation_id": "conv_8a3f2b1c4d5e",
    "deleted_at": "2026-06-05T11:20:00Z"
  },
  "request_id": "req_k1l2m3n4o5p6q7r8"
}
```

---

### 4.7 消息反馈

**POST** `/api/v1/conversations/{conv_id}/messages/{msg_id}/feedback`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| conv_id | string | 是 | 对话ID |
| msg_id | string | 是 | 消息ID |
| feedback_type | string | 是 | 反馈类型：thumbs_up/thumbs_down/correction |
| reason | string | 否 | 反馈原因（thumbs_down时可用预设值：incorrect_answer/citation_error/outdated_info/incomplete/bad_formatting/other） |
| detail | string | 否 | 反馈详细说明 |
| correction_text | string | 否 | 纠错文本（feedback_type=correction时填写） |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/conversations/conv_8a3f2b1c4d5e/messages/msg_9b4c3d2e5f6a/feedback" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "feedback_type": "thumbs_up"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "反馈已记录，感谢您的参与",
  "data": {
    "message_id": "msg_9b4c3d2e5f6a",
    "feedback_type": "thumbs_up",
    "feedback_status": "thumbs_up",
    "created_at": "2026-06-05T11:20:30Z"
  },
  "request_id": "req_s9t0u1v2w3x4y5z6"
}
```

---

### 4.8 查询重写建议

**POST** `/api/v1/knowledge-bases/{kb_id}/query/rewrite`

当查询返回结果置信度低于阈值时，此接口提供替代查询建议。

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID |
| query | string | 是 | 原始查询文本 |
| suggestion_count | integer | 否 | 建议数量，默认3，最大5 |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/query/rewrite" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "query": "那个违约的事情怎么赔",
    "suggestion_count": 3
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "original_query": "那个违约的事情怎么赔",
    "suggestions": [
      {"type": "precision", "query": "供应商合同模板中关于违约金的条款有哪些？", "explanation": "将口语化查询精确化为法律条款查询"},
      {"type": "generalization", "query": "供应商违约责任有哪些类型及对应的赔偿标准？", "explanation": "泛化查询以覆盖更多相关条款"},
      {"type": "cross_document", "query": "对比不同类型合同中违约金的计算标准和上限规定", "explanation": "跨文档检索以获取更全面的信息"}
    ]
  },
  "request_id": "req_a7b8c9d0e1f2g3h4"
}
```

---

### 4.9 多通道结果对比（调试）

**POST** `/api/v1/knowledge-bases/{kb_id}/query/compare`

仅限开发者角色调用，用于调试检索通道效果。

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID |
| query | string | 是 | 查询文本 |
| channels | string[] | 否 | 启用的通道列表：vector/bm25/pageindex/graphrag/wiki，默认全部启用 |
| top_k | integer | 否 | 每通道返回数量，默认5 |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/query/compare" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "query": "供应商延迟交货违约金",
    "channels": ["vector", "bm25", "pageindex"],
    "top_k": 5
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "query": "供应商延迟交货违约金",
    "channels": {
      "vector": {
        "results": [
          {"rank": 1, "chunk_id": "chunk_2b3c4d5e6f7a", "doc_name": "供应商合同模板V5.pdf", "score": 0.956, "snippet": "5.1 供应商迟延交货的，每迟延一日应按..."},
          {"rank": 2, "chunk_id": "chunk_5e6f7a8b9c0d", "doc_name": "采购协议标准条款.docx", "score": 0.867, "snippet": "12.3 供应商逾期交付货物的，应按..."}
        ],
        "latency_ms": 45,
        "channel": "vector"
      },
      "bm25": {
        "results": [
          {"rank": 1, "chunk_id": "chunk_2b3c4d5e6f7a", "doc_name": "供应商合同模板V5.pdf", "score": 0.923, "snippet": "5.1 供应商迟延交货的，每迟延一日应按..."},
          {"rank": 2, "chunk_id": "chunk_9d8e7f6a5b4c", "doc_name": "物流服务合同V2.pdf", "score": 0.812, "snippet": "8.2 物流方延迟送达的，每日按运费的..."}
        ],
        "latency_ms": 28,
        "channel": "bm25"
      },
      "pageindex": {
        "results": [
          {"rank": 1, "chunk_id": "chunk_2b3c4d5e6f7a", "doc_name": "供应商合同模板V5.pdf", "score": 1.0, "snippet": "完整第五节内容", "section": "第五条 违约责任", "page_range": "3-5"},
          {"rank": 2, "chunk_id": "chunk_5e6f7a8b9c0d", "doc_name": "采购协议标准条款.docx", "score": 0.95, "snippet": "完整第十二节内容", "section": "第十二条 违约责任与赔偿", "page_range": "8-9"}
        ],
        "latency_ms": 520,
        "channel": "pageindex"
      }
    },
    "fusion_comparison": {
      "rrf": {
        "top_result": "chunk_2b3c4d5e6f7a",
        "agreement_count": 3,
        "note": "三个通道一致推荐的首位结果"
      }
    }
  },
  "request_id": "req_i5j6k7l8m9n0o1p2"
}
```

---

## 5. 权限管理API

### 5.1 登录

**POST** `/api/v1/auth/login`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名或邮箱 |
| password | string | 是 | 密码 |
| ttl_hours | integer | 否 | Token有效期（小时），默认24，最大720 |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "zhang.wei@example.com",
    "password": "********",
    "ttl_hours": 8
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzhhM2YyYjFjIiwidXNlcm5hbWUiOiJ6aGFuZy53ZWkiLCJyb2xlcyI6WyJrYl9hZG1pbiJdLCJncm91cHMiOlsiZmluYW5jZV9kZXB0Il0sImNsZWFyYW5jZSI6ImludGVybmFsIiwidGVuYW50X2lkIjoidGVuYW50Xzl4Mnk1eiIsImV4cCI6MTcxODAwMDAwMCwicGVybWlzc2lvbnMiOlsia2I6cmVhZCIsImtiOndyaXRlIiwiZG9jOnVwbG9hZCJdfQ.signature...",
    "refresh_token": "rt_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "token_type": "Bearer",
    "expires_in": 28800,
    "user": {
      "user_id": "user_8a3f2b1c",
      "username": "zhang.wei",
      "email": "zhang.wei@example.com",
      "display_name": "张伟",
      "department": "法务部",
      "roles": ["kb_admin"],
      "clearance_level": "internal"
    }
  },
  "request_id": "req_q3r4s5t6u7v8w9x0"
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 2001 | 用户名或密码错误 |
| 2002 | 账户已锁定，请联系管理员 |
| 2003 | 账户已禁用 |
| 1003 | 连续登录失败次数过多，请15分钟后重试 |

---

### 5.2 刷新Token

**POST** `/api/v1/auth/refresh`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refresh_token | string | 是 | 登录时获取的refresh_token |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "rt_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "Token刷新成功",
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "refresh_token": "rt_b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7",
    "token_type": "Bearer",
    "expires_in": 28800
  },
  "request_id": "req_y1z2a3b4c5d6e7f8"
}
```

---

### 5.3 当前用户信息

**GET** `/api/v1/users/me`

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/users/me" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user_id": "user_8a3f2b1c",
    "username": "zhang.wei",
    "email": "zhang.wei@example.com",
    "display_name": "张伟",
    "avatar_url": "https://static.example.com/avatars/zhangwei.png",
    "phone": "138****1234",
    "department": "法务部",
    "position": "高级法务经理",
    "clearance_level": "internal",
    "status": "active",
    "roles": [
      {"role_id": "role_kb_admin", "name": "知识库管理员", "role_type": "system"},
      {"role_id": "role_legal_lead", "name": "法务主管", "role_type": "custom"}
    ],
    "permissions": ["kb:read", "kb:write", "doc:upload", "doc:delete", "conversation:read", "query:execute"],
    "tenant": {
      "tenant_id": "tenant_9x2y5z",
      "name": "ABC科技有限公司"
    },
    "last_login_at": "2026-06-05T10:00:00Z",
    "created_at": "2025-01-15T08:00:00Z"
  },
  "request_id": "req_g9h0i1j2k3l4m5n6"
}
```

---

### 5.4 创建租户

**POST** `/api/v1/tenants`

超级管理员专属接口。

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 租户名称（企业名） |
| description | string | 否 | 租户描述 |
| contact_email | string | 是 | 管理员联系邮箱 |
| max_users | integer | 否 | 最大用户数，0=无限制 |
| max_kb_count | integer | 否 | 最大知识库数，0=无限制 |
| max_storage_gb | number | 否 | 最大存储容量(GB)，0=无限制 |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/tenants" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "XYZ金融集团",
    "description": "XYZ金融集团知识库租户",
    "contact_email": "admin@xyz-finance.com",
    "max_users": 500,
    "max_kb_count": 20,
    "max_storage_gb": 100
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "租户创建成功",
  "data": {
    "tenant_id": "tenant_5x8y2z",
    "name": "XYZ金融集团",
    "contact_email": "admin@xyz-finance.com",
    "status": "active",
    "created_at": "2026-06-05T11:30:00Z"
  },
  "request_id": "req_o7p8q9r0s1t2u3v4"
}
```

---

### 5.5 租户列表

**GET** `/api/v1/tenants`

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/tenants?page=1&page_size=20" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "tenant_id": "tenant_9x2y5z",
        "name": "ABC科技有限公司",
        "status": "active",
        "max_users": 1000,
        "max_storage_gb": 500,
        "user_count": 156,
        "kb_count": 12,
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {"total": 3, "page": 1, "page_size": 20, "total_pages": 1}
  },
  "request_id": "req_w5x6y7z8a9b0c1d2"
}
```

---

### 5.6 添加租户成员

**POST** `/api/v1/tenants/{tenant_id}/users`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tenant_id | string | 是 | 租户ID |
| user_id | string | 否 | 已有用户ID（二选一） |
| email | string | 否 | 邮箱邀请（二选一，发送邀请邮件） |
| role_ids | string[] | 是 | 分配的角色ID列表 |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/tenants/tenant_9x2y5z/users" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "li.si@example.com",
    "role_ids": ["role_kb_admin", "role_legal_viewer"]
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "邀请已发送",
  "data": {
    "tenant_id": "tenant_9x2y5z",
    "user_email": "li.si@example.com",
    "invitation_status": "pending",
    "invited_at": "2026-06-05T11:35:00Z"
  },
  "request_id": "req_e3f4g5h6i7j8k9l0"
}
```

---

### 5.7 修改租户成员角色

**PUT** `/api/v1/tenants/{tenant_id}/users/{user_id}/role`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tenant_id | string | 是 | 租户ID |
| user_id | string | 是 | 用户ID |
| role_ids | string[] | 是 | 新角色ID列表（覆盖式更新） |

#### 请求示例

```bash
curl -X PUT "https://api.rag3.example.com/api/v1/tenants/tenant_9x2y5z/users/user_5c7e9a1b/role" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "role_ids": ["role_log_auditor"]
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "角色已更新",
  "data": {
    "user_id": "user_5c7e9a1b",
    "roles": ["role_log_auditor"],
    "updated_at": "2026-06-05T11:40:00Z"
  },
  "request_id": "req_m1n2o3p4q5r6s7t8"
}
```

---

### 5.8 设置知识库ACL

**POST** `/api/v1/knowledge-bases/{kb_id}/acl`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID |
| grantee_type | string | 是 | 被授权者类型：user/role/group/department/tenant |
| grantee_id | string | 是 | 被授权者ID |
| permission | string | 是 | 权限级别：read/write/manage |
| conditions | object | 否 | 条件限制，如 `{"ip_range": "10.0.0.0/8", "time_range": "09:00-18:00"}` |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/acl" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "grantee_type": "department",
    "grantee_id": "dept_legal",
    "permission": "write",
    "conditions": {
      "ip_range": "10.0.0.0/8"
    }
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "ACL规则已设置",
  "data": {
    "rule_id": "acl_8a3f2b1c4d5e",
    "kb_id": "kb_3f7a8b2c1d4e",
    "grantee_type": "department",
    "grantee_id": "dept_legal",
    "permission": "write",
    "created_at": "2026-06-05T11:45:00Z"
  },
  "request_id": "req_u9v0w1x2y3z4a5b6"
}
```

---

### 5.9 查看知识库ACL

**GET** `/api/v1/knowledge-bases/{kb_id}/acl`

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/acl" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "kb_id": "kb_3f7a8b2c1d4e",
    "rules": [
      {
        "rule_id": "acl_8a3f2b1c4d5e",
        "grantee_type": "department",
        "grantee_id": "dept_legal",
        "grantee_name": "法务部",
        "permission": "write",
        "is_active": true,
        "created_by": "user_8a3f2b1c",
        "created_at": "2026-06-05T11:45:00Z"
      },
      {
        "rule_id": "acl_9b4c3d2e5f6a",
        "grantee_type": "user",
        "grantee_id": "user_5c7e9a1b",
        "grantee_name": "李四",
        "permission": "read",
        "is_active": true,
        "created_by": "user_8a3f2b1c",
        "created_at": "2026-06-03T09:00:00Z"
      }
    ],
    "count": 2
  },
  "request_id": "req_c7d8e9f0g1h2i3j4"
}
```

---

### 5.10 设置文档级ACL

**POST** `/api/v1/knowledge-bases/{kb_id}/documents/{doc_id}/acl`

参数与知识库ACL一致，额外支持 `inherit`（继承知识库权限）。

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/knowledge-bases/kb_3f7a8b2c1d4e/documents/doc_8a3f2b1c4d5e/acl" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "grantee_type": "role",
    "grantee_id": "role_legal_director",
    "permission": "read",
    "conditions": {
      "confidentiality": "confidential"
    }
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "文档级ACL规则已设置",
  "data": {
    "rule_id": "doc_acl_8a3f2b1c4d5e",
    "doc_id": "doc_8a3f2b1c4d5e",
    "grantee_type": "role",
    "grantee_id": "role_legal_director",
    "permission": "read",
    "created_at": "2026-06-05T11:50:00Z",
    "propagation_status": "syncing_to_indexes"
  },
  "request_id": "req_k5l6m7n8o9p0q1r2"
}
```

---

### 5.11 创建API Key

**POST** `/api/v1/api-keys`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | API Key名称 |
| description | string | 否 | 用途描述 |
| permissions | string[] | 是 | 权限范围：query:execute/kb:read/kb:write/doc:upload等 |
| kb_ids | string[] | 否 | 限定知识库范围，不指定则允许所有有权限的知识库 |
| expires_at | string | 否 | 过期时间（ISO 8601），不指定则永不过期 |
| ip_whitelist | string[] | 否 | IP白名单，如["10.0.0.0/8", "192.168.1.100"] |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/api-keys" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CI/CD自动化测试Key",
    "description": "用于CI流水线中的自动化评测脚本调用",
    "permissions": ["query:execute", "kb:read"],
    "kb_ids": ["kb_3f7a8b2c1d4e", "kb_9d5e1f6a3b7c"],
    "expires_at": "2026-12-31T23:59:59Z",
    "ip_whitelist": ["10.0.0.0/16"]
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "API Key创建成功，请妥善保存（仅显示一次）",
  "data": {
    "key_id": "apikey_8a3f2b1c4d5e",
    "api_key": "rag_kb3v1_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
    "name": "CI/CD自动化测试Key",
    "permissions": ["query:execute", "kb:read"],
    "expires_at": "2026-12-31T23:59:59Z",
    "created_at": "2026-06-05T12:00:00Z"
  },
  "request_id": "req_s3t4u5v6w7x8y9z0"
}
```

---

### 5.12 API Key列表

**GET** `/api/v1/api-keys`

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/api-keys" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "key_id": "apikey_8a3f2b1c4d5e",
        "name": "CI/CD自动化测试Key",
        "description": "用于CI流水线中的自动化评测脚本调用",
        "api_key_masked": "rag_kb3v1_a1b2****s9t0",
        "permissions": ["query:execute", "kb:read"],
        "status": "active",
        "expires_at": "2026-12-31T23:59:59Z",
        "last_used_at": "2026-06-05T11:55:00Z",
        "usage_stats": {
          "total_calls": 234,
          "total_tokens": 524800,
          "success_rate": 0.985
        },
        "created_at": "2026-06-05T12:00:00Z"
      }
    ],
    "pagination": {"total": 5, "page": 1, "page_size": 20, "total_pages": 1}
  },
  "request_id": "req_a1b2c3d4e5f6g7h8"
}
```

---

### 5.13 撤销API Key

**DELETE** `/api/v1/api-keys/{key_id}`

#### 请求示例

```bash
curl -X DELETE "https://api.rag3.example.com/api/v1/api-keys/apikey_8a3f2b1c4d5e" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "API Key已撤销",
  "data": {
    "key_id": "apikey_8a3f2b1c4d5e",
    "status": "revoked",
    "revoked_at": "2026-06-05T12:05:00Z"
  },
  "request_id": "req_i9j0k1l2m3n4o5p6"
}
```

---

## 6. 评测API

### 6.1 创建评测任务

**POST** `/api/v1/evaluations/runs`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 评测任务名称 |
| dataset_id | string | 是 | 评测数据集ID |
| kb_id | string | 是 | 目标知识库ID |
| evaluation_type | string | 是 | 评测类型：retrieval/generation/end_to_end/compare |
| metrics | string[] | 是 | 评测指标列表 |
| config_override | object | 否 | 覆盖的流水线配置 |
| schedule | object | 否 | 定时评测配置 `{"cron": "0 2 * * *"}` |

支持的评测指标：
- 检索指标：`recall@5`, `recall@10`, `recall@20`, `precision@5`, `precision@10`, `mrr`, `ndcg@5`, `ndcg@10`
- 生成指标：`faithfulness`, `answer_relevancy`, `context_precision`, `context_recall`, `hallucination_rate`, `toxicity`, `bias`
- 端到端指标：`em`, `f1_score`, `rouge_l`, `bert_score`

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/evaluations/runs" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "V5合同模板-检索质量回归评测",
    "dataset_id": "ds_8a3f2b1c4d5e",
    "kb_id": "kb_3f7a8b2c1d4e",
    "evaluation_type": "retrieval",
    "metrics": ["recall@5", "recall@10", "mrr", "ndcg@10", "precision@10"],
    "config_override": {
      "chunk_strategy": "template",
      "hybrid_weight": 0.7
    }
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "评测任务已创建",
  "data": {
    "run_id": "evalrun_8a3f2b1c4d5e",
    "name": "V5合同模板-检索质量回归评测",
    "status": "queued",
    "dataset_id": "ds_8a3f2b1c4d5e",
    "dataset_size": 150,
    "metrics": ["recall@5", "recall@10", "mrr", "ndcg@10", "precision@10"],
    "created_at": "2026-06-05T12:10:00Z",
    "estimated_duration_seconds": 120
  },
  "request_id": "req_q7r8s9t0u1v2w3x4"
}
```

---

### 6.2 评测任务列表

**GET** `/api/v1/evaluations/runs`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 否 | 按知识库筛选 |
| status | string | 否 | 状态：queued/running/completed/failed |
| evaluation_type | string | 否 | 评测类型筛选 |
| page | integer | 否 | 页码 |
| page_size | integer | 否 | 每页数量 |

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/evaluations/runs?kb_id=kb_3f7a8b2c1d4e&status=completed&page=1&page_size=10" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "run_id": "evalrun_8a3f2b1c4d5e",
        "name": "V5合同模板-检索质量回归评测",
        "status": "completed",
        "evaluation_type": "retrieval",
        "metrics": ["recall@5", "recall@10", "mrr", "ndcg@10"],
        "overall_score": 0.89,
        "query_count": 150,
        "completed_at": "2026-06-05T12:12:00Z",
        "duration_seconds": 115
      }
    ],
    "pagination": {"total": 8, "page": 1, "page_size": 10, "total_pages": 1}
  },
  "request_id": "req_y5z6a7b8c9d0e1f2"
}
```

---

### 6.3 评测详情

**GET** `/api/v1/evaluations/runs/{run_id}`

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/evaluations/runs/evalrun_8a3f2b1c4d5e" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "run_id": "evalrun_8a3f2b1c4d5e",
    "name": "V5合同模板-检索质量回归评测",
    "status": "completed",
    "evaluation_type": "retrieval",
    "config": {
      "kb_id": "kb_3f7a8b2c1d4e",
      "chunk_strategy": "template",
      "hybrid_weight": 0.7,
      "embedding_model": "BAAI/bge-m3",
      "reranker_model": "BAAI/bge-reranker-v2-m3"
    },
    "results": {
      "recall@5": 0.862,
      "recall@10": 0.934,
      "recall@20": 0.971,
      "mrr": 0.891,
      "ndcg@10": 0.905,
      "precision@10": 0.823
    },
    "tier_breakdown": {
      "tier_1": {"query_count": 90, "recall@10": 0.97, "mrr": 0.95},
      "tier_2": {"query_count": 45, "recall@10": 0.88, "mrr": 0.82},
      "tier_3": {"query_count": 15, "recall@10": 0.76, "mrr": 0.71}
    },
    "comparison_with_baseline": {
      "baseline_run_id": "evalrun_7f6e5d4c3b2a",
      "recall@10_change": "+0.034",
      "mrr_change": "+0.021",
      "improved_queries": 112,
      "degraded_queries": 23,
      "unchanged_queries": 15
    },
    "created_at": "2026-06-05T12:10:00Z",
    "completed_at": "2026-06-05T12:12:00Z",
    "duration_seconds": 115,
    "cost": {
      "llm_tokens": 85600,
      "embedding_tokens": 0,
      "estimated_cost_usd": 0.024
    }
  },
  "request_id": "req_g3h4i5j6k7l8m9n0"
}
```

---

### 6.4 评测分数明细

**GET** `/api/v1/evaluations/runs/{run_id}/scores`

返回每个查询的逐项分数明细。

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| run_id | string | 是 | 评测任务ID |
| page | integer | 否 | 页码 |
| page_size | integer | 否 | 每页数量 |
| sort_by | string | 否 | 排序字段：recall@10/mrr/faithfulness，默认recall@10 |
| sort_order | string | 否 | 排序方向，默认asc（低分在前） |

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/evaluations/runs/evalrun_8a3f2b1c4d5e/scores?page=1&page_size=10&sort_by=recall@10&sort_order=asc" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "query_id": "q_001",
        "query": "供应商交期延迟超30天的赔偿上限是多少？",
        "ground_truth_chunk_ids": ["chunk_2b3c4d5e6f7a", "chunk_3c4d5e6f7a8b"],
        "retrieved_chunk_ids": ["chunk_2b3c4d5e6f7a", "chunk_3c4d5e6f7a8b", "chunk_4d5e6f7a8b9c"],
        "recall@5": 1.0,
        "recall@10": 1.0,
        "mrr": 1.0,
        "ndcg@10": 1.0
      },
      {
        "query_id": "q_023",
        "query": "知识产权条款中关于合作开发成果的归属如何规定？",
        "ground_truth_chunk_ids": ["chunk_8f9a0b1c2d3e", "chunk_9a0b1c2d3e4f"],
        "retrieved_chunk_ids": ["chunk_1b2c3d4e5f6a"],
        "recall@5": 0.0,
        "recall@10": 0.0,
        "mrr": 0.0,
        "ndcg@10": 0.0,
        "flagged": true,
        "flag_reason": "零召回：检索结果完全不包含正确答案"
      }
    ],
    "pagination": {"total": 150, "page": 1, "page_size": 10, "total_pages": 15}
  },
  "request_id": "req_o1p2q3r4s5t6u7v8"
}
```

---

### 6.5 上传评测数据集

**POST** `/api/v1/evaluations/datasets`

Content-Type: `multipart/form-data`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 数据集名称 |
| description | string | 否 | 描述 |
| file | file | 是 | 数据集文件（CSV/JSON） |
| format | string | 是 | 文件格式：csv/json |
| dataset_type | string | 是 | 数据集类型：retrieval/generation/end_to_end |

CSV文件格式要求：
- 检索评测：`query_id,query,relevant_chunk_ids(逗号分隔)`
- 生成评测：`query_id,query,ground_truth_answer`
- 端到端评测：`query_id,query,expected_answer,relevant_chunk_ids`

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/evaluations/datasets" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -F "name=合同检索评测集V3" \
  -F "description=包含150个合同法务相关查询及其对应正确答案分块" \
  -F "file=@contract_retrieval_eval_v3.csv" \
  -F "format=csv" \
  -F "dataset_type=retrieval"
```

#### 响应示例

```json
{
  "code": 0,
  "message": "评测数据集上传成功",
  "data": {
    "dataset_id": "ds_8a3f2b1c4d5e",
    "name": "合同检索评测集V3",
    "dataset_type": "retrieval",
    "format": "csv",
    "query_count": 150,
    "tier_distribution": {
      "tier_1": 90,
      "tier_2": 45,
      "tier_3": 15
    },
    "created_at": "2026-06-05T12:00:00Z"
  },
  "request_id": "req_w9x0y1z2a3b4c5d6"
}
```

---

### 6.6 数据集列表

**GET** `/api/v1/evaluations/datasets`

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/evaluations/datasets?page=1&page_size=20" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "dataset_id": "ds_8a3f2b1c4d5e",
        "name": "合同检索评测集V3",
        "description": "包含150个合同法务相关查询及其对应正确答案分块",
        "dataset_type": "retrieval",
        "query_count": 150,
        "version": 3,
        "status": "validated",
        "created_by": "user_8a3f2b1c",
        "created_at": "2026-06-05T12:00:00Z",
        "last_used_at": "2026-06-05T12:10:00Z"
      }
    ],
    "pagination": {"total": 6, "page": 1, "page_size": 20, "total_pages": 1}
  },
  "request_id": "req_e7f8g9h0i1j2k3l4"
}
```

---

### 6.7 多配置对比评测

**POST** `/api/v1/evaluations/compare`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 对比评测名称 |
| dataset_id | string | 是 | 数据集ID |
| kb_id | string | 是 | 目标知识库ID |
| evaluation_type | string | 是 | 评测类型 |
| metrics | string[] | 是 | 评测指标 |
| configs | object[] | 是 | 对比配置列表，每项包含label和config_override |
| significance_test | boolean | 否 | 是否进行显著性检验，默认true |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/evaluations/compare" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "分块策略对比：模板 vs 语义",
    "dataset_id": "ds_8a3f2b1c4d5e",
    "kb_id": "kb_3f7a8b2c1d4e",
    "evaluation_type": "retrieval",
    "metrics": ["recall@10", "mrr", "ndcg@10"],
    "configs": [
      {
        "label": "Baseline-模板分块",
        "config_override": {"chunk_strategy": "template", "chunk_size": 512}
      },
      {
        "label": "Experiment-语义分块",
        "config_override": {"chunk_strategy": "semantic", "chunk_size": 512}
      }
    ],
    "significance_test": true
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "对比评测任务已创建",
  "data": {
    "compare_id": "evalcmp_8a3f2b1c4d5e",
    "name": "分块策略对比：模板 vs 语义",
    "configs": [
      {
        "label": "Baseline-模板分块",
        "run_id": "evalrun_5e6f7a8b9c0d",
        "status": "queued"
      },
      {
        "label": "Experiment-语义分块",
        "run_id": "evalrun_6f7a8b9c0d1e",
        "status": "queued"
      }
    ],
    "created_at": "2026-06-05T12:15:00Z",
    "estimated_completion": "2026-06-05T12:20:00Z"
  },
  "request_id": "req_m5n6o7p8q9r0s1t2"
}
```

---

## 7. 管理API

### 7.1 健康检查

**GET** `/api/v1/admin/health`

无需鉴权。

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/admin/health"
```

#### 响应示例

```json
{
  "code": 0,
  "message": "healthy",
  "data": {
    "status": "healthy",
    "version": "v3.0.0",
    "uptime_seconds": 864000,
    "components": {
      "api_service": {"status": "healthy", "latency_ms": 1},
      "mysql": {"status": "healthy", "latency_ms": 3, "connections_active": 12},
      "milvus": {"status": "healthy", "latency_ms": 8, "collections": 15},
      "elasticsearch": {"status": "healthy", "latency_ms": 5, "cluster_status": "green"},
      "neo4j": {"status": "healthy", "latency_ms": 12},
      "redis": {"status": "healthy", "latency_ms": 1, "memory_used_mb": 2048},
      "minio": {"status": "healthy", "latency_ms": 15, "buckets": 8},
      "llm_gateway": {"status": "healthy", "latency_ms": 45, "active_models": 4}
    },
    "checked_at": "2026-06-05T12:20:00Z"
  },
  "request_id": "req_u3v4w5x6y7z8a9b0"
}
```

---

### 7.2 Prometheus指标

**GET** `/api/v1/admin/metrics`

返回Prometheus格式的指标数据。

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/admin/metrics" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例（Prometheus文本格式）

```
# HELP rag_requests_total Total RAG query requests
# TYPE rag_requests_total counter
rag_requests_total{tier="tier_1",pipeline="vector"} 84523
rag_requests_total{tier="tier_2",pipeline="pageindex"} 15230
rag_requests_total{tier="tier_3",pipeline="graphrag"} 3210
# HELP rag_latency_seconds RAG query latency
# TYPE rag_latency_seconds histogram
rag_latency_seconds_bucket{le="0.1"} 5200
rag_latency_seconds_bucket{le="0.5"} 45600
rag_latency_seconds_bucket{le="1.0"} 78200
rag_latency_seconds_bucket{le="5.0"} 98300
rag_latency_seconds_sum 245600
rag_latency_seconds_count 102890
# HELP rag_recall_at_10 Recall@10
# TYPE rag_recall_at_10 gauge
rag_recall_at_10{dataset="contract_v3"} 0.934
# HELP rag_token_usage_total Token usage
# TYPE rag_token_usage_total counter
rag_token_usage_total{model="deepseek-v4",type="input"} 45823000
rag_token_usage_total{model="deepseek-v4",type="output"} 12567000
# HELP rag_llm_cost_usd_total LLM API cost USD
# TYPE rag_llm_cost_usd_total counter
rag_llm_cost_usd_total{model="deepseek-v4"} 128.45
```

---

### 7.3 审计日志查询

**GET** `/api/v1/admin/audit-logs`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_time | string | 否 | 开始时间（ISO 8601） |
| end_time | string | 否 | 结束时间（ISO 8601） |
| user_id | string | 否 | 操作用户ID |
| event_type | string | 否 | 事件类型：query/upload/delete/acl_change/config_change/login |
| kb_id | string | 否 | 关联知识库ID |
| resource_type | string | 否 | 资源类型 |
| search | string | 否 | 关键字段模糊搜索 |
| page | integer | 否 | 页码 |
| page_size | integer | 否 | 每页数量 |

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/admin/audit-logs?start_time=2026-06-01T00:00:00Z&end_time=2026-06-05T23:59:59Z&event_type=query&kb_id=kb_3f7a8b2c1d4e&page=1&page_size=20" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "event_id": "audit_8a3f2b1c4d5e",
        "timestamp": "2026-06-05T11:15:32.450Z",
        "event_type": "query",
        "user_id": "user_8a3f2b1c",
        "user_name": "张伟",
        "resource_type": "conversation",
        "resource_id": "conv_8a3f2b1c4d5e",
        "kb_id": "kb_3f7a8b2c1d4e",
        "details": {
          "query_hash": "sha256:a1b2c3d4...",
          "routing_tier": "tier_2",
          "channels_used": ["pageindex", "vector"],
          "chunks_retrieved": 8,
          "chunks_returned": 5,
          "model": "deepseek-v4",
          "tokens_used": 2252,
          "latency_ms": 1850,
          "acls_applied": ["confidentiality:internal", "department:legal"],
          "security_flags": []
        },
        "ip_address": "10.0.1.25",
        "user_agent": "RAGClient-Python/3.0.0",
        "entry_hash": "sha256:9a8b7c6d..."
      }
    ],
    "pagination": {
      "total": 15230,
      "page": 1,
      "page_size": 20,
      "total_pages": 762
    }
  },
  "request_id": "req_c1d2e3f4g5h6i7j8"
}
```

---

### 7.4 用量统计

**GET** `/api/v1/admin/usage-stats`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| period | string | 否 | 时间范围：today/7d/30d/90d/1y，默认30d |
| granularity | string | 否 | 聚合粒度：hour/day/week/month，默认day |
| tenant_id | string | 否 | 租户筛选 |
| kb_id | string | 否 | 知识库筛选 |

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/admin/usage-stats?period=30d&granularity=day&tenant_id=tenant_9x2y5z" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "period": "2026-05-06 ~ 2026-06-05",
    "summary": {
      "total_queries": 45230,
      "total_tokens": 12580000,
      "total_cost_usd": 35.22,
      "unique_users": 45,
      "avg_latency_ms": 1850,
      "avg_faithfulness": 0.91,
      "avg_satisfaction": 0.86
    },
    "daily_breakdown": [
      {
        "date": "2026-06-05",
        "queries": 1520,
        "tokens": 420000,
        "cost_usd": 1.18,
        "unique_users": 28,
        "avg_latency_ms": 1780
      }
    ],
    "by_model": [
      {"model": "deepseek-v4", "queries": 39800, "tokens": 10250000, "cost_usd": 28.70},
      {"model": "qwen3-72b", "queries": 5430, "tokens": 2330000, "cost_usd": 6.52}
    ],
    "by_kb": [
      {"kb_id": "kb_3f7a8b2c1d4e", "kb_name": "法务合同知识库", "queries": 28400, "avg_faithfulness": 0.93},
      {"kb_id": "kb_9d5e1f6a3b7c", "kb_name": "财务报告知识库", "queries": 16830, "avg_faithfulness": 0.89}
    ],
    "budget_status": {
      "monthly_budget_usd": 50.0,
      "current_spending_usd": 35.22,
      "usage_percentage": 70.44,
      "projected_monthly_usd": 42.26
    }
  },
  "request_id": "req_k9l0m1n2o3p4q5r6"
}
```

---

### 7.5 流水线配置列表

**GET** `/api/v1/admin/pipeline-configs`

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/admin/pipeline-configs?kb_id=kb_3f7a8b2c1d4e" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "config_id": "cfg_8a3f2b1c4d5e",
        "kb_id": "kb_3f7a8b2c1d4e",
        "parser_type": "deepdoc",
        "chunker_type": "template",
        "chunk_size": 512,
        "chunk_overlap": 50,
        "embedding_model": "BAAI/bge-m3",
        "reranker_model": "BAAI/bge-reranker-v2-m3",
        "llm_model": "deepseek-v4",
        "temperature": 0.3,
        "max_tokens": 2048,
        "top_k": 10,
        "hybrid_weight": 0.6,
        "created_at": "2026-06-01T08:00:00Z",
        "updated_at": "2026-06-05T09:15:00Z"
      }
    ]
  },
  "request_id": "req_s7t8u9v0w1x2y3z4"
}
```

---

### 7.6 更新流水线配置

**PUT** `/api/v1/admin/pipeline-configs/{kb_id}`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kb_id | string | 是 | 知识库ID |
| parser_type | string | 否 | 解析器：deepdoc/mineru/docling/paddleocr |
| chunker_type | string | 否 | 分块器：general/template/hierarchical/semantic/parent_child |
| chunk_size | integer | 否 | 分块大小(Token)，范围128-2048 |
| chunk_overlap | integer | 否 | 块间重叠(Token)，范围0-512 |
| embedding_model | string | 否 | 嵌入模型 |
| reranker_model | string | 否 | 重排序模型 |
| llm_model | string | 否 | LLM模型 |
| temperature | number | 否 | LLM温度，范围0-2 |
| max_tokens | integer | 否 | 最大生成Token数 |
| top_k | integer | 否 | 检索Top-K |
| hybrid_weight | number | 否 | 混合检索向量权重，范围0-1 |
| custom_params | object | 否 | 自定义扩展参数 |

#### 请求示例

```bash
curl -X PUT "https://api.rag3.example.com/api/v1/admin/pipeline-configs/kb_3f7a8b2c1d4e" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "chunk_size": 768,
    "chunk_overlap": 100,
    "top_k": 15,
    "hybrid_weight": 0.7
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "流水线配置已更新",
  "data": {
    "config_id": "cfg_8a3f2b1c4d5e",
    "kb_id": "kb_3f7a8b2c1d4e",
    "updated_at": "2026-06-05T12:25:00Z",
    "reindex_required": true,
    "affected_fields": ["chunk_size", "chunk_overlap"],
    "warning": "修改了分块参数，需要重新索引以生效"
  },
  "request_id": "req_a5b6c7d8e9f0g1h2"
}
```

---

### 7.7 可用模型列表

**GET** `/api/v1/admin/models`

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/admin/models" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "llm_models": [
      {
        "model_id": "deepseek-v4",
        "display_name": "DeepSeek V4",
        "provider": "DeepSeek",
        "deployment": "api",
        "context_window": 131072,
        "max_output_tokens": 8192,
        "supports_streaming": true,
        "supports_function_calling": true,
        "pricing": {"input_per_1k": 0.00014, "output_per_1k": 0.00028},
        "status": "healthy",
        "tags": ["general", "generation", "classification"]
      },
      {
        "model_id": "qwen3-72b",
        "display_name": "Qwen3-72B (本地部署)",
        "provider": "Alibaba",
        "deployment": "on_premise",
        "context_window": 131072,
        "max_output_tokens": 8192,
        "supports_streaming": true,
        "supports_function_calling": true,
        "pricing": null,
        "status": "healthy",
        "tags": ["chinese", "generation", "complex_reasoning"]
      },
      {
        "model_id": "claude-4-sonnet",
        "display_name": "Claude 4 Sonnet",
        "provider": "Anthropic",
        "deployment": "api",
        "context_window": 200000,
        "max_output_tokens": 8192,
        "supports_streaming": true,
        "supports_function_calling": true,
        "pricing": {"input_per_1k": 0.003, "output_per_1k": 0.015},
        "status": "healthy",
        "tags": ["long_context", "analytical", "document_analysis"]
      }
    ],
    "embedding_models": [
      {
        "model_id": "BAAI/bge-m3",
        "dimension": 1024,
        "max_tokens": 8192,
        "supports_multilingual": true,
        "deployment": "on_premise",
        "status": "healthy"
      },
      {
        "model_id": "BAAI/bge-reranker-v2-m3",
        "type": "reranker",
        "deployment": "on_premise",
        "status": "healthy"
      }
    ]
  },
  "request_id": "req_i3j4k5l6m7n8o9p0"
}
```

---

### 7.8 模型连通性测试

**POST** `/api/v1/admin/models/{model_id}/test`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| model_id | string | 是 | 模型ID |
| test_prompt | string | 否 | 测试提示词，默认"Hello, this is a connectivity test. Please reply with 'OK'." |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/admin/models/deepseek-v4/test" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "test_prompt": "请用中文回复：连接测试成功"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "model_id": "deepseek-v4",
    "status": "reachable",
    "response": "连接测试成功",
    "latency_ms": 245,
    "tokens_used": 28,
    "tested_at": "2026-06-05T12:30:00Z"
  },
  "request_id": "req_q1r2s3t4u5v6w7x8"
}
```

---

### 7.9 Prompt模板列表

**GET** `/api/v1/admin/prompt-templates`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scenario | string | 否 | 按场景筛选：query_classification/doc_parsing/qa/agent/summary/citation |

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/admin/prompt-templates?scenario=qa" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "template_id": "prompt_8a3f2b1c4d5e",
        "name": "标准RAG问答模板",
        "scenario": "qa",
        "version": 3,
        "is_active": true,
        "created_by": "user_5c7e9a1b",
        "updated_at": "2026-06-04T10:00:00Z",
        "variables": ["query", "context", "history", "language"]
      }
    ]
  },
  "request_id": "req_y9z0a1b2c3d4e5f6"
}
```

---

### 7.10 更新Prompt模板

**PUT** `/api/v1/admin/prompt-templates/{template_id}`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| template_id | string | 是 | 模板ID |
| system_prompt | string | 否 | 系统提示词 |
| user_prompt_template | string | 否 | 用户提示词模板，支持 `{query}` `{context}` `{history}` 变量 |
| max_tokens | integer | 否 | 最大输出Token数 |
| temperature | number | 否 | 温度参数 |
| change_note | string | 否 | 变更说明 |

#### 请求示例

```bash
curl -X PUT "https://api.rag3.example.com/api/v1/admin/prompt-templates/prompt_8a3f2b1c4d5e" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "system_prompt": "你是一个专业的企业知识库助手。请基于提供的文档内容回答用户问题。如果文档中没有相关信息，请明确说明。所有回答必须标注引用来源。",
    "user_prompt_template": "## 用户问题\n{query}\n\n## 相关文档内容\n{context}\n\n## 回答要求\n请基于以上文档内容回答用户问题，使用[1][2]标记引用来源。",
    "temperature": 0.2,
    "change_note": "优化引用标注要求，降低temperature以提高一致性"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "Prompt模板已更新",
  "data": {
    "template_id": "prompt_8a3f2b1c4d5e",
    "version": 4,
    "updated_by": "user_8a3f2b1c",
    "updated_at": "2026-06-05T12:35:00Z"
  },
  "request_id": "req_g7h8i9j0k1l2m3n4"
}
```

---

### 7.11 Prompt模板测试

**POST** `/api/v1/admin/prompt-templates/{template_id}/test`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| template_id | string | 是 | 模板ID |
| test_query | string | 是 | 测试查询 |
| test_context | string | 否 | 测试上下文（模拟检索结果） |
| test_history | string | 否 | 测试对话历史 |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/admin/prompt-templates/prompt_8a3f2b1c4d5e/test" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "test_query": "供应商延迟交货的违约金如何计算？",
    "test_context": "5.1 供应商迟延交货的，每迟延一日应按迟延交付货物价值的千分之五向采购方支付违约金。5.5 违约金总额不超过合同总金额的20%。",
    "test_history": "用户：我需要查一下合同条款。\n助手：好的，请问具体需要查询什么条款？"
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "rendered_prompt": "## 系统提示\n你是一个专业的企业知识库助手...\n\n## 用户问题\n供应商延迟交货的违约金如何计算？\n\n## 相关文档内容\n5.1 供应商迟延交货的...\n\n## 回答要求\n...",
    "llm_response": "根据合同条款5.1，供应商迟延交货的违约金按迟延交付货物价值的每日千分之五计算[1]。违约金总额不超过合同总金额的20%[2]。",
    "token_usage": {"prompt_tokens": 320, "completion_tokens": 68, "total_tokens": 388},
    "latency_ms": 520,
    "model_used": "deepseek-v4"
  },
  "request_id": "req_o5p6q7r8s9t0u1v2"
}
```

---

### 7.12 触发备份

**POST** `/api/v1/admin/maintenance/backup`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| backup_type | string | 是 | 备份类型：full/incremental |
| scope | string[] | 否 | 备份范围：mysql/es/milvus/minio/all，默认all |

#### 请求示例

```bash
curl -X POST "https://api.rag3.example.com/api/v1/admin/maintenance/backup" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "backup_type": "full",
    "scope": ["all"]
  }'
```

#### 响应示例

```json
{
  "code": 0,
  "message": "备份任务已触发",
  "data": {
    "backup_id": "backup_8a3f2b1c4d5e",
    "backup_type": "full",
    "scope": ["mysql", "elasticsearch", "milvus", "minio"],
    "status": "running",
    "started_at": "2026-06-05T12:40:00Z",
    "estimated_size_gb": 45.2,
    "estimated_duration_minutes": 120
  },
  "request_id": "req_w3x4y5z6a7b8c9d0"
}
```

---

### 7.13 备份列表

**GET** `/api/v1/admin/maintenance/backups`

#### 请求示例

```bash
curl -X GET "https://api.rag3.example.com/api/v1/admin/maintenance/backups?page=1&page_size=10" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "backup_id": "backup_7f6e5d4c3b2a",
        "backup_type": "incremental",
        "status": "completed",
        "size_gb": 12.8,
        "started_at": "2026-06-04T02:00:00Z",
        "completed_at": "2026-06-04T03:30:00Z",
        "duration_minutes": 90,
        "download_url_expires_at": "2026-06-11T02:00:00Z"
      }
    ],
    "pagination": {"total": 12, "page": 1, "page_size": 10, "total_pages": 2}
  },
  "request_id": "req_e1f2g3h4i5j6k7l8"
}
```

---

## 8. 鉴权与安全

### 8.1 JWT结构

#### Header

```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "key-2026-06-01"
}
```

#### Payload

```json
{
  "sub": "user_8a3f2b1c",
  "username": "zhang.wei",
  "email": "zhang.wei@example.com",
  "display_name": "张伟",
  "roles": ["kb_admin", "legal_viewer"],
  "groups": ["legal_dept", "asia_region"],
  "clearance": "internal",
  "tenant_id": "tenant_9x2y5z",
  "permissions": ["kb:read", "kb:write", "doc:upload", "doc:delete", "query:execute", "conversation:read"],
  "iat": 1718000000,
  "exp": 1718028800,
  "jti": "jti_a1b2c3d4e5f6"
}
```

#### 字段说明

| 字段 | 说明 |
|------|------|
| sub | 用户唯一标识 |
| roles | 用户角色列表 |
| groups | 用户所属组/部门 |
| clearance | 安全密级：public/internal/confidential/restricted |
| tenant_id | 所属租户ID |
| permissions | 权限码列表 resource:action |
| iat | 签发时间 |
| exp | 过期时间 |
| jti | Token唯一标识，用于撤销 |

### 8.2 Token刷新机制

- Access Token有效期：默认24小时，可通过登录API的`ttl_hours`参数自定义
- Refresh Token有效期：30天，一次性使用，刷新后颁发新Refresh Token
- Token撤销：管理员可通过管理后台撤销指定用户的全部活跃Token
- 密钥轮换：RSA密钥对建议每90天轮换一次，新旧密钥并行24小时过渡期

### 8.3 API Key格式与验证

#### 格式

```
rag_kb3v1_[32字节随机字符串Base64编码]
```

示例：`rag_kb3v1_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`

#### 验证流程

1. 请求携带 `X-API-Key` 请求头
2. 网关层解析Key前缀 `rag_kb3v1_` 验证格式
3. 在MySQL中查找对应的API Key记录（已加密存储）
4. 验证Key状态、有效期、IP白名单、权限范围
5. 生成JWT Token注入请求上下文，后续鉴权与Bearer Token完全一致

### 8.4 三层速率限制算法（Token Bucket）

```
Bucket结构：
{
  user_id: "user_8a3f2b1c",
  tenant_id: "tenant_9x2y5z",
  api_path: "/api/v1/knowledge-bases/{kb_id}/query",
  tokens: 100,       // 当前可用Token数
  max_tokens: 100,   // 桶容量
  refill_rate: 10,   // 每秒补充Token数
  last_refill: 1718000000
}
```

限流检查流程：
1. 提取请求的三维标识：user_id + tenant_id + api_path
2. 查询Redis中对应的三个Token Bucket
3. 如果任一Bucket的Token数为0，返回429
4. 否则各Bucket减1，放行请求
5. 后台goroutine按refill_rate周期补充Token

### 8.5 IP白名单

API Key可绑定IP白名单，支持以下格式：
- 单个IP：`192.168.1.100`
- CIDR网段：`10.0.0.0/8`、`172.16.0.0/12`
- 多条目：`["10.0.0.0/8", "192.168.1.100"]`

### 8.6 HMAC请求签名（可选）

高安全场景下可启用HMAC-SHA256请求签名验证。

客户端需在请求头中携带：
```
X-Signature: t=1718000000,s=9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d
X-Signature-Key-Id: apikey_8a3f2b1c4d5e
```

签名计算方式：
```
signing_string = timestamp + "\n" + method + "\n" + path + "\n" + body_hash
signature = HMAC-SHA256(api_key_secret, signing_string)
```

---

## 9. SDK与客户端示例

### 9.1 Python SDK核心类设计

```python
from typing import Optional, List, Dict, Any, Iterator
import requests
import json


class RAGClient:
    """RAG 3.0 Python SDK 客户端"""

    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        access_token: Optional[str] = None,
        timeout: int = 30
    ):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()

        if api_key:
            self.session.headers["X-API-Key"] = api_key
        elif access_token:
            self.session.headers["Authorization"] = f"Bearer {access_token}"

        self.session.headers["User-Agent"] = "RAGClient-Python/3.0.0"

    # ========== 知识库管理 ==========

    def create_knowledge_base(
        self,
        name: str,
        description: str = "",
        embedding_model: str = "BAAI/bge-m3",
        chunk_strategy: str = "general",
        llm_model: str = "deepseek-v4",
        language: str = "zh"
    ) -> Dict:
        """创建知识库"""
        return self._post("/api/v1/knowledge-bases", {
            "name": name,
            "description": description,
            "embedding_model": embedding_model,
            "chunk_strategy": chunk_strategy,
            "llm_model": llm_model,
            "language": language
        })

    def list_knowledge_bases(
        self,
        page: int = 1,
        page_size: int = 20,
        status: str = None
    ) -> Dict:
        """获取知识库列表"""
        params = {"page": page, "page_size": page_size}
        if status:
            params["status"] = status
        return self._get("/api/v1/knowledge-bases", params)

    def get_knowledge_base(self, kb_id: str) -> Dict:
        """获取知识库详情"""
        return self._get(f"/api/v1/knowledge-bases/{kb_id}")

    # ========== 文档管理 ==========

    def upload_documents(
        self,
        kb_id: str,
        file_paths: List[str],
        parser_type: str = "deepdoc",
        tags: str = ""
    ) -> Dict:
        """上传文档到知识库"""
        files = [("files", (fp.split("/")[-1], open(fp, "rb"))) for fp in file_paths]
        data = {"parser_type": parser_type, "tags": tags}
        try:
            return self._post(
                f"/api/v1/knowledge-bases/{kb_id}/documents",
                data=data,
                files=files
            )
        finally:
            for _, (_, f) in files:
                f.close()

    def get_document_status(self, kb_id: str, doc_id: str) -> Dict:
        """获取文档解析状态"""
        return self._get(
            f"/api/v1/knowledge-bases/{kb_id}/documents/{doc_id}/status"
        )

    # ========== 查询API ==========

    def query(
        self,
        kb_id: str,
        query: str,
        top_k: int = 5,
        retrieval_mode: str = "auto",
        stream: bool = False,
        **kwargs
    ) -> Dict:
        """单次RAG查询"""
        payload = {
            "query": query,
            "top_k": top_k,
            "retrieval_mode": retrieval_mode,
            "stream": stream,
            **kwargs
        }
        return self._post(
            f"/api/v1/knowledge-bases/{kb_id}/query",
            payload
        )

    def query_stream(
        self,
        kb_id: str,
        query: str,
        top_k: int = 5,
        **kwargs
    ) -> Iterator[Dict]:
        """流式RAG查询（SSE生成器）"""
        payload = {
            "query": query,
            "top_k": top_k,
            "stream": True,
            **kwargs
        }
        response = self.session.post(
            f"{self.base_url}/api/v1/knowledge-bases/{kb_id}/query/stream",
            json=payload,
            headers={"Accept": "text/event-stream"},
            stream=True,
            timeout=self.timeout
        )
        response.raise_for_status()

        for line in response.iter_lines():
            if line.startswith(b"data: "):
                data = line[6:].decode("utf-8")
                if data == "[DONE]":
                    break
                yield json.loads(data)

    def create_conversation(
        self,
        kb_ids: List[str],
        model: str = "deepseek-v4"
    ) -> Dict:
        """创建对话"""
        return self._post("/api/v1/conversations", {
            "kb_ids": kb_ids,
            "model": model
        })

    def send_message(
        self,
        conv_id: str,
        message: str,
        stream: bool = False
    ) -> Dict:
        """发送对话消息"""
        return self._post(
            f"/api/v1/conversations/{conv_id}/messages",
            {"message": message, "stream": stream}
        )

    def submit_feedback(
        self,
        conv_id: str,
        msg_id: str,
        feedback_type: str,
        reason: str = None
    ) -> Dict:
        """提交消息反馈"""
        return self._post(
            f"/api/v1/conversations/{conv_id}/messages/{msg_id}/feedback",
            {"feedback_type": feedback_type, "reason": reason}
        )

    # ========== 私有方法 ==========

    def _get(self, path: str, params: Dict = None) -> Dict:
        resp = self.session.get(
            f"{self.base_url}{path}",
            params=params,
            timeout=self.timeout
        )
        return self._handle_response(resp)

    def _post(self, path: str, json_data: Dict = None,
              data: Dict = None, files: Any = None) -> Dict:
        resp = self.session.post(
            f"{self.base_url}{path}",
            json=json_data if not files else None,
            data=data if files else None,
            files=files,
            timeout=self.timeout
        )
        return self._handle_response(resp)

    def _handle_response(self, resp: requests.Response) -> Dict:
        body = resp.json()
        if body.get("code") != 0:
            raise RAGAPIError(
                code=body.get("code"),
                message=body.get("message"),
                detail=body.get("detail"),
                request_id=body.get("request_id")
            )
        return body["data"]


class RAGAPIError(Exception):
    """RAG API异常"""
    def __init__(self, code: int, message: str,
                 detail: str = None, request_id: str = None):
        self.code = code
        self.message = message
        self.detail = detail
        self.request_id = request_id
        super().__init__(f"[{code}] {message}")


# ========== 使用示例 ==========

if __name__ == "__main__":
    client = RAGClient(
        base_url="https://api.rag3.example.com",
        api_key="rag_kb3v1_a1b2c3d4e5f6g7h8..."
    )

    # 单次查询
    result = client.query(
        kb_id="kb_3f7a8b2c1d4e",
        query="供应商延迟交货的违约金如何计算？",
        top_k=5
    )
    print(f"回答: {result['answer']}")
    print(f"置信度: {result['confidence']['score']}")
    for c in result['citations']:
        print(f"  [{c['index']}] {c['doc_name']} p{c['page_number']}")

    # 流式查询
    for event in client.query_stream(
        kb_id="kb_3f7a8b2c1d4e",
        query="合同中的知识产权归属条款"
    ):
        if event.get("event") == "token":
            print(event["data"]["content"], end="", flush=True)
```

### 9.2 curl快速上手指南（5个关键场景）

#### 场景1：上传文档并等待解析完成

```bash
#!/bin/bash
API="https://api.rag3.example.com"
TOKEN="eyJhbGciOiJSUzI1NiIs..."
KB_ID="kb_3f7a8b2c1d4e"

# 上传文档
RESP=$(curl -s -X POST "$API/api/v1/knowledge-bases/$KB_ID/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@contract.pdf" \
  -F "parser_type=deepdoc")
echo "Upload: $RESP"

DOC_ID=$(echo $RESP | jq -r '.data.documents[0].doc_id')

# 轮询解析状态直到完成
while true; do
  STATUS=$(curl -s -X GET "$API/api/v1/knowledge-bases/$KB_ID/documents/$DOC_ID/status" \
    -H "Authorization: Bearer $TOKEN")
  PARSE=$(echo $STATUS | jq -r '.data.parse_status')
  echo "Status: $PARSE"
  if [ "$PARSE" = "parsed" ]; then
    echo "Parsing completed!"
    break
  elif [ "$PARSE" = "failed" ]; then
    echo "Parsing failed!"
    break
  fi
  sleep 3
done
```

#### 场景2：RAG查询获取带引用的答案

```bash
curl -s -X POST "$API/api/v1/knowledge-bases/$KB_ID/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "延迟交货违约金每日百分比是多少？",
    "top_k": 3,
    "citations": true
  }' | jq '.data | {answer: .answer, confidence: .confidence.score, citations: [.citations[] | {idx: .index, doc: .doc_name, page: .page_number}]}'
```

#### 场景3：多轮对话

```bash
# 创建对话
CONV=$(curl -s -X POST "$API/api/v1/conversations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"kb_ids": ["kb_3f7a8b2c1d4e"]}')
CONV_ID=$(echo $CONV | jq -r '.data.conversation_id')

# 第一轮
curl -s -X POST "$API/api/v1/conversations/$CONV_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "合同违约金上限是多少？"}'

# 第二轮（利用上下文）
curl -s -X POST "$API/api/v1/conversations/$CONV_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "如果实际损失超过上限怎么办？"}'
```

#### 场景4：流式查询

```bash
curl -N -X POST "$API/api/v1/knowledge-bases/$KB_ID/query/stream" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"query": "解释知识产权归属条款", "top_k": 5}'
```

#### 场景5：运行评测任务

```bash
# 创建评测
EVAL=$(curl -s -X POST "$API/api/v1/evaluations/runs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "每日回归评测",
    "dataset_id": "ds_8a3f2b1c4d5e",
    "kb_id": "kb_3f7a8b2c1d4e",
    "evaluation_type": "retrieval",
    "metrics": ["recall@10", "mrr"]
  }')
RUN_ID=$(echo $EVAL | jq -r '.data.run_id')

# 等待完成并获取结果
sleep 120
curl -s -X GET "$API/api/v1/evaluations/runs/$RUN_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.results'
```

### 9.3 Webhook事件通知格式

系统支持配置Webhook URL，在关键事件发生时推送通知。

#### 事件类型

| 事件 | 触发时机 | 说明 |
|------|----------|------|
| `document.parsed` | 文档解析完成 | 含解析质量评分 |
| `document.parsed.failed` | 文档解析失败 | 含失败原因 |
| `evaluation.completed` | 评测任务完成 | 含评测概要结果 |
| `backup.completed` | 备份完成 | 含备份信息 |
| `safety.alert` | 安全告警 | 注入检测/投毒检测 |
| `quota.warning` | 配额告警 | 存储/Token接近上限 |

#### 事件格式

```json
{
  "event_id": "evt_8a3f2b1c4d5e",
  "event_type": "document.parsed",
  "timestamp": "2026-06-05T10:51:30Z",
  "data": {
    "doc_id": "doc_8a3f2b1c4d5e",
    "kb_id": "kb_3f7a8b2c1d4e",
    "doc_name": "供应商合同模板V5.pdf",
    "parse_status": "parsed",
    "parse_engine": "deepdoc",
    "parse_quality_score": 96,
    "chunk_count": 85,
    "page_count": 42
  }
}
```

Webhook接收端需返回HTTP 200确认接收，系统会重试失败的推送（指数退避，最多3次）。

---

> **文档结束**
>
> 本文档为RAG 3.0知识库系统的API接口设计文档，涵盖API设计原则、知识库管理、文档管理、查询、权限管理、评测、管理共7大模块59个接口的完整规格说明，以及鉴权安全方案和SDK客户端示例。所有接口遵循RESTful设计规范，前后端开发人员可将本文档作为接口契约进行并行开发。
