#!/usr/bin/env bash
set -e

echo "==> Aplicando actualización de MFA a Supabase Local..."
/home/innovation/.nvm/versions/node/v20.19.5/bin/pnpm dlx supabase@3.1.0 db reset --yes

echo "==> Creando usuario administrador..."
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$DIR/create-admin.sh"

echo ""
echo "==> ¡Listo! Migraciones aplicadas y usuario admin creado correctamente."
echo "    Email: admin@portafolio.local"
echo "    Password: Password123!"
