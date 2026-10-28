// census3.mjs (2026-10-25): census2 with four instrument fixes, each a miss found on the Flying Wyvern pass: (1) a copy of a split clip
// ('Motion[7]_start#B') is played (census / census2 stripped _start before the copy suffix, so every copy of a split clip was skipped);
// (2) psl-mask.js ACTION_EFFECTS records map to their motion and to the Special entries that play it as that action (or its `tired`
// twin); (3) a play runs to 900 frames, not 360; (4) a clip whose MOTION_STATES row cycles is replayed once per arm (up to 10);
// (5) both pieces of a split motion are played (_start and _loop), not the _start alone.
// census2.mjs (2026-10-24, the census RETRY: METER_IDS=<id>, OPEN_KEYS=<json list>): census.mjs over the records still open, each clip replayed
// once per entry of its CLIP_ACTIONS cycle (the action changes per play: n % length) and per shell pick -- the first census played each
// clip once.
// census.mjs (2026-10-24, the effects coverage census; METER_IDS=<id>): the DRAW METER over every non-shell effect record the viewer
// exports for a monster (docs/effects/<id>.json, its _left / _right arms included), with every input the page has driven once:
//   A  every clip a record names (CLIP_EFFECTS, MOTION_STATES rows, SHELL_DATA action clips -- once each, the shells' own records are
//      the shells agent's table), every copy on the Clip menu, every list the page made (Snow Variants, the combined duo list ...);
//   B  each visible state / class input set to each value (State, Rage, Stance, Level, Variant, Carry, Boulder, the class controls,
//      the switches, the class toggles, the shared-state rows), replaying the clips whose records have not started yet, plus 240
//      frames of the first record clip (class timers / toggles that run on no clip);
//   C  the Parts rows: each part row stepped through its options (a break fires on the change) with 90 frames each, then every row
//      broken and the not-started clips replayed;
//   D  the Ground types and the Quest Ranks, each non-default value with the not-started clips replayed.
// One REPORT line: the meter's rows (starts / live / draws / verdict per record), the inputs, and `never` (exported, never started).
async function census(ids, openKeys){
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
    // census3 (2026-10-25): the copy suffix first -- a copy of a split clip is 'Motion[7]_start#B', which census / census2 never played
    const base = c => String(c).replace(/#.*$/, '').replace(/_(start|loop)$/, '');
    const key = (l, c) => String(l) + '|' + base(c);
    // the universe: every non-shell exported record, and the clips that name each one
    const univ = new Map();          // 'id|pel|key|when' -> record
    const eflKey = new Map();        // 'efl|key' -> [rk]
    for (const id of [MON, MON + '_left', MON + '_right']){
      const def = await fetch('/effects/' + id + '.json').then(r => r.ok ? r.json() : null).catch(() => null);
      if (!def) continue;
      for (const e of def.effects) if (e.record && e.when !== 'shell'){
        const rk = id + '|' + e.record.pel + '|' + e.record.key + '|' + e.when;
        if (openKeys && !openKeys.includes(rk)) continue;
        univ.set(rk, { id, when: e.when, efl: String(e.efl || '').replace(/^files\//, '').replace(/\.efl$/, '') });
        const ek = String(e.efl || '').replace(/^files\//, '').replace(/\.efl$/, '') + '|' + e.record.key;
        if (!eflKey.has(ek)) eflKey.set(ek, []); eflKey.get(ek).push(rk);
      }
    }
    const clipRecs = new Map();      // clip key -> Set of record keys it can start
    const addRec = (ck, rk) => { if (!clipRecs.has(ck)) clipRecs.set(ck, new Set()); if (rk) clipRecs.get(ck).add(rk); };
    for (const id of [MON, MON + '_left', MON + '_right'])
      for (const [k, v] of Object.entries((M.CLIP_EFFECTS || {})[id] || {})){
        const m = /^L(\S+) (.+)$/.exec(k); if (!m) continue;
        const ck = key(m[1], m[2]); addRec(ck, null);
        for (const b of (v && v.bits) || []) for (const rk of eflKey.get(String(b.efl).replace(/\.efl$/, '') + '|' + b.key) || []) addRec(ck, rk);
      }
    const pelPairs = o => { const s = JSON.stringify(o); const r = []; const re = /\["(em\d{3}_\d{2}[uc])",(\d+)/g; let m; while ((m = re.exec(s))) r.push(m[1] + '|' + m[2]); return r; };
    for (const [k, row] of Object.entries((MS.MOTION_STATES || {})[MON] || {})){
      const [l, c] = k.split('|'); const ck = key(l, c); addRec(ck, null);
      for (const p of pelPairs(row)) for (const rk of univ.keys()) if (rk.startsWith(MON + '|' + p + '|')) addRec(ck, rk);
    }
    // census3: the class's own requests inside an action (psl-mask.js ACTION_EFFECTS) -- on the motion's clip and on every Special
    // entry (ROM_ANIMATIONS) that plays that motion as one of the `by` actions (its `action`, or its `tired` twin)
    const PM0 = await import('/render/psl-mask.js');
    const an = (M.ROM_ANIMATIONS || {})[MON] || [];
    for (const [lc, ae] of Object.entries((PM0.ACTION_EFFECTS || {})[MON] || {})){
      const [l, c] = lc.split('|'); const ck = key(l, c); addRec(ck, null);
      for (const [act, r] of Object.entries(ae.by || {})){
        const rks = [...univ.keys()].filter(rk => rk.startsWith(MON + '|' + r[0] + '|' + r[1] + '|'));
        for (const rk of rks) addRec(ck, rk);
        const nm = a => a ? a[0] + ':0x' + a[1].toString(16).padStart(2, '0') : null;
        for (const e of an) if (e.motion && e.motion[0] === l && e.motion[1] === c && (nm(e.action) === act || nm(e.tired) === act))
          for (const rk of rks) addRec('Special|' + e.name, rk);
      }
    }
    const sd = (SH.SHELL_DATA || {})[MON];
    for (const a of Object.values((sd && sd.actions) || {})) for (const c of [a.clip, ...(a.partners || [])]) addRec(key(a.list, c), null);
    for (const l of ent.lists || []) if (!/^\d+$/.test(String(l.id)) && !/^[lr]_\d+$/.test(String(l.id))) for (const c of l.clips) addRec(key(l.id, c.clip), null);
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
    const durOf = (l, b) => { const L = lists.get(l); if (!L) return 200; let d = 0; for (const c of L.clips) if (base(c.clip) === b) d += c.dur; return Math.min(900, Math.round(d * 60) + 30); };   // census3: 900 (Akantor's / Ukanlos's L3 M18 c 3000 at f424 / f432)
    const optionsFor = async (l, b) => {
      if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); }
      const all = [...clipSel.options].map(o => o.value).filter(v => base(v) === b);
      // census3: every piece -- a split motion's _loop is its own option, and a bit in the _loop half fires only there
      return all;
    };
    const PM = await import('/render/psl-mask.js');
    const repsOf = (l, b) => {
      const a = (PM.CLIP_ACTIONS[MON] || {})[l + '|' + b];
      let picks = 0; try { picks = (SH.pickVariantsFor(MON, l, b) || []).length; } catch (_) {}
      // census3: a MOTION_STATES row that cycles (each play the next arm: Tigrex's L3 M2 five) -- every arm, copies included
      let cyc = 0; for (const [k, row] of Object.entries((MS.MOTION_STATES || {})[MON] || {})) if (key(...k.split('|')) === l + '|' + b && row && row.cycle) cyc = Math.max(cyc, row.cycle.length);
      return Math.min(10, Math.max(1, a ? a.length : 0, picks, cyc));
    };
    const playKey = async k => {
      const i = k.indexOf('|'), l = k.slice(0, i), b = k.slice(i + 1);
      if (!lists.has(l)) return;
      const n = repsOf(l, b);
      for (const v of await optionsFor(l, b)) for (let r = 0; r < n; r++) await playOpt(l, v, durOf(l, b));
    };
    V.effectMeter(true, { every: 5 });
    const startedNow = () => new Set(V.effectMeterReport().recs.map(r => r.key));
    const pending = () => { const s = startedNow(); return [...univ.keys()].filter(k => !s.has(k) && !/\|(rage|calm|always)$/.test(k)); };
    // the clips still worth replaying: those naming a not-started record, else (records on no clip) the first record clip
    const replay = async () => {
      const p = new Set(pending());
      if (!p.size) return;
      const ks = [...clipRecs].filter(([, s]) => [...s].some(r => p.has(r))).map(([k]) => k);
      for (const k of ks) await playKey(k);
      const first = [...clipRecs.keys()][0];
      if (first) await playKey(first);
    };
    // PASS A
    for (const [k, rs] of clipRecs) if (rs.size) await playKey(k);
    const inputs = [];
    // PASS B -- the state / class inputs
    const ctl = ['monState', 'monRageLevel', 'monStance', 'monLevel', 'monVariant', 'monCarry', 'monBoulder', 'monClassCtl', 'monClassCtl2', 'monC1100', 'monC1108', 'monTail'].map($).filter(shown);
    const selects = ctl.filter(e => e.tagName === 'SELECT');
    const switches = [...['monRage', 'monTired', 'monCharge', 'monHeated', 'monBeamHeated', 'monGag'].map($), ...ctl.filter(e => e.tagName === 'INPUT' && e.type === 'checkbox'),
                      ...document.querySelectorAll('#monClassToggles input[type=checkbox]')].filter(shown);
    for (const s of selects){
      const v0 = s.value;
      for (const o of [...s.options]) if (o.value !== v0){
        if (!pending().length) break;
        s.value = o.value; s.dispatchEvent(new Event('change')); await frames(4);
        inputs.push(s.id + '=' + o.value);
        await replay();
      }
      s.value = v0; s.dispatchEvent(new Event('change')); await frames(4);
    }
    for (const b of switches){
      if (!pending().length) break;
      const v0 = b.checked;
      b.checked = !v0; b.dispatchEvent(new Event('change')); await frames(4);
      inputs.push((b.id || b.name) + '=' + !v0);
      await replay();
      b.checked = v0; b.dispatchEvent(new Event('change')); await frames(4);
    }
    // PASS C -- the parts
    const partSels = [...document.querySelectorAll('[data-row] select')].filter(s => s.options && s.options.length > 1);
    if (pending().length && partSels.length){
      const first = [...clipRecs.keys()][0];
      const i = first ? first.indexOf('|') : -1;
      if (first){ const opts = await optionsFor(first.slice(0, i), first.slice(i + 1)); if (opts[0]){ listSel.value = first.slice(0, i); await listSel.onchange(); clipSel.value = opts[0]; await clipSel.onchange(); } }
      V.state.loop = true;
      const v0s = partSels.map(s => s.value);
      for (const s of partSels){
        for (const o of [...s.options]) if (o.value !== s.value){ s.value = o.value; s.dispatchEvent(new Event('change')); await frames(90); }
        inputs.push('part ' + (s.closest('[data-row]').dataset.row) + ' cycled');
      }
      V.state.loop = false;
      // every row on its last option (broken), the not-started clips replayed
      for (const s of partSels){ const o = s.options[s.options.length - 1]; if (o){ s.value = o.value; s.dispatchEvent(new Event('change')); await frames(2); } }
      inputs.push('parts all broken');
      await replay();
      partSels.forEach((s, k) => { s.value = v0s[k]; s.dispatchEvent(new Event('change')); });
      await frames(10);
    }
    // PASS D -- the ground and the quest rank
    for (const id of ['monGroundType', 'monQuestRank', 'monQuestLevel']){
      const s = $(id);
      if (!shown(s)) continue;
      const v0 = s.value;
      for (const o of [...s.options]) if (o.value !== v0){
        if (!pending().length) break;
        s.value = o.value; s.dispatchEvent(new Event('change')); await frames(4);
        inputs.push(id + '=' + o.value);
        await replay();
      }
      s.value = v0; s.dispatchEvent(new Event('change')); await frames(4);
    }
    const rep = V.effectMeterReport();
    V.effectMeter(false);
    const started = new Set(rep.recs.map(r => r.key));
    const never = [...univ.keys()].filter(k => !started.has(k));
    out.push([false, 'REPORT ' + MON, JSON.stringify({ played, inputs, never, universe: univ.size, secs: Math.round((performance.now() - t0) / 1000), tail: rep.tail,
      recs: rep.recs.map(r => ({ k: r.key, efl: r.efl, w: r.when, st: r.starts, live: r.liveFrames, df: r.drawFrames, vf: r.visibleFrames,
        d: r.draws, hid: r.hidden, s: r.samples, lit: r.litSamples, px: r.pixMax, verdict: r.verdict,
        clips: Object.keys(r.clips).slice(0, 4), diag: r.diag, nodraw: r.nodraw })) })]);
  }
  return out;
}
export const pageCheck = census;
export const args = ((typeof process !== 'undefined' && process.env.METER_IDS) ? process.env.METER_IDS : 'em001_00').split(',').map(id => [[id], (typeof process !== 'undefined' && process.env.OPEN_KEYS) ? JSON.parse(process.env.OPEN_KEYS) : null]);
