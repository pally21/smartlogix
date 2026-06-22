#!/usr/bin/env bash
# Simple helper to obtain Let's Encrypt certificates using the official certbot Docker image.
# Usage: ./scripts/obtain_certs.sh example.com,www.example.com

set -euo pipefail

DOMAINS="$@"
if [ -z "$DOMAINS" ]; then
  echo "Usage: $0 domain.tld [www.domain.tld ...]"
  exit 1
fi

CERT_DIR="$PWD/nginx/certs"
mkdir -p "$CERT_DIR"

echo "Stopping any process using ports 80/443 (if running locally)..."
echo "Make sure your docker-compose api-gateway is not running on ports 80/443 during validation."

echo "Requesting certificates for: $DOMAINS"

docker run --rm -it \
  -v "$CERT_DIR:/etc/letsencrypt" \
  -v "$CERT_DIR/var/lib/letsencrypt:/var/lib/letsencrypt" \
  -v "$PWD/nginx/html:/data/letsencrypt" \
  certbot/certbot certonly --webroot -w /data/letsencrypt \
  --register-unsafely-without-email --agree-tos \
  -d $DOMAINS

echo "Certificates placed under $CERT_DIR/live/<domain>/"
echo "After obtaining, restart the api-gateway to pick up the new certs."
