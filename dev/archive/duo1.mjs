// Seltas on the Queen: does his pose change over her clip? his driver's action state, and a few of his bones over time
async function duo1(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  const MON = 'em069_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await until(() => V.state.id === MON && V.mounted.main);
  await V.partner(true);
  await until(() => V.mounted.em076_00, 600);
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_start') || opts.find(x => x.value === clip + '_loop');
    if (!o) return null;
    clipSel.value = o.value; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
    return o.value;
  };
  const bones = () => {
    const g = V.mounted.em076_00; if (!g) return null;
    const r = [];
    g.traverse(n => { if (n.isBone && r.length < 400) r.push(n); });
    return r;
  };
  const sig = () => { const b = bones(); if (!b) return 'none'; let s = 0; for (const n of b) s += n.quaternion.x * 3 + n.quaternion.y * 5 + n.quaternion.z * 7 + n.position.x * 0.01; return +s.toFixed(5); };
  const res = {};
  for (const [l, c] of [['0', 'Motion[1]'], ['4', 'Motion[6]'], ['4', 'Motion[35]'], ['4', 'Motion[76]'], ['4', 'Motion[46]']]){
    const v = await play(l, c);
    if (!v){ res[l + '|' + c] = 'no clip'; continue; }
    const samples = [];
    for (let i = 0; i < 5; i++){ await frames(15); samples.push(sig()); }
    let p = null; try { p = V.partner(); } catch (err) { p = String(err); }
    res[l + '|' + v] = { her: +(V.pose.action.time).toFixed(2), samples, partner: JSON.stringify(p).slice(0, 600), mounted: !!V.mounted.em076_00 };
  }
  out.push([false, 'duo1', JSON.stringify(res)]);
  return out;
}
export const pageCheck = duo1;
