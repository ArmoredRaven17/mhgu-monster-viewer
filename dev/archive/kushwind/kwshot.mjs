// kushwind/kwshot.mjs (2026-10-27): Kushala side-on (camera on his +x side, so he faces screen-left, as Raven's 2026-10-27 view), L0 M1
// looped, Wind Aura level N, the clock stopped at frame F; the viewer's own render, then canvas.toDataURL in the same task (method as
// <archive>/laneA4/joint1/j1shot.mjs). Also the same frame with the effect runtime suppressed (the body alone) for the diff.
// DBG env: { "items": [{ "level": 3, "frame": 120, "label": "l3", "rule": "cur" | "unit", "zoom": 1.3 }] }
async function kwShot(Pj){
  const P = JSON.parse(Pj || '{}');
  const out = [];
  let mon = 'em024_00';
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  for (const it of P.items){
    try {
      const OW = await import('/render/rom/effect/owner.js'); OW.NODE_CAMERA.off = !!it.old;   // `old`: the node camera (0x9bca30) left out, as before 2026-10-27
      mon = it.mon || 'em024_00';                        // 2026-10-27: any monster (Amatsu, Teostra); `level` = its class control
      V.pose.clock.getDelta = () => 1 / 60;
      if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
      monSel.value = mon; await monSel.onchange(); await frames(5);
      const cs = $('monClassCtl'); if (it.level != null){ cs.value = String(it.level); cs.dispatchEvent(new Event('change')); }
      if (it.ctl2 != null){ const c2 = $('monClassCtl2'); if (c2){ c2.value = String(it.ctl2); c2.dispatchEvent(new Event('change')); } }
      if (it.rage != null){ const st = $('monState'); if (st){ st.value = it.rage ? 'rage' : 'normal'; st.onchange({ target: st }); } }
      await V.effects(false); await V.effects(true);
      await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
      const rt = M.effectRuntimeInstance();
      if (it.rule === 'unit'){
        const um = rt.unitMatrix.bind(rt);
        rt.unitMatrix = o => { um(o); const u = V.unitGamePos(); o.elements[12] = u[0] * 0.01; o.elements[13] = u[1] * 0.01; o.elements[14] = u[2] * 0.01; return o; };
      }
      const L = it.list || '0';                          // Amatsu has no list 0 (lists 1 / 2 / 3)
      if (V.state.list !== L){ listSel.value = L; await listSel.onchange(); }
      V.state.loop = true;
      // the clip: `clip`, else L0 M1's loop, else the first Motion[1] entry, else the first option (Amatsu has no Motion[1]_loop)
      const opts = [...clipSel.options].map(o => o.value);
      const want = it.clip || (opts.includes('Motion[1]_loop') ? 'Motion[1]_loop' : (opts.find(v => /^Motion\[1\]/.test(v)) || opts[0]));
      const other = [...clipSel.options].find(o => o.value !== want);
      if (other){ clipSel.value = other.value; await clipSel.onchange(); await frames(2); }
      clipSel.value = want; await clipSel.onchange();
      await frames(2);
      const C = V.controls, cam = V.camera;
      const d = cam.position.distanceTo(C.target) * (it.zoom || 1.3);
      const tgt = C.target.clone();
      const dir = new cam.position.constructor(...(it.dir || [1, 0.12, 0])).normalize();
      // the camera put in place BEFORE the play runs to the frame: the effect steps read this render's camera as the game's
      // (live.js setGameCamera, before the units step), so a camera moved after the clock stops shows the old camera's placement
      // `freeze`: 'game' keeps the game camera (host.setGameCamera: eye / target / up) at the default view's, 'draw' keeps the draw
      // camera block (host.setCamera: CAM +0x40 / +0x70 / +0xb0) at it -- which camera input moves the particles
      if (it.freeze){
        await frames(3);
        const H = rt.host;
        if (it.freeze === 'game'){ const sg = H.setGameCamera.bind(H); let first = null;
          H.setGameCamera = o => { if (!first) first = JSON.parse(JSON.stringify(o)); sg(Object.assign({}, o, { eye: first.eye, target: first.target, up: first.up })); }; }
        if (it.freeze === 'draw'){ const sc = H.setCamera.bind(H); let first = null;
          H.setCamera = o => { if (!first) first = JSON.parse(JSON.stringify(o)); sc(first); }; }
        await frames(3);
      }
      cam.position.copy(tgt.clone().add(dir.multiplyScalar(d))); C.target.copy(tgt); C.update();
      // `fire`: event records requested once at clip frame `fireAt` (default 0) -- the shared break flash / state puffs (schedule.fire)
      if (it.fire){ let n0 = 0; while (Math.round(V.pose.action.time * 60) < (it.fireAt || 0) && n0++ < 4000) await frames(1);
        for (const [p, k] of it.fire) rt.schedule.fire(p, k); }
      let n = 0; while (Math.round(V.pose.action.time * 60) < it.frame && n++ < 4000) await frames(1);
      V.pose.clock.getDelta = () => 0;
      await frames(3);
      await frames(3);
      const proj = p => { const v = new cam.position.constructor(p[0] / 100, p[1] / 100, p[2] / 100).project(cam); return [Math.round((v.x + 1) * 640), Math.round((1 - v.y) * 400)]; };
      // `only`: draw just these records' requests (the schedule's effects() filtered), to tell which record draws what
      let effects0 = null;
      if (it.only){ const sch = rt.schedule; effects0 = sch.effects;
        sch.effects = function(){ return this.entries.flatMap(e => (e.def.record && it.only.some(([p, k]) => e.def.record.pel === p && e.def.record.key === k)) ? e.requests.flatMap(q => q.effects()) : []); };
        rt.advance = 0; rt.acc = 0; }
      // `draw`: keep only the model draws whose 'cmNNN_NNN#mesh' is listed (live.js syncModels filtered), to tell which mesh draws what
      let sync0 = null;
      if (it.draw){ sync0 = rt.syncModels; rt.syncModels = function(models, ...a){
        const keep = models.filter(d => it.draw.includes(String(d.model).split(String.fromCharCode(92)).pop() + '#' + d.meshIndex));
        return sync0.call(this, keep, ...a); }; }
      V.renderer.render(V.scene, V.camera);
      const url = V.renderer.domElement.toDataURL('image/png');
      if (sync0) rt.syncModels = sync0;
      // the kept draws' CPU screen boxes: each mesh's vertices through its CBWorld rows (game units), then this camera
      const cpu = [];
      if (it.draw) for (const d of (rt.host.modelDraws || [])){
        const short = String(d.model).split(String.fromCharCode(92)).pop();
        if (!it.draw.includes(short + '#' + d.meshIndex)) continue;
        const sc = rt.glb(short), src = sc && rt.meshOf(sc, d.model, d.meshIndex); if (!src) continue;
        const P = src.geometry.attributes.position; let lo = [1e9, 1e9], hi = [-1e9, -1e9];
        for (let i = 0; i < P.count; i++){ const v = [P.getX(i), P.getY(i), P.getZ(i), 1];
          const w = [0, 1, 2].map(r => d.world.slice(4 * r, 4 * r + 4).reduce((a, x, k) => a + x * v[k], 0)); const sp = proj(w);
          lo = [Math.min(lo[0], sp[0]), Math.min(lo[1], sp[1])]; hi = [Math.max(hi[0], sp[0]), Math.max(hi[1], sp[1])]; }
        cpu.push(short + '#' + d.meshIndex + ' t ' + [3, 7, 11].map(k => Math.round(d.world[k])) + ' screen ' + lo.concat(hi).join(',') + ' norm ' + P.normalized + ' ' + P.array.constructor.name);
      }
      if (effects0) rt.schedule.effects = effects0;
      rt.suppressed = true; V.renderer.render(V.scene, V.camera);
      const body = V.renderer.domElement.toDataURL('image/png');
      rt.suppressed = false;
      const m = rt.schedule.host.m, units = [];
      for (const e of rt.schedule.entries) if (e.def.record && (it.only ? it.only.some(([p, k]) => e.def.record.pel === p && e.def.record.key === k) : (e.def.record.pel === 'em024_00u' && [0, 1, 10].includes(e.def.record.key))))
        for (const q of e.requests) if (!q.stopped) for (const u of q.effects()){
          const w = [0x40, 0x44, 0x48].map(o => m.f32(u + o));
          units.push({ key: e.def.record.key, game: w.map(Math.round), screen: proj(w) });
        }
      const jn = {}; for (const g of [0, 3, 5]){ const mm = rt.gameJoints.get(g); if (mm) jn[g] = proj([mm[12], mm[13], mm[14]]); }
      const hm = rt.host.m, GC = rt.host.GAMECAM, v3 = a => [0, 4, 8].map(k => Math.round(hm.f32(a + k)));
      const gcam = GC ? { eye: v3(GC + 0x40), up: [0, 4, 8].map(k => Math.round(hm.f32(GC + 0x50 + k) * 100) / 100), target: v3(GC + 0x60), hunter: v3(rt.host.HUNTER + 0x40) } : null;
      if (it.noImages){ out.push([true, 'SHOT ' + it.label, JSON.stringify({ it, clip: want, cpu, gcam, f: Math.round(V.pose.action.time * 60) })]); V.pose.clock.getDelta = () => 1 / 60; continue; }
      out.push([true, 'SHOT ' + it.label, JSON.stringify({ it, url, body, cpu, gcam, joints: jn, unitScreen: proj(V.unitGamePos()), f: Math.round(V.pose.action.time * 60), units, running: rt.schedule.running,
        prims: rt.stats && rt.stats.prims, failed: rt.failed ? String(rt.failed).slice(0, 160) : null, world: [V.world.position.x, V.world.position.z, V.world.scale.x] })]);
      V.pose.clock.getDelta = () => 1 / 60; OW.NODE_CAMERA.off = false;
    } catch (e){ out.push([false, 'SHOT ' + it.label, JSON.stringify({ error: String(e && e.stack || e).slice(0, 400) })]); }
  }
  $('monClassCtl').value = '0'; $('monClassCtl').dispatchEvent(new Event('change'));
  return out;
}
export const pageCheck = kwShot;
const DBG0 = JSON.parse((typeof process !== 'undefined' && process.env.DBG) || '{}');
export const args = (DBG0.items || []).map(it => [JSON.stringify({ items: [it] })]);
