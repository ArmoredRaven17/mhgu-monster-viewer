# build_meter2.py: live.js -- the draw meter, v2: each sampled request DRAWN ALONE (its units through host.drawFrame, the primitive
# layer's own flush included) into a private mesh pool and scene, then rendered and counted. v1 attributed draws to units by
# what each drawEffect added -- but the primitive layer queues and emits every batch at its end (0xbad790), merged across units,
# so a primitive record read as 'no draw' (Rathian: tail 23868, prims 0 everywhere).
import io, re
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\rom\effect\live.js'
t = io.open(P, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in t else '\n'
def rep(a, b):
    global t
    a2, b2 = a.replace('\n', nl), b.replace('\n', nl)
    assert t.count(a2) == 1, (t.count(a2), a[:70])
    t = t.replace(a2, b2)
# the hook: AFTER the real render (the meter's own drawFrame calls must not disturb this frame's draw)
rep("    this.order(gpu, prims, models);\n    if (METER.on) this.meterFrame(renderer, camera, prims, gpu, models);\n",
    "    this.order(gpu, prims, models);\n")
rep("""    try { renderer.render(this.scene, camera); }
    finally { renderer.autoClear = autoClear; }
  }
""", """    try { renderer.render(this.scene, camera); }
    finally { renderer.autoClear = autoClear; }
    if (METER.on) this.meterFrame(renderer, camera);
  }
""")
rep("    this.host.meterOn = METER.on;\n    const { prims, models, gpu } = this.host.drawFrame(effects);\n",
    "    const { prims, models, gpu } = this.host.drawFrame(effects);\n")
# replace meterFrame + meterPixels wholesale
a = t.index("  // the draw meter's frame (METER above)")
b = t.index("  // THE SCENE DEPTH. Both programs fade")
t = t[:a] + r"""  // the draw meter's frame (METER above), after this frame's render: every live request counted; every `every`-th frame each one
  // DRAWN ALONE -- host.drawFrame over its own units (the draw gate, the primitive layer's begin and flush, the GPU particle frame:
  // the same calls the real draw makes), synced into the meter's own mesh pool and scene, rendered from this camera into a cleared
  // RGBA8 target and read back. Its draws (by kind, vertices), the meshes left hidden and why, and the pixels it lights are its own.
  meterFrame(renderer, camera){
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
    const items = [];
    for (const e of this.schedule.entries){
      const reqs = e.def.record ? e.requests : [{ plain: e.owner }];
      for (const q of reqs){
        const units = q.plain ? [q.plain] : q.effects();
        if (!units.length) continue;                           // nothing of it is running (ended, or never made an effect)
        const s = recOf(e);
        if (!q.plain && !METER.seen.has(q)){ METER.seen.add(q); s.starts++; if (clip) s.clips[clip] = (s.clips[clip] || 0) + 1; }
        s.liveFrames++;
        items.push({ s, units });
      }
    }
    if (this.meterN % METER.every !== 0 || !items.length) return;
    const cam = this.cameraMatrices(camera);
    for (const it of items){
      const s = it.s;
      const r = this.host.drawFrame(it.units);
      const n = r.prims.length + r.gpu.length + r.models.length;
      s.samples++;
      if (!n){ continue; }
      s.drawFrames++;
      s.draws.prims += r.prims.length; s.draws.gpu += r.gpu.length; s.draws.models += r.models.length;
      for (const d of [...r.prims, ...r.gpu]) s.verts += d.vertices || 0;
      const px = this.meterPixels(renderer, camera, cam, r);
      let vis = 0;
      for (const d of [...r.prims, ...r.gpu, ...r.models]){
        if (d.meterMesh && d.meterMesh.visible) vis++;
        else { const why = d.meterHidden || 'no mesh'; s.hidden[why] = (s.hidden[why] || 0) + 1; }
      }
      if (vis) s.visibleFrames++;
      s.pixSum += px; if (px > s.pixMax) s.pixMax = px; if (px) s.litSamples++;
      if (!px && vis && !s.diag){
        const d = r.prims[0] || r.gpu[0] || r.models[0];
        const f = d && d.vertexBytes && d.vertexBytes.length >= 16 ? Array.from(new Float32Array(d.vertexBytes.buffer.slice(0, Math.min(64, d.vertexBytes.length & ~3)))) : null;
        s.diag = { frame: this.meterN, clip, draws: [r.prims.length, r.gpu.length, r.models.length], blend: d && d.blend, depth: d && d.depth,
                   textures: d && d.textures, technique: d && (d.technique || d.inputLayout || d.model), firstFloats: f && f.map(x => Math.round(x * 1000) / 1000) };
      }
    }
  }
  // the meter's pool: a scene and mesh lists of its own, swapped in while the three syncs and the order run on one request's draws
  meterPixels(renderer, camera, cam, r){
    if (!this.meterPool) this.meterPool = { scene: new THREE.Scene(), meshes: [], gpuMeshes: [], modelMeshes: [] };
    const P = this.meterPool, keep = { scene: this.scene, meshes: this.meshes, gpuMeshes: this.gpuMeshes, modelMeshes: this.modelMeshes };
    Object.assign(this, P);
    try {
      this.syncModels(r.models, renderer, cam);
      this.sync(r.prims, renderer, cam);
      this.syncGpu(r.gpu, renderer, cam);
      this.order(r.gpu, r.prims, r.models);
    } finally { Object.assign(P, { meshes: this.meshes, gpuMeshes: this.gpuMeshes, modelMeshes: this.modelMeshes }); Object.assign(this, keep); }
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    let t = this.meterTarget;
    if (!t || t.width !== size.x || t.height !== size.y){
      if (t) t.dispose();
      t = this.meterTarget = new THREE.WebGLRenderTarget(size.x, size.y);
      this.meterBuf = new Uint8Array(size.x * size.y * 4);
    }
    const target = renderer.getRenderTarget(), cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha(), ac = renderer.autoClear;
    try {
      renderer.setRenderTarget(t); renderer.setClearColor(0x000000, 0); renderer.autoClear = false; renderer.clear();
      renderer.render(P.scene, camera);
      renderer.readRenderTargetPixels(t, 0, 0, size.x, size.y, this.meterBuf);
    } finally { renderer.setRenderTarget(target); renderer.setClearColor(cc, ca); renderer.autoClear = ac; }
    const b = this.meterBuf;
    let n = 0;
    for (let i = 0; i < b.length; i += 4) if (b[i] > 2 || b[i + 1] > 2 || b[i + 2] > 2 || b[i + 3] > 2) n++;
    return n;
  }

""" + t[b:]
# the verdicts read the sampled counts now
rep("""    verdict: !s.starts && !s.liveFrames ? 'never live' : !s.drawFrames ? 'live, no draw' : !s.visibleFrames ? 'draws, no visible mesh'
           : !s.litSamples ? (s.samples ? 'visible meshes, no lit pixel' : 'not sampled') : 'draws' })) };""",
"""    verdict: !s.samples ? 'not sampled' : !s.drawFrames ? 'live, no draw' : !s.visibleFrames ? 'draws, no visible mesh'
           : !s.litSamples ? 'visible meshes, no lit pixel' : 'draws' })) };""")
io.open(P, 'w', encoding='utf8', newline='').write(t)
print('ok')
