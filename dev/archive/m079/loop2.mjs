// a clip played through two loops: does a frame-2 shell row fire on the wrap (the first play's first step lands past f2)
export const args = [['em079_00', [['1', 'Motion[14]'], ['1', 'Motion[27]'], ['1', 'Motion[20]']]], ['em079_04', [['2', 'Motion[23]'], ['2', 'Motion[23]'], ['2', 'Motion[23]']]]];
export async function pageCheck(MON, CLIPS){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  V.pose.clock.getDelta = () => 1 / 60;
  V.state.loop = true;
  if (V.state.id !== MON){ if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON)); monSel.value = MON; await monSel.onchange(); for (let i = 0; i < 30; i++) await raf(); }
  await V.effects(false); await V.effects(true);
  for (let i = 0; i < 60 && !(M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule); i++) await raf();
  const S = M.effectRuntimeInstance().schedule;
  let log = [];
  const rq0 = S.host.requestEffect;
  S.host.requestEffect = function(owner, parent, rec){
    const e = S.entries.find(x => x.owner === owner);
    log.push((e && e.def.record ? e.def.record.key : '?') + '/' + (e ? e.when : '?') + '@' + (S.clip ? Math.round(S.clip.frame) : '-'));
    return rq0.apply(this, arguments);
  };
  const entry = V.MON.monsters.find(e => e.id === MON);
  for (const [L, c] of CLIPS){
    if (V.state.list !== L){ listSel.value = L; await listSel.onchange(); }
    log = [];
    clipSel.value = c; await clipSel.onchange();
    const first = [];
    const dur = Math.round(entry.lists.find(l => l.id === L).clips.find(x => x.clip === c).dur * 60);
    for (let k = 0; k < 2 * dur + 4; k++){ await raf(); if (k < 3) first.push(Math.round(V.pose.action.time * 60)); }
    out.push([false, MON + ' L' + L + ' ' + c, 'first steps at ' + first.join(',') + ' | ' + log.filter(x => !/ragePuff/.test(x)).join(' ')]);
  }
  S.host.requestEffect = rq0;
  return out;
}
