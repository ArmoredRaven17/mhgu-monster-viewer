async function dbg(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em023_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === MON);
  const S = M.effectRuntimeInstance().schedule;
  const mask = () => S.clip && S.clip.mask != null ? '0x' + (S.clip.mask >>> 0).toString(16) : null;
  listSel.value = '2'; await listSel.onchange();
  const res = [];
  for (let i = 0; i < 6; i++){
    clipSel.value = 'Motion[8]_start'; await clipSel.onchange(); await frames(6);
    const ri = V.rockInput();
    res.push({ v: ri && ri.variant, mask: mask(), clip: V.pose.action && V.pose.action.getClip().name });
  }
  check(false, 'debug', res);
  return out;
}
export const pageCheck = dbg;
