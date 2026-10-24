# romap_duo5.py: the closed reads (freeze frame, op 0x77, 7:0x3f phases, event groups 3/4/5) + withdrawn rows
import io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8').read()
assert '`0x951810` (layer length)' not in s
key = '| VIEWER (implemented) | ROM_PARTNER_BODY.em069_00 `classes` (re-read solos)'
i = s.index(key)
rows = '''| `0x951810` (layer length) | a motion's layer length `+0x504` = numFrames - 1 (`ldr r1, [motion, #8]; sub r1, r1, #1`), loop point `+0x508` = the header's loop frame (negative: hold, bit 4 at `0x95184c`); a loop's period = length - loop (control: Rajang L2 M8 145 / 92 -> ends 144, 196) | shared | R | spec §14.1 |
| `0xa5af4..0xa5b14` | after the action main, a follow (`0x768c8` -> `+0x73ea` = 1) re-runs it in the same update: a followed action's phase 0 runs on the update it was chosen | shared | R | spec §14.1 |
| his M79 freeze frame | **6** = 186 advances (her M77 length) mod 60 (his M79 length 60, loop 0); the two units' order cancels (both his changes lag alike) | uEm076_00 | R (derived from the rows above) | spec §14.1; ROM_PARTNER_BODY `holdAt: 6`, M77 `period: 60` |
| `0x84f78` -> `0x8589c` -> `0x8e088` kind 0x15 -> `0x8e924..0x8ea18` | EMC op 0x77 = a switch on the DISTANCE from the unit to its target (op byte 3 = the target slot; `[P]+0x1d0 + 16 x slot`, a yaw-turned offset via `0x710a8` / `0x710d4`, `+0x168`); his g0 s4 cases 0 / 1 / 2 / default are distance bands; thresholds NOT READ | shared / uEm076_00 | R | spec §14.2 |
| his 7:0x3f phases (table `0xfd59cc`) | 0 `0xfd59e4` M33 by turn record; 1 `0xfd5a90` turn to f40; 2 `0xfd5ad8` / 3 `0xfd5b08` repeats while `+0x6c` <= 2 (M33 from 100 `0xfd5d48`; helpers `0xfd4924` / `0xfd4b00` NR); 4 `0xfd5a40` flag `+0x6b` at f105; 5 `0xfd5b2c` wait, then the ride | uEm076_00 | R / NR (helpers) | spec §14.3 |
| event groups 3 / 4 / 5 | selected by the forced-transition family beside `0x7f010`: group 5 `0x7e1e8` / `0x7e678`, group 4 (notice) `0x7e9c8` / `0x7ed80`, group 3 `0x7f36c`, gated on awareness `P+0x2c0`, area bytes and the current group -- no link test; g12 / g18 selectors NR | shared | R | spec §14.4 |
'''
s = s[:i] + rows + s[i:]
s = s.replace("check dev/checks/em069_00.mjs duo block 51 / 51", "check dev/checks/em069_00.mjs duo block 66 / 66 (+ the required-clip mounting and the list-change-in-flight case)")
WD = '''| rom-map duo rows / spec §13 (2026-10-17): "his M79 freeze = 187 mod 61 = 4" and his M79 under her M77 at period 61 | took the clips' frame counts for the game's: a layer's length is numFrames - 1 (`0x951810`) and a loop wraps at length - loop | 186 mod 60 = **6**; period 60 (spec §14.1) |
| ROM_PARTNER_BODY.em069_00 `classes` first re-read (2026-10-17): 22 clips (M44..M50, M55..M62, M69, M70, M90, M91, L0 M10 / M11 / M36) solo because only her unlinked streams pick them | the event-group trigger was the weak link: groups 3 / 4 / 5 (awareness) have no link test | `both` (spec §14.4) |
'''
w_anchor = '| claim | why wrong | correction |\n|---|---|---|\n'
k = s.index(w_anchor, s.index('### Withdrawn')) + len(w_anchor)
s = s[:k] + WD + s[k:]
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('ok')
