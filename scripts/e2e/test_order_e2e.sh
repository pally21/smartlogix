#!/usr/bin/env bash
set -euo pipefail

# Simple E2E script: crea un pedido vía BFF y verifica que persista.
BFF_URL=${BFF_URL:-http://localhost:4000}

echo "[e2e] BFF URL: $BFF_URL"

echo "[e2e] Obteniendo productos..."
prod_json=$(curl -s "$BFF_URL/api/inventory/products")
prod_id=$(echo "$prod_json" | python3 -c "import sys,json; j=json.load(sys.stdin); d=j.get('data',[]); print(d[0].get('id') if d else '')")
prod_price=$(echo "$prod_json" | python3 -c "import sys,json; j=json.load(sys.stdin); d=j.get('data',[]); print(d[0].get('price') if d else '')")

if [ -z "$prod_id" ]; then
  echo "[e2e] No hay productos disponibles o no se pudo obtener productId"
  exit 1
fi

echo "[e2e] productId: $prod_id, price: $prod_price"

NOTES="e2e-test-$(date +%s)"
CUSTOMER_ID=$(python3 - <<PY
import uuid
print(str(uuid.uuid4()))
PY
)

echo "[e2e] Creando pedido (notes=$NOTES, customerId=$CUSTOMER_ID) ..."
create_resp=$(curl -s -X POST -H 'Content-Type: application/json' --data @- "$BFF_URL/api/orders" <<JSON
{"customerId":"$CUSTOMER_ID","customerName":"E2E Test","customerEmail":"e2e@example.com","shippingAddress":"Test St","items":[{"productId":"$prod_id","quantity":1,"unitPrice":$prod_price}],"notes":"$NOTES"}
JSON
)

echo "[e2e] Respuesta creación:"
echo "$create_resp" | python3 -m json.tool || echo "$create_resp"

sleep 1

echo "[e2e] Verificando persistencia en /api/orders..."
found=$(curl -s "$BFF_URL/api/orders" | python3 - <<PY
import sys, json
try:
    j=json.load(sys.stdin)
except Exception:
    print('0'); sys.exit(0)
for o in j.get('data',[]):
    if o.get('notes') == '$NOTES' and o.get('customerEmail') == 'e2e@example.com':
        print('1')
        break
else:
    print('0')
PY
)

if [ "$found" = "1" ]; then
  echo "[e2e] OK: pedido encontrado (notes=$NOTES)."
  exit 0
else
  echo "[e2e] FAIL: pedido no encontrado."
  exit 2
fi
