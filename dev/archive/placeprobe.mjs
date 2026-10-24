// placeprobe.mjs (run-check.mjs; PROBE_MON, PROBE_SEQ 'list|clip;list|clip', PROBE_KEYS 'pel:key,..'): plays the clips in turn and every
// 10 frames prints, for each named record's live requests: its effect units' position +0x40.. (game units), the core's, and every
// live shell (id, base, state, position) -- with the monster's unit (unitGamePos) and the camera, to place a record that draws off screen.
async function probe(mon, seq, keys){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  V.state.loop = false;
  const r3 = v => v.map(x => Math.round(x));
  for (const step of seq){
    const [l, c] = step.split('|');
    if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === c) || [...clipSel.options].find(x => x.value === c + '_start') || [...clipSel.options].find(x => x.value === c + '_loop');
    clipSel.value = o.value; await clipSel.onchange();
    for (let f = 0; f < 30; f++){
      await frames(10);
      const fx = M.effectRuntimeInstance(), S = fx.schedule, m = fx.host.m;
      const pos = a => [m.f32(a), m.f32(a + 4), m.f32(a + 8)];
      const hits = [];
      for (const e of S.entries){
        const r = e.def.record;
        if (!r || !keys.includes(r.pel + ':' + r.key)) continue;
        for (const q of e.requests){
          const us = q.effects();
          if (!us.length) continue;
          hits.push({ rec: r.pel + ':' + r.key, core: r3(pos(q.core + 0x40)), units: us.slice(0, 3).map(u => r3(pos(u + 0x40))) });
        }
      }
      if (!hits.length) continue;
      const st = S.shells && S.shells.state;
      const shells = st ? st.shells.slice(0, 6).map(s => ({ id: s.id, shell: s.shell, mode: s.modeIndex, state: s.state, pos: s.position ? r3(s.position) : null })) : null;
      const cp = V.camera.position;
      out.push([false, 'PLACE ' + step + ' +' + (f * 10), JSON.stringify({ unit: V.unitGamePos ? r3(V.unitGamePos()) : null, cam: r3([cp.x / 0.01, cp.y / 0.01, cp.z / 0.01]), hits, shells })]);
    }
  }
  return out;
}
export const pageCheck = probe;
export const args = [[process.env.PROBE_MON || 'em066_00', (process.env.PROBE_SEQ || '4|Motion[1]').split(';'), (process.env.PROBE_KEYS || 'em066_00u:22').split(',')]];
