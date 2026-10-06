#!/usr/bin/env bash
# Copy to .env.local and fill in. Never commit .env.local.
cp "$(dirname "$0")/.env.example" "$(dirname "$0")/.env.local" 2>/dev/null || true
echo "Wrote web/.env.local from .env.example — add your keys there. Do not commit it."
