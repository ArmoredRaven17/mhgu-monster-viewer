# gapC — Nakarkos (em084_00): sp_00 0..8, 1, 65 / 66 (records em084_00u:1 / 2 / 4 / 5 / 10)

Helper for the shells lane, 2026-10-20. Static reads with `efx/armdis.py` (sweep wrapper `gapC/dd.py`), the record table
dumped from `.data` (`gapC/tab.py`), the files re-dumped from `em084_00.arc` (`gapC/shl11.py`, over `fb/shlmap.py`), the
`.dtp` A rows by `efx/agents/diablos-scratch/dtp.py em084_00`. Nothing in the repo, rom-map, specs or board was edited.
rom-map was grepped first (rows 1228..1236, 1354..1406, 855); every row below that already existed is cited, not re-derived.

## (a) What was read

All READ (the consuming instruction read) unless marked **INFERRED**.

### 1. The rank pair, arm (7, 0xb) / (7, 0x25) -> sp_00 0 / 2 / 3 / 4 (G 5 / 6 / 7 / 8)

- **The arm's status-7 switch `0x108389c`** (byte `+0x73e1`, bound 0x2e, table `0x10838c4`): `0xb` -> stub `0x1083aac` ->
  **`0x10851bc`**; `0x25` -> `0x1083be8` -> **`0x10879a4`**. Control: `0x1b` -> `0x10867a4` (the transcribed (7, 0x1b) row).
  Also `0x11` / `0x12` -> `0x1085bd4`, `0x26` -> `0x1087bc0` (below).
- **`0x10851bc` (7, 0xb)**, extent `0x10851bc..0x1085404` (pool to `0x1085438`, next push `0x108543c`). Returns unless
  `[arm+0xcadc]` (the body) is set. Phase byte `P+0x1a1`: 0 -> 1, `0xbc7f4(arm, 0)`, `+0xcb04 = u16(0.5 + tune[2] x
  182.044)` (tune 2 = 2.0; the word's consumer not read), `+0xcb08 = 0x107de38(arm, 1)` (the weight), **`0xb03f8(arm, 0x201,
  0x202, 0x11, 40.0, 0.0, [+0xcb00])`** = l_2 / r_2 **M1 blended with M2**. Phase 1: speed windows `0xb07b4` (1.25 / 1.0 /
  0.2 / 0.4 / 0.6 / 0.8 / 1.0 at 90 / 90..120 / 120..160 / 140..230 / 160..230 / 200..230 / 230), then
  **`0x6f618(body, 1)` = tune float 1 = 120.0** -> `0xb0968(arm, 0, 0, 120, 0)` (op 0) -> **`0x107c0cc(arm, 0)`** at
  `0x10853d8`; at the clip's end (`0xb09c8`) vt `+0x3dc`.
- **`0x10879a4` (7, 0x25)**, extent `0x10879a4..0x1087b94`. The same shape: `+0xcb04` from tune 9 (= 1.0), weight
  `0x107de38(arm, 4)`, **`0xb03f8(arm, 0x232, 0x233, ..)`** = **M50 blended with M51**; windows at 90 / 90 / 110 / 166 / 200;
  **tune float 8 = 108.0** -> **`0x107c0cc(arm, 1)`** at `0x1087b68`.
- Tune values read from `em084_00_actiontune.fup` (floats at `0xb4`): f1 = 120, f2 = 2, f4 = 246 (control: the (7, 0x1b)
  row's 246), f8 = 108, f9 = 1, f14 = 146, f15 = 460.
- **`0x107c0cc`** (upgrades rom-map row 1229 "R (emulated)" to read): `0x3a8430()` (quest rank) `cmp #4; bgt` at `0x107c0ec`
  -> G; kind `[arm+0xcae0]` (1 / 2); tables `0x107c304` (k1), `0x107c128` (k2), `0x107c3e8` (k1 G), `0x107c220` (k2 G). idx 0
  -> k1 `mov r6, r5` = **0**, k2 **3**, k1 G **5**, k2 G **7**; idx 1 -> k1 **2** (`0x107c3c4`), k2 **4** (`0x107c1e8`), k1 G **6**
  (`0x107c5dc`), k2 G **8** (`0x107c2e0`). Request `0x3f883c(0x30)` (`0x107c4ac..0x107c544`): `+4` 0x16c, `+8` mode, `+0xc` the
  arm, `+0x10..` `[0x1831a78]` = `0x19176b0` (zero), `+0x1c` 0, `+0x20..` `[0x18321b0]` = `0x1620e60` (zero), `+0x2c` 0, `+0x2e`
  0xffff; tail `b 0x48b884`.
- **No form test** in either action (no `+0xcb30` / `P+0x1a2` read in either extent) — the rows are form-free.
- **The other M1 / M50 players** (scan of the arm band for `0x201 / 0x202 / 0x232 / 0x233`): `0x1085c2c / 0x1085e2c` in
  **(7, 0x11) / (7, 0x12)** `0x1085bd4` (M1 + M2) and `0x1087c44 / 0x1087c54` in **(7, 0x26)** `0x1087bc0` (M50 + M51). Both call
  only `0x107ca4c` (beams), never `0x107c0cc`; render/beam-spawns.js already names them as never issued. `0x107f14c / 0x107f354
  / 0x107f438` are the PSL word `0x107f0e4`. So l_2 / r_2 M1 and M50 are (7, 0xb)'s / (7, 0x25)'s (ROM_ARM_PAIRS agrees).
- Data (arc, re-dumped, equal to SHELL_DATA): modes 0..8 joint 12, flags 8, vz 50, flight 500, gravity 0; ef u 1 (0..4) /
  u 4 (5..8) at the start, **u 2 / u 5 only at a type 0 / type 2 contact** (ef 2, the floor's, is (999, -1)); the floor makes
  shell01 0 (CHILD084).

### 2. sp_00 1 — the fall of sp_11 2, from the body's (7, 0x43)

- **Body status-7 switch `0x1073a48`** (`+0x73e1`, table `0x1073a74`): `0x43` -> `0x10775c0`. Phase 0: `0xafce8(E, 0x3f,
  0x11, 20.0)` = **L0 M63**, both arms `0x106e238(E, side, 7, 0x20)`. Later phases (`0x107766c..`): at f86 the layer clip
  `0x246` (L2 M70) on layer 2 through vt `+0x78`; whatever the phase, every update reaches `0x107775c`: **tune 14 = 146** ->
  `0x106f6a8` (the beam; control: render/beam-spawns.js's L0 M63 f146 row) and **tune 15 = 460** (`0x1077790..0x10777c0`,
  `0xb0968` op 0) -> **`0x106f74c(E, 0)`**.
- **`0x106f74c`** (`..0x106f80c`): `n <= 2`; `0x3fa2bc(0x40)`: `+4` 0x170, `+8` **n + 2 = 2**, `+0xc` E, `+0x10..` / `+0x20..`
  `[0x1831a78]` (zero), `+0x1c` / `+0x2c` 0, `+0x30..` `0x1620e60` (zero), `+0x3c` 0xffff; `b 0x48b884`.
- **shell11 mode 2's files** (`em084_00_11_sh002 / _ef002 / _hit002`, ShellScale 1.0; control: mode 0 re-dumped equal to
  SHELL_DATA): ints `[20, -1, -1, -1, 0]`, floats `[0, 0, 0, 150]`, 20 vecs (the ±2500 / ±1500 / ±1000 rings), ef `(0, 21)`,
  hit file empty. Through params11n (row 1365's reader): 20 creates at **150, 300, .. 3000**, base point the **owner's +0x40**
  (int 2 = -1), words the owner's.
- **`0x108a330` modes 2..4** (upgrades rom-map row 1366 "R (mode 0)"): after the shared turn (`0x108a3c4..0x108a438`: s20 =
  x cos + z sin, s16 = z cos − x sin, Y word `+0x166c`; base `+0x1680..`), `0x4a0ee4` (mode) − 2 < 2 -> `0x108a508`: the point
  = (s20 + bx, vy + by, s16 + bz); mode 4 -> `0x108a63c`: the point = **sh vec k itself** (`0x4a2584(shell, k, -1)`). Then, with
  `[+0x1664]` (ef 0) set: `0x40a54(&rq)`, `0x4a10c8(shell, &rq, vt+0x130(shell), 0, byte +0x1054, &point, -1)`,
  `0x4a11e4(shell, ef, &rq)`, `0x40a94(&rq)` — a **start no handle keeps**. Then **shell00 mode 1**: `0x3f883c(0x30)`, `+4`
  0x16c, `+8` **1**, `+0xc` `0x4a0f00(shell)` (the shell's owner: the body), `+0x10..` the point, `+0x1c` 0, `+0x20..`
  `0x1620e60`, `+0x2c` 0, `+0x2e` 0xffff; `0x48b884` at `0x108a778`. Gate: `0x4a0f38 == 1` (owner active) at `0x108a350`.
- sp_00 1's files: joint −1, flags **0x18** (int 1 = 0 -> 0x10, int 3 = 0 -> 8), vec (0, 7000, 0), gravity (0, −1.2, 0),
  flight 1000; init00's request arm (0x10): the position = the request's `+0x10`, the offset turned by the owner's words (bit 3).
  On the floor its landing (landing084) makes **shell01 1** (u 3).
- **`+0x1690`** (sp_11 int 4 ≠ −1; mode 2 sets it): no reader in sp_11's band `0x1089fb0..0x108a954`, base11's
  `0x402f80..0x403200` or base01's `0x3fa2bc..0x3fb600` (movw `0x1690` / `#0x90]` scan). **Control**: the same scan finds its
  two writes `0x108a02c` (ctor) / `0x108a314` (reader) and the create's `+0x1680` reads `0x108a2c0` / `0x108a3f8`.
- **A runtime error found on the way (HEAD)**: base11's init `0x402fd8` calls base01's `0x3fa498`, whose two starts read
  `[+0x15c8]` / `[+0x15cc]` and skip on 0 (`0x3fad08..0x3fad1c`, `cmp r6, #0; beq`); sp_11's reader writes ef 0 to **`+0x1664`
  only** (`0x108a060..0x108a064`). So sp_11's init starts nothing — as shells.js's own comment says — but `make001` starts
  params 0 / 1 for any base11 reader that returns no `efAt`: on HEAD **shell11 0 starts u_r 10 at its init** (arm (7, 0x1b)
  form 1, `gapC/m93.mjs`), and mode 2 would start u 21 at the body. Fix 9 below (params11n `efAt` all null).

### 3. sp_00 65 / 66 — the body's motion-record table

- **`0x1069e78`** (body vt `+0x2a8` `0x1069b88`'s first call; vtable `0x17f11fc`: `+0x78` `0x72630`, `+0x204` `0x1066c14`,
  `+0x2a8` `0x1069b88`, `+0x3d8` `0x106ca78`), extent `0x1069e78..0x106a158`:
  - `[E+0xcb30] == 0` -> return. Clock: `+0xcb6c = +0xcb68`; `+0xcb68 = vmla(+0xcb68, 0xb0900(E), [E+0x1c])`.
  - Loop 1 over the entry's records (0x18 B, end at type −1): `0xb0950(E, +0)` (the motion) else next; flags bit 0 clear ->
    `0xb0974(E, f)`; set -> **cur > f and prev <= f** (`vcmpe cur, f; ble skip` / `vcmpe prev, f; bhi skip`). Type ≤ 3 (table
    `0x1069f98`): clip `0x246 + type`, layer `type + 2`, part 4 / 4 / 3 / 2, `.dtp` row 3 / 3 / 1 / 0; `0x9d36c(E, part)`
    **≥** byte +1 (rank ≤ 4) / +2 (G, `0x3a8430 > 4`) -> skip. Slot `[E+0xcb38 + 8·type]` busy -> skip; else 1, record ->
    `+0xcb3c + 8·type`, and (clip ≠ 0) **vt `+0x78`(E, layer, clip, 0, 0.0, 0.0, 1.0)**. Type > 3: no part test, no layer.
  - Loop 2, k = 0..5 (`0x106a0bc..0x106a144`): slot 2 -> `0x94dc04(E + 0x730 + 0x140k)` (the layer ended) -> free; slot 1 ->
    `type & ~1 == 4` -> free and spawn; else **`[E + 0x77c + 0x140k] >= 58.0`** (literal `0x106a160`, `vldr` at `0x106a09c`) -> slot 2 and spawn:
    **`0x106f354(E, rec+0xc, rec+0x10)`**.
- **`0x10673a8..0x1067430`** (in vt `+0x204`): `+0xcb30 = 0`, `0x13ecbfc(+0xcb38, 0x30)` (six slots zeroed), `E+0x78c / +0x8cc / +0xa0c / +0xb4c` (= layer k + 2 `+0x5c`,
  k = 0..3, stride 0x140) = 1.0 (the field's meaning NOT READ -- INFERRED the layer's rate), then the entry of `[+0xcb34]` whose bytes 0 / 1 are the new (status, number).
- **The clock's zero**: vt `+0x3d8` = `0x106ca78`: `+0xcb68 = +0xcb6c = 0`; **`0xafce8` calls vt `+0x3d8` first** (`0xafd08`)
  — closes the spec's INFERRED for this setMotion (the one (7, 0xa) / (7, 0xd) / (7, 0x43) use).
- **`0x1075d88`** = both (7, 0xa) and (7, 0xd) (switch entries 0xa and 0xd): phase 0 `0xafce8(E, 8, 0x11, 20.0)` L0 M8, both
  arms (7, 5); phase 1 at L0 M8's end `0xafce8(E, 4, 0x11, 2.0)` **L0 M4** + `0x78acc`; phase 2 `0x78b78(E, 0, tune 0x60)`
  until it returns 1 -> vt `+0x3dc`. L0 M4 is held for a turn of unread length, so the clock (not a frame) drives it.
- **The table `0x17f6420`** (13 entries, dumped from .data, equal to spec §4b): (7, 0xa): L0 M8 clock 100 type 0 sel 18;
  **L0 M4 clock 0 / 200 type 2 sel 19** (args 1 / 2). (7, 0xd): the same with **type 3 sel 20**.
- **`0x106f354`** sel 19 / 20 (`0x106f560` / `0x106f5cc`): `0x3f883c(0x30)`, `+4` 0x16c, `+8` **0x41 = 65 / 0x42 = 66**, `+0xc` E,
  `+0x10..` `[0x1831a78]`, `+0x1c` 0, `+0x20..` `0x1620e60`, `+0x2c` 0, `+0x2e` 0xffff; the arg is not used (r5 reloaded with the
  manager). The sel table `0x106f384` (all 20 read): 1..12 -> shell13 8, 9, 10, 11, 12, 13, 15..20; 13 / 14 -> 0 / 1; 15 / 16 ->
  21 / 22; 17 / 18 -> shell48 0 / 1.
- `.dtp` A (dtp.py): row 0 `02 03 03 01`, row 1 `03 03 03 02`, row 3 `04 04 04 83` — so **65 needs part 3's break level < 3,
  66 part 2's < 3** (both ranks).
- **INFERRED**: the layer clip's frame advances one per body frame after the frame it is set (the motion update before vt
  `+0x2a8`), so the shell is **58 frames after the record**; the layer "ended" at its length (133, the viewer's L2 M72 / M73).
  Neither the layer's own rate nor `0x94dc04`'s test was read.
- Net: on a play of (7, 0xa) the record at clock 0 fires on L0 M4's first frame, **shell00 65 at frame 58** (joint 212), the
  layer ends at 133, the clock-200 record **at 200 -> 65 again at 258**; (7, 0xd) the same with **66** (joint 213). The clock
  counts from the setMotion and does not wrap with the clip's loop.

## (b) The JS — `docs/render/shells.js`

Anchored by TEXT (shells.js moved by ~16 lines while this ran: other lanes are editing it). `gapC/patch.py` applies exactly
these to a copy (`gapC/shells.patched.js`); every anchor is asserted unique. Edits:

1. **DATA** — insert the block below immediately BEFORE the line `// BOLTREAVER ASTALOS (em081_04) -- HIS SHELLS (` (i.e. after
   the `SHELL_DATA.em084_00.arm084.push( ... );` of phase 2).
2. **S00COMMENT** — replace the two comment lines of `SHELL_DATA.em084_00.shells.shell00` that end `...no row here makes them
   yet.` (they begin `// stage. Modes 0..8 (the rank pair,`).
3. **armSpawn084** — `if (form === 'exposed'){` -> `if (!sp.any && form === 'exposed'){`; `if (form == null){ out.refused...`
   -> `if (!sp.any && form == null){ ...`; `const pick = sp.forms[form];` -> `const pick = sp.any || sp.forms[form];`; and
   `const modes = pick.modes || pick[side] || [];` -> the **RANK** block.
4. **create11n** — replace its `if (S.modeIndex !== 0){ ctx.out.refused.push(... 'not transcribed (phase 2)' ...); return; }`
   with `if (S.modeIndex !== 0){ createFall084(S, idx, ctx, D); return; }`, and insert **FALL** before
   `// a base11 class's own +0x168 (absent: Rathian's create11)`. (create11n's header comment "Modes 2 / 3 / 4 ... NOT
   TRANSCRIBED in phase 1 ... refused by name" should then say "createFall084".)
5. **pickVariantsFor** — insert **PICK** after the line `if (D.cannon084 && String(list) === '2' ... === 'Motion[82]') return
   D.cannon084.map(r => r.variant);`.
6. **BODY** — insert before `export function stepShells(state, input){`.
7. **WIRE** — insert after `if (D.arm084) arm084(state, D, ctx, input, out, fresh);` in stepShells.
8. The joint snapshot loop in stepShells (`for (const p of Object.values(sp.forms)) for (const m of [].concat(p.modes || [],
   p.left || [], p.right || [])){`) -> `for (const p of Object.values(sp.forms || {}).concat(sp.any ? [sp.any] : [])) for
   (const m of [].concat(p.modes || [], p.left || [], p.right || [], p.leftG || [], p.rightG || [])){` — without it every
   em084 step throws (`Object.values(undefined)`).
9. **params11n** — its return's last line `words: [...], b1690: I(4) !== -1 };` gains `efAt: { 0x15c8: null, 0x15cc: null,
   0x15d0: null }` (§2's runtime error). This changes HEAD's shell11 0 ((7, 0x1b) form 1): it no longer starts u_r 10 at its
   own init (its three shell01 2 still do).

New viewer input (optional): **`input.parts084`** = `{ 2: level, 3: level, 4: level }`, the body parts' break levels the gate
reads (`0x9d36c`); absent = 0 = unbroken = the shells fire. Which body parts 2 / 3 / 4 are is NOT READ (spec §4b) — index.html
wiring is the shells agent's call. The L0 M4 pick list `['7:0x0a', '7:0x0d', '2:0x07']`: (2, 7)'s records are shell48 only
(no runtime: refused by name); drop it from `picks` if a refusal-only pick is unwanted.

### The blocks (verbatim from `gapC/blocks.js`)

#### S00COMMENT

```js
// stage. Modes 0..8 (the rank pair, (7, 0xb) / (7, 0x25): arm084's `any` rows), 1 (shell11 modes 2..4's fall: createFall084) and
// 65 / 66 (the body's record table: records084) are the files' values (gapC 2026-10-20: each re-dumped from the arc, equal).
```

#### DATA

```js
// THE RANK PAIR, arm (7, 0xb) / (7, 0x25) (gapC 2026-10-20, READ; dev/em084-shells-spec.md 5 rows (7, 0xb) / (7, 0x25)). The arm's
// status-7 switch 0x108389c (the number byte +0x73e1, table 0x10838c4): 0xb -> 0x10851bc, 0x25 -> 0x10879a4 (control: 0x1b ->
// 0x10867a4, the (7, 0x1b) row above). NO FORM TEST in either: phase 0 blends (0xb03f8: (7, 0xb) 0x201 / 0x202 = l_2 / r_2 M1 + M2,
// weight 0x107de38(arm, 1); (7, 0x25) 0x232 / 0x233 = M50 + M51, weight 0x107de38(arm, 4)); phase 1 runs its speed windows (0xb07b4)
// and at the crossing of the BODY's tune float (0x6f618 through [arm+0xcadc]) on the arm's own clip (0xb0968 op 0: pass001) calls
// 0x107c0cc(arm, idx): (7, 0xb) tune 1 = 120 (0x10853a8..0x10853d8, idx 0), (7, 0x25) tune 8 = 108 (0x1087b38..0x1087b68, idx 1);
// the action ends at its clip's end (0xb09c8 -> vt +0x3dc). 0x107c0cc: the quest rank 0x3a8430 > 4 (`cmp r0, #4; bgt`, 0x107c0ec)
// and the kind [arm+0xcae0] (1 left, 2 right) pick the jump table (0x107c304 k1, 0x107c128 k2; G 0x107c3e8 / 0x107c220): idx 0 ->
// k1 0 / k2 3, G 5 / 7; idx 1 -> k1 2 / k2 4, G 6 / 8 (`left` / `right`, `leftG` / `rightG`). The request 0x3f883c(0x30)
// (0x107c4ac..0x107c544): id 0x16c, the mode, owner the arm, +0x10.. [0x1831a78] = 0x19176b0 (zero), +0x1c 0, +0x20.. 0x1620e60
// (zero), +0x2c 0, +0x2e 0xffff -- make00n's. Modes 0..8: the ARM's joint 12, flags 8 (bit 3: the offset turned by the arm's words
// after degY), vz 50, flight 500, no gravity; u 1 (0..4) / u 4 (5..8) flying, u 2 / u 5 at a type 0 / 2 contact, nothing of their
// own on the floor (ef 2 = (999, -1)) -- there shell01 0 (CHILD084). (7, 0x11) / (7, 0x12) also play M1 + M2 and (7, 0x26) M50 +
// M51, but those fire beams only (0x107ca4c) and nothing issues them (render/beam-spawns.js em084_00 note): the clips are
// (7, 0xb)'s / (7, 0x25)'s, as render/monster.js ROM_ARM_PAIRS '2|Motion[1]' / '2|Motion[50]' pair them (ordered left (7, 0x9a)
// / right (7, 0x68); left (7, 0xfd) / right (7, 0xcb)). NAMED, NOT MODELLED: the blends and the speed windows, as above.
SHELL_DATA.em084_00.arm084.push(
  { action: [7, 0x0b], list: '2', clip: 'Motion[1]', tune: 1, spawns: [
    { frame: 120.0, any: { shell: 'shell00', left: [0], right: [3], leftG: [5], rightG: [7] } }] },
  { action: [7, 0x25], list: '2', clip: 'Motion[50]', tune: 8, spawns: [
    { frame: 108.0, any: { shell: 'shell00', left: [2], right: [4], leftG: [6], rightG: [8] } }] },
);
// shell11 MODE 2 -- the body's (7, 0x43) (body084 below). The files' values (em084_00_11_sh002 / _ef002 / _hit002, ShellScale 1.0):
// int 0 = 20 creates, the times (k + 1) x float 3 = 150, 300, .. 3000 (params11n), int 2 = -1 -> the base point the OWNER's +0x40
// (the body's block point), sh vecs 0..19 the offsets turned by the owner's Y word (createFall084); ef 0 = u 21 (list 0), started at
// each create's point; the hit file is empty (no slot). int 4 = 0 sets byte +0x1690, which nothing in sp_11's band
// (0x1089fb0..0x108a954), base11's (0x402f80..0x403200) or base01's (0x3fa2bc..0x3fb600) reads (movw / #0x90 scan; control: the
// same scan finds +0x1690's two writes 0x108a02c / 0x108a314 and the create's +0x1680 reads 0x108a2c0 / 0x108a3f8). Modes 3 / 4
// have files but no spawner (dev/em084-shells-spec.md 7): not listed.
SHELL_DATA.em084_00.shells.shell11.modes[2] = { scale: 1.0, ef: [[0, 21]], hit: [], sh: { ints: [20, -1, -1, -1, 0], floats: [0.0, 0.0, 0.0, 150.0],
  vecs: [[0, 0, 2500], [0, 0, -2500], [2500, 0, 0], [-2500, 0, 0], [1500, 0, 1500], [1500, 0, -1500], [-1500, 0, 1500], [-1500, 0, -1500],
         [0, 0, 1500], [0, 0, -1500], [1500, 0, 0], [-1500, 0, 0], [1000, 0, 2000], [1000, 0, -2000], [-1000, 0, 2000], [-1000, 0, -2000],
         [1000, 0, 1000], [1000, 0, -1000], [-1500, 0, 1500], [-1000, 0, -1000]] } };
// shell01 0 / 1 -- sp_00's stage children (landing084 / CHILD084: 0, 2..8, 65, 66 -> 0; 1 -> 1), u 3 (list 0). The files' values
// (em084_00_01_sh000 / _sh001, ShellScale 1.5 / 0.8; hit int 0 -> record 0 (10, 60) / record 7 (10, 60)): mode 0 int 2 = 0 (its
// reader's bit 2), mode 1 no bit; both at the setup's point (the contact) and words, timer 0 (the hit slot's life).
SHELL_DATA.em084_00.shells.shell01.modes[0] = { scale: 1.5, ef: [[0, 3], [999, -1]], hit: [0], sh: { ints: [-1, -1, 0, -1, -1, -1, -1], floats: [0.0], vecs: [[0, 0, 0], [0, 0, 0]] } };
SHELL_DATA.em084_00.shells.shell01.modes[1] = { scale: 0.800000011920929, ef: [[0, 3], [999, -1]], hit: [7], sh: { ints: [-1, -1, -1, -1, -1, -1, -1], floats: [0.0], vecs: [[0, 0, 0], [0, 0, 0]] } };
// THE BODY'S OWN SHELL11, (7, 0x43) (gapC 2026-10-20, READ): the body's status-7 switch 0x1073a48 (number byte +0x73e1, table
// 0x1073a74) 0x43 -> 0x10775c0: phase 0 setMotionC L0 M63 (0xafce8(E, 0x3f, 0x11, 20.0)) and both arms (7, 0x20); every later update
// (0x107775c..) tests tune float 14 = 146 -> the beam 0x106f6a8 (render/beam-spawns.js's row: the control) and tune float 15 = 460
// (0x1077790..0x10777c0, 0xb0968 op 0) -> 0x106f74c(E, 0): 0x3fa2bc(0x40) id 0x170, mode n + 2 = 2, owner E, +0x10.. / +0x20.. the
// zero vector [0x1831a78], +0x30.. 0x1620e60 (zero), +0x3c 0xffff (0x106f74c..0x106f80c), 0x48b884. `stance` 2: the beam row of the
// same action carries it (Raven's "Stance" rule); the action has no stance test of its own.
SHELL_DATA.em084_00.body084 = [
  { action: [7, 0x43], list: '0', clip: 'Motion[63]', tune: 15, frame: 460.0, stance: 2, shell: 'shell11', mode: 2 },
];
// THE BODY'S MOTION-RECORD TABLE (gapC 2026-10-20, READ: every instruction of the walker 0x1069e78 and the spawner 0x106f354 re-read;
// dev/em084-shells-spec.md 4b agrees). [E+0xcb34] = 0x17f6420 (one writer, 0x107a964): entries { u8 status, u8 number, .., ptr }
// (8 bytes, terminator byte 0xff); the action-change hook (vt +0x204 0x1066c14, 0x10673a8..0x1067430) zeroes the six slots
// E+0xcb38..+0xcb67 and points E+0xcb30 at the entry whose bytes are the new action. Records (0x18 bytes) [motion, type, frame,
// sel, arg, flags bit 0] -- `clock` = flags bit 0; list ends at type -1. Dumped from .data (tab.py), all 13 entries.
// sel (0x106f354, table 0x106f384): 1..12 -> shell13 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20; 13 / 14 -> shell13 0 / 1; 15 /
// 16 -> shell13 21 / 22 (0x4041a8(0x40): id 0x171, +0x30 the arg, +0x34 0xffff); 17 / 18 -> shell48 0 / 1 (0x4266a0(0x18), +0x10 /
// +0x14 0); 19 / 20 -> shell00 0x41 = 65 / 0x42 = 66 (0x3f883c(0x30): id 0x16c, owner E, +0x10.. [0x1831a78] zero, +0x1c 0, +0x20..
// 0x1620e60, +0x2c 0, +0x2e 0xffff; the arg unused). Type -> layer clip (body list 2) / layer / part / .dtp A row (the break-level
// gate 0x1069fe8..0x106a030: 0x9d36c(E, part) must be BELOW byte +1 (rank <= 4) / +2 (G) of row [[E+0x75f0]+0x64][row]): 0 -> 0x246
// L2 M70 / 2 / 4 / row 3 (04 04 04 83); 1 -> 0x247 M71 / 3 / 4 / row 3; 2 -> 0x248 M72 / 4 / 3 / row 1 (03 03 03 02); 3 -> 0x249
// M73 / 5 / 2 / row 0 (02 03 03 01) (efx/agents/diablos-scratch/dtp.py em084_00, array A).
SHELL_DATA.em084_00.records084 = {
  table: [
    { action: [1, 0x0c], recs: [[0x001, 1, 40, 17, 0, 1], [0x001, 0, 100, 18, 1, 1]] },
    { action: [1, 0x0d], recs: [[0x001, 1, 40, 17, 0, 1], [0x001, 0, 100, 18, 1, 1], [0x001, 1, 190, 17, 2, 1]] },
    { action: [2, 0x06], recs: [[0x008, 1, 40, 17, 0, 1], [0x008, 0, 100, 18, 1, 1]] },
    { action: [2, 0x07], recs: [[0x004, 1, 40, 17, 0, 1], [0x004, 0, 100, 18, 1, 1], [0x004, 1, 190, 17, 2, 1]] },
    { action: [7, 0x00], recs: [[0x217, 1, 130, 1, 0, 0], [0x217, 0, 140, 2, 1, 0], [0x218, 3, 30, 5, 2, 0], [0x218, 2, 40, 6, 3, 0], [0x218, 0, 110, 2, 4, 0]] },
    { action: [7, 0x06], recs: [[0x217, 1, 10, 1, 0, 0], [0x217, 0, 50, 2, 1, 0]] },
    { action: [7, 0x07], recs: [[0x217, 1, 10, 1, 0, 0], [0x217, 0, 50, 2, 1, 0]] },
    { action: [2, 0x3a], recs: [[0x032, 1, 0, 17, 0, 1], [0x032, 0, 40, 18, 1, 1]] },
    { action: [7, 0x0a], recs: [[0x008, 0, 100, 18, 0, 1], [0x004, 2, 0, 19, 1, 1], [0x004, 2, 200, 19, 2, 1]] },
    { action: [7, 0x0d], recs: [[0x008, 0, 100, 18, 0, 1], [0x004, 3, 0, 20, 1, 1], [0x004, 3, 200, 20, 2, 1]] },
    { action: [7, 0x0e], recs: [[0x001, 2, 100, 6, 0, 1], [0x001, 2, 300, 6, 1, 1], [0x001, 2, 500, 6, 2, 1]] },
    { action: [7, 0x0f], recs: [[0x001, 3, 100, 5, 0, 1], [0x001, 3, 300, 5, 1, 1], [0x001, 3, 500, 5, 2, 1]] },
    { action: [7, 0x0c], recs: [[0x002, 1, 0, 17, 0, 1], [0x002, 0, 60, 18, 0, 1], [0x003, 1, 0, 17, 0, 1], [0x003, 0, 60, 18, 0, 1]] },
  ],
  sel: { 1: ['shell13', 8], 2: ['shell13', 9], 3: ['shell13', 10], 4: ['shell13', 11], 5: ['shell13', 12], 6: ['shell13', 13],
         7: ['shell13', 15], 8: ['shell13', 16], 9: ['shell13', 17], 10: ['shell13', 18], 11: ['shell13', 19], 12: ['shell13', 20],
         13: ['shell13', 0], 14: ['shell13', 1], 15: ['shell13', 21], 16: ['shell13', 22], 17: ['shell48', 0], 18: ['shell48', 1],
         19: ['shell00', 65], 20: ['shell00', 66] },
  parts: [4, 4, 3, 2],                       // the part each type's gate asks (0x1069f78.. jump table 0x1069f98: r0)
  limits: { 4: [4, 4], 3: [3, 3], 2: [3, 3] }, // [byte +1 (rank <= 4), byte +2 (G)] of the .dtp A row (rows 3 / 1 / 0)
  // the layer clips L2 M70..M73: 133 frames each (the viewer's body list 2); the shell at layer frame >= 58.0 (0x106a09c literal)
  layerLen: 133.0, at: 58.0,
  // the plays the viewer names on L0 M4 (pickVariantsFor): the three record actions whose records are on L0 M4 ((7, 0xa) / (7, 0xd)
  // play L0 M8 then L0 M4: 0x1075d88, both numbers one function; (2, 7)'s records make shell48, which has no runtime -- refused)
  picks: ['7:0x0a', '7:0x0d', '2:0x07'],
};
```

#### RANK

```js
  // 0x107c0cc's rank arm (the quest rank 0x3a8430 > 4: `cmp r0, #4; bgt` at 0x107c0ec), where a row names one (`leftG` / `rightG`)
  const G = !!(ctx.own001 && ctx.own001.rank > 4);
  const modes = (G && pick[side + 'G']) || pick.modes || pick[side] || [];
```

#### FALL

```js
// NAKARKOS's sp_11 +0x168, MODES 2..4 (0x108a508..0x108a778; READ gapC 2026-10-20): modes 2 / 3 -- the point = the base +0x1680 plus
// sh vec k turned by the Y word +0x166c (0x108a3c4..0x108a438: create11n's operations; 0x108a508..0x108a530 -> sp+0x10); mode 4
// (0x108a63c) -- sh vec k itself (0x4a2584(shell, k, -1)), added to nothing. Then, with ef +0x1664 set (the reader's ef 0: u 21), a
// requester (0x40a54) filled by 0x4a10c8(shell, &rq, vt+0x130(shell), 0, byte +0x1054, &point, -1) and started by 0x4a11e4(shell,
// ef, &rq), the requester released at once (0x40a94): a start no handle keeps (kind 'create'). Then SHELL00 MODE 1 (0x3f883c(0x30),
// 0x108a5a0..0x108a634): id 0x16c, +0x10.. the point, +0x1c 0, +0x20.. 0x1620e60 (zero), +0x2c 0, +0x2e 0xffff, the owner
// 0x4a0f00(shell) -- the body for (7, 0x43)'s -- by 0x48b884 (the init at once: make00n, his reader params084s00 -> flags 0x18, so
// init00's request arm: the position the request's +0x10, the offset (0, 7000, 0) turned by the owner's words (bit 3), gravity
// (0, -1.2, 0), flight 1000; on the stage its landing (landing084) makes shell01 1). The owner is active (0x4a0f38) in the viewer.
function createFall084(S, idx, ctx, D){
  const m = S.modeIndex;
  if (m < 2 || m > 4) return;                                // 0x108a444..0x108a45c: modes 2..4 here, 0 in create11n, others nothing
  const sh = S.mode.sh, v = idx < sh.vecs.length ? sh.vecs[idx].map(f) : [0, 0, 0];
  let P;
  if (m === 4) P = v.slice();
  else {
    const r = f(u16(S.k.words[1]) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), B = S.k.base;
    P = [f(mla(f(v[0] * cs), v[2], sn) + B[0]), f(v[1] + B[1]), f(mls(f(v[2] * cs), v[0], sn) + B[2])];
  }
  const def = D.shells[S.shell];
  if (S.mode.ef[0]){
    const rq = rockRequest(D, S.mode, 0, P, 'create', def.lists || D.lists);
    S.events.push(rq ? { ev: 'start', param: 0, kind: 'create', start: rq } : { ev: 'refused', param: 0, kind: 'create' });
    if (rq){ if (S.effects && S.effects[0]) S.effects[0].started = true; ctx.out.started.push({ shell: S, start: rq }); }
  }
  const state = ctx.shellState, own = Object.assign({}, S.ownArm || ctx.own001, { requestPos: P.slice() });
  const C = make00n(state, D, 1, ctx.J, own, ctx, S.action, S.spawnFrame);
  S.events.push({ ev: 'create', stepped: true, shell: 'shell00', id: D.shells.shell00.id, mode: 1, position: P.slice(),
                  angles: [0, 0, 0], child: C ? C.id : null, deleted: !C });
  if (C){ if (S.arm){ C.arm = S.arm; } C.creator = S.id; state.shells.push(C); ctx.out.spawned.push(C); }
  else ctx.out.refused.push({ shell: 'shell00', mode: 1, creator: S.id, why: 'shell00 1 (sp_11 create 0x108a5a0): init00 refused (no request point)' });
}
```

#### PICK

```js
  // Nakarkos's motion-record actions on L0 M4: one a play (SHELL_DATA.em084_00.records084.picks; records084)
  if (D.records084 && String(list) === '0' && String(clip).replace(/_(start|loop)$/, '') === 'Motion[4]') return D.records084.picks.slice();
```

#### BODY

```js
// NAKARKOS's BODY SPAWNS (gapC 2026-10-20). body084: the body's own action code, line 4 (pass001 on the frame pair it saw, the
// previous pose's joints) -- (7, 0x43) L0 M63 f460 -> shell11 2 (SHELL_DATA.em084_00.body084).
function body084(state, D, ctx, input, out, fresh){
  if (fresh || !state.hist || !input.clip) return;
  const clip = String(input.clip).replace(/_(start|loop)$/, '');
  for (const row of D.body084){
    if (row.list !== String(input.list) || row.clip !== clip) continue;
    const st = input.beamState && input.beamState.stance;
    if (row.stance != null && st != null && st !== row.stance) continue;   // the stance its beam row is tied to (render/beam-spawns.js)
    if (!pass001(state, f(row.frame))) continue;
    const own = ctx.own001, why = missing001(own, { pos: true });          // params11n's base point: the owner's +0x40 (int 2 = -1)
    if (why){ out.refused.push({ action: row.action, shell: row.shell, mode: row.mode, why }); continue; }
    const def = D.shells[row.shell];
    const S = make001(state, D, row.shell, { id: def.id, mode: row.mode, position: [0, 0, 0], angles: [0, 0, 0], action: row.action, frame: row.frame },
                      own, state.prevJoints || ctx.J, ctx, null);
    if (S){ state.shells.push(S); out.spawned.push(S); }
  }
}
// records084: THE BODY'S MOTION-RECORD WALKER 0x1069e78 (body vt +0x2a8 0x1069b88's first call, every frame; READ gapC 2026-10-20),
// over SHELL_DATA.em084_00.records084. The play's pick (input.rock.variant, pickVariantsFor) names the action -- the entry
// 0x10673a8..0x1067430 points +0xcb30 at; a pick with no entry: nothing (0x1069e98). Each step:
//   the clock: +0xcb6c = +0xcb68; +0xcb68 += 0xb0900(E) x [E+0x1c] (vmla, 0x1069ea0..0x1069ecc) -- ctx.speed x ctx.dt; zeroed by vt
//     +0x3d8 0x106ca78 (+0xcb68 = +0xcb6c = 0), which the setMotion 0xafce8 calls first (0xafd08): the viewer's clip start (fresh).
//     A clip's own loop does not zero it (the frames since the clip was SET, not its frame);
//   loop 1, every record of the entry whose motion is the body's (0xb0950): flags bit 0 clear -> 0xb0974(E, f) on the body clip
//     (pass001); set -> prev <= f < clock (0x1069f44..0x1069f68: `ble` / `bhi`). Types 0..3 then ask the part's break level
//     (input.parts084[part], default 0 = unbroken: the ROM's 0x9d36c) against the .dtp limit (records084.limits, by rank > 4) --
//     at or above it, nothing; then a FREE slot [type] (+0xcb38 + 8 type == 0) -> 1, the record kept at +0xcb3c, and vt +0x78 =
//     0x72630 plays the layer clip 0x246 + type on layer type + 2 (start 0.0, 0.0, 1.0). Types 4 / 5: no part test, no layer;
//   loop 2, slots 0..5 (0x106a0bc..0x106a144): 2 -> freed when its layer clip ended (0x94dc04); 1 -> type & ~1 == 4: freed and the
//     shell at once; else the layer's frame [E+0x77c + 0x140 k] >= 58.0 -> 2 and the shell: 0x106f354(E, sel, arg).
// NAMED STAND-INS: the viewer does not play the additive layer clip, so its frame is counted here -- 0.0 on the record's step,
// + ctx.dt each later step (the motion update before vt +0x2a8, and one layer frame per frame at its rate: INFERRED), ended at
// records084.layerLen (0x94dc04's own test not read); a new play or a new pick is the action's start (slots and clock zeroed --
// the viewer's clip is one action's one motion). The shell00 (make00n: init00, his reader) on the previous pose's body joints
// (212 / 213), the body as owner; shell13 / shell48 sels are refused by name.
const actName084v = a => a[0] + ':0x' + a[1].toString(16).padStart(2, '0');
function records084(state, D, ctx, input, out, fresh){
  const R = D.records084, v = input.rock && input.rock.variant;
  const W = state.rec084 || (state.rec084 = { variant: undefined, clock: f(0), prev: f(0), slots: [null, null, null, null, null, null] });
  if (fresh || W.variant !== v){ W.variant = v; W.clock = f(0); W.prev = f(0); W.slots = [null, null, null, null, null, null]; }
  if (!input.clip) return;
  const entry = R.table.find(e => actName084v(e.action) === v);
  if (!entry) return;
  const clip = String(input.clip).replace(/_(start|loop)$/, ''), mid = motionIdOf(String(input.list), clip);
  for (const sl of W.slots) if (sl && sl.layerNo >= 0) sl.layer = f(sl.layer + ctx.dt);
  W.prev = W.clock; W.clock = mla(W.clock, ctx.speed, ctx.dt);
  const own = ctx.own001, parts = input.parts084 || {};
  for (const rec of entry.recs){
    const [motion, type, F, , , clock] = rec;
    if (motion !== mid) continue;
    const hit = clock ? (W.clock > F && W.prev <= F) : (!fresh && !!state.hist && pass001(state, f(F)));
    if (!hit) continue;
    if (type <= 3){
      const part = R.parts[type], lim = R.limits[part][own.rank > 4 ? 1 : 0];
      if ((parts[part] | 0) >= lim) continue;
    }
    if (W.slots[type]) continue;
    W.slots[type] = { state: 1, rec, layer: f(0), layerNo: type <= 3 ? type + 2 : -1, clipId: type <= 3 ? 0x246 + type : 0 };
  }
  for (let k = 0; k < 6; k++){
    const sl = W.slots[k];
    if (!sl) continue;
    if (sl.state === 2){ if (!(sl.layer < R.layerLen)) W.slots[k] = null; continue; }
    if ((sl.rec[1] & ~1) === 4){ W.slots[k] = null; rec084Spawn(state, D, ctx, out, entry, sl.rec); continue; }
    // `vcmpe` / `blt` (0x106a10c..0x106a11c): below 58.0 (or unordered) waits
    if (sl.layer >= R.at){ sl.state = 2; rec084Spawn(state, D, ctx, out, entry, sl.rec); }
  }
}
function rec084Spawn(state, D, ctx, out, entry, rec){
  const [motion, type, F, sel, arg] = rec, to = D.records084.sel[sel];
  if (!to) return;                                           // 0x106f364: sel outside 1..20 -> nothing
  const [name, m] = to;
  if (name !== 'shell00' || !D.shells.shell00.modes[m]){
    out.refused.push({ action: entry.action, shell: name, mode: m, sel, arg,
                       why: name === 'shell48' ? 'uShellEm084_sp_48 (base48): not in SHELL_DATA -- no runtime for his base48 (dev/em084-shells-spec.md 8)'
                                               : 'the body\'s ' + name + ' mode ' + m + ' (0x106f354 sel ' + sel + '): not in SHELL_DATA' });
    return;
  }
  const S = make00n(state, D, m, state.prevJoints || ctx.J, ctx.own001, ctx, entry.action, f(F));
  if (S){ S.record084 = { motion, type, sel, arg }; state.shells.push(S); out.spawned.push(S); }
  else out.refused.push({ action: entry.action, shell: 'shell00', mode: m, why: 'no matrix for the body\'s joint ' + D.shells.shell00.modes[m].sh.ints[0] });
}
```

#### WIRE

```js
  if (D.body084) body084(state, D, ctx, input, out, fresh);       // his body's own shell11 ((7, 0x43) L0 M63 f460), line 4
  if (D.records084) records084(state, D, ctx, input, out, fresh); // his body's motion-record table (vt +0x2a8 0x1069e78), line 4
```

## (c) rom-map rows (proposed; a new section after "Nakarkos -- the tentacle-form shells, phase 2")

### Nakarkos -- the rank pair, shell11 2's fall and the record table's shell00 (research helper for the shells lane, 2026-10-20; scratchpad gapC/RESULT.md)

Records em084_00u:1 / 2 / 4 / 5 / 10 never started: no row made sp_00 0..8, 1, 65 / 66. Transcribed: docs/render/shells.js arm084 `any` rows (7, 0xb) / (7, 0x25) + armSpawn084's rank arm, SHELL_DATA shell11 mode 2, shell01 0 / 1, body084, records084 + records084 / rec084Spawn, createFall084, the L0 M4 picks, params11n `efAt`. Static (`efx/armdis.py`); the table dumped from .data; files from the arc.

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x108389c` / table `0x10838c4` | arm status-7 switch on `+0x73e1` (≤ 0x2e): 0xb → `0x10851bc`, 0x25 → `0x10879a4`, 0x11 / 0x12 → `0x1085bd4`, 0x26 → `0x1087bc0`, 0x1b → `0x10867a4` (control) | uEmOstgaloaArm | R | shells.js arm084 |
| `0x10851bc` | arm (7, 0xb): phase 0 `0xb03f8(0x201, 0x202)` l_2 / r_2 M1 + M2 (weight `0x107de38(arm, 1)` → `+0xcb08`; `+0xcb04` = tune 2 deg, consumer NOT READ); phase 1 windows `0xb07b4`; **tune 1 = 120** (op 0) → `0x107c0cc(arm, 0)` `0x10853d8`; clip end → vt+0x3dc. No form test | uEmOstgaloaArm | R | shells.js arm084 (7, 0xb) |
| `0x10879a4` | arm (7, 0x25): `0xb03f8(0x232, 0x233)` M50 + M51 (weight `0x107de38(arm, 4)`); **tune 8 = 108** → `0x107c0cc(arm, 1)` `0x1087b68`. No form test | uEmOstgaloaArm | R | shells.js arm084 (7, 0x25) |
| `0x107c0cc` (upgrades row "`0x107c0cc` / `0x107c628`" for idx 0 / 1) | rank `0x3a8430 > 4` at `0x107c0ec`, kind `+0xcae0`; tables `0x107c304` / `0x107c128` / `0x107c3e8` / `0x107c220`: idx 0 → k1 0 / k2 3, G 5 / 7; idx 1 → 2 / 4, G 6 / 8; request `0x3f883c(0x30)` +0x10 / +0x20 zero, +0x2e 0xffff, owner the arm | uEmOstgaloaArm | R | shells.js arm084 `left/right/leftG/rightG` |
| `0x1085bd4` / `0x1087bc0` | arm (7, 0x11) / (7, 0x12) M1 + M2 and (7, 0x26) M50 + M51: beams only (`0x107ca4c`), no `0x107c0cc`; never issued (beam-spawns.js) — l_2 / r_2 M1 / M50 are (7, 0xb)'s / (7, 0x25)'s | uEmOstgaloaArm | R | shells.js arm084 note |
| `0x10775c0` | body (7, 0x43): `0xafce8(E, 0x3f)` L0 M63, arms (7, 0x20); f86 vt+0x78 L2 M70 on layer 2; every later update: tune 14 = 146 → beam `0x106f6a8`, **tune 15 = 460** → `0x106f74c(E, 0)` | uEm084_00 | R | shells.js body084 |
| `0x106f74c` | shell11 request `0x3fa2bc(0x40)`: id 0x170, mode n + 2 (n ≤ 2; one caller, n = 0), owner E, +0x10 / +0x20 zero, +0x30.. `0x1620e60`, +0x3c 0xffff | uEm084_00 | R | shells.js body084 |
| `0x108a330` modes 2..4 (upgrades row "`0x108a330`" from R (mode 0)) | `0x108a508` (2 / 3): point = base +0x1680 + sh vec k turned by +0x166c; `0x108a63c` (4): point = sh vec k; ef +0x1664 at the point (`0x4a10c8` / `0x4a11e4`, requester released `0x40a94`: no handle); **shell00 1** `0x3f883c(0x30)` +0x10 the point, +0x20 `0x1620e60`, +0x2e 0xffff, owner `0x4a0f00(shell)` | uShellEm084_sp_11 | R | shells.js createFall084 |
| sp_11 `+0x1690` | int 4 ≠ −1 (mode 2 sets it): no reader in sp_11's band, base11's `0x402f80..0x403200` or base01's `0x3fa2bc..0x3fb600`; control: the scan finds its writes `0x108a02c` / `0x108a314` and `+0x1680`'s reads | uShellEm084_sp_11 | R (negative with control) | shells.js SHELL_DATA shell11 2 note |
| `0x402fd8` → `0x3fa498` `0x3fad08..0x3fad1c` | base11's init runs base01's, whose ef starts read `[+0x15c8]` / `[+0x15cc]` and skip on 0; sp_11's reader writes ef 0 to `+0x1664` only (`0x108a060`) → **sp_11's init starts nothing** | uShellEmBase11 / sp_11 | R | shells.js params11n `efAt` (HEAD started u_r 10 at shell11 0's init) |
| `0x1069e78` (re-read; row "`0x17f6420` / ..." stands) | walker: clock `+0xcb68 = vmla(+0xcb68, 0xb0900(E), [E+0x1c])`, prev `+0xcb6c`; clock records fire on **cur > f ≥ prev**; frame records `0xb0974`; types 0..3 gate `0x9d36c(E, part) <` .dtp byte (+1 / +2 by rank > 4), slot free → 1, vt+0x78(E, type + 2, 0x246 + type, 0, 0, 0, 1.0); loop 2: slot 2 freed at `0x94dc04`, slot 1 → 2 + `0x106f354` at layer frame `[E+0x77c+0x140k]` ≥ **58.0** (`0x106a160`); types 4 / 5 spawn at once | uEm084_00 | R | shells.js records084 |
| `0x106ca78` / `0xafd08` | body vt +0x3d8 zeroes `+0xcb68` / `+0xcb6c`; **`0xafce8` calls vt +0x3d8 first** → the record clock counts from that setMotion (closes spec §4b's INFERRED for `0xafce8`) | uEm084_00 / shared | R | shells.js records084 |
| `0x10673a8..0x1067430` | action start: `+0xcb30` = the table entry of the new action, `0x13ecbfc(+0xcb38, 0x30)`, `E+0x78c / 0x8cc / 0xa0c / 0xb4c` (layers 2..5 `+0x5c`) = 1.0 (meaning NOT READ) | uEm084_00 | R / I (+0x5c) | shells.js records084 |
| `0x1075d88` | body (7, 0xa) AND (7, 0xd) (switch entries 0xa / 0xd): L0 M8, arms (7, 5); at its end L0 M4 (`0xafce8(E, 4, .., 2.0)`) + `0x78acc`; then `0x78b78` turn until done → vt+0x3dc | uEm084_00 | R | shells.js records084 picks |
| `0x106f354` sel 19 / 20 (`0x106f560` / `0x106f5cc`) | shell00 **0x41 = 65 / 0x42 = 66**: `0x3f883c(0x30)`, owner E, +0x10 zero, +0x20 `0x1620e60`, +0x2e 0xffff; the arg unused; sel table `0x106f384` all 20 read | uEm084_00 | R | shells.js records084.sel |
| INFERRED | the record's layer clip advances one frame per body frame from the frame after it is set (shell = record + 58), and ends at its length 133; neither the layer rate nor `0x94dc04` read | — | I | shells.js records084 (named stand-in) |
| trap | `make001` starts ef params 0 / 1 at ANY base11 init unless its reader returns `efAt`; a reader that puts its ef elsewhere (Nakarkos's `+0x1664`) then starts an effect the ROM never starts. Not yet checked: params081s11, params057s11, params046s11, params071s11, params011s11, params013s11 (params050s11 returns efAt) | — | I (the others) | shells.js make001 |

**No WITHDRAWN entries.** Nothing read here contradicts a rom-map row: rows "`0x107c0cc` / `0x107c628`" and "`0x108a330`" are
upgraded (emulated → read; mode 0 → all modes). The superseded statements are shells.js comments (shell00's "no row here makes
them yet", create11n's "modes 2..4 ... NOT TRANSCRIBED ... refused by name") and its behaviour (shell11's init start) — the trap row.

Note index addition: `scratchpad gapC/RESULT.md` (until the shells agent moves it into a dev note).

## (d) The replay — `gapC/replay.mjs`

`python patch.py` builds `gapC/shells.patched.js` (the HEAD file with edits 1..9; its three imports pointed back at the repo's
modules). `node replay.mjs` runs the same cases on the patched copy and on HEAD (the negative control). Inputs as
`fb/reasonsD/arm084.mjs`: `attachedJoints` (identity joints translated by gid), `arms.left/right.frame` (identity at ±300, 400,
200), `owner.y = 0x3000`, `ownerPos`, `hitLife`, `rock.floorY = 0` and a wall (`axis z, at 3000, facing -1`) so a type-0
contact exists. Output: `gapC/replay.txt`. Summary (patched):

| case | spawned | em084_00u starts |
|---|---|---|
| l_2 M1, rank 3 (form 0 / none / exposed alike) | shell00 **0** @121 | **u 1** @121, **u 2** @170 (wall) |
| r_2 M1, rank 3 | shell00 **3** @121 | u 1, u 2 |
| l_2 / r_2 M1, rank 5 | shell00 **5** / **7** @121 | **u 4**, **u 5** (wall) |
| l_2 / r_2 M50, rank 3 / 5 | shell00 **2** / **4**, G **6** / **8** @109 | u 1 + u 2 / u 4 + u 5 |
| L0 M63, stance 2 | beam @147 (control), shell11 **2** @461, shell00 **1** ×20 (every 150 from @611; y 7015), shell01 1 ×20 on the floor | u 20 (beam), **u 21** ×20 (create), **u 1** ×20, u 3 ×20 |
| L0 M63, stance 1 | nothing (as its beam) | — |
| L0 M4, pick 7:0x0a | shell00 **65** @58 and @258 (joint 212), shell01 0 on the floor | **u 10** @58 / 258, **u 2** (floor), u 3 |
| L0 M4, pick 7:0x0d | shell00 **66** @58 / @258 (joint 213) | u 10, u 2, u 3 |
| L0 M4, pick 2:0x07 | — | refused ×3 by name (shell48: no runtime) |
| L0 M4, 7:0x0a, parts084 {3: 3} | nothing (control: part 3 at its .dtp limit) | — |
| L0 M4, 7:0x0d, parts084 {2: 2}, rank 3 | 66 @58 / 258 (below the limit 3) | u 10, u 2, u 3 |
| L0 M4, no pick | nothing | — |

HEAD (control): pickVariantsFor L0 M4 = `[]`, and every case above spawns nothing but the L0 M63 beam.
`gapC/m93.mjs <shells.js>`: (7, 0x1b) form 1 — HEAD's shell11 0 carries `em084_00u_r:10` at its init, the patched copy's none.

Files: `gapC/RESULT.md` (this), `gapC/blocks.js` (the JS blocks, exact), `gapC/patch.py`, `gapC/shells.patched.js`,
`gapC/replay.mjs`, `gapC/replay.txt`, `gapC/m93.mjs`, `gapC/dd.py` (sweep disassembler), `gapC/tab.py` (the table dump),
`gapC/shl11.py` (the files' dump), `gapC/c0cc.txt`, `a25.txt`, `sw.txt`, `c11.txt`, `rec.txt`, `f354.txt` (listings).
Not done (out of brief): the viewer, a soak, index.html wiring of `parts084`, the HEAD dev checks (the shells agent's run).
