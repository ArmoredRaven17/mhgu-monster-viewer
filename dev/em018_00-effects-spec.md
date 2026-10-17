# Yian Garuga (em018_00) and Deadeye Yian Garuga (em018_04) — effects spec: the PSL enable word

Research agent for the Viewer agent, 2026-10-15 (the Bird Wyverns survey's "Overrides to read", item 3). Static ROM
reading plus unicorn controls; no recorder, no lift, no `--apply`, no docs/ edit. `R` = READ (the consuming instruction
read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: dev/bird-wyverns-effects-survey.md (Garuga / Deadeye: 26 bindings outside the file mask each;
unexported Garuga u 290 380 381 400 401 560 580, Deadeye u 290 380 381 390 391 400 401 531 560 570 580), rom-map.md ("The
PSL enable word per class": uEm018_00 `0x17abb38` / `0xdb0d10` UNREAD; "THE PSL ENABLE MASK"; the `0x9d36c`,
`0x3a8430`, `0xa3bf4`, `.dtp` array-A rows), E:\offline\decode\notes\states-em018_00.md (covers both variants: §1.4 the
action main, §2 the part pass, §3.1 the .dtp rows, §3.4 the sever; its vtable row for +0x13c lists the motions and says
"what reads e+0x13f4: NOT READ" — that is answered by rom-map's PSL section, not here), docs/render/psl-mask.js whole,
motion-states.js SHELL_TAIL / shellTailInput / garugaLine, index.html playNow, the task board (grep: no read of this
word). Scratch: `<scratchpad>/g18/` (emu13c_g.py, jscheck.py, classify.py, motsites.py, s7tab.py, who.py, the plans).

## 1. The word — uEm018_00 vt+0x13c = `0xdb0d10` — R, emulated

Vtable **`0x17abb38`** (checked: `+0xf0` = base `0xca52c`, `+0x208` = `0xda528c`, `+0x370` = `0xa3bf4`, `+0x1d0` =
`0xdb0e58`). One class for both monsters (states-em018_00.md: the variant byte `e+0xb5f5` is 4 on Deadeye). Extent
**`0xdb0d10..0xdb0e50`**: one `push {r4-r7, fp, lr}`, exits `pophi` at `0xdb0e2c` and `pop` at `0xdb0e50`; the word at
`0xdb0e54` is this method's literal (GOT offset `0xa80e98` -> `0x1831c54`, used at `0xdb0db0..0xdb0db8`); `0xdb0e58` is
vt+0x1d0 (the class request, `cmp r1,#0x3e8` ... `b 0x6feb8`).

    0xdb0d1c  bl 0xca170                                   ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0xdb0d20  motion >= 0x20c -> 0xdb0d54:
    0xdb0d54    motion == 0x20c (L2 M12) / 0x441 (L4 M65) / 0x44d (L4 M77) -> 0xdb0d6c, else return
    0xdb0d6c    r6 = e + 0xb5f5 (post-indexed `ldr r0,[r6],r0`: r0 = the vtable, r6 the variant byte's address)
    0xdb0d84    r5 = e->vt[+0x370](e, 1)                     ; 0xa3bf4: P+0x3b4 bit 0, the tail severed
    0xdb0d8c    r1 = 0x38000 (bits 15-17); variant [r6] != 4 -> 0xdb0de4
    0xdb0d9c    DEADEYE: A = [[e+0x75f0]+0x64] (.dtp array A); thr = 0x3a8430(quest) <= 4 ? A[0x15] : A[0x16]
                (`cmp r0,#4` / `movle r7,r6`); lvl = 0x9d36c(e, 7) (byte P+0x3bc + 7*12, part 7's break level)
    0xdb0ddc    r1 = 0x1c0000 (bits 18-20); thr > lvl (`movhi`) -> r1 = 0x38000
    0xdb0de4    severed (r5 != 0, `movne`) -> r1 = 0xe00000 (bits 21-23); +0x13f4 |= r1
    0xdb0d28  motion == 0x007 (L0 M7) -> 0xdb0dfc: variant == 4 AND status e+0x73e0 == 7 AND
              e+0x73e1 - 0xe3 <= 2 (unsigned: 0xe3, 0xe4, 0xe5; `pophi` otherwise) -> |= 0x38000000 (bits 27-29)
    0xdb0d30  motion == 0x168 (L1 M104) -> |= 0x7000000 (bits 24-26), no other test
    0xdb0d38  motion == 0x202 (L2 M2)   -> &= ~0x1240 (bic: CLEARS bits 6, 9 and 12 -- the first bit of each state group)
    every other motion: the base alone

Every write goes through the pre-indexed pointer `ldr r0,[r4,r0]!` (r4 = e+0x13f4 afterwards; the `movw #0x13f4` before
each) and `str r0,[r4]` at `0xdb0e4c`. **Variant tests: exactly two, both `e+0xb5f5 == 4`** (`0xdb0d8c..0xdb0d98` the
tail-break split, `0xdb0dfc..0xdb0e08` the L0 M7 arm). Action read only on L0 M7. Part state: the sever bit (all three
tail-arm motions, both variants) and part 7's break level (Deadeye only).

The threshold (R, the .dtp and the loader): the loader `0x556a0` reads byte 8 as the row count and puts `4 x count` bytes
from file offset `0x4d` at `res+0x64` (`0x55980..0x559a8`). `em018_04_dtbparts.dtp`: 6 rows `{part, level rank<=4,
level rank>4, group}` = (6,3,3,1) (6,2,2,2) (1,2,2,3) (2,2,2,3) (0,2,2,4) **(7,2,2,0)** — so A[0x15] = A[0x16] = **2**
(row 5 = part 7: the same row states-em018_00.md §2 reads for the part pass's set 14). Garuga's file has 5 rows and no
part-7 row; his variant never reaches the load. **So on Deadeye: tail break level >= 2 -> bits 18-20, at every rank.**
`0x3a8430` (rom-map: returns 5 / 3 / 1 / 0 from `[[obj+0xa4]+0xf]`) is read, but both bytes are 2, so the rank cannot
show.

Negative with control: the class band `0xda4778..0xdb3140` has exactly four `0x13f4` immediates, all inside this method
(`0xdb0d44`, `0xdb0de4`, `0xdb0e30`, `0xdb0e40`); the same scan over `0xd36000..0xd46da0` finds uEm007_00's `0xd45354`.

**Emulated** (`<scratchpad>/g18/emu13c_g.py`: emu13c.py plus the variant byte, part 7's level, the real .dtp array A at
`[[e+0x75f0]+0x64]`, and the rank chain `[0x1883c70] -> +0xa4 -> +0xf`. Controls first: Ukanlos L2 M3 `0x381ff` /
`0x1c01ff` / `0x1c0e3f`, Bloodbath L2 M22 (7,0x67) v4 `0x2381ff` / v0 `0x381ff`, L2 M15 (7,0xb4) `0x80381c0` — the
earlier specs' words):

| case | Garuga (v0) | Deadeye (v4) |
|---|---|---|
| L0 M7 (7,0xe5) calm | `0x1ff` | `0x380001ff` |
| L0 M7 (7,0xe3) / (7,0xe4) calm | — | `0x380001ff` / `0x380001ff` |
| L0 M7 (7,0xe2) / (7,0xe6) / (2,2) / (2,0xe5) | — | `0x1ff` each |
| L0 M7 (7,0xe5) severed + enraged / tired | — | `0x38000e3f` / `0x3800703f` |
| L1 M104 calm / v4 severed + enraged / tired | `0x70001ff` / — / `0x700703f` | `0x70001ff` / `0x7000e3f` |
| L2 M2 calm / enraged / tired | `0x1bf` / `0xc3f` / `0x603f` | `0x1bf` / `0xc3f` |
| L2 M12 intact, tail level 0 / 1 / 2 / 3 | `0x381ff` (level 3: `0x381ff`) | `0x381ff` / `0x381ff` / `0x1c01ff` / `0x1c01ff` |
| L2 M12 severed (level 0 / 2) | `0xe001ff` | `0xe001ff` / `0xe001ff` |
| L2 M12 level 1 / 2 at rank 5, level 1 at rank 3 | — | `0x381ff` / `0x1c01ff` / `0x381ff` |
| L2 M12 level 2 enraged / tired | — | `0x1c0e3f` / `0x1c703f` |
| L4 M65 intact / severed / v4 level 2 / v4 level 1 | `0x381ff` / `0xe001ff` | `0x1c01ff` / `0x381ff` (severed `0xe001ff`) |
| L4 M77 intact / severed / v4 level 2 / v4 level 0 | `0x381ff` / `0xe001ff` | `0x1c01ff` / `0x381ff` (severed lvl 3 `0xe001ff`) |
| L4 M76, L2 M11, L2 M13, L4 M64, L4 M66, L4 M78, L0 M6, L0 M8, L1 M103, L1 M105, L2 M1, L2 M3, L9 M10, L2 M6 | `0x1ff` | `0x1ff` |

And the transcription below against the emulator over every combination (11 motions x 8 actions x calm / enraged /
tired x severed x variant 0 / 4 x tail level 0..3 x rank 0 / 5): **8448 runs, 0 mismatches** (`jscheck.py`; node runs
the JS, unicorn the ROM).

**For psl-mask.js CLASS_MASK:**

    // YIAN GARUGA (em018_00) and DEADEYE YIAN GARUGA (em018_04), one class uEm018_00, vtable +0x13c = 0xdb0d10 (vtable
    // 0x17abb38; +0xf0 the base 0xca52c), READ whole (0xdb0d10..0xdb0e50) and emulated (dev/em018_00-effects-spec.md 1).
    // 0xca170 first, then by motion id; the variant byte e+0xb5f5 == 4 (Deadeye) is tested twice:
    //   * L2 M12 (0x20c), L4 M65 (0x441), L4 M77 (0x44d): vt+0x370(e, 1) = 0xa3bf4 (P+0x3b4 bit 0, the tail severed) ->
    //     bits 21-23; else Deadeye with part 7's break level 0x9d36c(e, 7) at or over the .dtp row 5 level (A[0x15] at
    //     rank <= 4, A[0x16] above; both 2) -> bits 18-20; else bits 15-17. u 560 / 570 / 580, u 380 / 390 / 400,
    //     u 381 / 391 / 401: intact / broken / cut (Garuga has no 570 / 390 / 391 record: his tail never breaks).
    //   * L0 M7 (0x007): Deadeye only, action (7, 0xe3..0xe5) -> bits 27-29 (u 290 b27, u 531 b28).
    //   * L1 M104 (0x168): bits 24-26 always (u 90 b24).   * L2 M2 (0x202): CLEARS bits 6, 9, 12 (bic 0x1240).
    const em018 = v4 => (motion, action, state) => {
      if (motion === 0x007)
        return v4 && action && action[0] === 7 && action[1] >= 0xe3 && action[1] <= 0xe5 ? 0x38000000 : 0;
      if (motion === 0x168) return 0x7000000;
      if (motion === 0x202) return { set: 0, clear: 0x1240 };
      if (motion === 0x20c || motion === 0x441 || motion === 0x44d)
        return state.severed ? 0xe00000 : (v4 && (state.breakLevel7 | 0) >= 2) ? 0x1c0000 : 0x38000;
      return 0;
    };
    const em018_00 = em018(false), em018_04 = em018(true);

Inputs, and how the viewer supplies each:

* **`state.severed`** — P+0x3b4 bit 0. The part pass (vt+0x210 `0xda634c`, states-em018_00.md §2) draws set 13 on the
  same `vt+0x370(e, 1)` test. monsters.json: **em018_00** groups[13] = part 30 on (20 / 120 off; set 12 draws 30 off);
  **em018_04** groups[13] = part 31 on (the only set drawing 31). So `SHELL_TAIL.em018_00 = { severed: 30 }`. R.
* **`state.breakLevel7`** — NEW to pslMask's state (the viewer lacks it there; playNow passes only `severed`). Deadeye's
  part pass draws **set 14** when not severed and `thr <= lvl(7)` with the same row 5 (states-em018_00.md §2), and
  em018_04 groups[14] = part 30 on (sets 12 / 13 draw it off). So **`SHELL_TAIL.em018_04 = { severed: 31, broken: 30,
  level: 2 }`** — `shellTailInput` already returns `breakLevel7` (= 2 while part 30 is drawn), and index.html playNow
  should pass it: `const tail = shellTailInput(...); severed = !!tail.tailSevered; breakLevel7 = tail.breakLevel7 | 0`
  -> `pslMask(..., { rage, tired, severed, breakLevel7, posture, charge, sunk })`. The rows MOTION_STATES em018_04
  already reach set 14 (garugaLine levels `[[12], [14], [13]]`, the break firing u 1036). No shell of his reads either
  (shells.js has no em018 entry), so the two SHELL_TAIL lines feed only the word. R.
* **`action`** — only Deadeye's L0 M7 reads it: a CLIP_ACTIONS entry (§3). Garuga's word reads no action.
* rank: not an input (both threshold bytes 2). rage / tired from the toggles as for every monster.

## 2. What the word changes — whole-block plan (Garuga 193 file-mask -> 219 whole; Deadeye 210 -> 236)

`add_effects.py em018_00` / `em018_04` (plan) and `<scratchpad>/planrows.py <mon> [--whole]`, classified against the
transcription (`classify.py`). Every binding not listed sits on bits 0-5 and stays always-on.

**Turned ON, always** (outside the file mask, both monsters, 15 each — records exported):

| binding | record |
|---|---|
| L0 M9 b0 / b1, L0 M10 b0 / b1, L0 M12 b0 / b1 | c 0 / c 1 (`cm202_001`) |
| L0 M117 b0 / b1 / b2, L0 M118 b0 / b1 / b2 | c 31 (`cm202_021`), c 0, c 1 |
| L2 M2 b0 f15 f75 / b1 f45 | c 2 / c 3 (`cm202_002`) |
| **L1 M104 b24** f65 | u 90 (`cm202_050`) — bits 24-26 on every play of L1 M104 |

**Turned ON, gated by the tail** (outside the file mask; the records are the survey's unexported ones):

| binding | Garuga | Deadeye |
|---|---|---|
| L2 M12 b15 f40 | u 560 (`cm202_030`) — tail on | u 560 (`em001_04_001`) — tail intact (level < 2) |
| L2 M12 b18 f40 | u 570: no record; never enabled | u 570 (`em001_04_001`) — tail broken (level >= 2), not cut |
| L2 M12 b21 f40 | u 580 (`cm202_030`) — tail cut | u 580 — tail cut |
| L4 M65 b15 / b18 / b21 f34 | u 380 (`em001_00_013`) on / u 390 no record / u 400 cut | u 380 / u 390 / u 400 (`em001_04_002`): intact / broken / cut |
| L4 M77 b15 / b18 / b21 f5 | u 381 on / u 391 no record / u 401 cut | u 381 / u 391 / u 401 (`em001_04_002`): intact / broken / cut |

So each of the three motions fires exactly one of its three tail records per play (I: that these are the same attack's
tail-intact / broken / cut forms — the data names three per motion and the word picks one; the visuals are Raven's).

**Turned ON, gated by the action** (Deadeye only):

| binding | record | game |
|---|---|---|
| L0 M7 b27 f5-90 | u 290 (`cm202_005`) | Deadeye, action (7, 0xe3..0xe5) |
| L0 M7 b28 f19 | u 531 (`em027_00_021`) | the same |

**Named but never enabled** (outside the file mask, Garuga): **L0 M7 b27 u 290** (`em018_00u` HAS the record,
`cm202_005`: the arm is variant-4 only — do NOT export it for Garuga; emulated v0 L0 M7 (7, 0xe5) `0x1ff`); L0 M7 b28
u 531, L2 M12 b18 u 570, L4 M65 b18 u 390, L4 M77 b18 u 391 have no Garuga record anyway. Deadeye: none.

**Turned OFF — never enabled** (in the file mask, fired by the viewer today), both monsters:

| binding | record | why |
|---|---|---|
| **L2 M2 b6** f27 f49 f85 | u 200 (`em001_00_009`) | `bic 0x1240` at `0xdb0d4c` clears bit 6 on every L2 M2 start |
| **L2 M2 b9** f27 f49 f85 | u 200 | clears bit 9 |
| **L2 M2 b12** f27 f49 f85 | u 220 (`em001_00_004`) | clears bit 12 |
| L4 M7 b16, L4 M9 b16 | u 280 | no arm on L4 M7 / M9 sets 16; no record in any array (already left out) |

Control: emulated L2 M2 calm / enraged / tired `0x1bf` / `0xc3f` / `0x603f` — none of 6 / 9 / 12. Today the viewer
fires u 200 twice and u 220 at each of the three frames on every L2 M2 play; the game fires none.

**Gated by state** (in the file mask; the viewer fires them in every state today) — **48 each**, all by the base's
state groups, none by the class: L4 M29 b6 / b7 calm, b9 / b10 enraged, b12 / b13 tired-calm (u 350, u 201, u 221 — u 221
has no record); L4 M51, M52, M67, M68, M70, M71 each b6 / b7 / b8 calm (u 201 / 202 / 212), b9 / b10 / b11 enraged (the
same three), b12 tired-calm (u 220). So each of those clips fires one form per state instead of all three.

Counts: Garuga — ON 15 always + 6 by the tail; 5 named-never (1 with a record, u 290); OFF 3 (L2 M2) + 2 recordless;
48 state-gated. Deadeye — ON 15 always + 9 by the tail + 2 by the action; OFF the same 3 + 2; 48 state-gated. 26 out-of-
mask each, as the survey counted.

Records to export with the `--apply`: **Garuga u 380, 381, 400, 401, 560, 580** (6; not u 290). **Deadeye all eleven**:
u 290, 380, 381, 390, 391, 400, 401, 531, 560, 570, 580.

## 3. Which actions play the keyed clips — CLIP_ACTIONS

Only Deadeye's **L0 M7** needs an entry (the one action-keyed arm). The other arm motions read no action; their plays are
listed for the record. Sources: the status-7 dispatcher **`0xdaf774`** (table `0xdaf7a8`, 256 offsets from the table;
`s7tab.py`), every setMotion site in the band with its r1 immediate (`motsites.py`: 128 sites, every one an immediate),
each site's function traced up to the dispatcher (`who.py`), and the action main under unicorn
(efx/agents/garuga-scratch/bactprobe.py, statuses 0-3 and 7, variants 0 and 4: the first motion each action sets).

* **L0 M7** (0x007):
  * (2, 0x02), (2, 0x13): status 2 (`0xda84fc` -> `0xda7eb4`, site `0xda8054`, frame 0) — base word, both variants.
  * **(7, 0xe5)**: `0xdb1308` phase 0, site `0xdb1370`: `0xbc7f4(e, 0)`, setMotion0 L0 M7 blend 4 **start 18**; then
    L2 M6 / L2 M7. Deadeye: bits 27-29.
  * **(7, 0xe3)**: `0xdb158c` phase 0 L9 M10 (`0xdb15f8`); phase 1 at its end, setMotion L0 M7 flags 0x40 **start 18**
    (`0xdb1788`); phase 2: with ctl+0x25 == 0 it waits the motion's end and follows **(7, 0xe5)** (`0xdb1938..0xdb1960`),
    else L2 M6 -> L2 M7. Deadeye: bits 27-29.
  * (7, 0xe4): `0xdb103c` plays L9 M9 (`0xdb108c`) and follows (7, 0xe3) (`0xdb11a4`); it sets no L0 M7 itself (no site in
    its function). The EMC issues it: `em018_00_cmdtbl.emc` (shared by Deadeye, states-em018_00.md §7) g1 s71 `00 07 e4`
    twice, behind `6e 01 47` (op 0x6e query 0x47: **NR**, so whether only Deadeye takes this stream is not read here).
* L2 M12 (0x20c): (7, 0x02 / 0x03 / 0x0c / 0x19 / 0xcb / 0xf5 / 0xf7) -> `0xdac0dc` (sites `0xdac184`, `0xdac1e0`).
* L4 M65 (0x441): (7, 0x26 / 0xfa) -> `0xdadafc` (site `0xdadb78`, start 12); (7, 0x2e) -> `0xdae9b4` (`0xdaea1c`).
* L4 M77 (0x44d): (7, 0x0b / 0x0e / 0x1a / 0x1b / 0xf4 / 0xf6 / 0xf8 / 0xf9) -> `0xdaca4c` phase 1 after L4 M76, with the
  airborne posture (`0xbf4d4` / `0xbc984`) (site `0xdacb4c`); (7, 0x29) -> `0xdae124` (site `0xdae280`).
* L1 M104 (0x168): (3, 0x0c) (`0xdab958` -> `0xda92f0`, site `0xda9380`); (7, 0x27 / 0xfb) -> `0xdadefc` (`0xdadf54`);
  (7, 0x2c) -> `0xdae78c` (`0xdae7e4`).
* L2 M2 (0x202): (2, 0x04 / 0x08 / 0x09 / 0x0a / 0x0b / 0x0d / 0x0e) (status 2, sites `0xda8240`, `0xda8464`); (7, 0x04)
  -> `0xdac27c` (`0xdac2e0`).

(Phase-0 plays are emulated; the later-phase sites are read and placed in their function, the phases not run.
Status-10 / 11 scripts were not walked: no arm keyed on them.)

    em018_04: {
      // L0 M7: the status-2 plays (2, 0x02) / (2, 0x13) give the base word; (7, 0xe3) and (7, 0xe5) -- the (7, 0xe4) chain
      // -- give bits 27-29 (u 290, u 531). Both ROM plays begin at frame 18; the viewer plays the clip from 0.
      '0|Motion[7]': [{ action: [2, 0x02] }, { action: [7, 0xe3] }, { action: [7, 0xe5] }],
    },

None for em018_00.

## 4. What to implement, in order

1. psl-mask.js: `em018` / `em018_00` / `em018_04` as §1 into CLASS_MASK; `'em018_00', 'em018_04'` into
   `PSL_MASK_MONSTERS`; CLIP_ACTIONS `em018_04 '0|Motion[7]'` as §3.
2. motion-states.js SHELL_TAIL: `em018_00: { severed: 30 }`, `em018_04: { severed: 31, broken: 30, level: 2 }`.
3. index.html playNow: take `breakLevel7` from the same `shellTailInput(...)` call as `severed` and pass it in pslMask's
   state (the one new viewer input; every other monster's word ignores it).
4. `add_effects.py em018_00 --apply`, then `em018_04 --apply` (regenerates CLIP_EFFECTS from the whole blocks; exports
   Garuga's 6 and Deadeye's 11 records of §2), `--states` if the MOTION_STATES rows need it, `--record`, `--check`.
   L2 M2 b6 / b9 / b12 stay in CLIP_EFFECTS; the runtime word clears them. Recorder slot — announce (efx: one recorder
   and one lift at a time).
5. Soak with `--viewer-inputs`; Raven verifies: L2 M12 / L4 M65 / L4 M77 fire one tail form each (intact, Deadeye
   broken, cut); L2 M2 shows no u 200 / u 220; Deadeye's L0 M7 shows u 290 / u 531 on its (7, 0xe3) / (7, 0xe5) entries
   only; L4 M51..M71 one fireball form per state.

NOT READ, by name: op 0x6e query 0x47 (the gate on (7, 0xe4)'s stream, g1 s71); the status-10 / 11 scripts' plays of the
arm motions (none keyed on an action); what u 290 / u 531 look like and whether the walker fires u 290's f5-90 run when
the motion starts at frame 18 (the viewer plays from 0, as Bloodbath's L2 M15).

## 5. Implemented (Viewer agent, 2026-10-15)

psl-mask.js em018 / em018_00 / em018_04 + CLIP_ACTIONS em018_04; motion-states.js SHELL_TAIL em018_00 / em018_04;
index.html playNow passes `breakLevel7` (and Gypceros's `crestBroken`). `--apply` exported Garuga 7 (u 290 380 381 400
401 560 580) and Deadeye 11. **Garuga's u 290 went in although §2 says it should not**: add_effects binds every bit the
WHOLE block names and leaves the gating to the runtime word, so L0 M7 b27 is in his CLIP_EFFECTS and his word (no v4)
never enables it -- exported, never fired. Left as the tool's rule rather than special-cased.
