p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
a = "| `0x16acf0` (the hit manager's pair pass;"
i = s.index(a)
rows = [
"| `0xb07b4(e, s0)` (motion rate) | **EMULATED 2026-10-18 (duo agent, `duo/emu_freeze.py`)**: `P+0x398` = s0, then layer 0's speed = s0' x `P+0x38c` x `P+0x394` x `P+0x398` -> `0x5393d0` (stores `e+0x50c`; when non-zero also rescales `+0x4f4` by `+0x4f0` / `+0x10f4`), layer 1's -> `0x53942c` (stores `e+0x64c`). His 1:0x21's call (0.0, `0xfc99fc`) leaves BOTH layer speeds 0 (control: 1.0 gives 1.0 / 1.0) | shared | R + E | spec §20 |",
"| layer speed `+0x5c` of each motion layer (`e+0x4b0 + n x 0x140`: `e+0x50c`, `e+0x64c`) and the step `0x94ecf0..0x94ef08` | step = speed (`[layer+0x5c]`, `0x94ed08`) x dt (`e+0x1c`) (`0x94ee24`); frame `+0x4fc` += step unless the mode word bit 0x10 (`0x94eefc`). EMULATED: speed 0 keeps frame 6.0 for 60 updates on layer 0 and layer 1; control speed 1 advances 7, 8, 9 .. | shared | R + E | spec §20 |",
"| `0xafce8` (setMotion, behind `0xafe84` / `0xafef0`) `0xafd3c` | every setMotion resets `P+0x398` = 1.0 (unless `P+0x1a8` bit 4): a freeze lasts until his next motion is set. His 1:0x21 sets none, so M79 holds frame 6 to his 1:0x22's M77 | shared | R | spec §20 |",
"| her status-1 actions (all phases x link x scenarios) and every vtable method of uEm069_00, run against him (`duo/pwrites.py`) | ZERO writes into his memory (his unit, his `+0x1428` block, his `+0xcac0` block) and no call with him as r0 but `0x7fed4` (isDead, from vt+0x1dc `0xf8aa74`). Control: a store through the partner pointer is recorded (`duo/pw_control.py`). With the hit exclusion (`0x168f20`) and the eat's isDead gate: nothing of hers damages or kills him in M76..M79 | uEm069_00 | E | spec §20 |",
"| his attacks' ends (census): 7:0x32 / 0x33 / 0x34 / 0x39 at motion end -> (1, 0) the ride (`0xfd46e8`, `0xfd480c`, `0xfd4908`, `0xfd519c`); 7:0x3a -> (3, 0x3d) (`0xfd5640`, L4 M5 b0); 1:0x1c / 1:0x23 (M43) -> (1, 0) (`0xfc9518`); his 7:0x3f phase 5 (`0xfd5b2c..0xfd5bc4`): while she is in 7:0x4d / 0x4e / 0x4f the 300-frame timer, else (or at 0) the ride -- M33 holds its last frame meanwhile | uEm076_00 | E + R | spec §20 |",
]
s = s[:i] + nl.join(rows) + nl + s[i:]
a = "| `<scratchpad>\\duo\\wingemu.py`"
i = s.index(a)
tools = [
"| `<scratchpad>\\duo\\emu_freeze.py` (duo agent, 2026-10-18) | `0xb07b4` under unicorn (layer speed setters native) and the layer step `0x94ecf0..0x94ef0c` for layers 0 / 1, 60 updates | control: speed 1.0 advances one frame an update on both layers | the step only: the joint evaluation after `0x94ef0c` is not run |",
"| `<scratchpad>\\duo\\pwrites.py` (+ `pw_control.py`) | tracer.py census with a write hook on the partner's unit / `+0x1428` / `+0xcac0` blocks and the calls made with him as r0, per action x phase x link x scenario, plus every vtable method of the class | control: a store through the ctl's partner pointer is caught | shared code is stubbed (a shared routine called with HER pointer that writes him would not show -- the hit path is read separately, `0x168f20`) |",
"| `<scratchpad>\\duo\\probe-static.mjs` / `probe-static2.mjs` (page probes) | every combined entry frame by frame (her time set): his bones' largest local rotation change; stretches >= 10 frames under 0.005 rad, with his clip / frame at both ends (advancing = the clip's own still data; held = a hold) | the M78 freeze is found (held at M79 frame 6) | the 0.005 threshold: the matrix copy jitters ~0.001 rad while her joint moves |",
]
s = s[:i] + nl.join(tools) + nl + s[i:]
open(p, 'w', encoding='utf-8', newline='').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em069-duo-spec.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
old = "## 10. Not read" + nl
new = """## 20. The static audit, and M78 / M79 proven (2026-10-18; Raven: "static in some instances of the grab animations", "78 mainly", "Seltas dies, but then is dropped back onto the queen's body")

* **M78 / M79, dynamically**: his 1:0x21 (entered when she enters her M78, §17) calls `0xb07b4(e, 0.0)` (`0xfc99fc`). Emulated
  (`duo/emu_freeze.py`): `P+0x398` 0 and BOTH motion layers' speed 0 (`e+0x50c` via `0x5393d0`, `e+0x64c` via `0x53942c`);
  the layer step (`0x94ecf0..0x94ef08`: frame += speed x dt) keeps frame 6.0 for 60 updates on each layer, where the control
  (speed 1, his struggle) advances 7, 8, 9 ... He plays one layer (his 1:0x20 / 1:0x21 set M79 by setMotion0 only; no
  two-layer call in either, census). His class writes no joint but the wing cards' scales (0xfc66f8, all 0 at +0x49 = 0); the
  link writes his unit only. Every setMotion resets the rate to 1.0 (`0xafd3c`) and 1:0x21 sets none, so the hold lasts until
  his 1:0x22's M77. So through ALL of her M78 and M79 he is frozen at his M79 frame 6 -- the ROM's; not changed.
* **Does she kill him there?** No, on three reads: (1) her hits cannot reach him while he is linked to her (`0x168f20`, §19);
  (2) her class -- every status-1 action, every phase, link and scenario, and every vtable method -- writes NOTHING into his
  memory and calls nothing on him but `0x7fed4` (isDead) (`duo/pwrites.py`; control: a store through the partner pointer is
  caught); (3) he is not unlinked in M78 / M79 (only his own 1:0x22, 1200 frames after the freeze, unlinks him). No status
  script of hers runs in 1:0x21..0x24. So in the game, when a hunter does not kill him, he stays frozen on her back through
  M78 and M79 and after it, then drops (his 1:0x22: the entry "Seltas Motion[77] drop off her (1:0x22)"). Her eat (g1 s46)
  runs only if he is already dead (selector 4); only a hunter's damage can get him there.
* **The audit** (`duo/probe-static2.mjs`; 153 entries; >= 10 frames with every bone under 0.005 rad / frame):

| entry | frames | his clip there | verdict |
|---|---|---|---|
| Queen L4 M78 loop, L4 M79, S. M76-M79 from 252 | all | M79 @ 6 held | ROM: the 1:0x21 freeze (above) |
| Queen L4 M3 loop, L4 M25 | all | M3 held | ROM: his M3 is a one-frame motion (0 frames) |
| Seltas M43 / M31 / M32 / M33 / M34 | after his clip | his last frame held | **FIXED**: at each action's end the ROM rides on (1, 0) -- M34 via 3:0x3d's M5 -- now appended (ride M35 b10) |
| Seltas M33 with her 7:0x4e | 353.. | M33 @ 173 held | ROM: 7:0x3f phase 5 waits while she is in 7:0x4f (`0xfd5b2c`), M33 a non-looping motion held at its end |
| every free entry, the ride under M76, his M35 entry, M71 / M74 / M75 60..84, M73 1..14, M15 70..80, M26 95..112, the drop's L3 M11 / L0 M1 | stretches | his clip ADVANCING | ROM: the clips' own near-still frames (the ride M35, the landing's lie, ...) |

  No pick resolved to the bind pose, past a clip's end or to a missing clip.
* Check (duo block): every entry's clip advances at 15 / 40 / 65 / 90 % except the ROM's holds; his own entries ride on
  after their clip; his M3 is a one-frame motion; the freeze's hold at M79 frame 6 (§13 checks).

## 10. Not read
"""
assert s.count(old) == 1
s = s.replace(old, new)
open(p, 'w', encoding='utf-8', newline='').write(s)

B = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(B, 'rb').read().decode('utf-8', 'surrogateescape')
anchor = "      - **7:0x3f REBUILT 2026-10-17**"
assert b.count(anchor) == 1
b = b.replace(anchor, "      - **STATIC AUDIT + M78 / M79 2026-10-18** (Raven: \"static in some instances\", \"78 mainly\", \"Seltas dies, then is dropped back\").\n        M78 / M79: the freeze is the ROM's, emulated (both layers speed 0, frame stays 6; control advances); her class writes\n        nothing into him and calls only isDead (control caught); hits excluded while linked -> he does NOT die there. Audit of\n        all 153 entries: FIXED his own entries M43 / M31..M34 (now ride on after the clip); the rest are ROM holds (M78 / M79,\n        one-frame M3, 7:0x3f phase 5) or clips' own still frames. Spec §20.\n" + anchor)
open(B, 'wb').write(b.encode('utf-8', 'surrogateescape'))
print('ok')
