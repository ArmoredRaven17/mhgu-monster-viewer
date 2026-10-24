import sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(P, encoding='utf8', newline='').read(); NL = '\r\n' if '\r\n' in s else '\n'
L = s.split(NL)
i = [k for k, l in enumerate(L) if l.startswith('| tooling: `<scratchpad>') and 'rec_shellrec.py <mon>' in l]
assert len(i) == 1, i
rows = """
### Leviathans -- the shells: Lagiacrus, Royal Ludroth, Agnaktor, Nibelsnarf (shells agent for the Viewer agent, 2026-10-18; dev/leviathan-shells-spec.md)

| Address / range | What it is | Class / monster | Status | Detail |
|---|---|---|---|---|
| uEm046_00 shells 0xe6..0xea (Lagiacrus) | ids immediates (`0xe9f3d4..`), res 0x8a39..0x8a3d: sp_00 base00 (reader `0xeaa5b4`, landing `0xeaa820` + child `0xeaa8cc`), sp_01 base01 (reader `0xeaab48`, +0x154 `0xeaac6c` -> sp_11), sp_11 base11 (reader `0xeaaf38`, +0x168 `0xeab080`), sp_25 base25 (reader `0xeab42c`, +0x154 `0xeab4b0`), sp_26 base26 (reader `0xeab6b0`) | uEm046_00 | R + E | leviathan spec 1; shells.js LAGIACRUS |
| `0xea3c10(e, 1, row)` / jump table `0xea6e98` | (7, 0x68 / 0x69) -> rows 0 / 1 of `0x169eac0` (sp_25 0..3 / 5..8): phase 0 L4 M8, P+0x1bc = 0; phase 1 P+0x1bc += e+0x1c, past tune float 1 (1.0) four sp_25, phase 2; L4 M8 replayed to tune int 0xc. A TIMER, not a frame test | uEm046_00 | R + E | spawn046 |
| base25 `0x40f0c8` / `0x40f198` / `0x40f62c` / `0x40f7ac` | ctor / init (words owner block -> target, z + max(near, min(far, dist)), Z-X-Y turn, +-500 query mask 0x10, ef 0, slot 0) / move (no timer: alive while a slot is on; ending <= 1800) / end (0x43b058, 0x4a1de4, vt+0x154) | uShellEmBase25 | R + E | shells.js make25 / step25 |
| base26 `0x40faec` / `0x40fbfc` / `0x40ff60` / `0x41018c` / `0x410420` | ctor / init (yaw to the target or a joint's, centre, phase, the orbit point) / move (t, the step, words from travel, slot life) / the orbit step (rate change and fall windows, radii growth) / end | uShellEmBase26 | R + E | shells.js make26 / orbit26 |
| base01 +0x60 after the init | 1.0 on every base01 mode (Lagiacrus's 0.8 / 0.93 ShellScale modes): the 0x800 arm's size = 0xbec34(owner) x 1.0 | uShellEmBase01 | R + E | init011 0x800 |
| `0x81614` in a landing (`0xeaa930`) | tired -> sp_01 14 for type-1 children 8..14 | uEm046_00 | R + E | ctx.tired |
| em046_00u 61 at `0xae997c` | sp_01 0 / 1's record reaches construct.js generatorFlags' unread arm (node block +0xbe, [[g+8]+0x118] bit 27 clear) and stops the runtime: NOT EXPORTED until read | effect runtime | gap | leviathan spec 1f |
| uEm047_00 shells 0xeb / 0xec (Royal Ludroth) | sp_00 reader `0xeb4398`, landing `0xeb4558` (type 1 -> sp_01 [`0x169eb40`][mode]); sp_01 reader `0xeb4808`; (7, 0xd..0x27) modes 11..17 set motion 0xffff (`0xeaeb28`) | uEm047_00 | R + E | leviathan spec 2 |
| uEm049_00 shell 0xed (Agnaktor) | sp_01 reader `0xec43f4`; `0xeba02c` L2 M2 tail drips (e+0xcace, `0x9d36c(e, 7)` vs .dtp +0x1d / +0x1e, G rank or (7, 0x31), tune vecs 0..3 by facing), L2 M5 chest drip (e+0xcac2, part 1, joint 16) | uEm049_00 | R + E | leviathan spec 3 |
| uEm056_00 sp_47 0xf6 makers `0xee0828` / `0xeea590` | every maker tests the quest map vt+0x9c (0x16 / 5) and the area byte e+0x1054, and e+0x73d2: no map in the viewer -- not built; base47 (`0x425e44`..) not read | uEm056_00 | R (gates) | leviathan spec 4 |
| tooling: emu_fb `treeDepth`, `slot0Modes`, `slot0Ids`, `dtp`; TOFF base25 / base26 | child trees past depth 2; hit slot 0 held for chosen shells only; the .dtp array | -- | -- | leviathan spec 1e / 3 |""".split('\n')
L[i[0] + 1:i[0] + 1] = rows
traps = """83. **The census answers frame tests; a shell made on a timer does not show in it (2026-10-18).** Lagiacrus's sp_25 (0xe9) are made when P+0x1bc, counted up by the owner's step each phase-1 call, passes tune float 1 -- `cen10` never reached `0xea3c10`'s maker. Grep the class band for every id immediate (`mov rX, #id`) and account for each site before calling a census complete. (dev/leviathan-shells-spec.md 1c)
84. **emu_fb records children to depth 2 only unless the case says `treeDepth` (2026-10-18).** A grandchild's own children were silently absent from the ROM run ("children 9 vs ROM 0"), which reads like the ROM making none. (dev/leviathan-shells-spec.md 1e)""".split('\n')
while L and L[-1] == '': L.pop()
L += traps + ['']
open(P, 'w', encoding='utf8', newline='').write(NL.join(L))
print('ok')
