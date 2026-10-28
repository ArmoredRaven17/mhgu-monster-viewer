# Ahtal-Ka (em088_00) + Ahtal-Neset (em087_00) -- the combined actions

Combined lane for the coordinator, 2026-10-26. Raven: "Athal-Ka pulls up Neset then enters it. We can do the combine
animations. However, for the time being keep Neset its own entry". Built: render/monster.js `ROM_PARTNER_BODY.em088_00` /
`partnerWorldAt`, index.html (the world-placed partner), render/class-threads.js `em088Neset`, render/rom/effect/schedule.js (end
kinds 7 / 8), render/psl-mask.js `ACTION_EFFECTS.em088_00`, docs/effects/em088_00.json (u 400..410 thread, u 420 event). Tools:
dev/archive/ahtalduo/. rom-map: "Ahtal-Ka + Ahtal-Neset -- the combined actions".

**R** = the consuming instruction read; **R (emulated)** = also run; **I** = inferred; **NR** = not read. Addresses are main.text
offsets of the Switch build. Frames are 60 a second (the viewer's convention; the game's own dt is not read here).

## 1. How the two meet: G, not a link

They are two units of their own. Unlike the Seltas duo (link mode 3 on joint 200) neither is ever attached to the other: no link
call, no joint parent. They meet through the fight's global G (GOT `0x1832980` -> `0x2132968`; `G+0x34` Neset, `G+0x38` Ka) and
four flag bytes (setters / tests at `0x10aeaf0..0x10aeb5c`, every caller by `xref.py`):

| flag | set by | read by |
|---|---|---|
| `G+0xcc` (= 1, `0x10aeb28`) | Ka (1, 0x21) phase 4, L2 M47 frame >= 56 (`0x10bdd1c` `0xb0968` mode 1, literal `0x10be0d4`; tail `b` at `0x10bdd64`) | Neset (1, 2) phase 1 (`0x10b14c8`) -> request (1, 0x14) (`0x10b14e8`, `0x769f4`) |
| `G+0xcd` (= 2, `0x10aeb44`) | Neset (1, 0x14) phase 1 -> 2 (`0x10b026c`): L0 M9 reached 230 AND P+0x5c reached tune 0x29 | Ka (1, 0x21) phase 5 (`0x10bdd74`) -> L2 M48 |
| `G+0xca` (= 1, `0x10aeaf0`) | Ka (1, 0x21) phase 9, L2 M14 crossing 240 (`0x10be23c`); Ka's vt+0x204 at EVERY (1, 0x10) start (`0x10b5e18`) | Neset (1, 0x14) phase 2 (`0x10b0034`) -> (1, 0x15) (`0x10b0060`); Neset (1, 0xf) (`0x10b1430`) -> (1, 8) (`0x10b1454`) |
| `G+0xcb` (= 2, `0x10aeafc`) | Neset vt+0x204 at (1, 0xf)'s start (`0x10a74cc`); Neset `0x10a7bac(e, 1)` (`0x10a7de4`, the second collapse) | Ka (1, 0x10) phase 1 (`0x10bd5a0`) -> by `G+0x32`: 3 / 5 -> (1, 0x11) (`0x10bd5f4`), 6 -> (1, 0x12) (`0x10bd614`) |

Control for the xref scan: it returns the already-mapped `G+0xca` / `G+0xcc` setters (`0x10b5e18`, `0x10be23c`, `0x10bdd64`) and the
three `G+0xce` setters of rom-map's u 500 row.

### 1.1 The update order and the hand-offs (re-read 2026-10-26)

* **The unit update order** (R): the move-line add `0xc03670(mgr, line, unit)` APPENDS at the line's tail (the line record mgr + 24
  line + 0x28 head / + 0x2c tail; unit +0x14 next, +0x18 prev), and the line pass `0xc044c4` walks head -> next (`0xc04500` /
  `0xc04548`): units update in the order they were created.
* **Which is created first** (R data / I code): both Ahtal quests (11432, 1011030; `questdata.py`) list Ahtal-Ka as boss 1 (EmType 0x58)
  and Ahtal-Neset as boss 2 (0x57). That the quest spawner creates the bosses in slot order is NOT READ (the spawn routine was not
  found) -- INFERRED. So **Ka updates before Neset each frame**: a flag Ka sets, Neset sees in the same frame; one Neset sets, Ka sees in
  the next.
* **The request kinds** (R): `0x769f4` (Neset's (1, 2) -> (1, 0x14); Ka's (1, 0x20) -> (1, 0x21)) calls changeAction `0x76098`
  without the re-run flag -- the new action's phase 0 runs on the NEXT update. `0x10ade4c` (Neset) / `0x10bc334` (Ka) -> `0x6d564` ->
  the follow `0x768c8`, and `0x7699c` (Ka's (1, 0x12): it sets +0x73ea itself, `0x769e4`), re-run the main the SAME update (rom-map
  `0xa5af4..0xa5b14`).
* Hence, on the raise's frames: Ka's L0 M4 ends at 187, (1, 0x21) starts at 188; G+0xcc at 461 -> Neset's L0 M9 from 0 at 462; G+0xcd at
  716 (his update) -> Ka's M48 at 717; M13 774..846; M14 847; G+0xca at 1087 -> Neset's (1, 0x15) at 1087; Ka hidden from M14's end at 1112. The first
  collapse: Neset's (1, 0xf) at L3 M12's end (305), Ka's (1, 0x11) at 306. The re-entry: Ka's (1, 0x10) and Neset's (1, 8) both at 301.
  The second collapse: Ka drawn and in (1, 0x12) at frame 1; Neset hidden from L3 M16's end (251).
  (On the page each piece boundary was one frame late until the frame was snapped -- time x 60 at 301 reads 300.99999; the shells lane's
  (1, 8)-at-302, dev/archive/gapT/probe2.out. Snapped in index.html, rom-map trap 163; `combined_probe.mjs --edge re-enters:297:305`
  now shows L3 M12 to 300 and (1, 8)'s L0 M9 from 301, as this section frames it.)

## 2. Ahtal-Ka's actions (R)

Status-1 bodies off table `0x10bc790` (n 0..0x28), action starts off vt+0x204 `0x10b4828` (status-1 table `0x10b4bac`, n - 1).

* **(1, 0x20)** -> `0x10bfc84(e, 2)`: L0 M4 b4; at its end request (1, 0x21) (`0x10bfd54`, the only request of (1, 0x21) in the image:
  `reqscan.py`, control: Neset's four requests found). Its start drops the carried object (`0x10b5298`). Issued by em088_00_cmdtbl
  g0 s14, case 0 of the stream's op-0x6f switch, after (2, 0x12) / (2, 0x11) / (2, 0xb) (`emcacts.py`).
* **(1, 0x21)** -> `0x10bdba4`, phases P+0x1a1 (jump table `0x10bdbe8`, 10 entries):
  0 L2 M25 (0x219) b4; 1 at its end L2 M26 b0, P+0x1a2 = 3, P+0x1bc = 0; 2 P+0x1bc += dt (`0x7264c`), each end of the M26 loop
  P+0x1a2 -= 1, at 0 L2 M27 b0; 3 at its end L2 M47 b4; 4 M47 frame >= 56 -> G+0xcc; 5 wait G+0xcd -> L2 M48 b4; 6 at its end L2 M13
  b4 and the jump: P+0x1d0 = Neset's P+0x40 + R(yaw)(40, 0, 1300) (`0x10bde10..0x10bde70`; yaw = Neset's u16 P+0x54 x 9.58738e-05;
  literals `0x10be0dc` 40.0 / `0x10be0e0` 1300.0), `0x78410(e, tune vec 12 .z deg, P+0x40, P+0x1d0, 2, 0, 0, 0)`, `0x78acc`, `0x7bd18`;
  7 frame >= 72 (`0x10be2c0`) -> 8: the flight `0x7a820` until `0x78b78(e, 0, tune 1 deg)` (the landing wait, rom-map trap row
  `0x78b78`) -> 9 L2 M14 b4: P+0x1d0 = Neset's position, P+0x30 = the same front point, `0x78410(e, 0xf8e4, P+0x30, P+0x1d0, 2, 0x8000,
  2, 0)` (facing 0x8000 off the Neset: his own facing), P+0x10 / +0x18 = (P+0x30 - P+0x40) / 20 (`0x10be0a0..0x10be0cc`), per frame
  `0x78600(e, 0x8000, 0)`, `0x7b53c`, the overshoot test snapping to P+0x30; crossing 150 snaps too; **crossing 230: id 0x406 = 1030 =
  u 420** (`0x10be1c4..0x10be20c`, vt+0x1d0 of [e+0xb640], handle dropped); **crossing 240: G+0xca**; at its end `0xbee74(e, 0, 0)`
  (**alpha 0 at once**) and request (1, 0x10) (`0x10be27c`).
* **(1, 0x10)** -> `0x10bd4d0`: every frame P+0x918 / P+0x528 = 1; phase 0 L2 M28 (0x21c) via `0xafef0`, its frame set to its END
  (`0xb0934` -> e+0x4fc / +0x500), **e+0xc bit 10 cleared, `0xbee74(e, 0, 0)` (not drawn)**; phase 1 wait G+0xcb -> G+0x32 3 / 5 ->
  (1, 0x11), 6 -> (1, 0x12). Its start arm (vt+0x204 `0x10b5944`): G+0x31 == 2 -> e+0xd473 = 1; stops u 120 / u 130 (e+0xd4ac /
  +0xd4b0, `0x329c40(h, 0)`); `0xba7b8`; then `0x10b5db0..0x10b5e18`: `0xbd3d8(e, 500)`, `0xbd0c8(e, 0)`, P+0x59c = 0, **G+0xca = 1**.
  **He is not attached to the Neset and not moved while inside**: no write of P+0x40 in the body or the arm.
* **(1, 6)** -> `0x10bd330`: L2 M28 b4; at its end alpha 0 and request (1, 0x10) -- the climb back in. Its start drops the carried
  object (`0x10b5298`). Issued by g0 s14 case 2 after (2, 0xb) / (2, 0xc).
* **(1, 0x11)** -> `0x10bd624`: L0 M7 (0x7) b0, sound 0x2260; at its end back to the AI (`0x6d53c`). Its start arm `0x10b5b88`: e+0xc
  |= 0x400, **`0xbee74(e, 1.0, 0)` (drawn at once)**, P+0x380 = tune 0x13 (G+0x32 3) or -1.0 (5), `0x10b3e7c`, G+0x31 == 2 -> e+0xd473
  = 9, `0xbcae0(e, 1)`, **P+0x40 = P+0x0 = Neset's P+0x40, P+0x50..0x58 = Neset's P+0x50..0x58** (`0x10b5e6c..0x10b5ed4`).
* **(1, 0x12)** -> `0x10bd6c0`: L0 M1 (0x1) b0 (literal `0x10bdb3c`), sound 0x2261, P+0x1bc = 30; after 30 frames the pull of object 1
  (`0x10bd7c0..0x10bd988`, shell57 b3 from his joint 0x82); no further setMotion. Placed by Neset's `0x10a7bac(e, 1)` -> `0x10ae878`
  -> **`0x10bc254`**: Ka's P+0x40 / P+0x0 / P+0x50 = Neset's. Drawn again by his vt+0x1dc (`0x10b3884..0x10b38c8`): e+0xd48f == 0 and
  G+0x33 != 0 -> e+0xc |= 0x400, `0xbee74(e, 1.0, 0)`.
* The approach before (1, 0x20) / (1, 6): (2, 0xb) / (2, 0x12) -> `0x10c0848(e, 1 / 2)`, (2, 0xc) / (2, 0x11) -> `0x10c04dc(e, 1 /
  2)` (status-2 table `0x10be300`): TURNS toward Neset's position (r 1) or Neset + R(yaw) x vector (r 2: `0x2132dd0` = (0, 0, 2800)
  for (2, 0x11), from the static initialisers -- `initdump.py`; (2, 0x12)'s `0x21329d0` read (1, 0, 0), I: not checked further).
  `0x10c0848` is the angle-picked turn `0x7a284` (-> `0x794f0`), `0x10c04dc` L0 M5 + `0x78b78`: no walk. **His distance from the Neset
  before the M13 jump is the AI's, not in the ROM -- the viewer's choice: he stands at the jump's target.**

### 2.1 The jump, the arrival and the M14 turn (READ 2026-10-26)

* **`0x78410(e, cap, from, to, mode, offset, flags, thr)` with s0 / s1** -- a TURN, not a launch: the heading from `from` to `to`
  (`0x13ecba8` atan2) + offset - his yaw, capped, stored as a rate P+0x5e78 = angle / (s1 - s0) over the motion window P+0x5e70 = s0,
  P+0x5e74 = s1; the direction byte P+0x5e66 from the sign, or forced by the flags (flags 2: 1, `0x785dc..0x785ec`). Applied each
  frame by `0x78600` -> `0x77d28`: direction 0 yaw += step, 1 yaw -= step (`0x77f84..0x77f9c`); `0x77d28` also keeps a travel
  accumulator (P+0x5e6c of |P+0x320|) gating part of its arms -- not transcribed.
* **Phase 6 (M13)**: `0x78410(e, 45 deg, P+0x40, target, 2, 0, 0, 0)` with tune vec 12 = (10, 20, 45) (em088_00_actiontune.fup: 42
  floats, 20 vec3) -- the turn toward the jump target over M13 frames 10..20, at most 45 degrees; `0x78acc(e, 0, 0, -500.0)`: the
  move-to-target controller (P+0x5e98 state 0, P+0x5e9c flags, P+0x5ea0 travel 0) and `0x79274`: **P+0x1f0 = |target - P+0x40|
  (horizontal, flags bit 0x20 clear) - 500 x size, floored at 0** -- the distance his move covers (its consumer, the motion's travel
  warp, NOT READ); `0x7bd18` zeroes the velocity and acceleration.
* **`0x78b78` -- the arrival** (READ): state P+0x5e98 1 -> done; else P+0x5ea0 += |P+0x320| (the unit's motion this frame), and once
  it exceeds 150.0 (`0x78d18`) and the target (P+0x1d0) is behind him along his motion (`0x78d24`'s direction . (target - pos) < 0)
  within 150 (squared 22500, `0x78d20`; horizontal unless P+0x334 bit 0x20) -> P+0x5e98 = 1, P+0x334 bit 3 cleared. Phase 8 ends there.
  So **M13's flight is as long as his travel to the target takes -- set by his start distance, the AI's**. From the viewer's place
  (the target itself) P+0x1f0 is 0: no steering and no flight distance; M13 is shown as its _start.
* **Phase 9 (M14)**: `0x78410(e, 0xf8e4, P+0x30, Neset's P+0x40, 2, 0x8000, 2, 0)` with s0 = 18.0, s1 = 48.0 (`0x10be06c` / `0x10be02c`
  -> `0x10be2bc`): **he turns 180 degrees clockwise over M14 frames 18..48** (heading to the Neset + 0x8000 - his yaw = 0x8000; flags 2
  -> direction 1), at 0x8000 / 30 a frame. Shown on KA (`ka.turn`: index.html stepTurn adds it to his unit turn on the `reference` node, about where he stands); the Neset stays put. (The first build, 2026-10-26, swung the Neset about Ka instead -- Raven's report 2026-10-27: "Neset spins around ... it is Athal-Ka who likely spins around"; corrected.)

### 2.2 The move distance, the turn gate, the M13 / M14 timing (READ 2026-10-26, second pass)

* **Who uses P+0x1f0** (`<archive>/ahtalduo` scan of every `#0x1f0` access in 0x60000..0xd0000: `0x78f20..0x79030` and `0x79274..0x79398`
  only, besides the setter): **`0x78ec0`, the tail of `0x78b78`**. Each call it subtracts his motion this frame projected on the
  direction to the target (`0x78d24` . P+0x320) from P+0x1f0; while what is left (less the offset term) is above 0 it STEERS him --
  his yaw P+0x54 (and P+0x50 by flag) turned toward the target by `0xc0dbc(e, heading, current, step r2)` (`0x79150..0x79254`); at or
  below 0 (flag 0x80 clear) P+0x1f0 = 0 and it returns 1 -- the value `0x78b78` returns. So **the clip's own travel is NOT scaled**: it
  is steered while a distance remains, and the jump phase ends when the distance is used up. With P+0x1f0 = 0 from the start (the
  shown place) the first call returns 1: **phase 8 ends on its first update -- M13 plays to frame 73, then M14**. (The arrival bit
  P+0x5e98 of §2.1 is a separate state inside the same call.)
* **M13's own travel** (measured on its `reference` track, `combined_probe.mjs --travel`): none to f28, then back along -z to 457.1
  game units at f73 (459.4 by f76). **Phase 9** then moves him back by code: P+0x10 / +0x18 = (P+0x30 - P+0x40) / 20 (`0x10be0a0..
  0x10be0cc`), integrated by `0x7b53c`, snapped at the overshoot / f150 -- **20 frames back to the target**. Shown on KA (`ka.slide`: index.html stepWorldPartner offsets his bones' frame mountFrame), the Neset unmoved.
* **The turn step's gate** (`0x77d28`) -- CLOSED (third pass). **P+0x320's writer**: `0xa5fc8` (`0xa61b0..0xa61c4`), run in the
  +0x24 pass after the action main (`0xada80`: `0xadbc4` main, `0xae10c` this), writes P+0x320 = P+0x40 - P+0x0, and `0xa50dc`, first
  in the same pass, saves P+0x0 = P+0x40 (`0xa5184..0xa5198`): **the whole displacement of the update, code and clip alike** (the
  other writers: `0x79404` zeroes it, `0xcc890` adds a push-out). So phase 9's slide counts: 22.86 a frame, read by the next update's
  turn step -- the gate (P+0x5e6c, zeroed by the M14 `0x78410` at `0x78544`) passes 150 at M14's 8th update. **The arm it opens is a
  STOP test, not a re-aim** (`0x77de8..0x77ec8`): the facing (yaw + r3 0) dotted with (P+0x1d0 - pos) -- the target behind him (or
  flag 8) -- then by the mode P+0x5e64: mode 1 stops at once, mode 2 (Ka's M14: 2) stops only within 150 of the target (22500, or
  300 / 90000 with flag 0x10; `0x78288` / `0x7828c`), else the window arm `0x780b8`. His target here is the Neset's position, 1300 off:
  the stop never trips and the window turn runs to its end. **Nothing to change**: the built turn (180 degrees clockwise over M14 f18..48)
  stands.
* **The phase-6 turn** toward the target over M13 f10..20: with the target under him its heading is atan2(0, 0) -- an artifact of the
  shown place, not shown.
* **The quest spawner's boss order: NOT FOUND (two passes).** cQuestData registers mEmType_1 at +0x64 and mEmType_2 at +0x72
  (`0x371a94` / `0x371fa8`, 0xe apart). Pass 1 (`qscan.py`, `qscan2.py`): no reader indexed that way. Pass 2, the COPY (`qcopy.py`): no
  memcpy (`0x13ecc08`) with a source at +0x64 / +0x72 or a length of one / two / five records (0xe / 0x1c / 0x46); the ldm / vld block
  loads off an `add rX, rY, #0x64` (15 sites) are other structs (`0x16617c` a 0x2c-stride loop of 7, `0x91d7ac` a 64-byte block at
  [+0x1c0]+0x64 in the render band, the rest 16-byte or shorter). No positive control (the block copy that must exist was not found
  by either form), so the negative proves nothing: the spawner may read the file's packed record, a per-boss struct, or the em set
  resources (mBossSetRes_1..5). **"Ka updates first" stays INFERRED** on that one step (§1.1).

## 3. Ahtal-Neset's actions (R)

Status-1 table `0x10af6e0` (rom-map row), action starts vt+0x204 `0x10a6e58`.

* **(1, 2) / (1, 0xf) / (1, 0x10)** -> `0x10b1320(e, 2 / 0 / 1)`: P+0x918 / P+0x528 = 1, e+0x1408 |= 0x8000; phase 0: r 1 -> L3 M16
  (0x310) b0 and **`0xbee74(e, 0, 0)`** (not drawn); else L3 M12 (0x30c) b0; the frame set to the motion's END (`0xb0934`); cdba 0,
  cdbb 1. Phase 1: r 2 waits G+0xcc -> (1, 0x14); r 0 waits G+0xca -> (1, 8). (1, 2) is his spawn action (`0x10a4af4`).
* **(1, 0x14)** -> `0x10afebc`: phase 0 L0 M9 b0 from 0 (`0xafef0`), `0xbf700(e, 0)` (P+0x5c = 0), six nodes `0x10ad6a0(e, 100..103 /
  3 / 4, 1)`, e+0xd4cc = 0, e+0xd4d0 = 1/60, e+0xd490 = 1 (the nodes survive the next action start: vt+0x204 `0x10a6fb4`). Phase 1
  every frame: P+0x5c += tune 0x2a (4.0) x dt to tune 0x29 (300.0; `tune087.py`); frame >= 230 (mode 1, `0x10b0274`) -> rate 0 and
  frame = 230.0; else frame >= 226 (`0x10b027c`) -> P+0x398 -= 0.25 dt, floor 0.1 (`0x10b0280`); frame >= 170 (`0x10b0284`) ->
  e+0xd4cc += e+0xd4d0 x dt (cap 1.0) and node i's angles = table i x e+0xd4cc. When both are done: phase 2, **G+0xcd**. Phase 2:
  P+0x5c held at 300; waits G+0xca -> (1, 0x15). `timeline.py`: **254 updates from phase 1 to G+0xcd** (226 at rate 1, 0.75 / 0.5 /
  0.25 one each, 25 at 0.1; the update order -- main reads, then the layer advances -- I).
* **(1, 0x15)** -> `0x10b029c`: L0 M9 b0 FROM 230.0 at rate 0.6 (`0x10b06d4` / `0x10b06e4` / `0x10b06e8`), e+0xd4cc = 0, P+0x5c =
  300, sound 0x21fe, P+0x1bc = tune 0x35 (0), +0x1c0 = 1200. Phase 1: `0xb0968(e, 2, 0, 260.0)` is mode 2 = **frame < 260** (read
  `0x72984` / `0x72b30`: r0 = 1 while frame < f0), so **rate 1.0 from 260**; P+0x5c -= tune 0x2b (3.0) x dt to 0; frame >= 170: node
  angles = table x (1 - e+0xd4cc) (ramp 0 -> 1 over 60 frames: the turns go back out); the lifts B6 k 0 then k 1 after tune 0x36 (40).
  vt+0x204 (1, 0x15): G+0x32 = 2.
* **(1, 8)** -> `0x10afc44`: L0 M9 b0 from 0 at rate 0.0 (`0xb07b4`), sound 0x21fe, +0x1c0 = 1200; phase 1: B6(e, 1) on the first
  move, then rate 0 until e+0xccec..+0xccf4 leave states 1 / 2 (`0x4307c0`) or 1200, then rate 1.0, `0x10aa368(e, 1)`; frame 300
  (`0x10afeac`) a cdba write. vt+0x204 (1, 8): G+0x32 = 4 and the second phase's part setup (`0x10a7638..`).
* **(10, 0x8e)** -> `0x10b11a0` -> `0x10b16d0(e, e+0xd4c8)`: L3 M12 (d4c8 0) or L3 M16 (1), b10 (`0x10b1720`), at the end (1, 0xf)
  / (1, 0x10) (`0x10b1774`). vt+0x204 (10, 0x8e): G+0x32 2 -> `0x10a7bac(e, 0)` (P+0x380 0.05, drops B2 k 0 / 1), 4 -> 6 ->
  `0x10a7bac(e, 1)` (G+0xcb = 2, G+0x33 = 1, e+0xd4c8 = 1, Ka placed on him `0x10bc254`, no shells).

### 3.1 The node turns (R; values R (emulated))

`0x10ad6a0(e, id, 1)` makes a 0x30-byte node (vtable at `0x10ad6d4`): +4 the kind (1), +8 the joint id, +0x10..+0x18 three angles in
DEGREES (initial: the GOT vector `0x19176b0` = 0, `initdump.py`), kept in the list e+0xd504 (count e+0xd4f8; `0x10ad7e8(e, id)` finds
one). His vt+0x2a0 `0x10a6668` -> `0x10a6d58` (after the pose; the slot Seltas's wing pass occupies) takes every kind-1 node: M =
vt+0xd8 `0x539e60` (the joint's local rotation and translation), turned by Y (`0x23220c`), then X (`0x232118`), then Z (`0x2322fc`),
each the standard right-handed turn of its axis (rows read: Y row0' = c row0 - s row2, row2' = s row0 + c row2; X row1' = c row1 + s
row2; Z row0' = c row0 + s row1), u16(0.5 + deg x 182.044), and written back by `0x7237c` (+0x60 rotation, +0x80 translation). In
three.js: q' = q . qY . qX . qZ. The six (joint, degrees x, y, z), from `0x16a33e4` (ids, rodata) and `0x2132bf0` (angles, written by
the static initialisers -- `initdump.py` runs init_array; control: G's spots `0x21328b0` read (1800, -90, 1600) / (-2100, -90, 1900) /
(3300, -90, 3800) as rom-map's row): 100 (-34, 18.05, -20); 101 (15, -17.5, -2); 102 (27.5, -4.2, -3); 103 (4, -7, -5.7); 3 (27.5,
-14, 0); 4 (15.6, 0, 0).

### 3.2 The drawn lift P+0x5c (R)

`0xbf700` sets P+0x5c and P+0x1b9 = 1; `0xbf71c` adds s0 x [e+0x1c]. `0xa5db8` draws the body e+0x1384 += P+0x5c x the size
(`0xbec34`); with P+0x1b9 clear it decays (rom-map row `0xa5db8`). Neset's body is drawn 0 -> 300 higher through (1, 0x14) and back to
0 through (1, 0x15).

## 4. What the viewer shows (built)

`ROM_PARTNER_BODY.em088_00` (render/monster.js): partner em087_00, `place: 'world'` -- the first world-placed partner. index.html
puts him in Ka's world group (Ka's unit as the pass began), at the entry's `place` (Ka-local game units, relative yaw), at his own
size, his body raised by `lift` (P+0x5c), his node turns weighted by `nodes`, and either model's meshes hidden over `hide` (the ROM's
alpha 0; the roots stay so the effect runtimes run). His raw list entry and Ka's raw lists are unchanged (the partner is mounted only on
the combined list). The combined list: **"Combined (with Ahtal-Neset)"**, id `neset`, four entries (labels for Raven, section 8):

| entry | frames | Ka (body) | Neset (his side) | placement |
|---|---|---|---|---|
| Ahtal-Ka raises Ahtal-Neset and enters it | 1430 | L0 M4 (+ its last frame once: the 0x769f4 hand-off), L2 M25, M26 x3 (99), M27, M47 (_start + 246 of _loop), M48, M13 to f73, M14, L2 M28 held at its end (hidden 1112..) | L3 M12 held at its end to 462; L0 M9 0 -> 230 (254 frames: 226 + the slowdown); held at 230 to 1087; from 230 at 0.6 (50) then 1.0 (293) | Ka facing the Neset, Neset 1300.6 ahead; M13 carries Ka 457.1 back (its own travel); M14 f0..20 (847..867) the code slides KA back to the target; M14 f18..48 (865..895) KA turns 180 degrees clockwise, ending with the Neset straight behind him. The Neset never moves or turns for Ka's motion (checked: his root bone (-1673, -182, 3072) the same through 800..930) |
| Neset falls, Ahtal-Ka comes out | 547 | L2 M28 held (hidden 0..306), L0 M7 | L3 M12 whole, then held at its end | Ka on Neset's position and facing |
| Ahtal-Ka re-enters, Neset rises again | 965 | L2 M28 (1, 6), then held (hidden 301..) | L3 M12 held 301; L0 M9 held at 0 for the lift wait (111); L0 M9 whole | as the raise's first placement |
| Neset destroyed, Ahtal-Ka comes out | 311 | L2 M28 held 1 frame (hidden), L0 M1 loop | L3 M16 whole, then held (hidden 251..) | Ka on Neset's position and facing |

Viewer choice, named: **Ka's distance from the Neset before the M13 jump** -- the AI's (§2: the approach only turns him); he is shown
at the jump's target, facing the Neset. From there the ROM's move distance is 0 (P+0x1f0 = distance - 500 x size, floored, §2.1), so
the M13 jump phase ends on its first update (M13 to f73, §2.2); from any other start it lasts until his steered travel has used up
P+0x1f0 (`0x78b78` -> `0x78ec0`).
Read and shown as the ROM moves it: the M14 turn (180 degrees clockwise over frames 18..48, §2.1); the hand-offs (§1.1: Ka first,
the request kinds); **the (1, 8) wait, 111 frames** -- the lift's delay +0x4c 60.0 (B6) and behaviour 6's t += 1 / float 0 with float 0
= 50.0 (em088_00_shell57 mode 25), 110 moves in states 1 / 2 (`0x4307c0`), made on the first phase-1 update; that the shell moves after
the enemies in a frame is I (±1). Not shown: the clip's own M13 travel is not warped to 0 (the warp's consumer of P+0x1f0 is NR).

## 5. The effects of the combined entries

* **Ahtal-Ka u 400..410** (render/class-threads.js `em088Neset`, read off `0x10b9944..0x10b9f18`; table `0x10b9984` on motion - 0x20d):
  L2 M26 by P+0x1bc (the viewer: frames since the M26 piece began) >= 15 / 45 / 75: slots 0 / 1 / 2, ids 1019 / 1020 / 1021 = u 402 /
  401 / 400, joint 149 -> Neset joint 16 / 12 / 3 (end kind 7 = 0x1007 / 0xc07 / 0x307), hard; L2 M27 the three whole; L2 M47 frame <
  40 the three, from 40 (`0xb09a4` mode 1, `0x10ba03c`) slot 3 u 403 149 -> his joint 5 and slots 4 / 5 / 6 u 404 / 405 / 406 joint 5
  -> Neset 3 / 12 / 16; L2 M48 slots 0 / 1 / 2 u 409 / 408 / 407 -> Neset 16 / 12 / 3, stop flag 0 (graceful); L2 M13 frame >= 50 slot 7
  u 410 -> end kind 8: Neset joint 0 + (0, 200, 700) through its rows. They follow the object rows in the same pass, so they own slots
  0..7 there. The end points: schedule.js `{ neset }` -- his joint's world matrix in the game's convention (threadInput
  nesetJointOf: the bone's matrixWorld, translation / 0.01, as live.js writeJoints). Exported `when: 'thread'` (UNIQUE 48..58, all
  em088_00_003_s; `export_neset_threads.py`). Where Ka is viewed alone the rows stay OFF, named as before.
* **u 420** (UNIQUE 59, em088_00_014): `ACTION_EFFECTS.em088_00` L2 M14 crossing 230 under (1, 0x21). Each combined piece names its
  action (`act`), which playNow takes (`seqActNow`) -- so (1, 0x21)'s rows and u 420 fire on the combined list only.
* **Ahtal-Neset u 150** (his thread pass `0x10a8438`, joints 0x82 / 0x83 -> the lifted objects): runs on his partner effect runtime
  wherever his lifts run (the class-threads.js em087_00 entry, another lane's). The lifts themselves (shells.js act087 (1, 0x15) /
  (1, 8)) are keyed on L0 M9's CLIP frames 1 / 41 -- the ROM's are ACTION frames: under the combined (1, 0x15) piece L0 M9 starts at
  230, so its lift rows never cross; under (1, 8) they cross only after the wait. Each piece of his names its action (`act`), and his
  shells' pick (index.html partnerRockInput) takes that action's rows or none -- so his (1, 0x14) rise makes no lift (on the raw clip
  the pick rotates (1, 0x15) / (1, 8) and the rise played as (1, 0x15) lifted at once). **Open for the shells lane**: an action-clock
  event for the two lift rows (rom-map trap 162). (Measured anyway: section 6.)
* **Ahtal-Neset u 500..605** do NOT belong to the combined actions: `G+0xce` (the mask his vt+0x1dc loop `0x10a53b8` tests) is written
  only by `0x10a9db4` (vt+0x30c, `0x10a9e80` / `0x10a9f50` / `0x10a9fc8` -> `0x10aeb60`; xref, control as section 1), a loop over his
  seven part counters e+0xcd36 + 2k against e+0xcd44 + 2k (written from the part damage `0x99c78`, `0x10aa0ec`), gated by the reaction
  locks P+0x3a2..+0x3a4 and status 10: **his parts giving out under hunter damage** -- no combined action writes it.
* Both runtimes' PSL records play as on the raw clips (the partner runtime walks his clip and frame, partnerFxClip; rates and holds
  carried in its layout).

## 6. Measured (headless Edge, `combined_probe.mjs --url http://localhost:5713 --only <entry>`, meter every 3rd frame)

Each entry in its own run (the meter reset per run; a record still running from a previous entry would count as a start):

| entry | records started | drew | lit on camera | off camera (lit when the meter aims at them) |
|---|---|---|---|---|
| raises and enters (re-metered 2026-10-27 after the turn moved onto Ka: 1430 frames; u 410 lit 8/10, u 420 15/15) | 45 | 45 | 41 | Neset c 2, c 3, c 15, c 31 (the default camera; Neset now stays in front of Ka; his lifts on the shells lane's action clock) |
| Neset falls | 11 | 11 | 10 | Neset c 110 |
| re-enters | 25 | 25 | 22 | Neset c 15, c 31, u 150 (thread) |
| Neset destroyed | 18 | 18 | 15 | Neset c 14, c 17, c 301 |

The (1, 0x21) rows: u 400 / 401 / 402 one start each, 43 / 53 / 63 draw frames, lit 43/44, 52/54, 63/64; u 403..406 one start, 92
draw frames, lit 92/93; u 407..409 one start, 20 draw frames, lit 20/21 (graceful stop); u 410 one start, 35 frames, lit 35/36; u 420
one start, 15 frames, lit 15/15. Thread slot frames on the raise: u 402 186 (= M26 from timer 15: 84, M27 63, M47 to f39 39), u 401
156, u 400 126, u 403..406 272 (M47 f40 to M48), u 407..409 57 (M48), u 410 100 (M13 f50..149). No page error (the `?scene=none`
message is the harness's URL). The off-camera rows are Neset's, at his far joints / G's arena spots (u 150 ends on the lifted object,
whose spot is G's absolute arena point, not placed relative to the Neset in the viewer).

## 7. Not read / open

* That the quest spawner creates its bosses in slot order (the update order rests on it, §1.1); the shells' line after the enemies'.
* The consumer of P+0x1f0 (the motion's travel warp) and `0x77d28`'s travel gate (P+0x5e6c).
* Ka's position before (1, 0x20) / (1, 6): the AI's (a viewer choice, §4).
* `0x10a5610(e, 2)` (every frame of Neset's (1, 0x14) / (1, 0x15) / (1, 8)), `0x10ad404` (the kind-2 node pass), P+0x918 / P+0x528.
* The (1, 0x15) / (1, 8) lift rows on action time (shells lane). -> **Done 2026-10-26 (shells lane)**: rows `{ act: N }` on the shells' action clock (frames from the action's start: a fresh motion, or a
  piece naming another action on the same clip). Metered: the raise entry's (1, 0x15) piece makes k 0 at f1166 and k 1 at f1206 (L0 M9
  @231 / @255); the re-entry's (1, 8) piece makes k 1 at f306, inside the 112-frame hold (it used to come after it); both draw (u 320,
  u 70). His own L0 M9 entry is as before. dev/shells-neset-lift-check.mjs; rom-map "THE ACTION CLOCK". **Re-checked against the 111 wait (2026-10-26)**: the clock counts the action's updates (made on update 1); the (1, 8) lift is out of
  states 1 / 2 on update 111 -- on the page the partner runtime shows the (1, 8) piece from entry f302, the lift made f303, out at f413, the
  frame his L0 M9 leaves 0. The (1, 0x15) lifts: f1165 / f1205 (updates 1 / 41). His own entry's lifts now come one update earlier (clip
  f2 / f41), the ROM's update 1. One frame to check on this side: the partner runtime takes the (1, 8) piece at f302, the table above says
  301 (<archive>\gapT\probe2.out: L3 M12 through f301).
* (2, 0x12)'s target vector `0x21329d0` (read (1, 0, 0) after the static initialisers; whether something writes it later: NR).

## 8. Labels for Raven

New list: **Combined (with Ahtal-Neset)**. New entries: **Ahtal-Ka raises Ahtal-Neset and enters it**, **Neset falls, Ahtal-Ka comes
out**, **Ahtal-Ka re-enters, Neset rises again**, **Neset destroyed, Ahtal-Ka comes out**. All working names.
