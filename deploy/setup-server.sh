#!/usr/bin/env bash
# One-time setup for a fresh DigitalOcean Ubuntu Droplet.
# Run it from inside the project folder:   sudo bash deploy/setup-server.sh
set -euo pipefail

cd "$(dirname "$0")/.."
APP_DIR="$(pwd)"
echo "==> Setting up canoepolo.eu in $APP_DIR"

if [ "$(id -u)" -ne 0 ]; then echo "Please run with sudo."; exit 1; fi

# 1. Swap space (helps the small $6 Droplet build the app without running out of memory)
if ! swapon --show | grep -q swapfile; then
  echo "==> Adding 1GB swap"
  fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# 2. Docker
if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installing Docker"
  curl -fsSL https://get.docker.com | sh
fi

# 3. Firewall: allow SSH and web traffic only
echo "==> Configuring firewall"
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443 >/dev/null
ufw --force enable >/dev/null

# 4. Settings file (.env)
if [ ! -f .env ]; then
  echo
  read -rp "Your domain (press Enter for canoepolo.eu): " DOMAIN
  DOMAIN=${DOMAIN:-canoepolo.eu}
  read -rp "Admin username (press Enter for admin): " ADMIN_USERNAME
  ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
  while true; do
    read -rsp "Choose an admin password (at least 12 characters): " ADMIN_PASSWORD; echo
    if [ ${#ADMIN_PASSWORD} -lt 12 ]; then echo "Too short, try again."; continue; fi
    if [[ "$ADMIN_PASSWORD" =~ [\$\"\'\ \\] ]]; then echo "Please avoid \$, quotes, spaces and backslashes."; continue; fi
    break
  done
  SESSION_SECRET=$(openssl rand -hex 32)
  cat > .env <<EOF
DOMAIN=$DOMAIN
ADMIN_USERNAME=$ADMIN_USERNAME
ADMIN_PASSWORD=$ADMIN_PASSWORD
SESSION_SECRET=$SESSION_SECRET
EOF
  chmod 600 .env
  echo "==> Saved settings to .env"
else
  echo "==> .env already exists, keeping it"
fi

# 5. Build and start
echo "==> Building and starting the site (this takes a few minutes the first time)"
docker compose up -d --build

# 6. Nightly database backup at 03:00
CRON_LINE="0 3 * * * cd $APP_DIR && docker compose exec -T app node src/backup.js >> /var/log/canoepolo-backup.log 2>&1"
( crontab -l 2>/dev/null | grep -v 'src/backup.js' ; echo "$CRON_LINE" ) | crontab -
echo "==> Nightly backups scheduled"

DOMAIN=$(grep '^DOMAIN=' .env | cut -d= -f2)
echo
echo "All done! Once your domain points to this server, visit:"
echo "   https://$DOMAIN          (public site)"
echo "   https://$DOMAIN/admin    (admin login)"
