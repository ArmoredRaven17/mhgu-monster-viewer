# Lagiacrus (em046_00) -- effects spec (Leviathans walk, 2026-10-17)

Class `uEm046_00` (vtable `0x17c3a70`). States: `states-em046_00.md`, transcribed 2026-10-15 (MOTION_STATES, RAGE_PUFF,
TIRED_DROOL, CUT_TAIL). Survey: dev/leviathans-effects-survey.md. Scratch: `<archive>/zg/jscheckpd.py` (TUNEI / CHG), `allmot2.py`.

## 1. The PSL enable word -- vt+0x13c = `0xea9a0c` -- R, read whole and emulated

`0xea9a0c..0xea9aac`: `0xca170`; t = `0x6f62c(e, 1)` (action-tune int 1 = **99**, em046_00_actiontune.fup ints [1, 99, ...]);
L0 M5 (0x005) / L2 M6 (0x206): `[[e+0x13f4 + 0x34]+0x1ba]` (P's posture, through the writeback pointer) == 4 ? bits 24-26 :
21-23; L2 M3 (0x203) / L2 M7..M9 (0x207..0x209): bits 15-17 while `P+0x1bb >= t` -- the charged tier. (states-em046_00.md's
"L2 M5" is L0 M5: `cmp r5, #5`.) Check (`TUNEI=99 CHG=0,98,99,150 jscheckpd.py 17c3a70 em046_00`): **295488 runs, 0
mismatches**; control 12336 / 16448.

## 2. Plays -- R (tracer)

L2 M6: (7, 0x21 / 0x22 / 0x28 / 0x4b / 0x62) posture 0 (c 10 / c 11, bits 21-22) and (6, 2) posture 4 (bits 24-26, nothing
bound) -- copy B. L0 M5: (2, 0 / 5 / 0x16), posture 0. The charged arm reads the viewer's Charged toggle (index.html `charged`).

## 3. u 30, the charge aura -- R (note 8), wired

vt+0x208's tail `0xea9228` requests id 1001 -> u 30 (UNIQUE, joint 0, end 1) the first frame `P+0x1bb >= 99` and stops it when it
drops below. CHARGE_EFFECTS em046_00 {1: hold u 30}; index.html `chargeRungOf()` gives Lagiacrus's Charged as rung 1 (every
other monster: state.level). Not dropped at death (the tail reads P+0x1bb alone).

## 4. u 1400 -- R: nothing requests it (no class call; the latch needs `e+0x1404` bit 20, which uEm046 never raises, and
`e+0x1408` bit 0 -- dev/em010_00-effects-spec.md 3).

## 5. Implemented

psl-mask.js `em046_00` + CLIP_ACTIONS; CLIP_VARIANTS L2 M6; CHARGE_EFFECTS; index.html chargeRungOf / charged. `--apply` +3 (c 10,
c 11, u 30), recorded, lifted.

## 6. u 61 and the effect runtime (effects lane, 2026-10-18)

- **0xae997c, READ** (`0xae9938..0xae9b00`): node block +0xbe is the u16 offset of a bounds block (the name is INFERRED from
  its readers). The arm runs when [[g+8]+0x118] bit 27 is clear, the offset is set and node block +0xa2 & 0xf is set: the
  nibble goes into g+0x50 bits 24..27; [+0x20] goes to g+0x80 and [+0x24] to g+0x84; the vec3 [+0..8] goes to g+0x60 and
  the vec3 [+0x10..0x18] to g+0x70, both with w = 0. Otherwise `0xae99ec` clears the nibble. Transcribed in construct.js
  `generatorFlags`.
- **The readers** (found by scanning for +0x50 bit tests over 0x900000..0xc00000):
  - `0xa64894` reads bit 0 as a sphere of [g+0x80] x the owner's scale, bit 1 as a box (owner + scale x the two vec3s) and
    bit 2 as [g+0x84];
  - the cull tests `0xae9bc4` and `0xaec0xx` (`0xae9dc4` / `0xaec1fc` keep a generator outside the view drawn while bits
    24 / 25 are set).
  These are lifted from the recordings `add_em046_00_shellrec_u61` / `_near`, made with `zg/rec61.py`.
- **The control is an e2e check** (`efx/e2e_dump.py --request`, then `dev/effect-e2e.mjs`):
  - u 60 (the neighbouring arm 0xae99ec): 0 bytes differ.
  - u 61: 10 bytes differ. These are the infinite node's mapped-buffer pointers; Barioth's u 320 differs in the same 10.
  - u 61 with the arm switched off in a copy of the runtime: 20 bytes differ. The extra 10 are g+0x50's nibble = 1 and
    g+0x80 = 992.3, on both generators.
  - (A plain e2e_dump without `--request` hangs at 0x7abfbc. The infinite node's buffer constructor 0x86772c calls through
    the NVN pointer 0x1918704, which only proofunit stubs: a harness path, not the ROM.)
- **0x881e38 is closed.** `0x881d94` is the view's sphere test, read whole. It is a native in bridge.js, checked against the
  ROM in unicorn: `zg/sphctl.py` + `sphctl.mjs`, 3000 cases, 0 differ.
  - The lifted copy (from the first recording) was replacing the native because proof.js imports bridge.js before
    lifted-added.js. cpu.js now lets a hand native win over a lift. The only other address with both is proof.js's
    0xa91c48, a deliberate native that already wins.
  - 0x881d94 was taken back off the lift line.
- u 61 exported again (`fb/export_plain.py em046_00 em046_00u:61`).

## 7. The slot pool (effects lane, 2026-10-18)

`0x418d4` is not "the pool is full". It is the free-slot finder `0x4187c` stepping past a full first word.

- The finder (READ whole, `0x4187c..0x419dc`) has five 32-bit words per bank at mgr + 0x74 + 20 bank, banks 0..2 (> 2
  reads as 0). It takes the lowest clear bit through the de Bruijn table at mgr+0x770, adds 32k, and returns -1 when all
  five words are full.
- The caller `0x41808` maps kind 2 -> bank 1 and 3 -> bank 2. It stores the object at mgr + 0xb0 + 0x240 bank + 4 slot
  BEFORE its `pophi` (slot > 0x8f). So a full pool leaves the new object unregistered, and that store lands one word
  below the bank, as in the ROM. Nothing stops.
- 0x4187c is a native in bridge.js, controlled against the ROM in unicorn: `zg/poolctl.py` + `poolctl.mjs`, 3000 random
  bitmaps (242 full, 1539 past word 0), 0 differ.
- No pool-filling recording was needed: the finder is a leaf, and the native covers every branch.
- The shells checks' LOOPS switch is on (Mizutsune L2 M55 / M58 / M61, Soulseer L2 M69 / L0 M15, 1500 frames each).
- The looping play then reached the pool's RELEASE `0x419e0` ("0x41a94 branch to unrecorded 0x41ac8": a bitmap word run out
  without the object). Read whole (..0x41b14); a native in bridge.js, controlled the same way (`zg/pool2ctl.py` + `pool2ctl.mjs`,
  3000 cases, 1356 releasing, 0 differ).
