#!/usr/bin/env bash
# Pull the latest code from GitHub and restart the site. Your tournaments are kept.
# Run from the project folder:   sudo bash deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose exec -T app node src/backup.js || true   # safety backup first
git pull
docker compose up -d --build
docker image prune -f >/dev/null
echo "Updated."
