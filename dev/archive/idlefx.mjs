// What runs on a monster's L0 M1 idle: every live request's record and its trigger, over a few plays
async function idleFx(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  for (const MON of ['em007_00', 'em007_04']){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === MON && M.effectRuntimeInstance().schedule);
    const S = M.effectRuntimeInstance().schedule;
    const live = () => S.entries.flatMap(e => e.requests.filter(q => !q.stopped).map(() => (e.def.record ? e.def.record.pel + ' ' + e.def.record.key : e.def.efl) + ' (' + e.when + ')'));
    const plays = [];
    for (let i = 0; i < 4; i++){
      listSel.value = '0'; await listSel.onchange();
      const o = [...clipSel.options].filter(x => /^Motion\[1\](_loop)?(#.*)?$/.test(x.value))[i % 4] || [...clipSel.options].find(x => /^Motion\[1\](_loop)?$/.test(x.value));
      clipSel.value = o.value; await clipSel.onchange();
      await frames(90);
      plays.push({ clip: V.state.list + '|' + V.state.clip + (V.state.clipVariant ? '#' + V.state.clipVariant : ''), opening: i === 0 ? null : undefined, live: live(), mask: S.clip && S.clip.mask != null ? '0x' + (S.clip.mask >>> 0).toString(16) : null });
      clipSel.value = ''; await clipSel.onchange(); await frames(5);
    }
    out.push([false, MON, JSON.stringify(plays)]);
  }
  return out;
}
export const pageCheck = idleFx;
