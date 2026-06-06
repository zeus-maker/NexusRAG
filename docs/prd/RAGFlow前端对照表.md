# RAGFlow 前端 vs RAG 3.0 PRD 逐项对照表

> **版本**：v1.4 · 2026-06-06  
> **用途**：指导 RAG 3.0 前端开发时复用 RAGFlow 源码（`ragflow_rag30/web`），识别缺口与映射关系。  
> **关联**：`前端界面实现方案.md`（v1.4）§1.3 / §10–§15、`5-企业级RAG知识库3.0实现方案.md`

**图例**：✅ 已设计 · 🟡 部分设计 · ❌ 未设计 · 🔵 RAG 3.0 新增

---

## 1. 顶层导航与应用

| # | RAGFlow 页面 | RAGFlow 路由 | PRD v1.4 | 兼容策略 | 优先级 |
|---|-------------|-------------|----------|---------|--------|
| 1 | 首页工作台 | `/` | ✅ §10.2（含排行榜 US-1.9） | 复用 `pages/home` | P0 |
| 2 | 知识库列表 | `/datasets` | ✅ §3.1 | 路由 `/kb` | P0 |
| 3 | 聊天应用 | `/chats`, `/chat/:id` | ✅ §4 + §4.4 ChatSettings | 三栏+设置面板 | P0 |
| 4 | 搜索应用 | `/searches`, `/search/:id` | ✅ §10.6 | 独立应用 | P1 |
| 5 | Agent 编辑器 | `/agents`, `/agent/:id` | ✅ §10.7 | React Flow 画布 | P2 |
| 6 | Memory 记忆 | `/memories` | 🟡 可选 P3 | 按需 | P3 |
| 7 | 文件管理 | `/files` | 🟡 可并入 KB | P3 |
| 8 | Skills | `/files/skills` | 🟡 P3 | 按需 | P3 |
| 9 | 评测中心 | — | ✅ §5 + §11.5 | RAG 3.0 新增 | P0 |
| 10 | 系统管理 | `/admin`, `/user-setting` | ✅ §6 + §10.8 | 合并 `/system/*` | P0 |

---

## 2. 知识库（Dataset）子页面

| # | RAGFlow 页面 | RAGFlow 路由 | PRD v1.4 | 关键设计 | 优先级 |
|---|-------------|-------------|----------|---------|--------|
| 11 | 文件管理 | `/dataset/files/:id` | ✅ §3.3 | KBDetailLayout + 上传暂停 | P0 |
| 12 | 检索测试 | `/dataset/retrieval/:id` | ✅ §10.5 | 阈值/Rerank/KG/元数据 | **P0** |
| 13 | 日志概览 | `/dataset/logs/:id` | ✅ §10.10.2 | 处理日志 | P1 |
| 14 | 知识库配置 | `/dataset/configuration/:id` | ✅ §10.4 | 15种分块/GraphRAG/RAPTOR | **P0** |
| 15 | 知识图谱 | `/dataset/knowledge-graph/:id` | ✅ §10.10.3 | Force-directed | P1 |
| 16 | 详情概览 | — | ✅ §3.2 | 左侧子导航 + Wiki/PageIndex 卡片 | P0 |
| 17 | 解析预览 | `/chunk/*` | ✅ §3.4 | 三栏+Dataflow | P0 |
| 18 | 分块预览 | — | ✅ §3.5 | 合并/拆分/排除 | P0 |
| 19 | 索引状态 | — | ✅ §3.6 | 五维卡片+暂停恢复+Hub深链 | P0 |
| 20 | 权限 | me/team | ✅ §3.10 | 团队权限+Chunk ACL | P0 |
| 21 | 配置入口 | configuration | ✅ §10.4 | 侧栏「配置」 | P0 |
| 22 | 回收站 | — | ✅ §3.7 | US-1.8 | P1 |
| 23 | 导出任务 | — | ✅ §3.8 | US-1.7 | P1 |
| 24 | 外部数据源 | LinkDataSource | ✅ §10.10.1 + §10.8 | US-1.10 | **P0** |
| 25 | **Wiki Hub** | — | ✅ §11.1 | `/kb/:id/wiki/*` 4 Tab | **P1** |
| 26 | **PageIndex Hub** | — | ✅ §11.2 | `/kb/:id/pageindex/*` | **P1** |

---

## 3. RAG 3.0 架构独有能力

| # | 能力 | PRD v1.4 章节 | 前端路由 | 优先级 |
|---|------|--------------|---------|--------|
| 27 | Wiki 浏览器/编译/统计 | §11.1 | `/kb/:id/wiki/*` | P1 |
| 28 | PageIndex 库级管理 | §11.2 | `/kb/:id/pageindex/*` | P1 |
| 29 | 四分类器 + 子配置 | §11.3.1–11.3.6 | `/system/classifier` | P1 |
| 30 | 路由在线学习 | §11.3.7 | `/evaluation/route-learning` | P2 |
| 31 | 查询五层 Trace | §4.1 + §7.9 | 对话页内嵌 | **P0** |
| 32 | 安全合规 4 子页 | §11.4 | `/system/security/*` | P2 |
| 33 | ACL 模拟器 | §11.4.4 | `/system/security/acl-simulator` | P2 |
| 34 | 成本/回放/Trace | §11.5 | `/evaluation/cost` 等 | P2 |
| 35 | 全局 RAG3 运营 | §14 | 首页 Widget + §6.4.2 | P2 |

---

## 4. PRD 用户故事覆盖度（v1.4）

| User Story | PRD v1.4 | 状态 |
|-----------|----------|------|
| US-1.2 上传暂停/恢复 | §3.3 上传队列 | ✅ |
| US-1.5 索引暂停/恢复 | §3.6 | ✅ |
| US-1.7 导出 | §3.8 | ✅ |
| US-1.8 回收站 | §3.7 | ✅ |
| US-1.9 运营排行榜 | §10.2 | ✅ |
| US-1.12 文档版本 | §3.9 | ✅ |
| US-2.10 高级语法 | §4.6 | ✅ |
| US-2.12 答案对比 | §4.5 | ✅ |
| US-4.8 成本 | §11.5.1 | ✅ |
| US-4.9 满意度 | §5.5 | ✅ |
| US-4.10 评测数据集 | §5.4 | ✅ |
| US-4.12 回放评测 | §11.5.2 | ✅ |
| US-5.3–5.8 系统管理 | §6.5–6.8 | ✅ |

---

## 5. 工程与路由（v1.4）

| 项 | 权威章节 | 说明 |
|----|---------|------|
| 完整路由表 | **§1.3** | 含 KBDetailLayout、Wiki/PageIndex Hub、Share |
| 路由快速索引 | §12.3 | 指向 §1.3 |
| 组件目录 | §1.2 + §7.9–§7.24 | 含 KBSubNav、Hub 壳层 |
| 废弃路由 | `pageindex-tree` | 301 → `/pageindex` |

---

## 6. 仍待实现阶段深化

| 项 | 状态 |
|----|------|
| Agent 节点属性表单明细 | 🟡 §13.5 |
| 15 种 parser_config JSON Schema | 🟡 §13.5 |
| MCP WebSocket 调试 | 🟡 §13.5 |
| 分享 iframe/widget | 🟡 §13.5 |
| HTML 原型覆盖 | 见原 §10 对照（用户选择暂不更新原型） |

---

## 7. 实施建议摘要

1. **P0**：按 §1.3 搭建 `KBDetailLayout` + 知识库配置 + 检索测试 + ChatSettings + Trace  
2. **P1**：Wiki Hub + PageIndex Hub + 分类器 + 知识图谱  
3. **P2**：全局运营 Tab + 安全合规 + Agent 扩展  
4. **复用组件**：`ChunkMethodForm`、`MetadataFilterBuilder`、`ChatSettingsPanel`、`AgentCanvas`、`KnowledgeGraphView`  
5. **新建组件**：`WikiHubPage`、`PageIndexHubPage`、`KBSubNav`、`QueryTraceTimeline`

---

> 维护说明：RAGFlow 基线 `ragflow_rag30/web`，PRD 前端方案 **v1.4**。Hub spec：`docs/superpowers/specs/2026-06-06-pageindex-wiki-hub-design.md`。
