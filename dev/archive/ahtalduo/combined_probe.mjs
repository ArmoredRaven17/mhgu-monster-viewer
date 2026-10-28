// Ahtal-Ka + Ahtal-Neset: the combined list played headless (dev/em088-em087-combined-spec.md 6). Edge headless, the page from
// --url (or a server of its own), dev/archive/ahtalduo/combined_page.js evaluated in it. Usage:
//   node dev/archive/ahtalduo/combined_probe.mjs --url http://localhost:5713 [--only <entry substring>] [--lift]
// The attack-clip effects IN THE VIEWER. dev/effect-clip-soak.mjs plays a monster's CLIP_EFFECTS schedule headless on
// fixed joints; this plays it the way the page does: every motion by the viewer's own pose driver on its real animation
// (the joint matrices live.js writeJoints hands the effects), one 1/60 s frame at a time through the viewer's own render
// (the effect anchor's hook: live.js frame -> writeJoints -> schedule.step -> draw), in headless Edge. A branch of the
// ROM's code that only the animated joints (or the viewer's camera) reach shows up here as the refusal the live page
// would stop on -- live.js fail() stops every effect of the monster at the first one.
//
//   node dev/effect-live-soak.mjs <monster> [motion key ...] [--url http://localhost:3000] [--swiftshader] [--camera sweep] [--rage] [--wiring] [--rock <variant>]
//        [--beam-state '{"tired":true,"rage":true,"rank":4,"parts":{"headBroken":true}}']
//
// Without --url it serves docs/ itself (dev/serve.py on a free port). Each motion is played whole, twice (a motion the
// viewer splits: its _start once, then its _loop twice), with the viewer's clip loop on; after a refusal the runtime is
// remounted for the next motion. The viewer's own animation loop is stopped first, so nothing else steps. The GPU, or
// software GL with --swiftshader (the same counts, ten times slower). Exit code 1 when any motion refused.
// --camera sweep: the camera circles the monster's orbit target each frame at a distance that swings from inside the
// body out past the fitted view -- what a viewer's zoom and orbit reach -- instead of staying where the view was fitted
// (the effects' draw reads the camera: sort keys, facing, fades). --rage: the effects mounted enraged, so the rage
// auras run through every motion (live.js setRage, as the viewer's Enraged toggle starts them). --wiring: every 15
// frames, each visible effect material's compiled program is read back from WebGL: active uniforms the viewer never
// set (they read 0), attributes the geometry lacks (a constant), samplers with no texture -- per program, at the end.
// --rock <variant>: a monster's shells with that pick fixed (shells.js pickVariantsFor names them: Savage's shell00_0 /
// shell00_8 / shell54_0, Nargacuga's 7:0x28 .., Rathian's 7:0x02 ..), everything else as the viewer gives it (its
// rockInput: the target ahead on the grid floor; its shellExtra). Motions named on the command line play even when they
// carry no clip effect of their own.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = 'C:/MHGU-Extract/MHGU-Monster-Viewer/dev';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const argv = process.argv.slice(2);
const opt = name => { const i = argv.indexOf(name); return i >= 0 ? argv.splice(i, 2)[1] : null; };
const flag = name => { const i = argv.indexOf(name); return i >= 0 ? (argv.splice(i, 1), true) : false; };
let site = opt('--url');
const swiftshader = flag('--swiftshader');
const camera = opt('--camera') || 'fit';
const rage = flag('--rage');
const wiring = flag('--wiring');
const rockVariant = opt('--rock');
// --beam-state <json>: the state a beam on its own monster is fired in (render/beam-spawns.js `when`; index.html beamState),
// merged over the viewer's own for the shells' step -- the pick is --rock's
const beamStateOpt = opt('--beam-state');
// --viewer-inputs: the viewer's own shell inputs (index.html rockInput: its pick, the target ahead, the floor, the wall)
// installed as driveClipEffects installs them in the viewer -- which this soak, stepping frames itself, never runs; without
// it (and without --rock) a soak's shells get no input.rock at all
const viewerInputs = flag('--viewer-inputs');
const only = opt('--only');
const lift = flag('--lift');
const edgeOpt = opt('--edge');       // 'sub:from:to' -> pageEdge
const travel = opt('--travel');   // 'L:clip:n;L:clip:n' -> each clip's unit travel (pageTravel)
const shots = opt('--shots');   // 'sub:f1,f2;sub2:f3' -> PNGs in --out (default the OS temp dir)
const outDir = opt('--out') || os.tmpdir();
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
    setTimeout(() => { if (pending.has(i)){ pending.delete(i); rej(new Error('timeout ' + method)); } }, 60000);
  });
  const on = (method, f) => listeners.set(method, [...(listeners.get(method) || []), f]);
  return new Promise(r => { ws.onopen = () => r({ send, on, ws }); });
}
const evaluate = (c, expression) => c.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  .then(r => { if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; });

// Runs IN THE PAGE (serialised): the soak, started and left running; window.__soak holds its progress.


const children = [];
let browserWs = null;
async function main(){
  if (!site){
    const port = await freePort();
    const srv = spawn('python', [path.join(HERE, 'serve.py'), String(port)], { stdio: 'ignore' });
    children.push(srv);
    site = 'http://localhost:' + port;
    await fetch(site + '/index.html').catch(() => null);
    for (let i = 0; i < 100; i++){ try { if ((await fetch(site + '/monsters.json')).ok) break; } catch {} await sleep(100); }
  }
  const dport = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'effect-live-soak-'));
  const edge = spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + dport, '--user-data-dir=' + profile,
    '--inprivate', '--no-first-run', '--no-default-browser-check', '--disable-sync', '--disable-extensions',
    '--disable-features=msImplicitSignin,msEdgeSyncConsent', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    ...(swiftshader ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []), '--window-size=1280,800', 'about:blank'],
    { stdio: 'ignore' });
  children.push(edge);
  const version = await json(`http://127.0.0.1:${dport}/json/version`);
  browserWs = await connect(version.webSocketDebuggerUrl);
  const targets = await json(`http://127.0.0.1:${dport}/json/list`);
  const page = targets.find(t => t.type === 'page' && t.url === 'about:blank');
  for (const t of targets) if (t !== page && t.type === 'page') console.log('warning: another page opened: ' + t.url);
  if (!page) throw new Error('no about:blank page target');
  const c = await connect(page.webSocketDebuggerUrl);
  await c.send('Runtime.enable');
  const errors = [], logged = new Map();
  c.on('Runtime.exceptionThrown', p => errors.push(p.exceptionDetails.exception ? p.exceptionDetails.exception.description : p.exceptionDetails.text));
  // the page's console errors and warnings while the soak runs (a shader that fails to link is logged, not thrown,
  // and its draw is simply not there); counted from the soak's start, each message once
  let soaking = false;
  c.on('Runtime.consoleAPICalled', p => {
    if (!soaking || (p.type !== 'error' && p.type !== 'warning')) return;
    const text = p.args.map(a => a.value !== undefined ? String(a.value) : (a.description || '')).join(' ').slice(0, 300);
    const k = p.type + ': ' + text;
    logged.set(k, (logged.get(k) || 0) + 1);
  });
  await c.send('Page.navigate', { url: site + '/?scene=none' });
  for (let i = 0; ; i++){
    if (await evaluate(c, '!!(window.__view && window.__view.renderer)').catch(() => false)) break;
    if (i > 600) throw new Error('the viewer never came up' + (errors.length ? ': ' + errors[0] : ''));
    await sleep(200);
  }
  soaking = true;
  const PAGE = fs.readFileSync(path.join(HERE, 'archive/ahtalduo/combined_page.js'), 'utf8');
  await evaluate(c, PAGE + `
pageRun(${JSON.stringify(only)}, ${lift});`);
  let S;
  for (let w = 0; w < 1800; w++){ await sleep(1000); S = JSON.parse(await evaluate(c, 'JSON.stringify(window.__play)')); if (S.status !== 'starting') break; }
  console.log('status', S.status);
  for (const o of S.out) console.log(JSON.stringify(o));
  if (edgeOpt){ const [sub, A, B] = edgeOpt.split(':'); console.log('edge', await evaluate(c, PAGE + `
pageEdge(${JSON.stringify(sub)}, ${+A}, ${+B});`)); }
  if (travel){
    for (const part of travel.split(';')){
      const [L, C, N] = part.split(':');
      console.log('travel', await evaluate(c, PAGE + `
pageTravel('em088_00', ${JSON.stringify(L)}, ${JSON.stringify(C)}, ${+N});`));
    }
  }
  if (shots){
    for (const part of shots.split(';')){
      const [sub, fs_, top] = part.split(':');
      for (const f of fs_.split(',')){
        const r = await evaluate(c, PAGE + `
pagePose(${JSON.stringify(sub)}, ${+f}, ${top === 'top'});`);
        const shot = await c.send('Page.captureScreenshot', { format: 'png' });
        const file = path.join(outDir, 'ahtal_' + sub.replace(/\W+/g, '_') + '_' + f + (top === 'top' ? '_top' : '') + '.png');
        fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
        console.log('shot', file, r);
      }
    }
  }
  for (const e of errors) console.log('error', e);
  return 0;
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
