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
async function sample(tag){
  const st = S().threadState();
  const R = S().threads;
  const rows = st.on.map(o => {
    const sl = R.slots[o.slot], u = sl && sl.q ? unitOf(sl.q) : null;
    const d = sub(o.B, o.A), L = len(d);
    return { slot: o.slot, key: o.key, a: o.a, b: o.b, L: +L.toFixed(1),
             unit: u && { posErr: +len(sub(u.pos, o.A)).toFixed(3), endErr: +len(sub(o.B, u.pos.map((p, i) => p + u.fwd[i] * 920 * u.scale[2]))).toFixed(3),
                          sz: +u.scale[2].toFixed(4), cosAim: +(dot(u.fwd, d) / (len(u.fwd) * L)).toFixed(5) } };
  });
  return { tag, frame: S().clip && +S().clip.frame.toFixed(1), action: (S().threadInput && S().threadInput().action) || null,
           failed: fx().failed || null, rows, off: st.off.map(x => 'u ' + x.key + ': ' + x.why.slice(0, 40)), missing: st.missing };
}
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
// THE DRAWN ENDS: every model draw of the last frame, its glb mesh's vertices through CBWorld's rows (game units, the
// host's world -- the frame A / B are in), assigned to the nearest live thread; the extreme points along the thread
// against its two points
function drawnEnds(){
  const F = fx(), draws = F.host.modelDraws || [];
  const st = S().threadState();
  const res = st.on.map(o => ({ slot: o.slot, key: o.key, A: o.A, B: o.B, n: 0, lo: Infinity, hi: -Infinity, loP: null, hiP: null, off: 0 }));
  for (const d of draws){
    const short = String(d.model).split(String.fromCharCode(92)).pop();
    const scene = F.glb(short); if (!scene) continue;
    const src = F.meshOf(scene, d.model, d.meshIndex); if (!src) continue;
    const P = src.geometry.attributes.position, w = d.world;
    const pts = [];
    for (let i = 0; i < P.count; i++){
      const v = [P.getX(i), P.getY(i), P.getZ(i), 1];
      pts.push([0, 1, 2].map(r => w[4 * r] * v[0] + w[4 * r + 1] * v[1] + w[4 * r + 2] * v[2] + w[4 * r + 3]));
    }
    const c = pts.reduce((s, p) => s.map((x, i) => x + p[i] / pts.length), [0, 0, 0]);
    let best = null, bd = Infinity;
    for (const r of res){ const d0 = sub(r.B, r.A), L = len(d0), t = Math.max(0, Math.min(1, dot(sub(c, r.A), d0) / (L * L)));
      const dist = len(sub(c, r.A.map((a, i) => a + d0[i] * t))); if (dist < bd){ bd = dist; best = r; } }
    if (!best) continue;
    best.n++;
    const d0 = sub(best.B, best.A), L = len(d0), u = d0.map(x => x / L);
    for (const p of pts){ const s = dot(sub(p, best.A), u);
      if (s < best.lo){ best.lo = s; best.loP = p; } if (s > best.hi){ best.hi = s; best.hiP = p; }
      const perp = len(sub(sub(p, best.A), u.map(x => x * s))); if (perp > best.off) best.off = perp; }
  }
  return res.map(r => ({ slot: r.slot, key: r.key, L: +len(sub(r.B, r.A)).toFixed(1), draws: r.n,
    nearEnd: r.loP && +len(sub(r.loP, r.A)).toFixed(1), farEnd: r.hiP && +len(sub(r.hiP, r.B)).toFixed(1),
    along: [+r.lo.toFixed(1), +r.hi.toFixed(1)], radius: +r.off.toFixed(1) }));
}
const shots = [];
async function shoot(name){
  const t = V.pose.action ? V.pose.action.time : 0;
  const r = await V.shot('ak-threads', name, t);
  if (V.pose.action) V.pose.action.timeScale = 1;
  shots.push(r && r.saved);
}
async function watch(tag, list, clip, carry, from, ms, shotAt){
  await V.effects(false);
  await setCarry(4);
  const c = await play(list, clip);
  await until(() => frameNow() >= from, 900);
  await setCarry(carry);
  await V.effects(true);
  await until(() => fx() && fx().monsterId === ID && fx().schedule && fx().schedule.threads, 600);
  const t0 = performance.now(), log = [];
  let shot = false;
  while (performance.now() - t0 < ms){
    await wait(200);
    const s = await sample(tag);
    const e = drawnEnds();
    log.push({ f: s.frame, failed: s.failed, on: s.rows.map(r => 'u' + r.key + '@' + r.slot + ' L' + r.L + (r.unit ? ' endErr' + r.unit.endErr : '')),
               drawn: e });
    if (s.failed) break;
    if (!shot && performance.now() - t0 > shotAt){ shot = true; await shoot(tag.replace(/\W+/g, '_')); }
  }
  out.runs.push({ tag: tag + ' ' + c, log });
}
await watch('L2 M5 carry 0', '2', 'Motion[5]', 0, 0, 3000, 800);
await watch('L2 M7 carry 1', '2', 'Motion[7]', 1, 0, 3000, 800);
await watch('L0 idle carry 2', '0', 'Motion[1]', 2, 0, 4000, 1500);
out.shots = shots;
return out;
