// shprobe.mjs (run-check.mjs; PROBE='[["em005_00","2","Motion[46]",2,300], ...]'): play each clip n times in the page and report the
// shells made (shell, mode, the request's record), the shell tally's refusals, and the picks the page offered
async function shProbe(MON, list, clip, n, nf, loop){
  window.__probeLoop = !!loop; window.__probePiece = typeof loop === 'string' ? loop : '_start';
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = k => new Promise(r => { let i = 0; const f = () => (++i >= k ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, k = 600) => { for (let i = 0; i < k; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (V.state.id !== MON){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  }
  V.state.loop = !!(typeof window !== 'undefined' && window.__probeLoop);
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  const opts = [...clipSel.options].map(o => o.value).filter(v => v.replace(/#.*$/, '').replace(/_(start|loop)$/, '') === clip);
  const want = window.__probePiece || '_start'; const val = opts.find(v => v.endsWith(want) && !/#/.test(v)) || opts.find(v => !/#/.test(v)) || opts[0];
  const seen = new Map(), labels = [];
  for (let i = 0; i < n; i++){
    clipSel.value = val; await clipSel.onchange();
    for (let k = 0; k < nf; k++){
      await frames(1);
      const rt = M.effectRuntimeInstance(), st = rt && rt.schedule && rt.schedule.shells && rt.schedule.shells.state;
      for (const s of (st ? st.shells : [])){ if (!seen.has(s)) seen.set(s, { play: i, shell: s.shell, mode: s.modeIndex, key: s.start && s.start.key,
        pel: s.start && s.start.pel, req: !!s.request, action: s.action, first: s.position && s.position.map(Math.round) });
        const e = seen.get(s); e.last = s.position && s.position.map(Math.round); e.state = s.state; e.moves = s.moves; e.ev = (s.events || []).map(x => x.ev + ':' + (x.kind || '') + ':' + (x.start ? x.start.key : x.param)).slice(-4); e.floor = rt.schedule.shells.lastFloor; }
    }
    const lab = document.getElementById('beamLabel') || document.querySelector('[data-beam-label]');
    labels.push(lab ? lab.textContent : null);
  }
  const rt = M.effectRuntimeInstance(), T = rt && rt.schedule && rt.schedule.shellTally;
  out.push([false, 'PROBE ' + MON + ' L' + list + ' ' + clip, JSON.stringify({ menu: opts, played: val, labels, failed: rt && rt.failed ? String(rt.failed) : null,
    shells: [...seen.values()], refused: T ? T.refused.slice(-8) : null })]);
  return out;
}
export const pageCheck = shProbe;
export const args = (typeof process !== 'undefined' && process.env.PROBE) ? JSON.parse(process.env.PROBE) : [];
