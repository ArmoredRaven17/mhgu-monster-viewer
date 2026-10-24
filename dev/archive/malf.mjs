// Malfestio / Nightcloak as shipped: part 31 (Hypno Effect) and 9 / 105 (the dive overlay) per clip; the eye set 3 window on L2 M23
async function malf(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const set3 = V.MON.monsters.find(e => e.id === 'em079_00').groups[3];
  for (const MON of ['em079_00', 'em079_04']){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await until(() => V.state.id === MON && V.mounted.main);
    const d = () => V.mounted.main.userData.partsDrawn;
    const play = async (list, clip) => {
      if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
      const opts = [...clipSel.options];
      const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_start') || opts.find(x => x.value === clip + '_loop');
      if (!o) return null;
      clipSel.value = o.value; await clipSel.onchange();
      await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
      await frames(6);
      return o.value;
    };
    const res = {};
    for (const [l, c] of [['0', 'Motion[1]'], ['2', 'Motion[16]'], ['2', 'Motion[17]'], ['2', 'Motion[18]'], ['2', 'Motion[19]'], ['2', 'Motion[20]'],
                          ['2', 'Motion[21]'], ['2', 'Motion[24]'], ['2', 'Motion[25]'], ['2', 'Motion[5]'], ['0', 'Motion[1]']]){
      const v = await play(l, c);
      res[l + '|' + c] = v ? { hypno31: d().get(31), dive9: d().get(9), dive105: d().get(105) } : 'no clip';
    }
    // the eye window on L2 M23: frames 2 / 10 / 70
    await play('2', 'Motion[23]');
    const act = V.pose.action, eye = [];
    for (const f of [2, 10, 70]){ act.paused = true; act.time = f / 60; await frames(4); eye.push('f' + f + ' ' + JSON.stringify(set3.map(([p]) => [p, d().get(p)]))); }
    act.paused = false;
    out.push([false, MON, JSON.stringify({ res, set3, eyeOnM23: eye })]);
  }
  return out;
}
export const pageCheck = malf;
