// The proposed psl-mask.js transcription of uEm057_00 vt+0x13c = 0xf0279c, run by jscheck057.py against unicorn.
export function baseMask({ rage = false, tired = false } = {}){
  return 0x3f | (rage ? 0xe00 : tired ? 0x7000 : 0x1c0);
}
const Z57_NINE = n => (n >= 0x9d && n <= 0xab) || (n >= 0xf9 && n <= 0xfe);
const Z57_CHARGED_27 = new Set([0x201, 0x202, 0x20f, 0x212, 0x219, 0x21a, 0x225, 0x226, 0x227]);
const Z57_NINE_30 = new Set([0x201, 0x202, 0x228, 0x229, 0x22b, 0x22c]);
const Z57_ROAR = n => n === 0x09 || n === 0x22 || n === 0x26;
const Z57_L0M20 = n => n === 0x5e || n === 0x71 || n === 0x72 || n === 0x73;
export const em057 = v4 => (motion, action, state) => {
  const s = action ? action[0] : 0, n = action ? action[1] : -1;
  const charged = !!state.charged, g = (state.rank | 0) >= 5;
  const nine = state.b5f8 !== undefined ? state.b5f8 === 9 : (s === 7 && Z57_NINE(n));
  const died = state.diedCharged !== undefined ? !!state.diedCharged : charged;
  let set = 0, clear = 0;
  if (motion === 0x30d || motion === 0x315){
    if (s === 11) set = v4 ? (died ? 0xe00000 : 0x7000000) : (died ? 0xe00000 : 0);
  } else if (motion === 0x314){
    if (s === 1 && Z57_ROAR(n)) set = 0x8000;
  } else if (motion === 0x014){
    if (s === 7 && Z57_L0M20(n)){ clear = 0xfc0; set = v4 ? (charged ? 0x1c0000 : 0x38000000) : 0x1c0000; }
  } else if (motion === 0x018){
    set = s === 1 && n === 4 ? 0x7000000 : (!v4 || (s === 1 && n === 0x15) || charged) ? 0x1c0000 : 0x38000000;
  } else if (motion >= 0x23a && motion <= 0x23f){
    if (g) set = v4 ? (charged ? 0x38000000 : 0xe00000) : 0xc0000000;
  } else if (v4){
    if (motion === 0x201 || motion === 0x202){
      if (nine){ clear = 0x40; if (s === 7 && (n === 0xfb || n === 0xfc)) set = charged ? 0xc0000000 : 0x400000; }
      else if (charged){ clear = 0x40; set = 0x38000000; }
      else set = 0x40;
    } else if (Z57_CHARGED_27.has(motion)) set = charged ? 0x38000000 : 0xe00000;
    else if (motion === 0x228 || motion === 0x229 || motion === 0x22b || motion === 0x22c) set = charged ? 0xc0000000 : 0x400000;
    else if (motion === 0x218 && !charged){ set = 0xe00000; clear = 0x1; }
  }
  if (!v4 && charged && !(motion >= 0x23a && motion <= 0x23f) && motion !== 0x014 && motion !== 0x018 && motion < 0x30d)
    set |= nine ? (Z57_NINE_30.has(motion) ? 0xc0000000 : 0) : (Z57_CHARGED_27.has(motion) ? 0x38000000 : 0);
  if (v4 && g) clear |= 0xe00;
  return clear ? { set, clear } : set;
};
export function word(cls, motion, action, state){
  const r = cls(motion, action, state);
  if (r && typeof r === 'object') return ((baseMask(state) | r.set) & ~r.clear) >>> 0;
  return (baseMask(state) | r) >>> 0;
}
