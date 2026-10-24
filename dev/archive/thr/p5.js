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
// the drawn strands: each model draw of em088_00_003_s's two meshes sits at its thread's A (its translation row); its glb
// vertices through CBWorld's rows, the extremes along A -> B against A and B (game units)
function drawnEnds(){
  const F = fx(), draws = F.host.modelDraws || [];
  const st = S().threadState();
  const res = st.on.map(o => ({ slot: o.slot, key: o.key, A: o.A, B: o.B, draws: [], lo: Infinity, hi: -Infinity, loP: null, hiP: null, off: 0 }));
  for (const d of draws){
    const short = String(d.model).split(String.fromCharCode(92)).pop();
    if (!/^em088_00_10[01]$/.test(short)) continue;
    const w = d.world, T = [w[3], w[7], w[11]];
    let best = null, bd = Infinity;
    for (const r of res){ const D = sub(r.B, r.A), L = len(D), t = dot(sub(T, r.A), D) / (L * L);
      const e = len(sub(T, r.A.map((a, i) => a + D[i] * t))) + (t < -0.2 || t > 0.3 ? 1e6 : 0); if (e < bd){ bd = e; best = r; } }
    if (!best || bd > 20) continue;
    const src = F.meshOf(F.glb(short), d.model, d.meshIndex);
    const P = src.geometry.attributes.position;
    const D = sub(best.B, best.A), L = len(D), u = D.map(x => x / L);
    best.draws.push(short + '#' + d.meshIndex);
    for (let i = 0; i < P.count; i++){
      const v = [P.getX(i), P.getY(i), P.getZ(i), 1];
      const p = [0, 1, 2].map(r => w[4 * r] * v[0] + w[4 * r + 1] * v[1] + w[4 * r + 2] * v[2] + w[4 * r + 3]);
      const s = dot(sub(p, best.A), u);
      if (s < best.lo){ best.lo = s; best.loP = p; } if (s > best.hi){ best.hi = s; best.hiP = p; }
      const perp = len(sub(sub(p, best.A), u.map(x => x * s))); if (perp > best.off) best.off = perp;
    }
  }
  return res.map(r => ({ u: r.key, slot: r.slot, L: +len(sub(r.B, r.A)).toFixed(1), draws: r.draws.join(' '),
    'drawn from A': +r.lo.toFixed(1), 'drawn to (past B)': +(r.hi - len(sub(r.B, r.A))).toFixed(1), 'drawn/L': +((r.hi - r.lo) / len(sub(r.B, r.A))).toFixed(4),
    'half-width': +r.off.toFixed(1) }));
}
const shots = [];
V.renderer.setClearColor(0x283038, 1);
async function shoot(name){
  const t = V.pose.action ? V.pose.action.time : 0;
  const r = await V.shot('ak-threads', name, t);
  if (V.pose.action) V.pose.action.timeScale = 1;
  shots.push(r && r.saved);
}
async function look(tag, list, clip, carry, from = 0){
  await V.effects(false);
  await setCarry(4);
  const c = await play(list, clip);
  await until(() => frameNow() >= from, 900);
  await setCarry(carry);
  await V.effects(true);
  await until(() => fx() && fx().monsterId === ID && fx().schedule && fx().schedule.threads, 600);
  await until(() => frameNow() >= from, 900);
  await wait(400);
  const ends = drawnEnds();
  out.runs.push({ tag: tag + ' ' + c, f: S().clip && +S().clip.frame.toFixed(1), failed: fx().failed || null, ends });
  V.renderer.setClearColor(0x283038, 1);
  // a side view of the threads: the camera off the midpoint of joint 149 and joint 130, square to the line
  const SK = await import('/render/skeleton.js');
  const bones = SK.gidBonesOf(V.mounted.main), P = g => { const b = bones.find(x => x.gid === g); const v = new V.camera.position.constructor(); b.node.updateWorldMatrix(true, false); return v.setFromMatrixPosition(b.node.matrixWorld); };
  const a = P(149), b = P(130), mid = a.clone().add(b).multiplyScalar(0.5), d = b.clone().sub(a), Ld = d.length();
  const side = new V.camera.position.constructor(-d.z, 0, d.x).normalize();
  V.controls.target.copy(mid); V.camera.position.copy(mid.clone().add(side.multiplyScalar(Ld * 1.6)).add(new V.camera.position.constructor(0, Ld * 0.4, 0)));
  V.camera.lookAt(mid); V.controls.update();
  await shoot(tag.replace(/\W+/g, '_'));
}
await look('L2 M5 Pole u12 u14', '2', 'Motion[5]', 0);
await look('L2 M7 Wheel u13 u15', '2', 'Motion[7]', 1);
await look('L2 M6 Frame from 105 u11', '2', 'Motion[6]', 2, 105);
await look('L2 M13 Pole from 55 u10', '2', 'Motion[13]', 0, 55);
await look('L0 M1 Wheel u11', '0', 'Motion[1]', 1);
out.shots = shots;
return out;
