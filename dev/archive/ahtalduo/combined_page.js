// AHTAL-KA + AHTAL-NESET, the combined list on the page (dev/em088-em087-combined-spec.md 6): runs IN THE PAGE (serialised by
// combined_probe.mjs). For each combined entry: plays it once at one 1/60 s frame a render, samples the coupling every 10 frames
// (both models drawn or not, Neset's frame in Ka's world group, his clip and frame on his effect runtime, Ka's thread slots: on /
// off / missing), and at the end the draw meter's rows of BOTH runtimes (Ka's and Neset's partner runtime): starts and draws apart.
// Also LIFT: Neset's raw L0 M9 played under the shells' (1, 8) pick, the life of his shell57 b6 lift (the (1, 8) wait).
function pageRun(ONLY, LIFT){
  window.__play = { status: 'starting', out: [], warns: [] };
  (async () => {
    const P = window.__play;
    try {
      const V = window.__view, M = await import('/render/monster.js'), EM = await import('/render/rom/effect-mounts.js');
      const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
      const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
      V.pose.clock.getDelta = () => 1 / 60;
      const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
      const pick = async MON => { if (V.state.id !== MON){ if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON)); monSel.value = MON; await monSel.onchange(); } };
      const e0 = window.__errors.length;
      if (LIFT){
        // Neset alone, raw L0 M9: the shells' pick rotates per play ((1, 0x15), then (1, 8)); log every shell57 by its life
        await pick('em087_00');
        await V.effects(false); await V.effects(true);
        await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === 'em087_00', 900);
        V.state.loop = false;
        for (let play = 0; play < 2; play++){
          listSel.value = '0'; await listSel.onchange();
          clipSel.value = 'Motion[9]'; await clipSel.onchange();
          await until(() => V.pose.action && V.pose.action.getClip().name === 'Motion[9]', 300);
          const fx = M.effectRuntimeInstance(), seen = new Map();
          for (let f = 0; f < 700; f++){
            await frames(1);
            const sh = fx.schedule.shells ? fx.schedule.shells.state.shells : [];
            for (const s of sh) if (s.base === 'base57'){
              const k = s.id != null ? s.id : s;
              const r = seen.get(k) || { mode: s.modeIndex != null ? s.modeIndex : s.mode, obj: s.obj, behaviour: s.behaviour, first: f, states: {} };
              r.states[s.state] = (r.states[s.state] || 0) + 1; r.last = f; seen.set(k, r);
            }
          }
          const ri = V.rockInput ? V.rockInput() : null;
          P.out.push({ lift: play, variant: ri && ri.variant, shells: [...seen.values()] });
        }
      }
      await pick('em088_00');
      P.out.push({ mounted: !!V.mounted.main, id: V.state.id });
      await V.effects(false); await V.effects(true);
      await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === 'em088_00', 900);
      const L = (V.state && (V.MON.monsters.find(m => m.id === 'em088_00').lists || [])).find(l => l.id === 'neset');
      P.out.push({ list: L ? { label: L.label, clips: L.clips.map(c => [c.clip, Math.round(c.dur * 60)]) } : null,
                   raw: V.MON.monsters.find(m => m.id === 'em088_00').lists.map(l => l.id) });
      if (!L) throw new Error('no combined list');
      V.state.loop = false;
      for (const c of L.clips){
        if (ONLY && !c.clip.includes(ONLY)) continue;
        V.effectMeter(true, { every: 3 });
        if (V.state.list !== 'neset'){ listSel.value = 'neset'; await listSel.onchange(); }
        clipSel.value = c.clip; await clipSel.onchange();
        await until(() => V.pose.action && V.pose.action.getClip().name === c.clip, 600);
        await until(() => V.mounted.em087_00, 600);
        const F = Math.round(c.dur * 60), samples = [], slots = new Map();
        for (let i = 0; i < 6000; i++){
          await frames(1);
          const t = V.pose.action ? Math.round(V.pose.action.time * 60) : -1;
          const rt = M.effectRuntimeInstance(), prt = EM.partnerEffectRuntime();
          const ts = rt && rt.schedule && rt.schedule.threadState ? rt.schedule.threadState() : null;
          if (ts) for (const s of ts.on) slots.set('u ' + s.key, (slots.get('u ' + s.key) || 0) + 1);
          if (ts) for (const m of ts.missing) slots.set('MISSING ' + m.replace(/\(slot \d+\)/, ''), (slots.get('MISSING ' + m.replace(/\(slot \d+\)/, '')) || 0) + 1);
          if (i % 10 === 0){
            const g = V.mounted.em087_00, hm = V.mounted.main;
            let np = null;
            if (g){ g.updateWorldMatrix(true, false); const b = g.getObjectByProperty('isBone', true); if (b){ b.updateWorldMatrix(true, false); const e = b.matrixWorld.elements; np = [e[12], e[13], e[14]].map(x => +(x / 0.01).toFixed(0)); } }
            const pc = prt && prt.schedule && prt.schedule.clip;
            samples.push({ t, kaHidden: !!(hm && hm.userData.alphaHid088), nesetHidden: !!(g && g.userData.alphaHid088), nesetRoot: np,
                           neset: pc && pc.key ? pc.key.split('|').slice(1).join('|') + '@' + (+pc.frame).toFixed(1) : null,
                           threads: ts ? ts.on.map(s => s.key).join(',') : '', off: ts ? ts.off.map(o => o.key).join(',') : '' });
          }
          if (t >= F - 1 || (V.pose.action && V.pose.action.paused && t > 10)) break;
        }
        await frames(4);
        const rep = V.effectMeterReport().recs.map(r => ({ key: r.key, starts: r.starts, draws: r.draws, drawFrames: r.drawFrames, visible: r.visibleFrames,
          lit: r.litSamples + '/' + r.samples, pixMax: r.pixMax, verdict: r.verdict, hidden: r.hidden }));
        P.out.push({ entry: c.clip, frames: F, slots: Object.fromEntries(slots), samples: samples.filter((s, i) => i % 3 === 0 || i === samples.length - 1), meter: rep });
        V.effectMeter(false);
      }
      P.out.push({ errors: window.__errors.slice(e0) });
      P.status = 'done';
    } catch (e){ P.status = 'error: ' + (e && e.stack || e); }
  })();
  return 'started';
}
// one entry posed at one frame, for a screenshot (combined_probe.mjs --shots): the camera framed on both models
async function pagePose(SUB, F, TOP){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (V.state.id !== 'em088_00'){ if (![...monSel.options].some(o => o.value === 'em088_00')) monSel.add(new Option('em088_00', 'em088_00')); monSel.value = 'em088_00'; await monSel.onchange(); }
  if (V.state.list !== 'neset'){ listSel.value = 'neset'; await listSel.onchange(); }
  const o = [...clipSel.options].find(x => x.value.includes(SUB));
  if (V.state.clip !== o.value){ clipSel.value = o.value; await clipSel.onchange(); }
  await until(() => V.pose.action && V.pose.action.getClip().name === o.value && V.mounted.em087_00, 600);
  V.pose.action.paused = true; V.pose.action.time = F / 60; V.pose.mixer.update(0);
  await frames(3);
  // frame both: the box of every mounted root
  const THREE = await import('three');
  const box = new THREE.Box3();
  for (const g of [V.mounted.main, V.mounted.em087_00]) if (g) box.expandByObject(g);
  const c = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length() * 0.6;
  V.controls.target.copy(c); if (TOP) V.camera.position.set(c.x, c.y + r * 1.4, c.z + 0.01); else V.camera.position.set(c.x + r * 0.9, c.y + r * 0.5, c.z + r * 0.9); V.camera.far = Math.max(V.camera.far, r * 10); V.camera.updateProjectionMatrix(); V.controls.update();
  await frames(3);
  return JSON.stringify({ clip: o.value, t: Math.round(V.pose.action.time * 60), box: [box.min.toArray().map(x => +x.toFixed(1)), box.max.toArray().map(x => +x.toFixed(1))] });
}
// a raw clip's unit travel, frame by frame (V.unitGamePos: the clip origin through the world group plus the `reference` track's point, in
// game units) -- the |P+0x320| the turn step 0x77d28 and the arrival 0x78b78 accumulate (combined_probe.mjs --travel L:clip:n)
async function pageTravel(MON, L, C, N){
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (V.state.id !== MON){ if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON)); monSel.value = MON; await monSel.onchange(); }
  V.state.anchor = false;
  listSel.value = L; await listSel.onchange();
  const o = [...clipSel.options].find(x => x.value === C) || [...clipSel.options].find(x => x.value === C + '_start');
  clipSel.value = o.value; await clipSel.onchange();
  await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 600);
  V.pose.anchorXZ = false;
  const out = [];
  for (let f = 0; f <= N; f++){
    V.pose.action.paused = true; V.pose.action.time = f / 60; V.pose.mixer.update(0); if (V.pose.anchorProxy) V.pose.anchorProxy();
    await frames(1);
    out.push(V.unitGamePos().map(x => +x.toFixed(2)));
  }
  let acc = 0; const cum = [0];
  for (let i = 1; i < out.length; i++){ const d = Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1], out[i][2] - out[i - 1][2]); acc += d; cum.push(+acc.toFixed(1)); }
  return JSON.stringify({ clip: o.value, first: out[0], last: out[out.length - 1], cum });
}
// the frames around a piece boundary of an entry, as the page plays it (combined_probe.mjs --edge sub:from:to): the host's raw time x 60
// and his partner runtime's clip and frame -- for the shells lane's (1, 8)-at-302 report (dev/archive/gapT/probe2.out)
async function pageEdge(SUB, A, B){
  const V = window.__view, EM = await import('/render/rom/effect-mounts.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (V.state.id !== 'em088_00'){ if (![...monSel.options].some(o => o.value === 'em088_00')) monSel.add(new Option('em088_00', 'em088_00')); monSel.value = 'em088_00'; await monSel.onchange(); }
  await V.effects(false); await V.effects(true);
  V.state.loop = false;
  if (V.state.list !== 'neset'){ listSel.value = 'neset'; await listSel.onchange(); }
  const o = [...clipSel.options].find(x => x.value.includes(SUB));
  clipSel.value = o.value; await clipSel.onchange();
  await until(() => V.pose.action && V.pose.action.getClip().name === o.value && V.mounted.em087_00, 600);
  await until(() => EM.partnerEffectRuntime() && EM.partnerEffectRuntime().schedule, 600);
  const out = [];
  for (let i = 0; i < 3000; i++){
    await frames(1);
    const raw = V.pose.action.time * 60, c = EM.partnerEffectRuntime().schedule.clip;
    if (raw >= A && raw <= B) out.push([+raw.toFixed(5), c && c.key ? c.key.split('|').slice(1).join('|') + '@' + (+c.frame).toFixed(3) : null]);
    if (raw > B) break;
  }
  return JSON.stringify(out);
}
