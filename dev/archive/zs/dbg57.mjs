export const args = [];
export async function pageCheck(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'dbg: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  if (![...monSel.options].some(o => o.value === 'em057_04')) monSel.add(new Option('em057_04', 'em057_04'));
  monSel.value = 'em057_04'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => body() && body().monsterId === 'em057_04' && body().schedule);
  if (V.state.list !== '9'){ listSel.value = '9'; await listSel.onchange(); }
  check(false, 'lists', { lists: [...listSel.options].map(x => x.value), list: V.state.list, clips: [...clipSel.options].map(x => x.value).slice(0, 8) });
  const o = [...clipSel.options].find(x => x.value === 'Motion[5]');
  if (!o) return out;
  clipSel.value = o.value; await clipSel.onchange();
  await frames(20);
  const ex = V.shellExtra ? V.shellExtra() : null;
  check(false, 'extra', { action: ex && ex.action, charged: ex && ex.charged, clip: o.value, list: V.state.list });
  const st = body().schedule.shells && body().schedule.shells.state;
  check(false, 'state', { motion: st && st.motion, action: st && st.action && st.action.variant, hist: st && st.hist });
  return out;
}
