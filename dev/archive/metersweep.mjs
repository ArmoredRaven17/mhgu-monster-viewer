// metersweep.mjs (run-check-long.mjs; METER_IDS=...): the draw meter with EVERY INPUT DRIVEN, so every record starts at least once.
//   Pass A (defaults): every clip of every list the page has for the monster (the Snow Variants, the combined list, the Special
//     list included) that a record names -- CLIP_EFFECTS, MOTION_STATES, SHELL_DATA actions and partners -- and every copy of it on
//     the Clip menu (#B ...), each replayed once per shell pick that clip has (the picks cycle per play), up to 6.
//   Pass B (inputs): each visible control set to each non-default value in turn -- the State dropdown, Rage, Stance, Level, Variant,
//     Carry, Boulder, the class control (Wind Aura, Fire Aura, Gas Type ...), the Enraged / Tired / Discharge / Heated switches and
//     the class toggles -- with the shell and state clips replayed once under it; then back to the default.
// One REPORT line per monster: the meter's rows, and the exported records that still never started (`never`).
async function meterSweep(ids){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js'), MS = await import('/render/motion-states.js'), SH = await import('/render/shells.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  const shown = el => !!el && !el.closest('[hidden]') && (el.tagName !== 'SELECT' || el.options.length > 1);
  for (const MON of ids){
    const t0 = performance.now();
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    if (!await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900)){
      out.push([false, 'REPORT ' + MON, JSON.stringify({ error: 'no runtime' })]); continue;
    }
    const ent = V.MON.monsters.find(e => e.id === MON);
    const C = V.controls, cam = V.camera;
    cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
    const base = c => String(c).replace(/_(start|loop)$/, '').replace(/#.*$/, '');
    const picks = new Map(), stateClips = new Set(), recClips = new Set();
    const key = (l, c) => String(l) + '|' + base(c);
    for (const id of [MON, MON + '_left', MON + '_right'])
      for (const k of Object.keys((M.CLIP_EFFECTS || {})[id] || {})){ const m = /^L(\S+) (.+)$/.exec(k); if (m) recClips.add(key(m[1], m[2])); }
    for (const k of Object.keys((MS.MOTION_STATES || {})[MON] || {})){ const [l, c] = k.split('|'); recClips.add(key(l, c)); stateClips.add(key(l, c)); }
    const sd = (SH.SHELL_DATA || {})[MON];
    for (const a of Object.values((sd && sd.actions) || {})){
      for (const c of [a.clip, ...(a.partners || [])]){ const k = key(a.list, c); recClips.add(k); stateClips.add(k); picks.set(k, (picks.get(k) || 0) + 1); }
    }
    // the lists the page made: every clip of a routed / combined / special list carries records through its pieces
    for (const l of ent.lists || []) if (!/^\d+$/.test(String(l.id)) && !/^[lr]_\d+$/.test(String(l.id))) for (const c of l.clips) { recClips.add(key(l.id, c.clip)); stateClips.add(key(l.id, c.clip)); }
    const lists = new Map((ent.lists || []).map(l => [String(l.id), l]));
    V.state.loop = false;
    let played = 0;
    const playOpt = async (l, value, n) => {
      if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); }
      const o = [...clipSel.options].find(x => x.value === value);
      if (!o) return false;
      clipSel.value = o.value; await clipSel.onchange();
      await until(() => V.pose.action && V.pose.action.getClip().name.startsWith(String(o.value).replace(/#.*$/, '').replace(/_(start|loop)$/, '')), 120);
      await frames(n);
      played++;
      return true;
    };
    const durOf = (l, b) => { const L = lists.get(l); if (!L) return 200; let d = 0; for (const c of L.clips) if (base(c.clip) === b) d += c.dur; return Math.min(360, Math.round(d * 60) + 30); };
    const optionsFor = async (l, b) => {
      if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); }
      const all = [...clipSel.options].map(o => o.value).filter(v => base(v) === b);
      const heads = all.filter(v => !/_loop(#.*)?$/.test(v));
      return heads.length ? heads : all;
    };
    const playKey = async (k, reps) => {
      const i = k.indexOf('|'), l = k.slice(0, i), b = k.slice(i + 1);
      if (!lists.has(l)) return;
      const opts = await optionsFor(l, b);
      for (const v of opts) for (let r = 0; r < reps; r++){ await playOpt(l, v, durOf(l, b)); }
    };
    V.effectMeter(true, { every: 5 });
    // PASS A
    for (const k of recClips) await playKey(k, Math.min(6, Math.max(1, picks.get(k) || 1)));
    // PASS B
    const selects = ['monState', 'monRageLevel', 'monStance', 'monLevel', 'monVariant', 'monCarry', 'monBoulder', 'monClassCtl'].map($).filter(shown);
    const switches = [...['monRage', 'monTired', 'monCharge', 'monHeated', 'monBeamHeated', 'monGag'].map($), ...document.querySelectorAll('#monClassToggles input[type=checkbox]')].filter(shown);
    const inputs = [];
    for (const s of selects){
      const v0 = s.value;
      for (const o of [...s.options]) if (o.value !== v0){
        s.value = o.value; s.dispatchEvent(new Event('change')); await frames(4);
        inputs.push(s.id + '=' + o.value);
        for (const k of stateClips) await playKey(k, 1);
      }
      s.value = v0; s.dispatchEvent(new Event('change')); await frames(4);
    }
    for (const b of switches){
      const v0 = b.checked;
      b.checked = !v0; b.dispatchEvent(new Event('change')); await frames(4);
      inputs.push((b.id || b.name) + '=' + !v0);
      for (const k of stateClips) await playKey(k, 1);
      b.checked = v0; b.dispatchEvent(new Event('change')); await frames(4);
    }
    const rep = V.effectMeterReport();
    V.effectMeter(false);
    // exported records that never started (any runtime of this monster)
    const started = new Set(rep.recs.map(r => r.key));
    const never = [];
    for (const id of [MON, MON + '_left', MON + '_right']){
      const def = await fetch('/effects/' + id + '.json').then(r => r.ok ? r.json() : null).catch(() => null);
      if (!def) continue;
      for (const e of def.effects) if (e.record && e.when !== 'rage' && e.when !== 'calm' && e.when !== 'always'){
        const k = id + '|' + e.record.pel + '|' + e.record.key + '|' + e.when;
        if (!started.has(k)) never.push(k.slice(id.length + 1) + (id !== MON ? ' (' + id.slice(MON.length + 1) + ')' : ''));
      }
    }
    out.push([false, 'REPORT ' + MON, JSON.stringify({ played, inputs, never, secs: Math.round((performance.now() - t0) / 1000), tail: rep.tail,
      recs: rep.recs.map(r => ({ k: r.key, efl: r.efl, w: r.when, st: r.starts, live: r.liveFrames, df: r.drawFrames, vf: r.visibleFrames,
        d: r.draws, v: r.verts, hid: r.hidden, s: r.samples, lit: r.litSamples, px: r.pixMax, pm: Math.round(r.pixMean), verdict: r.verdict,
        clips: Object.keys(r.clips).slice(0, 4), diag: r.diag, nodraw: r.nodraw })) })]);
  }
  return out;
}
export const pageCheck = meterSweep;
export const args = ((typeof process !== 'undefined' && process.env.METER_IDS) ? process.env.METER_IDS : 'em024_00').split(',').map(id => [[id]]);
