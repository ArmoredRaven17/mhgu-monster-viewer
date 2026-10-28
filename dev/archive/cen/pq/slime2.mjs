// pq/slime2.mjs (2026-10-25): Raging Brachydios's slime machine -- Red Slime on, then hits on one part: (a) a hit on Red (erupts),
// (b) a hit inside the Yellow window (must not erupt), (c) hits spaced past the re-arm (erupt again) x3; the slot state, the stage
// machine's clip on that part's material, the warning record's starts and the eruptions, sampled every 5 frames.
async function slime2(){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const MON = 'em063_05', monSel = $('monSel');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  V.state.loop = true;
  V.effectMeter(true, { every: 5 });
  const rage = $('monRage'); rage.checked = true; rage.dispatchEvent(new Event('change'));
  await frames(40);
  const log = [], K = 1;
  const stage = () => { const r = V.mounted.main && V.mounted.main.userData.romStage; return r ? r.list.map(s => s.clip) : null; };
  const sample = tag => { const st = window.__slime063.state(); log.push([tag, st && st[K].col, st && Math.round(st[K].cd), st && st[K].fuse, (stage() || [])[K]]); };
  const run = async (n, tag) => { for (let i = 0; i < n; i += 5){ await frames(5); sample(tag + '+' + (i + 5)); } };
  sample('before');
  window.__slime063.hit(K); await run(60, 'hit1');           // fuse 30 -> erupt -> Yellow
  window.__slime063.hit(K); await run(20, 'hitY');           // inside the Yellow window: no eruption, +180
  await run(300, 'wait');                                     // the re-arm (60 + 180 + transitions)
  for (let r = 2; r <= 4; r++){ window.__slime063.hit(K); await run(60, 'hit' + r); await run(120, 'rearm' + r); }
  const rep = V.effectMeterReport(); V.effectMeter(false);
  const recs = rep.recs.filter(x => /\|20[0-3]\|/.test(x.key)).map(x => x.key + ' st' + x.starts + ' ' + x.verdict);
  return [[false, 'SLIME2', JSON.stringify({ recs, log })]];
}
export const pageCheck = slime2;
export const args = [[]];
