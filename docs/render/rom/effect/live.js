// LIVE EFFECTS: a monster's effects running on the ROM-translated runtime, drawn by three.js.
//
// docs/effects/<monster>.json names the effect files and the joints their nodes bind to
// (C:\MHGU-Extract\efx\export_effects.py). For each, the host (host.js) loads the list with the game's
// loader; every effect hangs from one PARENT UNIT whose joint matrices are the monster's bones, and is
// started the way the monster's request starts it (proof.js) in the state its `when` names (schedule.js:
// always, while enraged, or once as rage turns on or off) -- and every 1/60 s -- the rate the .efl header
// declares, and the step the emulator harness verified -- moves it.
// Every rendered frame draws it: the effect draw and the engine's primitive draw run on the host, and
// each primitive GPU draw they produce becomes a mesh here, with the ROM's own vertices, index strips,
// shader program (primshader.js), constant buffers, textures and blend / depth / rasterizer state.
//
// MODEL PARTICLES are drawn with the effect model's own material program (TMaterialStd, translated the
// same way: modelshader.js, whose header lists what the viewer supplies that the ROM's build did) under
// the engine's model draw (modeldraw.js: world matrix, CBMaterial, fPrimColor, global transparency,
// blend by the generator's mode, depth by its flags).
//
// UNITS: the viewer's world is game units / 100 (build-hitzones.py), and a monster's skeleton is posed in
// viewer units: a bone's world matrix with its translation scaled by 100 is the joint's matrix in the
// game's space, and the shaders' view-projection carries that 0.01 back.
//
// WHAT THE RENDERER SUPPLIES, as the game's does around the effect draw:
//   * the view's constant buffers (CBViewProjection, CBScreen) from this render's camera -- in the game the
//     renderer fills them per view; the draws the host records carry the harness's camera block, whose
//     view-projection is empty, so those two buffers are never taken from a draw (cameraMatrices below)
//   * the scene depth both programs' soft edges read (sceneDepth below)
//   * textures sampled as stored: the effect textures are MT format 7, NVN RGBA8 UNORM (0xb07e48), no decode
//   * a GROUND to draw against (groundPlane below): the game's effects meet its terrain, the viewer has none
//   * the colour written as the programs return it (primshader.js, OUTPUT: RGBA8 UNORM targets)
// Interfaces the draws never select (FFogVTF, FAlphaTest, ...) run their own bodies (no fog, no alpha test).
import * as THREE from 'three';
import { EffectHost } from './host.js';
import { linkPrimitive, cbUniforms, FORMATS } from './primshader.js';
import { linkMaterial } from './modelshader.js';
import { EffectSchedule } from './schedule.js';
import { loadJson, getTexture, loadGlb } from '../../assets.js';
import { gidBonesOf } from '../../skeleton.js';

const MT_TO_VIEW = 0.01;
const STEP = 1 / 60;
const MAX_STEPS = 4;

let shared = null;           // the host's data, loaded once
async function bytes(url){ return new Uint8Array(await (await fetch(url + '?v=' + Date.now())).arrayBuffer()); }
function pages(b){
  const out = [], dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  for (let o = 0; o < b.length; ){ const a = dv.getUint32(o, true), n = dv.getUint32(o + 4, true); out.push([a, b.subarray(o + 8, o + 8 + n)]); o += 8 + n; }
  return out;
}
async function loadShared(){
  if (shared) return shared;
  const [rom, records, drawSystem, shaders, modelShaders, romPages] = await Promise.all([
    loadJson('effects/rom.json'), loadJson('effects/mfx-records.json'), loadJson('effects/draw-system.json'),
    loadJson('effects/prim-shaders.json'), loadJson('effects/model-shaders.json'), bytes('effects/rom-pages.bin')]);
  shared = { rom, records: records.records, drawSystem: Uint8Array.from(drawSystem.bytes.match(/../g), h => parseInt(h, 16)),
             shaders, modelShaders, romPages: pages(romPages) };
  return shared;
}

export async function liveEffectsFor(monsterId){
  const r = await fetch('effects/' + monsterId + '.json?v=' + Date.now());
  return r.ok ? r.json() : null;
}

// ---- render state, decoded from the records' words the way ../state.js reads them -------------------
const FACTOR = { 0: THREE.ZeroFactor, 1: THREE.OneFactor, 4: THREE.SrcAlphaFactor, 5: THREE.OneMinusSrcAlphaFactor };
const EQUATION = { 0: THREE.AddEquation, 2: THREE.ReverseSubtractEquation };
function applyState(mat, shaders, bs, ds, rs){
  const b = shaders.states[bs], d = shaders.states[ds], r = shaders.states[rs];
  if (!b || !d || !r) throw new Error('live effects: state record missing (' + [bs, ds, rs] + ')');
  const w6 = b[1];
  if ((w6 >>> 1) & 0xff){
    const src = FACTOR[(w6 >>> 9) & 0xff], dst = FACTOR[(w6 >>> 17) & 0xff], eq = EQUATION[w6 >>> 25];
    if (src === undefined || dst === undefined || eq === undefined) throw new Error('live effects: blend word 0x' + w6.toString(16) + ' (' + bs + ')');
    mat.blending = THREE.CustomBlending;
    mat.blendSrc = src; mat.blendDst = dst; mat.blendEquation = eq;
    // alpha: coverage "over", the viewer's canvas policy (../state.js explains why it is not the ROM's)
    mat.blendSrcAlpha = THREE.OneFactor; mat.blendDstAlpha = THREE.OneMinusSrcAlphaFactor; mat.blendEquationAlpha = THREE.AddEquation;
    mat.transparent = true;
  } else { mat.blending = THREE.NoBlending; mat.transparent = false; }
  mat.depthTest = !!(d[1] & 1);
  mat.depthWrite = !!((d[1] >>> 1) & 1);
  if (((d[1] >>> 2) & 0xf) !== 3) throw new Error('live effects: depth compare ' + ((d[1] >>> 2) & 0xf) + ' (' + ds + ')');
  const cull = (r[1] >>> 3) & 7;
  mat.side = cull === 0 ? THREE.DoubleSide : cull === 1 ? THREE.BackSide : THREE.FrontSide;
}

// one strip per record, 0xffff between: triangles, alternating winding as a strip does
function stripsToTriangles(indices){
  const out = [];
  let start = 0;
  for (let i = 0; i <= indices.length; i++){
    if (i === indices.length || indices[i] === 0xffff){
      for (let k = start; k + 2 < i; k++){
        if ((k - start) & 1) out.push(indices[k + 1], indices[k], indices[k + 2]);
        else out.push(indices[k], indices[k + 1], indices[k + 2]);
      }
      start = i + 1;
    }
  }
  return out;
}

const T_NEAR_IS_ZERO = new THREE.Matrix4().set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
const VIEW_BUFFER = /^(CBViewProjection|CBScreen)_/;

export class LiveEffects {
  constructor(def){
    this.def = def;
    this.group = new THREE.Group();              // in the viewer's scene: the frame driver
    this.group.name = 'live-effects';
    this.scene = new THREE.Scene();              // the effect meshes, rendered by the frame driver
    this.meshes = [];
    this.modelMeshes = [];
    this.glbs = new Map();
    this.programs = new Map();
    this.textures = new Map();
    this.last = null;
    this.acc = 0;
    this.stats = { frames: 0, steps: 0, prims: 0, models: 0 };
    this.groundOn = groundDefault;
  }

  // rage: the viewer's Enraged state as the effects start (setRage follows it from then on)
  async attach(root, { rage = false } = {}){
    const s = await loadShared();
    const def = this.def, res = def.resources;
    const files = {};
    for (const e of def.effects) files[e.efl] = await bytes('effects/' + e.efl);
    for (const r of Object.values(res)){
      if (r.ean) files[r.ean] = await bytes('effects/' + r.ean);
      if (r.mesh) files[r.mesh] = await bytes('effects/' + r.mesh);
    }
    this.shaders = s.shaders;
    this.modelShaders = s.modelShaders;
    this.files = files;
    const host = this.host = new EffectHost({
      pages: s.romPages, heap: s.rom.heap, records: s.records, drawSystem: s.drawSystem, strict: true,
      resources: {
        meshTable: name => ({ count: res[name].meshCount, table: files[res[name].mesh] }),
        textureSize: name => res[name].size,
        anim: name => files[res[name].ean],
        material: (name, index) => res[name].materials[index],
      },
    });
    const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
    host.initDraw({ position: [0, 0, 0], view: [...I, 0, 0, 0, 1], world: [...I, 0, 0, 0, 1] });
    this.root = root;
    const bones = gidBonesOf(root);
    // One parent for every effect, as in the game: they all hang from the monster (the request's parent is
    // the enemy itself), whose bones answer every joint any of their nodes names, and whose own placement a
    // request placed at the unit reads (writeJoints).
    const joints = [...new Set(def.effects.flatMap(e => e.joints))];
    this.effects = def.effects.map(e => ({ owner: host.createEffect(files[e.efl]), def: e }));
    const parent = this.parent = (joints.length || def.effects.some(e => e.record)) ? host.createParent(joints) : null;
    this.joints = joints.map(j => ({ j, bone: (bones.find(b => b.gid === j) || {}).node || null }));
    // ANCHOR (joint -1 = model+0xb0, the model's world-matrix ORIGIN, per the joint getter 0x939278). The
    // mounted group's origin sits on the FLOOR, but the ROM places the model's world matrix at the model's
    // authored root = the skeleton root bone (gid 0). The aura's own nodes are authored well BELOW that
    // origin (mass ~130 units under it, measured from the ROM effect data), so anchoring at the floor drops
    // the fire underground; the model root (gid 0) is where the ROM origin is, and lands it on the body.
    this.originBone = (bones.find(b => b.gid === 0) || {}).node || null;
    root.updateMatrixWorld(true);
    this.writeJoints();
    // a record: the monster's request, whole (proof.js ProofRequest) -- the core makes the effect the game
    // draws, a uMHProofEffect, which the unit passes run every frame -- made when schedule.js says
    this.schedule = new EffectSchedule(host, parent, this.effects, rage);
    // The frame driver: an empty mesh at the end of the viewer's render list (transparent, last). Its hook
    // steps the effects, draws them on the host and renders their meshes right there, into the target the
    // viewer's render is drawing into, over everything it has drawn. They are rendered by a render of their
    // own because three.js uploads a mesh's vertex buffers while it builds the render list: vertices written
    // in a hook of the same render draw from buffers that were never uploaded -- the primitives never drew.
    const anchor = this.anchor = new THREE.Mesh(new THREE.BufferGeometry(),
      new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false, transparent: true }));
    anchor.frustumCulled = false;
    anchor.renderOrder = 1e9;
    anchor.onBeforeRender = (renderer, scene, camera) => this.frame(renderer, scene, camera);
    this.group.add(anchor);
    root.add(this.group);
    this.groundPlane();
    return this;
  }

  // THE GROUND, OFF BY DEFAULT -- a debug/terrain-test stand-in, not a ROM value. The game draws its effects
  // against its terrain (their DSZTest hides what lies under it), which the viewer has none of. It was added
  // when the aura hung from the clip's reference node, below the feet, and half its fire drew under the body;
  // anchoring to the model's world matrix (unitMatrix) fixed that placement, so with nothing below the feet
  // to hide the ground occludes nothing. Kept behind __view.effectGround(true) to test terrain occlusion for
  // an effect that does reach below the feet. A depth-only plane at the lowest bone (groundY): it writes
  // depth and no colour, in front of the effect meshes and into the scene depth, and faces up.
  groundPlane(){
    const geometry = new THREE.PlaneGeometry(2000, 2000);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, depthTest: true, side: THREE.FrontSide });
    const make = () => { const p = new THREE.Mesh(geometry, material); p.frustumCulled = false; p.renderOrder = -1e9; return p; };
    this.ground = make();
    this.scene.add(this.ground);
    this.groundScene = new THREE.Scene();
    this.groundDepth = make();
    this.groundScene.add(this.groundDepth);
  }

  writeJoints(){
    const m = new THREE.Matrix4();
    if (this.parent){
      // THE PARENT UNIT'S OWN PLACEMENT (uCoord +0x40 position, +0x50 quaternion, +0x60 scale), its translation
      // in game units. Its scale is the monster's size (the viewer scales the world group by the game's size
      // multiplier, index.html sizeScale), which a request's effect multiplies its record's scale by
      // (0x31d16c), so the unit's scale and its joints' linear parts agree as they do in the game. A request
      // placed at the unit (joint -1: Teostra's aura) takes the position and the quaternion's angles
      // (0x31f788, 0x8a4b88).
      const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      this.unitMatrix(m).decompose(p, q, s);
      this.host.setParentPose(this.parent, { position: [p.x / MT_TO_VIEW, p.y / MT_TO_VIEW, p.z / MT_TO_VIEW],
                                             quaternion: [q.x, q.y, q.z, q.w], scale: s.x });
      if (this.ground){ const g = this.groundY(p); this.ground.position.set(p.x, g, p.z); this.groundDepth.position.set(p.x, g, p.z); }
      for (const { j, bone } of this.joints){
        if (!bone) continue;
        m.copy(bone.matrixWorld);
        const el = m.elements;
        // the skeleton is in viewer units (game units / 100) with the monster's size in its linear part:
        // the game's joint matrix is S^-1 * J * S -- the translation in game units, the rotation and
        // scale as they are, so an offset the effect gives in game units lands scaled like the body
        el[12] /= MT_TO_VIEW; el[13] /= MT_TO_VIEW; el[14] /= MT_TO_VIEW;
        // three.js stores columns; the game's rows in memory order are exactly that array
        this.host.setJointMatrix(this.parent, j, Array.from(el));
      }
    }
  }

  // The viewer's Enraged state: the effects that start or stop with it (schedule.js).
  setRage(on){
    if (this.failed || !this.schedule) return;
    try { this.schedule.setRage(on); }
    catch (e){ this.fail(e); }
  }

  // WHERE THE UNIT IS. Joint -1 -- the root of a request's effect, and the aura's nodes -- resolves through
  // the parent's joint getter (0x939278): a bone the table maps, else the MODEL'S OWN WORLD MATRIX (+0xb0).
  // We use this.root.matrixWorld as that model matrix. UNRESOLVED (Raven, 2026-09-13): with the hollow stand-in
  // this origin is the model's placement (feet-level in the viewer), and the aura drew low there. The correct
  // in-body position must come from the ROM -- the effect's authored node transforms and where the ENEMY builds
  // its +0xb0 origin -- not from picking a bone by eye. Being decoded; do not re-guess.
  unitMatrix(out){
    this.unitOnGround = true;
    out.copy(this.root.matrixWorld);
    if (this.originBone){                                   // position from the model root (gid 0); rotation/scale stay the unit's
      this.originBone.updateWorldMatrix(true, false);
      const e = this.originBone.matrixWorld.elements, o = out.elements;
      o[12] = e[12]; o[13] = e[13]; o[14] = e[14];
    }
    return out;
  }
  // the floor the ground stand-in sits on: the lowest drawn bone (the monster's feet), in the unit's frame
  groundY(unitPos){
    let lo = unitPos.y;
    for (const { bone } of this.joints || []) if (bone) lo = Math.min(lo, bone.matrixWorld.elements[13]);
    if (this.root) this.root.traverse(o => { if (o.isBone) lo = Math.min(lo, o.matrixWorld.elements[13]); });
    return lo;
  }

  // A refusal (a branch of the ROM's code no recorded run reached: Unverified) or any other fault stops
  // this effect and says where, once; the viewer's render loop must not die with it.
  frame(renderer, scene, camera){
    if (this.failed) return;
    try { this.frameUnsafe(renderer, scene, camera); }
    catch (e){ this.fail(e); }
  }
  fail(e){
    this.failed = String(e && e.message || e);
    this.stats.failed = this.failed;
    for (const mesh of this.meshes) mesh.visible = false;
    for (const mesh of this.modelMeshes) mesh.visible = false;
    console.warn('live effects stopped: ' + this.failed);
  }

  frameUnsafe(renderer, scene, camera){
    const now = performance.now() / 1000;
    if (this.last === null) this.last = now;
    this.acc = Math.min(this.acc + (now - this.last), MAX_STEPS * STEP);
    this.last = now;
    if (this.acc >= STEP) this.writeJoints();
    while (this.acc >= STEP){
      this.schedule.step();                                    // every request's core and effect
      this.acc -= STEP;
      this.stats.steps++;
    }
    const effects = this.schedule.effects();
    this.stats.running = this.schedule.running;
    if (!effects.length){                                      // nothing running: no draw, no depth pass
      for (const mesh of this.meshes) mesh.visible = false;
      for (const mesh of this.modelMeshes) mesh.visible = false;
      this.stats.prims = this.stats.models = 0;
      return;
    }
    // the camera the effect draw sorts by (and the model draw's sort key reads): this render's camera,
    // in the game's units, into the camera block (+0x40 position, +0x70 view, +0xb0 its inverse)
    const cam = this.cameraMatrices(camera);
    this.host.setCamera({ position: cam.position.toArray(), view: Array.from(cam.view.elements), world: Array.from(cam.viewI.elements) });
    const { prims, models } = this.host.drawFrame(effects);
    this.stats.frames++; this.stats.prims = prims.length; this.stats.models = models.length;
    const ground = !!(this.groundOn && this.unitOnGround);
    if (this.ground) this.ground.visible = ground;
    this.depth = this.sceneDepth(renderer, scene, camera);
    this.syncModels(models, renderer, cam);
    this.sync(prims, renderer, cam);
    // into the same target, over what is there: no clear
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    try { renderer.render(this.scene, camera); }
    finally { renderer.autoClear = autoClear; }
  }

  // THE SCENE DEPTH. Both programs fade a draw where it nears what is behind it: a primitive by
  // FPrimitiveCalcVolumeBlendPSVolume (tPrimDepthMap), a model particle by FPrimitiveTransparencyVolume
  // (tDepthMap), each turning the depth value at the pixel back into a view distance. The game binds the
  // same texture to both slots, [[context +0x1e0] +0x280] (0xbab65c for the primitive batch, 0xc8f7e0 for
  // the model draw): a render surface set's depth-stencil texture -- MT format 15, D24S8, made at 0xb02680
  // into +0x270 and copied to +0x274 and then +0x280 (0xb03374) when the set is built with flag 0x10. It is
  // the depth buffer the effects are drawn against, read while they test it without writing (DSZTest).
  // WebGL cannot sample the buffer it is drawing into, so each frame the scene is drawn once more, without
  // the effects, into a depth texture from this render's camera: the depth what the scene wrote leaves for
  // the effects to read. (The game's buffer at that moment also holds its terrain and whatever else wrote
  // depth before the effect layer; the viewer's scene is the monster.)
  sceneDepth(renderer, scene, camera){
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    let t = this.depthTarget;
    if (!t || t.width !== size.x || t.height !== size.y){
      if (t) t.dispose();
      t = this.depthTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
        depthBuffer: true, stencilBuffer: false, depthTexture: new THREE.DepthTexture(size.x, size.y, THREE.FloatType) });
    }
    // a render inside a render, as three.js's Reflector does it: this group (the frame driver) hidden, the
    // render target swapped and put back
    const target = renderer.getRenderTarget(), xr = renderer.xr.enabled, shadows = renderer.shadowMap.autoUpdate;
    this.group.visible = false;
    renderer.xr.enabled = false;
    renderer.shadowMap.autoUpdate = false;
    try {
      renderer.setRenderTarget(t);
      renderer.state.buffers.depth.setMask(true);
      if (!renderer.autoClear) renderer.clear();
      renderer.render(scene, camera);
      if (this.groundScene && this.groundOn && this.unitOnGround){
        const autoClear = renderer.autoClear;
        renderer.autoClear = false;
        try { renderer.render(this.groundScene, camera); }
        finally { renderer.autoClear = autoClear; }
      }
    } finally {
      renderer.setRenderTarget(target);
      renderer.xr.enabled = xr;
      renderer.shadowMap.autoUpdate = shadows;
      this.group.visible = true;
    }
    return t.depthTexture;
  }

  // ---- Model particles -----------------------------------------------------------------------------
  // The effect model's mesh (docs/models/effects/<model>.glb: node Group[k] is the .mod's mesh k, its
  // positions in game units under the node's 0.01) drawn with the program modelshader.js links for the
  // material's selection under the model draw's, and modeldraw.js's constant buffers and states.
  glb(model){
    let g = this.glbs.get(model);
    if (!g){
      g = { scene: null };
      loadGlb('models/effects/' + model + '.glb', 'effect:' + model).then(gltf => { g.scene = gltf.scene; }).catch(() => { g.failed = true; });
      this.glbs.set(model, g);
    }
    return g.scene;
  }

  layoutOf(model, meshIndex){
    const r = this.def.resources[model];
    const table = this.files[r.mesh];
    const ia = table[48 * meshIndex + 0x14];                     // mesh +0x14: (hash24 << 8) | layout record
    const shaders = this.modelShaders;
    return Object.keys(shaders.layouts).find(n => shaders.layouts[n].index === ia);
  }

  standIns(){
    if (this.black) return;
    this.black = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); this.black.needsUpdate = true;
    const face = () => { const c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 1, 1); return c; };
    this.blackCube = new THREE.CubeTexture([face(), face(), face(), face(), face(), face()]);
    this.blackCube.needsUpdate = true;
    // the engine's default environment cube, as the monster materials sample it (render/monster.js)
    this.envCube = new THREE.CubeTextureLoader().setPath('env/DefaultCube_CM/').load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']);
    this.envCube.colorSpace = THREE.SRGBColorSpace;
  }

  syncModels(models, renderer, cam){
    this.standIns();
    const shaders = this.modelShaders;
    const common = this.commonUniforms(renderer, cam);
    let k = 0;
    for (const d of models){
      const short = String(d.model).split('\\').pop();
      const scene = this.glb(short);
      if (!scene) continue;
      const node = scene.getObjectByName('Group' + d.meshIndex);
      const src = node && (node.isMesh ? node : node.children.find(c => c.isMesh));
      if (!src) continue;
      const res = this.def.resources[d.model];
      const material = res.materials[d.material];
      const features = Object.assign({}, material.features, d.features);
      const layout = this.layoutOf(d.model, d.meshIndex);
      const attrs = Object.keys(src.geometry.attributes);
      const key = 'model|' + layout + '|' + attrs.join(',') + '|' + Object.keys(features).sort().map(f => features[f]).join(',');
      let p = this.programs.get(key);
      if (!p){ p = linkMaterial(shaders, layout, features, attrs); this.programs.set(key, p); }
      let mesh = this.modelMeshes[k];
      if (!mesh){
        mesh = new THREE.Mesh(src.geometry, null);
        mesh.frustumCulled = false;
        this.modelMeshes[k] = mesh;
        this.scene.add(mesh);
      }
      mesh.geometry = src.geometry;
      src.updateWorldMatrix(true, false);          // the glb node's own transform (its 0.01), current
      if (!mesh.material || mesh.userData.programKey !== p){
        mesh.material = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: p.vertexShader, fragmentShader: p.fragmentShader, uniforms: {} });
        mesh.userData.programKey = p;
      }
      const u = mesh.material.uniforms;
      for (const [name, value] of Object.entries(common)) u[name] = { value };
      // CBWorld: the particle's matrix (modeldraw's `world`) composed with the glb node's own transform. The
      // draw uses the RAW node geometry (mesh.geometry = src.geometry, added to this.scene at identity), but the
      // .mod's mesh k sits under the node's 0.01 -- its positions are game units only after that scale (the class
      // header). `world` is the game-unit particle transform, so the node matrix must be folded in here, or every
      // model particle draws 1/0.01 = 100x its size (em003_00_001's mesh 27, raw +-190, x world-scale 60, filled
      // the screen from -11800 to +11900 game units -- a near-plane-straddling wall).
      const W = new THREE.Matrix4().set(
        d.world[0], d.world[1], d.world[2], d.world[3],
        d.world[4], d.world[5], d.world[6], d.world[7],
        d.world[8], d.world[9], d.world[10], d.world[11],
        0, 0, 0, 1).multiply(src.matrixWorld);
      const we = W.elements;                        // column-major: row r is (we[r], we[4+r], we[8+r], we[12+r])
      for (let r = 0; r < 3; r++) u['CBWorld_fWorld_r' + r] = { value: new THREE.Vector4(we[r], we[4 + r], we[8 + r], we[12 + r]) };
      const put = (id, members, floats) => {
        for (const [name, type, offset, count] of members){
          const v = floats.slice(offset, offset + count);
          const mm = /^mat(\d)x(\d)$/.exec(type);
          if (mm) for (let r = 0; r < +mm[1]; r++) u[id + '_' + name + '_r' + r] = { value: new THREE.Vector4(...v.slice(r * 4, r * 4 + 4)) };
          else if (type === 'float') u[id + '_' + name] = { value: v[0] };
          else if (type === 'vec2') u[id + '_' + name] = { value: new THREE.Vector2(...v) };
          else if (type === 'vec3') u[id + '_' + name] = { value: new THREE.Vector3(...v) };
          else if (type === 'vec4') u[id + '_' + name] = { value: new THREE.Vector4(...v) };
          else if (type === 'mat4') u[id + '_' + name] = { value: new THREE.Matrix4().fromArray(v) };
        }
      };
      put('CBMaterial', shaders.cbs.CBMaterial, Array.from(d.cbMaterial));
      put('Globals', shaders.cbs.$Globals, material.cbs.$Globals || []);
      u.CBROPTest_fGlobalTransparency = { value: d.globalTransparency };
      u.CBPrimEflEmu_fPrimColor = { value: new THREE.Vector4(...(d.primColor || [1, 1, 1, 1])) };
      u.CBAmbient_fEnvMapMask = { value: 0 };                 // scene ambient: not bound (see the header)
      const tex = material.textures || {};
      u.tAlbedoMap = { value: tex.tAlbedoMap ? this.fileTexture(tex.tAlbedoMap) : this.black };
      u.tSpecularMap = { value: tex.tSpecularMap ? this.fileTexture(tex.tSpecularMap) : this.black };
      u.tDepthMap = { value: this.depth };
      u.tGlobalEnvMap = { value: this.envCube };
      u.tSpotLightTextures = { value: this.black };
      u.tPointLightTextures = { value: this.blackCube };
      applyState(mesh.material, shaders, d.blend, d.depth, material.state[2]);
      mesh.renderOrder = 900 + k;
      mesh.visible = !!u.tAlbedoMap.value;
      k++;
    }
    for (let i = k; i < this.modelMeshes.length; i++) this.modelMeshes[i].visible = false;
  }

  fileTexture(file){
    let t = this.textures.get(file);
    if (!t){ t = { value: null }; getTexture(file, { linear: true }).then(tex => { t.value = tex; }); this.textures.set(file, t); }
    return t.value;
  }

  commonUniforms(renderer, cam){
    const { view, proj, viewProj, viewI } = cam;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    return {
      CBViewProjection_fViewProj: viewProj, CBViewProjection_fView: view, CBViewProjection_fViewI: viewI,
      CBViewProjection_fProj: proj, CBViewProjection_fProjI: proj.clone().invert(), CBViewProjection_fViewProjI: viewProj.clone().invert(),
      CBViewProjection_fCameraPos: cam.position,
      CBScreen_fScreenSize: new THREE.Vector2(size.x, size.y), CBScreen_fScreenInverseSize: new THREE.Vector2(1 / size.x, 1 / size.y),
    };
  }

  // The game's camera lives in game units. Its view space must be too: every effect routine that takes an
  // axis or a distance off the camera -- the camera block's matrices the CPU draw reads, fViewI that turns a
  // sprite's corner offsets into world space (FPrimitiveCalcPosParticle), calcZOffset's camera Z -- expects
  // unit-length axes and game-unit translations. So the view is S^-1 V S (a pure rotation and a translation
  // in game units) and the projection takes game-unit view space, T P S; their product is still T P V S.
  // (Folding S into the view alone left fViewI's axes 100 long: sprites and camera-facing model particles
  // came out a hundred times their size.)
  // The projection is that times 100, a homogeneous scale: the same window position and depth, but clip w is
  // the view distance in game units, as the game's is. The programs depend on it: calcScreenZtoViewDepth,
  // calcScreenUVtoViewDepth and calcViewDepth turn a window depth z back into a distance as
  // fProj[3][2] / (z + fProj[2][2]), which is the distance only for a projection whose w is -z_view exactly,
  // and FPrimitiveTransparencyVolume compares that with SV_Position.w.
  cameraMatrices(camera){
    const S = new THREE.Matrix4().makeScale(MT_TO_VIEW, MT_TO_VIEW, MT_TO_VIEW);
    const Sinv = new THREE.Matrix4().makeScale(1 / MT_TO_VIEW, 1 / MT_TO_VIEW, 1 / MT_TO_VIEW);
    const view = new THREE.Matrix4().multiplyMatrices(Sinv, camera.matrixWorldInverse).multiply(S);
    const proj = new THREE.Matrix4().multiplyMatrices(T_NEAR_IS_ZERO, camera.projectionMatrix).multiply(S).multiplyScalar(1 / MT_TO_VIEW);
    const viewProj = new THREE.Matrix4().multiplyMatrices(proj, view);
    return { view, proj, viewProj, viewI: view.clone().invert(),
             position: new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld).multiplyScalar(1 / MT_TO_VIEW) };
  }

  program(layout, features){
    const key = layout + '|' + Object.keys(features).sort().map(k => features[k]).join(',');
    let p = this.programs.get(key);
    if (!p){ p = linkPrimitive(this.shaders, layout, features); this.programs.set(key, p); }
    return p;
  }

  texture(name){
    if (!name) return null;
    let t = this.textures.get(name);
    if (!t){
      const r = this.def.resources[name];
      t = { value: null };
      if (r && r.file) getTexture(r.file, { linear: true }).then(tex => { t.value = tex; });
      this.textures.set(name, t);
    }
    return t.value;
  }

  sync(prims, renderer, cam){
    const common = this.commonUniforms(renderer, cam);
    for (let k = 0; k < prims.length; k++){
      const d = prims[k];
      const p = this.program(d.inputLayout, d.features);
      let mesh = this.meshes[k];
      if (!mesh){
        mesh = new THREE.Mesh(new THREE.BufferGeometry(), null);
        mesh.frustumCulled = false;
        this.meshes[k] = mesh;
        this.scene.add(mesh);
      }
      // vertices: each layout element as its own attribute over the draw's bytes. The buffers are kept and
      // rewritten in place, and grow by replacing the whole geometry: an attribute replaced on its own keeps
      // its GPU buffer until the geometry is disposed.
      const n = d.vertices;
      const triangles = stripsToTriangles(d.indexList);
      let g = mesh.geometry;
      const fits = mesh.userData.layoutKey === p && g.index && g.index.count >= triangles.length &&
                   p.attributes.every(a => { const at = g.getAttribute(a.name); return at && at.count >= n; });
      if (!fits){
        g.dispose();
        g = mesh.geometry = new THREE.BufferGeometry();
        const capacity = c => Math.max(64, 2 ** Math.ceil(Math.log2(Math.max(c, 1))));
        for (const a of p.attributes){
          const f = FORMATS[a.format];
          g.setAttribute(a.name, new THREE.BufferAttribute(new f.array(capacity(n) * a.count), a.count, f.normalized).setUsage(THREE.DynamicDrawUsage));
        }
        g.setIndex(new THREE.BufferAttribute(new Uint32Array(capacity(triangles.length)), 1).setUsage(THREE.DynamicDrawUsage));
        mesh.userData.layoutKey = p;
      }
      for (const a of p.attributes){
        const f = FORMATS[a.format];
        const width = f.size * a.count;
        const at = g.getAttribute(a.name);
        const out = new Uint8Array(at.array.buffer, at.array.byteOffset, n * width);
        const src = d.vertexBytes;
        for (let v = 0; v < n; v++) out.set(src.subarray(v * d.stride + a.offset, v * d.stride + a.offset + width), v * width);
        at.needsUpdate = true;
      }
      g.index.array.set(triangles);
      g.index.needsUpdate = true;
      g.setDrawRange(0, triangles.length);
      // material: one per program and draw slot; uniforms are this draw's
      if (!mesh.material || mesh.userData.programKey !== p){
        mesh.material = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: p.vertexShader, fragmentShader: p.fragmentShader, uniforms: {} });
        mesh.userData.programKey = p;
      }
      const mat = mesh.material;
      const u = mat.uniforms;
      for (const [name, { type, value }] of Object.entries(cbUniforms(this.shaders, d.cb))){
        if (VIEW_BUFFER.test(name)) continue;                      // the renderer's (the header)
        const v = type === 'float' ? value[0] : type === 'vec2' ? new THREE.Vector2(...value) : type === 'vec3' ? new THREE.Vector3(...value)
                : type === 'vec4' ? new THREE.Vector4(...value) : type === 'mat4' ? new THREE.Matrix4().fromArray(value) : null;
        if (v !== null) u[name] = { value: v };
      }
      for (const [name, value] of Object.entries(common)) u[name] = { value };
      u.tBaseMap = { value: this.texture(d.textures.tBaseMap) };
      u.tPrimDepthMap = { value: this.depth };
      applyState(mat, this.shaders, d.blend, d.depth, d.raster);
      mesh.renderOrder = 1000 + k;                     // the order the ROM's sorted primitive layer drew in
      mesh.visible = !!(u.tBaseMap.value || !/BaseMap/.test(d.features.FPrimitiveSample || ''));
    }
    for (let k = prims.length; k < this.meshes.length; k++) this.meshes[k].visible = false;
  }

  detach(){
    if (this.group.parent) this.group.parent.remove(this.group);
    for (const mesh of this.meshes){ mesh.geometry.dispose(); if (mesh.material) mesh.material.dispose(); this.scene.remove(mesh); }
    for (const mesh of this.modelMeshes){ if (mesh.material) mesh.material.dispose(); this.scene.remove(mesh); }   // the geometry is the glb's
    this.meshes.length = 0;
    this.modelMeshes.length = 0;
    if (this.depthTarget){ this.depthTarget.depthTexture.dispose(); this.depthTarget.dispose(); this.depthTarget = null; }
    if (this.ground){ this.ground.geometry.dispose(); this.ground.material.dispose(); this.scene.remove(this.ground); this.ground = null; }
  }
}
// the ground stand-in's switch, for every runtime from now on (__view.effectGround)
let groundDefault = false;
export function setEffectGround(on){ groundDefault = !!on; }
