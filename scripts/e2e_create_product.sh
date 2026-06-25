#!/usr/bin/env bash
# Simple E2E: login -> create product via gateway
set -euo pipefail
GATEWAY_URL=${GATEWAY_URL:-http://localhost:8082}
USERNAME=${1:-admin}
PASSWORD=${2:-password}

echo "Logging in as $USERNAME..."
RESP=$(curl -s -X POST "$GATEWAY_URL/api/auth/login" -H "Content-Type: application/json" -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")
TOKEN=$(printf "%s" "$RESP" | sed -n 's/.*"token"\s*:\s*"\([^"]*\)".*/\1/p')
if [ -z "$TOKEN" ]; then
  echo "Login failed: $RESP"
  exit 2
fi

echo "Token obtained: ${TOKEN:0:8}..."

echo "Creating product..."
CREATE_RESP=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$GATEWAY_URL/api/inventory/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"E2E Script Product","price":999,"category":"e2e"}')

echo "Create response:\n$CREATE_RESP"

# exit success
exit 0
