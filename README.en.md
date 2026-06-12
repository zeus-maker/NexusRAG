<div align="center">

# NexusRAG

**Enterprise RAG 3.0 hybrid architecture · Reliable retrieval · Professional chat · Powerful eval · Transparent ops**

Built on [RAGFlow](https://github.com/infiniflow/ragflow) deep document understanding, extended with PageIndex, LLM Wiki, four-classifier routing, and multi-channel fusion.

<br/>

[![License](https://img.shields.io/badge/License-NexusRAG%20Source%20Available-orange)](LICENSE)
[![Commercial](https://img.shields.io/badge/Commercial-Authorization%20Required-red)](COMMERCIAL-LICENSE.md)
[![RAGFlow](https://img.shields.io/badge/Upstream-RAGFlow%20Apache--2.0-blue)](THIRD-PARTY-NOTICES.md)
[![RAG 3.0](https://img.shields.io/badge/RAG-3.0-7c3aed?style=flat-square)](./docs/tech/5-企业级RAG知识库3.0实现方案.md)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](./backend/README.md)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](./frontend/rag3-web)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](./frontend/rag3-web)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](./frontend/rag3-web)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](./backend/README.md)

<br/>

[![Gitee Stars](https://gitee.com/zeus-maker/rag-turbo/badge/star.svg?theme=dark)](https://gitee.com/zeus-maker/rag-turbo/stargazers)
[![Gitee Forks](https://gitee.com/zeus-maker/rag-turbo/badge/fork.svg?theme=dark)](https://gitee.com/zeus-maker/rag-turbo/members)
[![GitHub Stars](https://img.shields.io/github/stars/zeus-maker/NexusRAG?style=social&label=Star)](https://github.com/zeus-maker/NexusRAG)
[![GitHub Forks](https://img.shields.io/github/forks/zeus-maker/NexusRAG?style=social&label=Fork)](https://github.com/zeus-maker/NexusRAG)
[![Last Commit](https://img.shields.io/github/last-commit/zeus-maker/NexusRAG?label=last%20commit)](https://github.com/zeus-maker/NexusRAG/commits/main)

> GitHub badges target the planned mirror `zeus-maker/NexusRAG`. Primary remote: [Gitee · rag-turbo](https://gitee.com/zeus-maker/rag-turbo)

<br/>

[Quick Start](#quick-start-full-stack-local) ·
[Highlights](#product-highlights) ·
[Architecture](#architecture) ·
[API Coverage](#api-integration-rag3-web) ·
[Docs](#documentation) ·
[License](#license) ·
[中文 README](./README.md)

</div>

> **Repo note**: Monorepo folder is `agentic-rag`; product brand is **NexusRAG** (RAG 3.0).  
> **Dev entrypoints**: [`frontend/rag3-web`](./frontend/rag3-web) + [`backend/ragflow_rag30`](./backend/ragflow_rag30) · UI prototype (read-only): [`web/rag3-bolt-v1.5`](./web/rag3-bolt-v1.5) · Conventions: [`CLAUDE.md`](./CLAUDE.md)

<p align="center">
  <img src="./docs/assets/nexusrag-overview.png" alt="NexusRAG product overview" width="920" />
</p>

---

## Product highlights

| | Reliable retrieval | Professional chat | Powerful evaluation | Transparent ops |
|---|:---:|:---:|:---:|:---:|
| **One-liner** | Grounded citations, instant KB switch | Markdown, clickable refs, thought chain | 8 tabs, full API, RAGAS loop | L1–L5 trace, OTLP export |
| **Capabilities** | Multi-channel search + threshold retry | Streaming, answer compare, chunk deep links | Datasets / runs / A/B / cost / route learning | Monitor dashboard, trace diagnostics, admin config |
| **UI entry** | Retrieval test bench | Smart chat | Evaluation center | System monitor · Traces |

**Closed loop**: Real ingestion → Smart chat → Eval feedback → Route/strategy tuning → Re-evaluate.

---

## Project snapshot (v1 baseline)

| Dimension | Metric | Notes |
|-----------|--------|-------|
| Frontend pages | **40+** routes | KB / Hubs / Chat / Eval / System admin |
| Real API domains | **10+** modules | KB, chat, Hubs, eval, admin, traces… |
| System admin | **16** sub-pages | `/v1/admin/*` tenant config + ops jobs |
| Evaluation center | **8** tabs | `/v1/eval/*` RAGAS runs & datasets |
| Retrieval channels | **5** paths | Vector · BM25 · PageIndex · GraphRAG · Wiki |
| Pipeline layers | **L1–L5** | Classify → Route → Retrieve → Fuse → Generate |

---

## Core capabilities

| Capability | Description |
|------------|-------------|
| Four-classifier routing | Query Tier / Doc Type / User Intent / Security → pipeline matrix (L1–L2) |
| Five-channel retrieval | Vector, BM25, PageIndex, GraphRAG, LLM Wiki in parallel (L3) |
| Hybrid fusion | Weighted RRF + Cross-Encoder rerank (L4) |
| Enhanced indexing | GraphRAG, PageIndex, LLM Wiki ingest & Hub management |
| Smart chat | RAG3 streaming chat, query trace, answer comparison, citation navigation |
| Evaluation center | RAGAS runs, datasets, A/B tests, satisfaction, cost, route learning |
| System admin | 16 modules: pipeline, classifier, fusion, strategies, monitor, traces, ops |
| Observability | QueryLog aggregation, L1–L5 trace tree, OTLP export, monitor dashboard |

Architecture spec (Chinese): [`docs/tech/5-企业级RAG知识库3.0实现方案.md`](./docs/tech/5-企业级RAG知识库3.0实现方案.md)

---

## Architecture

```
Browser
    ↓
frontend/rag3-web          React 18 + Vite + TypeScript + Tailwind
    ↓  /api/v1/*  (dev proxy → :9380)
backend/ragflow_rag30      Quart/Flask · api/ragflow_server.py
    ├─ router/              Four classifiers + routing engine
    ├─ pipelines/           Vector / PageIndex / Graph / Wiki / Tool
    ├─ fusion/              RRF + Cross-Encoder
    ├─ security/            Chunk ACL, injection defense
    ├─ rag3/                Chat, eval, trace, system config, Hub services
    ├─ rag/ deepdoc/ agent/ graphrag/   RAGFlow reused modules
    └─ api/apps/            REST auto-registration (@manager.route)
         ├─ rag3_app.py              /v1/rag3/*
         ├─ restful_apis/admin_api.py        /v1/admin/*
         ├─ restful_apis/evaluation_api.py  /v1/eval/*
         └─ restful_apis/dataset_api.py …    /v1/datasets/*
    ↓
Docker middleware          MySQL · Redis · MinIO · Elasticsearch
(ragflow-0.25.6/docker)
```

---

## Repository layout

```
NexusRAG/                    # product name · folder agentic-rag
├── README.md                # Chinese overview
├── README.en.md             # This file
├── CLAUDE.md                # AI collaboration conventions
├── frontend/rag3-web/       # ★ Production frontend
├── backend/ragflow_rag30/   # ★ RAGFlow fork + RAG3 extensions
├── web/rag3-bolt-v1.5/      # UI prototype (mock, read-only)
├── ragflow-0.25.6/          # Upstream RAGFlow mirror (local, gitignored)
├── docs/                    # PRD, tech specs, devlog
└── scripts/sync-from-ragflow.sh
```

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Docker Desktop | MySQL / ES / Redis / MinIO |
| Python **3.13** | Matches `uv.lock` |
| [uv](https://docs.astral.sh/uv/) | `pipx install uv` |
| Node.js **18+** | Frontend build |
| RAM | ≥ 16 GB recommended (Elasticsearch) |
| Upstream mirror | Clone RAGFlow 0.25.6 to `ragflow-0.25.6/` (not in git) |

---

## Quick start (full stack local)

### 1. Start middleware

```bash
cd ragflow-0.25.6/docker
cp .env.example .env
docker compose -f docker-compose-base.yml up -d
```

Add to `/etc/hosts`: `127.0.0.1 es01 infinity mysql minio redis`

### 2. Install & start backend

See **[backend/README.md](./backend/README.md)** for troubleshooting.

```bash
./backend/ragflow_rag30/scripts/install.sh
./backend/ragflow_rag30/scripts/start.sh --init-superuser
./backend/ragflow_rag30/scripts/start.sh
./backend/ragflow_rag30/scripts/start-task-executor.sh 0
```

Health check:

```bash
curl http://localhost:9380/v1/rag3/health
curl http://localhost:9380/v1/system/healthz
```

### 3. Start frontend

```bash
cd frontend/rag3-web
npm install
cp .env.example .env.local
```

`.env.local`:

```env
VITE_USE_REAL_API=true
VITE_PROXY_TARGET=http://localhost:9380
```

```bash
npm run dev    # http://localhost:5173
```

Default login: `admin@ragflow.io` / `admin`

### 4. Verify build

```bash
cd frontend/rag3-web && npm run build
cd backend/ragflow_rag30 && .venv/bin/ruff check rag3 router pipelines fusion
```

---

## Frontend API mode

`useApiMode()` in [`src/services/http.ts`](./frontend/rag3-web/src/services/http.ts) is **true** when:

- `VITE_USE_REAL_API=true`, or
- User is logged in (localStorage token), or
- `VITE_RAGFLOW_AUTH_TOKEN` is set

When true, real APIs are used; otherwise `src/data/*Mock.ts` provides offline demos.

### API integration (rag3-web)

| Module | API prefix | Status |
|--------|------------|--------|
| Auth / user | `/v1/auth/*`, `/v1/users/me` | ✅ Integrated |
| Knowledge bases | `/v1/datasets/*` | ✅ CRUD, model config |
| Documents & chunks | `/v1/datasets/:id/documents/*`, `/v1/documents/*` | ✅ Upload, parse, preview, chunk review |
| Retrieval test | `POST .../datasets/:id/search` | ✅ Multi-channel + rerank |
| Ingestion & index | `/v1/rag3/datasets/:id/index`, ingestions | ✅ GraphRAG / PageIndex / Wiki |
| PageIndex Hub | `/v1/rag3/datasets/:id/pageindex/*` | ✅ Tree, search, stats, settings |
| LLM Wiki Hub | `/v1/rag3/datasets/:id/wiki/*` | ✅ Entries, search, stats |
| Smart chat | `/v1/conversations/*` | ✅ Streaming, Markdown, trace |
| Evaluation (8 tabs) | `/v1/eval/*` | ✅ Datasets, RAGAS, A/B, cost, replay, route learning |
| System admin (16 pages) | `/v1/admin/*` | ✅ Config CRUD, monitor, traces, ops jobs |
| Trace observability | `/v1/admin/traces/*` | ✅ Stats, sessions, detail, OTLP |
| Model providers | `/v1/llm/my_llms` | ✅ Provider list |
| KB permissions / datasources / export | — | 🟡 Mock (no RAGFlow equivalent) |
| Agent / Search apps | — | 🟡 Prototype UI, API pending |
| Monitor charts / cost export | — | 🟡 Partial mock or session-only state |

Changelog: [`docs/devlog/`](./docs/devlog/)

---

## Backend API overview

| Prefix | Module | Purpose |
|--------|--------|---------|
| `/v1/rag3/health` | `rag3_app.py` | RAG3 health |
| `/v1/rag3/query` | same | Classify + multi-channel retrieval + fusion |
| `/v1/rag3/classify` | same | Classifier debug only |
| `/v1/rag3/datasets/:id/*` | same | PageIndex / Wiki / enhanced index |
| `/v1/conversations/*` | `conversations_api.py` | RAG3 chat + `trace_json` persistence |
| `/v1/datasets/*` | `dataset_api.py` etc. | RAGFlow KB CRUD |
| `/v1/eval/*` | `evaluation_api.py` | Full evaluation stack |
| `/v1/admin/*` | `admin_api.py` | System admin |

Tenant RAG3 config: `TenantRag3Config` (pipeline, classifier, fusion, security_rules JSON).

---

## Development conventions

1. **Minimal diff** — Do not modify `web/rag3-bolt-v1.5` (read-only prototype).
2. **Contract first** — Align with `docs/prd/` before coding.
3. **Dual-mode frontend** — No silent fallback to mock when API mode is on.
4. **Devlog** — Record changes in `docs/devlog/YYYY-MM-DD-*.md`.
5. **Verify** — `npm run build`; backend `ruff check` / `py_compile`.

---

## Common commands

```bash
cd frontend/rag3-web && npm run dev
cd frontend/rag3-web && npm run build
./backend/ragflow_rag30/scripts/start.sh
./backend/ragflow_rag30/scripts/start-task-executor.sh 0
./backend/ragflow_rag30/scripts/download-deepdoc-models.sh
./scripts/sync-from-ragflow.sh --dry-run api rag deepdoc common conf
pkill -f "ragflow_server.py|task_executor.py"
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| [CLAUDE.md](./CLAUDE.md) | Dev conventions & monorepo layout |
| [backend/README.md](./backend/README.md) | Backend setup & troubleshooting |
| [frontend/rag3-web/README.md](./frontend/rag3-web/README.md) | Frontend env & modules |
| [LICENSE](./LICENSE) | NexusRAG Source Available License (English) |
| [LICENSE.zh-CN.md](./LICENSE.zh-CN.md) | License summary (Chinese) |
| [COMMERCIAL-LICENSE.md](./COMMERCIAL-LICENSE.md) | Commercial licensing |
| [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) | RAGFlow Apache-2.0 & third parties |
| [docs/devlog/](./docs/devlog/) | Daily change logs |

PRD and tech specs under `docs/prd/` and `docs/tech/` are primarily in Chinese.

---

## Known limitations (v1)

- **Backup / restore / vector DB migration**: AdminJob stubs only.
- **Traces**: Langfuse link placeholder; env filter is frontend-only; legacy QueryLog may lack `trace_json`.
- **Monitor alerts**: Session-only state; some trend charts are mock shells.
- **Routing matrix**: Classifier table is editable; RouterEngine core matrix partly hardcoded.
- **Upstream sync**: Place `ragflow-0.25.6/` locally; reconcile `service_conf.yaml` ports after sync.

---

## License

**Dual licensing** in this monorepo:

| Scope | License | Commercial use |
|-------|---------|----------------|
| **NexusRAG original** (`frontend/rag3-web`, `router/`, `pipelines/`, `fusion/`, `rag3/`, …) | [LICENSE](./LICENSE) | **Separate written authorization** → [COMMERCIAL-LICENSE.md](./COMMERCIAL-LICENSE.md) |
| **RAGFlow-derived** (upstream-synced parts of `backend/ragflow_rag30`) | [Apache-2.0](./licenses/Apache-2.0.txt) | Per Apache-2.0 & upstream terms |

Third-party notices: [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md)

Commercial licensing: `commercial-license@nexusrag.io` (replace before public release)

---

<div align="center">

**If NexusRAG helps you, consider starring ⭐**

[![Gitee Stars](https://gitee.com/zeus-maker/rag-turbo/badge/star.svg?theme=dark)](https://gitee.com/zeus-maker/rag-turbo/stargazers)
[![GitHub Stars](https://img.shields.io/github/stars/zeus-maker/NexusRAG?style=for-the-badge&logo=github&label=Star)](https://github.com/zeus-maker/NexusRAG)

</div>
