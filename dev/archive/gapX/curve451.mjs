// curvemeter.mjs (run-check.mjs): Alatreon's curve rows and L1 M1's copies (motion-states.js AIR_HEIGHT.em050_00), each clip-menu entry
// played once (loop off) BEFORE (its row taken out of the live table) and AFTER, a fresh runtime per pass, 300 effect steps after the
// end: the floor (rockInput floorY) and the unit (unitGamePos y) at a few frames, and the meter's rows. Then the SPOT CHECK of other
// monsters' air clips (no row touched): the floor and unit at the clip's middle, for the report against the node comparison.
async function curveMeter(cases, spots){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js'), MS = await import('/render/motion-states.js');
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await raf(); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const pick = async MON => { if (V.state.id !== MON){ if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON)); monSel.value = MON; await monSel.onchange(); } };
  const playOnce = async (list, value, at) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === value);
    if (!o) return null;
    clipSel.value = value; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip(), 300);
    const act = V.pose.action, len = Math.round(act.getClip().duration * 60), samples = [];
    const want = (at || [0.1, 0.5, 0.9]).map(x => Math.round(x * len));
    for (let i = 0; i < 6000; i++){
      await raf();
      const t = Math.round(act.time * 60);
      if (want.length && t >= want[0]){ want.shift(); const ri = V.rockInput(); samples.push({ f: t, floor: ri && Math.round(ri.floorY), unit: Math.round(V.unitGamePos()[1]) }); }
      if (act.paused && act.time >= act.getClip().duration - 2e-3) break;
    }
    return { len, samples };
  };
  const MON = 'em050_00';
  await pick(MON);
  V.state.loop = false;
  const T = MS.AIR_HEIGHT[MON];
  for (const [list, value, rowKey] of cases){
    for (const pass of ['before', 'after']){
      const keep = T.clips[rowKey];
      if (pass === 'before') delete T.clips[rowKey];
      try {
        await V.effects(false); await V.effects(true);
        await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
        const rt = M.effectRuntimeInstance();
        V.effectMeter(true, { every: 3 });
        const r = await playOnce(list, value);
        if (!r){ out.push([false, 'NOCLIP ' + list + ' ' + value, '']); continue; }
        const s0 = rt.stats.steps; await until(() => rt.stats.steps - s0 >= 300, 6000);
        const rep = V.effectMeterReport().recs.filter(x => x.monster === MON && (x.starts > 0 || /\|451\|/.test(x.key)))
          .map(x => ({ k: x.key.split('|').slice(1).join('|'), st: x.starts, req: x.requests, kill: x.killed, lit: x.litSamples + '/' + x.samples, v: x.verdict, why: x.why || x.reason }));
        out.push([false, pass.toUpperCase() + ' ' + list + '|' + value, JSON.stringify({ len: r.len, samples: r.samples, meter: rep })]);
        V.effectMeter(false);
      } finally { if (pass === 'before' && keep) T.clips[rowKey] = keep; }
    }
  }
  for (const [mon, list, value] of spots){
    try {
      await pick(mon); V.state.loop = false;
      const r = await playOnce(list, value, [0.5]);
      out.push([false, 'SPOT ' + mon + ' ' + list + '|' + value, JSON.stringify(r)]);
    } catch (e){ out.push([false, 'SPOTERR ' + mon, String(e).slice(0, 200)]); }
  }
  return out;
}
export const pageCheck = curveMeter;
export const args = [[
  [['2', 'Motion[2]_start', '2|Motion[2]']],
  [],
]];
