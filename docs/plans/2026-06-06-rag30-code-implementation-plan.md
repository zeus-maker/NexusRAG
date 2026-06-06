# RAG 3.0 第二轮：代码实现 + 前端ASCII设计 + 文档完善

**日期**: 2026-06-06
**目标**: 基于 RAGFlow 0.25.4 源码复制扩展，实现 RAG 3.0 全栈代码 + 前端ASCII页面设计

## 产出物

### A. 代码实现 (ragflow_rag30/)
- 复制 RAGFlow 核心模块（api/rag/deepdoc/agent/graphrag/mcp/common/conf）
- 新增 RAG 3.0 专属模块：
  - `router/` — 4分类器入口路由层
  - `pipelines/` — PageIndex + LLM Wiki + 工具调用流水线
  - `fusion/` — RRF融合 + Cross-Encoder重排序
  - `security/` — 块级ACL + 提示注入防御 + PII脱敏
  - `eval/` — RAGAS/DeepEval评测集成
  - `observability/` — Prometheus指标 + OpenTelemetry追踪
- 修改 RAGFlow 原有模块以支持 RAG 3.0 路由机制

### B. 前端ASCII图设计 (docs/prd/前端界面设计.md)
- 知识管理模块页面布局
- 对话查询模块页面布局
- 管理后台页面布局
- 评测监控页面布局
- 流水线编排可视化
- 引用溯源交互

### C. PRD文档补充 (更新已有5份文档)
- 每个模块标注 RAGFlow 源码对应文件路径
- 新增前端详细设计章节

## 执行计划

1. 探索 RAGFlow 源码结构（快速）
2. 创建 ragflow_rag30/ 目录骨架
3. 复制核心模块 + 配置
4. 实现 router/ 入口路由层
5. 实现 pipelines/ 3条新流水线
6. 实现 fusion/ 融合层
7. 实现 security/ 安全层
8. 实现 eval/ 评测层
9. 实现 observability/ 可观测性层
10. 前端ASCII页面设计
11. 更新PRD文档补充源码引用

## 技术栈

- Backend: Python 3.11+, Flask + FastAPI 混合, SQLAlchemy + MySQL 8.0, Elasticsearch 8.x, Milvus 2.4
- Frontend: React 18 + TypeScript + Ant Design 5 (仅ASCII设计)
- 编排: LangGraph
- 容器化: Docker Compose + Kubernetes
