#!/bin/bash
#
# SessionStart hook for Claude Code on the web.
# Installs Node dependencies so the build, type-checker, and any future
# tests/linters work in a fresh remote container. Idempotent and
# non-interactive; safe to run multiple times.
#
set -euo pipefail

# Only needed in the remote (web) environment; skip locally.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# `npm install` (not `ci`) so the cached container state is reused on
# subsequent runs without wiping node_modules each time.
npm install --no-fund --no-audit
