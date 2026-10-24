// mprobe.mjs (run-check; MP='["em008_00","0","Motion[24]",200]'): the meter on over one clip play, every row it keeps
async function mProbe(MON, list, clip, nf){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = k => new Promise(r => { let i = 0; const f = () => (++i >= k ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, k = 600) => { for (let i = 0; i < k; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  V.state.loop = false;
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  V.effectMeter(true, { every: 1 });
  clipSel.value = clip; await clipSel.onchange();
  const seen = [];
  for (let k = 0; k < nf; k++){
    await frames(1);
    const rt = M.effectRuntimeInstance(), sc = rt && rt.schedule;
    const st = sc && sc.shells && sc.shells.state;
    for (const s of (st ? st.shells : [])) if (!seen.includes(s)) { seen.push(s);
      const ent = s.request ? sc.entries.find(e => e.requests && e.requests.includes(s.request)) : null;
      out.push([false, 'SHELL ' + s.shell + ' ' + s.modeIndex, JSON.stringify({ k, key: s.start && s.start.key, req: !!s.request, entry: ent ? (ent.when + ' ' + ent.def.efl) : 'NO ENTRY', state: s.state, moves: s.moves })]); }
  }
  const rep = V.effectMeterReport(); V.effectMeter(false);
  out.push([false, 'ROWS', JSON.stringify(rep.recs.filter(r => r.monster === MON).map(r => [r.key, r.starts, r.verdict]))]);
  return out;
}
export const pageCheck = mProbe;
export const args = (typeof process !== 'undefined' && process.env.MP) ? [JSON.parse(process.env.MP)] : [];
