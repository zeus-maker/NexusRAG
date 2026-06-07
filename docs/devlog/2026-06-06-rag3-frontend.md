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
