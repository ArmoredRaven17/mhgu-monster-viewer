p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\rom\effect\bridge.js'
s = open(p, encoding='utf8', newline='').read()
a = """// cUnit's empty virtual (vtable +0x2c of both the core and the effect): bx lr.
registerNative(0x1eba8, () => {});"""
b = """// 0x881d94 (READ whole, 0x881d94..0x881f08; Fanged-Wyvern lane 2026-10-18): the view's SPHERE test, a leaf with no stack frame
// -- (view, sphere {x, y, z, r}). The six planes {n, d} at ([view+0xd94] & ~0xf) + 0x10 i: dist = d + (y ny + x nx + z nz) in
// that order, each step rounded; dist < -r on any plane -> -1 (outside, returned at once); else bit i set where dist >= r
// (inside that plane), 0..0x3f. NaN takes neither test, as vcmpe's unordered N = 0 / GE false. r1 is kept, r2 left the plane
// base, s0 = r. A native and not a lift: the viewer's camera reaches plane outcomes a recording's camera does not (Lagiacrus
// u 61's bounds sphere, through the cull test 0xae9bc4's 0xae9d1c, refused at 0x881e38 lifted).
registerNative(0x881d94, (m, c) => {
  const v = c.r[0] >>> 0, sp = c.r[1] >>> 0;
  const base = (m.u32((v + 0xd94) >>> 0) & ~0xf) >>> 0;
  const x = m.f32(sp), y = m.f32(sp + 4), z = m.f32(sp + 8), r = m.f32(sp + 12), nr = f32(-r);
  let out = 0, gone = false;
  for (let i = 0; i < 6 && !gone; i++){
    const q = (base + 0x10 * i) >>> 0;
    let t = f32(y * m.f32(q + 4));
    t = f32(t + f32(x * m.f32(q)));
    t = f32(t + f32(z * m.f32(q + 8)));
    const dist = f32(m.f32(q + 12) + t);
    if (dist < nr) gone = true;
    else if (dist >= r) out |= 1 << i;
  }
  const r1 = c.r[1];
  clobber(c, true);
  c.r[0] = gone ? 0xffffffff : out; c.r[1] = r1; c.r[2] = base;
  c.sf[0] = r;
});
// cUnit's empty virtual (vtable +0x2c of both the core and the effect): bx lr.
registerNative(0x1eba8, () => {});"""
assert s.count(a) == 1
s = s.replace(a, b)
# f32 is declared further down (const f32 = Math.fround) -- used only when the native runs, after module init
open(p, 'w', encoding='utf8', newline='').write(s)

p = r'C:\MHGU-Extract\efx\lift-effects.sh'
t = open(p, newline='').read()
assert t.count(' 0x881d94') == 1
t = t.replace(' 0x881d94', '')
open(p, 'w', newline='').write(t)
print('ok')
