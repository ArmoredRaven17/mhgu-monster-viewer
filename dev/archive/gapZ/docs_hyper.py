import os
ARC = '<archive>' + chr(92) + 'gapZ' + chr(92)
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
raw = open(R, 'rb').read().decode('utf-8'); crlf = '\r\n' in raw
d = raw.replace('\r\n', '\n'); lines = d.split('\n')
i = [k for k, l in enumerate(lines) if l.startswith('| ShellElements (ShellClassNumber, AttackRate, ScaleRate) -> `0x43a8b0` / `0xcaa30` |')]
assert len(i) == 1
lines[i[0]] = lines[i[0]].replace('**NOT APPLIED**: no viewer shell carries +0x15bc; listed in docs/hyper-motion.json `shells`',
                                  '**NOT APPLIED**: no viewer shell carries +0x15bc; listed in docs/hyper-motion.json `shells` [-> APPLIED 2026-10-27, shells lane: rows below]')
rows = [
 "| Hyper ShellElements -- who carries the aura ID +0x15bc (READ 2026-10-27, shells lane) | the shell base ctor `0x43a78c` sets +0x15a8 = -1, **+0x15ac = 1**, +0x15ad = 0, **+0x15bc = -1**; each base ctor then writes +0x15a8 = its BASE NUMBER (base01 1 at `0x3fa424`, base55 55 at `0x42c5b8`, base00 at `0x3f8b0c`) -- the ShellClassNumber 0xcaa30 matches. Only seven base INITS copy an aura field into +0x15bc: base00 +0x1620 (`0x3f931c`), base01 +0x1610 (`0x3fae38`), base07 +0x15fc (`0x4028c8`), base12 +0x15fc (`0x403d2c`), base13 +0x1634 (`0x404d18`), base54 +0x1630 (`0x42b644`), base56 +0x15fc (`0x42e480`) (every `#0x15bc` operand in `0x3f0000..0x440000`; none in a class band), each after clearing +0x15ac on its own flag (base00 +0x15e8 0x800, base01 +0x15ec 0x1000). The field is written only by the CLASS READER (vt+0x14c) from a ShellParam int: the readers of every class of the 25 monsters with entries, emulated with probe ints (" + ARC + "auraclass.py; vtable = the main.data word equal to the reader - 0x14c; the init's call graph to a copy site) -- **only Lagiacrus sp_01 (int 3), Nerscylla sp_00 (int 2) / sp_00_02 (int 1) / sp_01 (int 0) / sp_13 (int 0), Astalos sp_01 (int 7), Zinogre sp_18 (int 2)** write one; control: Zinogre's sp_18 -> +0x1620 is the rom-map row's (`sp_18 +0x1620 -> +0x15bc`), found once the probe answered his reader's id dispatch `0x4a0ecc`. Six more flag patterns: the same seven, the same ints. Each MODE with its own ints (auramodes.py): Lagiacrus sp_01 ID 5 (ID 1 on modes 20 / 21), Nerscylla sp_00 ID 2 (mode 17: 0), sp_00_02 ID 4, sp_01 ID 2 / 4 (mode 8: 0, 0x1000), Astalos sp_01 modes 0 / 1 ID 4 / 3 (the rest 0, 0x1000), Zinogre sp_18 0 / -1 (no aura is 0: IDs start at 1), Nerscylla sp_13 -1. **So the listed ShellElements of the other 21 monsters (Rathian / Rathalos, Diablos, Tigrex, ...) never meet a shell carrying an ID** -- in the game too | enemy-shell base / classes | R (emulated readers; copies by operand scan, control above) | " + ARC + "auraclass.json, auramodes.json |",
 "| Hyper ShellElements -- APPLIED (render/shells.js hyperShellElement, 2026-10-27) | on the step a shell is made: its mode's aura ID (HYPER_SHELLS: the modes above whose ID >= 1 and whose hit side is on) one of the held pair (index.html shellExtra `hyperShells`: state.hyper's two IDs + the Quest Rank file's `shells`), the ID's element with ShellClassNumber == the base number: **+0x60 = ScaleRate** (`0x43a9ec..0x43a9f8`; the unit, its effects' parent -- the requester keeps ShellScale, so the viewer's one composed scale is ScaleRate x ShellScale) and **each hit slot's H+0x14 = ScaleRate x the mode's ShellScale** (`0x43aa38..0x43aa5c`; shellHitShapes); AttackRate (`+0x13e0 x=`, power) is not visual -- kept on S.hyper.attack. Effective: Lagiacrus sp_01 (normal ID 5 x1.3 / G ID 5 x1.1, G ID 1 x1.3), Nerscylla G sp_00 ID 2 x1.6, sp_00_02 ID 4 x1.5, sp_01 ID 2 x1.0 (power 1.1) / ID 4 x1.7, Astalos G sp_01 ID 3 / 4 x1.3. dev/shells-hyper-check.mjs 9 / 9. Page (" + ARC + "hypermeter.mjs, hyper.log): Lagiacrus L4 M2 holding 1 / 5 -- every sp_01 x1.1 (G), u 60 pixMax 906817 -> 997512; Nerscylla L2 M57 holding 4 / 2 -- sp_00 33..35 x1.6, u 0 pixMax 247088 -> 549660, sp_01 x1.0, sp_13 untouched; screenshots nerscylla3_off1.png / nerscylla3_on1.png (the same frame, the same camera) | viewer | built | -- |",
]
for k, r in enumerate(rows): lines.insert(i[0] + 1 + k, r)
out = '\n'.join(lines)
if crlf: out = out.replace('\n', '\r\n')
open(R + '.tmp', 'wb').write(out.encode('utf-8')); os.replace(R + '.tmp', R); print('ok rom-map')
H = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\hyper-states.md'
raw = open(H, 'rb').read().decode('utf-8'); crlf = '\r\n' in raw
add = ("\n### 6.5 ShellElements -- built (shells lane, 2026-10-27; rom-map \"Hyper ShellElements -- who carries the aura ID\" / \"-- APPLIED\")\n\n"
       "- **Who gives a shell its aura ID.** The shell base ctor 0x43a78c sets +0x15bc = -1. Seven base inits copy an aura field into it (base00\n"
       "  +0x1620, base01 +0x1610, base07 / 12 / 56 +0x15fc, base13 +0x1634, base54 +0x1630), and only the CLASS READER writes that field, from a\n"
       "  ShellParam int. Of every class of the 25 monsters with ShellElements, seven readers do: Lagiacrus sp_01, Nerscylla sp_00 / sp_00_02 /\n"
       "  sp_01 / sp_13, Astalos sp_01, Zinogre sp_18; with each mode's own ints the IDs are Lagiacrus 5 (1 on modes 20 / 21), Nerscylla 2 / 4,\n"
       "  Astalos 4 / 3 (modes 0 / 1); Zinogre's and Nerscylla sp_13's are 0 / -1 (no aura). The other monsters' listed elements never apply.\n"
       "- **What it does.** +0x60 = ScaleRate (the unit: its effects' parent, over the requester's ShellScale), each hit slot's scale = ScaleRate x\n"
       "  ShellScale, the power x AttackRate (not visual). Applied in render/shells.js hyperShellElement while the pair is held, the Quest Rank's\n"
       "  file (index.html shellExtra `hyperShells`); dev/shells-hyper-check.mjs. Metered on the page: Lagiacrus x1.1 (G), Nerscylla x1.6.\n")
if crlf: add = add.replace('\n', '\r\n')
open(H + '.tmp', 'wb').write((raw + add).encode('utf-8')); os.replace(H + '.tmp', H); print('ok hyper-states')
