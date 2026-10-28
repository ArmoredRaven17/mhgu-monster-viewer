# Uragaan (em045_00) and Crystalbeard Uragaan (em045_04) — effects spec: the PSL enable word

Research agent for the Viewer agent, 2026-10-15 (dev/brute-wyverns-effects-survey.md "What closing each needs" 4). Static
ROM reading plus unicorn controls; no recorder, no lift, no `--apply`, no docs/ edit. `R` = READ (the consuming instruction
read), `I` = INFERRED, `NR` = NOT READ. `E` = emulated.

Sources opened first: dev/brute-wyverns-effects-survey.md (Uragaan / Crystalbeard: 24 bindings outside the file mask each;
unexported c 90, u 201 / 261 / 264 / 267 / 280 / 281 / 284 / 285 / 350, + u 240 on Crystalbeard), rom-map.md ("The PSL enable
word per class" row uEm045_00 `0xe9cb64` UNREAD; "THE PSL ENABLE MASK"; the uEm045_00 section: the roll `0xe94118`, the u 100 /
110 / 120 machine `0xe95b78`, the u 130 / 140 machine `0xe98ca8`; the `0x81d6c` / `0xbf62c` sunk-test row; the Barroth /
Crystalbeard second-pieces rows: the beard cut `0xe8fc84`, slot 1 kind 2), E:\offline\decode\notes\states-em045_00.md (covers
both variants -- there is no states-em045_04.md: §1 "There is no uEm045_04"; §1.6 reads +0x13c as "the render / hit flag
word ... the only variant site is 0xe9cb94..0xe9cbc8", corrected below; §2 the part pass; §4 the severs; §5 rage; §6.1 / 6.2
the stun; §7.3 the `.dtb` diff), docs/render/psl-mask.js whole, motion-states.js (MOTION_STATES em045_00 / em045_04 and the
em055_00 block's roll comment: "the SAME machine Uragaan has, function for function"), effect-mounts.json, the task board
(grep Uragaan / Crystalbeard: no read of this word). Scratch: `<archive>/bw2/` (`emu_bw.py` = a copy of ng/emu13c2.py,
`emu_fast.py` the same with one reused unicorn instance, `jscheck.py`, `sweep.py`, `s7tab.py`, `who.py`, `motsites.py`,
`blscan.py`, `recs.py`, the plans `em045_0X_file.txt` / `_whole.txt` / `_planout.txt`, `ura_v0.txt` / `ura_v4.txt` probes).

## 1. The word — uEm045_00 vt+0x13c = `0xe9cb64` — R, E

Vtable **`0x17c257c`** (checked: `+0xf0` = base `0xca52c`, `+0x370` = `0xa3bf4`, `+0x1d0` = `0xe9cd68`, `+0x210` = `0xe9c8d4`,
`+0x2a4` = `0x6bf64`). One class for both monsters. Extent **`0xe9cb64..0xe9cd64`**: one `push {r4, r5, fp, lr}`, exits
`popne` `0xe9cc00`, `pop` `0xe9cce0` / `0xe9cd18` / `0xe9cd40` / `0xe9cd64`; no literal pool; `0xe9cd68` is vt+0x1d0.
Calls: `bl 0xca170`; `blx vt+0x370` (x2, `0xe9cbb8`, `0xe9cc48`); `bl 0x81614` (x4, `0xe9cc08`, `0xe9cc9c`, `0xe9cd20`,
`0xe9cd48`); `bl 0x81d6c` (`0xe9ccc4`).

    0xe9cb70  bl 0xca170                               ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0xe9cb74  k = motion - 0x201; k > 0xd -> 0xe9ccb0
    0xe9cb88  bit k of 0x3011 (tst; k 0 / 4 / 12 / 13 = L2 M1, L2 M5, L2 M13, L2 M14):
                r1 = 0x6000000 (bits 25-26); variant e+0xb5f5 == 4 -> vt+0x370(e, 2) != 0 -> r1 = 0x18000000 (bits 27-28)
                -> 0xe9cd30: |= r1, return
    0xe9cbcc  bit k of 6 (k 1 / 2 = L2 M2, L2 M3): status e+0x73e0 != 7 -> return; n = e+0x73e1:
                n == 0x90 or n == 4 (cmp / cmpne) -> 0xe9cd1c: 0x81614 (tired) ? 0x1800000 (23-24) : 0x600000 (21-22)
                n == 2                            -> 0x81614 ? 0x180000 (19-20) : 0x60000 (17-18)
                any other n -> return (popne 0xe9cc00)
    0xe9cc1c  k == 9 (L2 M10): r1 = the 0x3011 arm's beard word (variant test 0xe9cc2c, vt+0x370(e, 2) 0xe9cc48);
                0xe9cc60 `ldr r0,[r5,r0]!` -> r5 = e+0x13f4, |= r1, str;
                0xe9cc70 `ldrb r0,[r5, #0x5fec]` = e+0x73e0 (THE POINTER TRAP: the status is read through r5) != 7 -> return;
                then the same action arm (n 0x90 / 4 -> 21-22 / tired 23-24; n 2 -> 17-18 / tired 19-20), |= through r5
    0xe9ccb0  motion == 0x00b (L0 M11): status == 1 and n in {0xc, 2} (cmp / cmpne) -> |= 0x18000 (bits 15-16)
    0xe9ccb8  motion == 0x006 (L0 M6): 0x81d6c(e) == 0 -> |= 0x60000000 (bits 29-30)
    every other motion (and k 3, 5..8, 10, 11): the base alone

* **`vt+0x370(e, 2)` = `0xa3bf4`**: `ldrh [P+0x3b4]`, `ands r1`, `movwne #1` -- **P+0x3b4 bit 1, the BEARD cut** (`0xc2274`
  kind 2 -> bit 1, rom-map's Bloodbath row; Crystalbeard's slot 1 is kind 2 and his (10, 0x72) part-0 arm `0xe8fc84` calls
  it; Uragaan has no slot 1, states-em045_00.md §4.3). R.
* **`0x81614`** (read whole): `P+0x505 & 0xfe == 2`, tired -- NOT gated on rage (the toggles are exclusive in the viewer, and
  the game's tiredness waits while enraged: motion-states.js TIRED_DROOL comment). R.
* **`0x81d6c`** (read whole, rom-map row): posture `P+0x1ba == 4` AND `P+0x5c < 0.9 x MoguriBaseOfs` (`0xbf62c` =
  `[[e+0x75e8]+0x98+0x10]` = `.dtb +0xa8`), `movpl r0,#0`. R.
* **Variant tests in the word: exactly two, both `e+0xb5f5 == 4`** (`0xe9cb9c` the 0x3011 arm, `0xe9cc2c` the L2 M10 arm),
  and both only choose the beard word. states-em045_00.md §1.6 / §7.1 list only the first and read the slot as a "render /
  hit flag word" for 0x201..0x20e; the slot is the PSL enable word (rom-map's PSL section) and it has four more arms.

Negative with control: the class band `0xe8f050..0xe9ddb8` (the note's) has exactly four `0x13f4` immediates, all in the
method (`0xe9cc58`, `0xe9ccd0`, `0xe9cd08`, `0xe9cd30`); the same scan over `0xd31a64..0xd46da0` finds uEm007_00's `0xd45354`.
The status-7 action remap vt+0x1fc `0xe8f344` (table `0xe8f37c` on n - 1) sends n 2 / 4 / 0x8a / 0x90 to the plain `pop` at
`0xe8fa8c` (no remap), and none of its arms writes 2 / 4 / 0x8a / 0x90 (`strb [r4]` values: 7, 0xf, 0x10, 0x13 .. 0x45, 0xe8,
0xe9, 0xec, 0xed): the word sees the numbers the EMC issued. R.

**The sunk test's two inputs, per variant** (R, the files, `dtb_full.py` loader and a raw read at file `0x22` agree; control
em007_00 -1100, em003_00 0 / Tenjo 400, em042_00 0 as states-em007_00.md prints them): **em045_00 MoguriBaseOfs = -2000.0,
em045_04 = 0.0** (states-em045_00.md §7.3's table says the same). Depth writes (`blscan.py`): every status-6 path sets posture
4 and then `0xbf62c` -> `0xbf700` (`P+0x5c` = MoguriBaseOfs) **after** its own setMotion (`0xe940b4` -> `0xe940d0`, `0xe94198`
-> `0xe941d8`, `0xe94554` -> `0xe9457c`), the curl (6, 0) `0xe93e78` writes it at L0 M17's end before `vt+0x3e8`, the turn
(6, 4) `0xe94224` after its posture 4, and the uncurl (6, 5) `0xe942e4` / the 0xe943e4 phase-5 emerge write posture 0 and
`P+0x5c` = 0.0 (literal `0xe948f8` = 0). So at an L0 M6 start the depth is whatever the previous status-6 step left:

| L0 M6 play | posture at the start | depth | 0x81d6c | bits 29-30 (c 1 / c 0) |
|---|---|---|---|---|
| status 2 (`0xe92da4`; (2, 0..5 / 0xe) in the probe) | 0 | any | 0 | ON |
| status 1 `0xe922a0` (posture 4 set first) | 4 | as left | depends | Uragaan: on unless a roll left -2000 |
| (6, 2) `0xe940b4` / (6, 3) / (6, 6) `0xe94198` after the curl (6, 0) or turn (6, 4) | 4 | -2000 (Uragaan) | **1** | **Uragaan OFF**, Crystalbeard ON (0 < 0 false) |
| (6, 2 / 3 / 6) after an uncurl (depth 0) | 4 | 0 | 0 | ON |
| (6, 0xa..0x16) `0xe943e4` phase 2 `0xe94554` (phase 1 wrote the depth) | 4 | -2000 (Uragaan) | **1** | **Uragaan OFF**, Crystalbeard ON |

His command table issues the chain `00 06 00 | 00 06 04 | 00 06 06` 14 times (`emc045_all.txt`): curl, turn, roll -- so the
AI-driven roll begins sunk on Uragaan. (I: that c 0 / c 1, cm202_001, are footfall dust the rolling posture suppresses -- the
clip is also his status-2 walk at posture 0.)

**Emulated** (`emu_bw.py`; case = motion:status:number:sever:rage:tired:posture:p5c:moguri:variant. Controls first: Ukanlos L0 M2
posture 4, P+0x5c 0 / -300, base -300 -> `0xe001ff` / `0x1ff`, L2 M3 severed + enraged `0x1c0e3f`; Nightcloak L1 M26 (7,0xcc) v4
`0x381ff`, L1 M27 (7,0xcd) v4 enraged `0x38e3f`, v0 `0x1ff` -- the em038 / em079 specs' words):

| case | Uragaan (v0) | Crystalbeard (v4) |
|---|---|---|
| L2 M1 / M5 / M13 / M14, beard on (or v0 with bit 1 set) | `0x60001ff` | `0x60001ff` |
| the same, beard off (P+0x3b4 = 2) | `0x60001ff` | `0x180001ff` |
| the same, tail cut only (P+0x3b4 = 1) | — | `0x60001ff` |
| L2 M5 (7,3) enraged | `0x6000e3f` | — |
| L2 M2 (7,2) calm / tired / enraged | `0x601ff` / `0x18703f` / `0x60e3f` | (v4 beard off: `0x601ff`) |
| L2 M2 (7,4) calm / tired; (7,0x90) calm / tired | `0x6001ff` / `0x180703f`; the same | |
| L2 M2 (7,3) / (7,1) / (1,2) | `0x1ff` each | |
| L2 M3 (7,2) calm / (7,4) tired / (7,0x90) enraged / (7,5) | `0x601ff` / `0x180703f` / `0x600e3f` / `0x1ff` | |
| L2 M10 (7,0x90) calm / tired | `0x66001ff` / `0x780703f` | beard off: `0x186001ff` / `0x1980703f` |
| L2 M10 (7,2) / (7,0x8a) / (2,2) / (7,4) v4 enraged | `0x60601ff` / `0x60001ff` / `0x60001ff` / — | (7,0x8a) beard off `0x180001ff`; (7,4) enraged `0x6600e3f` |
| L0 M11 (1,2) / (1,0xc) enraged / (1,0) / (1,1) / (7,2) | `0x181ff` / `0x18e3f` / `0x1ff` / `0x1ff` / `0x1ff` | (1,2) `0x181ff` |
| L0 M6 posture 4, P+0x5c 0 / -2000 / -1800 / -1801, base -2000 | `0x600001ff` / `0x1ff` / `0x600001ff` / `0x1ff` | |
| L0 M6 posture 0, P+0x5c -2000 | `0x600001ff` | |
| L0 M6 posture 4, P+0x5c -2000, base -2000, enraged | `0xe3f` | |
| L0 M6 posture 4, base 0 (Crystalbeard's), P+0x5c 0 | | `0x600001ff` |
| L0 M6 posture 4, base 0, P+0x5c -2000 (a depth his class never writes: every write is MoguriBaseOfs = 0 or 0.0) | | `0x1ff` |
| L2 M4 (7,2), L2 M7 (7,2), L2 M9 (7,4) v4, L2 M12 (7,0x90), L2 M21 (7,0x90) | `0x1ff` each | |
| L2 M21 (7,0x90) tired, L0 M10 (0,2) tired | `0x703f` each (the base: no class arm) | |

And the transcription below against the emulator over every combination (26 motions x 16 actions x P+0x3b4 0..3 x calm /
enraged / tired x 8 posture-depth-base cases, per variant; Duramboros's in the other spec in the same run): **em045_00 39936
runs, em045_04 39936 runs, 0 mismatches** (`jscheck.py`; node runs the JS, unicorn the ROM; `emu_fast.py` cross-checked
against `emu_bw.py` first).

**For psl-mask.js CLASS_MASK:**

    // URAGAAN (em045_00) and CRYSTALBEARD URAGAAN (em045_04), one class uEm045_00 (vtable 0x17c257c; +0xf0 the base 0xca52c),
    // vtable +0x13c = 0xe9cb64, READ whole (0xe9cb64..0xe9cd64; next 0xe9cd68 = vt+0x1d0) and emulated
    // (dev/em045_00-effects-spec.md 1). 0xca170 first, then by motion id; the variant byte e+0xb5f5 == 4 is tested twice and
    // only picks the beard word:
    //   * L2 M1 / M5 / M13 / M14 (k = motion - 0x201 in 0x3011): bits 25-26, or on Crystalbeard with the beard cut
    //     (vt+0x370(e, 2) = 0xa3bf4, P+0x3b4 bit 1) bits 27-28: u 201 / u 230 with it on, u 240 with it off;
    //   * L2 M2 / L2 M3 (k in 6), status 7: n 2 -> bits 17-18, tired (0x81614) 19-20; n 4 or 0x90 -> 21-22, tired 23-24.
    //     (7, 2) is the u 100 machine 0xe95b78(e, 0), (7, 4) the same machine with sel 1 (u 110 / u 120), (7, 0x90) the
    //     u 130 / 140 machine 0xe98ca8 whose last motion is L2 M3;
    //   * L2 M10 (k 9): the beard word AND the action arm (the status read through the post-indexed pointer, 0xe9cc70);
    //   * L0 M11: status 1, n 2 or 0xc -> bits 15-16 (c 90 on the rage roar (1, 2));
    //   * L0 M6: bits 29-30 unless 0x81d6c (posture 4 AND P+0x5c < 0.9 x MoguriBaseOfs, -2000 Uragaan / 0 Crystalbeard).
    const em045 = v4 => (motion, action, state) => {
      const n = action && action[0] === 7 ? action[1] : -1;
      const beard = v4 && state.beardOff ? 0x18000000 : 0x6000000;
      const act = (n === 4 || n === 0x90) ? (state.tired ? 0x1800000 : 0x600000) : n === 2 ? (state.tired ? 0x180000 : 0x60000) : 0;
      if (motion === 0x201 || motion === 0x205 || motion === 0x20d || motion === 0x20e) return beard;
      if (motion === 0x202 || motion === 0x203) return act;
      if (motion === 0x20a) return beard | act;
      if (motion === 0x00b) return action && action[0] === 1 && (action[1] === 2 || action[1] === 0xc) ? 0x18000 : 0;
      if (motion === 0x006) return state.sunk ? 0 : 0x60000000;
      return 0;
    };
    const em045_00 = em045(false), em045_04 = em045(true);

Inputs, and how the viewer supplies each:

* **`state.beardOff`** — NEW (Crystalbeard only). P+0x3b4 bit 1. Read it from the parts SHOWN, as Gypceros's `crestBroken`:
  the part pass draws **set 4** on exactly this test for variant 4 (`0xe9c94c..0xe9c97c`, rom-map's second-pieces row;
  states-em045_00.md §2), and em045_04 `groups[4]` = `[1 off, 2 on, 102 off]` is the only set that draws group 2 on. So
  **`SHELL_PARTS.em045_04 = { beardOff: 2 }`** in motion-states.js and index.html passes
  `beardOff: !!shellPartsInput(...).beardOff` beside `crestBroken`. Uragaan's word never reads it (v0: the variant test fails).
  MOTION_STATES em045_04 `'3|Motion[1]'` already reaches set 4 (`levels: [[3], [4]]`, u 901). R.
* **`state.sunk`** — today a STAND-IN `false` in index.html (Akantor's / Ukanlos's). For Uragaan the sunk case is reached in
  normal play (the curl -> turn -> roll chain above), so use the per-play field **`sunk`** in CLIP_ACTIONS (the twin of
  `posture`) and `clipSunkFor(monId, list, clip, n)` beside `clipPostureFor` -- the same field and helper
  dev/em043_00-effects-spec.md §4 proposes for Deviljho (one implementation serves both); index.html takes
  `const sunk = clipSunkFor(state.id, list, clip, plays.n) === true;` in place of the constant (`undefined` -> false, so every
  monster that names none keeps today's stand-in). Crystalbeard needs no entry (MoguriBaseOfs 0: never sunk). R (the order
  of writes) / the AI's choice of chain is the EMC's.
* **`action`** — CLIP_ACTIONS for L2 M2, L2 M3, L2 M10, L0 M11 (§3).
* **`state.tired`** — the toggle (the word reads 0x81614 itself on the action arms). rage from the toggle.

## 2. What the word changes — whole-block plan (Uragaan 107 file-mask -> 131 whole; Crystalbeard 110 -> 134)

`planrows.py <mon> [--whole]`, `add_effects.py em045_0X` (plan), `recs.py`. Every binding not listed sits on bits 0-5 and
stays always-on.

**Turned ON, always** (outside the file mask, both): L2 M4 b0 c 1 (f32, f138), **L2 M4 b1 u 350** (`cm202_035`, f200).

**Turned ON, gated** (outside the file mask; both monsters unless said):

| binding | record | enabled by |
|---|---|---|
| L0 M6 b29 f17 / 101 / 189 / 280, b30 f56 / 146 / 235 | c 1 / c 0 (`cm202_001`) | `!0x81d6c`: every status-2 play; a status-6 roll begun from depth 0; Crystalbeard always. Off on Uragaan's curl -> roll |
| **L0 M11 b15** f100-140 | **c 90** (`cm202_050`) | (1, 2) -- the rage roar (g6 s0, states-em045_00.md §5.1) -- or (1, 0xc) (g13 s0) |
| **L2 M1 b25** f110 | **u 201** (`em045_04_002`, in em045_00u too) | Uragaan always; Crystalbeard beard on |
| L2 M5 b25 (f87 / 143 / 223 / 275), L2 M13 b25 f56, L2 M14 b25 f71 | u 230 (em045_00_002 / em045_04_001) | Uragaan always; Crystalbeard beard on |
| L2 M5 / M13 / M14 b27 | **u 240** (Crystalbeard: `em045_00_002`, Uragaan's own u 230 file) | Crystalbeard, beard cut. Uragaan: no record (never enabled anyway) |
| **L2 M2 b17** f81-175 | **u 261** (`em045_00_004`) | (7, 2), not tired |
| **L2 M2 b19** f193 / **b20** f81-175 | **u 280** / **u 281** (`em045_00_005`) | (7, 2) tired |
| L2 M2 b21 f81-175 | u 263 | (7, 4), not tired |
| L2 M2 b23 f193 / b24 f81-175 | u 282 / u 283 | (7, 4) tired |
| **L2 M3 b17** f0-10 | **u 264** | (7, 2), not tired |
| **L2 M3 b19** f1 | **u 264** | (7, 2) tired |
| L2 M3 b21 f0-10 | u 265 | (7, 4) or (7, 0x90), not tired |

**Named, never enabled** (outside the file mask): **L2 M2 b27 u 267, b30 u 284, b31 u 285** (records exist, `em045_00_004` /
`_005`): no arm sets bits 25-31 on L2 M2 (k 1: the action arm only). Emulated L2 M2 every action x tired x beard: never bit 27,
30 or 31. Do NOT owe their export. Uragaan's L2 M5 / M13 / M14 b27 u 240: no record and never enabled.

**Gated** (in the file mask -- the viewer fires them in every state and action today):

| binding | record | game |
|---|---|---|
| L2 M3 b23 f1 | u 265 | (7, 4) / (7, 0x90) tired |
| L2 M10 b21 f34-82 | u 263 | (7, 0x90) not tired (L2 M10 is not played under (7, 4)) |
| L2 M10 b23 f34-82 | u 283 | (7, 0x90) tired |
| L2 M21 b12 f30 / b13 f1-30 | u 282 / u 283 | the base: tired and calm only |

**Turned OFF**: none.

So on L2 M2 / M3 / M10 / M21 each play fires ONE form: the calm one by its action, or the tired one -- and the tired forms
(u 280 / 281 / 282 / 283, the f193 one-shot among them) stand where the class's own requests stand when calm (u 100 / 110 /
120 at L2 M2 f193, u 130 / 140 at L2 M21 f38, both skipped while tired: rom-map's `0xe95b78` / `0xe98ca8` rows). **Flag, not
this spec's change**: MOTION_STATES `'2|Motion[2]'` / `'2|Motion[21]'` hold those class records with no tired gate; the ROM
skips them while tired (R in those rows).

Counts: Uragaan -- ON 2 always + 15 gated (c 0 / c 1 on L0 M6 by sunk, c 90 by action, u 201 / u 230 x3 always, 9 by
action x tiredness); 3 named-never with records (+3 recordless u 240); 5 in-mask gated. 24 out-of-mask, as the survey
counted. Crystalbeard -- the same, with u 201 / u 230 by the beard and u 240 x3 enabled by the beard cut.

**Records to export with the `--apply`**: Uragaan **c 90, u 201, u 261, u 264, u 280, u 281, u 350** (7; not u 267 / 284 /
285); Crystalbeard the same 7 **plus u 240** (8). (`--apply` exports every record a whole block names, 10 / 11 -- the three
never-enabled ones would sit unfired; leaving them out is the honest export.)

## 3. Which actions play the keyed clips — CLIP_ACTIONS

Sources: the action main under unicorn (`sweep.py`: statuses 0, 1, 2, 6, 7 x 256, variants 0 and 4 -- identical first
motions on both variants), the status-7 dispatcher **`0xe9a7b8`** (table `0xe9a7e4`, `s7tab.py`), every setMotion site in the
band (`motsites.py`) traced to its function and caller (`who.py`), and the machines' phases read.

* **L2 M2** (0x202, only site `0xe95c18`, phase 0 of `0xe95b78`): **(7, 2)** -> `0xe9ac40` -> `0xe95b78(e, 0)` (u 100);
  **(7, 4)** -> `0xe9b028` -> `0xe95b78(e, 1)` (u 110 / u 120 by `0x3a8430`).
* **L2 M3** (0x203): `0xe95c88`, phase 2 of the same machine -- (7, 2) / (7, 4); and `0xe990b0` in `0xe98ca8` phase 4 at the
  end of L2 M21 -- **(7, 0x90)** (`0xe9af60` -> `0xe98ca8`: L2 M10 `0xe98d1c` -> L2 M21 (`0xe98fa0`, the same `bl 0xe990b0`)
  -> L2 M3). No action change inside either machine (R, no setAction in the phases).
* **L2 M10** (0x20a): (7, 0x90) (above); **(7, 0x8a)** -> `0xe9b2ac` -> `0xe97e94` (`0xe97f04`); (7, 0xe5) -> `0xe99260`
  (`0xe99478`) -- the last two give the beard word only.
* **L0 M11**: (1, 2), (1, 0), (1, 0xc) (probe; states-em045_00.md §5.1: (1, 2) via `0xe91ab0(e, 0)`, the others `0xe91964` /
  `0xe91ab0(e, 1)`); also the recoveries (10, 0x2a) / (10, 0x2b) / (10, 0x70) (§6.1) -- base word. EMC: (1, 2) g6 s0 (rage)
  and g5 s0; (1, 0) g8 s1; (1, 0xc) g13 s0.
* L2 M1 (7, 0) `0xe94a78`; L2 M5 (7, 3 / 0xb / 0xc / 0x1d..0x21) `0xe95e60`; L2 M13 (7, 0x46 / 0x89; 0x70 from f54)
  `0xe97c4c` / `0xe97e1c`; L2 M14 `0xe95af0` (`0xe95718`, (7, 0x5a..) family) -- these read no action.
* EMC issuers (`emc045_all.txt`): (7, 2) g1 s4 / s84 / s85; (7, 4) g0 s1 / s7, g1 s20 / s31 / s90 / s94, g8 s0; (7, 0x90) g0 s1,
  g1 s98; (7, 0x8a) g1 s53 / s59.

    // URAGAAN / CRYSTALBEARD: the plays of the clips the word (0xe9cb64) keys on an action, and Uragaan's L0 M6 sunk split.
    // Status-7 table 0xe9a7e4: (7, 2) / (7, 4) -> 0xe95b78 sel 0 / 1 (L2 M2, then L2 M3 at phase 2); (7, 0x90) -> 0xe98ca8
    // (L2 M10 -> L2 M21 -> L2 M3); (7, 0x8a) -> 0xe97e94 (L2 M10). L2 M2 lists (7, 4) twice so its index runs in step with
    // MOTION_STATES '2|Motion[2]'s three holds (u 100 = sel 0, u 110 / u 120 = sel 1 by rank).
    em045_00: {
      '2|Motion[2]':  [{ action: [7, 2] }, { action: [7, 4] }, { action: [7, 4] }],
      '2|Motion[3]':  [{ action: [7, 2] }, { action: [7, 4] }, { action: [7, 0x90] }],
      '2|Motion[10]': [{ action: [7, 0x90] }, { action: [7, 0x8a] }],
      '0|Motion[11]': [{ action: [1, 2] }, { action: [1, 0] }],
      // L0 M6: no action decides it, the depth does (0x81d6c): the status-2 play (posture 0), then the EMC's curl -> turn ->
      // roll (6, 6), which starts sunk (the actions are labels; the word reads only `sunk`)
      '0|Motion[6]':  [{ action: [2, 2] }, { action: [6, 6], posture: 4, sunk: true }],
    },
    em045_04: { /* the same first four entries; no L0 M6 entry (MoguriBaseOfs 0: never sunk) */ },

(Whether the viewer's per-clip counters for MOTION_STATES cycles and CLIP_ACTIONS advance together is the implementer's to
check; if not, the honest fallback is two entries for L2 M2.)

## 4. What to implement, in order

1. motion-states.js: `SHELL_PARTS.em045_04 = { beardOff: 2 }`; index.html passes `beardOff` (shellPartsInput, the parts
   shown) into pslMask's state.
2. psl-mask.js: `em045` / `em045_00` / `em045_04` into CLASS_MASK; both ids into `PSL_MASK_MONSTERS`; CLIP_ACTIONS as §3;
   the `sunk` field: `clipSunkFor` exported beside `clipPostureFor`, and index.html's `const sunk = false` becomes
   `clipSunkFor(...) === true` (Duramboros needs the same, dev/em055_00-effects-spec.md).
3. `add_effects.py em045_00 --apply`, `em045_04 --apply` (regenerates CLIP_EFFECTS from the whole blocks), then remove /
   leave unfired u 267 / 284 / 285 as §2 says; `--record`, `--check`. Recorder slot -- announce (efx: one recorder and one
   lift at a time).
4. Soak with `--viewer-inputs`; Raven verifies: L2 M2 / L2 M3 one form per play ((7, 2) / (7, 4)), the tired forms only
   with Exhausted on; L2 M10 / L2 M21 likewise; c 90 on the rage roar; Crystalbeard's L2 M1 / M5 / M13 / M14 change effect
   (u 230 -> u 240, u 201 gone) once the beard is cut; Uragaan's roll dust off on the second (curl) play.

NOT READ, by name: what `vt+0x3e8` (`0x75330`) does between the status-6 steps beyond the EMC chain the table shows; what
groups 5 / 8 / 13 of the command table are (the (1, 0) / (1, 0xc) issuers); `0x3a8430`'s byte (u 110 vs u 120 only); what
u 201 / u 230 / u 240 / u 26x / u 28x look like (Raven's).

## Re-walk 2026-10-18 (Fanged-Wyvern effects agent): tracer diff, request census, word re-emulation

**L0 M6's u 1400 is (6, 3) / (6, 6)'s** (reqtrace.py, `0xe941b0`); the walks and the curl (6, 2) ask nothing. Now copy B for Uragaan and Crystalbeard (whose MoguriBaseOfs 0 keeps it unsunk). The class ids: (7, 2) u 1001, (7, 4) u 1003, (7, 0x90) u 1005 (phase 1 / 1 / 4). CLIP_ACTIONS L2 M3 confirmed: (7, 2) / (7, 4) reach it once P+0x1a2 (the roll count, raised at each L2 M2 end) is >= 4 (`0xe95c3c..0xe95c88`), (7, 0x90) at phase 4 (`0xe990b0`).

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **`vt+0x3e8` (`0x75330`) between the status-6 steps -- answered by its row** (rom-map `0x75330`): posture 4, (0, 7) unless status
  0xb, then `0x82454(e, 0)` (e+0x72f0 = 1); it picks no step -- the streams do.
* Groups 5 / 8 / 13 (the (1, 0) / (1, 0xc) issuers): group 5 is the shared selector's (`0x7e1e8` / `0x7e678`); 8 and 13 are
  started by no `0x824f0` caller (rom-map row "groups started by the shared selectors") -- NR.
* **Begins Burrowed -- BUILT 2026-10-19** (CLASS_TOGGLES `burrowed`, working label, approved by Raven): on, every posture-4 play
  reads sunk (0x81d6c: posture 4 and P+0x5c below 0.9 x MoguriBaseOfs); off, only the entries that name sunk. Checked on
  Basarios's L0 M7 B (dev/checks/class-toggles.mjs).

## Re-metered 2026-10-25 (effects lane A)

* c 211 / c 212 / c 222 (L0 M20 bits 1 / 2 / 3, base bits) draw: L0 M20 is a split motion and the old census played only its
  `_start` piece. u 1400 (L0 M6 copy B) and c 1500 (lying, Ground H) draw, both variants.
* **u 267 / u 284 / u 285 (L2 M2 bits 27 / 30 / 31) are never enabled** -- the word `0xe9cb64` gives L2 M2 the action bits 17-24
  only (section 1; emulated 39936 runs per variant). A ROM reason for the coordinator; control: u 261 / 263 / 280-283 on the same
  clip draw (rom-map "Uragaan / Crystalbeard u 267").
