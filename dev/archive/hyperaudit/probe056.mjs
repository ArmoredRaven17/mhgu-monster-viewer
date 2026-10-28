// hyperaudit/probe056.mjs (hyper audit, 2026-10-28): Nibelsnarf (em056_00) u 1303 started at below G, then the steps pageaudit.mjs
// takes, dumping the schedule entries of u 1301..1303 (when, requests: stopped / stoppedAtStep / finished) after each -- why u 1303
// does not start again at G after the below-G pass.
async function probe(MON, steps){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip'), sel = $('monHyper');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange(); await frames(30);
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  const rt = M.effectRuntimeInstance(), S = rt.schedule;
  const dump = tag => {
    const ents = S.entries.filter(e => e.def.record && e.def.record.pel === MON + 'u' && e.def.record.key >= 1301 && e.def.record.key <= 1313);
    out.push([true, tag, JSON.stringify({ state: { hyper: V.state.hyper, rank: V.state.questRank, clip: V.state.list + ' ' + V.state.clip }, failed: rt.failed || null,
      ents: ents.map(e => ({ key: e.def.record.key, when: e.when, n: e.requests.length,
        reqs: e.requests.map(q => ({ stopped: !!q.stopped, at: q.stoppedAtStep, fin: typeof q.finished === 'function' ? q.finished() : q.finished })) })) })]);
  };
  const setHyper = async v => { sel.value = v; sel.dispatchEvent(new Event('change')); await frames(2); };
  dump('loaded');
  for (const st of steps){
    const [op, a, b] = st.split(':');
    if (op === 'rank'){ V.state.questRank = +a; await frames(6); }
    else if (op === 'hyper'){ await setHyper(a === '-' ? '' : a.replace('-', ',')); await frames(+(b || 30)); }
    else if (op === 'hold'){ rt.holdEvent(MON + 'u', +a, b === 'on'); await frames(30); }
    else if (op === 'clip'){ if (listSel.value !== a){ listSel.value = a; await listSel.onchange(); await frames(2); } V.state.loop = false; clipSel.value = 'Motion[' + b + ']'; await clipSel.onchange();
      await until(() => V.pose.action && V.pose.action.getClip().name.startsWith('Motion[' + b + ']'), 300);
      const act = V.pose.action, dur = act.getClip().duration; act.time = 0;
      for (let k = 0; k < 3000; k++){ await frames(1); if (act.time >= dur - 1e-3 || (act.paused && k > 2)) break; } await frames(20); }
    else if (op === 'idle'){ listSel.value = '0'; await listSel.onchange(); clipSel.value = clipSel.options[Math.min(1, clipSel.options.length - 1)].value; await clipSel.onchange(); V.state.loop = true; await frames(10); }
    dump(st);
  }
  return out;
}
export const pageCheck = probe;
const env = typeof process !== 'undefined' ? process.env : {};
export const args = [[env.PROBE_MON || 'em056_00', (env.PROBE_STEPS || 'rank:3,hyper:1-3:60,hyper:-:10,hold:1303:on,hold:1303:off,hyper:1-2:5,clip:2:10,hyper:-:5,idle,rank:5,hyper:1-3:60').split(',')]];
