# ins058b.py (2026-10-19): Amatsu's water lines -- BASE42 (sp_42, 0x102) and the chain-reached (7, 0x19 / 0x1a / 0x1b) rows
BS = chr(92)
js = open('amatsu42.js', encoding='utf8').read()
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8').read()
anchor = "// the spawner (code 'em058'): rows { frame (or `start`"
assert s.count(anchor) == 1
s = s.replace(anchor, js.lstrip('\n') + '\n' + anchor)
folder = "'shell" + BS + BS + "em" + BS + BS + "em058_00_shell42'"
reps = [
  # the spawner: the line's points at the action's start, sp_42 at the row's frame
  ("function spawn058(state, D, a, ctx, input, out, fresh){\n  if (!state.hist) return;\n  const own = ctx.own001, J = state.prevJoints || ctx.J;\n",
   "function spawn058(state, D, a, ctx, input, out, fresh){\n  const own = ctx.own001;\n"
   "  // (7, 0x19 / 0x1a / 0x1b): phase 0 sets e+0xcb40.. / +0xcb50.. as the action starts (line058); the frame's create reads them\n"
   "  if (fresh){ state.line058 = null; for (const sp of a.spawns) if (sp.line && own.ownerPos && own.facing && own.target) state.line058 = line058(sp.line, sp.tune, own); }\n"
   "  if (!state.hist) return;\n  const J = state.prevJoints || ctx.J;\n"),
  ("    } else if (sp.shell === 'shell30'){\n      const r = make030(state, D, sp.mode, own, ctx, a.action, sp.frame);\n",
   "    } else if (sp.shell === 'shell42'){\n"
   "      if (!own.target){ refuse('no target (input.rock.target): the line is set from it'); continue; }\n"
   "      const L = state.line058;\n"
   "      if (!L){ refuse('the line was not set (the action started before the row)'); continue; }\n"
   "      // (0xf0e088..0xf0e124: setup 0x30 from 0x420684 -- id 0x102, the mode, owner; +0x10.. A, +0x20.. B)\n"
   "      const r = make042(state, D, sp.mode, L.A, L.B, own, J, ctx, a.action, sp.frame);\n"
   "      if (r.S){ state.shells.push(r.S); out.spawned.push(r.S); } else refuse(r.why);\n"
   "    } else if (sp.shell === 'shell30'){\n      const r = make030(state, D, sp.mode, own, ctx, a.action, sp.frame);\n"),
  ("const E17F4_STANDIN = 0;      // e+0x17f4 (bit 0 tested by (7, 1); bit 1 set at a part break, 0xf07518): no writer of bit 0 found\n",
   "// e+0x17f4 (bit 0 tested by (7, 1) at 0xf0bd70; bit 1 set at a part break, 0xf07518): NO WRITER of bit 0 in the text (fb/fieldscan.py,\n"
   "// controlled 2026-10-19 -- the same scan finds 0xf07518 and e+0x15fb's sole writer 0xf091ac); its start value (the ctor) NOT READ\n"
   "const E17F4_STANDIN = 0;\n"),
  ("      hitdata: [[0, 999]] },\n  },\n  actions: [\n    act058(7, 0x09,",
   "      hitdata: [[0, 999]] },\n"
   "    shell42: { id: 0x102, cls: 'uShellEm058_sp_42', base: 'base42', folder: " + folder + ", lists: { 0: { list: 'u', pel: 'em058_00u' } },\n"
   "      modes: {\n"
   "      0: m057(1.0, [[0, 50], [0, 51]], [0], [3], [40.0, 20.0], [[0.0, -40.0, 50.0]]),\n"
   "      1: m057(1.0, [[0, 50], [0, 51]], [0], [3], [40.0, 20.0], [[0.0, -40.0, 50.0]]),\n"
   "      2: m057(1.0, [[0, 50], [0, 51]], [0], [3], [40.0, 20.0], [[0.0, -40.0, 50.0]]),\n"
   "      },\n      hitdata: [[0, 90]] },\n"
   "  },\n  actions: [\n"
   "    // the water lines (2026-10-19; reached through vt+0x3d0 chains: (7, 0xf) -> 0x19 -> 0x1a -> 0x1b -> (3, 2)): phase 0 the clip and\n"
   "    // the line (tune 0xe..0x11 / 0x13..0x16 / 0x18..0x1b), phase 1 the turn and sp_42 at tune 6 / 7 / 8 (18 / 20 / 22). NOT BUILT, named:\n"
   "    // his head aimed at the line in phase 1 (0xc0dbc on e+0x1490: the viewer's head is the clip's), and the sp_42 sounds\n"
   "    act058(7, 0x19, '2', 'Motion[27]', [{ frame: 18, shell: 'shell42', mode: 0, line: 'near', tune: [8000, 100, 10000, 30] }]),\n"
   "    act058(7, 0x1a, '2', 'Motion[28]', [{ frame: 20, shell: 'shell42', mode: 1, line: 'side', tune: [8000, 100, 10000, 30] }]),\n"
   "    act058(7, 0x1b, '2', 'Motion[29]', [{ frame: 22, shell: 'shell42', mode: 2, line: 'far', tune: [8000, 100, 10000, 30] }]),\n"
   "    act058(7, 0x09,"),
  ("    else if (S.base === 'base30') step30(S, ctx, input, D, out);   // Amatsu's whirlwinds\n",
   "    else if (S.base === 'base30') step30(S, ctx, input, D, out);   // Amatsu's whirlwinds\n"
   "    else if (S.base === 'base42') step42(S, J, ctx, input, D, out);   // his water lines\n"),
  ("                                : def.base === 'base20' || def.base === 'base30' ? null   // (Teostra's ring, Amatsu's whirlwinds: the owner's point)\n",
   "                                : def.base === 'base20' || def.base === 'base30' ? null   // (Teostra's ring, Amatsu's whirlwinds: the owner's point)\n"
   "                                : def.base === 'base42' ? mode.sh.ints[0]                 // (Amatsu's water line: int 0, joint 3)\n"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
print('ok')
