# Carapaceons and Neopterons -- effects survey (survey agent for the Viewer agent, 2026-10-15)

Raven: "For each category of large monster remaining, have a sub agent assess the missing effects."

## How it was measured

- **Exported / firing**: efx/effects_status.py per record (clip bits, shells, rage, MOTION_STATES events, the shared states). Two corrections to its output: c 1100 (Poisoned) and c 1108 (Dung Bombed) are driven by SharedStates from the state toggles -- the classifier returns `wired` for any `event` record before it checks the shared keys -- and the deliberate exclusions are not gaps: blast c 1130-1137, notice c 1200/1201 (off the list), hyper u 1301-1315 (withheld), c 1500 (lying in water), c 1106 (Raven). Ahtal-Ka's u 1120 / 1121 are also out: his class switches the shared puff off (below).
- **The PSL enable word**: add_effects.py plan() run twice -- on the blocks' FILE masks (what the viewer binds today for a monster whose class +0x13c is unread) and on the WHOLE blocks (every named bit). The difference is what the game decides with the monster's enemy +0x13f4 word. NEW in this pass, because it is the whole story on five of the seven: **file-mask bindings at bits 15-31**, which the viewer binds with no gate today while the class word decides them in the game (psl-mask.js header). `*` = named outside the file mask. A name with no file (`-`) is a bit naming a key that has no record in any array: not an effect.
- **The word slot**: vt+0x13c read from main.data (VA 0x1728000) at each class's vtable from efx/class-effects.json; controls uEm004_00 `0xd2e0ec`, uEm032_00 `0xca170`, uEm081_00 `0x1019eb4` match.
- **Ailment clips**: efx/agents/notice-scratch/probe.py (class action main under unicorn, em / variant / part / direction set) -> script, efx/agents/cephadrome-scratch/scr.py -> clips. Control: Daimyo's probe returns the scripts states-em019_00.md names (`0x17ae250` trap, `0x17ae050` exhaust, `0x17ae0e8` / `0x17ae110` stun by direction). R (emulated).
- **Refusals**: dev/effect-live-soak.mjs <mon> --viewer-inputs through the shared two-slot lock, every bound motion in the viewer. A refusal stops every effect of the monster until reload.

## Summary

| # | monster | exported | firing | gaps (undriven, not deliberate) | enable word | bindings outside file mask | file-mask bits 15-31 (ungated) | PSL records not exported (with a file) | soak |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Daimyo Hermitaur `em019_00` | 71 | 53 | c1105(event) | `0xdc0ff4` override **unread** | 0 | 36 | -- | clean |
| 2 | Stonefist Hermitaur `em019_04` | 79 | 59 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1120(ragePuff) u1121(ragePuff) u1400(event) | `0xdc0ff4` override **unread** | 0 | 48 | -- | clean |
| 3 | Shogun Ceanataur `em020_00` | 62 | 36 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1120(ragePuff) u1121(ragePuff) u1400(event) | `0xdc5ac4` (read) -> `0xdc0ff4` **unread** | 0 | 36 | -- | clean |
| 4 | Rustrazor Ceanataur `em020_04` | 72 | 52 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1120(ragePuff) u1121(ragePuff) u1400(event) | `0xdc5ac4` (read) -> `0xdc0ff4` **unread** | 0 | 44 | -- | clean |
| 5 | Seltas Queen `em069_00` | 83 | 63 | c1104(event) | `0xf99960` read this pass, not transcribed | 0 | 11 | c101 c151 c152 c153 c160 c161 u350 u400 | clean |
| 6 | Seltas `em076_00` | 50 | 35 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1000(event) u1120(ragePuff) u1121(ragePuff) | base `0xca170` (no override) | 1 | 0 | u290 | clean |
| 7 | Ahtal-Ka `em088_00` | 60 | 42 | c1101(event) c1102(event) c1103(event) c1104(event) c1109(event) u1001(event) | `0x10bc340` read -> `0x6d1b4` **unread** | 64 | 59 | u207 u222 u229 u450 u451 u452 u460 u461 u462 u540 | **29 refused** |

## Carapaceons

### Daimyo Hermitaur (`em019_00`)

- Soak: 69 motions played in the viewer, 0 refused (129 s)
- Enable word `0xdc0ff4` override **unread**: 0 bindings named outside the file mask (119 file-mask bindings, 119 whole-block); 36 file-mask bindings at bits 15-31.
- Exported but undriven (not deliberate): c1105(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - named with no record in any array (not effects): u381 u392 u402 u403 u510
- **c 1105 (shock trap)**: (10, 0x6e) = script `0x17ae250` -- L3 M2 to f40 (`P+0x568 = 40`), then the L3 M10 hold (states-em019_00.md line 53 and 675; probe control this pass: the same script). L3 M2 already carries the `[D_CLAW_P, D_CLAW_M, D_EXHAUST]` cycle, so the row is a fourth arm `{ every: [['em019_00c', 1105], 42] }` -- the Rath line's shape (motion-states.js "THE SHOCK TRAP ... withdrawn"). Config only.
- Enable word: `0xdc0ff4` (shared with Stonefist and, through Shogun's `0xdc5ac4`, with the Ceanataurs). Zero bindings outside the file mask, but **36 file-mask bindings at bits 15-31 are bound today with no class gate** -- the read gates them (L2 30, L3 6), it adds nothing.

### Stonefist Hermitaur (`em019_04`)

- Soak: 80 motions played in the viewer, 0 refused (168 s)
- Enable word `0xdc0ff4` override **unread**: 0 bindings named outside the file mask (139 file-mask bindings, 139 whole-block); 48 file-mask bindings at bits 15-31.
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1120(ragePuff) u1121(ragePuff) u1400(event)
- **No MOTION_STATES block.** The class is Daimyo's and the probe gives **the same six ailment scripts for em 0x13 variant 4 as for variant 0** (`0x17ae050` / `0x17adf60` / `0x17adf70` / `0x17adf90` / `0x17ae0e8` + `0x17ae110` by direction / `0x17ae250`), so Daimyo's rows carry over on Stonefist's own L3 list (he ships `em019_04_3` and `_9`; lists 0 and 2 are em019_00's): c 1109 + c 1105 on the L3 M2 cycle, c 1102 every 90 on L0 M16 (puffOff), c 1101 every 60 on L3 M10, c 1103 hold on L3 M4..M9, u 1400 hold on L0 M4 (rom-map u 1400 sweep: site `0xdbb68c`, helper `0xdbb304`, shared by both crab classes). c records are `em019_00c`, u records `em019_04u`.
- **Rage puff**: RAGE_PUFF + `_autoOnRage` -- vt+0x2a4 = base stub `0x6bf64` (`pick: () => 0`), no `e+0xb7d2` write in the band (scan this pass); u 1120 / 1121 em019_00_003 as Daimyo's. **Tired drool**: TIRED_DROOL `['em019_00c', 1104]` (no `e+0xb7d3` writer in the band).
- His **break records are in the .pel and not exported** (silent until a MOTION_STATES row names them and --states runs): em019_04u 1010 1011 1016 1021 1026 1031 -- by the shared break index (0xa442c: part x 5 + level + 6) the shell at levels 1 / 2, parts 3 and 4 (the leg pairs, which Daimyo does not break) and the two claws at level 2. The sets need his own .dtp / .mpm read (the Daimyo note: Stonefist reads .dtp row 4 that Daimyo's file lacks, sets up to 0xb).
- Enable word: 48 file-mask bindings at bits 15-31 bound ungated (12 of them on L9); several of `0xdc0ff4`'s arms test `e+0xb5f4 == 0x13 && e+0xb5f5 == 4` -- i.e. Stonefist only.

### Shogun Ceanataur (`em020_00`)

- Soak: 59 motions played in the viewer, 0 refused (116 s)
- Enable word `0xdc5ac4` (read) -> `0xdc0ff4` **unread**: 0 bindings named outside the file mask (126 file-mask bindings, 126 whole-block); 36 file-mask bindings at bits 15-31.
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1120(ragePuff) u1121(ragePuff) u1400(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - named with no record in any array (not effects): u211 u232 u233 u234 u350 u360 u370 u392 u402 u403 u502 u503 u610 u611
- **No MOTION_STATES block** (`em020_00` in motion-states.js is CLIP_TURNS / SHELL_PARTS only). The probe, this pass (em 0x14, variants 0 and 4 identical): exhaust (10, 0x1b) `0x17aef60` = L3 M2 -> L3 M3; sleep (10, 0x1d) `0x17aee70` L3 M11, hold (10, 0x1e) `0x17aee80` L0 M16; paralysis (10, 0x1f) `0x17aeea0` L3 M10 hold; stun (10, 0x20) `0x17af008` L3 M5 -> M7 (hold) -> M9, direction 2 `0x17af030` L3 M4 -> M6 -> M8; shock trap (10, 0x6e) `0x17af180` L3 M2 to f40 -> L3 M10 hold. **Daimyo's layout exactly**, so his rows transcribe with `em020_00c` / `em020_00u`: L3 M2 a cycle `[{ start: c 1109 }, { every: c 1105, 42 }]`, L3 M10 c 1101 every 60, L0 M16 c 1102 every 90 puffOff, L3 M4..M9 c 1103 hold, L0 M4 u 1400 hold (`0xdbb68c`).
- Rage puff and tired drool: config, as Stonefist (vt+0x2a4 base stub; no b7d2 / b7d3 writer in `0xdb3f7c..0xdcd604`).
- Unexported break records in the .pel: em020_00u 1011 1025 1030 (part 2 level 2, parts 5 / 6 level 1) -- a breaks read.
- Enable word: `0xdc5ac4` (extent `..0xdc5bfc`) calls `0xdc0ff4` first (`bl` at `0xdc5ad0`), then: variant 0 -- L2 M11 (0x20b) / L2 M68-69 (0x244, 0x245) bits 18-19, L4 M3 (0x403) bits 21-22; variant 4 -- those and L9 M9-10 (0x909, 0x90a) take bits 18 / 19 or 21 / 22 by `e+0xcadc == 4` and `[P+0x3b4]` bits 0x2000 / 0x4000 (meaning of both UNREAD; INFERRED shell-break bits after Daimyo's vt+0x24c). 36 file-mask bindings at bits 15-31 bound ungated.

### Rustrazor Ceanataur (`em020_04`)

- Soak: 81 motions played in the viewer, 0 refused (117 s)
- Enable word `0xdc5ac4` (read) -> `0xdc0ff4` **unread**: 0 bindings named outside the file mask (164 file-mask bindings, 164 whole-block); 44 file-mask bindings at bits 15-31.
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1120(ragePuff) u1121(ragePuff) u1400(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - named with no record in any array (not effects): u211 u350 u360 u370 u392 u402 u403
- Everything as Shogun (the same class, the same scripts for variant 4; lists 0-5 are em020_00's, he ships only `_9`). Records `em020_00c` / `em020_04u`. 44 file-mask bindings at bits 15-31 bound ungated (8 on L9).

## Neopterons

### Seltas Queen (`em069_00`)

- Soak: 85 motions played in the viewer, 0 refused (199 s)
- Enable word `0xf99960` read this pass, not transcribed: 0 bindings named outside the file mask (161 file-mask bindings, 161 whole-block); 11 file-mask bindings at bits 15-31.
- Exported but undriven (not deliberate): c1104(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c101 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L4 M66 b1 L4 M69 b1 L4 M70 b1 L4 M82 b0 L4 M83 b0 L4 M84 b0 L4 M85 b0 L4 M86 b0 +5 more
  - c151 **not exported** `cm202_002` (5 type 2, 20 model): L4 M36 b2
  - c152 **not exported** `cm202_002` (5 type 2, 20 model): L4 M39 b1
  - c153 **not exported** `cm202_002` (5 type 2, 20 model): L4 M47 b2
  - c160 **not exported** `cm202_002` (5 type 2, 20 model): L4 M37 b2
  - c161 **not exported** `cm202_002` (5 type 2, 20 model): L4 M46 b2
  - u350 **not exported** `em069_00_018` (1 billboard, 4 model): L4 M36 b1 L4 M37 b1 L4 M46 b1 L4 M47 b1
  - u400 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L4 M36 b0 L4 M37 b0 L4 M46 b0 L4 M47 b0 L4 M78 b0
- **c 1104 (tired drool)**: TIRED_DROOL `em069_00: ['em069_00c', 1104]` -- states-em069_00.md section 5 settles it (cm200_006, joint 1; the class writes neither `e+0xb7d2` nor `+0xb7d3`, line 133). Config only.
- **The 8 unexported records** (c 101, 151, 152, 153, 160, 161, u 350, u 400) are all bits 0-2 of her L4 duo motions, plan "ok / ok" today: they are the board's stage-ray list entry `em069_00(8)` (0x42744 -> 0x18154c), refused before 2026-10-07 and recordable now -> `--apply` / `--record` / `--check`.
- **Enable word `0xf99960`, read whole this pass** (extent `0xf99960..0xf99a64`; `0xca170` first): L4 M71-M75 (0x447..0x44b) while `[P+0x1bb] & 1` (the Seltas link flag, board "Seltas Queen + Seltas duo form") -> bits 18-20; L0 M8 (the burrow, u 1400's clip) unless `0x81d6c` (sunk) -> bits 15-16; L0 M16: action (1, 0x1c) ? bit 22 : bit 21 (c 240 / u 440 both fire today); L3 M2 in action (10, 7) with `0x9e8d8` (the part) == 6 and byte `e+0xcad0` != 0 -> bits 24-26 (`e+0xcad0` meaning UNREAD); anything else nothing. 11 file-mask bindings at bits 15-31 bound ungated today; 0 outside. Transcription only.

### Seltas (`em076_00`)

- Soak: 48 motions played in the viewer, 0 refused (76 s)
- Enable word base `0xca170` (no override): 1 bindings named outside the file mask (65 file-mask bindings, 66 whole-block); 0 file-mask bindings at bits 15-31.
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1000(event) u1120(ragePuff) u1121(ragePuff)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - u290 **not exported** `em010_00_000` (3 model): L2 M10 b13*
- **No MOTION_STATES block.** Probe (em 0x4c): exhaust (10, 0x1b) `0x17e7000` L3 M9; sleep (10, 0x1d) `0x17e6fd0` L3 M14, hold (10, 0x1e) `0x17e6fe0` **L0 M19**; paralysis (10, 0x1f) `0x17e6fb0` L3 M13 hold; stun (10, 0x20) `0x17e7168` (not sided) L3 M26 -> **L0 M19** (hold) -> L0 M20; shock trap (10, 0x6e) `0x17e7230` L3 M1 to f60 -> L3 M13 hold. Break reaction (10, 7): parts 0 and 7 -> `0x17e6ef0` L3 M2, parts 1-6 -> `0x17e6f00` L3 M1 (also the trap's start). **L0 M19 is both the sleep hold and the stun hold** -- one row has to choose (Raven's call).
- **u 1000** = part 0 break level 1 (triage: shared `0xa449c` / `0xa442c`, id part x 5 + level + 6) on L3 M2: needs his .dtp / .mpm sets for the `levels` spec (a breaks read).
- Rage puff (vt+0x2a4 base stub, no b7d2 writer in `0xfc40ec..0xfd963c`) and tired drool: config.
- **Enable word: base `0xca170`** -> `() => 0` + --apply: brings **u 290** (em010_00_000, L2 M10 bit 13 -- the tired group) in, and gates the **12 state-group bindings that all fire together today** (L2 M17 / M57 u 200 + u 210, L4 M33 / M34 u 201 + u 211 on bits 6 / 9 / 12: calm, enraged and tired versions at once).

### Ahtal-Ka (`em088_00`)

- Soak: 49 motions played in the viewer, 29 refused (102 s)
  - REFUSED: `L0 Motion[5]: 2 frames, 1 started, up to 1 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:100(clip)x1 em088_0`
  - REFUSED: `L0 Motion[6]: 2 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:0(clip)x1]`
  - REFUSED: `L0 Motion[7]: 20 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:10(clip)x1]`
  - REFUSED: `L0 Motion[23]: 18 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:6(clip)x1]`
  - REFUSED: `L0 Motion[24]: 18 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:6(clip)x1]`
  - REFUSED: `L0 Motion[25]: 18 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:6(clip)x1]`
  - REFUSED: `L0 Motion[26]: 18 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:6(clip)x1]`
  - REFUSED: `L0 Motion[27]: 27 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:6(clip)x1]`
  - REFUSED: `L2 Motion[2]: 101 frames, 1 started, up to 1 running, 11 draws, 6 model draws on a regrouped mesh REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc`
  - REFUSED: `L2 Motion[3]: 103 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00u:241(clip)x1]`
  - REFUSED: `L2 Motion[4]: 354 frames, 15 started, up to 11 running, 6527 draws, 3164 model draws on a regrouped mesh REFUSED: unverified path: 0xaf859c in L_af82f4 [alive: `
  - REFUSED: `L2 Motion[14]: 210 frames, 4 started, up to 4 running, 893 draws REFUSED: unverified path: 0xaf859c in L_af82f4 [alive: em088_00u:250(clip)x1 em088_00u:260(clip`
  - REFUSED: `L2 Motion[16]: 77 frames, 4 started, up to 3 running, 453 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00u:250(clip)x3 em0`
  - REFUSED: `L2 Motion[20]: 180 frames, 4 started, up to 3 running, 1304 draws REFUSED: unverified path: 0xaf859c in L_af82f4 [alive: em088_00u:250(clip)x1 em088_00u:290(cli`
  - REFUSED: `L2 Motion[23]: 201 frames, 9 started, up to 6 running, 1944 draws, 344 model draws on a regrouped mesh REFUSED: unverified path: 0xaf859c in L_af82f4 [alive: em`
  - REFUSED: `L2 Motion[35]: 91 frames, 1 started, up to 1 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:10(clip)x1]`
  - REFUSED: `L2 Motion[36]: 279 frames, 9 started, up to 5 running, 4138 draws, 1462 model draws on a regrouped mesh REFUSED: unverified path: 0xaf859c in L_af82f4 [alive: e`
  - REFUSED: `L2 Motion[38]: 179 frames, 6 started, up to 7 running, 1640 draws REFUSED: unverified path: 0xaf859c in L_af82f4 [alive: em088_00u:250(clip)x1 em088_00u:291(cli`
  - REFUSED: `L2 Motion[39]: 129 frames, 6 started, up to 5 running, 2025 draws, 1185 model draws on a regrouped mesh REFUSED: unverified path: 0x44158 branch to unrecorded 0`
  - REFUSED: `L2 Motion[41]: 224 frames, 5 started, up to 4 running, 2520 draws, 774 model draws on a regrouped mesh REFUSED: unverified path: 0xaf859c in L_af82f4 [alive: em`
  - REFUSED: `L3 Motion[1]: 34 frames, 1 started, up to 2 running, 105 draws, 19 model draws on a regrouped mesh REFUSED: unverified path: 0x44158 branch to unrecorded 0x441c`
  - REFUSED: `L3 Motion[2]: 46 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:5(clip)x1]`
  - REFUSED: `L3 Motion[4]: 21 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:5(clip)x1]`
  - REFUSED: `L3 Motion[8]: 60 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:6(clip)x1]`
  - REFUSED: `L3 Motion[15]: 171 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:5(clip)x1]`
  - REFUSED: `L3 Motion[19]: 38 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x9bbb4c node transform mode 3 [alive: em088_00u:480(clip)x1]`
  - REFUSED: `L3 Motion[23]: 64 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:5(clip)x1]`
  - REFUSED: `L3 Motion[27]: 35 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:5(clip)x1]`
  - REFUSED: `L3 Motion[29]: 247 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em088_00c:6(clip)x1]`
- Enable word `0x10bc340` read -> `0x6d1b4` **unread**: 64 bindings named outside the file mask (142 file-mask bindings, 206 whole-block); 59 file-mask bindings at bits 15-31.
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1109(event) u1001(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c5 exported `em087_00_004` (6 billboard, 3 model): L3 M3 b0*
  - c6 exported `em087_00_004` (6 billboard, 3 model): L2 M17 b1* L3 M7 b0*
  - u201 exported `em088_00_000` (2 billboard, 2 polyline, 4 type 2, 14 model): L2 M12 b15*
  - u206 exported `em087_00_004` (6 billboard, 3 model): L2 M20 b3* L2 M20 b15*
  - u207 **not exported** `em088_00_002` (1 billboard, 6 model, 1 node): L2 M39 b5*
  - u210 exported `em088_00_000` (2 billboard, 2 polyline, 4 type 2, 14 model): L2 M11 b19*
  - u211 exported `em088_00_000` (2 billboard, 2 polyline, 4 type 2, 14 model): L2 M23 b19* L2 M39 b19*
  - u216 exported `em087_00_004` (6 billboard, 3 model): L2 M20 b18* L2 M39 b20*
  - u220 exported `em088_00_000` (2 billboard, 2 polyline, 4 type 2, 14 model): L2 M11 b22* L2 M17 b22* L2 M42 b2*
  - u221 exported `em088_00_000` (2 billboard, 2 polyline, 4 type 2, 14 model): L2 M42 b1*
  - u222 **not exported** `em088_00_000` (2 billboard, 2 polyline, 4 type 2, 14 model): L2 M23 b22*
  - u226 exported `em087_00_004` (6 billboard, 3 model): L2 M20 b21* L2 M39 b23*
  - u229 **not exported** `em056_00_038` (2 model): L2 M22 b21*
  - u250 exported `em087_00_002` (3 billboard, 7 polyline, 1 model): L2 M2 b15* L2 M2 b18* L2 M2 b21* L2 M3 b15* L2 M3 b18* L2 M3 b21* L2 M9 b18* L2 M11 b15* +11 more
  - u260 exported `em088_00_004` (3 model): L2 M43 b2* L2 M46 b0*
  - u290 exported `em088_00_014` (3 billboard, 1 polyline, 12 model): L2 M4 b3*
  - u420 exported `em088_00_017` (2 billboard, 2 model): L2 M44 b0*
  - u421 exported `em088_00_017` (2 billboard, 2 model): L2 M44 b1* L2 M45 b1*
  - u422 exported `em088_00_017` (2 billboard, 2 model): L2 M10 b23* L2 M12 b18* L2 M12 b23*
  - u423 exported `em088_00_017` (2 billboard, 2 model): L2 M12 b0* L2 M43 b0* L2 M44 b2* L2 M45 b0*
  - u450 **not exported** `em088_00_016` (5 billboard, 4 polyline, 13 model, 2 node): L2 M33 b0*
  - u451 **not exported** `em088_00_016` (5 billboard, 4 polyline, 13 model, 2 node): L2 M30 b27*
  - u452 **not exported** `em088_00_016` (5 billboard, 4 polyline, 13 model, 2 node): L2 M30 b28*
  - u460 **not exported** `em088_00_019` (2 billboard, 3 polyline, 5 model): L3 M3 b24* L3 M4 b24*
  - u461 **not exported** `em088_00_019` (2 billboard, 3 polyline, 5 model): L3 M3 b25* L3 M4 b25* L3 M5 b24* L3 M6 b24*
  - u462 **not exported** `em088_00_019` (2 billboard, 3 polyline, 5 model): L3 M7 b24* L3 M8 b24*
  - u540 **not exported** `em088_00_000` (2 billboard, 2 polyline, 4 type 2, 14 model): L2 M14 b4*
- **The soak refuses 29 of his 49 bound motions** -- every effect of the monster stops at the first until reload. Three unrecorded paths, and **efx/vectors holds no `add_em088_00_*` set at all** (he was --apply'd 2026-09-26 and never recorded or soaked green; Seltas has none either but soaks clean): `0x44158` -> `0x441cc` (21; the same arm Ahtal-Neset refuses on, rom-map row), `0xaf859c` in the vec3 curve `0xaf82f4` (7), `0x9bbb4c` node transform mode 3 (1, L3 M19 u 480). A `--record` / `--check` pass is his FIRST job, before any row or word: nothing added to him shows while these stand.
- **u 1120 / u 1121 are NOT gaps: the class switches the shared rage puff off.** vt+0x1d8 = `0x10b325c` stores 0 to `e+0xb7d2` at `0x10b32b0` (straight-line from entry; r6 = 0 at `0x10b3284`), the byte the shared puff block tests. The only `movw #0xb7d2` in his band (positive control: the scan finds the ctor `0xacc4c` and the known Alatreon / Rajang sites). Close as a named refusal (or drop the two `ragePuff` records).
- **No MOTION_STATES block.** Probe (em 0x58): exhaust (10, 0x1b) `0x1808f20` **L3 M9**; sleep (10, 0x1d) `0x1808f50` L3 M15, hold (10, 0x1e) `0x1808f60` **L3 M16**; paralysis (10, 0x1f) `0x1808f70` L3 M14 hold; stun (10, 0x20) `0x1808ff0` (not sided) L3 M23 -> **L3 M16** (hold) -> L3 M17; shock trap (10, 0x6e) returns with no motion (no c 1105 in his .pel either). Break reaction (10, 7): parts 0 / 2 -> **L3 M9**, 1 / 3 -> L3 M2, 4-6 -> L3 M1, 7 none. **L3 M16 is both sleep hold and stun hold; L3 M9 is both the exhaust and the part 0 / 2 reaction** (a cycle).
- **u 1001** = part 0 break level 2 on L3 M9 -- a breaks read; also unexported in his .pel: u 1006 1010 1016 1017.
- Tired drool: config (no b7d3 writer in `0x10b2f84..0x10c1fc0`), if he tires at all (unread).
- **Enable word `0x10bc340`, read this pass** (extent `..0x10bc414`): it calls **`0x6d1b4`, not `0xca170`**; then by `e+0xcb0c` (0..2) ORs table `0x16a37f4` = {bits 18-20, bits 21-23, bits 15-17} **on every motion** -- the three-way groups his PSL names (L2 M1 u 250 on bits 15 / 18 / 21; L2 M6 u 200 / 210 / 220 ...), so `e+0xcb0c` is a three-way mode (meaning UNREAD); L2 M30 (0x21e) in action (1, 0x1c..0x1f / 0x22..0x25) -> bit 27 or 28 (table `0x16a3800`); any other motion in action (10, 0xaf) -> bits 24-26. **`0x6d1b4`** (shared layer, extent `..0x6d358`; callers ONLY `0x10ad840` (uEm087_00 +0x13c) and `0x10bc34c`): `0xca170`, then walks two lists of 0x2c-byte entries at `[e+0xcacc]+0` / `+4` whose `+8 == 0xd` and `+4 ==` the motion id, calling vt+0x488 / vt+0x484 / `0xb07b4` -- whether those write +0x13f4 is UNREAD. Today 59 file-mask bindings at bits 15-31 fire ungated (all three groups at once) and 64 are outside the mask (10 unexported records come in with it).

## What closing each needs (easiest first)

1. **Config-only rows** (every input read; motion-states.js / effect-mounts.json, then `add_effects.py --states` and --record / --check for the monsters that get a new block):
   - Daimyo **c 1105**: the fourth arm on his L3 M2 cycle (1 monster).
   - Seltas Queen **c 1104**: TIRED_DROOL entry (1).
   - **RAGE_PUFF + `_autoOnRage`** for Stonefist, Shogun, Rustrazor, Seltas (4): vt+0x2a4 is the base stub on all four classes (`pick: () => 0`), no `e+0xb7d2` writer in their bands.
   - **u 1400** hold on L0 M4 for Stonefist, Shogun, Rustrazor (3): rom-map's u 1400 sweep already read the site (`0xdbb68c`) for all four crabs.
   - **Ailment rows from this pass's probes** (c 1101 / 1102 / 1103 / 1105 / 1109): Stonefist, Shogun, Rustrazor take Daimyo's layout clip for clip (3); Seltas and Ahtal-Ka have their own clips above (2) -- with **two choices for Raven**: Seltas L0 M19 and Ahtal-Ka L3 M16 are both the sleep hold and the stun hold.
   - **TIRED_DROOL** for Stonefist, Shogun, Rustrazor, Seltas, Ahtal-Ka (5): no `e+0xb7d3` writer in any band; whether Seltas / Ahtal-Ka / the Ceanataurs tire is the one thing no note settles (the convention leaves an entry out until it is).
   - Ahtal-Ka **u 1120 / 1121**: a named refusal, not a row (class-off, `0x10b32b0`) (1).
2. **Base-only enable word**: Seltas, uEm076_00 = `0xca170` -> `() => 0` + --apply (1): u 290 comes in on the tired bit and his calm / enraged / tired triples stop firing together.
3. **Override enable words**:
   - Seltas Queen `0xf99960` -- **read whole this pass**, transcription only (`e+0xcad0` is the one unread input, one arm) (1).
   - The crabs: **one read serves four** -- uEm019_00 `0xdc0ff4` (extent `..0xdc1474`: a 60-way jump table over L2 M2..M61, an L3 range under mask 0x23d, an L9 range; em / variant tests, bytes of `[[e+0x75f0]+0x64]` against `0x3a8430()` and `0x9d36c(e, n)`, action tests on `e+0x73e0` / `+0x73e1`), and Shogun's own `0xdc5ac4` (read here) on top. No binding outside the mask on any of them: the read GATES 36 / 48 / 36 / 44 bindings that fire ungated today (4).
   - Ahtal-Ka `0x10bc340` (read here) is blocked on **`0x6d1b4`** (its per-motion list, vt+0x484 / +0x488) and the meaning of `e+0xcb0c`; 64 outside the mask, 59 ungated, 10 unexported records ride on it (1).
4. **Recorder pass**: **Ahtal-Ka first** -- 29 of 49 motions refused, no recorded set (`0x44158` arm shared with Ahtal-Neset, `0xaf859c`, `0x9bbb4c` mode 3) (1); Seltas Queen's 8 stage-ray records (--apply / --record / --check, no read needed) (1); Seltas u 290 and Ahtal-Ka's 10 after their words (2).
5. **States reads** (sets and break ladders): Seltas u 1000 and Ahtal-Ka u 1001 (exported); the unexported break records Stonefist 6, Shogun / Rustrazor 3 each, Ahtal-Ka 4 (4 monsters). Ahtal-Ka's class-code layer (the board's 31-record gap, uEm088_00 ids in variables) is outside this survey.
