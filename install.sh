#!/usr/bin/env bash
# Installs dependencies, builds the app and starts it in the background on a free local port.
# Usage: ./install.sh [port]
set -euo pipefail
cd "$(dirname "$0")"

RUN_DIR=".watcher"
PID_FILE="$RUN_DIR/pid"
PORT_FILE="$RUN_DIR/port"
LOG_FILE="$RUN_DIR/watcher.log"
mkdir -p "$RUN_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required (v22+). Install it from https://nodejs.org and re-run." >&2
  exit 1
fi
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "Node.js v22+ is required (found v$(node -v))." >&2
  exit 1
fi

# Stop a previous instance so re-running install.sh acts as a restart.
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Stopping previous instance (pid $(cat "$PID_FILE"))..."
  kill "$(cat "$PID_FILE")" 2>/dev/null || true
  sleep 1
fi

echo "Installing dependencies..."
npm install --no-audit --no-fund --loglevel=error

echo "Building..."
npm run build --silent

# Pick a port: argument > previously used > first free one from 5757 upward.
port_free() { ! (echo > "/dev/tcp/127.0.0.1/$1") >/dev/null 2>&1; }
PORT="${1:-}"
if [ -z "$PORT" ] && [ -f "$PORT_FILE" ] && port_free "$(cat "$PORT_FILE")"; then PORT=$(cat "$PORT_FILE"); fi
if [ -z "$PORT" ]; then
  PORT=5757
  while ! port_free "$PORT"; do PORT=$((PORT + 1)); done
elif ! port_free "$PORT"; then
  echo "Port $PORT is already in use." >&2
  exit 1
fi

NODE_ENV=production PORT="$PORT" nohup ./node_modules/.bin/tsx server/index.ts >"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"
echo "$PORT" >"$PORT_FILE"

for _ in $(seq 1 30); do
  if curl -fs "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then
    echo
    echo "Watcher is running:  http://127.0.0.1:$PORT"
    echo "Logs:                $LOG_FILE"
    echo "Stop / remove:       ./uninstall.sh"
    exit 0
  fi
  sleep 0.5
done
echo "Started, but the server did not respond in time. Check $LOG_FILE" >&2
exit 1
