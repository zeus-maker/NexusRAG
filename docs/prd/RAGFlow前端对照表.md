# RAGFlow 前端 vs RAG 3.0 PRD 逐项对照表

> **版本**：v1.0 · 2026-06-06  
> **用途**：指导 RAG 3.0 前端开发时复用 RAGFlow 源码（`ragflow_rag30/web`），识别缺口与映射关系。  
> **关联**：`前端界面实现方案.md` §10–§12、`5-企业级RAG知识库3.0实现方案.md`

**图例**：✅ 已设计 · 🟡 部分设计 · ❌ 未设计 · 🔵 RAG 3.0 新增

---

## 1. 顶层导航与应用

| # | RAGFlow 页面 | RAGFlow 路由 | PRD v1.0 | PRD v1.1 | 兼容策略 | 优先级 |
|---|-------------|-------------|----------|----------|---------|--------|
| 1 | 首页工作台 | `/` | ❌ | ✅ §10.2 | 复用 `pages/home` 结构 | P0 |
| 2 | 知识库列表 | `/datasets` | ✅ §3.1 | ✅ | 路由改为 `/kb` | P0 |
| 3 | 聊天应用 | `/chats`, `/chat/:id` | ✅ §4.1 | ✅ | 直接复用三栏+设置面板 | P0 |
| 4 | 搜索应用 | `/searches`, `/search/:id` | ❌ | ✅ §10.6 | 保留独立应用，不合并 Chat | P1 |
| 5 | Agent 编辑器 | `/agents`, `/agent/:id` | ❌ | ✅ §10.7 | 复用 React Flow 画布 | P2 |
| 6 | Memory 记忆 | `/memories`, `/memory/*` | ❌ | 🟡 可选 | 按产品定位决定是否保留 | P3 |
| 7 | 文件管理 | `/files` | ❌ | 🟡 | 可并入知识库或全局文件 Tab | P3 |
| 8 | Skills 技能 | `/files/skills` | ❌ | 🟡 | 无顶栏入口，按需规划 | P3 |
| 9 | 评测中心 | — | ✅ §5 | ✅ | RAG 3.0 新增模块 | P0 |
| 10 | 系统管理 | `/admin`, `/user-setting` | ✅ §6 | ✅ §10.8 | 合并为 `/system/*` | P0 |

---

## 2. 知识库（Dataset）子页面

| # | RAGFlow 页面 | RAGFlow 路由 | PRD v1.0 | PRD v1.1 | 关键配置项 | 优先级 |
|---|-------------|-------------|----------|----------|-----------|--------|
| 11 | 文件管理 | `/dataset/files/:id` | ✅ §3.3 | ✅ | 上传/批量/元数据/GraphRAG生成 | P0 |
| 12 | 检索测试 | `/dataset/retrieval/:id` | ❌ | ✅ §10.5 | 阈值/权重/Rerank/KG/跨语言/元数据过滤 | **P0** |
| 13 | 日志概览 | `/dataset/logs/:id` | ❌ | ✅ §10.3 | 处理日志/跳转 Dataflow | P1 |
| 14 | 知识库配置 | `/dataset/configuration/:id` | 🟡 创建弹窗 | ✅ §10.4 | 15种分块/GraphRAG/RAPTOR/Pipeline | **P0** |
| 15 | 知识图谱 | `/dataset/knowledge-graph/:id` | ❌ | ✅ §10.3 | Force-directed 图可视化 | P1 |
| 16 | 知识库详情概览 | — | ✅ §3.2 | ✅ | 指标/趋势/高频查询 | P0 |
| 17 | 解析预览 | `/chunk/*`, `/dataflow-result` | ✅ §3.4 | ✅ | 三栏+时间线+重跑 | P0 |
| 18 | 分块预览 | — | ✅ §3.5 | ✅ | 合并/拆分/排除/重新分块 | P0 |
| 19 | 索引状态 | — | ✅ §3.6 | ✅ | 五维索引卡片 | P0 |
| 20 | 权限 Tab | me/team | 🟡 ACL规则 | ✅ §11.6 | 团队权限+Chunk ACL+模拟器 | P0 |
| 21 | 设置 Tab | configuration | ❌ | ✅ §11.6 | 跳转或内嵌配置页 | P0 |
| 22 | 回收站 | — | ❌ | ✅ §11.6 | US-1.8 30天恢复 | P1 |
| 23 | 导出任务 | — | ❌ | 🟡 | US-1.7 异步导出 | P1 |
| 24 | 外部数据源绑定 | LinkDataSource | ❌ | ✅ §10.3 | US-1.10 S3/Confluence/Notion | **P0** |

---

## 3. 知识库配置项对照（Configuration 字段级）

| RAGFlow 配置域 | RAGFlow 组件/字段 | PRD v1.0 | PRD v1.1 | 备注 |
|---------------|------------------|----------|----------|------|
| 基础信息 | name, language, avatar, description | 🟡 | ✅ | GeneralForm |
| 权限 | permission: me/team | ❌ | ✅ | |
| 嵌入模型 | embd_id | 🟡 创建时 | ✅ | 创建后部分不可改 |
| 解析类型 | Built-in / Pipeline | ❌ | ✅ | DataFlowSelect |
| 分块方法 | 15种 parser_id | 🟡 通用分块 | ✅ | naive/qa/paper/laws/book/... |
| Naive 配置 | layout_recognize, chunk_token, delimiter | ❌ | ✅ | DeepDOC/Plain Text |
| GraphRAG | 开关/实体类型/方法/LLM | ❌ 仅进度 | ✅ | 生成任务+日志 |
| RAPTOR | 聚类参数/tree_builder | ❌ | ✅ | |
| 标签管理 | TagItems, TagTabs | ❌ | ✅ §10.4 Tab |
| 元数据 | MetadataFilter schema | ❌ | ✅ | Chat/Search/检索测试共用 |
| 数据源连接 | LinkDataSource | ❌ | ✅ | 自动解析开关 |

---

## 4. 对话（Chat）配置项对照

| RAGFlow ChatSettings | PRD v1.0 | PRD v1.1 | 备注 |
|---------------------|----------|----------|------|
| 关联知识库 dataset_ids | ✅ | ✅ | KnowledgeBaseSelector |
| LLM + 参数(temperature等) | 🟡 | ✅ | Model Settings |
| System prompt | 🟡 | ✅ | Prompt Engine |
| 相似度阈值/向量权重/Top-N | ❌ | ✅ | 与检索测试一致 |
| Rerank 开关+模型 | ❌ | ✅ | |
| 知识图谱 use_kg | ❌ | ✅ | |
| 跨语言 cross_languages | ❌ | ✅ | |
| 元数据过滤 | ❌ | ✅ | |
| 引用/关键词/TTS/TOC | ❌ | 🟡 | RAGFlow 有，PRD 可选 |
| Tavily 联网搜索 | ❌ | 🟡 | |
| 多模型 Debug 对比 | ❌ | 🟡 P3 | |
| 查询增强面板 | ✅ §4.2 | ✅ | RAG 3.0 新增展示 |
| 查询链路 Trace | ❌ | ✅ §11.3.2 | **RAG 3.0 核心** |
| 分享/Widget 嵌入 | ❌ | 🟡 §10.9 | |

---

## 5. 搜索（Search）应用

| RAGFlow SearchSetting | PRD v1.0 | PRD v1.1 |
|----------------------|----------|----------|
| 独立搜索应用 | ❌ 合并Chat | ✅ §10.6 |
| AI 摘要 summary | ❌ | ✅ |
| 相关搜索 related_search | ❌ | ✅ |
| Query mindmap | ❌ | ✅ |
| Web 搜索 | ❌ | ✅ |
| 关联 Chat chat_id | ❌ | ✅ |

---

## 6. Agent / Pipeline

| RAGFlow 能力 | PRD v1.0 | PRD v1.1 | 备注 |
|-------------|----------|----------|------|
| Agent 画布编辑器 | ❌ | ✅ §10.7 | React Flow |
| Pipeline 节点链 | ❌ | ✅ | File→Parser→Tokenizer |
| 工具节点(20+) | ❌ | 🟡 | 按需保留 |
| 版本管理/导出JSON | ❌ | ✅ | |
| Webhook 测试 | ❌ | 🟡 | |
| Dataflow 结果页 | 🟡 §3.4 | ✅ | 时间线+重跑 |
| RAG3 扩展节点 | ❌ | ✅ | 路由决策/Wiki/PageIndex |

---

## 7. 用户设置 / Admin

| RAGFlow 子页 | RAGFlow 路由 | PRD v1.0 | PRD v1.1 | RAG3 路由 |
|-------------|-------------|----------|----------|----------|
| 数据源(30+连接器) | `/user-setting/data-source` | ❌ | ✅ §10.8 | `/system/data-sources` |
| 模型提供商(50+厂商) | `/user-setting/model` | 🟡 流水线 | ✅ §10.8 | `/system/models` |
| MCP Server | `/user-setting/mcp` | ❌ | ✅ §10.8 | `/system/mcp` |
| 团队 | `/user-setting/team` | ❌ | ✅ §10.8 | `/system/team` |
| 个人资料 | `/user-setting/profile` | 🟡 顶栏占位 | ✅ §10.8 | `/system/profile` |
| API & Key | `/user-setting/api` | ❌ | ✅ §10.8 | `/system/api` |
| Admin 服务状态 | `/admin/services` | 🟡 §6.4 | ✅ | `/system/monitor` |
| Admin 用户管理 | `/admin/users` | ✅ §6.1 | ✅ | `/system/users` |
| Admin 角色 | `/admin/roles` | ✅ §6.1 | ✅ | `/system/roles` |
| Sandbox 设置 | `/admin/sandbox-settings` | ❌ | 🟡 | P2 |
| Langfuse 集成 | API页内 | ❌ | ✅ §11.5 | `/system/traces` |

---

## 8. RAG 3.0 架构独有能力（RAGFlow 无）

| # | 能力 | 架构章节 | PRD v1.0 | PRD v1.1 | 前端路由 | 优先级 |
|---|------|---------|----------|----------|---------|--------|
| 25 | LLM Wiki 浏览器 | §19–23 | ❌ | ✅ §11.1 | `/kb/:id/wiki` | **P1** |
| 26 | Wiki 编译队列 | §21 | ❌ | ✅ §11.1.2 | `/kb/:id/wiki/compile` | P1 |
| 27 | Wiki Git 版本/回滚 | §22 | ❌ | ✅ §11.1 | Wiki 页面内 | P1 |
| 28 | PageIndex 树预览 | §14–18 | ❌ | ✅ §11.2 | `/kb/:id/pageindex-tree` | **P1** |
| 29 | 树搜索调试 | §14 | ❌ | ✅ §11.2 | 同上页右侧 | P1 |
| 30 | 四分类器配置 | §24–28 | 🟡 展示 | ✅ §11.3 | `/system/classifier` | **P1** |
| 31 | 路由决策矩阵编辑器 | §3.3 | 🟡 文本规则 | ✅ §11.3 | 同上 | P1 |
| 32 | 路由在线学习/评估 | §29 | ❌ | 🟡 | 评测中心扩展 | P2 |
| 33 | 查询五层 Trace | §3.1 L1–L5 | ❌ | ✅ §11.3.2 | 对话页内嵌 | **P0** |
| 34 | 投毒检测复核队列 | §38 | ❌ | ✅ §11.4 | `/system/security/poison` | P2 |
| 35 | PII 脱敏规则 | §39 | ❌ | ✅ §11.4 | `/system/security/pii` | P2 |
| 36 | 合规报告导出 | §39 | ❌ | ✅ §11.4 | `/system/security/compliance` | P2 |
| 37 | ACL 效果模拟器 | §37 | ❌ | ✅ §11.4 | `/system/security/acl-simulator` | P2 |
| 38 | 成本中心 | §43/§44 | 🟡 监控页 | ✅ §11.5 | `/evaluation/cost` | P2 |
| 39 | 回放评测 | US-4.12 | ❌ | ✅ §11.5 | `/evaluation/replay` | P2 |
| 40 | A/B 路由策略测试 | §29 | ✅ §5.3 | ✅ | `/evaluation/ab-test` | P1 |

---

## 9. PRD 用户故事覆盖度

| 用户故事 | PRD v1.0 前端 | PRD v1.1 前端 | 缺口 |
|---------|--------------|--------------|------|
| US-1.4 分块预览 | ✅ §3.5 | ✅ | 重叠高亮交互待细化 |
| US-1.5 索引状态 | ✅ §3.6 | ✅ | 暂停/恢复控制 |
| US-1.6 知识库搜索 | 🟡 §3.3 筛选 | ✅ | 10万文档性能方案 |
| US-1.7 知识库导出 | ❌ | 🟡 §11.6 | 需独立导出任务页 |
| US-1.8 删除/回收站 | ❌ | ✅ §11.6 | |
| US-1.9 运营仪表盘 | 🟡 §3.2 部分 | ✅ §10.2 首页 | 排行榜等待补 |
| US-1.10 外部数据源 | ❌ | ✅ §10.3/§10.8 | |
| US-1.11 媒体/OCR | 🟡 §3.4 | ✅ | 图片预览层 |
| US-1.12 文档版本 | ❌ | 🟡 | 需文档详情版本列表 |
| US-2.x 对话系列 | ✅ §4 | ✅ +Trace | |
| US-4.8 成本监控 | 🟡 §6.4 | ✅ §11.5 | |
| US-4.12 回放评测 | ❌ | ✅ §11.5 | |

---

## 10. HTML 原型覆盖度（pc-prototype.html）

| 模块 | 原型状态 | 对应 PRD 章节 |
|------|---------|--------------|
| 登录 | ✅ 简版 | §10.9 |
| 首页工作台 | ❌ 待补 | §10.2 |
| 知识库列表/详情/文档/解析/分块/索引 | ✅ 骨架 | §3 |
| 知识库配置（完整） | ❌ 待补 | §10.4 |
| 检索测试 | ❌ 待补 | §10.5 |
| 知识图谱可视化 | ❌ 待补 | §10.3 |
| Wiki 管理 | ❌ 待补 | §11.1 |
| PageIndex 树 | ❌ 待补 | §11.2 |
| 对话 + 查询增强 | ✅ | §4 |
| 查询 Trace | ❌ 待补 | §11.3.2 |
| 搜索应用 | ❌ 待补 | §10.6 |
| Agent 编辑器 | ❌ 待补 | §10.7 |
| 评测三页 | ✅ | §5 |
| 成本/回放评测 | ❌ 待补 | §11.5 |
| 系统管理五页 | ✅ 骨架 | §6 |
| 数据源/模型/MCP | ❌ 待补 | §10.8 |
| 分类器路由配置 | ❌ 待补 | §11.3 |
| 安全合规中心 | ❌ 待补 | §11.4 |

---

## 11. 实施建议摘要

1. **先打通 P0 兼容层**：知识库配置 + 检索测试 + 模型/数据源 + 查询 Trace  
2. **再建 P1 增强层**：Wiki + PageIndex + 分类器路由 + 知识图谱  
3. **RAGFlow 组件复用清单**：`ChunkMethodForm`、`MetadataFilter`、`ChatSettings`、`Agent canvas`、`Graph visualization`、`DataSource forms`  
4. **新建组件清单**：`WikiBrowser`、`PageIndexTreeViewer`、`ClassifierMatrixEditor`、`QueryTraceTimeline`、`ACLsimulator`、`CostCenterDashboard`

---

> 维护说明：RAGFlow 版本基线 `ragflow_rag30/web`，PRD 前端方案 v1.1。后续 RAGFlow 升级时同步更新本表。
