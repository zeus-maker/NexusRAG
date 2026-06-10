#!/usr/bin/env bash
# 开发模式启动 API（等价于 start.sh --dev）
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export RAGFLOW_DEV=1
exec "$SCRIPT_DIR/start.sh" --dev "$@"
