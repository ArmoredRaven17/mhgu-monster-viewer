# gapM: where contact type 2 comes from, and the shell-vs-hunter test (2026-10-22, ROM-decode helper, shells lane)

Tools: `gapM\w.py <hex> <n>` (word-by-word disassembly of main.text with PIC literals; jump tables survive),
`gapM\calls.py <hex..>` (every b/bl to a target), `gapM\imm.py lo hi pat` (linear mnemonic grep), `gapM\vt.py dti,.. slots`
(vtables by getDTI), `gapM\strref.py` (PIC string refs), `gapM\hitshapes_export.py` -> `gapM\hitshapes.json` (every shell
folder's HDS records and HTS groups: 294 folders), `gapM\plpose.py` (the hunter skeleton's joints from the Armor Viewer glb).
Disassembly dumps: `gapM\d*.txt`.

## (a) READ facts

### 1. The chain that produces contact type 2 (READ to the instruction)

**Type 2 is not passed to +0x150 by the hit manager. It is a one-frame latch in the shell's hit slot 0, which the
shell's own stage query 0x43ac8c returns as type 2 on its next move.**

1. **Registration, every frame.** Base vt+0x2c `0x4a16f4` (owner unit in state 1 / 2, else delete via vt+0x40): slot 0
   (`+0x13a8`) and slot 1 (`+0x1460`) through their vt+0x1c `0x169278`, which tail-calls `0x16b450`. That function pushes the
   slot at the FRONT of `mgr+0x2020` (`H+0x2c` = the old head) only when `H+5` is set and `H+0x84` (the hitsize) is non-null.
   The list is cleared each frame by `0x16a664` (when not paused). The slot object H has vtable `0x1737ad4`, built by the
   ctor `0x16833c`, which the enemy-shell ctor `0x4a0b28` calls for +0x13a8 and +0x1460.
2. **The registration call itself**: base00 +0x164 `0x3f9aec` calls vt+0x140 `0x43a8b0`, then `0x4a1b24`, then
   `0x168a2c(H, 2, shell, HDS rec, [hitsize res, group, mask, +0x6d])`. It writes H+0xc = owner = the shell, H+0x10 = 2,
   H+5 = 1, H+0x34 = id from `0x16b4b4`, H+0x3a = kind = HDS rec byte +6 (0 becomes 1), H+0x84 = hitsize, H+0x88 = group,
   H+8 = mask, H+7 = the owner's area byte `+0x1054`. Details:
   - `0x16b4b4`: the u16 at `mgr+0x202c`, +1 each time, wrapping to 0 above 59999.
   - The group is HDS rec byte `+0x19` when r3 = -1 (`0x4a1bbc`). Base00 passes -1.
   - The mask is the vt+0x140 stack argument: base00 passes `0x1f`, base28 `0x410c80` passes `0x1f`.
   - `0x4a1c18..0x4a1c2c` overwrites the id with the registration's last argument (base00 `+0x1588`) when that argument
     is not 0xffff.
   - Scale H+0x14 = ShellScale. `0x4a1c3c..0x4a1c80` reads `[[shl] vt+0x40] +0x10 [owner block byte +8] +4`, keeping the
     ctor's 1.0 when the entry is null. The identification ShellInfoList / mode / cShellInfo +4 = ShellScale is INFERRED
     from shells.js's class layout note.
   - The gate `0x4a1ad8` = the shell's .shl names BOTH a hitdata (`[+0x1384]+0xbc`, `0x489da4`) and a hitsize
     (`+0xc0`, `0x489df4`). This retires shells.js's "0x4a1ad8 (taken to pass)".
3. **The hit manager's move** `0x16a6ac` (a vtable slot at data `0x1737bf8`). It is gated on `[0x211f764]+0x60 / +0x64`
   (pause) and `0x3f79c8(..) == 1`, then runs `0x16a740`, `0x16acf0`, `0x17bcb0` in order.
   - **`0x16a740`, for every attacker in `mgr+0x2020`:**
     - It first calls H vt+0x18 = **`0x168d30`**, the slot step. **Its first store is `H+6 = 0xff` (`0x168d40`)**, then
       it counts delay and duration down by `[0x211f764]+0x68`. **This answers shells.js's "who calls 0x168d30": the hit
       manager, once per frame, for each registered slot.**
     - If `0x168ebc` passes (`H+5 != 0 && H+0x5c (delay) <= 0`), it calls `0x169290`, which writes the shapes into the
       table `mgr+0x2030 + 32k` (64 entries, count at `+0x2830`; H+0x1c = the first index).
   - **Then the hunters' hurt shapes**: players 0..3 from `0x276290`, for each one with vt+0x88 == 1 and
     `0x2a6034 == 0` (`+0x2506 != 0x100`). It calls player vt+0x36c and stores the result as type 2 (capsule) into
     `mgr+0x1c + 32k` (256 entries, count at `+0x201c`). The index goes to `player+0x3260`, or -1 when the table is full.
   - **`0x16acf0`, pass (1), the hunters**: for each attacker with `0x168ebc` == 1, for players i = 0..3, when ALL of
     these hold, it calls `0x16b6cc(mgr, H, player)`:
     - the player exists, vt+0x88 == 1, and `0x2a6034 == 0`;
     - (`H+0x3a == 0x41` or `player+0x31e0 == 0`): one hit per frame;
     - `0x16b5e0(.., player+0x31e4, H+0x34) == 0`: the history;
     - `H+7 == player+0x1054`: the area;
     - `H+8 & 1`: the mask;
     - `0x168ee4 == 0`: not its owner (H+0xc / H+0x70), unless `H+0x30 & 0x40`;
     - `0x16940c == 1`;
     - the kind switch on H+0x3a (table at `0x16ae64`):
       - kinds 8 / 9 / 0x34 / 0x45 → never;
       - kinds 0xc / 0xd / 0x1e → only when `0x2f5bf0(player) != 0`;
       - kinds 0x12 / 0x13 / 0x25..0x2f → only when player vt+0xb0 == 0;
       - every other kind (including all kinds below 8) → only when player vt+0x270 == 0 and vt+0xb0 == 0.
   - **`0x16b6cc`**:
     - The hunter's capsule is the table entry `[player+0x3260]`, used only when its type is 2 and the index is
       <= 0xff. Its layout is p0 +0x24, p1 +0x30, r +0x20.
     - It loops over the attacker's shapes in hitsize-list order. Each shape's table entry is `mgr+0x2030+32(H+0x1c+j)`,
       with the type at +0, r +4, p0 +8, p1 +0x14.
     - The test depends on the shape's type: type 1 → `0x167d2c`, type 2 → `0x1676f0`, type 3 → `0x167f70` (NOT READ).
     - The **first shape that meets** goes to `0x27c230(player) ? 0x175b88 : 0x178694` (+0x13cc bit 2). Both handlers
       write the slot: **`H+6 = 2`** (`0x175be8` / `0x178750`), `H+0xb0 = player`, `H+0xb4 = 0` (`0x1698d8`),
       `H+0xac = 0`, and **`H+0x20..+0x28` = the test's contact point**. Kind 0x41 instead tail-calls `0x2a6640` at once
       (no H+6 write).
     - Then `player+0x31e0 = 1` and the history add `0x1702ec` run. `0x178694` restores H+6 / +0x20 / +0xac / +0xb0
       when bit 0x8000 of its 24-bit word at `[r6]` is set (`0x179264..0x1792b4`). What r6 is there is not read; it is
       INFERRED clear in play.
     - Then the owner's vt+0x94(shell, H, player, 0) runs; base00 / base57 have `0x6bb1c` = `bx lr` there.
     - Then the player's vt+0x98(player, H, owner, kind) runs; uPlayerQuest has `0x713c8` = `bx lr` there.
     - Then it returns. If player byte `+0x274a` bit 7 is set after `0x178694`, it tries the next shape instead.
4. **The shell's next move** runs `0x43ac8c`, which is shells.js `collide()`. Its hunter arm is
   `0x43acb0..0x43ad2c`:
   - The test is `byte +0x13ae` (slot 0's H+6) `!= 0xff`. **Slot 1's byte +0x1466 is never read here.**
   - If the target `[+0x1458]` (H+0xb0) exists, its byte `+0x1052 == 0`, and `0x2a8de4(target) != 0`, the arm is
     skipped. `0x2a8de4` returns 1 when player `+0x2506 == 1` and `+0x250a` is one of
     0xab 0xac 0xad 0xc1 0xc2 0xc9 0xca 0xcb 0xe5 0xe6 0xe7; otherwise it returns vt+0x270.
   - Otherwise: `out = (+0x13c8, +0x13cc, +0x13d0, 0)`, `*type = 2`, return value 1. The query's result struct is not
     written, so it has no normal or attributes.
   - Then, if byte `+0x15c1 == 0`, it returns. Otherwise the stage query still runs: a stage hit overwrites the point and
     the type (0 / 1 by slope), and a stage miss keeps type 2.
   - The caller then reaches +0x150 with type 2. For base00 that is `0x3f9a70` in +0x168 `0x3f99e0`, reached from the move
     `0x3f9738`.
   - Every caller of 0x43ac8c (`calls.py`): 0x3f9a70, 0x3fc10c, 0x400f40, 0x402b08, 0x4037d8, 0x405334, 0x406db4,
     0x40d474, 0x40ec04, 0x411dcc, 0x416040, 0x419d8c, 0x41bd4c, 0x4201b8, 0x423ed8, 0x424078, 0x425920, 0x42676c,
     0x42be6c, 0x42e714, 0x434044, 0x104eaa8.
5. **Code that reads `+0x13ae` itself** (its own hunter arms; only `0x10c27b4` was read before, rom-map R). These
   functions are NOT READ here: 0x3feb38, 0x410bd0 (base28), 0x41da60, 0x41e6fc, 0x43d604, 0x104ec34, 0x10c375c,
   0x10c3c98, 0x10c42fc, 0x10dab9c, 0x10daf9c. (`imm.py 40000 1100000 "#0x13ae"` also lists the 0x44xxxx–0x49xxxx band:
   NOT READ, and not mapped to classes.)
6. **The "+0x98 hit callbacks" are the TARGET side.** Every hit handler calls `target vt+0x98(target, H, owner, kind)`
   and `owner vt+0x94(owner, H, target, k)`:
   - the hunter pass at `0x16bab4`;
   - the enemy pass `0x16bc54` at `0x16c514`;
   - pass (3), `0x16c57c` over set `0x258b44`, at `0x16caa8`;
   - the attack-vs-attack pass `0x16cabc` at `0x16cf84`.

   So base57's `0x430714` and Tetsucabra sp_16's `0xf65ac8` run when the SHELL is struck, through its own hurt object or
   a clash. They do not run when it strikes a hunter, so a passive proxy never fires them. (base57's vtable `0x1809c94`:
   +0x94 `0x6bb1c`, +0x98 `0x430714`.) The clash also writes `H+6 = 0` (`0x16cfa4`), and 0x43ac8c reads that as type 2 too.
7. **The other writers of H+6** in the hit band (`imm.py 165000 180000`, ~40 sites: the enemy-pass handlers
   `0x1704fc` → `0x170ee4` / `0x172784` / `0x1735b8` / `0x1747a0`) write other values. 0x43ac8c tests only `!= 0xff`, so a
   shell striking a monster also lands as type 2 (the values are not enumerated here).

### 2. The shell's attack shape (READ)

`0x169290` builds the shapes: `0x16d970` turns each hitsize record into a descriptor, `0x16da04` builds the shape (for
kind 2 the unit is the shell: position `+0x40`, angle words `+0xfe8 / +0xfec / +0xff0` as u32 × 2π/65536, scale s =
H+0x14), and `0x17023c` stores it.

**HTS layout**: header `HTS\0` v`0x20131015`, then the group count at +8 and a table at +0x10 of (u32 count, u32 offset).
Each record is 0x30 bytes:

| offset | field |
|---|---|
| +0 | u16 j0 |
| +2 | u16 j1 |
| +4 | u16 code |
| +6 | u16 flags (bit 12 → desc+6) |
| +0xc | f32 radius |
| +0x10 | vec off0 |
| +0x20 | vec off1 |

**The shapes by j0:**

| j0 | records | shape | where |
|---|---|---|---|
| **1001** | 357 | **capsule from shell +0x40 to +0x1000 (the anchor), r = s·R.** The code is not consulted. j1 == 2001 would add offsets, but no shell file has it | `0x16e000..0x16e18c` |
| **255**, code 0 | 489+9 | **sphere, centre = +0x40 + M·(s·off0), r = s·R** | `0x16e270`; order-4 arm `0x16f808..0x16f9b4` |
| 255, codes 1 / 2 | ~150 | **capsule, p0 = +0x40 + M·(s·off0), p1 = +0x40 + M·(s·off1), r = s·R** | `0x16dc10`; order-4 arm `0x16f060..0x16f0f0`, tail `0x16f17c..0x16f254` |
| 255, codes 3 / 5 | — | none | — |
| 255, codes 4 / 6 | 24 | type 3 (its build and its test `0x167f70` are NOT READ). Records: em002_04_01 g15 / g19, em025_00_39 g1, em032_04_01 g6 / g7, em045_00_01 g2 / g4, em049_00_01 g0 / g1 / g3, em057_04_01 g6 / g7 (code 4) and g3 / g11 / g12 (code 6), em063_00/05_35 g1 / g3, em069_00_01 g0, em084_00_01 g1, em001_04_01 g15 / g19 (code 6), em088_00_57 g2 (code 6) | — |
| **1010** | 27 | capsule = **segment j1 of the shell's own table `[+0x1594]`** (32-byte entries p0 / p1; only when byte `+0x158a`, `+0x1590 >= 2`, and `j1 < +0x158c`), r = s·R; otherwise none. These are the beams (em010_00_02, em067_00_02, em081_04_02, em082_00/04_02, em087_00_58, em088_00_58). The table is not in shells.js | `0x16dd2c..0x16ddcc` |
| any other | — | (a joint on the shell model) not in any shell file | `0x16ddd0` |

**M is chosen by the unit's halfword +0x38.**
- The uCoord ctor `0x8a46a0` stores the word `0x00030004` at +0x38 (`0x8a4728..0x8a4730`), so **+0x38 = 4** (READ).
- No store to a shell's +0x38 was found. The scan was linear, over `str*` with `#0x38]` in 0x3f8000..0x440000,
  0x4a0000..0x4a3000 and 0x538000..0x53b000, and every hit was another object. **4 for every shell is INFERRED.**
- **Order 4 = turn Z, then X, then Y**, with rows (x', y', z' of the row vector o·M):
  - r0 = (cy cz + sx sy sz, cx sz, sx sz cy − sy cz)
  - r1 = (sx sy cz − sz cy, cx cz, sx cy cz + sy sz)
  - r2 = (sy cx, −sx, cx cy)
- Order 0, `0x16dc98`, is rotXYZ exactly. It is checked algebraically and is not used by shells.

The shell's HDS (`HDS\0` v`0x20160209`) records are 0x38 bytes from +0x10. Kinds across every shell record: 1 / 2 / 3 / 5 /
6 / 7 / 0xb / 0x12 / 0x13 / 0x15 / 0x16 / 0x1f / 0x2a / 0x2f / 0x30 / 0x31 / 0x38 / 0x3c..0x3e / 0x42 / 0x48 all take
the vt+0x270 / vt+0xb0 arms. There are **no kinds 8 / 9 / 0x34 / 0x45**. Kind **0xd** has 3 records (em002_00/02_01 r16,
em002_04_01 r18), and kind **0x41** has 7 (em058_00_01 r8, em081_00_01 r16, em081_04_01 r16 / r17, em083_00_01 r5,
em083_04_01 r5 / r10).

### 3. The HUNTER's hurt capsule (formula READ; the pose it reads is NOT READ)

The player's vt+0x36c is `0x2821e4`. The vtables were found by DTI: uPlayerQuest `0x174215c` (DTI `0x187fa98`, registered
at `0x2b2b24`) and uPlayerQuest00 `0x1742a28`. Both have +0x36c `0x2821e4`, +0x88 `0x27c19c`, +0xd4 `0x27bf80`, +0xb0
`0x2a604c` and +0x270 `0x2a934c`.

- The word `+0x13cc` bit 3 clear (a hunter: INFERRED) selects joints **A = 16, B = 19, C = 4**. Bit 3 set selects 13, 11
  and 3.
- A joint's world point = vt+0xd4, which is `b 0x539e08`. It looks the id up in the model's +0x498 map and reads the
  translation row (+0x40) of the matrix at `+0x494 + 0xa0·idx`.
- **p0 = (A + B)·0.5, p1 = C** (`0x282244..0x2822c4`).
- **u = (p1 − p0)/|p1 − p0|**; the normalisation is skipped when the length is below 2^-23 (`0x282308`, literal
  0x34000000).
- **p0 += 40·u, p1 −= 40·u** (`0x28232c..0x282388`, literal 40.0).
- **r = 40.0** (`0x282334`, `0x42200000`).

**What is missing**: the hunter's joint positions in its in-quest pose. The hunter's skeleton (the Armor Viewer's
`docs\models\f001_body.glb`, node names "index:jointId") has the leg chains 14→15→16 and 17→18→19 and the spine
1→2→3→4. **So the capsule runs from between the feet to the head**, which is INFERRED from the chain ends. The viewer has
no hunter motion. The nearest ROM motion of a standing hunter is the Armor Viewer's `docs\poses\pl_make.glb`
Motion[170]_loop, frame 0 (character creation, model origin on the floor, game units = glb × 100). Its joints are
16 (27.29, 10.98, 12.10), 19 (−6.70, 10.26, −3.56) and 4 (−0.51, 152.50, −1.45). The capsule from that pose is
p0 ≈ (10.3, 10.6, 4.3) + 40u and p1 ≈ (−0.5, 152.5, −1.5) − 40u, r 40. It is a stand-in, not the quest idle, and it is
marked INFERRED in the JS.

### 4. The tests and the contact point (READ)

- **Sphere (attack) vs the hunter capsule**: `0x167d2c` calls `0x7ce35c(hunterCap, sphere, &res, 0)`.
  - The degenerate case, |p1−p0|² < 2^-23, goes to `0x7cc734` (NOT READ; the hunter capsule is ~60 long).
  - `0x8069d8` returns t, a length along the unit axis clamped to [0, L], and d². Then Q = p0 + t·u and R = c − Q.
  - The normal n is R/|R| when d² ≥ 0.001. Otherwise it is the part of R perpendicular to the axis, normalised. Either
    normalisation is skipped when the length is below 2^-23.
  - The test meets when **√d² − (r_cap + r_sph) <= 0**.
  - **The contact point = Q + n·r_cap**: on the hunter's surface, toward the attack.
- **Capsule (attack) vs the hunter capsule**: `0x1676f0` calls `0x167024`.
  - The prefilter is the bounding spheres: |midA − midB|² <= (bA + bB)², where b = |mid − p0| + r (`0x8002a4`).
  - `0x166e1c` is the closest-point segment–segment test (Ericson 5.1.9, EPS 0.001): cA = A.p0 + s·A.d and
    cB = B.p0 + t·B.d.
  - n = cB − cA. If d² < 1e-5 the axes cross: n = A.d × B.d, then A.d × Y, then A.d × Z, and the distance is taken as 0.
  - n is normalised only when |n|² > 0.001 and |n| ≥ 2^-23.
  - The test meets when **dist − (rA + rB) < 0 (strict)**.
  - **The contact point = cB − rB·n**: on the hunter's surface, toward the attack.

### 5. The gates and rules (READ unless marked)

- **The time window**: a slot takes part only while `H+5` is set and its delay <= 0 (`0x168ebc`), after this frame's
  countdown. The duration's end clears `+5` in `0x168d30`, which is shells.js's slotStep.
- **One hit per frame per hunter**: `player+0x31e0`, set at the hit (`0x175c1c` / `0x178784`). Kind 0x41 is exempt.
  Its per-frame clear is NOT READ (INFERRED: each frame).
- **Once per target**: the hunter's ring of 20 ids at `player+0x31e4` (index byte +4, ids at +6 + 2k; `0x1702ec` adds,
  `0x16b5e0` tests). The id is the slot's (unique per registration) or the shell's `+0x1588` when not 0xffff, so shells
  that share an id hit one hunter once. What resets the ring is NOT READ.
- **The owner**: the shell's owner check `0x168ee4` compares the target with H+0xc / H+0x70 (the shell itself), so it
  never excludes a hunter.
- **The named target**: `0x16940c` returns 1 unless `H+0x32` bit 0x80 is set, in which case only the target `H+0x8c`
  passes. The setter `0x168d1c` has one caller in the shell code, base28 at `0x410cb8` (its shell's target unit). The
  rom-map row `0x16acf0` calls this "the shapes meet", and that is wrong (see (c)).
- **List order**: `0x16b450` pushes at the front, so the last-registered slot is tested first (slot 1 before slot 0 of a
  shell; later shells first). The units' vt+0x2c call order is INFERRED to be the unit-line order.
- **Keep or end**: the contact never ends the shell. Its +0x150 answer does. H+6 = 2 lives until the next manager pass
  (`0x168d30`), and the history keeps the same id from hitting again, so one slot id gives one type 2 per hunter. **Only
  slot 0's hit becomes type 2.**
- **The frame order** between the manager and the units' moves is NOT READ. It does not change the result: the shapes
  always use the position, anchor and words left by move N, and the latch is read by move N+1.
- **Passive-hunter assumptions** (INFERRED for a standing proxy): vt+0x270 (`0x282828` flag 0x40000000) = 0, vt+0xb0
  (`+0x274a` bit 0, timer `+0x2b40`) = 0, `0x2a6034` = 0, `0x2a8de4` = 0, `+0x274a` bit 7 = 0, the same area, and target
  byte `+0x1052` = 0.

## (b) Exact JS for docs/render/shells.js (anchors by text; line numbers as of today)

### b1. Data: `hitrec` and `hitsize` per shell def

Add these from `gapM\hitshapes.json`, keyed by the def's `folder`. `hitrec[i] = [delay, duration, kind, group]`
extends today's `hitdata`, and `hitsize[group] = [{ j0, j1, code, flags, r, o0, o1 }]`. For example:
`shell\em\em037_00_shell00` → `hitrec [[0,198,2,0]]`, `hitsize [[{j0:1001, code:0, r:100, ...}]]`.

### b2. The slot id and mask

Anchor: `function slotsOf011(def, mode, refused){` (line 8694). Push the slot with its id and mask:

```js
    out.push({ slot, record: idx, on: true, delay: f(def.hitdata[idx][0]), duration: f(def.hitdata[idx][1]),
               mask: 0x1f /* base00 0x3f9aec / base28 0x410c80; another base's own vt+0x140 argument: read it */ });
```

At the registration sites, `if (got.hitLife) S.slots = slotsOf011(...)` (lines 7756 / 8795; also 8470), make the slots
when `input.hunterBody` too, and give each slot its id:

```js
  if (own.hitLife || own.hunterBody) S.slots = /* as today */;
  if (S.slots) for (const sl of S.slots) sl.id = hitId(state, S);          // 0x168a60 (0x16b4b4) / 0x4a1c18 (+0x1588)
// ...
function hitId(state, S){                                                   // mgr+0x202c: +1, 0 above 59999 (0x16b4b4)
  if (S.id1588 != null && S.id1588 !== 0xffff) return S.id1588;              // the registration's last arg (base00 +0x1588)
  state.hitCounter = ((state.hitCounter || 0) + 1) > 0xea5f ? 0 : (state.hitCounter || 0) + 1;
  return state.hitCounter;
}
```

`hunterBody` must also reach `got` / `own`, next to `hitLife: !!input.hitLife` (line 8823).

### b3. The hunter capsule, the shell shapes, the two tests, the pass

Insert above `// ---- the hit slots: the life of a timer-0 shell01` (line 8683).

```js
// ---- THE HUNTER PASS (input.hunterBody): the hit manager's attack-vs-hunter test (gapM RESULT; rom-map rows 0x16a6ac..)
const HURT_R = f(40.0);                              // 0x2821e4: the capsule radius and the pull-in at each end
const EPS23 = f(1.1920928955078125e-07);             // 2^-23 (0x282308 / 0x7ce374 / 0x16742c literals)
const EPS3 = f(0.001);                               // 0x167018 / 0x7ce4d8 / 0x167428
const EPS5 = f(1e-5);                                // 0x167420
// INFERRED stand-in: the hunter's joints 16 / 19 / 4 relative to his unit, facing +Z -- the Armor Viewer's pl_make.glb
// Motion[170]_loop frame 0 (a character-creation stand, x 100). His in-quest pose is NOT READ (gapM RESULT a3).
const HUNTER_JOINTS = { 16: [27.29, 10.98, 12.10], 19: [-6.70, 10.26, -3.56], 4: [-0.51, 152.50, -1.45] };

function hunterCapsule(T, yaw){                      // player vt+0x36c 0x2821e4 (+0x13cc bit 3 clear: joints 16, 19, 4)
  const c = cosf(f(yaw || 0)), s = sinf(f(yaw || 0));
  const J = id => { const j = HUNTER_JOINTS[id];     // vt+0xd4 -> 0x539e08: the joint's world point (stand-in)
    return [f(T[0] + f(f(j[0] * c) + f(j[2] * s))), f(T[1] + f(j[1])), f(T[2] + f(f(j[2] * c) - f(j[0] * s)))]; };
  const A = J(16), B = J(19), C = J(4);
  const p0 = [f(f(A[0] + B[0]) * 0.5), f(f(A[1] + B[1]) * 0.5), f(f(A[2] + B[2]) * 0.5)];   // 0x282270..0x282290
  let dx = f(C[0] - p0[0]), dy = f(C[1] - p0[1]), dz = f(C[2] - p0[2]);                    // s20 / s16 / s18
  const len = sqrtf(mla(mla(f(dy * dy), dx, dx), dz, dz));
  if (!(len < EPS23)){ const r = f(1.0 / len); dz = f(dz * r); dy = f(dy * r); dx = f(dx * r); }
  const ox = f(dx * HURT_R), oy = f(dy * HURT_R), oz = f(dz * HURT_R);
  return { p0: [f(ox + p0[0]), f(oy + p0[1]), f(oz + p0[2])], p1: [f(C[0] - ox), f(C[1] - oy), f(C[2] - oz)], r: HURT_R };
}

// unit +0x38 == 4 (the uCoord ctor's 0x8a4728): Z, then X, then Y -- 0x16f060..0x16f0f0 / 0x16f808..0x16f88c
function coordRows4(W){
  const X = f(f(W[0] >>> 0) * U16_TO_RAD), Y = f(f(W[1] >>> 0) * U16_TO_RAD), Z = f(f(W[2] >>> 0) * U16_TO_RAD);
  const sx = sinf(X), sy = sinf(Y), sz = sinf(Z), cx = cosf(X), cy = cosf(Y), cz = cosf(Z);
  const sxsy = f(sx * sy), sxsz = f(sx * sz), sxcz = f(sx * cz), sxcy = f(sx * cy);
  return [[mla(f(cy * cz), sxsy, sz), f(sz * cx), mls(f(sxsz * cy), sy, cz)],
          [mls(f(sy * sxcz), sz, cy), f(cx * cz), mla(f(sxcy * cz), sy, sz)],
          [f(sy * cx), f(-sx), f(cx * cy)]];
}
const turnRows = (M, o) => [mla(mla(f(o[1] * M[1][0]), o[0], M[0][0]), o[2], M[2][0]),     // 0x16f1d8..0x16f22c
                            mla(mla(f(o[1] * M[1][1]), o[0], M[0][1]), o[2], M[2][1]),
                            mla(mla(f(o[1] * M[1][2]), o[0], M[0][2]), o[2], M[2][2])];

// 0x169290 -> 0x16d970 -> 0x16da04 for a shell (kind 2): its hitsize group's shapes at the manager's pass
function shellHitShapes(S, def, rec){
  const g = def.hitsize && def.hitsize[rec[3]];
  if (!g) return { why: 'no hitsize group ' + rec[3] + ' (HDS byte +0x19) in ' + def.folder };
  const s = f(S.mode && S.mode.scale != null ? S.mode.scale : 1.0);          // H+0x14 = ShellScale (0x4a1c3c..0x4a1c80)
  const P = S.position, out = [];
  let M = null;
  const at = o => { M = M || coordRows4(S.angles);
    const w = turnRows(M, [f(s * o[0]), f(s * o[1]), f(s * o[2])]); return [f(w[0] + P[0]), f(w[1] + P[1]), f(w[2] + P[2])]; };
  for (const r of g){
    const R = f(s * f(r.r));
    if (r.j0 === 1001){                                                        // 0x16e000..0x16e18c: +0x40 to +0x1000
      if (r.j1 === 2001) return { why: 'hitsize j1 2001 (0x16e190..): offsets not transcribed' };   // in no shell file
      out.push({ type: 2, p0: P.slice(), p1: S.anchor.slice(), r: R });
    } else if (r.j0 === 255){                                                  // 0x16dbd4: by the code
      if (r.code === 0) out.push({ type: 1, c: at(r.o0), r: R });              // 0x16e270
      else if (r.code === 1 || r.code === 2) out.push({ type: 2, p0: at(r.o0), p1: at(r.o1), r: R });   // 0x16dc10
      else if (r.code === 4 || r.code === 6) return { why: 'hitsize code ' + r.code + ': a type 3 shape (0x167f70 not read)' };
      // codes 3 / 5: no shape (0x170164, type 0)
    } else if (r.j0 === 1010) return { why: 'hitsize j0 1010: the shell segment table +0x1594 (0x16dd2c) not transcribed' };
    else return { why: 'hitsize j0 ' + r.j0 + ': a shell-model joint (0x16ddd0) not read' };
  }
  return { shapes: out };
}

function segPointT(C, P){                            // 0x8069d8: d^2 to the segment, t a LENGTH along it in [0, L]
  const ay = f(C.p1[1] - C.p0[1]), ax = f(C.p1[0] - C.p0[0]), az = f(C.p1[2] - C.p0[2]);
  const ry = f(P[1] - C.p0[1]), rz = f(P[2] - C.p0[2]), rx = f(P[0] - C.p0[0]);
  const inv = f(1.0 / sqrtf(mla(mla(f(ay * ay), ax, ax), az, az)));
  const uy = f(ay * inv), ux = f(ax * inv), uz = f(az * inv);
  const L = mla(mla(f(uy * ay), ux, ax), uz, az), Sd = mla(mla(f(ry * uy), rx, ux), rz, uz);
  let t = L < Sd ? L : Sd; t = t > 0 ? t : 0;
  const dy = mls(ry, uy, t), dx = mls(rx, ux, t), dz = mls(rz, uz, t);
  return { d2: mla(mla(f(dy * dy), dx, dx), dz, dz), t };
}
function unit3(v){ const l = sqrtf(mla(mla(f(v[1] * v[1]), v[0], v[0]), v[2], v[2]));   // y, x, z order as the ROM's
  if (l < EPS23) return v; const r = f(1.0 / l); return [f(v[0] * r), f(v[1] * r), f(v[2] * r)]; }

// 0x167d2c -> 0x7ce35c(hunter capsule, attack sphere): the point on the hunter's surface toward the sphere, or null
function sphereVsHunter(A, cap){
  const ay = f(cap.p1[1] - cap.p0[1]), ax = f(cap.p1[0] - cap.p0[0]), az = f(cap.p1[2] - cap.p0[2]);
  if (mla(mla(f(ay * ay), ax, ax), az, az) < EPS23) return { why: 'a point capsule: 0x7cc734 not read' };
  const { d2, t } = segPointT(cap, A.c), dist = sqrtf(d2);
  const inv = f(1.0 / sqrtf(mla(mla(f(ay * ay), ax, ax), az, az)));
  const Q = [mla(cap.p0[0], t, f(ax * inv)), mla(cap.p0[1], t, f(ay * inv)), mla(cap.p0[2], t, f(az * inv))];
  const R = [f(A.c[0] - Q[0]), f(A.c[1] - Q[1]), f(A.c[2] - Q[2])];
  let n;
  if (!(d2 < EPS3)) n = unit3(R);                                              // 0x7ce5c0
  else {                                                                        // 0x7ce4f4: R less its part along the axis
    const a = unit3([ax, ay, az]);
    const w0 = mls(f(R[1] * a[0]), R[0], a[1]), w1 = mls(f(R[0] * a[2]), R[2], a[0]), w2 = mls(f(R[2] * a[1]), R[1], a[2]);
    n = unit3([mls(f(a[2] * w1), a[1], w0), mls(f(a[0] * w0), a[2], w2), mls(f(a[1] * w2), a[0], w1)]);
  }
  if (!(f(dist - f(cap.r + A.r)) <= 0)) return null;                         // movwls: <= 0 meets
  return { point: [mla(Q[0], n[0], cap.r), mla(Q[1], n[1], cap.r), mla(Q[2], n[2], cap.r)] };
}

function closestSegSeg(A, B){                        // 0x166e1c (Ericson 5.1.9, EPS 0.001): s, t in [0, 1]
  const d1 = A.d, d2 = B.d, rx = f(A.p0[0] - B.p0[0]), ry = f(A.p0[1] - B.p0[1]), rz = f(A.p0[2] - B.p0[2]);
  const a = mla(mla(f(d1[1] * d1[1]), d1[0], d1[0]), d1[2], d1[2]), e = mla(mla(f(d2[1] * d2[1]), d2[0], d2[0]), d2[2], d2[2]);
  const cl = v => { v = f(v + 0); v = v > 0 ? v : 0; return v < 1 ? v : 1; };
  let s = 0, t = 0;
  if (a <= EPS3 && e <= EPS3) return { s, t, d2: f(f(rz * rz) + mla(f(ry * ry), rx, rx)) };
  const F = mla(mla(f(ry * d2[1]), rx, d2[0]), rz, d2[2]);
  if (!(a > EPS3)) t = cl(f(F / e));
  else {
    const c = mla(mla(f(ry * d1[1]), rx, d1[0]), rz, d1[2]);
    if (!(e > EPS3)) s = cl(f(-f(c / a)));
    else {
      const b = mla(mla(f(d1[1] * d2[1]), d1[0], d2[0]), d1[2], d2[2]), den = mls(f(a * e), b, b);
      if (den !== 0) s = cl(f(mls(f(b * F), c, e) / den));
      t = f(mla(F, b, s) / e);
      if (t < 0){ t = 0; s = cl(f(f(-c) / a)); }
      else if (t > 1){ t = 1; s = cl(f(f(b - c) / a)); }
    }
  }
  const c1 = [mla(A.p0[0], s, d1[0]), mla(A.p0[1], s, d1[1]), mla(A.p0[2], s, d1[2])];
  const c2 = [mla(B.p0[0], t, d2[0]), mla(B.p0[1], t, d2[1]), mla(B.p0[2], t, d2[2])];
  const gy = f(c2[1] - c1[1]), gx = f(c2[0] - c1[0]), gz = f(c2[2] - c1[2]);
  return { s, t, d2: f(f(gz * gz) + mla(f(gy * gy), gx, gx)) };
}
function capExt(C){                                  // 0x1676f0's per-capsule block: d, mid, bound
  const d = [f(C.p1[0] - C.p0[0]), f(C.p1[1] - C.p0[1]), f(C.p1[2] - C.p0[2])];
  const mid = [f(f(C.p0[0] + C.p1[0]) * 0.5), f(f(C.p0[1] + C.p1[1]) * 0.5), f(f(C.p0[2] + C.p1[2]) * 0.5)];
  const my = f(mid[1] - C.p0[1]), mx = f(mid[0] - C.p0[0]), mz = f(mid[2] - C.p0[2]);
  return { p0: C.p0, p1: C.p1, r: C.r, d, mid, bound: f(sqrtf(mla(mla(f(my * my), mx, mx), mz, mz)) + C.r) };
}
// 0x1676f0 -> 0x167024(attack, hunter): the point on the hunter's surface toward the attack's axis, or null
function capsuleVsHunter(Acap, cap){
  const A = capExt(Acap), B = capExt(cap), R2 = f(A.bound + B.bound);
  const qy = f(A.mid[1] - B.mid[1]), qx = f(A.mid[0] - B.mid[0]), qz = f(A.mid[2] - B.mid[2]);
  if (!(mla(mla(f(qy * qy), qx, qx), qz, qz) <= f(R2 * R2))) return null;    // 0x8002a4
  const { s, t, d2 } = closestSegSeg(A, B);
  const cA = [mla(A.p0[0], s, A.d[0]), mla(A.p0[1], s, A.d[1]), mla(A.p0[2], s, A.d[2])];
  const cB = [mla(B.p0[0], t, B.d[0]), mla(B.p0[1], t, B.d[1]), mla(B.p0[2], t, B.d[2])];
  let n = [f(cB[0] - cA[0]), f(cB[1] - cA[1]), f(cB[2] - cA[2])], dist;
  if (d2 < EPS5){                                                              // 0x16724c..0x16732c: crossing axes
    const a = A.d, b = B.d; dist = 0;
    n = [mls(f(a[1] * b[2]), a[2], b[1]), mls(f(a[2] * b[0]), b[2], a[0]), mls(f(b[1] * a[0]), a[1], b[0])];
    if (mla(mla(f(n[1] * n[1]), n[0], n[0]), n[2], n[2]) < EPS5){
      n = [f(-a[2]), 0, a[0]];                                                 // A.d x Y
      if (mla(mla(f(n[1] * n[1]), n[0], n[0]), n[2], n[2]) < EPS5) n = [a[1], f(-a[0]), 0];   // A.d x Z
    }
  } else dist = sqrtf(d2);
  const depth = f(dist - f(A.r + B.r));
  const nn = mla(mla(f(n[1] * n[1]), n[0], n[0]), n[2], n[2]);
  if (nn > EPS3) n = unit3(n);                                                 // 0x167384..0x1673f8
  if (!(depth < 0)) return null;                                               // movwmi: strictly below 0
  return { point: [mls(cB[0], B.r, n[0]), mls(cB[1], B.r, n[1]), mls(cB[2], B.r, n[2])] };
}

// The manager's pass for the proxy hunter (0x16a740's hunter capsule + 0x16acf0 pass (1) + 0x16b6cc), run once per step
// AFTER every slot's countdown (0x168d30 = slotStep). Sets S.hunterHit (slot 0's H+6 = 2, H+0x20) for the next move.
function hunterPass(state, input, D, out){
  for (const S of state.shells) S.hunterHit = null;                           // 0x168d40: H+6 = 0xff at every pass
  const t = input.rock && input.rock.target;
  if (!input.hunterBody || !t) return;
  const H = state.hunter || (state.hunter = { ring: new Array(20).fill(0xffff), k: 0 });   // player +0x31e4
  const cap = hunterCapsule([f(t.x), f(t.y), f(t.z)], input.hunterYaw);
  let struck = false;                                                          // player +0x31e0 (its clear: NOT READ)
  for (let i = state.shells.length - 1; i >= 0; i--){                           // mgr+0x2020: last registered first
    const S = state.shells[i];
    if (!S.slots || S.state === 0xff || !S.position) continue;
    const def = D.shells[S.shell];
    for (let k = S.slots.length - 1; k >= 0; k--){
      const sl = S.slots[k];
      if (!(sl.on && !(sl.delay > 0))) continue;                               // 0x168ebc
      const rec = def.hitrec && def.hitrec[sl.record];
      if (!rec){ out.refused.push({ shell: S.shell, id: S.id, why: 'hunter pass: no HDS kind / group for record ' + sl.record }); continue; }
      const kind = rec[2];
      if (kind === 0x41){ out.refused.push({ shell: S.shell, id: S.id, why: 'hunter pass: kind 0x41 -> 0x2a6640 not read' }); continue; }
      if (struck) continue;                                                    // 0x16add8..0x16ade4
      if (sl.id !== 0xffff && H.ring.includes(sl.id)) continue;               // 0x16b5e0
      if (!((sl.mask == null ? 0x1f : sl.mask) & 1)) continue;                 // H+8 bit 0 (0x16ae10)
      if (kind === 8 || kind === 9 || kind === 0x34 || kind === 0x45) continue; // table 0x16ae64 -> 0x16af84
      if (kind === 0xc || kind === 0xd || kind === 0x1e){ out.refused.push({ shell: S.shell, id: S.id, why: 'hunter pass: kind ' + kind + ' needs 0x2f5bf0(player), not read' }); continue; }
      if (S.namedTarget && S.namedTarget !== 'hunter') continue;              // 0x16940c (base28's 0x168d1c)
      const sh = shellHitShapes(S, def, rec);
      if (!sh.shapes){ out.refused.push({ shell: S.shell, id: S.id, why: 'hunter pass: ' + sh.why }); continue; }
      for (const A of sh.shapes){                                              // 0x16b78c: list order, the first that meets
        const c = A.type === 1 ? sphereVsHunter(A, cap) : capsuleVsHunter(A, cap);
        if (c && c.why){ out.refused.push({ shell: S.shell, id: S.id, why: 'hunter pass: ' + c.why }); break; }
        if (!c) continue;
        struck = true;                                                         // 0x175c1c / 0x178784
        if (sl.id !== 0xffff){ H.ring[H.k] = sl.id; H.k = H.k + 1 > 19 ? 0 : H.k + 1; }   // 0x1702ec
        if (sl.slot === 0) S.hunterHit = { point: c.point };                   // +0x13ae = 2, +0x13c8.. (slot 1: unread by 0x43ac8c)
        S.events.push({ ev: 'hunter', slot: sl.slot, point: c.point });
        break;
      }
    }
  }
}
```

### b4. Calling the pass

Anchor: inside `stepShells`, the line
`for (const S of state.shells) if (S.slots) for (const sl of S.slots) slotStep(sl, ctx.dt);` (line 26123). Add directly
after it:

```js
  hunterPass(state, input, D, out);                    // 0x16acf0 pass (1) after 0x168d30 (0x16a740): H+6 for next move
```

### b5. The query's hunter arm

Anchor: `function collide(S, off, stage){` (line 4499), which transcribes 0x43ac8c. Replace the body:

```js
function collide(S, off, stage){
  // 0x43acb0..0x43ad2c: slot 0's byte +0x13ae != 0xff (the manager's pass) -> the contact +0x13c8.. and type 2
  // (0x2a8de4 / the target's +0x1052: a passive proxy passes, INFERRED); no normal and no attributes are written
  const hh = S.hunterHit ? { point: S.hunterHit.point.slice(), normal: null, attr: 0, type: 2, hunter: true } : null;
  if (hh && !S.b15c1) return hh;                        // byte +0x15c1 == 0: the stage is not queried (0x43ad20)
  const add = P => [f(P[0] + off[0]), f(P[1] + off[1]), f(P[2] + off[2])];
  const mask = (S.k && S.k.qmask) || 0x30;
  const q = off ? stageQuery(add(S.position), add(S.anchor), stage, mask) : stageQuery(S.position, S.anchor, stage, mask);
  return q ? { point: q.point, normal: q.normal, attr: q.attr, type: hitType(q.attr, q.normal) } : hh;   // a miss keeps type 2
}
```

`S.b15c1` must be set where the readers set byte +0x15c1. shells.js names them in comments at lines 6205, 6825, 10857,
12024, 13627, 15327, 15667, 17518, 18387, 19194 and 20325.

### b6. Every other transcription of 0x43ac8c

Each caller in (a)1.4 (stepRock / stepOrb / step011 / COLLIDE00 entries, base02 / 07 / 13 / 14 / 28 / 54 / 58...) needs
the same two lines at its top: the `hh` return and the `: hh` miss. Today they return straight from their own
stageQuery. A class with its own `+0x13ae` reader ((a)1.5) stays a named refusal until read. Ahtal-Neset's `0x10c27b4`
(rom-map R) reads the same byte: `S.hunterHit` gives it kind 2 at `+0x13c8`, before its y <= 0 test.

### b7. What changes for the landings

None of them change. `(LANDING[S.cls] || landing)(S, D, hit, ctx)` already switches on `hit.type === 2`; the 77 type-2
records start at `hit.point`, the hunter's surface point. A 'keep' answer (Blangonga's type 2) sees no type 2 on the next
move, because the pass clears it and the ring blocks the same id.

## (c) rom-map rows (to add; the coordinator or the shells lane writes them)

| address / range | what | owner | status | detail |
|---|---|---|---|---|
| `0x16a6ac` (vtable slot at data `0x1737bf8`) | the hit manager's per-frame move: pause gate `[0x211f764]+0x60/+0x64`, `0x3f79c8 == 1`, then `0x16a740` (the shapes) → `0x16acf0` (the pairs) → `0x17bcb0` | hit manager | R | gapM RESULT a1 |
| `0x16a740` | per attacker in mgr+0x2020: **vt+0x18 = `0x168d30` (slot step: H+6 = 0xff first)**; active (`0x168ebc`) → `0x169290` shapes into mgr+0x2030 (64); per hunter (`0x276290`, vt+0x88, `0x2a6034`) vt+0x36c → type-2 capsule into mgr+0x1c (256), index → player+0x3260; then the 10 enemies' bodydata | hit manager | R | gapM a1. **Answers shells.js "NOT READ: who calls 0x168d30"** |
| `0x4a16f4` (enemy-shell base vt+0x2c) → `0x169278` (H vt+0x1c) → `0x16b450` | per-frame registration of slots 0 / 1 (front push onto mgr+0x2020, only with H+5 and H+0x84); list cleared `0x16a664` | enemy-shell base | R | gapM a1 |
| `0x4a1ad8` | the registration gate: the .shl's hitdata `[+0x1384]+0xbc` AND hitsize `+0xc0` both set | enemy-shell base | R | retires shells.js "0x4a1ad8 (taken to pass)" |
| `0x168a2c` | slot fill: +0xc owner, +0x10 kind-of-owner 2, +5 = 1, +0x34 id (`0x16b4b4`), +0x3a = HDS +6 (0 → 1), +0x84 hitsize, +0x88 group, +8 mask, +0x6d, +7 the owner's area +0x1054 | hit side | R | gapM a1 |
| `0x4a1bbc` / `0x4a1c18` / `0x4a1c3c..0x4a1c80` | group = HDS +0x19 when r3 = −1; id = last arg (+0x1588) unless 0xffff; H+0x14 = [[shl] vt+0x40]+0x10[block +8]+4 (ShellScale, I) | enemy-shell base | R / I (name) | gapM a1 |
| `0x16b6cc` | the HUNTER handler: capsule [player+0x3260] (type 2 only); shapes in list order: type 1 `0x167d2c`, 2 `0x1676f0`, 3 `0x167f70` (NR); first meeting → `0x175b88` / `0x178694`: **H+6 = 2, H+0x20 = contact, H+0xb0 = player**, +0x31e0 = 1, history `0x1702ec`; owner vt+0x94, target vt+0x98 | hit manager | R | gapM a1 |
| `0x43acb0..0x43ad2c` (in `0x43ac8c`) | **THE TYPE-2 SOURCE**: slot 0 byte +0x13ae != 0xff → point +0x13c8.., type 2 (skipped when target +0x1052 == 0 and `0x2a8de4` != 0); +0x15c1 != 0 → the stage query still runs and a hit overrides | shared shell base | R | gapM a1.4; shells.js collide() |
| `0x2821e4` (uPlayerQuest vt+0x36c; vtables `0x174215c` / `0x1742a28`) | the hunter's hurt capsule: joints 16 / 19 (mid) → 4 (+0x13cc bit 3: 13 / 11 → 3), via `0x539e08`; ends pulled in 40 along the axis; r 40 | uPlayer | R (formula) / NR (pose) | gapM a3 |
| `0x16da04` (kind 2) | shell shapes by HTS record: j0 1001 capsule +0x40 → +0x1000; j0 255 code 0 sphere / 1, 2 capsule (pos + M(s·off)); 4 / 6 type 3; j0 1010 segment j1 of +0x1594; M by unit +0x38 (4 = Z, X, Y) | hit manager | R | gapM a2 |
| `0x8a4728..0x8a4730` | uCoord ctor: +0x38 = 4, +0x3a = 3 (the rotation order the hit shapes read) | uCoord | R | gapM a2 |
| `0x167d2c` → `0x7ce35c` / `0x8069d8` | sphere vs capsule: meets at dist − (r1 + r2) <= 0; point = closest axis point + n·r_capsule | math | R | gapM a4 |
| `0x1676f0` → `0x167024` / `0x166e1c` / `0x8002a4` | capsule vs capsule: bounding spheres, Ericson closest points (EPS 0.001), crossing-axis normals; meets at depth < 0; point = cB − rB·n | math | R | gapM a4 |
| `0x168ebc` / `0x168ee4` / `0x16940c` / `0x16b5e0` / `0x1702ec` | active (H+5, delay <= 0) / owner (H+0xc, H+0x70; H+0x30 bit 0x40 off) / **named target (H+0x32 bit 0x80 → only H+0x8c; set by `0x168d1c`, base28 `0x410cb8`)** / history ring player+0x31e4 (20) test / add | hit manager | R | gapM a5 |
| `0x2a8de4` / `0x2a6034` / vt+0xb0 `0x2a604c` / vt+0x270 `0x2a934c` | player state gates (+0x2506 / +0x250a, +0x274a, +0x2b40, flag 0x40000000 via `0x282828`) | uPlayer | R (tests) / I (passive values) | gapM a5 |
| `0x16bab4` / `0x16c514` / `0x16caa8` / `0x16cf84` | target vt+0x98 call sites: the shell's own +0x98 (base57 `0x430714`, sp_16 `0xf65ac8`) runs when the SHELL is struck, not when it strikes | hit manager | R | gapM a1.6 |
| `0x16cfa4` | the clash pass `0x16cabc` writes H+6 = 0 → 0x43ac8c returns type 2 | hit manager | R | gapM a1.6 |
| tooling: `gapM\hitshapes_export.py` → `hitshapes.json` | every shell folder's HDS (delay, duration, kind, group) and HTS groups (294 folders) | — | — | control: em037_00_shell00 = (0, 198, 2, 0) / j0 1001 r 100, as shells.js's `hitdata` |

**WITHDRAWN (add to the table, keep the row):**
- Row `0x16acf0` says "...the shapes meet (`0x16940c`) -> `0x16bc54`". **`0x16940c` is the named-target filter**: it
  returns 1 unless H+0x32 bit 0x80 is set, and then compares the target with H+0x8c. The shapes are tested inside the
  handlers, `0x16b6cc` for hunters and `0x16bc54` for enemies. Correction: rows `0x16b6cc` / `0x16940c` above.
- shells.js lines 4495–4497 and 113–114 say the hunter path "needs a hunter and never runs here". That held until
  `input.hunterBody`; see b5.
