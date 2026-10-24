# Amphibians and Piscine Wyverns -- effects survey (survey agent for the Viewer agent, 2026-10-15)

Raven: "For each category of large monster remaining, have a sub agent assess the missing effects."

Assess only: no edit under docs/, no recorder or lift run. Method and format: dev/bird-wyverns-effects-survey.md and dev/brute-wyverns-effects-survey.md (their scripts, copied to <archive> `survey_ap/`), plus two additions marked below.

## How it was measured

- **Exported / firing**: efx/effects_status.py per record (clip bits, shells, rage, MOTION_STATES events, the shared states). Corrections kept: c 1100 (Poisoned) and c 1108 (Dung Bombed) are driven by SharedStates; deliberate exclusions, not gaps: blast c 1130-1137, notice c 1200/1201, hyper u 1301-1315, c 1500, c 1106.
- **The PSL enable word**: add_effects.py plan() on the FILE masks and on the WHOLE blocks; the difference is what the class's vt+0x13c decides. `*` = named outside the file mask. A name with no file is a bit naming a key with no record: not an effect. None of the six is in PSL_MASK_MONSTERS.
- **New here, the bindings split by who decides them** (`survey_ap/bits.py`): bits 0-5 always on and bits 6-14 by rage / tiredness are the BASE `0xca170` (READ, psl-mask.js); bits 15-31 are the class override's. An out-of-mask binding on a base bit fires in the game whatever the override says; an IN-mask binding on bits 15-31 fires on every play in the viewer today, where the game gates it -- that is where alternatives show at once.
- **New here, records the triage names that are not exported** (`survey_ap/unexp.py`: dev/effects-triage/<mon>.md rows whose (pel, key) is not in the effects json, less "no motion fires it") -- shells and class requests, which the PSL plan cannot see.
- **Refusals**: dev/effect-live-soak.mjs <mon> --viewer-inputs through the shared two-slot lock, one at a time.

## Amphibians

| # | monster | exported | firing | gaps (undriven, not deliberate) | enable word | bindings outside file mask | in-mask bits 15+ bound unconditionally | PSL records not exported | triage records not exported (shells / class) | soak |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Tetsucabra `em066_00` | 72 | 55 | -- | **override `0xf63fc0`, unread** | 0 | 16 | -- | 21 shell + u50 | clean (56) |
| 2 | Drilltusk Tetsucabra `em066_04` | 83 | 72 | -- | **override `0xf63fc0`, unread** | 0 | 30 | -- | 21 shell + u50 u60 | clean (70) |
| 3 | Zamtrios `em067_00` | 89 | 70 | c1105(event) | **override `0xf772ec`, unread** | 6 | 6 | u481 | 4 shell + u60 | clean (78) |

### Tetsucabra (`em066_00`)

- Soak: 56 motions played in the viewer, 0 refused (167 s)
- Enable word **unread**: class uEm066_00, vtable `0x17dc1ec`, +0x13c = `0xf63fc0` (an override; extent 0xf63fc0..0xf641f4, 142 instructions, derived by following every branch to the last return). 0 bindings outside the file mask (114 file-mask, 114 whole-block).
- Bindings by decider (records only): always0-5 in 81, override15+ in 16, state6-14 in 3
  - bits 15-31 per motion: L0 M7 c0 b27 c1 b28; L0 M11 c0 b27; L0 M12 c1 b27; L4 M7 u410 b15 u412 b21 u440 b16 u440 b22 u440 b25 u440 b28; L4 M17 u410 b15 u412 b21; L4 M28 u391 b15 u392 b18; L4 M29 u390 b15 u393 b18
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - named with no record in any array (not effects): u420 u421 u430 u431 u441 u460 u461 u462 u463
- Triage records not exported:
  - u 0 `em066_00_001` (3 model; joint -1, mode 0/0, end 1): shells: shell13 mode 0
  - u 1 `em066_00_002` (2 billboard, 5 model; joint -1, mode 1/0, end 0): shells: shell13 mode 0
  - u 2 `em066_00_002` (2 billboard, 5 model; joint -1, mode 3/0, end 0): shells: shell13 mode 0
  - u 20 `cm202_200` (7 billboard, 15 model; joint -1, mode 0/0, end 1): shells: shell00 mode 0, shell00 mode 1, shell00 mode 2, shell00 mode 5, shell00 mode 6, shell00 mode 7
  - u 22 `cm202_250` (4 type 2, 20 model; joint -1, mode 3/0, end 0): shells: shell00 mode 0, shell00 mode 1, shell00 mode 2, shell00 mode 5, shell00 mode 6, shell00 mode 7
  - u 24 `cm202_250` (4 type 2, 20 model; joint -1, mode 3/0, end 0): shells: shell00 mode 0 x2, shell00 mode 1 x2, shell00 mode 2 x2, shell00 mode 5 x2, shell00 mode 6 x2, shell00 mode 7 x2
  - u 21 `cm202_200` (7 billboard, 15 model; joint -1, mode 0/2, end 1): shells: shell00 mode 3, shell00 mode 4, shell00 mode 8, shell00 mode 9, shell00 mode 10, shell00 mode 11
  - u 25 `cm202_250` (4 type 2, 20 model; joint -1, mode 3/0, end 0): shells: shell00 mode 3 x2, shell00 mode 4 x2, shell00 mode 8 x2, shell00 mode 9 x2, shell00 mode 10 x2, shell00 mode 11 x2
  - u 23 `cm202_250` (4 type 2, 20 model; joint -1, mode 3/0, end 0): shells: shell00 mode 3, shell00 mode 4, shell00 mode 8, shell00 mode 9, shell00 mode 10, shell00 mode 11
  - u 30 `em066_00_009` (10 billboard, 4 polyline, 21 model; joint -1, mode 0/0, end 1): shells: shell16 mode 2
  - u 32 `em066_00_009` (10 billboard, 4 polyline, 21 model; joint -1, mode 0/0, end 1): shells: shell16 mode 3
  - u 31 `em066_00_009` (10 billboard, 4 polyline, 21 model; joint -1, mode 0/0, end 1): shells: shell16 mode 0
  - u 33 `em066_00_009` (10 billboard, 4 polyline, 21 model; joint -1, mode 0/0, end 1): shells: shell16 mode 1
  - u 40 `em066_00_008` (16 billboard, 33 model; joint -1, mode 1/0, end 0): shells: shell16 mode 2
  - u 42 `em066_00_008` (16 billboard, 33 model; joint -1, mode 1/0, end 0): shells: shell16 mode 3
  - u 41 `em066_00_008` (16 billboard, 33 model; joint -1, mode 1/0, end 0): shells: shell16 mode 0
  - u 43 `em066_00_008` (16 billboard, 33 model; joint -1, mode 1/0, end 0): shells: shell16 mode 1
  - u 50 `em066_00_017` (2 billboard, 4 model; joint 131, mode 1/1, end 0): nothing found (class request sites not read)
  - u 100 `em066_00_014` (2 billboard, 4 model; joint -1, mode 1/0, end 0): shells: shell16 mode 2
  - u 110 `em066_00_014` (2 billboard, 4 model; joint -1, mode 1/0, end 0): shells: shell16 mode 3
  - u 101 `em066_00_014` (2 billboard, 4 model; joint -1, mode 1/0, end 0): shells: shell16 mode 0
  - u 111 `em066_00_014` (2 billboard, 4 model; joint -1, mode 1/0, end 0): shells: shell16 mode 1
- **Assessment**:
  - Enable word: override `0xf63fc0` (the largest of the five). 0 bindings outside the file mask, but **16 in-mask bindings on bits 15-31 fire on every play today**, where the game picks one by state: L4 M7 / L4 M17 `u 410 b15` and `u 412 b21` (+ `u 440` b16 / b22 / b25 / b28) are ALTERNATIVES -- the boulder kind `ctl+0x30` (`[e+0xcac0]+0x30`, states-em066_00.md:199) x part 0's break level against the .dtp bytes 1/2 and 5/6 -- so the viewer shows both at once; L4 M28 / M29 `u 391 b15` + `u 392 b18` (and `u 390` / `u 393`) are the 0x3a8430 split (> 4 -> bits 18-20, else 15-17) on variant 0; L0 M7 / M11 / M12 `c 0 b27`, `c 1 b28` on unless `0x81d6c` (sunk).
  - Not exported, trigger READ but motion not: **u 50** (`em066_00_017`, joint 131) = class id 1003 at `0xf591cc` inside `vtable +0x208`'s motion switch (states-em066_00.md:903, 919) -- boulder kind 3; the motion that case runs on is not in the note. Category 5.
  - Not exported, shells (no SHELL_DATA for the class): shell13 `u 0 / 1 / 2`; shell00 `u 20..25`; shell16 = THE BOULDER (motion-states.js em066_00 block comment: "its hit part (part 7) and `shell16` are the shell session's") `u 30..33`, `u 40..43`, `u 100 / 101 / 110 / 111`. 21 records. Category 5.

### Drilltusk Tetsucabra (`em066_04`)

- Soak: 70 motions played in the viewer, 0 refused (204 s)
- Enable word **unread**: class uEm066_00, vtable `0x17dc1ec`, +0x13c = `0xf63fc0` (an override; extent 0xf63fc0..0xf641f4, 142 instructions, derived by following every branch to the last return). 0 bindings outside the file mask (137 file-mask, 137 whole-block).
- Bindings by decider (records only): always0-5 in 102, override15+ in 30, state6-14 in 3
  - bits 15-31 per motion: L0 M7 c0 b27 c1 b28; L0 M11 c0 b27; L0 M12 c1 b27; L4 M7 u410 b15 u412 b21 u420 b19 u421 b30 u430 b24 u431 b27 u440 b16 u440 b22 u440 b25 u440 b28 u441 b20 u441 b31; L4 M14 u460 b17 u462 b18; L4 M15 u461 b18 u463 b17; L4 M17 u410 b15 u412 b21 u420 b19 u421 b30 u430 b24 u431 b27; L4 M28 u392 b18; L4 M29 u393 b18; L9 M13 u500 b21 u510 b24
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - named with no record in any array (not effects): u390 u391
- Triage records not exported:
  - u 0 `em066_00_001` (3 model; joint -1, mode 0/0, end 1): shells: shell13 mode 0
  - u 1 `em066_00_002` (2 billboard, 5 model; joint -1, mode 1/0, end 0): shells: shell13 mode 0
  - u 2 `em066_00_002` (2 billboard, 5 model; joint -1, mode 3/0, end 0): shells: shell13 mode 0
  - u 20 `cm202_200` (7 billboard, 15 model; joint -1, mode 0/0, end 1): shells: shell00 mode 0, shell00 mode 1, shell00 mode 2, shell00 mode 5, shell00 mode 6, shell00 mode 7
  - u 22 `cm202_250` (4 type 2, 20 model; joint -1, mode 1/0, end 0): shells: shell00 mode 0, shell00 mode 1, shell00 mode 2, shell00 mode 5, shell00 mode 6, shell00 mode 7
  - u 24 `cm202_250` (4 type 2, 20 model; joint -1, mode 1/0, end 0): shells: shell00 mode 0 x2, shell00 mode 1 x2, shell00 mode 2 x2, shell00 mode 5 x2, shell00 mode 6 x2, shell00 mode 7 x2
  - u 21 `cm202_200` (7 billboard, 15 model; joint -1, mode 0/0, end 1): shells: shell00 mode 3, shell00 mode 4, shell00 mode 8, shell00 mode 9, shell00 mode 10, shell00 mode 11
  - u 25 `cm202_250` (4 type 2, 20 model; joint -1, mode 1/0, end 0): shells: shell00 mode 3, shell00 mode 4 x2, shell00 mode 8 x2, shell00 mode 9 x2, shell00 mode 10 x2, shell00 mode 11 x2
  - u 23 `cm202_250` (4 type 2, 20 model; joint -1, mode 1/0, end 0): shells: shell00 mode 3, shell00 mode 4, shell00 mode 8, shell00 mode 9, shell00 mode 10, shell00 mode 11
  - u 30 `em066_00_009` (10 billboard, 4 polyline, 21 model; joint -1, mode 0/0, end 1): shells: shell16 mode 2
  - u 32 `em066_00_009` (10 billboard, 4 polyline, 21 model; joint -1, mode 0/0, end 1): shells: shell16 mode 3
  - u 31 `em066_00_009` (10 billboard, 4 polyline, 21 model; joint -1, mode 0/0, end 1): shells: shell16 mode 0
  - u 33 `em066_00_009` (10 billboard, 4 polyline, 21 model; joint -1, mode 0/0, end 1): shells: shell16 mode 1
  - u 40 `em066_00_008` (16 billboard, 33 model; joint -1, mode 1/0, end 0): shells: shell16 mode 2
  - u 42 `em066_00_008` (16 billboard, 33 model; joint -1, mode 1/0, end 0): shells: shell16 mode 3
  - u 41 `em066_00_008` (16 billboard, 33 model; joint -1, mode 1/0, end 0): shells: shell16 mode 0
  - u 43 `em066_00_008` (16 billboard, 33 model; joint -1, mode 1/0, end 0): shells: shell16 mode 1
  - u 50 `em066_04_004` (4 billboard, 8 model; joint 131, mode 1/1, end 0): nothing found (class request sites not read)
  - u 60 `em066_04_004` (4 billboard, 8 model; joint 131, mode 1/1, end 0): nothing found (class request sites not read)
  - u 100 `em066_00_014` (2 billboard, 4 model; joint -1, mode 1/0, end 0): shells: shell16 mode 2
  - u 110 `em066_00_014` (2 billboard, 4 model; joint -1, mode 1/0, end 0): shells: shell16 mode 3
  - u 101 `em066_00_014` (2 billboard, 4 model; joint -1, mode 1/0, end 0): shells: shell16 mode 0
  - u 111 `em066_00_014` (2 billboard, 4 model; joint -1, mode 1/0, end 0): shells: shell16 mode 1
- **Assessment**:
  - Enable word: the same override (`0xf63fc0`), variant 4 arm. **30 in-mask bindings on bits 15-31 fire on every play today**: L4 M7 / L4 M17 all six boulder-kind x break alternatives (`u 410 / 412 / 420 / 421 / 430 / 431` + `u 440 / 441`) at once; L4 M14 / M15 `u 460..463` (only under action (7, 0xf7) / (7, 0xf8), bits 17-18); L9 M13 `u 500 b21` / `u 510 b24` (`ctl+0x30` == 2 / 3); L4 M28 / M29 `u 392 / 393 b18` (variant 4 -> bits 18-20 always: correct as bound); L0 M7 / M11 / M12 bits 27-28 unless sunk.
  - Not exported: **u 50** (`em066_04_004`, id 1003, `0xf591cc`, motion unread -- as Tetsucabra) and **u 60** (`em066_04_004`, id 1004): states-em066_00.md:155-156 reads all five `vtable +0x1d0` sites as asking 1001 / 1002 / 1003 only, so **u 60 has no requester** -- not a gap unless a site turns up.
  - Not exported, shells: the same 21 as Tetsucabra (shell13 / shell00 / shell16). Category 5.

### Zamtrios (`em067_00`)

- Soak: 78 motions played in the viewer, 0 refused (217 s)
- Enable word **unread**: class uEm067_00, vtable `0x17dd730`, +0x13c = `0xf772ec` (an override; extent 0xf772ec..0xf77364, 31 instructions, derived by following every branch to the last return). 6 bindings outside the file mask (118 file-mask, 124 whole-block).
- Bindings by decider (records only): always0-5 OUT 1, always0-5 in 101, override15+ OUT 2, override15+ in 6, state6-14 OUT 3, state6-14 in 11
  - bits 15-31 per motion: L0 M7 c0 b27 c1 b28; L0 M11 c0 b27; L0 M12 c1 b27; L0 M13 c0 b27 c1 b28; L4 M31 u340 b15*; L4 M32 u340 b15*
- Exported but undriven (not deliberate): c1105(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c23 exported `cm202_021` (5 type 2, 15 model, 5 node): L4 M90 b0*
  - u340 exported `em067_00_007` (1 billboard, 3 model): L4 M31 b15* L4 M32 b15*
  - u470 exported `em067_00_010` (5 model): L4 M74 b12*
  - u471 exported `em067_00_010` (5 model): L4 M58 b12*
  - u481 **not exported** `em067_00_010` (5 model): L4 M58 b9*
- Triage records not exported:
  - u 0 `em067_00_012` (2 billboard, 3 model; joint -1, mode 0/2, end 1): shells: shell13 mode 0, shell13 mode 3
  - u 1 `em067_00_014` (1 billboard, 5 model; joint -1, mode 3/2, end 0): shells: shell01 mode 8, shell01 mode 10, shell13 mode 0 x3, shell13 mode 3 x3
  - u 10 `em067_00_012` (2 billboard, 3 model; joint -1, mode 0/2, end 1): shells: shell13 mode 1, shell13 mode 4
  - u 11 `em067_00_014` (1 billboard, 5 model; joint -1, mode 3/2, end 0): shells: shell01 mode 9, shell01 mode 11, shell13 mode 1 x3, shell13 mode 4 x3
  - u 60 `em067_00_019` (1 billboard, 2 model; joint -1, mode 3/0, end 0): nothing found (class request sites not read)
- **Assessment**:
  - Shock trap **c 1105** exported with no row: (10, 0x6e) plays L3 M2 (P+0x568 = 60) then holds L3 M13 with c 1105 every 42 (cm200_001, joint 1, scale 5) -- states-em067_00.md:72, 820. L3 M2 is already a three-way `cycle` (head, tail, c 1109): a fourth entry `{ every: [['em067_00c', 1105], 42] }`, the Rath / Tetsucabra / Lavasioth shape. Category 1.
  - **THE BLOATED POSTURE HAS NO AILMENT ROWS** (not counted by the classifier, because the records fire on the posture-0 clips): posture 2 plays L3 M100 (the stun's start, c 1103 held, and the trap's start), L4 M1 (the stun's hold, c 1103), L3 M101 (paralysis hold, c 1101 every 60, and the trap's hold from f20, c 1105 every 42), L3 M102 (every recovery), L3 M103 (sleep fall; the sleep HOLD is no motion, so c 1102 has no clip to hang on), L3 M106..M109 (pit) -- states-em067_00.md:815-822. The viewer has every one of those clips (L3 M100..M103, M106..M109) and MOTION_STATES em067_00 names none. Category 1.
  - Enable word: override `0xf772ec` -- L0 M7 / M11 / M12 / M13 (mask 0x3880) bits 27-29 unless `0x81d6c` (sunk, rom-map "0x81d6c / 0xbf62c"); L4 M31 / M32 (0x41f / 0x420) bits 15-17 iff `0x81d18` == 1 -- posture 4 AND P+0x5c >= 0.9 x MoguriBaseOfs (`0x81d18..0x81d64`, the literal `0x81d68` = 0x3f666666, read here): **u 340 fires only in posture 4 at that depth** (the converse depth arm of `0x81d6c`), which the viewer cannot show today (no depth; the play from the surface leaves it off). Outside the mask: `u 340` (b15, the override), and four BASE bits that fire whatever the override says -- `c 23` L4 M90 b0, `u 470` L4 M74 b12 / `u 471` L4 M58 b12 (tired-calm), `u 481` L4 M58 b9 (enraged; not exported, comes in with --apply).
  - Not exported, trigger partly read: **u 60** (`em067_00_019`, mode 3, pos (150, 0, 0)) = class id 1005 at `0xf69690`, "inside an attack with a computed world position" (states-em067_00.md:217, 902) -- which attack / clip / frame is not in the note. Category 4 once read.
  - Not exported, shells: shell13 `u 0 / u 10` (modes 0 / 3 and 1 / 4) and `u 1 / u 11` (shell01 modes 8-11 and shell13). His beam shells (u 30 / u 31) are wired. Category 5.

## Piscine Wyverns

| # | monster | exported | firing | gaps (undriven, not deliberate) | enable word | bindings outside file mask | in-mask bits 15+ bound unconditionally | PSL records not exported | triage records not exported (shells / class) | soak |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Plesioth `em010_00` | 79 | 60 | c1105(event) u1400(event) | **override `0xd6bbc8`, unread** | 0 | 6 | -- | 0 shell | clean (70) |
| 2 | Cephadrome `em017_00` | 40 | 28 | -- | **override `0xda3738`, unread** | 4 | 3 | -- | 2 shell | clean (73) |
| 3 | Lavasioth `em036_00` | 58 | 37 | u1400(event) | **override `0xe3f6c4`, unread** | 4 | 0 | c16 u241 | 14 shell + u60 | clean (53) |

### Plesioth (`em010_00`)

- Soak: 70 motions played in the viewer, 0 refused (185 s)
- Enable word **unread**: class uEm010_00, vtable `0x179e2b8`, +0x13c = `0xd6bbc8` (an override; extent 0xd6bbc8..0xd6bc68, 41 instructions, derived by following every branch to the last return). 0 bindings outside the file mask (121 file-mask, 121 whole-block).
- Bindings by decider (records only): always0-5 in 115, override15+ in 6
  - bits 15-31 per motion: L0 M18 c270 b15; L2 M2 c300 b26 c41 b22 c41 b25 u260 b21 u260 b24
- Exported but undriven (not deliberate): c1105(event) u1400(event)
- **Assessment**:
  - Shock trap **c 1105** exported with no row: (10, 0x6e) plays L3 M2 to frame 52 (P+0x568 = 52) then holds L3 M9 with c 1105 every 42 (cm200_001, joint 1, scale 4) -- states-em010_00.md:92, 653; motion-states.js em010_00 already says "It is also the shock trap's first 52 frames, which shows nothing of its own" (written before c 1105 was wired anywhere, as the Rath line's was -- withdraw it with the row). A fourth entry in the L3 M2 `cycle`. Category 1.
  - **u 1400**: rom-map "u 1400 -- the per-class sweep": `em010_00` has NO branch into the record family in the whole class band, so he closes on the shared one-shot latch `0xadc98` (enemy +0x1404 bits 20/21 AND +0x1408 bit 0), whose setters are NOT READ. One shared read, not his. Category 5.
  - Enable word: override `0xd6bbc8` -- L0 M18 (0x12) bits 15-17, or bits 18-20 when posture 4 and P+0x5c < -550.0 (literal at `0xd6bc6c` = 0xc4098000); L2 M2 (0x202) status 7: number 0x12 -> bits 21-23, 0x13 -> bits 24-26, else nothing. 0 bindings outside the mask, but **6 in-mask bindings fire on every play today**: L2 M2 shows BOTH (7, 0x12)'s set (`c 41 b22`, `u 260 b21`) and (7, 0x13)'s (`c 41 b25`, `u 260 b24`, `c 300 b26`); L0 M18 `c 270 b15` (right except submerged deep).
  - Nothing else unexported: his triage has no record missing; his beam shells are wired.

### Cephadrome (`em017_00`)

- Soak: 73 motions played in the viewer, 0 refused (76 s)
- Enable word **unread**: class uEm017_00, vtable `0x17a9d80`, +0x13c = `0xda3738` (an override; extent 0xda3738..0xda3780, 19 instructions, derived by following every branch to the last return). 4 bindings outside the file mask (95 file-mask, 99 whole-block).
- Bindings by decider (records only): always0-5 OUT 4, always0-5 in 92, override15+ in 3
  - bits 15-31 per motion: L4 M9 c60 b15; L4 M10 c60 b15; L4 M11 c60 b15
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c121 exported `em056_00_009` (2 billboard, 1 polyline, 1 type 2, 3 model): L2 M29 b1* L2 M30 b1*
  - c30 exported `em056_00_001` (4 billboard, 1 model): L2 M30 b2*
  - u200 exported `em017_00_000` (3 billboard, 1 model): L2 M30 b0*
- Triage records not exported:
  - u 0 `em017_00_001` (2 billboard, 2 model; joint -1, mode 0/1, end 1): shells: shell00 mode 0, shell00 mode 1, shell00 mode 2, shell00 mode 3, shell00 mode 4, shell00 mode 5, shell00 mode 6, shell00 mode 7, shel
  - u 1 `em017_00_002` (3 billboard, 1 polyline, 1 model; joint -1, mode 1/2, end 0): shells: shell00 mode 0 x3, shell00 mode 1 x3, shell00 mode 2 x3, shell00 mode 3 x3, shell00 mode 4 x3, shell00 mode 5 x3, shell00 mode 6 x3,
- **Assessment**:
  - No undriven record. Enable word: override `0xda3738`, the smallest of the five -- L4 M9..M11 (0x409..0x40b) bits 15-17 unless `0x6fe88(e, 7, 0xc)` (the current-action test, rom-map `0x6fe88`): `c 60 b15` on those three today fires even under (7, 0xc). Outside the mask: four bindings, **all on base bits 0-2** (`c 121` L2 M29 / M30 b1, `c 30` L2 M30 b2, `u 200` L2 M30 b0) -- bits 0-5 are always on (0xca170), so these fire in the game on every play whatever the override says.
  - Not exported, shells: shell00 `u 0` (`em017_00_001`) and `u 1` (`em017_00_002`) across all eighteen modes (a spit, by its shape: INFERRED). No SHELL_DATA for him. Category 5 (base00 is translated).

### Lavasioth (`em036_00`)

- Soak: 53 motions played in the viewer, 0 refused (121 s)
- Enable word **unread**: class uEm036_00, vtable `0x17baff4`, +0x13c = `0xe3f6c4` (an override; extent 0xe3f6c4..0xe3f770, 44 instructions, derived by following every branch to the last return). 4 bindings outside the file mask (81 file-mask, 85 whole-block).
- Bindings by decider (records only): always0-5 OUT 2, always0-5 in 81, override15+ OUT 2
  - bits 15-31 per motion: L2 M14 u231 b15* u241 b18*
- Exported but undriven (not deliberate): u1400(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c16 **not exported** `cm202_006` (5 type 2, 27 model, 5 node): L0 M17 b0*
  - c60 exported `cm202_006` (5 type 2, 27 model, 5 node): L2 M12 b0*
  - u231 exported `em036_00_002` (2 billboard, 1 type 2, 10 model): L2 M14 b15*
  - u241 **not exported** `em036_00_002` (2 billboard, 1 type 2, 10 model): L2 M14 b18*
- Triage records not exported:
  - u 0 `em036_00_009` (3 billboard, 3 model; joint -1, mode 0/0, end 1): shells: shell00 mode 0, shell00 mode 1
  - u 1 `em036_00_008` (3 billboard, 5 model; joint -1, mode 0/0, end 0): shells: shell00 mode 0, shell00 mode 1
  - u 2 `em036_00_008` (3 billboard, 5 model; joint -1, mode 0/0, end 0): shells: shell00 mode 0 x2, shell00 mode 1 x2
  - u 3 `em036_00_006` (2 billboard, 3 model; joint -1, mode 0/0, end 1): shells: shell00 mode 2, shell00 mode 3, shell00 mode 4
  - u 4 `em036_00_007` (1 billboard, 4 model; joint -1, mode 0/2, end 0): shells: shell00 mode 2 x3, shell00 mode 3 x3, shell00 mode 4 x3
  - u 30 `em036_00_009` (3 billboard, 3 model; joint -1, mode 0/0, end 1): shells: shell00 mode 5, shell00 mode 6, shell00 mode 7, shell00 mode 8, shell00 mode 9, shell00 mode 12, shell00 mode 13
  - u 31 `em036_00_008` (3 billboard, 5 model; joint -1, mode 3/0, end 0): shells: shell00 mode 8, shell00 mode 9
  - u 32 `em036_00_008` (3 billboard, 5 model; joint -1, mode 3/0, end 0): shells: shell00 mode 5 x2, shell00 mode 6 x2, shell00 mode 7 x2, shell00 mode 8 x2, shell00 mode 9 x2, shell00 mode 12 x2, shell00 mode 13 x
  - u 33 `em036_00_008` (3 billboard, 5 model; joint -1, mode 3/0, end 0): shells: shell00 mode 5, shell00 mode 6, shell00 mode 7, shell00 mode 12, shell00 mode 13
  - u 60 `em036_00_011_s` (12 model; joint -1, mode 3/0, end 1): nothing found (class request sites not read)
  - u 90 `em036_00_010` (2 model; joint -1, mode 3/0, end 1): shells: shell01 mode 0, shell01 mode 1, shell01 mode 2
  - u 91 `em045_00_003` (2 billboard, 1 polyline, 8 model; joint -1, mode 3/0, end 0): shells: shell01 mode 3, shell01 mode 4, shell01 mode 5
  - u 100 `em036_00_009` (3 billboard, 3 model; joint -1, mode 0/0, end 1): shells: shell00 mode 14, shell00 mode 15, shell00 mode 16, shell00 mode 17, shell00 mode 18, shell00 mode 19, shell00 mode 20, shell00 mode 
  - u 101 `em036_00_008` (3 billboard, 5 model; joint -1, mode 0/0, end 0): shells: shell00 mode 14, shell00 mode 15, shell00 mode 16, shell00 mode 17, shell00 mode 18, shell00 mode 19, shell00 mode 20, shell00 mode 
  - u 102 `em036_00_008` (3 billboard, 5 model; joint -1, mode 0/0, end 0): shells: shell00 mode 14 x2, shell00 mode 15 x2, shell00 mode 16 x2, shell00 mode 17 x2, shell00 mode 18 x2, shell00 mode 19 x2, shell00 mode
- **Assessment**:
  - **u 1400**: rom-map: his two record-family sites `0xe41e10` / `0xe44314` ask level **0** (key 1120), not 2, so u 1400 closes on the shared latch (setters NOT READ). Category 5.
  - **A CLASS-REQUESTED u 1120 THE VIEWER DOES NOT MODEL**: both sites are tail-calls `b 0xa499c` with `mov r1, #0` (re-read here: `0xe41e04` / `0xe44308`), in a function that calls `0xbc7f4` (posture), `0xbf62c` (MoguriBaseOfs) and `0xafce8(e, 0x15)` -- L0 M21 (rom-map row; the setMotion identity of `0xafce8` is INFERRED). 0xa499c holds its record at `e+0xb7c4`, so this is a `hold` row like the u 1400 ones. **It contradicts states-em036_00.md:118 / 792 ("Key 1120 is never requested")** -- that note read the rage path; resolve which is right (open the site's function from its entry `0xe41d20`) before wiring. u 1120 counts as implemented only because the rage puff names it. Category 1 after that read.
  - Enable word: override `0xe3f6c4` -- L2 M14 (0x20e) bits 15-17, or 18-20 when `0x3a8430` > 4 (the chooser whose byte is NOT READ, rom-map `0x3a8430`); L0 M21 (0x15) bit 15 iff `0x81d6c`; L0 M13 (0xd) bits 15-17 iff action (1, 0x30 / 0x31). Outside the mask: `u 231 b15` / `u 241 b18` on L2 M14 (one or the other by the chooser; u 241 not exported) and two BASE bit-0 bindings, `c 16` L0 M17 (not exported) and `c 60` L2 M12, which fire whatever the override says.
  - Not exported, trigger READ: **u 60** (`em036_00_011_s`, no joint, mode 3, scale 1.3, end 1) -- "held while the action is (7, 0xf)..(7, 0x14) or (6, 4) / (6, 5)", the class's one effect request from `vtable +0x208` (states-em036_00.md:108, 168, 262, 992). Export + record, then rows on those actions' clips. Category 4.
  - Not exported, shells: shell00 `u 0..4`, `u 30..33`, `u 100..102` (23 modes; a spit, by its shape: INFERRED) and shell01 `u 90` (`em036_00_010`) / `u 91` (`em045_00_003`). 14 records, no SHELL_DATA. Category 5 (base00 / base01 are translated).

## The five enable words

All five classes OVERRIDE vt+0x13c (none is the base `0xca170`, so none is a `() => 0` entry). Control, the same run: uEm004_00 `0x1797c8c` -> `0xd2e0ec`, uEm032_00 / uEm014_00 -> `0xca170`, as rom-map lists them; the word at vt+0x140 is `0x6bdd4` on all eight. Each override calls `0xca170` first and then ORs by MOTION ID in r1 (`mov r5, r1`; the motion ids they compare -- 0x202, 0x12, 0x409..0x40b, 0x20e, 0x407..0x41d, 0x90d, 0x41f / 0x420 -- are exactly the motions bits.py finds carrying bits 15+, (list << 8) | slot), so they are motion-keyed like Basarios's, not action-only like Great Maccao's. Read statically end to end by this survey; NOT emulated and NOT transcribed -- the spec pass owns that.

| class (monsters) | vt | +0x13c | extent | inputs it needs from the viewer | cost |
|---|---|---|---|---|---|
| uEm017_00 (Cephadrome) | `0x17a9d80` | `0xda3738` | `..0xda3780`, 19 insns | motion, action (7, 0xc) | smallest |
| uEm067_00 (Zamtrios) | `0x17dd730` | `0xf772ec` | `..0xf77364`, 31 | motion, posture 4 + depth (0x81d6c sunk / 0x81d18 deep) | small; the sunk case cannot be shown (no depth) |
| uEm010_00 (Plesioth) | `0x179e2b8` | `0xd6bbc8` | `..0xd6bc68`, 41 | motion, action (7, 0x12 / 0x13), posture 4 + P+0x5c vs -550.0 | small; fixes L2 M2 showing two attacks at once |
| uEm036_00 (Lavasioth) | `0x17baff4` | `0xe3f6c4` | `..0xe3f770`, 44 | motion, action (1, 0x30 / 0x31), sunk, **0x3a8430** | small code; the 0x3a8430 byte is NOT READ (rom-map), so u 231 vs u 241 needs a rank-like input |
| uEm066_00 (Tetsucabra, Drilltusk) | `0x17dc1ec` | `0xf63fc0` | `..0xf641f4`, 142 | motion, variant `+0xb5f5`, action (7, 0xf7 / 0xf8), part 0 break level vs .dtp bytes 1/2, 5/6, **0x3a8430**, **the boulder kind `ctl+0x30`** | largest; the boulder kind is an action-start state the viewer does not carry |

## What closing each needs (easiest first)

1. **Config-only rows** (motion-states.js; records already exported, no recording):
   - **The shock trap c 1105** on Zamtrios and Plesioth (2 monsters): a fourth `{ every: [[c, 1105], 42] }` entry in each one's existing L3 M2 `cycle` (states-em067_00.md:820; states-em010_00.md:653). Tetsucabra, Drilltusk, Cephadrome and Lavasioth already have theirs.
   - **Zamtrios's bloated-posture ailment clips** (1 monster): L3 M100 and L4 M1 (stun, c 1103), L3 M101 (paralysis c 1101; trap hold c 1105) carry the posture-0 clips' records (states-em067_00.md:815-822); the viewer has the clips and no rows.
   - **Lavasioth's class-requested u 1120 on L0 M21** (1 monster): one `hold` row -- AFTER the contradiction with states-em036_00.md:118 is settled (above).
2. **Base-only enable words**: none -- all five classes override (0 monsters). The ten out-of-mask bindings on BASE bits (Zamtrios 4, Cephadrome 4, Lavasioth 2) fire in the game whatever the override says, but listing a class in PSL_MASK_MONSTERS needs its override, so they ride item 3.
3. **Override enable words to read** (spec pass: transcribe, emulate, --apply), smallest first: uEm017_00 Cephadrome (1; brings c 121 / c 30 / u 200 in, gates c 60); uEm067_00 Zamtrios (1; brings u 340, c 23, u 470 / 471, u 481 -- u 481 exported with it); uEm010_00 Plesioth (1; 0 outside, gates 6 -- L2 M2 shows two attacks' sets at once today); uEm036_00 Lavasioth (1; brings u 231 / u 241, c 16, c 60; needs a 0x3a8430 input); uEm066_00 Tetsucabra + Drilltusk (2; 0 outside, gates 16 / 30 -- L4 M7 / M17 show every boulder x break alternative at once; needs the boulder kind). rom-map "The PSL enable word per class" has the five rows.
4. **Records needing a recorder pass** (trigger read or readable): Lavasioth u 60 (1; the held magma, read: export, --record, rows on the (7, 0xf..0x14) / (6, 4 / 5) clips); Zamtrios u 60 (1; class id 1005 at `0xf69690`, the attack's clip and frame to read first); the unexported PSL records Zamtrios u 481 and Lavasioth c 16 / u 241 (2; all `ok` in the whole plan, nothing left out -- they export and record with item 3's --apply / --record).
5. **Shells / undecoded**:
   - **u 1400** on Plesioth and Lavasioth (2): the shared latch's setters (enemy +0x1404 bits 20/21, +0x1408 bit 0) -- NOT READ; one shared read for every latch monster.
   - **The boulder's u 50** on Tetsucabra and Drilltusk (2): class id 1003 at `0xf591cc` in vt+0x208's motion switch -- the motion is unread. (Drilltusk's u 60, id 1004, has no requester per the note: not a gap.)
   - **Non-beam shells, no SHELL_DATA** (5 monsters, 62 records): Tetsucabra 21 and Drilltusk 21 (shell13, shell00, shell16 = the boulder), Lavasioth 14 (shell00, shell01), Zamtrios 4 (shell13, shell01), Cephadrome 2 (shell00). By the board's folder rule (shell folder number = base number; to be confirmed per class from its vtable), Cephadrome and Lavasioth need no new base (base00 / base01 are translated), Zamtrios needs base13 (partly translated, Khezu's orbs), and Tetsucabra's boulder needs **base16, which has no transcription at all** -- the largest single item here.
