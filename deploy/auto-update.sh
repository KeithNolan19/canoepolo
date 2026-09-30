#!/usr/bin/env bash
# Checks GitHub for new code and deploys it if there is any.
# Runs every 5 minutes once switched on with:   sudo bash deploy/enable-auto-update.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# Never run two updates at the same time
exec 9>/tmp/canoepolo-update.lock
flock -n 9 || exit 0

git fetch -q origin main
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  echo "$(date -Is) New version on GitHub ($(git rev-parse --short origin/main)), updating..."
  bash deploy/update.sh
  echo "$(date -Is) Done."
fi
