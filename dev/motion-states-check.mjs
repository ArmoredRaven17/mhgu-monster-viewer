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
  check(same(fired, [900]) && d[8] === true && d[9] === false && d[101] === false, 'L3 Motion[15]: u 900, the tail severed (set 12)', { fired, d });
  await play(...REST); await frames(3);
  check(same(drawn(), user0), 'another motion: the tail is the user\'s again', drawn());

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
  check(same(drawn(), user0) && ms().cur === null, 'at its end the parts are the user\'s again', { d: drawn(), cur: ms().cur });
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

  // 8. the table itself: every motion it lists is a clip Savage carries
  for (const k of Object.keys(MS.MOTION_STATES[MON])){
    const [list, clip] = k.split('|');
    check(listOf(list) && listOf(list).clips.some(c => c.clip === clip), 'the table\'s ' + k + ' is a clip Savage carries');
  }
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
  const res = await evaluate(c, `(${pageCheck.toString()})()`);
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
