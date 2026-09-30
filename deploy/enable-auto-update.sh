#!/usr/bin/env bash
# Switches on automatic updates: every 5 minutes the server checks GitHub and deploys any new code.
# Run once from the project folder:   sudo bash deploy/enable-auto-update.sh
# To switch off again:                sudo rm /etc/cron.d/canoepolo-auto-update
set -euo pipefail
cd "$(dirname "$0")/.."
APP_DIR="$(pwd)"

if [ "$(id -u)" -ne 0 ]; then echo "Please run with sudo."; exit 1; fi

git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true

# The server needs to read the private repository without anyone typing the token.
# Store the read-only GitHub token (root-only file /root/.git-credentials).
git config credential.helper store
if ! GIT_TERMINAL_PROMPT=0 git fetch -q origin main 2>/dev/null; then
  echo
  echo "Paste your GitHub token (the github_pat_... one, read-only for this repository)."
  echo "Nothing will show while you paste. Press Enter afterwards."
  read -rsp "Token: " TOKEN; echo
  USERNAME=$(git remote get-url origin | sed -E 's#https://([^@/]+)@github.com/.*#\1#; t; s#.*#x-access-token#')
  printf 'protocol=https\nhost=github.com\nusername=%s\npassword=%s\n\n' "$USERNAME" "$TOKEN" | git credential approve
  unset TOKEN
  chmod 600 /root/.git-credentials 2>/dev/null || true
  if ! GIT_TERMINAL_PROMPT=0 git fetch -q origin main; then
    echo "GitHub did not accept that token. Check it has access to this repository, then run this again."
    exit 1
  fi
fi
echo "==> GitHub access works"

cat > /etc/cron.d/canoepolo-auto-update <<EOF
# canoepolo.eu: check GitHub for new code every 5 minutes and deploy it
*/5 * * * * root cd $APP_DIR && bash deploy/auto-update.sh >> /var/log/canoepolo-auto-update.log 2>&1
EOF
chmod 644 /etc/cron.d/canoepolo-auto-update
touch /var/log/canoepolo-auto-update.log

echo "==> Automatic updates are on."
echo "    New code pushed to GitHub goes live within about 5 minutes (plus a few minutes to build)."
echo "    See what happened:   tail -n 30 /var/log/canoepolo-auto-update.log"
echo "    Switch off:          sudo rm /etc/cron.d/canoepolo-auto-update"
echo
echo "==> Checking for updates now..."
bash deploy/auto-update.sh || true
