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
