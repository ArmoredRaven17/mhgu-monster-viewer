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
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const argv = process.argv.slice(2);
const opt = name => { const i = argv.indexOf(name); return i >= 0 ? argv.splice(i, 2)[1] : null; };
let site = opt('--url');
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
    setTimeout(() => { if (pending.has(i)){ pending.delete(i); rej(new Error('timeout ' + method)); } }, 120000);
  });
  const on = (method, f) => listeners.set(method, [...(listeners.get(method) || []), f]);
  return new Promise(r => { ws.onopen = () => r({ send, on, ws }); });
}
const evaluate = (c, expression) => c.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  .then(r => { if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; });

// Runs IN THE PAGE (serialised). Returns [[ok, label, detail], ...].
async function pageCheck(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;                 // one 1/60 s frame a render, whatever the wall clock does
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const MON = 'em043_05';
  if (V.state.id !== MON){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
  }
  check(V.state.id === MON && V.mounted.main, 'Savage is mounted', V.state.id);
  await V.effects(false); await V.effects(true);
  const rt = () => M.effectRuntimeInstance();
  check(await until(() => rt() && rt().monsterId === MON && rt().schedule), 'the effect runtime is up for Savage');
  const fx = rt();
  // what the page asks of the runtime, logged
  const fired = [], calls = [];
  // each logged as it returns, with the rage requests it left: 'r' running, 's' stopped (running out)
  const wrap = (name, log) => { const f = fx[name].bind(fx); fx[name] = (...a) => { const r = f(...a); log(a); return r; }; };
  wrap('fire', a => fired.push(a[1]));
  wrap('restartRage', () => calls.push('restart ' + rageReqs()));
  wrap('setRage', a => calls.push('setRage ' + a[0]));
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => [1, 2, 4, 5, 6, 7, 8, 9, 12, 101].includes(p))) : null; };
  const rageReqs = () => fx.schedule.entries.filter(e => e.when === 'rage').map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  const ms = () => V.motionStates();
  const listOf = id => V.MON.monsters.find(e => e.id === MON).lists.find(l => l.id === id);
  const dur = (list, clip) => Math.round(listOf(list).clips.find(c => c.clip === clip).dur * 60);
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    clipSel.value = clip; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip().name === clip, 300);
  };
  const pick = async (row, text) => {
    const f = document.querySelector('[data-row="' + row + '"]');
    const sel = f && f.querySelector('select');
    const o = sel && [...sel.options].find(x => x.textContent.trim() === text);
    if (!o) return false;
    sel.value = o.value; sel.dispatchEvent(new Event('change'));
    await frames(2);
    return true;
  };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const monsterFloor = () => window.__view.grid.info().y;            // the grid floor (rounded to 3 places)
  const REST = ['2', 'Motion[2]'];                  // a motion the table does not list
  V.state.loop = true;
  await play(...REST); await frames(3);
  const user0 = drawn();
  check(user0 && user0[1] === true && user0[2] === false, 'at rest the head is intact (user)', user0);

  // 1. the head break with the head intact: the 1st break, u 1000 at frame 0, back to intact after
  fired.length = 0;
  await play('2', 'Motion[9]'); await frames(3);
  let d = drawn();
  check(same(fired, [1000]), 'L2 Motion[9], head intact: u 1000 requested once as it starts', fired);
  check(d[1] === false && d[2] === true && d[4] === true && d[5] === false && d[6] === false, 'L2 Motion[9]: the jaw shows broken (set 7), the face intact (set 3)', d);
  check(ms().cur && ms().cur.key === 'em043_05|2|Motion[9]', 'the driver holds L2 Motion[9]', ms().cur);
  await frames(dur('2', 'Motion[9]') + 4);
  check(same(fired, [1000, 1000]), 'the loop starts it over: u 1000 again', fired);
  await play(...REST); await frames(3);
  check(same(drawn(), user0), 'another motion: the parts are the user\'s again', drawn());
  check(ms().cur === null, 'the driver holds nothing', ms().cur);

  // 2. with the Jaw set broken: still the 1st break (into the user's level)
  check(await pick('1,2', 'Broken'), 'the Jaw row set to Broken');
  const userJaw = drawn();
  fired.length = 0;
  await play('2', 'Motion[9]'); await frames(3);
  d = drawn();
  check(same(fired, [1000]) && d[1] === false && d[2] === true && d[4] === true, 'Jaw broken: L2 Motion[9] is the 1st break (u 1000, set 7 + 3)', { fired, d });
  await play(...REST); await frames(3);
  check(same(drawn(), userJaw), 'back to the user\'s Jaw-broken parts', drawn());

  // 3. with the Face set broken: the 2nd break, u 1001, set 7 + 11
  check(await pick('4,5,6', 'Broken'), 'the Face row set to Broken');
  const userFace = drawn();
  fired.length = 0;
  await play('2', 'Motion[9]'); await frames(3);
  d = drawn();
  check(same(fired, [1001]) && d[1] === false && d[2] === true && d[4] === false && d[5] === true && d[6] === true,
        'Face broken: L2 Motion[9] is the 2nd break (u 1001, set 7 + 11)', { fired, d });
  await play(...REST); await frames(3);
  check(same(drawn(), userFace), 'back to the user\'s Face-broken parts', drawn());
  await pick('4,5,6', 'Intact'); await pick('1,2', 'Intact');
  check(same(drawn(), user0), 'the rows set back to Intact', drawn());

  // 4. the tail sever: u 900, set 12, back after
  fired.length = 0;
  await play('3', 'Motion[15]'); await frames(3);
  d = drawn();
  // (switching to list 3 passes through its first clip, L3 Motion[2] -- the shock trap's effect fires there, as it should)
  check(fired.filter(k => k === 900).length === 1 && d[8] === true && d[9] === false && d[101] === false, 'L3 Motion[15]: u 900, the tail severed (set 12)', { fired, d });
  // THE CUT TAIL, as the ROM drops it (tail-option-em043.md): at joint 142 on the sever frame, at rest on G from frame
  // 53 turned qa x Q(54), u 905 at G once at frame 42
  const piece = V.mounted['em043_05_tail'];
  const ct0 = V.cutTail();
  const wp = o => o.getWorldPosition(new V.camera.position.constructor());
  const bone142 = ((V.mounted.main.userData.gidBones || []).find(b => b.gid === 142) || {}).node || null;
  check(piece && piece.visible && ct0, 'L3 Motion[15]: the cut tail is shown', { visible: piece && piece.visible, ct0 });
  const pErr = ct0 ? Math.hypot(ct0.pose.position[0] * 0.01 - wp(piece).x, ct0.pose.position[1] * 0.01 - wp(piece).y, ct0.pose.position[2] * 0.01 - wp(piece).z) : -1;
  check(ct0 && ct0.k <= 3 && pErr >= 0 && pErr < 1e-4, 'drawn where the ROM formula puts it on its frame', { k: ct0 && ct0.k, pErr });
  const bJ = bone142 ? wp(bone142) : null;
  check(ct0 && bJ && Math.hypot(ct0.J[0] * 0.01 - bJ.x, ct0.J[2] * 0.01 - bJ.z) < 0.25, 'J is joint 142 (the tail\'s cut end, give or take the motion since)', { J: ct0 && ct0.J, bone: bJ && [bJ.x / 0.01, bJ.y / 0.01, bJ.z / 0.01] });
  const landingFires = [];
  const fa0 = fx.fireAt.bind(fx);
  fx.fireAt = (pel, key, pos) => { landingFires.push([key, ct0 ? V.cutTail().k : -1, pos]); return fa0(pel, key, pos); };
  await frames(60);
  const ct1 = V.cutTail(), pr = wp(piece);
  const gErr = ct1 ? Math.hypot(ct1.G[0] * 0.01 - pr.x, ct1.G[1] * 0.01 - pr.y, ct1.G[2] * 0.01 - pr.z) : -1;
  check(ct1 && ct1.k >= 53 && gErr >= 0 && gErr < 1e-3, 'at rest on G from frame 53', { k: ct1 && ct1.k, gErr, G: ct1 && ct1.G });
  check(ct1 && Math.abs(ct1.G[1] * 0.01 - (ct1.floor + 0.2 * (V.world.scale.x || 1))) < 1e-4, 'G is 20 S above the grid floor', { Gy: ct1 && ct1.G[1], floor: ct1 && ct1.floor });
  const wq = piece.getWorldQuaternion(new V.camera.quaternion.constructor());
  const Q54 = [0, -0.421642065, 0, 0.906762362], qa = ct1 ? ct1.qa : [0, 0, 0, 1];
  const want = [qa[3] * Q54[0] + qa[0] * Q54[3] + qa[1] * Q54[2] - qa[2] * Q54[1], qa[3] * Q54[1] - qa[0] * Q54[2] + qa[1] * Q54[3] + qa[2] * Q54[0],
                qa[3] * Q54[2] + qa[0] * Q54[1] - qa[1] * Q54[0] + qa[2] * Q54[3], qa[3] * Q54[3] - qa[0] * Q54[0] - qa[1] * Q54[1] - qa[2] * Q54[2]];
  const qd = Math.abs(wq.x * want[0] + wq.y * want[1] + wq.z * want[2] + wq.w * want[3]);
  check(qd > 0.99999, 'turned qa x Q(54) at rest', { got: [wq.x, wq.y, wq.z, wq.w], want });
  check(landingFires.length === 1 && landingFires[0][0] === 905 && Math.abs(landingFires[0][1] - 42) <= 1, 'u 905 requested once, at frame 42, at G', landingFires);
  fx.fireAt = fa0;
  await play(...REST); await frames(3);
  check(same(drawn(), user0), 'another motion: the tail is the user\'s again', drawn());
  check(piece && piece.visible === false && !V.cutTail(), 'and the cut tail is gone (the user\'s tail is intact)', { visible: piece && piece.visible });

  // 5. rage entry from calm: rage shown while it plays, the aura and eyes started, Gekikou_Start's clock, set 13
  calls.length = 0;
  check(fx.schedule.rage === false && rageReqs() === '|', 'calm: no rage effects', rageReqs());
  await play('0', 'Motion[5]'); await frames(3);
  d = drawn();
  check(fx.schedule.rage === true && rageReqs() === 'r|r', 'L0 Motion[5] from calm: the aura and eyes requested', { calls, reqs: rageReqs() });
  check(ms().mat.shown === 'enraged' && ms().mat.prev === 'calm' && ms().mat.cur === 'enraged', 'the materials show enraged, from calm (Gekikou_Start)', ms().mat);
  check(d[12] === true, 'the body shows set 13 (part 12 drawn)', d);
  check(document.getElementById('monRage').checked === false && V.state.rage === false, 'the Enraged checkbox and state stay the user\'s (off)');
  calls.length = 0;
  await frames(dur('0', 'Motion[5]') + 4);
  check(calls.some(c => /^restart (s+r\|s+r)$/.test(c)), 'the loop is rage entered again: the running ones stopped, new ones requested', { calls, reqs: rageReqs() });
  await play('0', 'Motion[2]_loop'); await frames(3);
  d = drawn();
  check(fx.schedule.rage === false && rageReqs().split('|').every(s => !s.includes('r')), 'another motion: rage ends -- the aura and eyes stop (run out)', rageReqs());
  check(ms().mat.shown === 'calm' && ms().mat.prev === 'enraged', 'the materials go back to calm from enraged (Gekikou_End)', ms().mat);
  check(d[12] === false, 'the body is the user\'s calm set again (part 12 off)', d);

  // 6. rage entry with Enraged on: rage entered again at frame 0 -- stopped and requested anew; stays on after
  await until(() => fx.schedule.entries.filter(e => e.when === 'rage').every(e => e.requests.length === 0), 3000);
  const rageBox = document.getElementById('monRage');
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3);
  check(fx.schedule.rage === true && rageReqs() === 'r|r', 'Enraged on: the aura and eyes run', rageReqs());
  calls.length = 0;
  await play('0', 'Motion[5]'); await frames(3);
  check(calls.some(c => c === 'restart sr|sr'), 'L0 Motion[5] while enraged: rage entered again (old stopped, new requested)', { calls, reqs: rageReqs() });
  check(ms().mat.prev === 'calm' && ms().mat.cur === 'enraged', 'the materials run Gekikou_Start again', ms().mat);
  calls.length = 0;
  await play('0', 'Motion[2]_loop'); await frames(3);
  check(fx.schedule.rage === true && !calls.some(c => c === 'setRage false'), 'another motion: rage stays on (the user\'s)', { calls, rage: fx.schedule.rage });
  rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3);

  // 7. played once: the motion is over at its end, the parts come back while the clip holds its last frame
  V.state.loop = false;
  fired.length = 0;
  await play('2', 'Motion[9]'); await frames(3);
  check(same(fired, [1000]) && drawn()[2] === true, 'played once: the break shows', { fired, d: drawn() });
  await frames(dur('2', 'Motion[9]') + 6);
  check(drawn()[2] === true && ms().cur && ms().cur.key === 'em043_05|2|Motion[9]', 'held on its last frame, the break still shows', { d: drawn(), cur: ms().cur });
  await play(...REST); await frames(3);
  check(same(drawn(), user0) && ms().cur === null, 'another clip: the parts are the user\'s again', { d: drawn(), cur: ms().cur });
  // death played once, enraged: held on its last frame it stays dead -- eyes closed, rage off (Raven: "he goes back to
  // being enraged, eyes open in the death state")
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3);
  await play('3', 'Motion[18]'); await frames(dur('3', 'Motion[18]') + 8);
  check(V.pose.action.time >= V.pose.action.getClip().duration - 1e-6 && drawn()[7] === true && fx.schedule.rage === false && ms().mat.shown === 'calm',
        'death played once, held on its last frame: eyes closed, rage still off', { t: V.pose.action.time, d: drawn(), rage: fx.schedule.rage, mat: ms().mat });
  await play(...REST); await frames(3);
  check(drawn()[7] === false && fx.schedule.rage === true, 'another clip: eyes open, the user\'s rage back', { d: drawn(), rage: fx.schedule.rage });
  rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3);
  V.state.loop = true;

  // 9. THE ROCK THROW with the viewer's stand-in inputs (index.html rockInput): each play of L2 Motion[24] throws the
  //    next of the three rocks; the flying effect (u 0, cm202_200) starts at the spawn, the landing (u 10, cm202_250)
  //    and the bouncing rock's bounces (u 20, cm202_001) where they touch the grid floor
  const host = fx.schedule.host, request0 = host.requestEffect.bind(host);
  const reqLog = [];
  let lastRock = null;
  await frames(2);
  const rockIn = fx.schedule.rockInput;
  check(typeof rockIn === 'function', 'the viewer hands the schedule its rock inputs');
  if (rockIn) fx.schedule.rockInput = () => (lastRock = rockIn());
  host.requestEffect = (...a) => {
    const r = request0(...a);
    const name = String((a[2] && a[2].path) || '').split(String.fromCharCode(92)).pop().split('/').pop();
    reqLog.push({ name, variant: lastRock && lastRock.variant, frame: V.pose.action ? Math.round(V.pose.action.time * 60) : -1 });
    return r;
  };
  await play('2', 'Motion[24]');
  await frames(3 * dur('2', 'Motion[24]') + 240);
  const flying = reqLog.filter(r => r.name === 'cm202_200');
  check(flying.length >= 3, 'L2 Motion[24] played three times: a rock each play (u 0)', reqLog.filter(r => /^cm202_(200|250|001)$/.test(r.name)));
  check(same(flying.slice(0, 3).map(r => r.variant), ['shell00_0', 'shell00_8', 'shell54_0']), 'each play takes the next rock: flat, lob, bouncing', flying);
  check(reqLog.some(r => r.name === 'cm202_250'), 'a rock lands on the grid floor: u 10', reqLog.filter(r => /^cm202_/.test(r.name)));
  check(reqLog.some(r => r.name === 'cm202_001'), 'the bouncing rock bounces: u 20', reqLog.filter(r => /^cm202_/.test(r.name)));
  const t = lastRock && lastRock.target;
  const P = fx.parent.position, yaw = fx.schedule.ownerYaw16() * 2 * Math.PI / 65536;
  check(t && Math.abs(t.x - (P[0] + 2100 * Math.sin(yaw))) < 1e-3 && Math.abs(t.z - (P[2] + 2100 * Math.cos(yaw))) < 1e-3 && t.y === lastRock.floorY,
        'the target is a point 2100 in front of the monster, on the floor', { lastRock, P, yaw });
  reqLog.length = 0;
  await play('2', 'Motion[23]'); await frames(dur('2', 'Motion[23]'));
  check(reqLog.some(r => r.name === 'cm202_200'), 'L2 Motion[23]: a rock too', reqLog.filter(r => /^cm202_/.test(r.name)));
  host.requestEffect = request0;
  if (rockIn) fx.schedule.rockInput = rockIn;
  await play(...REST); await frames(3);

  // 11. DEATH, L3 Motion[18]: eyes closed (set 5, part 7), body set 9, Angry_End on the body glow from frame 0 -- the
  //     user's breaks kept; enraged, the rage ends with it
  let glowMat = null;
  V.mounted.main.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
                                 for (const m of ms) if (!glowMat && m.name === 'XfB__m02_body_k') glowMat = m; });
  const glowOf = m => m ? JSON.stringify([m.emissive && m.emissive.toArray().map(v => +v.toFixed(4)), +(m.emissiveIntensity || 0).toFixed(4),
                                          +(m.opacity || 0).toFixed(4), m.uniforms ? Object.keys(m.uniforms).length : 0]) : null;
  check(!!glowMat, 'the body-glow material XfB__m02_body_k is on the model');
  check(await pick('1,2', 'Broken'), 'the Jaw row set to Broken (a break to keep through death)');
  const userDead0 = drawn();
  check(userDead0[7] === false, "the user's eyes are open", userDead0);
  const glowAlive = glowOf(glowMat);
  await play('3', 'Motion[18]'); await frames(3);
  d = drawn();
  check(d[7] === true, 'L3 Motion[18]: the eyes close (set 5)', d);
  check(d[2] === true && d[1] === false, "the user's broken jaw stays broken in death", d);
  check(d[12] === false, 'the body shows set 9', d);
  const mc = V.mounted.main.userData.motionClips;
  check(mc && mc.length === 1 && mc[0].clip === 'Angry_End' && mc[0].mats[0] === 'XfB__m02_body_k' && mc[0].t0 > 0, 'Angry_End runs on the body glow from the death frame', mc);
  await frames(100);
  const glowMid = glowOf(glowMat);
  await frames(120);
  const glowEnd = glowOf(glowMat);
  check(glowMid !== glowAlive && glowEnd !== glowMid, 'the glow material changes as Angry_End plays (alive, 100 f, 220 f)', { glowAlive, glowMid, glowEnd });
  await play(...REST); await frames(3);
  d = drawn();
  check(same(d, userDead0) && !V.mounted.main.userData.motionClips, "another motion: eyes open, the glow back to its pin, the parts the user's", { d, mc: V.mounted.main.userData.motionClips });
  await frames(3);
  check(glowOf(glowMat) === glowAlive, 'the glow material is as it was alive', { now: glowOf(glowMat), glowAlive });
  // enraged: the rage ends at death -- the aura and eyes stop, Gekikou_End
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3);
  calls.length = 0;
  await play('3', 'Motion[18]'); await frames(3);
  check(fx.schedule.rage === false && rageReqs().split('|').every(x => !x.includes('r')), 'enraged, L3 Motion[18]: the aura and eyes stop', { calls, reqs: rageReqs() });
  check(ms().mat.shown === 'calm' && ms().mat.prev === 'enraged' && ms().mat.t > 0, 'the rage materials run Gekikou_End from the death frame', ms().mat);
  check(drawn()[12] === false, 'the neck glow (part 12) goes with the rage', drawn());
  // L3 Motion[34], the end of the fall death: dead already, its transitions over
  await play('3', 'Motion[34]'); await frames(3);
  const mc34 = V.mounted.main.userData.motionClips;
  check(mc34 && mc34[0].t0 === -1e9 && drawn()[7] === true, 'L3 Motion[34]: dead, the glow already out, eyes closed', { mc34, d: drawn() });
  await play(...REST); await frames(3);
  check(fx.schedule.rage === true && rageReqs().split('|').every(x => x.endsWith('r')), "another motion: the user's rage again, the aura and eyes requested", rageReqs());
  rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3);
  await pick('1,2', 'Intact');

  // 12. AILMENTS AND TIREDNESS: each state's effect on its countdown -- at once, then every period frames
  const evReqs = key => fx.schedule.entries.filter(e => e.when === 'event' && e.def.record.key === key).map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  const eyesReqs = () => fx.schedule.entries.filter(e => e.when === 'rage' && e.def.record.key === 31).map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  const auraReqs = () => fx.schedule.entries.filter(e => e.when === 'rage' && e.def.record.key === 30).map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  const count = (arr, k) => arr.filter(x => x === k).length;
  // tired: drool c 1104 at once and every 48; rage shown off
  fired.length = 0;
  await play('0', 'Motion[15]_loop'); await frames(2);
  check(count(fired, 1104) === 1, 'L0 Motion[15] (tired): drool c 1104 at once', fired);
  await frames(48 * 3 + 4);
  check(count(fired, 1104) === 4, 'the drool comes every 48 frames (4 in 150)', fired);
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(3);
  check(fx.schedule.rage === false && ms().mat.shown === 'calm' && drawn()[12] === false, 'tired while the user is enraged: rage shown off (aura, eyes, neck glow)', { rage: fx.schedule.rage, mat: ms().mat, d: drawn() });
  await play(...REST); await frames(3);
  check(fx.schedule.rage === true && auraReqs().endsWith('r'), 'another motion: the user’s rage back', auraReqs());
  // asleep: eyes closed, the rage eyes held off (the aura kept); zzz c 1102 in the hold, at once and every 90
  fired.length = 0;
  await play('3', 'Motion[14]'); await frames(3);
  check(drawn()[7] === true, 'L3 Motion[14] (falling asleep): the eyes close', drawn());
  check(!eyesReqs().includes('r') && auraReqs().endsWith('r'), 'enraged and asleep: the eyes effect stopped, the aura kept', { eyes: eyesReqs(), aura: auraReqs() });
  check(count(fired, 1102) === 0, 'no zzz while falling asleep', fired);
  await play('3', 'Motion[25]_loop'); await frames(2);
  check(count(fired, 1102) === 1 && drawn()[7] === true && !eyesReqs().includes('r'), 'L3 Motion[25] (asleep): zzz c 1102 at once, eyes still closed and off', { fired, eyes: eyesReqs() });
  await frames(92);
  check(count(fired, 1102) === 2, 'the zzz comes every 90 frames', fired);
  await play(...REST); await frames(3);
  check(drawn()[7] === false && eyesReqs().endsWith('r'), 'awake: the eyes open and the eyes effect is requested again', { d: drawn(), eyes: eyesReqs() });
  rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3);
  // paralysis: c 1101 at once and every 60 -- its hold, the _loop clip (166 frames), which wraps on without starting over
  fired.length = 0;
  await play('3', 'Motion[13]_loop'); await frames(2);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysis): c 1101 at once', fired);
  await frames(62);
  check(count(fired, 1101) === 2, 'c 1101 again 60 frames on', fired);
  await frames(60 * 3);
  check(count(fired, 1101) === 5, 'and every 60 across the loop\'s wrap (5 in 244)', fired);
  // shock trap: c 1105 at once and every 42
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(2);
  check(count(fired, 1105) === 1, 'L3 Motion[2] (shock trap): c 1105 at once', fired);
  await frames(44);
  check(count(fired, 1105) === 2, 'c 1105 again 42 frames on', fired);
  // stun: c 1103 requested once and held across [3] -> [6], stopped after
  await play('3', 'Motion[3]'); await frames(3);
  const st0 = evReqs(1103);
  check(st0.endsWith('r') && st0.split('r').length - 1 === 1, 'L3 Motion[3] (stun): c 1103 requested', st0);
  await play('3', 'Motion[6]_loop'); await frames(3);
  check(evReqs(1103) === st0, 'L3 Motion[6] (stun hold): the same c 1103 kept, none added', { before: st0, now: evReqs(1103) });
  await play(...REST); await frames(3);
  check(!evReqs(1103).includes('r'), 'the stun over: c 1103 stopped (runs out)', evReqs(1103));

  // 8. the table itself: every motion it lists is a clip Savage carries
  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const [list, clip] = k.split('|');
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'),
          'the table\'s ' + k + ' is a clip Savage carries');
  }
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

// NARGACUGA (em037_00), the same way: its head / wing / tail breaks, the sever and its cut tail, rage entry with the
// head-level trails, the calm tail spikes, tired, asleep, paralysis and death (states-em037.md, breaks-em037.md)
async function pageCheckNarga(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Nargacuga: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const MON = 'em037_00';
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  check(V.state.id === MON && V.mounted.main, 'mounted', V.state.id);
  await V.effects(false); await V.effects(true);
  const rt = () => M.effectRuntimeInstance();
  check(await until(() => rt() && rt().monsterId === MON && rt().schedule), 'the effect runtime is up');
  const fx = rt();
  const fired = [];
  const f0 = fx.fire.bind(fx); fx.fire = (pel, key) => { const r = f0(pel, key); fired.push(key); return r; };
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 101].includes(p))) : null; };
  const reqs = key => fx.schedule.entries.filter(e => e.def.record && e.def.record.key === key && (e.when === 'rage' || e.when === 'event')).map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  const listOf = id => V.MON.monsters.find(e => e.id === MON).lists.find(l => l.id === id);
  const dur = (list, clip) => Math.round(listOf(list).clips.find(c => c.clip === clip).dur * 60);
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    clipSel.value = clip; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip().name === clip, 300);
  };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const REST = ['0', 'Motion[3]'];
  V.state.loop = true;
  await play(...REST); await frames(3);
  const user0 = drawn();
  check(user0 && user0[1] === true && user0[2] === false && user0[9] === true && user0[11] === true && user0[15] === true, 'at rest: head, wings, tail intact', user0);
  // head break, calm: set 5, u 1001
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  let d = drawn();
  check(count(fired, 1001) === 1 && d[1] === false && d[2] === true && d[3] === false && d[7] === true, 'L3 Motion[2]: head break -- set 5, u 1001', { fired, d });
  // wing A / B
  fired.length = 0;
  await play('3', 'Motion[10]'); await frames(3); d = drawn();
  check(count(fired, 1010) === 1 && d[9] === false && d[10] === true, 'L3 Motion[10]: wing A break -- set 9, u 1010', { fired, d });
  await play('3', 'Motion[11]_loop'); await frames(3); d = drawn();
  check(count(fired, 1010) === 1 && d[10] === true, 'L3 Motion[11]: the wing stays broken, nothing fired again', { fired, d });
  fired.length = 0;
  await play('3', 'Motion[7]'); await frames(3); d = drawn();
  check(count(fired, 1030) === 1 && d[11] === false && d[12] === true, 'L3 Motion[7]: wing B break -- set 11, u 1030', { fired, d });
  // tail break: set 13, u 1016
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3); d = drawn();
  check(count(fired, 1016) === 1 && d[15] === false && d[16] === true && d[17] === false, 'L3 Motion[1]: tail break -- set 13, u 1016', { fired, d });
  // tail sever: set 14, u 900, the cut tail from joint 143, u 905 at G
  fired.length = 0;
  const fa0 = fx.fireAt.bind(fx), landing = [];
  fx.fireAt = (pel, key, pos) => { landing.push(key); return fa0(pel, key, pos); };
  await play('3', 'Motion[4]'); await frames(3); d = drawn();
  const piece = V.mounted['em037_00_tail'];
  check(count(fired, 900) === 1 && d[16] === true && d[17] === true && d[18] === false && d[101] === false, 'L3 Motion[4]: tail severed -- set 14, u 900', { fired, d });
  check(piece && piece.visible && V.cutTail() && V.cutTail().J, 'the cut tail is shown', { visible: piece && piece.visible });
  await frames(60);
  const ct = V.cutTail();
  check(ct && ct.k >= 53 && count(landing, 905) === 1, 'it lands (u 905 once) and rests', { k: ct && ct.k, landing });
  fx.fireAt = fa0;
  await play(...REST); await frames(3);
  check(JSON.stringify(drawn()) === JSON.stringify(user0) && piece.visible === false, 'another motion: the user\'s parts again, no cut tail', drawn());
  // rage entry, calm user: the roar shows rage -- head set 6, tail set 15, trail u 1120 (head intact), 1121 held off
  await play('0', 'Motion[26]'); await frames(4); d = drawn();
  check(fx.schedule.rage === true && d[3] === true && d[4] === true && d[8] === true && d[7] === false && d[13] === true && d[14] === true,
        'L0 Motion[26]: enraged -- head set 6, tail set 15', { rage: fx.schedule.rage, d });
  check(reqs(1120).includes('r') && !reqs(1121).includes('r'), 'the trails: u 1120 (head intact), u 1121 held off', { u1120: reqs(1120), u1121: reqs(1121) });
  await play(...REST); await frames(3);
  check(fx.schedule.rage === false && !reqs(1120).includes('r'), 'another motion: rage off, the trails stopped', { rage: fx.schedule.rage, u1120: reqs(1120) });
  // enraged user, head break: set 7 and the trails swap to u 1121
  const rageBox = document.getElementById('monRage');
  check(rageBox && !rageBox.closest('[hidden]'), 'the Enraged toggle is offered', !!rageBox);
  rageBox.checked = true; await rageBox.onchange({ target: rageBox }); await frames(4);
  check(fx.schedule.rage === true && reqs(1120).includes('r'), 'Enraged on: u 1120 runs', reqs(1120));
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(4); d = drawn();
  check(count(fired, 1001) === 1 && d[2] === true && d[3] === true && d[4] === false && d[8] === true, 'enraged head break -- set 7', { fired, d });
  check(!reqs(1120).includes('r') && reqs(1121).includes('r'), 'the trails swap: u 1120 stopped, u 1121 runs', { u1120: reqs(1120), u1121: reqs(1121) });
  await play(...REST); await frames(4);
  check(reqs(1120).endsWith('r') && !reqs(1121).includes('r'), 'head intact again (the user\'s): back to u 1120', { u1120: reqs(1120), u1121: reqs(1121) });
  // tired while the user is enraged: rage shown off, drool at once and every 48
  fired.length = 0;
  await play('0', 'Motion[30]_loop'); await frames(3);
  check(fx.schedule.rage === false && count(fired, 1104) === 1, 'L0 Motion[30] (tired): rage shown off, drool at once', { rage: fx.schedule.rage, fired });
  await frames(50);
  check(count(fired, 1104) === 2, 'the drool again 48 frames on', fired);
  // asleep: eyes set 2, trails kept; zzz in the hold
  fired.length = 0;
  await play('0', 'Motion[22]'); await frames(3); d = drawn();
  check(d[5] === true && d[6] === true && reqs(1120).includes('r'), 'L0 Motion[22]: both lids close (set 2), the trails keep running', { d, u1120: reqs(1120) });
  await play('0', 'Motion[20]_loop'); await frames(3);
  check(count(fired, 1102) === 1 && drawn()[5] === true, 'L0 Motion[20]: zzz c 1102 at once, eyes closed', fired);
  // death: rage off, eyes closed, calm sets
  await play('3', 'Motion[6]'); await frames(4); d = drawn();
  check(fx.schedule.rage === false && d[5] === true && d[6] === true && d[3] === false && d[13] === false && !reqs(1120).includes('r'),
        'L3 Motion[6] (death): rage off, the trails stopped, eyes closed, calm sets', { rage: fx.schedule.rage, d });
  await play(...REST); await frames(3);
  rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3);
  // calm tail spikes in the tail attacks
  await play('2', 'Motion[4]'); await frames(3); d = drawn();
  check(fx.schedule.rage === false && d[13] === true && d[14] === true, 'L2 Motion[4] (tail attack, calm): the tail spikes (set 15), rage stays off', { rage: fx.schedule.rage, d });
  // paralysis
  fired.length = 0;
  await play('3', 'Motion[13]_loop'); await frames(3);
  check(count(fired, 1101) === 1, 'L3 Motion[13]: c 1101 at once', fired);
  await play(...REST); await frames(3);
  // THE TAIL SPIKES (shells-em037.md; shells.js): L2 Motion[8] throws at frame 46 -- a motion with no clip effect of its
  // own, so the shells must step with nothing else running -- 3 spikes for 7:0x28 / 7:0x29, each flying (u 0,
  // em037_00_007) until it meets the grid floor (u 1, em037_00_002, at the contact); each play takes the next attack
  const host = fx.schedule.host, request0 = host.requestEffect.bind(host);
  const reqLog = [];
  let lastPick = null;
  await frames(2);
  const pickIn = fx.schedule.rockInput;
  check(typeof pickIn === 'function', 'the viewer hands the schedule its shell inputs');
  if (pickIn) fx.schedule.rockInput = () => (lastPick = pickIn());
  host.requestEffect = (...a) => {
    const r = request0(...a);
    reqLog.push({ name: String((a[2] && a[2].path) || '').split(String.fromCharCode(92)).pop().split('/').pop(),
                  variant: lastPick && lastPick.variant, frame: V.pose.action ? Math.round(V.pose.action.time * 60) : -1 });
    return r;
  };
  await play('2', 'Motion[7]'); await frames(3);
  await play('2', 'Motion[8]');
  await frames(2 * dur('2', 'Motion[8]') + 30);
  const flying = reqLog.filter(r => r.name === 'em037_00_007');
  check(flying.length === 6, 'two plays of L2 Motion[8]: 3 spikes each (u 0)', flying);
  check(flying.slice(0, 3).every(r => r.variant === '7:0x28') && flying.slice(3, 6).every(r => r.variant === '7:0x29'), 'each play the next attack: 7:0x28, then 7:0x29', flying.map(r => r.variant));
  // the spawn test fires the step after the frame passes 46 ((F[k-2], F[k-1]]), and this page's effect steps follow the
  // wall clock while its clip steps a frame a render: the request lands a few frames past 46 -- more on a busy machine
  // (53 seen under load). The exact frame is dev/shells-spike-check.mjs's to check, against the ROM
  check(flying.every(r => r.frame >= 46 && r.frame <= 60), 'thrown as frame 46 passes', flying.map(r => r.frame));
  check(reqLog.some(r => r.name === 'em037_00_002'), 'they land on the grid floor (u 1)', reqLog.filter(r => r.name.startsWith('em037_00')).length);
  host.requestEffect = request0;
  if (pickIn) fx.schedule.rockInput = pickIn;
  await play(...REST); await frames(3);
  const MS = await import('/render/motion-states.js');
  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const [list, clip] = k.split('|');
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'), 'the table\'s ' + k + ' is a clip Nargacuga carries');
  }
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

// RATHIAN (em001_00), the same way: the back / wing breaks one motion plays in turn, the head break, the sever and its
// cut tail, the rage entry and the rage puff on its countdown (u 1120 / 1121 by joint 4's rotation, paused asleep,
// zeroed tired, its leftover kept across a calm spell), tired, asleep, paralysis, the shock trap, the stun and death
// (states-em001.md, breaks-em001.md)
async function pageCheckRathian(MON = 'em001_00', LABEL = 'Rathian'){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, LABEL + ': ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const MS = await import('/render/motion-states.js');
  const SK = await import('/render/skeleton.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  check(V.state.id === MON && V.mounted.main, 'mounted', V.state.id);
  await V.effects(false); await V.effects(true);
  const rt = () => M.effectRuntimeInstance();
  check(await until(() => rt() && rt().monsterId === MON && rt().schedule), 'the effect runtime is up');
  const fx = rt(), S = fx.schedule;
  check(S.puff && S.puff.period === 30 && S.entries.filter(e => e.when === 'ragePuff').length === 2, 'the rage puff is set up: every 30, u 1120 / 1121', S.puff && S.puff.period);
  const fired = [];
  const f0 = fx.fire.bind(fx); fx.fire = (pel, key) => { const r = f0(pel, key); fired.push(key); return r; };
  // every puff the schedule starts: its key, the step, and the pick recomputed from joint 4's bone at that moment
  const j4 = (SK.gidBonesOf(V.mounted.main).find(b => b.gid === 4) || {}).node;
  check(!!j4, 'joint 4 has a bone', !!j4);
  const puffs = [];
  const s0 = S.start.bind(S);
  S.start = e => {
    if (e.when === 'ragePuff'){
      const q = j4.quaternion;
      puffs.push({ key: e.def.record.key, step: S.frame, pick: MS.rathianPuffPick([q.x, q.y, q.z, q.w]) });
    }
    return s0(e);
  };
  const drawn = () => { const d = V.mounted.main.userData.partsDrawn; return d ? Object.fromEntries([...d].filter(([p]) => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 101, 102].includes(p))) : null; };
  const evReqs = key => S.entries.filter(e => e.when === 'event' && e.def.record.key === key).map(e => e.requests.map(q => q.stopped ? 's' : 'r').join('')).join('|');
  const listOf = id => V.MON.monsters.find(e => e.id === MON).lists.find(l => l.id === id);
  const dur = (list, clip) => Math.round(listOf(list).clips.find(c => c.clip === clip).dur * 60);
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    clipSel.value = clip; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip().name === clip, 300);
  };
  const steps = async n => { const a = S.frame; await until(() => S.frame - a >= n, 20 * n + 200); };
  const count = (arr, k) => arr.filter(x => x === k).length;
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const tear = () => Object.fromEntries((window.__breakAlpha().materials || []).map(m => [m.name, m.ref]));
  const REST = ['0', 'Motion[1]_loop'];
  const rageBox = document.getElementById('monRage');
  V.state.loop = true;
  await play(...REST); await frames(3);
  const user0 = drawn();
  check(user0 && user0[9] === true && user0[1] === false && user0[2] === true && user0[4] === true && user0[6] === true && user0[102] === true && user0[101] === true,
        'at rest: eyes open, head, wings, back intact, tail on', user0);
  check(S.rage === false && puffs.length === 0, 'calm: no puff', puffs);

  // THE BACK AND WING BREAKS: L3 Motion[2], looping -- each play the next: back, left wing, right wing. List 3 is entered
  // on a clip the table does not list (a list change plays the list's first clip, L3 Motion[1], the head break)
  await play('3', 'Motion[16]'); await frames(3);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  let d = drawn();
  check(same(fired, [1000]) && d[10] === true && d[102] === false && d[4] === true && d[6] === true, 'L3 Motion[2], 1st play: the back breaks (set 10), u 1000', { fired, d });
  check(tear()['XfBAN__E0__m50_wing_l'] === null && tear()['XfBAN__E0__m51_wing_r'] === null, 'the membranes are whole', tear());
  await until(() => fired.length >= 2, dur('3', 'Motion[2]') + 60);
  await frames(3); d = drawn();
  check(same(fired, [1000, 1005]) && d[5] === true && d[4] === false && d[102] === true, 'the loop, 2nd play: the left wing breaks (set 6), u 1005; the back as the user has it', { fired, d });
  check(tear()['XfBAN__E0__m50_wing_l'] === 127 && tear()['XfBAN__E0__m51_wing_r'] === null, 'the left membrane torn (alpha reference 127)', tear());
  await until(() => fired.length >= 3, dur('3', 'Motion[2]') + 60);
  await frames(3); d = drawn();
  check(same(fired, [1000, 1005, 1010]) && d[7] === true && d[6] === false && d[4] === true, '3rd play: the right wing breaks (set 8), u 1010', { fired, d });
  check(tear()['XfBAN__E0__m50_wing_l'] === null && tear()['XfBAN__E0__m51_wing_r'] === 127, 'the right membrane torn, the left whole again', tear());
  // the plays after the three breaks, as this monster's table cycles them: Rathian's and Gold's (10, 0x1b) (c 1109, no
  // part changed); Dreadqueen's tail break (set 12, u 1036) before it
  const cyc = MS.MOTION_STATES[MON]['3|Motion[2]'].cycle;
  const keyOf = e => e.fire ? e.fire[e.fire.length - 1][1] : e.start[0][1];
  for (let n = 4; n <= cyc.length; n++){
    await until(() => fired.length >= n, dur('3', 'Motion[2]') + 60);
    await frames(3); d = drawn();
    const e = cyc[n - 1];
    const parts = e.start ? (d[10] === false && d[102] === true && d[5] === false && d[7] === false)
                          : (d[12] === true && d[11] === false);            // Dreadqueen's tail broken: set 12
    check(same(fired, cyc.slice(0, n).map(keyOf)) && parts,
          'play ' + n + ': ' + (e.start ? '(10, 0x1b) -- c 1109 at frame 0, no part changed' : 'the tail breaks (set 12), u ' + keyOf(e)), { fired, d });
  }
  await play(...REST); await frames(3);
  check(same(drawn(), user0) && tear()['XfBAN__E0__m51_wing_r'] === null, 'another motion: the user\'s parts and whole membranes again', { d: drawn(), tear: tear() });

  // THE HEAD BREAK
  fired.length = 0;
  await play('3', 'Motion[1]'); await frames(3); d = drawn();
  check(same(fired, [1031]) && d[3] === true && d[2] === false, 'L3 Motion[1]: the head breaks (set 4), u 1031', { fired, d });
  await play(...REST); await frames(3);

  // THE TAIL SEVER and the cut tail
  fired.length = 0;
  const fa0 = fx.fireAt.bind(fx), landing = [];
  fx.fireAt = (pel, key, pos) => { landing.push(key); return fa0(pel, key, pos); };
  await play('3', 'Motion[15]'); await frames(3); d = drawn();
  const piece = V.mounted[MON + '_tail'];
  check(same(fired, [900]) && d[8] === true && d[101] === false, 'L3 Motion[15]: the tail severed (set 12), u 900', { fired, d });
  check(piece && piece.visible && V.cutTail() && V.cutTail().J, 'the cut tail is shown', { visible: piece && piece.visible });
  await frames(60);
  const ct = V.cutTail();
  check(ct && ct.k >= 53 && count(landing, 905) === 1, 'it lands (u 905 once) and rests', { k: ct && ct.k, landing });
  fx.fireAt = fa0;
  await play(...REST); await frames(3);
  check(same(drawn(), user0) && piece.visible === false, 'another motion: the tail back on, no cut tail', drawn());

  // RAGE ENTRY, the user calm: rage shown from L0 Motion[4]'s frame 0, the first puff at once, then every 30 steps
  puffs.length = 0;
  await play('0', 'Motion[4]'); await steps(95);
  check(S.rage === true, 'L0 Motion[4]: rage shown', S.rage);
  const gaps = puffs.slice(1).map((p, i) => p.step - puffs[i].step);
  check(puffs.length >= 3 && gaps.every(g => g === 30), 'the puff comes at once, then every 30 steps', { n: puffs.length, gaps });
  check(puffs.every(p => p.key === (p.pick === 1 ? 1120 : 1121)), 'each puff is the one joint 4\'s rotation picks (1 -> u 1120, 0 -> u 1121)', puffs);
  await play(...REST); await frames(3);
  const nAfter = puffs.length; await steps(70);
  check(S.rage === false && puffs.length === nAfter, 'another motion, the user calm: rage off, no more puffs', { rage: S.rage, n: puffs.length - nAfter });

  // THE USER ENRAGED: the countdown's leftover carries across a calm spell (0xa41b8 leaves it; only tired zeroes it)
  check(rageBox && !rageBox.closest('[hidden]'), 'the Enraged toggle is offered', !!rageBox);
  puffs.length = 0;
  rageBox.checked = true; await rageBox.onchange({ target: rageBox });
  await until(() => puffs.length >= 1, 600);
  await steps(10);                                         // 20 left on the countdown
  const left = S.puff.left;
  rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await steps(50);
  check(S.puff.left === left, 'rage off, calm, not tired: the countdown stays where it was', { was: left, now: S.puff.left });
  const at = S.frame, n1 = puffs.length;
  rageBox.checked = true; await rageBox.onchange({ target: rageBox });
  await until(() => puffs.length > n1, 600);
  const wait = puffs[n1] && puffs[n1].step - at;
  check(wait >= left - 1 && wait <= left + 1, 'rage on again: the next puff when the leftover runs out', { left, wait });
  // TIRED while the user is enraged: rage shown off, the drool, and the countdown zeroed -> a puff at once after
  fired.length = 0;
  // the countdown is the schedule's, stepped on its own clock (live.js: real time), not a step a frame: wait for steps
  await play('0', 'Motion[14]_loop'); await frames(3); await steps(2);
  check(S.rage === false && count(fired, 1104) === 1 && S.puff.left === 0, 'L0 Motion[14] (tired): rage shown off, drool at once, the countdown zeroed', { rage: S.rage, fired, left: S.puff.left });
  await frames(50);
  check(count(fired, 1104) === 2, 'the drool again 48 frames on', fired);
  const n2 = puffs.length, at2 = S.frame;
  await play(...REST);
  await until(() => puffs.length > n2, 600);
  check(puffs[n2] && puffs[n2].step - at2 <= 3, 'rage back after tired: a puff at once', puffs[n2] && puffs[n2].step - at2);
  // ASLEEP, enraged: eyes closed from L3 Motion[14]; in the hold L0 Motion[19] the zzz every 90 and no puff
  fired.length = 0;
  await play('3', 'Motion[14]'); await frames(3); d = drawn();
  check(d[1] === true && d[9] === false && count(fired, 1102) === 0, 'L3 Motion[14] (falling asleep): eyes closed (set 1), no zzz', { d, fired });
  await play('0', 'Motion[19]_loop'); await frames(3);
  const n3 = puffs.length;
  check(count(fired, 1102) === 1 && drawn()[1] === true, 'L0 Motion[19] (the hold): zzz at once, eyes closed', fired);
  await frames(92);
  check(count(fired, 1102) === 2, 'the zzz again 90 frames on', fired);
  await steps(40);
  check(S.rage === true && puffs.length === n3 && S.puff.paused === true, 'enraged in the hold: the puff paused', { rage: S.rage, puffs: puffs.length - n3 });
  await play(...REST); await frames(3);
  await steps(40);
  check(puffs.length > n3 && drawn()[9] === true, 'awake: eyes open, the puff runs again', { d: drawn(), puffs: puffs.length - n3 });
  // DEATH, the user enraged: rage off, no puffs, eyes closed; the parts otherwise the user's
  await play('3', 'Motion[17]'); await frames(3);
  const n4 = puffs.length; await steps(70); d = drawn();
  check(S.rage === false && puffs.length === n4 && d[1] === true && d[9] === false && d[2] === true && d[102] === true && d[101] === true,
        'L3 Motion[17] (death): rage off, no puff, eyes closed, the breaks as the user has them', { rage: S.rage, d });
  await play('3', 'Motion[12]'); await frames(3);
  check(S.rage === false && drawn()[1] === true, 'L3 Motion[12] (death after the fall): the same', { rage: S.rage, d: drawn() });
  await play(...REST); await frames(3);
  rageBox.checked = false; await rageBox.onchange({ target: rageBox }); await frames(3);
  // PARALYSIS, SHOCK TRAP, STUN
  fired.length = 0;
  await play('3', 'Motion[13]_loop'); await frames(3);
  check(count(fired, 1101) === 1, 'L3 Motion[13] (paralysis): c 1101 at once', fired);
  await frames(62);
  check(count(fired, 1101) === 2, 'c 1101 again 60 frames on', fired);
  fired.length = 0;
  await play('3', 'Motion[9]'); await frames(3);
  check(count(fired, 1105) === 1, 'L3 Motion[9] (shock trap): c 1105 at once', fired);
  await frames(44);
  check(count(fired, 1105) === 2, 'c 1105 again 42 frames on', fired);
  await play('3', 'Motion[3]'); await frames(3);
  const st0 = evReqs(1103);
  check(st0.endsWith('r') && st0.split('r').length - 1 === 1, 'L3 Motion[3] (stun): c 1103 requested', st0);
  await play('3', 'Motion[5]_loop'); await frames(3);
  check(evReqs(1103) === st0, 'L3 Motion[5] (stun hold): the same c 1103 kept', { before: st0, now: evReqs(1103) });
  await play('3', 'Motion[7]'); await frames(3);
  check(evReqs(1103) === st0, 'L3 Motion[7] (stun end): still kept', { before: st0, now: evReqs(1103) });
  await play(...REST); await frames(3);
  check(!evReqs(1103).includes('r'), 'the stun over: c 1103 stopped (runs out)', evReqs(1103));
  // THE FIREBALLS (shells-em001.md; shells.js): each play of a fireball clip takes the next of the ROM's choices while
  // not tired (the no-fire twins are op 0x24's tired branch); the fireball flies to the grid floor, and its landing starts
  // the fire and the landing effect. Requests logged by effect file, with the clip frame they came on
  // (a Rath-line sibling whose shells are not in shells.js yet skips this part)
  const SH = await import('/render/shells.js');
  if (SH.SHELL_DATA[MON]){
  const host = S.host, request0 = host.requestEffect.bind(host);
  const reqLog = [];
  let lastPick = null;
  const pickIn = S.rockInput;
  check(typeof pickIn === 'function', 'the viewer hands the schedule its shell inputs');
  if (pickIn) S.rockInput = () => (lastPick = pickIn());
  host.requestEffect = (...a) => {
    const r = request0(...a);
    reqLog.push({ name: String((a[2] && a[2].path) || '').split(String.fromCharCode(92)).pop().split('/').pop(),
                  key: a[2] && a[2].key, variant: lastPick && lastPick.variant,
                  clip: V.pose.action ? V.pose.action.getClip().name : null, frame: V.pose.action ? Math.round(V.pose.action.time * 60) : -1 });
    return r;
  };
  const named = (n, clip) => reqLog.filter(r => r.name === n && (!clip || r.clip === clip));
  // L2 Motion[5]: 7:0x02 -- one fireball (mode 0, c 0 em001_00_003) as frame 78 passes; the landing: c 1 (em001_00_006)
  // and shell01 mode 2's fire (c 3, em001_00_008)
  await play('2', 'Motion[5]'); await frames(dur('2', 'Motion[5]') + 20);
  const fb = named('em001_00_003', 'Motion[5]');
  check(fb.length === 1 && fb[0].variant === '7:0x02' && fb[0].frame >= 78 && fb[0].frame <= 86, 'L2 Motion[5]: one fireball (c 0), 7:0x02, as frame 78 passes', fb);
  check(named('em001_00_006').length >= 1 && named('em001_00_008').length >= 1, 'it lands on the grid floor: c 1 and the fire (c 3)',
        { c1: named('em001_00_006').length, c3: named('em001_00_008').length });
  // L4 Motion[8]: two plays -- 7:0x08 (modes 1 / 2 / 3 at 82 / 122 / 162), then 7:0x6b (modes 5 / 6 / 7 at 76 / 114 / 156)
  reqLog.length = 0;
  await play('4', 'Motion[8]'); await frames(2 * dur('4', 'Motion[8]') + 20);
  const f8 = named('em001_00_003', 'Motion[8]');
  check(f8.length === 6 && f8.slice(0, 3).every(r => r.variant === '7:0x08') && f8.slice(3).every(r => r.variant === '7:0x6b'),
        'L4 Motion[8]: three fireballs a play, 7:0x08 then 7:0x6b', f8.map(r => [r.variant, r.frame]));
  check(f8.slice(0, 3).every((r, i) => r.frame >= [82, 122, 162][i] && r.frame <= [82, 122, 162][i] + 8) &&
        f8.slice(3).every((r, i) => r.frame >= [76, 114, 156][i] && r.frame <= [76, 114, 156][i] + 8), 'at 82 / 122 / 162, then 76 / 114 / 156', f8.map(r => r.frame));
  // L4 Motion[65]: 7:0x77 -- the breath puffs (shell01 44 / 45 / 46: u 61 / 61 / 62, em001_02_006) at 68 / 72 / 76, G rank
  reqLog.length = 0;
  await play('4', 'Motion[65]'); await frames(dur('4', 'Motion[65]') - 10);
  const puffs65 = named('em001_02_006', 'Motion[65]');
  check(puffs65.length === 3 && puffs65.every(r => r.variant === '7:0x77'), 'L4 Motion[65]: three breath puffs (u 61 / 61 / 62), 7:0x77',
        puffs65.map(r => [r.key, r.frame]));
  // L4 Motion[16]: 7:0x3a -- the mode-8 fireball (u 30, em001_02_001) at 108; its landing: shell11's explosions
  reqLog.length = 0;
  await play('4', 'Motion[16]'); await frames(dur('4', 'Motion[16]') + 60);
  const m8 = named('em001_02_001', 'Motion[16]');
  check(m8.length === 1 && m8[0].variant === '7:0x3a' && m8[0].frame >= 108 && m8[0].frame <= 116, 'L4 Motion[16]: the mode-8 fireball (u 30), 7:0x3a, at 108', m8);
  check(named('em001_02_004').length >= 1, 'it lands: the explosions (em001_02_004)', reqLog.map(r => r.name));
  host.requestEffect = request0;
  if (pickIn) S.rockInput = pickIn;
  }
  await play(...REST); await frames(3);
  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const [list, clip] = k.split('|');
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip || c.clip === clip + '_start' || c.clip === clip + '_loop'), 'the table\'s ' + k + ' is a clip ' + LABEL + ' carries');
  }
  S.start = s0;
  check(!fx.failed, 'the effect runtime never stopped', fx.failed);
  return out;
}

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
  c.on('Runtime.exceptionThrown', p => errors.push(p.exceptionDetails.exception ? p.exceptionDetails.exception.description : p.exceptionDetails.text));
  c.on('Runtime.consoleAPICalled', p => { if (p.type === 'error') errors.push(p.args.map(a => a.value !== undefined ? String(a.value) : (a.description || '')).join(' ').slice(0, 300)); });
  await c.send('Page.navigate', { url: site + '/?scene=none' });
  for (let i = 0; ; i++){
    if (await evaluate(c, '!!(window.__view && window.__view.renderer && window.__view.motionStates)').catch(() => false)) break;
    if (i > 600) throw new Error('the viewer never came up' + (errors.length ? ': ' + errors[0] : ''));
    await sleep(200);
  }
  const before = 0;
  const res = (await evaluate(c, `(${pageCheck.toString()})()`)).concat(await evaluate(c, `(${pageCheckNarga.toString()})()`))
    .concat(await evaluate(c, `(${pageCheckRathian.toString()})()`))
    .concat(await evaluate(c, `(${pageCheckRathian.toString()})('em001_02', 'Gold Rathian')`))
    .concat(await evaluate(c, `(${pageCheckRathian.toString()})('em001_04', 'Dreadqueen')`));
  let fail = 0;
  for (const [ok, label, detail] of res){
    if (!ok) fail++;
    console.log((ok ? 'PASS ' : 'FAIL ') + label + (detail && !ok ? '  -- ' + detail : ''));
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
