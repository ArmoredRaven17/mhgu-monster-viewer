// Seltas on the Queen with the row OFF: combined clips mount him? his root's world position and a pose signature over her clip
async function duo2(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em069_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await until(() => V.state.id === MON && V.mounted.main);
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_start') || opts.find(x => x.value === clip + '_loop');
    if (!o) return null;
    clipSel.value = o.value; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
    return o.value;
  };
  const row = () => document.querySelector('.field[data-row="partner:em076_00"] select');
  const rootOf = () => { const g = V.mounted.em076_00; let b = null; if (g) g.traverse(n => { if (!b && n.isBone) b = n; }); return b; };
  const wp = () => { const b = rootOf(); if (!b) return null; b.updateWorldMatrix(true, false); const e = b.matrixWorld.elements; return [e[12], e[13], e[14]].map(x => Math.round(x)); };
  const sig = () => { const g = V.mounted.em076_00; if (!g) return null; let s = 0; g.traverse(n => { if (n.isBone) s += n.quaternion.x * 3 + n.quaternion.y * 5 + n.quaternion.z * 7; }); return +s.toFixed(3); };
  const res = { lists: V.MON.monsters.find(m => m.id === MON).lists.map(l => l.id + ':' + l.clips.length) };
  for (const [l, c] of [['0', 'Motion[1]'], ['4', 'Motion[6]'], ['4', 'Motion[28]'], ['4', 'Motion[9]'], ['4', 'Motion[16]'], ['4', 'S. Motion[76]-[79]'], ['0', 'Motion[16]'], ['4', 'Motion[68]']]){
    const v = await play(l, c);
    if (!v){ res[l + '|' + c] = 'no clip'; continue; }
    await frames(4);
    const s = [];
    for (let i = 0; i < 4; i++){ s.push({ t: +V.pose.action.time.toFixed(2), root: wp(), sig: sig() }); await frames(20); }
    const r = row();
    res[l + '|' + v] = { mounted: !!V.mounted.em076_00, row: r ? r.value + (r.disabled ? ' locked' : '') : 'no row', s };
  }
  out.push([false, 'duo2', JSON.stringify(res)]);
  return out;
}
export const pageCheck = duo2;
