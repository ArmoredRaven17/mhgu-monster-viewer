# gapN: the shell segment table (+0x1594, hitsize j0 1010) and hit kinds 0xc / 0xd / 0x1e / 0x41 (2026-10-22, ROM-decode helper, shells lane)

Builds on gapM (`<scratchpad>\gapM\RESULT.md`). Nothing in the repo was edited.

Tools (all in `<scratchpad>\gapN\`):
- `movw.py <imm..>`: every `movw` of those immediates in main.text.
- `ldst.py <imm..>`: ldr / str / vldr / vstr with those 12-bit offsets, and `add #imm`.
- `w.py`: gapM's disassembler, copied.
- `emu_hitline.py` → `emu_hitline.json`: a unicorn run of 0x3fc1c8 and 0x4340fc on a fake shell.
- `hitline_check.mjs`: the JS below against that run, **10 / 10 PASS bit for bit** (fills, plus the first-call, delay, off and n = 16 controls).
- `emu_2f5bf0.py`: a ROM run of 0x2f5bf0 over three groups × 33 actions, and of 0x2a6640 on a fake slot.

## (a) READ facts

### 1. The segment table: what it is and who fills it

**The fields** (enemy-shell ctor `0x4a0bf0..0x4a0c10`, READ). The ctor sets all four to 0:

| field | what |
|---|---|
| byte `+0x158a` | on |
| u32 `+0x158c` | n, the entry count |
| u32 `+0x1590` | the hit line's call counter |
| ptr `+0x1594` | the table |

The dtor `0x4a0de8..` frees `+0x1594` through `[0x1832378]+0x3c` vt+0x34.

**Each entry is 32 bytes**: p0 at +0, +4, +8; 0 at +0xc; p1 at +0x10, +0x14, +0x18; 0 at +0x1c. The points are **world** points: the hit manager uses them as they are (§2).

**Who allocates it: the class readers (vt+0x14c).** Each reader:
1. stores n to +0x158c (first 0),
2. frees any old table,
3. allocates n·32 bytes (align 0x10, `[0x1832378]+0x3c` vt+0x1c),
4. zeroes it with `0x13ecbfc`,
5. sets `+0x1594` = the pointer, and +0x158c = n when the pointer is not null,
6. sets **`+0x158a = 1`**.

Each class is READ from its registration string (`0x4a32b0`.. pattern: the DTI's GOT slot next to the class-name string):

| reader | class (vtable) | n |
|---|---|---|
| `0xd6caf0` (alloc `0xd6cc3c`) | uShellEm010_sp_02 (`0x179f5c4`) | `0x4a14d8(S, [+0x1654])` |
| `0xf785ec` (`0xf786fc`) | uShellEm067_sp_02 (`0x17dee88`) | `0x4a14d8(S, [+0x1654])` |
| `0x10c2a50` (`0x10c2c78`) | uShellEm087_sp_58 (`0x1809574`) | `0x4a14d8(S, [+0x1654])` |
| `0x10c4924` (`0x10c4b4c`) | uShellEm088_sp_58 (`0x1809dec`) | `0x4a14d8(S, [+0x1654])` |
| `0x10316a8` (`0x10317f8`) | uShellEm081_04_02 (`0x17eda18`) | **3, fixed** (0x60 bytes) |
| `0x104ee78` (`0x104efac`) | uShellEm082_sp_02 (`0x17ef644`) | **3, fixed** |
| `0xdce00c` (`0xdce120`) | uShellEm020_04_02 (`0x17af970`) | **16, fixed** (0x200 bytes), only when the mode getter `0x4a0ee4` gives `(m \| 2) == 3`, i.e. modes 1 / 3 (`0xdce110..0xdce11c`); other modes return first, so +0x158a stays 0 |

- **The 0x4a14d8 readers** set nothing (+0x158a stays 0) when the count is 0 (`beq` past the block).
- The first five vtables carry base02's vt+0x18 `0x3fbaf8` and +0x150 `0x3fc610`. The last two (Em087 / Em088 sp_58) carry base58's `0x433844` / `0x433b0c`.
- `[+0x1654]` is hit 0 in each of these readers: it is stored from `0x4a23f4` at 0xd6cb68 / 0xf78664 / 0x10c49d0, and 0x10c2afc for Neset.
- **`0x4a14d8(S, idx)`** (READ, `0x4a14d8..0x4a1588`) counts the **j0 == 0x3f2 (1010)** records in hit `idx`'s hitsize group:
  - HDS rec = `[+0x1384]`'s hitdata (`0x489da4`) vt+0x44(idx), and the group is rec byte +0x19;
  - the group's records come from hitsize (`0x489df4`) vt+0x44(group): count +4, pointer list +8;
  - any null along the way gives 0.
  - That vt+0x44 is "get record i" is the same reading gapM made for `0x4a1bbc`.
- From the files (`gapM\hitshapes.json`), each group that has 1010 records has exactly three, j1 0 / 1 / 2, after one j0 1001 record. So n = 3 for every 0x4a14d8 class:
  - em010_00_shell02 groups 0 and 1
  - em067_00 g0
  - em087_00_shell58 g0
  - em088_00_shell58 g0
  - (em081_04 and em082_00/04 are the fixed-n classes, with 3 records in each group as well)
- em020_04_shell02 has **no** 1010 record, so its 16-entry table is never turned into a shape. (Who else might read that table, beyond the shapes arm, is not looked for.)

**Who fills it: the hit line, every state-1 move (READ, both functions end at `pop {...pc}`).** There are two copies of one code:
- base02 **`0x3fc1c8..0x3fc374`**, called from the move `0x3fbe60` after the stage query `0x3fc070` / +0x158 (rom-map row `0x3fbe60`).
- base58 **`0x4340fc..0x4342a8`**, called from +0x150 `0x433b0c` after `0x433fb4` (rom-map row `0x433a74`).

The steps:
1. If byte `+0x158a == 0`, it returns.
2. If **f32 `+0x1404` > 0**, it returns. `+0x1404` = slot 0 (`+0x13a8`) + 0x5c = **slot 0's delay** (gapM: H+0x5c, counted by 0x168d30). So the line waits out slot 0's delay without counting.
3. **`+0x1590 += 1`** (stored), and the function returns while it is **< 2** (unsigned). So the first counted move fills nothing.
4. If n = `+0x158c` is 0, it returns. Then `inv = 1 / f32(u32(n + 1))`.
5. The line uses four points:
   - E = `+0x40` (the end, after this move's ground cut);
   - A = `+0x1000` (the start);
   - E' = the end before this move: base02 `+0x1620` (the ray builder `0x3fc750` copies old +0x40 there at `0x3fc76c..0x3fc79c`), base58 `+0x1610` (spec §3.5 step 3);
   - A' = the start before: base02 `+0x1630` (old +0x1000, `0x3fc7ac..0x3fc7d4`), base58 `+0x1620` (`0x433968`).
6. dE = inv·(E' − E) and dA = inv·(A' − A). Each is a `vsub` followed by a `vmul`.
7. **For i = 0 .. n−1, with k = f32(i + 1):**
   - **entry i: p0 = E + dE·k, p1 = A + dA·k** (`vmla`), and +0xc = +0x1c = 0;
   - the loop stops early if `[+0x1594]` is null or `+0x158c <= i`.

**So the table holds n intermediate copies of the beam between last move's line and this move's line, entry 0 nearest the current beam.** The current beam is the group's j0 1001 capsule (+0x40 → +0x1000); last move's line itself is not included. The ROM run confirms all of this bit for bit: `hitline_check.mjs` reports 10 / 10 PASS.

**Every other `+0x1594` / `+0x158c` / `+0x1590` / `+0x158a` site:**
- `movw.py`: 53 hits.
  - The shell ones are: the ctor, the dtor, the seven readers, the two fillers, and 0x16dd2c.
  - The rest belong to other objects: 0x3c6a78 (strh), 0x44a70c / 0x44a770 (`sub r, r4, #0x1594`: a negative offset), 0x53af24, 0x53bfb4, 0x6af03c, 0x73fe24.., 0x8fa604.., 0xbe6a3c (`movt #3`), and 0xcd7fc0 / 0xcd8748.
- `ldst.py` scanned for the field offsets 0x58a / 0x58c / 0x590 / 0x594 reached as `add #0x1000` + imm: there are none.
- **Positive control**: the same movw scan finds the known consumer 0x16dd38 / 0x16dd48 / 0x16dd64 / 0x16dd74 and both known fillers.

### 2. The shape arm `0x16dd2c..0x16ddcc` (in 0x16da04; READ, re-read after gapM)

The descriptor `0x16d970` copies these from the HTS record:
- j0 → +0, **j1 → +2**, code → +4, radius (+0xc) → +8;
- the offsets → +0x10 / +0x20;
- flags bit 12 → +6.

It also sets the owner kind to +0x30 and s to +0x34.

The arm:
1. If desc +0x30 != 2 (not a shell), it goes to `0x16ddd4`.
2. byte `+0x158a` != 0, **u32 `+0x1590` >= 2** (`blo`), **s16 j1 >= 0**, **j1 < u32 `+0x158c`** (`bhs`), and `+0x1594` != 0 (and the entry address != 0).
3. **The radius = s·R**: `s22 · desc+8`, with s22 = desc +0x34 = H+0x14, ShellScale.
4. **p0 = entry +0..+8 and p1 = entry +0x10..+0x18, as they are** (`ldr r0,[r1,r0,lsl #5]!`). The arm shares the raw-point tail `0x16db84` (`sb = 2`), so **the shape is a type-2 capsule**, with no turn and no +0x40 added.
5. Any failed test goes to `0x16ddd0`: `desc+0x30 | 4 == 6` for a shell, so sb = 0, **no shape** (type 0, which `0x16b6cc` never tests).

### 3. Kinds 0xc / 0xd / 0x1e: `0x2f5bf0(player)` (READ; ROM-RUN control)

**The switch.** The pass (1) switch is `0x16ae44..0x16ae60` on kind − 8, a table of 0x3e words at `0x16ae64` (`add pc`, base 0x16ae64). It has four targets:

| entry | target | kinds |
|---|---|---|
| 0x120 | `0x16af84` (skip) | 8, 9, 0x34, 0x45 |
| −0xf4 | `0x16ad70` | the default arm: vt+0x270 == 0, then vt+0xb0 == 0 |
| −0x108 | `0x16ad5c` | **0xc, 0xd, 0x1e** |
| 0x1f8 | `0x16b05c` | 0x12, 0x13, 0x25..0x2f |

(Above 0x45 it also goes to `0x16ad70`.) Kind 0x41 (index 0x39) takes the default arm.

**The 0xc / 0xd / 0x1e arm.** `0x16ad5c`: `0x2f5bf0(player)`. Non-zero goes to **`0x16af74`, the `0x16b6cc` call itself, so these kinds skip the vt+0xb0 test**; zero goes to `0x16af84` (the next player).

**`0x2f5bf0` (`0x2f5bf0..0x2f5c30`; the next function `push` is at 0x2f5c34)** returns
`(u16 +0x2506 == 0x80) && (u16(+0x250a − 2) <= 0x11) && ((0x36d99 >> (+0x250a − 2)) & 1)`. That is 1 only for **action group 0x80 with action 2, 5, 6, 9, 0xa, 0xc, 0xd, 0xf, 0x10, 0x12 or 0x13**. The ROM run gives exactly that set for group 0x80, and nothing for groups 1 / 0x40.

**What it means for the passive proxy:**
- The player ctor `0x279efc` sets **+0x2506 = 1** and +0x2508 = 1 (`0x27a274..0x27a280`), and **+0x250a = 0xffff** (`0x27a284..0x27a288`). The setter `0x282960` keeps the old pair in +0x2508 / +0x250c.
- So a hunter in group 1 makes 0x2f5bf0 return 0. **A standing proxy hunter is never tested against kinds 0xc / 0xd / 0x1e**: no 0x16b6cc call, no H+6 latch, no history, no +0x31e0. The shell passes through him, and only its stage query can end it.
- INFERRED: that the standing idle is group 1 and not 0x80. Only the ctor's value is read; what group 0x80 is, is NOT READ.
- The shell records are kind 0xd ×3 (em002_00/02_01 r16, em002_04_01 r18). There are no shell records of kind 0xc or 0x1e.

### 4. Kind 0x41: `0x2a6640(player, H)` (READ; ROM-RUN control)

**In pass (1)**: kind 0x41 skips the `player+0x31e0` test (`0x16add0`). It still takes the history test, the area, the mask, the owner, the named target, and the default arm (vt+0x270 / vt+0xb0, which a passive hunter passes).

**In `0x16b6cc`**, the first shape that meets goes to `0x175b88` / `0x178694`. Both handlers test kind == 0x41 first (`0x175bac` / `0x1786c0`) and **tail-call `0x2a6640(player, H)` before any write**. So for kind 0x41:
- **no `H+6 = 2`**: 0x43ac8c sees no type 2;
- no H+0x20 contact, no H+0xb0 / +0xb4 / +0xac;
- **no `player+0x31e0 = 1`** (`0x175c18` / `0x178780` come after);
- **no history add `0x1702ec`** (`0x175c30` / `0x178798` come after).

0x16b6cc then goes on as usual: the `[r8+1]` bit-7 retry (0x178694 path only), owner vt+0x94 and target vt+0x98 (both `bx lr`, gapM), then its return. Because neither the frame flag nor the ring is set, **the same slot marks the hunter again on every frame the shapes still meet**.

**`0x2a6640` (`0x2a6640..0x2a66bc`; the next `push` is at 0x2a66c0):**
1. `player+0x296e = 0xffff`.
2. If H byte `+0x6d != 2`, it returns.
3. The owner is H+0xc when H byte `+0x10 == 1`, else H+0x70 when H byte `+0x6e == 1`, else it returns. If that owner is null, it returns.
4. **`player+0x296c = 1`, `player+0x296e = u16 [[owner+0x1428] + 0x1b6]`, `player+0x2970 = byte H+0x50`** (H+0x50 = HDS rec byte +0x18, `0x168ad0`).

**For a monster's shell:**
- **H+0x6d = 2** (READ). It is 0x168a2c's 4th stack argument (`0x168b64`, stored `0x168c2c`) = 0x4a1b24's second stack argument = vt+0x140's `[sp+4]`. Base00 `0x3f9b30..0x3f9b3c`, base01 `0x3fb1b4..0x3fb1c0` / `0x3fb200..0x3fb20c` and base02 `0x3fbac8..0x3fbadc` all pass `#2`, after `[sp] = 0x1f` (the mask).
- H+0x10 = 2 (a shell).
- **H+0x6e / H+0x70 are rewritten after the fill by 0x4a1b24 (`0x4a1c84..0x4a1cfc`)** from the owner `[[+0x136c]+0xc]`'s byte +0x1052:
  - 0 → +0x6e = 0;
  - **1 → +0x6e = 1**, +0x70 = the owner, and the attack +0x38 is scaled by `[owner+0x1428]+0x384`;
  - 2 → +0x6e = 3.
- So a monster's shell marks the hunter with **+0x296c = 1, +0x296e = the monster block's +0x1b6 halfword, +0x2970 = the record's +0x18 byte**. That a monster's +0x1052 is 1 is INFERRED: 0x43ac8c treats a player as 0.
- What reads +0x296c / +0x296e / +0x2970 is NOT READ. INFERRED: a hunter-side mark, which deals no damage.
- The ROM run of 0x2a6640 on a fake slot (H+0x6d 2, H+0x6e 1, block +0x1b6 = 0x1234, H+0x50 = 7) gives exactly +0x296c 1, +0x296e 0x1234, +0x2970 7. With H+0x6e 0 or H+0x6d 1: only +0x296e = 0xffff.

**For the viewer: a kind-0x41 slot never latches, never ends or reflects the shell, and never blocks another slot that frame.** Its only effect is on the hunter. The records: em058_00_01 r8, em081_00_01 r16, em081_04_01 r16 / r17, em083_00_01 r5, em083_04_01 r5 / r10.

### 5. A gap found on the way (READ; not part of the two refusals)

**`hunterPass` skips every base02g beam with no refusal.** Its `const def = (S.D57 || D).shells[S.shell]` finds nothing for `S.shell === 'beam'` (`if (!def) continue;`). So none of the 1010 beams except Ahtal-Neset's sp_58 can reach the new arm. Getting them there needs:
- the beam's folder (e.g. `shell\em\em010_00_shell02`);
- its mode's **hit 0** (the .shl HitParam 0, which base02's init registers as **slot 0 only**: `0x3fbab0..0x3fbae4` passes `[+0x1654]`, slot r1 = 0, mask 0x1f, +0x6d 2);
- its scale.

`render/beam-types.js` rows carry none of these: no `folder` and no `hit`. They have to come from the lane's .shl exporter. Until then, the JS below names the refusal.

Separately, `hunterPass` makes `S.hslots` at its first pass without stepping them. The ROM's first pass after the registration does step them (0x168d30 runs before the test), so the viewer is one frame late on a delayed slot. Not changed below; noted for the lane.

## (b) Exact JS for docs/render/shells.js (anchors by text)

### b1. The table, its readers, the hit line, slot 0's delay

Insert above `// 0x169290 -> 0x16d970 -> 0x16da04 for a shell (kind 2): its hitsize group's shapes at the manager's pass`:

```js
// ---- THE SEGMENT TABLE (+0x158a on, +0x158c n, +0x1590 the hit line's count, +0x1594 n x 32 bytes: p0 +0, p1 +0x10; the ctor
// 0x4a0bf0..0x4a0c10 zeroes all four) -- hitsize j0 1010's capsules (0x16dd2c). gapN RESULT a1 / a2; ROM-run hitline_check.mjs.
// Who allocates it: the class's reader (vt+0x14c), n zeroed entries and +0x158a = 1; 'count' = 0x4a14d8(S, hit 0): the j0 0x3f2
// records of hit 0's hitsize group (0 -> no table, +0x158a stays 0)
const SEG_TABLE = {
  uShellEm010_sp_02: 'count',                      // 0xd6caf0 (0xd6cc28)
  uShellEm067_sp_02: 'count',                      // 0xf785ec (0xf786f4)
  uShellEm087_sp_58: 'count',                      // 0x10c2a50 (0x10c2c68)
  uShellEm088_sp_58: 'count',                      // 0x10c4924 (0x10c4b3c)
  uShellEm081_04_02: 3,                            // 0x10316a8: 0x60 bytes, always
  uShellEm082_sp_02: 3,                            // 0x104ee78: 0x60 bytes, always
  uShellEm020_04_02: m => ((m | 2) === 3 ? 16 : 0),  // 0xdce00c: 0x200 bytes when the mode getter 0x4a0ee4 | 2 == 3 (no 1010 record uses it)
};
function segTable(cls, modeIndex, hitsize, rec0){
  const how = SEG_TABLE[cls];
  if (how == null) return null;                                                // no reader allocates one: +0x158a stays 0
  let n;
  if (how === 'count'){                                                        // 0x4a14d8..0x4a1588
    const g = rec0 && hitsize && hitsize[rec0[3]];
    n = g ? g.filter(r => r && r.j0 === 1010).length : 0;
  } else n = typeof how === 'function' ? how(modeIndex >>> 0) : how;
  if (!n) return null;                                                         // the reader returns before the block
  return { on: true, n, calls: 0, e: Array.from({ length: n }, () => ({ p0: [f(0), f(0), f(0)], p1: [f(0), f(0), f(0)] })) };
}
// slot 0's delay H+0x5c (+0x1404) as the last manager pass left it; before any pass, the registration's s16 record +0 (0x168a74)
function slot0Delay(S, hitrec){
  const sl = (S.slots || S.hslots || []).find(x => x.slot === 0);
  if (sl) return sl.delay;
  const mh = (S.mode && S.mode.hit) || (S.type && S.type.hit) || [], idx = mh[0];
  return idx != null && idx >= 0 && hitrec && hitrec[idx] ? f(hitrec[idx][0]) : f(0);
}
// THE HIT LINE: base02 0x3fc1c8 (E' +0x1620, A' +0x1630) / base58 0x4340fc (E' +0x1610, A' +0x1620), after the move's stage query.
// n copies of the beam between last move's line (E' -> A') and this one (+0x40 -> +0x1000): entry i at k = i + 1 of n + 1
function hitLine(S, oldEnd, oldStart, delay0){
  const T = S.segs;
  if (!T || !T.on) return;                                                     // byte +0x158a
  if (delay0 > 0) return;                                                      // f32 +0x1404 > 0: no count
  T.calls = (T.calls + 1) >>> 0;                                               // +0x1590 += 1, stored first
  if (T.calls < 2 || !T.n) return;                                             // blo #2 / +0x158c == 0
  const inv = f(1.0 / f(T.n + 1)), P = S.position, A = S.anchor;              // vcvt.f32.u32 (n + 1), vdiv
  const dE = [0, 1, 2].map(i => f(inv * f(oldEnd[i] - P[i])));                // s10 / s8 / s6
  const dS = [0, 1, 2].map(i => f(inv * f(oldStart[i] - A[i])));              // s4 / s2 / s0
  for (let i = 0; i < T.n; i++){
    const k = f(i + 1);
    T.e[i] = { p0: [mla(P[0], dE[0], k), mla(P[1], dE[1], k), mla(P[2], dE[2], k)],     // +0..+8 (+0xc = 0)
               p1: [mla(A[0], dS[0], k), mla(A[1], dS[1], k), mla(A[2], dS[2], k)] };   // +0x10..+0x18 (+0x1c = 0)
  }
}
// 0x2f5bf0(player): action group +0x2506 == 0x80 and action +0x250a in {2 5 6 9 10 12 13 15 16 18 19} (mask 0x36d99 from 2)
const pl2f5bf0 = (group, act) => { const d = (act - 2) & 0xffff; return group === 0x80 && d <= 0x11 && ((0x36d99 >>> d) & 1) === 1; };
```

### b2. The 1010 arm (refusal 1)

In `shellHitShapes`, replace the line
`    } else if (r.j0 === 1010) return { why: 'hitsize j0 1010: the shell segment table +0x1594 (0x16dd2c) not transcribed' };`
with:

```js
    } else if (r.j0 === 1010){                                                 // 0x16dd2c..0x16ddcc: entry j1 of the table +0x1594
      const T = S.segs, j = (r.j1 << 16) >> 16;                                // ldrsh desc+2
      if (T && T.on && T.calls >= 2 && j >= 0 && j < T.n && T.e[j])           // +0x158a, +0x1590 >= 2, j1 < +0x158c, +0x1594
        out.push({ type: 2, p0: T.e[j].p0.slice(), p1: T.e[j].p1.slice(), r: R });   // world points as they are (tail 0x16db84)
      // otherwise none: 0x16ddd0, a shell's desc+0x30 (2) | 4 == 6 -> type 0
    }
```

In the same function, so that a base02g beam's ShellScale is its type's:
replace `  const s = f(S.mode && S.mode.scale != null ? S.mode.scale : 1.0);          // H+0x14 = ShellScale (0x4a1c3c..0x4a1c80)` with

```js
  const s = f(S.mode && S.mode.scale != null ? S.mode.scale : S.type && S.type.scale != null ? S.type.scale : 1.0);   // H+0x14 = ShellScale (0x4a1c3c..0x4a1c80)
```

### b3. Making the table and running the hit line

**base58 (Neset's sp_58, and Ka's when built).**

In `make087s58`, after its `const S = { ... }` statement (inside make087s58 it is the line ending `place: null, place2: null, stop: null, stop2: null, unitScale: f(mode.scale) };`; four other makers end with `unitScale: f(mode.scale) };` too), add:

```js
  { const HS = HITSHAPES[def.folder] || {}, h0 = (mode.hit || [])[0];
    S.segs = segTable(def.cls, m, HS.hitsize, HS.hitrec && h0 != null && h0 >= 0 ? HS.hitrec[h0] : null); }   // the reader 0x10c2a50
```

In `step58`, insert directly before `  S.place = S.effect ? { param: 0, position: S.anchor.slice(), rotationDeg: S.angles.map(w => f(f(w >>> 0) * U16_TO_DEG)) } : null;`:

```js
  hitLine(S, S.prev, S.anchorOld || S.anchor, slot0Delay(S, (HITSHAPES[S.folder] || {}).hitrec));   // 0x4340fc: E' +0x1610, A' +0x1620
```

`S.prev` is old +0x40 (`S.prev = S.position.slice()` before the new end), and `S.anchorOld` is old +0x1000 (`follow()`), which are exactly +0x1610 and +0x1620.

**base02g beams.**

In **both** ray builders, `ray02g` and `ray02real`, add after their `S.prevEnd = S.position ? S.position.slice() : null;` line (each one ends `// +0x1620: the end before this rebuild`):

```js
  S.prevAnchor = S.anchor ? S.anchor.slice() : null;                            // +0x1630..: the start before this rebuild (0x3fc7ac..0x3fc7d4)
```

In `step02g`, insert directly before `  const a = angles02(S);                                                        // 0x3fc378` (step02g's own line, after the `} else if (S.effect2){` block; the other `angles02` line, which ends `// 0x3fc378: at the origin, while held`, is not this one):

```js
  hitLine(S, S.prevEnd || S.position, S.prevAnchor || S.anchor, slot0Delay(S, (HITSHAPES[S.type.folder] || {}).hitrec));   // 0x3fc1c8
```

In `spawnBeam` and `spawnBeamReal`, after each `const S = { ... };` (the two lines ending `effects: [], hit: null };`), add:

```js
  { const HS = HITSHAPES[t.folder] || {}, h0 = (t.hit || [])[0];
    S.segs = segTable(t.cls, t.mode, HS.hitsize, HS.hitrec && h0 != null && h0 >= 0 ? HS.hitrec[h0] : null); }   // the class's reader
```

The fixed-n classes (Em081_04 / Em082) get their table even without `folder` / `hit`. The 'count' classes (Em010 / Em067) get none until beam-types.js carries them (a5).

### b4. hunterPass: the beams, kinds 0xc / 0xd / 0x1e, kind 0x41 (refusal 2 and the 0x41 refusal)

1. Replace `    const def = (S.D57 || D).shells[S.shell];` and the `    if (!def) continue;` after it with:

```js
    const def = S.base === 'base02g' ? (S.type && S.type.folder ? { folder: S.type.folder } : null) : (S.D57 || D).shells[S.shell];
    if (!def){ if (S.base === 'base02g') out.refused.push({ beam: S.type && S.type.id, why: 'hunter pass: the beam type has no folder / hit 0 (render/beam-types.js; base02 registers slot 0 from hit 0, 0x3fbab0)' }); continue; }
```

2. Replace `        const mh = (S.mode && S.mode.hit) || [];` with:

```js
        const mh = (S.mode && S.mode.hit) || (S.base === 'base02g' && S.type && S.type.hit ? [S.type.hit[0]] : []);   // base02: slot 0 only
```

3. Replace `  const H = state.hunter || (state.hunter = { ring: new Array(20).fill(0xffff), k: 0 });   // player +0x31e4` with:

```js
  const H = state.hunter || (state.hunter = { ring: new Array(20).fill(0xffff), k: 0,      // player +0x31e4
    group: 1, action: 0xffff, mark: null });          // +0x2506 / +0x250a: the ctor's (0x27a274..0x27a288); the idle's own: NOT READ
```

4. Replace the two lines
   `      if (kind === 0x41){ out.refused.push({ shell: S.shell, id: S.id, why: 'hunter pass: kind 0x41 -> 0x2a6640 not read' }); continue; }`
   `      if (struck) continue;                                                    // 0x16add8..0x16ade4`
   with:

```js
      const mark = kind === 0x41;                                              // 0x16add0: exempt from +0x31e0
      if (!mark && struck) continue;                                           // 0x16add8..0x16ade4
```

5. Replace
   `      if (kind === 0xc || kind === 0xd || kind === 0x1e){ out.refused.push({ shell: S.shell, id: S.id, why: 'hunter pass: kind ' + kind + ' needs 0x2f5bf0(player), not read' }); continue; }`
   with:

```js
      if ((kind === 0xc || kind === 0xd || kind === 0x1e) && !pl2f5bf0(H.group, H.action)) continue;   // 0x16ad5c (then no vt+0xb0 test)
```

6. Inside the shape loop, replace
   `        struck = true;                                                         // 0x175c1c / 0x178784`
   with:

```js
        if (mark){                                                             // 0x175bac / 0x1786c0 -> 0x2a6640(player, H), before any write:
          H.mark = { by: S.shell, id: S.id, block1b6: null, rec18: null };       // +0x296c = 1, +0x296e = [[H+0x70]+0x1428]+0x1b6, +0x2970 = HDS +0x18
          if (S.events) S.events.push({ ev: 'hunter-mark', slot: sl.slot });   // (H+0x6d 2: base00 / 01 / 02; H+0x6e 1: a monster owner, INFERRED)
          break;                                                               // no H+6 / H+0x20, no +0x31e0, no history: again next frame
        }
        struck = true;                                                         // 0x175c1c / 0x178784
```

`block1b6` and `rec18` are null: the viewer has neither the monster block's +0x1b6 nor the HDS byte +0x18 (`gapM\hitshapes_export.py` exports bytes +0 / +2 / +6 / +0x19 only). Both are display-only, since the shell is unaffected.

### b5. Nothing else changes

- `collide()` and the landings are unchanged. A kind-0x41 or kind-0xd slot never sets `S.hunterHit`.
- The 1010 capsules only add to a meeting slot's shapes. The first shape that meets still sets `S.hunterHit` and the ring, as today.

## (c) rom-map rows (to add; the coordinator or the shells lane writes them)

| address / range | what | owner | status | detail |
|---|---|---|---|---|
| `0x4a0bf0..0x4a0c10` / `0x4a0de8..` | enemy-shell ctor: +0x158a / +0x158c / +0x1590 / +0x1594 = 0 (the segment table); dtor frees +0x1594 (`[0x1832378]+0x3c` vt+0x34) | enemy-shell base | R | gapN a1 |
| `0xd6caf0` / `0xf785ec` / `0x10c2a50` / `0x10c4924` (readers) | Em010_sp_02 / Em067_sp_02 / Em087_sp_58 / Em088_sp_58: n = `0x4a14d8(S, [+0x1654] hit 0)`; n > 0 → table n×32 zeroed (`0x13ecbfc`) → +0x1594, +0x158c = n, **+0x158a = 1** | those classes | R (class by registration string) | gapN a1 |
| `0x10316a8` / `0x104ee78` / `0xdce00c` (readers) | Em081_04_02 / Em082_sp_02: n = 3 always; **Em020_04_02: n = 16 only when mode getter `0x4a0ee4` \| 2 == 3** (no 1010 record in its file) | those classes | R | gapN a1 |
| `0x4a14d8` | count of hitsize records with j0 == 0x3f2 (1010) in hit idx's group (HDS +0x19); 0 on any null | enemy-shell base | R (vt+0x44 = "record i": I, as 0x4a1bbc) | gapN a1 |
| `0x3fc1c8..0x3fc374` (base02) / `0x4340fc..0x4342a8` (base58) | **THE HIT LINE**: +0x158a set, slot 0's delay `+0x1404` <= 0, `+0x1590 += 1` (>= 2), n = +0x158c: entry i (k = i + 1) p0 = +0x40 + k/(n+1)·(E' − +0x40), p1 = +0x1000 + k/(n+1)·(A' − +0x1000); E' / A' = base02 +0x1620 / +0x1630 (0x3fc750's copies), base58 +0x1610 / +0x1620 | base02 / base58 | R; ROM-RUN 10/10 | gapN a1; `gapN\hitline_check.mjs` |
| `0x16dd2c..0x16ddcc` (in 0x16da04) | j0 1010: shell (desc+0x30 2), +0x158a, **+0x1590 >= 2**, s16 j1 in [0, +0x158c), +0x1594 → type-2 capsule = entry j1's world p0 / p1 as they are, r = s·R; else `0x16ddd0` → type 0 | hit manager | R | gapN a2 (upgrades row `0x16da04`'s 1010 clause) |
| `0x16ae44..0x16ae60` / table `0x16ae64` (0x3e words, base 0x16ae64) | pass (1) kind − 8 switch: 0x120 → skip (8, 9, 0x34, 0x45); −0x108 → `0x16ad5c` (0xc, 0xd, 0x1e); 0x1f8 → `0x16b05c` (0x12, 0x13, 0x25..0x2f); −0xf4 → `0x16ad70` (the rest, 0x41 included) | hit manager | R | gapN a3 |
| `0x16ad5c` / `0x2f5bf0` | kinds 0xc / 0xd / 0x1e: `0x2f5bf0(player)` != 0 → `0x16af74` (0x16b6cc, **no vt+0xb0 test**); 0x2f5bf0 = +0x2506 == 0x80 && +0x250a ∈ {2,5,6,9,10,12,13,15,16,18,19} (mask 0x36d99) | hit manager / uPlayer | R; ROM-RUN | gapN a3. Group 0x80's meaning NR |
| `0x279efc` (`0x27a274..0x27a288`) / `0x282960` | player ctor: +0x2506 = 1, +0x2508 = 1, +0x250a = +0x250c = 0xffff; `0x282960` = the action setter (old pair → +0x2508 / +0x250c) | uPlayer | R | gapN a3 (passive proxy: group 1, I) |
| `0x175bac` / `0x1786c0` → `0x2a6640..0x2a66bc` | kind 0x41: both hunter handlers tail-call `0x2a6640(player, H)` BEFORE H+6 / H+0x20 / +0x31e0 / history; it sets +0x296e = 0xffff, then (H+0x6d == 2, owner = H+0x10 == 1 ? H+0xc : H+0x6e == 1 ? H+0x70 : none) +0x296c = 1, +0x296e = [[owner+0x1428]+0x1b6], +0x2970 = H+0x50 | hit manager / uPlayer | R; ROM-RUN | gapN a4. Readers of +0x296c.. NR |
| `0x168b64` / `0x168c2c`; vt+0x140 `[sp+4]` | H+0x6d = 0x168a2c's 4th stack arg = 0x4a1b24's arg 1 = vt+0x140 `[sp+4]`: **2** at base00 `0x3f9b30`, base01 `0x3fb1b4` / `0x3fb200`, base02 `0x3fbac8` | shell bases | R | gapN a4 |
| `0x4a1c84..0x4a1cfc` (in 0x4a1b24) | after the fill: owner `[[+0x136c]+0xc]` byte +0x1052: 0 → H+0x6e 0; 1 → H+0x6e 1, H+0x70 = owner, attack +0x38 × `[owner+0x1428]+0x384`; 2 → H+0x6e 3 (H+0x70 the owner in each) | enemy-shell base | R (1 = monster: I) | gapN a4 |
| `0x3fbab0..0x3fbae4` (base02) | registration: vt+0x140(slot **0**, `[+0x1654]` hit 0, −1, 1.0, mask 0x1f, 2, id) — a beam has one slot | base02 | R | gapN a5 |
| tooling: `gapN\movw.py` / `ldst.py` / `emu_hitline.py` + `hitline_check.mjs` / `emu_2f5bf0.py` | movw-immediate and offset scans; unicorn runs of the two hit lines, 0x2f5bf0 and 0x2a6640 | — | — | controls: the movw scan finds 0x16dd2c's four loads; hitline 10/10 PASS incl. first-call / delay / off |

**WITHDRAWN / corrected (keep the old row, mark it):**
- Row `0x4340fc` / `0x4342ac` (base58) says "the hit line (+0x158c capsules from +0x1000 / +0x1620 to +0x40 / +0x1610 ... (+0x1590 counts): not visual". **+0x158c is the entry count, not the capsules.** The capsules are the 32-byte entries at `[+0x1594]`, and each runs between interpolated END points (p0, from +0x40 toward +0x1610) and interpolated START points (p1, from +0x1000 toward +0x1620). They are also not merely "not visual": they are the hunter-pass shapes of HTS j0 1010. Correction: row `0x3fc1c8 / 0x4340fc` above.
- shells.js's refusals "hitsize j0 1010: the shell segment table +0x1594 (0x16dd2c) not transcribed", "kind 0xc/0xd/0x1e needs 0x2f5bf0(player), not read" and "kind 0x41 -> 0x2a6640 not read" are retired by b2 / b4.
