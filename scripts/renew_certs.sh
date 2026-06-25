#!/usr/bin/env bash
set -euo pipefail

# renew_certs.sh
# Run certbot renew inside the official Docker image and reload the api-gateway
# Place this in a cron job or a systemd timer on the host where certificates are stored.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CERT_DIR="$ROOT_DIR/nginx/certs"

if [ ! -d "$CERT_DIR" ]; then
  echo "Certificates directory not found: $CERT_DIR"
  exit 1
fi

echo "Running certbot renew (docker)..."
docker run --rm -v "$CERT_DIR:/etc/letsencrypt" -v "$CERT_DIR/var/lib/letsencrypt:/var/lib/letsencrypt" certbot/certbot renew --deploy-hook "docker-compose -f $ROOT_DIR/docker-compose.yml restart api-gateway"

echo "Renewal finished." 
