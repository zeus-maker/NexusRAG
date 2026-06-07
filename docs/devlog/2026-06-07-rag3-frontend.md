# RAG3 前端 Devlog

## 1. 左侧导航菜单优化

### 背景与目标

侧栏将「系统管理」夹在业务菜单中间，Hub 区仍用「RAG 3.0 增强层」等英文/技术名，品牌区为「RAG 3.0 + 闪电图标」，对业务用户不够直观。目标：系统管理置底、品牌与增强索引中文化，子菜单命名贴合产品语义。

**用户可见变化**：Logo 改为「智识引擎」+ Sparkles 图标；主菜单「Agent 编排」→「智能体编排」；「增强索引」分组（Layers 图标）含 Wiki 知识库 / 树形推理索引 / 知识图谱；**系统管理紧跟增强索引之后**（主菜单最后一项，非侧栏底栏固定）；系统子项「分类器路由」→「查询路由」、「Traces」→「链路追踪」；面包屑与登录页、知识库 Hub 卡片同步新名称。

### 改动摘要

- `Layout.tsx`：拆分 `mainNavItems` 与 `systemNavItem`；系统管理置于增强索引分组之后、同一滚动区内；更新 `hubItems`、面包屑、状态栏版权文案。
- `Login.tsx`、`KnowledgeBase.tsx`：品牌与 Hub 入口文案对齐侧栏。

### 验证与风险

- 验证：`npm run build` 通过；侧栏展开/折叠、系统管理底栏展开、Hub 跳转正常。
- 风险：侧栏折叠时增强索引入口仍隐藏（与改前一致）；页面内其他「RAG 3.0」文案（Chat/Home 等）未全量替换。

### 涉及文件

- `rag3-bolt-v1.5/src/components/Layout.tsx`
- `rag3-bolt-v1.5/src/pages/Login.tsx`
- `rag3-bolt-v1.5/src/pages/KnowledgeBase.tsx`

---

## 2. 增强索引字号对齐 + LLM Wiki 知识库深化

### 背景与目标

侧栏「增强索引」分组使用 `text-xs` 与主菜单 `text-sm` 不一致；Wiki Hub 仅有简单列表，未对齐 PRD §11.1 浏览器/编译队列/设置/统计能力。目标统一导航字号，并将 Wiki Hub 升级为可演示的 LLM 知识编译管理界面。

**用户可见变化**：增强索引标题与子项与主菜单同为 `text-sm`，子项缩进 `pl-9` 与系统管理一致；侧栏与面包屑「Wiki 知识库」→「LLM Wiki 知识库」；Wiki Hub 浏览器 Tab 为左树右预览（四层 Layer 切换、引用来源、相关页面）；支持编辑双栏 Modal、Git 版本历史；编译队列表格含引用率置顶、批量审核、暂停/重试；编译设置补全触发策略/Git/增量；统计 Tab 含层级分布与高引用排行。

### 改动摘要

- `Layout.tsx`：增强索引按钮与子菜单字号/缩进对齐主菜单。
- 新增 `data/wikiMock.ts`；重写 `pages/Hub/WikiHubPage.tsx`。
- `KnowledgeBase.tsx` Hub 卡片文案同步。

### 验证与风险

- 验证：`npm run build` 通过；侧栏增强索引字号与「知识库管理」一致；进入 wiki-hub → 浏览器/队列/设置/统计四 Tab 可交互。
- 风险：仍为 mock，编辑保存/回滚不持久化。

### 涉及文件

- `rag3-bolt-v1.5/src/components/Layout.tsx`
- `rag3-bolt-v1.5/src/data/wikiMock.ts`
- `rag3-bolt-v1.5/src/pages/Hub/WikiHubPage.tsx`
- `rag3-bolt-v1.5/src/pages/KnowledgeBase.tsx`

---

## 3. LLM Wiki 浏览器改为 index.md 目录树（对齐技术报告）

### 背景与目标

§2 浏览器用 L1–L4 数字 Tab + 扁平分类，不符合 Karpathy LLM Wiki：`raw/` 只读 → `wiki/` 由 LLM 维护 `index.md` catalog，页面分 entity/concept/synthesis 并以 `[[wikilink]]` 链接。依据 `docs/tech/3-PageIndex与LLM Wiki技术行业深度报告.md` §11.4–§11.5，浏览器应以**可展开目录树**为主视图。

**用户可见变化**：左侧 `wiki/ 目录树`（index.md → raw/、entity/、concept/、synthesis/、log.md）；Layer 筛选为「全部/原始/实体/概念/综合」；节点 `[[标题]]` + 状态角标；右侧标注页面类型、raw 来源与交叉引用。

### 改动摘要

- 重写 `wikiMock.ts`：`WIKI_TREE`、`pageType`、`filterWikiTree()`。
- `WikiHubPage` 新增递归 `WikiTreeItem`，替换扁平列表。

### 验证

- `npm run build` 通过；wiki-hub 浏览器 Tab 可展开树、切换 Layer、预览 Wiki 页。

---

## 4. 修复侧栏进入 LLM Wiki 后白屏

### 背景与目标

用户反馈点击侧栏菜单后页面变空白。§3 将 `WikiHubPage` 改为目录树后，`useState(WIKI_PAGES)` 仍引用 `WIKI_PAGES`，但 import 未从 `wikiMock.ts` 补全，运行时抛出 `ReferenceError`，React 整页崩溃。目标：补全依赖导入，恢复 wiki-hub 正常渲染。

**用户可见变化**：点击「LLM Wiki 知识库」后左侧目录树与右侧预览正常显示，不再白屏。

### 改动摘要

- `WikiHubPage.tsx`：在 `wikiMock` import 中增加 `WIKI_PAGES`。

### 验证与风险

- 验证：`npm run build` 通过；本地 dev（5174）点击「LLM Wiki 知识库」→ 目录树与预览可见；「评测中心」等其它菜单跳转正常。
- 风险：同类遗漏需靠 build/运行时暴露；建议后续对 Hub 页做 smoke 点击检查。

### 涉及文件

- `rag3-bolt-v1.5/src/pages/Hub/WikiHubPage.tsx`

---

## 5. Wiki Hub 默认展示 raw/ 文档列表（对齐 Ingest 工作流）

### 背景与目标

用户反馈进入「LLM Wiki 知识库」后不应直接看到 wiki/ 目录树，而应先展示知识库原始文档列表，再下钻查看编译产出的 Wiki 页。这与 Karpathy 范式一致：`raw/` 只读原始资料 → Ingest → LLM 维护 `wiki/`。目标：调整 Hub 默认 Tab 与导航顺序，复刻 PageIndex Hub「文档列表 → 详情」的两步心智。

**用户可见变化**：默认 Tab 为「文档列表」，展示 raw/ 文档、Ingest 状态、Wiki 产出页数；点击「查看 Wiki」跳转「Wiki 浏览器」并定位到该文档关联页面；副标题改为「raw/ → wiki/」两层进度。

### 改动摘要

- `wikiMock.ts`：新增 `WikiSourceDoc`、`WIKI_SOURCE_DOCS` mock（6 份原始文档及关联 slug）。
- `WikiHubPage.tsx`：Tab 顺序改为「文档列表 / Wiki 浏览器 / 编译队列 / 编译设置 / 统计」；新增 `DocumentsTab`；`BrowserTab` 支持从文档列表带入 `focusSlug` 与来源横幅。

### 验证与风险

- 验证：`npm run build` 通过；进入 wiki-hub 默认见文档列表；「查看 Wiki」跳转浏览器并高亮对应页。
- 风险：仍为 mock，文档列表与 KB 文件 Tab 未打通；全局侧栏入口未选知识库时默认 kb-001。

### 反思与沉淀

- PRD §11.1 浏览器 Tab 未显式写「文档列表」前置，但技术报告 §11.4–§13 的 raw→wiki 分层要求 Hub 入口先呈现 Ingest 对象（原始文档），浏览器 Tab 展示编译产物；与 PageIndex Hub 文档列表 Tab 形成对称。

### 涉及文件

- `rag3-bolt-v1.5/src/data/wikiMock.ts`
- `rag3-bolt-v1.5/src/pages/Hub/WikiHubPage.tsx`

---

## 6. PageIndex 管理 Hub 深化（对齐 §11.2 与技术报告）

### 背景与目标

侧栏「树形推理索引」进入后仅为简陋三 Tab（概览/文档列表/单文档树），标题为英文「PageIndex Hub」，未体现 PRD §11.2「PageIndex 管理」及技术报告中的 Vectorless 推理式 RAG 能力（JSON 树 Ingest、In-Context 树搜索、MCTS）。目标：按实现方案 §11.2.1–11.2.4 重构 Hub，丰富 mock 与单文档调试流。

**用户可见变化**：Hub 标题改为「PageIndex 管理」；三 Tab「概览 / 文档列表 / 建树设置」；文档列表表格含深度/节点/目录来源/批量重建；点击「查看树/调试」进入全宽单文档页（JSON 树 + 节点详情 + 树搜索推理路径）；建树设置区分 Ingest（TOC/深度/Token）与 Query（Prompt/MCTS/搜索深度）；概览展示建树进度、失败分布与 FinanceBench 98.7% 说明。

### 改动摘要

- 新增 `data/pageIndexMock.ts`：文档列表、V5 完整 JSON 树、mock 树搜索推理步骤与建树默认配置。
- 重写 `PageIndexHubPage.tsx`：`DocDetailView` 单文档调试；移除独立「单文档树」Tab，改为文档列表下钻。
- 面包屑/知识库卡片/Home 快捷入口文案同步「PageIndex 管理」。

### 验证与风险

- 验证：`npm run build` 通过；pageindex-hub 概览指标与文档列表可见；「调试」进入树搜索可展示推理路径。
- 风险：仍为 mock；与 `KBExtra.PageIndexTreePage` 旧路由并存未合并。

### 反思与沉淀

- 侧栏保留「树形推理索引」作产品语义，Hub 内用「PageIndex 管理」对齐 PRD 与管理员心智；与 Wiki Hub「文档列表 → 详情」形成对称的两层 Hub 模式。

### 涉及文件

- `rag3-bolt-v1.5/src/data/pageIndexMock.ts`
- `rag3-bolt-v1.5/src/pages/Hub/PageIndexHubPage.tsx`
- `rag3-bolt-v1.5/src/components/Layout.tsx`
- `rag3-bolt-v1.5/src/pages/KnowledgeBase.tsx`
- `rag3-bolt-v1.5/src/pages/Home.tsx`

---

## 7. 知识图谱管理 Hub 深化（对齐 §11.9 LazyGraphRAG）

### 背景与目标

「知识图谱」Hub 仅有 5 节点简易力导向图与 2 条社区 mock，未体现 PRD §11.9 的 LazyGraphRAG / GraphRAG 全量 / LightRAG 模式差异，以及 Local/Global/Dual 检索调试、建索引流水线、实体关系复核等能力。目标按实现方案 §11.9.1–11.9.6 重构 Hub，与 Wiki/PageIndex 双层 Hub 对齐。

**用户可见变化**：Hub 标题「知识图谱管理」；六 Tab 带动态 Badge；概览可切换索引模式并对比 Lazy vs 全量成本；可视化含实体/社区筛选、关系标签、Local/Global/Dual 检索路径高亮；社区摘要表格式管理；建索引队列展示完整流水线阶段；实体复核支持关系+实体、批量确认；设置 Tab 区分 Lazy/全量选项。

### 改动摘要

- 新增 `data/graphRAGMock.ts`：图谱节点/边、社区、建索引队列、复核队列、检索路径 preset。
- 重写 `GraphRAGHubPage.tsx`：六 Tab 全量实现 §11.9。
- 面包屑/知识库卡片/Home 文案同步「知识图谱管理」。

### 验证与风险

- 验证：`npm run build` 通过；graphrag-hub 六 Tab 可交互；可视化检索调试可展示 Local 路径与 Global 社区卡片。
- 风险：力导向图为 SVG mock 非 G6；与 KBExtra 旧图谱配置页未合并。

### 涉及文件

- `rag3-bolt-v1.5/src/data/graphRAGMock.ts`
- `rag3-bolt-v1.5/src/pages/Hub/GraphRAGHubPage.tsx`
- `rag3-bolt-v1.5/src/components/Layout.tsx`
- `rag3-bolt-v1.5/src/pages/KnowledgeBase.tsx`
- `rag3-bolt-v1.5/src/pages/Home.tsx`

---

## 8. 知识图谱 Hub 增加文档列表入口（文档 → 子图）

### 背景与目标

用户反馈知识图谱 Hub 应像 Wiki/PageIndex 一样，先展示知识库文档列表，再下钻查看该文档抽取的实体关系子图，而非直接进入库级可视化。目标：保留「概览」为默认入口，「文档列表」紧随其后，支持单文档子图调试与跳转全局图谱。

**用户可见变化**：默认进入「概览」；第二 Tab「文档列表」展示每文档实体/关系数、所属社区、Lazy/全量模式与构建状态；「查看图谱」进入全宽单文档子图页（实体列表 + 力导向图 + Local 检索调试）；「在全局图谱中查看」带文档范围高亮跳转可视化 Tab。

### 改动摘要

- `graphRAGMock.ts`：新增 `GraphSourceDoc`、`GRAPH_SOURCE_DOCS`、`getDocSubgraph()`。
- `GraphRAGHubPage.tsx`：`DocumentsTab`、`DocGraphDetailView`、`GraphCanvas`；Tab 顺序调整为文档列表优先；可视化 Tab 支持 `scopeNodeIds` 文档范围筛选。

### 验证与风险

- 验证：`npm run build` 通过；graphrag-hub 默认见文档列表；「查看图谱」进入子图；全局可视化可带文档来源横幅。
- 风险：文档列表与建索引队列仍为独立 mock，未按 docId 强关联。

### 涉及文件

- `rag3-bolt-v1.5/src/data/graphRAGMock.ts`
- `rag3-bolt-v1.5/src/pages/Hub/GraphRAGHubPage.tsx`

---

## 9. PageIndex 侧栏改名 + Hub 能力扩展（建树队列 / 库级检索 / 统计）

### 背景与目标

侧栏仍显示「树形推理索引」，与 Hub 内「PageIndex 管理」及 Wiki/知识图谱命名不一致。用户要求改为「PageIndex 管理」，并参照 Wiki/GraphRAG Hub 丰富可演示能力。目标：统一导航文案，在保留 §11.2 三 Tab 核心的基础上补齐建树流水线、库级检索调试与运营统计。

**用户可见变化**：侧栏「树形推理索引」→「PageIndex 管理」；Hub 扩展为六 Tab（概览 / 文档列表 / 建树队列 / 检索调试 / 建树设置 / 统计）；建树队列展示解析→目录→建树→校验四阶段进度；检索调试支持跨已建树文档多命中与跳转单文档树；统计 Tab 含延迟分位、文档类型/深度分布、高频检索 Top 文档。

### 改动摘要

- `Layout.tsx`、`KnowledgeBase.tsx`：侧栏与卡片文案对齐「PageIndex 管理」。
- `pageIndexMock.ts`：新增 `PAGEINDEX_BUILD_QUEUE`、`PAGEINDEX_ANALYTICS`、`PAGEINDEX_LIBRARY_SEARCH_PRESETS`、`runMockLibrarySearch()`。
- `PageIndexHubPage.tsx`：新增 `BuildQueueTab`、`LibrarySearchTab`、`StatsTab`。

### 验证与风险

- 验证：`npm run build` 通过；pageindex-hub 六 Tab 可交互；检索调试命中可跳转单文档树搜索。
- 风险：库级检索与单文档 preset 独立维护；建树队列与概览「进行中」卡片数据未强关联（§10 已统一）。

### 涉及文件

- `rag3-bolt-v1.5/src/components/Layout.tsx`
- `rag3-bolt-v1.5/src/pages/KnowledgeBase.tsx`
- `rag3-bolt-v1.5/src/data/pageIndexMock.ts`
- `rag3-bolt-v1.5/src/pages/Hub/PageIndexHubPage.tsx`

---

## 10. PageIndex 单文档 bbox 预览 + mock 统一 + 侧栏失败 Badge

### 背景与目标

§11.2.3 要求单文档树搜索调试联动解析预览 bbox 高亮；概览「建树进行中」与建树队列 mock 曾各自维护（文档名不一致）；首页 Widget「PageIndex 失败 8」与侧栏无 Badge。目标：三处数据同源、详情页可演示 bbox 联动、侧栏与首页失败数一致。

**用户可见变化**：单文档详情右侧（xl 常驻）展示 PDF 解析预览 mock，树节点选中/树搜索命中时 cyan bbox 高亮并可跳转全屏解析；概览「建树进行中」卡片数据来自 `PAGEINDEX_BUILD_QUEUE`（含阶段说明、可点击进文档）；侧栏「PageIndex 管理」显示红色失败数 Badge「8」。

### 改动摘要

- `pageIndexMock.ts`：`PageIndexBbox`、树节点 bbox 坐标、`PAGEINDEX_GLOBAL_FAILED_COUNT`、`getPageIndexActiveBuildJobs()`、`getNodePreviewBbox()`；移除独立 `buildingJobs`。
- `PageIndexHubPage.tsx`：`PdfBboxPreview` 组件；`DocDetailView` 三栏布局；搜索 preset 增加 bbox 步骤。
- `Layout.tsx` / `Home.tsx` / `KnowledgeBase.tsx` / `KBDetailLayout.tsx`：失败数统一引用 `PAGEINDEX_GLOBAL_FAILED_COUNT`。

### 验证与风险

- 验证：`npm run build` 通过；pageindex-hub 单文档详情选节点见 bbox；执行树搜索后高亮脉冲；概览进行中与建树队列 doc 3/7 一致；侧栏 Badge 为 8。
- 风险：PDF 预览为 SVG/CSS mock 非真实 DeepDoc 渲染；`kb-parse` 全屏跳转仅传 highlight 参数未落地解析页。

### 涉及文件

- `rag3-bolt-v1.5/src/data/pageIndexMock.ts`
- `rag3-bolt-v1.5/src/pages/Hub/PageIndexHubPage.tsx`
- `rag3-bolt-v1.5/src/components/Layout.tsx`
- `rag3-bolt-v1.5/src/pages/Home.tsx`
- `rag3-bolt-v1.5/src/pages/KnowledgeBase.tsx`
- `rag3-bolt-v1.5/src/components/KBDetailLayout.tsx`

---

## 11. 系统管理「流水线配置」深化（对齐 §6.2）

### 背景与目标

原 `PipelineConfigPage` 仅有五大流水线简单开关、静态模型下拉与 4 条路由卡片，未体现 PRD §6.2 的健康度、路由可视化编辑器、融合策略与灰度发布。目标重构为可演示的五 Tab 管理页，并与各 Hub（PageIndex/Wiki/GraphRAG）打通跳转。

**用户可见变化**：系统管理 → 流水线配置 升级为五 Tab（概览 / 五大流水线 / 路由规则 / 模型与融合 / 全局设置）；流水线卡片含健康条、阶段链、延迟/成本指标与三态开关；路由规则表支持 Tier×文档类型×意图×安全 → 主辅通道 + 融合策略；路由效果预览可 mock 测试查询；全局设置含软路由置信差、Redis 缓存与灰度流量比例。

### 改动摘要

- 新增 `data/pipelineMock.ts`：流水线定义、路由规则、模型配置、全局设置、路由预览 preset。
- 新增 `pages/PipelineConfigPage.tsx` 独立页面；`System.tsx` 改为 re-export；`App.tsx` 传入 `onNavigate` 支持跳转 Hub。

### 验证与风险

- 验证：`npm run build` 通过；sys-pipeline 五 Tab 可交互；P2/P3/P4「进入 Hub」可跳转。
- 风险：规则编辑/灰度发布仍为 mock；与 `ClassifierPage` 路由矩阵数据独立未合并。

### 涉及文件

- `rag3-bolt-v1.5/src/data/pipelineMock.ts`
- `rag3-bolt-v1.5/src/pages/PipelineConfigPage.tsx`
- `rag3-bolt-v1.5/src/pages/System.tsx`
- `rag3-bolt-v1.5/src/App.tsx`

---

## 12. 查询路由（四分类器）深化（对齐架构第五部分 + §11.3）

### 背景与目标

原 `ClassifierPage` 将四分类器与架构文档不一致（意图/KB路由/安全检测），路由矩阵仅「意图×复杂度×KB」，未覆盖文档类型×密级×主流水线协作。依据 `docs/tech/5-企业级RAG知识库3.0实现方案.md` 第五部分 Adaptive RAG 与 PRD §11.3，目标重构为「复杂分类器为路由中枢」的可演示配置页。

**用户可见变化**：系统管理 → 查询路由 五 Tab（概览 / 四分类器 / 路由矩阵 / 综合测试 / 在线学习）；四分类器对齐复杂度 Tier1-4、文档类型 12 种、意图 6 种、安全 4 级；路由矩阵对齐架构§3.3（Tier×文档×意图×密级→P1–P5）；综合测试输出 L1–L5 Trace 与软路由说明；可跳转流水线配置与评测中心路由在线学习。

### 改动摘要

- 新增 `data/classifierMock.ts`：四分类器元数据、Tier 定义、文档/意图/安全映射、路由矩阵、全链路测试 preset。
- 新增 `pages/ClassifierPage.tsx`；`SystemExtra.tsx` re-export；`App.tsx` 传入 `onNavigate`。

### 验证与风险

- 验证：`npm run build` 通过；sys-classifier 五 Tab 可交互；综合测试三 preset（事实/对比/闲聊拒答）可展示 Trace。
- 风险：与 `pipelineMock` 路由规则仍为独立 mock；矩阵编辑/在线训练未接 API。

### 涉及文件

- `rag3-bolt-v1.5/src/data/classifierMock.ts`
- `rag3-bolt-v1.5/src/pages/ClassifierPage.tsx`
- `rag3-bolt-v1.5/src/pages/SystemExtra.tsx`
- `rag3-bolt-v1.5/src/App.tsx`

---

## 13. 流水线配置与查询路由布局对齐评测中心

### 背景与目标

用户反馈两页在窄屏/侧栏展开时布局不佳；初版用 `SystemConfigShell` 仿 Hub 壳层，用户要求**参考评测中心**。评测中心契约为：`p-6 flex flex-col gap-5 h-full overflow-y-auto` 整页滚动、`EvalSubNav` 顶栏横滑 Tab、h2 子标题 + 操作区 `flex-wrap`、主从 `lg:grid-cols-5` 分栏、宽表包在 `rounded-xl border` 卡片内 `overflow-x-auto`。

**用户可见变化**：系统管理 → 流水线配置/查询路由 顶栏出现 `SystemSubNav`（与 EvalSubNav 同款下划线 Tab，可在两页间切换）；页内分段 Tab 用 `SystemSectionTabs`；四分类器改为评测数据集式左表右详情（`lg:col-span-2` + `lg:col-span-3`）；删除独立 fixed header 壳层。

### 改动摘要

- 新增 `components/SystemSubNav.tsx`：`SystemSubNav`（跨页）、`SystemSectionTabs`（页内）、`TableCard`（宽表容器）。
- 删除 `SystemConfigShell.tsx`。
- `PipelineConfigPage` / `ClassifierPage` 改为评测中心同款页面骨架与按钮样式。

### 验证与风险

- 验证：`npm run build` 通过；与评测中心侧栏展开时表现一致，宽表在卡片内横滑。
- 风险：`SystemSubNav` 目前仅含流水线/查询路由两项，其他系统页未纳入。

### 反思与沉淀

- 产品内「配置/分析」类页面应跟评测中心而非 Hub 壳层：Hub 适合全屏工具页，评测/系统配置适合可滚动内容区。
- 主从布局用 `grid-cols-1 lg:grid-cols-5` 比横向 chip 更符合现有数据集页心智。

### 涉及文件

- `rag3-bolt-v1.5/src/components/SystemSubNav.tsx` — 系统路由区 SubNav + 页内 Tab + TableCard
- `rag3-bolt-v1.5/src/pages/PipelineConfigPage.tsx` — 评测中心式布局
- `rag3-bolt-v1.5/src/pages/ClassifierPage.tsx` — 评测中心式布局 + 四分类器主从分栏

---

## 14. 系统监控四 Tab 深化（对齐 PRD §6.4）

### 背景与目标

原 `MonitorPage` 嵌在 `System.tsx` 中，仅单页展示指标卡片、流水线延迟、Token 成本与静态告警，缺少 PRD §6.4 要求的四 Tab（基础设施 / 流水线 / RAG3索引 / 成本）及跨库索引巡检表。目标重构为可演示的平台监控页，布局对齐评测中心，并支持从首页 RAG3 运营 Widget 深链到「RAG3索引」Tab。

**用户可见变化**：系统管理 → 系统监控 四 Tab；基础设施含 QPS 趋势、服务状态、告警规则启停与最近告警；流水线 Tab 支持 1h/6h/24h/7d 切换并可跳转流水线配置；RAG3索引 Tab 含搜索/仅告警筛选、跨库 Wiki·PI·图谱进度表与 Hub 深链；成本 Tab 含预算进度、模型/流水线成本分布并可跳转评测成本中心。

### 改动摘要

- 新增 `data/monitorMock.ts`：基础设施指标、服务状态、告警、流水线延迟分时、KB 索引聚合、成本快照。
- 新增 `pages/MonitorPage.tsx` 独立页面；`System.tsx` re-export；`store.monitorTab` 支持首页深链 Tab。
- `Home.tsx`「查看全部」跳转 `monitorTab: 2`（RAG3索引）。

### 验证与风险

- 验证：`npm run build` 通过；sys-monitor 四 Tab 可切换；首页 RAG3 Widget「查看全部」直达 RAG3索引 Tab；告警规则可 mock 启停。
- 风险：指标与聚合表均为 mock，未接 Prometheus / index-status API；告警编辑/添加仍为占位。

### 涉及文件

- `rag3-bolt-v1.5/src/data/monitorMock.ts`
- `rag3-bolt-v1.5/src/pages/MonitorPage.tsx`
- `rag3-bolt-v1.5/src/pages/System.tsx`
- `rag3-bolt-v1.5/src/App.tsx`
- `rag3-bolt-v1.5/src/store.ts`
- `rag3-bolt-v1.5/src/pages/Home.tsx`

---

## 15. 系统监控功能第二轮深化

### 背景与目标

§14 已落地四 Tab 骨架，但告警仅静态列表、流水线缺 Tier/错误率、RAG3 索引表无进度与告警详情、成本 Tab 缺趋势与 KB 维度。本轮在 mock 前提下补齐 PRD §6.4 交互深度，使监控页可作为平台管理员日常巡检入口。

**用户可见变化**：顶栏未恢复告警横幅 + 自动刷新 30s + 快捷跳转链路追踪/查询路由；基础设施新增错误率/P95 副趋势、资源节点表、添加告警规则弹窗；流水线新增 P1–P5 健康卡、Tier 分布、L1–L5 延迟、错误率表；RAG3索引新增汇总卡片筛选、进度条、右侧告警详情面板；成本新增 7 日趋势、KB Top5、周期选择与导出。

### 改动摘要

- 扩展 `monitorMock.ts`：资源节点、双趋势、Tier/错误率/Layer 统计、成本趋势与 KB 排行、索引告警详情。
- `MonitorPage.tsx` 各 Tab 深化；`AddAlertRuleModal` 对齐 PRD 告警配置流程。

### 验证与风险

- 验证：`npm run build` 通过；四 Tab 新增区块可交互；RAG3 行点击展示告警侧栏；添加告警规则可写入列表。
- 风险：自动刷新为 mock；告警恢复/批量处理/导出无后端。

### 涉及文件

- `rag3-bolt-v1.5/src/data/monitorMock.ts`
- `rag3-bolt-v1.5/src/pages/MonitorPage.tsx`

---

## 16. 系统监控布局优化（对齐评测中心分层顶栏）

### 背景与目标

§14–§15 已补齐四 Tab 功能，但页面信息密度高、窄屏与侧栏展开时易出现横向溢出，且顶栏结构与评测中心（`Evaluation`）不一致。本轮仅做布局与响应式收敛，不增 mock 字段。

**用户可见变化**：系统监控采用「h1 → Tab 下划线 → 当前 Tab h2+描述 → 操作区」分层顶栏；告警横幅长文案 `line-clamp` 防撑破；各 Tab 去掉重复统计行、栅格按断点重排；RAG3 索引表优先、侧栏大屏 sticky；成本三块合并为 `md:2 / xl:3` 栅格。

### 改动摘要

- 根容器：`p-4 sm:p-6`、`min-w-0 w-full overflow-x-hidden`，内容区统一 `min-w-0` 防 flex 子项撑宽。
- 顶栏：`TAB_META` 驱动当前 Tab 标题与 PRD 引用描述；刷新/深链按钮窄屏全宽堆叠、`lg` 右对齐。
- **基础设施**：错误率/P95 副趋势窄屏单列；资源表「角色」列 `sm` 以下折叠到节点名下方。
- **流水线**：移除与 P1–P5 健康卡重复的 5 卡统计行；健康卡 `2→3→5` 列；路由指标收敛为 3 卡横排。
- **RAG3索引**：移除与汇总卡重复的筛选 chip；主区 `lg:grid-cols-5`（表 3 + 侧栏 2）；PI/图谱列 `lg` 以下隐藏、移动端正文补 PI 摘要；侧栏 `lg:sticky`。
- **成本**：模型/KB/流水线成本分布合并单区 `md:grid-cols-2 xl:grid-cols-3`。

### 验证与风险

- 验证：`npm run build` 通过；建议手测 `sys-monitor` 四 Tab 在 ~375px 与侧栏展开宽度下无横向滚动；RAG3 行点击侧栏仍 sticky（≥lg）。
- 风险：表格列折叠后窄屏需纵向滚动查看更多字段；sticky 侧栏在极短视口可能与顶栏操作区重叠，后续可加 `top` 偏移。

### 反思与沉淀

- 监控页与评测中心共用 `SystemSectionTabs`，顶栏契约已统一；后续若 `SystemSubNav` 增加监控入口，侧栏与页内 Tab 职责需再划分。
- 功能密度高的 Tab 优先「删重复 + 断点藏列」而非继续加卡，比单纯缩小字号更可维护。

### 涉及文件

- `rag3-bolt-v1.5/src/pages/MonitorPage.tsx` — 四 Tab 响应式布局与分层顶栏

---

## 17. 修复系统监控 Tab 被裁切与全站主区滚动

### 背景与目标

§16 为防横向溢出在 `MonitorPage` 根节点加了 `overflow-x-hidden`，叠加 `SystemSectionTabs` 按钮 `-mb-px` 负边距，导致「基础设施」等 Tab 文字几乎不可见（仅余下划线）。同时 `App` 壳层 flex 子项缺 `min-h-0`，工作台等长页底部内容无法滚动、呈裁切态，易被误认为「布局变了」。

**用户可见变化**：系统监控四 Tab 完整可点；工作台/监控等页可纵向滚动至底部。

### 改动摘要

- `SystemSectionTabs`：对齐 `EvalSubNav`，去掉负边距，边框与滚动区分层，激活 Tab 补背景色。
- `MonitorPage`：移除根节点 `overflow-x-hidden`；`h1` 与 Tab 合并为同一标题块（同评测中心）。
- `App.tsx`：`flex-1` 容器与 `main` 补 `min-h-0`；`Home.tsx` 滚动根补 `min-h-0`。

### 验证与风险

- 验证：`npm run build` 通过；浏览器 `sys-monitor` Tab 栏文字完整；`home` 可滚至页底。
- 风险：极宽表格仍依赖 `TableCard` 横向滚动，勿在页面根再叠 `overflow-x-hidden`。

### 反思与沉淀

- 防溢出应落在表格/栅格子节点（`min-w-0` + 局部 `overflow-x-auto`），不宜在整页滚动容器上 `overflow-x-hidden`。
- flex 全屏壳层：`h-screen` → `flex-1` → `h-full overflow-y-auto` 链路每一层 flex 子项都需 `min-h-0`，否则 `overflow-y-auto` 不生效。

### 涉及文件

- `rag3-bolt-v1.5/src/components/SystemSubNav.tsx`
- `rag3-bolt-v1.5/src/pages/MonitorPage.tsx`
- `rag3-bolt-v1.5/src/App.tsx`
- `rag3-bolt-v1.5/src/pages/Home.tsx`

---

## 18. 工作台对齐知识库管理布局并功能深化

### 背景与目标

用户反馈工作台与知识库管理页视觉契约不一致（居中 `max-w-[1400px]` Hero 双栏 vs KB 全宽 `p-6 gap-5` 骨架），且运营能力分散难检索。目标将工作台改为与 `KBListPage` 同构的页头 + 统计条 + 工具栏 + 内容区，并按 §10.2 / US-1.9 / §14.2 分层组织功能。

**用户可见变化**：工作台全宽布局；六指标横排统计卡；工具栏含搜索、7d/30d 周期、四分段 Tab（概览 / 运营分析 / 我的知识库 / 平台动态）；知识库卡对齐 KB 列表（描述、存储、索引进度、文档/检索/索引快捷链）；运营 Tab 含 RAG3 Widget + 排行榜；动态 Tab 支持类型筛选与表格/卡片视图；顶栏可直接打开创建知识库向导。

### 改动摘要

- 新增 `data/homeMock.ts`：趋势、排行榜、任务、动态、快捷入口等 mock 集中管理。
- `Home.tsx` 重构：`SystemSectionTabs` 分段；`WorkbenchKBCard` 复用 KB 卡片信息密度；`KBCreateDialog` 接入创建流；告警条（索引中 + PI 失败）、评测进行中横幅；我的知识库 Tab 支持状态筛选、分页、网格/表格切换。

### 验证与风险

- 验证：`npm run build` 通过；`home` 四 Tab 可切换；创建知识库弹窗可打开；排行榜 / RAG3 / 动态深链可达。
- 风险：运营数据仍为静态 mock；分段 Tab 与工具栏筛选联动仅在「我的知识库」「平台动态」生效，概览/运营 Tab 搜索不筛侧栏内容。

### 反思与沉淀

- 列表型管理页（KB、工作台）宜共用「页头 → 统计 → 白底工具栏 → 内容」四层骨架，分段 Tab 放工具栏内比单独 Hero 更省纵向空间。
- mock 数据抽到 `homeMock.ts` 后 `Home.tsx` 专注布局与交互，后续接 `/api/v1/admin/dashboard` 只需替换数据源。

### 涉及文件

- `rag3-bolt-v1.5/src/data/homeMock.ts`
- `rag3-bolt-v1.5/src/pages/Home.tsx`

---

## 19. 工作台补全统计项并恢复 Wiki / PageIndex 首屏展示

### 背景与目标

§18 重构后统计仅 6 项，且 RAG3 Widget、Wiki Hub、PageIndex 管理仅藏在「运营分析」Tab，概览首屏丢失 §14.2 要求的增强索引运营入口。用户要求扩充统计并恢复 LLM Wiki、PageIndex 独立展示。

**用户可见变化**：统计区拆为「平台运营」10 项 +「RAG3 增强索引」8 项双行；概览 Tab 首屏恢复 RAG3 运营 Widget + **LLM Wiki** / **PageIndex 管理** 双栏面板（队列预览、Hub 深链）；Hub 快捷条文案恢复为 Wiki Hub / PageIndex 管理 / 知识图谱管理。

### 改动摘要

- `homeMock.ts`：`getPlatformStats()`、`RAG3_INDEX_STATS`（联动 `WIKI_STATS` / `PAGEINDEX_STATS`）。
- `Home.tsx`：`WikiHubPanel`、`PageIndexHubPanel`；RAG3 统计卡可点击跳转 Hub；概览置顶 RAG3 Widget + Wiki/PI 面板。

### 验证与风险

- 验证：`npm run build` 通过；`home` 概览可见双行统计与 Wiki/PI 面板；Hub 按钮文案与深链正确。
- 风险：统计仍为 mock 聚合；双行 18 卡窄屏需纵向滚动，后续可考虑折叠「RAG3 行」。

### 涉及文件

- `rag3-bolt-v1.5/src/data/homeMock.ts`
- `rag3-bolt-v1.5/src/pages/Home.tsx`

---

## 20. 原型图 P0：融合策略三页 + 知识库权限/数据源/导出

### 背景与目标

对照 PRD §11.8 与 §3.8/§3.10/§10.10.1，补齐此前仅调研未落地的 P0 缺口：系统管理侧 L4 融合与 L2/L3 策略配置，以及知识库侧权限、独立数据源、导出任务页。用户从侧栏或 `SystemSubNav` 五 Tab 可直达各页；KB 子导航「权限」「数据源」去掉 Soon；导出从列表 ⋮ 菜单与文档页顶栏进入。

**用户可见变化**：系统管理新增「融合精排」「检索策略」「生成策略」三页（含 Top-K、RRF 权重表、路由测试、生成策略矩阵）；知识库内可配置团队可见性与 Chunk ACL、管理关联数据源、创建/跟踪导出任务（含新建弹窗）。

### 改动摘要

- `fusionMock.ts`：融合/检索/生成策略默认值、KB ACL、数据源、导出任务 mock。
- `FusionConfigPage` / `RetrievalStrategyPage` / `GenerationStrategyPage`：对齐 §11.8 ASCII 布局，复用 `SystemSubNav`。
- `KBP0Pages.tsx`：`KBPermissionsPage`、`KBDataSourcesPage`、`KBExportPage`，均包 `KBDetailLayout`。
- 路由：`store.ts` 扩展 6 个 page id；`App.tsx` case；`Layout.tsx` 侧栏 + breadcrumb + `SYSTEM_PAGES`/`KB_PAGES`。
- `SystemSubNav` 扩展为 5 Tab；`KBSubNav` 数据源改独立页、权限启用。
- 导出入口：KB 列表菜单、文档页「导出」按钮 → `kb-export`。

### 验证与风险

- 验证：`npm run build` 通过；侧栏系统管理三新项可切换；KB 权限/数据源/导出页在选中 KB 下可渲染；融合页保存/测试 toast 可触发。
- 风险：仍为 mock，未接 `/api/v1/admin/fusion-config` 等 API；配置页 datasource Tab 高亮改为 `kb-data-sources` 但 Tab 内容仍在 settings 内（双入口）；导出页侧栏高亮为「文件」因 PRD 规定非侧栏项。

### 反思与沉淀

- L1–L4 路由体系在 UI 上拆为「查询路由（分类器）」+「融合/检索/生成策略」三页，与 PRD §11.8 navConfig 一致；后续接 API 时 mock 文件即契约层。
- KB 导出不放侧栏、从业务入口深链，避免 12 项子导航过载。

### 涉及文件

- `rag3-bolt-v1.5/src/data/fusionMock.ts`
- `rag3-bolt-v1.5/src/pages/FusionConfigPage.tsx`
- `rag3-bolt-v1.5/src/pages/RetrievalStrategyPage.tsx`
- `rag3-bolt-v1.5/src/pages/GenerationStrategyPage.tsx`
- `rag3-bolt-v1.5/src/pages/KBP0Pages.tsx`
- `rag3-bolt-v1.5/src/components/SystemSubNav.tsx`
- `rag3-bolt-v1.5/src/components/KBSubNav.tsx`
- `rag3-bolt-v1.5/src/components/Layout.tsx`
- `rag3-bolt-v1.5/src/store.ts`
- `rag3-bolt-v1.5/src/App.tsx`
- `rag3-bolt-v1.5/src/pages/KnowledgeBase.tsx`
- `rag3-bolt-v1.5/src/pages/KBExtra.tsx`

---

## 21. 多通道检索测试台深化（§10.5 P0）

### 背景与目标

P0 最后一项：检索测试页需从单通道混合结果升级为 PRD §10.5 要求的**五通道分路 + 融合对比 + 精排前后**三视图，并继承 `KBDetailLayout` 侧栏高亮。原 `KBExtra.tsx` 内嵌页仅 3 通道 mock、无 WRRF 融合，与 §11.8 融合配置无法联动。

**用户可见变化**：检索测试接入 KB 子导航框架；左栏可勾选向量/BM25/PageIndex/GraphRAG/Wiki 五通道；右栏 Tab 切换「分路」「融合对比」「精排前后」；支持保存评测样本、导出 JSON、线上一致性对比（mock）；可跳转全局融合配置。

### 改动摘要

- 新建 `retrievalTestMock.ts`：`runMockFullChannelRetrieval` 模拟分路延迟、WRRF 融合（联动 `DEFAULT_FUSION_CONFIG.rrfK` 与通道权重）、精排前后分数。
- 抽出 `RetrievalTestPage.tsx`：左右分栏布局对齐 §10.5 ASCII；删除 `KBExtra.tsx` 旧实现。
- `App.tsx` 补充 `onNavigate`，支持跳转 `sys-fusion`。

### 验证与风险

- 验证：`npm run build` 通过；KB 侧栏「检索测试」→ 执行全通道检索 → 三 Tab 均有数据；融合 Tab 显示 WRRF 分数与来源通道标签。
- 风险：融合算法为前端 mock 近似，非真实 RRF；精排分数为公式生成；未接 `/api/v1/knowledge-bases/{kb_id}/retrieval/test`。

### 反思与沉淀

- 检索测试台与融合配置页通过 mock 共享 `rrfK`/通道权重语义，后续接 API 时 `retrievalTestMock.ts` 可整文件替换为 service 层。
- 大页从 `KBExtra.tsx` 拆出有利于 P0 后续 Hub/设置页继续瘦身。

### 涉及文件

- `rag3-bolt-v1.5/src/data/retrievalTestMock.ts`
- `rag3-bolt-v1.5/src/pages/RetrievalTestPage.tsx`
- `rag3-bolt-v1.5/src/pages/KBExtra.tsx`
- `rag3-bolt-v1.5/src/App.tsx`

---

## 22. 链路追踪页深化与布局优化（§11.5.3）

### 背景与目标

原 `SystemExtra.tsx` 内嵌 Traces 页仅 3 条扁平 Span、顺序瀑布图（无法表达并行检索），无筛选、无 L1–L5 层、无错误/超时样例，与 PRD §11.5.3 Trace 详情 ASCII 差距大。需对齐监控/融合页的布局规范，并与分类器、对话 Trace、检索测试台形成跳转闭环。

**用户可见变化**：链路追踪页含运营统计四卡、搜索/状态/Tier 筛选、7 条 Trace（含 ACL 失败与 Milvus 超时）；详情四 Tab（概览 L1–L5、Span 树+属性面板、真实时间轴瀑布图、JSON）；可跳转 Langfuse（mock）、对话、查询路由、融合配置、检索测试台；对话与分类器测试可深链至 `sys-traces`。

### 改动摘要

- `tracesMock.ts`：嵌套 Span 树、`startMs` 时间轴、L1–L5 layers、7 条多场景 Trace、`flattenSpans`/`filterTraces`。
- `TracesPage.tsx` 独立页面：暗色适配、`HubStatCard` 统计、列表+详情双栏、Span 树可折叠选中。
- 瀑布图改为按 `startMs`/`durationMs` 定位（支持并行 channel）。
- 从 `SystemExtra.tsx` 移除旧实现；`App.tsx` 传入 `onNavigate`。
- `ClassifierPage` / `Chat.tsx` QueryTraceTimeline 增加「查看完整 Trace」跳转。

### 验证与风险

- 验证：`npm run build` 通过；系统管理 → 链路追踪可筛选/切换 Trace；Span 树选中显示 input/output；瀑布图 pageindex/vector 条带可重叠。
- 风险：仍为 mock，未接 Langfuse/Phoenix API；时间范围筛选仅 UI 未过滤数据。

### 反思与沉淀

- 并行检索的 Span 必须用 `startMs` 甘特，顺序累加瀑布会误导排障；mock 层保留树+扁平两种视图供不同 Tab 消费。
- Trace 作为 L1–L5 可观测枢纽，概览 Tab 深链到路由/融合/检索测试台，比孤立列表更符合 RAG 3.0 运维路径。

### 涉及文件

- `rag3-bolt-v1.5/src/data/tracesMock.ts`
- `rag3-bolt-v1.5/src/pages/TracesPage.tsx`
- `rag3-bolt-v1.5/src/pages/SystemExtra.tsx`
- `rag3-bolt-v1.5/src/App.tsx`
- `rag3-bolt-v1.5/src/pages/ClassifierPage.tsx`
- `rag3-bolt-v1.5/src/pages/Chat.tsx`

---

## 23. 链路追踪对标 Langfuse/Phoenix/OTel 深化设计

### 背景与目标

对照 [Langfuse Trace 视图](https://langfuse.com/faq/all/what-does-a-good-trace-look-like)、[Phoenix Sessions](https://arize.com/docs/phoenix/tracing/llm-traces/sessions) 与 [OpenTelemetry RAG 可观测性](https://uptrace.dev/guides/opentelemetry-rag-observability) 行业实践，在 §22 基础上补齐 Session 聚合、Observation 类型、OTel `rag.*` 质量属性与多视图切换，使原型更贴近真实 APM 排障路径。

**用户可见变化**：列表可切换 Trace/Session；筛选增加环境、质量告警；统计卡增加空召回率/截断率；详情五 Tab（概览含 Phoenix 评测+OTel 信号+阶段 P95、Span 树含 generation 标签、时间轴、日志序列表、JSON）；Session 回放线程；深链回放评测。

### 改动摘要

- `tracesMock.ts`：`TraceQuality`/`TraceEval`/`TraceSession`；`annotateObservationKinds`；`TRACE_SESSIONS`；`STAGE_P95_MS`；`logSpansChronological`；OTel 属性 `rag.reranking.*`。
- `TracesPage.tsx`：Trace/Session 双模式、质量徽章、评测分、Log 视图、树展开/折叠全部。

### 验证与风险

- 验证：`npm run build` 通过；Session 切换显示连贯性/轮次；质量告警筛选命中 tr-003/tr-005/tr-007；Log Tab 按 startMs 排序。
- 风险：Session 多轮仅 mock 首条 Trace；时间范围/环境筛选仍为 UI 占位。

### 反思与沉淀

- Langfuse 强调 observation 类型（generation 计费过滤）与 Tree/Timeline/Log 三视图 — 原型已覆盖，Agent Graph 留 P2。
- OTel 文档指出 rerank 与 empty_retrieval 是隐性瓶颈与领先指标 — 概览 Tab 显式展示 `rag.*` 属性便于后续接告警规则。

### 涉及文件

- `rag3-bolt-v1.5/src/data/tracesMock.ts`
- `rag3-bolt-v1.5/src/pages/TracesPage.tsx`

---

## 24. 知识库治理 enrich 原型首版（US-1.13–1.16）

### 背景与目标

在 `76e2e45` 将 US-1.13–1.16 治理设计写入 PRD 与 `前端界面实现方案.md` §3.12–3.15 后，本轮把设计落到可运行原型：运营人员可在知识库详情内看到治理摘要、五态流水线、陈旧队列、处理日志、五维健康分与 ACL 保真状态，并通过深链定位失败文档。

**用户可见变化**：概览页出现治理摘要条与健康分指标；文档表显示流水线五态与认证状态；索引状态页展示综合健康分与可点击的失败归因；分块预览显示纯度/重叠信号并支持排除 toast；检索测试融合结果可标 ✅相关/❌误召回；权限页新增 batch/live ACL 同步与角色映射冲突。

### 改动摘要

- 新增 `kbGovernanceMock.ts`：治理摘要、健康分、五态流水线、陈旧队列、处理日志、Chunk 质量元数据、`ACL_SYNC_MOCK`。
- 新增 `KBGovernancePages.tsx`：`KBStaleGovernancePage`（新鲜度筛选 + 批量认证/降权）、`KBProcessingLogsPage`（§10.10.2 审计字段列）。
- `KnowledgeBase.tsx`：`KBDetailPage`/`DocumentPage`/`ChunkPreviewPage`/`IndexStatusPage` 统一 `KBDetailLayout`；概览五指标含健康分 + 治理摘要深链；文档上传队列与表列接入治理 mock。
- `KBP0Pages.tsx`：权限页增加 US-1.16 ACL batch/live 同步区块。
- `retrievalTestMock.ts` + `RetrievalTestPage.tsx`：融合 Hit 增加 `evalLabel` 与 ✅/❌ 徽章。
- 路由：`store.ts` 新增 `kb-governance-stale`、`kb-logs`；`KBSubNav`「处理日志」去掉 Soon。

### 验证与风险

- 验证：`cd rag3-bolt-v1.5 && npm run build` 通过。
- 手动：知识库概览 → 陈旧队列 / 处理日志；文档表五态列；索引状态健康分 → 失败归因「定位」；分块排除 toast；检索测试融合 Tab 见标注；权限页 ACL 同步模式切换。
- 风险：治理数据为静态 mock，与监控 RAG3 Tab、真实 Knowledge Runtime API 未同源；陈旧队列侧栏高亮为「概览」子路由。

### 反思与沉淀

- 治理 mock 集中在 `kbGovernanceMock.ts`，与 `mockIndexStatuses`、Hub 失败数概念对齐，便于后续接 `/api/v1/kb/{id}/governance`。
- 失败归因 `deep_link_page` 字段使索引页成为运营枢纽，无需在各 Hub 重复失败列表。

### 涉及文件

- `rag3-bolt-v1.5/src/data/kbGovernanceMock.ts` — 治理 mock 数据与标签常量
- `rag3-bolt-v1.5/src/pages/KBGovernancePages.tsx` — 陈旧队列 + 处理日志页
- `rag3-bolt-v1.5/src/pages/KnowledgeBase.tsx` — 详情/文档/分块/索引治理 UI
- `rag3-bolt-v1.5/src/pages/KBP0Pages.tsx` — ACL batch/live 保真
- `rag3-bolt-v1.5/src/data/retrievalTestMock.ts` — 融合 evalLabel
- `rag3-bolt-v1.5/src/pages/RetrievalTestPage.tsx` — ✅/❌ 标注展示
- `rag3-bolt-v1.5/src/store.ts` / `App.tsx` / `Layout.tsx` / `KBSubNav.tsx` — 路由与导航
- `docs/prd/前端原型实现进度.md` — US-1.13–1.16 标 🟢

---

## 25. 解析预览三栏 + 治理监控同源 + 系统管理 §6.5–6.8

### 背景与目标

接续 §24 治理原型，补齐三项 P1：文档页接入 PageIndex bbox 三栏预览（§3.4）；监控 RAG3 Tab 与 `kbGovernanceMock` 同源，消除 PI 失败数多处不一致；系统管理落地 Prompt/灰度/备份/向量库四子页（§6.5–6.8）。

**用户可见变化**：文档管理页可选中文档后展示树结构 + 元数据 + PDF bbox 预览；侧栏/首页 PI 失败 Badge 与监控 RAG3 Tab 同源；系统管理侧栏新增四入口并可交互。

### 改动摘要

- `PageIndexPreviewParts.tsx` + `DocumentParsePreviewPanel.tsx`：抽取 bbox/树组件；`KB_DOC_TO_PAGEINDEX` 映射；`DocumentPage` 行选中 +「解析预览」开关。
- `kbGovernanceMock.ts`：`FAILURES_BY_KB` 分库失败；`getGlobalPageIndexFailureCount()`；`pageIndexMock.PAGEINDEX_GLOBAL_FAILED_COUNT` 改派生。
- `monitorMock.ts`：`KB_INDEX_AGGREGATE` / `INDEX_SUMMARY` / `INDEX_ALERT_DETAILS` 由治理函数动态构建。
- `SystemOpsPages.tsx` + `systemOpsMock.ts`：Prompt 模板编辑、灰度流量滑块、备份恢复向导、向量库四步切换。
- 路由：`sys-prompt-templates` / `sys-gray-release` / `sys-backup` / `sys-vector-db`。

### 验证与风险

- 验证：`npm run build` 通过。
- 手动：文档页选中 doc-001 见三栏；监控 RAG3 Tab PI 失败 = 3（与侧栏 Badge 一致）；系统管理四页侧栏可达。
- 风险：`PageIndexHubPage` 仍保留内联预览组件未完全去重；灰度页与 `PipelineConfigPage` 内嵌灰度 mock 职责并存。

### 反思与沉淀

- 治理失败按 `kb_id` 分桶后，Monitor 抽屉「定位」与 KB 索引状态页可共用 `deep_link_page`，运营路径一致。
- 文档预览通过 `doc_id → pageIndex id` 映射解耦两套 mock，后续 API 可返回 `page_index_doc_id` 字段替换。

### 涉及文件

- `rag3-bolt-v1.5/src/components/pageIndex/PageIndexPreviewParts.tsx`
- `rag3-bolt-v1.5/src/components/kb/DocumentParsePreviewPanel.tsx`
- `rag3-bolt-v1.5/src/pages/KnowledgeBase.tsx` — DocumentPage 三栏
- `rag3-bolt-v1.5/src/data/pageIndexMock.ts` / `kbGovernanceMock.ts` / `monitorMock.ts`
- `rag3-bolt-v1.5/src/pages/SystemOpsPages.tsx` / `data/systemOpsMock.ts`
- `rag3-bolt-v1.5/src/store.ts` / `App.tsx` / `Layout.tsx`
- `docs/prd/前端原型实现进度.md`

---

## 26. Monorepo 脚手架：backend 迁移 + RAG3 后端扩展 + frontend/rag3-web

### 背景与目标

用户已将 RAGFlow 0.25.6 手动复制到仓库根目录 `ragflow-0.25.6/`（只读上游镜像，不入 git）。接续全栈落地：将二开工作区从 `web/ragflow_rag30` 迁至 `backend/ragflow_rag30`，从 `rag3-bolt-v1.5` 复制生产前端至 `frontend/rag3-web`（不改原型），并补齐 RAG3 路由/流水线/融合/API 脚手架。

**用户可见变化**：仓库具备标准 monorepo 布局与 `CLAUDE.md` 约定；后端新增 `/v1/rag3/health`、`/classify`、`/query` 三条扩展路由；前端具备 API 客户端与 Vite 开发代理，可通过 `VITE_USE_REAL_API` 逐步替换 mock。

### 改动摘要

- **目录重组**：`git mv web/ragflow_rag30 → backend/ragflow_rag30`；新增 `frontend/rag3-web/`（rsync 自 bolt）；`.gitignore` 忽略 `ragflow-0.25.6/` 与 `ragflow-*/`。
- **RAG3 后端包**：`router/`（四分类 + `RouterEngine.plan`）、`pipelines/`（五通道 mock + `run_pipelines`）、`fusion/`（RRF + rerank 占位）、`security/chunk_acl`（ACL 透传占位）。
- **API**：`api/apps/rag3_app.py` 注册 `health` / `classify` / `query`，查询路径为 分类 → 多通道 → RRF → 精排。
- **同步脚本**：`scripts/sync-from-ragflow.sh` 从上游 rsync 复用模块（保护 router/pipelines/fusion 等 RAG3 包）。
- **前端**：`src/services/api.ts` + `vite.config.ts` 代理 `/api → :9380`；`package.json` 更名为 `rag3-web`。

### 验证与风险

- 验证：`cd frontend/rag3-web && npm install && npm run build` 通过。
- 后端：`export PYTHONPATH=backend/ragflow_rag30 && python api/ragflow_server.py` 启动后 `curl localhost:9380/v1/rag3/health`（需本地依赖与 DB，未在本机全量验证）。
- 风险：流水线仍为 mock 数据；`rerank` / `chunk_acl` 为占位；大量 `web/ragflow_rag30` git mv 暂存待一次性 commit；`web/rag3-bolt-v1.5-new` 等历史目录仍保留。

### 反思与沉淀

- 上游镜像与二开工作区分离后，`sync-from-ragflow.sh --dry-run` 可安全预览复用模块差异，RAG3 扩展包列入 PROTECTED 避免被 rsync 覆盖。
- 前端默认仍走 mock，`VITE_USE_REAL_API=true` 作为模块级切换开关，避免一次性切断原型演示能力。

### 涉及文件

- `CLAUDE.md` / `README.md` / `backend/README.md` — monorepo 约定
- `backend/ragflow_rag30/router/`、`pipelines/`、`fusion/`、`security/`、`api/apps/rag3_app.py`
- `frontend/rag3-web/src/services/api.ts`、`vite.config.ts`、`package.json`
- `scripts/sync-from-ragflow.sh`、`.gitignore`

---

## 27. 知识库管理对接 RAGFlow 正式 API

### 背景与目标

`frontend/rag3-web` 知识库管理页此前完全依赖 `mockKBs`/`mockDocuments`。需在 `VITE_USE_REAL_API=true` 时对接 RAGFlow `/v1/datasets` 与文档 API，保留 mock 模式供离线演示。

**用户可见变化**：开启 API 模式后，登录页调用真实 `/v1/auth/login`；知识库列表/创建/删除、详情概览、文档列表与上传走 RAGFlow；列表页显示「API」徽章与刷新按钮。

### 改动摘要

- **HTTP 基座** `services/http.ts`：Authorization 存储、`apiRequest`/`apiUpload`、环境变量 `VITE_RAGFLOW_AUTH_TOKEN` 直登。
- **认证** `services/auth.ts`：RSA 加密密码（与 RAGFlow Web 同公钥），登录后持久化 token。
- **知识库 API** `services/kbApi.ts` + `kbMappers.ts`：Dataset ↔ `KnowledgeBase`、Document 字段映射；CRUD + 文档列表/上传。
- **Hooks** `hooks/useKbData.ts`：`useKnowledgeBaseList` / `useKnowledgeBase` / `useDocuments`，`useRealApi` 时走 API，否则回落 mock。
- **页面**：`Login.tsx`、`store.ts`（token 恢复会话）、`KnowledgeBase.tsx`（列表/详情/文档）、`KBDetailLayout.tsx`。

### 验证与风险

- 验证：`cd frontend/rag3-web && npm run build` 通过。
- 手动（需 RAGFlow :9380）：`.env.local` 设 `VITE_USE_REAL_API=true` → 登录 → 列表刷新 → 创建 KB → 上传 PDF。
- 风险：治理摘要/五态流水线/解析预览仍用 mock enrich；删除在 API 模式为硬删除非回收站；统计卡片在 API 模式仅汇总当前页。

### 反思与沉淀

- 适配层将 RAGFlow `chunk_method`/`run` 映射为原型 `KnowledgeBase`/`Document` 契约，后续 RAG3 扩展字段可在 mapper 增量追加而不改页面。
- `useRealApi` 双模式让 bolt 原型演示与联调共存，建议按模块（Chat/Search/Eval）逐步替换。

### 涉及文件

- `frontend/rag3-web/src/services/http.ts`、`auth.ts`、`kbApi.ts`、`kbMappers.ts`、`api.ts`
- `frontend/rag3-web/src/hooks/useKbData.ts`
- `frontend/rag3-web/src/pages/Login.tsx`、`KnowledgeBase.tsx`
- `frontend/rag3-web/src/store.ts`、`components/KBDetailLayout.tsx`
- `frontend/rag3-web/.env.example`、`README.md`、`CLAUDE.md`

---

## 28. backend 本地源码启动教程 + ES 端口修正

### 背景与目标

`backend/README.md` 仅有三行启动命令，缺少与 monorepo 分工（`ragflow_rag30` 二开 + `ragflow-0.25.6` 依赖/Docker）对应的可复现步骤。

### 改动摘要

- 重写 `backend/README.md`：中间件 Docker、上游 `uv sync`、`service_conf` 对齐、API + task_executor、前端联调、FAQ。
- `service_conf.yaml` 的 `es.hosts` 端口须与宿主机 `ES_PORT` 一致（Docker 映射 `ES_PORT:9200`，容器内 ES 始终监听 9200）；本仓库配置为 `http://localhost:9200`。
- 根 `README.md`、`CLAUDE.md` 指向详细后端文档。

### 验证与风险

- 文档步骤与上游 README § Launch service from source 对齐；未在本机全量跑通 Docker 栈。
- 风险：换 `DOC_ENGINE=infinity` 时端口需改 `infinity.uri` 而非 ES 段。

### 涉及文件

- `backend/README.md`、`backend/ragflow_rag30/conf/service_conf.yaml`
- `README.md`、`CLAUDE.md`

---

## 29. ragflow_rag30 本地启动修复：strenum 迁移 + 补全 memory 包

### 背景与目标

在 `backend/ragflow_rag30` 用 `uv sync` 安装依赖后执行 `./scripts/start.sh`，先后遇到 `ModuleNotFoundError: No module named 'strenum'` 与 `No module named 'memory'`，API `:9380` 无法拉起。目标是在不改 RAG3 扩展模块的前提下，让 ragflow_server 与 RAG3 health 端点可本地复现启动。

### 改动摘要

- **strenum**：上游 Python 3.13 已从 `pyproject.toml` 移除 `strenum`，但 14 处 RAGFlow 核心代码仍 `from strenum import StrEnum`；统一改为 `from enum import StrEnum`（`common/constants.py`、`api/db/__init__.py`、`rag/llm/*`、`deepdoc/parser/mineru_parser.py` 等）。
- **memory 包**：`common/settings.py` 与 memory 相关 API 依赖顶层 `memory/` Python 包；monorepo 迁移时未拷贝，从 `ragflow-0.25.6/memory/` 同步 `services/`、`utils/` 至 `backend/ragflow_rag30/memory/`。
- **依赖与脚本**（接续 §28）：`pyproject.toml` + `uv.lock` 置于 `rag30` 根目录；`scripts/install.sh`、`start.sh`、`start-task-executor.sh` 在目录内 `uv sync` 并设置 `PYTHONPATH`、`HF_ENDPOINT`。

### 验证与风险

- `from api.apps import app` 导入成功（约 75s，含模型/词典加载警告，可忽略）。
- `./scripts/start.sh` 后 `curl http://localhost:9380/v1/rag3/health` → `200`，`data.status=ok`，`modules=["router","pipelines","fusion","security"]`。
- Docker 中间件（mysql/redis/minio/es01）须先 Up healthy；首次登录需 `--init-superuser`。
- 风险：`Load term.freq FAIL!` 为词典缺失警告，不影响 RAG3 health；文档解析/task_executor 需另开 `start-task-executor.sh`。

### 反思与沉淀

- `strenum` 与 `memory` 均非 RAG3 自有依赖，而是 RAGFlow 0.25.6 基座在 monorepo 裁剪/迁移时的遗漏；后续从上游同步时应以 `comm` 对比顶层 Python 包目录。
- RAG3 模块（`router/`、`pipelines/` 等）仍零第三方依赖，health 可独立验证。

### 涉及文件

- `backend/ragflow_rag30/memory/` — 从上游补全 Memory 功能 Python 包
- `backend/ragflow_rag30/common/constants.py` 等 14 文件 — StrEnum 标准库迁移
- `backend/ragflow_rag30/pyproject.toml`、`uv.lock`、`scripts/*.sh` — uv 本地环境与启动
