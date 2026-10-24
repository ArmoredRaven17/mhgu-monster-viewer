p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
anchor = "| VIEWER (implemented) | Congalala's gas by index.html shellExtra `gas021`"
i = s.index(anchor); j = s.index(nl, i) + len(nl)
rows = [
"| EMC `em023_00_cmdtbl.emc` (both arcs, one md5) g1 s35 | **(7, 0x3e) issued directly** (op 0x00), reached from g0 s3 / s14 / s17, no op 0x92 around it: at variants 0, 4 and 5 alike (control: g5 s1's (7, 5) drops out at 4 / 5). (7, 0xc) is issued by NO stream (raw scan) | uEm023_00 | R (data, walk) | scratchpad fb/emc023.py; shells.js ACT023 (7, 0x3e) row (no shell; the word lights it) |",
"| uEm061_00 shells `0x105` / `0x106` / `0x107` | uShellEm061_sp_00 base00 (reader `0xf32ebc`, landing `0xf3322c` -> modes 4..6 sp_01 0 by e+0xcacc), _sp_01 (reader `0xf334f0`: 0x4 int 0, 0x8 int 1, no ef), _sp_19 base19 (reader `0xf34470`: ef 0 +0x15c8, ef 1 +0x1660, int 0 joint, floats speed / life / size0 / size1 / grow / rise / (6) follow-below, cmn floats 0 / 1 / 2 reach above / below / follow above; +0x1664 never written); action main `0xf32798`, ids e+0xcac8..+0xcad8 | uEm061_00 | R + E | shells.js SHELL_DATA.em061_00, params061s00 / s01 / s19; dev/shells-duramboros-check.mjs 18 / 0 |",
"| `0x3fe740` (base03 follow `0x3fdf18`) | `tst [+0x1664], #2` (and +0x16d0 == 0) gates the SLOPE step (heading x normal, velocity rescale, X word = 0 at `0x3fe7e0`); bit clear -> `0x3feadc`: only y taken. Khezu's reader sets bit 1 always (`0xd21bec`); base03's ctor zeroes +0x1664 (`0x3fd878`) and Duramboros's sp_19 never writes it -> the ball keeps its roll word | base03 / base19 | R + E | shells.js follow03 `k.slope` |",
"| base19 `0x408ea0` / `0x408ffc` | init after base03's: +0x44 += (grow != 0 ? size0 : size1) x rise; step: size by +0x1724 / grow, the move past +0x1718, base03's follow, +0x44 += size x rise unless 0x22, the roll X += u16(s32(0.5 + dt x speed / (rise x size) x deg x 182.044)); end vt+0x154 `0x3fd820` starts ef +0x1660. The flight's ef 0 is base00's init's (`0x3f9298`) at the JOINT point, before the ground snap and the rise | base19 | R + E | shells.js init19 / move19 / make061s19 |",
"| uEm061 sp_00 mode 7 ((7, 0xe6)) | not in his file: the ROM still makes the shell; it starts / creates nothing and leaves state 1 on its first move (timer 0 -> 0xfe). Nothing drawn: the module makes none (the check counts it as empty, any start / create / child would fail it) | uEm061_00 | R (emu) | dev/shells-duramboros-check.mjs |",
]
s = s[:j] + nl.join(rows) + nl + s[j:]
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
