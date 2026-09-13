// LIVE EFFECTS: a monster's effects running on the ROM-translated runtime, drawn by three.js.
//
// docs/effects/<monster>.json names the effect files and the joints their nodes bind to
// (C:\MHGU-Extract\efx\export_effects.py). For each, the host (host.js) loads the list with the game's
// loader, starts it hung from a PARENT UNIT whose joint matrices are the monster's bones, and every
// 1/60 s -- the rate the .efl header declares, and the step the emulator harness verified -- moves it.
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
// SCENE INPUTS THE PRIMITIVE PATH READS BUT THE VIEWER DOES NOT HAVE: tPrimDepthMap (the scene depth
// for the soft edge, FPrimitiveCalcVolumeBlendPSVolume) is bound to a 1x1 far-plane depth, so that fade
// never engages; interfaces the primitive path never selects (FFogVTF, FAlphaTest, ...) run their own
// bodies (no fog, no alpha test).
import * as THREE from 'three';
import { EffectHost } from './host.js';
import { linkPrimitive, cbUniforms, FORMATS } from './primshader.js';
import { linkMaterial } from './modelshader.js';
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

export class LiveEffects {
  constructor(def){
    this.def = def;
    this.group = new THREE.Group();
    this.group.name = 'live-effects';
    this.meshes = [];
    this.modelMeshes = [];
    this.glbs = new Map();
    this.programs = new Map();
    this.textures = new Map();
    this.last = null;
    this.acc = 0;
    this.stats = { frames: 0, steps: 0, prims: 0, models: 0 };
  }

  async attach(root){
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
    this.effects = def.effects.map(e => {
      const owner = host.createEffect(files[e.efl]);
      let parent = null, joints = [];
      if (e.joints.length){
        parent = host.createParent(e.joints);
        joints = e.joints.map(j => ({ j, bone: (bones.find(b => b.gid === j) || {}).node || null }));
        host.attach(owner, parent);
      }
      return { owner, parent, joints, def: e };
    });
    root.updateMatrixWorld(true);
    this.writeJoints();
    for (const e of this.effects) host.start(e.owner);
    // the frame driver: an empty mesh that is always in the render list
    const anchor = this.anchor = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
    anchor.frustumCulled = false;
    anchor.renderOrder = -1e9;
    anchor.onBeforeRender = (renderer, scene, camera) => this.frame(renderer, camera);
    this.group.add(anchor);
    root.add(this.group);
    return this;
  }

  writeJoints(){
    const m = new THREE.Matrix4();
    for (const e of this.effects){
      for (const { j, bone } of e.joints){
        if (!bone) continue;
        m.copy(bone.matrixWorld);
        const el = m.elements;
        // the skeleton is in viewer units (game units / 100) with the monster's size in its linear part:
        // the game's joint matrix is S^-1 * J * S -- the translation in game units, the rotation and
        // scale as they are, so an offset the effect gives in game units lands scaled like the body
        el[12] /= MT_TO_VIEW; el[13] /= MT_TO_VIEW; el[14] /= MT_TO_VIEW;
        // three.js stores columns; the game's rows in memory order are exactly that array
        this.host.setJointMatrix(e.parent, j, Array.from(el));
      }
    }
  }

  // A refusal (a branch of the ROM's code no recorded run reached: Unverified) or any other fault stops
  // this effect and says where, once; the viewer's render loop must not die with it.
  frame(renderer, camera){
    if (this.failed) return;
    try { this.frameUnsafe(renderer, camera); }
    catch (e){
      this.failed = String(e && e.message || e);
      this.stats.failed = this.failed;
      for (const mesh of this.meshes) mesh.visible = false;
      for (const mesh of this.modelMeshes) mesh.visible = false;
      console.warn('live effects stopped: ' + this.failed);
    }
  }

  frameUnsafe(renderer, camera){
    const now = performance.now() / 1000;
    if (this.last === null) this.last = now;
    this.acc = Math.min(this.acc + (now - this.last), MAX_STEPS * STEP);
    this.last = now;
    if (this.acc >= STEP) this.writeJoints();
    while (this.acc >= STEP){
      for (const e of this.effects) this.host.move(e.owner);
      this.acc -= STEP;
      this.stats.steps++;
    }
    // the camera the effect draw sorts by (and the model draw's sort key reads): this render's camera,
    // in the game's units, into the camera block (+0x40 position, +0x70 view, +0xb0 its inverse)
    const cam = this.cameraMatrices(camera);
    this.host.setCamera({ position: cam.position.toArray(), view: Array.from(cam.view.elements), world: Array.from(cam.viewI.elements) });
    const { prims, models } = this.host.drawFrame(this.effects.map(e => e.owner));
    this.stats.frames++; this.stats.prims = prims.length; this.stats.models = models.length;
    this.syncModels(models, renderer, cam);
    this.sync(prims, renderer, cam);
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
        this.group.add(mesh);
      }
      mesh.geometry = src.geometry;
      if (!mesh.material || mesh.userData.programKey !== p){
        mesh.material = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: p.vertexShader, fragmentShader: p.fragmentShader, uniforms: {} });
        mesh.userData.programKey = p;
      }
      const u = mesh.material.uniforms;
      for (const [name, value] of Object.entries(common)) u[name] = { value };
      // CBWorld: the three stored rows of the particle's matrix (modeldraw's `world`)
      for (let r = 0; r < 3; r++) u['CBWorld_fWorld_r' + r] = { value: new THREE.Vector4(...d.world.slice(4 * r, 4 * r + 4)) };
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
      u.tDepthMap = { value: this.farDepth };
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
    if (!t){ t = { value: null }; getTexture(file).then(tex => { t.value = tex; }); this.textures.set(file, t); }
    return t.value;
  }

  commonUniforms(renderer, cam){
    const { view, proj, viewProj, viewI } = cam;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    if (!this.farDepth){
      this.farDepth = new THREE.DataTexture(new Float32Array([1, 1, 1, 1]), 1, 1, THREE.RGBAFormat, THREE.FloatType);
      this.farDepth.needsUpdate = true;
    }
    return {
      CBViewProjection_fViewProj: viewProj, CBViewProjection_fView: view, CBViewProjection_fViewI: viewI,
      CBViewProjection_fProj: proj, CBViewProjection_fProjI: proj.clone().invert(), CBViewProjection_fViewProjI: viewProj.clone().invert(),
      CBViewProjection_fCameraPos: cam.position,
      CBScreen_fScreenSize: new THREE.Vector2(size.x, size.y), CBScreen_fScreenInverseSize: new THREE.Vector2(1 / size.x, 1 / size.y),
    };
  }

  cameraMatrices(camera){
    const S = new THREE.Matrix4().makeScale(MT_TO_VIEW, MT_TO_VIEW, MT_TO_VIEW);
    const view = new THREE.Matrix4().multiplyMatrices(camera.matrixWorldInverse, S);
    const proj = new THREE.Matrix4().multiplyMatrices(T_NEAR_IS_ZERO, camera.projectionMatrix);
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
      if (r && r.file) getTexture(r.file).then(tex => { t.value = tex; });
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
        this.group.add(mesh);
      }
      // vertices: each layout element as its own attribute over the draw's bytes
      const g = mesh.geometry;
      const n = d.vertices;
      for (const a of p.attributes){
        const f = FORMATS[a.format];
        const width = f.size * a.count;
        const src = d.vertexBytes;
        const bytesOut = new Uint8Array(n * width);
        for (let v = 0; v < n; v++) bytesOut.set(src.subarray(v * d.stride + a.offset, v * d.stride + a.offset + width), v * width);
        g.setAttribute(a.name, new THREE.BufferAttribute(new f.array(bytesOut.buffer), a.count, f.normalized));
      }
      g.setIndex(stripsToTriangles(d.indexList));
      g.setDrawRange(0, Infinity);
      // material: one per program and draw slot; uniforms are this draw's
      if (!mesh.material || mesh.userData.programKey !== p){
        mesh.material = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: p.vertexShader, fragmentShader: p.fragmentShader, uniforms: {} });
        mesh.userData.programKey = p;
      }
      const mat = mesh.material;
      const u = mat.uniforms;
      for (const [name, value] of Object.entries(common)) u[name] = { value };
      for (const [name, { type, value }] of Object.entries(cbUniforms(this.shaders, d.cb))){
        const v = type === 'float' ? value[0] : type === 'vec2' ? new THREE.Vector2(...value) : type === 'vec3' ? new THREE.Vector3(...value)
                : type === 'vec4' ? new THREE.Vector4(...value) : type === 'mat4' ? new THREE.Matrix4().fromArray(value) : null;
        if (v !== null) u[name] = { value: v };
      }
      u.tBaseMap = { value: this.texture(d.textures.tBaseMap) };
      u.tPrimDepthMap = { value: this.farDepth };
      applyState(mat, this.shaders, d.blend, d.depth, d.raster);
      mesh.renderOrder = 1000 + k;                     // the order the ROM's sorted primitive layer drew in
      mesh.visible = !!(u.tBaseMap.value || !/BaseMap/.test(d.features.FPrimitiveSample || ''));
    }
    for (let k = prims.length; k < this.meshes.length; k++) this.meshes[k].visible = false;
  }

  detach(){
    if (this.group.parent) this.group.parent.remove(this.group);
    for (const mesh of this.meshes){ mesh.geometry.dispose(); if (mesh.material) mesh.material.dispose(); }
    for (const mesh of this.modelMeshes) if (mesh.material) mesh.material.dispose();   // the geometry is the glb's
    this.meshes.length = 0;
    this.modelMeshes.length = 0;
  }
}
