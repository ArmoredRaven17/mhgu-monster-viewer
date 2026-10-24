// debug: which Soulseer class record (u 310 / 320 / 321 / 330 UNIQUE) runs into an unrecorded path
async function dbg(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em082_04';
  const monSel = document.getElementById('monSel');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  const listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === MON);
  const rt = M.effectRuntimeInstance();
  const res = [];
  const sel = async (list, v, n) => { if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === v) || [...clipSel.options].find(x => x.value === v + '_loop'); if (o) v = o.value; if (!o){ res.push('no ' + v); return; }
    clipSel.value = v; await clipSel.onchange(); await frames(n); res.push(v + ': ' + (rt.failed || 'ok')); };
  const rageBox = document.getElementById('monRage');
  for (const rg of [false, true]){
    if (rageBox){ rageBox.checked = rg; await rageBox.onchange({ target: rageBox }); await frames(3); }
    res.push('rage ' + rg);
    await sel('9', 'Motion[5]_loop', 6); await sel('0', 'Motion[1]', 3); await sel('9', 'Motion[6]#B', 6); await sel('9', 'Motion[6]#D', 6);
    await sel('0', 'Motion[1]', 30); await sel('9', 'Motion[6]#B', 200); await sel('0', 'Motion[1]', 30); await sel('9', 'Motion[6]#D', 200); await sel('0', 'Motion[1]', 60);
  }
  check(false, 'debug', res);
  return out;
}
export const pageCheck = dbg;
