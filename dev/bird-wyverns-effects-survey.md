# Bird Wyverns -- effects survey (Viewer agent, 2026-10-15)

Raven: "Start looking over the flying wyverns now ... Check to ensure all effects for each have been implemented. If they have not been implemented, see what effects they have, make a note, then move onto the next monster for the time being."

## How it was measured

- **Exported / firing**: efx/effects_status.py per record (clip bits, shells, rage, MOTION_STATES events, the shared states). Two corrections to its output: c 1100 (Poisoned) and c 1108 (Dung Bombed) are driven by SharedStates from the state toggles -- the classifier returns `wired` for any `event` record before it checks the shared keys -- and the deliberate exclusions are not gaps: blast c 1130-1137, notice c 1200/1201 (off the list), hyper u 1301-1315 (withheld), c 1500 (lying in water), c 1106 (Raven).
- **The PSL enable word**: add_effects.py plan() run twice -- on the blocks' FILE masks (what the viewer binds today for a monster whose class +0x13c is unread) and on the WHOLE blocks (every named bit). The difference is what the game decides with the monster's enemy +0x13f4 word: those bindings may fire in the game and are not bound in the viewer (Boltreaver had 102, Bloodbath 11 C-group + 4 mis-gated). Only Basarios, Bloodbath and Boltreaver have the word read (psl-mask.js PSL_MASK_MONSTERS). `*` = named outside the file mask. A name with no file (`-`) is a bit naming a key that has no record in any array: not an effect.
- **Refusals**: dev/effect-live-soak.mjs <mon> --viewer-inputs, every bound motion in the viewer. A refusal stops every effect of the monster until reload.

## Summary

| # | monster | exported | firing | gaps (undriven, not deliberate) | enable word | bindings outside file mask | PSL records not exported (with a file) | soak |
|---|---|---|---|---|---|---|---|---|
| 1 | Yian Kut-Ku `em008_00` | 57 | 38 | c1105(event) | **unread** | 16 | u560 | clean |
| 2 | Gypceros `em009_00` | 55 | 36 | -- | **unread** | 17 | c140 c141 | clean |
| 3 | Velocidrome `em014_00` | 28 | 22 | c1105(event) | **unread** | 0 | -- | clean |
| 4 | Gendrome `em015_00` | 28 | 22 | c1105(event) | **unread** | 0 | -- | clean |
| 5 | Iodrome `em016_00` | 30 | 24 | c1105(event) | **unread** | 0 | -- | clean |
| 6 | Yian Garuga `em018_00` | 69 | 49 | -- | **unread** | 26 | u290 u380 u381 u400 u401 u560 u580 | clean |
| 7 | Deadeye Yian Garuga `em018_04` | 64 | 52 | -- | **unread** | 26 | u290 u380 u381 u390 u391 u400 u401 u531 u560 u570 u580 | clean |
| 8 | Giadrome `em034_00` | 29 | 24 | c1105(event) | **unread** | 0 | -- | clean |
| 9 | Malfestio `em079_00` | 52 | 36 | c1105(event) | **unread** | 0 | -- | clean |
| 10 | Nightcloak Malfestio `em079_04` | 55 | 45 | c1105(event) | **unread** | 0 | -- | clean |
| 11 | Great Maccao `em085_00` | 39 | 33 | -- | **unread** | 0 | -- | clean |

## Per monster

### Yian Kut-Ku (`em008_00`)

- Soak: 72 motions played in the viewer, 0 refused (222 s)
- Enable word **unread**: 16 bindings named outside the file mask (116 file-mask bindings, 132 whole-block).
- Exported but undriven (not deliberate): c1105(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `cm202_001` (5 type 2, 20 model): L0 M12 b1* L0 M117 b1* L0 M118 b2*
  - c1 exported `cm202_001` (5 type 2, 20 model): L0 M12 b0* L0 M117 b2* L0 M118 b1*
  - c2 exported `cm202_002` (5 type 2, 20 model): L2 M2 b0*
  - c3 exported `cm202_002` (5 type 2, 20 model): L2 M2 b1*
  - c31 exported `cm202_021` (5 type 2, 15 model, 5 node): L0 M117 b0* L0 M118 b0*
  - u200 exported `em008_00_000` (5 model): L2 M1 b9*
  - u260 exported `cm202_005` (5 type 2, 27 model): L1 M38 b0*
  - u560 **not exported** `cm202_030` (4 model): L2 M12 b15*
  - named with no record in any array (not effects): u570 u580 u90

### Gypceros (`em009_00`)

- Soak: 74 motions played in the viewer, 0 refused (184 s)
- Enable word **unread**: 17 bindings named outside the file mask (110 file-mask bindings, 127 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `cm202_001` (5 type 2, 20 model): L0 M9 b0* L0 M10 b1* L0 M12 b1* L0 M117 b1* L0 M118 b2*
  - c1 exported `cm202_001` (5 type 2, 20 model): L0 M9 b1* L0 M10 b0* L0 M12 b0* L0 M117 b2* L0 M118 b1*
  - c140 **not exported** `cm202_002` (5 type 2, 20 model): L4 M13 b0 L4 M23 b1 L4 M48 b0
  - c141 **not exported** `cm202_002` (5 type 2, 20 model): L4 M13 b1 L4 M48 b1
  - c31 exported `cm202_020` (5 type 2, 27 model, 5 node): L0 M117 b0* L0 M118 b0*
  - u260 exported `cm202_004` (5 type 2, 21 model): L1 M38 b0*
  - named with no record in any array (not effects): c61 u560 u570 u580 u90

### Velocidrome (`em014_00`)

- Soak: 40 motions played in the viewer, 0 refused (33 s)
- Enable word **unread**: 0 bindings named outside the file mask (65 file-mask bindings, 65 whole-block).
- Exported but undriven (not deliberate): c1105(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - named with no record in any array (not effects): u200 u220

### Gendrome (`em015_00`)

- Soak: 38 motions played in the viewer, 0 refused (32 s)
- Enable word **unread**: 0 bindings named outside the file mask (49 file-mask bindings, 49 whole-block).
- Exported but undriven (not deliberate): c1105(event)

### Iodrome (`em016_00`)

- Soak: 42 motions played in the viewer, 0 refused (32 s)
- Enable word **unread**: 0 bindings named outside the file mask (60 file-mask bindings, 60 whole-block).
- Exported but undriven (not deliberate): c1105(event)

### Yian Garuga (`em018_00`)

- Soak: 85 motions played in the viewer, 0 refused (280 s)
- Enable word **unread**: 26 bindings named outside the file mask (193 file-mask bindings, 219 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `cm202_001` (5 type 2, 20 model): L0 M9 b0* L0 M10 b1* L0 M12 b1* L0 M117 b1* L0 M118 b2*
  - c1 exported `cm202_001` (5 type 2, 20 model): L0 M9 b1* L0 M10 b0* L0 M12 b0* L0 M117 b2* L0 M118 b1*
  - c2 exported `cm202_002` (5 type 2, 20 model): L2 M2 b0*
  - c3 exported `cm202_002` (5 type 2, 20 model): L2 M2 b1*
  - c31 exported `cm202_021` (5 type 2, 15 model, 5 node): L0 M117 b0* L0 M118 b0*
  - u290 **not exported** `cm202_005` (5 type 2, 27 model): L0 M7 b27*
  - u380 **not exported** `em001_00_013` (4 billboard, 17 model): L4 M65 b15*
  - u381 **not exported** `em001_00_013` (4 billboard, 17 model): L4 M77 b15*
  - u400 **not exported** `em001_00_013` (4 billboard, 17 model): L4 M65 b21*
  - u401 **not exported** `em001_00_013` (4 billboard, 17 model): L4 M77 b21*
  - u560 **not exported** `cm202_030` (4 model): L2 M12 b15*
  - u580 **not exported** `cm202_030` (4 model): L2 M12 b21*
  - u90 exported `cm202_050` (15 model, 2 filter): L1 M104 b24*
  - named with no record in any array (not effects): u221 u280 u390 u391 u531 u570

### Deadeye Yian Garuga (`em018_04`)

- Soak: 99 motions played in the viewer, 0 refused (322 s)
- Enable word **unread**: 26 bindings named outside the file mask (210 file-mask bindings, 236 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `cm202_001` (5 type 2, 20 model): L0 M9 b0* L0 M10 b1* L0 M12 b1* L0 M117 b1* L0 M118 b2*
  - c1 exported `cm202_001` (5 type 2, 20 model): L0 M9 b1* L0 M10 b0* L0 M12 b0* L0 M117 b2* L0 M118 b1*
  - c2 exported `cm202_002` (5 type 2, 20 model): L2 M2 b0*
  - c3 exported `cm202_002` (5 type 2, 20 model): L2 M2 b1*
  - c31 exported `cm202_021` (5 type 2, 15 model, 5 node): L0 M117 b0* L0 M118 b0*
  - u290 **not exported** `cm202_005` (5 type 2, 27 model): L0 M7 b27*
  - u380 **not exported** `em001_04_002` (6 billboard, 8 model): L4 M65 b15*
  - u381 **not exported** `em001_04_002` (6 billboard, 8 model): L4 M77 b15*
  - u390 **not exported** `em001_04_002` (6 billboard, 8 model): L4 M65 b18*
  - u391 **not exported** `em001_04_002` (6 billboard, 8 model): L4 M77 b18*
  - u400 **not exported** `em001_04_002` (6 billboard, 8 model): L4 M65 b21*
  - u401 **not exported** `em001_04_002` (6 billboard, 8 model): L4 M77 b21*
  - u531 **not exported** `em027_00_021` (2 model): L0 M7 b28*
  - u560 **not exported** `em001_04_001` (4 billboard, 10 model): L2 M12 b15*
  - u570 **not exported** `em001_04_001` (4 billboard, 10 model): L2 M12 b18*
  - u580 **not exported** `em001_04_001` (4 billboard, 10 model): L2 M12 b21*
  - u90 exported `cm202_050` (15 model, 2 filter): L1 M104 b24*
  - named with no record in any array (not effects): u221 u280

### Giadrome (`em034_00`)

- Soak: 43 motions played in the viewer, 0 refused (33 s)
- Enable word **unread**: 0 bindings named outside the file mask (65 file-mask bindings, 65 whole-block).
- Exported but undriven (not deliberate): c1105(event)

### Malfestio (`em079_00`)

- Soak: 95 motions played in the viewer, 0 refused (250 s)
- Enable word **unread**: 0 bindings named outside the file mask (121 file-mask bindings, 121 whole-block).
- Exported but undriven (not deliberate): c1105(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - named with no record in any array (not effects): u361

### Nightcloak Malfestio (`em079_04`)

- Soak: 101 motions played in the viewer, 0 refused (259 s)
- Enable word **unread**: 0 bindings named outside the file mask (134 file-mask bindings, 134 whole-block).
- Exported but undriven (not deliberate): c1105(event)

### Great Maccao (`em085_00`)

- Soak: 63 motions played in the viewer, 0 refused (86 s)
- Enable word **unread**: 0 bindings named outside the file mask (95 file-mask bindings, 95 whole-block).

## What closing each needs (easiest first)

1. **DONE 2026-10-15** (motion-states.js; soaked clean: Kut-Ku 72, Velocidrome 40, Malfestio 95 motions, 0 refused). **The shock trap, c 1105, exported with no row** on seven: Yian Kut-Ku, Velocidrome, Gendrome, Iodrome, Giadrome,
   Malfestio, Nightcloak -- the one `every: [[c, 1105], 42]` row on each one's (10, 0x6e) clip, as Basarios got
   (dev/fw-undriven-barioth-basarios-ukanlos.md). Read each one's (10, 0x6e) script for the clip first.
2. **DONE 2026-10-15** (psl-mask.js em014; --apply wrote nothing new; soaks clean). **No class override (the dromes, uEm014_00 = 0xca170)**: `() => 0` + --apply; zero bindings outside the mask, so the
   change is the state gating of bits 6-14 only.
3. **Overrides to read**: Yian Kut-Ku 0xd514b8 (16 outside the mask), Gypceros 0xd5e768 (17), Yian Garuga / Deadeye
   0xdb0d10 (26 each; their unexported records come in with it), Malfestio 0xfef4b8 and Great Maccao 0x10937e8 (0 outside
   the mask: state gating only). rom-map "The PSL enable word per class".
