import sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(P, encoding='utf8', newline='').read()
NL = '\r\n' if '\r\n' in s else '\n'
fix = lambda t: t.replace('\r\n', '\n').replace('\n', NL)
def rep(old, new):
    global s
    o, n = fix(old), fix(new)
    if s.count(o) != 1: sys.exit('anchor %d: %r' % (s.count(o), old[:80]))
    s = s.replace(o, n)
rep("""function spawnPlain(state, D, a, ctx, input, out, fresh){
  if (fresh || !state.hist || !state.prevJoints) return;
  const own = ctx.own001, J = state.prevJoints;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    const def = D.shells[sp.shell];""",
"""// `at: 'start'` makes a row's shell on the action's first step (no frame test); `untired` skips it while tired (0x81614: input.tired, else
// the viewer's beamState.tired)
function spawnPlain(state, D, a, ctx, input, out, fresh){
  const own = ctx.own001;
  if (fresh){
    for (const sp of a.spawns) if (sp.at === 'start') makePlain(state, D, a, ctx, out, own, state.prevJoints || ctx.J, sp);
    return;
  }
  if (!state.hist || !state.prevJoints) return;
  const J = state.prevJoints;
  const tired = input.tired != null ? !!input.tired : !!(input.beamState && input.beamState.tired);
  for (const sp of a.spawns){
    if (sp.at === 'start' || !pass001(state, f(sp.frame))) continue;
    if (sp.untired && tired) continue;
    makePlain(state, D, a, ctx, out, own, J, sp);
  }
}
function makePlain(state, D, a, ctx, out, own, J, sp){
  {
    const def = D.shells[sp.shell];""")
rep("""    if (why){ out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why }); continue; }
    let S = null;
    if (def.base === 'base00') S = make00n(state, D, sp.mode, J, own, ctx, a.action, sp.frame, sp.shell);""",
"""    if (why){ out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why }); return; }
    let S = null;
    if (def.base === 'base00') S = make00n(state, D, sp.mode, J, own, ctx, a.action, sp.frame, sp.shell);""")
blk = open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\lava.js', encoding='utf8').read()
anchor = '// dev/rom-map.md "Ahtal-Ka -- shell57 / base57" (READ whole: ctor 0x42ecb8'
rep(anchor, blk.lstrip('\n') + '\n' + anchor)
rep("                   uShellEm017_sp_00: (def, mode) => params017s00(def, mode),",
    "                   uShellEm017_sp_00: (def, mode) => params017s00(def, mode),\n                   // Lavasioth's sp_00 0xe45e64 (the lava balls)\n                   uShellEm036_sp_00: (def, mode) => params036s00(def, mode),")
rep("uShellEm017_sp_00: (S, k, p, got) => xAdjust37(k, p, got) };",
    "uShellEm017_sp_00: (S, k, p, got) => xAdjust37(k, p, got),\n                 uShellEm036_sp_00: (S, k, p, got) => xAdjust37(k, p, got) };")
rep("const AIMY00 = { uShellEm083_sp_00: (S, k, p, got) => yAdjust37(k, p, got) };",
    "const AIMY00 = { uShellEm083_sp_00: (S, k, p, got) => yAdjust37(k, p, got), uShellEm036_sp_00: (S, k, p, got) => yAdjust37(k, p, got) };")
rep("                  uShellEm017_sp_00: (S, D, hit, ctx) => landing017s00(S, D, hit, ctx) };",
    "                  uShellEm017_sp_00: (S, D, hit, ctx) => landing017s00(S, D, hit, ctx),\n                  uShellEm036_sp_00: (S, D, hit, ctx) => landing036s00(S, D, hit, ctx) };")
rep("0xda3eb4: sh => params017s01(sh) };", "0xda3eb4: sh => params017s01(sh), 0xe469d8: sh => params036s01(sh) };")
rep("  if (S.cls === 'uShellEm057_sp_01') return endCreate057(S, ctx, events);",
    "  if (S.cls === 'uShellEm057_sp_01') return endCreate057(S, ctx, events);\n  if (S.cls === 'uShellEm036_sp_01') return endCreate036(S, ctx, events);")
open(P, 'w', encoding='utf8', newline='').write(s)
print('ok')
