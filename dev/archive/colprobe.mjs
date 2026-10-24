// colprobe.mjs (run-check.mjs; PROBE_MON / PROBE_CLIP / PROBE_KEYS): a record's effect units -- their colour block +0x180..+0x19c
// (eight floats), +0x60 scale -- and each generator's vtable and its first particle's words +0x00..+0x7c, over the record's life,
// beside globalTransparency of its model draws.
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
  for (let f = 0; f < 30; f++){
    await frames(8);
    const fx = M.effectRuntimeInstance(), S = fx.schedule, m = fx.host.m;
    for (const e of S.entries){
      const r = e.def.record;
      if (!r || !keys.includes(r.pel + ':' + r.key)) continue;
      for (const q of e.requests){
        const units = q.effects();
        if (!units.length) continue;
        const info = units.slice(0, 1).map(u => {
          const cb = []; for (let k = 0x180; k <= 0x19c; k += 4) cb.push(+m.f32(u + k).toFixed(3));
          const gens = [];
          for (let g = m.u32(u + 0x1f0) >>> 0, n = 0; g && n < 4; g = m.u32(g + 0xc) >>> 0, n++){
            const p = m.u32(g + 0xb0) >>> 0, w = [];
            if (p) for (let k = 0; k < 0x80; k += 4) w.push((m.u32(p + k) >>> 0).toString(16));
            gens.push({ vt: (m.u32(g) >>> 0).toString(16), t46: m.u8(g + 0x46), p: p.toString(16), w });
          }
          return { u: (u >>> 0).toString(16), cb, gens };
        });
        const d = fx.host.drawFrame(units);
        out.push([false, 'COL ' + r.pel + ':' + r.key + ' +' + f * 8, JSON.stringify({ gt: d.models.map(x => +x.globalTransparency.toFixed(4)).slice(0, 4), info })]);
      }
    }
    if (out.length >= 6) break;
  }
  return out;
}
export const pageCheck = probe;
export const args = [[process.env.PROBE_MON || 'em043_00', process.env.PROBE_CLIP || '2|Motion[1]', (process.env.PROBE_KEYS || 'em043_00c:30').split(',')]];
