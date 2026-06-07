# Devlog — 2026-06-06

## 1. 知识库设置页补全与 KB 子导航（补记 commit f446484）

### 背景与目标

知识库详情页点击「设置」Tab 仅切换本地 state，未路由到配置页，用户仍看到概览内容；列表卡片「编辑设置」为空操作。目标是按 PRD §10.3.1 / §10.4 打通导航，并提供带左侧子导航的完整配置体验。

**用户可见变化**：从详情/列表可进入「配置」页；配置页含 5 个 Tab（基础信息、解析分块、全局索引、数据源、标签元数据）及 11 项 KB 侧栏菜单；GraphRAG 入口链到 `graphrag-hub` 而非错误的 PageIndex 树页。

### 改动摘要

- `KBDetailPage`：「设置」Tab 与「编辑设置」菜单 `onNavigate('kb-settings', { selectedKBId })`；概览区块用 `tab === 'overview'` 条件渲染，避免 Tab 状态与内容不一致。
- 新增 `KBSubNav`（11 项，权限/日志标 Soon）与 `KBDetailLayout`（子导航 + 面包屑 + 内容区）。
- `KBSettingsPage`：接入 `KBDetailLayout`；`store` 增加 `kbSettingsTab`，侧栏「数据源」可直达对应 Tab；全局索引开关可交互；标签 Tab 增加 Schema 表格与标签增删；GraphRAG 模式选择与 Hub 深链。
- `App.tsx` 向 `KBSettingsPage` 传入 `initialTab`（来自 `state.kbSettingsTab`，默认 `parsing`）。

### 验证与风险

- 验证：在 `rag3-bolt-v1.5/` 执行 `npm run build` 通过；手动路径：知识库列表 → 详情 →「设置」→ 应见左侧 KB 菜单与配置 Tab；列表 ⋮ →「编辑设置」同路径；配置页「进入 GraphRAG Hub」跳转 `graphrag-hub`。
- 风险：权限/日志侧栏项暂未实现页面，点击无响应（标 Soon）；`kbSettingsTab` 导航后未自动清空，重复进入可能沿用上次 Tab（原型可接受）。

### 反思与沉淀

- 采用页面 state 路由而非 React Router 嵌套，子导航通过 `activeKey` 字符串高亮，与 PRD 路径表语义对齐但 URL 不可深链；后续若上 Router 需统一 `KBDetailLayout` 挂载点。
- 数据源在 PRD 为独立路由，原型合并进 `kb-settings` + `kbSettingsTab`，避免新增占位页。

### 涉及文件

- `rag3-bolt-v1.5/src/pages/KnowledgeBase.tsx` — 设置导航与概览条件渲染
- `rag3-bolt-v1.5/src/pages/KBExtra.tsx` — 配置页内容与布局
- `rag3-bolt-v1.5/src/components/KBSubNav.tsx` — KB 详情侧栏
- `rag3-bolt-v1.5/src/components/KBDetailLayout.tsx` — KB 详情框架
- `rag3-bolt-v1.5/src/store.ts` — `kbSettingsTab` 状态
- `rag3-bolt-v1.5/src/App.tsx` — 配置页 `initialTab` 传参

---

## 2. 工作台布局优化与运营功能补充

### 背景与目标

首页工作台模块较少、布局偏平铺，未覆盖 PRD §10.2 的运营概览、RAG 3.0 增强索引 Widget（§14.2）与运营排行榜（US-1.9）。目标是对齐 PRD 信息架构，提升管理员/日常用户的一屏可读性与可点击深链。

**用户可见变化**：登录后工作台为 Hero + 8:4 双栏；新增运营指标趋势、RAG3 运营四指标（可点进 Hub）、排行榜三 Tab、进行中任务、质量运营卡片、可点击动态流等；快捷入口扩展为 6 项（含上传文档、检索测试）。

### 改动摘要

- 重构 `HomePage`：最大宽度 1400px、浅灰底、Hero 含系统/索引状态徽章；运营四指标卡片带 trend 文案。
- 左栏：最近知识库卡片增强（状态、文档/Chunk/质量）；6 格快捷入口；RAG3 Widget（Wiki 编译中/待审核/PageIndex 失败/实体待复核）点击 `wiki-hub` / `pageindex-hub` / `graphrag-hub`；排行榜 Tab（知识库查询 / 被引用文档 / 查询失败）；30 天查询迷你柱图 + 系统健康进度条。
- 右栏：进行中索引任务进度、最近对话、评测+A/B 摘要（读 `mockEvalRuns` / `mockABTests`）、可导航最近动态、团队协作占位。
- 全面补充 `dark:` 类以配合全局主题切换。

### 验证与风险

- 验证：`cd rag3-bolt-v1.5 && npm run build` 通过；页面路径：登录 → 首页；点击 RAG3 Widget 数字、排行榜知识库行、动态条目、快捷入口应跳转对应 `page`。
- 风险：排行榜与 RAG3 指标为静态 mock，非实时 API；与 `f446484` 中旧版 Home 已在该 commit 改过，本条为后续增量重写，以当前 `Home.tsx` 为准。

### 反思与沉淀

- PRD §10.2 将 Hub 入口放在工作台底部，现并入 RAG3 Widget 快捷条，减少纵向滚动；若产品坚持严格 ASCII 顺序可再调区块顺序。
- 运营数据与 `mockData` 未抽离到独立 module，后续接 API 时宜集中 `homeDashboard.ts` 避免组件膨胀。

### 涉及文件

- `rag3-bolt-v1.5/src/pages/Home.tsx` — 工作台全貌

---

## 3. 建立 Devlog 规则与技能

### 背景与目标

仓库此前无统一变更记录规范，已提交功能（如知识库设置）缺少可追溯的技术叙述。目标是固化「改代码 → 写 Devlog → 同 commit 提交」流程，供 Agent 与人工一致遵守。

**用户可见变化**：无运行时变化；协作者与 Agent 在 `.cursor/rules/devlog.mdc` 与 `.cursor/skills/devlog/SKILL.md` 可见硬性流程与质量门槛；`docs/devlog/` 起累积日记。

### 改动摘要

- 新增 Cursor 规则 `devlog.mdc`（`alwaysApply: true`）：收尾必须写 Devlog 并 commit，禁止空话与仅文件列表。
- 新增技能 `devlog/SKILL.md`：文件命名、编号递增、正文五段结构、commit 粒度要求、模板。
- 本文件为首日记录，含对 f446484 的补记条目。

### 验证与风险

- 验证：确认 `.cursor/rules/devlog.mdc`、`.cursor/skills/devlog/SKILL.md`、`docs/devlog/2026-06-06-rag3-frontend.md` 存在；后续任务 Agent 应自动加载 alwaysApply 规则。
- 风险：规则与 user_rules 中「仅用户要求才 commit」并存时，以**本仓库 devlog 规则**在「任务收尾且已改代码」场景优先触发 commit；用户显式禁止时除外。

### 反思与沉淀

- 补记已提交 commit 可避免 Devlog 时间线断层，但无法改写历史 commit message；重要发布仍建议在 CHANGELOG 聚合。
- 技能放仓库内 `.cursor/skills/` 便于版本化，与全局 skills 目录互补。

### 涉及文件

- `.cursor/rules/devlog.mdc` — 始终应用的 Devlog 规则
- `.cursor/skills/devlog/SKILL.md` — Agent 执行技能与模板
- `docs/devlog/2026-06-06-rag3-frontend.md` — 本日 Devlog

---

## 4. 知识库管理列表页功能增强与回收站

### 背景与目标

原知识库列表页仅有基础卡片网格与简单筛选，缺少 PRD §3.1 要求的排序、视图切换、分页与回收站入口；卡片菜单项少且删除无确认。目标是对齐 RAGFlow Dataset 列表交互，并落地 §3.7 回收站原型页。

**用户可见变化**：列表页顶栏增加「回收站」；工具栏支持排序（更新/名称/文档/Chunk）、升降序、网格/表格视图切换与分页；卡片展示分块策略、嵌入模型、索引进度条与文档/检索/索引快捷入口；⋮ 菜单扩展检索测试、导出、归档等；删除走二次确认并提示移入回收站；创建对话框增加 Reranker 与可见性，创建后跳转详情；新增回收站页支持筛选、批量恢复/清空。

### 改动摘要

- `KBListPage`：客户端 `useMemo` 过滤 + `sortKBs`；`PAGE_SIZE=8` 分页；`viewMode` grid/table；表格列含状态、文档、Chunk、嵌入模型、更新时间。
- 卡片 `KBCard` 子组件：索引中状态显示进度条；底部三快捷按钮直达 `kb-documents` / `kb-retrieval-test` / `kb-index-status`。
- 删除 `Modal` 文案说明 30 天回收站策略；Toast 反馈重建/归档/删除等原型操作。
- 新增 `KBRecycleBinPage` + 路由 `kb-recycle-bin`（`store` / `App` / `Layout` 面包屑）；mock 三条回收记录，支持类型筛选、多选、恢复与永久删除。
- 创建表单补全 Reranker、可见性单选；`handleCreate` 关闭弹窗并 `onNavigate('kb-detail')`。

### 验证与风险

- 验证：`cd rag3-bolt-v1.5 && npm run build` 通过；路径：侧栏「知识库管理」→ 切换表格视图、排序、分页；点击「回收站」→ 恢复/筛选；卡片快捷「检索」→ `kb-retrieval-test`；删除确认 → Toast。
- 风险：列表/回收站数据均为 mock，未接 API；创建知识库固定跳转 `kb-001` 演示；工作区存在 v1.2/v1.3 目录迁移删除未纳入本次 commit。

### 反思与沉淀

- 表格视图与网格共用 `openMenu` state，在表格行打开菜单时网格卡片菜单也会联动关闭/打开，原型可接受；若完善需按 `kb_id` 独立或 Portal 菜单。
- 回收站与列表删除未共享 state，删除 Toast 后回收站列表不会自动增加条目，接 API 时需统一 `recycle-bin` invalidate。

### 涉及文件

- `rag3-bolt-v1.5/src/pages/KnowledgeBase.tsx` — 列表增强 + `KBRecycleBinPage`
- `rag3-bolt-v1.5/src/store.ts` — `kb-recycle-bin` 路由
- `rag3-bolt-v1.5/src/App.tsx` — 回收站页面注册
- `rag3-bolt-v1.5/src/components/Layout.tsx` — KB 页分组与面包屑

---

## 5. 创建知识库向导与回收站页面深化

### 背景与目标

创建对话框仍为单页静态表单，无分步校验与模板；回收站仅 3 条 mock、缺时间筛选与永久删除确认，列表删除也未写入回收站。目标是对齐 PRD §3.1 创建流程（校验→提交→跳转详情）与 §3.7 回收站完整交互（筛选、批量、二次确认）。

**用户可见变化**：创建改为三步向导（基础信息→解析与模型→确认），含场景模板、图标选择、描述字数、PageIndex/GraphRAG 开关与创建 loading；回收站增至 8 条样本、统计卡片、删除时间/排序筛选、即将到期高亮、批量操作底栏；列表删除真实追加回收项且回收站按钮显示数量角标。

### 改动摘要

- 新增 `KBCreateDialog`：三步进度条；模板一键填充（法务/财务/研发/通用）；名称 2–50 字校验、描述 200 字计数；第三步配置摘要后提交（模拟 900ms）。
- 新增 `data/kbRecycleBin.ts`：扩展 mock 数据 + 模块级 `recycleBinState`（`addToRecycleBin` / `getRecycleBinCount` / `setRecycleBinItems`）。
- 新增 `pages/KBRecycleBin.tsx`：统计四格、时间筛选（全部/30天/≤7天到期）、排序；行内展示删除人、文件大小/文档数；原知识库可点击跳转；永久删除批量需输入「永久删除」确认。
- `KBListPage`：接入 `KBCreateDialog`；`moveToRecycleBin` 写入共享 state；回收站按钮角标。

### 验证与风险

- 验证：`npm run build` 通过；列表 →「创建知识库」走三步 → 创建中 loading → 跳转详情；删除知识库 → 回收站角标 +1 → 回收站筛选/恢复/永久删除确认。
- 风险：回收站 state 为内存模块变量，刷新页面重置；创建仍跳转固定 `kb-001`，未生成新 mock KB 卡片。

### 反思与沉淀

- 将回收站从 `KnowledgeBase.tsx` 拆出避免单文件超千行；共享 state 是原型期最小联动方案，接 API 后应改为 React Query + `invalidateQueries(['recycle-bin'])`。
- 创建向导第三步才提交，符合 PRD mermaid「校验通过再 POST」的前端预演，后续可对接真实 API 错误回显到 step 0。

### 涉及文件

- `rag3-bolt-v1.5/src/components/KBCreateDialog.tsx` — 三步创建向导
- `rag3-bolt-v1.5/src/data/kbRecycleBin.ts` — 回收站数据与共享 state
- `rag3-bolt-v1.5/src/pages/KBRecycleBin.tsx` — 回收站完整页
- `rag3-bolt-v1.5/src/pages/KnowledgeBase.tsx` — 列表接入创建/删除联动
- `rag3-bolt-v1.5/src/App.tsx` — 回收站 import 路径调整

---

## 6. 智能对话功能增强（§4.1–§4.4）

### 背景与目标

原 Chat 页具备基础流式与引用展示，但缺 PRD 要求的对话设置侧栏、Query Trace、历史管理（搜索/置顶/删除）、答案对比与纠错反馈；选择历史对话不加载消息。目标补齐 ChatGPT 风格三栏体验与 RAG 3.0 可观测性。

**用户可见变化**：左侧历史可搜索、置顶、删除并加载多轮 mock 对话；顶栏可切换知识库、答案对比、⚙ 设置；设置面板含基础/检索/高级三块；助手消息可展开 Query Trace、详细引用卡片；支持停止生成、重新生成、复制、差评纠错弹窗；空态显示开场白与带标签的推荐问题。

### 改动摘要

- 新增 `ChatSettingsPanel`：`ChatSettings` 类型覆盖 kbIds、prompt 模板、阈值、通道开关、LLM 参数、显示选项。
- 新增 `data/chatMock.ts`：`CONV_MESSAGES` 多轮历史、`QUERY_TRACE_STEPS`、`PROMPT_TEMPLATES`。
- 重写 `Chat.tsx`：对话分组（置顶/今天/昨天/更早）；`loadConversation` 同步设置与消息；流式可 `stopStream`；`showCompare` 双策略并排；`QueryTraceTimeline` 可折叠；反馈纠错 Modal。
- 设置与查询增强面板互斥；`dark:` 适配；附件按钮占位。

### 验证与风险

- 验证：`npm run build` 通过；路径：侧栏「智能对话」→ 点击「合同违约条款查询」应见 4 条历史消息；⚙ 调整阈值保存 Toast；发送问题见 Trace 展开；答案对比开关显示 A/B 列；停止按钮中断流式。
- 风险：`onNavigate('chat', { selectedConvId })` 与 store 未持久化 messages，刷新丢失；`findLastIndex` 依赖现代运行时；答案对比 B 列为静态 mock 文案。

### 反思与沉淀

- 设置面板与查询增强分轨符合 PRD（§4.4 vs 查询增强），避免单面板过载；后续可将 `ChatSettings` 提升到 store 并按 `conv_id` 持久化。
- 历史对话消息放 `chatMock.ts` 便于接 API 时替换为 `loadHistory(convId)`。

### 涉及文件

- `rag3-bolt-v1.5/src/pages/Chat.tsx` — 对话主界面
- `rag3-bolt-v1.5/src/components/ChatSettingsPanel.tsx` — 对话设置侧栏
- `rag3-bolt-v1.5/src/data/chatMock.ts` — 对话 mock 与 Trace 数据

---

## 7. 搜索应用功能增强（§10.6）

### 背景与目标

原搜索页仅有简单列表与单栏结果展示，缺 PRD §10.6 要求的搜索历史侧栏、四 Tab 结果面板（搜索结果 / AI 摘要 / 相关搜索 / 思维导图）、设置侧栏与列表筛选排序。目标对齐 RAGFlow `/searches` 体验。

**用户可见变化**：列表可搜索/排序，卡片含 [打开][设置]；主界面左侧历史（今天/昨天/更早）可复用与删除；顶栏 ⚙ 设置侧栏含阈值、Rerank、图谱、元数据过滤、跨语言；结果带星级评分、关键词高亮、复制与查看原文；四 Tab 分轨展示摘要/相关搜索/Mindmap。

### 改动摘要

- 新增 `SearchSettingsPanel`：关联 KB、检索参数、功能开关、MetadataFilter 构建器、跨语言。
- 新增 `data/searchMock.ts`：应用列表、搜索历史、结果、摘要、Mindmap 节点。
- 新建 `pages/Search.tsx` 并从 `SearchAgent.tsx` 拆出；`App.tsx` 改 import。
- 列表支持创建应用（校验名称）；设置与 Top-K/阈值联动过滤 mock 结果。

### 验证与风险

- 验证：`npm run build` 通过；侧栏「搜索应用」→ 打开「合同条款快速检索」→ 搜索「违约金」→ 四 Tab 切换；⚙ 关闭 AI 摘要后 Tab 隐藏；历史点击复用 query。
- 风险：历史/设置为内存 state，刷新重置；语音按钮占位；查看原文跳转固定 kbId。

### 反思与沉淀

- 与 Chat 共用「列表 + 三栏 + 设置侧栏」模式，降低认知成本；mock 数据独立文件便于对接 `POST /search-apps/{id}/query`。
- Search 与 Agent 拆文件避免 `SearchAgent.tsx` 超 500 行。

### 涉及文件

- `rag3-bolt-v1.5/src/pages/Search.tsx` — 搜索应用主界面
- `rag3-bolt-v1.5/src/components/SearchSettingsPanel.tsx` — 搜索设置侧栏
- `rag3-bolt-v1.5/src/data/searchMock.ts` — 搜索 mock 数据
- `rag3-bolt-v1.5/src/pages/SearchAgent.tsx` — 仅保留 Agent 页
- `rag3-bolt-v1.5/src/App.tsx` — 路由 import 调整

---

## 8. Agent 编排功能增强（§10.7）

### 背景与目标

原 Agent 页为卡片列表 + 简易画布，缺 PRD 要求的表格式列表、模板库、版本历史、运行日志、Dataflow 结果页及 RAG 3.0 扩展节点属性表单。目标对齐 `/agent/:id` 画布编辑器体验。

**用户可见变化**：列表改为表格（类型/最近运行/状态/[编辑][运行]）；顶栏含保存/运行/版本历史/发布；节点库分「基础」与「RAG 3.0 扩展」；运行时节点点亮 + 底部日志滚动；完成后弹出 DataflowTimeline 与节点详情；右侧按节点 type 动态属性面板。

### 改动摘要

- 新增 `agentMock.ts`：Agent 列表、画布节点/边、版本、运行日志、Dataflow 步骤。
- 新增 `AgentNodePropertyPanel`：Begin/Categorize/Retrieval/RouteDecision/WikiRead/PageIndexSearch/Parser/Tool/Generate/Answer 表单。
- 新建 `pages/Agent.tsx` 替换 `SearchAgent.tsx`；运行状态机 idle/saving/running/success；版本历史抽屉；Dataflow 结果 Modal。
- 模板库 Modal、新建 Agent（Pipeline/Agent 类型）、列表搜索排序。

### 验证与风险

- 验证：`npm run build` 通过；侧栏「Agent 编排」→ 表格 [编辑] → 选 Retrieval 节点改 Top-K → [运行] 见节点高亮与日志 → Dataflow 弹窗查看 Retrieval Chunk。
- 风险：画布拖拽添加节点为占位；无 React Flow 真实连线编辑；运行结果为 mock 时序。

### 反思与沉淀

- Dataflow 结果内嵌 Modal 而非独立路由，原型期足够；接 API 后可拆 `DataflowResultPage` 并 `navigate('dataflow-result', { runId })`。
- 节点属性面板按 `node.type` switch 与 PRD §7.15 字段表一致，后续可抽共享 `NodePropertyPanel` 组件。

### 涉及文件

- `rag3-bolt-v1.5/src/pages/Agent.tsx` — Agent 列表 + 画布编辑器
- `rag3-bolt-v1.5/src/components/AgentNodePropertyPanel.tsx` — 节点属性面板
- `rag3-bolt-v1.5/src/data/agentMock.ts` — Agent mock 数据
- `rag3-bolt-v1.5/src/App.tsx` — import 路径调整
- 删除 `rag3-bolt-v1.5/src/pages/SearchAgent.tsx`

---

## 9. 评测中心功能增强（§5.1–§5.5）

### 背景与目标

评测中心已有基础仪表盘与任务列表，但缺 PRD §5.4 评测数据集、§5.5 用户满意度子页，各页无统一子导航，任务缺结果详情弹窗、A/B 测试变量选择与停止操作。目标补齐评测域完整 Tab 导航与 US-4.9/4.10。

**用户可见变化**：全评测页顶栏 `EvalSubNav`（7 Tab）；仪表盘加时间/知识库筛选；任务页 [详情] 弹窗含 Top10 失败案例；A/B 测试可选对比变量、调流量、停止/全量切换；新增评测数据集管理（列表+样本编辑）与用户满意度（好评率/NPS/差评分布/低满意对话）。

### 改动摘要

- 新增 `EvalSubNav` 横向 Tab 导航组件。
- 新增 `data/evalMock.ts`：数据集、样本、失败案例、满意度、A/B 变量组。
- 新增 `EvalDataset.tsx`、`EvalSatisfaction.tsx`；`store`/`App`/`Layout` 注册路由。
- 增强 `Evaluation.tsx`：仪表盘筛选、任务详情 Modal、A/B 状态管理；`EvalExtra` 成本/回放接入 SubNav。

### 验证与风险

- 验证：`npm run build` 通过；评测中心 → 切换 7 Tab；任务 [详情] → 见失败案例；数据集删样本角标减；满意度「查看」跳转 chat。
- 风险：筛选为前端 mock 过滤，未接 API；数据集/满意度刷新重置。

### 反思与沉淀

- EvalSubNav 比侧栏展开子菜单更轻量，适合评测 7 个子页高频切换；与 Chat/Search 的「列表+详情」模式形成互补。
- `evalMock.ts` 集中失败案例供仪表盘/任务详情复用，接 API 时替换 `evalService`。

### 涉及文件

- `rag3-bolt-v1.5/src/components/EvalSubNav.tsx`
- `rag3-bolt-v1.5/src/data/evalMock.ts`
- `rag3-bolt-v1.5/src/pages/EvalDataset.tsx`
- `rag3-bolt-v1.5/src/pages/EvalSatisfaction.tsx`
- `rag3-bolt-v1.5/src/pages/Evaluation.tsx`
- `rag3-bolt-v1.5/src/pages/EvalExtra.tsx`
- `rag3-bolt-v1.5/src/store.ts` / `App.tsx` / `Layout.tsx`
