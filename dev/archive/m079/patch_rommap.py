import io, sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
anchor = '| trap | the rom-map row "`0xff2604` <- `0xffb360`, mode by `0x3a8430`"'
i = s.find(anchor)
if i < 0: sys.exit('anchor not found')
j = s.find(nl, i)
if '### Malfestio / Nightcloak -- the action sets' in s: sys.exit('already patched')
rows = [
'',
'### Malfestio / Nightcloak -- the action sets (Hypnosis / dives), the eye window, the effect gaps (research agent for the Viewer agent, 2026-10-17; dev/em079-hypnosis-and-gaps.md)',
'',
'| addr | what | class | st | detail |',
'|---|---|---|---|---|',
'| `0xff05f8` (vt+0x210 `0xff04bc`, first call, both variants) | part pass, the action sets re-read: `cmp r8 (e+0x73e0), #7`; `tst 0x1600000, 1 << sb` (n 0x15 / 0x16 / 0x18) or n 0xcb / 0xda -> set 14 (groups 9 + 105 on) else 13 (`0xff0744..0xff0794`); status 7 and `(n \\| 2) == 0x12` -> set 16 (group 31, "Hypno Effect") else 15 (`0xff0798..0xff07b8`). No variant test in `0xff05f8..0xff0808` (control: the band grep finds `0xff04c8`, `0xfef4d4`). Groups 9 / 105 are NOT a break (part-review.json "Torso") | uEm079_00 | R | spec §1 |',
'| `0xffb208` (7, 0x10 / 0x12) | one action over L2 M16 -> L2 M17 (r1 0) / L2 M18 (r1 1) at the end -> L2 M19 at the end -> `vt+0x3dc` at its end: set 16 on all four clips whole | uEm079_00 | R | spec §2 |',
'| `0xffb3b4` (7, 0x15) r1 1 / (7, 0x16) r1 0 | L2 M21 -> lift `0xbc984`, L2 M22 -> L2 M25 (P+0x14 -10, +0x24 -1) -> landing `0xbf52c` L2 M23 (`0xb07b4(1.5)`, shell40 0) -> `vt+0x3dc` | uEm079_00 | R | spec §2 |',
'| `0xffb5d8` (7, 0x18) | L2 M24 -> L2 M20 -> L2 M25 -> L2 M23 (rate 1.5, shell40 0) -> `vt+0x3dc` | uEm079_00 | R | spec §2 |',
'| `0xff6fe4` (7, 0xca) r5 2 r2 0 / (7, 0xd2) r5 4 r2 1 | L2 M24 only; at its end `0xafce8` L1 M1 / M2 (by P+0x1a2) and `vt+0x3d0` -> (7, 0xcb) / (7, 0xda): L2 M24 under these carries NO set 14 | uEm079_00 | R | spec §2 |',
'| `0xff71cc` (7, 0xcb) / (7, 0xda) | L2 M20 (`0xafce8`) -> f18 `0xff02f4` -> L2 M25 -> landing L2 M23 (rate 1.5; tune 0x20 shell40 0 / 1) -> `vt+0x3dc` | uEm079_00 | R | spec §2 |',
'| setMotion census, band `0xfee698..0xffe0dc` | 117 sites (109 `0xafe84`, 8 `0xafce8`), all immediate ids (two via r6 = 0x15 / 8 / 0x1e / 0x12a); `0x210..0x219` (L2 M16..M25) only in the five bodies above; the class turn tables (23 `0x7a258` / `0x7a27c` calls, 9 tables) hold none. Control: finds `0x214` at both setters, `0x217` at all three landings. Shared status-10/11 scripts not scanned (I, the notes list their clips) | uEm079_00 | R (negative with control) | spec §2a (`m079/setm.py`) |',
'| em079 cmdtbl (both arcs) | (7, 0x10) g1 s19 (+ s95, Nightcloak only); (7, 0x12) s20 / s54; (7, 0x15) s5-8 / s54 / s64 / s65 / s94; (7, 0x16) s58 / s62 / s66 / s92; op 0x92 in s13 / s29-s32 / s34 / s35 / s41: case 0 (Malfestio) (7, 0x18), default (Nightcloak) (7, 0xca); (7, 0xd2) s97 / s112, called only from Nightcloak\'s g0 s11..s14 (`14 61` / `14 70`). So Malfestio\'s L2 M24 is always (7, 0x18) (set 14), Nightcloak\'s always (7, 0xca / 0xd2) (no set 14) | em079_00 / em079_04 | R (data) / I (op 0x14 = stream call) | spec §2b (`m079/emcscan.py`) |',
'| `0xff188c` L2 M23 / L3 M1 windows | `0xb09a4(e, 3, 0, s0 4.0, s1 64.0)` (`0xff1a0c`, s1 = `0x42800000` at `0xff1b6c`) / `(e, 3, 0, 2.0, 12.0)` (`0xff1a38`); arm 3 `0x7293c` -> `0x7299c`: **s0 <= frame <= s1** (channel 1) -> `e+0xcae0 = 1`, eye set 3. Viewer rows have no frame axis for sets | uEm079_00 | R | spec §4 |',
'| `0xfeffdc` (vt+0x204) status 11 arm `0xff01a8..0xff021c` | variant 4, `e+0xcb08 == 0`, and **`(e+0xcafc & ~1) == 2` (cloaked)** -> u 200 (id 0x3e9 via vt+0x1d0); `e+0xcb00 = 1` either way. An uncloaked Nightcloak requests NOTHING at death -- motion-states.js nightcloak()\'s death `start: [em079_04u, 200]` fires it uncloaked (states-em079_04.md 7.4 has the gate; the row comment dropped it) | uEm079_00 | R | spec §5 G3 |',
'| `0xfef54c` (vt+0x138, the effect-request filter) | variant 4 and cloaked only: passes u-pel (`[e+0xb624] == r1`) UNIQUE 100 / 200, SEQUENCE 500 / 510 / 511 (`0xc01` over key - 500), or action (7, 0x10 / 0x12 / 0x43 / 0x44), (7, n in 0xc9..0xe1 by `0x155a019`: 0xc9 0xcc 0xcd 0xd6 0xd8 0xd9 0xdb 0xdd 0xdf 0xe1), (1, 0x18); every other request returns 0. Otherwise `b 0x6fd8c` (the base). Uncloaked = everything passes (the viewer) | uEm079_00 | R | spec §5 G9 |',
'| `0xff7a24` (7, 0x29 / 0x2a / 0xd3) phase 1, `0xff4fb8` (L1 M22), `0xff757c` (L1 M27 / M28) | posture 3 (`bc7f4(e, 3)`) before setMotion L2 M35 (`0xff7aec`), L1 M22 (`0xff4fbc`), L1 M27 / M28: the unit is ON the ground (0xbf284). The viewer\'s generic air rule puts the unit FlyOfs x size + 485.5 above it (786 measured, size 1) and shell01 4\'s floor snap fails -> L2 M35 u 20 refused | uEm079_00 | R | spec §5 G5 |',
]
s = s[:j + len(nl)] + nl.join(rows) + nl + s[j + len(nl):]
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('ok')
