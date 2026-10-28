// eyeaudit/eyecheck.mjs (eye audit, 2026-10-28; Raven: "Double check the eye effects"): the GU Hyper head aura's eye rows on the page,
// per monster (EYE_IDS, comma list), at each rank the monster's file has (EYE_RANKS, default "3,5": below G = Quest Rank 3, G = 5),
// for EVERY Hyper option that holds the head aura. Nothing about "Effects drawn before" is touched unless EYE_FXPASS is given (the
// default under test is the page's own). Per case:
//   * the meter row of the head record (starts / lit samples / verdict);
//   * the eye rows in the frame's model draws -- HALO = a RevSub blend, CORE = prim colour (4.0, 0.99, *) -- with blend, depth, emit,
//     prim colour, scale, and position in the head joint's frame (game units), sampled at 4 frames while the clip PLAYS;
//   * the eye mesh (materials /eye/i, skinned) centroid L / R in the same frame at the same moments: the core's offset from it, and
//     the drift of the row in the head frame across the samples (0 = rigid on the head joint);
//   * L / R mirror: the pair's x of opposite sign, |x| and y, z equal.
// Close-ups (first option per rank): dev/shots/<EYE_RUN>/<mon>_<rank>_off.png / _on.png, the camera EYE_DIST m in front of the eyes.
//   EYE_IDS=em002_02 sh dev/archive/eyeaudit/run.sh dev/archive/eyeaudit/eyecheck.mjs out.txt
async function check(MON, ranks, distM, run, up, fxPass, shots){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js'), SK = await import('/render/skeleton.js');
  const THREE = V.camera.position.constructor;
  const HA = await (await fetch('/hyper-auras.json')).json();
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id), monSel = $('monSel');
  const r1 = v => Math.round(v * 10) / 10;
  const info = { mon: MON, fxPassState: V.state.fxPass, fxRowInDebug: !!($('debugPanel') && $('debugPanel').contains($('monFxPassRow'))) };
  if (fxPass) V.state.fxPass = fxPass;
  for (const rank of ranks){
    window.__quest.set(rank);
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    if (V.state.id !== MON){ monSel.value = MON; await monSel.onchange(); await frames(120); }
    else await frames(30);
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
    await frames(10);
    const rt = M.effectRuntimeInstance();
    const file = HA[MON] && (rank > 4 ? HA[MON].g : HA[MON].normal);
    const effs = rt.def.effects || [];
    if (!file || !file.auras || !file.auras.length){ out.push([true, 'EYE ' + MON + ' R' + rank, 'no auras in this rank\'s file']); continue; }
    const head = file.auras.find(a => effs.some(e => e.record && e.record.pel === MON + 'u' && e.record.key === a.key && /_500\.efl$/.test(e.efl)));
    if (!head){ out.push([false, 'EYE ' + MON + ' R' + rank, 'no aura with an _500 effect: ' + JSON.stringify(file.auras.map(a => [a.id, a.key, a.part]))]); continue; }
    const sel = $('monHyper');
    const opts = [...sel.options].filter(o => o.value && o.value.split(',').map(Number).includes(head.id));
    const root = V.mounted && V.mounted.main;
    const bone = root && SK.gidBonesOf(root).find(b => b.gid === head.joint);
    if (!bone){ out.push([false, 'EYE ' + MON + ' R' + rank, 'no bone for joint ' + head.joint]); continue; }
    const host = rt.host, orig = host.drawFrame.bind(host);
    let last = null; host.drawFrame = owners => (last = orig(owners));
    const inv = () => { bone.node.updateWorldMatrix(true, false); return bone.node.matrixWorld.clone().invert(); };
    const local = (p, I) => { const v = p.clone().applyMatrix4(I).multiplyScalar(100); return [r1(v.x), r1(v.y), r1(v.z)]; };
    const eyeMesh = () => {
      const I0 = inv(), L = [], R = [], mats = [];
      root.updateWorldMatrix(true, true);
      root.traverse(o => {
        if (!o.isMesh || !o.visible) return;
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        if (!ms.some(m => /eye/i.test(m.name || ''))) return;
        mats.push(ms.map(m => m.name).join('|'));
        const pos = o.geometry.attributes.position, v = new THREE();
        for (let i = 0; i < pos.count; i++){
          if (o.isSkinnedMesh && o.getVertexPosition) o.getVertexPosition(i, v); else v.fromBufferAttribute(pos, i);
          v.applyMatrix4(o.matrixWorld);
          const l = local(v, I0); (l[0] >= 0 ? L : R).push(l);
        }
      });
      const cen = a => a.length ? [0, 1, 2].map(k => r1(a.reduce((s, p) => s + p[k], 0) / a.length)) : null;
      return { L: cen(L), R: cen(R), mats, all: [...L, ...R] };
    };
    const eyeRows = () => {
      const I1 = inv();
      return (last ? last.models : []).filter(d => /RevSub/.test(d.blend || '') || (d.primColor && d.primColor[0] > 3.5 && Math.abs(d.primColor[1] - 0.99) < 0.05))
        .map(d => {
          const w = d.world, p = new THREE(w[3] / 100, w[7] / 100, w[11] / 100);
          return { kind: /RevSub/.test(d.blend) ? 'halo' : 'core', model: (d.model || '').split('\\').pop(), mesh: d.meshIndex, blend: d.blend,
                   gT: r1(+d.globalTransparency), at: local(p, I1), scale: [0, 1, 2].map(c => Math.round(Math.hypot(w[c], w[4 + c], w[8 + c]) * 1000) / 1000),
                   depth: d.depth, emit: d.unsorted ? 'unsorted' : 'sorted', prim: (d.primColor || []).map(x => Math.round(x * 100) / 100) };
        });
    };
    let shotDone = false;
    for (const opt of opts){
      if (V.pose.action) V.pose.action.timeScale = 1;
      V.effectMeter(true, { every: 2 });
      sel.value = opt.value; sel.onchange({ target: sel });
      await frames(40);
      const samples = [];
      for (let s = 0; s < 4; s++){
        await frames(15);
        const em = eyeMesh(), rows = eyeRows();
        samples.push({ frame: V.pose.action ? Math.round(V.pose.action.time * 60) : null, eyeL: em.L, eyeR: em.R, rows, mats: em.mats });
      }
      const rep = V.effectMeterReport();
      V.effectMeter(false);
      const meter = rep.recs.filter(r => r.key === MON + '|' + MON + 'u|' + head.key + '|event')
        .map(r => ({ st: r.starts, live: r.liveFrames, lit: r.litSamples, s: r.samples, px: r.pixMax, verdict: r.verdict }));
      // the analysis: per row index (by order within the frame), its drift in the head frame; cores vs the eye centroid; the mirror
      const S0 = samples[0], n = S0.rows.length;
      const sameCount = samples.every(s => s.rows.length === n);
      const drift = sameCount ? S0.rows.map((r, i) => r1(Math.max(...samples.map(s => Math.hypot(...[0, 1, 2].map(k => s.rows[i].at[k] - r.at[k])))))) : null;
      const cores = S0.rows.filter(r => r.kind === 'core'), halos = S0.rows.filter(r => r.kind === 'halo');
      const near = (r, s) => { const c = r.at[0] >= 0 ? s.eyeL : s.eyeR; return c ? r1(Math.hypot(...[0, 1, 2].map(k => r.at[k] - c[k]))) : null; };
      const coreOff = samples.map(s => s.rows.filter(r => r.kind === 'core').map(r => near(r, s)));
      const mirror = (list) => { const L = list.filter(r => r.at[0] >= 0), R = list.filter(r => r.at[0] < 0);
        return L.length === R.length ? L.map((a, i) => { const b = R.slice().sort((p, q) => Math.hypot(p.at[1] - a.at[1], p.at[2] - a.at[2]) - Math.hypot(q.at[1] - a.at[1], q.at[2] - a.at[2]))[0];
          return r1(Math.hypot(a.at[0] + b.at[0], a.at[1] - b.at[1], a.at[2] - b.at[2])); }) : 'L ' + L.length + ' / R ' + R.length; };
      const res = { rank, file: file.file, head: { id: head.id, key: head.key, part: head.part, joint: head.joint }, option: opt.textContent, value: opt.value,
                    clip: V.state.list + '|' + V.state.clip, framePass: host.framePass, fxPass: V.state.fxPass, meter,
                    nCore: cores.length, nHalo: halos.length, mirrorCore: mirror(cores), mirrorHalo: mirror(halos), drift, coreOffFromEyeCentroid: coreOff,
                    eyeMats: S0.mats, eyeL: S0.eyeL, eyeR: S0.eyeR, rows0: S0.rows, frames: samples.map(s => s.frame) };
      if (shots && !shotDone){
        shotDone = true;
        // close-up: hyper ON (this option), then OFF
        const em = eyeMesh();
        const headW = new THREE().setFromMatrixPosition(bone.node.matrixWorld);
        const aim = async () => {
          const e2 = eyeMesh(); let eyeW = new THREE().setFromMatrixPosition(bone.node.matrixWorld);
          if (e2.all.length){ const c = [0, 1, 2].map(k => e2.all.reduce((s, p) => s + p[k], 0) / e2.all.length); eyeW = new THREE(c[0] / 100, c[1] / 100, c[2] / 100).applyMatrix4(bone.node.matrixWorld); }
          const hw = new THREE().setFromMatrixPosition(bone.node.matrixWorld);
          const fwd = eyeW.clone().sub(hw); fwd.y = 0; if (fwd.length() < 1e-6) fwd.set(0, 0, 1); fwd.normalize();
          const C = V.controls, cam = V.camera;
          C.target.copy(eyeW); cam.position.copy(eyeW.clone().add(fwd.multiplyScalar(distM))); cam.position.y += distM * up; C.update(); await frames(2);
        };
        try { await V.shot(run, MON + '_R' + rank + '_on'); await aim(); await V.shot(run, MON + '_R' + rank + '_on'); res.onShot = 'ok'; } catch (e){ res.onShot = 'failed ' + e.message; }
        if (V.pose.action) V.pose.action.timeScale = 1;
        sel.value = ''; sel.onchange({ target: sel }); await frames(30);
        try { await V.shot(run, MON + '_R' + rank + '_off'); res.offShot = 'ok'; } catch (e){ res.offShot = 'failed ' + e.message; }
        if (V.pose.action) V.pose.action.timeScale = 1;
      }
      const okMeter = meter.length === 1 && meter[0].verdict === 'draws';
      out.push([okMeter, 'EYE ' + MON + ' R' + rank + ' [' + opt.textContent + ']', JSON.stringify(res)]);
      sel.value = ''; sel.onchange({ target: sel }); await frames(10);
    }
    host.drawFrame = orig;
  }
  out.unshift([info.fxPassState === 'node' && info.fxRowInDebug, 'FRESH ' + MON, JSON.stringify(info)]);
  return out;
}
export const pageCheck = check;
const E = k => (typeof process !== 'undefined' && process.env[k]) || '';
export const args = (E('EYE_IDS') || 'em002_02').split(',').map(id => [id, (E('EYE_RANKS') || '3,5').split(',').map(Number), +(E('EYE_DIST') || 2.2),
  E('EYE_RUN') || 'eyeaudit', +(E('EYE_UP') || 0.1), E('EYE_FXPASS') || null, E('EYE_SHOTS') !== '0']);
