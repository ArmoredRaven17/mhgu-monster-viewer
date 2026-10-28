# Arzuros (em060_00) / Redhelm Arzuros (em060_04) / Volvidon (em062_00) -- effects spec (Fanged Beasts walk, 2026-10-17)

One class `uEm060_00` (vtable `0x17d52f8`; no `uEm062_00` string or DTI exists -- Volvidon is em byte 0x3e on it,
Arzuros / Redhelm 0x3c with variant 0 / 4). There is **no states note** for any of the three: everything below was read
here. Scratch: `<archive>/zg/tracec.py`, `states060.py`, `jscheck060.py`, akantor-scratch `scr.py` (the scripts).

## 1. The PSL enable word -- vt+0x13c = `0xf1911c` -- R, read whole and emulated

`0xf1911c..0xf191d4`: `0xca170`; motion <= 9 in `0x312` (L0 M1 / M4 / M8 / M9): bits 21-23 unless `0x81d6c` (sunk); then only
`e+0xb5f5 == 4` and `e+0xb5f4 == 0x3c` (Redhelm): L0 M13 / L0 M17 -> bit 15 (c 60 -- **Arzuros's c 60 never fires**), L9 M1
`0x901` -> bits 18-20 while `e+0xcaee` != 0. `e+0xcaee` is written once, at reset: `0x3a8430 > 4` (`0xf115dc`) -- G.
Check (`jscheck060.py`, em 0x3c / 0x3e x variant 0 / 4 x posture / P+0x5c x rank x e+0xcaee consistent with the rank): **3120
runs, 0 mismatches**.

## 2. The plays -- R (tracer, turn tables, scripts)

* Turn table `0x169f4a0` (+0x10 L0 M1, +0x20 L0 M9, +0x30 L0 M8): (2, 4 / 0xb / 0x5a) posture 0; **(6, 1)** -- `0xbc7f4(4)`,
  `0xbf62c`, `0xbf700` first: burrowed. L0 M4: (2, 0 / 0x53 / 0x59 / 0x5b) posture 0; (6, 2) posture 4 (sunk: I -- no
  `0xbf700` of its own, P+0x5c left by the dig, Deviljho's case). L0 M1 also (0, 0 / 1 / 3), (1, 0x18).
* Reaction scripts (`0xa1290`), Arzuros / Redhelm | Volvidon:

| action | Arzuros / Redhelm | Volvidon |
|---|---|---|
| (10, 0x1b) exhaust | L3 M1 | L3 M1 |
| (10, 0x1d) sleep | L3 M12 -> L3 M13 f40 (held, `0xfd`) | L3 M7 -> L3 M8 f40 |
| (10, 0x1e) sleep hold | L3 M15 (wait 0x100) | L3 M10 |
| (10, 0x1f) paralysis | L3 M22 -> L3 M10 f42 (wait 0x100) | L3 M17 -> L3 M5 f42 |
| (10, 0x6e) shock trap | **L3 M10** (wait 0x200) -- the paralysis hold | **L3 M5** |
| (10, 0x20) stun | L3 M20 (wait 0x100) | L3 M15 |
| (10, 0x2a / 0x2b) recovery | L3 M11 | L3 M6 |
| (11, 0) death | L3 M19 f18 | L3 M14 f18 |
| (11, 7) / (11, 0x12) | L3 M8 | L3 M3 |
| (11, 0x10) capture | L3 M13 -> L3 M15 | L3 M8 -> L3 M10 |
| (10, 7) depletion, parts 0 / 2 | L3 M1 | L3 M1 |

* Rage: command group 6 stream 0 ends in **(1, 0x1b) -> L0 M13** for all three (Arzuros / Redhelm: `6f 00 00 | 6f 01 00 | 6f 02 |
  00 01 02 | 6f ff | 00 01 1b`; Volvidon: `00 01 1b`).
* Tired: tune+0x30 present (stamina 5400 / 5400 / 7200); the tired idle (0, 2) is L0 M3, which (1, 5) / (1, 0x19) also play --
  no row; the drool is TIRED_DROOL's.

## 3. Breaks, eyes, puff -- R

* The part pass vt+0x210 `0xf18558`: em 0x3c -- set 0; variant != 0 (`[e+0x75f0+0x4005]` = e+0xb5f5): part 0 (hair) vs .dtp row 1
  bytes 1 / 2 (2 / 2) -> set 6 / 7; then part 2 (arms) vs row 1 bytes (Redhelm) / row 0 bytes (Arzuros: 1) -> set 4 / 5. em 0x3e
  -- part 0 (back) vs row 0 (1) -> set 2 / 4. The record by the shared rule id = part x 5 + level + 6 -> u 1000 + id - 7:
  Redhelm hair level 2 u 1001 (exported), arms level 2 u 1011 (no key), Arzuros arms level 1 u 1010 (no key), Volvidon back
  level 1 u 1000 (exported). Every depletion is (10, 7) (vt+0x23c the base 0).
* Eyes: `0x71398` at `0xf114ac` (em 0x3c: open 2, shut 3) / `0xf1155c` (em 0x3e: open 1, shut 3).
* Puff: vt+0x2a4 the base stub `0x6bf64` (u 1121); no e+0xb7d2 / b7d3 write in the band (survey scan); the record's joint 3.

## 4. Implemented

psl-mask.js `em060(redhelm)` for all three + CLIP_ACTIONS (EM060_ACTIONS); motion-states.js MOTION_STATES em060_00 / em060_04 /
em062_00 (L3 M1 break + exhaust cycles, rage L0 M13, sleep sets 3 + c 1102, paralysis c 1101, stun c 1103 hold, deaths shut
eyes), CLIP_VARIANTS + TRAP_B (the trap on the paralysis hold), RAGE_PUFF, TIRED_DROOL; effect-mounts.json `_autoOnRage`.
Nothing new to export (every state record was already exported). Check dev/checks/em060_00.mjs (new, all three): 72 / 0. Soaks
58 / 0, 67 / 0, 59 / 0.

NAMED: (6, 2)'s sunk (I, above); the sleep hold's c 1102 also on L3 M13 (the lie-down's hold) as for the hold -- the shared
0xa4518 fires while asleep (I for which clip carries it first).

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **c 1102 over the lie-down -- READ**: the shared request (`0xa3df8`) runs while `0x81bb0(e, 1)` holds -- the sleep holds
  ((10, 0x1e / 0x22 / 0x27 / 0x35 / 0x3a / 0x40 / 0x7e / 0x84 / 0x8f / 0x64)) or P+0x522, the field nap's latch. So the Zzz shows on
  the nap's L3 M13 hold as on the ailment's hold, and not on the falls. The I is R. (6, 2)'s sunk stays the cross-monster toggle
  (category c).
* **Begins Burrowed -- BUILT 2026-10-19** (CLASS_TOGGLES `burrowed`, working label, approved by Raven): on, every posture-4 play
  reads sunk (0x81d6c: posture 4 and P+0x5c below 0.9 x MoguriBaseOfs); off, only the entries that name sunk. Checked on
  Basarios's L0 M7 B (dev/checks/class-toggles.mjs).

## The ground (effects lane, 2026-10-20)

* Redhelm's u 120 (`em060_00_000`, em060_04 L0 M22) has rows with w04 0x354, so it builds only on MASK2 0x41 or 0x101.
  - With the Ground control (index.html GROUND_TYPES; dev/effect-runtime-engine.md E17) it DRAWS on Ground C (flag 0x800000) and
    Ground E (attribute bit 1), lit 12 / 12.
  - On plain, A, B, D and F it is live with no draw.

## Lane A4 (2026-10-26) -- Arzuros c 60, and the posture-4 sink

* **Arzuros c 60 never fires -- a ROM reason brought to the coordinator.** The PSL binds c 60 (cm202_050) to L0 M13 / L0 M17 bit 15 only, and
  the word `0xf1911c` (section 1) sets bit 15 there only for variant 4 with em 0x3c (Redhelm); `0xca170` sets bits 0-14. Control: Redhelm's
  c 60 draws through the same bit (census st 2, lit 51). rom-map "Effects lane A4".
* **The burrow sink is drawn now** (motion-states.js SINK4, rom-map "THE POSTURE-4 SINK"): (6, 1) / (6, 2) set posture 4 and
  P+0x5c = MoguriBaseOfs -1000 (all three: em060_00 / em060_04 / em062_00), so L0 M1 (6, 1) / L0 M4 (6, 2) and the turn clips L0 M8 / M9 draw the
  body 1000 x size below the ground; (6, 3) L0 M25 (Volvidon L0 M22) is the emerge, P+0x5c 0.
