P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(P, 'rb').read().decode('utf8'); nl = '\r\n' if '\r\n' in s else '\n'
def rep(old, new):
    global s
    old = old.replace('\n', nl); new = new.replace('\n', nl)
    assert s.count(old) == 1, old[:70]; s = s.replace(old, new)
rep("""function hyperShellElement(state, S, input){
  const H = input.hyperShells, T = HYPER_SHELLS[state.monId], c = T && S.shell && T[S.shell];
  if (!H || !c) return;""",
"""// THE BEAM BASE (base02g: render/beam-types.js / beam-spawns.js, not SHELL_DATA): every beam class of the census (21, <archive>/gapZ
// b02all.py) has vt+0x140 = 0x43a8b0 and an init that is or reaches base02's 0x3fb9bc, which registers slot 0 (`0x3fbad0`) when the hit
// index +0x1654 >= 0; base02's ctor 0x3fb7f8 leaves +0x15a8 = 2, +0x15ac = 1, +0x15bc = -1 and no init of the family reaches an aura
// copy or clears +0x15ac (b02check.py). So a beam is class 2, aura -1: Rajang G ID 3, Agnaktor ID 1 / Zamtrios ID 3 entries reach it.
// Its unit +0x60 (the effects' parent: the placed ef 0 / ef 1 hang from it; base02's own +0x60 stores, 0x3fc5dc..0x3fc5e4, are the
// EFFECT units' (1, 1, length / 100)) and slot 0's H+0x14 (the radius of every hit-line capsule) take ScaleRate; the hit line's
// points are world positions (0x3fc1c8), so the ray's reach is not scaled.
const BEAM02_HYPER = { cls: 2, aura: -1 };
function hyperShellElement(state, S, input){
  const H = input.hyperShells, T = HYPER_SHELLS[state.monId];
  const c = S.base === 'base02g' ? (S.type && (S.type.hit || [])[0] >= 0 ? BEAM02_HYPER : null) : T && S.shell && T[S.shell];
  if (!H || !c) return;""")
rep("""  const base = S.unitScale != null ? S.unitScale : f(S.mode && S.mode.scale != null ? S.mode.scale : 1.0);
  S.unitScale = f(base * S.hyper.scale);""",
"""  const base = S.unitScale != null ? S.unitScale
             : f(S.mode && S.mode.scale != null ? S.mode.scale : S.type && S.type.scale != null ? S.type.scale : 1.0);
  S.unitScale = f(base * S.hyper.scale);""")
open(P, 'wb').write(s.encode('utf8')); print('ok')
