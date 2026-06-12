# Third-Party Notices

This document lists third-party and upstream-licensed components in the NexusRAG
repository. **You must comply with each applicable license.**

---

## 1. RAGFlow (Apache License 2.0)

Large portions of `backend/ragflow_rag30/` are derived from or synchronized with
[RAGFlow](https://github.com/infiniflow/ragflow) (Apache-2.0), including but not
limited to:

| Area | Typical paths |
|------|----------------|
| API framework & apps | `backend/ragflow_rag30/api/` (except RAG3 extension files listed in LICENSE) |
| RAG & retrieval core | `backend/ragflow_rag30/rag/` |
| Document parsing | `backend/ragflow_rag30/deepdoc/` |
| Agent / GraphRAG | `backend/ragflow_rag30/agent/`, `graphrag/` |
| Common utilities | `backend/ragflow_rag30/common/`, `conf/` (upstream portions) |

RAG3-specific **new** packages (`router/`, `pipelines/`, `fusion/`, `security/`,
`rag3/`, selected `api/apps/*`) are licensed under the **NexusRAG Source Available
License** — see [LICENSE](./LICENSE).

When in doubt, check file headers and `[RAG3]` modification markers; upstream
sync is performed via `scripts/sync-from-ragflow.sh`.

### Apache License 2.0

Full text: https://www.apache.org/licenses/LICENSE-2.0

```
Copyright notices and license copies for RAGFlow components must be preserved
as required by Apache-2.0 Section 4.
```

A copy of Apache-2.0 is also available in this repository at
[licenses/Apache-2.0.txt](./licenses/Apache-2.0.txt).

---

## 2. Frontend & Python dependencies

- **npm packages** (`frontend/rag3-web/package.json`): each package’s license applies.
- **Python packages** (`backend/ragflow_rag30/pyproject.toml`, `uv.lock`): each
  package’s license applies.

Run your organization’s standard OSS compliance scan before commercial deployment.

---

## 3. Commercial licensing (NexusRAG original software)

Commercial use of NexusRAG original software requires a separate agreement.
See [LICENSE](./LICENSE) Section 2 and [LICENSE.zh-CN.md](./LICENSE.zh-CN.md).

Contact: **commercial-license@nexusrag.io**
