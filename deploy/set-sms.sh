#!/usr/bin/env bash
# Asks for your Twilio details and saves them in .env, then restarts the site.
# Run from ~/canoepolo:  sudo bash deploy/set-sms.sh
set -e
cd "$(dirname "$0")/.."
[ -f .env ] || { echo "No .env file here. Run this from ~/canoepolo."; exit 1; }
read -r -p "Twilio Account SID (starts with AC): " SID
read -r -s -p "Twilio Auth Token (typing is hidden): " TOKEN; echo
read -r -p "Twilio phone number (like +353...): " FROM
read -r -p "Test mode that only writes texts to the log? (y/N): " DRY
case "$SID" in AC*) ;; *) echo "That does not look like an Account SID."; exit 1;; esac
case "$FROM" in +*) ;; *) echo "The number must start with + and the country code."; exit 1;; esac
[ -n "$TOKEN" ] || { echo "No token entered."; exit 1; }
sed -i '/^TWILIO_/d;/^SMS_DRY_RUN=/d' .env
{ echo "TWILIO_ACCOUNT_SID=$SID"; echo "TWILIO_AUTH_TOKEN=$TOKEN"; echo "TWILIO_FROM=$FROM"; } >> .env
case "$DRY" in y|Y) echo "SMS_DRY_RUN=1" >> .env;; esac
chmod 600 .env
docker compose up -d
echo "Done. Sign up with your own number at /tournaments/paddle-europe-canoe-polo-club-championships-2026/text-updates"
