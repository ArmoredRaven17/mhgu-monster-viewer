// hypereye/eyepage.mjs (hyper-eye lane, 2026-10-27): the GU Hyper HEAD aura's eye rows on the page, per monster (EYE_IDS env, comma
// list). The pose is held at the clip's frame 0 (__view.shot holds it), the head aura (the docs/hyper-auras.json aura whose record is
// an _500 effect on the head part) is switched on through the Hyper dropdown, and the runtime's draw list is captured (host.drawFrame
// wrapped): every model draw's world position, in the head joint's frame in game units (the bone's world matrix inverted, x 100),
// beside the eye mesh's vertices (materials named *eye*, skinned, same frame), split left / right by the sign of local x. Then the
// camera is put in front of the eyes (along joint -> eye centroid) and shots are taken hyper off and on
// (dev/shots/hypereye/<id>_off.png / _on.png), and the draw meter's row for the head record is printed (starts, lit samples).
//   EYE_IDS=em002_00,em043_00 sh dev/archive/hypereye/run.sh dev/archive/hypereye/eyepage.mjs out.txt
async function check(ids, distM, run, up = 0.15, fxPass = 'none'){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js'), SK = await import('/render/skeleton.js');
  const THREE = V.camera.position.constructor;      // Vector3
  const HA = await (await fetch('/hyper-auras.json')).json();
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id), monSel = $('monSel');
  const r1 = v => Math.round(v * 10) / 10;
  for (const MON of ids){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange(); await frames(120);
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
    const rt = M.effectRuntimeInstance();
    const file = HA[MON] && (V.state && HA[MON].g ? HA[MON].g : HA[MON].normal) || (HA[MON] && (HA[MON].normal || HA[MON].g));
    const effs = rt.def.effects || [];
    const head = file && file.auras.find(a => effs.some(e => e.record && e.record.pel === MON + 'u' && e.record.key === a.key && /_500\.efl$/.test(e.efl)));
    if (!head){ out.push([false, 'EYE ' + MON, 'no aura with an _500 effect']); continue; }
    const sel = $('monHyper');
    const opt = [...sel.options].find(o => o.value && o.value.split(',').map(Number).includes(head.id));
    const root = V.mounted && V.mounted.main;
    const bone = root && SK.gidBonesOf(root).find(b => b.gid === head.joint);
    if (!bone){ out.push([false, 'EYE ' + MON, 'no bone for joint ' + head.joint]); continue; }
    // hold the pose (frame 0 of the playing clip) the way a shot does
    await V.shot(run, MON + '_pose');
    // capture the draw list
    const host = rt.host, orig = host.drawFrame.bind(host);
    let last = null; host.drawFrame = owners => (last = orig(owners));
    const inv = () => { bone.node.updateWorldMatrix(true, false); return bone.node.matrixWorld.clone().invert(); };
    const local = (p, I) => { const v = p.clone().applyMatrix4(I).multiplyScalar(100); return [r1(v.x), r1(v.y), r1(v.z)]; };
    // eye vertices
    const eyes = { L: [], R: [], mats: [] };
    const I0 = inv();
    root.updateWorldMatrix(true, true);
    root.traverse(o => {
      if (!o.isMesh || !o.visible) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (!mats.some(m => /eye/i.test(m.name || ''))) return;
      eyes.mats.push(mats.map(m => m.name).join('|'));
      const pos = o.geometry.attributes.position, v = new THREE();
      for (let i = 0; i < pos.count; i++){
        if (o.isSkinnedMesh && o.getVertexPosition) o.getVertexPosition(i, v); else v.fromBufferAttribute(pos, i);
        v.applyMatrix4(o.matrixWorld);
        const l = local(v, I0); (l[0] >= 0 ? eyes.L : eyes.R).push(l);
      }
    });
    const cen = a => a.length ? [0, 1, 2].map(k => r1(a.reduce((s, p) => s + p[k], 0) / a.length)) : null;
    const box = a => a.length ? [[0, 1, 2].map(k => Math.min(...a.map(p => p[k]))), [0, 1, 2].map(k => Math.max(...a.map(p => p[k])))] : null;
    const eyeC = [cen(eyes.L), cen(eyes.R)];
    // aim: in front of the eyes, along joint -> eye centroid (world)
    const all = [...eyes.L, ...eyes.R];
    const headW = new THREE().setFromMatrixPosition(bone.node.matrixWorld);
    let eyeW = headW.clone();
    if (all.length){ const c = cen(all); eyeW = new THREE(c[0] / 100, c[1] / 100, c[2] / 100).applyMatrix4(bone.node.matrixWorld); }
    const aim = async (back) => {
      const fwd = eyeW.clone().sub(headW); if (fwd.length() < 1e-6) fwd.set(0, 0, 1); fwd.normalize();
      const C = V.controls, cam = V.camera;
      C.target.copy(eyeW); cam.position.copy(eyeW.clone().add(fwd.multiplyScalar(back))); cam.position.y += back * up; C.update(); await frames(2);
    };
    await aim(distM);
    // the eyes on screen (the shot's pixels): each side's centroid projected through this camera
    const W = V.renderer.domElement.width, Hh = V.renderer.domElement.height;
    const eyeScreen = eyeC.map(c => { if (!c) return null; const v = new THREE(c[0] / 100, c[1] / 100, c[2] / 100).applyMatrix4(bone.node.matrixWorld).project(V.camera);
                                      return [Math.round((v.x + 1) / 2 * W), Math.round((1 - v.y) / 2 * Hh)]; });
    let offShot = null; try { await V.shot(run, MON + '_off'); offShot = 'ok'; } catch (e){ offShot = 'failed ' + e.message; }
    // the effects step on the ANIMATION's advance (index.html driveClipEffects: rt.advance = animAdvance()): the clip has to run
    // while the aura plays; each shot puts the pose back on frame 0 for the picture
    if (V.pose.action) V.pose.action.timeScale = 1;
    // the "Effects drawn before" input (EYE_FXPASS: none = 0x15, the default / node = 0x11); the shots are named by it
    V.state.fxPass = fxPass;
    V.effectMeter(true, { every: 2 });
    if (opt){ sel.value = opt.value; sel.onchange({ target: sel }); }
    await frames(90);
    const rep = V.effectMeterReport();
    V.effectMeter(false);
    // the shot puts the pose back on frame 0; a clip that travels moved the camera's follow meanwhile: shoot once, aim, shoot
    let onShot = null; try { await V.shot(run, MON + '_on_' + fxPass); await aim(distM); await V.shot(run, MON + '_on_' + fxPass); onShot = 'ok'; } catch (e){ onShot = 'failed ' + e.message; }
    const I1 = inv();
    const draws = (last ? last.models : []).map(d => {
      const w = d.world, p = new THREE(w[3] / 100, w[7] / 100, w[11] / 100);
      return { model: d.model.split('\\').pop(), mesh: d.meshIndex, blend: d.blend, gT: r1(+d.globalTransparency), at: local(p, I1),
               scale: [0, 1, 2].map(c => r1(Math.hypot(w[c], w[4 + c], w[8 + c]))), depth: d.depth, emit: d.unsorted ? 'unsorted' : 'sorted' };
    });
    host.drawFrame = orig;
    const rows = rep.recs.filter(r => r.key === MON + '|' + MON + 'u|' + head.key + '|event')
      .map(r => ({ st: r.starts, live: r.liveFrames, lit: r.litSamples, s: r.samples, px: r.pixMax, verdict: r.verdict }));
    sel.value = ''; sel.onchange({ target: sel }); V.state.fxPass = 'none';
    out.push([rows.length === 1 && rows[0].verdict === 'draws', 'EYE ' + MON,
              JSON.stringify({ head: { id: head.id, key: head.key, part: head.part, joint: head.joint }, option: opt ? opt.textContent : null,
                               clip: V.state.clip, eyeMats: eyes.mats, eyeL: eyeC[0], eyeR: eyeC[1], eyeBoxL: box(eyes.L), eyeBoxR: box(eyes.R), eyeScreen, size: [W, Hh], framePass: rt.host.framePass,
                               draws, offShot, onShot, rows })]);
  }
  return out;
}
export const pageCheck = check;
export const args = [[((typeof process !== 'undefined' && process.env.EYE_IDS) || 'em002_00').split(','),
                      +((typeof process !== 'undefined' && process.env.EYE_DIST) || 3),
                      (typeof process !== 'undefined' && process.env.EYE_RUN) || 'hypereye',
                      +((typeof process !== 'undefined' && process.env.EYE_UP) || 0.15),
                      (typeof process !== 'undefined' && process.env.EYE_FXPASS) || 'none']];
