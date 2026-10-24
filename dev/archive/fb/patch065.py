import os
SP = os.path.dirname(os.path.abspath(__file__))
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n' if '\r\n' in s else '\n'
def fix(t): return t.replace('\r\n', '\n').replace('\n', NL)
def rep(a, b):
    global s
    a, b = fix(a), fix(b)
    assert s.count(a) == 1, (s.count(a), a[:80])
    s = s.replace(a, b)
anchor = '// dev/rom-map.md "Ahtal-Ka -- shell57 / base57" (READ whole'
assert s.count(anchor) == 1
if 'function params065s23(' not in s:
    ins = open(os.path.join(SP, 'kecha.js'), encoding='utf8').read().lstrip('\n') + '\n' + open(os.path.join(SP, 'data065.js'), encoding='utf8').read() + '\n'
    i = s.index(anchor)
    s = s[:i] + fix(ins) + s[i:]
rep("""                   uShellEm061_sp_00: (def, mode, m, got) => params061s00(def, mode, m, got, def.id === 0x108) };""",
    """                   uShellEm061_sp_00: (def, mode, m, got) => params061s00(def, mode, m, got, def.id === 0x108),
                   // Kecha Wacha's sp_00 0xf569fc (the drop: the request's point)
                   uShellEm065_sp_00: (def, mode) => params065s00(def, mode) };""")
rep("""                  uShellEm061_sp_00: (S, D, hit, ctx) => landing061s00(S, D, hit, ctx) };""",
    """                  uShellEm061_sp_00: (S, D, hit, ctx) => landing061s00(S, D, hit, ctx),
                  uShellEm065_sp_00: (S, D, hit, ctx) => landing065(S, D, hit, ctx) };""")
rep("""0xf334f0: sh => params061s01(sh) };""", """0xf334f0: sh => params061s01(sh), 0xf56ed4: sh => params065s01(sh) };""")
rep("""                    uShellEm061_sp_13: (S, D, ctx, out) => landing061s13(S, D, ctx, out) };""",
    """                    uShellEm061_sp_13: (S, D, ctx, out) => landing061s13(S, D, ctx, out),
                    uShellEm065_sp_13: (S, D, ctx, out) => landing065s13(S, D, ctx, out) };""")
rep("""  } else if (a && a.code === 'em061r'){
    spawn061v4(state, D, a, ctx, input, out, fresh);         // Rustrum's L9 lump actions""", """  } else if (a && a.code === 'em061r'){
    spawn061v4(state, D, a, ctx, input, out, fresh);         // Rustrum's L9 lump actions
  } else if (a && a.code === 'em065'){
    spawn065(state, D, a, ctx, input, out, fresh);           // Kecha Wacha's actions""")
rep("""    else if (S.base === 'base24') step24(S, ctx, input, D, out);   // Rustrum's lump""", """    else if (S.base === 'base24') step24(S, ctx, input, D, out);   // Rustrum's lump
    else if (S.base === 'base23') step23(S, ctx, input, D, out);   // Kecha Wacha's water shot""")
# the aim 0x4053e4 with 0x10: the owner's facing as it is (0x405424 / 0x40543c -> 0x4054e8)
rep("""function aim13(S, k, own){
  const T = target13Slot(own);""", """function aim13(S, k, own){
  if (k.flags & 0x10) return own.ownerY >>> 0;                 // 0x405424 / 0x40543c -> 0x4054e8: block +0x54 as it is (Kecha Wacha's)
  const T = target13Slot(own);""")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
