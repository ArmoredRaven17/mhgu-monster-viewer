# doc_rockets.py: rom-map rows (base59's move, the gate and cooldown, sp_00's type 14 and its object gate, the build, the tooling) and
# the spec section for Ahtal-Neset's rockets (shells agent, 2026-10-20)
import os
BS = bytes([92])
SP = b'<scratchpad>' + BS + b'neset' + BS
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
b = open(P, 'rb').read(); NL = b'\r\n'
i = b.find(b"| sp_59 reader `0x10c2e4c` (READ whole) + base59 init"); assert i >= 0
j = b.find(NL, i)
rows = [
 b"| base59's move `0x4351a4` (READ whole, EMULATED; shells agent 2026-10-20) + `0x435930` (the kill) + +0x148 `0x4359bc` | states by +4: "
 b"**0** `0x539d5c` on +0x1378 (setup +0x20 = 0: done at once) -> 1, ef 0 (+0x15d4 -> handle +0x15cc) at +0x40, hit +0x15dc; +0xc bit 11 cleared, "
 b"no tail. **1** `0x539224` (stepFlight), the wobble, then y <= the setup's y -> +0x40 = the setup point, state 2, +0x1378 = +0x15f8, X word = "
 b"+0x15fc deg, +0x15cc stopped (0x329c40(h, 0)), ef 1 (+0x15d8) at +0x40, hit +0x15e0, the quake (`0x276e0c` -> `0x29fe7c(it, 0xd, 0)` when "
 b"its area is the shell's). **2** the wobble, `0x539d5c` -> +0x110 bits 1..2 = 2, state 3. **3** the wobble, X -= s32(0.5 + +0x1600 x dt x "
 b"182.04) down to +0x15ec deg -> +0x15d2 = 0, state 4, +0x1378 = +0x1604, `0x664918` and the PICKUP OBJECT `0x31a2ac` (at +0x15c8 = "
 b"[+0x136c]+0x25c; +4.. the point grounded by `0x3187c4`, +0x44 150, +0x48 200, +0x60 20, +0x64 15 (17 for id 0x843), +0x4e setup +0x2a, "
 b"`0x318be4(obj, setup +0x26, +0x28)`: the maker's item id / count). **4** -> 5. **5** +0x1378 > 0 counted -> 6 with +0x1378 = +0x1608 "
 b"(his mode: -1, so it stays). **6** counted, +0x158 = +0x1378 / +0x1608 (the alpha), out -> vt+0x40. THE WOBBLE: +4's top byte + 1 "
 b"(past 4 -> 0) indexes 0x1624928 (0, 1, -1, 0, 1); +0x15d2 = u32(that x f(u16(s32(0.5 + +0x160c x 182.04)))). THE TAIL `0x435820`: +0xc "
 b"bit 11 when the shell's area byte == [[0x1831ae0]]+0x49 (the player's), then (sb set: states 1..4) +0xfec = u16(+0x15d0 + +0x15d2) "
 b"and vt+0xcc / +0x4c / +0x50. `0x435930(h, r1)`: 1 -> vt+0x40 at once; else state 6 with the fade. [+0x136c] is the setup | base59 / "
 b"uShellEm087_sp_59 | R + E | shells.js step59; dev/shells-neset-rockets-check.mjs |",
 b"| Neset's rocket gate and its handles (READ, shells agent 2026-10-20) | vt+0x204 `0x10a6e58` with e+0x73e4 == 0 (`0x10a7070..0x10a715c`): "
 b"each bit k of e+0xcdc0 -> `0x10a795c(e, k)`; any -> e+0xcdc4 = tune 0x1e (90.0) x 60.0 and `0x65baf8(1, 0x6e, 0)` (a sound); the byte "
 b"cleared. The cooldown: vt+0x1dc `0x10a4bdc` (every update) `0x10a558c`: `0x7206c(e, &+0xcdc4, 1.0)`, -= dt. The handles: `0x10a4cfc` "
 b"drops e+0xcdcc + 4k when the unit's +0xc & 7 is not 1 / 2. The kill mask e+0xcdc1 (EMC a3 (2, 7 / 0x38): g0 s4 / s5, before action "
 b"(7, 1)): `0x10a6540..`, when e+0xcdc8 (set by the action mains at 0x10b7d90 / 0x10b8134 / 0x10b9d5c / 0x10ba5a8 / 0x10ba6a0, NOT READ) "
 b"counts out -> `0x435930(h, 0)` (the fade) per bit. `0x10a7bac(e, r1)` kills all nine (from 0x10a75f8, a switch NOT READ). The mask "
 b"e+0xcdc0 only from EMC g0 s0 (a3 (1, 7) / (1, 0x38), 50 : 50 under selector 7) | uEm087_00 | R (gate, cooldown, handles, kill) / NOT READ "
 b"(the e+0xcdc8 writers, 0x10a75f8's switch) | spec 3C |",
 b"| Neset's sp_00 (0x176): event type 14 `0x10aba68` + its gate kind 14 (vt+0x47c `0x10ab32c`) (READ, shells agent 2026-10-20) | type 14 "
 b"(vt+0x480 table index 7): setup 0x40 (`0x49ff98`): +4 0x176, +8 u32(a0) (the mode), +0xc e, +0x10.. / +0x20.. two global (zero) vecs, "
 b"+0x1c 0, +0x2c 0, +0x2e 0xffff, +0x30 the row's raw a2 (0 / +-10.0), +0x34 u32(a1) (40..42 / 50..52); `0x48b884`. **Kinds 14..21 test "
 b"one of his OBJECTS, not his frame**: kind 14 -> obj = e+0xcd10[row byte +0x14]; obj byte +0x10 == row +0x18 (a motion id) -> `0x6ca70` "
 b"(row f0 +0xc, mode 1) on the object's frames +0x18 / +0x1c; kinds 15..21 the same on e+0xcd28's +0xc / +0x14 / +0x18 (modes 2..4). "
 b"His 20 kind-14 rows: (7, 7) L2 M28 f144, (7, 0xa) L0 M1 f144, (1, 0) L0 M1 f144 / f90 ... (rows087.json). The objects' motions "
 b"(types 12 / 13: 0x1218130 / 0x12176f0) and sp_00's class are NOT READ; the viewer shows the objects as parts with no motion -- "
 b"NOT BUILT, the stand-in asked | uEm087_00 | R (arm, gate) / NOT READ (the objects' motions, sp_00's class) | spec 3D |",
 b"| tooling: " + SP + b"rkrun.py / rkcmp.mjs / rocket087.js / arcget.py / apparse.py (shells agent 2026-10-20) | rkrun: emu_fb.py with the "
 b"rocket's stand-ins (the model resource 0x152530 -> a zeroed block, setModel 0x936ddc / release 0x884698 answered, the quake global "
 b"0x276e0c, the pickup 0x664918 / 0x31a2ac, all 0) and a case's `patrol` (his rAreaPatrolData built in memory, e+0x760c / +0x1053 / "
 b"+0x1054, the session's area byte); rkcmp: shells.js against it. arcget / apparse: an ARC's entries by type, the patrol records | "
 b"control: dev/shells-neset-rockets-check.mjs's (his position, the patrol off: fail; a joint nobody reads: matches) | **the "
 b"session variable [0x1831ae0] -> 0x18858a8 is NULL in the harness**: base59's tail reads page 0 for the player's area (0), so a "
 b"shell whose area byte is not 0 is never drawn there; the patrol cases stand an object in |",
]
b = b[:j] + NL + NL.join(rows) + b[j:]
open(P + '.tmp', 'wb').write(b); os.replace(P + '.tmp', P)
# the spec
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\ahtal-neset-shells-spec.md'
b = open(P, 'rb').read()
o = b"| sp_59 | 0x17a | base59 (the rocket, model em087_00_rocket) | vt+0x204 0x10a6e58 -> 0x10a795c on the action start after his EMC sets the mask | NO -- gate READ (\xc2\xa73C); the maker's point query 0xb3ca0, its tail and base59 NOT READ |"
assert b.count(o) == 1
b = b.replace(o, b"| sp_59 | 0x17a | base59 (the rocket, model em087_00_rocket) | vt+0x204 0x10a6e58 -> 0x10a795c on the action start after his EMC sets the mask | **yes, checked (2026-10-20)**: dev/shells-neset-rockets-check.mjs 27/27, page 6/6 (\xc2\xa73C) |")
o = b"| sp_00 | 0x176 | own (setup 0x40, 0x49ff98) | event type 14 | NO -- the arm reached through vt+0x47c 0x10ab32c is object-gated, NOT READ |"
assert b.count(o) == 1
b = b.replace(o, b"| sp_00 | 0x176 | own (setup 0x40, 0x49ff98) | event type 14 | NO -- the arm and its gate are READ (\xc2\xa73D): the gate tests his OBJECTS' motion and frame, which the viewer does not have; the stand-in is asked |")
anchor = b"## 4. The viewer (shells.js)"
assert b.count(anchor) == 1
sec = (b"### 3C.1 The rockets, built (shells agent, 2026-10-20)" + NL + NL +
 b"- **What a rocket is:** a supply drop. It falls 100 m along its own heading (the maker's tune by k, 0x1f..0x27: 200 / 90 / 170 / 270 / 60 /" + NL +
 b"  -30 / 270 / 60 / -30 deg), pitched 330 deg, at -10 a move accelerating -0.5. It lands on the point (u 400 there, u 410 stopped)," + NL +
 b"  wobbles 4 deg on Y for 40 frames, tips from 340 back to 330 deg at 1 deg a frame, then makes the pickup object (the maker's item id and" + NL +
 b"  count; not drawn here) and stays until killed. Model em087_00_rocket at scale 2.0 (float 11)." + NL +
 b"- **The ROM check** (dev/shells-neset-rockets-check.mjs): rockets 0..8, with and without his patrol record. Each run lasts 700 moves and" + NL +
 b"  matches the ROM move by move (state, point, words) and start by start." + NL +
 b"- **The viewer's stand-ins:**" + NL +
 b"  - The Rockets control (motion-states.js CLASS_CONTROLS em087_00: Off / Rockets A (0-2) / Rockets B (3-5), working labels) is his AI's" + NL +
 b"    mask. It is applied at an action start only when the ROM's selector 7 holds: no rocket out and the 90 s cooldown run." + NL +
 b"  - Off fades the landed rockets (20 frames), standing in for the (7, 1) kill." + NL +
 b"  - The points are his own record's, anchored on him: x / z plus his unit's (Raven's Lao / Alatreon precedent)." + NL +
 b"  - The item pick (the RNG) only names the pickup, so it stands at 0." + NL +
 b"  - Not shown: the model's fade alpha (the viewer's shell models have no alpha), the pickup object and the quake." + NL +
 b"- **Draws (the meter):** u 410 and u 400 draw on both sides." + NL + NL +
 b"## 3D. sp_00 (type 14): read, not built" + NL + NL +
 b"- Type 14 (`0x10aba68`) makes sp_00 0x176: mode u32(a0); +0x30 the row's raw a2; +0x34 u32(a1); the point and words from global zero" + NL +
 b"  vectors." + NL +
 b"- Its rows are kind 14. The gate (vt+0x47c `0x10ab32c`) crosses f0 on one of HIS OBJECTS' frames, e+0xcd10[row byte +0x14], while that" + NL +
 b"  object plays the motion row +0x18. It does not use his own frame." + NL +
 b"- The viewer shows the objects as parts with no motion of their own, so building sp_00 needs a stand-in for the object's frame. The one" + NL +
 b"  proposed is his own clip frame, which is to be checked against the type 12 / 13 object events first. sp_00's class is not read yet." + NL + NL)
b = b.replace(anchor, sec + anchor)
open(P + '.tmp', 'wb').write(b); os.replace(P + '.tmp', P)
print('ok')
