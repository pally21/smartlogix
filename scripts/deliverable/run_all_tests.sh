#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/gajardo/Desktop/SmartLogix2/smartlogix"

echo "Running tests for services and frontend (coverage where configured)"

for svc in bff-service orders-service inventory-service shipping-service payment-service; do
  echo "\n--- $svc ---"
  if [ -d "$ROOT/$svc" ]; then
    (cd "$ROOT/$svc" && npm install --no-audit --no-fund >/dev/null 2>&1 || true)
    (cd "$ROOT/$svc" && npm test --silent) || echo "[$svc] tests completed (non-zero exit)"
  else
    echo "[$svc] not found"
  fi
done

echo "\n--- frontend ---"
if [ -d "$ROOT/frontend" ]; then
  (cd "$ROOT/frontend" && npm install --no-audit --no-fund >/dev/null 2>&1 || true)
  (cd "$ROOT/frontend" && npm run test:coverage --silent) || echo "[frontend] vitest finished (non-zero exit)"
else
  echo "[frontend] not found"
fi

echo "All test commands executed. Check coverage/ folders in each service for reports."
