import os
sp = os.path.dirname(os.path.abspath(__file__))
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf-8').read()
sec = open(os.path.join(sp, 'romap_sec.md'), encoding='utf-8').read()
row = "| `0x10b5548` (shell60 slot byte -> mode) | byte v of `E+0xd434+k`: 0..4 -> mode v, 5..13 -> mode v + 1 (aim `[E+0x1428]+0x1d0`); handle `E+0xd420+4k` -- the effects spec's five web ANCHORS | uEm088_00 | R | spec §2 |\n"
assert s.count(row) == 1
s = s.replace(row, row + sec)
# the shells row: point at the new section (kept, annotated)
old = "sp_61: base61 `0x438838`, reader `0x10c5144` | uShellEm088_sp_NN | R (slots); bases NR | spec §2 |"
assert s.count(old) == 1
s = s.replace(old, "sp_61: base61 `0x438838`, reader `0x10c5144` | uShellEm088_sp_NN | R (slots); bases NR [**base57 / base60 / base61 / base48 / base58, sp_00 / sp_01 READ 2026-10-15** -- section \"Ahtal-Ka -- his shells read and built\"; its corrections in Withdrawn] | spec §2 |")
# withdrawn rows, at the end of the Withdrawn table (before the Render lane section)
w = """| dev/em088-shells-props-spec.md §2 (shell / prop agent, 2026-10-15): shell61's modes "each behind its own test"; base58 "a hit shape only"; the band base57 `0x42f03c..0x4336e8` / base58 `0x4336e8..0x434da8`; "INFERRED a Dragonator spike each" | read whole 2026-10-15 (shell implementation agent): `0x10b59e8` / `0x10b5be4` spawn unconditionally (only the old handle is released); base58 starts ef 0 / 1 (u 0 / 1, absent from em088_00u); base58's setup `0x4334c8` and ctor `0x433570` precede its init | shell61 unconditional; base58 requests two effects that find no record; base57 ends `0x4334c8`, base58 `0x4334c8..0x434a94`, base59 `0x434a94..0x435b40`; READ that base60 starts u 300 at its launch and stops it at its throw (that u 300 is a spike: its record em088_00_021) |
| dev/em088-shells-props-spec.md §2 / rom-map shells row: sp_01 "+0x154 end create of shell01 (0x10c3f40)"; "spawned from the frame update (0x10b40fc, timer E+0xd404)" | `0x10c3f40` is the tail of `0x10c3e44`, called from +0x150 (modes 3 -> 4 -> 5); +0x154 `0x10c3f50` creates nothing; `0x10b6320` arms d400; d404 has no positive writer (control: d400's three sites) | the lines' spawn is (1, 0xc / 0x17 / 0x19)'s start (L2 M33); +0x154 reports the cut line to G (`0x10aea28`) -- the ballista's trigger |
| row `0x6c590` "types ... 4 0x783fc, 6 0x78600"; row `0x10bb22c` type 7 "M17 f140-160"; spec §3a "kind 0xd at motion start" | the walker's type switch and kind table read whole (s0001\\walker.txt) | type 5 `0x78600` (motion OR cond), 6 `E+0x13a8 = a0`; kinds 9..12 on cad8 with no motion test; type 7 on L2 M17 is kind 1 = the crossing of 140 only; `0x6d1b4` handles types 1 / 2 / 3, `0x6d358` (setMotion) type 2 |
| rom-map row `0x10b345c` "shell48 ... (the G bytes' writer NR)"; dev/em088-shells-props-spec.md §2 "what sets the CU bytes: UNREAD" | read 2026-10-15 (b48\\shell48-spec.txt) | G+0xc6+k is armed by Ka's vt+0x1dc from G+0xbc+k, which sp_01's end writes when a hunter cuts silk line k; `0x1f5c10` is the network copy (`netEm087_088_FreeUsePacket`), not a script |
"""
anchor = "\n### Render lane"
i = s.index(anchor)
# the last table row before the Render lane section
j = s.rindex("|\n", 0, i) + 2
s = s[:j] + w + s[j:]
# a trap
trap_anchor = "## 2. Tooling"
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok')
