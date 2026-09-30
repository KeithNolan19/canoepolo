// Makes a safe copy of the database into data/backups/ and keeps the newest 30.
// On the server this runs automatically every night (see deploy/setup-server.sh).
const fs = require('fs');
const path = require('path');
const db = require('./db');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const dir = path.join(DATA_DIR, 'backups');
fs.mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
const file = path.join(dir, `canoepolo-${stamp}.db`);

db.backup(file)
  .then(() => {
    const old = fs.readdirSync(dir).filter((f) => f.endsWith('.db')).sort().reverse().slice(30);
    old.forEach((f) => fs.unlinkSync(path.join(dir, f)));
    console.log('Backup written:', file);
  })
  .catch((err) => { console.error('Backup failed:', err); process.exit(1); });
