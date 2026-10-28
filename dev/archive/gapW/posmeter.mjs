// posmeter.mjs (run-check.mjs): Alatreon's posture rows (motion-states.js AIR_HEIGHT.em050_00) clip by clip, BEFORE (the row taken out of
// the live table for the play) and AFTER: one play with loop off and 120 effect steps after its end; the floor the shells / effects take
// (rockInput floorY), the unit (unitGamePos y), sampled at the play's middle, and the meter's rows (starts / lit / verdict) for every
// record the play started.
async function posMeter(clips){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js'), MS = await import('/render/motion-states.js');
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await raf(); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em050_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  V.state.loop = false;
  const T = MS.AIR_HEIGHT[MON];
  for (const key of clips){
    const [list, clip] = key.split('|');
    for (const pass of ['before', 'after']){
      const keep = T.clips[key];
      if (pass === 'before') delete T.clips[key];
      try {
        // a clean runtime for each pass: the last play's shells and effects (they outlive a one-shot clip) would count here
        await V.effects(false); await V.effects(true);
        await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
        V.effectMeter(true, { every: 3 });
        if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
        const rtNow = M.effectRuntimeInstance();
        const opts = [...clipSel.options].map(o => o.value).filter(v => v.replace(/#.*$/, '').replace(/_(start|loop)$/, '') === clip);
        if (!opts.length){ out.push([false, 'NOCLIP ' + key, '']); continue; }
        const rt = rtNow, samples = [];
        for (const val of opts){
          clipSel.value = val; await clipSel.onchange();
          await until(() => V.pose.action && V.pose.action.getClip().name === val, 300);
          const act = V.pose.action, len = Math.round(act.getClip().duration * 60);
          let sampled = false;
          for (let i = 0; i < 6000; i++){
            await raf();
            const t = act.time * 60;
            if (!sampled && t >= len / 2){ sampled = true; const ri = V.rockInput(); samples.push({ piece: val, f: Math.round(t), floor: ri && Math.round(ri.floorY), unit: Math.round(V.unitGamePos()[1]) }); }
            if (act.paused && act.time >= act.getClip().duration - 2e-3) break;
          }
        }
        const s0 = rt.stats.steps;
        await until(() => rt.stats.steps - s0 >= 300, 6000);
        const rep = V.effectMeterReport().recs.filter(r => r.monster === MON && r.starts > 0)
          .map(r => ({ k: r.key.split('|').slice(1).join('|'), st: r.starts, lit: r.litSamples + '/' + r.samples, v: r.verdict }));
        out.push([false, (pass === 'before' ? 'BEFORE ' : 'AFTER ') + key, JSON.stringify({ samples, meter: rep })]);
        V.effectMeter(false);
      } finally { if (pass === 'before' && keep) T.clips[key] = keep; }
    }
  }
  return out;
}
export const pageCheck = posMeter;
const CL = ['1|Motion[2]', '1|Motion[4]', '1|Motion[6]', '1|Motion[7]', '1|Motion[8]', '1|Motion[9]', '1|Motion[11]', '1|Motion[12]', '1|Motion[15]',
  '1|Motion[20]', '2|Motion[7]', '2|Motion[8]', '2|Motion[9]', '2|Motion[10]', '2|Motion[11]', '2|Motion[12]', '2|Motion[18]', '2|Motion[19]',
  '2|Motion[21]', '2|Motion[23]', '2|Motion[24]', '3|Motion[53]', '3|Motion[54]'];
export const args = [[CL.slice(0, 8)], [CL.slice(8, 16)], [CL.slice(16)]];
