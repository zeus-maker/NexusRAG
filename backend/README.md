# backend — RAG 3.0 服务端

## 目录说明

| 路径 | 说明 |
|------|------|
| `ragflow_rag30/` | RAGFlow 0.25.x 二开工作区 + RAG3 扩展包 |
| `../ragflow-0.25.6/` | 上游只读镜像（对比/同步用，不入 git） |

## RAG3 新增包（相对 RAGFlow 原版）

| 包 | 职责 | 设计章节 |
|----|------|----------|
| `router/` | 四分类器 + 路由引擎 | 技术方案 §3、后端方案 §2 |
| `pipelines/` | 五通道流水线 | 技术方案 §3.4 |
| `fusion/` | RRF + Cross-Encoder | 技术方案 §34 |
| `security/` | 块级 ACL、注入防御 | 技术方案 §37 |
| `eval/` | RAGAS/DeepEval | 技术方案 §43 |
| `observability/` | Prometheus/OTel | 技术方案 §45 |
| `api/apps/rag3_app.py` | RAG3 REST 扩展 | API 设计附录 |

## RAGFlow 复用模块（尽量保持原路径）

- `api/` — Quart 应用与 `*_app.py` 自动注册
- `rag/` — 检索、分块、LLM 集成
- `deepdoc/` — PDF/OCR/布局
- `agent/` — Agent 画布
- `graphrag/` — 知识图谱
- `common/`、`conf/` — 配置与连接

**注意**：`ragflow_rag30/src/` 为 RAGFlow 原版 React 前端，已由 `frontend/rag3-web` 替代，勿在此开发新 UI。

## 启动

```bash
cd ragflow_rag30
export PYTHONPATH=$(pwd)
python api/ragflow_server.py
```

依赖服务见 `ragflow-0.25.6/docker/docker-compose-base.yml`。

## 与上游 diff

```bash
# 仓库根目录
./scripts/sync-from-ragflow.sh --dry-run rag deepdoc api
```

仅将 **【复用】** 模块从上游同步；`router/`、`pipelines/` 等 **【新增】** 包勿覆盖。
