p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\rom\effect\bridge.js'
s = open(p, encoding='utf8', newline='').read()
a = """// cUnit's empty virtual (vtable +0x2c of both the core and the effect): bx lr."""
b = """// 0x4187c (READ whole, 0x4187c..0x419dc; 2026-10-18): THE SLOT POOL'S FREE-SLOT FINDER -- (mgr, bank), a leaf (push r4, lr
// only). bank > 2 -> 0; five bitmap words at mgr + 0x74 + 20 bank + 4k, k = 0..4; the first word not 0xffffffff gives its
// lowest clear bit x = ~w & -~w, looked up through the de Bruijn table at mgr + 0x770: [((hi(x * 0x27179461) + x * 0x03f566ed)
// mod 2^32) >> 26]; a looked-up 0x40 (no bit) goes on to the next word; the slot is that + 32k. All five full -> -1 (0x419d4),
// and in the fifth word a 0x40 also -> -1 (0x419a0 mvneq). The caller 0x41808 (lifted, both arms) stores the object at
// [mgr + 0xb0 + 0x240 bank + 4 slot] BEFORE its `pophi` (slot > 0x8f: 144 slots per bank), so a full pool leaves the object
// unregistered (and that store lands one word below the bank, as the ROM's does) -- the pool degrades, nothing stops. A native
// and not a lift: a looping clip's pile-up (Mizutsune's puddles, Soulseer's flames) reaches words 1..4 and the full pool, which
// no recording reached ("0x418d4 falls into unrecorded code").
registerNative(0x4187c, (m, c) => {
  const mgr = c.r[0] >>> 0;
  let bank = c.r[1] >>> 0;
  if (bank > 2) bank = 0;
  const base = (mgr + 20 * bank) >>> 0;
  let out = 0xffffffff;
  for (let k = 0; k < 5; k++){
    const w = m.u32((base + 0x74 + 4 * k) >>> 0);
    if (w === 0xffffffff) continue;
    const nw = (~w) >>> 0, x = (nw & ((0 - nw) >>> 0)) >>> 0;
    const p = BigInt(x) * 0x27179461n;
    const hi = Number((p >> 32n) & 0xffffffffn);
    const idx = ((hi + Math.imul(x, 0x03f566ed)) >>> 0) >>> 26;
    const t = m.u32((mgr + 0x770 + 4 * idx) >>> 0);
    if (t === 0x40){ if (k === 4) break; continue; }
    out = (t + 32 * k) >>> 0;
    break;
  }
  const r4 = c.r[4];
  clobber(c, true);
  c.r[0] = out; c.r[1] = out; c.r[4] = r4;
});
// cUnit's empty virtual (vtable +0x2c of both the core and the effect): bx lr."""
assert s.count(a) == 1
s = s.replace(a, b)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
