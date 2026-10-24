p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n' if '\r\n' in s else '\n'
def fix(t): return t.replace('\r\n', '\n').replace('\n', NL)
def rep(a, b):
    global s
    a, b = fix(a), fix(b)
    assert s.count(a) == 1, (s.count(a), a[:80])
    s = s.replace(a, b)
rep("""  if (placed){ S.events = []; snap24(S, own, ctx, D); }                  // setup +0x12 == 1 (0x40e6b4)
  return S;""", """  if (placed){ S.events = []; snap24(S, own, ctx, D); }                  // setup +0x12 == 1 (0x40e6b4)
  // what the init leaves (the placed one's landing included)
  Object.assign(S.launch, { position: S.position.slice(), velocity: S.velocity.slice(), gravity: S.gravity.slice(), angles: S.angles.slice(), timer: S.life });
  return S;""")
rep("""  S.position = setup.position.map(f);                                // sp_13's init: +0x40 = setup +0x10
  S.anchor = S.position.slice();""", """  S.position = setup.position.map(f);                                // sp_13's init: +0x40 = setup +0x10
  S.anchor = S.position.slice();
  Object.assign(S.launch, { position: S.position.slice(), angles: [0, 0, 0], life: k.life });""")
rep("""  S.angles = A;
  S.timer = k.life;
  S.position = p;
  S.anchor = p.slice();
  // base03's init: the ground under the point""", """  S.angles = A;
  S.timer = k.life;
  S.position = p;
  S.anchor = p.slice();
  S.gravity = ZERO3.slice();                             // +0x1020: base00's +0x170 turns +0x161c, which this reader never writes
  // base03's init: the ground under the point""")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
