# Deviljho (em043_00) and Savage Deviljho (em043_05) — effects spec: the PSL enable word

Research agent for the Viewer agent, 2026-10-15 (dev/brute-wyverns-effects-survey.md "What closing each needs", item 4).
Static ROM reading plus unicorn controls; no recorder, no lift, no `--apply`, no docs/ edit. `R` = READ (the consuming
instruction read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: dev/brute-wyverns-effects-survey.md (Deviljho / Savage: 26 bindings outside the file mask each, 180
file-mask / 206 whole-block; unexported c 122 / 124 / 125 / 210, + c 91 on Deviljho; Savage's c 91 exported and undriven),
rom-map.md ("The PSL enable word per class": uEm043_00 `0x17bfd1c` / `0xe80fd0` UNREAD; "THE PSL ENABLE MASK"; the
uEm043_00 section; the `0x6fe88`, `0x81d6c` / `0xbf62c`, `0xa3bf4` rows), docs/render/psl-mask.js whole,
E:\offline\decode\notes\breaks-em043.md (§5.2 names this slot "attack hit groups" and reads the first arm: L2 M3 / M4 / M10
/ M19 / M20 / M21 bits 15-17 while vt+0x370(e, 1) is 0 — **right as far as it goes; the slot is the PSL enable word** (rom-map's
withdrawn "hit groups" trap), and it has two more arms), states-em043.md (Savage: §1.2 rage, §1.4 the other L0 M5 plays, §2
tired), states-em043_00.md (Deviljho: §2.1 the rage entry L0 M5), tail-option-em043.md (nothing on this slot), motion-states.js
MOTION_STATES em043_00 / em043_05 and SHELL_TAIL, part-review.json (the drivers `0xe806a0` / `0xe809e8`), the task board (grep:
only the survey's line 1096 — no read of this word). Scratch: `<scratchpad>/bw1/` (emu13c_bw.py, jscheck_bw.py, b43act.py,
turntabs.py, calls.py, immscan.py, motsites.py, the plans).

## 1. The word — uEm043_00 vt+0x13c = `0xe80fd0` — R, emulated

Vtable **`0x17bfd1c`** (checked: `+0xf0` = base `0xca52c`, `+0x370` = `0xa3bf4`, `+0x1f4` = `0xe7e9d4` the action main,
`+0x208` = `0xe7f054`, `+0x210` = `0xe80d10`). One class for both monsters (breaks-em043.md; the variant byte `e+0xb5f5` is 5
on Savage). Extent **`0xe80fd0..0xe810e0`**: one `push {r4, r5, fp, lr}`; exits `pop` `0xe81034` (shared by both arms'
returns), `popne` `0xe81088`, `pop` `0xe8109c`; the last instruction is `b 0xe81084` at `0xe810e0`; `0xe810e4` is the next
function's `push`. The jump table `0xe81054..0xe8107b` (10 words, offsets from `0xe81054`, bounded by `cmp r0,#9`) is inside.

    0xe80fdc  bl 0xca170                                   ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0xe80fe0  k = motion - 0x203; k > 0x12 -> 0xe81038
    0xe80ffc  tst 0x70083, 1 << k                         ; k 0 / 1 / 7 / 16 / 17 / 18 = L2 M3, M4, M10, M19, M20, M21
    0xe81014    r0 = e->vt[+0x370](e, 1)                    ; 0xa3bf4: P+0x3b4 bit 0, the tail severed
    0xe81020    r1 = [e+0x13f4] (write-back `ldr r1,[r4,r1]!`); r2 = r1 with bits 15-17 CLEARED (`bfc r2,#15,#3`);
                not severed (`orreq`) -> r2 = r1 | 0x38000 (bits 15-17); `str r2,[r4]` 0xe81030
              (a motion in 0x203..0x215 whose bit is clear falls to 0xe81038, where motion - 5 > 9: return)
    0xe81038  k = motion - 5; k > 9 -> return; table 0xe81054[k]:
                L0 M5  (k 0) -> 0xe810a0
                L0 M6, L0 M11, L0 M14 (k 1 / 6 / 9) -> 0xe8107c
                L0 M7..M10, M12, M13 -> 0xe81034 (return)
    0xe8107c    0x81d6c(e) != 0 -> return (`popne`)        ; posture P+0x1ba == 4 AND P+0x5c < 0.9 x MoguriBaseOfs: sunk
    0xe8108c    else |= 0x38000 (bits 15-17)
    0xe810a0    0x6fe88(e, 10, 0xa7) / 0x6fe88(e, 10, 0x2a) -> return if either holds; 0x6fe88(e, 10, 0x70) -> 0xe81084:
                holds -> return, else |= 0x38000 (bits 15-17)
    every other motion: the base alone

`0x6fe88` (read whole, `0x6fe88..0x6feb4`): `e+0x73e0 == r1 && e+0x73e1 == r2`. `0x81d6c` (read whole, `0x81d6c..0x81db4`,
literal `0x81db8` = 0.9): `[P+0x1ba] == 4`, then `[P+0x5c] < 0.9 x 0xbf62c(e)` (`movpl r0,#0`). Every `bl` followed: `0xca170`,
`0xa3bf4`, `0x81d6c` (-> `0xbf62c` -> `0x712a0`), `0x6fe88`. The `bfc` on the severed path clears bits the base never sets (15-17),
so it changes nothing; the transcription returns 0 there.

**Variant tests: none.** The method has no `e+0xb5f5` read; the class band `0xe72738..0xe83434` has 23 `movw #0xb5f5` sites
(`immscan.py`), none in `0xe80fd0..0xe810e0`, and no callee reads it. **Deviljho and Savage have one word** (emulated: every case
below identical at variant 0 and 5). Action read only on L0 M5 (status 10 only); part state only the sever bit; no break level,
rank or rage test of the class's own.

Negative with control: the class band has exactly two `0x13f4` immediates, `0xe81018` and `0xe8108c`, both in the method; the
same scan over `0xe60000..0xe72738` finds uEm038_00's `0xe62cc0` / `0xe62ce8` and uEm042_00's `0xe70bcc` / `0xe70cac` / `0xe70d04`.

**Savage's c 91 (L2 M10 / M16 / M17 bit 13):** the class neither sets nor clears bits 12-14 (its only clear is the `bfc` of
15-17), so bit 13 is the base's: **c 91 fires tired and calm, on both monsters**, as c 90 on bit 12 does. Savage can be tired and
calm (states-em043.md §1.3 / §2: rage ends on its timer, tired is the shared machine; theirs).

**Emulated** (`<scratchpad>/bw1/emu13c_bw.py`: g18/emu13c_g.py plus emu13c2.py's posture / P+0x5c / MoguriBaseOfs
(`0x712a0` answered) and the ARMv8 model; one unicorn instance reused. **Controls first** — the earlier specs' words: Deadeye L0 M7
(7, 0xe5) v4 `0x380001ff`, L2 M12 v4 level 2 `0x1c01ff`, Garuga L2 M2 `0x1bf`, v0 L0 M7 `0x1ff`; Akantor L0 M2 sunk / surface
`0x1c01ff` / `0x381ff`; Ukanlos L0 M2 sunk / not `0x1ff` / `0xe001ff` — all reproduced):

| case | word |
|---|---|
| L2 M10 calm / tired / severed / severed + enraged | `0x381ff` / `0x3f03f` / `0x1ff` / `0xe3f` |
| L2 M3 v5 intact; L2 M21 v5 severed; L2 M19 enraged; L2 M20 tired | `0x381ff`; `0x1ff`; `0x38e3f`; `0x3f03f` |
| L0 M5 (1, 2) calm / enraged; (1, 0x12); (10, 0x6e) | `0x381ff` / `0x38e3f`; `0x381ff`; `0x381ff` |
| L0 M5 (10, 0x2a) / (10, 0x70) / (10, 0xa7) v5 | `0x1ff` / `0x1ff` / `0x1ff` |
| L0 M6 (2, 0) surface; (6, 3) posture 4, P+0x5c -1500, base -1500 (sunk); posture 4, P+0x5c 0 | `0x381ff`; `0x1ff`; `0x381ff` |
| L0 M11 surface; L0 M14 sunk / tired | `0x381ff`; `0x1ff` / `0x3f03f` |
| L2 M16 / L2 M17 tired (bits 12-14: c 90 b12, c 91 b13) | `0x703f` / `0x703f` |
| L0 M34; L2 M41 v5 severed; L3 M15 | `0x1ff`; `0x1ff`; `0x1ff` |

The transcription below against the emulator (`jscheck_bw.py`; node runs the JS, unicorn the ROM): 24 motions x 10 actions x
sever x calm / enraged / tired x 4 posture / P+0x5c cases x rank 0 / 5 x variant 0 / 5 = **46080 runs, 0 mismatches**.

**For psl-mask.js CLASS_MASK:**

    // DEVILJHO (em043_00) and SAVAGE DEVILJHO (em043_05), one class uEm043_00, vtable +0x13c = 0xe80fd0 (vtable 0x17bfd1c;
    // +0xf0 the base 0xca52c), READ whole (0xe80fd0..0xe810e0, jump table 0xe81054) and emulated (dev/em043_00-effects-spec.md
    // 1). 0xca170 first, then by motion id -- NO variant test (Savage's word is Deviljho's):
    //   * L2 M3 / M4 / M10 / M19 / M20 / M21 (0x70083 over motion - 0x203): vt+0x370(e, 1) = 0xa3bf4 (P+0x3b4 bit 0, the tail
    //     severed) -> nothing (bfc of 15-17, which the base never sets), else bits 15-17: c 121 / c 120 / c 122 / c 120 / c 125 /
    //     c 124 -- the tail's impacts, on while the tail is on;
    //   * L0 M5 (table 0xe81054 -> 0xe810a0): bits 15-17 unless the action is (10, 0xa7), (10, 0x2a) or (10, 0x70) (0x6fe88) --
    //     c 60 on the rage roar (1, 2) and (1, 0x12), not on the paralysis / shock-trap / (10, 0xa7) recoveries;
    //   * L0 M6 / L0 M11 / L0 M14 (-> 0xe8107c): bits 15-17 unless 0x81d6c (posture 4 and P+0x5c < 0.9 x MoguriBaseOfs:
    //     already under the ground) -- c 0 / c 1, the footfalls, on the surface only;
    //   * every other motion: the base alone. Bits 12-14 (c 90 b12, c 91 b13) are the base's tired-calm group.
    const EM043_TAIL = new Set([0x203, 0x204, 0x20a, 0x213, 0x214, 0x215]);
    function em043(motion, action, state){
      if (EM043_TAIL.has(motion)) return state.severed ? 0 : 0x38000;
      if (motion === 0x005)
        return action && action[0] === 10 && (action[1] === 0xa7 || action[1] === 0x2a || action[1] === 0x70) ? 0 : 0x38000;
      if (motion === 0x006 || motion === 0x00b || motion === 0x00e) return state.sunk ? 0 : 0x38000;
      return 0;
    }
    // CLASS_MASK: em043_00: em043, em043_05: em043

Inputs, and how the viewer supplies each:

* **`state.severed`** — P+0x3b4 bit 0. The part drivers draw the tail's set on the same `vt+0x370(e, 1)`: Deviljho `0xe806a0`
  calm `0xe80800..0xe80818` (`movne #4 / moveq #8`), enraged `0xe808e0..0xe808f8` (`#0xa / #0xc`); Savage `0xe809e8`
  `0xe80c00..0xe80c24` (`#0xa / #0xc`) (R, read here for Deviljho; Savage's per part-review.json, theirs). monsters.json, both
  monsters: groups[8] and groups[12] draw part 8 (the stump) on, groups[4] / [10] off; no other set names 8. So **`SHELL_TAIL.em043_00
  = { severed: 8 }`, `SHELL_TAIL.em043_05 = { severed: 8 }`** (motion-states.js), read by the existing `shellTailInput`. Their sever
  rows (`'3|Motion[15]'` levels D_TAIL / [[10], [12]]) take the model there. R.
* **`action`** — only L0 M5 reads it, status 10 only. With `null` the bits are ON (c 60 fires), which is the rage roar's word; a
  CLIP_ACTIONS entry adds the recovery form (§3).
* **`state.sunk`** — `0x81d6c`, the shared stand-in (`false`) in index.html today, which is right for every surface play. The
  burrow plays (§3) start sunk; to show them the CLIP_ACTIONS entry carries a new **`sunk`** field (§3, §4). Deviljho's
  MoguriBaseOfs value (`.dtb +0xa8`): NR (Barroth's is -1500, states-em044_00.md §8.1); the test is relative to it.
* rage / tired from the toggles. No rank, no break level, no new part input.

## 2. What the word changes — whole-block plan (180 file-mask -> 206 whole, both monsters)

`add_effects.py em043_00` / `em043_05` (plan: "26 records can go in (26 already are)") and `<scratchpad>/bw1/planrows.py <mon>
[--whole]`; records from `recs.py` (the whole plan's records not in docs/effects/<mon>.json). The two monsters' rows are identical
(same blocks, one c.pel `em043_00c`). Every binding not listed sits on bits 0-5 inside the file mask and stays always-on.

**Turned ON, always** (outside the file mask, bits 0-5 — 10):

| binding | record |
|---|---|
| L0 M13 b1 f20, f80; L2 M2 b1 f20 | c 1 (`cm202_001`) |
| L0 M34 b0 f68 | **c 210 (`cm202_006`, not exported)** — L0 M34 is (6, 5), the surfacing (§3) |
| L2 M20 b2 f105 | c 4 (`cm202_002`) |
| L2 M41 b2 f0-65 / b3 f85 / b4 f93-133 / b5 f164-219 | u 200 (`em043_00_000`) / u 201 (`_001`) / u 203 (`_003`) / u 202 (`_002`) |
| L2 M42 b0 f62 / b1 f170 | c 0 / c 1 (`cm202_001`) |

**Turned ON, on the surface only** (outside the mask; off when sunk — 5):

| binding | record |
|---|---|
| L0 M6 b15 f50, 140, 232 / b16 f15, 99, 182, 272 | c 0 / c 1 (`cm202_001`) |
| L0 M11 b15 f70 | c 0 |
| L0 M14 b15 f53 / b16 f19 | c 0 / c 1 |

**Turned ON while the tail is on** (outside the mask; off when severed — 4):

| binding | record |
|---|---|
| L2 M10 b15 f78 | **c 122 (`cm202_030`, not exported)** |
| L2 M19 b15 f117 | c 120 (`cm202_030`) |
| L2 M20 b15 f117 | **c 125 (`cm202_031`, not exported)** |
| L2 M21 b15 f74 | **c 124 (`cm202_031`, not exported)** |

**Turned ON tired and calm** (outside the mask; the base's group 12-14 — 7):

| binding | record |
|---|---|
| L2 M16 b12 f84-86, 164 / L2 M17 b12 f8, 72-98, 158-172 / L2 M27 b12 f31-79, 102-104 / L2 M32 b12 f6-72 | c 90 (`em043_00_009`) |
| L2 M10 b13 f49, 151 / L2 M16 b13 f26, 102 / L2 M17 b13 f26, 182 | **c 91 (`em043_00_009`; not exported on Deviljho; exported, undriven on Savage)** |

**Gated** (in the file mask — the viewer fires them on every play today — 14):

| binding | record | game |
|---|---|---|
| **L0 M5 b15** f96-106 | c 60 (`cm202_050`) | not on (10, 0x2a) / (10, 0x70) / (10, 0xa7) |
| **L2 M3 b15** f38 / **L2 M4 b15** f41 | c 121 (`cm202_031`) / c 120 (`cm202_030`) | tail on only |
| L2 M1..L2 M11 b12 (11 bindings: M1 f29-48, 140; M2 f60-75, 104-122; M3 f9-42; M4 f18-63; M5 f38-56; M6 f38-71; M7 f30-89; M8 f32-107; M9 f0-25, 53-76, 141-149, 226-229; M10 f37-76, 97-101; M11 f38-51, 92-116, 163-192) | c 90 | tired and calm only |

**Named but never enabled:** none. **Turned OFF:** none. (Enabled bits named in no block: 16-17 on the tail-arm, L0 M5 and
footfall motions — nothing binds them.)

Counts, each monster: 26 out-of-mask = 10 always + 5 surface + 4 tail + 7 tired-calm (the survey's 26); 14 in-mask gated.

**Records to export with the `--apply`:** Deviljho **c 91, c 122, c 124, c 125, c 210**; Savage **c 122, c 124, c 125, c 210**
(his c 91 is exported already and becomes driven).

## 3. Which plays reach the keyed clips — CLIP_ACTIONS

Sources: the action main under unicorn (`<scratchpad>/bw1/b43act.py`: a copy of efx/agents/barroth-scratch/b44act.py pointed at
vtable `0x17bfd1c`, action main `0xe7e9d4`, band `0xe72738..0xe83434`; statuses 0 / 1 / 2 / 6 / 7 / 10, variants 0 and 5 —
identical first motions), every setMotion site with its r1 immediate (`motsites.py`), the angle-picked turn tables
(`turntabs.py`: every `0x7a258` / `0x7a27c` call, its table through `ldr r1,[pc,r0]` (a GOT word) and the posture taken before it;
`0x772b4` plays a table's `+0x10` straight, `+0x20` / `+0x30` sides), the command table (`em043_00_cmdtbl.emc`,
barroth-scratch/emcfind.py).

* **L0 M5** (0x005): **(1, 2)** the rage roar, `0xe74cd4` phase 0, site `0xe74d18` (blend 6, start 0) — cmdtbl g6 s0 (the forced
  transition), g5 s0 / s1, g0 s24, g1 s100; **(1, 0x12)** site `0xe7455c` — g13 s0; **(10, 0x2a)** after paralysis and **(10,
  0x70)** after the shock trap, script `0x17c08f0`, and **(10, 0xa7)** the tail of script `0x17c0bd0` (states-em043.md §1.4,
  theirs — not re-read). Also a side record of turn table `0x169e568` {-, L0 M6, L0 M5} (fn `0xe75f04`, posture 0, reached from
  `0xe761b8`; which action: NR) — a non-status-10 play, bits on.
* **L0 M6** (0x006): the walk — (2, 0 / 1 / 2 / 3 / 4 / 5 / 8 / 0xd / 0x10 / 0x14 / 0x16 / 0x1e / 0x20 / 0x21 / 0x25 / 0x29),
  setMotionL at posture 0 (sites `0xe7500c`, `0xe75d6c`, `0xe7e1ac`), bits on; **(6, 3)** the travel under the ground, `0xe77008`:
  posture 4 (`0xe7704c`), setMotion0 L0 M6 (`0xe77064`), and only THEN `P+0x5c = MoguriBaseOfs` (`0xbf62c` / `0xbf700`,
  `0xe7708c..0xe77094`) and u 1400 (`b 0xa499c`, `0xe770a8`). So the word reads the P+0x5c the previous action left: every
  posture-4 action sets it after its own motion — (0, 7) the underground hold `0xe74338` (`0xe744b4..0xe744dc`), (6, 3), (6, 4)
  `0xe770ec` (`0xe77150..0xe77168`) — so a (6, 3) that follows any of them starts **sunk: bits off** (R, the sites; the AI order: no
  stream in em043_00_cmdtbl.emc issues (6, 3) (emcfind) — **who issues it: NR**, the `sunk` reading I).
* **L0 M11** (0x00b) and **L0 M14** (0x00e): turn table **`0x169e428`** {L0 M14 straight, L0 M10 / L0 M11 sides} at posture 0
  (fns `0xe75410`, `0xe76058`, `0xe7e7f4`) and at posture 4 in (6, 4) `0xe770ec` (cmdtbl g1 s82, then (6, 5)); `0x169e4a8` {L0 M14,
  L0 M12 / M13} (`0xe75818`); L0 M14 also (1, 0xa), site `0xe74ca0`. Surface plays: bits on.
* L2 M3 / L2 M4: sides of turn table `0x169e468` {L0 M14, L2 M3 / L2 M4} (`0xe7b1d4`, status 7 via `0xe7eaa8`); L2 M10 (7, 0x20 /
  0x21) `0xe79ef4`; L2 M19 (7, 5) / (7, 0x1f) `0xe7878c`; L2 M20 (7, 4) `0xe7849c`; L2 M21 (7, 1) `0xe7737c` — no action read; the
  sever decides.

    // DEVILJHO / SAVAGE (em043_00 / em043_05), the plays of the clips the word (0xe80fd0) keys on an action or the burrow:
    //   L0 M5: (1, 2) the rage roar (0xe74d18) -- c 60; (10, 0x2a) the paralysis recovery (script 0x17c08f0) -- none
    //     ((10, 0x70) / (10, 0xa7) the same). The row's own rage entry is the (1, 2) play.
    //   L0 M6: the walk (2, n) at posture 0 -- c 0 / c 1 footfalls; (6, 3) under the ground (0xe77008, posture 4, u 1400) --
    //     begun sunk, no footfalls. `sunk` is the new field (0x81d6c: P+0x1ba == 4 and P+0x5c < 0.9 x MoguriBaseOfs).
    em043_00: {
      '0|Motion[5]': [{ action: [1, 2] }, { action: [10, 0x2a] }],
      '0|Motion[6]': [{ action: [2, 0] }, { action: [6, 3], posture: 4, sunk: true }],
    },
    // em043_05: the same two entries.

(The burrow turns of L0 M11 / M14 under (6, 4) are left out: the viewer shows those clips as surface turns, and the stand-in
`sunk = false` is the surface's word. Add `{ action: [6, 4], posture: 4, sunk: true }` if the burrow turn is to be shown.)

**Flag, not the word's:** MOTION_STATES em043_00 / em043_05 `'0|Motion[6]': { hold: [.., 1400] }` holds u 1400 on every play of
L0 M6, but the ROM starts it only from (6, 3) (`0xe770a8` is the one `0xa499c` site in the class); with the two entries above the
walk play would carry it too. Keying that hold on the play is a MOTION_STATES question for the Viewer agent.

## 4. What to implement, in order

1. psl-mask.js: `EM043_TAIL` / `em043` as §1 into CLASS_MASK for **`em043_00` and `em043_05`**; both ids into
   `PSL_MASK_MONSTERS`; CLIP_ACTIONS `em043_00` / `em043_05` as §3; **a `clipSunkFor(monId, list, clip, n)`** (the twin of
   `clipPostureFor`: the play's entry's `sunk`, `undefined` elsewhere).
2. index.html playNow: `const sunk = clipSunkFor(state.id, list, clip, plays.n) === true;` in place of the constant (Akantor's and
   Ukanlos's words keep `false`: they have no entry). motion-states.js SHELL_TAIL: `em043_00: { severed: 8 }`, `em043_05: { severed: 8 }`.
3. `add_effects.py em043_00 --apply`, then `em043_05 --apply` (CLIP_EFFECTS from the whole blocks; exports Deviljho's c 91 /
   122 / 124 / 125 / 210 and Savage's c 122 / 124 / 125 / 210), `--record`, `--check`. Recorder slot — announce (efx: one recorder
   and one lift at a time).
4. Soak with `--viewer-inputs`; Raven verifies: c 60 on the rage roar and not on the recovery play; c 120 / 121 / 122 / 124 / 125
   on the tail attacks with the tail on and gone after the sever; c 0 / c 1 footfalls on L0 M6 / M11 / M14 walking, none on the
   (6, 3) entry; c 90 / c 91 only when tired and calm (Savage's c 91 now visible); L2 M41's u 200..203 and L0 M34's c 210 every
   play.

NOT READ, by name: who issues (6, 3) and whether its P+0x5c is MoguriBaseOfs at every start (I: every posture-4 action sets it
after its motion); Deviljho's MoguriBaseOfs value; the end of his dive (6, 0) / (6, 6) L0 M33 (Barroth's ends in vt+0x3e8 =
`0x75330` -> posture 4, (0, 7)); which action reaches turn table `0x169e568` (fn `0xe75f04`); the status-10 scripts `0x17c08f0` /
`0x17c0bd0` (states-em043.md's reading stands, not re-read); what c 60 / c 120..125 / c 210 look like.
