// pq/u605.mjs (2026-10-25): Boltreaver L9 M22 -- per frame, u 604 / u 605's schedule entries: requests, their units, the walker frame
async function u605(){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const MON = 'em081_04', monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  const rt = M.effectRuntimeInstance(), S = rt.schedule;
  listSel.value = '9'; await listSel.onchange();
  clipSel.value = 'Motion[22]'; await clipSel.onchange();
  const log = [];
  const ent = k => S.entries.filter(e => e.def.record && e.def.record.key === k && e.when === 'clip');
  for (let f = 0; f < 70; f++){
    await frames(1);
    const row = { f, wf: S.walker && S.walker.last, motion: S.walker && S.walker.motion, mask: S.clip && S.clip.mask != null ? (S.clip.mask >>> 0).toString(16) : null, failed: !!rt.failed };
    for (const k of [604, 605]) row[k] = ent(k).map(e => e.requests.map(q => { let u = -1; try { u = q.effects().length; } catch (x) { u = 'err ' + x.message; } return (q.stopped ? 'S' : '') + u; }).join(','));
    log.push(row);
  }
  const W = S.walker && S.walker.data;
  return [[false, 'U605', JSON.stringify({ bits: W && W.bits, log: log.filter((r, i) => i % 3 === 0 || (r[605] && r[605].length)), err: rt.failed ? String(rt.error || rt.failed) : null })]];
}
export const pageCheck = u605;
export const args = [[]];
