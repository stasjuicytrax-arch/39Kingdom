// Stage G: print.html -> public/downloads/39-kingdom-press-kit-2026.pdf
// build -> vite preview -> headless Edge/Chrome --print-to-pdf.
// The PDF lands in public/, so run `npm run build` again before deploying.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, statSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const PORT = 4179;
const OUT = resolve('public/downloads/39-kingdom-press-kit-2026.pdf');
const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];
const browser = process.env.BROWSER || BROWSERS.find((p) => existsSync(p));
if (!browser) throw new Error('No Edge/Chrome found (set BROWSER=path)');

const isWin = process.platform === 'win32';
const npx = isWin ? 'npx.cmd' : 'npx';

if (!process.env.SKIP_BUILD) {
  const b = spawnSync(isWin ? 'npm.cmd' : 'npm', ['run', 'build'], { stdio: 'inherit', shell: isWin });
  if (b.status !== 0) process.exit(b.status ?? 1);
}

const server = spawn(npx, ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe', shell: isWin });
const kill = () => { try { isWin ? spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F']) : server.kill(); } catch {} };
process.on('exit', kill);

const url = `http://localhost:${PORT}/39Kingdom/print.html`;
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(url)).ok) break; } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

mkdirSync(resolve('public/downloads'), { recursive: true });
const r = spawnSync(
  browser,
  ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--run-all-compositor-stages-before-draw',
   '--virtual-time-budget=20000', `--print-to-pdf=${OUT}`, url],
  { stdio: 'inherit' },
);
kill();
if (r.status !== 0 || !existsSync(OUT)) { console.error('PDF failed'); process.exit(1); }
console.log(`PDF: ${OUT} (${(statSync(OUT).size / 1048576).toFixed(1)} MB)`);
process.exit(0);
