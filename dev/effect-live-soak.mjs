// The attack-clip effects IN THE VIEWER. dev/effect-clip-soak.mjs plays a monster's CLIP_EFFECTS schedule headless on
// fixed joints; this plays it the way the page does: every motion by the viewer's own pose driver on its real animation
// (the joint matrices live.js writeJoints hands the effects), one 1/60 s frame at a time through the viewer's own render
// (the effect anchor's hook: live.js frame -> writeJoints -> schedule.step -> draw), in headless Edge. A branch of the
// ROM's code that only the animated joints (or the viewer's camera) reach shows up here as the refusal the live page
// would stop on -- live.js fail() stops every effect of the monster at the first one.
//
//   node dev/effect-live-soak.mjs <monster> [motion key ...] [--url http://localhost:3000] [--swiftshader] [--camera sweep] [--rage]
//
// Without --url it serves docs/ itself (dev/serve.py on a free port). Each motion is played whole, twice (a motion the
// viewer splits: its _start once, then its _loop twice), with the viewer's clip loop on; after a refusal the runtime is
// remounted for the next motion. The viewer's own animation loop is stopped first, so nothing else steps. The GPU, or
// software GL with --swiftshader (the same counts, ten times slower). Exit code 1 when any motion refused.
// --camera sweep: the camera circles the monster's orbit target each frame at a distance that swings from inside the
// body out past the fitted view -- what a viewer's zoom and orbit reach -- instead of staying where the view was fitted
// (the effects' draw reads the camera: sort keys, facing, fades). --rage: the effects mounted enraged, so the rage
// auras run through every motion (live.js setRage, as the viewer's Enraged toggle starts them).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const argv = process.argv.slice(2);
const opt = name => { const i = argv.indexOf(name); return i >= 0 ? argv.splice(i, 2)[1] : null; };
const flag = name => { const i = argv.indexOf(name); return i >= 0 ? (argv.splice(i, 1), true) : false; };
let site = opt('--url');
const swiftshader = flag('--swiftshader');
const camera = opt('--camera') || 'fit';
const rage = flag('--rage');
const [monster, ...only] = argv;
if (!monster){ console.log('usage: node dev/effect-live-soak.mjs <monster> [motion key ...] [--url <viewer>] [--swiftshader]'); process.exit(2); }
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
function pageSoak(MONID, ONLY, CAMERA, RAGE){
  window.__soak = { status: 'starting', results: [], t0: performance.now() };
  (async () => {
    const S = window.__soak;
    try {
      const V = window.__view;
      const M = await import('/render/monster.js');
      // a task boundary (not a timer: a background page's timers are throttled), so the harness's polls get in
      const yieldTask = () => new Promise(r => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
      const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
      if (V.state.id !== MONID){
        if (![...monSel.options].some(o => o.value === MONID)) monSel.add(new Option(MONID, MONID));
        monSel.value = MONID; await monSel.onchange();
      }
      V.state.loop = true;                                   // the clip loop on: the second pass walks the loop
      await V.effects(false); await V.effects(true);
      let fx = M.effectRuntimeInstance();
      if (RAGE && fx) fx.setRage(true);
      const sched = M.CLIP_EFFECTS[MONID] || {};
      // a monster with no clip effects (its effects are auras) plays its first clip for 600 frames instead: '(idle)'
      const keys0 = Object.keys(sched);
      const keys = (keys0.length ? keys0 : ['(idle)']).filter(k => !ONLY.length || ONLY.includes(k));
      S.total = keys.length;
      const pose = V.pose;
      pose.clock.getDelta = () => 1 / 60;                    // one frame a step, whatever the wall clock did
      const entry = V.MON.monsters.find(e => e.id === MONID);
      const R0 = V.camera.position.distanceTo(V.controls.target) || 1;
      let tick = 0;
      const placeCamera = () => {
        if (CAMERA !== 'sweep') return;
        const c = V.controls.target, k = tick++ / 60;
        const r = R0 * (0.01 + 1.2 * (0.5 + 0.5 * Math.sin(k * 0.7)));
        V.camera.position.set(c.x + r * Math.cos(k * 0.9), c.y + r * 0.35 * Math.sin(k * 0.5), c.z + r * Math.sin(k * 0.9));
        V.camera.lookAt(c);
        V.camera.updateMatrixWorld();
      };
      for (const key of keys){
        // 'L<list> Motion[N]': that list's slot (split or whole); a bare key is a clip's own name in whichever list
        // carries it -- a full animation on the joined list (ROM_ANIMATIONS, Khezu's 'Motion 3'), as clipEffectsFor
        // matches it
        const m = /^L(\S+) (Motion\[\d+\])$/.exec(key);
        const idle = key === '(idle)';
        const list = idle ? entry.lists[0] : m ? entry.lists.find(l => l.id === m[1]) : entry.lists.find(l => l.clips.some(c => c.clip === key));
        const base = idle ? (list && list.clips[0] && list.clips[0].clip) : m ? m[2] : key;
        const parts = !list || !base ? [] : idle ? [[base, Math.max(1, Math.ceil(600 / Math.max(1, Math.round(list.clips[0].dur * 60))))]]
                    : list.clips.some(c => c.clip === base) ? [[base, 2]]
                    : [[base + '_start', 1], [base + '_loop', 2]].filter(([n]) => list.clips.some(c => c.clip === n));
        if (!parts.length){ S.results.push({ key, skip: !list ? 'no list carries it' : 'no clip' }); continue; }
        if (!fx || fx.failed){ await V.effects(false); await V.effects(true); fx = M.effectRuntimeInstance(); if (RAGE && fx) fx.setRage(true); }
        const starts0 = fx.schedule.starts, regrouped0 = fx.stats.regrouped || 0;
        let frames = 0, fail = null, maxRun = 0, drew = 0;
        if (V.state.list !== list.id){ listSel.value = list.id; await listSel.onchange(); }
        for (const [clipName, passes] of parts){
          clipSel.value = clipName; await clipSel.onchange();
          const n = Math.round(list.clips.find(x => x.clip === clipName).dur * 60) * passes;
          // index.html driveClipEffects, as it is: the bare slot name, a _loop clip offset by its _start's length
          let splitOffset = 0;
          if (clipName.endsWith('_loop')){ const sib = list.clips.find(x => x.clip === base + '_start'); if (sib) splitOffset = Math.round(sib.dur * 60); }
          for (let f = 0; f < n; f++){
            pose.step([V.mounted.main]);
            const act = pose.action;
            const nm = act && act.getClip ? act.getClip().name : null;
            const b = nm ? nm.replace(/_(start|loop)$/, '') : null;
            fx.schedule.setClip(act ? V.state.id + '|' + V.state.list + '|' + b : null, act ? act.time * 60 + splitOffset : 0,
                                b ? M.clipEffectsFor(V.state.id, b, V.state.list) : null, splitOffset);
            placeCamera();
            fx.last = null; fx.acc = 1 / 60 + 1e-9;          // exactly one effect step in this render
            V.renderer.render(V.scene, V.camera);
            frames++;
            maxRun = Math.max(maxRun, fx.stats.running || 0);
            drew += (fx.stats.prims || 0) + (fx.stats.models || 0) + (fx.stats.gpu || 0);
            if (fx.failed){ fail = fx.failed; break; }
            if ((f & 15) === 15) await yieldTask();
          }
          if (fail) break;
        }
        S.results.push({ key, frames, starts: fx.schedule.starts - starts0, maxRun, drew, regrouped: (fx.stats.regrouped || 0) - regrouped0, fail });
      }
      S.status = 'done';
    } catch (e){ S.status = 'error: ' + (e && e.stack || e); }
    S.secs = Math.round((performance.now() - S.t0) / 1000);
  })();
  return 'started';
}

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
  await evaluate(c, '__view.renderer.setAnimationLoop(null), true');      // only the soak steps from here on
  soaking = true;
  console.log(await evaluate(c, `(${pageSoak.toString()})(${JSON.stringify(monster)}, ${JSON.stringify(only)}, ${JSON.stringify(camera)}, ${JSON.stringify(rage)})`), monster, 'in', site, 'camera', camera, rage ? 'enraged' : '');
  let shown = 0, refused = 0, S;
  for (;;){
    await sleep(2000);
    S = JSON.parse(await evaluate(c, 'JSON.stringify(window.__soak)'));
    for (const r of S.results.slice(shown)){
      if (r.skip) console.log(`  ${r.key}: not played (${r.skip})`);
      else {
        if (r.fail) refused++;
        console.log(`  ${r.key}: ${r.frames} frames, ${r.starts} started, up to ${r.maxRun} running, ${r.drew} draws` + (r.regrouped ? `, ${r.regrouped} model draws on a regrouped mesh` : '') + (r.fail ? `  REFUSED: ${r.fail}` : ''));
      }
    }
    shown = S.results.length;
    if (S.status !== 'starting') { if (S.status === 'done' || S.status.startsWith('error')) break; }
  }
  if (S.status !== 'done') console.log(S.status);
  for (const [k, n] of logged) console.log('console ' + k + (n > 1 ? '  (x' + n + ')' : ''));
  const consoleErrors = [...logged.keys()].filter(k => k.startsWith('error')).length;
  console.log(`${monster}: ${S.results.filter(r => !r.skip).length} motions played in the viewer, ${refused} refused (${S.secs} s)`);
  if (consoleErrors) console.log(consoleErrors + ' console error(s) during the soak');
  return refused || consoleErrors || S.status !== 'done' ? 1 : 0;
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
