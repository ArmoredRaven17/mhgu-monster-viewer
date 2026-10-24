// probe: Chameleos's cloak phase machine frame by frame (visible, manual clips, swap state, schedule frame)
async function pageCheckCloakProbe(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (await test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel');
  if (![...monSel.options].some(o => o.value === 'em025_00')) monSel.add(new Option('em025_00', 'em025_00'));
  monSel.value = 'em025_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule);
  const S = M.effectRuntimeInstance().schedule, sel = document.getElementById('monClassCtl');
  const snap = tag => { const r = V.mounted.main; out.push([true, tag + ' f' + S.frame + ' vis ' + r.visible + ' swap ' + r.userData.matSwapState + ' mc ' + JSON.stringify(Object.fromEntries(Object.entries(r.userData.manualClips || {}).map(([k, v]) => [k, v[0]]))), '']); };
  sel.value = '1'; sel.onchange({ target: sel });
  for (const n of [2, 20, 40]){ await frames(n); snap('on +' + n); }
  sel.value = '0'; sel.onchange({ target: sel });
  for (const n of [2, 10, 30, 60, 60]){ await frames(n); snap('off +' + n); }
  return out;
}
export const pageCheck = pageCheckCloakProbe;
