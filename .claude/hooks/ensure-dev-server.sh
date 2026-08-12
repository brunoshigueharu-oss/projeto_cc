#!/bin/bash
# Garante que o servidor Next.js (npm run dev) esteja rodando na porta 3000.
if ! lsof -i :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  cd "$CLAUDE_PROJECT_DIR" || exit 0
  nohup npm run dev > "$CLAUDE_PROJECT_DIR/.claude/dev-server.log" 2>&1 &
  disown
fi
exit 0
