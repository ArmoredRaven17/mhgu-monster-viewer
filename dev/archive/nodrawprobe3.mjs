// nodrawprobe.mjs (run-check.mjs; PROBE_MON / PROBE_CLIP 'list|clip' / PROBE_KEYS 'pel:key,...'): for each named record live on that
// clip, its requests' units -- +0xc (state, draw bits: drawn only when & 0x4807 == 0x4802), +0xe (view bits), the generator list
// +0x1f0 (each generator's vtable, +0x46 type mark, +0xed flags, +0xb0 particle list head) -- and how many draws its drawEffect gave.
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
  V.effectMeter(true, { every: 1000 });
  for (let f = 0; f < 200; f++){
    await frames(2);
    const fx = M.effectRuntimeInstance(), S = fx.schedule, m = fx.host.m, own = fx.host.drawOwners;
    for (const e of S.entries){
      const r = e.def.record;
      if (!r || !keys.includes(r.pel + ':' + r.key)) continue;
      for (const q of e.requests){
        const units = q.effects(); if (!units.length) continue;
        const info = units.map(u => {
          const gens = [];
          for (let g = m.u32(u + 0x1f0) >>> 0, n = 0; g && n < 16; g = m.u32(g + 0xc) >>> 0, n++)
            gens.push({ g: '0x' + g.toString(16), vt: '0x' + (m.u32(g) >>> 0).toString(16), t46: m.u8(g + 0x46), ed: m.u8(g + 0xed), b0: '0x' + (m.u32(g + 0xb0) >>> 0).toString(16), b4: m.u32(g + 0xb4) >>> 0 });
          const ow = own && own.units.find(x => x.unit === (u >>> 0));
          const rl = m.u32(u + 0xf4) >>> 0, rows = [];
          for (let row = 0; row < 24 && rl; row++){
            const c0 = m.u32(m.u32(rl + 0x68) + (row << 4)) >>> 0; if (!c0) break;
            const nb = (m.u32(rl + 0x68) + (c0 >>> 8)) >>> 0;
            rows.push(['0x' + (m.u32(nb) >>> 0).toString(16), '0x' + (m.u32(nb + 4) >>> 0).toString(16), 't' + (c0 & 0xff)]);
          }
          return { mask1: '0x' + (m.u32(u + 0x1c8) >>> 0).toString(16), mask2: '0x' + (m.u32(u + 0x1cc) >>> 0).toString(16), rows,
                   u: '0x' + (u >>> 0).toString(16), vt: '0x' + (m.u32(u) >>> 0).toString(16), w0c: '0x' + (m.u32(u + 0xc) >>> 0).toString(16), drawnGate: (m.u32(u + 0xc) & 0x4807) === 0x4802,
                   e: m.u8(u + 0xe), gens, drawn: ow ? { m: ow.models[1] - ow.models[0], p: ow.prims[1] - ow.prims[0], g: ow.gpu[1] - ow.gpu[0] } : 'not in the drawn list' };
        });
        out.push([false, 'PROBE ' + r.pel + ':' + r.key + ' t' + f, JSON.stringify({ core: '0x' + (q.core >>> 0).toString(16), coreW: '0x' + (m.u32(q.core + 0xc) >>> 0).toString(16), stopped: !!q.stopped, units: info })]);
      }
    }
  }
  V.effectMeter(false);
  return out;
}
export const pageCheck = probe;
export const args = [[process.env.PROBE_MON || 'em001_00', process.env.PROBE_CLIP || '3|Motion[3]', (process.env.PROBE_KEYS || 'em001_00c:1103').split(',')]];
