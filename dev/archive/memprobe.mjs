// node memprobe.mjs : serve the viewer, open it in headless Edge, load a spread of monsters, and after each one read
// the page's JS heap + three.js object counts and the whole browser's memory (every msedge process of this profile,
// private working set, from Windows).
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import net from 'node:net'; import os from 'node:os'; import path from 'node:path';
const VIEWER = 'C:/MHGU-Extract/MHGU-Monster-Viewer';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
async function json(url){ for (let i = 0; i < 150; i++){ try { const r = await fetch(url); if (r.ok) return r.json(); } catch {} await sleep(100); } throw new Error('nothing at ' + url); }
function connect(wsUrl){
  const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)){ const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); } };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  return new Promise(r => { ws.onopen = () => r({ send }); });
}
const evaluate = (c, expression) => c.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  .then(r => { if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; });
// the browser's own processes (CDP SystemInfo.getProcessInfo on the browser target), then Windows' figures for each pid
let browserWs = null;
async function browserMem(){
  if (!browserWs) return { privateMB: 0, workingSetMB: 0, byTypeWS: {} };
  const info = await browserWs.send('SystemInfo.getProcessInfo');
  const procs = info.processInfo || [];
  const ids = procs.map(p => p.id).join(',');
  let out = '';
  try { out = execFileSync('powershell', ['-NoProfile', '-Command',
    `Get-Process -Id ${ids} -ErrorAction SilentlyContinue | ForEach-Object { '{0} {1} {2}' -f $_.Id, $_.PrivateMemorySize64, $_.WorkingSet64 }`], { encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
  const byPid = {};
  for (const line of out.trim().split(/\r?\n/)){ const [pid, a, b] = line.trim().split(' '); if (pid) byPid[pid] = [+a, +b]; }
  let priv = 0, ws = 0; const byType = {};
  for (const p of procs){ const m = byPid[p.id]; if (!m) continue; priv += m[0]; ws += m[1];
    byType[p.type] = (byType[p.type] || 0) + m[1] / 1048576; }
  return { privateMB: +(priv / 1048576).toFixed(0), workingSetMB: +(ws / 1048576).toFixed(0),
           byTypeWS: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, +v.toFixed(0)])) };
}
const MONSTERS = process.argv.slice(2).length ? process.argv.slice(2)
  : ['em001_00', 'em002_04', 'em007_04', 'em032_00', 'em043_05', 'em081_04', 'em084_00', 'em033_00', 'em050_00', 'em013_02', 'ems045_00', 'em024_00'];
const kids = [];
try {
  const port = await freePort();
  kids.push(spawn('python', [path.join(VIEWER, 'dev/serve.py'), String(port)], { stdio: 'ignore' }));
  const site = 'http://localhost:' + port;
  for (let i = 0; i < 100; i++){ try { if ((await fetch(site + '/monsters.json')).ok) break; } catch {} await sleep(100); }
  const dport = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'memprobe-'));
  kids.push(spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + dport, '--user-data-dir=' + profile, '--inprivate', '--no-first-run',
    '--enable-precise-memory-info', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--window-size=1600,900', 'about:blank'], { stdio: 'ignore' }));
  const version = await json(`http://127.0.0.1:${dport}/json/version`);
  browserWs = await connect(version.webSocketDebuggerUrl);
  const page = (await json(`http://127.0.0.1:${dport}/json/list`)).find(t => t.type === 'page');
  const c = await connect(page.webSocketDebuggerUrl);
  await c.send('Runtime.enable');
  const blank = await browserMem();
  await c.send('Page.navigate', { url: site + '/' });
  for (let i = 0; ; i++){ if (await evaluate(c, '!!(window.__view && window.__view.renderer)').catch(() => false)) break; if (i > 600) throw new Error('no viewer'); await sleep(200); }
  await sleep(4000);
  if (process.env.STOP) await evaluate(c, `(() => { const el = document.getElementById('setTexCache'); el.value = '${process.env.STOP}'; el.dispatchEvent(new Event('input')); return el.value; })()`);
  const pageRead = `(() => { const V = window.__view, m = performance.memory || {}, i = V.renderer.info;
    return { id: V.state.id, cache: window.__texCache || null, jsHeapMB: +((m.usedJSHeapSize || 0) / 1048576).toFixed(0), jsHeapTotalMB: +((m.totalJSHeapSize || 0) / 1048576).toFixed(0),
             geometries: i.memory.geometries, textures: i.memory.textures, programs: (i.programs || []).length, drawCalls: i.render.calls }; })()`;
  const rows = [{ step: 'viewer open (' + await evaluate(c, 'window.__view.state.id') + ')', ...await evaluate(c, pageRead), ...await browserMem() }];
  for (const id of MONSTERS){
    await evaluate(c, `(async () => { const s = document.getElementById('monSel'); if (![...s.options].some(o => o.value === '${id}')) s.add(new Option('${id}', '${id}')); s.value = '${id}'; await s.onchange(); return 1; })()`);
    await sleep(5000);                                   // the clip plays, effects start, the GC settles a little
    rows.push({ step: id, ...await evaluate(c, pageRead), ...await browserMem() });
  }
  console.log(JSON.stringify({ blankBrowser: blank, rows }, null, 1));
} finally { for (const k of kids) try { k.kill(); } catch {} }
process.exit(0);
