# Teostra (em027_00) -- effects spec (Elder Dragon walk, 2026-10-18)

Class `uEm027_00`. No states note existed. Scratch: `<scratchpad>/zg/c027.asm`, `vt208_027.asm`, `pp027.asm`, `hook204b.py`,
`jscheckpd.py` (CHG / A18).

## 1. The PSL enable word -- vt+0x13c = `0xe1a9d8` -- R, read whole and emulated

`0xe1a9d8..0xe1aae8`: L2 M1 with the action NUMBER (any status) in {10, 21, 22} -> bits 24-26; L1 M14 with 0x27 -> bits 18-20;
then while P+0x5e08 bit 1 is clear and the fire aura P+0x1bb is neither 0 nor 0xff: bits 15-17, and on L4 M6 bits 6-8 CLEARED;
last, on every motion but L4 M9 it stops the handle e+0xcacc (the nova's; `0xe17e88..`) -- a side effect. Emulation over aura 0 / 1
/ 2 / 0xff x the flag: **98496 runs x2, 0 mismatches**; control 51428.

## 2. The Fire Aura control -- built

The aura P+0x1bb is a **Fire Aura** select (Off / On; CLASS_CONTROLS.em027_00) the word reads as `fireAura`. His aura driver
vt+0x208 `0xe10f7c` holds u 0 (id 1001; id 1002 = u 10 while P+0x5cb6 == 1) on the same test and fires u 1 (id 1003) when it goes
off -- **u 0 stays on the rage, as Raven set it** (2026-09-15 / 10-15; keys 1 / 2 / 3 were removed on his visual call): the ROM's
gate is reported, not applied over his decision.

## 3. The states -- R (Kushala's shape)

Status 10: (10, 7) part 0 -> L3 M3 -> wait 200 -> L3 M5 -> L3 M7, 1..5 -> L3 M1; (10, 0x72) part 0 -> the same chain, part 2 -> L3
M15 -> L3 M16; (10, 0x14) / exhaust -> L3 M3 -> L3 M2; sleep L3 M14 (-> L3 M7 -> L3 M17 past op 0xfd), (10, 0x1e) op 1 -> wait 200,
L3 M5 (the hold -- I); paralysis L3 M13; the stun L3 M3 -> L3 M5 held -> L3 M7; recoveries L3 M17; death L3 M18. vt+0x204 `0xe107ac`
(emulated): part 0 -> `0x9d438(e, 0)` (u 1000), part 2 -> `0xc2274(e, 0, 0, 0x8f)` (tail sever, joint 143). The part pass
`0xe1a604` (its head the rage material counter ctl+0x20): ctl+0x22 ? 7 : 1 (head); part 5 vs row 1 (level 2) -> 8 + 9 : 2 + 3 (wings, u
1026); bit 0 -> 10 : 4 (tail). No eye applier; no c 1104 / 1105 / 1109 in his file. Tired L0 M22; rage (1, 0x1b) L0 M5.

## 4. Named, open

**The nova machine**: ids 1006..1015 (keys 160..165 / 170..173, type-25 rows) requested at `0xe17e3c..0xe1850c` into e+0xcacc and
stopped by the word at the next motion -- not read here, not exported.

## 5. Implemented / results

psl-mask.js `em027_00` + CLIP_ACTIONS; CLIP_VARIANTS; MOTION_STATES.em027_00; CLASS_CONTROLS; CUT_TAIL ([25] em027_00_tail);
`--apply` +4, recorded (130 sets).
Check dev/checks/elders.mjs (word incl. the L4 M6 clear, Fire Aura row) pass. Soak **50 motions, 0 refused**.

## 6. The sleep hold, read (2026-10-18)

- (10, 0x1e) 0x17b7210 = op 1 -> 0x17b739c, then end. Op 1 sets no motion (dev/em024_00-effects-spec.md 6), so the hold
  is L3 M17, the last clip of (10, 0x1d) 0x17b7240.
- "op 1 -> 0x17b73a0: wait 200, L3 M5" read that record's words as a script from 4 bytes in: withdrawn.
- Now: L3 M17 copy B holds the zzz c 1102 / 90 and the puff off ((10, 0x1d) / (10, 0x1e)); copy A is (1, 8) and the wake
  (10, 0x44). L3 M5 copy C is gone.

## 7. u 0 follows the Fire Aura (Raven, 2026-10-18)

- Section 2's "u 0 stays on the rage" is superseded by Raven's call: u 0 follows the Fire Aura control, as the ROM does.
- vt+0x208 0xe10f7c holds id 1001 = u 0 while P+0x5e08 bit 1 is clear and P+0x1bb is not 0 / 0xff. When the aura goes out
  it stops the handle and fires id 1003 = u 1 once.
- Id 1002 (u 10) replaces u 0 while P+0x5cb6 == 1. That byte is the spawn entry's size type, written by 0x6fb64..0x6fb70 from
  the quest's rEmSetList [entry+3]. The viewer has no quest, and its size control lives in part-review.json (Raven's file).
  So u 10 is named, not wired.
- **Wired:** CLASS_TIMERS.em027_00; u 0 retagged from rage to event; u 1 exported and recorded. The elders check now holds u 0
  with Fire Aura on, lets it go when off, and expects u 1 as it goes out.

## 8. The size type, wired (2026-10-18; Raven: "add a size-type option for Teostra that drives u 10 by the ROM's rule")

- His class reads P+0x5cb6 at two sites (every `#0x5cb6` in his band; the known one found as the control): 0xe11120, the aura hold (== 1 holds id 1002 = u 10 in place of id 1001 = u 0), and 0xe104fc in vt+0x1d8, the spawn setup (!= 1, outside areas 4 / 6: P+0x3b4 |= 0x8000).
- P+0x3b4 bit 15 masks his .bdd records 0-7 -- leg spheres on joints 14-21, slot 5 -- which duplicate records 12-19 (the same joints and slot, no mask): the hit-zone map does not change. Its other reader 0xc1ee4 filters the carve table. Not visual.
- The shared readers (Teostra's own 0x6a1b8 distance loop, the quest-mode tests, the reward and stat lookups) draw nothing.
- **Wired:** a second class control, **Size Type** (working label; options Type 0 / Type 1 -- the ROM tests == 1 only), CLASS_CONTROLS2.em027_00 / state.classCtl2; CLASS_TIMERS.em027_00 holds u 10 for u 0 while it is 1. em027_00u 10 exported (UNIQUE #4, event, stop). dev/checks/elders.mjs: Size Type 1 holds u 10 not u 0, back to u 0 at 0.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **P+0x5e08 bit 1 -- the setter READ** (rom-map row "P+0x5e08 (the ailment state byte)"): the hit pass's first ailment
  accumulator (`0x9a290` -> `0xa239c`, data entry +0x34) -- poison: the shared `0xa4518` requests c 1100 on it. While it is set u 0 (the aura) is not held (`0xe10f7c`). A "Poisoned"
  toggle is what the ROM's test supports (category c, listed; it would also still Kushala's wind).
* **The nova machine (section 4) -- READ and wired 2026-10-18; recorded here 2026-10-19.** `0xe17ce8(e, sel)`, called by nine
  actions with a selector, holds the charge record on L4 M9 (u 160 / u 161 / u 162 + u 164 / u 163 + u 165 by selector) and at L4
  M10 f50 stops it, spawns the nova shell and fires u 170 / u 171 / u 172 / u 173 (selectors 7 / 8: the shell alone). MOTION_STATES
  L4 M9 / L4 M10 copies A..E carry it (motion-states.js, "THE NOVA"); the ten records are exported (event). elders.mjs now asserts
  u 160 held on L4 M9. The section-4 "not read here, not exported" is superseded.
* **Poisoned -- BUILT 2026-10-19** (CLASS_TOGGLES `poisoned`, working label): the word's aura bits off, u 0 not held (u 1 once as it
  goes), c 1100 at once and every 90 frames.

## Control block re-check (2026-10-19, trap 117's follow-up; rom-map "the control block [e+0xcac0] SET NON-ZERO")

* **A frame-handler request pair the viewer does not drive.** vt+0x208 `0xe11204..0xe112dc` runs an edge latch on ctl+0x26:
  * on: id 1004; off: id 1005; both on root joint 3.
  * ctl+0x26's writer is NOT READ.

## u 2 / u 3, the rage latch (effects lane, 2026-10-20) -- built

* ctl+0x26's writer is read: vt+0x204 `0xe107ac` ends with ctl+0x26 = isEnraged (`0xe10eb4`) at every action start, and init
  writes 0.
* vt+0x208 `0xe11204..0xe112dc`, on a change of that value:
  - rising: id 1004 = u 2;
  - falling: id 1005 = u 3.
* Each goes through a block with +0x14 bit 5 and root joint 3 at +0x52. proof.js's requester now takes `rootJoint`. The sets
  add_em027_00_u2_rj3 / _u3_rj3 were recorded with that block and lifted.
* Driven: CLASS_TIMERS em027_00, where the viewer's action start is a new play. Measured: u 2 lit 44 / 45, u 3 lit 21 / 22, both
  draw.
