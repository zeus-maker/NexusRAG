# RAG 3.0 PRD文档套装 — 实施计划

> **For Claude:** 本计划是文档撰写任务，每个Task产出独立的Markdown文档。

**Goal:** 基于文档#5，产出完整PRD套装：BRD + PRD + 技术架构设计 + 数据库设计 + API接口设计，共5份文档。

**Tech Stack:** Markdown + Mermaid图表 + OpenAPI 3.0 + SQL DDL (MySQL 8.0+)

---

### Task 1: BRD 业务需求文档

**Files:**
- Create: `docs/prd/BRD-业务需求文档.md`

**内容结构:**
1. 文档概述（版本/审批/阅读对象）
2. 市场背景与行业趋势（RAG 1.0→2.0→3.0演进、2025-2026转折点分析）
3. 业务痛点（"六个不等于"深度解读，附行业案例）
4. 目标用户画像（CTO/架构师/AI平台负责人/知识管理PM/算法工程师）
5. 商业价值与ROI分析（成本节约、效率提升、风险规避）
6. 竞品分析（RAGFlow/MinerU/GraphRAG/Glean/Cohere对比矩阵）
7. 产品边界（做什么/不做什么）
8. 实施路线图（P0/P1/P2三期）
9. 风险与应对策略

---

### Task 2: PRD 产品需求文档

**Files:**
- Create: `docs/prd/PRD-产品需求文档.md`

**内容结构:**
1. 文档概述
2. 用户画像与使用场景
3. Epic和用户故事（5个Epic：知识管理/智能查询/权限管理/评测监控/系统管理）
4. 功能规格 — 5层架构逐层规格：
   - L1入口路由层：4分类器（查询复杂度/文档类型/检索策略/生成策略）
   - L2文档处理层：格式解析/OCR/分块/嵌入/索引
   - L3多通道检索层：向量/PageIndex/GraphRAG/全文/Wiki查询
   - L4融合与重排序层：RRF/Cross-Encoder/多通道融合
   - L5生成与审计层：LLM生成/引用溯源/审计日志
5. 非功能需求（四高四低：高准确/高可解/高可用/高合规/低成本/低幻觉/低运维/低耦合）
6. 用户体验设计（Web UI/API/引用溯源交互）
7. 数据字典总览
8. 验收标准

---

### Task 3: 技术架构设计文档

**Files:**
- Create: `docs/prd/技术架构设计.md`

**内容结构:**
1. 总体架构图（Mermaid，含用户层/网关层/核心服务层/数据层/外部依赖）
2. 技术选型论证（LLM/嵌入模型/向量库/文档解析器/编排引擎）
3. 5大流水线详细设计：
   - 流水线#1：向量检索（RAGFlow风格）
   - 流水线#2：PageIndex推理式检索
   - 流水线#3：GraphRAG知识图谱检索
   - 流水线#4：LLM Wiki知识编译
   - 流水线#5：工具调用（MCP/Agent）
4. 4分类器路由矩阵设计
5. 融合层设计（RRF/Cross-Encoder/Passthrough）
6. 安全合规架构（ACL/提示注入防御/文档投毒检测/PII脱敏）
7. 可观测性架构（日志/指标/追踪/评测）
8. 部署拓扑（Docker Compose/K8s高可用）

---

### Task 4: 数据库设计文档

**Files:**
- Create: `docs/prd/数据库设计.md`

**内容结构:**
1. 数据存储总览（MySQL+ES+MinIO+Milvus/Infinity组合）
2. ER图（Mermaid erDiagram）
3. MySQL表结构DDL：
   - 用户与权限表（users/roles/permissions/tenants）
   - 知识库表（knowledge_bases/kb_documents）
   - 文档表（documents/document_chunks）
   - 对话表（conversations/messages）
   - 配置表（pipelines/routing_rules/prompt_templates）
   - 审计表（audit_logs/query_logs/feedback）
   - 评测表（evaluation_runs/evaluation_scores）
4. Elasticsearch索引Mapping（全文检索/日志）
5. 向量库Collection设计（Milvus Schema）
6. MinIO对象存储设计
7. 数据迁移与备份策略

---

### Task 5: API接口设计文档

**Files:**
- Create: `docs/prd/API接口设计.md`

**内容结构:**
1. API设计原则（RESTful/版本管理/鉴权/限流/错误码）
2. OpenAPI 3.0规范总览
3. 知识库管理API（创建/列表/更新/删除/统计）
4. 文档管理API（上传/解析/分块预览/索引状态/删除）
5. 查询API（单次RAG查询/流式查询/多轮对话）
6. 权限管理API（用户/角色/ACL/租户隔离）
7. 评测API（创建评测任务/获取结果/对比分析）
8. 管理API（配置管理/流水线编排/模型切换/健康检查）
9. API鉴权与安全（API Key/OAuth2/JWT/速率限制）
10. SDK与客户端示例（Python/cURL）

---

**执行顺序**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5
