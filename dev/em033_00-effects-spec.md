# Akantor (em033_00) — effects spec

Research agent for the Viewer agent, 2026-10-14 (Raven: the survey's missing-bindings list, easiest first). Static
ROM reading plus unicorn controls; no recorder, no lift, no docs/ edit. `R` = READ (the consuming instruction read),
`I` = INFERRED, `NR` = NOT READ.

Class `uEm033_00`, vtable `0x17ba1c4` (checked: +0xf0 = base `0xca52c`, +0x208 = `0xe36748` = class-effects.json's
frame handler, +0x204 `0xe365cc` the sever hook motion-states already cites, +0x2a4 `0xe374d8` the puff pick
already transcribed; not the 4-bytes-low trap), band `0xe361a0..0xe3e400`. No real class request site (rom-map:
`0xe3f1dc` is uEm036_00's). Sources opened: survey section "Akantor (em033_00)", rom-map (u 1400 sweep row
`0xe3a5c8`, rage material rows, shared state-effects rows), motion-states.js MOTION_STATES / RAGE_PUFF em033_00,
psl-mask.js, effect-mounts.json, efx/logs/add_em033_00_*, dev/effect-ground-ray.md, `effects_triage.py em033_00`.

Survey gaps: enable word unread (1 binding outside the file mask); PSL records not exported c 150, c 151, u 321,
u 322, u 330; exported but undriven c 1104, c 1105, c 1109, u 1400, u 1120 / u 1121.

## 1. The PSL enable word — uEm033_00 vt+0x13c = `0xe3e368` — R, emulated

Extent `0xe3e368..0xe3e3dc` (the `pop`; `0xe3e3e0` / `0xe3e3e4` are unrelated veneers, `0xe3e3e8` the getDTI thunk).

    0xe3e374  bl 0xca170                                   ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0xe3e378  motion 0x215 (L2 M21) or 0x203 (L2 M3):
    0xe3e3ac    r0 = e->vt[+0x370](e, 1)                   ; 0xa3bf4: P+0x3b4 bit 0, the tail sever
    0xe3e3c0    |= r0 ? 0x7000000 (bits 24-26) : 0xe00000 (bits 21-23)
    0xe3e38c  motion 0x002 (L0 M2):
    0xe3e398    r0 = 0x81d6c(e)                            ; posture P+0x1ba == 4 AND P+0x5c < 0.9 x 0xbf62c(e)
    0xe3e3a0    |= r0 ? 0x1c0000 (bits 18-20) : 0x38000 (bits 15-17)
    every other motion: the base alone

`0x81d6c` read: `ldrb [P+0x1ba]`, `cmp #4`, else 0; then `0xbf62c` (MoguriBaseOfs, rom-map's Basarios row) x the
literal at `0x81db8` (0.9) against `vldr [P+0x5c]`, `movpl r0,#0`. Its meaning "already sunk" is the Basarios row's
reading (I). Nothing here reads the action, the variant or a part break.

**Emulated control** (`<archive>/emu13c.py`, which first reproduced Bloodbath's published words): L2 M3 intact
`0xe001ff`, severed `0x70001ff`; L2 M21 enraged `0xe00e3f`; L2 M21 severed + tired `0x700703f`; L0 M2 (posture 0)
`0x381ff`; L2 M4 / L2 M22 (7,5) severed / L3 M2 severed: `0x1ff`. All as read.

**For psl-mask.js CLASS_MASK:**

    // AKANTOR (em033_00), uEm033_00 vt+0x13c = 0xe3e368 (R, emulated; dev/em033_00-effects-spec.md 1)
    function em033_00(motion, action, state){
      if (motion === 0x203 || motion === 0x215) return state.severed ? 0x7000000 : 0xe00000;
      if (motion === 0x002) return state.sunk ? 0x1c0000 : 0x38000;   // 0x81d6c; the viewer plays it from the surface
      return 0;
    }

Inputs the viewer must supply:
* `state.severed` = his tail sever shown. The sever is a viewer state already: MOTION_STATES em033_00
  `'3|Motion[15]'` takes the tail row to **set 18** (and CUT_TAIL.em033_00 drops the piece). Read it from the tail
  set shown, as em007_04 reads SHELL_TAIL (I: the mapping set 18 = P+0x3b4 bit 0 is the part pass's, states-em033_00.md).
* `state.sunk`: leave false. L0 M2 is set by `0xe3a53c` phase 0 right after `0xbc7f4(e, 4)` (posture 4) at
  `0xe3a5ac` — begun from the surface, as Basarios's L0 M7 is (psl-mask.js em004 note), so `0x81d6c` is 0 there (I:
  P+0x5c = 0 at the start of the burrow, NR as a value). A replay already under ground is the case the viewer has no
  depth for.
* No action input. **He is never tired** (motion-states em033_00, states-em033_00.md 6), so bits 12-14 never fire.

**Per binding, what the word changes** (whole-block plan, `<archive>/planrows.py em033_00 --whole`, 132 bindings;
every one not listed is on bits 0-5 and stays always-on):

| binding | record | game |
|---|---|---|
| **L3 M25 b0** (outside the file mask) | c 1 (cm202_020, exported) | always — bind it |
| L2 M3 b21, L2 M21 b21 | **c 150** | tail intact only |
| L2 M3 b24, L2 M21 b24 | **c 151** | tail severed only |
| L2 M3 b22, L2 M21 b22 | c 71 | tail intact only |
| L2 M3 b25, L2 M21 b25 | c 71 | tail severed only |
| L0 M2 b15 | c 71 | always (not sunk) |
| L2 M1 b6 | u 261 | calm only |
| L2 M1 b9 / b10, L2 M13 b9 | u 260 / u 270 / u 262 | enraged only |
| L2 M1 b12 | u 261 | tired-calm only — **never** for him |

So the class turns ON one binding (c 1 on L3 M25) and turns OFF, by state, 13 that the viewer fires in every state
today (the c 150 / c 151 pair are not exported yet; once exported without the word, both would fire on every play).

## 2. The unexported records — c 150, c 151, u 321, u 322, u 330 — R

All five are in the file masks and plan `ok` (frames match, builder ok). **They were recorded on 2026-09-30 and all
five faulted** (`efx/logs/add_em033_00_{c150,c151,u321,u322,u330}.log`): `0xc14100` from `0xc44dc8` reading `.text`
`0xe3a0007f` — the **null sCollision** of the effect ground ray (rom-map `*0x21200e0`, effect-ground-ray.md §3.4). Each
is a ray record: payload `+0x52` = 1 with `+0x5c` bit 4 set (c 150 / c 151 / u 321 / u 322 `0x11`, u 330 `0x10`;
read with `add_effects.payload_of`). The stand-in for `0x18154c` landed 2026-10-07 (u 605) and the stage-ray refusal
is retired, so **exporting them is `add_effects.py em033_00 --apply` then `--record`** — no new read.

| record | file | fired by |
|---|---|---|
| c 150 | em033_00_014 (joint 143) | L2 M3 b21 f189-247; L2 M21 b21 f255-322 — tail intact (word) |
| c 151 | em033_00_014 (joint 142) | the same frames on b24 — tail severed (word) |
| u 321 | em033_00_008 | L2 M21 b0 f150 — always |
| u 322 | em033_00_008 | L2 M12 b0 f141, L2 M13 b0 f150, L2 M15 b1 f142 — always |
| u 330 | em033_00_005 | L2 M12 b1, L2 M13 b1, L2 M15 b0, L2 M21 b1 (f108-148) — always |

Order: the word (1) first, then --apply, so c 150 / c 151 are never bound ungated.

## 3. The undriven ones

* **u 1120 / u 1121, the rage puff — a data fix.** RAGE_PUFF.em033_00 exists (period 30, joint 3, `akantorPuffPick`
  from vt+0x2a4 `0xe374d8`, R), but index.html drives a puff only when `effectAutoOnRage(id)` (`index.html:6400`:
  `!!RAGE_PUFF[state.id] && effectAutoOnRage(state.id)`), and **`em033_00` is not in effect-mounts.json
  `_autoOnRage`**. Add it. (Ukanlos `em038_00` is missing from the list the same way — same fix, his survey row.) No
  board entry says it was left out on purpose.
* **c 1105, the shock trap — refusal stands; its gate and period are now READ.** The shared request is
  `0xa4854..0xa48bc` (in the state routine reached from the enemy update, callers `0xae794` / `0xaf100` of `0xa4518`):
  `0x80254` = `0x6fe88(e, 10, 0x6e)`; then the timer `e+0xb7c8` through `0x7206c` (<= 0 fires at once), reset to
  **42.0** (`0xa4884..0xa4894`, `movw/movt 0x42280000`), and id 5 through vt+0x1cc. (This upgrades rom-map's "c 1105's
  period 42: NOT FOUND" row.) For Akantor, (10, 0x6e) has no handler: his status-10 table sends it to the default
  `0xe3d598` -> `0x76088` = vt+0x3dc, the end-of-action (motion-states em033_00). So there is **no clip** to hang it on;
  whether the shared routine runs once while the action still reads (10, 0x6e) — the update order between the action
  handler and `0xa4518` — is NR. At most one c 1105 per trap, with no motion. Keep it refused.
* **c 1104 (drool), c 1109 (exhaust)** — refused with ROM reasons already in motion-states em033_00 (never tired:
  P+0x1a8 bit 19 and the +0x1fc remap; (10, 0x1b) / (10, 0x1c) fall to the default). Nothing new.
* **u 1400** — closes on the shared latch (rom-map u 1400 sweep: his only `0xa499c` site `0xe3a5c8` is level 1 =
  u 1121). The latch gate `0xadc98` is read; what sets `+0x1404` bits 20/21 and `+0x1408` bit 0 is NR. Refused.

## 4. What to implement, in order

1. psl-mask.js: `CLASS_MASK.em033_00` as §1, `state.severed` from his shown tail set (18), `state.sunk` false; add
   `'em033_00'` to `PSL_MASK_MONSTERS`.
2. `add_effects.py em033_00 --apply`, then `--record`, `--check` (regenerates CLIP_EFFECTS from the whole blocks:
   adds L3 M25 c 1 and exports c 150 / c 151 / u 321 / u 322 / u 330 under the ray stand-in).
3. effect-mounts.json `_autoOnRage`: add `em033_00` (the puff).
4. Soak with `--viewer-inputs`; Raven verifies: c 150 on L2 M3 / M21 with the tail on, c 151 with it cut.

NOT READ, by name: the value of P+0x5c at L0 M2's start (`state.sunk`); the update order that decides whether
c 1105 fires once for him; the `+0x1404` / `+0x1408` latch setters (u 1400).

## Re-walk 2026-10-18 (Fanged-Wyvern effects agent): tracer diff, request census, word re-emulation

**L0 M2's burrow asks u 1121.** `0xe3a5c8` is `0xa499c(e, 1)`: the u 1400 sweep was right that it is not u 1400, and the request it is -- u 1121 (cm200_007), held while the clip plays -- had no row. Traced (reqtrace.py): (6, 2 / 6 / 7 / 8) ask it; every other L0 M2 play (the walks, (1, 0xb..0xd), (6, 3 / 9 / 0xc..0xf), (7, 6..0xd), (8, 0)) asks nothing. Viewer: CLIP_ACTIONS em033_00 L0 M2 copies A / B (6, 2), MOTION_STATES '0|Motion[2]#B' hold u 1121 (an event twin of the puff record); dev/checks/level-copies.mjs.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **The `+0x1404` / `+0x1408` latch setters -- READ before this sweep** (rom-map rows "bit 20 of e+0x1404" .. "so the latch's u
  1400 can fire only ..", 2026-10-17): bit 20 is raised only by class code before a posture-4 dive, and uEm033_00 is not among
  them; `+0x1408` bit 0 only by Lavasioth. Akantor's u 1400 is his class call `0xe3a5c8` (level 1 = u 1121) or nothing. Superseded.
* **c 1105's update order -- READ**: the action main (and the default his (10, 0x6e) falls to) runs in the vt+0x24 chain
  (`0xada80` -> `0xa5940`), c 1105's request `0xa4518` in vt+0x28's `0xae370`, and sUnit's line pass `0xc04728` calls +0x24 then
  +0x2c then +0x28 for each unit (I: that the enemy's line is that pass -- it is sUnit's only +0x28 caller). So his (10, 0x6e) is
  gone before the request asks: **no c 1105 for Akantor**. The refusal is now the ROM's answer (rom-map row `0xae32c`).
* `state.sunk` at L0 M2: category c (the cross-monster "Begins burrowed" toggle, dev/effects-open-items.md X1).
* **Begins Burrowed -- BUILT 2026-10-19** (CLASS_TOGGLES `burrowed`, working label, approved by Raven): on, every posture-4 play
  reads sunk (0x81d6c: posture 4 and P+0x5c below 0.9 x MoguriBaseOfs); off, only the entries that name sunk. Checked on
  Basarios's L0 M7 B (dev/checks/class-toggles.mjs).
