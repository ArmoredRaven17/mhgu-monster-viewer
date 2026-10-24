// kwmeter.mjs: Kushala's wind aura per Wind Aura level, calm / enraged -- the draw meter on an idle play; every em024 record's starts / lit,
// the held requests now, their units' positions against his joints
async function kwMeter(level, rage, extra){
  const out = [];
  const mon = 'em027_00';
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  const cs = document.getElementById('monClassCtl');
  cs.value = String(level); cs.dispatchEvent(new Event('change'));
  const st = document.getElementById('monState');
  if (st){ st.value = rage ? 'rage' : 'normal'; st.onchange({ target: st }); }
  // a part row put on the option that draws (or hides) part extra.part
  let rowNote = null;
  if (extra && extra.part != null){
    for (const f of document.querySelectorAll('[data-row]')){
      if (!f.dataset.row.split(',').includes(String(extra.part))) continue;
      const sel = f.querySelector('select'); if (!sel) continue;
      for (const o of sel.options){ sel.value = o.value; sel.dispatchEvent(new Event('change')); await frames(2);
        const d = V.mounted.main.userData.partsDrawn; if (d && (d.get(extra.part) === true) === !!extra.on){ rowNote = f.dataset.row + ' = ' + o.textContent.trim(); break; } }
      break;
    }
  }
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  const C = V.controls, cam = V.camera;
  cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.0))); C.update();
  V.effectMeter(true, { every: 5 });
  if (V.state.list !== '0'){ listSel.value = '0'; await listSel.onchange(); }
  clipSel.value = (extra && extra.clip) || 'Motion[1]_loop'; await clipSel.onchange();
  await frames(240);
  const rep = V.effectMeterReport();
  V.effectMeter(false);
  const rt = M.effectRuntimeInstance(), sch = rt.schedule, m = sch.host.m;
  const live = [];
  for (const e of sch.entries) if (e.def.record) for (const q of e.requests) if (!q.stopped && q.effects().length)
    live.push(e.def.record.pel + ':' + e.def.record.key + ' ' + e.when + ' @' + JSON.stringify(q.effects().slice(0, 1).map(u => [0x40, 0x44, 0x48].map(o => Math.round(m.f32(u + o))))));
  const recs = rep.recs.filter(r => r.starts).map(r => r.key.split('|').slice(1).join('|') + ' ' + r.starts + ' st ' + r.litSamples + '/' + r.samples);
  const joints = {}; for (const [g, mm] of rt.gameJoints) if (g <= 6) joints[g] = [12, 13, 14].map(i => Math.round(mm[i]));
  out.push([true, 'wind ' + level + (rage ? ' enraged' : ' calm') + (extra && extra.part != null ? ' part ' + extra.part + (extra.on ? ' drawn' : ' hidden') : ''), JSON.stringify({ row: rowNote, recs, live, failed: rt.failed || null, refused: sch.shellTally ? sch.shellTally.refused.slice(-6) : null, spawned: sch.shellTally ? sch.shellTally.spawned : null, clip: V.pose.action && V.pose.action.getClip().name, opts: [...clipSel.options].filter(o => /Motion\[1\]/.test(o.value)).map(o => o.value) })]);
  if (st){ st.value = 'normal'; st.onchange({ target: st }); }
  cs.value = '0'; cs.dispatchEvent(new Event('change'));
  return out;
}
export const pageCheck = kwMeter;
export const args = [[1, false, { part: 3, on: false }], [1, false, { part: 3, on: true }], [1, true, { part: 3, on: false }], [1, true, { part: 3, on: true }], [0, false, { part: 3, on: false }]];
