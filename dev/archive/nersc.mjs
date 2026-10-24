// Nerscylla as shipped: part 13 (the jaws) per clip, the driver's row, and the rage parts 1 / 12 calm and enraged
async function nersc(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em070_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
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
    await frames(8);
    return o.value;
  };
  const res = {};
  for (const [l, c] of [['0', 'Motion[1]'], ['2', 'Motion[5]'], ['2', 'Motion[6]'], ['2', 'Motion[7]'], ['2', 'Motion[10]'], ['2', 'Motion[25]'],
                        ['2', 'Motion[26]'], ['2', 'Motion[84]'], ['2', 'Motion[85]'], ['4', 'Motion[33]'], ['4', 'Motion[34]'],
                        ['Special', 'S. L2 Motion 7'], ['Special', 'S. L2 Motion 10'], ['Special', 'S. L2 Motion 1'], ['0', 'Motion[1]']]){
    const v = await play(l, c);
    res[l + '|' + c] = v ? (d().get(13) ? 'JAWS' : '-') : 'no clip';
  }
  out.push([false, 'part 13 per clip', JSON.stringify(res)]);
  const sel = document.getElementById('monState');
  const rageParts = () => [1, 12].map(p => d().get(p));
  const calm = rageParts();
  if (sel && [...sel.options].some(o => o.value === 'rage')){ sel.value = 'rage'; await sel.onchange({ target: sel }); await frames(5); }
  out.push([false, 'rage parts 1 / 12', JSON.stringify({ calm, enraged: rageParts(), rage: V.state.rage })]);
  return out;
}
export const pageCheck = nersc;
