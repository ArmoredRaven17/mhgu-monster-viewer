// Zamtrios as shipped: groups per form and clip -- 9 / 109 (hind legs + lower body), 13 / 15 (front legs), 16 (fat body ?),
// the ice 11-13 groups via the Ice rows -- the inflate's timeline, and the Grid Floor
async function zam(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em067_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await until(() => V.state.id === MON && V.mounted.main);
  const d = () => V.mounted.main.userData.partsDrawn;
  const g = ps => Object.fromEntries(ps.map(p => [p, d().get(p)]));
  const show = () => g([0, 8, 9, 10, 109, 13, 15, 25, 3, 26]);
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
  const lv = document.getElementById('monLevel');
  const setForm = async i => { lv.value = String(i); lv.onchange({ target: lv }); await frames(6); };
  const res = { forms: [...lv.options].map(o => o.textContent) };
  for (const [i, name] of [[0, 'Normal'], [1, 'Ice Armor'], [2, 'Blob']]){
    await setForm(i);
    res[name + ' (its own view ' + V.state.list + '|' + V.state.clip + ')'] = show();
  }
  await setForm(0);
  res['Normal form, blob clip L4 M5'] = (await play('4', 'Motion[5]')) && show();
  await setForm(2);
  res['Blob form, normal clip L0 M1'] = (await play('0', 'Motion[1]')) && show();
  await setForm(1);
  await play('4', 'Motion[2]');
  const act = V.pose.action, tl = [];
  for (const f of [100, 125, 140]){ act.paused = true; act.time = f / 60; await frames(4); tl.push('f' + f + ' ' + JSON.stringify(g([0, 9, 10, 11, 12, 13, 16, 3, 26]))); }
  act.paused = false;
  res['inflate L4 M2 from Ice Armor'] = tl;
  await setForm(0); await play('0', 'Motion[1]'); await frames(5);
  const S = window.__view; const fy = (await import('/render/monster.js'));
  res.gridFloor = { worldY: +V.world.position.y.toFixed(3) };
  out.push([false, 'zamtrios', JSON.stringify(res)]);
  return out;
}
export const pageCheck = zam;
