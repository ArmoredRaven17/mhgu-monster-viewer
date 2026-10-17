# Fanged Beasts -- effects survey (survey agent for the Viewer agent, 2026-10-15)

Raven: "For each category of large monster remaining, have a sub agent assess the missing effects."

ASSESS ONLY: nothing under docs/ was changed, no recorder or lift was run. Same method as the Flying, Brute and Bird Wyvern passes (dev/bird-wyverns-effects-survey.md, dev/brute-wyverns-effects-survey.md).

## How it was measured

- **Exported / firing**: efx/effects_status.py per record (clip bits, shells, rage, MOTION_STATES events, the shared states). Corrections to its output: c 1100 (Poisoned) and c 1108 (Dung Bombed) are driven by SharedStates from the state toggles -- the classifier returns `wired` for any `event` record before it checks the shared keys -- and the deliberate exclusions are not gaps: blast c 1130-1137, notice c 1200/1201 (off the list), hyper u 1301-1315 (withheld), c 1500 (lying in water), c 1106 (Raven). New in this pass: records the ROM is READ never to request for that monster are not gaps either (Rajang u 1120 / 1121, Furious Rajang c 1104 / 1109; per monster below).
- **The PSL enable word**: add_effects.py plan() run twice -- on the blocks' FILE masks (what the viewer binds today for a monster whose class +0x13c is untranscribed) and on the WHOLE blocks (every named bit). The difference is what the game decides with the monster's enemy +0x13f4 word. None of the thirteen is in psl-mask.js PSL_MASK_MONSTERS. `*` = named outside the file mask. A name with no file (`-`) is a bit naming a key that has no record in any array: not an effect. Each class's vt+0x13c word was read off its vtable (efx/class-effects.json; controls uEm004_00 0xd2e0ec, uEm032_00 / uEm014_00 0xca170 match); "first look" = the override disassembled whole to its return here, NOT emulated and not transcribed.
- **Refusals**: dev/effect-live-soak.mjs <mon> --viewer-inputs, every bound motion in the viewer, one at a time through the shared two-slot lock. A refusal stops every effect of the monster until reload.
- **Unexported records with a file**: every one in the file mask is a ground-ray record (payload +0x52 set, +0x5c bit 4) -- the stage ray refused before 2026-10-07 and recordable since (add_effects.py stage_ray retired); the plan now gives each `ok`. Those outside the mask come in with their class's --apply.

## Summary

| # | monster | exported | firing | gaps (undriven, not deliberate) | enable word (vt+0x13c) | bindings outside file mask | PSL records not exported (with a file) | soak |
|---|---|---|---|---|---|---|---|---|
| 1 | Congalala `em021_00` | 58 | 41 | c1105(event) | uEm021_00 `0xdd7cf4`: override, READ (states-em021_00.md 3.4), untranscribed | 11 | c150 c151 c152 c153 c190 c191 c40 u241 u261 u262 u263 u281 | clean |
| 2 | Blangonga `em022_00` | 54 | 38 | c1105(event) u1400(event) | uEm022_00 `0xdda5ac`: override, first look | 0 | c40 c41 c42 | clean |
| 3 | Rajang `em023_00` | 57 | 30 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1000(event) u1001(event) | uEm023_00 `0xded0f4`: override, first look | 11 | c153 u294 | clean |
| 4 | Furious Rajang `em023_05` | 53 | 39 | c1105(event) | uEm023_00 `0xded0f4`: override, first look | 11 | c153 u294 | clean |
| 5 | Bulldrome `em030_00` | 26 | 21 | u1400(event) | uEm030_00 `0xe1c4b0`: override, first look | 0 | -- | clean |
| 6 | Arzuros `em060_00` | 50 | 34 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1120(ragePuff) u1121(ragePuff) | uEm060_00 `0xf1911c`: override, first look | 0 | -- | clean |
| 7 | Redhelm Arzuros `em060_04` | 60 | 43 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1001(event) u1120(ragePuff) u1121(ragePuff) | uEm060_00 `0xf1911c`: override, first look | 0 | -- | clean |
| 8 | Lagombi `em061_00` | 57 | 48 | c1105(event) | uEm061_00 `0xf32bac`: override, first look | 0 | -- | clean |
| 9 | Snowbaron Lagombi `em061_04` | 65 | 56 | c1105(event) | uEm061_00 `0xf32bac`: override, first look | 0 | -- | clean |
| 10 | Volvidon `em062_00` | 57 | 40 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1000(event) u1120(ragePuff) u1121(ragePuff) | uEm060_00 `0xf1911c`: override, first look | 0 | -- | clean |
| 11 | Kecha Wacha `em065_00` | 64 | 43 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1001(event) u1120(ragePuff) u1121(ragePuff) | uEm065_00 `0xca170`: **base -- no override** | 1 | c110 c42 c43 c44 | clean |
| 12 | Gammoth `em083_00` | 84 | 65 | -- | uEm083_00 `0x1054b8c`: override, first look | 0 | u242 u261 u302 u303 u340 u400 | **2 refused** |
| 13 | Elderfrost Gammoth `em083_04` | 86 | 75 | -- | uEm083_00 `0x1054b8c`: override, first look | 0 | u261 u302 u303 u340 u400 u472 u473 u520 | **2 refused** |

## Per monster

### Congalala (`em021_00`)

- Soak: 52 motions played in the viewer, 0 refused (77 s)
- Enable word: class uEm021_00, vt+0x13c `0xdd7cf4` -- override, READ (states-em021_00.md 3.4), untranscribed; 11 bindings named outside the file mask (66 file-mask bindings, 77 whole-block).
- Exported but undriven (not deliberate): c1105(event)
- **c 1105 (shock trap)**: (10, 0x6e) holds **L3 M6** and recovers on L3 M3 (states-em021_00.md 69, 779) -- L3 M6 is also the paralysis hold, and motion-states.js em021_00 `'3|Motion[6]'` shows paralysis (c 1101) "as every monster wired before him is". No clip of the trap's own. Config-only: a `cycle: [{ every: [c 1101, 60] }, { every: [c 1105, 42] }]` as Bulldrome's L3 M11 carries -- a choice, not a read.
- **Enable word**: vt+0x13c 0xdd7cf4 (0xdd7cf4..0xdd7f98) is already READ in states-em021_00.md 3.4 -- under the name "attack hit-group mask", which rom-map withdrew (it is the PSL enable word, rom-map line ~700). By motion: L0 M43 / L2 M16 by the gas type `ctl[1]` (1 -> bits 15-16, 2 -> 19-20, 3 -> 17-18, 4 -> 21-22); L0 M25 by the item `ctl[0]` (0 by the action number via 0xb0944, 1 none, 2 -> 15-16, 3 -> 21-22, 4 -> 17-18, 5 -> 19-20); L0 M28 `ctl[0] == 1` and action (1, 9) -> 27-28; L2 M2 (7, 1) / (7, 0) -> 25-26 / 23-24; L3 M15 alive (vt+0x3f4) -> 27-28, else asleep (0x81bb0(e, 0)) -> 29-30. **So eating DOES change his effects**, against motion-states.js em021_00 "HIS GAS TYPE CHANGES NO VISUAL ... a PSL binding the class does not make": today the viewer fires all four gas records u 200-203 on L2 M16 at once (the file mask; four byte-identical records, so four copies stacked) where the game fires one, and both c 3001 and c 50 on L3 M15 where the game fires one. Transcribing it needs a gas-type / item state in the viewer (the item is a stage-keyed random pick, the gas type a status-1 eating action).
- Unexported, outside the file mask (come in with the class --apply): c 150-153 (L0 M25), u 261-263 (L0 M43), u 281 (L2 M2), u 241 (L2 M5 bit 12, the tired group -- the base word fires it).
- Unexported ground-ray records (payload +0x52 set, +0x5c bit 4 -- refused before 2026-10-07, now recordable): c 40 (L0 M9), c 190 / c 191 (L0 M39).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c150 **not exported** `cm202_070` (1 billboard, 1 model): L0 M25 b15*
  - c151 **not exported** `cm202_070` (1 billboard, 1 model): L0 M25 b17*
  - c152 **not exported** `cm202_070` (1 billboard, 1 model): L0 M25 b19*
  - c153 **not exported** `cm202_070` (1 billboard, 1 model): L0 M25 b21*
  - c190 **not exported** `cm202_002` (5 type 2, 20 model): L0 M39 b0
  - c191 **not exported** `cm202_002` (5 type 2, 20 model): L0 M39 b1
  - c40 **not exported** `cm202_002` (5 type 2, 20 model): L0 M9 b0
  - u241 **not exported** `em021_00_001` (5 billboard, 1 polyline, 3 model): L2 M5 b12*
  - u260 exported `em021_00_007` (1 billboard): L0 M43 b15*
  - u261 **not exported** `em021_00_007` (1 billboard): L0 M43 b17*
  - u262 **not exported** `em021_00_007` (1 billboard): L0 M43 b19*
  - u263 **not exported** `em021_00_007` (1 billboard): L0 M43 b21*
  - u280 exported `cm202_020` (5 type 2, 27 model, 5 node): L2 M2 b23*
  - u281 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M2 b25*

### Blangonga (`em022_00`)

- Soak: 65 motions played in the viewer, 0 refused (95 s)
- Enable word: class uEm022_00, vt+0x13c `0xdda5ac` -- override, first look; 0 bindings named outside the file mask (97 file-mask bindings, 97 whole-block).
- Exported but undriven (not deliberate): c1105(event) u1400(event)
- **c 1105 (shock trap)**: (10, 0x6e) holds **L3 M9** -> L0 M30 (states-em022_00.md 77, 679) -- the paralysis hold too; motion-states.js em022_00 left it DELIBERATELY ("its record c 1105 is byte-identical to c 1101 but for the key -- so paralysis is what it shows and nothing is lost by it"). Only the period differs (42 against 60). Config-only cycle if wanted.
- **u 1400**: "requester not found in this class" (states-em022_00.md 743); rom-map's u 1400 table has em022_00 UNRESOLVED because class-effects.json gives him the shared layer 0x6bb14..0xcad08 (his frame handler is the base 0x6be64). This pass: his vtable's own slots span 0xdd9c64..0xde0c50 (the enable word 0xdda5ac among them); a branch scan (b / bl, any condition) of 0xdd8508..0xde1a08 finds NO call to 0xa499c; control: the same scan finds Bulldrome's tail call at 0xe1e8d0. Transitive calls not scanned, so INFERRED: nothing in his class asks for u 1400 -- probably never requested, not a gap.
- **Enable word**: vt+0x13c 0xdda5ac (first look: the whole method to its pop 0xdda65c, not emulated): base, then L0 M5 / M6 / M7 / M8 / M18 -> bits 15-17, or 18-20 when 0x81d6c (posture 4 and sunk); L0 M32 / M33 -> bits 21-23 while the fangs' break level 0x9d36c(e, 0) is BELOW the .dtp threshold byte (`[[e+0x75f0]+0x64]` +1, +2 above rank 4: `cmp r5, r0; popls`). So c 120 on the rage roar (L0 M32) and the summon howl (L0 M33) stops once the fangs break -- the same gate as the summon (+0x2a8). The viewer fires it always. 0 bindings outside the file mask.
- Unexported ground-ray records, now recordable: c 40 (L2 M7), c 41 (L2 M5), c 42 (L2 M6).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c40 **not exported** `cm202_002` (5 type 2, 20 model): L2 M7 b0
  - c41 **not exported** `cm202_002` (5 type 2, 20 model): L2 M5 b1
  - c42 **not exported** `cm202_002` (5 type 2, 20 model): L2 M6 b1

### Rajang (`em023_00`)

- Soak: 63 motions played in the viewer, 0 refused (151 s)
- Enable word: class uEm023_00, vt+0x13c `0xded0f4` -- override, first look; 11 bindings named outside the file mask (117 file-mask bindings, 128 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1000(event) u1001(event)
- **No MOTION_STATES block at all**: c 1101-1105, c 1109, u 1000 / u 1001 are undriven for that reason alone. The read exists: states-em023_05.md enumerated every (status, number) for variant 0 AND 5 ("not one action differs", section 7) and gives Rajang's own arms -- his tune+0x30 (stamina) and +0x44 are present, so he tires (the tired idle (0, 2) = L0 M17 with the drool c 1104, section 6) and the exhaust c 1109 procs on L3 M2; paralysis L3 M13 (c 1101 / 60; the trap c 1105 shares it), sleep L0 M23 / M24 (c 1102 / 90, lids set 8), stun L3 M11 -> M7 -> M8 (c 1103 held), the head break on L3 M1 / M2 (his .dtp has a third row `{4, 255, 255, 2}` Furious lacks), rage L0 M5 with the variant-0 mane / hairline / tail sets (4.2). Config-only, from a read note -- the largest config job here.
- Not gaps: u1120 u1121 -- plain Rajang has NO rage puff: vtable +0x1d8 writes `e+0xb7d2 = 0` for variant 0 and 0xa41b8 tests it before every request (states-em023_05.md 4.2; motion-states.js em023_05 comment).
- **Enable word**: vt+0x13c 0xded0f4 (first look, to its pop 0xded23c): base, then L2 M8 only -- not tired (0x81614) and the action NUMBER (status not tested) in {6, 0xa, 0x34, 0x35, 0x3e, 0x3f, 0x40} (table 0xded140, number - 6 <= 0x3a) -> bits 15-17: u 291 (L2 M8 b15) fires only on those actions (the viewer fires it always). The 11 bindings outside his file mask are all on BASE bits (u 293 / 295 / 310 on 6 / 7 / 9 / 10 / 12, c 153 / c 60 / u 294 on 0 / 3): they fire in the game whatever the override does, and c 153 / u 294 come in with --apply.
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c153 **not exported** `em023_00_011` (6 billboard, 2 polyline, 21 model, 1 node): L2 M6 b0*
  - c60 exported `cm202_021` (5 type 2, 15 model, 5 node): L2 M40 b3*
  - u293 exported `em023_00_001` (4 model): L2 M20 b6* L2 M20 b9*
  - u294 **not exported** `em023_00_001` (4 model): L2 M8 b6* L2 M8 b9* L2 M12 b0*
  - u295 exported `em023_00_001` (4 model): L2 M20 b7* L2 M20 b10*
  - u310 exported `em023_00_014` (1 billboard, 3 model): L2 M8 b12* L2 M20 b12*
  - named with no record in any array (not effects): u211

### Furious Rajang (`em023_05`)

- Soak: 63 motions played in the viewer, 0 refused (147 s)
- Enable word: class uEm023_00, vt+0x13c `0xded0f4` -- override, first look; 11 bindings named outside the file mask (117 file-mask bindings, 128 whole-block).
- Exported but undriven (not deliberate): c1105(event)
- **c 1105 (shock trap)**: (10, 0x6e) holds **L3 M13** -> L3 M3 (states-em023_05.md 64, 672), the paralysis hold too; motion-states.js em023_05 shows paralysis. Config-only cycle.
- Not gaps: c1104 c1109 -- he never tires and the exhaust never procs: his tune+0x30 (stamina) and tune+0x44 are NULL (states-em023_05.md 1.1, 7; motion-states.js em023_05 comment).
- **Enable word**: the class is Rajang's, uEm023_00 (no em-number test in the class; variant 5): as Rajang -- u 291 on L2 M8 by action number; the out-of-mask bindings are base bits; c 153 / u 294 come in with --apply.
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c153 **not exported** `em023_00_011` (6 billboard, 2 polyline, 21 model, 1 node): L2 M6 b0*
  - c60 exported `cm202_021` (5 type 2, 15 model, 5 node): L2 M40 b3*
  - u293 exported `em023_00_001` (4 model): L2 M20 b6* L2 M20 b9*
  - u294 **not exported** `em023_00_001` (4 model): L2 M8 b6* L2 M8 b9* L2 M12 b0*
  - u295 exported `em023_00_001` (4 model): L2 M20 b7* L2 M20 b10*
  - u310 exported `em023_00_014` (1 billboard, 3 model): L2 M8 b12* L2 M20 b12*

### Bulldrome (`em030_00`)

- Soak: 24 motions played in the viewer, 0 refused (24 s)
- Enable word: class uEm030_00, vt+0x13c `0xe1c4b0` -- override, first look; 0 bindings named outside the file mask (26 file-mask bindings, 26 whole-block).
- Exported but undriven (not deliberate): u1400(event)
- **u 1400**: the site is READ (states-em030_00.md 142, 535): a tail call `b 0xa499c` with r1 = 2 (u id 2 -> key 1400) at 0xe1e8d0, inside the status-7 attack code. WHICH action and clip reach it is UNREAD, so no row can be written yet; once read it is a `hold: [u, 1400]` row as Barroth's L0 M6. (rom-map's u 1400 table still lists em030_00 as UNRESOLVED -- the states note has the site.)
- **Enable word**: vt+0x13c 0xe1c4b0 (first look, the whole method, 20 instructions): base, then L0 M5 / M6 / M7 / M14 -> bits 15-17, or 18-20 when 0x81d6c. His three bindings above bit 14 (c 30 / c 31 on L0 M5 b15 / b16, c 91 on L0 M14 b15) are exactly those and fire at the surface, so transcription changes only the state gating of bits 6-14.

### Arzuros (`em060_00`)

- Soak: 58 motions played in the viewer, 0 refused (97 s)
- Enable word: class uEm060_00, vt+0x13c `0xf1911c` -- override, first look; 0 bindings named outside the file mask (79 file-mask bindings, 79 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1120(ragePuff) u1121(ragePuff)
- **No states decode** (no E:\offline\decode\notes\states-em060_00.md), **no MOTION_STATES block, not in _autoOnRage, no RAGE_PUFF**: c 1101-1105, c 1109 and the puff u 1120 / u 1121 all wait on it. His class writes neither `e+0xb7d2` nor `+0xb7d3` (whole-text `movw #0xb7d2 / #0xb7d3` scan: 15 sites, none in 0xf110ec..0xf23e20; controls Rajang 0xde1dd0 and Alatreon 0xec4a94 found), so the base ctor's 1 stands and the puff and drool run -- INFERRED (an immediate scan; transitive calls not scanned).
- **Enable word**: vt+0x13c 0xf1911c (first look, to its pop 0xf191d4): base, then L0 M1 / M4 / M8 / M9 -> bits 21-23 unless 0x81d6c; and only when variant 4 AND em 0x3c (Redhelm): L0 M13 / L0 M17 -> bit 15, L9 M1 -> bits 18-20 if the byte `e+0xcaee` != 0 (UNREAD). So **Arzuros's c 60 on L0 M13 / M17 bit 15 never fires in the game** and the viewer binds it (mis-gated); c 30 / c 31 / c 34 (L0 M4 / M8 / M9) are on the shared arm.

### Redhelm Arzuros (`em060_04`)

- Soak: 67 motions played in the viewer, 0 refused (98 s)
- Enable word: class uEm060_00, vt+0x13c `0xf1911c` -- override, first look; 0 bindings named outside the file mask (93 file-mask bindings, 93 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1001(event) u1120(ragePuff) u1121(ragePuff)
- As Arzuros (no states decode, no MOTION_STATES block, not in _autoOnRage, no RAGE_PUFF): c 1101-1105, c 1109, u 1001 (a break record) and the puff.
- **Enable word**: his variant-4 arm -- c 60 on L0 M13 / M17 bit 15 is his; u 320 on L9 M1 bit 18 fires only while `e+0xcaee` != 0, a byte this pass did not read.
- Board: "Redhelm Arzuros key 120 -- the emptied-list branch 0x9b76e4" (L0 M22); rom-map withdrew 0x9b76e4 as a recording gap on 2026-10-14 (the viewer drawing an ENDED unit, closed in host.js) -- see this soak.

### Lagombi (`em061_00`)

- Soak: 87 motions played in the viewer, 0 refused (127 s)
- Enable word: class uEm061_00, vt+0x13c `0xf32bac` -- override, first look; 0 bindings named outside the file mask (130 file-mask bindings, 130 whole-block).
- Exported but undriven (not deliberate): c1105(event)
- **c 1105 (shock trap)**: (10, 0x6e) holds **L3 M13** (or L3 M73 -> M13 from f42 when sel0) and recovers on L3 M17 (states-em061_00.md 63, 623) -- both are the paralysis holds; motion-states.js lagombiLine shows paralysis ("byte-identical but for the key"). Config-only cycle on both clips.
- **Enable word**: vt+0x13c 0xf32bac (first look, to its pop 0xf32c4c): base, then L0 M6 / M51 / M60 / M61 -> bits 21-23 unless 0x81d6c; and only when variant 4 (Snowbaron): L0 M2 / L0 M52 -> bit 15, L2 M57 -> bit 18. So **Lagombi's c 10 on L0 M2 / M52 bit 15 never fires in the game** and the viewer binds it (mis-gated). His u 302 (L2 M57 b18) has no record in em061_00u: not an effect.
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - named with no record in any array (not effects): u302

### Snowbaron Lagombi (`em061_04`)

- Soak: 98 motions played in the viewer, 0 refused (174 s)
- Enable word: class uEm061_00, vt+0x13c `0xf32bac` -- override, first look; 0 bindings named outside the file mask (150 file-mask bindings, 150 whole-block).
- Exported but undriven (not deliberate): c1105(event)
- **c 1105**: as Lagombi (L3 M13 / L3 M73, shared with paralysis) -- config-only cycle.
- **Enable word**: Lagombi's method, his variant-4 arm: c 10 (L0 M2 / M52 b15) and u 302 (L2 M57 b18) are his.

### Volvidon (`em062_00`)

- Soak: 59 motions played in the viewer, 0 refused (68 s)
- Enable word: class uEm060_00, vt+0x13c `0xf1911c` -- override, first look; 0 bindings named outside the file mask (93 file-mask bindings, 93 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1000(event) u1120(ragePuff) u1121(ragePuff)
- **He has no class of his own**: no `uEm062_00` string or DTI exists in the ROM; uEm060_00 runs him (its em-number test, dev/notice-marks.md step 3: em062 -> uEm060_00; the shell map agrees, dev/shell-map.md 55). class-effects.json correctly has no uEm062_00.
- As Arzuros: no states decode, no MOTION_STATES block, not in _autoOnRage, no RAGE_PUFF -- c 1101-1105, c 1109, u 1000 and the puff wait on it.
- **Enable word**: Arzuros's method; its L0 M1 / M4 / M8 / M9 arm has no em test, so his c 20 / c 21 (L0 M4 b21 / b22) and c 50 (L0 M8 / M9 b21) fire unless 0x81d6c (posture 4 and sunk -- whether his roll is posture 4 is UNREAD).

### Kecha Wacha (`em065_00`)

- Soak: 71 motions played in the viewer, 0 refused (108 s)
- Enable word: class uEm065_00, vt+0x13c `0xca170` -- **base -- no override**; 1 bindings named outside the file mask (121 file-mask bindings, 122 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1001(event) u1120(ragePuff) u1121(ragePuff)
- **No states decode** (no states-em065_00.md), **no MOTION_STATES block, not in _autoOnRage, no RAGE_PUFF**: c 1101-1105, c 1109, u 1001 and the puff wait on it. No `movw #0xb7d2 / #0xb7d3` in his band 0xf48f20..0xf56698 (same scan and controls as Arzuros), so the puff and drool run -- INFERRED.
- **Enable word: BASE** -- vt+0x13c holds 0xca170 itself (no override). `() => 0` + --apply, as the dromes: c 50 (L3 M11 bit 0, outside the file mask, always on in the game) comes in; u 210 / u 211 (bits 6 / 9 / 12 on L2 M77 / M78 / M80 / M117) become state-gated.
- Unexported ground-ray records, now recordable: c 42 (L2 M63 / M83 / M84 / M123), c 43 (L2 M63 / M83 / M84), c 44 (L2 M72 / M109 / M124), c 110 (L5 M31).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - c110 **not exported** `cm202_002` (5 type 2, 20 model): L5 M31 b3
  - c42 **not exported** `cm202_002` (5 type 2, 20 model): L2 M63 b0 L2 M83 b0 L2 M84 b0 L2 M123 b0
  - c43 **not exported** `cm202_002` (5 type 2, 20 model): L2 M63 b1 L2 M83 b1 L2 M84 b1
  - c44 **not exported** `cm202_002` (5 type 2, 20 model): L2 M72 b0 L2 M109 b0 L2 M124 b0
  - c50 exported `cm202_020` (5 type 2, 27 model, 5 node): L3 M11 b0*

### Gammoth (`em083_00`)

- Soak: 75 motions played in the viewer, 2 refused (334 s)
  - REFUSED: `L0 Motion[30]: 67 frames, 2 started, up to 1 running, 64 draws, 49 model draws on a regrouped mesh REFUSED: unverified path: 0x3294c4 falls into unrecorded code`
  - REFUSED: `L2 Motion[21]: 2 frames, 1 started, up to 1 running, 4 draws, 2 model draws on a regrouped mesh REFUSED: unverified path: 0x3294c4 falls into unrecorded code [a`
- Enable word: class uEm083_00, vt+0x13c `0x1054b8c` -- override, first look; 0 bindings named outside the file mask (164 file-mask bindings, 164 whole-block).
- No undriven gap.
- **The soak refuses two motions**, both at **0x3294c4** in the request routine (lifted-request.js; the same in the committed file): `blx [vt+0x68]` on the unit (0x3294ac) answered 0 and the arm after it (`+0x30 = 1`, return) was never recorded. L0 M30 (alive u 265 / u 256) and L2 M21 (u 256 / u 244). A refusal stops every effect of the monster until reload, so this is the one live fault in the category. Needs a recorder pass that drives +0x68 to 0 for one of those records (which one, and why +0x68 answers 0: NOT READ). rom-map has the row.
- **Enable word**: vt+0x13c 0x1054b8c (first look, the whole method, 18 instructions): base, then L9 M16 only -- 0x6fe88(e, 7, 0x6a) (the current action is (7, 0x6a)) -> bits 18-20, else 21-23. Gammoth has no L9 binding, so for him it is the base word: state gating of c 25 (L0 M33 b6 / b9 / b12).
- Unexported ground-ray records, now recordable: u 242 (L2 M23), u 261 (nine motions), u 302 (L0 M33, L2 M11 / M16 / M19), u 303 (L2 M30 / M44), u 340 (L2 M29), u 400 (L2 M33).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - u242 **not exported** `em083_00_011` (2 billboard, 2 type 2, 13 model): L2 M23 b3
  - u261 **not exported** `cm202_010` (5 type 2, 27 model, 5 node): L0 M17 b2 L0 M29 b0 L0 M30 b0 L0 M32 b1 L0 M33 b2 L2 M14 b0 L2 M23 b0 L2 M34 b0 +1 more
  - u302 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L0 M33 b3 L2 M11 b3 L2 M16 b0 L2 M19 b0
  - u303 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M30 b0 L2 M44 b0
  - u340 **not exported** `cm202_010` (5 type 2, 27 model, 5 node): L2 M29 b0
  - u400 **not exported** `em083_00_011` (2 billboard, 2 type 2, 13 model): L2 M33 b0

### Elderfrost Gammoth (`em083_04`)

- Soak: 89 motions played in the viewer, 2 refused (320 s)
  - REFUSED: `L0 Motion[30]: 67 frames, 2 started, up to 1 running, 64 draws, 49 model draws on a regrouped mesh REFUSED: unverified path: 0x3294c4 falls into unrecorded code`
  - REFUSED: `L2 Motion[21]: 2 frames, 1 started, up to 1 running, 4 draws, 2 model draws on a regrouped mesh REFUSED: unverified path: 0x3294c4 falls into unrecorded code [a`
- Enable word: class uEm083_00, vt+0x13c `0x1054b8c` -- override, first look; 0 bindings named outside the file mask (191 file-mask bindings, 191 whole-block).
- No undriven gap.
- **The soak refuses the same two motions as Gammoth** (L0 M30, L2 M21) at 0x3294c4, with his own u 265 / u 256 / u 244 alive -- one recording should close both.
- **Enable word**: Gammoth's method -- on his L9 M16, u 511 (bit 18) fires only under action (7, 0x6a) and u 220 (bit 21) otherwise; the viewer fires both on every play.
- Unexported ground-ray records, now recordable: u 261, u 302, u 303, u 340, u 400, u 472 (L9 M6), u 473 (L9 M8), u 520 (L9 M16).
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):
  - u261 **not exported** `cm202_005` (5 type 2, 27 model): L0 M17 b2 L0 M29 b0 L0 M30 b0 L0 M32 b1 L0 M33 b2 L2 M14 b0 L2 M23 b0 L2 M34 b0 +1 more
  - u302 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L0 M33 b3 L2 M11 b3 L2 M16 b0 L2 M19 b0
  - u303 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M30 b0 L2 M44 b0
  - u340 **not exported** `cm202_005` (5 type 2, 27 model): L2 M29 b0
  - u400 **not exported** `em083_00_011` (2 billboard, 2 type 2, 13 model): L2 M33 b0
  - u472 **not exported** `em083_00_011` (2 billboard, 2 type 2, 13 model): L9 M6 b2
  - u473 **not exported** `em083_00_011` (2 billboard, 2 type 2, 13 model): L9 M8 b0
  - u520 **not exported** `em083_00_011` (2 billboard, 2 type 2, 13 model): L9 M16 b0

## What closing each needs (easiest first)

1. **Config-only rows** (motion-states.js; no read, or the read is already in a note):
   - **The shock trap c 1105 on a hold shared with paralysis** -- **5 monsters**: Congalala (L3 M6), Blangonga (L3 M9),
     Furious Rajang (L3 M13), Lagombi and Snowbaron (L3 M13, and L3 M73 into it). None has a trap clip of its own (each
     (10, 0x6e) goes straight to the hold, then the recovery clip), so the birds' fix -- the row on the trap's own play
     clip -- does not apply. The route is Bulldrome's: `cycle: [{ every: [[c, 1101], 60] }, { every: [[c, 1105], 42] }]`.
     Each block's comment records "shown as paralysis" as a choice (Blangonga's and Lagombi's: c 1105 is byte-identical
     to c 1101 but for the key, so only the period changes). The Viewer's call, not a read.
   - **Rajang's whole MOTION_STATES block** -- **1 monster**: c 1101-1105, c 1109, u 1000 / u 1001, the tired idle L0 M17,
     the sleep lids, the rage sets -- all from states-em023_05.md, which read both variants (section 7: not one action
     differs; 1.1 / 4.2 / 6 give his own tune, rage and tired arms; his .dtp's third row). The largest config job here.
   - **The classifier, not the viewer** -- **2 monsters**: Rajang u 1120 / u 1121 (variant 0 writes `e+0xb7d2 = 0`, no
     puff) and Furious Rajang c 1104 / c 1109 (tune+0x30 / +0x44 NULL) are never requested -- READ. Not gaps.
2. **Base-only enable word** -- **1 monster**: Kecha Wacha (uEm065_00 = 0xca170): `() => 0` in psl-mask.js + --apply; c 50
   (L3 M11 bit 0, outside the file mask) comes in, u 210 / u 211 become state-gated.
3. **Override enable words to transcribe** (each disassembled whole here, not emulated; emulate, then psl-mask.js +
   --apply / --record / --check), smallest first:
   - uEm030_00 Bulldrome, 0xe1c4b0 (20 instructions) -- **1**: nothing visible changes at the surface; state gating only.
   - uEm083_00 Gammoth / Elderfrost, 0x1054b8c (18 instructions) -- **2**: Elderfrost's L9 M16 fires u 511 or u 220 by
     action (7, 0x6a), not both; Gammoth gets the state gating of c 25.
   - uEm022_00 Blangonga, 0xdda5ac -- **1**: c 120 on L0 M32 / M33 stops once the fangs break (0x9d36c(e, 0) against the
     .dtp threshold byte, rank-picked).
   - uEm061_00 Lagombi / Snowbaron, 0xf32bac -- **2**: Lagombi loses c 10 on L0 M2 / M52 (Snowbaron-only arm).
   - uEm060_00 Arzuros / Redhelm / Volvidon, 0xf1911c -- **3**: Arzuros loses c 60 on L0 M13 / M17 (Redhelm-only arm);
     Redhelm's u 320 on L9 M1 waits on the byte `e+0xcaee` (UNREAD).
   - uEm023_00 Rajang / Furious, 0xded0f4 -- **2**: u 291 on L2 M8 by action number only, not tired; the out-of-mask
     bindings are base bits and come in with any reading (c 153, u 294 unexported).
   - uEm021_00 Congalala, 0xdd7cf4 -- **1**: already READ (states-em021_00.md 3.4, misnamed there the "attack hit-group
     mask"); its cost is the viewer state it needs -- the gas type `ctl[1]` and the item `ctl[0]` -- to pick one of the four
     gas records (u 200-203 / u 260-263 / c 150-153) where the viewer now fires all four or none.
4. **Records needing a recorder pass**:
   - **The 0x3294c4 refusal** -- **2 monsters**, Gammoth and Elderfrost, L0 M30 and L2 M21 each (u 265 / u 256 / u 244
     alive): the request routine's arm after `blx [vt+0x68]` answers 0 was never recorded. The only refusals in the
     category, and a refusal stops every effect of the monster until reload -- so this is the first recording to make.
     Why +0x68 answers 0 for these records is NOT READ.
   - **Ground-ray records** (payload +0x52 / +0x5c bit 4, recordable since 2026-10-07: --apply / --record) -- **5
     monsters**: Congalala c 40 / 190 / 191; Blangonga c 40 / 41 / 42; Kecha Wacha c 42 / 43 / 44 / 110; Gammoth u 242 /
     261 / 302 / 303 / 340 / 400; Elderfrost u 261 / 302 / 303 / 340 / 400 / 472 / 473 / 520. The out-of-mask unexported
     records (Congalala c 150-153, u 241, u 261-263, u 281; Rajang and Furious c 153, u 294) come in with their class's
     --apply in item 3.
5. **Undecoded**:
   - **A states decode for uEm060_00 and uEm065_00** -- **4 monsters**: Arzuros, Redhelm Arzuros, Volvidon, Kecha Wacha
     have no states-*.md, no MOTION_STATES block, no RAGE_PUFF and are not in _autoOnRage; their whole status band
     (c 1101-1105, c 1109, the break records u 1000 / u 1001) and the puff wait on it. The puff and drool bytes are not
     cleared by either class (INFERRED, immediate scan with controls).
   - **Bulldrome's u 1400** -- **1**: the site 0xe1e8d0 is read; which status-7 action / clip reaches it is not.
   - **Blangonga's u 1400** -- **1**: no request in his class band (bounded branch scan, control Bulldrome's site found);
     the transitive check is what turns "probably never requested" into a read.

### Unread, named

- Which action / clip reaches Bulldrome's u 1400 site 0xe1e8d0.
- Whether anything in Blangonga's class reaches 0xa499c transitively (his own band has no call).
- `e+0xcaee` (gates Redhelm's L9 M1 bits 18-20); posture 4 for Arzuros / Volvidon / Lagombi / Blangonga / Bulldrome
  (0x81d6c's "sunk" test) -- the viewer plays every motion from the surface (0x81d6c = 0), as for Basarios's L0 M7.
- The states of Arzuros, Redhelm, Volvidon and Kecha Wacha (no decode note).
- None of the "first look" overrides was emulated; uEm021_00's was read by the Congalala decode.
