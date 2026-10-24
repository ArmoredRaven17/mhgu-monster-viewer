// floorscan.mjs (run-check-long.mjs; METER_IDS): which records' rows test the FLOOR. A row builds when (w00 & MASK1) && (w04 & MASK2)
// (construct.js rowEnabled, 0x9bb8fc); MASK1 is the payload's +0x48, MASK2 comes from the parent's floor block (0x41c74): a plain floor
// 3, flag 0x1040 -> 9, flag 8 -> 0x21, 0x800000 -> 0x41, 0x800 -> 0x81, +0x1066 bit 1 -> 0x101 (flag 6 -> an unrecorded arm).
// For every record (each runtime: the body's, the arms' / partner's): its MASK1-selected rows and the floor classes under which each builds.
async function floorScan(ids){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel');
  const CLASSES = { plain: 3, 'f1040': 9, 'f8': 0x21, 'f800000': 0x41, 'f800': 0x81, 'b1066': 0x101 };
  for (const MON of ids){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    if (!await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900)){ out.push([false, 'FLOOR ' + MON, '{"error":"no runtime"}']); continue; }
    await frames(30);
    const rts = [M.effectRuntimeInstance(), V.partnerEffectRuntimeObj && V.partnerEffectRuntimeObj(), V.sideEffectRuntimeObj && V.sideEffectRuntimeObj(MON + '_left'), V.sideEffectRuntimeObj && V.sideEffectRuntimeObj(MON + '_right')].filter(Boolean);
    const recs = [], recByKey = {};
    for (const rt of rts){
      const m = rt.host.m;
      for (const e of rt.schedule.entries){
        const r = e.def.record; if (!r || !e.owner) continue;
        const p = r.payload, mask1 = parseInt(p.substr(0x48 * 2, 8).match(/../g).reverse().join(''), 16) >>> 0;
        const rl = m.u32(e.owner + 0xf4) >>> 0; if (!rl) continue;
        const nrow = m.u16(rl + 0x74), body = m.u32(rl + 0x68) >>> 0;
        const rows = [];
        for (let row = 0; row < nrow && row < 64; row++){
          const c0 = m.u32(body + (row << 4)) >>> 0; if (!(c0 >>> 8)) continue;
          const nb = (body + (c0 >>> 8)) >>> 0, w00 = m.u32(nb) >>> 0, w04 = m.u32(nb + 4) >>> 0;
          if (!(w00 & mask1)) continue;
          rows.push(w04);
        }
        if (!rows.length) continue;
        const sig = {};
        for (const [k, v] of Object.entries(CLASSES)) sig[k] = rows.map((w, i) => (w & v) ? i : -1).filter(i => i >= 0).join('.');
        const distinct = new Set(Object.values(sig)).size;
        recByKey[r.pel + '|' + r.key] = { sig, distinct, efl: String(e.def.efl).split('/').pop(), noneOnPlain: !sig.plain };
      }
    }
    // per clip (CLIP_EFFECTS): the combined signature of its records under each floor class
    const clips = [];
    for (const id of [MON, MON + '_left', MON + '_right']){
      for (const [ck, cv] of Object.entries((M.CLIP_EFFECTS || {})[id] || {})){
        const pel = id === MON ? null : null;
        const members = [];
        for (const b of cv.bits){
          const key = Object.keys(recByKey).find(k => k.endsWith('|' + b.key) && recByKey[k].efl === b.efl);
          if (key) members.push(recByKey[key]);
        }
        if (!members.length) continue;
        const per = {};
        for (const c of Object.keys(CLASSES)) per[c] = members.map(x => x.sig[c]).join('/');
        const n = new Set(Object.values(per)).size;
        if (n > 1) clips.push({ clip: id + ' ' + ck, variants: n, classes: Object.entries(per).reduce((a, [c, s]) => { (a[s] = a[s] || []).push(c); return a; }, {}) });
      }
    }
    for (const [k, v] of Object.entries(recByKey)) if (v.distinct > 1 || v.noneOnPlain) recs.push({ k, efl: v.efl, distinct: v.distinct, noneOnPlain: v.noneOnPlain });
    recs.push({ clipsWithVariants: clips.length, sample: clips.slice(0, 3).map(c => [c.clip, c.variants, Object.values(c.classes)]) });
    out.push([false, 'FLOOR ' + MON, JSON.stringify(recs)]);
  }
  return out;
}
export const pageCheck = floorScan;
export const args = ((typeof process !== 'undefined' && process.env.METER_IDS) ? process.env.METER_IDS : 'em032_00').split(',').map(id => [[id]]);
