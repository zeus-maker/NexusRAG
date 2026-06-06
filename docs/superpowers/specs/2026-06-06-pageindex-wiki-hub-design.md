# PageIndex & LLM Wiki 双层 Hub 信息架构设计

> **文档编号**：FE-DESIGN-20260606-PI-WIKI
> **版本**：v1.0
> **编制日期**：2026年6月6日
> **状态**：已确认
> **关联文档**：`docs/prd/前端界面实现方案.md` §10.3 / §11.1 / §11.2 / §3.6 / §6.4 / §10.2

---

## 1. 背景与问题

v1.2 中 PageIndex 与 LLM Wiki 已有页面设计，但存在以下缺口：

| 问题 | 现状 | 影响 |
|------|------|------|
| Wiki 页面分散 | 浏览器、编译队列、编辑器、Git 为平级路由 | 缺少统一 Hub，Tab 导航不清晰 |
| PageIndex 仅单文档 | `/kb/:kbId/pageindex-tree` 只有单文档树调试 | 缺库级概览、文档列表、批量重建 |
| 平台管理员无跨库入口 | 索引状态仅在单库 §3.6 | 跨库巡检需反复切换知识库 |
| 顶层导航膨胀风险 | 若新增 `/wiki`、`/pageindex` 顶层模块 | 与「知识库」职责重叠，普通用户路径变差 |

**决策输入**：主要用户为 **C — 知识库管理员 + 平台管理员** 双角色。

---

## 2. 方案选型

### 2.1 候选方案

| 方案 | 描述 | 结论 |
|------|------|------|
| A | 仅 KB 子页延伸 | 不足，缺跨库运营 |
| B | 顶层独立模块 `/wiki` + `/pageindex` | 导航膨胀，不推荐 |
| **C（采纳）** | **库内 Hub 管理 + 全局运营看板** | ✅ 双角色兼顾 |

### 2.2 核心原则

```
┌─────────────────────────────────────────────────────────┐
│  库内管理域（知识库管理员）    │  全局运营域（平台管理员） │
├──────────────────────────────┼──────────────────────────┤
│  /kb/:kbId/wiki/*            │  首页 Widget              │
│  /kb/:kbId/pageindex/*       │  /system/monitor?tab=rag3 │
│  精细操作：编辑/编译/调试     │  跨库健康度/队列/告警      │
└──────────────────────────────┴──────────────────────────┘
```

- **管理在库内，监控在全局**
- 全局页只读聚合 + 深链回库内 Hub 处理
- 不新增顶层导航模块（保持七模块）

---

## 3. LLM Wiki Hub 设计

### 3.1 路由结构

```
/kb/:kbId/wiki
├── (index)                    → WikiHubPage，默认 Tab: browser
├── ?tab=browser               → 浏览器（§11.1.1）
├── /compile                   → 编译队列（§11.1.2）
├── /settings                  → 编译设置（§11.1.5）
├── /stats                     → 统计（§11.1.6）
├── /pages/:slug/edit          → 编辑器（§11.1.3）
└── /pages/:slug/history       → Git 版本（§11.1.4）
```

### 3.2 Hub 顶栏布局

```
┌─────────────────────────────────────────────────────────────────┐
│ 法务合同知识库 > Wiki 管理                                      │
├─────────────────────────────────────────────────────────────────┤
│ [浏览器] [编译队列 3] [编译设置] [统计]          [触发全量编译] │
├──────────┬──────────────────────────────────────────────────────┤
│ 目录树   │  Tab 内容区                                          │
│ Layer1/2/3│                                                     │
└──────────┴──────────────────────────────────────────────────────┘
```

### 3.3 编译设置 Tab（§11.1.5 新增）

| 配置项 | 说明 |
|--------|------|
| 触发策略 | 新文档自动编译 / 定时全量 / 手动 |
| LLM 模型 | 编译用模型选择 |
| 实体抽取阈值 | 控制实体页生成灵敏度 |
| 审核策略 | 引用率 > N% 需人工审核（默认 80%） |
| Git 分支 | main / experiment 分支策略 |

### 3.3.1 统计 Tab（§11.1.6）

展示已发布/待审核/编译中页面数、Wiki 命中率、高频页 Top10、编译成本与 Token 节省估算。

### 3.4 API 映射（增补）

| 操作 | 方法 | API 端点 |
|------|------|---------|
| 获取编译设置 | GET | `/api/v1/knowledge-bases/{kb_id}/wiki/settings` |
| 保存编译设置 | PUT | `/api/v1/knowledge-bases/{kb_id}/wiki/settings` |
| Wiki 统计 | GET | `/api/v1/knowledge-bases/{kb_id}/wiki/stats` |

---

## 4. PageIndex Hub 设计

### 4.1 路由结构

```
/kb/:kbId/pageindex
├── (index)                    → PageIndexHubPage，默认 Tab: overview
├── ?tab=overview              → 库级概览（§11.2.1，新增）
├── ?tab=documents             → 文档列表（§11.2.2，新增）
├── /documents/:docId          → 单文档树预览+调试（§11.2.3，自 §11.2 迁移）
└── /settings                  → 建树策略（§11.2.4，新增）
```

> **废弃路由**：`/kb/:kbId/pageindex-tree` → 301 重定向至 `/kb/:kbId/pageindex/documents/:docId` 或 Hub 概览。

### 4.2 库级概览 Tab（§11.2.1）

```
┌─────────────────────────────────────────────────────────────────┐
│ 法务合同知识库 > PageIndex 管理                                 │
├─────────────────────────────────────────────────────────────────┤
│ [概览] [文档列表] [建树设置]                    [批量重建]      │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ 已建树   │ │ 建树率   │ │ 平均深度 │ │ 失败     │           │
│ │ 85/156   │ │ 54.5%    │ │ 4.2 层   │ │ 12 文档  │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 文档列表 Tab（§11.2.2）

| 列 | 说明 |
|----|------|
| 文档名 | 链接至 `/documents/:docId` |
| 树深度 / 节点数 | 树结构指标 |
| 状态 | ✅ / ❌ / 建树中 |
| 操作 | [查看树] [调试] [重试] [跳过] |

### 4.4 单文档详情（§11.2.3）

保留 v1.2 §11.2 设计：左侧树结构预览 + 右侧树搜索调试 + bbox 高亮。

### 4.5 建树设置 Tab（§11.2.4）

| 配置项 | 说明 |
|--------|------|
| 目录识别 | 自动 / 手动 TOC 正则 |
| 最大树深度 | 默认 8 层 |
| 节点 Token 上限 | 默认 512 |
| 适用文档类型 | 合同/财报/论文等勾选 |
| 自动建树 | 新文档入库后自动触发 |

### 4.6 与 §3.6 索引状态页关系

| 页面 | 职责 |
|------|------|
| §3.6 索引状态 | 五维索引只读仪表盘（含 PageIndex / Wiki 进度卡片） |
| PageIndex Hub | 深入管理（文档列表、单文档调试、批量重建） |
| Wiki Hub | 深入管理（浏览、编译、审核、Git） |

**联动**：§3.6 卡片底部增加 `[管理 →]`，分别跳转 `/kb/:kbId/pageindex` 与 `/kb/:kbId/wiki`。

### 4.7 API 映射（增补）

| 操作 | 方法 | API 端点 |
|------|------|---------|
| 库级统计 | GET | `/api/v1/knowledge-bases/{kb_id}/pageindex/stats` |
| 文档列表 | GET | `/api/v1/knowledge-bases/{kb_id}/pageindex/documents` |
| 单文档树 | GET | `/api/v1/knowledge-bases/{kb_id}/pageindex/documents/{doc_id}/tree` |
| 树搜索调试 | POST | `/api/v1/knowledge-bases/{kb_id}/pageindex/search` |
| 批量重建 | POST | `/api/v1/knowledge-bases/{kb_id}/pageindex/rebuild` |
| 建树设置 | GET/PUT | `/api/v1/knowledge-bases/{kb_id}/pageindex/settings` |

---

## 5. 全局运营页设计

### 5.1 首页 Widget（§10.2 扩展）

```
┌─ RAG 3.0 增强索引运营 ─────────────────────────────────────┐
│ Wiki 编译中 12 │ 待审核 5 │ PageIndex 失败 8 │ [查看全部 →] │
└────────────────────────────────────────────────────────────┘
```

- 仅 `platform_admin` 或 `eval:read` 权限可见
- 「查看全部」→ `/system/monitor?tab=rag3-index`

### 5.2 系统监控 RAG3索引 Tab（§6.4 扩展）

```
│ [基础设施] [流水线] [RAG3索引] [成本]                           │
├─────────────────────────────────────────────────────────────────┤
│ 知识库       │ Wiki进度 │ PageIndex │ 图谱  │ 告警 │ 操作       │
│ 法务合同     │ 12/42    │ 85/156    │ 42/156│ 2    │ [进入库]   │
```

**深链规则**：

| 告警类型 | 跳转目标 |
|---------|---------|
| Wiki 编译/审核 | `/kb/:kbId/wiki/compile?status=failed` 或 `?status=pending_review` |
| PageIndex 失败 | `/kb/:kbId/pageindex/documents?filter=failed` |

### 5.3 全局 API 映射

| 操作 | 方法 | API 端点 |
|------|------|---------|
| 跨库索引聚合 | GET | `/api/v1/admin/index-status/aggregate` |
| 按库过滤 | GET | `/api/v1/admin/index-status/aggregate?kb_id=` |

---

## 6. 工程变更清单

### 6.1 侧栏（§10.3）

```
- PageIndex树  → /kb/:kbId/pageindex-tree
+ PageIndex    → /kb/:kbId/pageindex
  Wiki         → /kb/:kbId/wiki（Hub 入口不变）
```

### 6.2 页面组件（§1.2）

```
KnowledgeBase/
├── wiki/
│   ├── WikiHubPage.tsx
│   ├── WikiBrowserTab.tsx
│   ├── WikiCompileQueueTab.tsx
│   ├── WikiCompileSettingsTab.tsx
│   ├── WikiStatsTab.tsx
│   ├── WikiEditorPage.tsx
│   └── WikiHistoryPage.tsx
└── pageindex/
    ├── PageIndexHubPage.tsx
    ├── PageIndexOverviewTab.tsx
    ├── PageIndexDocListTab.tsx
    ├── PageIndexDocDetailPage.tsx
    └── PageIndexSettingsTab.tsx
```

### 6.3 路由增补（§12.3）

```typescript
{ path: ':kbId/wiki', element: <WikiHubPage />, children: [
    { index: true, element: <WikiBrowserTab /> },
    { path: 'compile', element: <WikiCompileQueueTab /> },
    { path: 'settings', element: <WikiCompileSettingsTab /> },
    { path: 'stats', element: <WikiStatsTab /> },
    { path: 'pages/:slug/edit', element: <WikiEditorPage /> },
    { path: 'pages/:slug/history', element: <WikiHistoryPage /> },
]},
{ path: ':kbId/pageindex', element: <PageIndexHubPage />, children: [
    { index: true, element: <PageIndexOverviewTab /> },
    { path: 'documents', element: <PageIndexDocListTab /> },
    { path: 'documents/:docId', element: <PageIndexDocDetailPage /> },
    { path: 'settings', element: <PageIndexSettingsTab /> },
]},
// 废弃兼容
{ path: ':kbId/pageindex-tree', element: <Redirect to="../pageindex" /> },
```

---

## 7. 实施优先级

| 优先级 | 任务 | 工期 |
|--------|------|------|
| P1 | PageIndex Hub（概览+文档列表+单文档详情迁移） | 1.5 周 |
| P1 | Wiki Hub Tab 容器 + 编译设置 | 1 周 |
| P1 | §3.6 卡片「管理→」深链 | 0.5 天 |
| P2 | 首页 Widget + 系统监控 RAG3 Tab | 1 周 |
| P2 | 全局聚合 API 对接 | 依赖后端 |

---

## 8. 不在范围内

- 顶层 `/wiki`、`/pageindex` 独立导航模块
- Wiki / PageIndex 跨库批量写操作（仅在库内执行）
- Memory / Skills 模块（P3）

---

> **审批记录**：用户于 2026-06-06 确认方案 C（双层 Hub）。
