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

---

## 30. 知识库全量 API 对接：文档管理深化 + 分块/检索/日志

### 背景与目标

§27 仅完成 KB 列表/创建/删除与文档列表/上传。用户要求优化文档管理并接入知识库剩余可对接能力。目标是在 `VITE_USE_REAL_API=true` 下，将 RAGFlow `/api/v1/datasets/*` 与文档/chunk/search/ingestions 端点贯通，mock 仅保留无后端契约的 RAG3 治理与增强索引 Hub。

### 改动摘要

- **`kbApi` 扩展**：删文档、解析/停止、URL 导入、chunks 列表、dataset search、ingestions、index trace/run、预览 blob、KB update。
- **`useKbData` 扩展**：`useChunks`、`useIngestionLogs`、`useIndexTrace` 及文档/检索/设置 action 函数。
- **文档管理页**：API 模式表格列改为解析状态/Chunk/上传者；支持批量删除、批量解析、单文档菜单（解析/停止/下载/删除）、URL 导入弹窗；上传后自动提交 parse；解析队列由待解析/解析中文档派生。
- **分块预览**：`useChunks` 拉真实 chunks；重新分块走 re-parse。
- **解析预览面板**：API 模式左侧 chunk 列表 + iframe 原始文件预览（`fetchDocumentPreview`）。
- **索引状态**：由文档解析统计 + `traceIndex(graph/raptor)` 派生卡片；失败文档可重试 parse。
- **KB 概览**：API 模式隐藏治理 mock，展示运行状态入口；最近上传来自文档 API。
- **KB 配置**：基础信息（名称/描述/permission）`PUT /datasets/:id`。
- **检索测试**：`POST /datasets/:id/search` 替代五通道 mock。
- **处理日志**：`GET /datasets/:id/ingestions`；陈旧治理页 API 模式显示说明。

### 验证与风险

- `npm run build` 通过。
- 下载/预览须带 `Authorization`；外链 `downloadUrl` 不可用，已改为 blob 下载。
- GraphRAG/PageIndex/Wiki Hub、权限/数据源/导出仍为 mock，需在 UI 标注或后续接 RAG3 专用 API。

### 涉及文件

- `frontend/rag3-web/src/services/kbApi.ts`、`kbMappers.ts`
- `frontend/rag3-web/src/hooks/useKbData.ts`
- `frontend/rag3-web/src/pages/KnowledgeBase.tsx`、`KBExtra.tsx`、`KBGovernancePages.tsx`、`RetrievalTestPage.tsx`
- `frontend/rag3-web/src/components/kb/DocumentParsePreviewPanel.tsx`
- `frontend/rag3-web/README.md`

---

## 31. 知识库模型配置对接 RAGFlow LLM API

### 背景与目标

文档解析失败根因为租户 `embd_id` 为空（task_executor: `No default embedding model is set`），而 KB 配置页嵌入/LLM 下拉仍为 mock。需迁移 RAGFlow 模型配置能力：配置平台 API KEY、选择嵌入/对话/重排模型，并与创建 KB、保存 KB 设置打通。

### 改动摘要

- **Vite 代理**：新增 `/v1` → `9380`，贯通 `POST /v1/llm/set_api_key`、`GET /v1/llm/list` 等旧版 Web API。
- **`llmApi` + `useLlmData`**：`factories`、`list`、`my_llms`、`set_api_key`；租户默认模型 `GET/PATCH /api/v1/users/me/models`；`flattenLlmOptions` 产出 `model@factory` 选项。
- **`ModelProviderPanel`**：KB 配置新增「模型与 KEY」Tab——厂商选择 + API KEY/Base URL 保存、已配置厂商列表、租户默认嵌入/对话/重排模型保存；未配置嵌入时展示解析失败预警。
- **KB 配置/创建**：基础信息与解析分块页的嵌入模型下拉接真实 API；保存 KB 时传 `embedding_model`（须含 `@`）；创建向导自动继承租户默认模型，无嵌入时提示先去配置。

### 验证与风险

- `npm run build` 通过。
- 验证路径：登录 → 知识库 → 配置 →「模型与 KEY」→ 保存 DeepSeek/OpenAI 等 KEY → 选默认嵌入模型 → 创建 KB 或解析文档。
- `set_api_key` 会在线验证 KEY，失败时返回厂商错误信息；PATCH 租户模型要求 `embd_id` 等字段格式为 `name@factory` 且 KEY 已配置。
- KB 级 `llm_model`/`reranker` 仍主要走租户默认，RAGFlow dataset 更新契约暂不支持单独 rerank 字段。

### 反思与沉淀

- RAGFlow 双轨 API：`/api/v1`（REST）与 `/v1/llm`（Web 遗留）并存，前端须分别代理；`legacyApiRequest` 与 `apiRequest` 分离可避免路径混淆。
- 解析链路依赖租户级 `embd_id`，非仅 KB 级 `embedding_model`；UI 须引导用户先完成租户默认嵌入配置。

### 涉及文件

- `frontend/rag3-web/vite.config.ts` — `/v1` 代理
- `frontend/rag3-web/src/services/http.ts`、`llmApi.ts`
- `frontend/rag3-web/src/hooks/useLlmData.ts`
- `frontend/rag3-web/src/components/llm/ModelProviderPanel.tsx`、`LlmModelSelect.tsx`
- `frontend/rag3-web/src/pages/KBExtra.tsx`、`components/KBCreateDialog.tsx`
- `frontend/rag3-web/src/store.ts` — `KBSettingsTab` 增加 `models`

---

## 32. 文档管理与分块预览体验优化

### 背景与目标

文档解析已跑通后，文件管理页仍有操作菜单被表格 `overflow-hidden` 裁切、复选框与行点击冲突、预览入口依赖 PageIndex mock 等问题；分块页在 API 模式下短暂展示 mockChunks、表格块硬编码合同违约金数据。目标：API 模式下文档操作可点、布局不挡按钮、分块数据全走 RAGFlow chunks API。

### 改动摘要

- **`useChunks` / `useDocuments`**：API 模式空回退（不再闪 mock）；支持分页与 keywords 搜索；`mapChunkToUI` 保留全文、用 important_keywords 作标题。
- **`DocumentActionMenu`**：Portal + fixed 定位下拉，含预览/分块/解析/重解析/停止/下载/删除；点击外部或 Esc 关闭。
- **`DocumentPage`**：解析状态筛选、全选/批量解析、解析中队列 4s 轮询；表格区限高 + sticky 表头；已解析文档显示预览眼图标；预览区分栏；未解析文档可一键解析。
- **`ChunkPreviewPage`**：按 docId 精确加载、去除 mock 表格与质量条；真实内容展开/收起、分页与内容搜索；API 模式隐藏拆分/合并原型按钮。
- **`DocumentParsePreviewPanel`**：可选中分块、展示全文；下载改 blob + Authorization。

### 验证与风险

- `npm run build` 通过。
- 路径：知识库 → 文件 → 行末「⋯」菜单应完整可见；已解析文档点眼图标或菜单「解析预览」；分块页应显示真实 chunk 文本而非合同 mock。
- 分块编辑（拆分/合并/排除）仍仅 mock 模式；导出按钮已改为列表刷新。

### 涉及文件

- `frontend/rag3-web/src/hooks/useKbData.ts`、`services/kbMappers.ts`、`services/kbApi.ts`
- `frontend/rag3-web/src/components/kb/DocumentActionMenu.tsx`、`DocumentParsePreviewPanel.tsx`
- `frontend/rag3-web/src/pages/KnowledgeBase.tsx`
- `frontend/rag3-web/src/components/KBDetailLayout.tsx`

---

## 33. 分块拆分 / 合并 / 排除检索对接 RAGFlow API

### 背景与目标

分块预览页在 API 模式下仅有展示能力，拆分/合并/排除仍为 mock 按钮。RAGFlow 提供 `PATCH/POST/DELETE /datasets/:id/documents/:doc_id/chunks` 与批量 `available` 切换；需在 rag3-web 实现与上游一致的分块编辑闭环。

### 改动摘要

- **`kbApi`**：`getChunk`、`createChunk`、`updateChunk`、`deleteChunks`、`switchChunkAvailability`。
- **`splitKbChunk`**：GET 全文 → PATCH 原块为前半段 → POST 后半段为新块（重算 embedding）。
- **`mergeKbChunks`**：GET 相邻两块 → PATCH 合并内容 → DELETE 下一块。
- **`setKbChunkAvailability`**：`PATCH chunks` 批量设 `available`（0=排除检索，1=恢复）。
- **`ChunkSplitDialog`**：滑块选拆分点、双栏预览、最少 8 字/段校验。
- **`ChunkPreviewPage`**：API 模式启用拆分/合并↓/排除检索；`Chunk.available` 映射 `available_int`；解析预览面板同步排除切换。

### 验证与风险

- `npm run build` 通过。
- 路径：分块页 → 选块「拆分」确认 → 列表块数 +1；「合并↓」与下一块合并；「排除检索」后标签变红且可恢复。
- 合并仅限当前页相邻块；拆分/合并会触发后端重嵌向量，大文档可能略慢。

### 涉及文件

- `frontend/rag3-web/src/services/kbApi.ts`、`kbMappers.ts`、`types/index.ts`
- `frontend/rag3-web/src/hooks/useKbData.ts`
- `frontend/rag3-web/src/components/kb/ChunkSplitDialog.tsx`、`DocumentParsePreviewPanel.tsx`
- `frontend/rag3-web/src/pages/KnowledgeBase.tsx`

---

## 34. 修复 PDF 解析失败：补全 DeepDOC xgb 模型

### 背景与目标

用户上传 PDF 后状态变「失败」。`task_executor_0.log` 根因为 DeepDOC 初始化时缺少 `rag/res/deepdoc/updown_concat_xgb.model`，运行时从 HuggingFace 拉取 `InfiniFlow/text_concat_xgb_v1.0` 因网络/缓存失败（`LocalEntryNotFoundError`），与嵌入模型配置无关。

### 改动摘要

- 新增 `scripts/download-deepdoc-models.sh`：经 `hf-mirror.com` curl 下载模型至 `rag/res/deepdoc/`。
- `install.sh` / `start-task-executor.sh` 集成检查与安装提示。
- 本地已落盘 `updown_concat_xgb.model`（约 5.7MB）。
- 前端文档表失败行展示 `progress_msg` 末行，便于对照日志。
- `backend/README.md` 常见问题补充 PDF 解析与 embedding 两类失败处理。

### 验证与风险

- 需**重启 task_executor** 后对失败文档点「重新解析」或「批量解析」。
- 若下一步报 `No default embedding model`，仍需在「模型与 KEY」配置嵌入模型。
- 模型二进制不入库，新环境须执行 `download-deepdoc-models.sh`。

### 涉及文件

- `backend/ragflow_rag30/scripts/download-deepdoc-models.sh`、`install.sh`、`start-task-executor.sh`
- `backend/README.md`
- `frontend/rag3-web/src/services/kbMappers.ts`、`types/index.ts`、`pages/KnowledgeBase.tsx`

---

## 35. 文档解析日志、上传时间与分块 PDF 预览对齐 RAGFlow

### 背景与目标

用户要求 rag3-web 文档管理在解析进度、上传时间、文档切换预览与分块查询体验上对齐 RAGFlow 原生前端：展示带时间戳的 `progress_msg`、修复上传时间偏差、切换文档时 PDF 不残留、分块支持缩略图与 PDF 锚点高亮。

### 改动摘要

- **解析进度**：映射 `progress`/`process_begin_at`/`process_duration`；解析队列与状态列使用真实进度百分比；点击状态或「日志」打开 `ParseProgressLogModal`，`whitespace-pre-line` 展示多行日志并高亮 `[ERROR]`。
- **上传时间**：`tsToIso` 优先毫秒时间戳并兼容秒级；`formatRelativeTime` 改用 `Date.now()`；表格列展示 `formatDateTime` 绝对时间。
- **文档切换预览**：`KnowledgeChunkWorkspace`/`DocumentParsePreviewPanel` 以 `key={doc.doc_id}` 重置状态；切换时 revoke blob URL 并清空选中分块。
- **分块双栏**：新增 `KnowledgeChunkWorkspace`（左分块列表 + 右 PDF/内容预览）；`ChunkImage` 鉴权拉取 `/documents/images/{id}`；`PdfPreviewWithHighlights`（pdfjs-dist）按 `positions` 绘制高亮并滚动定位；`ChunkContentView` 支持 HTML 表格与图片。
- **分块页**：API 模式改用双栏工作区，保留拆分/合并/排除操作。

### 验证与风险

- `npm run build` 通过。
- 路径：文档管理 → 解析中文件点状态徽章看日志；切换文档预览应更新 PDF；分块页点击块应在 PDF 上出现高亮框。
- PDF 高亮坐标依赖后端 `positions` 与 page1 viewport 比例，非 PDF 仍走 iframe；pdfjs 增加 bundle 体积。

### 反思与沉淀

- 复刻 RAGFlow 时优先移植数据契约（`progress_msg` 原样展示、`positions` 五元组）再换 UI 壳，避免在前端重造时间戳解析。
- 图片 API 需 Authorization，不宜直接用 `<img src>`，统一 blob 拉取。

### 涉及文件

- `frontend/rag3-web/package.json` — pdfjs-dist、dompurify
- `frontend/rag3-web/src/utils/timeFormat.ts`、`documentUtil.ts`
- `frontend/rag3-web/src/components/kb/ParseProgressLogModal.tsx`、`ChunkImage.tsx`、`ChunkContentView.tsx`、`PdfPreviewWithHighlights.tsx`、`KnowledgeChunkWorkspace.tsx`
- `frontend/rag3-web/src/components/kb/DocumentParsePreviewPanel.tsx`
- `frontend/rag3-web/src/services/kbMappers.ts`、`kbApi.ts`、`types/index.ts`
- `frontend/rag3-web/src/pages/KnowledgeBase.tsx`

---

## 36. 修复 PDF 预览 getDocument 参数错误

### 背景与目标

分块页/解析预览加载 PDF 时报错 `getDocument - expected either data, range, or url parameter`。根因是 pdfjs-dist v6 不再接受字符串作为 `getDocument(url)` 首参，且 blob URL 在 worker 中偶发不兼容。

### 改动摘要

- `PdfPreviewWithHighlights`：先 `fetch(url)` 取 `ArrayBuffer`，再 `getDocument({ data })`。
- 增加 `url` 为空时的早期返回与错误提示。

### 验证与风险

- `npm run build` 通过。
- 路径：文档管理 → 解析预览 / 分块页，PDF 应正常渲染与高亮。

### 涉及文件

- `frontend/rag3-web/src/components/kb/PdfPreviewWithHighlights.tsx`

---

## 37. 优化分块列表审阅布局与图片放大预览

### 背景与目标

分块列表原先为紧凑按钮行，缩略图过小、信息层次弱，不便逐条审阅；图片无法放大查看细节。

### 改动摘要

- 新增 `ChunkListCard`：卡片式布局，顶栏展示序号/页码/类型/排除状态，正文 3~4 行预览 + 字数，有图时展示可点击缩略图。
- 新增 `ImageLightbox`：点击列表或详情区图片全屏放大，支持 Esc/点击空白关闭。
- 分块页侧栏加宽（`xl:w-96`），卡片间距加大；选中态 cyan 描边更明显。
- `ChunkContentView` 详情区图片同样支持点击放大。

### 验证与风险

- `npm run build` 通过。
- 路径：分块页 / 解析预览 → 左侧列表审阅卡片；点击图片应弹出灯箱。

### 涉及文件

- `frontend/rag3-web/src/components/kb/ChunkListCard.tsx`、`ImageLightbox.tsx`
- `frontend/rag3-web/src/components/kb/KnowledgeChunkWorkspace.tsx`、`ChunkImage.tsx`、`ChunkContentView.tsx`

---

## 38. 分块工作区左右对调：左 PDF 右列表（对齐 RAGFlow）

### 背景与目标

用户要求布局与 RAGFlow 一致：PDF 预览在左、分块列表在右；右侧点击分块后左侧 PDF 高亮定位。

### 改动摘要

- `KnowledgeChunkWorkspace` 重构为双栏：`flex-[2]` 左文档预览 + `flex-[3]` 右分块结果（对应 RAGFlow w-2/5 / w-3/5）。
- 左侧仅保留文档头与 PDF/iframe 预览，移除原右侧上方的选中块详情条。
- 右侧列表点击更新 `selectedChunkId` → `buildChunkHighlightRects` → 左侧 `PdfPreviewWithHighlights` 高亮并滚动。
- 选中块在右侧卡片下展开 `ChunkContentView` 全文；解析预览模式保留「排除检索」快捷按钮。

### 验证与风险

- `npm run build` 通过。
- 路径：分块页 / 文档解析预览 → 左 PDF、右列表；点不同分块应切换高亮框。

### 涉及文件

- `frontend/rag3-web/src/components/kb/KnowledgeChunkWorkspace.tsx`
- `frontend/rag3-web/src/components/kb/ChunkListCard.tsx`
- `frontend/rag3-web/src/pages/KnowledgeBase.tsx`

---

## 39. PDF 滚动懒加载与分块缩略图左右并排

### 背景与目标

用户反馈 PDF 不应在左栏全部铺开撑高页面，应在固定区域内滑动浏览；分块缩略图应贴在正文左右侧，不占独立整行。

### 改动摘要

- `PdfPreviewWithHighlights`：左栏 `overflow-y-auto` 滚动容器；IntersectionObserver 懒加载可见页；顶栏页码与上下页按钮；选中分块自动滚至对应页。
- `KnowledgeChunkWorkspace`：PDF 区 `min-h-0 overflow-hidden`，约束在左栏高度内滚动。
- `ChunkListCard` / `ChunkContentView`：正文 flex-1 + 右侧 72px 缩略图并排，点击仍可灯箱放大。

### 验证与风险

- `npm run build` 通过。
- 多页 PDF 在左栏内纵向滑动，未进视口页显示占位；分块卡片图文横排。

### 涉及文件

- `frontend/rag3-web/src/components/kb/PdfPreviewWithHighlights.tsx`
- `frontend/rag3-web/src/components/kb/KnowledgeChunkWorkspace.tsx`
- `frontend/rag3-web/src/components/kb/ChunkListCard.tsx`、`ChunkContentView.tsx`

---

## 40. 单文档预览统一固定高度滚动（PDF 虚拟列表）

### 背景与目标

用户要求 PDF 及其他单文档预览均为固定高度框内滑动浏览，避免一次性在 DOM 中铺开全部页面撑高布局。

### 改动摘要

- 新增 `DocumentScrollFrame`、`DocumentIframePreview`：非 PDF 在固定高度 iframe 内滚动。
- `PdfPreviewWithHighlights` 改为**虚拟滚动**：仅挂载视口±1 页 DOM，用 spacer 维持总滚动高度；滚出视口释放 canvas 缓存。
- 文档管理解析预览区固定 `min(560px, 48vh)`；分块工作区左栏 `h-full min-h-0` 约束。

### 验证与风险

- `npm run build` 通过。
- 多页 PDF 仅见少量页节点；快速滚动可能短暂「加载中」占位。

### 涉及文件

- `frontend/rag3-web/src/components/kb/DocumentScrollFrame.tsx`、`DocumentIframePreview.tsx`
- `frontend/rag3-web/src/components/kb/PdfPreviewWithHighlights.tsx`
- `frontend/rag3-web/src/components/kb/KnowledgeChunkWorkspace.tsx`
- `frontend/rag3-web/src/pages/KnowledgeBase.tsx`

---

## 41. PDF 单页预览修复铺开、锚点定位与切文档错位

### 背景与目标

用户反馈 §40 虚拟列表后仍出现三类问题：PDF 视觉上仍像整本铺开、点击分块后左侧高亮/翻页定位失效、切换文档时分块列表与 PDF 预览短暂错配。目标改为**单页渲染**（DOM 仅一张 canvas）、分块锚点可靠翻页并滚入视口，且切文档时不再展示上一文档的分块数据。

### 改动摘要

- `PdfPreviewWithHighlights`：放弃虚拟列表 spacer，改为顶栏翻页 + 仅渲染当前页；`useLayoutEffect` 在绘制前同步跳页，避免高亮与页码错帧；页内高亮按 scale=1 viewport 比例缩放；渲染完成后 `scrollTo` 将高亮区滚入容器视口。
- `KnowledgeChunkWorkspace`：`key={docId:previewUrl}` 强制 PDF 重挂载；`loading` 期间清空分块列表与高亮，避免旧文档 chunks 与新 PDF 并存；`selectedChunk` 仅在加载完成且 id 命中时取值。
- `useAsyncData`：依赖变更时先将 `data` 重置为 `fallback`，切断跨文档/跨页陈旧缓存。
- `buildChunkHighlightRects`：页码 `<=0` 时 +1，对齐后端 `extract_pdf_positions` 归一化。

### 验证与风险

- 验证：`cd frontend/rag3-web && npm run build` 通过。
- 手动：文档管理 → 解析预览 / 分块页 → 多页 PDF 左栏高度固定、仅见当前页；点不同分块应翻页并出现琥珀色高亮框；快速切换文档应短暂 loading、不应出现 A 文档分块 + B 文档 PDF。
- 风险：极宽/极高单页在窄屏下仍需容器内纵向滚动；与 RAGFlow `react-pdf-highlighter` 全页滚动体验不同，但避免撑破布局。

### 反思与沉淀

虚拟列表适合「连续阅读」，分块锚点场景更需要「当前页 + 坐标叠加」——视口外页未挂载时 `scrollTo` 与高亮层均失效。切文档错位本质是 **async 数据未在 refetch 起点清空** 的典型竞态，应在 hook 层统一 reset，而非每个消费组件各自兜底。

### 涉及文件

- `frontend/rag3-web/src/components/kb/PdfPreviewWithHighlights.tsx` — 单页渲染与锚点滚动
- `frontend/rag3-web/src/components/kb/KnowledgeChunkWorkspace.tsx` — 预览 key、blob 生命周期、loading 门禁
- `frontend/rag3-web/src/components/kb/DocumentScrollFrame.tsx` — 高度链 `max-h-full`
- `frontend/rag3-web/src/hooks/useKbData.ts` — refetch 时清空陈旧 data
- `frontend/rag3-web/src/utils/documentUtil.ts` — 页码归一化

---

## 42. 修复 PDF 预览空白并对齐 RAGFlow 滚动多页方案

### 背景与目标

§41 单页模式引入致命死锁：canvas 仅在 `pageLayout.width > 0` 后才挂载，而 `pageLayout` 又依赖 canvas 绘制，导致所有 PDF 预览空白。用户要求参考 RAGFlow 实现。目标恢复可见预览，并在固定高度容器内纵向滚动浏览全部页面，选中分块时滚至对应页高亮。

### 改动摘要

- `PdfPreviewWithHighlights`：改回**多页纵向堆叠 + 容器内 `overflow-y-auto`**（对齐 RAGFlow `PdfHighlighter` 行为）；canvas 在 PDF 加载完成后即挂载；`ResizeObserver` 按容器宽度缩放；选中分块 `scrollTo` 定位高亮区。
- 修复 §41 canvas 条件渲染死锁；`useLayoutEffect` + `renderTick` 确保 ref 就绪后再绘制。
- `useAsyncData`：`clearOnRefetch` 仅对 `useChunks` 开启，避免文档列表 refetch 时被误清空。

### 验证与风险

- `npm run build` 通过。
- 路径：解析预览 / 分块页 → PDF 应正常显示全部页，在左栏固定高度内滚动；点分块滚至高亮。
- 风险：页数极多的 PDF 会一次性渲染全部 canvas，可能较慢；后续可按视口懒加载优化。

### 反思与沉淀

RAGFlow 用 `react-pdf-highlighter` 的本质是「外层 `h-full min-h-0 overflow-auto` + 内层连续页面滚动」，而非压缩为单页。单页方案除省 DOM 外还要保证 canvas 与 layout 状态不互相依赖。UI 条件渲染 (`{pageLayout.width > 0 && <canvas/>}`) 参与渲染管线时需格外警惕循环依赖。

### 涉及文件

- `frontend/rag3-web/src/components/kb/PdfPreviewWithHighlights.tsx` — 多页滚动预览
- `frontend/rag3-web/src/hooks/useKbData.ts` — 分块 refetch 才清空 data

---

## 43. 修复 PDF 预览区无滚动条（flex 高度链）

### 背景与目标

PDF 已能渲染，但左栏预览区不出现滚动条，多页内容随容器撑高。根因是 flex 子项使用 `h-full` 未配合 `h-0`，高度随 PDF 内容增长，`overflow-y-auto` 永不触发。对齐 RAGFlow `flex-1 h-0 min-h-0` 模式贯通整条预览高度链。

### 改动摘要

- 预览链路统一 `flex-1 h-0 min-h-0 overflow-hidden`：`DocumentParsePreviewPanel` 包裹层、`KnowledgeChunkWorkspace` 根与左栏、`DocumentScrollFrame`、`PdfPreviewWithHighlights`。
- 滚动容器改为 `h-full min-h-0 overflow-y-auto overscroll-contain`。
- 解析预览外框 `h-[min(560px,48vh)]`；分块页工作区 `flex-1 h-0`。

### 验证与风险

- `npm run build` 通过。
- 多页 PDF 左栏应出现纵向滚动条，在固定高度框内浏览；外层页面不应被 PDF 撑高。

### 涉及文件

- `frontend/rag3-web/src/components/kb/PdfPreviewWithHighlights.tsx`
- `frontend/rag3-web/src/components/kb/KnowledgeChunkWorkspace.tsx`
- `frontend/rag3-web/src/components/kb/DocumentScrollFrame.tsx`
- `frontend/rag3-web/src/components/kb/DocumentParsePreviewPanel.tsx`
- `frontend/rag3-web/src/pages/KnowledgeBase.tsx`

---

## 44. 分块预览页同步 PDF 固定高度滚动布局

### 背景与目标

文档列表「解析预览」左栏 PDF 滚动已修复，但 `kb-chunks` 分块预览页仍用平铺 `p-6 gap-4` 布局，未贯通 `flex-1 h-0 min-h-0` 高度链，PDF 与分块列表无法各自滚动。

### 改动摘要

- `ChunkPreviewPage`：根 `h-full min-h-0 overflow-hidden`；工具栏 `flex-shrink-0`；工作区双层 `flex-1 h-0` 包裹 `KnowledgeChunkWorkspace`。
- `KnowledgeChunkWorkspace` 右栏：`flex-1 h-0 overflow-y-auto`；stack 布局右栏同步约束。

### 验证与风险

- `npm run build` 通过。
- 文档 → 分块：左 PDF 框内滚动、右列表独立滚动，与解析预览一致。

### 涉及文件

- `frontend/rag3-web/src/pages/KnowledgeBase.tsx`
- `frontend/rag3-web/src/components/kb/KnowledgeChunkWorkspace.tsx`

---

## 45. 检索测试 Phase 1：RAGFlow 真实 API 可用化

### 背景与目标

检索测试在 API 模式下仅调用 `POST /datasets/:id/search` 却伪造五通道 WRRF，与 §10.5 架构及 RAGFlow 契约不符。Phase 1 目标：在现有 RAGFlow search 上做到参数真实、分路诚实、精排可对比，不可用通道明确降级。

### 改动摘要

- 新增 `retrievalTestApi.ts`：`buildRealRetrievalResult` 从 `vector_similarity` / `term_similarity` 派生向量/BM25 分路；`use_kg` 对应 GraphRAG 分路；混合列表作「混合检索」Tab。
- `kbApi.searchDataset` 扩展 `use_kg`、`rerank_id`；`keyword` 默认 false（与 RAGFlow 一致）。
- `RetrievalTestPage` API 模式：向量权重滑条、关键词增强、知识图谱开关；Rerank 读租户 `rerank_id`；精排前后双请求对比；PageIndex/Wiki 置灰提示；Chunk 跳转 `kb-chunks`。
- `mapSearchHitToFusion` 补充 `doc_id`、分项相似度；命中卡片 API 模式显示 Similarity 而非 WRRF。

### 验证与风险

- `npm run build` 通过。
- `VITE_USE_REAL_API=true` → 检索测试 → 执行混合检索：分路见向量/BM25 不同排序；开 Rerank 后精排前后应不同；查看 Chunk 跳转分块页。
- 风险：GraphRAG 分路依赖 `knowledge_graph_kwd` 字段，无 KG 块时展示混合 Top 子集；WRRF/PageIndex/Wiki 仍待 Phase 2 RAG3 API。

### 涉及文件

- `frontend/rag3-web/src/pages/RetrievalTestPage.tsx`
- `frontend/rag3-web/src/utils/retrievalTestApi.ts`
- `frontend/rag3-web/src/services/kbApi.ts`、`kbMappers.ts`
- `frontend/rag3-web/src/data/retrievalTestMock.ts`

---

## 46. 修复检索 Rerank 报错 KeyError text 与精排降级

### 背景与目标

开启 Rerank 检索时后端 `QWenRerank` 在 DashScope 返回非 200 时访问 `resp.text`（不存在），抛出 `KeyError: 'text'` 掩盖真实 API 错误；前端精排请求失败导致整次检索报错。

### 改动摘要

- `rerank_model.py`：新增 `_dashscope_error_detail`，错误信息改读 `message`/`code`；Rerank 文档截断至 3000 字符。
- `dataset_api.py`：`ValueError` 透传为 API message，不再统一 Internal server error。
- `RetrievalTestPage`：精排请求失败时保留混合检索结果并 toast 提示检查 Rerank API Key。

### 验证与风险

- 重启 `ragflow_rag30` API 后，开启 Rerank：若 DashScope 仍失败，应看到明确 message 而非 KeyError；混合检索仍可返回。
- 根因若为未配置通义 Rerank API Key，需在系统管理 → 模型管理补全。

### 涉及文件

- `backend/ragflow_rag30/rag/llm/rerank_model.py`
- `backend/ragflow_rag30/api/apps/restful_apis/dataset_api.py`
- `frontend/rag3-web/src/pages/RetrievalTestPage.tsx`

---

## 47. Rerank KeyError text 根因加固与服务重启

### 背景与目标

用户开启精排后仍见 `KeyError: 'text'`，混合检索正常。根因是 DashScope `DictMixin` 无 `.text` 字段，且 `getattr(resp, "text")` / `resp.text` 会走 `__getattr__` 直接 KeyError；API 进程 PID 81785 自 8:33 起未重启，修复代码未加载。Traceback 行号与当前源码错位（旧字节码 + 新行号）造成误判。

### 改动摘要

- `QWenRerank`：统一用 `_dashscope_dict_get` / `_dashscope_resp_ok` 判断 HTTP 与 body `code`、是否有 `output.results`；错误信息只读 `message`/`code`；文档强制 `str` 并截断 3000 字。
- 同步修复遗留副本 `llm/rerank_model.py`（仍含 `resp.text`）。
- `log_exception`：DashScope 响应用 `.get("message")` 替代 `getattr(..., "text")`。
- `search.py`：移除 `rerank_by_model` DEBUG print。
- 已重启 `ragflow_server`（新 PID），加载上述改动。

### 验证与风险

- 重启后开启 Rerank：失败时应返回 `ValueError` 明文（如 InvalidApiKey），不再 KeyError。
- 若 DashScope 业务失败但 HTTP 200 且无 results，同样走明确错误路径。
- 精排仍依赖租户通义 Rerank API Key 与模型名配置正确。

### 反思与沉淀

- 对 DashScope SDK 响应对象：禁用 `getattr(x, key, default)` 与 `.text`；一律 `resp.get(key, default)`。
- 后端 Python 热改不生效，改 `rag/llm` 后必须重启 `ragflow_server`。

### 涉及文件

- `backend/ragflow_rag30/rag/llm/rerank_model.py`
- `backend/ragflow_rag30/llm/rerank_model.py`
- `backend/ragflow_rag30/common/log_utils.py`
- `backend/ragflow_rag30/rag/nlp/search.py`

---

## 48. 修复检索测试「精排前后」Tab 有结果却不展示

### 背景与目标

用户已开启 Rerank（`gte-rerank@Tongyi-Qianwen`），混合检索有数据，但「精排前后」仅显示「请开启 Rerank…」占位。根因是 UI 条件 `fusionReranked.length > 0` 过严：精排请求失败或未发起时 `post=null`，`fusionReranked` 为空，连精排前的 `fusion` 也被隐藏。

### 改动摘要

- `RetrievalTestPage`：新增 `RerankComparePanel`；只要有 `fusion` 即展示左右对比。
- 精排失败：左侧精排前结果，右侧展示 API 错误详情（`rerankMeta.error`）。
- `buildRealRetrievalResult` 透传 `rerankMeta: { attempted, error }`。

### 验证与风险

- `npm run build` 通过。
- 精排成功：左右两列均有卡片；精排失败：左列有数据、右列 amber 错误框。
- 若右列仍报错，需继续排查后端 DashScope Rerank 配置（与 §47 独立）。

### 涉及文件

- `frontend/rag3-web/src/pages/RetrievalTestPage.tsx`
- `frontend/rag3-web/src/utils/retrievalTestApi.ts`
- `frontend/rag3-web/src/data/retrievalTestMock.ts`

---

## 49. 刷新页面保留导航位置（Hash 路由）

### 背景与目标

刷新后总回到首页：导航仅存于 `store` 内存态，`buildInitialState()` 对已登录用户固定 `page: 'home'`，URL 无页面信息，F5 即丢失知识库/检索测试等上下文。

### 改动摘要

- 新增 `navigationUrl.ts`：`#/page?kb=&doc=&conv=&kbTab=&monitorTab=` 序列化/解析。
- `navigate` 时 `history.pushState` 写入 hash；启动与登录时从 hash 恢复；`popstate`/`hashchange` 支持浏览器后退。
- 未登录时保留 hash 参数，登录后跳回目标页而非强制首页。

### 验证与风险

- `npm run build` 通过。
- 进入「检索测试」后地址栏应出现 `#/kb-retrieval-test?kb=<id>`，刷新仍停留该页。
- 风险：页面内 Tab/表单状态（如检索结果）仍不持久化，仅恢复路由级位置。

### 反思与沉淀

- 原型期可用 hash 路由零依赖落地；后续可迁 React Router + pathname。
- 需与 `localStorage` 鉴权并存：有 token 时 hash 优先，无 token 时 hash 待登录后恢复。

### 涉及文件

- `frontend/rag3-web/src/navigationUrl.ts`（新建）
- `frontend/rag3-web/src/store.ts`

---

## 50. 文档上传配置：分块策略与增强索引（对齐 RAGFlow + RAG3 扩展）

### 背景与目标

文档上传后直接解析，无法选择分块策略（chunk_method）、GraphRAG、PageIndex、Wiki 等；与 RAGFlow 上传对话框及知识库设置页能力脱节。

### 改动摘要

- 新增 `DocumentUploadConfigDialog` / `DocumentUploadConfigPanel`：选文件后弹出配置（分块策略、token/分隔符、GraphRAG 模式、PageIndex/Wiki/RAPTOR、是否立即解析）。
- 默认配置从知识库 `parser_config` / `chunk_method` 预填；上传流程：`FormData parser_config + chunk_method` → `PATCH` 文档 → 可选 `parse`。
- 后端 `FileService.upload_document` 支持 `parser_config_override` 与 `chunk_method_override`（deep_merge）。
- URL 导入复用同一配置面板。

### 验证与风险

- `npm run build` 通过。
- 文档管理：拖拽/选择文件 → 弹出配置 → 确认后上传并解析；`parser_config.ext` 写入 `use_pageindex` / `use_wiki` / `rag3_pipelines`。
- PageIndex/Wiki 流水线触发仍依赖 RAG3 后端任务接入；当前先持久化配置契约。

### 涉及文件

- `frontend/rag3-web/src/data/documentUploadConfig.ts`（新建）
- `frontend/rag3-web/src/components/kb/DocumentUploadConfigDialog.tsx`（新建）
- `frontend/rag3-web/src/components/kb/DocumentUploadConfigPanel.tsx`（新建）
- `frontend/rag3-web/src/pages/KnowledgeBase.tsx`
- `frontend/rag3-web/src/services/kbApi.ts`、`hooks/useKbData.ts`
- `backend/ragflow_rag30/api/apps/restful_apis/document_api.py`
- `backend/ragflow_rag30/api/db/services/file_service.py`

---

## 51. 解析队列实时刷新与增强索引进度（GraphRAG / PageIndex / Wiki）

### 背景与目标

上传时勾选 LLM Wiki、PageIndex、知识图谱等配置后队列仅显示主解析进度，约 4s 才刷新一次，且 GraphRAG 从未真正触发（配置只写在文档级 `parser_config`，索引任务读知识库级配置且需 `POST /index`）。用户需要约 3s 轮询、分阶段进度条，以及各增强项的日志入口。

### 改动摘要

- 新增 `useParseQueuePolling`：每 **3s** 刷新文档列表，并 `traceIndex` 轮询 graph/raptor；向量解析完成后自动 `syncKbParserConfigFromUpload` + `runIndex`。
- 新增 `DocumentParseQueuePanel`：每文档展开多阶段（向量 / PageIndex / LLM Wiki / 知识图谱 / RAPTOR），独立进度条与「日志」按钮。
- `documentEnhancementStore` 记录上传批次与配置；`EnhancementLogModal` 展示 GraphRAG/RAPTOR 的 `progress_msg`。
- PageIndex/Wiki：配置写入后即标「已启用」（检索路由生效）；图谱/RAPTOR 展示真实任务进度。

### 验证与风险

- `npm run build` 通过。
- 文档管理：上传并勾选 Wiki+PageIndex+Graph → 队列每 3s 更新；向量完成后图谱阶段出现进度；点击日志可看 `progress_msg`。
- 风险：`runIndex` 为数据集级任务，多批次上传可能复用同一 graph 任务；PageIndex/Wiki 尚无独立 ingest API，进度为「配置就绪」语义而非构建任务。

### 反思与沉淀

- RAGFlow 增强索引与向量解析解耦：须同步 KB `parser_config` 并显式 `POST /datasets/:id/index?type=graph|raptor`。
- 后续可在 RAG3 后端为 pageindex/wiki 增加 ingest 任务与 trace API，替换当前「检索启用」占位进度。

### 涉及文件

- `frontend/rag3-web/src/hooks/useParseQueuePolling.ts`（新建）
- `frontend/rag3-web/src/components/kb/DocumentParseQueuePanel.tsx`（新建）
- `frontend/rag3-web/src/components/kb/EnhancementLogModal.tsx`（新建）
- `frontend/rag3-web/src/data/documentEnhancementStore.ts`（新建）
- `frontend/rag3-web/src/hooks/useKbData.ts`
- `frontend/rag3-web/src/services/kbApi.ts`
- `frontend/rag3-web/src/pages/KnowledgeBase.tsx`
- `frontend/rag3-web/src/utils/documentUtil.ts`

---

## 52. RAG3 PageIndex / LLM Wiki 真实 ingest 与 trace API

### 背景与目标

§51 中 PageIndex / Wiki 仅显示「配置已启用」占位进度，无真实构建任务；用户需要与 GraphRAG 同级的 ingest 进度与日志，且检索通道应能读到构建产物。

### 改动摘要

- 后端新增 `rag3/index_service.py`：从 ES 拉取文档分块，构建 PageIndex 树（按页节点）与 Wiki 条目，产物存 Redis；异步任务状态可 `trace`。
- `rag3_app` 暴露 `POST/GET /v1/rag3/datasets/:id/index?type=pageindex|wiki`（可选 `doc_ids` 限定批次文档）。
- `PageIndexPipeline` / `WikiPipeline` 优先检索 Redis 产物，无产物时回退 mock。
- 前端 `kbApi.runRag3Index` / `traceRag3Index`；轮询与队列面板接入真实 pageindex/wiki 进度与 `progress_msg` 日志。

### 验证与风险

- `npm run build` 通过；`python -c "from rag3.index_service import ..."` 通过。
- 上传勾选 PageIndex+Wiki → 向量完成后队列显示构建进度；`GET /api/v1/rag3/datasets/:id/index?type=pageindex` 返回 `progress`/`progress_msg`。
- 风险：任务状态仅存 Redis（无 DB 字段）；服务重启后 trace 可能丢失但产物仍在；需**重启 ragflow_server** 加载新路由。

### 反思与沉淀

- RAG3 增强索引与 RAGFlow 原生 graph/raptor 解耦，走 `/v1/rag3/*` 避免改 `dataset_api` 枚举；后续可接真实 PageIndex 服务替换树构建逻辑。
- Wiki 按库合并条目，重复 doc 构建会 upsert 同 id 条目。

### 涉及文件

- `backend/ragflow_rag30/rag3/index_service.py`（新建）
- `backend/ragflow_rag30/api/apps/rag3_app.py`
- `backend/ragflow_rag30/pipelines/pageindex_pipeline.py`
- `backend/ragflow_rag30/pipelines/wiki_pipeline.py`
- `frontend/rag3-web/src/services/kbApi.ts`
- `frontend/rag3-web/src/hooks/useKbData.ts`
- `frontend/rag3-web/src/hooks/useParseQueuePolling.ts`
- `frontend/rag3-web/src/components/kb/DocumentParseQueuePanel.tsx`
- `frontend/rag3-web/src/pages/KnowledgeBase.tsx`

---

## 53. 多格式文档预览 + Hub 保留 KB 菜单 + PageIndex/图谱/Wiki 真实 API

### 背景与目标

分块工作区仅 PDF 有高亮预览，Excel 等只能 iframe 空白；进入 PageIndex/知识图谱/Wiki Hub 后左侧知识库子菜单消失；三个 Hub 仍用 mock 数据，与已实现的 RAG3 index / RAGFlow graph API 脱节。

### 改动摘要

- **多格式预览**：`DocumentMultiFormatPreview` 按扩展名分流 PDF / 图片 / Excel（xlsx 库解析表格）/ CSV / 文本 / Markdown；Office 回退分块 HTML 表格；`KnowledgeChunkWorkspace` 统一接入。
- **Hub 布局**：`HubKBLayout` 外包 `KBDetailLayout`，PageIndex/Graph/Wiki Hub 保留 `KBSubNav`；解析预览跳转改为 `kb-documents?doc=`。
- **后端 Hub API**：`GET pageindex/documents`、`GET .../tree`、`POST pageindex/search`；`GET wiki/entries`、`POST wiki/search`（基于 `rag3/index_service` Redis 产物）。
- **前端 Hub 数据层**：`hubApi` + `useEnhancementHubData`（PageIndex/Graph/Wiki）；API 模式下文档列表、树结构、图谱节点、Wiki 条目来自真实接口；Graph 接 `GET /datasets/:id/graph` 与 `use_kg` 检索。

### 验证与风险

- `npm run build` 通过；`python -c "from rag3.index_service import list_pageindex_documents"` 通过。
- 分块页上传 xlsx → 左侧应显示表格预览；KB 内点 PageIndex 左侧菜单仍在；副标题带「· API」表示真实数据。
- 风险：PageIndex 树仍为分块启发式建树（非外部 PageIndex 包）；Graph 可视化节点坐标为 API 数据简单排布；需重启后端加载新路由。

### 反思与沉淀

- Hub 与 KB 子导航应同屏：增强索引是 KB 能力延伸，不应独立全屏壳。
- 预览能力与 RAGFlow 对齐可逐步引入 `@js-preview/excel`、mammoth；当前 xlsx 表格预览已覆盖主路径。

### 涉及文件

- `frontend/rag3-web/src/components/kb/DocumentMultiFormatPreview.tsx`（新建）
- `frontend/rag3-web/src/components/HubKBLayout.tsx`（新建）
- `frontend/rag3-web/src/services/hubApi.ts`、`hooks/useEnhancementHubData.ts`（新建）
- `frontend/rag3-web/src/pages/Hub/*.tsx`
- `backend/ragflow_rag30/rag3/index_service.py`、`api/apps/rag3_app.py`

---

## 54. 集成 VectifyAI PageIndex SDK（pip install pageindex）

### 背景与目标

RAG3 PageIndex 建树此前为按页码分组 chunk 的启发式 mock，与 VectifyAI 官方「无向量、树索引 + 推理检索」能力脱节。用户要求接入 `pip install pageindex` 官方包，使上传勾选 PageIndex 后能用真实 SDK 建树与检索。

### 改动摘要

- **依赖**：`pyproject.toml` 增加 `pageindex>=0.2.8`（VectifyAI Python SDK，云 API `PageIndexClient`）。
- **集成模块** `rag3/pageindex_integration.py`：
  - 读取 `PAGEINDEX_API_KEY`；从 MinIO 拉取 PDF → `submit_document` → 轮询 `is_retrieval_ready` → `get_tree`；
  - `normalize_pageindex_tree` 将 API 的 `nodes/sub_nodes` 规范为 Hub 使用的 `root.children` 格式，并保存 `pageindex_doc_id`、`source`；
  - 检索优先 `submit_query` + `get_retrieval`，失败或无 key 时回退关键词匹配。
- **`index_service._run_build`**：配置 API key 且文档为 PDF 时走 SDK；否则保留启发式建树并标注 `source=heuristic`。
- **说明**：当前 pip 包为云 SDK（非 GitHub 自托管 `page_index()`）；本地 PDF 解析建树需 `PAGEINDEX_API_KEY`（https://dash.pageindex.ai/api-keys）。

### 验证与风险

- `.venv/bin/python3 -c "from rag3.pageindex_integration import ..."` 通过；树规范化单测断言通过。
- 配置 `PAGEINDEX_API_KEY` 后上传 PDF 并触发 pageindex 构建 → 日志应出现「使用 PageIndex SDK 建树」；Hub 树 API 返回 `source: pageindex_cloud`。
- 未配置 key 时行为与 §53 一致（启发式建树），无破坏性变更。
- 风险：云 API 轮询最长 600s，大 PDF 构建耗时；非 PDF 仍走启发式；需重启 `ragflow_server` 并 `pip/uv sync` 安装新依赖。

### 反思与沉淀

- pip 包 0.2.8 仅导出 `PageIndexClient`，开源本地 `page_index()` 在 GitHub 仓库；后续可按租户 LLM key 接自托管路径。
- 产物 Redis 键不变，前端 `mapTreeNode` 无需改；`source` 字段可供 Hub 展示构建来源。

### 涉及文件

- `backend/ragflow_rag30/rag3/pageindex_integration.py`（新建）
- `backend/ragflow_rag30/rag3/index_service.py`
- `backend/ragflow_rag30/pyproject.toml`

---

## 55. 修复 RAG3 PageIndex API 404 导致建树从未触发

### 背景与目标

用户已配置 `PAGEINDEX_API_KEY` 并上传 PDF，Hub 仍显示 PageIndex 未生成。排查发现前端请求 `/api/v1/rag3/*` 返回 404，构建任务从未入队；且 404 被静默吞掉后批次标记为已触发，无法重试。

### 改动摘要

- **路由**：`rag3_app` 主注册前缀改为 `/api/v1/rag3`（与 `apiRequest`、vite `/api` 代理一致），保留 `/v1/rag3` 兼容。
- **前端**：解析队列触发增强索引失败时不再 `markBatchIndexTriggered`，控制台输出错误，允许下一轮轮询重试。
- **建树**：PageIndex 云 SDK 路径不再强制先有 ES 分块（PDF 直传云 API）；启发式回退仍要求分块。

### 验证与风险

- `curl http://localhost:9380/api/v1/rag3/health` 返回 `code:0`。
- 重启 `ragflow_server` 并导出 `PAGEINDEX_API_KEY` 后，上传 PDF 勾选 PageIndex → 向量解析完成后应能 `POST /api/v1/rag3/datasets/:id/index?type=pageindex`。
- 风险：云建树耗时可达数分钟；非 PDF 仍依赖分块启发式。

### 反思与沉淀

- RAGFlow 存在 `/api/v1`（REST）与 `/v1`（旧 Web API）双前缀；RAG3 扩展应挂在 `/api/v1/rag3` 而非仅 `/v1/rag3`。
- 前端内存 `documentEnhancementStore` 刷新会丢批次状态，已解析文档需在 Hub 手动点「构建」或重新上传。

### 涉及文件

- `backend/ragflow_rag30/api/apps/__init__.py`
- `frontend/rag3-web/src/hooks/useParseQueuePolling.ts`
- `backend/ragflow_rag30/rag3/index_service.py`

---

## 56. PageIndex Hub 树搜索高亮、对话测试与 API 对接补全

### 背景与目标

单文档树调试已有真实检索 API，但搜索命中后树节点无高亮/自动展开，「在对话中测试」仍为 mock toast；概览/建树队列/统计/设置等 Tab 混用 `PAGEINDEX_*` 常量，API 模式下数据不一致。

### 改动摘要

- **树高亮**：`IndexTreeNode` 支持 `highlightId` + `expandPathIds`；`focusTreeNode` 在树搜索后琥珀色脉冲高亮并展开祖先路径。
- **对话测试**：`pageIndexChatPrefill` + `Chat.tsx` 消费 sessionStorage；库级/单文档「在对话中测试」跳转 `#/chat` 并预填 KB、查询、文档名。
- **API 对接**：`usePageIndexHubData` 暴露 `trace` 并建树进行中 3s 轮询；概览/文档列表/建树队列用真实 stats、documents、trace；触发/批量/重试建树走 `runBuild`。
- **仍 mock（已标注）**：统计 Tab 全量指标、建树设置持久化、PDF bbox 预览页、失败原因分布细项、FinanceBench 基准文案——待 metrics/settings API。

### 验证与风险

- `npm run build` 通过。
- 单文档调试 → 执行树搜索 → 命中节点琥珀高亮；点「在对话中测试」→ 对话页预填查询。
- 风险：真实树无 bbox 时右侧预览仍为示意页；对话页 RAG 应答仍为 mock 样本匹配，非 `/rag3/query` 真流。

### 反思与沉淀

- Hub 检索与对话测试应共用 query + kbId 契约，后续可接 `POST /rag3/query` 并展示 PageIndex channel hits。
- 建树队列可从 `trace.progress_msg` 解析多行日志展示流水线，替代静态 `PAGEINDEX_BUILD_QUEUE`。

### 涉及文件

- `frontend/rag3-web/src/pages/Hub/PageIndexHubPage.tsx`
- `frontend/rag3-web/src/hooks/useEnhancementHubData.ts`
- `frontend/rag3-web/src/pages/Chat.tsx`
- `frontend/rag3-web/src/utils/pageIndexTreeUtils.ts`（新建）
- `frontend/rag3-web/src/utils/pageIndexChatPrefill.ts`（新建）

---

## 57. PageIndex Hub 全量落地：统计/设置/真 PDF/对话 RAG

### 背景与目标

用户要求「都实现」：统计 Tab、建树设置持久化、真实 PDF 预览、失败分布、周建树图、对话真 RAG（`/rag3/query`）、MCTS 模式、增强搜索 steps 等全部接线，去掉 API 模式下的「演示数据」横幅。

### 改动摘要

- **后端 Hub 服务**：`pageindex_hub_service.py` 提供 Redis 设置 `rag3:pageindex:settings:{kb}`、检索/建树指标 `rag3:pageindex:metrics:{kb}`；`index_service.search_pageindex_library` 支持 `doc_id`、`mode`（`llm_prompt`/`mcts_hybrid`），返回 `steps`、`total_ms` 并记录 metrics；建树成功/失败调用 `record_pageindex_build`；文档列表补 `fail_reason`、`toc_source`、`tree_depth`。
- **RAG3 API**：`GET/PUT .../pageindex/settings`、`GET .../pageindex/analytics`；增强 `POST .../pageindex/search`；`POST /rag3/query` 支持 `pipeline_ids` 覆盖，返回 `answer`、`citations`、`channels`、`doc_id` 融合字段。
- **前端 Hub**：`hubApi` + `usePageIndexHubData` 接 settings/analytics/search(mode)；统计/设置 Tab 用真实 API；概览失败分布与周建树图来自 analytics；`HubDocumentPdfPreview` 在 API 模式用 `kbApi.fetchDocumentPreview` + `PdfPreviewWithHighlights` 滚到命中页；库级/单文档搜索传 MCTS 模式；队列「暂停」在 API 模式禁用。
- **对话**：`useRealApi` 时 `Chat.tsx` 调 `rag3Api.query`，预填可带 `pipelineIds: ['pageindex']`。

### 验证与风险

- `npm run build` 通过；`python -c "from rag3.index_service import search_pageindex_library"` 导入正常。
- 手动：Hub 统计 Tab 应显示检索后递增的 P50/P95；设置保存后刷新仍保留；单文档调试右侧加载真实 PDF；对话页发送预填查询应返回 fusion 拼接的 answer。
- 风险：真实 PageIndex 树多数无 bbox，预览仅滚到 `startPage`；FinanceBench 98.7% 仍为产品基准常量；队列暂停未实现后端能力。

### 反思与沉淀

- Hub 检索 metrics 与 `/rag3/query` 应共用 `search_pageindex_library` 记录逻辑，避免统计与调试数据分叉。
- 对话 answer 当前为检索片段拼接，未接 LLM 生成；后续可在 query 路径增加 summarization 步骤。

### 涉及文件

- `backend/ragflow_rag30/rag3/pageindex_hub_service.py` — 设置/metrics/analytics/steps
- `backend/ragflow_rag30/rag3/index_service.py` — 增强搜索、建树记录、文档字段
- `backend/ragflow_rag30/api/apps/rag3_app.py` — settings/analytics/search/query
- `backend/ragflow_rag30/fusion/rrf_fusion.py` — FusedHit 带 doc_id/metadata
- `backend/ragflow_rag30/pipelines/pageindex_pipeline.py` — 读取持久化 search_mode
- `frontend/rag3-web/src/services/hubApi.ts`、`api.ts` — 新 API 契约
- `frontend/rag3-web/src/hooks/useEnhancementHubData.ts` — analytics/settings/search
- `frontend/rag3-web/src/pages/Hub/PageIndexHubPage.tsx` — Stats/Settings/PDF 预览
- `frontend/rag3-web/src/pages/Chat.tsx` — 真 RAG 查询
- `frontend/rag3-web/src/utils/pageIndexChatPrefill.ts` — pipelineIds

---

## 58. 修复 PageIndex Hub OverviewTab analytics 空字段崩溃

### 背景与目标

Hub 概览 Tab 白屏，控制台 `OverviewTab` 报 `Cannot read properties of undefined (reading 'length')`。根因是 `PAGEINDEX_ANALYTICS` mock 缺少 `weeklyBuilds`、`failDist`，API 返回空 analytics 时 `hub.analytics.weeklyBuilds.length` 访问 undefined。

### 改动摘要

- `PAGEINDEX_ANALYTICS` 补齐 `weeklyBuilds`、`failDist`（复用 `PAGEINDEX_STATS`）。
- `mapAnalytics` 对 `weeklyBuilds`/`failDist` 增加 `PAGEINDEX_STATS` 回退。
- `OverviewTab`/`StatsTab` 对 analytics 字段做可选链与本地 fallback 变量，避免 `.length` 踩空。

### 验证与风险

- `npm run build` 通过；刷新 PageIndex Hub 概览/统计 Tab 应正常渲染。
- 风险：后端 analytics 部分字段缺失时仍显示 mock 回退值，需与真实 metrics 区分。

### 涉及文件

- `frontend/rag3-web/src/data/pageIndexMock.ts`
- `frontend/rag3-web/src/hooks/useEnhancementHubData.ts`
- `frontend/rag3-web/src/pages/Hub/PageIndexHubPage.tsx`

---

## 59. LLM Wiki Hub 全 Tab 对接 RAG3 真实 API

### 背景与目标

Wiki Hub 各 Tab 仍直接读 `WIKI_*` mock；`useWikiHubData` 虽调 `listWikiEntries`，页面未消费 trace/树/队列。需将 Ingest、浏览、搜索、编译触发接到 `/api/v1/rag3/datasets/:id/wiki/*`。

### 改动摘要

- **后端**：`list_wiki_hub_entries` 补 compiling/failed ingest、`related_slugs`、`primary_wiki_slug`；`search_wiki_library` 返回 `{query,hits,total,total_ms}`。
- **前端**：`useWikiHubData` 增 trace 轮询、动态目录树、编译队列；`WikiHubPage` 全 Tab 经 `WikiHubContext` 接 API。
- **检索测试**：Wiki/PageIndex 通道调 `hubApi.searchWiki/searchPageIndex`。

### 验证与风险

- `npm run build` 通过；Wiki Hub API 模式触发 Ingest 后队列应显示 trace 进度。
- 风险：编译设置/Git 审核仍为 UI mock；层级分布/周编译趋势无独立 API。

### 涉及文件

- `backend/ragflow_rag30/rag3/index_service.py`、`api/apps/rag3_app.py`
- `frontend/rag3-web/src/hooks/useEnhancementHubData.ts`
- `frontend/rag3-web/src/pages/Hub/WikiHubPage.tsx`、`wikiHubContext.tsx`
- `frontend/rag3-web/src/utils/wikiTreeUtils.ts`、`retrievalTestApi.ts`

---

## 60. Wiki settings/analytics 后端 + Hub/KBExtra 全量接线

### 背景与目标

§59 后 Wiki 编译设置 Tab、统计层级/周趋势仍用 mock；`KBExtra` 的 `WikiPage`/`WikiManagePage` 仍读本地常量。需补 Redis 持久化 settings/metrics、analytics API，并将 Hub 设置/统计 Tab 与 KB 侧 Wiki 浏览/管理页接到真实数据。

### 改动摘要

- **后端**：新增 `wiki_hub_service.py`（`get/save_wiki_settings`、`record_wiki_build/search`、`get_wiki_analytics`）；`index_service` 在 wiki 建树/检索时写 metrics；`rag3_app` 暴露 `GET/PUT .../wiki/settings`、`GET .../wiki/analytics`。
- **前端 Hook**：`useWikiHubData` 并行拉 entries + analytics，增 `loadSettings`/`saveSettings`、`analytics` 视图映射；新增 `useWikiManageData` 跨 KB 聚合 entries 与编译任务。
- **Wiki Hub**：`CompileSettingsTab` 读写 Redis 设置；`StatsTab` 展示检索 P50/P95、周检索量、失败分布。
- **KBExtra**：`WikiPage` 改用 `useWikiHubData`（条目/编译队列/触发 Ingest）；`WikiManagePage` 改用 `useWikiManageData`（跨库列表、任务、统计）。

### 验证与风险

- 验证：`npm run build` 通过；API 模式下 Wiki Hub「编译设置」保存后刷新应回显；`KBExtra` Wiki 页应显示真实条目或空态提示。
- 风险：Git 版本/编辑保存仍无后端；`reviewing` 状态条目后端暂未产出；跨 KB 管理页在 KB 列表为空时显示空表。

### 反思与沉淀

- Wiki analytics 与 PageIndex 共用「Redis metrics + 周桶」模式，前端 `mapWikiAnalytics` 对缺字段回退 `WIKI_STATS`，避免白屏。
- KB 侧 Wiki 与管理页复用 Hub 同一套 `hubApi`，避免第二套 mock 分叉。

### 涉及文件

- `backend/ragflow_rag30/rag3/wiki_hub_service.py` — settings/metrics/analytics
- `backend/ragflow_rag30/rag3/index_service.py`、`api/apps/rag3_app.py` — 路由与埋点
- `frontend/rag3-web/src/hooks/useEnhancementHubData.ts` — Wiki analytics/settings/manage
- `frontend/rag3-web/src/pages/Hub/WikiHubPage.tsx` — 设置/统计 Tab
- `frontend/rag3-web/src/pages/KBExtra.tsx` — WikiPage / WikiManagePage
- `frontend/rag3-web/src/services/hubApi.ts`、`data/wikiMock.ts` — API 与默认设置

---

## 61. 前端 dev 启动打印局域网 IP 并开放本机网卡访问

### 背景与目标

`npm run dev` 默认仅监听 localhost，手机/同网段设备无法用局域网 IP 访问；终端也未明确打印可分享的 Local IP。需在 `rag3-bolt-v1.5` 与 `frontend/rag3-web` 启动时绑定 `0.0.0.0` 并输出本机与局域网 URL。

### 改动摘要

- 两项目 `vite.config.ts` 增加 `server.host: true`（监听全部网卡）。
- 新增 `vite.printLocalIp.ts` 插件：服务 `listening` 后打印 `localhost` 与各非回环 IPv4 地址。
- bolt 原型默认端口改为 **5174**，与生产前端 **5173** 并行开发时不冲突。

### 验证与风险

- 验证：`npm run dev` 后终端应出现「本机访问」「局域网访问（Local IP）」及 Vite 自带 Network 行；同网段设备可用打印的 IP 打开页面。
- 风险：开发服暴露局域网需防火墙/公司网络策略允许；端口被占用时 Vite 会自动递增（bolt 可能非 5174）。

### 涉及文件

- `rag3-bolt-v1.5/vite.config.ts`、`vite.printLocalIp.ts`
- `frontend/rag3-web/vite.config.ts`、`vite.printLocalIp.ts`

---

## 62. 智能对话全功能 RAG3 原生 API 接入

### 背景与目标

智能对话 UI 已覆盖 PRD §4 三栏/设置/Trace/对比/纠错，但除薄层 `rag3/query` 外均为 mock。需按 RAG3 原生路线新建 `/api/v1/conversations/*`、增强 `/rag3/query` 为 Router→多通道→LLM 生成，并补齐 SSE 流式与前端 service 层。

### 改动摘要

- **后端**：`conversation_store`（Redis 会话/消息/设置/反馈）；`chat_service` + `generation_service` 编排；`conversations_api` CRUD/发消息/对比/反馈；`/rag3/query` 改调 `execute_chat_turn` 并加鉴权；新增 `/query/stream`、`/query/rewrite`、`/query/compare`；`vector_pipeline` 接真实检索；`fusion/reranker` 接 TenantLLM rerank。
- **前端**：`chatService` + `sseClient` + `useChatData`；`Chat.tsx` 接会话列表/多轮/真 SSE/设置持久化/对比/反馈/查询增强；`ChatSettingsPanel` KB 列表接 `useKnowledgeBaseList`。

### 验证与风险

- 验证：`npm run build` 通过；`python3 -m py_compile` 新模块通过；API 模式：登录后新建对话→流式问答→Trace 有通道数据→设置保存→赞/踩/对比。
- 风险：会话存 Redis 非 MySQL；LLM 未配置时回退模板答案；`/rag3/query` 现需登录（检索测试台需带 Authorization）。

### 反思与沉淀

- 统一 `execute_chat_turn` 供 conversations 与 rag3/query 复用，避免双轨逻辑分叉。
- SSE 事件与 PRD §4.2 对齐，前端 `postSseStream` 解析 `event:` 行而非 RAGFlow `data:{code}` 包装。

### 涉及文件

- `backend/ragflow_rag30/rag3/conversation_*.py`、`chat_service.py`、`generation_service.py`
- `backend/ragflow_rag30/api/apps/restful_apis/conversations_api.py`、`rag3_app.py`
- `backend/ragflow_rag30/fusion/reranker.py`、`pipelines/vector_pipeline.py`
- `frontend/rag3-web/src/services/chatService.ts`、`sseClient.ts`
- `frontend/rag3-web/src/hooks/useChatData.ts`、`pages/Chat.tsx`、`components/ChatSettingsPanel.tsx`
