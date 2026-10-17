# Flying Wyverns -- effects survey (Viewer agent, 2026-10-14)

Raven: "Start looking over the flying wyverns now ... Check to ensure all effects for each have been implemented. If they have not been implemented, see what effects they have, make a note, then move onto the next monster for the time being."

## How it was measured

- **Exported / firing**: efx/effects_status.py per record (clip bits, shells, rage, MOTION_STATES events, the shared states). Two corrections to its output: c 1100 (Poisoned) and c 1108 (Dung Bombed) are driven by SharedStates from the state toggles -- the classifier returns `wired` for any `event` record before it checks the shared keys -- and the deliberate exclusions are not gaps: blast c 1130-1137, notice c 1200/1201 (off the list), hyper u 1301-1315 (withheld), c 1500 (lying in water), c 1106 (Raven).
- **The PSL enable word**: add_effects.py plan() run twice -- on the blocks' FILE masks (what the viewer binds today for a monster whose class +0x13c is unread) and on the WHOLE blocks (every named bit). The difference is what the game decides with the monster's enemy +0x13f4 word: those bindings may fire in the game and are not bound in the viewer (Boltreaver had 102, Bloodbath 11 C-group + 4 mis-gated). Only Basarios, Bloodbath and Boltreaver have the word read (psl-mask.js PSL_MASK_MONSTERS). `*` = named outside the file mask. A name with no file (`-`) is a bit naming a key that has no record in any array: not an effect.
- **Refusals**: dev/effect-live-soak.mjs <mon> --viewer-inputs, every bound motion in the viewer. A refusal stops every effect of the monster until reload.

## Summary

| # | monster | exported | firing | gaps (undriven, not deliberate) | enable word | bindings outside file mask | PSL records not exported (with a file) | soak |
|---|---|---|---|---|---|---|---|---|
| 1 | Rathian `em001_00` | 74 | 54 | -- | **unread** | 57 | u201 u202 u221 u502 u503 u510 | clean |
| 2 | Gold Rathian `em001_02` | 77 | 57 | -- | **unread** | 65 | u201 u202 u221 u290 u291 u502 u503 u510 u522 u523 u541 u542 | clean |
| 3 | Dreadqueen Rathian `em001_04` | 85 | 73 | -- | **unread** | 70 | u201 u202 u221 u290 u291 u500 u501 u502 u503 u510 u520 u521 u522 u523 u541 u542 u631 | clean |
| 4 | Rathalos `em002_00` | 69 | 49 | -- | **unread** | 42 | u290 u502 u503 u510 | clean |
| 5 | Silver Rathalos `em002_02` | 79 | 59 | -- | **unread** | 42 | u290 u291 u502 u503 u510 | clean |
| 6 | Dreadking Rathalos `em002_04` | 94 | 82 | -- | **unread** | 42 | u290 u291 u502 u503 u510 u522 u523 | clean |
| 7 | Khezu `em003_00` | 66 | 48 | -- | **unread** | 5 | -- | clean |
| 8 | Basarios `em004_00` | 80 | 59 | c1105(event) u905(event) | read | 0 | -- | clean |
| 9 | Gravios `em005_00` | 75 | 56 | -- | **unread** | 61 | u271 u290 u301 u390 | **2 refused** |
| 10 | Diablos `em007_00` | 68 | 49 | -- | **unread** | 19 | u202 u360 | clean |
| 11 | Bloodbath Diablos `em007_04` | 98 | 81 | u1120(ragePuff) u1121(ragePuff) u900(event) u901(event) u905(event) u906(event) | read | 0 | -- | clean |
| 12 | Tigrex `em032_00` | 63 | 43 | -- | **unread** | 2 | -- | **1 refused** |
| 13 | Grimclaw Tigrex `em032_04` | 66 | 54 | -- | **unread** | 6 | u276 | **1 refused** |
| 14 | Akantor `em033_00` | 74 | 57 | c1104(event) c1105(event) c1109(event) u1120(ragePuff) u1121(ragePuff) u1400(event) | **unread** | 1 | c150 c151 u321 u322 u330 | clean |
| 15 | Nargacuga `em037_00` | 72 | 50 | -- | **unread** | 3 | c50 c52 | clean |
| 16 | Silverwind Nargacuga `em037_04` | 71 | 46 | u0(shell) u1(shell) u10(shell) u11(shell) u12(shell) u2(shell) u20(shell) u21(shell) u23(shell) u3(shell) u30(shell) u31(shell) u4(shell) | **unread** | 4 | c50 c52 | clean |
| 17 | Ukanlos `em038_00` | 70 | 57 | u1120(ragePuff) u1121(ragePuff) | **unread** | 3 | -- | clean |
| 18 | Barioth `em042_00` | 73 | 53 | u905(event) | **unread** | 6 | -- | clean |
| 19 | Seregios `em077_00` | 61 | 42 | c30(shell) | **unread** | 9 | u200 u201 u202 u203 u230 u234 | clean |
| 20 | Astalos `em081_00` | 92 | 72 | c30(shell) | **unread** | 50 | c18 u213 u242 u280 u281 u301 | clean |
| 21 | Boltreaver Astalos `em081_04` | 118 | 107 | -- | read | 0 | -- | clean |

## Per monster

### Rathian (`em001_00`)

- Soak: 101 motions played in the viewer, 0 refused (317 s)
- Enable word **unread**: 57 bindings named outside the file mask (145 file-mask bindings, 202 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c30 exported `cm202_000` (2 model): L4 M8 b8* L4 M8 b11*
  - u200 exported `em001_00_009` (3 model): L2 M5 b0*
  - u201 **not exported** `em001_00_004` (2 billboard, 6 model): L2 M5 b6* L2 M5 b9* L2 M15 b6* L2 M15 b9* L2 M16 b6* L2 M16 b9* L2 M17 b6* L2 M17 b9* +8 more
  - u202 **not exported** `em001_02_000` (2 model): L2 M5 b7* L2 M5 b10* L2 M15 b7* L2 M15 b10* L2 M16 b7* L2 M16 b10* L2 M17 b7* L2 M17 b10* +8 more
  - u221 **not exported** `em001_00_004` (2 billboard, 6 model): L2 M5 b12* L2 M15 b12* L2 M16 b12* L2 M17 b12* L2 M18 b12* L4 M8 b12* L4 M16 b12* L4 M53 b12* +1 more
  - u260 exported `cm202_005` (5 type 2, 27 model): L2 M9 b0*
  - u502 **not exported** `cm202_030` (4 model): L2 M3 b15*
  - u503 **not exported** `cm202_031` (4 model): L2 M4 b15*
  - u510 **not exported** `cm202_030` (4 model): L2 M3 b21*
  - u530 exported `em044_00_000` (5 billboard, 3 polyline, 2 type 2, 10 model, 2 node): L4 M55 b15*
  - named with no record in any array (not effects): c60 c61 u290 u291 u522 u523 u550

### Gold Rathian (`em001_02`)

- Soak: 108 motions played in the viewer, 0 refused (219 s)
- Enable word **unread**: 65 bindings named outside the file mask (166 file-mask bindings, 231 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c30 exported `cm202_000` (2 model): L4 M8 b8* L4 M8 b11*
  - u200 exported `em001_00_009` (3 model): L2 M5 b0*
  - u201 **not exported** `em001_00_004` (2 billboard, 6 model): L2 M5 b6* L2 M5 b9* L2 M15 b6* L2 M15 b9* L2 M16 b6* L2 M16 b9* L2 M17 b6* L2 M17 b9* +8 more
  - u202 **not exported** `em001_02_000` (2 model): L2 M5 b7* L2 M5 b10* L2 M15 b7* L2 M15 b10* L2 M16 b7* L2 M16 b10* L2 M17 b7* L2 M17 b10* +8 more
  - u221 **not exported** `em001_00_004` (2 billboard, 6 model): L2 M5 b12* L2 M15 b12* L2 M16 b12* L2 M17 b12* L2 M18 b12* L4 M8 b12* L4 M16 b12* L4 M38 b12 +2 more
  - u230 exported `em001_02_002` (3 model): L4 M18 b6* L4 M18 b9*
  - u231 exported `em001_02_003` (2 billboard, 4 model): L4 M18 b7* L4 M18 b10*
  - u232 exported `em001_02_000` (2 model): L4 M18 b8* L4 M18 b11*
  - u260 exported `cm202_005` (5 type 2, 27 model): L2 M9 b0*
  - u290 **not exported** `em001_02_005` (4 model): L2 M1 b24*
  - u291 **not exported** `em001_02_000` (2 model): L2 M1 b25*
  - u502 **not exported** `cm202_030` (4 model): L2 M3 b15*
  - u503 **not exported** `cm202_031` (4 model): L2 M4 b15*
  - u510 **not exported** `cm202_030` (4 model): L2 M3 b21*
  - u522 **not exported** `cm202_030` (4 model): L2 M3 b18*
  - u523 **not exported** `cm202_031` (4 model): L2 M4 b18*
  - u530 exported `em044_00_000` (5 billboard, 3 polyline, 2 type 2, 10 model, 2 node): L4 M55 b15*
  - u541 **not exported** `cm202_031` (4 model): L4 M50 b21*
  - u542 **not exported** `cm202_030` (4 model): L4 M52 b21*
  - named with no record in any array (not effects): c60 c61 u550 u551 u552 u600 u602

### Dreadqueen Rathian (`em001_04`)

- Soak: 111 motions played in the viewer, 0 refused (359 s)
- Enable word **unread**: 70 bindings named outside the file mask (170 file-mask bindings, 240 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c2 exported `cm202_002` (5 type 2, 20 model): L9 M1 b0*
  - c30 exported `cm202_000` (2 model): L4 M8 b8* L4 M8 b11*
  - c4 exported `cm202_002` (5 type 2, 20 model): L9 M6 b0*
  - c6 exported `cm202_021` (5 type 2, 15 model, 5 node): L9 M21 b0*
  - u200 exported `em001_00_009` (3 model): L2 M5 b0*
  - u201 **not exported** `em001_00_004` (2 billboard, 6 model): L2 M5 b6* L2 M5 b9* L2 M15 b6* L2 M15 b9* L2 M16 b6* L2 M16 b9* L2 M17 b6* L2 M17 b9* +8 more
  - u202 **not exported** `em001_02_000` (2 model): L2 M5 b7* L2 M5 b10* L2 M15 b7* L2 M15 b10* L2 M16 b7* L2 M16 b10* L2 M17 b7* L2 M17 b10* +8 more
  - u221 **not exported** `em001_00_004` (2 billboard, 6 model): L2 M5 b12* L2 M15 b12* L2 M16 b12* L2 M17 b12* L2 M18 b12* L4 M8 b12* L4 M16 b12* L4 M53 b12* +1 more
  - u260 exported `cm202_005` (5 type 2, 27 model): L2 M9 b0*
  - u290 **not exported** `em001_02_005` (4 model): L2 M1 b24*
  - u291 **not exported** `em001_02_000` (2 model): L2 M1 b25*
  - u500 **not exported** `em001_04_001` (4 billboard, 10 model): L9 M2 b15*
  - u501 **not exported** `em001_04_001` (4 billboard, 10 model): L9 M2 b16*
  - u502 **not exported** `em001_04_001` (4 billboard, 10 model): L2 M3 b15*
  - u503 **not exported** `em001_04_001` (4 billboard, 10 model): L2 M4 b15*
  - u510 **not exported** `em001_04_001` (4 billboard, 10 model): L2 M3 b21* L9 M2 b21*
  - u511 exported `em001_04_001` (4 billboard, 10 model): L9 M2 b22*
  - u520 **not exported** `em001_04_001` (4 billboard, 10 model): L9 M2 b18*
  - u521 **not exported** `em001_04_001` (4 billboard, 10 model): L9 M2 b19*
  - u522 **not exported** `em001_04_001` (4 billboard, 10 model): L2 M3 b18*
  - u523 **not exported** `em001_04_001` (4 billboard, 10 model): L2 M4 b18*
  - u530 exported `em001_04_002` (6 billboard, 8 model): L4 M55 b15*
  - u541 **not exported** `em001_04_001` (4 billboard, 10 model): L4 M50 b21*
  - u542 **not exported** `em001_04_001` (4 billboard, 10 model): L4 M52 b21*
  - u550 exported `em001_04_002` (6 billboard, 8 model): L4 M55 b18*
  - u630 exported `em002_04_004` (5 model): L9 M8 b1*
  - u631 **not exported** `em001_04_005` (1 billboard, 4 model): L9 M9 b1*
  - named with no record in any array (not effects): c60 c61

### Rathalos (`em002_00`)

- Soak: 109 motions played in the viewer, 0 refused (280 s)
- Enable word **unread**: 42 bindings named outside the file mask (174 file-mask bindings, 216 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - u200 exported `em001_00_009` (3 model): L2 M5 b0* L4 M48 b12*
  - u201 exported `em001_00_004` (2 billboard, 6 model): L2 M5 b6* L2 M5 b9* L2 M15 b6* L2 M15 b9* L2 M16 b6* L2 M16 b9* L2 M17 b6* L2 M17 b9* +3 more
  - u202 exported `em001_02_000` (2 model): L2 M5 b7* L2 M5 b10* L2 M15 b7* L2 M15 b10* L2 M16 b7* L2 M16 b10* L2 M17 b7* L2 M17 b10* +2 more
  - u221 exported `em001_00_004` (2 billboard, 6 model): L2 M5 b12* L2 M15 b12* L2 M16 b12* L2 M17 b12* L2 M18 b12*
  - u260 exported `cm202_005` (5 type 2, 27 model): L2 M9 b0*
  - u290 **not exported** `em001_02_005` (4 model): L2 M1 b24*
  - u321 exported `em002_00_002` (2 billboard, 5 model): L4 M42 b2*
  - u380 exported `em002_00_004` (2 billboard, 1 model): L4 M42 b3* L4 M43 b3*
  - u502 **not exported** `cm202_030` (4 model): L2 M3 b15*
  - u503 **not exported** `cm202_031` (4 model): L2 M4 b15*
  - u510 **not exported** `cm202_030` (4 model): L2 M3 b21*
  - named with no record in any array (not effects): c60 c61 u291 u522 u523

### Silver Rathalos (`em002_02`)

- Soak: 113 motions played in the viewer, 0 refused (288 s)
- Enable word **unread**: 42 bindings named outside the file mask (186 file-mask bindings, 228 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - u200 exported `em001_00_009` (3 model): L2 M5 b0* L4 M48 b12*
  - u201 exported `em001_00_004` (2 billboard, 6 model): L2 M5 b6* L2 M5 b9* L2 M15 b6* L2 M15 b9* L2 M16 b6* L2 M16 b9* L2 M17 b6* L2 M17 b9* +3 more
  - u202 exported `em001_02_000` (2 model): L2 M5 b7* L2 M5 b10* L2 M15 b7* L2 M15 b10* L2 M16 b7* L2 M16 b10* L2 M17 b7* L2 M17 b10* +2 more
  - u221 exported `em001_00_004` (2 billboard, 6 model): L2 M5 b12* L2 M15 b12* L2 M16 b12* L2 M17 b12* L2 M18 b12*
  - u260 exported `cm202_005` (5 type 2, 27 model): L2 M9 b0*
  - u290 **not exported** `em001_02_002` (3 model): L2 M1 b24*
  - u291 **not exported** `em001_02_000` (2 model): L2 M1 b25*
  - u321 exported `em001_00_004` (2 billboard, 6 model): L4 M42 b2*
  - u380 exported `em002_00_004` (2 billboard, 1 model): L4 M42 b3* L4 M43 b3*
  - u502 **not exported** `cm202_030` (4 model): L2 M3 b15*
  - u503 **not exported** `cm202_031` (4 model): L2 M4 b15*
  - u510 **not exported** `cm202_030` (4 model): L2 M3 b21*
  - named with no record in any array (not effects): c60 c61 u522 u523 u600 u602

### Dreadking Rathalos (`em002_04`)

- Soak: 129 motions played in the viewer, 0 refused (324 s)
- Enable word **unread**: 42 bindings named outside the file mask (206 file-mask bindings, 248 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - u200 exported `em001_00_009` (3 model): L2 M5 b0* L4 M48 b12*
  - u201 exported `em001_00_004` (2 billboard, 6 model): L2 M5 b6* L2 M5 b9* L2 M15 b6* L2 M15 b9* L2 M16 b6* L2 M16 b9* L2 M17 b6* L2 M17 b9* +3 more
  - u202 exported `em001_02_000` (2 model): L2 M5 b7* L2 M5 b10* L2 M15 b7* L2 M15 b10* L2 M16 b7* L2 M16 b10* L2 M17 b7* L2 M17 b10* +2 more
  - u221 exported `em001_00_004` (2 billboard, 6 model): L2 M5 b12* L2 M15 b12* L2 M16 b12* L2 M17 b12* L2 M18 b12*
  - u260 exported `cm202_005` (5 type 2, 27 model): L2 M9 b0*
  - u290 **not exported** `em001_02_005` (4 model): L2 M1 b24*
  - u291 **not exported** `em001_02_000` (2 model): L2 M1 b25*
  - u321 exported `em001_00_004` (2 billboard, 6 model): L4 M42 b2*
  - u380 exported `em002_00_004` (2 billboard, 1 model): L4 M42 b3* L4 M43 b3*
  - u502 **not exported** `cm202_030` (4 model): L2 M3 b15*
  - u503 **not exported** `cm202_031` (4 model): L2 M4 b15*
  - u510 **not exported** `cm202_030` (4 model): L2 M3 b21*
  - u522 **not exported** `cm202_030` (4 model): L2 M3 b18*
  - u523 **not exported** `cm202_031` (4 model): L2 M4 b18*
  - named with no record in any array (not effects): c60 c61

### Khezu (`em003_00`)

- Soak: 63 motions played in the viewer, 0 refused (87 s)
- Enable word **unread**: 5 bindings named outside the file mask (150 file-mask bindings, 155 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c30 exported `cm202_001` (5 type 2, 20 model): L2 M5 b0*
  - u261 exported `em003_00_001` (1 polyline, 7 model): L2 M37 b15*
  - u262 exported `em003_00_002` (1 billboard, 1 polyline, 7 model): L2 M5 b9* L2 M13 b6* L2 M13 b9*

### Basarios (`em004_00`)

- Soak: 78 motions played in the viewer, 0 refused (168 s)
- Enable word read: every named PSL bit is bound as the class gives it.
- Exported but undriven (not deliberate): c1105(event) u905(event)

### Gravios (`em005_00`)

- Soak: 71 motions played in the viewer, 2 refused (170 s)
  - REFUSED: `L4 Motion[59]: 120 frames, 6 started, up to 6 running, 1688 draws, 1574 model draws on a regrouped mesh REFUSED: unverified path: 0x9b76e4 falls into unrecorded`
  - REFUSED: `L4 Motion[60]: 166 frames, 8 started, up to 6 running, 1925 draws, 1637 model draws on a regrouped mesh REFUSED: unverified path: 0x9b76e4 falls into unrecorded`
- Enable word **unread**: 61 bindings named outside the file mask (154 file-mask bindings, 215 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c120 exported `cm202_022` (5 model, 10 node): L2 M12 b0*
  - u230 exported `em005_00_001` (3 billboard, 2 type 2, 10 model): L2 M46 b9* L2 M46 b12* L2 M50 b12* L2 M54 b2* L2 M55 b6* L2 M55 b9* L2 M55 b12*
  - u232 exported `em005_00_001` (3 billboard, 2 type 2, 10 model): L2 M31 b0* L2 M32 b0* L2 M33 b0* L2 M34 b0* L2 M35 b0*
  - u240 exported `em005_00_001` (3 billboard, 2 type 2, 10 model): L2 M50 b6* L2 M50 b9*
  - u241 exported `em005_00_001` (3 billboard, 2 type 2, 10 model): L2 M50 b7* L2 M50 b10*
  - u242 exported `em005_00_001` (3 billboard, 2 type 2, 10 model): L2 M50 b8* L2 M50 b11* L2 M50 b14*
  - u251 exported `em005_00_001` (3 billboard, 2 type 2, 10 model): L2 M24 b13* L2 M25 b13* L2 M26 b13* L2 M27 b13* L2 M28 b13* L2 M29 b13* L2 M46 b13* L2 M50 b13* +1 more
  - u260 exported `em004_00_002` (4 billboard, 10 model): L2 M3 b15* L2 M24 b23* L2 M31 b15* L2 M32 b15* L2 M33 b23* L4 M59 b23*
  - u261 exported `em004_00_002` (4 billboard, 10 model): L2 M24 b24* L2 M24 b30* L2 M32 b1* L4 M59 b24* L4 M59 b30*
  - u270 exported `em004_00_002` (4 billboard, 10 model): L2 M24 b29* L2 M31 b19* L2 M32 b19* L2 M33 b29* L4 M59 b29*
  - u271 **not exported** `em004_00_002` (4 billboard, 10 model): L2 M3 b19*
  - u290 **not exported** `em004_00_002` (4 billboard, 10 model): L2 M3 b17*
  - u301 **not exported** `em004_00_002` (4 billboard, 10 model): L2 M3 b21*
  - u380 exported `em004_00_002` (4 billboard, 10 model): L2 M19 b0* L2 M24 b25* L2 M30 b16* L2 M31 b16* L2 M32 b16* L2 M33 b24* L4 M59 b25*
  - u390 **not exported** `em004_00_002` (4 billboard, 10 model): L2 M24 b31* L2 M30 b20* L2 M31 b20* L2 M32 b20* L2 M33 b30* L4 M59 b31*

### Diablos (`em007_00`)

- Soak: 68 motions played in the viewer, 0 refused (137 s)
- Enable word **unread**: 19 bindings named outside the file mask (115 file-mask bindings, 134 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `cm202_001` (5 type 2, 20 model): L0 M5 b24*
  - c1 exported `cm202_001` (5 type 2, 20 model): L0 M5 b25*
  - c2 exported `cm202_002` (5 type 2, 20 model): L0 M7 b24*
  - c3 exported `cm202_002` (5 type 2, 20 model): L0 M7 b25*
  - c30 exported `cm202_000` (2 model): L0 M7 b26*
  - c3000 exported `cm202_080` (8 type 2, 27 model): L3 M20 b23*
  - u202 **not exported** `cm202_035` (3 model): L2 M24 b0*
  - u321 exported `cm202_035` (3 model): L2 M25 b15*
  - u351 exported `em007_00_000` (6 billboard, 5 polyline, 3 type 2, 29 model, 3 node): L2 M19 b0*
  - u360 **not exported** `em007_00_000` (6 billboard, 5 polyline, 3 type 2, 29 model, 3 node): L2 M24 b1*
  - u380 exported `em007_00_001` (5 billboard, 18 model): L2 M15 b0*
  - named with no record in any array (not effects): c60 c61 u910 u911 u912

### Bloodbath Diablos (`em007_04`)

- Soak: 96 motions played in the viewer, 0 refused (209 s)
- Enable word read: every named PSL bit is bound as the class gives it.
- Exported but undriven (not deliberate): u1120(ragePuff) u1121(ragePuff) u900(event) u901(event) u905(event) u906(event)

### Tigrex (`em032_00`)

- Soak: 78 motions played in the viewer, 1 refused (173 s)
  - REFUSED: `L0 Motion[76]: 50 frames, 1 started, up to 2 running, 26 draws, 6 model draws on a regrouped mesh REFUSED: unverified path: 0x9b76e4 falls into unrecorded code `
- Enable word **unread**: 2 bindings named outside the file mask (147 file-mask bindings, 149 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `cm202_020` (5 type 2, 27 model, 5 node): L2 M10 b0*
  - c1 exported `cm202_020` (5 type 2, 27 model, 5 node): L2 M10 b1*

### Grimclaw Tigrex (`em032_04`)

- Soak: 94 motions played in the viewer, 1 refused (156 s)
  - REFUSED: `L0 Motion[76]: 50 frames, 1 started, up to 2 running, 26 draws, 6 model draws on a regrouped mesh REFUSED: unverified path: 0x9b76e4 falls into unrecorded code `
- Enable word **unread**: 6 bindings named outside the file mask (177 file-mask bindings, 183 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `cm202_020` (5 type 2, 27 model, 5 node): L2 M10 b0*
  - c1 exported `cm202_020` (5 type 2, 27 model, 5 node): L2 M10 b1*
  - u270 exported `em032_04_002` (2 model): L9 M16 b6*
  - u271 exported `em032_04_002` (2 model): L9 M16 b9*
  - u274 exported `em032_04_003` (3 billboard, 2 polyline, 1 type 2, 9 model): L9 M9 b1*
  - u276 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L9 M15 b0*

### Akantor (`em033_00`)

- Soak: 46 motions played in the viewer, 0 refused (103 s)
- Enable word **unread**: 1 bindings named outside the file mask (131 file-mask bindings, 132 whole-block).
- Exported but undriven (not deliberate): c1104(event) c1105(event) c1109(event) u1120(ragePuff) u1121(ragePuff) u1400(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c1 exported `cm202_020` (5 type 2, 27 model, 5 node): L3 M25 b0*
  - c150 **not exported** `em033_00_014` (7 billboard, 7 model): L2 M3 b21 L2 M21 b21
  - c151 **not exported** `em033_00_014` (7 billboard, 7 model): L2 M3 b24 L2 M21 b24
  - u321 **not exported** `em033_00_008` (9 billboard, 2 polyline, 7 model): L2 M21 b0
  - u322 **not exported** `em033_00_008` (9 billboard, 2 polyline, 7 model): L2 M12 b0 L2 M13 b0 L2 M15 b1
  - u330 **not exported** `em033_00_005` (2 billboard, 8 model): L2 M12 b1 L2 M13 b1 L2 M15 b0 L2 M21 b1

### Nargacuga (`em037_00`)

- Soak: 61 motions played in the viewer, 0 refused (91 s)
- Enable word **unread**: 3 bindings named outside the file mask (96 file-mask bindings, 99 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c10 exported `cm202_001` (5 type 2, 20 model): L3 M4 b1*
  - c11 exported `cm202_001` (5 type 2, 20 model): L3 M4 b2*
  - c31 exported `cm202_020` (5 type 2, 27 model, 5 node): L0 M38 b1*
  - c50 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M5 b0 L2 M21 b0
  - c52 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M5 b1 L2 M21 b2

### Silverwind Nargacuga (`em037_04`)

- Soak: 65 motions played in the viewer, 0 refused (103 s)
- Enable word **unread**: 4 bindings named outside the file mask (100 file-mask bindings, 104 whole-block).
- Exported but undriven (not deliberate): u0(shell) u1(shell) u10(shell) u11(shell) u12(shell) u2(shell) u20(shell) u21(shell) u23(shell) u3(shell) u30(shell) u31(shell) u4(shell)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c10 exported `cm202_001` (5 type 2, 20 model): L3 M4 b1*
  - c11 exported `cm202_001` (5 type 2, 20 model): L3 M4 b2*
  - c31 exported `cm202_020` (5 type 2, 27 model, 5 node): L0 M38 b1*
  - c50 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M5 b0 L2 M21 b0
  - c52 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M5 b1 L2 M21 b2
  - c61 exported `cm202_021` (5 type 2, 15 model, 5 node): L9 M6 b0*

### Ukanlos (`em038_00`)

- Soak: 45 motions played in the viewer, 0 refused (146 s)
- Enable word **unread**: 3 bindings named outside the file mask (153 file-mask bindings, 156 whole-block).
- Exported but undriven (not deliberate): u1120(ragePuff) u1121(ragePuff)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c1 exported `cm202_020` (5 type 2, 27 model, 5 node): L3 M25 b0*
  - c71 exported `cm202_020` (5 type 2, 27 model, 5 node): L0 M2 b21*
  - u350 exported `em038_00_005` (1 billboard, 2 model): L2 M34 b9*
  - named with no record in any array (not effects): u321 u331

### Barioth (`em042_00`)

- Soak: 80 motions played in the viewer, 0 refused (100 s)
- Enable word **unread**: 6 bindings named outside the file mask (124 file-mask bindings, 130 whole-block).
- Exported but undriven (not deliberate): u905(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - u324 exported `em042_00_006` (6 billboard, 15 model, 4 node): L2 M33 b17*
  - u325 exported `em042_00_006` (6 billboard, 15 model, 4 node): L2 M32 b17*
  - u330 exported `em042_00_006` (6 billboard, 15 model, 4 node): L2 M32 b16*
  - u331 exported `em042_00_006` (6 billboard, 15 model, 4 node): L2 M32 b15*
  - u340 exported `em042_00_006` (6 billboard, 15 model, 4 node): L2 M33 b16*
  - u341 exported `em042_00_006` (6 billboard, 15 model, 4 node): L2 M33 b15*

### Seregios (`em077_00`)

- Soak: 103 motions played in the viewer, 0 refused (201 s)
- Enable word **unread**: 9 bindings named outside the file mask (139 file-mask bindings, 148 whole-block).
- Exported but undriven (not deliberate): c30(shell)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c21 exported `cm202_021` (5 type 2, 15 model, 5 node): L1 M17 b0*
  - u200 **not exported** `cm202_002` (5 type 2, 20 model): L2 M3 b6*
  - u201 **not exported** `cm202_002` (5 type 2, 20 model): L2 M4 b6* L2 M4 b9*
  - u202 **not exported** `cm202_002` (5 type 2, 20 model): L2 M3 b18*
  - u203 **not exported** `cm202_002` (5 type 2, 20 model): L2 M4 b18*
  - u230 **not exported** `em077_00_000` (4 billboard, 8 model): L2 M20 b6* L2 M20 b9*
  - u234 **not exported** `em077_00_000` (4 billboard, 8 model): L2 M34 b15*

### Astalos (`em081_00`)

- Soak: 117 motions played in the viewer, 0 refused (269 s)
- Enable word **unread**: 50 bindings named outside the file mask (205 file-mask bindings, 255 whole-block).
- Exported but undriven (not deliberate): c30(shell)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c15 exported `em081_00_015` (2 billboard, 1 type 2, 6 model): L2 M30 b1*
  - c17 exported `em081_00_015` (2 billboard, 1 type 2, 6 model): L2 M25 b1* L2 M29 b1*
  - c18 **not exported** `cm202_004` (5 type 2, 21 model): L2 M27 b1*
  - u200 exported `em081_00_003` (1 polyline, 3 model, 1 polygon strip): L2 M22 b16* L2 M22 b25*
  - u201 exported `em081_00_003` (1 polyline, 3 model, 1 polygon strip): L2 M20 b25* L2 M22 b15* L2 M22 b24*
  - u202 exported `em081_00_003` (1 polyline, 3 model, 1 polygon strip): L2 M20 b26* L2 M22 b17* L2 M22 b26*
  - u210 exported `em081_00_012` (1 polyline, 4 model): L2 M33 b6* L2 M33 b9* L2 M34 b6* L2 M34 b9* L2 M35 b6* L2 M35 b9*
  - u211 exported `em081_00_012` (1 polyline, 4 model): L2 M33 b12* L2 M34 b12* L2 M35 b12*
  - u212 exported `em081_00_013` (2 polyline, 3 model): L2 M33 b7* L2 M33 b10* L2 M34 b7* L2 M34 b10* L2 M35 b7* L2 M35 b10* L2 M48 b10* L4 M22 b10* +1 more
  - u213 **not exported** `em081_00_013` (2 polyline, 3 model): L2 M33 b13* L2 M34 b13* L2 M35 b13* L2 M48 b13* L4 M22 b13* L4 M48 b13*
  - u240 exported `em081_00_019` (1 billboard, 3 polyline, 6 model): L2 M20 b24*
  - u242 **not exported** `cm202_001` (5 type 2, 20 model): L2 M20 b27*
  - u260 exported `em081_00_004` (4 model): L2 M26 b18* L2 M26 b24*
  - u261 exported `em081_00_004` (4 model): L2 M26 b19* L2 M26 b25*
  - u280 **not exported** `em081_00_004` (4 model): L2 M28 b18* L2 M28 b24*
  - u281 **not exported** `em081_00_004` (4 model): L2 M28 b19* L2 M28 b25*
  - u300 exported `em081_00_016` (1 model): L2 M26 b20* L2 M26 b26*
  - u301 **not exported** `em081_00_016` (1 model): L2 M25 b20* L2 M25 b26*
  - named with no record in any array (not effects): c132

- **CLOSED 2026-10-14 (implementation agent)**: enable word read (variant-0 arm `0x1019ed0..0x1019fcc`: charge-tier bits only, no motion / action) -> psl-mask.js `em081_00`, PSL_MASK_MONSTERS; `--apply` exported c18 u213 u242 u280 u281 u301 and SEQUENCE u300 (the survey's "u300 exported" was the UNIQUE twin) and bound the 50; c 30 / 31 / 32 driven by the per-frame table (SHELL_DATA.em081_00); his own action shells added (u 10 / 100 / 27 / 28 / 30 / 40 / 41). Not modelled, named: rom-map "Astalos -- the PSL enable word's variant-0 arm, his shells".

### Boltreaver Astalos (`em081_04`)

- Soak: 140 motions played in the viewer, 0 refused (359 s)
- Enable word read: every named PSL bit is bound as the class gives it.

## What closing each needs (in the order the gaps recur)

1. **Read the class's PSL enable word** (enemy vt+0x13c; the method that ORs bits 15-31 over the base 0xca170) and transcribe it in psl-mask.js, then add_effects.py --apply / --record / --check -- as done for Basarios (0xd2e0ec), Bloodbath (0xd4532c) and Boltreaver (0x1019eb4). The classes, not the variants, are the unit: Rathian / Gold / Dreadqueen share uEm001_00, the Rathalos line uEm002_00, Diablos / Bloodbath uEm007_00 (read: one word, variant 4 arm), Tigrex / Grimclaw uEm032_00, Nargacuga / Silverwind uEm037_00, Astalos / Boltreaver uEm081_00 (read for variant 4 only; variant 0 ORs the charge-keyed bits 15-29, unread).
2. **The 0x9b76e4 refusal** (Gravios L4 M59/M60, Tigrex and Grimclaw L0 M76): one unrecorded path, record and lift.
3. **Undriven non-deliberate records** listed per monster (shells with no SHELL_DATA driver -- Silverwind's 13; MOTION_STATES rows missing for state events; rage puffs on monsters not in _autoOnRage).
