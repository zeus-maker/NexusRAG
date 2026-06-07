# backend — RAG 3.0 服务端

## 目录说明

| 路径 | 说明 |
|------|------|
| `ragflow_rag30/` | RAGFlow 0.25.x **二开工作区**（`pyproject.toml`、`uv.lock`、Python API + RAG3 扩展） |
| `../ragflow-0.25.6/` | 上游只读镜像（`docker/`、对比同步用） |
| `../frontend/rag3-web/` | 生产前端（对接本目录 API） |

> **分工**：Python 依赖在 `ragflow_rag30/` 内 `uv sync`；Docker 中间件仍用 `ragflow-0.25.6/docker/`。  
> 勿在 `ragflow_rag30/src/` 开发 UI（已由 `frontend/rag3-web` 替代）。

## RAG3 新增包

| 包 | 职责 |
|----|------|
| `router/` | 四分类器 + 路由引擎 |
| `pipelines/` | 五通道流水线 |
| `fusion/` | RRF + Cross-Encoder |
| `security/` | 块级 ACL |
| `api/apps/rag3_app.py` | `/v1/rag3/*` 扩展 API |

---

## 本地源码启动（推荐）

适用于 **RAG3 二开调试**：Docker 只跑中间件，Python 进程直接跑 `ragflow_rag30` 源码。

### 0. 前置条件

| 依赖 | 版本/说明 |
|------|-----------|
| Docker Desktop | 用于 MySQL / ES / Redis / MinIO |
| Python | **3.13**（与上游 `uv sync` 一致） |
| [uv](https://docs.astral.sh/uv/) | `pipx install uv` |
| 内存 | 建议 ≥ 16 GB（Elasticsearch 较吃内存） |
| macOS 可选 | `brew install jemalloc`（task_executor 推荐） |

### 1. 启动中间件（Docker）

```bash
cd ragflow-0.25.6/docker

# 首次：复制环境变量模板
cp .env.example .env   # 若无 .env.example 则沿用目录内已有 .env

# 仅启动基础服务（不启动 RAGFlow 应用容器）
docker compose -f docker-compose-base.yml up -d
```

默认 `DOC_ENGINE=elasticsearch`，会拉起 **MySQL、Redis、MinIO、Elasticsearch**。

**hosts（源码连 Docker 时建议配置）**：

```text
# /etc/hosts
127.0.0.1   es01 infinity mysql minio redis
```

验证中间件：

```bash
docker compose -f docker-compose-base.yml ps
# MySQL :3306  Redis :6379  MinIO :9000  ES 见下方端口说明
```

### 2. 安装 Python 依赖（一次性）

在 **`ragflow_rag30/`** 内安装（`pyproject.toml` + `uv.lock` 已在此目录）：

```bash
# 推荐：一键安装（默认 HF 镜像 + 较长下载超时）
./backend/ragflow_rag30/scripts/install.sh

# 或手动：
cd backend/ragflow_rag30
export HF_ENDPOINT=https://hf-mirror.com
export UV_HTTP_TIMEOUT=300
pipx install uv   # 若未安装
uv sync --python 3.13
uv run python3 ../../ragflow-0.25.6/download_deps.py   # 若本目录无 download_deps.py
```

虚拟环境路径：`backend/ragflow_rag30/.venv`

### 3. 对齐配置文件

二开工作区使用 `backend/ragflow_rag30/conf/service_conf.yaml`。

源码模式连本机 Docker 时，关键项应与 `ragflow-0.25.6/docker/.env` 一致：

| 配置项 | 典型值（elasticsearch profile） |
|--------|-----------------------------------|
| `mysql.host` / `port` | `localhost` / `3306` |
| `redis.host` | `localhost:6379` |
| `minio.host` | `localhost:9000` |
| `es.hosts` | `http://localhost:<ES_PORT>`，容器内 ES 固定 **9200**，宿主机端口见 `docker/.env` 的 `ES_PORT`（常见为 `9200` 或 `1200`） |
| `ragflow.http_port` | `9380` |

按需修改 `user_default_llm` 中的 embedding / LLM 厂商与 API Key。

### 4. 启动 API 服务

```bash
# 首次：创建默认管理员（admin@ragflow.io / admin）
./backend/ragflow_rag30/scripts/start.sh --init-superuser

# 启动 API（默认 :9380，已默认 HF_ENDPOINT=https://hf-mirror.com）
./backend/ragflow_rag30/scripts/start.sh
```

看到日志 `RAGFlow server is ready` 后：

```bash
curl http://localhost:9380/v1/rag3/health
# {"code":0,"data":{"status":"ok","version":"3.0.0",...}}
```

### 5. 启动任务执行器（文档解析必需）

仅 API 服务**无法**完成文档入库与向量化，需另开终端：

```bash
./backend/ragflow_rag30/scripts/start-task-executor.sh 0
# 多 worker：.../start-task-executor.sh 1
```

### 6. 对接前端 `rag3-web`

```bash
cd frontend/rag3-web
cp .env.example .env.local
```

`.env.local` 示例：

```env
VITE_USE_REAL_API=true
VITE_PROXY_TARGET=http://localhost:9380
```

```bash
npm install && npm run dev
# http://localhost:5173 → 登录 admin@ragflow.io / admin
```

### 7. 停止服务

```bash
# API + task_executor
pkill -f "ragflow_server.py|task_executor.py"

# 中间件
cd ragflow-0.25.6/docker && docker compose -f docker-compose-base.yml down
```

---

## 常见问题

| 现象 | 处理 |
|------|------|
| 连不上 ES | `service_conf.yaml` 的 `es.hosts` 端口须与 `docker/.env` 中 `ES_PORT` 一致（映射为 `ES_PORT:9200`，容器内始终是 9200） |
| `ModuleNotFoundError` | 确认已 `scripts/install.sh`，且 `source backend/ragflow_rag30/.venv/bin/activate` |
| 登录 401 | 先执行 `--init-superuser`，或检查 MySQL 是否 healthy |
| 文档一直「解析中」 | 是否已启动 `task_executor.py` |
| HF 模型下载慢 | `export HF_ENDPOINT=https://hf-mirror.com` 后重启 |
| macOS task_executor 崩溃 | `brew install jemalloc` |

---

## 与上游同步

```bash
# 仓库根目录；仅同步【复用】模块，不覆盖 router/pipelines 等 RAG3 包
./scripts/sync-from-ragflow.sh --dry-run api rag deepdoc common conf
./scripts/sync-from-ragflow.sh api rag deepdoc
```

同步 `conf/` 后请重新核对 `service_conf.yaml` 中的端口是否与本地 Docker `.env` 一致。

---

## 参考

- 上游完整说明：[ragflow-0.25.6/README.md](../ragflow-0.25.6/README.md) § Launch service from source
- RAG3 架构：[../CLAUDE.md](../CLAUDE.md)、[../docs/tech/5-企业级RAG知识库3.0实现方案.md](../docs/tech/5-企业级RAG知识库3.0实现方案.md)
