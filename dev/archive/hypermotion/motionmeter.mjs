// hypermotion/motionmeter.mjs (hyper-motion lane, 2026-10-27): the Hyper motion side on the page, per monster (METER_IDS, comma list;
// METER_RANK 3 = below G, the plain .mdd / 5 = G, the _g; METER_MAX motions per monster, default 4). The pair with the most hooked
// motions in docs/hyper-motion.json is held; each of its hooked motions that is a play-once clip on its list ('Motion[N]', not split)
// is played from frame 0 to its end with Hyper Off and with the pair, the clock fixed at 1/60 s a render frame:
//   * PLAYED LENGTH: render frames to the end, off vs on, and the on count the table predicts (the frame step = factor x the hook's
//     rate at that frame, from the frame after the step that crossed it -- the viewer applies the timeScale one render frame late);
//   * BURSTS: the draw meter's rows for u 1310 + ID: starts and lit samples (draws), separately; expected = the table's bursts.
//   METER_IDS=em001_00 METER_RANK=3 sh dev/archive/hypermotion/run.sh motionmeter.mjs out.txt
async function meter(ids, rank, maxMot, extra, pairWant){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const T = await (await fetch('/hyper-motion.json')).json();
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip'), sel = $('monHyper');
  const setHyper = async v => { sel.value = v; sel.dispatchEvent(new Event('change')); await frames(2); };
  for (const MON of ids){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    V.state.questRank = rank;
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
    const F = T[MON] && T[MON][rank > 4 ? 'g' : 'normal'];
    if (!F){ out.push([false, 'HYPERMOTION ' + MON, 'no table for this rank']); continue; }
    const pairs = Object.entries(F.hooks).sort((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length);
    if (!pairs.length){ out.push([true, 'HYPERMOTION ' + MON, 'no hooked motion']); continue; }
    const [pair, mots] = (pairWant && pairs.find(p => p[0] === pairWant)) || pairs[0];
    await until(() => [...sel.options].some(o => o.value === pair), 300);
    if (![...sel.options].some(o => o.value === pair)){ out.push([false, 'HYPERMOTION ' + MON, 'pair ' + pair + ' not offered: ' + [...sel.options].map(o => o.value)]); continue; }
    let n = 0;
    for (const [mk, hk] of Object.entries(mots)){
      if (n >= maxMot) break;
      const [L, Mn] = mk.split(' ').map(s => +s.slice(1));
      if (![...listSel.options].some(o => o.value === String(L))) { out.push([true, `${MON} ${pair} ${mk}`, 'list not shown']); continue; }
      if (listSel.value !== String(L)){ listSel.value = String(L); await listSel.onchange(); await frames(2); }
      const clip = 'Motion[' + Mn + ']';
      if (![...clipSel.options].some(o => o.value === clip)){ out.push([true, `${MON} ${pair} ${mk}`, 'no play-once clip (split or absent): skipped']); continue; }
      n++;
      const res = {};
      for (const hv of ['', pair]){
        await setHyper(hv);
        V.state.loop = false;
        if (hv) V.effectMeter(true, { every: 1 });
        clipSel.value = clip; await clipSel.onchange();
        await until(() => V.pose.action && V.pose.action.getClip().name.startsWith(clip), 300);
        const act = V.pose.action, dur = act.getClip().duration;
        let k = 0, maxRate = 1, factor = 1, how = null;
        act.time = 0;
        while (k < 3000){
          await frames(1); k++;
          const hm = window.__hyperMotion;
          if (hm){ maxRate = Math.max(maxRate, hm.rate); factor = hm.factor; how = hm.how; }
          if (act.time >= dur - 1e-3 || (act.paused && k > 2)) break;
        }
        res[hv ? 'on' : 'off'] = { frames: k, len: Math.round(dur * 60), factor, how, ts: act.timeScale };
        if (hv){
          const rep = V.effectMeterReport(); V.effectMeter(false);
          const ids = [...new Set(hk.bursts.map(b => b[1]))];
          res.bursts = ids.map(id => {
            const rows = rep.recs.filter(r => r.key.includes('|' + (1310 + id) + '|'));
            return { u: 1310 + id, expected: hk.bursts.filter(b => b[1] === id).length, starts: rows.reduce((s, r) => s + (r.starts | 0), 0),
                     lit: rows.reduce((s, r) => s + (r.litSamples | 0), 0), verdict: rows.map(r => r.verdict).join('/') || 'none' };
          });
        }
      }
      // the predicted on-length: the clip's frame stepped factor x rate(frame) (the rate seen from the step after its crossing)
      const len = res.off.len;
      let t = 0, steps = 0, r = 1;
      while (t < len && steps < 5000){ let hr = 1; for (const [fr, x] of hk.rates) if (t >= fr) hr = x; t += r; steps++; r = res.on.factor * hr; }
      const okLen = Math.abs(res.on.frames - steps) <= 3;
      const okB = (res.bursts || []).every(b => b.starts >= b.expected && b.starts > 0);
      out.push([okLen && okB, `${MON} ${pair} ${mk}`, JSON.stringify({ off: res.off.frames, on: res.on.frames, predicted: steps, factor: res.on.factor, how: res.on.how, rates: hk.rates, bursts: res.bursts })]);
    }
    // METER_EXTRA "pair@list|Motion[N];..": clips with no hook, for the ModifyData factor alone
    for (const ex of (extra || '').split(';').filter(Boolean)){
      const [p2, mk2] = ex.split('@'), [L2, clip2] = mk2.split('|');
      if (listSel.value !== L2){ listSel.value = L2; await listSel.onchange(); await frames(2); }
      if (![...clipSel.options].some(o => o.value === clip2)){ out.push([true, `${MON} ${ex}`, 'no play-once clip: skipped']); continue; }
      const res = {};
      for (const hv of ['', p2]){
        await setHyper(hv); V.state.loop = false;
        clipSel.value = clip2; await clipSel.onchange();
        await until(() => V.pose.action && V.pose.action.getClip().name.startsWith(clip2), 300);
        const act = V.pose.action, dur = act.getClip().duration; let k = 0, hmx = null; act.time = 0;
        while (k < 3000){ await frames(1); k++; if (window.__hyperMotion) hmx = window.__hyperMotion; if (act.time >= dur - 1e-3 || (act.paused && k > 2)) break; }
        res[hv ? 'on' : 'off'] = { frames: k, len: Math.round(dur * 60), factor: hmx ? hmx.factor : 1, how: hmx ? hmx.how : null };
      }
      const pred = 1 + Math.ceil((res.off.len - 1) / res.on.factor);
      out.push([Math.abs(res.on.frames - pred) <= 3, `${MON} ${ex} (ModifyData only)`, JSON.stringify({ off: res.off.frames, on: res.on.frames, predicted: pred, factor: res.on.factor, how: res.on.how })]);
    }
    await setHyper('');
  }
  return out;
}
export const pageCheck = meter;
const env = typeof process !== 'undefined' ? process.env : {};
export const args = (env.METER_IDS || 'em001_00').split(',').map(id => [[id], +(env.METER_RANK || 5), +(env.METER_MAX || 4), env.METER_EXTRA || "", env.METER_PAIR || ""]);
