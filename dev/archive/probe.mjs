// headless probe: node probe.mjs <page-script.js>  -- serves MHGU-Monster-Viewer/docs, opens the viewer, evals the script
import { spawn } from 'node:child_process';
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
const kids = [];
try {
  const port = await freePort();
  kids.push(spawn('python', [path.join(VIEWER, 'dev/serve.py'), String(port)], { stdio: 'ignore' }));
  const site = 'http://localhost:' + port;
  for (let i = 0; i < 100; i++){ try { if ((await fetch(site + '/monsters.json')).ok) break; } catch {} await sleep(100); }
  const dport = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'probe-'));
  kids.push(spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + dport, '--user-data-dir=' + profile, '--inprivate', '--no-first-run',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--window-size=1280,800', 'about:blank'], { stdio: 'ignore' }));
  await json(`http://127.0.0.1:${dport}/json/version`);
  const targets = await json(`http://127.0.0.1:${dport}/json/list`);
  const page = targets.find(t => t.type === 'page');
  const c = await connect(page.webSocketDebuggerUrl);
  await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: site + '/?scene=none' });
  for (let i = 0; ; i++){ if (await evaluate(c, '!!(window.__view && window.__view.renderer)').catch(() => false)) break; if (i > 600) throw new Error('no viewer'); await sleep(200); }
  const script = fs.readFileSync(process.argv[2], 'utf8');
  console.log(JSON.stringify(await evaluate(c, '(async () => {' + script + '})()'), null, 1));
} finally { for (const k of kids) try { k.kill(); } catch {} }
process.exit(0);
