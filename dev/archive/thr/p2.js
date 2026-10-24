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
await kase('carry 0', '2', 'Motion[5]', 0, 30);
await kase('carry 1', '2', 'Motion[7]', 1, 30);
await kase('carry 2 from 105', '2', 'Motion[6]', 2, 105);
await kase('carry 0 from 55', '2', 'Motion[13]', 0, 55);
await kase('carry 1 from 40', '2', 'Motion[19]', 1, 40);
await kase('carry 1 from 75', '2', 'Motion[37]', 1, 75);
await kase('carry 2 from 95', '2', 'Motion[41]', 2, 95);
await kase('carry 0 idle', '0', 'Motion[1]', 0, 10);
await kase('carry 4', '2', 'Motion[5]', 4, 30);
await kase('carry 0 on L3 M14 (dropped)', '3', 'Motion[14]', 0, 10);
await kase('carry 0 L2 M30', '2', 'Motion[30]', 0, 5);
await kase('carry 0 L2 M17', '2', 'Motion[17]', 0, 20);

return out;
