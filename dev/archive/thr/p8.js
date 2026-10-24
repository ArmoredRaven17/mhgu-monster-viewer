const V = window.__view;
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 600) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
const ID = 'em088_00';
if (![...monSel.options].some(o => o.value === ID)) monSel.add(new Option(ID, ID));
monSel.value = ID; await monSel.onchange(); await wait(1500);
await V.effects(false); await V.effects(true);
await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === ID && M.effectRuntimeInstance().schedule);
const fx = () => M.effectRuntimeInstance();
const carrySel = document.getElementById('monCarry');
const setCarry = async v => { carrySel.value = String(v); await carrySel.onchange({ target: carrySel }); await wait(100); };
const play = async (list, clip) => {
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  const opts = [...clipSel.options];
  const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_start') || opts.find(x => x.value === clip + '_loop');
  if (!o) return 'no clip ' + clip;
  clipSel.value = o.value; await clipSel.onchange();
  await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
  return o.value;
};
const out = { runs: [] };
const S = () => fx().schedule;
// the unit's own fields: position +0x40, quaternion +0x50, scale +0x60
const unitOf = q => { const m = fx().host.m, u = m.u32(q.core + 0x150); if (!u) return null;
  const f = o => m.f32(u + o);
  const qx = f(0x50), qy = f(0x54), qz = f(0x58), qw = f(0x5c);
  const fz = [2 * (qx * qz + qw * qy), 2 * (qy * qz - qw * qx), 1 - 2 * (qx * qx + qy * qy)];   // +Z turned
  return { pos: [f(0x40), f(0x44), f(0x48)], scale: [f(0x60), f(0x64), f(0x68)], fwd: fz }; };
const sub = (a, b) => a.map((v, i) => v - b[i]), len = a => Math.hypot(...a), dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const frameNow = () => V.pose.action ? V.pose.action.time * 60 : -1;
async function kase(tag, list, clip, carry, from = 0){
  await V.effects(false);
  await setCarry(4);
  const c = await play(list, clip);
  await until(() => frameNow() >= from, 900);
  await setCarry(carry);
  await V.effects(true);
  await until(() => fx() && fx().monsterId === ID && fx().schedule && fx().schedule.threads, 600);
  await until(() => fx().failed || (S().threadState().on.length && S().threadState().on.every(o => { const sl = S().threads.slots[o.slot]; return sl && unitOf(sl.q); })), 120);
  await wait(50);
  const r = await sample(tag + ' ' + c);
  out.runs.push(r);
}
V.renderer.setClearColor(0x283038, 1);
const shots = [];
async function shoot(name, ja, jb){
  const SK = await import('/render/skeleton.js');
  const bones = SK.gidBonesOf(V.mounted.main), P = g => { const b = bones.find(x => x.gid === g); const v = new V.camera.position.constructor(); b.node.updateWorldMatrix(true, false); return v.setFromMatrixPosition(b.node.matrixWorld); };
  const a = P(ja), b = P(jb), mid = a.clone().add(b).multiplyScalar(0.5), d = b.clone().sub(a), Ld = Math.max(d.length(), 5);
  const side = new V.camera.position.constructor(-d.z, 0, d.x).normalize();
  V.controls.target.copy(mid); V.camera.position.copy(mid.clone().add(side.multiplyScalar(Ld * 2.2)).add(new V.camera.position.constructor(0, Ld * 0.6, 0)));
  V.camera.lookAt(mid); V.controls.update();
  const t = V.pose.action ? V.pose.action.time : 0;
  const r = await V.shot('ak-threads', name, t);
  if (V.pose.action) V.pose.action.timeScale = 1;
  shots.push(r && r.saved);
}
const sh = () => S().shells && S().shells.state;
const desc = () => { const st = S().threadState(), s = sh();
  const live57 = s ? s.shells.filter(x => x.base === 'base57').map(x => ({ obj: x.obj, st: x.state, beh: x.behaviour, pos: x.position && x.position.map(Math.round) })) : null;
  return { f: S().clip && +S().clip.frame.toFixed(1), clip: V.pose.action && V.pose.action.getClip().name, inp: S().threadInput && S().threadInput(),
           on: st.on.map(o => 'u' + o.key + '@' + o.slot + ' ' + o.a + '->' + JSON.stringify(o.b) + ' B' + JSON.stringify(o.B.map(Math.round))),
           missing: st.missing, spots: s && s.spots088 ? Object.fromEntries(Object.entries(s.spots088).map(([k, v]) => [k, v.pos.map(Math.round)])) : null,
           live57, failed: fx().failed || null, refused: (S().shellTally || {}).refused }; };
await V.effects(false); await V.effects(true);
await until(() => fx() && fx().monsterId === ID && fx().schedule && fx().schedule.threads, 600);
await setCarry(1);
out.c1 = await play('0', 'Motion[13]');
const log = [];
for (let i = 0; i < 40; i++){ await wait(250); const d = desc(); log.push(d); if (d.spots && d.spots[1]) break; }
out.drop = log.slice(-4);
out.c2 = await play('2', 'Motion[19]');
const log2 = [];
let shot1 = false, shot2 = false;
for (let i = 0; i < 60; i++){
  await wait(100); const d = desc(); log2.push(d);
  if (d.failed) break;
  if (!shot1 && d.on.some(x => /^u1[01]@/.test(x)) && d.f > 40){ shot1 = true; await shoot('pull_M19_to_spot', 149, 130); }
  if (!shot2 && d.live57 && d.live57.some(x => x.st === 2) && d.on.some(x => /^u14@/.test(x))){ shot2 = true; await shoot('pull_M19_u14_to_flying', 5, 149); }
}
out.pull = log2;
out.shots = shots;
return out;
