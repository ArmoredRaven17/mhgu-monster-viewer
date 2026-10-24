// Seregios: his height above the viewer's floor on the flight clips, against the clip origin (y = 0) as the floor
async function floorProbe(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em077_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  const rt = () => M.effectRuntimeInstance();
  await until(() => rt() && rt().monsterId === MON && rt().schedule);
  const S = rt().schedule;
  for (const [list, clip, at] of [['1', 'Motion[1]', [0, 100, 200]], ['1', 'Motion[5]', [46]], ['1', 'Motion[4]', [2]], ['0', 'Motion[24]', [2]], ['0', 'Motion[1]', [0]]]){
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value === clip + '_loop') || [...clipSel.options].find(x => x.value === clip + '_start');
    if (!o){ out.push([false, 'no clip ' + list + '|' + clip, '']); continue; }
    clipSel.value = o.value; await clipSel.onchange(); await frames(3);
    for (const f of at){
      const act = V.pose.action; act.paused = true; act.time = f / 60; V.pose.mixer.update(0); await frames(2);
      const ri = S.rockInput ? S.rockInput() : null, P = S.parent && S.parent.position;
      const origin = V.world.position.y / 0.01;
      out.push([false, list + '|' + o.value + ' f' + f, JSON.stringify({ unitY: P && +P[1].toFixed(1), gridFloor: ri && +ri.floorY.toFixed(1), origin: +origin.toFixed(1),
        aboveGrid: P && ri ? +(P[1] - ri.floorY).toFixed(1) : null, shellOwnerY: (() => { const x = S.shellExtra && S.shellExtra().ownerPos; return x ? +x.y.toFixed(1) : null; })(), shellOwnerAboveGrid: (() => { const x = S.shellExtra && S.shellExtra().ownerPos; return x && ri ? +(x.y - ri.floorY).toFixed(1) : null; })(), aboveOrigin: P ? +(P[1] - origin).toFixed(1) : null })]);
      act.paused = false;
    }
  }
  return out;
}
export const pageCheck = floorProbe;
