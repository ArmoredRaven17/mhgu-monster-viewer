export const args = [];
export async function pageCheck(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em021_00';
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => body() && body().monsterId === MON && body().schedule);
  listSel.value = '2'; await listSel.onchange();
  const o = [...clipSel.options].find(x => x.value.startsWith('Motion[16]'));
  clipSel.value = o.value; await clipSel.onchange();
  const log = [];
  for (let i = 0; i < 300; i++){ await frames(1); if (i % 30 === 0){ const x = V.shellExtra(); const S = body().schedule; log.push([i, x.gas021, S.clip && S.clip.key, S.clip && Math.round(S.clip.frame), S.shellTally && S.shellTally.refused.slice(-2), body().failed ? String(body().failed) : null]); } }
  out.push([false, 'gas', JSON.stringify({ opt: o.value, log })]);
  return out;
}
