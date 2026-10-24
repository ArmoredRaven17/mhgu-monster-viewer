// the unit's height above the floor the shells are handed, per frame, on the clips whose ground shells the census lost
export const args = [['em079_00', [['1', 'Motion[14]'], ['1', 'Motion[27]'], ['1', 'Motion[2]_loop'], ['1', 'Motion[22]'], ['2', 'Motion[36]'], ['2', 'Motion[35]'], ['2', 'Motion[43]_start'], ['2', 'Motion[12]']]]];
export async function pageCheck(MON, CLIPS){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  V.pose.clock.getDelta = () => 1 / 60;
  if (V.state.id !== MON){ if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON)); monSel.value = MON; await monSel.onchange(); for (let i = 0; i < 30; i++) await raf(); }
  await V.effects(false); await V.effects(true);
  for (let i = 0; i < 60 && !(M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule); i++) await raf();
  for (const [L, c] of CLIPS){
    if (V.state.list !== L){ listSel.value = L; await listSel.onchange(); }
    clipSel.value = c; await clipSel.onchange();
    const rows = [];
    for (let k = 0; k < 50; k++){
      await raf();
      const fr = Math.round(V.pose.action.time * 60);
      if (k < 6 || (fr >= 28 && fr <= 32) || (fr >= 40 && fr <= 44)){
        const r = V.rockInput(), x = V.shellExtra();
        rows.push(fr + ':' + (r ? Math.round(x.ownerPos.y - r.floorY) : 'null'));
      }
    }
    out.push([false, MON + ' L' + L + ' ' + c, rows.join(' ') + ' scale ' + V.world.scale.y]);
  }
  return out;
}
