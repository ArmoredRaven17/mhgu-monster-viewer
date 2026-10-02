// Does a SPACE-1 record sit on its JOINT, or at the parent's origin?
//
// The placement 0x31d16c tests the parent unit's model resource at +0xf0 (0x31f6b4). With a model it
// takes the joint's matrix and the record's offset comes out ROTATED AND SCALED by it (0x31f6c0, the
// multiply at 0x1ebe8); with 0 it falls back to the parent's bare +0x40 position plus the RAW offset
// (0x31f788: three vadd.f32). The result lands in the effect unit's own uCoord +0x40 either way.
//
// WHY A PLAIN SOAK CANNOT SEE THE DIFFERENCE, which is why this file exists (EMC agent, 2026-09-29):
// with the parent at the origin, identity quaternion and unit scale,
//     fallback   = parentPos + offset
//     model path = parentPos + R * S * offset
// are NUMERICALLY IDENTICAL, because R = I and S = 1. Every soak passes whether the fix works or not.
// So this poses the parent with a real rotation and a scale away from 1 before firing: the two paths
// then differ by (R*S - I) * offset, which for a record with a large offset is tens of game units.
//
//   node dev/placement-check.mjs [monster]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const MON = process.argv[2] || 'em001_00';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
async function json(url){
  for (let i = 0; i < 150; i++){ try { const r = await fetch(url); if (r.ok) return r.json(); } catch {} await sleep(100); }
  throw new Error('nothing at ' + url);
}
function connect(wsUrl){
  const ws = new WebSocket(wsUrl); let id = 0; const pending = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)){ const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
  };
  ws.onclose = () => { for (const { rej } of pending.values()) rej(new Error('socket closed')); pending.clear(); };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params }));
    setTimeout(() => { if (pending.has(i)){ pending.delete(i); rej(new Error('timeout ' + method)); } }, 120000);
  });
  return new Promise(r => { ws.onopen = () => r({ send }); });
}
const evaluate = (c, expression) => c.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  .then(r => { if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; });

function pageCheck(MONID){
  return (async () => {
    const V = window.__view;
    const M = await import('./render/monster.js');
    const monSel = document.getElementById('monSel');
    if (V.state.id !== MONID){
      if (![...monSel.options].some(o => o.value === MONID)) monSel.add(new Option(MONID, MONID));
      monSel.value = MONID; await monSel.onchange();
    }
    if (V.state.id !== MONID) return { error: 'asked ' + MONID + ', holds ' + V.state.id };
    await V.effects(false); await V.effects(true);
    const fx = M.effectRuntimeInstance();
    if (!fx || !fx.parent) return { error: 'no effect runtime or parent' };
    const m = fx.host.m;
    const f32 = a => new Float32Array(new Uint32Array([m.u32(a)]).buffer)[0];
    const vec = a => [f32(a), f32(a + 4), f32(a + 8)];

    // POSE THE PARENT so the two paths diverge: yaw 90 degrees, scale 1.4, offset position.
    const YAW = [0, Math.SQRT1_2, 0, Math.SQRT1_2];          // 90 deg about Y
    const POS = [100, 50, -200], SCALE = 1.4;
    fx.host.setParentPose(fx.parent, { position: POS, quaternion: YAW, scale: SCALE });

    const WANT = [['em001_00u', 900, 144], ['em001_00u', 1302, 200], ['em001_00u', 1303, 9]];
    const out = [];
    for (const [pel, key, joint] of WANT){
      let started = [];
      try { started = fx.schedule.fire(pel, key) || []; }
      catch (err){ out.push({ key, joint, error: String(err.message || err) }); continue; }
      if (!started.length){ out.push({ key, joint, error: 'fire() started nothing' }); continue; }
      // The effect's UNITS do not exist until the schedule steps. Re-assert the pose each step: the
      // runtime re-poses the parent from the monster every frame (writeJoints -> setParentPose), which
      // would put it back at the origin with identity rotation and erase the very difference being
      // measured. Placement states 0 and 1 re-place every frame, so the pose must hold across steps.
      for (let i = 0; i < 4; i++){
        fx.schedule.step && fx.schedule.step();
        fx.host.setParentPose(fx.parent, { position: POS, quaternion: YAW, scale: SCALE });
      }
      for (const q of started){
        let units = [];
        try { units = q.effects ? q.effects() : []; } catch {}
        const anchors = units.map(u => vec(u + 0x40));
        const mat = (fx.gameJoints || new Map()).get(joint);
        out.push({ key, joint, anchors,
                   jointPos: mat ? [mat[12], mat[13], mat[14]] : null,
                   parentPos: vec(fx.parent.object + 0x40) });
      }
    }
    return { loaded: V.state.id, pose: { position: POS, yawDeg: 90, scale: SCALE }, sampled: out };
  })();
}

const children = [];
try {
  const port = await freePort();
  children.push(spawn('python', [path.join(HERE, 'serve.py'), String(port)], { stdio: 'ignore' }));
  const site = 'http://localhost:' + port;
  for (let i = 0; i < 100; i++){ try { if ((await fetch(site + '/monsters.json')).ok) break; } catch {} await sleep(100); }
  const dport = await freePort();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'placement-check-'));
  children.push(spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + dport, '--user-data-dir=' + profile,
    '--inprivate', '--no-first-run', '--no-default-browser-check', '--disable-sync', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--window-size=1280,800', 'about:blank'], { stdio: 'ignore' }));
  await json(`http://127.0.0.1:${dport}/json/version`);
  const targets = await json(`http://127.0.0.1:${dport}/json/list`);
  const c = await connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: site + '/index.html' });
  for (let i = 0; i < 300; i++){
    if (await evaluate(c, '!!(window.__view && window.__view.renderer)').catch(() => false)) break;
    await sleep(200);
  }
  console.log(JSON.stringify(await evaluate(c, '(' + pageCheck.toString() + ')(' + JSON.stringify(MON) + ')')));
} finally {
  for (const ch of children) { try { ch.kill(); } catch {} }
}
