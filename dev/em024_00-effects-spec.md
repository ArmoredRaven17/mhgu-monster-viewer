# Kushala Daora (em024_00) -- effects spec (Elder Dragon walk, 2026-10-18)

Class `uEm024_00`. No states note existed. Scratch: `<archive>/zg/c024.asm` (the whole band), `pp024.asm`, `hook204b.py`,
`jscheckpd.py` (CHG / SNOW / A18), `states060.py`, `partscr.py`, `scrdump.py`.

## 1. The PSL enable word -- vt+0x13c = `0xdfd19c` -- R, read whole and emulated

`0xdfd19c..0xdfd244`, on every motion: ctl+0x2c == 1 (isEnraged at the last action start, vt+0x204 `0xdef358`) and ctl+0x2d (the
snow maps: e+0x1053 in {3, 14, 20}, `0xdef0c8`) -> bits 18-20; else by the wind aura P+0x1bb through `[0x15928a8]` = {0x38000,
0x38000, 0x38000, 0xe00000}: 0xff -> [0], 0 / 1 -> [level], 2 -> [1] / [2], 3 -> [3] unless ctl+0x18 (then [2]), 4..0xfe nothing.
ctl+0x18 = `0xa1f0c(e, 2)` = P+0x5e08 bit 1, rebuilt at each action start. Emulation over aura 0..4 / 0xff x snow x the flag: **123120
runs x4, 0 mismatches**; control all mismatched.

## 2. The Wind Aura control -- built

P+0x1bb is 0 at reset (`0xdef058`) and moved by the action-start hook's switch (`0xdef314..`: +1, -3, to 0 by action; the horn
break drops it). It is what the word reads, so it is a **Wind Aura** select (motion-states.js `CLASS_CONTROLS.em024_00`, index.html
`paintClassControl`, Levels 0..3) handed to pslMask as `windAura`. The action's own change to the level is not applied (the
control is the level the play starts on); the snow map and P+0x5e08 bit 1 are not held (off, named).

## 3. The states -- R

- Status 10: (10, 7) part 0 -> `0x17b44b0` (L3 M3 -> wait 200 -> L3 M5 -> L3 M7), 1..5 -> L3 M1, 6 / 7 none; (10, 0x72) part 0 ->
  `0x17b44b0`, part 2 -> `0x17b4450` (L3 M15 -> L3 M16); (10, 0x14) parts 3 / 4 and the exhaust (10, 0x1b) -> `0x17b4430` (L3 M3 ->
  L3 M2); sleep (10, 0x1d) L3 M14 -> L3 M55, (10, 0x1e) op 1 -> a record naming 0x30a (L3 M10 held -- I), (10, 0x44) L3 M7 -> L3 M17;
  paralysis L3 M13 held; the stun (every side) L3 M3 -> L3 M5 held -> L3 M7; recoveries L3 M17; no shock-trap case; death L3 M18.
- vt+0x204 on (10, 0x72) (emulated, `hook204b.py`): part 0 -> `0x9d438(e, 0)` (the horns' 0xff row: u 1000) and ctl+0x24 = 1;
  part 2 -> `0xc2274(e, 0, 0, 0x8f)` -- **the tail sever at joint 143**.
- The part pass vt+0x210 `0xdfcc60` (READ whole): set 0; ctl+0x24 ? 7 : 2 (horns); part 5 vs .dtp row 1 -> 8 + 9 : 3 + 4 (wings, u
  1025); P+0x3b4 bit 0 -> 10 : 5 (tail).
- Eyes `0x71398(e, 1, 6, -1)` (`0xdef1d8`): open 1, shut 6. Tired (0, 2) L0 M22; **no drool**: vt+0x1d8 writes e+0xb7d3 = 0
  (`0xdef18c`), the band's only write. Rage: g6 s0 -> (4, 0x11) L2 M18 in the air, else (1, 0x1b) L0 M5.
- CUT_TAIL: descriptor [23] `0x1596340` -> em024_00_tail (word 1 0x7a56), joint 143, no +0x78 row (20).

## 4. The wind barrier -- R, built

vt+0x208 `0xdeffc4` (READ to `0xdf00fc`): while not dying, the handle e+0xcac8 holds id ctl+0x2c == 1 ? (ctl+0x2d ? 1005 : 1007) :
(ctl+0x2d ? 1004 : 1006) -> keys 220 / 240 / 210 / 230 (`[0x169d3b8]`); another key on the handle (+0x1b4) is stopped and the
wanted one requested; at death stopped. With the snow map off: **calm u 230, enraged u 240**, held across every clip --
`CLASS_TIMERS.em024_00.holds`. The old export had u 220 / u 240 as `rage` (both on at once): retagged `event` (format kept), u 230
exported. **The barrier records recorded this time** (the 2026-09-14 infrastructure wall did not reappear: 68 sets, 0 failed).

## 5. Implemented / results

psl-mask.js `em024_00` + CLIP_ACTIONS (L0 M5 / L3 M3 copies); CLIP_VARIANTS; MOTION_STATES.em024_00; CLASS_TIMERS / CLASS_CONTROLS;
tail-option.js CUT_TAIL.em024_00; `--apply` +4, recorded (68 sets).
Check dev/checks/elders.mjs (word, Wind Aura row, the barrier held on L0 M1) pass. Soak **53 motions, 0 refused**.

## 6. The sleep hold, read (2026-10-18)

- (10, 0x1e) is script 0x17b4370: op 1 -> 0x17b42bc, then end (fe). The stepper's op 0 / 1 / 2 arm 0x9f33c stores the
  record at P+0x560 and calls setMotion only for ops 0 / 2 / 0x35 (0x9fea8..0x9febc). The tracer shows no motion call.
- So the hold is the clip (10, 0x1d) leaves running: L3 M55, its last op. The row moved from L3 M10 to L3 M55; the L3 M10
  reading is withdrawn in rom-map.
- The same read for Chameleos ((10, 0x1e) 0x17b5aa0: op 1, end) gives L3 M10, which the row already used: now READ. For
  Teostra ((10, 0x1e) 0x17b7210) it gives L3 M17 (dev/em027_00-effects-spec.md 6).

## 7. The snow barrier (2026-10-18)

On the snow maps (ctl+0x2d set) vt+0x208 holds id 1004 = u 210 calm / 1005 = u 220 enraged (em024_00_100) in place of u 230 / u 240. The viewer's snow input is the Snow Variants list (snowNow); CLASS_TIMERS.em024_00 reads c.snowMap. u 210 exported (UNIQUE #22, event, stop). The routed step calls now carry the same user input as the raw clip's (index.html userIn). dev/checks/elders.mjs: u 210 held on Snow Variants L2 Motion[7], back to u 230 off it.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **P+0x5e08 bit 1 -- the setter READ** (rom-map row "P+0x5e08 (the ailment state byte)"): the hit pass's first ailment
  accumulator (`0x9a290` -> `0xa239c`, data entry +0x34) -- poison: the shared `0xa4518` requests c 1100 on it. While it is set the wind (ctl+0x18) is off. A "Poisoned"
  toggle is what the ROM's test supports (category c, listed; it would also put out Teostra's aura).
* **Poisoned -- BUILT 2026-10-19** (CLASS_TOGGLES `poisoned`, working label): the word reads P+0x5e08 bit 1 (`aura5e08`), and the
  class timer requests c 1100 at once and every 90 frames (0xa4518's arm: P+0x5c5c reset to 90.0).

## 8. Read since, indexed in rom-map (doc audit 2026-10-24)

* **His aura effect** (gapF, READ, NOT BUILT -- the effects lane's): in vt+0x208, `0xdf0514..0xdf0608`. e+0xcac4 holds id 1000 + L
  (L 1..3) -> vt+0x1d0 `0xdfd42c` -> `0x6feb8(e, 2, [0x169d3b8][id - 1000])` = **u 1 / u 0 / u 10**; a wrong key (+0x1b4) is stopped and
  re-requested; any other L stops it. ctl+0x24 -> P+0x5cfc |= 1 (|= 2 with e+0xb5f5 == 1). rom-map row `0xdf0514..0xdf0608`;
  `<archive>\gapF\RESULT.md` a3.5.
* **The pulse clock's writers** (ctl+0x1c): ctor `0xdeeebc`, vt+0x1d8 `0xdef070`, the pulse reset `0xdf08a4`, the add `0x7264c` at
  `0xdf0880`. rom-map row "ctl+0x1c (Kushala's pulse clock) -- writers"; `<archive>\gapF\RESULT.md` a3.6.
* Which sp_01 modes the page never makes: closed 2026-10-20 (all the frame handler's; rom-map row "Kushala's c 29 / 30 / 32..35").
