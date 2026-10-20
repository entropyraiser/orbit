#!/usr/bin/env bash
# Stops Watcher and removes everything install.sh created (node_modules, build output, run files).
# Your source code is left untouched. Watchlists live in your browser's localStorage and are not affected.
set -euo pipefail
cd "$(dirname "$0")"

PID_FILE=".watcher/pid"
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  PID=$(cat "$PID_FILE")
  echo "Stopping Watcher (pid $PID)..."
  kill "$PID" 2>/dev/null || true
  for _ in $(seq 1 10); do kill -0 "$PID" 2>/dev/null || break; sleep 0.3; done
  kill -9 "$PID" 2>/dev/null || true
else
  echo "Watcher is not running."
fi

echo "Removing node_modules, dist and .watcher..."
rm -rf node_modules dist .watcher
echo "Done. Run ./install.sh to set it up again."
