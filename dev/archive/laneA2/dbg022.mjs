// laneA2/dbg022.mjs: why u 60 does not start on Blangonga L0 M20 copy B -- the state row, the fire list, the schedule entry
async function dbg(){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  if (![...monSel.options].some(o => o.value === 'em022_00')) monSel.add(new Option('em022_00', 'em022_00'));
  monSel.value = 'em022_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  for (let i = 0; i < 900 && !(M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === 'em022_00'); i++) await frames(1);
  const rt = M.effectRuntimeInstance();
  const ent = { n: rt.schedule.entries.length, mon: rt.monsterId, ev: rt.schedule.entries.filter(e => e.when === 'event' && e.def.record && e.def.record.key < 1000).map(e => e.def.record.pel + ' ' + e.def.record.key) };
  listSel.value = '0'; await listSel.onchange();
  await frames(10);
  const opts = [...clipSel.options].map(o => o.value).filter(v => v.includes('Motion[20]'));
  clipSel.value = opts.find(v => v.includes('#B')) || opts[0];
  await clipSel.onchange(); await frames(20);
  const ms = V.motionStates, cur = ms && ms.cur;
  const E = rt.schedule.entries.find(e => e.def.record && e.def.record.pel === 'em022_00u' && e.def.record.key === 60);
  const desc = q => { const o = {}; for (const k of Object.keys(q)) { const v = q[k]; o[k] = (v == null || typeof v !== 'object') ? v : (Array.isArray(v) ? 'arr' + v.length : 'obj'); } try { o.units = q.effects().length; } catch (e) { o.unitsErr = String(e); } return o; };
  const ent2 = E ? E.requests.map(desc) : 'no entry';
  clipSel.value = 'Motion[20]_loop'; await clipSel.onchange(); await frames(5);
  clipSel.value = 'Motion[20]_loop#B'; await clipSel.onchange();
  const ent3 = E ? E.requests.map(q => { const o = {}; for (const [k, v] of Object.entries(q.state || {})) o[k] = (v == null || typeof v !== 'object') ? v : JSON.stringify(v).slice(0, 80); return o; }) : null;
  const pos = window.__view.unitGamePos ? window.__view.unitGamePos() : null;
  return [[true, 'dbg', JSON.stringify({ opts, val: clipSel.value, ent, ent2, cur: cur && { key: cur.key, spec: cur.spec, k: Object.keys(cur) }, ent3, warn: (window.__liveWarn || null), starts: rt.schedule.starts })]];
}
export const pageCheck = dbg;
export const args = [[]];
