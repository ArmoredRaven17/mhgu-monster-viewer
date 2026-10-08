# base07 (uShellEmBase07) and Bloodbath's shell07 `0x72` — decode spec

Implementation agent for the Viewer agent, 2026-10-08. Raven: *"Look into Bloodbath's List 9 animation effects."*
Census `dev/em007_04-list9-census.md` §5 / §6 E1 (base07 unread, gating u 0 / 1 / 10 / 11 on L9 M10). Read statically,
end to end, the way `dev/em081-shells-spec.md` read base14 / 15 / 50. `R` read, `I` inferred.

## 1. The class and its base (R)

`0x72` = `uShellEm007_04_07` (DTI `0x188bde8`, size `0x1630`), setup `uShellEmBase07::cSetupParamEmBase07` (DTI
`0x1885dd8`, size `0x30`), res `0x89c5` (shell table, `efx/agents/narga-shell-scratch/shelltable.json`). base07 has two
users in the game: this and `uShellEm018_04_07` (id 152).

Vtable `0x179aae8`, **89 slots** (`+0x164` is 0: the extent). Its own slots: `+0x4` `0xd46c70` (dtor), `+0x14`
`0xd46c80` (DTI getter), **`+0x28` `0xd46c40`**, **`+0x14c` `0xd46a94` (the reader)**. Every other path slot is base07's:

| slot | addr | what |
|---|---|---|
| ctor | `0x402148` | common ctor `0x43a78c`, then +0x15c8..+0x15d4 = 0 (ef handles' sources), +0x15d8..+0x15e4 = −1, +0x15e8 (flags) = 0, +0x15ec / +0x15f0 = 0, +0x15f4 / +0x15f8 = a GOT vec pointer (the zero vector), +0x15fc = −1, +0x1600..+0x1608 = 0, +0x1610..+0x1618 = that vec, +0x161c / +0x162c = 0, +4 = 0, +0x15a8 = 7. Common ctor: +0x15c0 word 0 (so bytes +0x15c2 / +0x15c3 = 0), +0x15c4 = 90.0 |
| setup | `0x401f88` / alloc `0x402014(size, r1)` | the 0x30 setup: +4 id (0x19d unset), +8 mode, +0xc owner, +0x10..+0x18 a GOT vec3, +0x1c 0, +0x20 halfword 0xffff |
| `+0x13c` init | `0x4022a8` | §3 |
| `+0x24` move | `0x402914` | §4 |
| `+0x158` step | `0x402a1c` | §4 |
| `+0x15c` integrate | `0x402bac` | §4 |
| `+0x160` hit reg. | `0x402c98` | `0x4a1ad8(shell) == 1` and hit +0x15d8 >= 0 -> vt +0x140 (the hit registration, +0x1588 group). Hit side, not visual |
| `+0x150` landing | `0x402050` | §5 |
| `+0x148` end | `0x402d04` | §5 |
| `+0x154` | `0x402e00` | `bx lr` |

## 2. The reader `0xd46a94` (R)

Accessors as rom-map's (`0x4a22f0` getEffect, `0x4a23f4` accA, `0x4a2470` getInt, `0x4a24f8` getFloat, `0x4a2584`
accVec, null paths −1 / 0.0 / the empty vec3):

| file | -> | meaning (consumer) |
|---|---|---|
| ef 0 / 1 / 2 / 3 | +0x15c8 / +0x15cc / +0x15d0 / +0x15d4 | flight (init) / landing type 0 / type 1 / type 2 (§5) |
| hit 0 | +0x15d8 | the hit record (`+0x160`) |
| int 0 | +0x15dc | the JOINT (init: −1 -> the owner's +0x40) |
| int 1 / int 2 | +0x15e0 / +0x15e4 | camera ids `0x43ac04` of landings type 0 / 1 (−1 returns at once; an event only) |
| int 3 != −1 | +0x15e8 bit 1 (0x2) | keep the angle words (no turn to the velocity, §4) |
| int 4 != −1 | +0x15e8 bit 2 (0x4) | scale vec 0 and vec 1 by the owner's size `0xbe518` (block +0x1ac × +0x1b0) |
| int 5 != −1 | +0x15e8 bit 3 (0x8) | init's tail `0xbe518` then `0x43ab74(shell)` — NOT READ; no Bloodbath mode sets it |
| float 0 | +0x15ec | the flight time F (frames); init returns 0 when F <= 0 (`0x402390`) |
| float 1 | +0x15f0 | the arc height H |
| vec 0 / vec 1 | +0x15f4 / +0x15f8 (pointers) | the start offset / the target offset |

Bit 0 is never written by the reader (the ctor's 0): the init's setup-position arm (`0x402470`) is not taken.

Bloodbath's files (`em007_04.arc shell\em\em007_04_shell07`, 12 modes, ints [−1, −1, 0, 0, 0, −1] for 0..2 and
[−1, −1, −1, 0, 0, −1] for 3..11 -> flags **0x6** on every mode; ef `[[0,0],[0,1],[0,1],[0,1]]` (u 0 flight, u 1 every
landing) on 0..2 / 6..8, `[[0,10],[0,11],[0,11],[0,11]]` on 3..5 / 9..11; scale 1.2 on 0..2 / 6..8, 1.0 on the rest; hit 0 /
1, hitdata [(30, 999), (30, 999)]):

| mode | F | H | vec 0 | vec 1 |
|---|---|---|---|---|
| 0 | 70 | 1000 | (0, 0, −650) | (−600, 0, 0) |
| 1 | 75 | 1050 | (0, 0, −700) | (100, 0, −750) |
| 2 | 80 | 1200 | (0, 0, −700) | (550, 0, 150) |
| 3 | 72 | 1000 | (0, 0, −700) | (−400, 0, 0) |
| 4 | 75 | 1050 | (0, 0, −700) | (0, 0, −700) |
| 5 | 85 | 1200 | (0, 0, −700) | (400, 0, 0) |
| 6 | 72 | 800 | (0, 0, −700) | (−350, 0, −380) |
| 7 | 75 | 1000 | (0, 0, −700) | (0, 0, −680) |
| 8 | 90 | 1200 | (0, 0, −700) | (500, 0, −700) |
| 9 | 72 | 800 | (0, 0, −700) | (−600, 0, −750) |
| 10 | 75 | 1000 | (0, 0, −700) | (0, 0, −800) |
| 11 | 90 | 1200 | (0, 0, −700) | (600, 0, −1000) |

## 3. The init `0x4022a8` (R)

1. `0x43a850(shell)` and the owner `0x4a100c` with `[+0x50] & 1`, else delete (vt +0x40) and return 0. Setup +0x20 ->
   +0x1588 (the hit group). The reader (vt +0x14c). Owner O = `0x4a0f00(shell)`.
2. +0x15f4 / +0x15f8 null -> the GOT empty vec. F = +0x15ec; **F <= 0 -> return 0**.
3. The base point P (+0x40..): flags bit 0 -> setup +0x10..; else joint +0x15dc != −1 -> that joint's row 3 (`0xc15a4`);
   else **O's own +0x40 / +0x44 / +0x48** (`0x40248c`). +0x4c = 0.
4. v = vec 0, × `0xbe518(O)` when bit 2. Turned by O's words (`ldrh` +0xff0 Z, +0xfe8 X, +0xfec Y, × 9.58738e-05 =
   `0x38c90fdb`, sinf `0x13ecc20` / cosf `0x13ecc2c`) **Z, then X, then Y** (`0x4024ec..0x4025ac`, each product rounded):
   a = y cZ + x sZ, b = x cZ − y sZ; c = z cX + a sX; then x' = b cY + c sY, y' = a cX − z sX, z' = c cY − b sY.
   P += (x', y', z'); +0x1000.. (the previous point) = P, +0x100c = 0.
5. w = vec 1 (into +0x1610..), × size when bit 2 (`0x402660`), turned the same way (`0x40268c..0x40274c`, the same
   order of operations); T = P + w -> +0x1610..; dx = T.x − P.x, dz = T.z − P.z (the turned w's x and z).
6. The velocity and gravity (`0x402750..0x402800`): h = F × 0.5; +0x1010 = dx / F, +0x1018 = dz / F; +0x1014 =
   H / (h × 0.5); +0x1024 = (float)(H / (h × (h × −0.5))) **in double**; +0x1020 = +0x1028 = 0. So the shell climbs H
   and comes back to P.y at t = F, having crossed dx, dz.
7. The words: +0xfe8 / +0xfec / +0xff0 = O's +0xfe8.. (the full words, as loaded). State byte +4 = 1. The life
   **+0x1600 = F + F**.
8. ef 0 (+0x15c8 non-null): its requester at +0x40 (`0x4a10c8`, model interface vt +0x130 -- the shell), started
   (`0x4a11e4`), handle -> +0x1604. Flag 0x10 -> byte +0x15ac = 0. +0x15bc = +0x15fc. vt +0x160 (hit registration). Bit 3
   -> `0x43ab74` (unread, unused here). Return 1.

## 4. The move (R)

`0x402914`: `0x4a1698`; drop a dead handle +0x1604 / +0x1608 (its unit's state & 7 not 1 or 2 -> 0). State 1 -> vt
+0x158. State 0xfe -> +0x1600 −= the step [shell+0x1c] (clamped at 0, `vselge`); delete (vt +0x40) at 0, or when
neither handle is alive (`orrs r0,r1,r0`). The same ending as base00's.

`0x402a1c` (state 1): vt +0x15c `0x402bac` first: +0x1000.. = +0x40.. (the previous point); **`0x539224`**: t = step × vt
+0x90 (`0x5392f8`: 1.0), hh = (t t) × 0.5, p += hh a + v t, v += t a per axis -- the same arithmetic as base00's flight
(shells.js `stepFlight`); then, unless flag bit 1, X word = u16(s32(0.5 + atan2f(−vy, sqrtf(vz² + vx²)) × 10430.378)), Y
word = u16(s32(0.5 + atan2f(vx, vz) × ...)) (`0x402c00..0x402c88`) -- Bloodbath's modes all keep the owner's words.
Then the owner active (`0x4a0f38`, else end); the life: <= 0 -> 0 and end; else −= the step (clamp 0), <= 0 -> end
(vt +0x148 with 0). Else **the query** `0x43ac6c` / `0x43ac8c(shell, &out, &type, &res, 0)` -- the rocks' query (shells.js
`collide`: +0x15c2 == 0 -> mask 0x30, +0x15c3 == 0 -> A = +0x40, B = +0x1000) -- and on a hit: +0x1060.. = the result,
+0x1080.. its normal, vt +0x150 (the landing) with the type.

The class's own **+0x28 `0xd46c40`**: `0x4a1770`, then in state 1 `0x43b2b0(shell, 1, &+0x40, 1)`: a ground ray
(`0x183664`) under the shell and an entry in a pooled list (`0x2b3c8`, size table `0x1592238` = 5, 6, 7, 9 by kind) --
INFERRED the shell's ground marker / shadow. Not an effect record; not modelled.

## 5. The landing and the end (R)

`0x402050(shell, &out, r2, type)`: type 0 -> 0x43ac04(+0x15e0) then ef +0x15cc; type 1 -> 0x43ac04(+0x15e4) then ef
+0x15d0; type 2 -> ef +0x15d4; the param's requester at the contact point (`0x4a10c8`, `stm sp,{area, r8 = &out}`) ->
handle +0x1608; then vt +0x148(shell, 0). So **ef 1 / 2 / 3 by the hit type, at the contact** -- base00's landing
(shells.js `landing`), the handle in +0x1608.

`0x402d04(shell, flag)`: not already ending -> `0x43b058(shell, +0x1604, flag)` (ef 0 stopped, gracefully for 0),
`0x4a1de4`, vt +0x154 (`bx lr`), state 0xfe, +0x1600 = [0x162493c] (30.0) × 60.0; flag 1 -> delete at once.

## 6. The spawns: L9 M10, `0xd41b48` phase 1 (R)

Arms (group 7, table `0xd34304`): (7, 0x77) r1 1 r2 0; (7, 0x79) r1 0 r2 0; (7, 0x7a) r1 1 r2 1; (7, 0x7b) r1 0 r2 1 --
all `0xd41b48`, phase 0 `0xbc7f4(e, 0)` and setMotion **L9 M10** (`0x90a`, `0xd41bac`). Phase 1: the table pair copied
from `0x169bc60` = {24, 0, 25, 1, 26, 2} and `0x169bc78` = {24, 3, 25, 4, 26, 5}; **vt +0x370(e, 1) (tail severed) picks
the second** (`0xd41d1c..0xd41d34`); r6 = 6 when the arm's r1 == 0, else 0 (`0xd41d4c`). Three gates `0xb0974` at tune
floats 24 / 25 / 26 (em007_04_actiontune: **f128 / f132 / f134**), each `0x402014(0x30)`: +4 0x72, +8 mode + r6, +0xc the
enemy, +0x10.. a GOT vec3 (unread by the init on flags 0x6), +0x1c 0, +0x20 the halfword [P+0xb0a] (the hit group), submit
`0x48b884` (`0xd41de8` / `0xd41e94` / `0xd41f3c`).

| action | intact | severed |
|---|---|---|
| (7, 0x77) / (7, 0x7a) | modes 0, 1, 2 (u 0 + u 1) | 3, 4, 5 (u 10 + u 11) |
| (7, 0x79) / (7, 0x7b) | 6, 7, 8 (u 0 + u 1) | 9, 10, 11 (u 10 + u 11) |

(7, 0x78) plays L9 M10 from frame 180 (setMotionL, `0xd420c4`) and (7, 0x75) / (7, 0x76) from f194: past the gates, no
shell07. No variant test on the spawn path (`0xd41bb0`'s variant test picks the motion RATE).

## 7. What the viewer carries (render/shells.js `make07` / `step07` / `spawn007`)

The init (§3) and move (§4) whole, the landing ef by type at the contact, the end and its 30 × 60 ending; the effects
by the rocks' requesters (`rockRequest`). The owner inputs: `input.ownerPos` (O's +0x40), the words `ownerWords001`
(O's +0xfe8.. low halves), the size (`0xbe518`), `input.tailSevered` (the parts shown: motion-states.js SHELL_TAIL
em007_04, part 4). Not modelled, named: the hit side (+0x160, the slots), the camera (0x43ac04), the +0x28 ground marker,
bit 3's `0x43ab74` (no mode sets it).
