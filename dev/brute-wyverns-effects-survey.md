# Brute Wyverns -- effects survey (Viewer agent, 2026-10-15)

Raven: "Start looking over the flying wyverns now ... Check to ensure all effects for each have been implemented. If they have not been implemented, see what effects they have, make a note, then move onto the next monster for the time being."

## How it was measured

- **Exported / firing**: efx/effects_status.py per record (clip bits, shells, rage, MOTION_STATES events, the shared states). Two corrections to its output: c 1100 (Poisoned) and c 1108 (Dung Bombed) are driven by SharedStates from the state toggles -- the classifier returns `wired` for any `event` record before it checks the shared keys -- and the deliberate exclusions are not gaps: blast c 1130-1137, notice c 1200/1201 (off the list), hyper u 1301-1315 (withheld), c 1500 (lying in water), c 1106 (Raven).
- **The PSL enable word**: add_effects.py plan() run twice -- on the blocks' FILE masks (what the viewer binds today for a monster whose class +0x13c is unread) and on the WHOLE blocks (every named bit). The difference is what the game decides with the monster's enemy +0x13f4 word: those bindings may fire in the game and are not bound in the viewer (Boltreaver had 102, Bloodbath 11 C-group + 4 mis-gated). Only Basarios, Bloodbath and Boltreaver have the word read (psl-mask.js PSL_MASK_MONSTERS). `*` = named outside the file mask. A name with no file (`-`) is a bit naming a key that has no record in any array: not an effect.
- **Refusals**: dev/effect-live-soak.mjs <mon> --viewer-inputs, every bound motion in the viewer. A refusal stops every effect of the monster until reload.

## Summary

| # | monster | exported | firing | gaps (undriven, not deliberate) | enable word | bindings outside file mask | PSL records not exported (with a file) | soak |
|---|---|---|---|---|---|---|---|---|
| 1 | Deviljho `em043_00` | 62 | 45 | -- | **unread** | 26 | c122 c124 c125 c210 c91 | clean |
| 2 | Savage Deviljho `em043_05` | 58 | 46 | c91(clip) | **unread** | 26 | c122 c124 c125 c210 | clean |
| 3 | Barroth `em044_00` | 68 | 50 | u906(event) | **unread** | 13 | c40 | clean |
| 4 | Uragaan `em045_00` | 64 | 47 | -- | **unread** | 24 | c90 u201 u261 u264 u267 u280 u281 u284 u285 u350 | clean |
| 5 | Crystalbeard Uragaan `em045_04` | 61 | 49 | u906(event) | **unread** | 24 | c90 u201 u240 u261 u264 u267 u280 u281 u284 u285 u350 | clean |
| 6 | Duramboros `em055_00` | 82 | 60 | c1103(event) u1120(ragePuff) u1121(ragePuff) | **unread** | 0 | c212 c60 c62 c63 c72 u310 u311 | clean |
| 7 | Brachydios `em063_00` | 59 | 40 | -- | **unread** | 32 | c120 c121 c140 c141 c210 | clean |
| 8 | Raging Brachydios `em063_05` | 49 | 38 | -- | **unread** | 32 | c120 c121 c140 c141 c210 | clean |
| 9 | Glavenus `em080_00` | 81 | 64 | c0(clip) | **unread** | 24 | c50 c51 c52 c53 u430 u501 | clean |
| 10 | Hellblade Glavenus `em080_04` | 84 | 73 | c0(clip) | **unread** | 30 | c50 c51 c52 c53 u430 u501 u511 | clean |

## Per monster

### Deviljho (`em043_00`)

- Soak: 75 motions played in the viewer, 0 refused (184 s)
- Enable word **unread**: 26 bindings named outside the file mask (180 file-mask bindings, 206 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `cm202_001` (5 type 2, 20 model): L0 M6 b15* L0 M11 b15* L0 M14 b15* L2 M42 b0*
  - c1 exported `cm202_001` (5 type 2, 20 model): L0 M6 b16* L0 M13 b1* L0 M14 b16* L2 M2 b1* L2 M42 b1*
  - c120 exported `cm202_030` (4 model): L2 M19 b15*
  - c122 **not exported** `cm202_030` (4 model): L2 M10 b15*
  - c124 **not exported** `cm202_031` (4 model): L2 M21 b15*
  - c125 **not exported** `cm202_031` (4 model): L2 M20 b15*
  - c210 **not exported** `cm202_006` (5 type 2, 27 model, 5 node): L0 M34 b0*
  - c4 exported `cm202_002` (5 type 2, 20 model): L2 M20 b2*
  - c90 exported `em043_00_009` (5 billboard): L2 M16 b12* L2 M17 b12* L2 M27 b12* L2 M32 b12*
  - c91 **not exported** `em043_00_009` (5 billboard): L2 M10 b13* L2 M16 b13* L2 M17 b13*
  - u200 exported `em043_00_000` (1 billboard, 3 model): L2 M41 b2*
  - u201 exported `em043_00_001` (2 model): L2 M41 b3*
  - u202 exported `em043_00_002` (3 model): L2 M41 b5*
  - u203 exported `em043_00_003` (1 billboard, 2 model): L2 M41 b4*

### Savage Deviljho (`em043_05`)

- Soak: 75 motions played in the viewer, 0 refused (193 s)
- Enable word **unread**: 26 bindings named outside the file mask (180 file-mask bindings, 206 whole-block).
- Exported but undriven (not deliberate): c91(clip)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `cm202_001` (5 type 2, 20 model): L0 M6 b15* L0 M11 b15* L0 M14 b15* L2 M42 b0*
  - c1 exported `cm202_001` (5 type 2, 20 model): L0 M6 b16* L0 M13 b1* L0 M14 b16* L2 M2 b1* L2 M42 b1*
  - c120 exported `cm202_030` (4 model): L2 M19 b15*
  - c122 **not exported** `cm202_030` (4 model): L2 M10 b15*
  - c124 **not exported** `cm202_031` (4 model): L2 M21 b15*
  - c125 **not exported** `cm202_031` (4 model): L2 M20 b15*
  - c210 **not exported** `cm202_006` (5 type 2, 27 model, 5 node): L0 M34 b0*
  - c4 exported `cm202_002` (5 type 2, 20 model): L2 M20 b2*
  - c90 exported `em043_00_009` (5 billboard): L2 M16 b12* L2 M17 b12* L2 M27 b12* L2 M32 b12*
  - c91 exported `em043_00_009` (5 billboard): L2 M10 b13* L2 M16 b13* L2 M17 b13*
  - u200 exported `em043_00_000` (1 billboard, 3 model): L2 M41 b2*
  - u201 exported `em043_00_001` (2 model): L2 M41 b3*
  - u202 exported `em043_00_002` (3 model): L2 M41 b5*
  - u203 exported `em043_00_003` (1 billboard, 2 model): L2 M41 b4*

### Barroth (`em044_00`)

- Soak: 55 motions played in the viewer, 0 refused (117 s)
- Enable word **unread**: 13 bindings named outside the file mask (93 file-mask bindings, 106 whole-block).
- Exported but undriven (not deliberate): u906(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `cm202_001` (5 type 2, 20 model): L0 M3 b27* L0 M4 b27* L0 M6 b27* L3 M23 b1*
  - c1 exported `cm202_001` (5 type 2, 20 model): L0 M3 b28* L0 M4 b28* L0 M6 b28* L2 M11 b1* L3 M23 b0*
  - c2 exported `cm202_002` (5 type 2, 20 model): L0 M13 b27*
  - c3 exported `cm202_002` (5 type 2, 20 model): L0 M13 b28*
  - c40 **not exported** `cm202_031` (4 model): L2 M2 b25*
  - c7 exported `cm202_002` (5 type 2, 20 model): L2 M9 b0*

### Uragaan (`em045_00`)

- Soak: 52 motions played in the viewer, 0 refused (146 s)
- Enable word **unread**: 24 bindings named outside the file mask (107 file-mask bindings, 131 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `cm202_001` (5 type 2, 20 model): L0 M6 b30*
  - c1 exported `cm202_001` (5 type 2, 20 model): L0 M6 b29* L2 M4 b0*
  - c90 **not exported** `cm202_050` (15 model, 2 filter): L0 M11 b15*
  - u201 **not exported** `em045_04_002` (2 model): L2 M1 b25*
  - u230 exported `em045_00_002` (4 billboard, 2 polyline, 16 model): L2 M5 b25* L2 M13 b25* L2 M14 b25*
  - u261 **not exported** `em045_00_004` (4 billboard, 1 type 2, 8 model): L2 M2 b17*
  - u263 exported `em045_00_004` (4 billboard, 1 type 2, 8 model): L2 M2 b21*
  - u264 **not exported** `em045_00_004` (4 billboard, 1 type 2, 8 model): L2 M3 b17* L2 M3 b19*
  - u265 exported `em045_00_004` (4 billboard, 1 type 2, 8 model): L2 M3 b21*
  - u267 **not exported** `em045_00_004` (4 billboard, 1 type 2, 8 model): L2 M2 b27*
  - u280 **not exported** `em045_00_005` (3 billboard, 1 model): L2 M2 b19*
  - u281 **not exported** `em045_00_005` (3 billboard, 1 model): L2 M2 b20*
  - u282 exported `em045_00_005` (3 billboard, 1 model): L2 M2 b23*
  - u283 exported `em045_00_005` (3 billboard, 1 model): L2 M2 b24*
  - u284 **not exported** `em045_00_005` (3 billboard, 1 model): L2 M2 b30*
  - u285 **not exported** `em045_00_005` (3 billboard, 1 model): L2 M2 b31*
  - u350 **not exported** `cm202_035` (3 model): L2 M4 b1*
  - named with no record in any array (not effects): u240

### Crystalbeard Uragaan (`em045_04`)

- Soak: 55 motions played in the viewer, 0 refused (160 s)
- Enable word **unread**: 24 bindings named outside the file mask (110 file-mask bindings, 134 whole-block).
- Exported but undriven (not deliberate): u906(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `cm202_001` (5 type 2, 20 model): L0 M6 b30*
  - c1 exported `cm202_001` (5 type 2, 20 model): L0 M6 b29* L2 M4 b0*
  - c90 **not exported** `cm202_050` (15 model, 2 filter): L0 M11 b15*
  - u201 **not exported** `em045_04_002` (2 model): L2 M1 b25*
  - u230 exported `em045_04_001` (19 model): L2 M5 b25* L2 M13 b25* L2 M14 b25*
  - u240 **not exported** `em045_00_002` (4 billboard, 2 polyline, 16 model): L2 M5 b27* L2 M13 b27* L2 M14 b27*
  - u261 **not exported** `em045_00_004` (4 billboard, 1 type 2, 8 model): L2 M2 b17*
  - u263 exported `em045_00_004` (4 billboard, 1 type 2, 8 model): L2 M2 b21*
  - u264 **not exported** `em045_00_004` (4 billboard, 1 type 2, 8 model): L2 M3 b17* L2 M3 b19*
  - u265 exported `em045_00_004` (4 billboard, 1 type 2, 8 model): L2 M3 b21*
  - u267 **not exported** `em045_00_004` (4 billboard, 1 type 2, 8 model): L2 M2 b27*
  - u280 **not exported** `em045_00_005` (3 billboard, 1 model): L2 M2 b19*
  - u281 **not exported** `em045_00_005` (3 billboard, 1 model): L2 M2 b20*
  - u282 exported `em045_00_005` (3 billboard, 1 model): L2 M2 b23*
  - u283 exported `em045_00_005` (3 billboard, 1 model): L2 M2 b24*
  - u284 **not exported** `em045_00_005` (3 billboard, 1 model): L2 M2 b30*
  - u285 **not exported** `em045_00_005` (3 billboard, 1 model): L2 M2 b31*
  - u350 **not exported** `cm202_035` (3 model): L2 M4 b1*

### Duramboros (`em055_00`)

- Soak: 63 motions played in the viewer, 0 refused (213 s)
- Enable word **unread**: 0 bindings named outside the file mask (158 file-mask bindings, 158 whole-block).
- Exported but undriven (not deliberate): c1103(event) u1120(ragePuff) u1121(ragePuff)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c212 **not exported** `cm202_006` (5 type 2, 27 model, 5 node): L3 M21 b1 L3 M22 b3
  - c60 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M31 b5 L3 M22 b1
  - c62 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M6 b0 L2 M19 b0 L2 M26 b0 L2 M27 b1
  - c63 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M4 b2 L2 M27 b0 L2 M33 b2 L3 M22 b2
  - c72 **not exported** `em055_00_005` (6 billboard, 18 model, 1 node): L2 M8 b2 L2 M12 b2 L2 M25 b4 L2 M29 b2 L2 M31 b2 L2 M32 b4
  - u310 **not exported** `em055_00_001` (2 billboard, 4 model): L2 M5 b0 L2 M10 b1 L2 M11 b1 L2 M12 b0 L2 M14 b0 L2 M20 b0 L2 M21 b0 L2 M25 b5 +6 more
  - u311 **not exported** `em055_00_001` (2 billboard, 4 model): L2 M2 b0 L2 M3 b0 L2 M13 b0 L2 M18 b3

### Brachydios (`em063_00`)

- Soak: 73 motions played in the viewer, 0 refused (145 s)
- Enable word **unread**: 32 bindings named outside the file mask (147 file-mask bindings, 179 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c1 exported `cm202_001` (5 type 2, 20 model): L0 M35 b2*
  - c120 **not exported** `em063_00_012` (2 billboard, 2 model): L0 M52 b0* L0 M58 b0* L0 M59 b0* L0 M61 b0* L0 M62 b0* L0 M64 b2*
  - c121 **not exported** `em063_00_012` (2 billboard, 2 model): L0 M52 b1* L0 M58 b1* L0 M61 b1* L0 M62 b1* L0 M64 b3*
  - c130 exported `em023_00_011` (6 billboard, 2 polyline, 21 model, 1 node): L0 M57 b0* L2 M8 b19* L2 M22 b2*
  - c131 exported `em023_00_011` (6 billboard, 2 polyline, 21 model, 1 node): L0 M54 b0* L0 M57 b1* L0 M60 b0* L0 M63 b0* L2 M5 b21* L2 M22 b4*
  - c140 **not exported** `em023_00_011` (6 billboard, 2 polyline, 21 model, 1 node): L2 M13 b19* L2 M18 b19* L2 M54 b19*
  - c141 **not exported** `em023_00_011` (6 billboard, 2 polyline, 21 model, 1 node): L2 M11 b21* L2 M16 b21*
  - c2 exported `cm202_002` (5 type 2, 20 model): L0 M6 b0* L0 M10 b15*
  - c210 **not exported** `cm202_035` (3 model): L2 M21 b27*
  - c3 exported `cm202_002` (5 type 2, 20 model): L0 M6 b1* L0 M10 b16*
  - u200 exported `em063_00_005` (1 billboard, 3 model): L2 M41 b18*

### Raging Brachydios (`em063_05`)

- Soak: 73 motions played in the viewer, 0 refused (162 s)
- Enable word **unread**: 32 bindings named outside the file mask (147 file-mask bindings, 179 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c1 exported `cm202_001` (5 type 2, 20 model): L0 M35 b2*
  - c120 **not exported** `em063_00_012` (2 billboard, 2 model): L0 M52 b0* L0 M58 b0* L0 M59 b0* L0 M61 b0* L0 M62 b0* L0 M64 b2*
  - c121 **not exported** `em063_00_012` (2 billboard, 2 model): L0 M52 b1* L0 M58 b1* L0 M61 b1* L0 M62 b1* L0 M64 b3*
  - c130 exported `em023_00_011` (6 billboard, 2 polyline, 21 model, 1 node): L0 M57 b0* L2 M8 b19* L2 M22 b2*
  - c131 exported `em023_00_011` (6 billboard, 2 polyline, 21 model, 1 node): L0 M54 b0* L0 M57 b1* L0 M60 b0* L0 M63 b0* L2 M5 b21* L2 M22 b4*
  - c140 **not exported** `em023_00_011` (6 billboard, 2 polyline, 21 model, 1 node): L2 M13 b19* L2 M18 b19* L2 M54 b19*
  - c141 **not exported** `em023_00_011` (6 billboard, 2 polyline, 21 model, 1 node): L2 M11 b21* L2 M16 b21*
  - c2 exported `cm202_002` (5 type 2, 20 model): L0 M6 b0* L0 M10 b15*
  - c210 **not exported** `cm202_035` (3 model): L2 M21 b27*
  - c3 exported `cm202_002` (5 type 2, 20 model): L0 M6 b1* L0 M10 b16*
  - u200 exported `em063_00_005` (1 billboard, 3 model): L2 M41 b18*

### Glavenus (`em080_00`)

- Soak: 73 motions played in the viewer, 0 refused (185 s)
- Enable word **unread**: 24 bindings named outside the file mask (184 file-mask bindings, 208 whole-block).
- Exported but undriven (not deliberate): c0(clip)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c1 exported `cm202_001` (5 type 2, 20 model): L2 M56 b1*
  - c10 exported `cm202_002` (5 type 2, 20 model): L2 M56 b0*
  - c50 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M2 b2 L2 M11 b1 L2 M24 b2
  - c51 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M14 b18* L2 M14 b20* L2 M14 b22*
  - c52 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M36 b18* L2 M36 b20* L2 M36 b22* L2 M37 b18* L2 M37 b20* L2 M37 b22*
  - c53 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L0 M5 b4 L3 M18 b3
  - u430 **not exported** `cm202_030` (4 model): L2 M13 b18* L2 M13 b20* L2 M13 b22* L2 M13 b24*
  - u500 exported `cm202_031` (4 model): L2 M14 b19* L2 M14 b23*
  - u501 **not exported** `cm202_031` (4 model): L2 M36 b19* L2 M36 b21* L2 M36 b23* L2 M36 b25*
  - u502 exported `cm202_031` (4 model): L2 M37 b24*
  - named with no record in any array (not effects): u510 u511 u512

### Hellblade Glavenus (`em080_04`)

- Soak: 84 motions played in the viewer, 0 refused (225 s)
- Enable word **unread**: 30 bindings named outside the file mask (221 file-mask bindings, 251 whole-block).
- Exported but undriven (not deliberate): c0(clip)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c1 exported `cm202_001` (5 type 2, 20 model): L2 M56 b1*
  - c10 exported `cm202_002` (5 type 2, 20 model): L2 M56 b0*
  - c50 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M2 b2 L2 M11 b1 L2 M24 b2
  - c51 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M14 b18* L2 M14 b20* L2 M14 b22*
  - c52 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M36 b18* L2 M36 b20* L2 M36 b22* L2 M37 b18* L2 M37 b20* L2 M37 b22* L9 M10 b18* L9 M10 b20* +4 more
  - c53 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L0 M5 b4 L3 M18 b3 L9 M10 b1 L9 M15 b1
  - c70 exported `cm202_040` (2 model): L9 M10 b2*
  - u430 **not exported** `cm202_030` (4 model): L2 M13 b18* L2 M13 b20* L2 M13 b22* L2 M13 b24*
  - u500 exported `cm202_031` (4 model): L2 M14 b19* L2 M14 b23*
  - u501 **not exported** `cm202_031` (4 model): L2 M36 b19* L2 M36 b21* L2 M36 b23* L2 M36 b25*
  - u502 exported `cm202_031` (4 model): L2 M37 b24*
  - u510 exported `em080_04_012` (1 billboard, 1 type 2, 7 model): L4 M11 b24*
  - u511 **not exported** `em080_04_013` (4 model, 1 node): L2 M14 b24*

## What closing each needs (easiest first, as the Flying Wyverns are being done)

1. **Exported but never bound clip records** (one each): Savage Deviljho c 91, Glavenus and Hellblade c 0 -- find why no
   CLIP_EFFECTS bit names them (a record bound only outside the file mask, or a clip the viewer lacks).
2. **The second severed piece**: Barroth's head and Crystalbeard's beard (u 906) -- the two-piece CUT_TAIL support built for
   Bloodbath's horn (tail-option.js `horn` + FLIGHTS) carries them once their slot-1 sever sites and kind-2 flights are read.
3. **Duramboros**: his unexported c 60 / 62 / 63 / 72 / 212, u 310 / 311 are the ground-ray records refused before
   2026-10-07 -- now recordable (--apply / --record); c 1103 (his stun clip is NOT READ: rom-map uEm055_00) and his rage puff
   (RAGE_PUFF / _autoOnRage).
4. **The PSL enable word, unread on all ten** -- one read per class: uEm043_00 (Deviljho / Savage, 26 each), uEm044_00
   (Barroth, 13), uEm045_00 (Uragaan / Crystalbeard, 24), uEm055_00 (Duramboros, 0 outside the mask), uEm063_00
   (Brachydios / Raging, 32), uEm080_00 (Glavenus 24 / Hellblade 30). The unexported records listed per monster mostly
   come in with each class's --apply.
