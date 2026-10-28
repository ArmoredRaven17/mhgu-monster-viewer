// THE BREAK / STATE DRIVER IN THE VIEWER (render/motion-states.js, index.html driveMotionStates), checked on the page's
// own render loop in headless Edge: for each motion Savage's table lists, what the display shows while it plays (the
// parts drawn, the rage shown to the materials and the effects), which effect records it requests and when, and that
// the user's own choices come back when the motion is over -- with the parts intact, the Jaw broken, the Face broken,
// calm and enraged, looping and played once.
//
//   node dev/motion-states-check.mjs [--url http://localhost:3000]
//
// Without --url it serves docs/ itself (dev/serve.py on a free port) in a fresh private profile, so nothing is saved
// into anyone's viewer. Prints PASS / FAIL per item; exit 1 on any FAIL.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = 'C:/MHGU-Extract/MHGU-Monster-Viewer/dev';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const argv = process.argv.slice(2);
const opt = name => { const i = argv.indexOf(name); return i >= 0 ? argv.splice(i, 2)[1] : null; };
let site = opt('--url');
const CHECK = argv[0];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });

async function json(url, init){
  for (let i = 0; i < 150; i++){ try { const r = await fetch(url, init); if (r.ok) return r.json(); } catch {} await sleep(100); }
  throw new Error('nothing at ' + url);
}
function connect(wsUrl){
  const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map(); const listeners = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)){ const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
    else if (m.method) (listeners.get(m.method) || []).forEach(f => f(m.params));
  };
  ws.onclose = () => { for (const { rej } of pending.values()) rej(new Error('socket closed')); pending.clear(); };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params }));
    setTimeout(() => { if (pending.has(i)){ pending.delete(i); rej(new Error('timeout ' + method)); } }, 9000000);
  });
  const on = (method, f) => listeners.set(method, [...(listeners.get(method) || []), f]);
  return new Promise(r => { ws.onopen = () => r({ send, on, ws }); });
}
const evaluate = (c, expression) => c.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  .then(r => { if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; });

// Runs IN THE PAGE (serialised). Returns [[ok, label, detail], ...].
const children = [];
let browserWs = null;
async function main(){
  if (!site){
    const port = await freePort();
    const srv = spawn('python', [path.join(HERE, 'serve.py'), String(port)], { stdio: 'ignore' });
    children.push(srv);
    site = 'http://localhost:' + port;
    for (let i = 0; i < 100; i++){ try { if ((await fetch(site + '/monsters.json')).ok) break; } catch {} await sleep(100); }
  }
  const dport = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-states-check-'));
  const edge = spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + dport, '--user-data-dir=' + profile,
    '--inprivate', '--no-first-run', '--no-default-browser-check', '--disable-sync', '--disable-extensions',
    '--disable-features=msImplicitSignin,msEdgeSyncConsent', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--window-size=1280,800', 'about:blank'],
    { stdio: 'ignore' });
  children.push(edge);
  const version = await json(`http://127.0.0.1:${dport}/json/version`);
  browserWs = await connect(version.webSocketDebuggerUrl);
  const targets = await json(`http://127.0.0.1:${dport}/json/list`);
  const page = targets.find(t => t.type === 'page' && t.url === 'about:blank');
  if (!page) throw new Error('no about:blank page target');
  const c = await connect(page.webSocketDebuggerUrl);
  await c.send('Runtime.enable');
  const errors = [];
  c.on("Runtime.exceptionThrown", p => errors.push(JSON.stringify({d: p.exceptionDetails.exception && p.exceptionDetails.exception.description, u: p.exceptionDetails.url, l: p.exceptionDetails.lineNumber, c: p.exceptionDetails.columnNumber, s: p.exceptionDetails.scriptId})));
  c.on('Runtime.consoleAPICalled', p => { if (p.type === 'error') errors.push(p.args.map(a => a.value !== undefined ? String(a.value) : (a.description || '')).join(' ').slice(0, 300)); });
  await c.send('Page.navigate', { url: site + '/?scene=none' });
  for (let i = 0; ; i++){
    if (await evaluate(c, '!!(window.__view && window.__view.renderer && window.__view.motionStates)').catch(() => false)) break;
    if (i > 600) throw new Error('the viewer never came up' + (errors.length ? ': ' + errors[0] : ''));
    await sleep(200);
  }
  const before = 0;
  let fail0 = 0;
  const res = [];
  const mod = await import(pathToFileURL(CHECK).href);
  for (const a of (mod.args && mod.args.length ? mod.args : [[]]))
    res.push(...await evaluate(c, '(' + mod.pageCheck.toString() + ')(' + a.map(x => JSON.stringify(x)).join(', ') + ')'));
  let fail = fail0;
  for (const [ok, label, detail] of res){
    if (!ok) fail++;
    console.log((ok ? 'PASS ' : 'FAIL ') + label + (detail ? '  -- ' + detail : ''));
  }
  const errs = errors.slice(before).filter(e => !/unknown scene: none/.test(e));      // ?scene=none: no scene, no saving
  for (const e of errs) console.log('page error: ' + e);
  console.log(`\n${res.length - fail} passed, ${fail} failed` + (errs.length ? `, ${errs.length} page error(s)` : ''));
  return fail || errs.length ? 1 : 0;
}

let code = 1;
try { code = await main(); }
catch (e){ console.log('FAILED: ' + e.message); }
finally {
  if (browserWs) await browserWs.send('Browser.close').catch(() => {});
  await sleep(500);
  for (const ch of children) try { ch.kill(); } catch {}
}
process.exit(code);
