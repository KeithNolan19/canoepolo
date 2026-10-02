#!/usr/bin/env bash
# Asks for your Twilio details and saves them in .env, then restarts the site.
# Run from ~/canoepolo:  sudo bash deploy/set-sms.sh
set -e
cd "$(dirname "$0")/.."
[ -f .env ] || { echo "No .env file here. Run this from ~/canoepolo."; exit 1; }
read -r -p "Twilio Account SID (starts with AC): " SID
read -r -s -p "Twilio Auth Token (typing is hidden): " TOKEN; echo
read -r -p "Twilio number (like +353...) or sender name (up to 11 letters, like CanoePolo): " FROM
read -r -p "Test mode that only writes texts to the log? (y/N): " DRY
case "$SID" in AC*) ;; *) echo "That does not look like an Account SID."; exit 1;; esac
case "$FROM" in +[0-9]*) ;; *) echo "$FROM" | grep -Eq "^[A-Za-z][A-Za-z0-9 ]{1,10}$" || { echo "Use a number starting with + or a name of 2 to 11 letters and digits."; exit 1; };; esac
[ -n "$TOKEN" ] || { echo "No token entered."; exit 1; }
sed -i '/^TWILIO_/d;/^SMS_DRY_RUN=/d' .env
{ echo "TWILIO_ACCOUNT_SID=$SID"; echo "TWILIO_AUTH_TOKEN=$TOKEN"; echo "TWILIO_FROM=$FROM"; } >> .env
case "$DRY" in y|Y) echo "SMS_DRY_RUN=1" >> .env;; esac
chmod 600 .env
docker compose up -d
echo "Done. Sign up with your own number at /tournaments/paddle-europe-canoe-polo-club-championships-2026/text-updates"
