// bbdust.mjs (run-check-long.mjs; BB_MON, BB_CLIP): the shell tally on a clip, and which 'shell' entries the runtime holds
async function bbDust(mon, clip){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  const [l, c] = clip.split('|');
  if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); }
  const o = [...clipSel.options].find(x => x.value === c) || [...clipSel.options].find(x => x.value.startsWith(c));
  clipSel.value = o.value; await clipSel.onchange();
  await frames(120);
  const S = M.effectRuntimeInstance().schedule;
  out.push([false, 'TALLY', JSON.stringify(S.shellTally || null)]);
  out.push([false, 'SHELL ENTRIES', JSON.stringify(S.entries.filter(e => e.when === 'shell').map(e => e.def.record && (e.def.record.pel + '|' + e.def.record.key)))]);
  out.push([false, 'HAS SHELLS', String(!!S.shells) + ' ' + (S.shells && S.shells.monId)]);
  out.push([false, 'FLOOR', JSON.stringify(V.background().floor) + ' unit ' + JSON.stringify(V.unitGamePos())]);
  return out;
}
export const pageCheck = bbDust;
export const args = [[process.env.BB_MON || 'em007_04', process.env.BB_CLIP || '0|Motion[33]']];
