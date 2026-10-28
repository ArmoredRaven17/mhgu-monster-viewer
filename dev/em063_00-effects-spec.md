# Brachydios (em063_00) and Raging Brachydios (em063_05) — effects spec: the PSL enable word

Research agent for the Viewer agent, 2026-10-15 (the Brute Wyverns survey, "What closing each needs" 4). Static ROM
reading plus unicorn controls; no recorder, no lift, no `--apply`, no docs/ edit. `R` = READ (the consuming instruction
read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: dev/brute-wyverns-effects-survey.md (Brachydios / Raging: 32 bindings outside the file mask each,
147 file-mask bindings, 179 whole-block; unexported c 120 c 121 c 140 c 141 c 210), rom-map.md ("The PSL enable word per
class" row uEm063_00 `0xf469a8` UNREAD; "uEm063_00 -- Raging's slime state machine and the ON-HIT ERUPTION"; the u 1400
sweep row `0xf3ccbc` / `0xf3cd9c`; `0x81d6c`, `0xa3bf4`), E:\offline\decode\notes\states-em063_00.md (§1.1 the ctl block,
§2.3 the arm slime, §2.4 the arm level, §12 NOT READ; its vtable row for +0x13c says "attack hit groups" -- the slot is
the enable word, rom-map's trap), the task board (grep Brachydios / slime: Render's 2026-09-13..20 reads of Raging's
Yellow/Red slime machine `0xf36328` / `0xf36588`, the eruption `0xf36984`, the hit handler `0xf46f34` -- **the word reads
none of them**, §1), docs/render/psl-mask.js whole, monster.js ROM_ARM_SLIME / setArmSlimeLevel / armSlimeLevels,
motion-states.js MOTION_STATES em063_00 / em063_05, index.html playNow. Scratch: `<archive>/bw3/` (emu_bw.py,
jscheck.py, words.mjs, classify.py, ctltrack.py, armmap.py, s7tab.py, siemu.py, phprobe.py, the plans and rows).

## 1. The word — uEm063_00 vt+0x13c = `0xf469a8` — R, emulated

Vtable **`0x17d92c4`** (checked: `+0xf0` = base `0xca52c`, `+0x370` = `0xa3bf4`, `+0x1d0` = `0xf46978`, `+0x1d8` =
`0xf351a0` the per-reset init, `+0x1f4` = `0xf4541c` the action main, `+0x204` = `0xf35998`, `+0x210` = `0xf36dfc`).
Extent **`0xf469a8..0xf46afc`**: one `push {r4, r5, fp, lr}`; exits `popne` at `0xf46a94` and `pop` at `0xf46afc`; every
branch in the method lands at or before `0xf46afc`; `0xf46b00` is vt+0x2ac (the next method). Calls: `0xca170`, the
virtual `vt+0x370(e, 1)` (`0xa3bf4`), `0x81d6c`. No literal pool.

    0xf469b4  bl 0xca170                                   ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0xf469bc  variant e+0xb5f5 != 0 -> 0xf46a18           ; THE ONE VARIANT TEST: the arm arms are Brachydios's only
    0xf469c8    r0 = ctl = [e+0xcacc]
    0xf469d0    ldrh [ctl+0x2c] in {0, 3} (cmp #3 / cmpne #0) -> |= 0x180000 (bits 19-20)   ; arm slot 1 (part 2, arm_r)
    0xf469f4    ldrh [ctl+0x20] in {0, 3}                 -> |= 0x600000 (bits 21-22)   ; arm slot 0 (part 3, arm_l)
    0xf46a18  vt+0x370(e, 1) == 0 (tail NOT severed)        -> |= 0x18000000 (bits 27-28)  ; every motion, both variants
    0xf46a48  motion == 0x22a (L2 M42): status e+0x73e0 == 7 (`popne` otherwise) and number n = e+0x73e1:
                n - 0xa1 <= 0xf and bit (n - 0xa1) of 0x8025 (n 0xa1, 0xa3, 0xa6, 0xb0), or n == 0x14, or n == 0x08
                -> |= 0x60000 (bits 17-18)
    0xf46a54  motion == 0x229 (L2 M41): status 7 and n == 9 -> |= 0x60000 (bits 17-18)
    0xf46a60  motion == 0x00a (L0 M10): 0x81d6c(e) == 0 (not "already sunk") -> |= 0x18000 (bits 15-16)
    every other motion: the base, the arm bits and the tail bits

Every write is `movw #0x13f4; ldr rX, [rY, rX]!` (pre-indexed: rY = e + 0x13f4 afterwards) and `str rX, [rY]`
(`0xf469e8`, `0xf46a0c`, `0xf46a3c`, `0xf46a7c`, `0xf46af0`). In the slot-1 arm the ctl pointer stays in r0 (the
pre-index runs on r2), so `ldrh [r0, #0x20]` at `0xf469f4` is still ctl+0x20.

**Variant tests**: exactly one in the word, `e+0xb5f5 == 0` (Brachydios; Raging is 5). The class band
`0xf35038..0xf47ca0` loads the byte 27 times: 25 test `== 5` (Raging -- the slime machine, the part pass, `0xf4653c`, the
L2 M41 / M42 bodies after their setMotion `0xf3e71c` / `0xf3ebe4` / `0xf40d34` ...), one `== 4` (`0xf35d2c`), and this
`== 0`. **The word reads no rage gauge (ctl+0x84), no Yellow/Red slime state (ctl+0x54.. / +0xd0..), no eruption fuse**
-- Render's board reads of Raging's machine are not inputs here.

Negative with control: the band has exactly five `0x13f4` immediates, all in this method (listed above); the same scan
over uEm018_00's band finds its four (`0xdb0d44` / `0xdb0de4` / `0xdb0e30` / `0xdb0e40`).

### 1.1 The arm rows ctl+0x20 / ctl+0x2c — who writes them (R; answers states-em063_00.md §1.1 / §12)

The decode note calls ctl+0x20 / +0x2c / +0x38 / +0x44 "the arm-slime curve row (0..4), indexing 0x169f9ec" and records
**"no store to those offsets, by literal or register offset, exists in the class"** as its one open end. The store
exists, through a pre-indexed pointer that never names the offset again:

    0xf4653c(e, slot, delta)                     ; slot 0..3 (`cmp r6,#3; bhi` -> return)
      Raging (variant 5, 0xf46558): rec = ctl + 12*slot; [rec+0x24] (level, s16) <= 0 -> level = 2; return
      Brachydios:
        cap  = arm unbroken ? (rank >= 2 ? 6 : 4) : (rank >= 2 ? 3 : 2)
               ; rank = 0x3a8430(..) (`cmp r0,#2`); slot 0 tests 0x9d36c(e, 3), slot 1+ 0x9d36c(e, 2), against the .dtp
               ; row 1 bytes A[5] (rank <= 4) / A[6] (both 2, states-em063_00.md 3.1) -- unbroken = level < thr
        old  = level;  level = clamp(level + delta, 0, cap)            ; 0xf466f8..0xf46730
        0xf4673c  ldrh r7, [r1, #0x20]!          ; r1 = ctl + 12*slot + 0x20 -- THE ROW, pointer kept
        up   (level - old >= 1): row = level >= 2 ? 2 : 1
        down (level - old <  0): row = level == 1 ? 4 : level == 0 ? 3 : row (unchanged at >= 2)
        same: row unchanged
        0xf4679c  strh r2, [r1]                  ; only when the row changes; then ctl+0x28+12*slot (timer) = 0

So the row is **the arm's last level change**: 1 rose to 1, 2 rose to >= 2, 3 **fell to 0**, 4 fell to 1, and **0 = no
change since the reset** (the per-reset init vt+0x1d8 `0xf351a0` clears the block, `0x13ecbfc(ctl, 0x100)` at `0xf351b8`
-- a memclr by its (pointer, size) signature, I; the note says "clears the ctl block" -- and stores level 2 in both arms).
This is the only row writer: a pointer-tracking scan of the band (`ctltrack.py`) plus a register-agnostic scan of every
`strh` with a zero or register offset (17 sites, each base read) finds `0xf4679c` and Raging's own state stores
(`0xf361c8` .. `0xf366d4`, stride 8 from ctl+0x54), nothing else at +0x20 / +0x2c. The same scan finds the init's
`0xf3533c` / `0xf35364` level stores and the action-start hook's `0xf359c8` / `0xf359dc` (control).

The callers (45 sites, `armmap.py`): **delta -1 at 39 sites** (the attacks spending a fist; `0xf3552c`, `0xf3a234`,
`0xf3b514`, `0xf3bcb4`, `0xf3c694`, `0xf3d820`, `0xf3dfec` (L2 M54), `0xf3f02c` / `0xf41114` (L2 M2 / M3), `0xf3f644`,
`0xf3fc94`, `0xf405cc`, `0xf41760`), **refills** +4 / +6 by rank at `0xf377b8` (both), `0xf38db8` (slot 1, L0 M35;
also a flat +4 at `0xf39078`), `0xf3eedc` (L2 M1, both), `0xf44904` (both), `0xf46898` (vt+0x3c8, both, also gauge = 0).
(The `mov r2, #3 / #4` beside the L2 M2 / M3 decrements feed `0xf3b7e8`, not this function.) Which motion each of the 39
spending sites sits under: **NR** (most play their motion through helpers or the runtime tables `0x212d800..` -- below
-- not an immediate). The ones read agree with the bits' sides: `0xf3dfec` plays L2 M54 (`0xf3e09c`) and spends slot 1
(`0xf3e1ac`) -- L2 M54's binding is b19, the slot-1 bits; `0xf3f644(e, side)` plays **L2 M11 when side == 0, L2 M13
otherwise** (`movweq #0x20b` / `movwne #0x20d`, `0xf3f948`) and spends slot `side` (`0xf3f8a0`) -- L2 M11's binding is
b21 (slot 0), L2 M13's b19 (slot 1); `0xf41760` has the same shape (`0xf41a68`, `0xf419b4`). So each punch's "spent" bit
is the arm that punch spends (R for these three; I for the rest).

Level 0 is reached only through `0xf4653c`'s decrement (the init sets 2, the break hook `0xf35e2c` caps at 2 / 3, the
action-start hook vt+0x204 `0xf35998` restores the per-frame mirror P+0x1bb that vt+0x1e8 `0xf36014` packs at `0xadd64`),
so **level 0 <=> row 3** while it lasts, and an increase rewrites the row. That is the viewer's handle on it (§3).

**Emulated** (`<archive>/bw3/emu_bw.py`: emu13c.py plus VFP, the variant byte, ctl at `[e+0xcacc]` with the two rows,
the posture P+0x1ba, P+0x5c and `0xbf62c` answered with the .dtb's MoguriBaseOfs -1500.0; case = motion:status:number:
sever:rage:tired:variant:rowL(ctl+0x20):rowR(ctl+0x2c):posture:p5c). Controls first, earlier specs' words: Ukanlos L2 M3
`0x381ff` / severed `0x1c01ff` / severed enraged `0x1c0e3f`; Deadeye L0 M7 (7, 0xe5) `0x380001ff`, Garuga `0x1ff`; Akantor
L0 M2 posture 4 at P+0x5c 0 `0x381ff`, at -2000 `0x1c01ff` (sunk), posture 0 `0x381ff`.

| case (Brachydios v0 unless named) | word |
|---|---|
| L2 M5 (7, 0), rows 0 / 0 | `0x187801ff` |
| L2 M5, rows 2 / 2 | `0x180001ff` |
| L2 M5, rowL 3 / rowR 4 | `0x186001ff` |
| L2 M5, rowL 1 / rowR 3; rowL 4 / rowR 0 | `0x181801ff`; `0x181801ff` |
| L2 M5 rows 0 / 0, **Raging v5** | `0x180001ff` |
| L2 M5 rows 2 / 2 severed; Raging severed enraged | `0x1ff`; `0xe3f` |
| L2 M5 rows 2 / 2 tired | `0x1800703f` |
| L2 M42 (7, 0x08) / (7, 0x14) / (7, 0xa1) / (7, 0xa3) / (7, 0xa6) / (7, 0xb0) | `0x180601ff` each |
| L2 M42 (7, 0x15) / (7, 0xa2) / (7, 0xa5) / (7, 0xb1) / (7, 0x09) / (2, 0x08) | `0x180001ff` each |
| L2 M42 (7, 0x08) Raging | `0x180601ff` |
| L2 M41 (7, 0x09) / Raging enraged | `0x180601ff` / `0x18060e3f` |
| L2 M41 (7, 0x98) / (7, 0x08) | `0x180001ff` |
| L0 M10 posture 0; posture 4 at P+0x5c 0 | `0x180181ff`; `0x180181ff` |
| L0 M10 posture 4 at P+0x5c -2000 (sunk), Brachydios / Raging | `0x180001ff` / `0x180001ff` |
| L0 M11 | `0x180001ff` |

And the transcription below against the ROM under unicorn (`jscheck.py`: node runs words.mjs, unicorn the method; 11
motions x 21 actions x rage / tired x sever x variant 0 / 5 x rows 0..4 x 0..4 x three posture cases): **25392 runs, 0
mismatches**. (Positive control for the checker: a one-constant mutation of the em080 transcription gives 576 mismatches.)

**For psl-mask.js CLASS_MASK:**

    // BRACHYDIOS (em063_00) and RAGING BRACHYDIOS (em063_05), one class uEm063_00 (vtable 0x17d92c4; +0xf0 the base
    // 0xca52c), vtable +0x13c = 0xf469a8, READ whole (0xf469a8..0xf46afc) and emulated (dev/em063_00-effects-spec.md 1).
    // 0xca170 first, then:
    //   * variant byte e+0xb5f5 == 0 (Brachydios only -- the word's one variant test): each arm's slime row, ctl+0x2c
    //     (slot 1, part 2, XfB__m02_nenkin_arm_r) / ctl+0x20 (slot 0, part 3, arm_l), in {0, 3} -> bits 19-20 / 21-22.
    //     The row is the arm's last level change, written only by 0xf4653c (0xf4679c): 3 = it fell to 0 (the fist is
    //     spent), 0 = no change since the reset. c 130 / c 140 (right: L2 M8 / M13 / M18 / M54 b19), c 131 / c 141
    //     (left: L2 M5 / M11 / M16 b21). state.armEmpty = [left, right] (the viewer's arm level 0).
    //   * every motion, both variants: vt+0x370(e, 1) = 0xa3bf4 (P+0x3b4 bit 0) clear -> bits 27-28 (L2 M21 b27 c 210).
    //   * L2 M42 (0x22a): (7, 0x08 / 0x14 / 0xa1 / 0xa3 / 0xa6 / 0xb0) -> bits 17-18 (u 200);  L2 M41 (0x229): (7, 0x09).
    //   * L0 M10 (0x00a): 0x81d6c "already sunk" false -> bits 15-16 (c 2 / c 3). STAND-IN state.sunk = false: the plays
    //     take posture 0 (0xf38648, 0xf39230, 0xf40534, 0xf44a60) or posture 4 from the surface (0xf3cc88 / 0xf3cd64).
    const EM063_L2M42 = n => (n >= 0xa1 && n <= 0xb0 && ((0x8025 >>> (n - 0xa1)) & 1)) || n === 0x14 || n === 0x08;
    const em063 = v0 => (motion, action, state) => {
      let r = state.severed ? 0 : 0x18000000;
      if (v0){
        const e = state.armEmpty || [false, false];
        if (e[1]) r |= 0x180000;
        if (e[0]) r |= 0x600000;
      }
      const n = action && action[0] === 7 ? action[1] : -1;
      if (motion === 0x22a) return r | (EM063_L2M42(n) ? 0x60000 : 0);
      if (motion === 0x229) return r | (n === 9 ? 0x60000 : 0);
      if (motion === 0x00a) return r | (state.sunk ? 0 : 0x18000);
      return r;
    };
    const em063_00 = em063(true), em063_05 = em063(false);

Inputs, and how the viewer supplies each:

* **`state.severed`** — P+0x3b4 bit 0 (`0xa3bf4`). Both part passes draw **set 10** on the same `vt+0x370(e, 1)` test
  (Brachydios `0xf37560`, states-em063_00.md 2.1; Raging's short block, 2.5), and set 10 is the only set drawing **part 8**
  on either (monsters.json em063_00 / em063_05 groups[10] = 8 on, 101 off; set 5 / set 9 draw 8 off). His sever row
  (`'3|Motion[22]'` levels [[5], [10]] / Raging's start row) takes it there. So **`SHELL_TAIL.em063_00 = { severed: 8 }`,
  `SHELL_TAIL.em063_05 = { severed: 8 }`** in motion-states.js (no break level read). R.
* **`state.armEmpty`** — NEW, `[left (slot 0), right (slot 1)]`. The viewer already holds each arm's level
  (monster.js ROM_ARM_SLIME em063_00, `armSlimeLevels(mounted.main)` -> `[slot 0, slot 1]`, the same slot order as ctl).
  index.html playNow: `const arms = state.id === 'em063_00' ? armSlimeLevels(mounted.main) : null; armEmpty = arms ?
  [arms[0] === 0, arms[1] === 0] : undefined`, passed in pslMask's state. Level 0 <=> row 3 (§1.1), R. **Two named
  differences**: (a) the ROM also sets the bits while the row is still 0 -- each arm's attacks after a reset until its
  first level change, at level 2 -- which the viewer, holding no history, shows as not empty; (b) the parts panel does not
  offer level 0 today ("Level 0, near black, is not offered", monster.js), so until Raven adds an "Empty" arm item these
  seven bindings stay off in the viewer -- correctly for every non-empty arm. Raging: no input (his word has no arm arm).
* **`action`** — L2 M42 / L2 M41 only: CLIP_ACTIONS (§3).
* **`state.sunk`** — the existing stand-in, false (as Akantor / Ukanlos). Rage / tired from the toggles.

## 2. What the word changes — whole-block plan (147 file-mask -> 179 whole, both monsters)

`add_effects.py em063_00` / `em063_05` (plan; `<archive>/bw3/planwhole.py <mon> [--whole]` for the whole block):
24 records in the file plan (all exported), 29 in the whole -- **c 120, c 121, c 140, c 141, c 210 come in**. Every
binding not listed sits on bits 0-5 and stays always-on. Classified against the transcription (`classify.py`).

**Turned ON, always** (outside the file mask, both monsters, 21 each — on bits 0-4):

| binding | record |
|---|---|
| L0 M6 b0 / b1 | c 2 / c 3 (`cm202_002`) |
| L0 M35 b2 | c 1 (`cm202_001`) |
| L0 M52 b0 / b1, L0 M58 b0 / b1, L0 M59 b0, L0 M61 b0 / b1, L0 M62 b0 / b1, L0 M64 b2 / b3 | c 120 / c 121 (`em063_00_012`) -- to export |
| L0 M54 b0, L0 M57 b0 / b1, L0 M60 b0, L0 M63 b0 | c 131 / c 130 / c 131 (`em023_00_011`) |
| L2 M22 b2 / b4 | c 130 / c 131 |

**Turned ON, gated** (outside the file mask):

| binding | record | Brachydios | Raging |
|---|---|---|---|
| L0 M10 b15 f16, f84 / b16 f44 | c 2 / c 3 | not sunk (every play, stand-in) | the same |
| L2 M21 b27 f60 | c 210 (`cm202_035`) -- to export | tail not severed | the same |
| L2 M41 b18 f4-124 | u 200 (`em063_00_005`; Raging `em063_05u` 200) | (7, 0x09) only | the same |
| L2 M5 b21 f8 | c 131 | left arm spent (row 0 / 3) | **never** |
| L2 M11 b21 f19 / L2 M16 b21 f24 | c 141 -- to export (Brachydios) | left arm spent | **never** |
| L2 M8 b19 f6 | c 130 | right arm spent | **never** |
| L2 M13 b19 f20 / L2 M18 b19 f23 / L2 M54 b19 f72 | c 140 -- to export (Brachydios) | right arm spent | **never** |

**Named but never enabled** — Raging's seven arm bindings above (L2 M5 / M8 / M11 / M13 / M16 / M18 / M54): his variant
fails `0xf469bc`. **c 140 and c 141 are named on Raging only there -- do not export them for em063_05** (emulated: Raging
L2 M5 rows 0 / 0 `0x180001ff`). Brachydios: none.

**Gated** (in the file mask, fired by the viewer on every play today):

| binding | record | game |
|---|---|---|
| **L2 M42 b18** f9-94 | u 200 (`em063_00_005`) | only under (7, 0x08 / 0x14 / 0xa6 / 0xb0) -- the plays (7, 0x15 / 0xa5 / 0xb1) do not fire it (§3) |

**Turned OFF**: none. **State groups**: no binding of either monster sits on bits 6-14.

Counts: Brachydios -- 21 out-of-mask ON always, 11 ON gated (2 sunk, 1 sever, 1 action, 7 arm); 1 in-mask gated.
Raging -- 21 ON always, 4 ON gated, 7 never; 1 in-mask gated. 32 out-of-mask each, as the survey counted.

Records to export with the `--apply`: **Brachydios c 120, c 121, c 140, c 141, c 210** (5). **Raging c 120, c 121,
c 210** (3; not c 140 / c 141).

## 3. Which actions play the keyed clips — CLIP_ACTIONS

Sources: the status-7 dispatcher **`0xf41f2c`** (number `e+0x73e1`, `cmp #0xb6`, table **`0xf41f58`** of 0xb7 offsets
from the table base; `s7tab.py`), the setMotion sites with an immediate (`motsites.py`: the only `0x22a` / `0x229` are
`0xf3e594` / `0xf3e718` in `0xf3e314` and `0xf40d30` in `0xf40c9c`; `0xf3ebe0` in `0xf3eb70`), each body's callers (only
the dispatcher: `0xf43300`, `0xf43444`, `0xf43208`), the three table-driven setMotion sites (`0xf3be04`, `0xf3c35c`,
`0xf3c62c`, all in `0xf3bcb4`) whose tables are .bss built by the static initializer `0xf470fc` -- run under unicorn
(`siemu.py`): `0x212d800` / `0x212d850` / `0x212d8b0` hold L0 M52..M64 ids, no L2 -- and the action main `0xf4541c`
under unicorn for phases 0..5 (efx/agents/brachy-scratch/actprobe.py via `phprobe.py`, variants 0 and 5 identical).

* **L2 M42** (0x22a), body `0xf3e314(e, mode)`: **(7, 0x08)** mode 0 (setMotion0, start 0) -- bits 17-18;
  **(7, 0x14)** mode 1 (setMotion flags 2, start 38) -- bits; (7, 0x15) mode 2 (start 38) -- no bits; (7, 0xa5) mode 3
  (start 34) -- no bits; **(7, 0xa6)** mode 4 (start 34) -- bits. Body `0xf40c9c(e, mode)`: **(7, 0xb0)** mode 1 (start
  38) -- bits; (7, 0xb1) mode 2 (start 38) -- no bits.
* (7, 0xa1) / (7, 0xa3) are in the word's list but never play L2 M42 under their own action: phase 0 turns through the
  turn tables `0x16a00a4` / `0x16a00e4` (motion L2 M7 / L2 M4, `0x7a258`), phase 1 hands over to (7, 0xa2) / (7, 0xa4)
  (`0xf43d0c` / `0xf43d3c`), whose phase 2 follows **(7, 0xa5)** (`0x768c8`) -- the no-bits form. R (tables, sites); the
  emulated phases agree.
* **L2 M41** (0x229), body `0xf3eb70(e, mode)`: **(7, 0x09)** mode 0 (setMotion0, start 0) -- bits; (7, 0x98) mode 1
  (start 0) -- no bits.
* The arm bindings and L2 M21 read no action. L0 M10 reads the posture (above), no CLIP_ACTIONS entry needed (sunk is
  false on every play the viewer shows).

    // BRACHYDIOS / RAGING, the plays of the two clips their word (0xf469a8) keys on an action: status-7 table 0xf41f58.
    // L2 M42: (7, 0x08) 0xf3e314 mode 0 (start 0), (7, 0x14 / 0x15) modes 1 / 2 and (7, 0xa5 / 0xa6) modes 3 / 4 (starts
    // 38 / 34), (7, 0xb0 / 0xb1) 0xf40c9c modes 1 / 2 (start 38). Bits 17-18 (u 200) on 0x08 / 0x14 / 0xa6 / 0xb0 only.
    // L2 M41: (7, 0x09) / (7, 0x98) 0xf3eb70 modes 0 / 1 (start 0); bits on (7, 0x09) only. Each play the next; the ROM
    // starts the flagged plays at frame 34 / 38 -- the viewer plays the clip from 0.
    em063_00: {
      '2|Motion[42]': [{ action: [7, 0x08] }, { action: [7, 0x14] }, { action: [7, 0x15] }, { action: [7, 0xa5] },
                       { action: [7, 0xa6] }, { action: [7, 0xb0] }, { action: [7, 0xb1] }],
      '2|Motion[41]': [{ action: [7, 0x09] }, { action: [7, 0x98] }],
    },
    // em063_05: the same two entries (the plays are variant-blind: actprobe v0 / v5 identical).

Which command streams issue which of these: **NR** (the EMC was not walked; the viewer shows each as its own entry).

## 4. What to implement, in order

1. motion-states.js: `SHELL_TAIL.em063_00 = { severed: 8 }`, `SHELL_TAIL.em063_05 = { severed: 8 }`.
2. index.html playNow: `armEmpty` from `armSlimeLevels(mounted.main)` (em063_00 only), level 0 per arm, into pslMask's
   state beside `severed` (the one new viewer input).
3. psl-mask.js: `em063` / `em063_00` / `em063_05` as §1 into CLASS_MASK; both ids into `PSL_MASK_MONSTERS`; the two
   CLIP_ACTIONS blocks of §3.
4. `add_effects.py em063_00 --apply` (exports c 120 / 121 / 140 / 141 / 210), `em063_05 --apply` -- **check that it
   does not export c 140 / c 141 for em063_05** (it will: the plan names them; they are mounted and never fired -- drop
   them or leave them, Raven's call) -- then `--record`, `--check`. Recorder slot -- announce.
5. Raven decides whether the arm rows offer level 0 ("Empty"); without it the seven arm bindings never show.
6. Soak with `--viewer-inputs`; Raven verifies: L2 M42's u 200 on (7, 0x08 / 0x14 / 0xa6 / 0xb0) plays only; L2 M41's on
   (7, 0x09); c 210 on L2 M21 with the tail on, gone after the sever; L0 M10's c 2 / c 3; L0 M52..M64's c 120 / c 121;
   with an arm at level 0, c 131 / c 141 (left) and c 130 / c 140 (right) on that arm's attacks.

NOT READ, by name: the motion each of the 39 spending `0xf4653c` sites sits under; who calls vt+0x3c8 (`0xf46898`, the
refill-both / gauge-0 hook: no immediate-offset call of +0x3c8 on an enemy anywhere in main.text); `0x13ecbfc`'s import
name (memclr by signature, I); what u 200 / c 130 / c 131 / c 140 / c 141 look like (visuals are Raven's); the EMC streams
issuing the L2 M41 / M42 actions; P+0x5c at the burrow plays (`0xf3cc88` / `0xf3cd64`) as a value (the sunk stand-in).

## Re-walk 2026-10-18 (Fanged-Wyvern effects agent): tracer diff, request census, word re-emulation

**L0 M10's u 1400 is the burrows' (6, 2 / 3 / 6)** (reqtrace.py); the walks and the (7, n) plays set L0 M10 with none -- now copy B, both variants. **The arm rows are at [e+0xcacc]**, not ctl = [e+0xcac0]: `ldrh [[e+0xcacc] + 0x2c]` / `+ 0x20` (0xf469c8..0xf46a00); re-emulated with them there -- 657920 runs, 0 mismatches, 72 words (the transcription was right; the earlier emulation matched with both rows unread).

## 5. Raging Brachydios's slime eruption (2026-10-25; Raven: "I would like anything related to attacks such as the slime pools")

* **The four slots**: 0 left arm, 1 right arm, 2 head, 3 tail, in the block [e+0xcacc]: countdown +0x50+8k (2700 per cycle, burnt by
  e+0x1c while live), state +0x54+8k (0 Yellow, 1 to Red, 2 Red, 3 to Yellow; the material clips), trigger +0x56+8k, fuse +0xb0+4k,
  warning handle +0xc0+4k.
* **The hit** (0xf46f34 -> 0xf36984): a Red slot with its fuse spent erupts: the warning **u 200 + slot** (em063_05_001 on joints 7 /
  10 / 3 / 143) held for a **30-frame fuse**, then **the explosion** (0xf46234): the warning stopped, the slot Yellow, an explosion
  **shell** (mode 0x17..0x26 by slot, break level and rage). u 204 (joint 142) has no request site.
* **The pools** (Brachydios and Raging): shell01 / shell35 records (u 0 / 1 / 10 / 11 / 30 / 31 / 40 / 41 / 50 / 51, triage), with no
  SHELL_DATA yet -- the shells lane. -> **Built 2026-10-25: section 5a.**
* **Built**: the Slime Hit control and the warning (motion-states.js CLASS_TIMERS em063_05). Working labels, for Raven: **Slime Hit**:
  None / Head / Left Pounder / Right Pounder / Tail. The 2700-frame per-slot cycle is not shown (Red is Raven's Red Slime, whole
  body); a spent slot waits for Red Slime to be set again -- a choice for Raven.

## 5a. The shells: the slime pools, the explosions, the lines and the eruption (shells lane, 2026-10-25; <archive>\gapQ\RESULT.md)

Built in render/shells.js (SHELL_DATA em063_00 / em063_05; the code under "Brachydios / Raging"); rom-map "Brachydios / Raging -- the
shells". Every value below is READ (the consuming instruction read), except where marked.

* **Three shells per class** (vt+0x158 0xf35108): Brachydios 0x110 **sp_01** (base01: the explosions, reader 0xf4815c), 0x111 **sp_11**
  (base11: the slime line and the scatter), 0x112 **sp_35** (a NEW base, base35 0x175169c: **the slime pool**); Raging the same as
  0x113 / 0x114 / 0x115. Raging's EffectList is index 1 (em063_05u; index 0 null).
* **The pool** (sp_35, base35): a timer (float 0: **300 frames Brachydios, 150 Raging**), one ef from its init to its end (u 0 / 10
  Brachydios; u 100 / 10 / 110 Raging), then at timer-out an sp_01 at its spot (int 1: Brachydios mode 6 u 1 / mode 7 u 11; Raging 6
  u 1 / 7 u 11 / **21 u 111**). **No warning stage in the shell**: nothing else starts before the explosion (a flash inside the pool's own
  .efl is not read).
* **The fists** (0xf458ec, probe 0xf454e0: joint 40 left / 50 right, a ray down to the ground within +-300): a calm fist leaves a pool
  (sp_35 0); an **enraged Brachydios** fist explodes at once (sp_01 3, u 50); a Depleted arm (level 0) makes nothing. **Raging**: a Red
  slot's fist explodes at once (sp_01 14, u 50), a Yellow slot's leaves a pool -- with Red Slime off sp_35 0 (u 100), with the slot spent
  under Red Slime sp_35 4 (u 110) and its explosion sp_01 21 (u 111). The two-fist slam L2 M3 (0xf3b7e8): two pools, or sp_01 4 (u 40) /
  5 (u 41) with one arm Depleted; Raging sp_01 17 (u 130) / 18 (u 131).
* **The sites**: L2 M28 / M29 f72; L2 M11 / M13 f26 (an instant explosion); L2 M54 f72; L2 M5 / M8 f6 (the turn punches); L2 M3 f8 / 34
  (f30 for (7, 0xb2)); L2 M42 f125 the slime line (sp_11 1 -> eight sp_01 1, u 30) and f90 the big pool (sp_35 1 550 ahead, u 10 -> sp_01
  7 u 11); L2 M41 f190 the scatter (sp_11 0 -> twelve sp_01 0, u 31) and f124 the big pool 400 ahead; the frame handler 0xf3552c on L2 M22
  (f114 / 152 / 180); the status-3 walks L0 M52 / 54 / 57..63.
* **The eruption** (Raging, 0xf46234): on the fuse's burn-out, sp_01 modes 23..38 AT A JOINT (head 3, left arm 40, right arm 50, tail
  143; the file's int 4 = 0), u 210: head 0x17 / 0x18, left arm 0x19 / 0x1a, right arm 0x1b / 0x1c, tail 0x1d / 0x1e (calm / enraged);
  the broken head / arms 0x1f.. / 0x21.. / 0x23.., the severed tail 0x25 / 0x26. A slot not Red at the burn-out makes none.
* **The viewer's inputs** (index.html shellExtra): `arm063` [left, right] (monster.js armSlimeLevels; Brachydios only), `breaks063`
  (motion-states.js brachyBreaks063: a part whose broken set is drawn is at level 2 -- the part pass's own test against the same .dtp
  threshold, 2 everywhere), `slime063` / `erupt063` (the effects lane's slime timer: Red while Red Slime is on and the slot not spent;
  the burn-out slots with a sequence number), `tailSevered`. The shells take each `erupt063` sequence once, and a burned-out slot as Red
  for its own explosion (the timer has already marked it spent; the ROM turns it Yellow the next tick) -- rom-map trap 146.
* **Exported** `when: shell`: em063_00u 0 / 1 / 10 / 11 / 30 / 31 / 40 / 41 / 50 / 51; em063_05u 1 / 10 / 11 / 30 / 31 / 40 / 41 / 50 /
  100 / 110 / 111 / 130 / 131 / 210. Not exported: em063_05u 21 (no such record; only the unmade sp_01 mode 8 names it).
* **No maker** (negative, control: the 8 submit sites): sp_01 modes 2, 8, 10..13, 15, 16, 19, 20, 22.
* **Check**: `node dev/shells-brachydios-check.mjs` (stepShells on a stand-in pose: the modes, timers and keys above).
* **The eruption hand-off (fixed 2026-10-25; Raven: "the explosion doesn't render each time")**: the slime timer steps once per viewer
  frame and the shells once per 1/60 s effect step, so a burn-out kept for one timer step was lost on any frame that ran no effect step
  (0 of 5 real clicks drew at a 144 Hz clock, 4 of 5 at a jittered 60). The timer now logs each burn-out (`t.elog`: id, slot, the state at
  the burn-out) and the shells take each id once (eruptStep063); the effects lane's slime063 burns nothing on a fresh step (5b). Re-metered
  with real clicks (<archive>\gapS\slimeclick.mjs, one row per click): 60 of 60 eruptions drew u 210 over three clocks, two camera
  distances, parts in turn, the same part after its re-arm, rapid clicks, paused, scrubbed back / forward, Red Slime set mid-clip, four
  clips and a clip change during the fuse. A click on a part that is still Yellow (the 60-frame re-arm and the 15-frame turns) makes no
  eruption -- 0xf36984 needs it Red -- and adds 180 frames to its wait (0xf46f34): the rule, not a miss. rom-map trap 154.
* **Metered** (2026-10-25, slot 1; dev/shells-draw-table.md): **22 of 24 draw**. Brachydios: u 0 / 1 / 10 / 11 / 30 / 31 / 40 / 41 / 50 (u 41 with the Right Pounder Depleted, enraged L2 M3); u 51 ROM GIVES NOTHING (mode 8, no maker). Raging: u 1 / 10 / 11 / 30 / 31 / 40 / 50 / 100 / 110 / 111 / 130 / 131 / 210 -- re-metered against the rebuilt slime timer (the hit through window.__slime063.hit, as a click on the model): u 210 on each hit Red part's burn-out, three eruptions of one slot in a row (the 60-frame re-arm), u 110 / 111 / 131 while a hit part is Yellow; u 41 INPUT MISSING (sp_01 mode 5 wants one arm Red with rage off: with Red Slime off the viewer's four slots are Yellow; the ROM's slots cycle on their own -- put to Raven by the effects lane).

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **The spending sites' motions -- partly READ (emulated)**: the fist spends on L2 M28 / M29 ((7, 3 / 0x2e..0x31)), L2 M54 ((7, 7 /
  0x4d)), L2 M11 / M13 (the side punches (7, 0x1a / 0x1c / 0x27 / 0x29 / 0x84..0x92 / 0xb3 / 0xb4)), (7, 0x13) phase 3, (3, 4); the
  refills on L0 M2 ((1, 7)), L0 M33..M35 ((2, 0xf..0x11 / 0x16), (7, 0x24 / 0x25)) and L2 M1 ((7, 0xa / 0xe)). The rest sit behind
  gates the harness answers 0 (rom-map row "`0xf4653c` spend / refill sites by action").
* **vt+0x3c8 -- READ, no caller**: no immediate +0x3c8 vtable call on an enemy anywhere in main.text (the same scan's control finds
  372 vt+0x3e8 loads, Deviljho's tail call among them). The refill-both hook is unused by code.
* **`0x13ecbfc` = `__aeabi_memclr8`** (pltname.py; acosf / atan2f / sqrtf as controls). The I is R.
* **The EMC streams of the L2 M41 / M42 actions -- READ** (rom-map row "em063_00_cmdtbl.emc ... the L2 M41 / M42 actions"); (7, 0xa5)
  follows (7, 0xa2) / (7, 0xa4); (7, 0x15) / (7, 0x98) / (7, 0xa2) / (7, 0xa6) have no issuer -- named.
* MoguriBaseOfs -1500 (dtbase +0xa8); P+0x5c at the burrow plays stays the cross-monster toggle (category c).
* **CORRECTION (2026-10-19, Withdrawn table): (7, 0xa6) IS issued** -- the follow `0xf40104` after (7, 0xa2) / (7, 0xa4) picks (7, 0xa5)
  calm and (7, 0xa6) enraged; the census had the rage test stubbed 0. Its L2 M42 entry already stood. (7, 0x15) / (7, 0x98) / (7, 0xa2)
  re-checked with vt+0x3d0 and rage / tired both ways: still no issuer.
* **Begins Burrowed -- BUILT 2026-10-19** (CLASS_TOGGLES `burrowed`, working label, approved by Raven): on, every posture-4 play
  reads sunk (0x81d6c: posture 4 and P+0x5c below 0.9 x MoguriBaseOfs); off, only the entries that name sunk. Checked on
  Basarios's L0 M7 B (dev/checks/class-toggles.mjs).


## 5b. The slime hit as a click, and the per-slot cycle (2026-10-25; Raven: "we would need to simulate hits for the effects (could do this with mouse clicks that cause the explosion, it goes yellow then back to red)", "it should explode, go to yellow briefly then revert to red again", "This way people can do it multiple times if desired", "In game, it stays yellow until it goes red again")

* **The cycle (R, 0xf36100 whole; spawn 0xf352e0..0xf353bc).** Each slot starts Yellow (state 0) with its countdown at 2700.0. While
  the unit is live the countdown burns by e+0x1c; below 0 the slot flips (0 -> 1 to Red, else -> 3 to Yellow) and the countdown is
  2700.0 again (0xf36224 / 0xf3622c). A set trigger byte +0x70+k turns a Yellow slot to Red at once (Move 6 at L0 M15 f158 sets all
  four). The explosion 0xf46234 leaves the countdown at -1, so an erupted part flips to Yellow the next frame and **stays Yellow for
  2700 frames (45 s)** before its own cycle turns it Red. A hit on a Yellow part adds 180 to its countdown (0xf46f34). Rage is not read
  on the colour path (only the explosion's mode).
* **Built.** A left click on the model (4 px / 350 ms; not a drag; not the first-person camera) is a ray against the .bdd hit shapes
  (hitzones.json `capsules`); the nearest shape's part maps to the slot as 0xf36984 maps it. The **Slime Hit dropdown is removed**.
  Red Slime is Move 6 (all four Red). A Red part hit erupts (the warning u 200 + slot 30 frames, then the shells' u 210) and turns Yellow;
  each slot's colour is its own material clip (ROM_STAGE_CLIPS em063_05: Yellow_to_Red / Red_to_Yellow, held).
* **Viewer re-arm (Raven, 2026-10-25); in game the part stays Yellow until its cycle turns it Red**: the erupted part is Yellow for
  `SLIME_REARM063` = 60 frames (motion-states.js, one constant), then Red and armed again -- the ROM's value is 2700 (0xf36224 /
  0xf3622c). Also named: while Red Slime is on, a settled Red part's countdown is held (the ROM would flip it Yellow after 2700 frames).
* **Measured** (`<archive>/cen/pq/slime2.mjs`, `pq/slimeclick.mjs`): four eruptions of one part in a row with the re-arm between; a
  click inside the Yellow window erupts nothing (+180); real clicks arm the head and both pounders; a 20 px drag arms nothing.
* **"One arm Red, rage off"**: reachable in the ROM (the colour cycles per slot whatever the rage); not in the viewer, where Red Slime off
  sends all four Yellow (the toggle's meaning, Raven's) -- the shells' u 41 stays INPUT MISSING unless the per-slot cycle runs with the
  toggle off (a choice for Raven).
* **The Red look (2026-10-25; Raven: "The Red Slime effect reverted back to its less rendered form", then "When clicking, it partially
  renders the explosion, reverts to the correct looking red state instead of yellow").** The ROM's Red is the MapBlend alpha alone:
  albedo = lerp(tAlbedoMap @ UVPrimary, the same texture @ UVSecondary with fUVTransform2's U +0.5 (the red column), fAlbedoBlendColor.a),
  with fDiffuseColor 0,0,0 (the look is emission x albedo). Two viewer faults met when the per-slot clips started driving the alpha:
  (1) the slime meshes are one-UV layouts (IASkinTB2wt / TBC1wt / TBC4wt / TB1wt / TB4wt, which declare UV_Secondary on UV_Primary's
  bytes), the glb has no TEXCOORD_1, and the shader's `uv1` read (0, 0) -- Red was one texel, flat amber; (2) ROM_ARM_SLIME em063_05's
  enrage U +0.5 on the albedo (HEAD's whole Red Slime) is not Raging's (0xf36dfc returns into 0xf36328 before the gauge block; no UV
  setter on his path -- WITHDRAWN in rom-map) and still applied, so Yellow (alpha 0) drew the shifted albedo = full Red. Plus
  rom/shader.js's MapBlend mixed the raw second map in, dropping the black fDiffuseColor (a lit albedo over the emission).
  **Fixed** (monster.js buildMesh: `uv1` aliased to `uv` on MapBlend prims without one; ROM_ARM_SLIME em063_05 `enragedU: 0`;
  rom/shader.js MapBlend `mix(diffuseColor.rgb, diffuse * ext.rgb, a)`). Per slot, from the ROM's clips: Red = Yellow_to_Red held = the
  HEAD look (same camera and pose: the slime pixels match; red-classed pixels 24968 vs HEAD 24928, mean (191.8, 61.4, 26.1) vs
  (191.9, 61.4, 26.1)); an erupted head is Yellow for the re-arm window, then the full Red again. The eruption's draw is unchanged by
  the fix and not cut by the slot's colour change: u 202 lit on every sample (~52 frames live), the shells' u 210 lit 48/49 (~95 frames)
  in both the pre-fix and fixed runs (draw meter, same camera). Shots: `<scratchpad>/slimefix/shots/` head2-rest, pre2-*, fix2-* (rest,
  fuse, erupt, yellow, red). rom-map trap 147.
  **Audit across the viewer, same day** (trap 147): MapBlend and so the shader line exist on em063_05 alone; the `uv1` alias now covers
  every two-map albedo with no TEXCOORD_1 (all one-TexCoord layouts after the re-export), which changes em045_04 / em080_00 / em080_04
  as well, and Khezu's (em003_00) TEXCOORD_1 is the ROM's UV_Secondary (zeros) instead of add-uv2's UV_Extend. Brachydios (em063_00) has
  no two-map material: unchanged.

## Re-metered 2026-10-25 (effects lane A)

* Brachydios c 140 / c 141 draw with the matching arm at slime level 0 (the Parts row's level-0 option; `<archive>/cen/pq/arm063.json`);
  u 1001 / u 1016 (break cycle arms) and u 1400 draw under census3; c 1500 draws lying on Ground H, both variants.
* **Raging c 140 / c 141 are never enabled**: the arm-slime bits 19-22 of `0xf469a8` sit behind `e+0xb5f5 == 0` (section 1). A ROM
  reason for the coordinator; control `cen/pq/arm063r.json` (none start) against arm063 (both draw on Brachydios).
* **The hand-off to the shells (shells lane, 2026-10-25).** The timer steps once per viewer frame and the shells once per 1/60 s effect
  step, so a one-step `erupt063` could fall on a frame with no effect step (144 Hz, jitter, a scrub). slime063 also appends each
  eruption to `t.elog` (the last 32, `{ id, slot, col, n }`) and slimeShellInput hands it on; the shells take each id once. A FRESH
  timer step (a clip change, replay or backward scrub, where stepClassTimers gives dt = the new frame) is held at dt 0, so a scrub no
  longer burns a fuse out at once.
