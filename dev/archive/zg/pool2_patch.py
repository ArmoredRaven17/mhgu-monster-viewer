p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\rom\effect\bridge.js'
s = open(p, encoding='utf8', newline='').read()
a = """// cUnit's empty virtual (vtable +0x2c of both the core and the effect): bx lr."""
b = """// 0x419e0 (READ whole, 0x419e0..0x41b14; 2026-10-18): THE SLOT POOL'S RELEASE -- (mgr, obj, kind), 0x41808's partner: obj 0 ->
// nothing; bank as 0x41808's (kind 2 -> 1, 3 -> 2, else 0). For each of the bank's five bitmap words, its SET bits low to high
// (the same de Bruijn lookup, as a 64-bit walk whose high word stays 0), slot = bit + 32k: the first whose table entry
// [mgr + 0xb0 + 0x240 bank + 4 slot] is obj is cleared (0), and its bit cleared when slot <= 0x8f; then return. A word run out
// goes to the next (0x41a94 -> 0x41ac8, what a pile-up reaches: "branch to unrecorded 0x41ac8"); not found -> nothing.
registerNative(0x419e0, (m, c) => {
  const mgr = c.r[0] >>> 0, obj = c.r[1] >>> 0, kind = c.r[2] >>> 0;
  const keep = [4, 5, 6, 7, 8, 9, 10, 11].map(k => c.r[k]);
  if (obj !== 0){
    const bank = kind === 2 ? 1 : kind === 3 ? 2 : 0;
    const bits = (mgr + 20 * bank) >>> 0, tab = (mgr + 0x240 * bank) >>> 0;
    const look = x => {
      const p = BigInt(x) * 0x27179461n;
      const hi = Number((p >> 32n) & 0xffffffffn);
      return m.u32((mgr + 0x770 + 4 * (((hi + Math.imul(x, 0x03f566ed)) >>> 0) >>> 26)) >>> 0);
    };
    done: for (let k = 0; k < 5; k++){
      let w = m.u32((bits + 0x74 + 4 * k) >>> 0);
      if (w === 0) continue;
      for (;;){
        const t = look((w & ((0 - w) >>> 0)) >>> 0);
        if (t === 0x40) break;
        const slot = (t + 32 * k) >>> 0, at = (tab + 0xb0 + 4 * slot) >>> 0;
        if (m.u32(at) === obj){
          m.w32(at, 0);
          if (slot <= 0x8f){
            const wa = (bits + 0x74 + 4 * (slot >>> 5)) >>> 0;
            m.w32(wa, (m.u32(wa) & ~(1 << (slot & 31))) >>> 0);
          }
          break done;
        }
        w = (w & ~(1 << t)) >>> 0;
        if (w === 0) break;
      }
    }
  }
  clobber(c);
  [4, 5, 6, 7, 8, 9, 10, 11].forEach((k, i) => { c.r[k] = keep[i]; });
});
// cUnit's empty virtual (vtable +0x2c of both the core and the effect): bx lr."""
assert s.count(a) == 1
s = s.replace(a, b)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
