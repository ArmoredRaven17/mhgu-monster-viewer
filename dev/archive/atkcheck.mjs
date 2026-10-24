// atkcheck.mjs: the Attack Hitboxes overlay on a clip -- per sampled frame, the armed records (id, set, window, target kind) and, with the
// Solid hunter at the given distance, which touch him
async function atkCheck(mon, list, clip, dist){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === mon, 900);
  window.__hunter.set(dist, 0, 1);
  const sel = document.getElementById('monAtkBox');
  out.push([!document.getElementById('monAtkBoxRow').hidden, mon + ': the Attack Hitboxes row is shown', '']);
  sel.value = 'all'; sel.dispatchEvent(new Event('change'));
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value === clip + '_start') || [...clipSel.options].find(x => x.value === clip + '_loop');
  clipSel.value = o.value; await clipSel.onchange();
  V.state.loop = false;
  const seen = [];
  let lastKey = null;
  for (let i = 0; i < 260; i += 2){
    await frames(2);
    const st = V.attackBoxes && V.attackBoxes();
    if (!st) continue;
    const on = st.rows.filter(r => r.on).map(r => r.id + (r.touch ? '*' : '') + ':' + r.kind[0]);
    const key = on.join(',');
    if (key !== lastKey){ seen.push(Math.round(st.frame) + ' [' + key + ']'); lastKey = key; }
  }
  const st = V.attackBoxes();
  out.push([true, mon + ' ' + list + '|' + clip + ' (hunter ' + dist + '): armed over frames', JSON.stringify({ action: st && st.action, records: st && st.rows.map(r => ({ id: r.id, set: r.set, win: r.win, kind: r.kind, shapes: r.shapes, action: r.action })), timeline: seen })]);
  sel.value = 'off'; sel.dispatchEvent(new Event('change'));
  window.__hunter.set(-1, 0, 0);
  return out;
}
export const pageCheck = atkCheck;
export const args = [['em001_00', '4', 'Motion[6]', 500], ['em032_00', '0', 'Motion[34]', 0]];
