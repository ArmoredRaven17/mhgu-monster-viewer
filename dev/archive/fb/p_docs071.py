# p_docs071.py (2026-10-19): Gore Magala's shells -- rom-map rows, the engine doc's base03 row, the board
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
p = D + r'\rom-map.md'
s = open(p, encoding='utf8').read()
a = "| `0xfad4ec` (uEm071_00 vt+0x158) |"
assert s.count(a) == 1
s = s.replace("each loaded (0x48b71c) unless 0x19d | uEm071_00 | R | (shells lane, 2026-10-19; Gore line spec to come) |",
              "each loaded (0x48b71c) unless 0x19d | uEm071_00 | R | gore-line-shells-spec 0 |")
old = "mode 0 0xfc083c at +0x40; 0x3f8970; the end) | uEm071_00 | R (reading) | (shells lane, 2026-10-19) |"
assert s.count(old) == 1
s = s.replace(old, "mode 0 0xfc083c at +0x40; 0x3f8970; the end; modes 1..2 types 0 / 2 fly on) | uEm071_00 | R + E (dev/shells-gore-check.mjs) | gore-line-shells-spec 1.2; shells.js params071s00 / landing071s00 |")
i = s.index(old.split(' | ')[0][:10]) if False else s.index("| `0xfc1a44` / `0xfc2034` |"); j = s.index('\n', i)
rows = (
"| `0xfbab80` / `0xfb4d70` / `0xfb5420` / `0xfb75f8` / `0xfbb438` / `0xfb7408` / `0xfba890` / `0xfbbc58` | Gore Magala's makers: sp_00 0 (7, 0x2c) L2 M52 f84; sp_01 13 (2, 0x12 / 0x23) L1 M8 / M13 f90 and 12 (3, 0 / 3 / 0xb / 0xd) L1 M1 f64, each when block +0x44 <= +0x5b4 + 900; sp_03 0 (7, 9) L2 M4 f76 at the target (setup +0x30 = block +0x1d0, byte +0x40 = 1); sp_03 11..13 (7, 0x32) L2 M6 f116 / 148 / 202 at block + 2000 ahead (modes in mask 0x3870; else block +0x1d0: (7, 0x50) 8..10); sp_11 4 (7, 8) L2 M48 f108, 3 (7, 0x2a) L2 M50 f138 (Chaotic with P+0x1a2 == 1: 5); sp_11 1 / 2 L2 M7 / M37 f114 when the ray 0x183664 from block + (950 sin, 500, 950 cos) hits within 500 below him (0xfbb93c..0xfbba58) | uEm071_00 | R + E | gore-line-shells-spec 1.1 |\n"
"| `0xfc2500` (-> `0xfc2554` / `0xfc26e4` / `0xfc284c`) | the Gore line's sp_01 reader: ef 0 / 2 / 1 -> +0x15c8 / +0x15cc / +0x15d0 (the 0x20 switch's); int 0 the switch's sound +0x15e8; +0x15ec 4 int 1, 0x60 int 3, 0x80 int 4, 0x800 int 5, 0x1000 int 6 (Gore only); Shagaru 8 by int 2; float 0 the timer; vec 0 +0x1608 | uEm071_00 | R + E | gore-line-shells-spec 1.2; shells.js params071s01 |\n"
"| `0xfc2ad8` (-> `0xfc2b2c`) / `0xfc30f4` / `0xfc3164` | the Gore line's sp_03 reader (joint int 0, fan / speed / life floats 0..2, +0x1664: 8 int 2 the turn, 4 int 3 the timer from the target, 1 int 4 the climb path; floats 5 / 3 / 4 / 6 / 7 -> +0x1668 / +0x166c / +0x1670 / +0x1674 / +0x1678; ef 1 -> +0x1660) / its +0x150 (type 0 ends; type 2 ends unless (mode in 0x3f70 and id 0x137) or mode 7; other types return) / its +0x154 (0x3fd820, then a class effect for modes in 0x3f71) | uEm071_00 | R + E | gore-line-shells-spec 1.2; shells.js params071s03 |\n"
"| `0x3fdb74..0x3fdc64` (base03 init) | +0x1664 bit 2: the life +0x15fc and timer +0x162c = clamp((sqrt(dy^2 + dx^2 + dz^2) + \\|P.y - T.y\\|) / +0x15f4, +0x166c, +0x1670), T = +0x1640.. (setup +0x30.. when setup byte +0x40, else block +0x1d0 + 16 x byte +0x2c), P the grounded point; before the velocity remake | uShellEmBase03 | R + E | gore-line-shells-spec 1.2; shells.js timer03 |\n"
"| `0x3fddcc` (base03 move's first call, +0x1664 bit 3) | the turn at +0x1640 while +0x16d0 == 0: the limit u32(dt x u16(s32(0.5 + +0x1668 x 182.04))); heading s32(0.5 + atan2(T.x - x, T.z - z) x 10430.38); \\|sxth(h - Y)\\| < limit -> Y = u16(h); else u16(h - Y) < 0x6000 -> Y + limit, > 0xa000 -> Y - limit, else kept; the velocity +0x1010 remade from the words (0x3f95a4) | uShellEmBase03 | R + E | gore-line-shells-spec 1.2; shells.js turn03 |\n"
"| `0xfc333c` (-> `0xfc3384`) / `0xfc38b8(shell, k)` | the Gore line's sp_11 reader (ef 0, flag 4 by int 1, vec 4 -> +0x1608 the init's offset, count int 0, times float k + 4) / its +0x168 (Y + float k deg, vec k turned; by mode (0xfc399c): 0 sp_03 7, 1 sp_01 [2, 3, 4] + a half-turned twin for k >= 1 (0xfc3f48 / 0xfc3f4c: -+8.742278e-8), 2 [5, 6, 7], 3..5 [8..11] then the sp_11 moves by o, 6 [15, 16, 16, 16]) | uEm071_00 | R + E | gore-line-shells-spec 1.2; shells.js params071s11 / create071s11 |\n")
s = s[:j + 1] + rows + s[j + 1:]
# tooling
a = "| tooling: emu_fb `treeDepth`, `slot0Modes`, `slot0Ids`, `dtp`; TOFF base25 / base26 |"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + ("| tooling: `<scratchpad>\\fb\\gen071.py <mon>` / `ins071.py` / `mk071spec.py`; fb/gorepokes.json | the Gore line's SHELL_DATA from shl_<mon>.txt + the arc's hitdata; the insertion; the check's spec (the ids poked at e+0xcac4..0xcad0) | -- | -- | controls: dev/shells-gore-check.mjs's six FAIL |\n") + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)

p = D + r'\effect-runtime-engine.md'
s = open(p, encoding='utf8').read()
a = "| base03 / base19 / base15 | ground-follow (slope step); 19 adds size growth / roll; 15 a zigzag on it | `0x3fd9d8` / `0x3f96a0` | em003, em061, em081 specs |"
assert s.count(a) == 1
s = s.replace(a, "| base03 / base19 / base15 | ground-follow (slope step); 19 adds size growth / roll; 15 a zigzag on it; base03's target arms (the Gore line's sp_03): a life from the target's distance, a turn toward it each move | `0x3fd9d8` / `0x3f96a0` / `0x3fddcc` | em003, em061, em081 specs; gore-line-shells-spec 1.2 |")
open(p, 'w', encoding='utf8').write(s)

p = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(p, encoding='utf8', errors='surrogateescape').read()
a = "      - [ ] (bug) Valstrax's shells show nothing until em086_00u 10 / 20 / 21 / 30 / 500 / 501 are recorded and lifted.\n"
assert s.count(a) == 1
s = s.replace(a, a +
  "      - [x] 2026-10-19 -- GORE MAGALA'S SHELLS (spec dev/gore-line-shells-spec.md 1): the frenzy ball (L2 M52), the ground lines that\n"
  "        turn toward the hunter (L2 M4) and the three ahead (L2 M6), the burst rows (L2 M7, L2 M48, L2 M50) and the slam dust (L1 M1 /\n"
  "        M8). Check 17/17 against the ROM's own runs; page 4/4. Chaotic and Shagaru next, as deltas.\n"
  "      - [ ] (bug) Gore Magala's shells show nothing until em071_00u 0 / 1 / 10 / 11 / 150 / 151 / 152 / 162 / 172 / 210 / 220 / 230 and\n"
  "        em071_00c 30 / 31 are recorded (shell kind) and lifted.\n")
open(p, 'w', encoding='utf8', errors='surrogateescape').write(s)
print('ok')
