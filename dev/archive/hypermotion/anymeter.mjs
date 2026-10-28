// hypermotion/anymeter.mjs (hyper-motion lane, 2026-10-28): the "any action" ModifyData rule on the page (Raven, 2026-10-28: "If a part
// is hyper and impacts a clip's speed, use the hyper speed"; dev/hyper-states.md 6.2). Every clip anyaction.py lists as CHANGED (its
// factor under the held pair differs from the old per-action rule's) that is one play-once clip on its list is played from frame 0 to
// its end with Hyper Off and with the pair, the clock fixed at 1/60 s a render frame (motionmeter.mjs's method). PASS: the played
// length is within 3 frames of anyaction.py's prediction (factor x the hook's rates) and window.__hyperMotion.factor is the new one.
//   python dev/archive/hypermotion/anyaction.py
//   node dev/archive/hypermotion/rcd.mjs dev/archive/hypermotion/anymeter.mjs --url http://localhost:<port> > anymeter.out
// ANYMETER_IDS (comma list) limits the monsters; ANYMETER_RANK 'G' / 'below G' the rank.
async function meter(rows){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip'), sel = $('monHyper');
  const setHyper = async v => { sel.value = v; sel.dispatchEvent(new Event('change')); await frames(2); };
  let mon = null, rank = null;
  for (const r of rows){
    const label = `${r.mon} ${r.rank} ${r.pair} ${r.clip}`;
    const want = r.rank === 'G' ? 5 : 3;
    if (r.mon !== mon){
      await setHyper('');
      if (![...monSel.options].some(o => o.value === r.mon)) monSel.add(new Option(r.mon, r.mon));
      monSel.value = r.mon; await monSel.onchange(); await frames(10); mon = r.mon; rank = null;
    }
    if (rank !== want){ await setHyper(''); V.state.questRank = want; rank = want; await frames(4); }
    await until(() => [...sel.options].some(o => o.value === r.pair), 300);
    if (![...sel.options].some(o => o.value === r.pair)){ out.push([false, label, 'pair not offered: ' + [...sel.options].map(o => o.value)]); continue; }
    const [L, Mn] = r.clip.split(' ').map(s => +s.slice(1));
    if (listSel.value !== String(L)){ listSel.value = String(L); await listSel.onchange(); await frames(2); }
    const clip = 'Motion[' + Mn + ']';
    if (![...clipSel.options].some(o => o.value === clip)){ out.push([true, label, 'no play-once clip on the list: skipped']); continue; }
    const res = {};
    for (const hv of ['', r.pair]){
      await setHyper(hv);
      V.state.loop = false;
      clipSel.value = clip; await clipSel.onchange();
      await until(() => V.pose.action && V.pose.action.getClip().name.startsWith(clip), 300);
      const act = V.pose.action, dur = act.getClip().duration;
      let k = 0, hm = null;
      act.time = 0;
      while (k < 3000){
        await frames(1); k++;
        if (window.__hyperMotion) hm = window.__hyperMotion;
        if (act.time >= dur - 1e-3 || (act.paused && k > 2)) break;
      }
      res[hv ? 'on' : 'off'] = { frames: k, factor: hm ? hm.factor : 1, how: hm ? hm.how : null, factors: hm ? hm.factors : null };
    }
    const ok = Math.abs(res.on.frames - r.after) <= 3 && res.on.factor === r.new && Math.abs(res.off.frames - r.len) <= 3;
    out.push([ok, label, JSON.stringify({ off: res.off.frames, on: res.on.frames, predicted: r.after, oldRule: r.before, factor: res.on.factor,
                                          want: r.new, how: res.on.how, factors: res.on.factors, hook: r.hook })]);
  }
  await setHyper('');
  return out;
}
export const pageCheck = meter;
import fs from 'node:fs';
const env = typeof process !== 'undefined' ? process.env : {};
const ids = env.ANYMETER_IDS ? env.ANYMETER_IDS.split(',') : null;
const all = JSON.parse(fs.readFileSync(new URL('./anyaction.json', import.meta.url), 'utf8')).rows
  .filter(r => r.len && JSON.stringify(r.old) !== JSON.stringify([r.new]) && (!ids || ids.includes(r.mon)) && (!env.ANYMETER_RANK || r.rank === env.ANYMETER_RANK));
const byMon = {};
for (const r of all) (byMon[r.mon] = byMon[r.mon] || []).push(r);
export const args = Object.values(byMon).map(rs => [rs.sort((a, b) => a.rank.localeCompare(b.rank))]);
