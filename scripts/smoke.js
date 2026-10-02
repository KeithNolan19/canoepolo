// Quick safety check: `npm test`. Starts the site on a spare port with a throwaway database,
// loads every page in the sitemap and fails if any is not a 200. Also syntax-checks all JS.
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');

const root = path.join(__dirname, '..');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.name === 'node_modules' || e.name.startsWith('.') ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []);
let bad = 0;
for (const f of [...walk(path.join(root, 'src')), ...walk(path.join(root, 'public')), ...walk(path.join(root, 'scripts'))]) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { bad++; console.error('SYNTAX', path.relative(root, f), String(e.stderr).split('\n')[0]); }
}

const port = 4900 + Math.floor(Math.random() * 90);
const base = `http://localhost:${port}`;
const ua = { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36' };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-smoke-'));
const srv = spawn(process.execPath, ['src/server.js'], { cwd: root, env: { ...process.env, PORT: port, DATA_DIR: dir, LIVE_SCORES: 'off', SMS_DRY_RUN: '1' }, stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let up = false;
  for (let i = 0; i < 40 && !up; i++) { await sleep(250); try { up = (await fetch(base + '/health')).ok; } catch { /* not yet */ } }
  if (!up) { console.error('Server did not start'); srv.kill(); process.exit(1); }
  const xml = await (await fetch(base + '/sitemap.xml', { headers: ua })).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, ''));
  for (const u of ['/', '/tactics', '/privacy', '/terms', ...urls]) {
    const r = await fetch(base + u, { headers: ua });
    if (r.status !== 200) { bad++; console.error(r.status, u); }
  }
  console.log(`Checked ${urls.length + 4} pages${bad ? `, ${bad} problem(s)` : ', all fine'}.`);
  srv.kill();
  fs.rmSync(dir, { recursive: true, force: true });
  process.exit(bad ? 1 : 0);
})();
