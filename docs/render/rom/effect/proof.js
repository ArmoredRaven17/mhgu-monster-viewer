// A MONSTER'S EFFECT REQUEST: what the game does to a uEffect it starts from an rProofEffectList record.
//
// A monster never names an effect file; it asks for an effect id (enemy vtable +0x1cc / +0x1d0), the id
// becomes a record key, and uMHProofEffect builds the effect the record describes
// (E:\offline\decode\notes\effects-firing.md). This is that build, for the records a joint-bound effect
// uses -- placement states 0..2 with a live parent -- the same as C:\MHGU-Extract\efx\proof.py does under
// the emulator:
//
//   the parameter block   uProofEffect's ctor (0x31b6b0) and the record copied over it (0x31c4ac); a
//                         fresh block's override words are 0, so every field comes from the record
//   0x32a2c4              uEffect +0x114 top nibble := 3 (parent mode 3: the parent is not applied at the
//                         effect's root; joint-bound nodes still follow its joints)
//   0x9ba5d8              quaternion, parent, ROOT JOINT, offset; row masks +0x1c8 / +0x1cc; the list set
//                         through vtable +0x6c (0x9ba238), which STARTS the effect (vtable +0xd0)
//   0x9ba544              the masks and the list again: a reset (vtable +0xd4) and a second start
//   0x32a3c0..0x32a494    scale, +0x38, +0x110's high half, +0x118's low nibble
//
// So the effect this returns is started; start() must not be called on it again. The ROM routines are
// lifted (lifted-proof.js, checked against efx/vecproof.py's vectors); the stores between them are
// transcribed from 0x32a284.
import { Unverified } from './mem.js';
import { liftedCall } from './bridge.js';
import './lifted-proof.js';
import './lifted-request.js';
import { registerCode, ownerMatrix } from './owner.js';

// uMHProofEffect's owner matrix (vtable +0x50, 0x3273e8) is a branch to uEffect's.
registerCode(0x3273e8, (m, o) => ownerMatrix(m, o));

const QUAT_GOT = 0x1832ad8;          // 0x32a300: the quaternion the start passes (identity)

// 0x329d88: the compose state from the block's placement mode (+0x46), +0x48 and +0x4e
function composeState(m, block){
  const mode = m.u8(block + 0x46);
  if (mode === 4) return 0;
  if (mode === 1) return 2;
  if (mode === 0) return m.u8(block + 0x48) === 1 ? 1 : 0;
  return m.u8(block + 0x4e) === 6 ? 3 : 4;
}

// payload: the record's 160 fixed bytes (Uint8Array). scratch(size) -> an address the block and the
// payload may live at for the call (the harness allocates them from its heap, in this order).
export function proofStart(m, owner, list, parent, payload, scratch){
  const block = scratch(0x100);
  liftedCall(m, 0x31b6b0, [block]);
  const pay = scratch(0xa0);
  m.load(pay, payload);
  liftedCall(m, 0x31c4ac, [block, pay]);
  const state = composeState(m, block);
  if (state > 2) throw new Unverified('0x32a320 proof start in placement state ' + state);
  const mask1 = m.u32(block + 0x58), mask2 = m.u32(block + 0x5c);
  const joint = (m.u16(block + 0x42) << 16) >> 16;
  // 0x32a2c4: a block store of +0x110..+0x118 with +0x114's top nibble := 3
  const w0 = m.u32(owner + 0x110), w1 = m.u32(owner + 0x114), w2 = m.u32(owner + 0x118);
  m.w32(owner + 0x110, w0); m.w32(owner + 0x114, ((w1 & 0x0fffffff) | 0x30000000) >>> 0); m.w32(owner + 0x118, w2);
  liftedCall(m, 0x9ba5d8, [owner, list, mask1, mask2], [m.u32(QUAT_GOT), parent, joint >>> 0, block + 0x10, 4]);
  liftedCall(m, 0x9ba544, [owner, list, mask1, mask2]);
  // 0x32a3c0..0x32a494
  for (let k = 0; k < 12; k += 4) m.w32(owner + 0x60 + k, m.u32(block + 0x30 + k));
  m.w32(owner + 0x6c, 0);
  m.w16(owner + 0x38, m.u8(block + 0x47));
  const v = m.u16(block + 0x60);
  if ((((v - 1) >>> 0) >>> 3) <= 0x4a) m.w32(owner + 0x110, ((m.u32(owner + 0x110) & 0xffff) | (v << 16)) >>> 0);
  const k = m.u8(block + 0x4b);
  if (k <= 2) m.w32(owner + 0x118, ((m.u32(owner + 0x118) & ~0xf) | [0, 1, 3][k]) >>> 0);
  return { state, mask1, mask2, joint };
}

// ---- a monster's effect request, whole (C:\MHGU-Extract\efx\proofunit.py) -----------------------------------
//
// In the game the effect a request makes is not a plain uEffect: a uMHEffectCore (0x350 bytes) makes a
// uMHProofEffect (0x500), whose own update (0x43d5c) and move (0x43da0 -> 0x327188) recompose it from the
// monster every frame -- its root at the joint, its scale the record's times the monster's (uCoord +0x60) --
// before uEffect's move. This builds the same objects the harness builds, in the same order, and runs them
// with the same unit passes; every routine is lifted (lifted-request.js) from efx/vecproofunit.py's vectors.
// The stand-ins are the harness's (proofunit.py's header lists them), answered by bridge.js at its fixed
// addresses through m.svc: registerUnit, handleValid, handleUnit, requestLoad.
import { ALLOCATOR, REQUEST_LOAD, HANDLE_VALID, HANDLE_GET } from './bridge.js';

const RECORD_VT_GOT = 0x32288c + 0x1512d40;          // 0x322884: the record object's vtable
const DT = 1.0;                                      // the frame delta a pass writes to a unit's +0x1c

// The boot objects, once per memory: the default heap and MtString's allocator on the host's allocator, the
// session singleton (mode 0) and the MH effect manager. Returns the request state the services read.
export function installRequests(m, malloc){
  const state = { units: [], lists: new Map(), handleParent: 0, malloc };
  m.svc.registerUnit = (sunit, line, unit) => { state.units.push([unit >>> 0, line >>> 0]); };
  m.svc.handleValid = () => 1;
  m.svc.handleUnit = () => state.handleParent;
  m.svc.requestLoad = (dti, path) => {
    let name = ''; for (let a = path, c; (c = m.u8(a)) !== 0; a++) name += String.fromCharCode(c);
    const list = state.lists.get(name);
    if (list === undefined) throw new Unverified('request load of ' + name + ': no list');
    return list;
  };
  m.w32(0x189f148 + 4, ALLOCATOR);
  m.w32(0x177feb0, ALLOCATOR);
  state.session = liftedCall(m, 0x3f6be8).r[0];
  state.manager = liftedCall(m, 0x4111c).r[0];
  if (!state.manager) throw new Unverified('MH effect manager: none');
  state.units.length = 0;
  return state;
}

const vslot = (m, obj, slot) => m.u32((m.u32(obj) + slot) >>> 0);

// record: { index, key, path, payload (Uint8Array) }; list: the loaded rEffectList handle for record.path;
// parent: the parent unit (host.createParent's object).
export class ProofRequest {
  constructor(m, state, { list, parent, record, area = 1 }){
    const malloc = state.malloc;
    this.m = m; this.state = state;
    m.w32(list + 0x50, (m.u32(list + 0x50) | 1) >>> 0);
    state.lists.set(record.path, list);
    m.w32(m.u32(m.u32(0x211fa64)) + 0x30, REQUEST_LOAD);
    state.handleParent = parent;
    const H = this.handle = malloc(0x40), HVT = malloc(0x40);
    m.w32(H, HVT); m.w32(HVT, HANDLE_VALID); m.w32(HVT + 4, HANDLE_GET);
    const idx = record.index;
    const L = this.list = malloc(0x100), recs = malloc(4 * (idx + 1));
    m.w32(L + 0x90, idx + 1); m.w32(L + 0x9c, recs);
    const R = this.record = malloc(0xc0);
    m.w32(R, (m.u32(RECORD_VT_GOT) + 8) >>> 0);
    liftedCall(m, 0x323724, [R]);
    const s = Array.from(record.path, ch => ch.charCodeAt(0));
    const string = malloc(s.length + 0xc);
    m.w32(string, 1); m.w32(string + 4, s.length);
    m.load(string + 8, new Uint8Array([...s, 0]));
    m.w32(R + 0x14, string);
    m.load(R + 0x20, record.payload);
    const kind = record.payload[0x3d];
    m.w32(R + 8, kind === 0 ? 1 : kind === 1 ? 2 : 3);
    m.w32(recs + 4 * idx, R);
    const Q = this.requester = malloc(0xe0);
    liftedCall(m, 0x40a54, [Q]);
    m.w8(Q + 0xc, area);
    m.w32(Q + 0xd0, H); m.w32(Q + 0x1c, (m.u32(Q + 0x1c) | 2) >>> 0);
    const C = this.core = malloc(0x350);
    liftedCall(m, 0x41e54, [C]);
    liftedCall(m, 0x328b48, [C, L, 2, idx], [Q + 0x10]);
    liftedCall(m, vslot(m, C, 0xb8), [C, m.u32(Q + 4)]);
    liftedCall(m, vslot(m, C, 0xc0), [C, m.u8(Q + 0xc)]);
    liftedCall(m, vslot(m, C, 0xc8), [C, m.u32(Q + 8)]);
    m.w32(C + 0x1b4, record.key);
    liftedCall(m, 0x42e4c, [C, 0, 2]);
    state.units.unshift([C, 0]);
  }
  // the uMHProofEffects the core has made (+0x150, +0x15c count)
  effects(){ const m = this.m; return Array.from({ length: m.u32(this.core + 0x15c) }, (_, i) => m.u32(this.core + 0x150 + 4 * i)); }
  // A one-shot's end, as efx lifecycle runs show it (Teostra's rage burst: its effect's unit goes to state 3
  // at frame 209 and leaves the core's array, the core goes to state 3 three frames later): the core in
  // state 3 with no effect left.
  finished(){ return (this.m.u32(this.core + 0xc) & 7) === 3 && this.m.u32(this.core + 0x15c) === 0; }
}

// THE UNIT MANAGER'S SIDE OF A UNIT'S END, which the harness's runs never needed. A unit in state 3 gets
// nothing from either pass below, so taking it off the list changes nothing a pass does; the game's manager
// deletes it. release() takes a request off the passes altogether -- its core and the effects it has made --
// for an effect the viewer stops: how the game ends a running effect (a fade, a kill) is not read.
export function pruneUnits(m, state){
  state.units = state.units.filter(([u]) => (m.u32(u + 0xc) & 7) !== 3);
}
export function releaseRequest(state, request){
  const gone = new Set([request.core, ...request.effects()]);
  state.units = state.units.filter(([u]) => !gone.has(u));
}

// One frame of the unit passes over every unit the requests registered (proofunit.py unit_frame).
export function unitFrame(m, state){
  for (const [u] of state.units.slice()){                                   // update pass
    m.wf32(u + 0x1c, DT);
    const w = m.u32(u + 0xc);
    if ((w & 7) === 1){ m.w32(u + 0xc, ((w & ~7) | 2) >>> 0); liftedCall(m, vslot(m, u, 0x18), [u]); }
    if ((m.u32(u + 0xc) & 0x407) === 0x402) liftedCall(m, vslot(m, u, 0x24), [u]);
  }
  for (const [u] of state.units.slice()){                                   // move pass
    const w = m.u32(u + 0xc);
    if ((w & 7) === 1){
      m.w32(u + 0xc, ((w & ~7) | 2) >>> 0);
      liftedCall(m, vslot(m, u, 0x18), [u]);
      if ((m.u32(u + 0xc) & 0x407) === 0x402){ liftedCall(m, vslot(m, u, 0x24), [u]); liftedCall(m, vslot(m, u, 0x2c), [u]); }
    }
    if ((m.u32(u + 0xc) & 0x407) === 0x402) liftedCall(m, vslot(m, u, 0x28), [u]);
  }
}
