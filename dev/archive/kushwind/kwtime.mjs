// kushwind/kwtime.mjs (2026-10-27): the held aura's model draws over time (their CBWorld translations, game units) against the node,
// the unit and the world group's shift -- is the offset a drift (velocity), a spawn-time placement, or the world group moving?
async function kwTime(Pj){
  const P = JSON.parse(Pj || '{}');
  const out = [];
  const mon = 'em024_00';
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  const r0 = v => Math.round(v);
  const level = P.level || 3;
  V.pose.clock.getDelta = () => 1 / 60;
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange(); await frames(5);
  const cs = $('monClassCtl'); cs.value = String(level); cs.dispatchEvent(new Event('change'));
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  if (V.state.list !== (P.list || '0')){ listSel.value = P.list || '0'; await listSel.onchange(); }
  clipSel.value = P.clip || 'Motion[1]_loop'; await clipSel.onchange();
  const rt = M.effectRuntimeInstance(), sch = rt.schedule, m = sch.host.m;
  const rows = [];
  let last = -1;
  for (let i = 0; i < (P.frames || 240); i++){
    await frames(1);
    const f = Math.round(V.pose.action.time * 60);
    if (!(P.at || [2, 10, 20, 40, 60, 90, 120, 160, 200, 239]).includes(i)) continue;
    const sch0 = sch.effects;
    sch.effects = function(){ return this.entries.flatMap(e => (e.def.record && e.def.record.pel === 'em024_00u' && [0, 1, 10].includes(e.def.record.key)) ? e.requests.flatMap(q => q.effects()) : []); };
    V.renderer.render(V.scene, V.camera);
    sch.effects = sch0;
    const draws = (sch.host.modelDraws || []).map(d => String(d.model).split(String.fromCharCode(92)).pop().slice(2) + '#' + d.meshIndex + '@' + [3, 7, 11].map(k => r0(d.world[k])).join(','));
    let node = null;
    for (const e of sch.entries) if (e.def.record && e.def.record.pel === 'em024_00u' && [0, 1, 10].includes(e.def.record.key))
      for (const q of e.requests) if (!q.stopped) for (const u of q.effects()) node = [0x40, 0x44, 0x48].map(o => r0(m.f32(u + o)));
    rows.push({ i, f, node, unit: V.unitGamePos().map(r0), world: [V.world.position.x, V.world.position.z].map(v => r0(v * 100)), draws });
  }
  out.push([true, 'level ' + level + ' ' + (P.clip || 'Motion[1]_loop'), JSON.stringify(rows)]);
  $('monClassCtl').value = '0'; $('monClassCtl').dispatchEvent(new Event('change'));
  return out;
}
export const pageCheck = kwTime;
export const args = [[process.env.DBG || '{}']];
