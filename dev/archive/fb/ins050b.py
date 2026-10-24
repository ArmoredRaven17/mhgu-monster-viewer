# ins050b.py (2026-10-19): Alatreon's chain-reached (7, 0x48 / 0x4d / 0x4f / 0x50 / 0x51) -- 0xec91f0 phase 2 (L2 M14) sp_01 6 at f28,
# sp_01 7 at f38 (k >= 5), both with the GOT zero setup; and the base01 0x400 refusal lifted (init011 carries 0x3fac58)
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8').read()
reps = [
  ("      } else mk01(sp, sp.mode, own.ownerPos.slice());\n",
   "      } else if (sp.at === 'zero'){\n"
   "        mk01(sp, sp.mode, [f(0.0), f(0.0), f(0.0)]);      // 0xec9610 / 0xec96e8: +0x10.. and +0x20.. the GOT's zero vector (flag 1: the joint)\n"
   "      } else mk01(sp, sp.mode, own.ownerPos.slice());\n"),
  ("// 0 / 1 / 4 / 5 flags 0 (the setup's point), 2 / 3 0x20 (u 90 then the switch: u 91). Modes 6 / 7 (flag 1, joint 14 / 9; 7 with 0x400)\n"
   "// are made by no read maker\n",
   "// 0 / 1 / 4 / 5 flags 0 (the setup's point), 2 / 3 0x20 (u 90 then the switch: u 91). Modes 6 / 7 (flag 1, joint 14 / 9; 7 with 0x400:\n"
   "// base01's 0x3fac58, y = the ground + vec.y, init011) are 0xec91f0's -- the chain-reached (7, 0x48 / 0x4d / 0x4f..0x51) (2026-10-19)\n"),
  ("           why: !sh ? 'uShellEm050_sp_01: a mode its files do not carry' : (flags & 0x400) ? 'uShellEm050_sp_01: flag 0x400 (base01, not read)' : null,\n",
   "           why: !sh ? 'uShellEm050_sp_01: a mode its files do not carry' : null,\n"),
  ("    act050(7, 0x3f, '2', 'Motion[7]', [{ frame: 96, shell: 'shell01', mode: 5, at: 'target' }, { frame: 164, shell: 'shell01', mode: 5, at: 'target' }]),\n",
   "    act050(7, 0x3f, '2', 'Motion[7]', [{ frame: 96, shell: 'shell01', mode: 5, at: 'target' }, { frame: 164, shell: 'shell01', mode: 5, at: 'target' }]),\n"
   "    // 0xec91f0(e, k) (2026-10-19; reached through vt+0x3d0 chains: (7, 0x10) -> 0x48, (7, 0x41) -> 0x4d, (7, 0x44) -> 0x4f, (7, 0x43) ->\n"
   "    // 0x50, (7, 0x45) -> 0x51): phase 1 L2 M29, then phase 2 L2 M14 (0x20e, looped by P+0x1a2 through phase 3): f28 sp_01 6, and f38\n"
   "    // sp_01 7 when k >= 5 -- both with the zero setup\n"
   "    act050(7, 0x48, '2', 'Motion[14]', [{ frame: 28, shell: 'shell01', mode: 6, at: 'zero' }]),\n"
   "    ...[0x4d, 0x4f, 0x50, 0x51].map(n => act050(7, n, '2', 'Motion[14]', [{ frame: 28, shell: 'shell01', mode: 6, at: 'zero' }, { frame: 38, shell: 'shell01', mode: 7, at: 'zero' }])),\n"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
print('ok')
