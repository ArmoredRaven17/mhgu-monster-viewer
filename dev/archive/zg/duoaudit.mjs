// DUO EFFECT AUDIT (Raven 2026-10-18: "not all environment effects from their combined attacks are showing"). For every entry of
// Seltas Queen's "Combined (with Seltas)" list: play it once from frame 0 to its end and record, per frame, her schedule's clip
// key / frame and his runtime's (index.html partnerFxClip), and every request either runtime STARTS. Then the ROM's expectation
// for the frames played: each PSL bit of the clip (monster.js CLIP_EFFECTS) whose `on` window holds the frame and whose bit the
// enable word lets through (psl-mask.js pslMask: hers with the link bit as herLinkedForShells gives it, his the base word).
//   node run-check.mjs duoaudit.mjs   -> one PASS line per entry: expected / started / missing / extra
async function pageCheckDuoAudit(onlyArg, maxN){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const PM = await import('/render/psl-mask.js');
  const FX = await import('/render/rom/effect-mounts.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (await test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em069_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule);
  V.state.loop = false;
  listSel.value = 'duo'; await listSel.onchange();
  const entries = [...clipSel.options].map(o => o.value);
  const only = onlyArg && onlyArg.length ? onlyArg : null; let nDone = 0;
  const bitsOf = (mon, key) => { const [l, c] = key.split('|'); return ((M.CLIP_EFFECTS[mon] || {})['L' + l + ' ' + c.replace(/_(start|loop)$/, '')] || { bits: [] }).bits; };
  const ce = (mon, key) => (M.CLIP_EFFECTS[mon] || {})['L' + key.split('|')[0] + ' ' + key.split('|')[1].replace(/_(start|loop)$/, '')];
  for (const name of entries){
    if (only && !only.some(o => name.startsWith(o))) continue;
    if (maxN && nDone++ >= maxN) break;
    // the baseline BEFORE the entry is picked: a record its frames 0..2 start counts
    const BR0 = M.effectRuntimeInstance(), PR0 = FX.partnerEffectRuntime();
    const seenOf = R => { const st = new Set(); if (R && R.schedule) for (const e of R.schedule.entries) for (const q of e.requests) st.add(q); return st; };
    const pre = { her: BR0 && BR0.schedule ? seenOf(BR0) : null, his: PR0 && PR0.schedule ? seenOf(PR0) : null };
    clipSel.value = name; await clipSel.onchange();
    await frames(3);
    const BR = M.effectRuntimeInstance();
    if (!BR || !BR.schedule){ out.push([false, name + ': no runtime', '']); continue; }
    const act = V.pose.action; if (!act){ out.push([false, name + ': no action', '']); continue; }
    act.time = 0; act.paused = false;
    const len = Math.round(act.getClip().duration * 60);
    const seenReq = new Map(), started = [], samples = [];
    let base = { her: BR === BR0 && pre.her ? pre.her : seenOf(BR), his: null };
    for (let i = 0; i < len + 4; i++){
      await frames(1);
      const PR = FX.partnerEffectRuntime();
      if (PR && PR.schedule && !base.his) base.his = (PR === PR0 && pre.his) ? pre.his : new Set();
      const hc = BR.schedule.clip, pc = PR && PR.schedule && PR.schedule.clip;
      samples.push([hc ? hc.key : null, hc ? Math.round(hc.frame) : null, hc ? hc.word : null, pc ? pc.key : null, pc ? Math.round(pc.frame) : null, pc ? pc.word : null]);
      for (const [who, R] of [['her', BR], ['his', PR]]){
        if (!R || !R.schedule || !base[who]) continue;
        for (const e of R.schedule.entries){
          if (!e.def.record) continue;
          for (const q of e.requests) if (!base[who].has(q)){ base[who].add(q); started.push(who + ':' + e.def.record.pel + ':' + e.def.record.key + ':' + e.when); }
        }
      }
      if (act.time * 60 >= len - 1 && i > 2) break;
    }
    // the ROM's expectation over the frames played
    const want = new Set();
    for (const [hk, hf, hw, pk, pf, pw] of samples){
      for (const [mon, k, f, w, who] of [[MON, hk, hf, hw, 'her'], ['em076_00', pk, pf, pw, 'his']]){
        if (!k || f == null) continue;
        const kk = k.split('|').slice(1).join('|');
        const blk = ce(mon, kk); if (!blk) continue;
        // the word the ROM builds: hers with the link (the duo list: him mounted, not released), his the base 0xca170
        const l = kk.split('|')[0], slot = +((/Motion\[(\d+)\]/.exec(kk) || [])[1]);
        const word = PM.pslMask(mon, l, slot, null, { seltasLink: true });
        for (const b of blk.bits){
          if (!b.on.some(([a, z]) => f >= a && f <= z)) continue;
          const okBit = word == null || ((word >>> b.bit) & 1);
          if (okBit) want.add(who + ':' + b.key + ':' + b.efl);
        }
      }
    }
    const got = new Set(started.map(s => { const [who, pel, key] = s.split(':'); return who + ':' + key; }));
    const wantK = new Set([...want].map(s => s.split(':').slice(0, 2).join(':')));
    const missing = [...wantK].filter(x => !got.has(x)), extra = [...got].filter(x => !wantK.has(x));
    out.push([missing.length === 0, name + ' | want ' + [...wantK].join(' ') + ' | started ' + [...new Set(started)].join(' ') + (missing.length ? ' | MISSING ' + missing.join(' ') : '') + (extra.length ? ' | extra ' + extra.join(' ') : ''), '']);
  }
  return out;
}
export const pageCheck = pageCheckDuoAudit;
export const args = process.env.DUO_ONLY ? [[process.env.DUO_ONLY.split('|'), +(process.env.DUO_MAX || 0)]] : [[[], +(process.env.DUO_MAX || 0)]];
