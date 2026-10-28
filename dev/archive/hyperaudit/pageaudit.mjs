// hyperaudit/pageaudit.mjs (hyper audit, 2026-10-28; Raven: "Review Hyper Effects since some monsters do not seem to have them").
// On the page, per monster (AUDIT_IDS, comma list) and per Quest Rank (AUDIT_RANKS, default "3,5": below G = the plain .mdd, G = the
// _g), with the clock fixed at 1/60 s a render frame and the DEFAULT camera (what the viewer shows on load):
//   * THE ROW: the Hyper row shown or hidden, its options, against the pairs docs/hyper-auras.json's file for that rank holds;
//   * EVERY OPTION through the row (the UI path, stepHyper): 60 frames under the draw meter (every 3rd frame): per aura u 1300+ID
//     its starts / lit samples / verdict; then one shot, diffed against a Hyper Off shot (pixels whose largest channel moved > 8),
//     beside a noise control (two Off shots);
//   * EVERY AURA ALONE (rt.holdEvent, the row Off): 45 frames, the last frame's model draws counted -- the eye pair (cm200_108
//     meshes, or Kut-Ku's cm100_000 mesh 43, with the RevSub halo / BlendAlpha core blends), their emit (sorted / unsorted) --
//     under "Effects drawn before" = None and = A GPU-particle effect (fxPass 'node'), and the in-scene pixels under each;
//   * BURSTS: one hooked play-once clip (docs/hyper-motion.json, the first pair / clip with bursts on a shown list), played once
//     with the pair held: the meter's u 1310+ID starts / lit;
//   * the runtime's failure (rt.failed) at each step.
// Shots are NOT posted (window.fetch('/shot') answered in the page); AUDIT_SHOTS=<run> posts the per-aura 'node' shot and the
// best option's shot to dev/shots/<run>/.
//   AUDIT_IDS=em001_00 node dev/archive/hypereye/rcd.mjs dev/archive/hyperaudit/pageaudit.mjs --url http://localhost:5811
async function audit(ids, ranks, shotRun){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const HA = await (await fetch('/hyper-auras.json')).json();
  const HM = await (await fetch('/hyper-motion.json')).json();
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip'), sel = $('monHyper');
  // the shots stay in the page unless asked for
  const realFetch = window.fetch.bind(window);
  let keepShot = null, postShot = false;
  window.fetch = (u, init) => {
    if (typeof u === 'string' && u.startsWith('/shot') && !postShot){ keepShot = init && init.body; return Promise.resolve(new Response('{"ok":true}')); }
    return realFetch(u, init);
  };
  const decode = url => new Promise((res, rej) => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const g = c.getContext('2d'); g.drawImage(im, 0, 0); res(g.getImageData(0, 0, im.width, im.height).data); }; im.onerror = rej; im.src = url; });
  const shoot = async (name, post) => {
    postShot = !!(post && shotRun); keepShot = null;
    const r = await V.shot(shotRun || 'hyperaudit', name);
    postShot = false;
    if (V.pose.action) V.pose.action.timeScale = 1;
    const url = keepShot || null;
    return url ? decode(url) : (post && shotRun ? null : null);
  };
  // when posting, the page's copy is lost: shoot twice (one kept, one posted)
  const shootKeep = async (name, post) => { const px = await shoot(name, false); if (post && shotRun) await shoot(name, true); return px; };
  // [pixels moved > 8, pixels moved > 3, the largest channel move] (8-bit channels)
  const diff = (a, b) => { if (!a || !b || a.length !== b.length) return -1; let n = 0, n3 = 0, mx = 0;
    for (let i = 0; i < a.length; i += 4){ const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]));
      if (d > 8) n++; if (d > 3) n3++; if (d > mx) mx = d; } return [n, n3, mx]; };
  const setHyper = async v => { sel.value = v; sel.dispatchEvent(new Event('change')); await frames(2); };
  const eyeRows = models => {
    const eye = models.filter(d => /cm200_108$/.test(d.model) || (/cm100_000$/.test(d.model) && d.meshIndex === 43));
    const by = {};
    for (const d of eye){ const k = d.model.split('\\').pop() + ' m' + d.meshIndex + ' ' + d.blend + ' ' + (d.unsorted ? 'unsorted' : 'sorted') + ' ' + d.depth; by[k] = (by[k] || 0) + 1; }
    return { n: eye.length, halo: eye.filter(d => /RevSub/.test(d.blend)).length, core: eye.filter(d => /BlendAlpha/.test(d.blend) && !/RevSub/.test(d.blend)).length, by };
  };
  for (const MON of ids){
    const res = { mon: MON, ranks: {} };
    try {
      if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
      monSel.value = MON; await monSel.onchange(); await frames(30);
      await V.effects(false); await V.effects(true);
      await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
      const rt = M.effectRuntimeInstance();
      res.rtFailedAtLoad = rt && rt.failed || null;
      if (listSel.value !== '0'){ listSel.value = '0'; await listSel.onchange(); }
      clipSel.value = clipSel.options[Math.min(1, clipSel.options.length - 1)].value; await clipSel.onchange();
      V.state.loop = true; res.clip = V.state.clip;
      const host = rt.host, orig = host.drawFrame.bind(host);
      let last = null; host.drawFrame = owners => (last = orig(owners));
      for (const rank of ranks){
        const R = res.ranks[rank] = {};
        V.state.questRank = rank; { const q = $('monQuestRank'); if (q) q.value = String(rank); }
        await setHyper(''); await frames(6);
        const file = HA[MON] && HA[MON][rank > 4 ? 'g' : 'normal'];
        const g0 = file ? file.auras.filter(a => a.group === 0) : [], g1 = file ? file.auras.filter(a => a.group === 1) : [];
        const want = []; for (const a of g0.length ? g0 : [null]) for (const b of g1.length ? g1 : [null]){ const p = [a, b].filter(Boolean); if (p.length) want.push(p.map(x => x.id).join(',')); }
        R.file = file ? file.file : null;
        R.rowShown = !$('monHyperRow').hidden;
        R.options = [...sel.options].map(o => o.value).filter(Boolean);
        R.optionsMatch = JSON.stringify(R.options) === JSON.stringify(want);
        if (!R.options.length){ out.push([!file || !file.auras.length, `${MON} r${rank} ROW`, JSON.stringify({ rowShown: R.rowShown, want })]); continue; }
        // noise control and the Off shot
        await frames(30);
        const off1 = await shoot(MON + '_r' + rank + '_off1'); await frames(20);
        const off = await shootKeep(MON + '_r' + rank + '_off', true); R.noisePx = diff(off1, off);
        // every option through the row
        R.opts = {};
        for (const v of R.options){
          V.effectMeter(true, { every: 3 });
          await setHyper(v); await frames(60);
          const rep = V.effectMeterReport(); V.effectMeter(false);
          const on = await shootKeep(MON + '_r' + rank + '_on_' + v.replace(',', '-'), true);
          const rows = {};
          for (const id of v.split(',').map(Number)){
            const rr = rep.recs.filter(r => r.key === MON + '|' + MON + 'u|' + (1300 + id) + '|event');
            rows[1300 + id] = rr.length ? { st: rr[0].starts, lit: rr[0].litSamples, s: rr[0].samples, px: rr[0].pixMax, verdict: rr[0].verdict } : { verdict: 'no meter row' };
          }
          R.opts[v] = { rows, scenePx: diff(off, on), failed: rt.failed || null };
          await setHyper(''); await frames(10);
        }
        // every aura alone, both passes
        R.auras = {};
        for (const a of (file ? file.auras : [])){
          const A = R.auras[1300 + a.id] = { part: a.part, group: a.group, joint: a.joint };
          for (const pass of ['none', 'node']){
            V.state.fxPass = pass;
            V.effectMeter(true, { every: 3 });
            rt.holdEvent(MON + 'u', 1300 + a.id, true); await frames(45);
            const rep = V.effectMeterReport(); V.effectMeter(false);
            const eyes = eyeRows(last ? last.models : []);
            const px = await shootKeep(MON + '_r' + rank + '_u' + (1300 + a.id) + '_' + pass, pass === 'node' && eyes.n > 0);
            const rr = rep.recs.filter(r => r.key === MON + '|' + MON + 'u|' + (1300 + a.id) + '|event');
            A[pass] = { st: rr.length ? rr[0].starts : 0, lit: rr.length ? rr[0].litSamples : 0, verdict: rr.length ? rr[0].verdict : 'no meter row',
                        models: last ? last.models.length : 0, eyes, scenePx: diff(off, px), failed: rt.failed || null };
            rt.holdEvent(MON + 'u', 1300 + a.id, false); await frames(15);
          }
          V.state.fxPass = 'none';
        }
        // the bursts: one hooked play-once clip with bursts
        const F = HM[MON] && HM[MON][rank > 4 ? 'g' : 'normal'];
        R.burst = null;
        if (F && F.hooks){
          let pick = null;
          for (const [pair, mots] of Object.entries(F.hooks)){
            if (!R.options.includes(pair)) continue;
            for (const [mk, hk] of Object.entries(mots)){
              if (!hk.bursts || !hk.bursts.length) continue;
              const [L, Mn] = mk.split(' ').map(s => +s.slice(1));
              if (![...listSel.options].some(o => o.value === String(L))) continue;
              if (listSel.value !== String(L)){ listSel.value = String(L); await listSel.onchange(); await frames(2); }
              if (![...clipSel.options].some(o => o.value === 'Motion[' + Mn + ']')) continue;
              pick = { pair, mk, L, clip: 'Motion[' + Mn + ']', bursts: hk.bursts }; break;
            }
            if (pick) break;
          }
          if (pick){
            await setHyper(pick.pair); V.state.loop = false;
            V.effectMeter(true, { every: 1 });
            clipSel.value = pick.clip; await clipSel.onchange();
            await until(() => V.pose.action && V.pose.action.getClip().name.startsWith(pick.clip), 300);
            const act = V.pose.action, dur = act.getClip().duration; act.time = 0;
            for (let k = 0; k < 3000; k++){ await frames(1); if (act.time >= dur - 1e-3 || (act.paused && k > 2)) break; }
            await frames(20);
            const rep = V.effectMeterReport(); V.effectMeter(false);
            pick.result = [...new Set(pick.bursts.map(b => b[1]))].map(id => {
              const rr = rep.recs.filter(r => r.key.includes('|' + MON + 'u|' + (1310 + id) + '|'));
              return { u: 1310 + id, expected: pick.bursts.filter(b => b[1] === id).length, st: rr.reduce((s, r) => s + (r.starts | 0), 0),
                       lit: rr.reduce((s, r) => s + (r.litSamples | 0), 0), verdict: rr.map(r => r.verdict).join('/') || 'none' };
            });
            pick.failed = rt.failed || null;
            await setHyper('');
            // back to the idle clip LOOPING (state.loop before the clip is set: a play-once clip ends paused, and a paused clip
            // steps no effect -- the animation is the effects' clock -- so the next rank's auras would start and never run)
            V.state.loop = true;
            listSel.value = '0'; await listSel.onchange(); clipSel.value = clipSel.options[Math.min(1, clipSel.options.length - 1)].value; await clipSel.onchange();
            await frames(5);
          }
          R.burst = pick || 'no hooked play-once clip with bursts on a shown list';
        }
        // the verdict for this rank
        const optOk = Object.values(R.opts).every(o => Object.values(o.rows).every(r => r.verdict === 'draws'));
        const burstOk = !R.burst || typeof R.burst === 'string' || R.burst.result.every(b => b.st >= 1 && b.lit > 0);
        out.push([R.rowShown && R.optionsMatch && optOk && burstOk && !rt.failed, `${MON} r${rank}`, JSON.stringify(R)]);
      }
      host.drawFrame = orig;
      V.state.questRank = 5;
    } catch (e){ out.push([false, `${MON} ERROR`, String(e && e.stack || e).slice(0, 600)]); }
  }
  window.fetch = realFetch;
  return out;
}
export const pageCheck = audit;
const env = typeof process !== 'undefined' ? process.env : {};
export const args = (env.AUDIT_IDS || 'em001_00').split(',').map(id => [[id], (env.AUDIT_RANKS || '3,5').split(',').map(Number), env.AUDIT_SHOTS || '']);
