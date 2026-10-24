import sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(P, encoding='utf8', newline='').read()
NL = '\r\n' if '\r\n' in s else '\n'
fix = lambda t: t.replace('\r\n', '\n').replace('\n', NL)
def rep(old, new, count=1):
    global s
    o, n = fix(old), fix(new)
    c = s.count(o)
    if c != count: sys.exit('anchor x%d (want %d): %r' % (c, count, old[:90]))
    s = s.replace(o, n)

# 1. the block, before Ahtal-Ka's
blk = open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\gammoth.js', encoding='utf8').read()
anchor = '// dev/rom-map.md "Ahtal-Ka -- shell57 / base57" (READ whole: ctor 0x42ecb8'
rep(anchor, blk.lstrip('\n') + '\n' + anchor)

# 2. yAdjust37's flag-4 arm takes the aim offset +0x1618 (0x3f9de8 joins 0x3f9e0c)
rep("  return clampCircular(deg + (aim37(p, got.target).Y - got.ownerY), lo, hi);",
    "  // flag 4 (0x3f9de8: the point p) joins the clear arm at 0x3f9e0c, which passes [+0x1618] to 0x3f9b58 -- the aim offset on both\n"
    "  return clampCircular(deg + (aim37(p, got.target, k.aimOff || ZERO3).Y - got.ownerY), lo, hi);")

# 3. init00: the Y aim on flag bit 1 for the classes in AIMY00
rep("                                                                  : u16(s32(mla(0.5, f(k.degY || 0), DEG_TO_U16))))) >>> 0;\n",
    "                                                                  : u16(s32(mla(0.5, f(k.degY || 0), DEG_TO_U16))))) >>> 0;\n"
    "  // flag bit 1 SET: base00's Y aim 0x3f9cc4 (yAdjust37), for the classes in AIMY00 (Gammoth's sp_00)\n"
    "  else if (AIMY00[S.cls]) S.angles[1] = (S.angles[1] + AIMY00[S.cls](S, k, p, got)) >>> 0;\n")

# 4. AIMX00 / AIMY00
rep("const AIMX00 = { uShellEm069_sp_00: (S, k, p, got) => xAdjust37(k, p, got), uShellEm057_sp_18: (S, k, p, got) => xAdjust37(k, p, got) };",
    "const AIMX00 = { uShellEm069_sp_00: (S, k, p, got) => xAdjust37(k, p, got), uShellEm057_sp_18: (S, k, p, got) => xAdjust37(k, p, got),\n"
    "                 uShellEm083_sp_00: (S, k, p, got) => xAdjust37(k, p, got) };\n"
    "// ...and the Y aim on flag bit 1 (0x3f9cc4, yAdjust37: Gammoth's sp_00, from the shell's point -- flag 4 -- with its aim offset)\n"
    "const AIMY00 = { uShellEm083_sp_00: (S, k, p, got) => yAdjust37(k, p, got) };")

# 5. READER00
rep("                   uShellEm065_sp_00: (def, mode) => params065s00(def, mode) };",
    "                   uShellEm065_sp_00: (def, mode) => params065s00(def, mode),\n"
    "                   // Gammoth's sp_00 0x1062afc (the aimed shot) and sp_00_02 0x1063054 (the snowball's pieces: the request's point and words)\n"
    "                   uShellEm083_sp_00: (def, mode) => params083s00(def, mode), uShellEm083_sp_00_02: (def, mode) => params083s002(def, mode) };")

# 6. LANDING
rep("                  uShellEm065_sp_00: (S, D, hit, ctx) => landing065(S, D, hit, ctx) };",
    "                  uShellEm065_sp_00: (S, D, hit, ctx) => landing065(S, D, hit, ctx),\n"
    "                  uShellEm083_sp_00_02: (S, D, hit, ctx) => landing083s002(S, D, hit, ctx) };")

# 7. READERS01
rep("0xf56ed4: sh => params065s01(sh) };", "0xf56ed4: sh => params065s01(sh), 0x10637c4: sh => params083s01(sh) };")

# 8. LANDING13
rep("                    uShellEm065_sp_13: (S, D, ctx, out) => landing065s13(S, D, ctx, out) };",
    "                    uShellEm065_sp_13: (S, D, ctx, out) => landing065s13(S, D, ctx, out),\n"
    "                    uShellEm083_sp_13: (S, D, ctx, out) => landing083s13(S, D, ctx, out) };")

# 9. stepOrb: Gammoth's held snowball (its +0x15c), and its vt+0x28 after the update
rep("  if (S.state === 1 && S.cls === 'uShellEm061_sp_13'){\n"
    "    // Rustrum's lifted lump: state 1 runs the class's +0x15c (hold13r), not base13's bare `bx lr`\n"
    "    S.moves++;\n"
    "    const r = hold13r(S, ctx, D, out, ctx.own001, ctx.shellState);\n",
    "  if (S.state === 1 && (S.cls === 'uShellEm061_sp_13' || S.cls === 'uShellEm083_sp_13')){\n"
    "    // Rustrum's lifted lump / Gammoth's snowball: state 1 runs the class's +0x15c (hold13r / hold083s13), not base13's bare `bx lr`\n"
    "    S.moves++;\n"
    "    const r = (S.cls === 'uShellEm083_sp_13' ? hold083s13 : hold13r)(S, ctx, D, out, ctx.own001, ctx.shellState);\n")
rep("      if (t <= 0) S.state = 0xff;\n"
    "      // both handles +0x1674 / +0x1678 gone (0x4050f4 `orrs`); a shell whose landing started no effect waits for its flight's\n"
    "      else if (!(S.effect && !S.effect.gone) && !(S.effect2 && !S.effect2.gone)) S.state = 0xff;\n"
    "    }\n"
    "  }\n"
    "}\n",
    "      if (t <= 0) S.state = 0xff;\n"
    "      // both handles +0x1674 / +0x1678 gone (0x4050f4 `orrs`); a shell whose landing started no effect waits for its flight's\n"
    "      else if (!(S.effect && !S.effect.gone) && !(S.effect2 && !S.effect2.gone)) S.state = 0xff;\n"
    "    }\n"
    "  }\n"
    "  // the unit walker's vt+0x28 after the update: Gammoth's sp_13 0x1064354 (its split; base13's own 0x40512c draws nothing)\n"
    "  if (S.cls === 'uShellEm083_sp_13') post083s13(S, D, ctx, out, ctx.own001);\n"
    "}\n")

# 10. make00n by name (Gammoth's sp_00_02 beside his sp_00)
rep("function make00n(state, D, m, J, own, ctx, action, frame){\n"
    "  const def = D.shells.shell00, mode = def.modes[m], lists = def.lists || D.lists;\n"
    "  if (!mode) return null;\n"
    "  const S = { id: state.nextId++, monId: state.monId, shell: 'shell00', cls: def.cls, globalId: def.id, base: def.base,\n",
    "function make00n(state, D, m, J, own, ctx, action, frame, name = 'shell00'){\n"
    "  const def = D.shells[name], mode = def.modes[m], lists = def.lists || D.lists;\n"
    "  if (!mode) return null;\n"
    "  const S = { id: state.nextId++, monId: state.monId, shell: name, cls: def.cls, globalId: def.id, base: def.base,\n")

# 11. the dispatch
rep("    spawn065(state, D, a, ctx, input, out, fresh);           // Kecha Wacha's actions\n",
    "    spawn065(state, D, a, ctx, input, out, fresh);           // Kecha Wacha's actions\n"
    "  } else if (a && a.code === 'em083'){\n"
    "    spawn083(state, D, a, ctx, input, out, fresh);           // Gammoth's actions\n")
rep("  const a = state.action || (input.action ? null : variantActionFor(input.monId, input.list, input.clip, input.rock && input.rock.variant));\n",
    "  const a = state.action || (input.action ? null : variantActionFor(input.monId, input.list, input.clip, input.rock && input.rock.variant));\n"
    "  // Gammoth's action setter (0x10518e4..0x10519bc): any action but the snowball's clears e+0xcb0c -- a held snowball ends\n"
    "  if (fresh && state.monId === 'em083_00' && !snow083(a)) state.cb0c = 0;\n")

# 12. sp_01's +0x150 0x1063984: mode 11 ends when the owner's motion is no longer its init's (+0x1620)
rep("  if (S.cls === 'uShellEm022_sp_01' && ctx.ownerMotion != null && S.motionId != null && ctx.ownerMotion !== S.motionId) return 'end';\n",
    "  if (S.cls === 'uShellEm022_sp_01' && ctx.ownerMotion != null && S.motionId != null && ctx.ownerMotion !== S.motionId) return 'end';\n"
    "  // Gammoth's sp_01 +0x150 = 0x1063984 (READ whole): the same test for mode 11 alone (0x4a0ee4 == 0xb), else `pop`\n"
    "  if (S.cls === 'uShellEm083_sp_01' && S.modeIndex === 11 && ctx.ownerMotion != null && S.motionId != null && ctx.ownerMotion !== S.motionId) return 'end';\n")

open(P, 'w', encoding='utf8', newline='').write(s)
print('ok')
