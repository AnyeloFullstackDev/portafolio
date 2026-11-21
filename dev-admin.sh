#!/usr/bin/env bash
export PATH="/home/innovation/.nvm/versions/node/v22.23.5/bin:/home/innovation/.nvm/versions/node/v20.19.5/bin:$PATH"
cd "$(dirname "$0")"

# Liberar el puerto 3001 si un proceso anterior quedó en segundo plano
fuser -k 3001/tcp 2>/dev/null || true

pnpm --filter admin dev
