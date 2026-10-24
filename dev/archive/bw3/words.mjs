// The proposed psl-mask.js transcriptions (em063 / em080), run by jscheck.py against unicorn.
export function baseMask({ rage = false, tired = false } = {}){
  return 0x3f | (rage ? 0xe00 : tired ? 0x7000 : 0x1c0);
}
// BRACHYDIOS / RAGING: v0 = variant byte 0 (Brachydios). state.armRow = [slot 0, slot 1] rows (ctl+0x20 / +0x2c) for the
// check; the viewer form is state.armEmpty = [left, right].
const EM063_L2M42 = n => (n >= 0xa1 && n <= 0xb0 && ((0x8025 >>> (n - 0xa1)) & 1)) || n === 0x14 || n === 0x08;
export const em063 = v0 => (motion, action, state) => {
  let r = state.severed ? 0 : 0x18000000;
  if (v0){
    const e = state.armEmpty || [false, false];
    if (e[1]) r |= 0x180000;
    if (e[0]) r |= 0x600000;
  }
  const n = action && action[0] === 7 ? action[1] : -1;
  if (motion === 0x22a) return r | (EM063_L2M42(n) ? 0x60000 : 0);
  if (motion === 0x229) return r | (n === 9 ? 0x60000 : 0);
  if (motion === 0x00a) return r | (state.sunk ? 0 : 0x18000);
  return r;
};
// GLAVENUS / HELLBLADE: state.heat = the P+0x1bb byte (bit 0 tail dark, 1 hot, 2 throat lit, 3 tail overheat, 4 throat
// overheat).
export function em080(motion, action, state){
  const h = state.heat | 0;
  const throat = (h & 0x10) ? 0x70000000 : (h & 4) ? 0x38000 : 0xc000000;
  const tail = (h & 8) ? 0x3000000 : (h & 2) ? 0xc0000 : (h & 1) ? 0xc00000 : 0x300000;
  return throat | tail;
}
export function word(cls, motion, action, state){
  const r = cls(motion, action, state);
  return (baseMask(state) | r) >>> 0;
}
