#!/usr/bin/env bash
set -e

echo "==> Creando usuario admin@portafolio.local en Supabase Local..."

# Clave de servicio local de Supabase
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz}"

RESPONSE=$(curl -s -X POST "http://127.0.0.1:54321/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@portafolio.local",
    "password": "Password123!",
    "email_confirm": true,
    "app_metadata": { "role": "admin" }
  }')

echo "$RESPONSE"
echo ""
echo "==> Usuario listo. Ya puedes iniciar sesión con:"
echo "    Email: admin@portafolio.local"
echo "    Password: Password123!"

