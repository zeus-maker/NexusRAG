#!/usr/bin/env bash
# 启动 RAG 3.0 API（ragflow_rag30 源码 + 本地 .venv）
# 开发热重载：./start.sh --dev  或  RAGFLOW_DEV=1 ./start.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

rag30_activate

DEV_MODE=0
SERVER_ARGS=()

usage() {
  cat <<EOF
用法: $0 [选项] [ragflow_server 参数…]

选项:
  --dev, -d     开发模式：传入 --debug，启用 Quart 代码热重载
  -h, --help    显示帮助

环境变量:
  RAGFLOW_DEV=1  等同 --dev

示例:
  $0                          # 生产式启动（无热重载）
  $0 --dev                    # 开发热重载
  $0 --init-superuser         # 首次创建管理员
  $0 --dev --init-superuser   # 开发模式 + 初始化管理员

服务地址: http://0.0.0.0:9380
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dev|-d)
      DEV_MODE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      SERVER_ARGS+=("$1")
      shift
      ;;
  esac
done

[[ "${RAGFLOW_DEV:-}" == "1" || "${RAGFLOW_DEV:-}" == "true" ]] && DEV_MODE=1

if [[ "$DEV_MODE" -eq 1 ]]; then
  has_debug=0
  if [[ ${#SERVER_ARGS[@]} -gt 0 ]]; then
    for arg in "${SERVER_ARGS[@]}"; do
      [[ "$arg" == "--debug" ]] && has_debug=1
    done
  fi
  if [[ "$has_debug" -eq 0 ]]; then
    if [[ ${#SERVER_ARGS[@]} -gt 0 ]]; then
      SERVER_ARGS=(--debug "${SERVER_ARGS[@]}")
    else
      SERVER_ARGS=(--debug)
    fi
  fi
  echo "模式: 开发（代码变更自动重载，修改 api/ rag3/ router/ pipelines/ 等后生效）"
else
  echo "模式: 常规（无热重载，开发请用: $0 --dev 或 scripts/start-dev.sh）"
fi

echo "PYTHONPATH=$PYTHONPATH"
echo "HF_ENDPOINT=$HF_ENDPOINT"
echo "启动 ragflow_server → http://0.0.0.0:9380"
if [[ ${#SERVER_ARGS[@]} -gt 0 ]]; then
  exec python api/ragflow_server.py "${SERVER_ARGS[@]}"
else
  exec python api/ragflow_server.py
fi
