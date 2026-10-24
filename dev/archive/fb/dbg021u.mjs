export const args = [];
export async function pageCheck(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em021_00';
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => body() && body().monsterId === MON && body().schedule);
  for (const key of [200]){
    const rt = body(), S = rt.schedule, m = rt.host.m;
    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === 'em021_00u' && x.def.record.key === key);
    S.start(e);
    const q = e.requests[e.requests.length - 1];
    const log = [];
    const dump = () => { const core = q && q.core; const gens = [];
      const nu = core ? m.u32(core + 0x15c) : 0;
      for (let i = 0; i < nu; i++){ const u = m.u32(core + 0x150 + 4 * i) >>> 0;
        gens.push(['unit', u.toString(16), 'm1', (m.u32(u + 0x1c8) >>> 0).toString(16), 'm2', (m.u32(u + 0x1cc) >>> 0).toString(16)]);
        for (let g = m.u32(u + 0x1f0) >>> 0, n = 0; g && n < 64; g = m.u32(g + 0xc) >>> 0, n++){ const w40 = m.u32(g + 0x40) >>> 0;
          gens.push([g.toString(16), 't', (w40 >>> 20) & 0xf, 'f10', m.u8(g + 0x10), 'live', m.u32(g + 0xb0) ? 1 : 0, 'k46', m.u8(g + 0x46), 'row', m.u16(g + 0x48)]); } }
      return { core: core ? core.toString(16) : null, nu, gens }; };
    log.push(['start', dump(), q && Object.keys(q)]);
    for (let f = 0; f < 120; f++){
      try { rt.host && rt.host.stepOnce && 0; } catch (_) {}
      await frames(1);
      if (f < 3) log.push(['f' + f, rt.failed ? String(rt.failed) : null, dump()]);
      const core = q && q.core;
      if (!core) break;
      const gens = [];
      for (let g = m.u32(core + 0x1f0) >>> 0, n = 0; g && n < 64; g = m.u32(g + 0xc) >>> 0, n++){
        const w40 = m.u32(g + 0x40) >>> 0;
        gens.push([g.toString(16), (w40 >>> 20) & 0xf, m.u8(g + 0x10), m.u32(g + 0xb0) ? 1 : 0, m.u8(g + 0x46), m.u16(g + 0x48)]);
      }
      if (f % 10 === 0 || rt.failed) log.push([f, rt.failed ? String(rt.failed) : null, gens.filter(x => x[1] === 6 || rt.failed)]);
      if (rt.failed) break;
    }
    out.push([false, 'u ' + key + ' path ' + e.def.record.path + ' idx ' + e.def.record.index, JSON.stringify(log).slice(0, 3000)]);
    await V.effects(false); await V.effects(true);
    await until(() => body() && body().monsterId === MON && body().schedule);
  }
  return out;
}
