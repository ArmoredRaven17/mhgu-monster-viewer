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
