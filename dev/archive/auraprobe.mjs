// auraprobe.mjs: where a class-held aura's units stand -- the held request (the class's block) against a plain request of the same record
// (the record's own placement), and against his joints (game units)
async function auraProbe(mon, ctl, pel, key, list, clip){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  const cs = document.getElementById('monClassCtl');
  if (cs && ctl != null){ cs.value = String(ctl); cs.dispatchEvent(new Event('change')); }
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  clipSel.value = clip; await clipSel.onchange();
  await frames(90);
  const rt = M.effectRuntimeInstance(), sch = rt.schedule, m = sch.host.m;
  const pos = u => [0x40, 0x44, 0x48].map(o => Math.round(m.f32(u + o)));
  const held = [];
  for (const e of sch.entries) if (e.def.record && e.def.record.pel === pel && e.def.record.key === key)
    for (const q of e.requests) if (!q.stopped) held.push(q.effects().map(pos));
  // a plain request of the same record, for the record's own placement
  const plain = rt.schedule.fire(pel, key);
  await frames(20);
  const plainPos = plain.map(q => q.effects().map(pos));
  const joints = {};
  for (const [g, mm] of rt.gameJoints) if (g <= 12 || g === 100) joints[g] = [12, 13, 14].map(i => Math.round(mm[i]));
  const unitP = rt.parent && rt.parent.position ? rt.parent.position.map(Math.round) : null;
  out.push([held.length > 0, mon + ' ' + pel + ' ' + key + ': held request units / plain request units / joints',
    JSON.stringify({ held, plainPos, unit: unitP, joints, failed: rt.failed || null })]);
  return out;
}
export const pageCheck = auraProbe;
export const args = [['em027_00', 1, 'em027_00u', 0, '0', 'Motion[1]']];
