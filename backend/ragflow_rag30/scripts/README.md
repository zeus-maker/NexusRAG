# ragflow_rag30 启动脚本

本目录用于 **本地源码模式** 安装依赖、启动 API / 任务执行器，以及开发热重载。

> 前置：Docker 中间件（MySQL / Redis / ES / MinIO）需已启动，详见 [`../../README.md`](../../README.md)。

## 脚本一览

| 脚本 | 用途 |
|------|------|
| `install.sh` | 一次性安装 Python 依赖（`uv sync`）+ 可选 `download_deps` + DeepDOC 模型 |
| `start.sh` | 启动 API（`:9380`），支持 `--dev` 热重载 |
| `start-dev.sh` | 开发模式快捷入口（等价 `start.sh --dev`） |
| `dev.sh` | 一键开发：API 热重载 + 前端 Vite HMR（可选 worker） |
| `start-task-executor.sh` | 文档解析 / 向量化 worker，支持 `--watch` 热重启 |
| `download-deepdoc-models.sh` | 下载 PDF DeepDOC 所需 `updown_concat_xgb.model` |
| `common.sh` | 内部公共函数（勿直接执行） |

## 快速开始

```bash
# 1. 安装（首次）
./scripts/install.sh

# 2. 创建管理员（首次）
./scripts/start.sh --init-superuser

# 3. 日常开发（推荐）
./scripts/dev.sh
```

浏览器打开 `http://localhost:5173`，默认账号 `admin@ragflow.io` / `admin`。

## 启动 API

### 常规模式（无热重载）

```bash
./scripts/start.sh
```

适用于联调、压测或不需要自动重启的场景。

### 开发模式（代码热重载）

```bash
./scripts/start-dev.sh
# 或
./scripts/start.sh --dev
# 或
RAGFLOW_DEV=1 ./scripts/start.sh
```

启用 `ragflow_server.py --debug`，由 Quart 内置 reloader 监听已加载的 Python 模块变更。修改以下目录后 **API 会自动重启**：

- `api/`（含 `rag3_app.py`、`conversations_api.py` 等）
- `rag3/`、`router/`、`pipelines/`、`fusion/`、`security/`
- `common/`、`conf/`

健康检查：

```bash
curl http://localhost:9380/v1/rag3/health
```

### 组合参数

```bash
# 开发模式 + 初始化管理员
./scripts/start.sh --dev --init-superuser

./scripts/start.sh --help
```

## 一键开发 `dev.sh`

```bash
# API（热重载）+ 前端 Vite（HMR）
./scripts/dev.sh

# 再加 task_executor（代码变更自动重启）
./scripts/dev.sh --with-worker

# 仅 API，不启前端
./scripts/dev.sh --api-only
```

`dev.sh` 会：

1. 后台启动 `start-dev.sh`（API 热重载）
2. （可选）后台启动 `start-task-executor.sh --watch`
3. 前台运行 `frontend/rag3-web` 的 `npm run dev`

按 `Ctrl+C` 会一并停止后台 API / worker 进程。

前端需配置 `frontend/rag3-web/.env.local`（或 `.env.development`）：

```env
VITE_USE_REAL_API=true
VITE_PROXY_TARGET=http://localhost:9380
```

## 任务执行器

文档入库、解析、向量化 **必须** 单独启动 worker（与 API 进程分离）：

```bash
# worker 0，无热重载
./scripts/start-task-executor.sh

# worker 1
./scripts/start-task-executor.sh 1

# worker 0 + 代码变更自动重启
./scripts/start-task-executor.sh --watch
./scripts/start-task-executor.sh -w 2

# 环境变量等同 --watch
RAGFLOW_DEV=1 ./scripts/start-task-executor.sh
```

`--watch` 轮询监听 `api/`、`rag3/`、`router/`、`pipelines/`、`fusion/`、`security/`、`common/`、`conf/`、`rag/svr/` 下 `.py` / `.yaml` 变更（默认间隔 2 秒）。

调整轮询间隔：

```bash
WATCH_INTERVAL=1 ./scripts/start-task-executor.sh --watch
```

## 模型与依赖

```bash
# 完整安装（含 uv sync、download_deps、DeepDOC 模型）
./scripts/install.sh

# 仅补 DeepDOC 模型（PDF 解析报 text_concat_xgb 时）
./scripts/download-deepdoc-models.sh
```

`install.sh` 支持环境变量：

| 变量 | 默认 | 说明 |
|------|------|------|
| `HF_ENDPOINT` | `https://hf-mirror.com` | HuggingFace 镜像 |
| `HF_MIRROR` | `https://hf-mirror.com` | DeepDOC 模型下载镜像 |
| `UV_HTTP_TIMEOUT` | `300` | uv 下载超时（秒） |
| `RAGFLOW_UPSTREAM` | `../../ragflow-0.25.6` | 上游镜像路径（`download_deps` 回退） |

## 环境变量（启动相关）

| 变量 | 作用 |
|------|------|
| `RAGFLOW_DEV=1` | `start.sh` 等同 `--dev`；`start-task-executor.sh` 默认开启 `--watch` |
| `PYTHONPATH` | 由脚本设为 `ragflow_rag30` 根目录 |
| `HF_ENDPOINT` | 模型下载镜像（`start.sh` / worker 默认已设） |
| `WATCH_INTERVAL` | task_executor 监听轮询间隔（秒） |

## 停止服务

```bash
# 前台启动的进程：Ctrl+C

# 查找并结束残留进程
pkill -f "ragflow_server.py|task_executor.py"
```

Docker 中间件停止见 [`../../README.md`](../../README.md) §7。

## 常见问题

| 现象 | 处理 |
|------|------|
| `未找到虚拟环境` | 先执行 `./scripts/install.sh` |
| 改代码 API 不重启 | 确认使用 `start-dev.sh` 或 `--dev`，不要用裸 `start.sh` |
| 热重载后登录失效 | 正常现象，reloader 会重启进程，重新登录即可 |
| 文档一直「解析中」 | 另开终端运行 `start-task-executor.sh` |
| PDF 解析失败 | 运行 `download-deepdoc-models.sh` 后重启 worker |
| `dev.sh` 前端连不上 API | 确认 API 已起来且 `VITE_PROXY_TARGET=http://localhost:9380` |

## 典型终端布局

```text
终端 1:  ./scripts/dev.sh --with-worker    # API + worker + 前端
终端 2:  docker compose …（中间件，一般常驻）
```

或拆分：

```text
终端 1:  ./scripts/start-dev.sh
终端 2:  ./scripts/start-task-executor.sh --watch
终端 3:  cd frontend/rag3-web && npm run dev
```
