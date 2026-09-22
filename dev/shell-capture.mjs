// THE SHELLS' INPUTS AS THE VIEWER GIVES THEM, step by step -- for the recorder. A shell's flight starts from the
// monster's ANIMATED joints (the launch joint at the spawn frame, the clip's pose), which the recorder's plans cannot
// get from a rest pose: a fireball thrown on a blend partner's pose flies and lands elsewhere, and takes branches the
// rest-pose flight never reaches. So the viewer plays the clip (its own pose driver, one 1/60 s step at a time, as
// dev/effect-live-soak.mjs does) with a fixed pick, and every step logs what schedule.js stepShells hands shells.js: the
// clip, its frame, the pick (the viewer's own rockInput), the owner's facing and position, and every joint matrix
// live.js writes (gameJoints). No effect runs, so a refusal cannot cut the clip short. efx/shellplan.mjs --inputs
// replays exactly those steps.
//
//   node dev/shell-capture.mjs <monster> <list> <clip> <variant> <out json> [--steps n] [--url http://localhost:3000]
//
// ONE PLAY: the clip's loop is off, so it plays once and holds its last frame (no new spawns), and the capture runs the
// clip's length plus 300 steps (--steps overrides) -- every shell it logs belongs to that play, the landings included.
//
// Without --url it serves docs/ itself (dev/serve.py on a free port), in a fresh private headless Edge.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const argv = process.argv.slice(2);
const opt = (name, d) => { const i = argv.indexOf(name); return i >= 0 ? argv.splice(i, 2)[1] : d; };
let site = opt('--url', null);
const STEPS = +opt('--steps', '0');
const [MON, LIST, CLIP, VARIANT, OUT] = argv;
if (!OUT) throw new Error('usage: node dev/shell-capture.mjs <monster> <list> <clip> <variant> <out json> [--steps n]');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
async function json(url){
  for (let i = 0; i < 150; i++){ try { const r = await fetch(url); if (r.ok) return r.json(); } catch {} await sleep(100); }
  throw new Error('nothing at ' + url);
}
function connect(wsUrl){
  const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map();
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)){ const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); } };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  return new Promise(r => { ws.onopen = () => r({ send, ws }); });
}
const evaluate = (c, expression) => c.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  .then(r => { if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; });

// IN THE PAGE: play the clip once (its loop off) for its length + 300 steps (or N), logging each step's shell inputs
async function pageCapture(MONID, LISTID, CLIPNAME, VAR, N){
  const V = window.__view;
  const M = await import('/render/monster.js');
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (V.state.id !== MONID){
    if (![...monSel.options].some(o => o.value === MONID)) monSel.add(new Option(MONID, MONID));
    monSel.value = MONID; await monSel.onchange();
  }
  V.state.loop = false;                                  // one play, held on its last frame
  await V.effects(false); await V.effects(true);
  const fx = M.effectRuntimeInstance();
  if (!fx || !fx.schedule || !fx.schedule.shells) return { error: 'no shells for ' + MONID };
  const S = fx.schedule;
  // THE INPUTS ONLY: no effect runs here (a refusal would stop the page's effects, and with them the steps) -- each step
  // the pose is advanced, live.js writeJoints lays the joints the shells read (gameJoints: every mapped bone), and the
  // step's inputs are logged exactly as schedule.js stepShells builds them: the clip (driveClipEffects' key, frame and
  // split offset), the viewer's own rockInput with the pick fixed, the facing (ownerYaw16) and the unit's position
  const steps = [];
  const list = V.MON.monsters.find(e => e.id === MONID).lists.find(l => l.id === LISTID);
  if (!list) return { error: 'no list ' + LISTID };
  if (V.state.list !== list.id){ listSel.value = list.id; await listSel.onchange(); }
  clipSel.value = CLIPNAME; await clipSel.onchange();
  const pose = V.pose;
  pose.clock.getDelta = () => 1 / 60;
  const base = CLIPNAME.replace(/_(start|loop)$/, '');
  let splitOffset = 0;
  if (CLIPNAME.endsWith('_loop')){ const sib = list.clips.find(x => x.clip === base + '_start'); if (sib) splitOffset = Math.round(sib.dur * 60); }
  const clipDef = list.clips.find(x => x.clip === CLIPNAME);
  if (!clipDef) return { error: 'no clip ' + CLIPNAME + ' in list ' + LISTID };
  const steps0 = N || Math.round(clipDef.dur * 60) + 300;
  for (let f = 0; f < steps0; f++){
    pose.step([V.mounted.main]);
    V.mounted.main.updateMatrixWorld(true);
    fx.writeJoints();
    const act = pose.action;
    const nm = act && act.getClip ? act.getClip().name : null;
    const b = nm ? nm.replace(/_(start|loop)$/, '') : null;
    const r = V.rockInput();
    const rock = r && { ...r, variant: VAR === '-' ? null : VAR };
    const P = fx.parent.position;
    const joints = {};
    for (const [gid, m] of fx.gameJoints) joints[gid] = Array.from(m);
    const extra = V.shellExtra ? V.shellExtra() : {};
    steps.push({ list: act ? V.state.list : null, clip: act ? b : null, frame: act ? act.time * 60 + splitOffset : 0,
                 loopStart: act && splitOffset ? splitOffset : null, rage: false, rock, extra,
                 owner: rock ? { x: 0, y: S.ownerYaw16(), z: 0 } : null, ownerPos: { x: P[0], y: P[1], z: P[2] }, joints });
  }
  // kept in the page and fetched in slices: every joint of every step is several MB, too much for one reply
  window.__capSteps = steps;
  return { n: steps.length };
}

const children = [];
let browserWs = null;
async function main(){
  if (!site){
    const port = await freePort();
    children.push(spawn('python', [path.join(HERE, 'serve.py'), String(port)], { stdio: 'ignore' }));
    site = 'http://localhost:' + port;
    for (let i = 0; i < 100; i++){ try { if ((await fetch(site + '/monsters.json')).ok) break; } catch {} await sleep(100); }
  }
  const dport = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'shell-capture-'));
  children.push(spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + dport, '--user-data-dir=' + profile, '--inprivate',
    '--no-first-run', '--no-default-browser-check', '--disable-sync', '--disable-extensions',
    '--disable-features=msImplicitSignin,msEdgeSyncConsent', '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--window-size=1280,800', 'about:blank'], { stdio: 'ignore' }));
  const version = await json(`http://127.0.0.1:${dport}/json/version`);
  browserWs = await connect(version.webSocketDebuggerUrl);
  const page = (await json(`http://127.0.0.1:${dport}/json/list`)).find(t => t.type === 'page' && t.url === 'about:blank');
  const c = await connect(page.webSocketDebuggerUrl);
  await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: site + '/?scene=none' });
  for (let i = 0; ; i++){
    if (await evaluate(c, '!!(window.__view && window.__view.renderer && window.__view.motionStates)').catch(() => false)) break;
    if (i > 600) throw new Error('the viewer never came up');
    await sleep(200);
  }
  // the viewer's own loop stopped, so nothing else steps the effects
  await evaluate(c, 'window.__view.renderer.setAnimationLoop(null), true');
  const res = await evaluate(c, `(${pageCapture.toString()})(${JSON.stringify(MON)}, ${JSON.stringify(LIST)}, ${JSON.stringify(CLIP)}, ${JSON.stringify(VARIANT)}, ${STEPS})`);
  if (res.error) throw new Error(res.error);
  const steps = [];
  for (let i = 0; i < res.n; i += 50)
    steps.push(...JSON.parse(await evaluate(c, `JSON.stringify(window.__capSteps.slice(${i}, ${i + 50}))`)));
  fs.writeFileSync(OUT, JSON.stringify({ monId: MON, list: LIST, clip: CLIP, variant: VARIANT, steps }));
  console.log(JSON.stringify({ steps: steps.length, out: OUT }));
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
