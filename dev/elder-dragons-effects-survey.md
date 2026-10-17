# Elder Dragons -- effects survey (survey agent for the Viewer agent, 2026-10-15)

Raven: "For each category of large monster remaining, have a sub agent assess the missing effects."

Scope: Kirin, Lao-Shan Lung, Fatalis / Crimson / Old, Kushala Daora, Chameleos, Teostra, Alatreon, Amatsu, Shagaru Magala, Nakarkos, Valstrax. Assessment only: nothing under docs/ was changed, no recorder or lift ran.

## How it was measured

- **Exported / firing**: efx/effects_status.py per record (clip bits, shells, rage, MOTION_STATES events, the shared states). Two corrections to its output: c 1100 (Poisoned) and c 1108 (Dung Bombed) are driven by SharedStates from the state toggles -- the classifier returns `wired` for any `event` record before it checks the shared keys -- and the deliberate exclusions are not gaps: blast c 1130-1137, notice c 1200/1201 (off the list), hyper u 1301-1315 (withheld), c 1500 (lying in water), c 1106 (Raven). Teostra's fire aura u 0 is Raven's own parking (2026-09-15), listed but not counted.
- **The PSL enable word**: the class's vtable +0x13c word read off main.data (vtable from efx/class-effects.json; controls uEm004_00 0xd2e0ec, uEm007_00 0xd4532c, uEm084_00 0x106cae8 match, vt+4 holds 0x6bdd4 on every class). add_effects.py plan() run on the blocks' FILE masks and on the WHOLE blocks; the difference is what the enemy +0x13f4 word decides. `*` = named outside the file mask. A name with no file is a bit naming a key that has no record in any array: not an effect. The overrides were SKIMMED (capstone, from the entry to the return) to size the read -- not transcribed, not emulated.
- **Rage puff gate**: per class, the immediates `0xb7d2` / `0xb7d3` / `0x5d04` in the class band (class-effects.json `code_lo..code_hi`, an address range, not proven membership) and vt+0x2a4 (the puff pick; 0x6bf64 = base). Controls: Alatreon 0xec4a94 (`e+0xb7d2 = 0`, states-em050_00.md) and Ukanlos 0xe5a2dc (`P+0x5d04 = 3`, rom-map) found; Kirin's 0xd6d19c matches states-em011_00.md 1.3.
- **Refusals**: dev/effect-live-soak.mjs <mon> --viewer-inputs through the shared two-slot lock, every bound motion in the viewer, one monster at a time. A refusal stops every effect of the monster until reload.

## Summary

(Soak column completed 2026-10-15 by the Viewer agent from the survey's own soak logs: the agent was stopped by a
session restart after writing this note; Valstrax em086_00's soak, cut off mid-run, was re-run: 100 motions, 0 refused.)

| # | monster | exported | firing | gaps (undriven, not deliberate) | enable word | bindings outside file mask | PSL records not exported (with a file) | soak |
|---|---|---|---|---|---|---|---|---|
| 1 | Kirin `em011_00` | 30 | 20 | u0(clip) u60(clip) u61(clip) | override `0xd73a18` | 9 | u200 u201 u230 | clean |
| 2 | Lao-Shan Lung `em012_00` | 47 | 33 | u1000(event) u1001(event) u1120(ragePuff) u1121(ragePuff) | override `0xd77ac8` | 0 | -- | clean |
| 3 | Fatalis `em013_00` | 44 | 27 | c1101(event) c1102(event) c1103(event) u1000(event) u1120(ragePuff) u1121(ragePuff) | override `0xd8aecc` | 5 | -- | clean |
| 4 | Crimson Fatalis `em013_01` | 46 | 29 | c1101(event) c1102(event) c1103(event) u1000(event) u1120(ragePuff) u1121(ragePuff) | override `0xd8aecc` | 5 | -- | clean (93) |
| 5 | Old Fatalis `em013_02` | 50 | 33 | c1101(event) c1102(event) c1103(event) u1000(event) u1120(ragePuff) u1121(ragePuff) | override `0xd8aecc` | 10 | -- | clean (99) |
| 6 | Kushala Daora `em024_00` | 53 | 31 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1000(event) u1120(ragePuff) u1121(ragePuff) u220(rage) u240(rage) u900(event) u905(event) | override `0xdfd19c` | 1 | c61 c62 | clean (51) |
| 7 | Chameleos `em025_00` | 52 | 30 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1000(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event) | **base `0xca170`** | 0 | u240 | clean (52) |
| 8 | Teostra `em027_00` | 52 | 34 | c1101(event) c1102(event) c1103(event) u1000(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event) | override `0xe1a9d8` | 3 | u285 u286 u289 | clean (49) |
| 9 | Alatreon `em050_00` | 71 | 60 | -- | override `0xece27c` | 9 | u200 u231 u240 u450 u451 u550 | clean (71) |
| 10 | Amatsu `em058_00` | 54 | 35 | c1101(event) c1102(event) c1103(event) u1001(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event) | **base `0xca170`** | 0 | -- | clean (38) |
| 11 | Shagaru Magala `em072_00` | 61 | 43 | c1101(event) c1102(event) c1103(event) u1000(event) u1001(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event) | override `0xfc08a8` (uEm071_00) | 22 | c101 c110 u260 | clean (106) |
| 12 | Nakarkos `em084_00` | 73 | 61 | u1120(ragePuff) u1121(ragePuff) u1400(event) | read (psl-mask.js) | 0 | 32 on the tentacle lists | clean (48) |
| 13 | Valstrax `em086_00` | 108 | 87 | c1101(event) c1102(event) c1103(event) c1105(event) u1000(event) u1001(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event) | **base `0xca170`** | 1 | -- | clean (100) |

## Per monster

### Kirin (`em011_00`)

- Soak: 29 motions played in the viewer, 0 refused (48 s)
- Enable word override `0xd73a18`, not transcribed: 9 bindings named outside the file mask (37 file-mask bindings, 46 whole-block).
- Exported but undriven (not deliberate): u0(clip) u60(clip) u61(clip)
- **u 0 / u 60 / u 61 are exported as `clip` but no PSL bit names them** -- they are UNIQUE records the class asks for itself: the lightning aura, `vtable +0x208` 0xd6df64, READ (E:\offline\decode\notes\states-em011_00.md 5.2): calm u 0 every 40 f (joint 0, suppressed on L3 M4 / M5 / M7 / M8 and L4 M6); enraged u 61 every 32 f (no joint) while the horn is intact (`breakLevel(0) < 2`), and u 60 every 45 f (joint 0, pos (0, 0, 30)), neither during the rage roar (1, 6). The table keys of uEm011_00 are exactly {0, 60, 61} (class-effects.json). Needs: retag from `clip` and a small periodic class driver (RAGE_PUFF's shape cannot carry it: a calm record, two periods, a motion suppress list and the horn gate). Mechanism read; runtime not built.
- Rage puff: none, deliberately -- the class writes `e+0xb7d2 = 0` (0xd6d19c, states-em011_00.md 1.3) and `em011_00u` has no 1120 / 1121.
- Enable word `0xd73a18` (skimmed 2026-10-15, not transcribed): 0xca170, then by motion id -- L4 M7 (0x407) with action (7, 5 / 7 / 11 / 13 / 45..48) ORs 0x238000 (bits 15-17, 21), with (1, 6) ORs 0x3c0000 (bits 18-21); L2 M4 (0x204) ORs 0x7000000 (bits 24-26) when `0x6fe88(e, 7, 2)` is 0 (0x6fe88 unread). That covers u 350 / 351 / 352 / 200 / 201 and u 352's L2 M4 b24; u 200 / u 201 come in with --apply; u 230 (em011_00_003) is `partial: type 20 not built`.
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c2 exported `cm202_002` (5 type 2, 20 model): L4 M14 b0*
  - u200 **not exported** `em011_00_007` (1 polyline, 3 model): L4 M7 b21*
  - u201 **not exported** `em011_00_008` (4 model): L4 M7 b18*
  - u230 **not exported** `em011_00_003` (5 billboard, 4 model, 1 type 20): L2 M4 b6* L2 M4 b12*
  - u350 exported `em011_00_000` (1 polyline, 7 model): L4 M7 b15*
  - u351 exported `em011_00_000` (1 polyline, 7 model): L4 M7 b16*
  - u352 exported `em011_00_000` (1 polyline, 7 model): L2 M4 b24* L4 M7 b17*

### Lao-Shan Lung (`em012_00`)

- Soak: 40 motions played in the viewer, 0 refused (309 s)
- Enable word override `0xd77ac8`, not transcribed: 0 bindings named outside the file mask (144 file-mask bindings, 144 whole-block).
- Exported but undriven (not deliberate): u1000(event) u1001(event) u1120(ragePuff) u1121(ragePuff)
- **u 1000 / u 1001 (part breaks, `event`)**: no MOTION_STATES block and no states note for em012_00 -- the break ladder and its reaction clips are UNREAD (states read needed: E:\offline\decode\notes has no states-em012_00.md).
- **u 1120 / u 1121 (rage puff)**: no `e+0xb7d2` / `+0xb7d3` / `0x5d04` immediate in the class band 0xd751cc..0xd7ba60 (controls: Alatreon 0xec4a94 and Ukanlos 0xe5a2dc found the same way), vt+0x2a4 = 0x6bf64 (the base pick, always 0): the shared puff runs. Config-only: RAGE_PUFF {period 30, pick () => 0, joint: the record's, as the dromes} + `_autoOnRage`. (Band = address range from class-effects.json, membership not proven.)
- Enable word `0xd77ac8` (skimmed): 0xca170, then `+0x13f4 |= 0x3f8000 | 0x7c00000` UNCONDITIONALLY (bits 15-26), then two calls per matching (13, motion) entry of a table at `e+0xb6ec` (`0x7db70`, `0xb07b4` -- not read for the word). Zero bindings outside the file mask, so the transcription changes the state gating only. No c 11xx records exist for him (none exported).

### Fatalis (`em013_00`)

- Soak: 93 motions played in the viewer, 0 refused (339 s)
- Enable word override `0xd8aecc`, not transcribed: 5 bindings named outside the file mask (175 file-mask bindings, 180 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) u1000(event) u1120(ragePuff) u1121(ragePuff)
- **c 1101 / 1102 / 1103 (paralysis, sleep, stun) and u 1000 (break)**: no MOTION_STATES block, no states note for em013 -- the (10, 0x1f) / sleep / stun scripts and the break ladder are UNREAD (states read needed; efx/agents/notice-scratch/probe.py + scr.py resolve status-10 scripts).
- **u 1120 / u 1121**: the class has its OWN puff pick, vt+0x2a4 = `0xd7e800` (unread), and sets `P+0x5d04 = 4` (0xd7d964..0xd7d980); no `e+0xb7d2` write in the band, so the shared puff runs with that pick. Needs the pick read (as Akantor / Ukanlos / Rathian have theirs) + RAGE_PUFF + `_autoOnRage`.
- Enable word `0xd8aecc` (skimmed): 0xca170, then by motion id and the VARIANT byte `e+0xb5f5` -- L2 M5 / M6 under (7, 0x3b / 0x3c) and variant 1 bits 15-17, under (7, 0 / 0x13) and variant 2 bits 18-20; L0 M5 under (13, 0), (7, 0x15) or (1, 3 / 10 / 12) bits 21-23. One method, three variant arms (Fatalis / Crimson / Old).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c90 exported `cm202_050` (15 model, 2 filter): L0 M5 b21*
  - u200 exported `em013_00_003` (3 billboard, 8 model): L2 M38 b0* L2 M63 b0*
  - u201 exported `em013_00_003` (3 billboard, 8 model): L2 M38 b1*
  - u202 exported `em013_00_003` (3 billboard, 8 model): L2 M38 b2*
  - named with no record in any array (not effects): u500 u501

### Crimson Fatalis (`em013_01`)

- Soak: no result
- Enable word override `0xd8aecc`, not transcribed: 5 bindings named outside the file mask (175 file-mask bindings, 180 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) u1000(event) u1120(ragePuff) u1121(ragePuff)
- As Fatalis (`em013_00`): the same class, the same gaps -- c 1101-1103, u 1000, u 1120 / u 1121 (pick 0xd7e800), the variant-1 arm of `0xd8aecc`.
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c90 exported `cm202_050` (15 model, 2 filter): L0 M5 b21*
  - u200 exported `em013_00_003` (3 billboard, 8 model): L2 M38 b0* L2 M63 b0*
  - u201 exported `em013_00_003` (3 billboard, 8 model): L2 M38 b1*
  - u202 exported `em013_00_003` (3 billboard, 8 model): L2 M38 b2*

### Old Fatalis (`em013_02`)

- Soak: not run
- Enable word override `0xd8aecc`, not transcribed: 10 bindings named outside the file mask (188 file-mask bindings, 198 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) u1000(event) u1120(ragePuff) u1121(ragePuff)
- As Fatalis (`em013_00`): the same class, the same gaps; the variant-2 arm of `0xd8aecc` (10 outside-mask bindings: u 202 on L4 M8 / M9, u 290 L4 M12, u 601 L4 M8 / M9). Not in SHELL_DATA: his beam id 0x8c starts no effect (beam-spawns.js, dev/beams/em013_00.md).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c90 exported `cm202_050` (15 model, 2 filter): L0 M5 b21*
  - u200 exported `em013_02_003` (1 billboard, 6 polyline, 3 type 2, 18 model): L2 M38 b0* L2 M63 b0*
  - u201 exported `em013_02_003` (1 billboard, 6 polyline, 3 type 2, 18 model): L2 M38 b1*
  - u202 exported `em013_02_003` (1 billboard, 6 polyline, 3 type 2, 18 model): L2 M38 b2* L4 M8 b2* L4 M9 b2*
  - u290 exported `em013_02_030` (2 billboard, 4 polyline, 3 model): L4 M12 b0*
  - u601 exported `em013_02_014` (2 billboard, 1 polyline, 3 model): L4 M8 b1* L4 M9 b1*
  - named with no record in any array (not effects): u320

### Kushala Daora (`em024_00`)

- Soak: not run
- Enable word override `0xdfd19c`, not transcribed: 1 bindings named outside the file mask (90 file-mask bindings, 91 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1000(event) u1120(ragePuff) u1121(ragePuff) u220(rage) u240(rage) u900(event) u905(event)
- **c 1101-1105, c 1109, u 1000**: no MOTION_STATES block, no states note for em024 -- UNREAD (states read).
- **u 900 / u 905 (tail sever)**: CUT_TAIL entry; `em024_00_tail.glb` is staged; the sever joint (`+0x1477`, the kind byte at the class's `bl 0xc2274`) is UNREAD.
- **u 1120 / u 1121**: no `e+0xb7d2` write, vt+0x2a4 base: the shared puff runs -- config-only RAGE_PUFF + `_autoOnRage`.
- **u 220 / u 240 tagged `rage` are his WIND BARRIER** (UNIQUE em024_00_100 / em024_00_101, distinct from the SEQUENCE 220 / 240 that already fire as clip records). READ on the board (2026-09-14, "Kush's wind barrier"): `vtable +0x208` 0xdeffc4 holds it at `e+0xcac8`, ids 1004..1007 -> keys 210 / 220 / 230 / 240 by `[ctl+0x2c]` (scale) and `[ctl+0x2d]` (the file: the snow maps, rom-map 0xdef0c8); the aura level is `P+0x1bb` (rom-map 0xdfc814). So `rage` with 220 and 240 both on is not the ROM's shape, 210 / 230 are not exported, and the records are placement MODE 4 (camera-attached, READ 2026-10-05, dev/effect-placement-mode4.md) -- they refused at 0x329e68 before the camera chain was lifted; the board's open item says re-record (predicted 0x31d298).
- The class writes `e+0xb7d3 = 0` in its per-reset init `vtable +0x1d8` 0xdef008 (at 0xdef18c; r4 = the enemy): the shared TIRED DROOL switch (0xa42c0) -- so c 1104 likely never fires for him (INFERRED: no later re-set was looked for).
- Unexported c 61 / c 62 (cm202_020, L2 M3 / M4, inside the file mask) are the stage-ray records refused before 2026-10-07: now recordable (--apply / --record).
- Enable word `0xdfd19c` (skimmed): 0xca170, then `0x1c0000` when `ctl+0x2c == 1 && ctl+0x2d != 0`, else a table word indexed by the aura level `P+0x1bb` (0xff -> 0; 3 -> 2 or 3 and 2 -> 1 or 2 by `ctl+0x18`). One outside-mask binding, u 286, names no record: state gating only.
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c61 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M3 b0
  - c62 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M4 b0
  - named with no record in any array (not effects): u286

### Chameleos (`em025_00`)

- Soak: not run
- Enable word **base `0xca170`**, not transcribed: 0 bindings named outside the file mask (75 file-mask bindings, 75 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1000(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event)
- **c 1101-1105, c 1109, u 1000**: no MOTION_STATES block, no states note -- UNREAD.
- **u 900 / u 905**: CUT_TAIL; `em025_00_tail.glb` staged; sever joint UNREAD.
- **u 1120 / u 1121**: own pick vt+0x2a4 = `0xe025f0` (unread), `P+0x5d04 = 4` (0xdff2dc..0xdff2ec); no `e+0xb7d2` write: the shared puff runs with that pick.
- Unexported u 240 (cm202_020, L2 M6 / M8, inside the mask): a stage-ray record, now recordable.
- Enable word: the BASE `0xca170` -- `() => 0` + --apply, zero outside-mask bindings (state gating only).
- Class table empty (class-effects.json lists three sites 0xe110ec.., which are in uEm027_00's band -- rom-map trap, class-effects over-reports across class boundaries). His invisibility is materials, not effects.
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - u240 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M6 b0 L2 M8 b0

### Teostra (`em027_00`)

- Soak: not run
- Enable word override `0xe1a9d8`, not transcribed: 3 bindings named outside the file mask (112 file-mask bindings, 115 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) u1000(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event)
- **u 0 (`rage`) is the fire aura, PARKED BY RAVEN** (board 2026-09-15: "hide the aura effects that still need work"; em027_00 taken off `_autoOnRage`). Not a gap until he lifts it. READ: `vtable +0x208` 0xe10f7c fires ids 1001..1005 = keys 0, 10, 1, 2, 3 (board; dev/monster-review.md 3871); keys 1 (em027_00_018) and 2 / 3 (em027_00_019) were removed on Raven's visual call -- his to reverse.
- **c 1101-1103, u 1000**: no states note -- UNREAD.
- **u 900 / u 905**: CUT_TAIL; `em027_00_tail.glb` staged; sever joint UNREAD.
- **u 1120 / u 1121**: no `e+0xb7d2` write, vt+0x2a4 base: the shared puff runs -- config-only RAGE_PUFF (`_autoOnRage` is what Raven took him off; ask before re-adding).
- Enable word `0xe1a9d8` (skimmed): 0xca170, then L1 M14 under number 0x27 bits 18-20; L2 M1 under number 10 / 21 / 22 bits 24-26; bits 15-17 when `0xa1f0c(e, 2) == 0` and `P+0x1bb` is not 0 / 0xff (and L4 M6 clears bits 6-8); and **it stops the effect handle at `e+0xcacc`** (`0x329c40(h, 0)`) on every motion but L4 M9 -- a side effect inside the word's method, unread. u 285 / 286 / 289 (outside the mask, not exported) come in with it.
- Nine PSL keys inside the file mask name no record in either pel (u 200 / 210 / 220 / 230 / 240 / 250, c 62 / 70 / 150): not effects.
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - u285 **not exported** `em027_00_001` (2 model): L4 M7 b6*
  - u286 **not exported** `em027_00_000` (5 model): L2 M1 b24*
  - u289 **not exported** `em027_00_003` (1 billboard, 3 model): L4 M6 b9*
  - named with no record in any array (not effects): c150 c62 c70 u200 u210 u220 u230 u240 u250

### Alatreon (`em050_00`)

- Soak: not run
- Enable word override `0xece27c`, not transcribed: 9 bindings named outside the file mask (126 file-mask bindings, 135 whole-block).
- Every exported record is driven (states-em050_00.md; RAGE_PUFF em050_00 with his own form-picked puff; CUT_TAIL).
- Enable word `0xece27c`: NOT skimmed to its end -- its two jump tables (0xece2c4, 0xece390) reach past the first return (0xece478), so the extent is open. 9 bindings outside the mask; u 200 / 231 / 240 / 450 / 451 / 550 (not exported) come in with it.
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - u200 **not exported** `em050_00_011` (1 polyline, 3 model): L0 M9 b15*
  - u201 exported `em050_00_011` (1 polyline, 3 model): L0 M9 b16*
  - u231 **not exported** `em050_00_022` (3 billboard, 4 model): L2 M5 b15*
  - u240 **not exported** `em050_00_021` (7 model): L2 M5 b27*
  - u360 exported `em050_00_028` (2 billboard): L2 M8 b25*
  - u390 exported `em050_00_000` (1 polyline, 6 model): L2 M7 b24*
  - u450 **not exported** `em050_00_011` (1 polyline, 3 model): L2 M16 b15*
  - u451 **not exported** `em050_00_011` (1 polyline, 3 model): L2 M17 b15*
  - u550 **not exported** `em050_00_038` (1 billboard, 1 polyline, 8 model): L2 M23 b15*

### Amatsu (`em058_00`)

- Soak: not run
- Enable word **base `0xca170`**, not transcribed: 0 bindings named outside the file mask (65 file-mask bindings, 65 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) u1001(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event)
- **c 1101-1103, u 1001**: no states note -- UNREAD.
- **u 900 / u 905**: CUT_TAIL; `em058_00_tail.glb` staged; sever joint UNREAD.
- **u 1120 / u 1121 are NOT the shared puff for him**: the class writes `e+0xb7d2 = 0` in `vtable +0x1d8` 0xf06dbc (at 0xf07178), which switches the shared request off (0xa424c), and 1120 / 1121 are in his own class table (with 0-3, 100-102, 1600, 1601): Alatreon's pattern -- his own puff, UNREAD.
- Enable word: the BASE `0xca170` -- `() => 0`, zero outside-mask bindings.

### Shagaru Magala (`em072_00`)

- Soak: not run
- Enable word override `0xfc08a8` (uEm071_00), not transcribed: 22 bindings named outside the file mask (216 file-mask bindings, 238 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) u1000(event) u1001(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event)
- Shagaru is not in efx/class-effects.json under his own number: he runs **uEm071_00** (Gore's class; vtable 0x17e418c; dev/shell-map.md -- the class tests `+0xb5f4` against 71 and 72; dev/notice-marks.md).
- **c 1101-1103, u 1000, u 1001**: no states note for em071 / em072 -- UNREAD.
- **u 900 / u 905**: CUT_TAIL; `em072_00_tail.glb` staged; sever joint UNREAD.
- **u 1120 / u 1121**: own pick vt+0x2a4 = `0xfbec80` (unread), `P+0x5d04 = 4` (0xfadb58 / 0xfadbac); no `e+0xb7d2` write.
- Unexported c 101 (cm202_020) / c 110 (em071_00_019), inside the mask: stage-ray records, now recordable.
- Enable word `0xfc08a8` (26 instructions, skimmed whole): 0xca170, then only on L2 M7 (0x207) under action (7, 0x58) bits 15-17 or (7, 0x60) bits 18-20, each also CLEARING bits 6 and 9 (`bic #0x240`). No variant test -- Gore and Shagaru share it. u 260 (L2 M7 b6 / b9 / b15 / b18) comes in with it; the other 21 outside-mask bindings are base bits (0-5 / state groups).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c101 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M13 b1 L2 M27 b0
  - c110 **not exported** `em071_00_019` (2 billboard, 1 type 2, 20 model): L2 M33 b0
  - c30 exported `cm202_020` (5 type 2, 27 model, 5 node): L3 M40 b0*
  - c90 exported `cm202_020` (5 type 2, 27 model, 5 node): L0 M92 b0*
  - c91 exported `cm202_020` (5 type 2, 27 model, 5 node): L0 M92 b1*
  - u230 exported `em072_00_001` (2 billboard, 3 model): L2 M4 b9* L2 M6 b9* L2 M52 b6* L2 M52 b9*
  - u231 exported `em072_00_000` (1 billboard, 5 model): L2 M52 b0*
  - u234 exported `em072_00_000` (1 billboard, 5 model): L2 M4 b10* L2 M6 b10* L2 M52 b7* L2 M52 b10*
  - u260 **not exported** `em071_00_010` (4 billboard, 6 model): L2 M7 b6* L2 M7 b9* L2 M7 b15* L2 M7 b18*
  - named with no record in any array (not effects): c130 c180 c181 c41 u200 u201 u202 u203 u250 u280 u300

### Nakarkos (`em084_00`)

- Soak: not run
- Enable word read: every named PSL bit is bound as the class gives it.
- Exported but undriven (not deliberate): u1120(ragePuff) u1121(ragePuff) u1400(event)
- Enable word READ and transcribed (psl-mask.js CLASS_MASK.em084_00; dev/em084-psl-mask.md).
- **u 1120 / u 1121**: in `_autoOnRage` but no RAGE_PUFF entry. No `e+0xb7d2` write, vt+0x2a4 base: the shared puff runs -- config-only. ALSO: his class asks u 1121 itself through `0xa499c(e, 1)` at 0x10739d0 (L0 M50) and 0x1073474 (group-6 dispatcher) -- READ, rom-map "u 1400 -- the per-class sweep" (a row on L0 M50; the hold / start shape is the site's to read).
- **u 1400 (`event`)**: no class site (rom-map sweep: both sites resolve 1121) -- he closes on the shared one-shot latch 0xadc98, whose gate bits (`+0x1404` bits 20 / 21, `+0x1408` bit 0) are NOT READ.
- **32 tentacle PSL records** (u 0 / 10 / 50 / 51 / 90 / 105.. on the `l_N` / `r_N` lists) are left out as "entity motion: not bound -- the viewer hangs every effect from the body": board PHASE 3 of the Tentacle Form item; the arm's enable method 0x107f0e4 is READ (dev/em084-psl-mask.md 6); needs the arm as an effect parent for PSL clip effects.
- Class records READ but not exported: c 800 x3 at L3 M65 (0x106af68, rom-map), c 1600 / c 1601 on (10, 0x6a) (0x1067be0). Mechanism read; a CLIP_ACTIONS / MOTION_STATES-style row each.

### Valstrax (`em086_00`)

- Soak: not run
- Enable word **base `0xca170`**, not transcribed: 1 bindings named outside the file mask (194 file-mask bindings, 195 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1105(event) u1000(event) u1001(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event)
- **c 1101-1103, c 1105, u 1000, u 1001**: no states note -- UNREAD.
- **u 900 / u 905**: CUT_TAIL; `em086_00_tail.glb` staged; sever joint UNREAD.
- **u 1120 / u 1121 are NOT the shared puff**: the class writes `e+0xb7d2 = 0` in `vtable +0x1d8` 0x109e0c8 (at 0x109e180) and holds 1120 / 1121 in its own table (with 100 / 110 / 120 / 130 / 200 / 1130): his own puff, UNREAD.
- Enable word: the BASE `0xca170` -- `() => 0`. Its one outside-mask binding (u 101, L1 M2 b15) is then correctly off.
- Class table key u 130 not exported (class-effects.json); sites 0x109ab60.. unread here.
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - u101 exported `em086_00_101` (2 billboard, 18 model): L1 M2 b15*

## What closing each needs (easiest first)

Counts are monsters (variants counted). Addresses are the class's; "UNREAD" means nobody has read it, not that it is hard.

1. **Config-only rows (mechanism read, data in hand)**
   - **RAGE_PUFF + `_autoOnRage` where the SHARED puff runs on the base pick** (no `e+0xb7d2` write in the band,
     vt+0x2a4 = 0x6bf64, `pick: () => 0`, period 30): **Lao-Shan Lung, Kushala, Nakarkos** (3; Nakarkos is already in
     `_autoOnRage`). Teostra has the same shape, but Raven took him off `_autoOnRage` on 2026-09-15 -- ask first.
     The joint: none of the four writes `P+0x5d04` in its band; take the record's joint as the dromes do, and say so.
   - **Nakarkos's own u 1121 on L0 M50** (`0xa499c(e, 1)` at 0x10739d0, READ in rom-map's u 1400 sweep): one
     MOTION_STATES row once the site's hold / start shape is read off it (1).
2. **Base-only enable words** (`() => 0` in psl-mask.js + `--apply`): **Chameleos, Amatsu, Valstrax** (3). Zero
   bindings outside the mask on the first two; Valstrax's one (u 101 L1 M2 b15) stays off, as the game has it.
3. **Override enable words to read** -- 7 classes, 9 monsters, smallest first (skimmed sizes; none transcribed):
   - Lao-Shan Lung `0xd77ac8`: bits 15-26 OR'd unconditionally; 0 outside the mask (the two calls after it, 0x7db70 /
     0xb07b4, are the only thing left to rule out) (1).
   - Shagaru `0xfc08a8` (uEm071_00, shared with Gore): 26 instructions, L2 M7 only, (7, 0x58) / (7, 0x60) and a bit 6 / 9
     clear; 22 outside, u 260 comes in (1).
   - Kushala `0xdfd19c`: the aura-level table (`P+0x1bb`, `ctl+0x2c / 0x2d`, one literal table word to read); 1 outside,
     no record behind it (1).
   - Kirin `0xd73a18`: L4 M7 by action (a 44-entry jump table) and L2 M4 under `0x6fe88(e, 7, 2)`; 9 outside, u 200 /
     u 201 come in (1).
   - Fatalis line `0xd8aecc`: three variant arms on `e+0xb5f5`; 5 / 5 / 10 outside, every one already exported (3).
   - Teostra `0xe1a9d8`: three motion arms plus `0xa1f0c(e, 2)` / `P+0x1bb`, AND a stop of the handle at `e+0xcacc`
     inside the method; 3 outside, u 285 / 286 / 289 come in (1).
   - Alatreon `0xece27c`: the largest -- two jump tables reaching past the first return, extent open; 9 outside,
     six unexported records come in (1).
4. **Records needing a recorder pass**
   - **Stage-ray records, now recordable** (refused before 2026-10-07; `--apply` / `--record` / `--check`): Kushala c 61 /
     c 62, Chameleos u 240, Shagaru c 101 / c 110 (3).
   - **The unexported records each word brings in** (after step 3): Kirin u 200 / 201, Teostra u 285 / 286 / 289,
     Alatreon u 200 / 231 / 240 / 450 / 451 / 550, Shagaru u 260 (4).
   - **Kushala's wind barrier**: re-model (ids 1004..1007 -> u 210 / 220 / 230 / 240 by `ctl+0x2c` and the snow-map byte
     `ctl+0x2d`, held while alive -- READ, board 2026-09-14) and re-record for placement MODE 4 (the camera chain built for
     Nakarkos, 2026-10-05; the board's open "re-record the other mode-4 records") (1).
   - **Nakarkos's class records c 800 (x3, L3 M65) and c 1600 / c 1601 ((10, 0x6a))**: READ (dev/em084-class-effects.md
     3 / 4), not exported (1).
5. **Undecoded, or a new runtime**
   - **States reads -- no `states-<mon>.md` exists** for em012, em013, em024, em025, em027, em058, em071/072, em086: the
     paralysis / sleep / stun / shock-trap / exhaust clips (c 1101-1105, c 1109) and the part-break ladders (u 1000 /
     u 1001) of **Lao-Shan (breaks only), Fatalis x3, Kushala, Chameleos, Teostra, Amatsu, Shagaru, Valstrax** (10). Each
     row is then config (`every: [[c, 1105], 42]` on the (10, 0x6e) clip, as on the dromes), but the clips are unread.
     efx/agents/notice-scratch/probe.py + scr.py resolve status-10 scripts.
   - **CUT_TAIL** (u 900 / u 905): **Kushala, Chameleos, Teostra, Amatsu, Shagaru, Valstrax** (6). Every tail glb is
     staged; the sever joint (`+0x1477`, the kind byte at the class's `bl 0xc2274`) and the sever clip are UNREAD for all six.
   - **Own rage-puff picks** (vt+0x2a4 overrides, as Akantor / Ukanlos / Rathian have): Fatalis line `0xd7e800` (3),
     Chameleos `0xe025f0`, Shagaru `0xfbec80` (`P+0x5d04 = 4` on all three) (5).
   - **Own rage puffs, the shared one switched off** (`e+0xb7d2 = 0` in vt+0x1d8; 1120 / 1121 in the class table --
     Alatreon's pattern): **Amatsu, Valstrax** (2). Their class code's request sites are unread.
   - **Kirin's lightning aura** (u 0 / u 60 / u 61): READ (states-em011_00.md 5.2); needs a small periodic class driver
     (calm record, two enraged periods, the motion-suppress list, the horn gate) and the `clip` tag dropped (1).
   - **Nakarkos u 1400**: the shared one-shot latch 0xadc98; its gate bits (`+0x1404` bits 20 / 21, `+0x1408` bit 0)
     are UNREAD -- one shared read that serves every latch monster (1 here).
   - **Nakarkos's 32 tentacle PSL records**: PHASE 3 of the Tentacle Form item -- the arm as an effect parent for PSL clip
     effects (enable method 0x107f0e4 READ) (1).

## Outside this method: class-table keys not exported

efx/class-effects.json's id->key tables, against what docs/effects holds (a key match in either pel; the trap in rom-map
"class-effects.json OVER-REPORTS request sites" applies to its site lists, e.g. uEm012_00 and uEm025_00 list sites in
uEm013_00's and uEm027_00's bands): Lao-Shan 1600-1602; Fatalis 1600 / 1601; Kushala 1 (and the barrier's UNIQUE 210 /
230, above); Teostra 1, 160-165, 170-173 (1 / 2 / 3 removed on Raven's call; 160-165 are type-25 rows); Alatreon 11, 12,
37-40, 530, 531; Amatsu 0-3, 102, 1600, 1601; Nakarkos 3, 800, 1600, 1601; Valstrax 130. Kirin's {0, 60, 61} and
Shagaru's {30, 31} are all exported. These are the class-code layer the survey method does not walk; each needs its class's
request sites read.

