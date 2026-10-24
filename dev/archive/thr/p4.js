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
const shots = [];
async function shoot(name){
  const t = V.pose.action ? V.pose.action.time : 0;
  const r = await V.shot('ak-threads', name, t);
  if (V.pose.action) V.pose.action.timeScale = 1;
  shots.push(r && r.saved);
}
const drawsNow = () => { const F = fx(), h = F.host;
  const md = (h.modelDraws || []).map(d => { const w = d.world; return String(d.model).split(String.fromCharCode(92)).pop() + '#' + d.meshIndex + ' @' + [w[3], w[7], w[11]].map(x => Math.round(x)).join(',') + ' sx' + Math.hypot(w[0], w[4], w[8]).toFixed(2) + ' sz' + Math.hypot(w[2], w[6], w[10]).toFixed(2); });
  const pd = (h.primDraws || []).map(d => (d.textures ? Object.values(d.textures).join('+') : '') + ' v' + d.vertices + ' ' + d.blend);
  const gd = (h.gpuDraws || []).map(d => 'gpu v' + d.vertices);
  return { md, pd, gd, filters: F.stats.filters }; };
const reqs = () => S().entries.filter(e => e.def.record && e.requests.length).map(e => e.when + ' u' + e.def.record.key + ' x' + e.requests.length + ' ' + e.def.efl.split('/').pop());
async function look(tag, list, clip, carry, hold120){
  await V.effects(false);
  await setCarry(4);
  const c = await play(list, clip);
  await setCarry(carry);
  await V.effects(true);
  await until(() => fx() && fx().monsterId === ID && fx().schedule && fx().schedule.threads, 600);
  if (hold120) fx().holdRage('em088_00u', 120, true);
  await wait(1200);
  out.runs.push({ tag, failed: fx().failed || null, reqs: reqs(), draws: drawsNow() });
  await shoot(tag.replace(/\W+/g, '_'));
}
await look('M7 c1', '2', 'Motion[7]', 1, false);
await look('M7 c1 no120', '2', 'Motion[7]', 1, true);
await look('M7 c4', '2', 'Motion[7]', 4, false);
out.shots = shots;
return out;
