// modelprobe.mjs (run-check.mjs; PROBE_MON / PROBE_CLIP / PROBE_KEYS): for a record's live request, its OWN draw (host.drawFrame over its
// units) -- each model draw's model, mesh, material, world matrix scale and translation, globalTransparency, blend / depth, the
// CBMaterial words -- and its mesh after sync (visible, uniforms that carry alpha / colour).
async function probe(mon, clip, keys){
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
  const [l, c] = clip.split('|');
  if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); }
  const o = [...clipSel.options].find(x => x.value === c) || [...clipSel.options].find(x => x.value === c + '_start') || [...clipSel.options].find(x => x.value === c + '_loop');
  clipSel.value = o.value; await clipSel.onchange();
  for (let f = 0; f < 40; f++){
    await frames(10);
    const fx = M.effectRuntimeInstance(), S = fx.schedule;
    for (const e of S.entries){
      const r = e.def.record;
      if (!r || !keys.includes(r.pel + ':' + r.key)) continue;
      for (const q of e.requests){
        const units = q.effects();
        if (!units.length) continue;
        const d = fx.host.drawFrame(units);
        const md = d.models.map(x => ({ model: x.model, mesh: x.meshIndex, mat: x.material, gt: x.globalTransparency, blend: x.blend, depth: x.depth,
          scale: x.world ? [Math.hypot(x.world[0], x.world[4], x.world[8]), Math.hypot(x.world[1], x.world[5], x.world[9]), Math.hypot(x.world[2], x.world[6], x.world[10])].map(v => +v.toFixed(4)) : null,
          pos: x.world ? [x.world[3], x.world[7], x.world[11]].map(v => Math.round(v)) : null, cb: (x.cbMaterial || []).slice(0, 24) }));
        out.push([false, 'MODEL ' + r.pel + ':' + r.key + ' +' + f * 10, JSON.stringify({ n: [d.prims.length, d.gpu.length, d.models.length], md: md.slice(0, 3), unit: V.unitGamePos ? V.unitGamePos().map(Math.round) : null })]);
        if (out.length > 6) return out;
      }
    }
  }
  return out;
}
export const pageCheck = probe;
export const args = [[process.env.PROBE_MON || 'em043_00', process.env.PROBE_CLIP || '2|Motion[1]', (process.env.PROBE_KEYS || 'em043_00c:30').split(',')]];
