P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(P, encoding='utf8', newline='').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (a[:90], s.count(a))
    s = s.replace(a, b)
FL = lambda rows: '[' + ', '.join('{ frame: %d, lit: %d }' % r for r in rows) + ']'
# 1. the clips: each row on the motion current at its create's phase (scratchpad fb/clipphase.py) -- and the soul flame's arms (`flame`)
rep("    act082(7, 0x00, 'Motion[42]', K082([[94, 18], [100, 19], [104, 20]])),                     // 0x104c258: tune 0x49..0x4b\n",
    "    act082(7, 0x00, 'Motion[42]', K082([[94, 18], [100, 19], [104, 20]]), { flame: [] }),       // 0x104c258: tune 0x49..0x4b\n")
rep("    act082(7, 0x01, 'Motion[3]', K082([[46, 0], [46, 2], [46, 1], [46, 3]])),                   // 0x104c358: tune 0 / 1 (phase 3)\n",
    "    // (phase 3: L2 M37, after L2 M3 -> M4 [was on L2 M3, the phase-0 clip -- WITHDRAWN 2026-10-18, rom-map Withdrawn table])\n"
    "    act082(7, 0x01, 'Motion[37]', K082([[46, 0], [46, 2], [46, 1], [46, 3]])),                  // 0x104c358: tune 0 / 1 (phase 3)\n")
rep("    act082(7, 0x09, 'Motion[20]', K082([[43, 14], [48, 15], [56, 16]]), { cb9c: true }),          // 0x104c444 (+ 0x1041af8's tilt)\n",
    "    act082(7, 0x09, 'Motion[20]', K082([[43, 14], [48, 15], [56, 16]]), { cb9c: true,             // 0x104c444 (+ 0x1041af8's tilt)\n"
    "      flame: " + FL([(43, 188), (48, 189), (56, 190)]) + " }),   // lit: 0x104c4bc / 0x104c5a0 / 0x104c684 (setup 0x403394, +0x10 the tilt)\n")
rep("    act082(7, 0x0c, 'Motion[20]', K082([[43, 4], [48, 5], [56, 6]]), { also: [[7, 0x2e]] }),     // 0x104c860: tune 4..6\n",
    "    act082(7, 0x0c, 'Motion[20]', K082([[43, 4], [48, 5], [56, 6]]), { also: [[7, 0x2e]],         // 0x104c860: tune 4..6\n"
    "      flame: " + FL([(43, 185), (48, 186), (56, 187)]) + " }),   // lit: 0x104c8d8.. (the same setups)\n")
rep("    act082(7, 0x0d, 'Motion[21]', K082(L21), { also: [[7, 0x30]] }),                             // 0x104cb7c: tune 7..0xb / 0x8c..0x90\n",
    "    act082(7, 0x0d, 'Motion[21]', K082(L21), { also: [[7, 0x30]],                                // 0x104cb7c: tune 7..0xb / 0x8c..0x90\n"
    "      flame: " + FL([(74, 180), (136, 181), (142, 182)]) + " }),   // lit: tune 0x93..0x95 (0x104258c / 0x10425b8 / 0x10425e4)\n")
rep("    act082(7, 0x2a, 'Motion[89]', K082([[114, 21], [120, 22], [124, 23]]), { also: [[7, 0x31]] }), // 0x104cea8: tune 0x50..0x52\n",
    "    act082(7, 0x2a, 'Motion[89]', K082([[114, 21], [120, 22], [124, 23]]), { also: [[7, 0x31]], flame: [] }), // 0x104cea8: tune 0x50..0x52\n")
rep("""    act082(2, 0x06, 'Motion[39]', v === 4 ? L082(36, [162, 163, 164]) : K082([[38, 12]]), { also: [[2, 0x14], [2, 0x15]] }),
    act082(2, 0x34, 'Motion[39]', v === 4 ? L082(36, [162, 163, 164]) : K082([[38, 12]])),
    act082(2, 0x07, 'Motion[10]', v === 4 ? L082(26, [165, 166, 167]) : K082([[21, 13]]), { also: [[2, 0x16], [2, 0x17]] }),
    act082(2, 0x35, 'Motion[10]', v === 4 ? L082(26, [165, 166, 167]) : K082([[21, 13]])),
""", """    // (phase 2: L2 M40 / L2 M11, set at L2 M39's / L2 M10's end [were on L2 M39 / M10 -- WITHDRAWN 2026-10-18]); lit 174..176 / 177..179
    act082(2, 0x06, 'Motion[40]', v === 4 ? L082(36, [162, 163, 164]) : K082([[38, 12]]), { also: [[2, 0x14], [2, 0x15]], flame: L082(36, [174, 175, 176]) }),
    act082(2, 0x34, 'Motion[40]', v === 4 ? L082(36, [162, 163, 164]) : K082([[38, 12]]), { flame: L082(36, [174, 175, 176]) }),
    act082(2, 0x07, 'Motion[11]', v === 4 ? L082(26, [165, 166, 167]) : K082([[21, 13]]), { also: [[2, 0x16], [2, 0x17]], flame: L082(26, [177, 178, 179]) }),
    act082(2, 0x35, 'Motion[11]', v === 4 ? L082(26, [165, 166, 167]) : K082([[21, 13]]), { flame: L082(26, [177, 178, 179]) }),
""")
rep("""    ...(v === 4 ? [act082(7, 0x64, 'Motion[72]', L082(110, [168, 169, 170]), { also: [[7, 0x66]] }),
                   act082(7, 0x65, 'Motion[71]', L082(110, [171, 172, 173]), { also: [[7, 0x67]] }),
                   act082(7, 0x68, 'Motion[74]', L082(110, [171, 172, 173])),
                   act082(7, 0x69, 'Motion[73]', L082(110, [168, 169, 170]))] : []),
""", """    // ((7, 0x68) / (7, 0x69): phase 2, on L2 M71 / M72 after L2 M74 / M73 [were on M74 / M73 -- WITHDRAWN 2026-10-18]); none lit
    ...(v === 4 ? [act082(7, 0x64, 'Motion[72]', L082(110, [168, 169, 170]), { also: [[7, 0x66], [7, 0x69]], flame: [] }),
                   act082(7, 0x65, 'Motion[71]', L082(110, [171, 172, 173]), { also: [[7, 0x67], [7, 0x68]], flame: [] })] : []),
""")
# the throws: phase 2 on L2 M56 / M59 (after L2 M55 / M61 and M58 / M62); lit 183 / 184 at tune 0x96 (0: phase 2's first call) for the
# k0 0 / 3 sets, none for the others
old = s[s.index("  const rows = [[0x04, 'Motion[55]', 0, 0]"):s.index("  D.actions = D.actions.concat(rows.map(([n, clip, k0, set]) => act082(2, n, clip, T082(k0, set))));")]
new = old
for a, b in (("'Motion[55]'", "'Motion[56]'"), ("'Motion[61]'", "'Motion[56]'"), ("'Motion[58]'", "'Motion[59]'"), ("'Motion[62]'", "'Motion[59]'")):
    new = new.replace(a, b)
new = new.replace("  const rows = ", "  // (phase 2: L2 M56 after L2 M55 / M61, L2 M59 after L2 M58 / M62 [were on the phase-0 clips -- WITHDRAWN 2026-10-18])\n  const rows = ")
rep(old, new)
rep("  D.actions = D.actions.concat(rows.map(([n, clip, k0, set]) => act082(2, n, clip, T082(k0, set))));",
    "  // lit (Soulseer): 0x103c918 / 0x103cd20.. -- the second maker's 183 (k0 0) / 184 (k0 3) at tune 0x96 / 0x97 (0); the other sets none\n"
    "  D.actions = D.actions.concat(rows.map(([n, clip, k0, set]) => act082(2, n, clip, T082(k0, set),\n"
    "    v === 4 ? { flame: k0 === 0 ? [{ frame: 0, lit: 183 }] : k0 === 3 ? [{ frame: 0, lit: 184 }] : [] } : {})));")
# 2. the spawner reads the flame (input.soulFlame082: index.html, the Soul Flame control) -- Soulseer only
rep("  const st = { tired: !!ctx.tired, head: !!(input.mizu082 && input.mizu082.headBroken), tail: !!input.tailSevered, h: H73E8_STANDIN };\n  const word10 = tilt082(state.cb9c082 || f(0));",
    "  const st = { tired: !!ctx.tired, head: !!(input.mizu082 && input.mizu082.headBroken), tail: !!input.tailSevered, h: H73E8_STANDIN };\n  const word10 = tilt082(state.cb9c082 || f(0));\n"
    "  // THE SOUL FLAME (P+0x1bb bit 1, 0x1035ee8; Soulseer only): a row's lit arm in place of its spawns (`flame`)\n"
    "  const spawns082 = D.variant082 === 4 && input.soulFlame082 && a.flame ? a.flame : a.spawns;")
rep("  for (const sp of a.spawns){\n    // (a frame-0 test passes on phase 1's first call",
    "  for (const sp of spawns082){\n    // (a frame-0 test passes on phase 1's first call")
rep("    a = Object.assign({}, a, { spawns: [{ frame: null, k: 17, r2: T.n, now: true }] });",
    "    a = Object.assign({}, a, { spawns: [{ frame: null, k: 17, r2: T.n, now: true }], flame: null });")
# the makers that refuse lit: 04_26 (0x104a744) and sp_13 (0x104a634: 0x104b138 / 0x104b314 skip too)
rep("function make26row082(state, D, a, m, frame, ctx, out){\n",
    "function make26row082(state, D, a, m, frame, ctx, out){\n  if (D.variant082 === 4 && ctx.soulFlame082) return;          // 0x104a764: none with the soul flame lit\n")
rep("  let m = choose082s13(a.action[1], sp.k, st);\n  if (m < 0 || m > 5) return;",
    "  if (D.variant082 === 4 && input.soulFlame082) return;          // 0x104b15c / 0x104b338 (and the maker 0x104a65c): none lit\n"
    "  let m = choose082s13(a.action[1], sp.k, st);\n  if (m < 0 || m > 5) return;")
rep("    ctx.tired = input.tired != null ? !!input.tired : !!(input.beamState && input.beamState.tired);\n",
    "    ctx.tired = input.tired != null ? !!input.tired : !!(input.beamState && input.beamState.tired);\n"
    "    ctx.soulFlame082 = !!input.soulFlame082;                 // Soulseer's soul flame (P+0x1bb bit 1), for his makers mid-step\n")
open(P, 'w', encoding='utf8', newline='').write(s)
print('ok')
