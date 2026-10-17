# Remaining classes -- effects survey: Fanged Wyvern, Snake Wyvern, Temnoceran, Unclassified, '???' (survey agent for the Viewer agent, 2026-10-15)

Raven: "For each category of large monster remaining, have a sub agent assess the missing effects."

Seven monsters, five classes: Zinogre / Thunderlord Zinogre (uEm057_00), Najarala (uEm068_00), Nerscylla (uEm070_00), Ahtal-Neset (uEm087_00), Gore Magala / Chaotic Gore Magala (uEm071_00). Assess only: nothing under docs/ was changed, no recorder or lift was run.

## How it was measured

The method of dev/bird-wyverns-effects-survey.md and dev/brute-wyverns-effects-survey.md, unchanged, plus three reads.

- **Exported / firing**: efx/effects_status.py per record (clip bits, shells, rage, MOTION_STATES events, the shared states). Two corrections to its output: c 1100 (Poisoned) and c 1108 (Dung Bombed) are driven by SharedStates from the state toggles -- the classifier returns `wired` for any `event` record before it checks the shared keys -- and the deliberate exclusions are not gaps: blast c 1130-1137, notice c 1200/1201 (off the list), hyper u 1301-1315 (withheld), c 1500 (lying in water), c 1106 (Raven).
- **The PSL enable word**: add_effects.py plan() run twice -- on the blocks' FILE masks (what the viewer binds today for a monster whose class +0x13c is not transcribed) and on the WHOLE blocks (every named bit). The difference is what the game decides with the monster's enemy +0x13f4 word. `*` = named outside the file mask. A name with no file is a bit naming a key that has no record in any array: not an effect. None of the seven is in psl-mask.js PSL_MASK_MONSTERS.
- **Refusals**: dev/effect-live-soak.mjs <mon> --viewer-inputs through the shared two-slot lock (soak_locked.sh), one monster at a time.
- **Read for this pass** (rom-map "The PSL enable word per class"): the word at vtable +0x13c for all five classes (main.data, VA 0x1728000; control: uEm032_00 0xca170, uEm004_00 0xd2e0ec, uEm081_00 0x1019eb4 match). **All five hold an override -- none is base-only.** Four of the five were read whole here (they are short); Zinogre's was measured, not read. Also read: vt +0x2a4 (the rage puff pick) per class, every `bl 0xc2274` (the sever) in Najarala's, Nerscylla's, Gore's and Zinogre's bands, and the getDTI count per class (one each: Thunderlord and Chaotic run their base's vtable, there is no uEm057_04 / uEm071_05).
- **Bit groups**: each outside-mask binding sorted by the word's groups (0-5 always; 6-8 calm, 9-11 enraged, 12-14 tired-calm; 15-31 the override's). A binding at bits 0-5 comes in with ANY transcription; one at 6-14 comes in gated by state; only 15-31 needs the override's arms. Scratch: `survey_rc/bitgroups.txt`.
- **Other layers**: the shell and class-code records not exported, from dev/effects-triage/<mon>.md against docs/effects/<mon>.json (`survey_rc/triage_layers.py`). The triage predates later exports; regenerate it before trusting a count.

## Summary

| # | class | monster | exported | firing | gaps (undriven, not deliberate) | enable word (vt+0x13c) | bindings outside file mask | PSL records not exported (with a file) | soak |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Fanged Wyvern | Zinogre `em057_00` | 70 | 50 | -- | override 0xf0279c | 71 | c201 c202 c230 u200 u201 u210 u211 u221 u320 u350 u380 u410 u470 u500 u560 | **1 refused** |
| 2 | Fanged Wyvern | Thunderlord Zinogre `em057_04` | 73 | 60 | -- | override 0xf0279c | 71 | c201 c202 c230 u200 u201 u210 u211 u221 u242 u243 u251 u300 u320 u330 u350 u360 u380 u410 u420 u470 u480 u481 u500 u560 | **1 refused** |
| 3 | Snake Wyvern | Najarala `em068_00` | 63 | 35 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1001(event) u1120(ragePuff) u1121(ragePuff) u1400(event) | override 0xf88044 (read) | 12 | -- | **6 refused** |
| 4 | Temnoceran | Nerscylla `em070_00` | 49 | 23 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1120(ragePuff) u1121(ragePuff) | override 0xfab634 (read) | 37 | u260 u261 u262 u271 u281 u282 u283 u284 u291 u310 u311 u350 u400 u401 | clean |
| 5 | Unclassified | Ahtal-Neset `em087_00` | 44 | 44 | -- | override 0x10ad838 (part read) | 96 | u200 u203 | **37 refused** |
| 6 | '???' | Gore Magala `em071_00` | 71 | 39 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) c1120(ragePuff) c1121(ragePuff) u1000(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event) | override 0xfc08a8 (read) | 22 | c101 c110 u201 u202 u250 u260 u280 | clean |
| 7 | '???' | Chaotic Gore Magala `em071_05` | 72 | 48 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) c1120(ragePuff) c1121(ragePuff) u1000(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event) | override 0xfc08a8 (read) | 27 | c101 c110 u201 u202 u250 u280 u700 | clean |

`firing` counts c 1100 / c 1108 (SharedStates). Thunderlord's c 1104 is not counted as a gap: he has no tired state (read). The PSL counts are the PSL motion layer only; the shell and class-code layers are counted per monster below (from dev/effects-triage/<mon>.md, which predates later exports -- regenerate before trusting a count).

## Fanged Wyvern

### Zinogre (`em057_00`)

- Soak: 78 motions played in the viewer, 1 refused (197 s)
  - REFUSED: `L3 Motion[9]: 60 frames, 4 started, up to 2 running, 60 draws REFUSED: unverified path: 0xa92798 falls into unrecorded code [alive: em057_00u:530(clip)x1 em057_00u:531(clip)x1]`
- Enable word **not transcribed** (not in PSL_MASK_MONSTERS): 71 bindings named outside the file mask (121 file-mask bindings, 192 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `cm202_001` (5 type 2, 20 model): L2 M18 b3*
  - c1 exported `cm202_001` (5 type 2, 20 model): L2 M18 b4*
  - c201 **not exported** `cm202_030` (4 model): L2 M15 b6* L2 M15 b12* L2 M38 b1*
  - c202 **not exported** `cm202_030` (4 model): L2 M18 b6* L2 M18 b9* L2 M18 b12* L2 M37 b1*
  - c230 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M30 b0
  - c290 exported `cm202_020` (5 type 2, 27 model, 5 node): L2 M42 b6* L2 M42 b12*
  - c31 exported `cm202_001` (5 type 2, 20 model): L2 M31 b1*
  - c4 exported `cm202_002` (5 type 2, 20 model): L3 M2 b2*
  - c5 exported `cm202_020` (5 type 2, 27 model, 5 node): L2 M26 b0*
  - c6 exported `cm202_021` (5 type 2, 15 model, 5 node): L2 M31 b3* L2 M32 b2* L2 M37 b2* L2 M38 b2*
  - u200 **not exported** `cm202_001` (5 type 2, 20 model): L2 M2 b6* L2 M2 b12*
  - u201 **not exported** `cm202_001` (5 type 2, 20 model): L2 M1 b6* L2 M1 b12*
  - u210 **not exported** `em057_00_003` (3 polyline, 7 model): L2 M2 b27*
  - u211 **not exported** `em057_00_003` (3 polyline, 7 model): L2 M1 b27*
  - u221 **not exported** `em057_00_003` (3 polyline, 7 model): L2 M1 b9*
  - u234 exported `em057_00_023` (1 polyline, 6 model): L2 M2 b30* L2 M61 b27* L2 M63 b27* L2 M63 b31*
  - u235 exported `em057_00_023` (1 polyline, 6 model): L2 M1 b30* L2 M60 b27* L2 M62 b27* L2 M62 b31*
  - u260 exported `em057_00_012` (4 model): L2 M18 b27* L2 M37 b27* L2 M38 b27*
  - u320 **not exported** `em057_00_012` (4 model): L2 M25 b27*
  - u350 **not exported** `em057_00_012` (4 model): L2 M26 b27*
  - u380 **not exported** `em057_00_004` (3 model): L2 M31 b0* L2 M32 b0*
  - u410 **not exported** `em057_00_020` (1 polyline, 2 model): L2 M39 b27* L2 M42 b27*
  - u440 exported `em057_00_001` (2 billboard, 2 model): L0 M20 b6* L0 M20 b9* L0 M20 b12*
  - u470 **not exported** `em057_00_013` (1 polyline, 3 model): L0 M20 b19*
  - u500 **not exported** `em057_00_021` (3 polyline, 9 model): L0 M24 b24*
  - u560 **not exported** `em057_00_004` (3 model): L2 M31 b2*
  - u650 exported `em057_00_005` (5 model): L3 M13 b23*
  - u651 exported `em057_00_000` (3 billboard, 1 polyline, 5 model): L3 M21 b21*
  - named with no record in any array (not effects): u242 u243 u244 u245 u250 u251 u270 u300 u330 u360 u420 u480 u481 u680 u681
- Shell-layer records not exported (no SHELL_DATA entry): 5 -- u0 `em057_00_015` u1 `em057_00_016` u60 `em057_00_019` u61 `em057_00_018` u150 `em057_00_022`
- Class-code records not exported (request sites unread): 4 -- u30 `em057_00_000` u31 `em057_00_000` u90 `em057_00_002` u120 `em057_00_002`

**Assessment.** Zinogre is the best-wired monster in this set: every state record is driven (motion-states.js `em057_00`, from E:\offline\decode\notes\states-em057_00.md), his rage puff runs (RAGE_PUFF + `_autoOnRage`), his tail drops (CUT_TAIL). What is missing is one refusal and three layers:

- **The refusal (L3 M9, u 530 + u 531 `em057_00_009` alive): `0xa92798 falls into unrecorded code`.** That is the known COVERAGE gap of the lifted draw layer, task board "Effects: Nibelsnarf's unrecorded branch 0xa92798" (inside `0xa9272c`, lifted in lifted-draw.js: a list walk at `[r5+0xb0]` that every recording so far saw EMPTY). It is not the stage ray: the motion-states.js em057_00 header calls "1 refused" the accepted number and attributes it to the stage-ray record, but that record (c 230, L2 M30) is not exported and cannot refuse in a soak -- the refusal the soak shows is this one (whether the header's count was always this one is not known). It stops every effect of his until reload, and L3 M9 is the shock trap's last clip. Cure: a recording that reaches `0xa92798` with a non-empty list (record + lift); Zinogre's L3 M9 is now a second reproducer besides Nibelsnarf. **efx/vectors holds no set for em057_00 or em057_04** (the board's 2026-09-26 status already said "no vector sets at all -- record first"), so recording his own L3 M9 records is the natural first try.
- **The enable word is the big one, and the costliest read in this set.** uEm057_00 vt+0x13c = `0xf0279c`, extent `0xf0279c..0xf02e94` (literal pool to `0xf02ea0`, next function `0xf02ea0`; derived from the last branch target and the pool) -- about 0x6f8 bytes, Bloodbath-sized. Shape (measured, not read arm by arm): `bl 0xca170`, then the variant byte `e+0xb5f5 == 4` splits it (Thunderlord `0xf027bc`, Zinogre `0xf0291c`); each arm switches on the motion id through a jump table (`0x201..0x23f`, the L2 attacks), tests the death motions `0x30c / 0x30d / 0x314 / 0x315`, L0 M20 (`0x14`) and L0 M24 (`0x18`, the charge clip); inputs are the quest rank `0x3a8430` (5 / 3 / 1 / 0; the viewer's is SHELL_QUEST_RANK = 5), the CHARGED flag `0x816d4` (P+0x5df3), the action bytes `e+0x73e0 / e+0x73e1`, `e+0xb5f8`, `e+0xcb14` (died charged), `e+0xb720`, and `0x6fe88(e, 1, 4)` / `(e, 1, 0x15)` (is the action (1, 4) / (1, 0x15)); several arms CLEAR bits the base set (`bfc` bit 6, bits 6-11, bits 9-11; `and 0xff1ffffe` at `0xf02d44` clears bit 0 and 21-23). Needs a read whole + emulation (unicorn over variant x charged x rank x action), as Bloodbath's was.
  - Of his 71 outside-mask bindings: 14 at bits 0-5 and 15 in the state groups come in with any transcription; 42 sit at bits 15-31, 21 of which name a key with no record in em057_00u (Thunderlord's pel has them all).
  - **Bindings INSIDE his file mask also fire wrongly today**: 21 file-mask bindings sit at bits 15-31 (L2 M43 / M44 b30 u 232 / 233; L2 M58-M61 b28 / b31 u 234 / 235; L3 M13 / M21 b22-b25 u 650 / 651 / 680 / 681; L3 M20 b15 c 60 ...) and the viewer fires all of them on every play, where the word keeps only the variant's / charge state's / rank's own.
- **c 230** (`cm202_020`, L2 M30 b0, inside the file mask) is his stage-ray record, refused when he was applied; the refusal is retired (stage_ray(), 2026-10-07), so it records now (--apply / --record). The motion-states.js header's "1 refused ... the accepted number" is that record.
- **Unexported records the whole blocks name** (outside the mask): c 201 / 202, u 200 / 201 / 210 / 211 / 221 / 320 / 350 / 380 / 410 / 470 / 500 / 560 -- they come in with the word's --apply.
- **Shells**: 5 records (u 0 / 1 / 60 / 61 / 150), no SHELL_DATA entry for him.
- **Class code**: u 90 / u 120 (request sites unread). u 30 / u 31 are the calm gauge auras, NOT wired on purpose (motion-states.js em057_00 header: the viewer has no gauge).
- **The tail drop's joint, READ here**: his sever call `0xeed254` (`bl 0xc2274`) passes **r3 = 0x8f = joint 143** (`0xeed248`, slot r1 = 0, under `cmp r0, #7` at `0xeed234`). CUT_TAIL `em057_00` / `em057_04` say **144** (tail-option.js:109-110) -- u 900's joint. By the Diablos correction (0xc2274's 4th argument -> option +0x1477, the drop's joint; rom-map Withdrawn) the piece should drop from 143. This is the rom-map "every `bl 0xc2274`" lead (INFERRED there for em057) now read for this class; not changed here.

### Thunderlord Zinogre (`em057_04`)

- Soak: 84 motions played in the viewer, 1 refused (227 s)
  - REFUSED: `L3 Motion[9]: 60 frames, 4 started, up to 2 running, 60 draws REFUSED: unverified path: 0xa92798 falls into unrecorded code [alive: em057_04u:530(clip)x1 em057_04u:531(clip)x1]`
- Enable word **not transcribed** (not in PSL_MASK_MONSTERS): 71 bindings named outside the file mask (131 file-mask bindings, 202 whole-block).
- Exported, undriven, and correctly so (read absence): c1104 (no tired state: [tune+0x30] NULL, motion-states.js em057_04 header)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `cm202_001` (5 type 2, 20 model): L2 M18 b3*
  - c1 exported `cm202_001` (5 type 2, 20 model): L2 M18 b4*
  - c201 **not exported** `cm202_030` (4 model): L2 M15 b6* L2 M15 b12* L2 M38 b1*
  - c202 **not exported** `cm202_030` (4 model): L2 M18 b6* L2 M18 b9* L2 M18 b12* L2 M37 b1*
  - c230 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M30 b0
  - c290 exported `cm202_020` (5 type 2, 27 model, 5 node): L2 M42 b6* L2 M42 b12*
  - c31 exported `cm202_001` (5 type 2, 20 model): L2 M31 b1*
  - c4 exported `cm202_002` (5 type 2, 20 model): L3 M2 b2*
  - c5 exported `cm202_020` (5 type 2, 27 model, 5 node): L2 M26 b0*
  - c6 exported `cm202_021` (5 type 2, 15 model, 5 node): L2 M31 b3* L2 M32 b2* L2 M37 b2* L2 M38 b2*
  - u200 **not exported** `em057_04_003` (4 polyline, 7 model): L2 M2 b6* L2 M2 b12*
  - u201 **not exported** `em057_04_003` (4 polyline, 7 model): L2 M1 b6* L2 M1 b12*
  - u210 **not exported** `em057_04_003` (4 polyline, 7 model): L2 M2 b27*
  - u211 **not exported** `em057_04_003` (4 polyline, 7 model): L2 M1 b27*
  - u221 **not exported** `em057_04_003` (4 polyline, 7 model): L2 M1 b9*
  - u234 exported `em057_04_023` (3 polyline, 14 model): L2 M2 b30* L2 M61 b27* L2 M63 b27* L2 M63 b31*
  - u235 exported `em057_04_023` (3 polyline, 14 model): L2 M1 b30* L2 M60 b27* L2 M62 b27* L2 M62 b31*
  - u242 **not exported** `em057_04_023` (3 polyline, 14 model): L2 M43 b22*
  - u243 **not exported** `em057_04_023` (3 polyline, 14 model): L2 M44 b22*
  - u244 exported `em057_04_023` (3 polyline, 14 model): L2 M61 b21* L2 M62 b21* L2 M63 b21*
  - u245 exported `em057_04_023` (3 polyline, 14 model): L2 M1 b22* L2 M60 b21*
  - u250 exported `em057_04_023` (3 polyline, 14 model): L2 M59 b29* L2 M63 b28*
  - u251 **not exported** `em057_04_023` (3 polyline, 14 model): L2 M58 b29* L2 M62 b28*
  - u260 exported `em057_04_012` (8 model): L2 M18 b27* L2 M37 b27* L2 M38 b27*
  - u270 exported `em057_04_012` (8 model): L2 M18 b21* L2 M37 b21*
  - u300 **not exported** `em057_04_007` (2 polyline, 7 model): L2 M24 b21*
  - u320 **not exported** `em057_04_012` (8 model): L2 M25 b27*
  - u330 **not exported** `em057_04_012` (8 model): L2 M25 b21*
  - u350 **not exported** `em057_04_012` (8 model): L2 M26 b27*
  - u360 **not exported** `em057_04_012` (8 model): L2 M26 b21*
  - u380 **not exported** `em057_04_004` (3 model): L2 M31 b0* L2 M32 b0*
  - u410 **not exported** `em057_04_020` (2 polyline, 4 model): L2 M39 b27* L2 M42 b27*
  - u420 **not exported** `em057_04_020` (2 polyline, 4 model): L2 M39 b21* L2 M42 b21*
  - u440 exported `em057_04_001` (2 billboard, 2 model): L0 M20 b6* L0 M20 b9* L0 M20 b12*
  - u470 **not exported** `em057_04_013` (2 polyline, 6 model): L0 M20 b19*
  - u480 **not exported** `em057_04_013` (2 polyline, 6 model): L0 M20 b27*
  - u481 **not exported** `em057_04_010` (4 polyline, 11 model): L0 M24 b27*
  - u500 **not exported** `em057_04_021` (2 polyline, 14 model): L0 M24 b24*
  - u560 **not exported** `em057_04_004` (3 model): L2 M31 b2*
  - u650 exported `em057_04_005` (2 billboard, 8 model): L3 M13 b23*
  - u651 exported `em057_04_024` (1 billboard, 4 polyline, 2 model): L3 M21 b21*
  - u680 exported `em057_04_005` (2 billboard, 8 model): L3 M13 b24*
- Shell-layer records not exported (no SHELL_DATA entry): 16 -- u0 `em057_04_015` u1 `em057_04_016` u2 `em057_04_006` u10 `em057_04_015` u11 `em057_04_016` u12 `em057_04_006` u60 `em057_04_019` u61 `em057_04_018` u70 `em057_04_019` u71 `em057_04_018` u150 `em057_04_014` u160 `em057_04_014` u170 `em057_04_014` u171 `em057_04_014` u180 `em057_04_018` u210 `em057_04_008`
- Class-code records not exported (request sites unread): 6 -- u42 `em057_04_000` u30 `em057_04_000` u31 `em057_04_000` u90 `em057_04_002` u151 `em057_04_014` u280 `em057_04_027`

**Assessment.** The same class, vtable and getDTI as Zinogre (`0xf02f7c` appears once in main.data), so the same enable word -- its variant-4 arm (`0xf027bc`) -- and the same costs; see Zinogre. His own differences:

- **The same refusal**: L3 M9, u 530 / 531 (`em057_00_009`, his own keys on Zinogre's file), `0xa92798` unrecorded -- one recording that reaches it cures both.
- **c 1104 is not a gap.** He has no tired state (`[tune+0x30]` NULL, motion-states.js em057_04 header), so the shared drool never fires for him; the record is in the json only because the c.pel is Zinogre's file byte for byte. Nothing to do.
- **More of his records wait on the word**: u 242 / 243 / 251 / 300 / 330 / 360 / 420 / 480 / 481 are records in em057_04u (no record in Zinogre's), plus the same c 201 / 202 and u 200 / 201 / 210 / 211 / 221 / 320 / 350 / 380 / 410 / 470 / 500 / 560.
- **c 230** stage ray: as Zinogre's (now recordable).
- **Shells**: 16 records (u 0 / 1 / 2 / 10 / 11 / 12 / 60 / 61 / 70 / 71 / 150 / 160 / 170 / 171 / 180 / 210), no SHELL_DATA entry.
- **Class code**: u 42 / 90 / 151 / 280 (u 30 / 31 are the gauge auras, not wired on purpose).
- **His list 9**: five clips whose playing actions are NOT READ (motion-states.js em057_04 header: no `movw r1, #0x9xx` in the class) -- his 10 L9 PSL bindings are bound and fire when the clip is played, but no action can be named for them, so if the word's variant-4 arm keys an L9 motion on an action, that arm has no input until list 9 is read.
- The CUT_TAIL joint (143 read, 144 written) applies to him too.

## Snake Wyvern

### Najarala (`em068_00`)

- Soak: 131 motions played in the viewer, 6 refused (370 s)
  - REFUSED: `L2 Motion[61]: 143 frames, 7 started, up to 6 running, 1348 draws, 1122 model draws on a regrouped mesh REFUSED: unverified path: 0xcad554 branch to unrecorded 0xcad560 [alive: em068_00u:230(clip)x1 e`
  - REFUSED: `L2 Motion[70]: 41 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0xcad554 branch to unrecorded 0xcad560 [alive: em068_00u:290(clip)x1]`
  - REFUSED: `L2 Motion[71]: 41 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0xcad554 branch to unrecorded 0xcad560 [alive: em068_00u:290(clip)x1]`
  - REFUSED: `L2 Motion[72]: 40 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0xcad554 branch to unrecorded 0xcad560 [alive: em068_00u:290(clip)x1]`
  - REFUSED: `L2 Motion[73]: 40 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0xcad554 branch to unrecorded 0xcad560 [alive: em068_00u:290(clip)x1]`
  - REFUSED: `L2 Motion[74]: 45 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0xcad554 branch to unrecorded 0xcad560 [alive: em068_00u:290(clip)x1]`
- Enable word **not transcribed** (not in PSL_MASK_MONSTERS): 12 bindings named outside the file mask (295 file-mask bindings, 307 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1001(event) u1120(ragePuff) u1121(ragePuff) u1400(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `em068_00_003` (2 billboard, 2 model): L2 M41 b1* L3 M11 b0* L3 M99 b1*
  - c1 exported `em068_00_003` (2 billboard, 2 model): L0 M108 b2* L2 M34 b2* L2 M41 b0* L3 M11 b1*
  - c10 exported `cm202_006` (5 type 2, 27 model, 5 node): L2 M18 b3*
  - c12 exported `cm202_006` (5 type 2, 27 model, 5 node): L2 M18 b4*
  - c2 exported `em068_00_003` (2 billboard, 2 model): L3 M11 b2*
  - c20 exported `cm202_006` (5 type 2, 27 model, 5 node): L2 M18 b1*
  - u320 exported `em068_00_005` (2 model): L2 M45 b1*
- Shell-layer records not exported (no SHELL_DATA entry): 6 -- u0 `em068_00_000` u1 `em068_00_001` u2 `em068_00_004` u3 `em068_00_000` u30 `em068_00_012` u31 `em068_00_002`
- Class-code records not exported (request sites unread): 4 -- u1010 `cm202_060` u1015 `cm202_060` u1035 `cm202_060` u1030 `cm202_060`

**Assessment.** His PSL layer is exported (every bound record, nothing refused at plan), but **it does not all run**, he has **no MOTION_STATES block at all** and no states decode note (no `states-em068_00.md` under E:\offline\decode\notes), so every state record is undriven.

- **6 refusals, one cause: `0xcad554 branch to unrecorded 0xcad560`** -- L2 M61 (u 230 / 231 / 232 / 241 alive) and L2 M70 / M71 / M72 / M73 / M74 (u 290 `em068_00_009` alive, refused at its first start). `0xcad528` is a particle routine in lift-effects.sh / lifted-particles.js; its arm for byte `+0x41` bit 1 of its second argument (`tst r1, #2` at `0xcad550`) has never been recorded. **efx/vectors holds no set at all for em068_00** (none for em057 or em087 either; Nerscylla has 12, Gore 79, Chaotic 97): Najarala was exported 2026-09-26 without a recording, so the runtime meets his generators' flags for the first time in the viewer. Cure: record his sets (add_effects.py --record), then a lift that takes `0xcad560`. New: not in rom-map or on the board before this pass.
- **u 1400 is config-only.** Its clip is READ: L0 M44, sites `0xf7fdbc` / `0xf85228`, base u table level 2 (rom-map "u 1400 -- the per-class sweep", whose row says "no MOTION_STATES block yet"). The row is `'0|Motion[44]': { hold: ['em068_00u', 1400] }`, as Barroth's L0 M6.
- **The rage puff (u 1120 / 1121) is config-only.** vt+0x2a4 = the base stub `0x6bf64` (READ here), so the pick is `() => 0` and only u 1121 is ever requested, period 30; no `0xb7d2`, `0xb7d3` or `0x5d04` immediate in his class band `0xf796c0..0xf88608` (controls in the same scan: Alatreon `0xec4a94`, Ukanlos `0xe5a2dc`; the band is an address range, not proven membership), so the shared puff runs and the joint is the record's, as the dromes'. RAGE_PUFF `{ period: 30, joint: <the record's>, records: [['em068_00u', 1120], ['em068_00u', 1121]], pick: () => 0 }` + `_autoOnRage`.
- **The ailments c 1101 (paralysis), 1102 (sleep), 1103 (stun), 1105 (shock trap), 1109 (tune+0x44)** need his action -> clip map: (10, 0x1f), (10, 0x1d / 0x1e), (10, 0x20), (10, 0x6e) and the c 1109 action. Unread -- the generic prober efx/agents/notice-scratch/probe.py resolves them without a hand decode, as Duramboros's were (rom-map uEm055_00 "action scripts"). Then the rows are config (`every: [[c, 1105], 42]` on the (10, 0x6e) clip, etc.).
- **c 1104 (tired drool) is config-only**: he is tired-capable (monster.js state table: Exhausted on the tired predicate 0x81614, board 2026-09-16) and his band writes no `e+0xb7d3` (the drool's gate; same scan), so it is a TIRED_DROOL entry `em068_00: ['em068_00c', 1104]`.
- **u 1001** (`cm202_060`, a break record): which part, level and clip -- unread (no break decode for him).
- **The enable word, READ WHOLE here**: uEm068_00 vt+0x13c = `0xf88044..0xf880e0` (the pop; one `0x13f4` writer, through `ldr [r4, r0]!` at `0xf880d0`). `bl 0xca170`, then by the motion id r1:
  - **L2 M61 (`0x23d`)**: `0x9d36c(e, 2)` (part 2's break level) against the byte `[[e+0x75f0]+0x64]+5` (rank <= 4) / `+6` (rank 5) -- a .dtp break row's level by Gravios's/Gypceros's reading -- at or above ORs **bits 18-20**, below ORs **bits 15-17**;
  - **L0 M44 (`0x2c`)**: `0x81d6c` ("already sunk", posture 4 and P+0x5c < 0.9 x MoguriBaseOfs) ORs **bit 18**, else **bits 15-17**;
  - every other motion: the base alone. No action, variant or charge input.
  - What it changes on screen: **today the viewer fires BOTH of L2 M61's sets** (b15-17 u 230 / 231 / 232 AND b18-20 u 240 / 241 / 232, all inside the file mask) on every play; the word shows one, by part 2 broken or not -- the viewer gives that from the parts SHOWN (as Gypceros's crest), which needs his part-2 break set named. L0 M44's c 0 / 1 / 2 at b15-17 stay on with the stand-in `sunk = false` (Akantor's). His 12 outside-mask bindings are all at bits 0-5 and come in with the transcription.
- **Shells**: 6 records (u 0 / 1 / 2 / 3 / 30 / 31), no SHELL_DATA entry. **Class code**: u 1010 / 1015 / 1030 / 1035 (request sites unread). No sever site in his class-effects.json band (no `bl 0xc2274`): no tail records, as expected.

## Temnoceran

### Nerscylla (`em070_00`)

- Soak: 79 motions played in the viewer, 0 refused (196 s)
- Enable word **not transcribed** (not in PSL_MASK_MONSTERS): 37 bindings named outside the file mask (79 file-mask bindings, 116 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1120(ragePuff) u1121(ragePuff)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c151 exported `cm200_067` (8 model): L0 M8 b30*
  - c30 exported `cm202_020` (5 type 2, 27 model, 5 node): L3 M4 b0*
  - u260 **not exported** `em070_00_007` (2 billboard, 4 polyline, 6 model): L2 M6 b15* L2 M6 b18*
  - u261 **not exported** `em070_00_007` (2 billboard, 4 polyline, 6 model): L2 M6 b16* L2 M6 b19*
  - u262 **not exported** `em070_00_007` (2 billboard, 4 polyline, 6 model): L2 M26 b15* L2 M26 b18*
  - u270 exported `em070_00_008` (4 billboard, 2 polyline, 5 model): L2 M85 b15* L2 M85 b18*
  - u271 **not exported** `em070_00_008` (4 billboard, 2 polyline, 5 model): L2 M26 b16* L2 M26 b19* L4 M34 b15* L4 M34 b18*
  - u280 exported `em070_00_008` (4 billboard, 2 polyline, 5 model): L2 M10 b21* L2 M85 b21*
  - u281 **not exported** `em070_00_008` (4 billboard, 2 polyline, 5 model): L2 M26 b22* L4 M34 b21*
  - u282 **not exported** `em070_00_007` (2 billboard, 4 polyline, 6 model): L2 M6 b21*
  - u283 **not exported** `em070_00_007` (2 billboard, 4 polyline, 6 model): L2 M6 b22*
  - u284 **not exported** `em070_00_007` (2 billboard, 4 polyline, 6 model): L2 M26 b21*
  - u290 exported `em070_00_011` (4 billboard, 3 model): L2 M40 b6* L2 M40 b9* L2 M57 b6* L2 M57 b9*
  - u291 **not exported** `em070_00_011` (4 billboard, 3 model): L2 M41 b6* L2 M41 b9* L2 M57 b12*
  - u310 **not exported** `em070_00_011` (4 billboard, 3 model): L2 M40 b12*
  - u311 **not exported** `em070_00_011` (4 billboard, 3 model): L2 M41 b12*
  - u350 **not exported** `em070_00_002` (1 model): L2 M30 b12*
  - u400 **not exported** `em070_00_012` (5 billboard, 1 polyline, 4 model): L2 M46 b15* L2 M46 b18* L2 M46 b21*
  - u401 **not exported** `em070_00_012` (5 billboard, 1 polyline, 4 model): L2 M46 b16* L2 M46 b19* L2 M46 b22*
- Shell-layer records not exported (no SHELL_DATA entry): 7 -- u0 `em070_00_000` u1 `em070_00_010` u2 `em070_00_010` u90 `em070_00_004` u91 `em070_00_005` u100 `em070_00_004` u101 `em070_00_005`
- Class-code records not exported (request sites unread): 9 -- u30 `em070_00_020` u31 `em070_00_021` u32 `em070_00_025` u33 `em070_00_025` u34 `em070_00_022` u1011 `cm202_060` u1021 `cm202_060` u1006 `cm202_060` u1007 `cm202_060`

**Assessment.** Like Najarala: the PSL layer is wired, **no MOTION_STATES block and no states decode note**, so every state record is undriven; and the enable word changes what fires on screen today.

- **The rage puff (u 1120 / 1121, his own `em070_00_018`) is config-only**: vt+0x2a4 = the base stub `0x6bf64` (READ here) -> pick `() => 0`, u 1121 only, period 30; no `0xb7d2` / `0xb7d3` / `0x5d04` immediate in his band `0xf9b18c..0xfabaa0` (same scan and controls as Najarala's), so the shared puff runs on the record's joint. RAGE_PUFF + `_autoOnRage`.
- **The ailments c 1101 / 1102 / 1103 / 1105 / 1109**: his action -> clip map, unread (prober, as Najarala). **c 1104**: no `e+0xb7d3` write in his band, so TIRED_DROOL once his stamina block (`[tune+0x30]` non-NULL; Thunderlord has none) is checked -- whether he tires is NOT READ.
- **The enable word, READ WHOLE here**: uEm070_00 vt+0x13c = `0xfab634..0xfab6b8` (the pop). `bl 0xca170`, then:
  - **by QUEST RANK, every motion** (`0x3a8430`, which returns only 5 / 3 / 1 / 0, rom-map `0x3a8430`): rank 5 ORs **bits 21-23**, rank 3 **bits 18-20** (`cmp r0, #1` / `movgt`), rank 1 or 0 **bits 15-17**;
  - **L0 M8 / L0 M6** (`cmp r5, #8` / `cmpne r5, #6`): when `e+0x1068` bit 3 is set (`tst r1, #8`) ORs **bits 30-31**. `e+0x1068` is the floor flag word the stage query 0x18154c fills (rom-map `0x18154c` and `0x41c74` rows) -- so this is a FLOOR ATTRIBUTE; which ground sets bit 3 is NOT READ, and what the viewer's floor answers there is not checked.
  - No action, variant or part input. The viewer already carries a rank: index.html `SHELL_QUEST_RANK = 5` (shells and beams), so the word can take it -- at 5 his bits 21-23 fire.
  - What it changes on screen: **today the viewer fires all three rank forms at once** -- L2 M7 b15 / b18 u 270 and b21 u 280, L2 M10 b15 / b18 u 270, all inside the file mask; the word keeps the rank's own (at 5: u 280 b21 on L2 M7 and, from outside the mask, on L2 M10). L0 M6 b30 c 151 (inside the mask) fires today on every play; the word gates it on the floor bit. His 37 outside-mask bindings: 1 at bits 0-5, 10 in the state groups, 25 by rank (L2 M6 / M26 / M46 / M85, L4 M34: u 260-262, 270, 271, 280-284, 400, 401), 1 at bit 30 (L0 M8 c 151).
- **Unexported records the whole blocks name** (all outside the mask, so they come in with the word's --apply): u 260 / 261 / 262 / 271 / 281 / 282 / 283 / 284 / 291 / 310 / 311 / 350 / 400 / 401.
- **Shells**: 7 records (u 0 / 1 / 2 / 90 / 91 / 100 / 101), no SHELL_DATA entry. **Class code**: u 30-34, u 1006 / 1007 / 1011 / 1021 (request sites unread). No sever site in his class-effects.json band.

## Unclassified

### Ahtal-Neset (`em087_00`)

- Soak: 77 motions played in the viewer, 37 refused (316 s)
  - REFUSED: `L0 Motion[9]: 147 frames, 2 started, up to 4 running, 983 draws, 84 model draws on a regrouped mesh REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00`
  - REFUSED: `L2 Motion[6]: 76 frames, 1 started, up to 7 running, 720 draws, 2 model draws on a regrouped mesh REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00c:`
  - REFUSED: `L2 Motion[9]: 78 frames, 3 started, up to 5 running, 1044 draws, 78 model draws on a regrouped mesh REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00`
  - REFUSED: `L2 Motion[28]: 53 frames, 1 started, up to 1 running, 10 draws REFUSED: unverified path: call to 0xa996b0, which is not translated (from 0x9b65b0) [alive: em087_00c:20(clip)x1]`
  - REFUSED: `L2 Motion[30]: 26 frames, 1 started, up to 1 running, 4 draws REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00c:14(clip)x1]`
  - REFUSED: `L2 Motion[32]: 7 frames, 1 started, up to 1 running, 4 draws REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00c:14(clip)x1]`
  - REFUSED: `L2 Motion[33]: 3 frames, 1 started, up to 1 running, 4 draws REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00c:14(clip)x1]`
  - REFUSED: `L2 Motion[35]: 20 frames, 1 started, up to 1 running, 4 draws REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00c:14(clip)x1]`
  - REFUSED: `L2 Motion[36]: 51 frames, 1 started, up to 1 running, 10 draws REFUSED: unverified path: call to 0xa996b0, which is not translated (from 0x9b65b0) [alive: em087_00c:20(clip)x1]`
  - REFUSED: `L2 Motion[38]: 5 frames, 1 started, up to 1 running, 4 draws REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00c:14(clip)x1]`
  - REFUSED: `L2 Motion[44]: 7 frames, 1 started, up to 4 running, 80 draws, 13 model draws on a regrouped mesh REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em087_00c:0(clip)x1 em087_00c:2`
  - REFUSED: `L2 Motion[45]: 7 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em087_00c:111(clip)x1]`
  - REFUSED: `L2 Motion[46]: 7 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em087_00c:111(clip)x1]`
  - REFUSED: `L2 Motion[47]: 7 frames, 1 started, up to 0 running, 0 draws REFUSED: unverified path: 0x44158 branch to unrecorded 0x441cc [alive: em087_00c:111(clip)x1]`
  - REFUSED: `L2 Motion[59]: 50 frames, 2 started, up to 8 running, 554 draws, 11 model draws on a regrouped mesh REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00`
  - REFUSED: `L2 Motion[67]: 35 frames, 2 started, up to 7 running, 458 draws, 90 model draws on a regrouped mesh REFUSED: unverified path: call to 0xa996b0, which is not translated (from 0x9b65b0) [alive: em087_00`
  - REFUSED: `L2 Motion[68]: 86 frames, 3 started, up to 3 running, 612 draws, 189 model draws on a regrouped mesh REFUSED: unverified path: call to 0xa996b0, which is not translated (from 0x9b65b0) [alive: em087_0`
  - REFUSED: `L2 Motion[70]: 150 frames, 7 started, up to 7 running, 1148 draws, 108 model draws on a regrouped mesh REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087`
  - REFUSED: `L2 Motion[71]: 80 frames, 6 started, up to 6 running, 1101 draws, 213 model draws on a regrouped mesh REFUSED: unverified path: call to 0xa996b0, which is not translated (from 0x9b65b0) [alive: em087_`
  - REFUSED: `L2 Motion[73]: 211 frames, 6 started, up to 6 running, 1489 draws, 174 model draws on a regrouped mesh REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087`
  - REFUSED: `L2 Motion[75]: 70 frames, 1 started, up to 1 running, 4 draws REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00c:18(clip)x1]`
  - REFUSED: `L2 Motion[77]: 97 frames, 1 started, up to 1 running, 4 draws REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00c:18(clip)x1]`
  - REFUSED: `L2 Motion[79]: 53 frames, 1 started, up to 3 running, 212 draws REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00c:101(clip)x2 em087_00c:18(clip)x1]`
  - REFUSED: `L2 Motion[81]: 58 frames, 1 started, up to 1 running, 4 draws REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00c:17(clip)x1]`
  - REFUSED: `L2 Motion[83]: 47 frames, 1 started, up to 1 running, 4 draws REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00c:17(clip)x1]`
  - REFUSED: `L2 Motion[85]: 47 frames, 2 started, up to 4 running, 463 draws, 18 model draws on a regrouped mesh REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00`
  - REFUSED: `L3 Motion[3]: 307 frames, 9 started, up to 6 running, 3534 draws, 860 model draws on a regrouped mesh REFUSED: unverified path: call to 0xa996b0, which is not translated (from 0x9b65b0) [alive: em087_`
  - REFUSED: `L3 Motion[5]: 35 frames, 2 started, up to 2 running, 64 draws REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00c:17(clip)x1 em087_00c:21(clip)x1]`
  - REFUSED: `L3 Motion[6]: 152 frames, 4 started, up to 3 running, 1082 draws, 159 model draws on a regrouped mesh REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_`
  - REFUSED: `L3 Motion[8]: 122 frames, 2 started, up to 2 running, 609 draws, 57 model draws on a regrouped mesh REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00`
  - REFUSED: `L3 Motion[9]: 152 frames, 4 started, up to 3 running, 1091 draws, 119 model draws on a regrouped mesh REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_`
  - REFUSED: `L3 Motion[11]: 134 frames, 2 started, up to 2 running, 679 draws, 63 model draws on a regrouped mesh REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_0`
  - REFUSED: `L3 Motion[12]: 90 frames, 3 started, up to 3 running, 212 draws, 49 model draws on a regrouped mesh REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00`
  - REFUSED: `L3 Motion[13]: 95 frames, 5 started, up to 5 running, 792 draws, 155 model draws on a regrouped mesh REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_0`
  - REFUSED: `L3 Motion[14]: 110 frames, 1 started, up to 1 running, 4 draws REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00c:19(clip)x1]`
  - REFUSED: `L3 Motion[15]: 31 frames, 1 started, up to 1 running, 4 draws REFUSED: unverified path: call to 0xaaeb90, which is not translated (from 0x9b65b0) [alive: em087_00c:14(clip)x1]`
  - REFUSED: `L3 Motion[16]: 56 frames, 7 started, up to 7 running, 1195 draws, 445 model draws on a regrouped mesh REFUSED: unverified path: call to 0xa996b0, which is not translated (from 0x9b65b0) [alive: em087_`
- Enable word **not transcribed** (not in PSL_MASK_MONSTERS): 96 bindings named outside the file mask (428 file-mask bindings, 524 whole-block).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c0 exported `em087_00_000` (4 billboard, 1 type 2, 8 model, 1 node): L2 M30 b1* L2 M62 b0* L2 M64 b0* L2 M73 b0*
  - c1 exported `em087_00_000` (4 billboard, 1 type 2, 8 model, 1 node): L0 M14 b0* L0 M19 b0* L2 M30 b0* L2 M41 b0* L2 M64 b1* L2 M65 b1* L2 M73 b3* L2 M77 b1*
  - c10 exported `em087_00_002` (3 billboard, 7 polyline, 1 model): L2 M43 b2*
  - c100 exported `em087_00_011` (8 model): L0 M14 b4* L0 M20 b4* L2 M5 b2* L2 M30 b5* L2 M33 b4* L2 M38 b5* L2 M42 b4* L2 M65 b4* +9 more
  - c101 exported `em087_00_011` (8 model): L0 M14 b5* L2 M4 b2* L2 M6 b4* L2 M30 b4* L2 M33 b5* L2 M38 b4* L2 M40 b4* L2 M48 b4* +10 more
  - c102 exported `em087_00_011` (8 model): L0 M7 b7* L0 M19 b5* L0 M20 b5* L2 M5 b4* L2 M42 b5* L2 M48 b5* L2 M74 b4* L2 M75 b5* +5 more
  - c103 exported `em087_00_011` (8 model): L0 M7 b6* L0 M20 b6* L2 M5 b3* L2 M40 b5* L2 M48 b6* L2 M74 b3* L2 M76 b3* L2 M80 b4* +3 more
  - c110 exported `em087_00_011` (8 model): L2 M38 b6* L2 M75 b6* L2 M77 b6* L2 M79 b6* L2 M81 b6*
  - c12 exported `em087_00_002` (3 billboard, 7 polyline, 1 model): L2 M83 b2*
  - c13 exported `em087_00_002` (3 billboard, 7 polyline, 1 model): L2 M77 b2* L2 M79 b2*
  - c14 exported `em087_00_002` (3 billboard, 7 polyline, 1 model): L2 M39 b3*
  - c16 exported `em087_00_002` (3 billboard, 7 polyline, 1 model): L2 M63 b2*
  - c17 exported `em087_00_002` (3 billboard, 7 polyline, 1 model): L2 M73 b2*
  - c2 exported `em087_00_000` (4 billboard, 1 type 2, 8 model, 1 node): L2 M3 b2* L2 M57 b2* L2 M60 b2* L2 M61 b2* L2 M64 b2* L2 M65 b2* L2 M77 b3*
  - c3 exported `em087_00_000` (4 billboard, 1 type 2, 8 model, 1 node): L2 M3 b3* L2 M64 b3* L2 M65 b3*
  - c31 exported `em087_00_004` (6 billboard, 3 model): L2 M73 b17*
  - u200 **not exported** `em088_00_013` (4 billboard, 1 type 2, 6 model): L2 M63 b3*
  - u203 **not exported** `em088_00_013` (4 billboard, 1 type 2, 6 model): L2 M63 b20*
- Shell-layer records not exported (no SHELL_DATA entry): 11 -- u0 `em087_00_006_s` u1 `em087_00_007` u30 `em087_00_008` u31 `em087_00_008` u32 `em087_00_008` u60 `em087_00_009` u61 `em087_00_010` u62 `em087_00_010` u90 `em087_00_012_s` u400 `cm002_031` u410 `cm002_032`
- Class-code records not exported (request sites unread): 15 -- u150 `em088_00_003_s` u500 `em087_00_013` u505 `em087_00_013` u510 `em087_00_013` u515 `em087_00_013` u520 `em087_00_013` u600 `em087_00_013` u605 `em087_00_013` u1014 `em087_00_013` u1015 `em087_00_013` u1020 `em087_00_013` c700 `em087_00_015` c800 `em084_00_200` c1600 `cm200_050_s` c1601 `cm200_050_s`

**Assessment.** The classifier calls all 44 exported records firing, and he exports no state record at all (no ailments, puff, breaks or u 1400; the triage names no shared-enemy-code record for him). **But the soak says otherwise: 37 of his 77 motions REFUSE** -- the worst result in any survey so far -- so most of his effects stop on screen. Then the enable word (the largest count in this set), two unexported PSL records, and his shell and class-code layers.

- **The refusals: three causes, all coverage of the effect runtime, none a decode of his own.** efx/vectors holds **no set for em087_00** -- he was never recorded -- so his generators reach code no recording ever did:
  - **26 x `call to 0xaaeb90, which is not translated (from 0x9b65b0)`** -- `0x9b65b0` is the draw pass's `blx [vt+0x4c]` on a generator (`ldr r1, [r0, #0x4c]` at `0x9b65a8`); `0xaaeb90` is slot +0x4c of the generator vtables `0x1789bb4` / `0x1789c20` (getDTI `0xaba21c` / `0xaba22c`; the type is NOT named here), never lifted. Alive at the refusal: c 14, 100, 101, 17, 18, 110 most often (L0 M9; L2 M6 / 9 / 30 / 32 / 33 / 35 / 38 / 59 / 70 / 73 / 75 / 77 / 79 / 81 / 83 / 85; L3 M5 / 6 / 8 / 9 / 11-15).
  - **7 x `call to 0xa996b0 ... (from 0x9b65b0)`** -- the same slot of the genType-2 family's five vtables `0x1789834..0x17899e4` (rom-map `gen+0xf4` row: genType 2 = vtable `0x1789834`), never lifted. Alive: c 20, 30, 1, 2, 100 (L2 M28 / 36 / 67 / 68 / 71, L3 M3 / M16).
  - **4 x `0x44158 branch to unrecorded 0x441cc`** -- in the request path (lifted-request.js): byte `[fp+0x2d1] == 0` takes an arm never recorded. Alive: c 111 (L2 M44-M47).
  - Cure: record his sets (add_effects.py --record), then lift `0xaaeb90`, `0xa996b0` and the `0x441cc` arm. That is a lift of two whole new methods, not a missing block -- the largest recorder job in this set, and the first thing to do for him: the word and the rest add records to a runtime that stops.

- **The enable word, read in part here**: uEm087_00 vt+0x13c = `0x10ad838`. It does **not** call the base 0xca170 directly: it calls **`0x6d1b4`** (`0x10ad840`), which no vtable in class-effects.json holds at +0x13c and which itself starts with `bl 0xca170`. Then, unconditionally, it ORs **`0x3f8000 | 0xc00000` = bits 15-23** into +0x13f4 (`0x10ad844..0x10ad858`). After that it switches on the CURRENT motion (`0xb0944` = halfword `e+0x4b4`) over `0x303..0x310` (L3 M3..M16, table `0x10ad884`, 14 entries) -- but those arms write no +0x13f4: they are part work (`0x9d36c` break levels of parts 3 and 4 against .dtp bytes, `e+0xd4d7 / +0xd4d8` cleared, `0x99cfc(e, part, 1)`, `[e+0x1428]+0x3e0 / +0x3ec`) and two tail-calls `0x7ded8(e, 0, 0x5f / 0x60)` (L3 M3 / L3 M16). Unusual for an enable-word method, and unread as to meaning.
  - `0x6d1b4..0x6d358` is already mapped (rom-map `0x6d1b4` row, Carapaceons / Neopterons survey: the +0x13c base of uEm087_00 AND uEm088_00 Ahtal-Ka only; "whether those write +0x13f4: UNREAD"). Added here: for uEm087_00 (and uEm088_00, the same slots) **vt+0x484 = `0x6d594`, `bx lr`**; **vt+0x488 = `0x6d598`**, which by its 5th argument's bits 0 / 1 stores `[e+0x1428]+0xb08 = 1` and the halfword `e+0xcaf6` / `e+0xcaf8` (post-indexed pointer `e+0x1428`, then `+0xb6ce` / `+0xb6d0`) to `[e+0x1428]+0xb0a`, clears bit 3 of r3, and tail-calls `0x7db70` -- no `0x13f4` in it. Left: `0x7db70` and `0xb07b4`, scanned transitively for a +0x13f4 write; until then "0x6d1b4 adds no bits" is INFERRED.
  - If it holds, his word is **base | bits 15-23, every motion**: all 96 outside-mask bindings come in (80 at bits 0-5, 14 calm-gated at 6-8, c 31 at b17 and u 203 at b20), and the 54 file-mask bindings at 15-23 keep firing as they do now. The change on screen is the calm gating of his 54 + 14 bindings at bits 6-8.
- **u 200 / u 203** (`em088_00_013`, Ahtal-Ka's file, L2 M63 b3 / b20, outside the mask): not exported; they come in with the word's --apply.
- **Shells**: 11 records (u 0 / 1 / 30 / 31 / 32 / 60 / 61 / 62 / 90 / 400 / 410), no SHELL_DATA entry. **Class code**: 15 records (u 150, u 500 / 505 / 510 / 515 / 520 / 600 / 605, u 1014 / 1015 / 1020, c 700 / 800 / 1600 / 1601), request sites unread -- uEm087_00 shares its module with uEm088_00 and the ControlUnit / Rubble classes (class-effects.json), the per-module band trap (memory: notice-marks-mapping).
- His name is null in docs/monsters.json (part-review.json authors "Ahtal-Neset"); the note uses that name.

## '???' (docs/monster-classes.json)

### Gore Magala (`em071_00`)

- Soak: 104 motions played in the viewer, 0 refused (279 s)
- Enable word **not transcribed** (not in PSL_MASK_MONSTERS): 22 bindings named outside the file mask (195 file-mask bindings, 217 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) c1120(ragePuff) c1121(ragePuff) u1000(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c101 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M13 b1 L2 M27 b0
  - c110 **not exported** `em071_00_019` (2 billboard, 1 type 2, 20 model): L2 M33 b0
  - c30 exported `cm202_020` (5 type 2, 27 model, 5 node): L3 M40 b0*
  - c90 exported `cm202_020` (5 type 2, 27 model, 5 node): L0 M92 b0*
  - c91 exported `cm202_020` (5 type 2, 27 model, 5 node): L0 M92 b1*
  - u201 **not exported** `em071_00_002` (1 billboard, 2 model): L0 M92 b4*
  - u202 **not exported** `em071_00_001` (1 billboard, 2 model): L0 M92 b2*
  - u230 exported `em071_00_004` (2 billboard, 2 model): L2 M4 b9* L2 M6 b9* L2 M52 b6* L2 M52 b9*
  - u231 exported `em071_00_003` (1 billboard, 3 model): L2 M52 b0*
  - u234 exported `em071_00_003` (1 billboard, 3 model): L2 M4 b10* L2 M6 b10* L2 M52 b7* L2 M52 b10*
  - u250 **not exported** `em071_00_012` (3 billboard, 6 model): L2 M4 b12* L2 M6 b12* L2 M52 b12*
  - u260 **not exported** `em071_00_010` (4 billboard, 6 model): L2 M7 b6* L2 M7 b9* L2 M7 b15* L2 M7 b18*
  - u280 **not exported** `em071_00_012` (3 billboard, 6 model): L2 M7 b12*
- Shell-layer records not exported (no SHELL_DATA entry): 11 -- u0 `em071_00_007` u1 `em071_00_008` u10 `em071_00_007` u11 `em071_00_008` u150 `em071_00_013` u151 `em071_00_013` u152 `em071_00_014` u162 `em071_00_014` u172 `em071_00_014` u210 `em071_00_005` u220 `em071_00_005`
- Class-code records not exported (request sites unread): 7 -- u30 `em071_00_018` u31 `em071_00_018` u1035 `cm202_060` u1010 `cm202_061` u1015 `cm202_061` c1146 `cm104_000` c1147 `cm104_000`

**Assessment.** The most undriven state records in this set, and the frenzy breath Raven named on 2026-09-26 is still not in: it is the shell layer. **No MOTION_STATES block, no states decode note.**

- **The tail sever (u 900) and its landing (u 905, CUT_TAIL)**: his only sever site, READ here, is `0xfae5cc` (`bl 0xc2274`, behind `cmp r0, #6` at `0xfae5ac`): slot r1 = 0, **joint byte r3 = 0x8f = 143**. `em071_00_tail.glb` and `em071_05_tail.glb` are staged in docs/models/monsters. Unread: the clip the sever plays (the u 900 row), and his uEnemyOption descriptor (the piece's option motion list). Then a CUT_TAIL entry `{ piece: 'em071_00_tail', joint: 143, landing: ['em071_00u', 905] }` and a `drops: true` row.
- **The rage puff -- two pairs exported, c 1120 / 1121 (`cm200_007`) and u 1120 / 1121 (his `em071_00_020`)**: vt+0x2a4 = `0xfbec80`, **instruction for instruction Rathian's `0xd08afc`** (same calls 0x13ecc14 / 0x13ecba8, same literal 0x4622f983, same `cmp 0x6e38`; READ here) -- so `rathianPuffPick`, a LIVE pick on a joint's pose. His setup writes **P+0x5d04 = 4** (`0xfadb98` `movw r2, #0x5d04`, the store at `0xfadbac`; rom-map uEm071_00 row, from the Elder Dragons survey -- Shagaru runs this class) and the band holds no `0xb7d2` / `0xb7d3` immediate, so the shared puff runs: **config-only** -- RAGE_PUFF `{ period: 30, joint: 4, records: [['em071_00u', 1120], ['em071_00u', 1121]], pick: rathianPuffPick }` + `_autoOnRage`, exactly Diablos's shape. The puff request goes through the base u table (`0x159c7fc` `{1120, 1121, ...}`, rom-map `0xa3ddc`), so the c 1120 / 1121 pair (`cm200_007`) is not what the puff asks for; whether anything else requests it is NOT READ.
- **u 1000** (`cm202_060`, the break record): part, level and clip unread.
- **The ailments c 1101 / 1102 / 1103 / 1105 / 1109 and c 1104**: as Najarala's (prober for the clips); no `e+0xb7d3` write in the band, so c 1104 is TIRED_DROOL once his stamina block is checked (whether he tires: NOT READ).
- **The class is shared with Shagaru Magala (em072_00)** -- no uEm072_00 exists (rom-map uEm071_00 row; dev/elder-dragons-effects-survey.md), so the word and the puff pick read here also answer for Shagaru (neither tests the monster); the class tests `+0xb5f4` against 71 / 72 elsewhere, and whether the sever site `0xfae5cc` is reached for Shagaru was not checked.
- **The enable word, READ WHOLE here**: uEm071_00 vt+0x13c = `0xfc08a8..0xfc0910` (the pop; one `0x13f4` writer, `0xfc08fc`). `bl 0xca170`, then ONE arm: **L2 M7 (`0x207`), status 7** (`e+0x73e0`), number `e+0x73e1`: **0x60 -> bits 18-20, 0x58 -> bits 15-17**, and for both it CLEARS bits 6 and 9 (`bic 0x240`); any other number, and every other motion, the base alone. No variant test, so Chaotic takes the same word.
  - What it changes: L2 M7's u 260 sits on b6 / b9 (calm / enraged) AND b15 / b18 (the two actions), all outside the file mask -- so with the word the two attacks show u 260 and the plain plays of L2 M7 show it by state. The viewer needs the action for L2 M7 plays (CLIP_ACTIONS); which actions play L2 M7 is NOT READ (the arm tests motion and action together, so (7, 0x58) / (7, 0x60) playing L2 M7 is INFERRED from the arm). His 22 outside-mask bindings: 6 at bits 0-5, 14 in the state groups, 2 on L2 M7's action bits.
- **c 101 / c 110 are stage-ray records** (inside the file mask: c 101 `cm202_020` L2 M13 b1 / L2 M27 b0, c 110 `em071_00_019` L2 M33 b0), refused when he was applied, recordable since 2026-10-07. **Caution: c 101 is the very record that FAULTED in the recorder** with the stage ray allowed (UC_ERR_READ_UNMAPPED at `0xc14100`, a collision-side structure; E:\offline\decode\notes\effects-ground-ray.md "Measured, 2026-09-25": c 30 / 90 / 91 / 100 of the same .efl recorded, c 101 faulted). The retirement was measured on Boltreaver's u 605 only; his c 101 is the first thing to record and check.
- **Unexported records outside the mask** (come in with the word's --apply): u 201 / 202 (L0 M92 b4 / b2), u 250 (b12 tired), u 260, u 280.
- **Shells**: 11 records -- the BREATH and frenzy layer: u 0 / 1 / 10 / 11 (`em071_00_007 / _008`, shell00 mode 0, shell03 modes 0 / 4-6 / 11-13), u 150 / 151 / 152 / 162 / 172 (`_013 / _014`, shell01 modes 2-7, shell11 modes 1-2), u 210 / 220 (`_005`). No SHELL_DATA entry: the carrier (shells.js) comes first.
- **Class code**: u 30 / 31 (`em071_00_018`), u 1010 / 1015 / 1035, c 1146 / 1147 (`cm104_000`) -- request sites unread.

### Chaotic Gore Magala (`em071_05`)

- Soak: 114 motions played in the viewer, 0 refused (345 s)
- Enable word **not transcribed** (not in PSL_MASK_MONSTERS): 27 bindings named outside the file mask (222 file-mask bindings, 249 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) c1120(ragePuff) c1121(ragePuff) u1000(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c101 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M13 b1 L2 M27 b0
  - c110 **not exported** `em071_00_019` (2 billboard, 1 type 2, 20 model): L2 M33 b0
  - c151 exported `cm202_030` (4 model): L4 M26 b1*
  - c30 exported `cm202_020` (5 type 2, 27 model, 5 node): L3 M40 b0* L4 M26 b0*
  - c90 exported `cm202_020` (5 type 2, 27 model, 5 node): L0 M92 b0*
  - c91 exported `cm202_020` (5 type 2, 27 model, 5 node): L0 M92 b1*
  - u201 **not exported** `em071_00_002` (1 billboard, 2 model): L0 M92 b4*
  - u202 **not exported** `em071_00_001` (1 billboard, 2 model): L0 M92 b2*
  - u230 exported `em071_00_004` (2 billboard, 2 model): L2 M4 b9* L2 M6 b9* L2 M52 b6* L2 M52 b9*
  - u231 exported `em071_00_003` (1 billboard, 3 model): L2 M52 b0*
  - u232 exported `em071_00_015` (1 billboard, 1 model): L4 M24 b1*
  - u233 exported `em071_00_016` (2 billboard, 5 model): L4 M24 b0*
  - u234 exported `em071_00_003` (1 billboard, 3 model): L2 M4 b10* L2 M6 b10* L2 M52 b7* L2 M52 b10*
  - u235 exported `em071_00_016` (2 billboard, 5 model): L4 M24 b2*
  - u250 **not exported** `em071_00_012` (3 billboard, 6 model): L2 M4 b12* L2 M6 b12* L2 M52 b12*
  - u260 exported `em071_00_010` (4 billboard, 6 model): L2 M7 b6* L2 M7 b9* L2 M7 b15* L2 M7 b18*
  - u280 **not exported** `em071_00_012` (3 billboard, 6 model): L2 M7 b12*
  - u700 **not exported** `em071_00_019` (2 billboard, 1 type 2, 20 model): L4 M21 b0
- Shell-layer records not exported (no SHELL_DATA entry): 21 -- u0 `em071_00_007` u1 `em071_00_008` u10 `em071_00_007` u11 `em071_00_008` u60 `em072_00_002` u61 `em072_00_003` u90 `em072_00_011` u91 `em072_00_010` u120 `em072_00_004` u121 `em072_00_005_s` u123 `em072_00_006` u150 `em071_00_013` u151 `em071_00_013` u152 `em071_00_014` u153 `em071_00_014` u154 `em071_00_014` u180 `em072_00_004` u181 `em072_00_012` u182 `em072_00_010` u210 `em071_00_005` u220 `em071_00_005`
- Class-code records not exported (request sites unread): 8 -- u30 `em071_00_018` u31 `em071_00_018` u124 `em072_00_007` u1035 `cm202_060` u1010 `cm202_061` u1015 `cm202_061` c1146 `cm104_000` c1147 `cm104_000`

**Assessment.** Gore Magala's class and vtable (getDTI `0xfc0b1c` appears once in main.data; there is no uEm071_05), so the same enable word (it has no variant test), the same sever site and the same puff pick; everything in Gore's assessment applies. His own:

- **u 700** (`em071_00_019`, L4 M21 b0, inside the file mask) is a third stage-ray record (with c 101 / c 110), recordable now; same caution as Gore's c 101.
- **His list 4** carries 5 of his 27 outside-mask bindings (the other 22 are Gore's), all at bits 0-5 (u 232 / 233 / 235 on L4 M24, c 30 / c 151 on L4 M26): they come in with any transcription of the word.
- **Shells**: 21 records -- Gore's 11 (less u 162 / 172, plus u 153 / 154) and ten of Shagaru Magala's files (`em072_00_002..012`: u 60 / 61 / 90 / 91 / 120 / 121 / 123 / 180 / 181 / 182). No SHELL_DATA entry. **Class code**: Gore's plus u 124 (`em072_00_007`).
- The open board item "Chaotic Gore's wing effect does not show" (2026-09-14) is a MATERIAL (XfB_W__m01_kasan uv), not an effect record; nothing in this survey touches it.

## The enable words read for this pass

| class (monsters) | vt | +0x13c | extent | what it ORs over the base | inputs the viewer lacks |
|---|---|---|---|---|---|
| uEm057_00 (Zinogre, Thunderlord) | `0x17ca8ec` | `0xf0279c` | `0xf0279c..0xf02e94` (pool to `0xf02ea0`) | NOT READ arm by arm: variant split at `0xf027b8`, jump tables over `0x201..0x23f`, death motions, L0 M20 / M24; sets and clears bits | variant, charged (have), rank (have: 5), action, `e+0xb5f8`, `e+0xcb14`, `e+0xb720` |
| uEm068_00 (Najarala) | `0x17df180` | `0xf88044` | `0xf88044..0xf880e0` | L2 M61: part 2 broken (vs .dtp byte +5 / +6 by rank) ? 18-20 : 15-17; L0 M44: sunk ? 18 : 15-17 | part 2 broken (from parts shown); sunk (stand-in false) |
| uEm070_00 (Nerscylla) | `0x17e222c` | `0xfab634` | `0xfab634..0xfab6b8` | every motion: rank 5 -> 21-23, 3 -> 18-20, 1 / 0 -> 15-17; L0 M6 / M8 with `e+0x1068` bit 3 -> 30-31 | rank (have: 5); the floor flag bit 3 |
| uEm071_00 (Gore, Chaotic) | `0x17e418c` | `0xfc08a8` | `0xfc08a8..0xfc0910` | L2 M7 with (7, 0x60) -> 18-20, (7, 0x58) -> 15-17, both clearing bits 6 and 9 | the action of an L2 M7 play |
| uEm087_00 (Ahtal-Neset) | `0x17f9aec` | `0x10ad838` | `0x10ad838..0x10ad9f4` (last insn `b 0x7ded8` at `0x10ad9f0`) | via `0x6d1b4` (base + a motion-keyed table walk), then bits 15-23 always; the L3 M3..M16 switch writes no word | none, if `0x6d1b4`'s callees add nothing (INFERRED) |

## What closing each needs (easiest first)

1. **Config-only rows**
   *1a -- the data is READ:*
   - **Najarala's u 1400** -- `'0|Motion[44]': { hold: ['em068_00u', 1400] }`, the first row of a new em068_00 MOTION_STATES block (rom-map "u 1400 -- the per-class sweep"). *1 monster.*
   - **Zinogre / Thunderlord's tail drop joint** -- CUT_TAIL says 144, the sever passes 143 (`0xeed248`); a one-number correction, for the owner of tail-option.js to confirm against the Diablos precedent. *2 monsters.*
   - **Rage puff** (RAGE_PUFF + `_autoOnRage`): Najarala and Nerscylla `{ period: 30, joint: the record's, pick: () => 0 }` (vt+0x2a4 the base stub, no P+0x5d04 / `e+0xb7d2` write in the band); Gore and Chaotic `{ period: 30, joint: 4, pick: rathianPuffPick }` on their u 1120 / 1121 (vt+0x2a4 `0xfbec80` = Rathian's `0xd08afc` instruction for instruction; P+0x5d04 = 4 at `0xfadbac`; no `e+0xb7d2` write). *4 monsters.*
   - **Najarala's tired drool c 1104** -- TIRED_DROOL `['em068_00c', 1104]` (tired-capable: his Exhausted state on 0x81614; no `e+0xb7d3` write in the band). *1 monster.*
   - **Thunderlord's c 1104** -- nothing to do: no tired state (read). *Reclassified, not a gap.*
   *1b -- config rows after one small read each (no states note exists for these three classes, so each needs its read first):*
   - **Ailment rows c 1101 / 1102 / 1103 / 1105 / 1109**: the action -> clip map with the generic prober (efx/agents/notice-scratch/probe.py), then rows as every other monster's. *4 monsters: Najarala, Nerscylla, Gore, Chaotic.*
   - **Tired drool c 1104** for Nerscylla, Gore, Chaotic: no `e+0xb7d3` write in their bands; left: whether they tire (`[tune+0x30]`, the stamina block). *3 monsters.*
   - **Break records**: Najarala u 1001, Gore / Chaotic u 1000 -- part, level, clip. *3 monsters.*
   - **Gore / Chaotic's tail**: sever site READ (`0xfae5cc`, joint 143) and both tail glbs staged; left: the sever clip (the u 900 row) and the option descriptor (CUT_TAIL u 905). *2 monsters.*
2. **Base-only enable words**: **none** -- all five classes override vt+0x13c. *0 monsters.*
3. **Override enable words** (then add_effects.py --apply / --record / --check, which also brings in the unexported outside-mask records: Zinogre 14, Thunderlord 23, Nerscylla 14, Gore 5, Chaotic 4, Ahtal-Neset 2)
   - **Read whole here, transcription only**: Gore and Chaotic (`0xfc08a8`; needs CLIP_ACTIONS for L2 M7, whose actions are unread), Najarala (`0xf88044`; needs his part-2 broken set from the parts shown), Nerscylla (`0xfab634`; rank from SHELL_QUEST_RANK, a stand-in for the floor bit). Najarala and Nerscylla are VISIBLE fixes, not just additions: the viewer fires both of Najarala's L2 M61 forms and all three of Nerscylla's rank forms at once today. *4 monsters.*
   - **Read in part**: Ahtal-Neset (`0x10ad838`, body read here; left: a transitive scan of `0x6d1b4`'s callees `0x7db70` and `0xb07b4` for a +0x13f4 write -- the same read Ahtal-Ka's `0x10bc340` is blocked on, so one scan unblocks both). His 96 outside-mask bindings, the most in this set, all come in once it holds. *1 monster (+ Ahtal-Ka).*
   - **To read whole and emulate**: Zinogre and Thunderlord (`0xf0279c`, ~0x6f8 bytes, two variant arms; 42 bindings each at bits 15-31 and 21 file-mask bindings that fire unconditionally today). The largest read in this set. *2 monsters.*
4. **Records needing a recorder pass**
   - **Ahtal-Neset's 37 refusals of 77 motions** -- never recorded (no em087_00 set); two generator methods never lifted (`0xaaeb90`, `0xa996b0`, both reached through the draw pass's `blx [vt+0x4c]` at `0x9b65b0`) plus the `0x44158 -> 0x441cc` request arm. Record, then lift two whole methods. The biggest recorder job here and his first step. *1 monster.*
   - **Najarala's `0xcad554 -> 0xcad560` refusal** (6: L2 M61, L2 M70-74): he has never been recorded (no em068_00 set in efx/vectors); record his sets, then lift the `+0x41` bit-1 arm of `0xcad528`. Each refusal stops all his effects until reload, and L2 M61 is also the motion his enable word fixes. *1 monster.*
   - **The `0xa92798` refusal on L3 M9** (u 530 / 531): a recording that reaches the non-empty list walk in `0xa9272c`, then a lift -- the same cure Nibelsnarf's board item waits on. It stops all of the monster's effects until reload. *2 monsters: Zinogre, Thunderlord.*
   - **Stage-ray records, recordable since 2026-10-07**: Zinogre / Thunderlord c 230; Gore c 101 / c 110; Chaotic c 101 / c 110 / u 700. **Gore's c 101 is the record that faulted the recorder on 2026-09-25** -- record it first. *4 monsters.*
5. **Shells, class code, undecoded**
   - **Shells** -- none of the seven has a SHELL_DATA entry: Zinogre 5, Thunderlord 16, Najarala 6, Nerscylla 7, **Gore 11 (the frenzy breath)**, Chaotic 21 (ten of them Shagaru's files), Ahtal-Neset 11 -- 77 records; shells.js carriers first. *7 monsters.*
   - **Class-code records** (request sites unread): Zinogre u 90 / 120, Thunderlord u 42 / 90 / 151 / 280, Najarala u 1010 / 1015 / 1030 / 1035, Nerscylla u 30-34 / 1006 / 1007 / 1011 / 1021, Gore u 30 / 31 / 1010 / 1015 / 1035 / c 1146 / 1147, Chaotic the same + u 124, Ahtal-Neset 15. (Zinogre's and Thunderlord's u 30 / 31 stay unwired on purpose.) *7 monsters.*
   - **Thunderlord's list 9 actions**: unread (motion-states.js em057_04 header). *1 monster.*

## Unread, named

- The PSL enable word of uEm057_00 (arm by arm); the transitive callees of `0x6d1b4` (`0x7db70`, `0xb07b4`; Ahtal-Neset and Ahtal-Ka); what floor sets `e+0x1068` bit 3 (Nerscylla's bits 30-31).
- The action -> clip maps of uEm068_00, uEm070_00, uEm071_00 (ailments, breaks, sever); whether Nerscylla and Gore tire (`[tune+0x30]`); Najarala's part-2 broken set.
- Whether anything requests Gore's c 1120 / 1121 (the puff takes the u pair). The gate scans (`0xb7d2 / 0xb7d3 / 0x5d04`) are by class band -- an address range, not proven membership.
- Gore's uEnemyOption descriptor and sever clip; which actions play Gore's L2 M7; Thunderlord's list-9 actions; the meaning of Ahtal-Neset's L3 M3..M16 part arms and `0x7ded8(e, 0, 0x5f / 0x60)`.
- The meaning of the `0xa92798` list (`[r5+0xb0]`) -- not needed for the cure, which is a recording that reaches it.
