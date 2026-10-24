// metersurvey.mjs (run-check.mjs; METER_IDS=em001_00,em002_00 picks the monsters): THE DRAW METER over every clip that carries
// records -- CLIP_EFFECTS bits (the body's and the attached arms' lists), MOTION_STATES rows, the shells' actions and their partner
// clips -- on every runtime the page makes (the body's, Seltas's on the Queen, Nakarkos's arms), calm, then a short enraged pass
// for the rage records. Camera pulled back 2.5x from the fitted view so travelling effects stay in frame. One REPORT line per
// monster with the meter's rows (printed as a FAIL line so run-check shows its detail).
async function meterSurvey(ids, rank){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js'), MS = await import('/render/motion-states.js'), SH = await import('/render/shells.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  if (rank != null && window.__quest) window.__quest.set(rank, null);
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  // the State dropdown's enraged option, else the Enraged switch (dev/checks/class-toggles.mjs setRage)
  const setRage = async on => {
    const st = document.getElementById('monState'), opts = st ? [...st.options] : [];
    const o = on ? (opts.find(x => x.value === 'rage') || opts.find(x => /^(rung|lv):/.test(x.value) && x.value !== 'lv:0'))
                 : (opts.find(x => x.value === 'normal') || opts.find(x => x.value === 'lv:0'));
    if (o && !document.getElementById('monStateRow').hidden){ st.value = o.value; st.onchange({ target: st }); }
    else { const b = document.getElementById('monRage'); b.checked = on; b.onchange({ target: b }); }
    await frames(2);
  };
  for (const MON of ids){
    const t0 = performance.now();
    const ent = V.MON.monsters.find(e => e.id === MON);
    if (!ent){ out.push([false, 'REPORT ' + MON, JSON.stringify({ error: 'no such monster' })]); continue; }
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    const up = await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
    if (!up){ out.push([false, 'REPORT ' + MON, JSON.stringify({ error: 'no runtime' })]); continue; }
    // the camera: back along its line to 2.5x the fitted distance
    const C = V.controls, cam = V.camera;
    cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
    // the clips with records
    const want = new Map();     // 'list|clip base' -> true
    const add = (l, c) => { if (l != null && c) want.set(String(l) + '|' + String(c).replace(/_(start|loop)$/, '').replace(/#.*$/, ''), true); };
    for (const id of [MON, MON + '_left', MON + '_right'])
      for (const k of Object.keys((M.CLIP_EFFECTS || {})[id] || {})){ const m = /^L(\S+) (.+)$/.exec(k); if (m) add(m[1], m[2]); }
    for (const k of Object.keys((MS.MOTION_STATES || {})[MON] || {})){ const [l, c] = k.split('|'); add(l, c); }
    const sd = (SH.SHELL_DATA || {})[MON];
    for (const a of Object.values((sd && sd.actions) || {})){ add(a.list, a.clip); for (const p of a.partners || []) add(a.list, p); }
    for (const l of ent.lists || []) if (String(l.id) === 'duo') for (const c of l.clips) add('duo', c.clip);
    const lists = new Map((ent.lists || []).map(l => [String(l.id), l]));
    V.state.loop = false;
    await setRage(false);
    V.effectMeter(true, { every: 5 });
    let played = 0, missing = [];
    const playClip = async (l, base, n) => {
      const L = lists.get(l);
      const c = L && (L.clips.find(x => x.clip === base) || L.clips.find(x => x.clip === base + '_start') || L.clips.find(x => x.clip === base + '_loop'));
      if (!c){ missing.push(l + '|' + base); return; }
      if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); }
      const o = [...clipSel.options].find(x => x.value === c.clip);
      if (!o){ missing.push(l + '|' + base + ' (menu)'); return; }
      clipSel.value = o.value; await clipSel.onchange();
      await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 200);
      const sib = L.clips.find(x => x.clip === base + '_loop');
      await frames(n || Math.min(420, Math.round((c.dur + (sib && sib !== c ? sib.dur : 0)) * 60) + 30));
      played++;
    };
    for (const k of want.keys()){ const i = k.indexOf('|'); await playClip(k.slice(0, i), k.slice(i + 1)); }
    // enraged: the rage records run over any clip -- two clips' worth
    {
      await setRage(true);
      const first = [...want.keys()].slice(0, 2);
      for (const k of first){ const i = k.indexOf('|'); await playClip(k.slice(0, i), k.slice(i + 1), 200); }
      await setRage(false);
    }
    const rep = V.effectMeterReport();
    V.effectMeter(false);
    out.push([false, 'REPORT ' + MON, JSON.stringify({ played, missing, secs: Math.round((performance.now() - t0) / 1000), tail: rep.tail,
      recs: rep.recs.map(r => ({ k: r.key, efl: r.efl, w: r.when, st: r.starts, live: r.liveFrames, df: r.drawFrames, vf: r.visibleFrames,
        d: r.draws, v: r.verts, hid: r.hidden, s: r.samples, lit: r.litSamples, px: r.pixMax, pm: Math.round(r.pixMean), verdict: r.verdict,
        clips: Object.keys(r.clips).slice(0, 4), diag: r.diag, nodraw: r.nodraw })) })]);
  }
  return out;
}
export const pageCheck = meterSurvey;
// one page call per monster (run-check gives each call 20 minutes)
export const args = ((typeof process !== 'undefined' && process.env.METER_IDS) ? process.env.METER_IDS : 'em001_00').split(',').map(id => [[id], (typeof process !== 'undefined' && process.env.MS_RANK != null) ? +process.env.MS_RANK : null]);
