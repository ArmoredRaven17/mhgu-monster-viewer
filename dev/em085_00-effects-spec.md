# Great Maccao (em085_00) — effects spec: the PSL enable word

Research agent for the Viewer agent, 2026-10-15 (Raven: the Bird Wyverns, easiest first; dev/bird-wyverns-effects-survey.md
"What closing each needs" 3). Static ROM reading plus unicorn controls; no recorder, no lift, no `--apply`, no docs/ edit.
`R` = READ (the consuming instruction read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: dev/bird-wyverns-effects-survey.md (Great Maccao: 0 bindings outside the file mask, 95 bindings),
rom-map.md ("The PSL enable word per class" row uEm085_00 `0x10937e8`; "THE PSL ENABLE MASK"), docs/render/psl-mask.js
whole, dev/em038_00-effects-spec.md and dev/em042_00-effects-spec.md (the format), E:\offline\decode\notes\states-em085_00.md
(§1 vtable row "+0x13c"; §3.6 the EMC scan; §9 the motions), the task board (grep: only the survey's line), monster.js
CLIP_EFFECTS em085_00, motion-states.js em085_00, efx/agents/maccao-scratch (act_s1.txt, emc_all.txt).

Survey gap: enable word unread; the whole-block plan equals the file-mask plan (95 rows), so the question is only which
in-mask bindings the word gates.

## 1. The word — uEm085_00 vt+0x13c = `0x10937e8` — R, emulated

Vtable **`0x17f74a8`** (checked: `+0xf0` = base `0xca52c`; `+0x208` = `0x108e2b8` = class-effects.json's frame handler).
Extent **`0x10937e8..0x1093838`**: one `push {r4, lr}`, exits `popne` at `0x1093818` and `pop` at `0x1093838`; `0x109383c`
is the next method (vt+0x14, the word at `0x17f74bc`: `ldr`, `bx lr`). One `bl`, to the base.

    0x10937f0  bl 0xca170                                  ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0x10937f4  ldrb [e+0x73e0] == 1   -> status 1, else pop (0x1093838)
    0x1093804  ldrb [e+0x73e1]:
                 == 0x0f -> r0 = 0x1c0000 (bits 18-20)     ; 0x1093824
                 == 0x04 -> r0 = 0x38000  (bits 15-17)     ; 0x109381c
                 else    -> popne (0x1093818)
    0x1093828  movw r1,#0x13f4; ldr r1,[r4,r1]!; orr r0,r1,r0; str r0,[r4]  ; post-indexed pointer
    every other case: the base alone

**The method never reads the motion** (r1 is not saved — `mov r4, r0` only — and the base's call leaves it dead): the bits
follow the ACTION on every motion it plays. It reads no part, break level, rage, posture or variant. The decode note
(states-em085_00.md §1, the "+0x13c" row) has the same bits and actions; its label "attack hit groups" is rom-map's
withdrawn reading (the slot is the PSL enable word).

Negative with control: class-effects.json's band `0x108b550..0x1093de8` has exactly one `0x13f4` immediate, `0x1093828`, and
no `ldr`/`str` with an immediate `0x13f4`. A wider scan `0x107b1c0..0x1094124` adds only `0x107f0d4` / `0x107f0f4`, which are
uEm084_00's tentacle method `0x107f0e4` (rom-map's Nakarkos row) — the positive control, outside his band.

**Emulated** (`<archive>/mm/emu13c_mm.py`; case = motion:status:number:sever:rage:tired):

| case | word |
|---|---|
| (1, 4) on L0 M0 / L3 M5, calm | `0x381ff` |
| (1, 4) on L2 M3, enraged / tired | `0x38e3f` / `0x3f03f` |
| (1, 0xf) on L0 M0, calm | `0x1c01ff` |
| (1, 0xf) on L9 M255, enraged + sever bit | `0x1c0e3f` |
| (1, 0xf) on L2 M3, tired | `0x1c703f` |
| (1, 5) / (1, 0xe) / (1, 0x10) / (1, 0) | `0x1ff` |
| (7, 4) / (7, 0xf) / (2, 4) / (0, 0xf) / (7, 0) | `0x1ff` |

All match the read (the motion changes nothing; the action does).

**For psl-mask.js CLASS_MASK:**

    // GREAT MACCAO (em085_00), uEm085_00 vtable +0x13c = 0x10937e8 (vtable 0x17f74a8; +0xf0 the base 0xca52c), READ whole
    // (0x10937e8..0x1093838, the pop) and emulated (dev/em085_00-effects-spec.md 1). 0xca170 first, then by ACTION only --
    // the motion id is never read: status 1 and number 0x0f -> bits 18-20 (0x1c0000); status 1 and number 4 -> bits 15-17
    // (0x38000); anything else -> the base. Both write through the post-indexed pointer (0x109382c). On his PSLs: L0 M21 b15
    // c 111 under (1, 4); L0 M21 b18 c 118 and b19 c 112 under (1, 0xf). No break, rage or variant input.
    function em085_00(motion, action){
      if (!action || action[0] !== 1) return 0;
      return action[1] === 0x0f ? 0x1c0000 : action[1] === 0x04 ? 0x38000 : 0;
    }

Inputs: the action only. With no action (`null`) all three L0 M21 bindings are off — so the clip needs a CLIP_ACTIONS entry
(§3), or the change removes them from the viewer.

## 2. Which actions play L0 M21 — R

* Status table `0x108bdd4` (switch on e+0x73e0): entry 1 -> `0x108be20` -> `b 0x108c018`, the status-1 handler; its number
  table `0x108c048` (on n - 1, `cmp r0, #0x33`): **(1, 4)** -> `0x108c1c4` -> `0x108e7e8(e, 0)` (via `0x108c308`);
  **(1, 0xf)** -> `0x108c300` -> `0x108e7e8(e, 1)`. (Entry 11 -> `0x108dd7c`, the death handler states-em085_00.md §8
  names: the table is the right one.)
* **`0x108e7e8(e, mode)`** (its only caller is `0x108c310`), a phase machine on P+0x1a1:
  phase 0: posture 0; mode 1 -> setMotion0 **L0 M24** (`0x108e848`, 7.317 s), P+0x1a2 = 1; mode 0 -> **L0 M25** (`0x108e930`,
  0.75 s), P+0x1a2 = 3. Phase 1 (`0x108e8e8`): at the motion's end (`0xb09c8`) posture 0, setMotion0 **L0 M21**
  (`0x108e90c`), P+0x1bc = 900.0 (`0x108e920`). Phase 2 (`0x108e858`): `0x7206c(e, &P+0x1bc, 1.0)` (I: the timer's step)
  and return while P+0x1bc > 0; then at frame 236.0 (`0xb0968`, literal `0x108e954`) vt+0x3d0(e, 1, 5) — **(1, 5)**, L0 M23
  (act_s1.txt) — and `0xbfbec(e, 3, 0)`.
  So **L0 M21 is the held clip of both actions, and only of them**: `0x108e90c` is the only setMotion of `0x15` in the band
  (the other `mov r1, #0x15`, `0x109111c`, is an argument to the tune read `0x6f618`), and no script the decode note walked
  names L0 M21 (§9 lists every scripted clip; I, grep). The action probe agrees on phase 0 (act_s1.txt: (1, 4) setMotion0
  L0 M25, (1, 0xf) setMotion0 L0 M24).
* **The command table** (maccao-scratch/emc_all.txt): (1, 4) is issued in g1 s73 (twice) and g10 s1, (1, 0xf) only in g1 s73,
  each after (2, 0x14); in g1 s73 an op 0x07 block picks (1, 0xf) on its case 7 and (1, 4) otherwise, inside an op 0x2a
  block. **Ops 0x07 / 0x2a: conditions NR** — the viewer shows each action as its own entry and does not guess the AI.
  What the move is (a rest? the clips' names are `Motion[24]` / `[25]` / `[21]`) is NR.

## 3. What the word changes — whole-block plan (equal to the file-mask plan, 95 rows)

`<archive>/ng/planrows.py em085_00 [--whole]`. Every binding not listed sits on bits 0-4 and stays always-on; **he has no
binding on bits 6-14**, so the base's state groups change nothing he shows.

**Turned ON**: none. **Turned OFF (never enabled)**: none.

**Gated** (in the file mask — the viewer fires all three on every play today):

| binding | record | game |
|---|---|---|
| **L0 M21 b15** f0-227 | c 111 (`cm202_070`) | only under (1, 4) — the hold after L0 M25 |
| **L0 M21 b18** f0-294 | c 118 (`cm200_013`) | only under (1, 0xf) — the hold after L0 M24 |
| **L0 M21 b19** f10-190 | c 112 (`cm200_013`) | only under (1, 0xf) |

Never all three at once: c 111 alone, or c 118 + c 112.

**Enabled, named in no block**: bits 16-17 under (1, 4) and bit 20 under (1, 0xf), on every motion those actions play
(L0 M25 / L0 M24 / L0 M21); bits 15-20 are named only on L0 M21.

**CLIP_ACTIONS:**

    // GREAT MACCAO, L0 Motion[21]: the hold of 0x108e7e8 (phase 1, 0x108e90c), played by (1, 4) after L0 M25 and by
    // (1, 0xf) after L0 M24 (status-1 table 0x108c048 -> 0x108c1c4 / 0x108c300); his word (0x10937e8) reads only the
    // action. Each play the next: c 111 on the first, c 118 + c 112 on the second.
    em085_00: {
      '0|Motion[21]': [{ action: [1, 0x04] }, { action: [1, 0x0f] }],
    },

## 4. What to implement, in order

1. psl-mask.js: `em085_00` as §1 into CLASS_MASK, `'em085_00'` into `PSL_MASK_MONSTERS`, and the CLIP_ACTIONS entry of §3 in
   the same change (without it L0 M21 loses all three records).
2. `add_effects.py em085_00 --check` (no regeneration is owed: the whole-block plan equals the file-mask plan), then the live
   soak with `--viewer-inputs`.
3. Raven verifies: L0 M21 alternates c 111 alone and c 118 + c 112.

NOT READ, by name: ops 0x07 / 0x2a in g1 s73 (which of (1, 4) / (1, 0xf) the AI picks); what `0x7206c` does to P+0x1bc and
what e+0x13a0 = 15.0 (set at `0x108e874` when a phase-2 play ends) is for; what the move is.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **Ops 0x07 / 0x2a in g1 s73 -- READ, and they need the map.** Op 0x07 switches on the area byte e+0x1054, op 0x2a on e+0x1053
  (vt+0x9c; I the map). (1, 0xf) is issued only with map 1 and area 7; (1, 4) everywhere else. Category a: the viewer's L0 M21
  copies show both, which the ROM picks by the map.
* **`0x7206c` -- READ** (the shared countdown, schedule.js); **e+0x13a0 = 15.0** sets layer 0's flag bit 0 for 15 frames (the motion
  advance `0x71984` counts it down); what bit 0 does is NR.

## Re-metered 2026-10-25 (effects lane A)

c 118 / c 112 (L0 M21 bits 18 / 19, action (1, 0x0f)) draw on the clip's second play. Before, they could not start: L0 M21 exists only
as `Motion[21]_loop`, and the viewer read each replay as a loop wrap, so the CLIP_ACTIONS entry never advanced past (1, 4). Fixed in
index.html playNow (rom-map "VIEWER FIX: a Clip-menu replay"). c 117 (L0 M24) and c 1500 (lying, Ground H) draw.
