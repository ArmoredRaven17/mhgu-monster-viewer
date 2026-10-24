# Duramboros (em055_00) — effects spec: the PSL enable word, the stun (c 1103), the rage puff (u 1120 / 1121)

Research agent for the Viewer agent, 2026-10-15 (dev/brute-wyverns-effects-survey.md "What closing each needs" 3 and 4).
Static ROM reading plus unicorn controls; no recorder, no lift, no `--apply`, no docs/ edit. `R` = READ (the consuming
instruction read), `I` = INFERRED, `NR` = NOT READ, `E` = emulated.

Sources opened first: dev/brute-wyverns-effects-survey.md (Duramboros: 0 bindings outside the file mask, 158 / 158;
undriven c 1103 (event), u 1120 / u 1121 (ragePuff); unexported c 60 / 62 / 63 / 72 / 212, u 310 / 311), rom-map.md ("The PSL
enable word per class" row uEm055_00 `0xede150` UNREAD; the uEm055_00 section: "his whole action -> clip map", the roll
`0xed6288`, **the `(10, 0x20)` row "his STUN reaches no motion at all"** -- withdrawn below; the u 1400 sweep; the `0x81d6c` /
`0xbf62c` row), dev/states-em055_00.md (Effects, 2026-09-30 -- there is no decode note; its §5 "the stun refusal" and §1's
"(1, 2) the rage entry" are both corrected here), docs/render/psl-mask.js whole, motion-states.js (MOTION_STATES em055_00 and
its comment block, RAGE_PUFF, TIRED_DROOL, the em045 rows' stun idiom), docs/render/rom/effect/live.js + schedule.js (how
RAGE_PUFF is consumed), effect-mounts.json `_about_autoOnRage` / `_autoOnRage`, states-em045_00.md §5.3 / §6.1 / §6.2 (the
shared puff and stun machinery, Uragaan's), the task board (grep Duramboros: no read of these). Scratch: `<archive>/bw2/`
(`emu_bw.py`, `emu_fast.py`, `jscheck.py`, `sweep.py`, `s10.py`, `turntab.py`, `who.py`, `motsites.py`, `blscan.py`, `recs.py`,
`dura.txt`, `s10_dura.txt`, `emc055_all.txt`, the plans).

## 1. The word — uEm055_00 vt+0x13c = `0xede150` — R, E

Vtable **`0x17c8768`** (checked: `+0xf0` = base `0xca52c`, `+0x1d0` = `0xede120`, `+0x14` = `0xede1f4`, `+0x2a4` = `0x6bf64`,
`+0x370` = `0xa3bf4`, `+0x1f4` = `0xed0f64`). Extent **`0xede150..0xede1f0`**: one `push {r4, r5, fp, lr}`, exits `pop`
`0xede19c`, `popne` `0xede1d0`, `pop` `0xede1f0`; `0xede14c` is vt+0x1d0's literal (the method before), `0xede1f4` is vt+0x14
(getDTI). Calls: `bl 0xca170`, `bl 0x81d6c` (`0xede17c`). No variant test (one class, one monster), no part / sever / rage
input.

    0xede15c  bl 0xca170                               ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0xede160  motion > 0xf -> return (bhi 0xede19c)
    0xede16c  bit motion of 0x8058 (tst; L0 M3, L0 M4, L0 M6, L0 M15):
                0x81d6c(e) ("sunk": posture 4 AND P+0x5c < 0.9 x MoguriBaseOfs) ? 0x1c0000 (bits 18-20) : 0xe00000 (21-23)
                (`ldr r1,[r4,r1]!` 0xede18c, `movne` 0xede190, str 0xede198)
    0xede1a0  motion == 0x00b (L0 M11) AND status e+0x73e0 == 1 (movweq / ldrbeq / cmpeq chain), n = e+0x73e1:
                n == 0xd or n == 0 -> |= 0x8000 (bit 15)
                n == 2             -> **[e+0x13f4] = 0** (`mov r1,#0; str r1,[r4,r0]` 0xede1ec): the WHOLE word, bits 0-5 too
                any other n        -> return (popne 0xede1d0)
    every other motion: the base alone

Negative with control: his band `0xed0a38..0xedec14` [derived 2026-10-24: `0xed0838..0xedf74c`, the negatives re-run and stand; rom-map "Duramboros band (derived)"] has exactly three `0x13f4` immediates, all in the method (`0xede180`,
`0xede1d4`, `0xede1e4`); control as in the Uragaan spec (uEm007_00's `0xd45354`).

**The sunk test's inputs** (R): `.dtb +0xa8` MoguriBaseOfs = **-2000.0** (loader `dtb_full.py` and the raw file at `0x22`
agree). His depth writes (`blscan.py`, read in place; status table of the action main `0xed0f64`: 0 `0xed10f4`, 1 `0xed12c0`,
2 `0xed1670`, 6 `0xed1a78`, 7 `0xed1ae8`, 10 `0xed1f64`; status-6 table `0xed1a78`, n <= 6):

| status-6 | function | in order |
|---|---|---|
| (6, 0) | `0xed5e6c` | posture 0, **L0 M17** (`0xed5ebc`); at its end `0xbf62c` -> `0xbf700` (depth = -2000), `vt+0x3e8` |
| (6, 1) | `0xed5f40` | posture 0, **L0 M18** (`0xed5f98`), depth = 0.0 (literal `0xed6028`), at the end `vt+0x3dc` (idle) |
| (6, 2) | `0xed602c` | posture 4, depth = -2000, `vt+0x3e8` |
| (6, 3) | `0xed60ec` | posture 4, **L0 M6** (`0xed6148`), THEN depth = -2000 |
| (6, 4) | `0xed61bc` | posture 4, turn start `0x7a258` on table **`0x169ee4c`** (+0x10 = **L0 M15** straight, +0x20 = **L0 M4**, +0x30 = **L0 M3** sides), THEN depth = -2000; phase 1 `0x7a27c` to the end, `vt+0x3e8` |
| (6, 5) / (6, 6) | `0xed6288` (r1 0 / 1) | the ROLL: posture 4, **L0 M6** (`0xed6300`), rate 3, THEN depth = -2000, then `b 0xa499c` (u 1400) |

So an L0 M3 / M4 / M6 / M15 start reads the depth the previous step left: posture-0 plays (status 2's turns `0xed198c` /
`0xed19dc` / `0xed1a0c` and status 1's `0xed4f58` on the same table, both after `0xbc7f4(e, 0)`; status 2's L0 M6 sites
`0xed5494` / `0xed5ab0` / `0xed5cd4` / `0xed5e34`) are never sunk -> bits 21-23; a status-6 step after the curl, another
status-6 step or a roll (depth -2000) is sunk -> bits 18-20. His command table issues `00 06 04 | 00 06 05` (turn, then roll:
the roll then always starts sunk, the turn having written the depth) and (6, 0) / (6, 1) on their own (`emc055_all.txt`).

**Emulated** (`emu_bw.py`, case = motion:status:number:sever:rage:tired:posture:p5c:moguri; the controls of the Uragaan spec
-- Ukanlos `0xe001ff` / `0x1ff` / `0x1c0e3f`, Nightcloak `0x381ff` / `0x38e3f` / `0x1ff` -- reproduced first):

| case | word |
|---|---|
| L0 M3 calm / L0 M4 (2,0) enraged / L0 M15 tired (posture 0) | `0xe001ff` / `0xe00e3f` / `0xe0703f` |
| L0 M6 posture 4, P+0x5c 0 / -2000 (base -2000) | `0xe001ff` / `0x1c01ff` |
| L0 M6 posture 4, P+0x5c -1801, tired | `0x1c703f` |
| L0 M15 posture 4, P+0x5c -1900 / L0 M3 posture 4, -2000, enraged + sever bit | `0x1c01ff` / `0x1c0e3f` |
| **L0 M11 (1, 2) calm / enraged / tired** | **`0x0` / `0x0` / `0x0`** |
| L0 M11 (1, 0) / (1, 0xd) enraged | `0x81ff` / `0x8e3f` |
| L0 M11 (1, 1) / (1, 0xc) / (7, 2) / (0, 2) / (1, 3) tired | `0x1ff` / `0x1ff` / `0x1ff` / `0x1ff` / `0x703f` |
| L0 M0, M1, M2, M5 (posture 4), M7, M14, M16, L1 M3, L1 M11 (1,2), L2 M3 (7,2) enraged, L2 M11 (1,2), L2 M29, L3 M11, L0 M10 tired | the base word each (`0x1ff`, `0xe3f`, `0x703f`) |

And the transcription below against the emulator over every combination (24 motions x 9 actions x P+0x3b4 0..3 x calm /
enraged / tired x 8 posture-depth-base cases): **20736 runs, 0 mismatches** (`jscheck.py`, the same run as Uragaan's).

**For psl-mask.js CLASS_MASK:**

    // DURAMBOROS (em055_00), uEm055_00 vtable +0x13c = 0xede150 (vtable 0x17c8768; +0xf0 the base 0xca52c), READ whole
    // (0xede150..0xede1f0; next 0xede1f4 = vt+0x14) and emulated (dev/em055_00-effects-spec.md 1). 0xca170 first, then:
    //   * L0 M3 / L0 M4 / L0 M6 / L0 M15 (motion <= 0xf, bit of 0x8058): 0x81d6c "sunk" (posture 4 AND P+0x5c < 0.9 x
    //     MoguriBaseOfs -2000) -> bits 18-20, else 21-23: c 100 (b18) on the turns L0 M3 / M4 only inside the rolling
    //     posture, c 0 (b21) on L0 M6 / L0 M15 only outside it. Every status-6 step writes the depth after its own setMotion;
    //   * L0 M11, status 1: n 0 / 0xd -> bit 15 (c 120, cm202_050); n 2 -> the WHOLE word cleared (str 0), base bits too;
    //   * every other motion: the base alone.
    function em055_00(motion, action, state){
      if (motion === 0x003 || motion === 0x004 || motion === 0x006 || motion === 0x00f) return state.sunk ? 0x1c0000 : 0xe00000;
      if (motion === 0x00b && action && action[0] === 1){
        if (action[1] === 2) return { set: 0, clear: 0xffffffff };   // 0xede1ec: str 0 over the base
        if (action[1] === 0 || action[1] === 0xd) return 0x8000;
      }
      return 0;
    }

(pslMask's clearing form gives `((base | 0) & ~0xffffffff) >>> 0` = 0, the ROM's word exactly.)

Inputs: **`action`** (L0 M11, CLIP_ACTIONS §3) and **`state.sunk`** per play (CLIP_ACTIONS `sunk` + `clipSunkFor`,
replacing index.html's constant -- the field dev/em043_00-effects-spec.md §4 proposes, used by dev/em045_00-effects-spec.md
too). The actions in the sunk entries are labels (status-2 turns: their action numbers not traced, `null`); the word reads
only `sunk`. rage / tired from the
toggles.

## 2. What the word changes — whole-block plan (158 file-mask = 158 whole)

`planrows.py em055_00 [--whole]`: row for row the same, so nothing comes in and the question is the in-mask gating. Every
binding not listed sits on bits 0-5 (always on).

**Gated** (in the file mask -- the viewer fires them on every play today):

| binding | record | game |
|---|---|---|
| **L0 M3 b18** f40, **L0 M4 b18** f40 | c 100 (`cm202_001`) | only SUNK: the turn begun in the rolling posture after the curl / a roll ((6, 4) after (6, 0) / (6, 3) / (6, 5)). Off on every posture-0 turn |
| **L0 M6 b21** f23 / 64 / 112 / 160 / 211 / 273 / 311 | c 0 (`cm202_001`) | only NOT sunk: the status-2 plays (posture 0) and a roll begun at depth 0. Off on the EMC's turn -> roll |
| **L0 M15 b21** f65 | c 0 | only not sunk (the posture-0 straight turn) |
| **L0 M11 b15** f80-120 | **c 120** (`cm202_050`, the roar burst) | (1, 0) and (1, 0xd) only; **OFF on (1, 2)**, where nothing of L0 M11 fires at all; off on the recoveries (10, 0x2a / 0x2b) |
| L2 M25 b6 / b9 / b12 f249, L2 M32 b6 / b9 / b12 f252 | u 400 (`em055_00_008`) | the base's state groups: one fire per play (calm / enraged / tired-calm), not three |

**Turned ON / named-never / turned OFF**: none (0 outside the mask; the (1, 2) clear empties a word, and L0 M11 names only
b15).

Records to export: none for the word. His seven unexported ones (c 60 / 62 / 63 / 72 / 212, u 310 / 311) are all on bits 0-5
-- the ground-ray family, recordable since the stage-ray refusal was retired (rom-map `0x18154c` rows) -- and come in with
the `--apply` regardless.

**His rage entry is (1, 0), not (1, 2)** (corrects states-em055_00.md §1 and the MOTION_STATES comment). The rage request
runs command **group 6 stream 0** (shared `0x7f010`, states-em045_00.md §5.1 -- R there), and his is
`6f 00 02 | 6f 01 01 | 00 01 00 | 6f 02 | 6f ff` (R, the bytes): op 0x6f asks the class callback vt+0x214 = `0xed49a8`
selector 2 -- read whole: **0 when `0xb0944(e)` (uxth; I: the current motion id) is `0x202` (L2 M2), or the action is (7, 9) / (7, 0xd)
(`(n | 4) == 0xd`), else 1** -- and case 1 issues **(1, 0)** (the case layout I, by op 0x92's documented `92 00 | 92 01 <c> |
.. | 92 02 | .. | 92 ff` shape). (1, 2) is issued only by g8 s1 (`69 00 | 14 4c | 69 02 | 69 ff | 00 01 02`; group 8 and op
0x69 NR) and (1, 0xd) by g13 s0 (inside its `24 02 | 1c 00` arms: tired / enraged). Uragaan's are the other way round (g6 s0
`14 20 | 00 01 02`, g8 s1 `00 01 00`). All three play L0 M11 (probe). So **c 120 fires on his rage roar**, and the (1, 2)
roar (whatever group 8 is) shows nothing.

## 3. CLIP_ACTIONS

    // DURAMBOROS: L0 M11 is played by (1, 0) -- the rage roar, g6 s0 behind op 0x6f(2) -- (1, 0xd) (g13 s0) and (1, 2)
    // (g8 s1); the word (0xede150) fires c 120 on the first two and clears itself whole on (1, 2). L0 M3 / M4 / M6 / M15: no
    // action decides them, the depth does (0x81d6c): first a posture-0 play (walk, turn), then one in the rolling posture.
    em055_00: {
      '0|Motion[11]': [{ action: [1, 0] }, { action: [1, 2] }],
      '0|Motion[3]':  [{ action: null }, { action: [6, 4], posture: 4, sunk: true }],
      '0|Motion[4]':  [{ action: null }, { action: [6, 4], posture: 4, sunk: true }],
      '0|Motion[6]':  [{ action: [2, 0] }, { action: [6, 5], posture: 4, sunk: true }],
      '0|Motion[15]': [{ action: null }, { action: [6, 4], posture: 4, sunk: true }],
    },

## 4. The stun — c 1103 — R, E: **the clips ARE read; the 2026-09-30 refusal is withdrawn**

The 2026-09-30 probe ran `(10, 0x20)` with the hit-direction byte 0 only (probe.py's default `direction=0`). His stun, like
Uragaan's (states-em045_00.md §6.2), switches on **`0x9e8c0(e)` = `P+0x5ccb & 7`, the hit-direction class**, not the part:

| direction | script | clips (`scr.py`) |
|---|---|---|
| **1** | **`0x17c9250`** | **L3 M5** (blend 2, wait end) -> **L3 M18** (op 2, blend 0, **wait 0x100 = the held stun**) -> **L3 M13** (blend 6, end) -> `0xfe` |
| **2** | **`0x17c9270`** | **L3 M6** (2, end) -> **L3 M19** (op 2, **0x100 hold**) -> **L3 M14** (6) -> `0xfe` |
| 0, 3..7 | — | the handler returns, no motion (every part 0..7) |

E: `probe.py uEm055_00 (10, 0x20)` x parts 0..7 x directions 0..7 (`s10.py`). Control: the same run on uEm045_00 gives
`0x17c3278` (dir 1: L3 M5 -> M17 hold -> M12) and `0x17c32b0` (dir 2: L3 M6 -> M18 hold -> M13) -- states-em045_00.md §6.1's
scripts and MOTION_STATES em045_00's six c 1103 rows exactly; `scr.py` reproduces Cephadrome's `0x17ab0f0` as documented.

The direction a stun gets (R for Uragaan, states-em045_00.md §6.2; the same shared writer `0x9e398(e, N)` from the
`.dtb +0x70` mode table): **his `.dtb +0x70` index 9 is mode 1 as Uragaan's** (`dtb_dump.py`: `9:0100`; his index 14 is
`0300`, Uragaan's 15 is `0001` -- other reactions), and mode 1 returns 1 or 2 from the facing-vs-hit sign, never 0. So
every stun takes one of the two sides.

The follow-up: `0xfe` (no explicit action) -> (10, 0x2b) (I: the shared follow-up, as states-em045_00.md §6.1 reads it for
Uragaan) -> `0x17c90b0` = **L0 M11** (blend 4, then idle `0xff`) (R, scr.py; the rom-map row's (10, 0x2a) / (10, 0x2b)).
c 1103 is the shared stun's held record (`em055_00c` UNIQUE 1103, `cm200_003`, exported as `event`).

The six clips are SHARED with other reactions (`s10.py` over (10, *) and (11, *) x 8 parts x 8 directions): L3 M13 also
(10, 0x44 / 0x45) and the end of (10, 0xe) part 0 (which starts L3 M18 at f52); L3 M14 also (10, 0xbc); L3 M19 also
(10, 0xbb); L3 M6 -> L3 M19 -> L3 M14 -> L0 M11 is also (10, 0xa7) (0x17c9340). The names of those reactions: NR. Uragaan's
rows already accept the same overlap ("A clip alone is the state's motion only when the action is the one listed").

**MOTION_STATES em055_00 rows** (replacing the comment block's "c 1103 (THE STUN) ... NOT READ"):

    // THE STUN, sided as Uragaan's: (10, 0x20) switches on the hit-direction class 0x9e8c0 (P+0x5ccb & 7; .dtb +0x70
    // index 9 = mode 1, so always 1 or 2): direction 1 -> script 0x17c9250 = L3 M5 -> L3 M18 (held, wait 0x100) -> L3 M13;
    // direction 2 -> 0x17c9270 = L3 M6 -> L3 M19 (held) -> L3 M14; then 0xfe -> (10, 0x2b) 0x17c90b0 = L0 M11, which stops
    // the one held c 1103. (The 2026-09-30 probe ran direction 0 only and found no motion.) L3 M13 / M14 / M18 / M19 / M6
    // also play (10, 0x44 / 0x45 / 0xe / 0xbc / 0xbb / 0xa7).
    '3|Motion[5]':  { hold: ['em055_00c', 1103] },
    '3|Motion[18]': { hold: ['em055_00c', 1103] },
    '3|Motion[13]': { hold: ['em055_00c', 1103] },
    '3|Motion[6]':  { hold: ['em055_00c', 1103] },
    '3|Motion[19]': { hold: ['em055_00c', 1103] },
    '3|Motion[14]': { hold: ['em055_00c', 1103] },

None of the six keys is in his block today (no clash; L3 M3 / M4 are his hind-leg reactions, not L3 M5 / M6). The clear at
(10, 0x2b)'s L0 M11 is the row model's own (a clip with no `hold` drops it), as Uragaan's comment states; note that L0 M11's
row is `{ rage: true }`, so the recovery shows rage in the viewer as Uragaan's does -- a pre-existing shape, not new.

## 5. The rage puff — u 1120 / u 1121 — R

* **The pick**: vt+0x2a4 = **`0x6bf64`, the base stub** (`mov r0,#0; bx lr`; the vtable word) -> `0xa425c` turns the 0 into
  id 1 -> **always u 1121**; u 1120 is never requested.
* **The gate**: no `e+0xb7d2` / `e+0xb7d3` immediate (nor `0xb700` / `0xb7d0` / `0xb7d1`) anywhere in `0xed0a38..0xedec14` [derived 2026-10-24: `0xed0838..0xedf74c`, the negatives re-run and stand; rom-map "Duramboros band (derived)"]
  (`immscan.py`; control: the same scan over `0xdd0000..0xdf0000` finds Rajang's `0xde1dd0` `movweq #0xb7d2` and `0xdef188`),
  so the base ctor's 1 stands and `0xa41b8`'s block runs; vt+0x2d8 = `0x6bfb0` (base). Period **30** (the shared
  `0xa423c..0xa4248`). R.
* **The records** (`em055_00u` UNIQUE, already exported as `ragePuff`, index 6 / 7): both `effect\em\em055\em055_00_004` on
  **JOINT 130**, pos 0, rot 0, scale 1, mode 0, subMode 1 -- the 160 payload bytes identical but the key (`+0x24` 0x460 / 0x461).
  His OWN file, not the shared cm200_007 (his L0 M20 c 240 binding uses the same efl).
* **Entry**:

      // DURAMBOROS: the stub shape -- vtable +0x2a4 is the base 0x6bf64, so the id is always 1 and the request is always
      // u 1121; his 1120 and 1121 are byte-identical but for the key, and HIS OWN effect: em055_00_004 on JOINT 130, pos 0,
      // scale 1, mode 0. The class writes neither e+0xb7d2 nor e+0xb7d3 (0xed0a38..0xedec14), so the puff and the drool
      // both run. (dev/em055_00-effects-spec.md 5)
      em055_00: { period: 30, joint: 130, records: [['em055_00u', 1120], ['em055_00u', 1121]], pick: () => 0 },

  (`joint` feeds only the pick's quaternion read in live.js; with the stub pick it is read by nothing -- 130 is the record's
  joint, as every stub entry gives its record's.)
* **`_autoOnRage`: YES, add `em055_00`.** effect-mounts.json `_about_autoOnRage`: "index.html's driveMotionStates only calls
  setEffectRage / rt.setRage for a monster on this list, so a monster with a rage row in MOTION_STATES or a RAGE_PUFF entry
  must be listed"; index.html `effectsRage = !!RAGE_PUFF[state.id] && effectAutoOnRage(state.id)`. He has a rage row
  (`'0|Motion[11]': { rage: true }`) and is NOT on the list today (read 2026-10-15), so neither the entry nor his rage would
  reach the effect runtime without it.

## 6. What to implement, in order

1. psl-mask.js: `em055_00` as §1 into CLASS_MASK, `'em055_00'` into `PSL_MASK_MONSTERS`, CLIP_ACTIONS as §3; the `sunk` field
   and `clipSunkFor` (shared with Uragaan's spec) and index.html's `const sunk` from it.
2. motion-states.js: the six stun rows of §4 (and the comment block's "c 1103 ... NOT READ" paragraph replaced by §4's
   comment); `RAGE_PUFF.em055_00` as §5; correct the rage comment: the entry is (1, 0) (g6 s0), L0 M11 the same clip.
3. effect-mounts.json `_autoOnRage` += `em055_00`.
4. `add_effects.py em055_00 --apply` (CLIP_EFFECTS from the whole blocks = the same rows; exports the seven ground-ray
   records), `--states` (c 1103 already exported as `event`, u 1120 / 1121 as `ragePuff` -- check nothing new is owed),
   `--record`, `--check`. Recorder slot -- announce.
5. Soak with `--viewer-inputs`; Raven verifies: c 120 on the rage roar (1, 0) and not on (1, 2); c 0 dust on L0 M6 / M15
   played on foot and not on the rolling plays; c 100 on L0 M3 / M4 only in the rolling turn; u 400 once per L2 M25 / M32 play;
   c 1103 held through L3 M5 -> M18 -> M13 (and the mirror) until L0 M11; the puff every 30 frames while Enraged.

NOT READ, by name: what group 8 (the (1, 2) issuer) and op 0x69 are; op 0x6f's case layout (I, by op 0x92's); the meaning of
the (10, 0xe / 0x44 / 0x45 / 0xa7 / 0xbb / 0xbc) reactions sharing the stun clips; `vt+0x3e8` (`0x75330`)'s choice of the
next status-6 step beyond the EMC chain the table shows; what c 0 / c 100 / c 120 look like (Raven's).

## Re-walk 2026-10-18 (Fanged-Wyvern effects agent): tracer diff, request census, word re-emulation

**L0 M6's u 1400 is (6, 5) / (6, 6)'s** (reqtrace.py, `0xed6354`); (6, 3) and the walks play it with none -- now copy B. (6, 4) plays its turn table `0x169ee4c` (L0 M15 / M4 / M3), which a tracer sweep cannot see (rom-map trap 94).

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **Op 0x69 -- READ**: an if with no test (`0x891e8`): its open form always skips the body, so only the else part runs.
* **Op 0x6f's case layout -- READ**: op 0x6f and op 0x92 share one switch routine (`0x8e088`); op 0x6f switches on the class's
  vt+0x214 selector callback, op 0x92 on the variant byte. The I above is R.
* **`vt+0x3e8` (`0x75330`)'s "choice of the next status-6 step" -- answered by its row** (rom-map `0x75330`): it chooses none --
  posture 4, then (0, 7), then `0x82454(e, 0)` (e+0x72f0 = 1, the command-table flag the idle choosers set too); the next step is
  the streams'.
* Still open: what starts group 8 (the (1, 2) issuer) -- the shared selectors test only groups 3..7, 0xb and 0x11 (rom-map row
  "groups started by the shared selectors"): NR. The meaning of the (10, 0xe / 0x44 / 0x45 / 0xa7 / 0xbb / 0xbc) reactions: b,
  deferred.
* **The six reactions sharing the stun clips -- READ for what the effects need, v for the names**: the ROM keeps no reaction
  names (a reaction is a code switched into an action number, `0x9a76c`). The stun's c 1103 is gated on P+0x5e08 bit 4, which only
  the stun family sets, so (10, 0xe / 0x44 / 0x45 / 0xa7 / 0xbb / 0xbc) light no stars on these clips; the rows stand (a clip alone
  is the stun's motion). (10, 0xbb / 0xbc) are grouped with (10, 0xbf / 0xc0) in the damage step (I: the mounted reactions).
* **What starts command-table groups 8 / 12 / 13 / 18 -- READ** (rom-map "EMC group starts"): 12 from the tick when the area-link
  test `0xb6e50` passes (I the area move -> category a); 18 from an EMC op path; 8 and 13 have no start anywhere in main.text.
