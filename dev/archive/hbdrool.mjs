// Hellblade's tired idle: each c 1104 with the schedule step, the clip frame, and who called fire
async function hbDrool(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  for (const MON of ['em080_04', 'em080_00']){
    const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === MON && M.effectRuntimeInstance().schedule);
    const S = M.effectRuntimeInstance().schedule;
    const log = [];
    const f0 = S.fire.bind(S);
    S.fire = (pel, key) => { if (key === 1104) log.push({ step: S.frame, clipF: V.pose.action ? Math.round(V.pose.action.time * 60) : null, from: (new Error().stack.split('\n')[2] || '').trim().slice(0, 90) }); return f0(pel, key); };
    listSel.value = '0'; await listSel.onchange();
    const o = [...clipSel.options].find(x => x.value === 'Motion[8]' || x.value === 'Motion[8]_loop');
    clipSel.value = o.value; await clipSel.onchange();
    await frames(120);
    out.push([false, MON + ' ' + o.value + ' (clip ' + (V.pose.action ? Math.round(V.pose.action.getClip().duration * 60) : '?') + ' f)', JSON.stringify({ tiredState: V.state.tired, level: V.state.level, log })]);
    S.fire = f0;
  }
  return out;
}
export const pageCheck = hbDrool;
