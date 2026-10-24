# gapG -- Gammoth / Elderfrost leg snow (em083_00u:60 / :61, em083_04u:60): the maker found (gapG helper, 2026-10-20)

The records' shells are made by `0x105fd94` (sp_01 modes 3..6). No earlier census caught it because its gate (`0x1053d8c`) reads
the snow slots e+0xcb50.., and the census runs on zeroed memory (slots 0 = bare -> no break). Gammoth's sp_01 **20** (u 60, joint
157) is **never made**. Nothing in vt+0x204 / the snow machine / (10, 0x72) / (10, 0x74) makes a shell.

Files (all in this folder): `static_scan.py`, `callers.py` (the static scan), `cen_legsnow.py` (census, slots poked) -> `cen_v0.txt`
/ `cen_v4.txt` / `cen_v4_l1.txt` / `cen_v0_nopoke.txt`, `frames_legsnow.py`, `dur_check.py` / `dur_check_l1.py`, `setup_check.py`,
`watch_sites.py` / `watch_all.py`, `patch_legsnow.py` -> `shells.patched.js`, `replay.mjs` -> `replay.out` (17 / 17),
`mk_check.py` -> `legsnow-check.mjs` -> `legsnow-check.out` (ROM vs module: 18 / 18), regression `reg-gammoth-check.mjs` /
`reg-elderfrost-check.mjs` (the repo's two checks on the patched copy: 28 / 28 and 35 / 35).

## (a) Facts

### The maker -- READ (whole, `0x105fd94..0x10601c8`)

`0x105fd94(e)`: zeroes four stack flags (leg 0..3) and calls `0x1053710(e, &f0, &f1, &f2, &f3)`. Then, for each leg k in 0..3
(part 2 + k), if its flag is set:
- `0x9d36c(e, 2 + k) == 0` (that part's break level is 0) -> sp_01 mode **3 + k** (`0x105fe24` / `0x105ff1c` / `0x1060014` /
  `0x106010c`: `mov r2, #3..#6`), id `e+0xcae4`. The setup is 0x3fa2bc(0x40, 0x10): +0x10..+0x18 = block [e+0x1428] +0x40..+0x48 (the
  point), +0x20..+0x28 = a literal zero vector, +0x30..+0x38 = block +0x50 / +0x54 / +0x58 (the whole words), +0x3c = 0xffff;
  `0x48b884(mgr, setup, 0, 0)`. This is the same setup as `0x1060e28` (the trunk's sp_01 20). Checked under trgen with the block
  poked (`setup_check.py`): point (100.5, 200.25, -300), words 0x1111 / 0x2222 / 0x3333 at +0x30.
- then, made or not, `0x1054624(e, k, 0)`.

After the four legs: `0x105413c(e)` (it packs the base levels into e+0xcb24) runs if any flag was set.

`0x1054624(e, slot, level)` -- READ (whole, `0x1054624..0x105465c`): next[slot] (e+0xcb68 + 4 slot) = level; if level <= 4 and
e+0x7420 != 0, base[slot] (e+0xcb38 + 4 slot) = `0x16a25b0[level]`. The shed leg lands at 0 on the next move step (0x105006c's
next -> current copy, states-em083_00.md 4). So a leg sheds once per play.

The map: leg k = part 2 + k = snow slot k = mode 3 + k = the mode's joint int 1, which is 7 / 11 / 14 / 17 in both files (the shl
dumps; SHELL_DATA shell01 modes 3..6).

### The hits -- READ (whole, `0x1053710..0x1053d84`)

`0x1053710(e, r1 = &f0, r2 = &f1, r3 = &f2, [sp] = &f3)` switches on the action NUMBER byte e+0x73e1 only (no status test). The
table is at `0x1053748` (index number - 0x32, 0..0x3f; base 0x1053758); numbers < 0x32 are handled at `0x1053900`. At each frame F
it calls `0xb0968(e, 0, 0, F, 0.0)` (the frame-crossed gate, channel 0). F is a tune float (`0x6f618`). When the gate passes, it
calls `0x1053d8c(e, part, dmg)` with dmg = a tune int (`0x6f62c`; variant 4 uses its own index, through `movweq` after
`e+0xb5f5 == 4`), and stores the result in that leg's flag:

| number(s) | site | F (float idx) -> part (leg), int v0 / v4 |
|---|---|---|
| 0, 0x32 | 0x1053a58 | 116 (0x45) -> 2 (0), 6 / 7 |
| 1 | 0x105391c | 100 (0x46) -> 3 (1), 8 / 9 |
| 5, 6 | 0x1053abc | 208 (0x4b) -> 3, 0x12 / 0x1a; 216 (0x4c) -> 2, 0x13 / 0x1b; 230 (0x4d) -> 4, 0x14 / 0x1c; 260 (0x4e) -> 3, 0x15 / 0x1d; 268 (0x4f) -> 5, 0x16 / 0x1e; 310 (0x50) -> 2, 0x17 / 0x1f; 388 (0x51) -> 2, 0x18 / 0x20; 390 (0x52) -> 3, 0x19 / 0x21 |
| 0x5a, 0x5b | 0x1053858 | 170 (0x47) -> 2, 0xa / 0xc; 172 (0x48) -> 3, 0xb / 0xd |
| 0x5c, 0x5d | 0x105395c | 170 (0x49) -> 2, 0xe / 0x10; 172 (0x4a) -> 3, 0xf / 0x11 |
| 0x70 / 0x71 | 0x1053a04 | 30 (0x89) -> 2 / 3 (`cmp r0, #0x70` / `moveq r8, r6` / `movweq r1, #2`), 0x31 both |

The tune values come from each monster's own action_tune; the floats are equal in both files.
- **v0 ints:** 6..0x12 = 500; 0x13 = 0; 0x14 = 500; 0x15 = 0; 0x16 / 0x17 = 500; 0x18 / 0x19 = 0; 0x31 = 80.
- **v4 ints:** 7 / 9 / 0xc / 0xd / 0x10 / 0x11 / 0x1a / 0x1f = 500; 0x1b..0x1e / 0x20 / 0x21 = 0; 0x31 = 80.

### The gate -- READ (whole, `0x1053d8c..0x1053f1c`), an upgrade of the existing rom-map row

`0x1053d8c(e, part, dmg)`: slot = `0x16a2590[part - 1]`, then cur = e+0xcb50 + 4 slot.
- `(cur | 4) == 4` (0 or 4) -> returns 0.
- **Variant 4** (`0x1053df4..0x1053e50`): durability (s16 [e+0x1428] + 0x3c0 + 12 part) -= (dmg x [0xba9f0(e, 2) + 0xc]), at least
  1 when dmg > 0.
- **Variant 0** (`0x1053e54..0x1053e78`): dmg >= 1 -> **durability = 0**. There is no rate on this variant. dmg 0 leaves the
  durability as it is.
- Then (`0x1053e7c..`): a durability <= 0 breaks. A durability > 0 also breaks on variant 4 when cur == 1. A break does:
  part 1 on variant 4 -> e+0xcb7c = 0 (and e+0xcb4c when e+0x7420); +0x3bd++; vt+0x410(e, part); return 1. No break -> (variant 4)
  `0x1051cf0(e)`; return 0.
- So **Gammoth breaks a leg at 1 / 2 / 3 whenever dmg >= 1** (READ). Her dmg-0 frames (216 / 260 / 388 / 390) break only a
  durability already <= 0. The durability is not a viewer input, so it is taken > 0 (INFERRED). Elderfrost breaks a slot at 1 at
  any dmg (READ). At 2 / 3 he breaks when the durability is used up (dmg 500 / 80 is taken to break: INFERRED, armour083's rule).
- Under trgen: with the durability poked to 1, the dmg-0 frames make nothing on variant 0, while variant 4 at level 1 makes them.
  Unpoked (0), they make on both. (`dur_check.py`, `dur_check_l1.py`)

### Who calls it, which clip, which phase -- READ + E

`0x105fd94` has exactly five `bl` sites: `0x1057224` (fn 0x1056a0c), `0x105781c` (0x10576c0), `0x1059e3c` (0x1059c1c), `0x1059f70`
(0x1059e98), `0x105b4bc` (0x105b420). No pointer to it exists in TEXT / RODATA / DATA (positive control: the same search finds
`0x105f1a8` at 0x17efc5c = vt+0x1b4).

Under trgen (FB_WATCH on the five sites, every status 0..15 x number x phase): only status 7 reaches them.
- (7, 0 / 1 / 0x32) phase 1 -> 0x1057224
- (7, 5 / 6) phase 1 -> 0x105781c
- (7, 0x5a / 0x5b) phase 1 -> 0x1059e3c
- (7, 0x5c / 0x5d) phase 2 -> 0x1059f70
- (7, 0x70 / 0x71) phase 1 -> 0x105b4bc

Each runs every update of that phase. The clips (phase 0's setMotion; 0x5c's phase-1 end sets L2 M37 for phase 2):
- (7, 0 / 0x32) L2 M1 (291 f)
- (7, 1) L2 M2 (277)
- (7, 5 / 6) L2 M6 (539)
- (7, 0x5a / 0x5b) L2 M37 (289)
- (7, 0x5c / 0x5d) L2 M39 -> L2 M37
- (7, 0x70) L9 M11, (7, 0x71) L9 M14 (183, em083_04 only: **em083_00 ships no list 9**)

The order within an update:
- L2 M37's sp_01 37 / 38 (0x105f4ac at 0x1059e34 / 0x1059f48) is made before the legs.
- L9 M11 / M14's sp_01 30 / 31 (0x105b5ac / 0x105b610) is made after them.

EMC reach (fb/reach_em083_*.json):
- em083_00 reaches 0, 1, 5, 6, 0x5a..0x5d. It does not reach 0x32, 0x70 or 0x71.
- em083_04 reaches 5, 6, 0x5b, 0x5d, 0x70, 0x71. It does not reach 0, 1, 0x32, 0x5a or 0x5c (those are listed in the rows only
  as Gammoth's copies, as today).

### The census -- E (cen_legsnow.py: slots poked to level 2, ids poked)

The sweep covers every number x phases 0..8 x {frame tests 1, + ended}. It finds sp_01 3..6 only through 0x105fd94, at exactly the
numbers above. Per frame (`frames_legsnow.py`, each tune float answered alone):
- **v0:** (7, 0) f116 m3; (7, 1) f100 m4; (7, 5 / 6) f208 m4, f230 m5, f268 m6, f310 m3 (+ f216 / 260 / 388 / 390 only with the
  durability at 0); (7, 0x5a / 0x5b) phase 1 and (7, 0x5c / 0x5d) phase 2: f170 m3, f172 m4; (7, 0x70 / 0x71) f30 m3 / m4.
- **v4:** the same, without m5 / m6.

Controls:
- Positive: the same census finds the known trunk rows. Variant 4: (7, 0x10 / 0x35) and (7, 0x11 / 0x36) via 0x105820c /
  0x105842c, and (7, 0x42) via 0x1059188, all mode 20. This is the rom-map's 0x1060e28 row.
- Negative: slots unpoked -> nothing (`cen_v0_nopoke.txt`); slot 0 / 4 -> nothing; break level 1 (0x9d36c answered 1) -> no shell
  (`setup_check.py`).

### Gammoth's sp_01 20 -- READ (a named refusal)

A static scan covered every `0x3fa2bc` alloc and every `0x48b884` call in the band. It finds mode 20 only in `0x1060e28`
(`mov r2, #0x14` at 0x1060e9c), with the immediate id **0x168** (`mov r2, #0x168` at 0x1060e90). That function returns at once unless
e+0xb5f5 == 4 (`0x1060e3c cmp r0, #4 / bne 0x1060e6c -> pop`). So 0x163 mode 20 (em083_00_shell01's u 60 on joint 157) is file data
that no code makes. The variant-0 census confirms it: no mode 20.

### Static scan of the band -- READ

The band is `0x104f8c8..0x1064be0`. It is derived: emclasses `uEm083_00` lo / hi = 0x104f8c8 / 0x1064be0, the vtable 0x17efaa8's
slots all fall inside it (pf_em083_00.txt), and fb/band_uEm083_00.txt ends at the ShellEm083 classes' last return 0x1064bd8.
- Every shell create in it goes through `0x48b884`: 30 sites. `0x48b71c` (8 sites, 0x104fafc..) is the loader's registration.
- The modes, read with their id sources (`static_scan.py`):
  - vt+0x1b4 0x105f1a8: 15 / 14 / 12 / 13
  - 0x105fd94: **3 / 4 / 5 / 6**
  - 0x10601fc: 7; 0x1060304: 8; 0x106040c: 9 / 10; 0x1060530: 10; 0x106061c: 9; 0x1060894: 11; 0x106099c: 17
  - 0x1060e28: 20 (0x168)
  - 0x105f4ac(e, mode): its callers pass 7 / 0x25 / 0x26 / 0x1e / 0x1f / 0x1a / 0x1b
  - 0x1060d4c(e, mode): its callers pass 0x10 / 0x12
  - the rest are sp_00 / sp_13 / 0x167 / 0x169 / 0x16b makers, and the shell classes' landings (modes 0..2 / 41 / 34 / the pieces)
- No other site writes 3..6 or 20 into a setup's +8.
- Positive control: the same scan lists every known sp_01 maker (modes 7..11, 17, 37 / 38 via 0x105f4ac, 20 in 0x1060e28).

### vt+0x204, the snow machine, (10, 0x72) / (10, 0x74) -- READ (negative, with the scan's control)

- `callers.py` lists the callers of every maker helper. None lies in vt+0x204 `0x1051354` (to 0x10528ac), the snow machine
  `0x105006c`, vt+0x1dc `0x104ffa0`, vt+0x208 `0x10528ac` or the status-10 handler `0x105d670`.
- `0x1053710` and `0x1053d8c` have no other callers than 0x105fd94 and 0x1060e28.
- The status-10 sweep (`watch_all.py`) reaches none of the five sites.
- So the knock-off (10, 0x72) strips the snow with effects 1041.. (states note 4.4 / 4.5) and makes no shell. (10, 0x74) has no case
  (states note 4.2).

### A lead for the effects lane -- INFERRED (each part READ, the combination not run)

- states-em083_00.md 4.5: Gammoth's vt+0x208 snow-effect sites return on motions **0x201 / 0x202 / 0x206 / 0x225 / 0x227**. Those
  are exactly L2 M1 / M2 / M6 / M37 / M39, the leg-snow clips.
- So on Gammoth a stomp shed fires only the shell's u 60 / 61, not 1041 / 1046 / 1051 / 1056.
- Elderfrost's sites 2 / 3 have no motion gate. His shed (level -> 0) should therefore also fire 1041 / 1046 one frame later, and at
  level 1 the shed is also a 1 -> 0 edge.

### The viewer's inputs today

- `input.trunkSnow083` (motion-states.js trunkSnow083, Elderfrost only, slot 5 on SNOW083_TRUNK) -> owner001 `own.trunkSnow083` ->
  make083row 'armour083'.
- The leg rows are MOTION_STATES em083_00 / em083_04 ladders. Slot 0 is [[10], [9], [8], [11], [12]] (index = level, the applier
  0x105418c). Slots 1 / 2 / 3 are the same on 13..17 / 18..22 / 23..27.
- Nothing passes them to shells.js yet: (b) adds `legSnow083` on the same pattern.
- Elderfrost's slots 2 / 3 are 0 for good (READ: his init writes 2 on slots 0 / 1 / 5 only, 0x1054664 takes parts 1..3 on variant
  4, and 0x1054624 writes 0).

## (b) The JS

### docs/render/shells.js

These are the exact edits `patch_legsnow.py` applies. Each anchor occurs once.

**1. owner001** (anchor: line ~8674, `trunkSnow083: fin(input.trunkSnow083) ? input.trunkSnow083 | 0 : null };`). Replace that
line with:

```js
           trunkSnow083: fin(input.trunkSnow083) ? input.trunkSnow083 | 0 : null,
           // Gammoth's / Elderfrost's leg snow (render/shells.js make083row legSnow083: 0x1053d8c's gate on snow slots 0..3), the levels
           // the leg rows SHOW (motion-states.js legSnow083)
           legSnow083: Array.isArray(input.legSnow083) && input.legSnow083.length === 4 && input.legSnow083.every(fin) ? input.legSnow083.map(v => v | 0) : null };
```

**2. spawn083, the fresh branch** (anchor: line ~12803, `    if (a.turn083) turn083(state, D, own, ctx.J, ...a.turn083);`).
Insert before it:

```js
    state.leg083 = null;                                                 // the legs shed in this play (make083row legSnow083)
```

**3. make083row** (anchor: line ~12838, `    const why = missing001(own, { facing: true, pos: sp.shell === 'shell01' || ...`). Insert
before it:

```js
    if (sp.kind === 'legSnow083'){
      // THE LEG SNOW (READ whole, 2026-10-20; dev/em083-shells-spec.md): 0x105fd94(e), each update of (7, 0 / 1 / 0x32) phase 1
      // (0x1057224), (7, 5 / 6) phase 1 (0x105781c), (7, 0x5a / 0x5b) phase 1 (0x1059e3c), (7, 0x5c / 0x5d) phase 2 (0x1059f70) and
      // (7, 0x70 / 0x71) phase 1 (0x105b4bc), its only callers. It asks 0x1053710(e, &leg0, &leg1, &leg2, &leg3): by the action number
      // e+0x73e1 alone, at each of its frames (0xb0968(e, 0, 0, F, 0.0), tune floats 0x45..0x52 / 0x89) one leg's hit, 0x1053d8c(e, part
      // 2..5, dmg = a tune int, variant 4 its own) -> that leg's flag. Each flag set: part break level 0 (0x9d36c) -> sp_01 3 + leg
      // (e+0xcae4) at the block's point and words (+0x10 = block +0x40, +0x20 the zero vector, +0x30 = block +0x50..+0x58, +0x3c 0xffff:
      // 0x1060e28's setup); then, made or not, 0x1054624(e, leg, 0): next = 0 (base 0 too when e+0x7420), 0x105413c packs the bases.
      // 0x1053d8c (READ whole): a slot at 0 / 4 -> 0. Variant 0: dmg >= 1 zeroes the part's durability (s16 P+0x3c0 + 12 part) and
      // breaks; dmg 0 breaks only a durability already <= 0 -- not an input, taken > 0 (INFERRED). Variant 4: a slot at 1 breaks at
      // any dmg; at 2 / 3 dmg x the rate [0xba9f0(e, 2)+0xc] comes off the durability -- not an input, dmg > 0 taken to break (INFERRED,
      // armour083's rule). The slot is the leg's row SHOWN (input.legSnow083); a leg at 1..3 has break level 0 (0x105006c forces its
      // slot to 4 while it is broken, states-em083_00.md 4.6). Once shed the leg is at 0 for the rest of the play (state.leg083).
      const L = own.legSnow083, mode = 3 + sp.leg, v4 = state.monId === 'em083_04';
      if (!L){ out.refused.push({ action: a.action, shell: 'shell01', mode, why: 'no leg snow levels (input.legSnow083)' }); return; }
      const shed = state.leg083 || (state.leg083 = [false, false, false, false]);
      const lv = shed[sp.leg] ? 0 : L[sp.leg], dmg = sp.dmg[v4 ? 1 : 0];
      if (!(lv === 1 || lv === 2 || lv === 3) || !(v4 ? (lv === 1 || dmg > 0) : dmg >= 1)) return;
      shed[sp.leg] = true;                                                 // 0x1054624(e, leg, 0)
      const miss = missing001(own, { facing: true, pos: true });
      if (miss){ out.refused.push({ action: a.action, shell: 'shell01', mode, why: miss }); return; }
      const def = D.shells.shell01;
      const S = make001(state, D, 'shell01', { id: def.id, mode, position: own.ownerPos.slice(), angles: [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0],
                                               action: a.action, frame: sp.frame }, own, J, ctx, null);
      if (S){ S.motionId = ctx.ownerMotion; state.shells.push(S); out.spawned.push(S); }
      return;
    }
```

**4. The rows.** After `const SNOWBALL083 = m => ...;` add:

```js
// THE LEG SNOW (0x105fd94 / 0x1053710; make083row legSnow083): { frame (a tune float), leg (0..3 = part 2..5 = snow slot = sp_01 mode
// 3..6 on joint 7 / 11 / 14 / 17), dmg [variant 0's tune int, variant 4's] }. Census with the slots at 2: scratchpad gapG/cen_legsnow.py
const LEG083 = (frame, leg, d0, d4) => ({ frame, kind: 'legSnow083', leg, dmg: [d0, d4] });
```

Replace the two L2 M37 rows, and append the new rows after them (inside `SHELL_DATA.em083_00.actions = [ ... ]`):

```js
  // L2 M37 (0x1059c1c phase 1): mode 37 (0x105f4ac) before the legs at 172; floats 0x47 / 0x48 = 170 / 172, ints 0xa / 0xb (v4 0xc / 0xd)
  act083(0x5a, 'Motion[37]', [{ frame: 172, shell: 'shell01', mode: 37 }, LEG083(170, 0, 500, 500), LEG083(172, 1, 500, 500)], { also: [[7, 0x5b]] }),
  // (0x1059e98 phase 2 = L2 M37): floats 0x49 / 0x4a = 170 / 172, ints 0xe / 0xf (v4 0x10 / 0x11)
  act083(0x5c, 'Motion[37]', [{ frame: 172, shell: 'shell01', mode: 38 }, LEG083(170, 0, 500, 500), LEG083(172, 1, 500, 500)], { also: [[7, 0x5d]] }),
  // L2 M1 (7, 0 / 0x32; 0x1056a0c phase 1): float 0x45 = 116, int 6 (v4 7); L2 M2 (7, 1): float 0x46 = 100, int 8 (v4 9)
  act083(0x00, 'Motion[1]', [LEG083(116, 0, 500, 500)], { also: [[7, 0x32]] }),
  act083(0x01, 'Motion[2]', [LEG083(100, 1, 500, 500)]),
  // L2 M6 (7, 5 / 6; 0x10576c0 phase 1): floats 0x4b..0x52 = 208 / 216 / 230 / 260 / 268 / 310 / 388 / 390 on parts 3 / 2 / 4 / 3 / 5 /
  // 2 / 2 / 3, ints 0x12..0x19 = 500 / 0 / 500 / 0 / 500 / 500 / 0 / 0 (v4 0x1a..0x21 = 500 / 0 / 0 / 0 / 0 / 500 / 0 / 0)
  act083(0x05, 'Motion[6]', [LEG083(208, 1, 500, 500), LEG083(216, 0, 0, 0), LEG083(230, 2, 500, 0), LEG083(260, 1, 0, 0), LEG083(268, 3, 500, 0),
                             LEG083(310, 0, 500, 500), LEG083(388, 0, 0, 0), LEG083(390, 1, 0, 0)], { also: [[7, 0x06]] }),
  // NOT HERE, by name: sp_01 20 on Gammoth's file (u 60 on joint 157) -- its one maker 0x1060e28 returns unless e+0xb5f5 == 4 and
  // makes the immediate 0x168 (Elderfrost's): 0x163 mode 20 is never made. (7, 0x70 / 0x71) run the leg snow on variant 0 too but
  // set L9 M11 / M14, which em083_00 does not ship (no list 9) and his EMC never asks (scratchpad fb/reach_em083_00.json)
```

Elderfrost's two L9 rows (in `SHELL_DATA.em083_04.actions`) become:

```js
  // (0x105b420 phase 1: the leg snow 0x105b4bc before sp_01 30 / 31; float 0x89 = 30, int 0x31 = 80 -- 0x70 part 2, 0x71 part 3)
  act083v(0x70, '9', 'Motion[11]', [LEG083(30, 0, 80, 80), { frame: 30, shell: 'shell01', mode: 30 }]),
  act083v(0x71, '9', 'Motion[14]', [LEG083(30, 1, 80, 80), { frame: 30, shell: 'shell01', mode: 31 }]),
```

Elderfrost gets the list-2 rows through the existing `SHELL_DATA.em083_00.actions.filter(r => r.clip !== 'Motion[23]')` copy. That
is correct: the code is shared, and the variant picks `dmg[1]`.

The rows' `also` numbers are listing aliases: `variantActionFor` picks a row by its own `variant`, so (7, 0x32) / (7, 6) play
through (7, 0) / (7, 5).

### docs/render/motion-states.js

Not shells.js, but this is the input (after `trunkSnow083`, line ~7428):

```js
// Gammoth's / Elderfrost's leg snow as the leg-snow shells read it (render/shells.js make083row legSnow083: 0x1053d8c on snow slots
// 0..3 = parts 2..5): each leg row's level as the parts show it, on the applier's ladders (0x105418c: levels 0..4 -> sets 10 / 9 / 8
// / 11 / 12, 15.., 20.., 25..). Elderfrost's slots 2 / 3 are 0 for good (his init writes 2 on slots 0 / 1 / 5 only, his raiser
// 0x1054664 takes parts 1..3, 0x1054624 writes 0)
export const SNOW083_LEGS = [[[10], [9], [8], [11], [12]], [[15], [14], [13], [16], [17]], [[20], [19], [18], [21], [22]], [[25], [24], [23], [26], [27]]];
export function legSnow083(monId, table, drawn){
  if (monId === 'em083_00') return SNOW083_LEGS.map(L => userLevel(L, table, drawn));
  if (monId === 'em083_04') return [userLevel(SNOW083_LEGS[0], table, drawn), userLevel(SNOW083_LEGS[1], table, drawn), 0, 0];
  return undefined;
}
```

### docs/index.html

- Import list, line ~1492: add `legSnow083` after `trunkSnow083,`.
- Shell input, after line ~9596 (`trunkSnow083: trunkSnow083(...)`):

```js
           // Gammoth's / Elderfrost's leg snow (render/shells.js make083row legSnow083: 0x105fd94's gate on snow slots 0..3), the levels the leg rows SHOW
           legSnow083: legSnow083(state.id, motionStates.table, mounted.main && mounted.main.userData.partsDrawn),
```

Note: a node check that plays L2 M37 without `legSnow083` now gets the named refusal 'no leg snow levels (input.legSnow083)'.
dev/shells-gammoth-check.mjs and dev/shells-elderfrost-check.mjs still pass on the patched copy (28 / 28, 35 / 35). The page and
soak checks were not run (not allowed here).

## (c) rom-map rows (the Gammoth rows' style; insert after the `0x1060e28` row)

```
| `0x105fd94(e)` (callers `0x1057224` / `0x105781c` / `0x1059e3c` / `0x1059f70` / `0x105b4bc`; no pointer) | THE LEG SNOW: `0x1053710` sets four leg flags; each set: break level (0x9d36c(e, 2 + k)) 0 -> sp_01 **3 + k** (e+0xcae4; +0x10 block +0x40, +0x20 zero vector, +0x30 block +0x50..+0x58, +0x3c 0xffff), then `0x1054624(e, k, 0)`; `0x105413c` if any. (7, 0 / 0x32) L2 M1 f116 leg 0; (7, 1) L2 M2 f100 leg 1; (7, 5 / 6) L2 M6 f208 1, f216 0, f230 2, f260 1, f268 3, f310 0, f388 0, f390 1; (7, 0x5a / 0x5b) L2 M37 and (7, 0x5c / 0x5d) phase 2 (L2 M37) f170 0, f172 1 (after sp_01 37 / 38); (7, 0x70 / 0x71) L9 M11 / M14 f30 leg 0 / 1 (before sp_01 30 / 31) -- em083_00u 60 / 61, em083_04u 60 | uEm083_00 | R + E (census, slots poked: gapG/cen_legsnow.py; ROM vs module 14 cases + 4 controls, gapG/legsnow-check.mjs) | shells.js make083row legSnow083, LEG083; motion-states.js legSnow083 |
| `0x1053710(e, &f0, &f1, &f2, &f3)` | the leg hits by the NUMBER e+0x73e1 alone (table `0x1053748`, < 0x32 at `0x1053900`): at `0xb0968(e, 0, 0, F, 0.0)` of tune floats 0x45..0x52 / 0x89 -> `0x1053d8c(e, part 2..5, tune int)` into that leg's flag; ints by variant (`movweq` on e+0xb5f5 == 4): v0 6 / 8 / 0xa / 0xb / 0xe / 0xf / 0x12..0x19 / 0x31, v4 7 / 9 / 0xc / 0xd / 0x10 / 0x11 / 0x1a..0x21 / 0x31 | uEm083_00 | R + E | gapG RESULT.md (a) table |
| `0x1054624(e, slot, level)` | next[slot] (e+0xcb68) = level; level <= 4 and e+0x7420 -> base[slot] (e+0xcb38) = `0x16a25b0[level]` {0,1,2,2,3}; its four callers (0x105fd94) pass 0 | uEm083_00 | R | make083row legSnow083 (`state.leg083`) |
| uEm083_00 sp_01 20 (Gammoth's file, u 60 joint 157) | never made: the band's only mode-20 setup is `0x1060e28`'s (`mov r2, #0x14` 0x1060e9c) with the immediate id 0x168, behind e+0xb5f5 == 4 (`0x1060e3c`); static scan of every 0x3fa2bc / 0x48b884 site + the variant-0 census | uEm083_00 | R | shells.js "NOT HERE, by name" (em083_00 rows) |
| uEm083_00 vt+0x204 `0x1051354` / `0x105006c` / vt+0x208 `0x10528ac` / status-10 `0x105d670` ((10, 0x72) / (10, 0x74)) | make NO shell: no maker helper's caller lies in them (gapG/callers.py over the band; control: 0x1060e28's three callers and 0x105fd94's five found the same way), and a status 0..15 sweep reaches none of 0x105fd94's sites (gapG/watch_all.py) | uEm083_00 | R (negative, controlled) | gapG RESULT.md (a) |
| tooling: `<scratchpad>\gapG\` (gapG helper, 2026-10-20) | `static_scan.py` (each 0x3fa2bc setup's +4 / +8 sources up to its 0x48b884), `callers.py` (each maker helper's callers and their functions), `cen_legsnow.py <v> [statuses]` (census with e+0xcb50.. / +0xcb38.. poked, LVL env, ids e+0xcae0..), `frames_legsnow.py`, `dur_check.py` (durability P+0x3c0 + 12 part poked), `setup_check.py`, `watch_sites.py` / `watch_all.py`, `mk_check.py` -> `legsnow-check.mjs` (emu_fb ROM vs a patched copy) | control: the census finds Elderfrost's trunk rows (7, 0x10 / 0x11 / 0x35 / 0x36 / 0x42) mode 20; unpoked it finds nothing | the durability is a poke, not a read value; per-step current pokes stand in for 0x105006c's next -> current copy (the harness runs the action main alone) |
```

The existing `0x1053d8c` row is upgraded (it described the variant-4 arithmetic for both variants). Replace its text with:

```
| `0x1053d8c(e, part, dmg)` | the snow-armour hit: slot [0x16a2590][part-1] of e+0xcb50 (part 1 -> slot 5, 2..5 -> 0..3); 0 / 4 -> 0; **variant 4** (`0x1053df4`): durability (s16 P+0x3c0 + 12 part) -= dmg x [0xba9f0(e,2)+0xc] (>= 1 when dmg > 0); **variant 0** (`0x1053e54`): dmg >= 1 -> durability = 0, dmg 0 leaves it; then <= 0 breaks, and on variant 4 a slot at 1 breaks at any dmg: (part 1, v4) e+0xcb7c = 0 (+0xcb4c when e+0x7420), +0x3bd++, vt+0x410(e, part), returns 1; no break -> (v4) 0x1051cf0(e), returns 0 | uEm083_00 | R + E | shells.js make083row armour083 / legSnow083 |
```

WITHDRAWN table, new row:

```
| rom-map `0x1053d8c` row (shells agent, 2026-10-18): "else dmg x [0xba9f0(e,2)+0xc] (>= 1) off P+0x3c0 + 12 part, <= 0 breaks: e+0xcb7c = 0" | the rate arm is variant 4's only (`cmp r0, #4 / bne 0x1053e54`); variant 0 zeroes the durability on any dmg >= 1, with no rate; e+0xcb7c is written only for part 1 on variant 4 | row `0x1053d8c` (gapG, 2026-10-20) |
```

Trap (next number after 129):

```
130. **A census on zeroed memory hides a maker gated on the class's own state (2026-10-20).** Gammoth's leg snow (0x105fd94: sp_01 3..6, u 60 / 61) passes only when 0x1053d8c finds a snow slot e+0xcb50.. at 1..3. trgen zeroes the enemy, so every slot read 0 (bare) and the census and the per-frame census both missed five actions. The trunk's 0x1060e28 had the same gate. When a mode in the files has no maker, scan the band for its setup's +8 immediate first (gapG/static_scan.py), then prime the state the gate reads.
```

em083-shells-spec.md gets a short "6. The leg snow" paragraph from (a), and the shells agent owns it. Its "Records exported: ... 60,
61" lines stay true (the records are exported); the makers are now named.

## (d) The replay

`node replay.mjs` (after `python patch_legsnow.py`) prints this, all 17 PASS (replay.out):

- **Gammoth:**
  - L2 M1 m3@116 and L2 M2 m4@100 -> 0:60.
  - L2 M6 [2,2,2,2] m4@208 / m5@230 / m6@268 / m3@310 -> 0:60, 0:61, 0:61, 0:60. Levels 3 and 1 give the same.
  - L2 M37 (0x5a) m3@170, m37@172, m4@172 -> 0:60 x2. 0x5c gives the same with m38.
- **Elderfrost:**
  - L2 M6 [2,2,0,0] m4@208 / m3@310. At [1,1,0,0] it is m4@208 / m3@216 (the dmg-0 frame breaks a slot at 1).
  - L2 M1 m3@116.
  - L9 M11 m3@30 + m30@30, L9 M14 m4@30 + m31@30. All -> em083_04u 0:60.
- **Controls:**
  - bare [0..] and broken [4..] make nothing.
  - one leg [0,0,2,0] -> m5@230 alone.
  - no input -> refused 'no leg snow levels (input.legSnow083)'.
  - Elderfrost bare -> only m30.

`node legsnow-check.mjs`: the same plays against emu_fb ROM runs, with the slots and durability poked. All 14 cases are equal on id,
mode, position, words and record starts (0:60 / 0:61). All 4 controls fail as they must: a leg shown bare, another joint 7, a leg
shown broken, the facing one word off. 18 / 18.
