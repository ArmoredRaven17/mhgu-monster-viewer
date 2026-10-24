
## 10. The charge gauge, the auras, the discharge, (1, 0x15), e+0x7420, the back -- R (second pass, 2026-10-17)

The coordinator: "An open read on a walked monster stops the walk there, so close Zinogre's / Thunderlord's". Scratch
`hook204.py` (rewritten), `trace.py`.

### 10.1 The start hook, emulated again -- now agreeing with the read

vt+0x204 `0xeecd58` is called **(e, status, number)**: the new action is in r1 / r2 (`0xeecd68` / `0xeecd6c`), not read
from e+0x73e0. The first `hook204.py` left r1 / r2 at 0, never entered the status switch, and saw only the gauge-empty
discharge -- that was the "variant 0 only, only charged" disagreement of 8: an instrument fault, not the note's. Rewritten
(r1 / r2 set, ctl+0 the gauge, P+0x5df3 / P+0x518 / the rank chain native, writes and vt+0x1d0 ids logged), every case
agrees with states-em057_00.md 5.2 / 5.3 except one (10.2): (1, 4) -> charge on, gauge 100; (1, 5) -> discharge, u 90,
whatever the flag; status 11 charged -> `e+0xcb14 = 1`, discharge; (1, 3) +50 / (1, 9) +25 / (2, 0x26..0x2a) +20; the gauge
<= 0 at an action start while charged -> discharge.

### 10.2 The gauge -- R

`ctl+0` = `[e+0xcac0]+0` (s16, 0..100). Income at the action start: (1, 3) +50 (`0xeed208`), (1, 9) the rage roar +25
(`0xeed3d8`), (2, 0x26 / 0x27 / 0x29 / 0x2a) +20 capped 99 (`0xeeceec`), (2, 0x28) +20 (`0xeed128`); the charge-up `0xeec02c`
sets 100. No per-frame fill or drain (scan of every `strh` to `[ctl]` in the band: `0xeeb9a8` reset, `0xeecae4`, `0xeecba4`
the discharge, the hook's five, `0xeefff0` the op-0x6f callback, `0xeedfe8` the attack cost). Depletion, charged only, at the
action start:
* the action's cost `sb` (`0xeed5dc..0xeed62c`): the hunter-hit reactions (1, 0x1c..0x1e) by part {-30, -15, -50, -30, -30,
  -30, -30}, (1, 6 / 0xf / 0x10 / 0x1f..0x21) {-30, 0, 0, -30, -30}, the pit (10, 0x60 / 0x63 / 0x65 / 0x66) -30, the sever
  (10, 0x72) -30, (10, 0xa7) -50, (10, 0xaf) -50;
* status 7 (attacks) `0xeedaf0(e, n)`: table `0xeedb3c` (n <= 0xf8) -> -1 / -3 / -5 / -3 by number group, at rank >= 2
  0 / -1 / -2 / -1 (`0xeedf4c..0xeedf7c`), clamped to [1, 100] (`0xeee010`): **attacks never empty it**;
* **WITHDRAWN (the note's "Thunderlord at G while enraged pays nothing"): it is the reverse.** `0xeed5ec..0xeed61c`: variant
  4 at rank >= 5 -> `isEnraged == 1` ? pay : skip; `0xeedfa8..0xeedfd0` the same for attacks. At G Thunderlord pays only
  WHILE ENRAGED; calm, his gauge never drops.
* No time-out: nothing decrements the gauge per frame (the scan above), so a charge ends only by depletion, (1, 5), death or
  a slam. **What can only come from hunter hits: every negative `sb` above** (and the catch, 10.5).

### 10.3 The auras -- R (`0xeed68c..0xeedaa0`, every action start, one handle of cb08 / cb0c / cb10 at a time)

| variant | state | request (vt+0x1d0 id -> u key) |
|---|---|---|
| 0 | uncharged, tier 0 / 1 (gauge < 50; selector 1 `0xeefec8`: < 25 / < 50 / < 75 / else) | none, all stopped |
| 0 | uncharged, tier 2 / 3 | 1001 -> u 30 / 1002 -> u 31 (byte-identical records) -- NO rage test |
| 0 | charged, calm | 1003 -> u 32, except on the (1, 4) start itself (`0xeed78c..0xeed7a0`) |
| 0 | charged, enraged | none |
| 4 | uncharged, calm | **1006 -> u 42** (`0xeed948..0xeed9c8`; his pel only) -- no gauge tier |
| 4 | charged, calm | 1007 -> u 32 (`0xeeda78..`) |
| 4 | enraged | none |

Viewer (motion-states.js CHARGE_EFFECTS em057_00 / em057_04, new driver fields `calm` / `alive` / `leave`): Zinogre's Normal
= tier 0 / 1, **Charging = tier 2 / 3 (u 30 holds; u 31 is the same record)**, Fully Charged = P+0x5df3 (u 32, calm).
Thunderlord's Charged = flag 0 (u 42, calm), Overcharged = flag 1 (u 32, calm). Zinogre's L0 M24 row no longer holds u 32
(the ROM does not request it on the (1, 4) start).

### 10.4 The discharge -- R

`0xeecb28`: `0xac030` unless status 11; P+0x5df3 = 0; gauge 40 at rank 4, else 0; ctl+8 = 1; rage cleared (`0xba7b8`) or its
request (`0x7fb68(e, 4)`); then `0xeecc2c`: hit tables 0..5 back (`0xbaacc`), **id 1004 (u 120) at status 11 and variant 0,
else id 1005 (u 90)**, the three auras stopped. `0xeecc2c` also runs alone at a status-11 start while uncharged with tier >= 1
(`0xeed0e4..0xeed104`).

| entry | ROM | viewer |
|---|---|---|
| (1, 5) start (`0xeed3cc`) | u 90 | L0 M25 row `start` (both). Who issues (1, 5): no stream, no class site (scan) -- NR |
| gauge <= 0 at an action start (`0xeed658`) | u 90 | dropping OFF the charged rung (`leave`) |
| status-11 start, charged (`0xeed0bc`) | Zinogre u 120, Thunderlord u 90 | death rows `startAt` the charged rung |
| status-11 start, uncharged tier >= 1 (`0xeed104`) | Zinogre u 120 (Thunderlord u 90) | Zinogre's Charging rung; Thunderlord: no rung shows his tier -- not fired |
| (7, 0xe3) L9 M1 f266 (actiontune float 0x27, `0xefb04c`) | u 90 | psl-mask.js ACTION_EFFECTS em057_04 |
| (7, 0xdb) L9 M5 f204 (float 0x3d, `0xefb814`; L9 M4 -> M5 at f166) | u 90 | ACTION_EFFECTS em057_04 |

(7, 0xe5) never reaches its slam: with r5 0 its phase 1 ends the action at L9 M4's end (`0xefb958` -> vt+0x3dc). The floats
are `em057_04_actiontune.fup` (FUP, 25 ints, 68 floats); Zinogre's arc has no action_tune, and list 9 is Thunderlord's alone.

### 10.5 u 280 and (1, 0x15) -- R

* **u 280** (id 1009): body `0xefb210` phase 1, `r5 == 1` -> at L9 M2 f25 (`0xb0974`, 25.0) vt+0x1d0(1009). (7, 0xd9) / (7,
  0xda) play L9 M2 with r5 1 and follow (7, 0xdb) at its end; (7, 0xe4) / (7, 0xf1) with r5 0 (no request) and follow (7,
  0xe5). Wired: ACTION_EFFECTS em057_04 '9|Motion[2]', CLIP_ACTIONS [(7, 0xd9), (7, 0xe4)].
* **(1, 0x15) IS issued -- the earlier "nothing issues it" is WITHDRAWN.** A 30-instruction scan of every change-family call
  (control: it finds the (1, 4) sites `0xef0d38` / `0xef1408` / `0xef3270` the note names, and (1, 0x2d)'s follow
  `0xef1e3c`) finds `0xeff114`: em057_00CatchMove (status 9, `0xefefec`), number 1, plays L2 M36 and at its end follows
  (1, 0x15) (number 2 follows (1, 0x14), L0 M20 from f70). Status 8 (PreCatchMove, L2 M34 -> L0 M13) is followed into at
  `0xef74a0` once `0xc7470(e, 0)` returns a target (not read through: I, a caught hunter); the status-9 numbers have no
  immediate issuer in the band -- NR. **So (1, 0x15) only follows a catch.** CLIP_ACTIONS L0 M24 gets it as a third play
  (18-20 for both variants). The EMC: `00 01 15` / `00 01 05` absent, `00 01 04` found twice (control).

### 10.6 e+0x7420 -- R

Written by `0xb1560` / `0xb15c0` / `0xb1624` (shared): **P+0x1a8 bit 3 clear -> +0x7424 = this machine's id (`0x495d8`) and
+0x7420 = 1**; set -> +0x7420 = (the owner == this machine's id). `0xaf2ac` (base vtable slot `0x172d7d8`) clears it with
+0x7424 = 0xff; `0xad7b8..0xad7d4` (the +0x24 pass, `P+0x1a0 == 0` -> 1: the monster's first update) calls `0xb15c0`. So with
P+0x1a8 bit 3 clear, e+0x7420 = 1 from the first update and the follows of 3 run the same update. What sets P+0x1a8 bit 3: NR
(no `strb ..., [.., #0x1a8]` beside an `orr #8` in the shared code; I: the shared / online form).

### 10.7 The L3 M1 back (the 2 check failures) -- the row is right, the check was short

`userLevel` (motion-states.js) gives the user's level from the parts drawn, and an arm shows max(1, it). The back's ladder
[[7], [7], [8]] makes levels 0 and 1 the same set, so on an intact back its turn is level 1 (no break, no record -- the ROM's
first depletion), and u 1011 shows once the Back row is Broken (set 8, level 2). The check now plays it both ways.
