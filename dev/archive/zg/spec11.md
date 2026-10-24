
## 11. The last named ones (third pass, 2026-10-17)

* **(1, 5) and the catch (9, 1 / 2): no literal issuer anywhere read.** A word-by-word scan of every `b` / `bl` to the
  change family (`0x768c8 / 0x76a40 / 0x7699c / 0x75230 / 0x76098 / 0x754b8 / 0x76088 / 0x76094 / 0x7fba0`) with r1 / r2 from
  the 30 instructions before (`<scratchpad>/zg/issuers.py`): the class band `0xeeb620..0xf0523c` -- 43 calls, control: the
  five (1, 4) sites, (8, 0) at `0xef74a0`, (1, 0x15) at `0xeff114` -- and the shared enemy layer `0x40000..0xc9000` -- 75
  calls, (10, 0x9a), (11, 0x1b) ... -- name no (1, 5) and no status 9; nor does a dynamic census (`follows.py`: every handled
  action, both variants, phases 0..5, frame tests 0 / 1, charged 0 / 1 -- control: it finds (1, 4) from (1, 0x2c / 0x2d),
  (1, 0x15) / (1, 0x14) from (9, 1 / 2)); nor the EMC (`00 01 05`, `00 09 ..` absent; `00 01 04` x2 the control). NAMED
  REFUSAL: both are issued from outside these ranges. **What the catch needs:** its first half (8, 0) is followed into from
  (7, 0x41)'s L2 M33 body (`0xef7448..0xef74a0`) only with `e+0x7420` set, `[P+0x1bc] > 12.0` and `0xc7470(e, 0)` != 0xff --
  `0xc7470` walks the four player slots (`0xc725c(e, slot, 1)` for slots 0..3): **a hunter**. (9, n) then follows from the
  hunter side (NR).
* **The G remap's percentages: READ.** `0x6f62c(e, i)` = actiontune int i (`[e+0x75e4]` vt+0x44 `0x3cb30c`: `ints[i]` if
  i < count, else 0). Thunderlord's `em057_04_actiontune.fup`: int 0x14 = **0**, 0x15 = **30**, 0x17 = **0**, 0x18 = **100**.
  So at G: uncharged -> (7, 0xe7 / 0xe8 / 0xeb / 0xec / 0xef / 0xf0 / 0xf9 / 0xfa / 0xfd / 0xfe) ALWAYS remapped (the default
  100); charged and calm -> NOTHING remapped (ints 0x14 / 0x17 = 0); charged and enraged -> the 0xe7.. / 0xf9.. group
  always (100 / int 0x18 = 100), (7, 0xe9 / 0xea / 0xed / 0xee / 0xf7) 30% (int 0x15) against `[e+0x73e8] % 100` (I: the
  action's random draw). Zinogre's remap (`0xeec220..`) has no percentage: (7, 0xf9 / 0xfa / 0xfd / 0xfe) -> 0xa2 / 0xa3
  always at G. **In the viewer** (CLIP_ACTIONS `onlyIf`, clipActionFor's new `charged`): Zinogre's L2 M1 / M2 lose the
  (7, 0xfb / 0xfc) follows (never at G); Thunderlord keeps them only charged and calm. L2 M43 / M44 keep their own action
  (the only plays of those clips; at G Zinogre never plays them, Thunderlord only charged and calm -- named stand-in). The
  30% draw decides at runtime which of (7, 0xe9) / (7, 0xa0) a charged, enraged Thunderlord plays: each play the next.
* **P+0x1a8 bit 3: READ, per spawn.** Set in the spawn init `0xb8b98` at `0xb99c8`, when `e+0x1405` bit 3 is clear and
  either P+0x5cb7 == 0 or P+0x1a8 & 0x2001; P+0x5cb7 is byte +2 of the spawn record (`0x6fb40..0x6fb44`, the same copy
  that puts byte +3 into P+0x5cb6, the size type -- rom-map `0x6fb68`). With it set, e+0x7420 = (`0x4957c()` ==
  `0x495d8()`), two reads of the net session object `0x3f79c8` (I: equal offline); clear, 1. Either way the follows hold
  offline (I for the set arm).
* **Thunderlord's uncharged death u 90: wired, without a new rung.** His gauge tier changes nothing on his model or his held
  aura (u 42 takes no tier, 10.3) -- it decides only whether a death requests u 90 -- so a rung (a look) is not what the
  ROM has; the death rows instead alternate (a row `cycle`): at the Charged rung the first death is tier 0 (nothing), the
  next tier >= 1 (u 90). Zinogre's Normal rung (tier 0 / 1) the same with u 120. Check: two deaths at the uncharged rung,
  one with the request.

Results: check 169 passed / 0 failed; soaks em057_00 87 / 0, em057_04 92 / 0. No new records.
