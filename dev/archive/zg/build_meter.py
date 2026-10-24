# build_meter.py: live.js -- the draw meter (2026-10-19): per started record, what it puts on screen
import io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\rom\effect\live.js'
t = io.open(P, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in t else '\n'
def rep(a, b):
    global t
    a2, b2 = a.replace('\n', nl), b.replace('\n', nl)
    assert t.count(a2) == 1, (t.count(a2), a[:70])
    t = t.replace(a2, b2)

# 1. the module-level meter
rep("let depthPasses = 0;\n", r"""let depthPasses = 0;

// ---- THE DRAW METER (opt-in; effect-mounts.js __view.effectMeter, dev/effect-runtime-engine.md E16) --------------------------
// A check that a record STARTED and was NOT REFUSED says nothing about whether it DRAWS (Raven, 2026-10-19: "at times you've
// said things passed testing but then no effects were present"). The meter measures, per record (monster | pel | key | when)
// over all its requests and every runtime (the body's, a partner's, an arm's):
//   * starts -- requests first seen running, and the clip each started on;
//   * the draws its units submitted, each frame (host.drawFrame attributes the three lists to the unit whose drawEffect added
//     them): primitive batches, GPU particle draws, model particle draws, their vertices;
//   * whether each draw got a VISIBLE mesh, and if not why (a texture not loaded, a technique not drawn, a program not linked,
//     a model glb missing): the viewer-side draw gates;
//   * every `every`-th frame, the PIXELS it lights by itself: only its meshes, rendered from this camera into a cleared RGBA8
//     target and read back -- a pixel counts when any channel is above 2/255. A draw with no lit pixel is caught here (off
//     screen, at zero scale, at zero alpha, behind the camera).
// The first sample that has visible meshes and lights nothing keeps a snapshot (blend, depth, textures, vertex count, the first
// vertex's floats) for the diagnosis.
const METER = { on: false, every: 10, recs: new Map(), seen: new WeakSet(), tail: 0 };
export function setEffectMeter(on, opts = {}){
  METER.on = !!on;
  if (opts.every) METER.every = opts.every | 0;
  if (opts.reset !== false && on){ METER.recs = new Map(); METER.seen = new WeakSet(); METER.tail = 0; }
}
export function effectMeterReport(){
  return { every: METER.every, tail: METER.tail, recs: [...METER.recs.values()].map(s => Object.assign({}, s, {
    pixMean: s.samples ? s.pixSum / s.samples : 0,
    verdict: !s.starts && !s.liveFrames ? 'never live' : !s.drawFrames ? 'live, no draw' : !s.visibleFrames ? 'draws, no visible mesh'
           : !s.litSamples ? (s.samples ? 'visible meshes, no lit pixel' : 'not sampled') : 'draws' })) };
}
""")
# 2. the per-frame hook, before the effect scene renders
rep("    this.order(gpu, prims, models);\n", "    this.order(gpu, prims, models);\n    if (METER.on) this.meterFrame(renderer, camera, prims, gpu, models);\n")
# host: attribution only while the meter runs
rep("    const { prims, models, gpu } = this.host.drawFrame(effects);\n",
    "    this.host.meterOn = METER.on;\n    const { prims, models, gpu } = this.host.drawFrame(effects);\n")
# 3. the methods, before the scene depth
rep("  // THE SCENE DEPTH. Both programs fade", r"""  // the draw meter's frame (METER above): attribute this frame's draws to records, sample the pixels each lights alone
  meterFrame(renderer, camera, prims, gpu, models){
    const own = this.host.drawOwners;
    if (!own) return;
    this.meterN = (this.meterN | 0) + 1;
    const mon = this.monsterId || '?', clip = this.schedule.clip && this.schedule.clip.key;
    const recOf = e => {
      const r = e.def.record, k = mon + '|' + (r ? r.pel + '|' + r.key + '|' + e.when : 'plain|' + (e.def.efl || '?'));
      let s = METER.recs.get(k);
      if (!s) METER.recs.set(k, s = { key: k, monster: mon, efl: String(e.def.efl || '').split('/').pop(), when: e.when, starts: 0, clips: {},
        liveFrames: 0, drawFrames: 0, visibleFrames: 0, draws: { prims: 0, gpu: 0, models: 0 }, verts: 0, hidden: {},
        samples: 0, litSamples: 0, pixMax: 0, pixSum: 0, diag: null, partner: !!this.partner });
      return s;
    };
    const items = new Map(), byUnit = new Map();
    for (const e of this.schedule.entries){
      const reqs = e.def.record ? e.requests : [{ plain: e.owner }];
      for (const q of reqs){
        const units = q.plain ? [q.plain] : q.effects();
        if (!units.length) continue;                           // nothing of it is running (ended, or never made an effect)
        const s = recOf(e);
        if (!q.plain && !METER.seen.has(q)){ METER.seen.add(q); s.starts++; if (clip) s.clips[clip] = (s.clips[clip] || 0) + 1; }
        const it = { s, draws: 0, meshes: [], verts: 0 };
        items.set(q, it);
        for (const u of units) byUnit.set(u >>> 0, it);
      }
    }
    const take = (it, list, [a, b], kind) => {
      for (let k = a; k < b; k++){
        const d = list[k];
        it.draws++; it.s.draws[kind]++; it.verts += d.vertices || 0; it.s.verts += d.vertices || 0;
        if (d.meterMesh && d.meterMesh.visible) it.meshes.push(d.meterMesh);
        else { const why = d.meterHidden || 'no mesh'; it.s.hidden[why] = (it.s.hidden[why] || 0) + 1; }
        if (!it.d0) it.d0 = d;
      }
    };
    for (const o of own.units){
      const it = byUnit.get(o.unit);
      if (!it) continue;
      take(it, models, o.models, 'models'); take(it, prims, o.prims, 'prims'); take(it, gpu, o.gpu, 'gpu');
    }
    METER.tail += (own.tail.models[1] - own.tail.models[0]) + (own.tail.prims[1] - own.tail.prims[0]) + (own.tail.gpu[1] - own.tail.gpu[0]);
    const sample = this.meterN % METER.every === 0;
    for (const it of items.values()){
      const s = it.s;
      s.liveFrames++;
      if (it.draws) s.drawFrames++;
      if (it.meshes.length) s.visibleFrames++;
      if (!sample) continue;
      const px = it.meshes.length ? this.meterPixels(renderer, camera, it.meshes) : 0;
      s.samples++; s.pixSum += px; if (px > s.pixMax) s.pixMax = px; if (px) s.litSamples++;
      if (!px && it.meshes.length && !s.diag && it.d0){
        const d = it.d0, f = d.vertexBytes && d.vertexBytes.length >= 16 ? Array.from(new Float32Array(d.vertexBytes.buffer.slice(0, Math.min(64, d.vertexBytes.length & ~3)))) : null;
        s.diag = { frame: this.meterN, clip, draws: it.draws, verts: it.verts, blend: d.blend, depth: d.depth, textures: d.textures,
                   technique: d.technique || d.inputLayout || d.model, firstFloats: f && f.map(x => Math.round(x * 1000) / 1000) };
      }
    }
  }
  // the pixels these meshes light by themselves: every other effect mesh hidden, the effect scene rendered from this camera into a
  // cleared RGBA8 target of the drawing buffer's size, read back; a pixel counts when a channel is above 2
  meterPixels(renderer, camera, meshes){
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    let t = this.meterTarget;
    if (!t || t.width !== size.x || t.height !== size.y){
      if (t) t.dispose();
      t = this.meterTarget = new THREE.WebGLRenderTarget(size.x, size.y);
      this.meterBuf = new Uint8Array(size.x * size.y * 4);
    }
    const all = [...this.meshes, ...this.gpuMeshes, ...this.modelMeshes].filter(Boolean), keep = new Set(meshes);
    const vis = all.map(m => m.visible);
    const ground = this.ground ? this.ground.visible : null;
    const target = renderer.getRenderTarget(), cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha(), ac = renderer.autoClear;
    try {
      for (const m of all) m.visible = m.visible && keep.has(m);
      if (this.ground) this.ground.visible = false;
      renderer.setRenderTarget(t); renderer.setClearColor(0x000000, 0); renderer.autoClear = false; renderer.clear();
      renderer.render(this.scene, camera);
      renderer.readRenderTargetPixels(t, 0, 0, size.x, size.y, this.meterBuf);
    } finally {
      renderer.setRenderTarget(target); renderer.setClearColor(cc, ca); renderer.autoClear = ac;
      all.forEach((m, i) => { m.visible = vis[i]; });
      if (this.ground) this.ground.visible = ground;
    }
    const b = this.meterBuf;
    let n = 0;
    for (let i = 0; i < b.length; i += 4) if (b[i] > 2 || b[i + 1] > 2 || b[i + 2] > 2 || b[i + 3] > 2) n++;
    return n;
  }

  // THE SCENE DEPTH. Both programs fade""")
io.open(P, 'w', encoding='utf8', newline='').write(t)
print('ok')
