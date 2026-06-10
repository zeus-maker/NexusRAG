# Devlog — 2026-06-08

> 接续 `2026-06-07-rag3-frontend.md` §57（PageIndex Hub 全量落地）。

## 1. 修复 PageIndex Hub OverviewTab analytics 空字段崩溃

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

## 2. LLM Wiki Hub 全 Tab 对接 RAG3 真实 API

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

## 3. Wiki settings/analytics 后端 + Hub/KBExtra 全量接线

### 背景与目标

§2 后 Wiki 编译设置 Tab、统计层级/周趋势仍用 mock；`KBExtra` 的 `WikiPage`/`WikiManagePage` 仍读本地常量。需补 Redis 持久化 settings/metrics、analytics API，并将 Hub 设置/统计 Tab 与 KB 侧 Wiki 浏览/管理页接到真实数据。

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

## 4. 前端 dev 启动打印局域网 IP 并开放本机网卡访问

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
