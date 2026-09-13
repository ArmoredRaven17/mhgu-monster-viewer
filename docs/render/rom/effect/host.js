// THE EFFECT HOST: what the engine around an effect provides, laid out where the ROM's code reads it.
//
// The effect runtime (construct.js, load.js, owner.js and the particle layers) and the draws
// (lifted-draw.js, lifted-prim.js, modeldraw.js) are translations of MHGU's routines over flat memory.
// They reach the engine through a handful of objects and services, and this file supplies them the way
// the emulator harness that verified them does (C:\MHGU-Extract\efx: efx_emu.py, efx_load.py,
// efx_draw.py, engdraw.py, engprim.py, parent.py) -- so a check can run the same frames here and
// compare what comes out with what the ROM produced there.
//
//   the heap              0x189f148 +0x20 -> an allocator object; vtable +0x1c alloc, +0x34 free
//                         (bridge.js natives at 0x7e000000 / 0x7e000104, the harness's stub entries)
//   resources             rEffectList / rEffectAnim / rModel / rTexture handles for the loader
//   a parent unit         +0x54 uModel's joint matrix 0x939278 over +0x494 joints / +0x498 table
//   the draw context      VIEW: the package table (one object per shader record), the constant
//                         buffer descriptors, a per-frame buffer, the camera block
//   the draw system       *0x211f8b4: its constructor's fields (docs/effects/draw-system.json),
//                         one worker PRIM with its primitive list, dynamic vertex buffer and
//                         texture-set registry
//
// The engine's own draw submission is where the host's output is: every Model particle mesh draw
// (modeldraw.js's answer) and every primitive GPU draw (the context's selected shader records,
// constant buffers, blend / depth / rasterizer states, textures, and the vertex and index bytes).
import { Mem, bitsf32 } from './mem.js';
import { newEffect, startEffect } from './construct.js';
import { loadEffectList, loadEffectAnim, DTI } from './load.js';
import { move } from './owner.js';
import { drawEffect } from './draw.js';
import { invoke } from './cpu.js';
import * as modeldraw from './modeldraw.js';
import './prim.js';

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const u32bytes = v => new Uint8Array(new Uint32Array([v >>> 0]).buffer);

export class EffectHost {
  // pages: [[address, Uint8Array], ...] -- the image the runtime reads (data sections after the static
  //        initialisers and the effect manager, as the emulator leaves them)
  // heap: the first free address; records: docs/effects/mfx-records.json .records;
  // drawSystem: docs/effects/draw-system.json's bytes; resources: { meshTable(name) -> { count, table },
  //        textureSize(name) -> [w, h], anim(name) -> .ean bytes, material(name, index) -> modeldraw's answers }
  constructor({ pages, heap, records, drawSystem, resources, allocator = 0x600f0000 }){
    const m = this.m = new Mem();
    for (const [a, bytes] of pages) m.load(a, bytes);
    this.heap = heap >>> 0;
    this.records = records;
    this.drawSystem = drawSystem;
    this.resources = resources;
    this.streams = new Map();
    this.pendingAnims = [];
    this.handles = new Map();                 // resource handle -> { dti, name }
    this.ids = 0;
    this.modelDraws = [];
    this.primDraws = [];
    const host = this;
    m.svc = {
      alloc: (size) => host.malloc(size),
      free(){},
      nextId: () => ++host.ids,
      streamSize: s => host.streams.get(s).length,
      streamRead(s, buf, n){ const d = host.streams.get(s); m.load(buf, d.subarray(0, n)); return Math.min(n, d.length); },
      loadResource: (dti, path, flags) => host.loadResource(dti, path, flags),
      beginModel: (args, stack) => modeldraw.beginModel(m, args[0], args[1], args[2], args[3], stack),
      drawMesh: (args, stack, c) => host.modelDraws.push(Object.assign(
        modeldraw.drawMesh(m, args[0], args[1], args[2], args[3], stack, c.sf[0], (model, index) => host.material(model, index)),
        { model: (host.handles.get(args[0] && m.u32(args[0] + 0x70)) || {}).name })),
      drawBegin(){},
      renderSetup(){},
      primDraw: (args, stack) => host.primDraw(args, stack),
      drawEnd: () => host.primDrawEnd(),
    };
    this.allocator = allocator;
  }

  malloc(n){
    const a = this.heap;
    this.heap = (this.heap + ((Math.max(n, 4) + 31) & ~31)) >>> 0;
    this.m.load(a, new Uint8Array(Math.max(n, 4)));
    return a;
  }
  cstr(a){ let s = ''; for (let c; (c = this.m.rawByte(a)) !== 0; a++) s += String.fromCharCode(c); return s; }
  stream(bytes){ const s = this.malloc(0x40); this.streams.set(s, bytes); return s; }

  // The resource manager's load (vtable +0x30). A handle is a blank object except for what the
  // effect code and the draws read of it: rModel +0x74 / +0x78 the .mod's 48-byte mesh table and count
  // (0xb460c8), rTexture +0xd0 a texture object with the .tex size at +0x1e / +0x20 (nDraw::Texture);
  // an rEffectAnim is loaded from its .ean after the list (load.js).
  loadResource(dti, path){
    const m = this.m, name = this.cstr(path);
    const handle = this.malloc(0x200);
    this.handles.set(handle, { dti, name });
    if (dti === DTI.rEffectAnim) this.pendingAnims.push([handle, name]);
    if (dti === DTI.rModel){
      const { count, table } = this.resources.meshTable(name);
      const t = this.malloc(48 * count);
      m.load(t, table);
      m.load(handle + 0x74, new Uint8Array(new Uint32Array([t, count]).buffer));
    }
    if (dti === DTI.rTexture){
      const [w, h] = this.resources.textureSize(name);
      const tex = this.malloc(0x100);
      m.load(tex + 0x1e, new Uint8Array(new Uint16Array([w, h]).buffer));
      m.load(handle + 0xd0, u32bytes(tex));
      this.handles.set(tex, { dti, name, texture: true });
    }
    return handle;
  }
  material(model, index){ return this.resources.material(this.handles.get(model).name, index); }

  // An effect from its .efl bytes: uEffect::newInstance, the list loaded onto it. Not started.
  createEffect(efl){
    const m = this.m;
    const owner = newEffect(m);
    if (!this.setupDone){
      // the allocator object where the harness keeps it (efx_emu.ALLOC_OBJ, its vtable at +0x1000):
      // lifted code calls through vtable +0x1c (alloc) and +0x34 (free)
      m.w32(this.allocator, this.allocator + 0x1000);
      m.w32(this.allocator + 0x1000 + 0x1c, 0x7e000000);
      m.w32(this.allocator + 0x1000 + 0x34, 0x7e000104);
      m.load(0x189f168, u32bytes(this.allocator));        // heap table +0x20 -> the allocator object
      const resmgr = this.malloc(0x100); this.malloc(0x400);
      m.load(0x211fa64, u32bytes(resmgr));
      this.malloc(0x400);                                  // the streams' vtable
      this.setupDone = true;
    }
    const list = this.malloc(0x98 + 0x100);
    if (loadEffectList(m, list, this.stream(efl)) !== 1) throw new Error('effect list load failed');
    for (const [h, name] of this.pendingAnims.splice(0)){
      if (loadEffectAnim(m, h, this.stream(this.resources.anim(name))) !== 1) throw new Error('effect anim load failed: ' + name);
    }
    m.w32(owner + 0xf4, list);
    return owner;
  }
  start(owner){ if (startEffect(this.m, owner) !== 1) throw new Error('effect start failed'); }
  move(owner){ move(this.m, owner); }

  // A parent unit for joint-bound nodes: 0x939278 at vtable +0x54, a live unit's +0xc, the joint
  // number -> index table at +0x498 and the joint array at +0x494 (0xa0 bytes each, the world matrix
  // at +0x10, row-major with the translation in the last row), the unit's own matrix at +0xb0.
  createParent(jointNumbers){
    const m = this.m;
    const P = this.malloc(0x1000), VT = this.malloc(0x400), TABLE = this.malloc(0x100);
    const ARRAY = this.malloc(0xa0 * jointNumbers.length);
    m.w32(VT + 0x54, 0x939278);
    m.w32(P, VT);
    m.w32(P + 0xc, 0xf4ff9);
    m.load(TABLE, new Uint8Array(0x100).fill(0xff));
    jointNumbers.forEach((j, i) => m.w8(TABLE + j, i));
    m.w32(P + 0x494, ARRAY); m.w32(P + 0x498, TABLE);
    this.writeMatrix(P + 0xb0, IDENTITY);
    return { object: P, vtable: VT, table: TABLE, array: ARRAY, joints: jointNumbers.slice() };
  }
  setJointMatrix(parent, jointNumber, rows16){
    this.writeMatrix(parent.array + 0xa0 * parent.joints.indexOf(jointNumber) + 0x10, rows16);
  }
  attach(owner, parent){ this.m.w32(owner + 0x30, parent.object); }
  writeMatrix(a, list){ const u = new Uint32Array(new Float32Array(list).buffer); u.forEach((w, i) => this.m.w32(a + 4 * i, w)); }

  // ---- the draw ---------------------------------------------------------------------------------
  // camera: { position: [x,y,z], view: 16 floats (row-major, translation in the last row), world: 16 }
  initDraw(camera, passMask = 1){
    const m = this.m, recs = this.records;
    const obj = (size, align16 = false) => { let a = this.malloc(size + 16); if (align16) a = (a + 15) & ~15; return a >>> 0; };
    const VIEW = this.VIEW = obj(0x40000), CAM = this.CAM = obj(0x400, true), SYS = this.SYS = obj(0x400);
    const PRIM = this.PRIM = obj(0x40000), BUF = this.BUF = obj(0x100000);
    m.w16(VIEW + 0x16a, passMask);
    m.w32(VIEW + 0xd7c, CAM);
    this.setCamera(camera);
    m.w32(0x211f8b4, SYS);
    m.load(SYS, this.drawSystem);                           // the constructor's fields
    m.w32(SYS + 0x2c, PRIM);
    m.w32(PRIM + 0x54, 1);
    const LIST = this.LIST = obj(0x400), RECS = this.RECS = obj(0x28 * 4096), ENTS = this.ENTS = obj(8 * 4096);
    m.w32(PRIM + 4, LIST);
    m.w32(LIST + 0x74, RECS); m.w32(LIST + 0x78, ENTS); m.w32(LIST + 0x7c, 4096); m.w32(LIST + 0x64, 1);
    const VB = this.VB = obj(0x40), VBDATA = this.VBDATA = obj(0x100000);
    m.w32(PRIM + 8, VB); m.w32(VB + 8, 0x100000); m.w32(VB + 0x14, VBDATA);
    const TEXSETS = this.TEXSETS = obj(20 * 256);
    m.w32(PRIM + 0x248 + 4, TEXSETS); m.w32(PRIM + 0x248 + 0xc, 256);
    m.w32(VIEW + 0x14, BUF); m.w32(VIEW + 0x18, BUF + 0x100000);
    // the package: one object per record, so a slot's value names its record
    const n = recs.length;
    const FAKE = this.FAKE = this.malloc(0x40 * n), PKG = this.malloc(8 * n + 64);
    for (let i = 0; i < n; i++) m.w32(PKG + 8 * i, FAKE + 0x40 * i);
    const CBTAB = this.CBTAB = this.malloc(4 * n + 64), CBDEF = this.malloc(0x1000);
    // a constant buffer's descriptor stands in for its package record: +0x18 is the record's word 6,
    // (member count << 16) | float count with padding, which the draws mask ((w << 2) & 0x3fffc)
    for (let i = 0; i < n; i++){
      const r = recs[i];
      if (!r || r[1] !== 0) continue;
      const d = this.malloc(0x40);
      m.w32(d + 0x18, r[2]); m.w32(d + 0x24, CBDEF);
      m.w32(CBTAB + 4 * i, d);
    }
    m.w32(VIEW + 0x10, PKG); m.w32(VIEW + 8, CBTAB);
    for (let i = 0; i < n; i++){
      const r = recs[i];
      if (r && (r[1] === 4 || r[1] === 5 || r[1] === 6)) m.w32(VIEW + 0x204 + 8 * i, FAKE + 0x40 * i);
    }
    // the draw system's texture-set registry shares the worker's (one worker, base index 0)
    const REG = this.malloc(0x10);
    m.w32(REG + 4, TEXSETS); m.w32(REG + 8, 256);
    m.w32(SYS + 0x54, 1); m.w32(SYS + 0x58, REG);
    this.VBUF = this.malloc(0x100000); this.IBUF = this.malloc(0x40000);
  }
  setCamera({ position, view, world }){
    const m = this.m, CAM = this.CAM;
    this.writeMatrix(CAM + 0x40, position);
    this.writeMatrix(CAM + 0x70, view);
    this.writeMatrix(CAM + 0xb0, world);
    this.writeMatrix(CAM + 0xf0, IDENTITY);
    this.writeMatrix(CAM + 0x130, IDENTITY);
  }

  // One view's frame: the primitive layer opened, the effects drawn into it, the layer drawn.
  drawFrame(owners){
    const m = this.m;
    this.modelDraws = []; this.primDraws = [];
    m.w32(this.VIEW + 0x14, this.BUF); m.w32(this.VIEW + 0x18, this.BUF + 0x100000);
    m.w32(this.LIST + 0x74, this.RECS); m.w32(this.LIST + 0x78, this.ENTS);
    m.w32(this.LIST + 0x80, 0); m.w32(this.LIST + 0x64, 0);
    m.w32(this.VB + 0xc, 0); m.w32(this.VB + 0x14, this.VBDATA); m.w32(this.VB + 4, 0);
    m.w32(this.PRIM + 0x248 + 8, 0);
    m.w32(this.PRIM + 0x54, 0);
    invoke(m, 0xbad710, [this.SYS, this.VIEW, 0, 0], [0]);
    for (const o of owners) drawEffect(m, o, this.VIEW);
    invoke(m, 0xbad790, [this.SYS, this.VIEW, 0, 0]);
    return { models: this.modelDraws, prims: this.primDraws };
  }

  recordName(v){
    const k = (v - this.FAKE) / 0x40;
    return (Number.isInteger(k) && k >= 0 && this.records[k]) ? this.records[k][0] : null;
  }
  // 0x881584: room for the batch. The context is read here -- every slot the draw leaves selected.
  primDraw(args, stack){
    const m = this.m, ctx = args[0] >>> 0, recs = this.records;
    const features = {}, textures = {}, samplers = {}, cb = {};
    for (let i = 0; i < recs.length; i++){
      const r = recs[i];
      if (!r) continue;
      const v = m.rawByte(ctx + 0x204 + 8 * i) | (m.rawByte(ctx + 0x205 + 8 * i) << 8) |
                (m.rawByte(ctx + 0x206 + 8 * i) << 16) | (m.rawByte(ctx + 0x207 + 8 * i) << 24);
      if (!v) continue;
      if (r[1] === 2) features[r[0]] = this.recordName(v >>> 0);
      else if (r[1] === 1){ const h = this.handles.get(v >>> 0); textures[r[0]] = h ? h.name : '0x' + (v >>> 0).toString(16); }
      else if (r[1] === 3) samplers[r[0]] = this.recordName(v >>> 0);
      else if (r[1] === 0 && r[2]){
        const words = [];
        for (let k = 0; k < (r[2] & 0xffff); k++) words.push(m.u32((v >>> 0) + 4 * k));
        cb[r[0]] = words;
      }
    }
    m.load(stack[1] >>> 0, u32bytes(this.IBUF));
    this.pending = { vertices: args[2] >>> 0, indices: args[3] >>> 0, stride: stack[0] >>> 0, features, textures, samplers, cb,
                     blend: this.recordName(m.u32(ctx + 0x118)), depth: this.recordName(m.u32(ctx + 0x11c)),
                     raster: this.recordName(m.u32(ctx + 0x120)), layout: m.u32(ctx + 0x154) };
    return this.VBUF;
  }
  primDrawEnd(){
    const d = this.pending;
    if (!d) return;
    const m = this.m;
    d.vertexBytes = new Uint8Array(d.vertices * d.stride);
    for (let i = 0; i < d.vertexBytes.length; i++) d.vertexBytes[i] = m.rawByte(this.VBUF + i);
    d.indexList = new Uint16Array(d.indices);
    for (let i = 0; i < d.indices; i++) d.indexList[i] = m.rawByte(this.IBUF + 2 * i) | (m.rawByte(this.IBUF + 2 * i + 1) << 8);
    this.primDraws.push(d);
    this.pending = null;
  }
}
