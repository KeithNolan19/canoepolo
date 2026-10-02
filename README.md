# canoepolo.eu - The Home of International Canoe Polo

A small, fast website where you (the admin) post canoe polo tournaments, and players around the world can browse, filter and add them to their calendars.

**What's included**

- Public site: upcoming & past tournaments, filters (country, level, division, month, search), a page per tournament
- "Add to calendar" per tournament, plus a subscribe-able calendar of everything (`/calendar.ics`)
- Admin panel at `/admin` - add, edit, cancel, feature or delete tournaments
- Automatic HTTPS, nightly database backups, sitemap for Google
- Runs on one **$6/month DigitalOcean Droplet**

---

## Part 1 - Put the code on GitHub (from your home laptop, ~10 min)

GitHub stores your code so your server can download it, and makes future updates a one-line command.

1. Unzip `canoepolo.zip` on your home laptop.
2. Create a free account at <https://github.com> if you don't have one.
3. Click **+ → New repository**. Name it `canoepolo`. Choose **Private**. Click **Create repository**.
4. On the next page click **"uploading an existing file"**. Drag **everything inside** the unzipped `canoepolo` folder into the browser (the `src`, `views`, `public`, `deploy` folders and all the files). Click **Commit changes**.
   - Hidden files like `.gitignore` may not show on your laptop - that's fine, the site works without them.

Because the repository is private, the server needs a key to read it:

5. On GitHub go to **Settings (your profile) → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**. Give it access to **only the `canoepolo` repository**, permission **Contents: Read-only**. Copy the token (starts with `github_pat_`). You'll paste it in Part 3.

## Part 2 - Create the server on DigitalOcean (~5 min)

1. Sign up at <https://www.digitalocean.com>.
2. **Create → Droplets**
   - Region: **Frankfurt** or **Amsterdam** (central for European players)
   - Image: **Ubuntu 24.04 (LTS)**
   - Size: **Basic → Regular → $6/month** (1 GB RAM)
   - Authentication: **Password** is simplest (choose a strong one and save it). SSH key is more secure if you know how.
   - Optional but recommended: tick **Backups** (~$1.20/month extra) for full server snapshots.
3. Click **Create Droplet**. Copy its **IP address** (e.g. `164.90.xxx.xxx`).

## Part 3 - Point your domain at the server

When you buy `canoepolo.eu`, go to your registrar's **DNS settings** and add:

| Type | Name / Host | Value |
|------|-------------|-------|
| A    | `@`         | your Droplet IP |
| A    | `www`       | your Droplet IP |

Delete any other `A` records for `@` or `www` (registrars often add a "parking" one). DNS can take from a few minutes up to a few hours.

## Part 4 - Install the site on the server (~10 min)

1. In DigitalOcean, open your Droplet and click **Console** (top right). A black terminal window opens in your browser - no extra software needed.
2. Copy and paste these commands one at a time (replace `YOUR-GITHUB-NAME`):

   ```bash
   git clone https://YOUR-GITHUB-NAME@github.com/YOUR-GITHUB-NAME/canoepolo.git
   ```
   When asked for a **password**, paste the **token** from Part 1 step 5 (nothing shows while pasting - that's normal) and press Enter.

   ```bash
   cd canoepolo
   sudo bash deploy/setup-server.sh
   ```
3. The script asks for your domain, an admin username and an admin password (12+ characters). Then it installs everything and starts the site. The first build takes about 3-5 minutes.
4. Visit **https://canoepolo.eu/admin**, log in, and add your first tournament. 🎉

> If the page doesn't load yet, your DNS probably hasn't updated. Wait a bit - the HTTPS certificate is fetched automatically as soon as the domain points to the server.

---

## Everyday use

- **Add / edit tournaments:** <https://canoepolo.eu/admin>
- **Status options:** *Published* (visible), *Draft* (hidden, only you see it), *Cancelled* (stays visible, crossed out)
- **Featured:** pins a tournament to the top of the list
- **Watch page videos:** https://canoepolo.eu/admin → **Videos** tab. Paste any YouTube link, pick a section, and tick *Featured* for the big video at the top.
- **Rules page:** text lives in `src/rules.js` (update it when new ICF rules come out)
- **Referee section:** `/referee` (pathway, all the rules, hand signals) and `/referee/quiz`. Rules list text is in `src/referee.js`; quiz questions are at the top of `public/quiz.js`; signal drawings in `public/signals.js`
- **Homepage cards, Learn hub and Get involved page:** text in `src/community.js`
- **Tactics board:** runs entirely in the visitor's browser (`public/tactics.js`); presets are at the top of that file
- **About page / contact email:** edit `views/about.ejs` (currently says `info@canoepolo.eu`)

## Adding photos

Put real canoe polo photos in `public/images/` (instructions in `public/images/README.txt`):

- `hero.jpg`: the big photo at the top of the homepage (landscape, at least 1920 x 800 px)
- `hero.txt` (optional): a one-line photo credit, e.g. `Photo: Jane Murphy, Irish Open 2025`
- `shop.jpg` (optional): photo for the Shop page

Only use photos you took or have permission to use. Without `hero.jpg` the homepage simply shows the navy intro panel.

## Automatic updates (recommended)

Switch this on once and the server checks GitHub every 5 minutes and deploys new code by itself. In the Droplet Console:

cd ~/canoepolo
git pull
sudo bash deploy/enable-auto-update.sh

It asks for your GitHub token once and keeps it in a root-only file on the server. When the token expires, make a new one and run the script again. See what happened: tail -n 30 /var/log/canoepolo-auto-update.log. Switch off: sudo rm /etc/cron.d/canoepolo-auto-update

Updating the site after code changes

Change files on GitHub (you can edit directly in the browser), then in the Droplet Console:

```bash
cd ~/canoepolo
sudo bash deploy/update.sh
```

## Useful commands (in the Droplet Console, inside `~/canoepolo`)

| What | Command |
|------|---------|
| Is it running? | `docker compose ps` |
| See recent logs | `docker compose logs --tail 100 app` |
| Restart | `docker compose restart` |
| Make a backup now | `docker compose exec app node src/backup.js` |
| List backups | `docker compose exec app ls data/backups` |
| Change admin password | `nano .env` (edit `ADMIN_PASSWORD`, save with Ctrl+O, Enter, Ctrl+X), then `docker compose up -d` |

Backups run automatically every night at 03:00 and the last 30 are kept.

### Restoring a backup

```bash
docker compose exec app ls data/backups                      # pick a file name
docker compose stop app
docker compose run --rm --no-deps app sh -c "cp data/backups/FILE-NAME.db data/canoepolo.db && rm -f data/canoepolo.db-wal data/canoepolo.db-shm"
docker compose start app
```

---

## For developers (running it on your own laptop)

Requires Node.js 20+.

```bash
npm install
npm run seed      # optional: adds example tournaments
npm run dev       # http://localhost:3000  (admin / change-me-please)
```

**Tech:** Node.js + Express 5, SQLite (better-sqlite3), EJS templates, plain CSS. Docker + Caddy for deployment.

**Project layout**

```
src/server.js        routes (public pages, API, admin)
src/tournaments.js   database queries + validation
src/db.js            database schema
src/constants.js     countries, levels, divisions (edit to add more)
src/ical.js          calendar (.ics) export
src/backup.js        backup script
views/               page templates
public/              CSS, JS, icon
deploy/              server setup & update scripts
```

**API**

- The public JSON API is switched off (copying and scraping are not allowed; see the terms page).
- `GET /calendar.ics` - all upcoming tournaments as a calendar feed
