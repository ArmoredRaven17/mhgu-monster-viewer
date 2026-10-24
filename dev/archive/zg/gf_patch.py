p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\rom\effect\construct.js'
s = open(p, encoding='utf8', newline='').read()
a = """  if (!(f118 & 0x8000000) && m.u16(nb + 0xbe) !== 0) throw new Unverified('0xae997c node block +0xbe');
  m.w32(g + 0x50, (m.u32(g + 0x50) & ~0x0f000000) >>> 0);
"""
b = """  // 0xae9970..0xae99e8 (READ 2026-10-18, Fanged-Wyvern lane; Lagiacrus u 61's discharge): node block +0xbe is the u16 offset,
  // from the node block, of its BOUNDS block; with [[g+8]+0x118] bit 27 clear, the offset set and node block +0xa2's low nibble
  // set, the nibble goes to g+0x50 bits 24..27 and the bounds are copied: radius [+0x20] -> g+0x80, [+0x24] -> g+0x84, a vec3
  // [+0..8] -> g+0x60 (w 0), a vec3 [+0x10..0x18] -> g+0x70 (w 0). Consumers (lifted): 0xa64894 (bit 0 a sphere of [g+0x80]
  // x scale about the owner, bit 1 the box owner + scale x [g+0x60] / [g+0x70], bit 2 [g+0x84]) and the cull tests 0xae9bc4 /
  // 0xaec0xx (bit 2 / bit 0 / bit 1; 0xae9dc4 and 0xaec1fc keep a generator outside the view drawn while bits 24 / 25 are set).
  // Otherwise (0xae99ec) the nibble is cleared.
  let bounds = 0;
  if (!(f118 & 0x8000000)){
    const off = m.u16(nb + 0xbe);
    if (off !== 0) bounds = m.u16(nb + 0xa2) & 0xf;
    if (bounds){
      const v = (nb + off) >>> 0;
      m.w32(g + 0x50, ((m.u32(g + 0x50) & ~0x0f000000) | (bounds << 24)) >>> 0);
      m.w32(g + 0x80, m.u32(v + 0x20)); m.w32(g + 0x84, m.u32(v + 0x24));
      m.w32(g + 0x60, m.u32(v)); m.w32(g + 0x64, m.u32(v + 4)); m.w32(g + 0x68, m.u32(v + 8)); m.w32(g + 0x6c, 0);
      m.w32(g + 0x70, m.u32(v + 0x10)); m.w32(g + 0x74, m.u32(v + 0x14)); m.w32(g + 0x78, m.u32(v + 0x18)); m.w32(g + 0x7c, 0);
    }
  }
  if (!bounds) m.w32(g + 0x50, (m.u32(g + 0x50) & ~0x0f000000) >>> 0);
"""
assert s.count(a) == 1
s = s.replace(a, b)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
