# Leviathans -- effects survey (survey agent for the Viewer agent, 2026-10-15)

Raven: "For each category of large monster remaining, have a sub agent assess the missing effects."

Lagiacrus `em046_00`, Royal Ludroth `em047_00`, Agnaktor `em049_00`, Nibelsnarf `em056_00`, Mizutsune `em082_00`, Soulseer Mizutsune `em082_04`. Assessment only: no docs/ edit, no recorder or lift run.

## How it was measured

- **Exported / firing**: efx/effects_status.py per record (clip bits, shells, rage, MOTION_STATES events, the shared states). Two corrections to its output: c 1100 (Poisoned) and c 1108 (Dung Bombed) are driven by SharedStates from the state toggles -- the classifier returns `wired` for any `event` record before it checks the shared keys -- and the deliberate exclusions are not gaps: blast c 1130-1137, notice c 1200/1201 (off the list), hyper u 1301-1315 (withheld), c 1500 (lying in water), c 1106 (Raven).
- **The PSL enable word**: add_effects.py plan() run twice -- on the blocks' FILE masks (what the viewer binds today for a monster whose class +0x13c is unread) and on the WHOLE blocks (every named bit). The difference is what the game decides with the monster's enemy +0x13f4 word. `*` = named outside the file mask. A name with no file is a bit naming a key that has no record in any array: not an effect. The word itself was read off each class's vtable (efx/class-effects.json; controls uEm004_00 = 0xd2e0ec and uEm032_00 = 0xca170 match) and the overrides disassembled (section "The enable words").
- **Refusals**: dev/effect-live-soak.mjs <mon> --viewer-inputs through the shared two-slot lock, every bound motion in the viewer. A refusal stops every effect of the monster until reload.
- **Beyond the survey's reach** (records never exported: shells, class requests): dev/effects-triage/<mon>.md against docs/effects/<mon>.json, and dev/shell-map.md.

## Summary

| # | monster | exported | firing | gaps (undriven, not deliberate) | enable word | bindings outside file mask | PSL records not exported (with a file) | unwired shell records (not exported) | soak |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Lagiacrus `em046_00` | 71 | 38 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1001(event) u1120(ragePuff) u1121(ragePuff) u1400(event) u900(event) u905(event) | override `0xea9a0c`, read here, untranscribed | 30 | c10 c11 | 18 | clean |
| 2 | Royal Ludroth `em047_00` | 61 | 43 | u1400(event) | override `0xeb388c`, read here, untranscribed | 2 | c182 c183 | 7 | clean |
| 3 | Agnaktor `em049_00` | 64 | 33 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1001(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event) | override `0xec3114`, read here, untranscribed | 21 | c2 c3 c90 c92 c93 | 2 | clean |
| 4 | Nibelsnarf `em056_00` | 62 | 43 | c1105(event) | override `0xeea464`, read here, untranscribed | 3 | -- | 6 | clean |
| 5 | Mizutsune `em082_00` | 65 | 35 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1000(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event) | override `0x1038cac`, unread | 6 | c120 c121 c122 c130 c71 c72 u112 u113 | 24 | clean |
| 6 | Soulseer Mizutsune `em082_04` | 69 | 47 | c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1001(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event) | override `0x1038cac`, unread | 6 | c120 c121 c122 c130 c71 c72 u112 u113 u341 u342 | 26 | clean |

## Per monster

### Lagiacrus (`em046_00`)

- Soak: 53 motions played in the viewer, 0 refused (111 s)
- Enable word: override `0xea9a0c`, not in psl-mask.js: 30 bindings named outside the file mask (93 file-mask bindings, 123 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1001(event) u1120(ragePuff) u1121(ragePuff) u1400(event) u900(event) u905(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask; no `*` and not exported = a ground-ray record refused before 2026-10-07, now recordable):
  - c10 **not exported** `cm202_002` (5 type 2, 20 model): L2 M6 b21*
  - c11 **not exported** `cm202_002` (5 type 2, 20 model): L2 M6 b22*
  - u200 exported `em046_00_002` (3 model): L2 M36 b6* L2 M36 b9* L4 M15 b7* L4 M15 b10* L4 M30 b9* L4 M32 b6* L4 M32 b9* L4 M33 b6* +1 more
  - u201 exported `em046_00_003` (1 polyline, 6 model): L2 M36 b7* L2 M36 b10* L4 M15 b6* L4 M15 b9* L4 M30 b10* L4 M32 b7* L4 M32 b10* L4 M33 b7* +1 more
  - u220 exported `em046_00_002` (3 model): L2 M36 b12* L4 M15 b13* L4 M30 b12* L4 M32 b12* L4 M33 b12*
  - u221 exported `em046_00_003` (1 polyline, 6 model): L2 M36 b13* L4 M15 b12* L4 M30 b13* L4 M32 b13* L4 M33 b13*
- Cause and cost:
  - **No MOTION_STATES block** -- the decode is complete and untranscribed: E:\offline\decode\notes\states-em046_00.md section 0 (the viewer table) and 6.2. Every event gap below is a row from that table:
    - c 1101 paralysis: `3|Motion[9]` every 60 (L3 M9 is also the shock-trap hold). c 1105 shock trap: (10, 0x6e) plays L3 M2 to f80 then holds L3 M9 -- every 42 on L3 M2, which is ALSO the head depletion (u 1001 at level 2) and (10, 0x1b)'s c 1109 once at f0: the Royal Ludroth `3|Motion[2]` cycle shape. c 1102 asleep: L3 M10 -> L0 M16 hold (eye set 14 -> 15, every 90, puffOff). c 1103 stun: hold on L3 M3..M8 (direction 1 / 2; the same clips are the leg depletions).
    - u 1001 head (L3 M2, level 2, set 1 -> 10); and three break records that are NOT EXPORTED because no row names them yet: u 1006 (L3 M1 part 1, level 2), u 1017 (L3 M1 part 3, level 3 -- also caps the charge), u 1020 (L3 M3 part 4, level 1). L3 M1 carries parts 1 / 2 / 3 / 7, so the row is a cycle.
    - u 900 the sever: `3|Motion[13]` set 5 -> 6, fire u 900 (cm202_062, joint 145), `drops: true`. u 905 the landing: **CUT_TAIL.em046_00 joint 145** -- the sever's kind byte 0x91 (`0xea0284 mov r3,#0x91` / `0xea0290 bl 0xc2274`, read here; note 3.4 the same), `em046_00_tail.glb` staged, option slot 0 descriptor 0x1596f34 word [1] 0x7c0d; which file 0x7c0d names is NOT READ (note 10) -- the 0x159daa0 hash check fw-undriven-barioth-basarios-ukanlos.md 1.1 did for Barioth closes it.
    - u 1120 / u 1121 the rage puff: `RAGE_PUFF.em046_00 = { period: 30, joint: 103, records: [[u 1120], [u 1121]], pick: () => 0 }` (note 0: +0x2a4 the base stub 0x6bf64 -> always u 1121, the SMALL one -- 1120 is scale 1.2, 1121 0.8), a rage row on L0 M3 (the roar (1, 0)), and an `_autoOnRage` listing. c 1104 drool: TIRED_DROOL em046_00 (+0xb7d3 untouched, note 4.3 / 5) and the tired row L0 M19 (his own tired idle).
    - u 1400: **not a gap the viewer can close** -- Lagiacrus has no class site; he closes on the shared latch 0xadc98 (rom-map "u 1400 -- the per-class sweep", `em046_00` row; the latch bits' meaning NOT READ).
    - u 30, the tier-2 charge aura (em046_00_005, joint 0, end 1): NOT EXPORTED, class-held on `P+0x1bb >= tune int 1 (99)` (note 8, site 0xea9228) -- a CHARGE_EFFECTS entry (hold at the charged level) on the Charged toggle he already has (part-review em046_00 "state": "charged"). u 300 / u 310 are dead in the shipped game (note 8: 0xea6404 is only reached with r1 = 2).
    - **His shells are not wired at all**: 18 records (u 0..4, 10, 11, 60, 61, 70, 80..82, 90, 91, 120, 301, 311) on shell00 / 01 / 11 / 25 / 26 (dev/shell-map.md; class ids 0xe6..0xea, note 1.4) -- no shells.js entry, no beam-spawns row, not exported.

### Royal Ludroth (`em047_00`)

- Soak: 63 motions played in the viewer, 0 refused (134 s)
- Enable word: override `0xeb388c`, not in psl-mask.js: 2 bindings named outside the file mask (90 file-mask bindings, 92 whole-block).
- Exported but undriven (not deliberate): u1400(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask; no `*` and not exported = a ground-ray record refused before 2026-10-07, now recordable):
  - c182 **not exported** `em047_00_008` (2 billboard, 1 type 2, 7 model, 1 node): L2 M7 b24*
  - c183 **not exported** `em047_00_008` (2 billboard, 1 type 2, 7 model, 1 node): L2 M7 b27*
- Cause and cost:
  - Transcribed (motion-states.js em047_00, CUT_TAIL, RAGE_PUFF, TIRED_DROOL). One event gap:
    - u 1400: **not closable** -- Royal Ludroth has no class site; the shared latch 0xadc98 (rom-map u 1400 sweep, `em047_00` row).
    - **CUT_TAIL.em047_00 joint is wrong: 143 should be 142.** The sever site, opened here: `0xeabc74..0xeabc9c` -- part (`0x9e8d8`) == 5, then `mov r3,#0x8e` / `bl 0xc2274` = kind byte 0x8e = joint 142 (the J of fw-undriven-barioth-basarios-ukanlos.md 1.1). That note's section 5 listed this as a lead (I); this is the site read. One joint off moves the drop point, not the landing.
    - Shells: 7 records (u 0, 1, 2, 30, 31, 32, 34) on shell00 / shell01 -- not wired, not exported.

### Agnaktor (`em049_00`)

- Soak: 52 motions played in the viewer, 0 refused (235 s)
- Enable word: override `0xec3114`, not in psl-mask.js: 21 bindings named outside the file mask (104 file-mask bindings, 125 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1001(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask; no `*` and not exported = a ground-ray record refused before 2026-10-07, now recordable):
  - c0 exported `cm202_001` (5 type 2, 20 model): L0 M6 b15* L0 M7 b15* L0 M8 b15* L0 M9 b15* L0 M10 b15*
  - c1 exported `cm202_001` (5 type 2, 20 model): L0 M6 b16* L0 M7 b16* L0 M8 b16* L0 M9 b16* L0 M10 b16*
  - c2 **not exported** `cm202_002` (5 type 2, 20 model): L2 M6 b15*
  - c3 **not exported** `cm202_002` (5 type 2, 20 model): L2 M6 b16*
  - c30 exported `cm202_000` (2 model): L2 M6 b17*
  - c5 exported `cm202_020` (5 type 2, 27 model, 5 node): L2 M5 b0*
  - c90 **not exported** `cm202_022` (5 model, 10 node): L2 M2 b17* L2 M10 b16*
  - c92 **not exported** `cm202_022` (5 model, 10 node): L0 M7 b17* L0 M9 b17*
  - c93 **not exported** `cm202_022` (5 model, 10 node): L0 M8 b17* L0 M10 b17*
  - u231 exported `em049_00_006` (1 billboard, 1 type 2, 12 model, 1 node): L3 M22 b0*
- Cause and cost:
  - **No states decode exists** (no `states-em049_00.md`; only his heat, dev/em049-heat.md, and his beams, dev/beams/em049_00.md). So every event gap is UNREAD at the clip: c 1101 / 1102 / 1103 / 1105 / 1109, u 1001 (and the seven break keys u 1006 / 1010 / 1015 / 1020 / 1025 / 1030 / 1035, not exported) and u 900 need the (10, x) reaction clips read, as the other leviathans got on 2026-09-25. What IS read, here:
    - The sever site: `0xeb4ffc..0xeb5024`, part == 7, `mov r3,#0x91` / `bl 0xc2274` -> CUT_TAIL joint **145**; `em049_00_tail.glb` is staged. The (10, 0x72) clip for the `drops` row is unread.
    - The rage puff RUNS and the pick is the base: vt+0x2a4 = `0x6bf64` (base stub -> always u 1121), +0x28 = `0xc9e7c` (base), +0x2d8 = `0x6bfb0`; no `#0xb7d2` / `#0xb7d3` immediate anywhere in uEm049_00's band `0xeb49d0..0xec3cd8` (word-by-word decode; positive control: the same scan finds Alatreon's `0xec4a94 movw r0,#0xb7d2`). So `RAGE_PUFF.em049_00` (records [u 1120 joint 3, u 1121 joint 2], `pick: () => 0`) + `_autoOnRage` drive it from the Enraged toggle (his rage roar clip is unread, so no rage row -- Royal Ludroth's shape), and TIRED_DROOL em049_00 drives c 1104 from the Tired toggle.
    - Shells: his beam (sp_02, u 0 / u 2) is wired (beam-spawns.js); shell01 modes 2 / 3 (u 100 / u 101) are not.

### Nibelsnarf (`em056_00`)

- Soak: 71 motions played in the viewer, 0 refused (145 s)
- Enable word: override `0xeea464`, not in psl-mask.js: 3 bindings named outside the file mask (151 file-mask bindings, 154 whole-block).
- Exported but undriven (not deliberate): c1105(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask; no `*` and not exported = a ground-ray record refused before 2026-10-07, now recordable):
  - c3 exported `em056_00_000` (5 billboard): L0 M28 b0* L2 M23 b1*
  - u431 exported `em056_00_009` (2 billboard, 1 polyline, 1 type 2, 3 model): L2 M12 b3*
- Cause and cost:
  - Transcribed (motion-states.js em056_00). One event gap:
    - c 1105 shock trap: (10, 0x6e) has **no entry clip of its own** -- op 6, then L3 M3_loop, the paralysis hold, then L3 M6 (states-em056_00.md line 84 / 633). His `3|Motion[3]` row is paralysis (c 1101 every 60) and its comment chose "shown as paralysis". Firing the trap needs a `cycle` on L3 M3 ({every c 1101 60} / {every c 1105 42}) -- a choice for Raven, not a read.
    - Shells: his beam (sp_02, u 0 / u 1) is wired; shell47 (0xf6: u 30, 31, 32, 40, 41, 42) is not.
    - The task board's "Nibelsnarf: the lifted draw layer refuses at 0xa92798" did not reproduce: 71 motions, 0 refused today.

### Mizutsune (`em082_00`)

- Soak: 89 motions played in the viewer, 0 refused (225 s)
- Enable word: override `0x1038cac`, not in psl-mask.js: 6 bindings named outside the file mask (170 file-mask bindings, 176 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1000(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask; no `*` and not exported = a ground-ray record refused before 2026-10-07, now recordable):
  - c120 **not exported** `cm202_001` (5 type 2, 20 model): L0 M12 b20*
  - c121 **not exported** `cm200_010` (2 model): L0 M12 b18*
  - c122 **not exported** `cm200_010` (2 model): L0 M12 b19*
  - c130 **not exported** `cm202_001` (5 type 2, 20 model): L0 M12 b17*
  - c71 **not exported** `cm202_001` (5 type 2, 20 model): L0 M16 b0 L2 M5 b1 L2 M6 b1 L2 M7 b1 L2 M8 b1 L3 M13 b1 L3 M21 b1
  - c72 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M51 b1 L2 M54 b1
  - u112 **not exported** `cm200_010` (2 model): L0 M12 b15*
  - u113 **not exported** `cm200_010` (2 model): L0 M12 b16*
  - named with no record in any array (not effects): u360 u400 u410 u411
- Cause and cost:
  - **No MOTION_STATES block** -- the decode is complete and untranscribed: E:\offline\decode\notes\states-em082_00.md section 0.
    - c 1101 `3|Motion[9]` every 60; c 1105: (10, 0x6e) L3 M2 to f60 -> L3 M9 hold, every 42 on L3 M2, which also carries the head (u 1000 at level 1, set 4 -> 5; u 1002 at level 3, set 5 -> 6) and (10, 0x1b)'s c 1109 -- the cycle shape; c 1102 L3 M10 -> L0 M15 hold (eye set 18 -> 19, every 90 **after a 160 f delay**); c 1103 hold on L3 M6 / M7 / M8 (his stun is not sided, note 6.2).
    - Break records not exported until rows name them: u 1002 (head level 3), u 1006 / u 1011 (fore legs via (10, 0x14)), u 1025 (tail durability level 1, no reaction of its own), u 1030 (dorsal fin).
    - u 900 `3|Motion[13]` set 16 -> 17, `drops: true`; u 905: **CUT_TAIL.em082_00 joint 142** (`0x1037154 mov r3,#0x8e` / `0x1037160 bl 0xc2274`, part 5; note 3.4), `em082_00_tail.glb` staged; resource 0x7f83 NOT READ (note 14).
    - u 1120 / u 1121: `RAGE_PUFF.em082_00 = { period: 30, joint: 132, ..., pick: () => 0 }` (note 0; 1121 is the narrower one), rage rows L2 M14 / M15 / M16 and L2 M17 / M18 / M19 (the four rage roars), `_autoOnRage`. c 1104: TIRED_DROOL em082_00 + the tired row L0 M9. The angry / tired material clips (note 4.3, 8) are not effects and are out of this survey.
    - Not wired: 24 shell records (shell01 / 12 / 13; his beam sp_02 u 120..122 IS wired) and u 70 / 71 / 90 / 91 / 110 / 111 (em082_00_002, named by no PSL bit, no shell and no class site the triage found -- UNREAD).

### Soulseer Mizutsune (`em082_04`)

- Soak: 94 motions played in the viewer, 0 refused (350 s)
- Enable word: override `0x1038cac`, not in psl-mask.js: 6 bindings named outside the file mask (182 file-mask bindings, 188 whole-block).
- Exported but undriven (not deliberate): c1101(event) c1102(event) c1103(event) c1104(event) c1105(event) c1109(event) u1001(event) u1120(ragePuff) u1121(ragePuff) u900(event) u905(event)
- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask; no `*` and not exported = a ground-ray record refused before 2026-10-07, now recordable):
  - c120 **not exported** `cm202_001` (5 type 2, 20 model): L0 M12 b20*
  - c121 **not exported** `cm200_010` (2 model): L0 M12 b18*
  - c122 **not exported** `cm200_010` (2 model): L0 M12 b19*
  - c130 **not exported** `cm202_001` (5 type 2, 20 model): L0 M12 b17*
  - c71 **not exported** `cm202_001` (5 type 2, 20 model): L0 M16 b0 L2 M5 b1 L2 M6 b1 L2 M7 b1 L2 M8 b1 L3 M13 b1 L3 M21 b1
  - c72 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L2 M51 b1 L2 M54 b1
  - u112 **not exported** `em082_04_020` (1 model): L0 M12 b15*
  - u113 **not exported** `em082_04_020` (1 model): L0 M12 b16*
  - u341 **not exported** `cm202_020` (5 type 2, 27 model, 5 node): L9 M6 b2
  - u342 **not exported** `em082_04_001` (1 billboard, 2 model): L9 M9 b2
- Cause and cost:
  - Shares Mizutsune's class, motions (lists 0 / 2 / 3 / 4) and c.pel (states-em082_00.md 12.1); no MOTION_STATES block either.
    - The same rows as Mizutsune except the head: ONE stage at **level 2 -> u 1001** (12.2); his break records u 1006 / 1011 / 1025 / 1030 are not exported. CUT_TAIL joint 142 (the same site), `em082_04_tail.glb` staged.
    - u 1120 / u 1121: he IS in `_autoOnRage` (for u 300) but has **no RAGE_PUFF entry** -- add one (joint 132, pick () => 0; his 1120 and 1121 are byte-identical, 12.2). c 1104: TIRED_DROOL em082_04 (`em082_00c` 1104).
    - His class requests (note 9): u 310 (held while `e+0xcb45`, set by six attack sites -- WHICH ACTIONS: NOT READ), u 320 / 330 / 321 (status-7 numbers 0x6e..0x7a through the table at 0x16a2290, READ). None is exported. u 300 is wired (`rage`).
    - Not wired: 26 shell records (as Mizutsune + shell26), and the same six em082_00_002 records.

## The enable words (vtable +0x13c), read here

None of the five classes is the base `0xca170`; all five override it. None is in psl-mask.js, and none was in rom-map's "The PSL enable word per class" before this survey.

| class (monsters) | vt | +0x13c | what the override does (read here, static -- not emulated) | inputs it needs | bindings it changes |
|---|---|---|---|---|---|
| uEm046_00 (Lagiacrus) | `0x17c3a70` | `0xea9a0c` (..`0xea9aac`) | `0xca170`, then t = `0x6f62c(e, 1)` (tune int 1 = 99, the tier-2 charge threshold, states-em046_00.md 8). L0 M5 / L2 M6: `[P+0x1ba] == 4` (posture 4; read through r4 = e+0x13f4 after the `ldr r0,[r4,r0]!` writeback, so `[r4+0x34]` = P) ? bits 24-26 : bits 21-23. L2 M3 / L2 M7..M9: `P+0x1bb >= t` (charged) ? bits 15-17 : nothing | posture per clip (on land, never 4); the Charged toggle | out of mask 30: c 10 / 11 (L2 M6 b21 / b22), u 200 / 201 / 220 / 221 (base state bits 6-13 on L2 M36, L4 M15 / M30 / M32 / M33). **Mis-gated inside the mask** (bound always today): u 290 / u 322 (L2 M3 b15 / b16) and u 260 (L2 M7 / M8 b15) fire only charged; the base's calm 6-8 / enraged 9-11 / tired 12-14 tiers on L2 M4 / M37, L4 M5 / M30 / M31 are all bound at once |
| uEm047_00 (Royal Ludroth) | `0x17c5040` | `0xeb388c` (..`0xeb3924`) | `0xca170`; L2 M7: `0x3a8430` (the rank chooser, 5 / 3 / 1 / 0) > 4 ? bits 27-29 : bits 24-26; L2 M15: vt+0x370(e, 1) (tail severed) ? bits 18-20 : 15-17; L2 M8: `0x81d6c` (sunk) ? 24-26 : 21-23 | rank, severed, sunk (on land false) | out of mask 2: c 182 (L2 M7 b24, rank < 5), c 183 (b27, rank 5). Mis-gated inside: c 212 / c 213 (L2 M15 b15 / b16) fire only with the tail intact |
| uEm049_00 (Agnaktor) | `0x17c5eb4` | `0xec3114` (..`0xec3210`) | `0xca170`; s = vt+0x370(e, 1). L0 M7..M10: sunk ? 18-20 : 15-17, then bit 17 = !s (`bfc` / `orreq`); L0 M6 and L2 M6: sunk ? 18-20 : 15-17; L2 M2: !s -> bit 17; L2 M10: !s -> bits 17-18 | severed, sunk | out of mask 21, all on in his land state except **c 90 on L2 M10 b16, which no arm sets** (it fires on L2 M2 b17 only): c 0 / c 1 (L0 M6..M10 b15 / b16), c 92 / c 93 (b17, tail intact), c 2 / c 3 / c 30 (L2 M6 b15-17), and c 5 (L2 M5 b0) / u 231 (L3 M22 b0) -- bit 0, which the base always sets |
| uEm056_00 (Nibelsnarf) | `0x17c94e8` | `0xeea464` (..`0xeea4c4`) | `0xca170`; L0 M1 / L0 M2: bits 15-17 unless the action is (6, n), n <= 0x12, n in {0, 3, 4, 6, 0xd, 0x11, 0x12} (mask 0x62059) | none visible: **no PSL bit 15-17 is named on L0 M1 / M2** (whole blocks) | out of mask 3, all base bits 0-5 (c 3 L0 M28 b0 / L2 M23 b1, u 431 L2 M12 b3); the base's tired tier on u 240 (L2 M17 b12, L2 M21 b13) is bound always today |
| uEm082_00 (Mizutsune, Soulseer) | `0x17ee478` | `0x1038cac` | `0xca170`, then **action-keyed**: switches on `e+0x73e0` (group 1 / 7 / 10) and `e+0x73e1`, bit tests on the index, a 60-entry jump table on the motion from 0x20a -- extent NOT derived, **UNREAD** | the current action (CLIP_ACTIONS, the em018 / em085 shape) | out of mask 6 each: L0 M12 b15-20 (u 112 / 113, c 130 / 121 / 122 / 120); inside the mask 27 bindings on bits 15-28 (L0 M15, L2 M1 / M2 / M10 / M11 / M21 / M39 / M40 / M69, L3 M3 / M6) that the word may gate |

Helpers, from rom-map: `0x81614` tired / `0x81670` enraged (the base's 6-8 / 9-11 / 12-14 tiers); `0x81d6c` the sunk test (posture 4 and below 0.9 x MoguriBaseOfs) -- the Ukanlos spec took it as false on land; vt+0x370 = `P+0x3b4 & r1` (bit 0 tail severed); `0x3a8430` the rank chooser (what its byte is: NOT READ); `0x6f62c` the action-tune int getter; `P+0x1ba` the posture byte. The four small overrides are read whole (each ends at its `pop`; the next function's `push` follows), not emulated; the motion argument r1 = `(list << 8) | slot` is confirmed by Royal Ludroth's L2 M7 (0x207) carrying exactly the two out-of-mask records c 182 / c 183 on b24 / b27.

## Records outside the survey's reach

- **PSL keys named by no bit** (triage "PSL: no motion fires it", and the whole-block plan names none either): Lagiacrus c 50 / c 91, Royal Ludroth u 340 / c 50, Agnaktor u 204 / u 243, Mizutsune and Soulseer u 266. Not effects unless a class site names them (none read).
- **Unwired shells** (dev/shell-map.md; triage): Lagiacrus 18 (shell00 / 01 / 11 / 25 / 26 -- none of his shells is wired), Royal Ludroth 7 (shell00 / 01), Agnaktor 2 (shell01 modes 2 / 3), Nibelsnarf 6 (shell47), Mizutsune 24 and Soulseer 26 (shell01 / 12 / 13, Soulseer also shell26). The beams (sp_02) of Agnaktor, Nibelsnarf and the Mizutsune line are wired through beam-spawns.js.
- **Class requests**: Lagiacrus u 30 (charge aura, READ); Soulseer u 310 / 320 / 321 / 330 (READ but u 310's six actions); Mizutsune / Soulseer u 70 / 71 / 90 / 91 / 110 / 111 (`em082_00_002`, nothing names them: UNREAD).

## What closing each needs (easiest first)

1. **Config-only rows** (every value READ in a states note or here; no recorder):
   - MOTION_STATES blocks from the finished decodes -- **3 monsters**: Lagiacrus (states-em046_00.md 0 / 6.2), Mizutsune (states-em082_00.md 0), Soulseer (the same rows, his head at level 2 -> u 1001; 12.2). Closes c 1101 / 1102 / 1103 / 1105 / 1109, u 1000 / 1001, u 900, and exports their unexported break records (Lagiacrus u 1006 / 1017 / 1020; Mizutsune u 1002 / 1006 / 1011 / 1025 / 1030; Soulseer u 1006 / 1011 / 1025 / 1030).
   - TIRED_DROOL entries (c 1104) -- **4**: Lagiacrus, Mizutsune, Soulseer, Agnaktor.
   - RAGE_PUFF entries + `_autoOnRage` (u 1120 / 1121, pick () => 0 on all four) -- **4**: Lagiacrus (joint 103), Mizutsune (132), Soulseer (132; already listed), Agnaktor (toggle-driven; no rage row until his roar is read).
   - CUT_TAIL u 905 -- **3** new: Lagiacrus joint 145, Mizutsune and Soulseer 142 (the sever kind bytes, read at the sites); Agnaktor's entry (145) waits for his sever row. **And one correction: Royal Ludroth's entry 143 -> 142.** The piece-file hash check (0x159daa0) is not done for any of the four.
   - Nibelsnarf c 1105 -- **1**: a paralysis / trap cycle on L3 M3 (his trap has no entry clip): Raven's call.
   - CHARGE_EFFECTS em046_00 -- **1**: hold u 30 at the charged level (export it).
2. **Base-only enable words**: none is the base. Nibelsnarf's override is base-in-effect (its one arm names no bit): a two-line transcription + --apply binds his 3 out-of-mask base bits and gates u 240's tired tier -- **1**.
3. **Override enable words**: read here, statically, to transcribe and check under the emulator -- Lagiacrus (posture + charge; un-gates 4 mis-gated charge bindings and the state tiers), Royal Ludroth (rank / severed / sunk; c 182 / c 183 come in), Agnaktor (severed / sunk; 21 bindings come in) -- **3**. Mizutsune / Soulseer `0x1038cac` is action-keyed and UNREAD: an emulated read and CLIP_ACTIONS rows, as uEm018_00 / uEm085_00 got -- **2** (one class).
4. **Records needing a recorder pass**: the ground-ray records refused before 2026-10-07, now recordable -- Mizutsune c 71 / c 72, Soulseer c 71 / c 72 / u 341 / u 342 (--apply / --record) -- **2**; and the out-of-mask records that come in with each class's word (Lagiacrus c 10 / 11, Royal Ludroth c 182 / 183, Agnaktor c 2 / 3 / 90 / 92 / 93, Mizutsune / Soulseer c 120 / 121 / 122 / 130, u 112 / 113) -- **5**.
5. **Shells, new runtimes, undecoded**:
   - Agnaktor's states decode (no note): every ailment clip, his break and sever reactions, his rage roar -- **1**.
   - Unwired shells -- **6** (all six; Lagiacrus has none wired at all, Mizutsune / Soulseer the most records).
   - Soulseer's class requests u 310 / 320 / 321 / 330 (a class-code driver; u 310's actions NOT READ) -- **1**.
   - Mizutsune / Soulseer u 70 / 71 / 90 / 91 / 110 / 111: what requests them, UNREAD -- **2**.
   - u 1400 on Lagiacrus and Royal Ludroth: the shared latch, a named refusal until `+0x1404` bits 20 / 21 and `+0x1408` bit 0 are read -- **2**.
