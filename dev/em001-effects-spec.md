# Rathian (em001_00), Gold Rathian (em001_02), Dreadqueen Rathian (em001_04) -- effects spec: the PSL enable word

Research agent for the Viewer agent, 2026-10-16 (dev/flying-wyverns-effects-survey.md "Rathian", "Gold Rathian", "Dreadqueen
Rathian" and "What closing each needs" item 1). Static ROM reading plus unicorn runs; no recorder, no lift, no `--apply`, no
docs/ edit. `R` = READ (the consuming instruction read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: the survey (57 / 65 / 70 bindings outside the file mask; unexported records per monster; no undriven
non-deliberate record on any of the three), rom-map.md ("THE PSL ENABLE MASK", "The PSL enable word per class": uEm001_00
`0x1793c28` / `0xd09054` "R (slot) / override UNREAD"; the `0x81614`, `0x6fe88`, `0x9d36c`, `0x3a8430`, `0xa3bf4` rows; no row
for `0x49930`), docs/render/psl-mask.js whole, dev/em043_00-effects-spec.md (the format), C:\MHGU-RE\offline\decode\notes
breaks-em001.md §5 ("Attack hit groups: vtable +0x13c 0xd09054 ... 0x38000 while the tail is on and 0xe00000 once severed
... Not visual" -- the first arm, under the withdrawn "hit groups" name), states-em001.md §1 (the class, the em byte
`e+0xb5f4`, the variant byte `e+0xb5f5`, the enemy-id halfword `e+0xb5f0`: 1 Rathian, 0x201 Gold, 0x401 Dreadqueen, 2 / 0x202
/ 0x402 the Rathalos line; §2 eating (1, 4) / (1, 7)), states-em037_04.md §5 and states-em002_04.md §2.1 / §6 (`0x49930` is a
thunk to the quest getter `0x3a8470`), shells.js (`input.questLevel`: "the quest id mod 100 for an ordinary quest, 0x3b8eb4; 0
or 0x10 for others"), index.html (`SHELL_QUEST_LEVEL = 10`, `SHELL_QUEST_RANK = 5`, `tired = !rage && ...`), motion-states.js
SHELL_TAIL (em001_00 / 02 `{severed: 8}`, em001_04 `{severed: 8, broken: 12, level: 2}`), the task board (grep: Rathian's L2 M5
fireball bits named as "the next known case", no read of this method). Scratch: `<archive>/rath1/` (emu13c_rath.py,
em001.js, jscheck_rath.py, classify.py, planrows / recs outputs).

## 1. The word -- uEm001_00 vt+0x13c = `0xd09054` -- R, emulated

Vtable **`0x1793c28`** (checked: `+0xf0` = base `0xca52c`, `+0x370` = `0xa3bf4`, `+0x13c` = `0xd09054`). One class for the
whole Rath line, Rathalos included. **Extent `0xd09054..0xd09420`**: one `push {r4-r8, sb, fp, lr}`, one exit `pop` at
`0xd09420` (every arm branches there), literals `0xd09424` / `0xd09428` (both -> GOT `0x1831c54`), next function's `push` at
`0xd0942c`. The PIC jump table `0xd09090..0xd0917f` (60 offsets from `0xd09090`, bounded by `cmp r0,#0x3b`) is inside.

    0xd09060  bl 0xca170                                  ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    motion <= 0x405 (0xd0906c -> 0xd091f0):
      0xd091f0  L0 M16 / L0 M17 (motion - 0x10 < 2): status 1 (e+0x73e0), number e+0x73e1 in {7, 8} -> |= 0xc0000 (bits 18-19)
      0xd091fc  L2 M3 / L2 M4 (motion - 0x203 < 2) -> TAIL ARM A (below)
      0xd0938c  L2 M1 (0x201): enemy id halfword e+0xb5f0 in {0x201, 0x202} (`sub / cmp #2 / blo`) or == 0x401, and NOT 0x81614
                (tired) -> |= 0x7000000 (bits 24-26)
      every other motion <= 0x405: the base alone
    motion 0x406..0x441 (table 0xd09090 on motion - 0x406):
      L4 M6 / M50 / M52 / M55 / M65 -> 0xd09288 (TAIL ARM B)
      L4 M32 (0x420) -> 0xd09180: em byte e+0xb5f4 == 2 (RATHALOS LINE ONLY), not tired, status 7, number in {3, 0x29, 0x2b,
                0x2c, 0x48, 0x49} (`sub #0x2b / cmp #0x1e / tst 0x60000003`, then `cmp #0x29 / cmpne #3`) -> |= 0x38000000
      L4 M38 (0x426) -> 0xd093d8: 0x6fe88(e, 7, 0xf5) -> word = (word & 0x3fffe03f) | 0xc0000000 (bits 6-12 CLEARED, 30-31 set)
      the other 53 entries -> 0xd09420 (return)
    motion > 0x441 (0xd09274): L9 M2 (0x902) / L9 M6 (0x906) -> 0xd09288 (TAIL ARM B); anything else returns
    TAIL ARM B (0xd09288): em byte e+0xb5f4 == 1 (RATHIAN LINE ONLY) else return; vt+0x370(e, 1) (0xa3bf4, P+0x3b4 bit 0: severed)
      severed: |= 0xe00000 (bits 21-23), str (0xd092c8); motion == 0x441 (L4 M65) -> also bfc bit 1 (0xd092d0), str
      intact: -> 0xd0930c, the same form test as arm A from its variant read
    TAIL ARM A (0xd0920c): severed -> 0xe00000 (bits 21-23); else 0x38000 (bits 15-17) unless the variant byte e+0xb5f5 == 4:
      lvl = 0x9d36c(e, 7) (part 7's break level, P+0x3bc + 12*7); A = [[e+0x75f0]+0x64] (the .dtp array); th = A[0x11] if
      0x3a8430(quest) <= 4 else A[0x12] (`movle`); lvl >= th -> 0x1c0000 (bits 18-20); else (variant re-read, 4)
      0x49930(e) <= 5 (`cmp #5 / movls`, UNSIGNED) -> 0x1c0000; else 0x38000. OR'd at 0xd09410..0xd0941c.

Callees, every one followed: `0xca170` (base, R), `0xa3bf4` (vt+0x370, R), `0x81614` (`P+0x505 & 0xfe == 2`, R),
`0x6fe88` (`e+0x73e0 == r1 && e+0x73e1 == r2`, R), `0x9d36c` (`[P+0x3bc + part*12]`, R), `0x3a8430` (the rank byte, 5 / 3 / 1 /
0, R), **`0x49930`** (R, read here whole `0x49930..0x49944`: `[[GOT 0x1831c54]]` -> `bl 0x3a8470`; `0x3a8470` read
`0x3a8470..0x3a84d4`: `0x3b519c(g, [quest+0xe0]) == 1` -> `0x3b8eb4` (sxtb; its body NR -- shells.js reads it as "the quest
id mod 100"); else quest id - 0xf906f in 0..14 -> 0x10, except index 5 -> 0; else 0). The .dtp array A for em001_04 (bytes from
file +0x4d, the Garuga harness's mapping) = `06020201 01010102 02010102 00010103 07020200`: **A[0x11] = 2, A[0x12] = 2** (row 4:
part 7, level 2 both ranks -- shells.js `D.poison.levels [2, 2]` agrees). em001_00 / em001_02 have 4 rows (A[0x11] past the
end) and never reach the read (variant != 4).

**Variant / em inputs (R):** the em byte `e+0xb5f4` (tail arm B: em 1 only; L4 M32: em 2 only); the enemy-id halfword
`e+0xb5f0` (L2 M1: Gold 0x201, Silver Rathalos 0x202, Dreadqueen 0x401 -- NOT Rathian 1, Rathalos 2 or Dreadking 0x402; the
id values are states-em001.md §1's, not re-read); the variant byte `e+0xb5f5` (tail forms: == 4, Dreadqueen AND Dreadking).

**Negative with control:** the class band `0xcecd20..0xd0f400` (class code + its shells) has exactly six `#0x13f4`
immediates, `0xd091e0` / `0xd092b4` / `0xd092fc` / `0xd093c8` / `0xd093f0` / `0xd09410`, all in the method (writes through
`ldr r0,[r4,r0]!`, `str r0,[r4]` -- trap 58's shape); the same scan (`bw1/immscan.py`) over `0xe72738..0xe83434` finds
Deviljho's two (`0xe81018`, `0xe8108c`).

**Emulated** (`<archive>/rath1/emu13c_rath.py`: bw1/emu13c_bw.py plus the em byte, the id halfword, the em001_04 .dtp,
and `0x49930` answered by a hook with the quest number -- it is answered, not run). **Controls first:** Deviljho L2 M10 calm
`0x381ff`, severed + enraged `0xe3f`; Garuga L2 M2 `0x1bf` -- reproduced. Then:

| case | word |
|---|---|
| L2 M3 Rathian intact / severed | `0x381ff` / `0xe001ff` |
| L2 M3 Dreadqueen quest 0 (lvl 0) / quest 10 lvl 0 / quest 10 lvl 2 | `0x1c01ff` / `0x381ff` / `0x1c01ff` |
| L2 M1 Gold / Dreadqueen / Rathian / Gold tired | `0x70001ff` / `0x70001ff` / `0x1ff` / `0x703f` |
| L0 M16 (1, 7); L0 M17 (1, 8); L0 M16 (1, 9) | `0xc01ff`; `0xc01ff`; `0x1ff` |
| L4 M38 (7, 0xf5) calm / enraged | `0xc000003f` / `0xc000003f` |
| L4 M65 severed / intact; L9 M2 em 1 / em 2 | `0xe001fd` / `0x381ff`; `0x381ff` / `0x1ff` |
| L4 M32 (7, 0x29) em 2 / em 1 | `0x380001ff` / `0x1ff` |

The transcription below against the ROM (`jscheck_rath.py`: node runs `em001.js`, unicorn the ROM): 30 motions (every arm
plus neighbours) x 12 actions x sever x calm / enraged / tired / enraged+tired x {Rathian, Gold: part-7 level 0 / 2 x quest
0 / 10} and {Dreadqueen: level 0..3 x quest 0 / 5 / 6 / 10 / -1 x rank 0 / 3 / 5} = **195840 runs, 0 mismatches**. The
comparator is not blind to the em byte (L9 M2 at em 2 gives `0x1ff`).

**For psl-mask.js CLASS_MASK** (the Rathian line only; the em-2 arm L4 M32 is listed for the Rathalos read, not transcribed
here -- one monster's transcription is that monster's):

    // RATHIAN (em001_00), GOLD RATHIAN (em001_02), DREADQUEEN (em001_04), one class uEm001_00 (vtable 0x1793c28; +0xf0 the base
    // 0xca52c), vtable +0x13c = 0xd09054, READ whole (0xd09054..0xd09420, jump table 0xd09090, 60 offsets) and emulated --
    // 195840 runs against the ROM, 0 mismatches (dev/em001-effects-spec.md 1). 0xca170 first, then by motion id:
    //   * L2 M3 / L2 M4 and (em byte 1 only: the Rathian line) L4 M6 / M50 / M52 / M55 / M65, L9 M2 / M6 -- the tail's form:
    //     vt+0x370(e, 1) = 0xa3bf4 (P+0x3b4 bit 0, severed) -> bits 21-23 (and L4 M65 clears bit 1: u 350 off); else bits 15-17,
    //     or on variant 4 (Dreadqueen) bits 18-20 when part 7's break level 0x9d36c(e, 7) reaches the .dtp row-4 level
    //     (A[0x11] at rank <= 4, A[0x12] above: 2 / 2) OR the quest's number 0x49930 is <= 5 (unsigned);
    //   * L2 M1: enemy id 0x201 / 0x202 / 0x401 (Gold, Dreadqueen; not Rathian) and not tired (0x81614) -> bits 24-26;
    //   * L0 M16 / L0 M17: action (1, 7) / (1, 8) -> bits 18-19 (c 60 / c 61: no record -- nothing on screen);
    //   * L4 M38: action (7, 0xf5) -> bits 6-12 CLEARED, 30-31 set (no viewer clip on any of the three);
    //   * (L4 M32: em byte 2 only -- the Rathalos line's arm, not here.)  Every other motion: the base alone.
    // state: severed / breakLevel7 (motion-states.js shellTailInput), rank (SHELL_QUEST_RANK), questLevel (SHELL_QUEST_LEVEL).
    const EM001_TAIL = new Set([0x406, 0x432, 0x434, 0x437, 0x441, 0x902, 0x906]);
    const em001 = (variant, id, thr) => (motion, action, state) => {
      const n = action && action[0] === 1 ? action[1] : -1;
      const tail = () => {
        if (state.severed) return 0xe00000;
        if (variant !== 4) return 0x38000;
        if ((state.breakLevel7 | 0) >= ((state.rank | 0) <= 4 ? thr[0] : thr[1])) return 0x1c0000;
        return ((state.questLevel | 0) >>> 0) <= 5 ? 0x1c0000 : 0x38000;
      };
      if (motion === 0x010 || motion === 0x011) return n === 7 || n === 8 ? 0xc0000 : 0;
      if (motion === 0x203 || motion === 0x204) return tail();
      if (motion === 0x201) return (id === 0x201 || id === 0x202 || id === 0x401) && !state.tired ? 0x7000000 : 0;
      if (EM001_TAIL.has(motion)) return motion === 0x441 && state.severed ? { set: 0xe00000, clear: 0x2 } : tail();
      if (motion === 0x426) return action && action[0] === 7 && action[1] === 0xf5 ? { set: 0xc0000000, clear: 0x1fc0 } : 0;
      return 0;
    };
    const em001_00 = em001(0, 0x001, [2, 2]), em001_02 = em001(2, 0x201, [2, 2]), em001_04 = em001(4, 0x401, [2, 2]);
    // CLASS_MASK: em001_00, em001_02, em001_04 ; PSL_MASK_MONSTERS: 'em001_00', 'em001_02', 'em001_04'

(`thr` is only read on variant 4; the em001_00 / 02 value is a placeholder their path never reaches. pslMask applies
`{set, clear}` as OR-then-clear, which equals the ROM's AND-then-OR here: the base never sets 30-31, and bit 1 is cleared
after the OR in both.)

Inputs, and how the viewer supplies each:

* **`state.severed`** -- P+0x3b4 bit 0, from the parts shown: SHELL_TAIL em001_00 / 02 / 04 `severed: 8` already exists (R,
  motion-states.js; the shells read the same). Already passed by playNow.
* **`state.breakLevel7`** -- Dreadqueen only: SHELL_TAIL em001_04 `{broken: 12, level: 2}` already gives 2 while part 12 is
  drawn, else 0 (R, the existing mapping; the shells' poison reads the same field). Already passed.
* **`state.rank`** -- `0x3a8430`, already passed as SHELL_QUEST_RANK (5 -> A[0x12]); both thresholds are 2, so it changes
  nothing for Dreadqueen.
* **`state.questLevel` -- NEW KEY in the pslMask state.** `0x49930`, the quest's number. index.html already holds
  `SHELL_QUEST_LEVEL = 10` for Dreadqueen's shells; pass it: `questLevel: SHELL_QUEST_LEVEL`. With 10 (> 5) her tail form
  follows the break (intact 15-17, broken 18-20, severed 21-23). **At a quest number <= 5 (and outside a numbered quest,
  where `0x3a8470` returns 0) the unsevered form is ALWAYS 18-20** -- the "broken" effects fire on an unbroken tail. The
  transcription reads `undefined` as 0 (the ROM's value outside a numbered quest), so leaving the key out shows the low-quest
  form: pass it.
* **`action`** -- read only on L0 M16 / M17 (records do not exist) and L4 M38 (no clip). **No CLIP_ACTIONS rows are needed**
  for these three (§3).
* `state.tired` -- L2 M1. index.html makes `tired` false while enraged; the ROM's `0x81614` ignores rage, so an enraged AND
  tired Gold / Dreadqueen gets no bits 24-26 -- a state the viewer does not show. Named, not a gap.
* No posture, sunk, mud, heat, charge, carry, crest or arm input.

## 2. What the word changes -- whole-block plan

`<archive>/rath1/planrows.py <mon> [--whole]` (add_effects.plan, the monster forced into psl_mask_monsters) and
`classify.py <mon>` (each whole-plan binding evaluated against §1 over calm / enraged / tired x tail intact / broken /
severed x actions null / (1, 7) / (7, 0xf5); quest 10, rank 5). `*` = outside the file mask. Bits 0-5 inside the file mask
stay always on and are not listed.

### 2.1 Rathian (em001_00) -- 145 file-mask -> 202 whole; 57 out of the mask (the survey's 57)

| enabled | bindings | records |
|---|---|---|
| always (out, bits 0-5) -- 2 | *L2 M5 b0 f0-71; *L2 M9 b0 f80-90 | u 200 (`em001_00_009`); u 260 (`cm202_005`) |
| calm (bits 6-8) -- 17 out, 3 in | *L2 M5 / M15 / M16 / M17 / M18 / L4 M8 / M53 / M54 b6, b7; *L4 M8 b8; L4 M16 b6 / b7 / b8 | **u 201** / **u 202**; c 30; u 230 / 231 / 232 |
| enraged (bits 9-11) -- 17 out, 3 in | the same motions b9, b10; *L4 M8 b11; L4 M16 b9 / b10 / b11 | **u 201** / **u 202**; c 30; u 230 / 231 / 232 |
| tired and calm (bit 12) -- 9 out | *L2 M5 / M15 / M16 / M17 / M18 / L4 M8 / M16 / M53 / M54 b12 | **u 221** |
| tail on -- 3 out, 2 in | *L2 M3 b15 f33; *L2 M4 b15 f33; *L4 M55 b15 f70; L4 M6 b15 f8; L4 M65 b1 f118 | **u 502** (`cm202_030`), **u 503** (`cm202_031`), u 530 (`em044_00_000`) x2, u 350 (`cm202_020`) |
| tail severed -- 1 out, 2 in | *L2 M3 b21 f33; L2 M4 b21 f33; L4 M6 b21 f8 | **u 510** (`cm202_030`), u 511, u 540 |
| (1, 7) / (1, 8) -- 3 out | *L0 M16 b18 / b19, *L0 M17 b18 | c 60 / c 61 -- no record in any array |
| never -- 5 out, 1 in | *L2 M1 b24 / b25 (Rathian's id), *L2 M3 / M4 b18, *L4 M55 b18, L4 M6 b18 | u 290 / 291 / 522 / 523 / 550 -- none has a record on Rathian |

So L2 M5 (the fireball, file mask 0): u 200 always, u 201 at f74 (b6 calm / b9 enraged) or u 221 tired, u 202 f87-189 calm /
enraged only -- rom-map "THE PSL ENABLE MASK" had this; now R through the class. Gated today: L4 M16 u 230-232 fire in every
state (tired: only u 221); L4 M6 u 530 and u 540 both fire on every play (one by the tail); L2 M4 u 511 fires intact too
(severed only); L4 M65 u 350 off once severed.

**Records to export (`--apply`): u 201, u 202, u 221, u 502, u 503, u 510.**

### 2.2 Gold Rathian (em001_02) -- 166 -> 231; 65 out (the survey's 65)

As Rathian, plus:

| enabled | bindings | records |
|---|---|---|
| calm / enraged (6-8 / 9-11) | *L4 M18 b6 / b7 / b8, b9 / b10 / b11 (3 out each) | u 230 / 231 / 232 (exported) |
| **not tired** (24-26, id 0x201) -- 2 out | *L2 M1 b24 f0-69, b25 f83-176 | **u 290** (`em001_02_005`), **u 291** (`em001_02_000`) |
| tail on -- in | L4 M50 b15, L4 M52 b15 (f6) | u 531 / u 532 |
| tail severed -- 2 out | *L4 M50 b21, *L4 M52 b21 (f6) | **u 541** (`cm202_031`), **u 542** (`cm202_030`) |
| never | *L2 M3 / M4 b18 (variant 2: the 18-20 form is variant 4's); L4 M50 / M52 / M6 b18, *L4 M55 b18 | **u 522 / u 523 HAVE records (`cm202_030` / `_031`) and are never enabled on Gold**; u 550 / 551 / 552 no record |
| dead site | L4 M38 b6-12, b30-31 | the LMT slot is null (board 2026-09-29); u 221 lives elsewhere |

**Records to export: u 201, u 202, u 221, u 290, u 291, u 502, u 503, u 510, u 541, u 542.** `--apply` will also export
**u 522 / u 523** (the whole block names them): they will be wired and never fire on Gold -- correct, not a gap.

### 2.3 Dreadqueen (em001_04) -- 170 -> 240; 70 out (the survey's 70)

As Rathian for the base groups (L4 M18 is in her file mask: b6 / b7 calm, b9 / b10 enraged), L2 M1 as Gold, and the tail
forms in three (quest 10: by the break; quest <= 5: "broken" whenever not severed):

| enabled | bindings | records |
|---|---|---|
| always (out, bits 0-5) -- 7 | *L2 M5 b0, *L2 M9 b0, *L9 M1 b0 f57, *L9 M6 b0, *L9 M8 b1 f0-60, *L9 M9 b1 f51-120, *L9 M21 b0 f75 | u 200, u 260, c 2, c 4, u 630, **u 631** (`em001_04_005`), c 6 |
| not tired -- 2 out | *L2 M1 b24 / b25 | **u 290 / u 291** |
| tail intact form (15-17) -- 5 out, 6 in | *L2 M3 b15, *L2 M4 b15, *L4 M55 b15, *L9 M2 b15 f64 / b16 f113; L4 M6 / M50 / M52 b15, L9 M6 b15 / b16 / b17 | **u 502, u 503**, u 530, **u 500, u 501**; u 530 / 531 / 532, u 504 / 505 / 580 |
| tail broken form (18-20) -- 5 out, 6 in | *L2 M3 b18, *L2 M4 b18, *L4 M55 b18, *L9 M2 b18 / b19; L4 M6 / M50 / M52 b18, L9 M6 b18 / b19 / b20 | **u 522, u 523**, u 550, **u 520, u 521**; u 550 / 551 / 552, u 524 / 525 / 600 |
| tail severed (21-23) -- 5 out, 4 in | *L2 M3 b21, *L4 M50 b21, *L4 M52 b21, *L9 M2 b21 / b22; L2 M4 b21, L4 M6 b21, L9 M6 b21 | **u 510, u 541, u 542**, u 510 / u 511; u 511, u 540, u 514 |
| tail on (b1, any form) | L4 M65 b1 | u 350 |

(17 calm + 17 enraged + 9 tired-calm + 3 (1, 7) out, as Rathian.) All her records are `em001_04_001` except u 530 / 550
(`em001_04_002`), u 580 / 600 (`_003`), u 631 (`_005`).

**Records to export: u 201, u 202, u 221, u 290, u 291, u 500, u 501, u 502, u 503, u 510, u 520, u 521, u 522, u 523, u 541,
u 542, u 631** (each enabled in some state the viewer shows).

## 3. CLIP_ACTIONS -- none needed (R)

The word reads an action on two motions only. L0 M16 / L0 M17 under (1, 7) / (1, 8) -- eating without the stamina call
(states-em001.md §2, theirs: (1, 7) -> `0xcf2f80(e, 1)` L0 M16 x3 -> (1, 8) L0 M17) -- enable bits 18-19, which name c 60 / c
61 with no record in any array: nothing to show. L4 M38 under (7, 0xf5): none of the three has an L4 M38 clip (Gold's slot is
null; Rathian / Dreadqueen have none). Every other arm reads the tail, the break, the quest number, the id or tiredness. So
`clipActionFor` returns null for every clip of these three, which is the right word everywhere.

## 4. Other gaps the survey lists for these three

* Undriven non-deliberate: **none** on any of the three (R, `efx/effects_status.py`'s classifier re-run 2026-10-16: the
  non-firing records are exactly c 1100 / 1108 (SharedStates), c 1106, blast c 1130..1137, notice c 1200 / 1201, c 1500,
  and on Rathian / Gold hyper u 1301..1304 / 1311..1314 -- all deliberate per the survey). Rage puff (RAGE_PUFF with
  rathianPuffPick, joint 4), drool (c 1104), cut tail (em001_00_option), sever turn rows: present (motion-states.js).
* Not exported and not the word's (the triage's "unread" 3 each), **NR here**, states-em001.md / shells-em001.md's reading:
  u 35 (`em001_00_008`) and c 20 (`em001_00_004`) on all three, u 60 (`em001_02_006`) on Rathian -- "no shell param names
  them, the class requests nothing" (states-em001.md, after line 332); **Dreadqueen u 36** (`em001_02_008`): on Rathian / Gold
  it is shell01 mode 8's EffectParam 3 (the hunter hit, shells-em001.md table at line 480) and exported `when: 'shell'`;
  whether Dreadqueen's shell data carries it is NR.

## 5. What to implement, in order

1. psl-mask.js: `EM001_TAIL` / `em001` as §1 into CLASS_MASK for **em001_00 / em001_02 / em001_04**; the three ids into
   PSL_MASK_MONSTERS. No CLIP_ACTIONS.
2. index.html playNow: add **`questLevel: SHELL_QUEST_LEVEL`** to the pslMask state object (Dreadqueen's tail form; the others
   ignore it). Nothing else new: severed / breakLevel7 / rank are passed today.
3. `add_effects.py em001_00 --apply`, `em001_02 --apply`, `em001_04 --apply` (CLIP_EFFECTS from the whole blocks; exports as
   §2), then `--record` / `--check`. Recorder slot -- announce.
4. Soak with `--viewer-inputs`; Raven verifies: the fireball's u 201 / u 202 calm and enraged, u 221 tired (no u 202); the
   tail attacks' u 502 / 503 intact, u 510 / 511 (and 540 / 541 / 542) after the sever, u 350 gone on L4 M65; Gold /
   Dreadqueen's u 290 / 291 on L2 M1 unless tired; Dreadqueen's three forms on L2 M3 / M4, L4 M50 / M52 / M55 / M6, L9 M2 /
   M6 by tail state (with the quest-10 stand-in); u 631 on L9 M9 every play.

NOT READ, by name: `0x3b8eb4` and `0x3b519c` (what the quest number is -- shells.js's "mod 100" reading stands); whether
`e+0xb5f0` holds exactly the ids states-em001.md lists (the arm reads it; the values are that note's); what c 60 / 61 / u 290 /
291 / 522 / 523 / 550 would be on Rathian (no records); the em-2 arm L4 M32 and Dreadking's thresholds (the Rathalos read);
who issues (7, 0xf5); what any record looks like.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **`e+0xb5f0` -- READ.** The spawn's id setter `0x6fa58` stores the id word whole (`0x6fa78`) and derives the em byte (bits 0-7)
  and the variant byte (bits 8-11) from it; the id table `0x1594ca4` holds, for em byte 1, only 1 / 0x201 / 0x401 (and 0x1001, bit
  12: another descriptor, I a small monster). So the halfword the L2 M1 arm reads is exactly states-em001.md's ids: no viewer change.
* **Who issues (7, 0xf5) -- READ before this sweep** (rom-map rows `0xcf15c8` sel 0xe and the em002_02 Withdrawn row): em001_00_cmdtbl
  g1 s224 / s235 in op 0x6f(0xe)'s default, `[ctl+0x2c] >= 0.0` -> 1; the table is shared by all six Rath-line monsters. The line
  above ("who issues (7, 0xf5)") is answered there.
* Still open, category a: the quest number (`0x3b8eb4` / `0x3b519c`). Category c: an enraged-and-tired start (a Tired toggle).
* **Tired (with Rage) -- BUILT 2026-10-19** (CLASS_TOGGLES `tiredRage`, working label): with Enraged on, the play reads tired
  (0x81614 is P+0x505 alone; the stamina machine 0xbd1a4 sets it with no rage test), so L2 M1 / L4 M32 lose bits 24-26 as the ROM
  does. Checked on Rathalos L2 M3 (class-toggles.mjs).
  [**Moved to the Debug panel 2026-10-27** -- Raven: "Make Tired (with Rage) a Debug option for now, until I know what it entails". Behaviour, effects and ROM note unchanged; motion-states.js `debug: true` paints it in #monDebugToggles, and resetHiddenDebug (DEBUG_TOGGLES) turns it off while the panel is hidden. Checked: `<archive>/laneB3/tiredrage-debug.mjs` -- on none of the six Rath-line monsters in the normal panels, in the Debug panel on all six, switches on with the panel shown, off again on the hidden reset.]
