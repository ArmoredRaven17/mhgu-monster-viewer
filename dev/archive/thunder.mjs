// Thunderlord: the Charge State options, and the death clip's body before / after f230 (set 1: part 6 on, part 9 off)
async function thunder(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const MON = 'em057_04';
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await until(() => V.state.id === MON && V.mounted.main);
  await frames(5);
  const opts = [...document.getElementById('monLevel').options].map(o => o.textContent);
  listSel.value = '3'; await listSel.onchange();
  const o = [...clipSel.options].find(x => x.value === 'Motion[21]');
  clipSel.value = o.value; await clipSel.onchange();
  const body = () => { const d = V.mounted.main.userData.partsDrawn; return { p6: d.get(6), p9: d.get(9), p7: d.get(7), p17: d.get(17) }; };
  const at = [];
  for (const f of [100, 228, 232, 380]){
    const act = V.pose.action; act.paused = true; act.time = f / 60; await frames(4);
    at.push('f' + f + ' ' + JSON.stringify(body()));
  }
  out.push([false, 'Thunderlord', JSON.stringify({ chargeOptions: opts, death: at })]);
  return out;
}
export const pageCheck = thunder;
