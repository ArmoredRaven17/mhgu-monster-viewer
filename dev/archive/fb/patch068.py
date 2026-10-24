# patch068.py: Najarala's block into shells.js (before BASE60), the dispatch, the step, the per-frame hygiene -- exact, small inserts
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + '\\'
s = open(P, encoding='utf8').read()
blk = open(D + 'naja068.js', encoding='utf8').read()
assert 'SHELL_DATA.em068_00 =' not in s
def rep(a, b):
    global s
    assert s.count(a) == 1, a
    s = s.replace(a, b)
rep("// ---- BASE60 / BASE61: Ahtal-Ka's web anchors", blk + "\n// ---- BASE60 / BASE61: Ahtal-Ka's web anchors")
rep("  } else if (a && a.code === 'em067'){\n    spawn067(state, D, a, ctx, input, out, fresh);           // Zamtrios's balls (L2 M12, L4 M37's hops)\n",
    "  } else if (a && a.code === 'em067'){\n    spawn067(state, D, a, ctx, input, out, fresh);           // Zamtrios's balls (L2 M12, L4 M37's hops)\n"
    "  } else if (a && a.code === 'em068'){\n    spawn068(state, D, a, ctx, input, out, fresh);           // Najarala's scales and his rings\n")
rep("    else if (S.base === 'base16') step16(S, ctx, input, D, out);   // Tetsucabra's / Drilltusk's slab\n",
    "    else if (S.base === 'base16') step16(S, ctx, input, D, out);   // Tetsucabra's / Drilltusk's slab\n"
    "    else if (S.base === 'base36') step36(S, ctx, input, D, out);   // Najarala's scales\n")
rep("  for (const k of ['older', 'newer']) if (state.poison[k] && state.poison[k].state === 0xff) state.poison[k] = null;\n",
    "  for (const k of ['older', 'newer']) if (state.poison[k] && state.poison[k].state === 0xff) state.poison[k] = null;\n"
    "  // Najarala's vt+0x1dc (0xf7ad20, the same place): the ring cleared, a gone shell's slot emptied\n"
    "  if (state.monId === 'em068_00') frame068(state);\n")
open(P, 'w', encoding='utf8').write(s)
print('ok')
