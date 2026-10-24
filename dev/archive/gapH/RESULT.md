# gapH: Nakarkos (em084_00) ROM parts 2 / 3 / 4, from break level to .mpm set to Parts row

Before reading, I grepped rom-map.md, dev/em084-*.md, motion-states.js, shells.js, monster.js and the board. The part pass
(`0x106b24c` / `0x106b2d0`) appears in none of them. The only nearby entry is the board's unread face plate driver `0x106b7d4`,
which is a different function (see below).

## (a) Facts

### The part pass: body vtable `0x17f11fc` +0x210 = `0x106b24c` (READ)

- The slot word at `0x17f140c` = `0x106b24c`. Control on the same vtable: +0x1cc at `0x17f13c8` = `0x106f890`, which matches
  rom-map row 1223. So the vtable base is right.
- `0x106b24c` calls `bl 0x106b2d0` (the part pass) first. Then it runs vt+0x3f4, the dying test. When that returns 1: a one-shot
  material clip at `E+0xcb04` (`0xb09a3c` / `0xb09ae8`). Otherwise `0x106b5e8` then `b 0x106b7d4` (material / charge drivers,
  not part sets).
- **Extent of `0x106b2d0`: `0x106b2d0..0x106b5d8`.** The last instruction is the tail call `b 0x72c78` at `0x106b5d8`. The literal
  pool is `0x106b5dc..0x106b5e4`, the three words its own `ldr [pc,#]` name (`0x106b300` → `0x5dc`, `0x106b398` → `0x5e0`,
  `0x106b4c0` → `0x5e4`). The next function starts at `0x106b5e8` (`push`). **It has 7 `setVisibleGroup` calls** (`0x106b2e0`,
  `0x106b384`, `0x106b4ac`, `0x106b4f8`, `0x106b53c`, `0x106b5d8`, plus the one shared by the part-5 arms).
- `0x72c78(e, set)` (READ, this pass): it returns if set < 0 or `[[e+0x1420]+0x68]` ≤ set. Otherwise it takes entry
  `[[e+0x1420]+0x74][set]` and, for each (group, drawn), writes bit `group` of `e+0x110` (PartsDisp, rom-map row 3131). It is
  `setVisibleGroup`, and `set` is an index into the monster's `.mpm` set list. That `[e+0x1420]` is the loaded `.mpm` is
  INFERRED from the shape. The .mpm check below matches it set for set.
- Rows = `[[E+0x75f0]+0x64]` (the `.dtp` A array, 4 bytes per row). thr(row) = `0x3a8430() > 4 ? byte+2 : byte+1`.
  `breakLevel` = `0x9d36c(E, part)` (rom-map Part data).

```
setVisibleGroup(E, 0)                                                              ; 0x106b2e0
part 6: lv >= thr(row 7) ? 16 : lv >= thr(row 6) ? 2 : 1                           ; 0x106b31c..0x106b384
part 5: alt = (E+0xcadc == 1 || action (7, 0x33..0x35 / 0x3c..0x3e) [mask 0xe07 on n-0x33]) && vt+0x3f4(E) == 0
        alt ? (lv >= thr(row 5) ? 8 : lv >= thr(row 4) ? 7 : 6)
            : (lv >= thr(row 5) ? 5 : lv >= thr(row 4) ? 4 : 3)                    ; 0x106b3b8..0x106b4ac
part 3: lv >= thr(row 1) ? 10 : 9                                                  ; 0x106b4e4..0x106b4f8
part 2: lv >= thr(row 0) ? 12 : 11                                                 ; 0x106b528..0x106b53c
part 4: lv >= thr(row 3) ? 15 : lv >= thr(row 2) ? 14 : 13                         ; 0x106b568..0x106b5d8
```

### `.dtp` A rows (READ: `efx/agents/diablos-scratch/dtp.py em084_00`, 184/184 EXACT)

| row | bytes {part, level, level G, ?} | used by |
|---|---|---|
| 0 | 02 03 03 01 | part pass part 2; record gate type 3 (limit 3) |
| 1 | 03 03 03 02 | part pass part 3; record gate type 2 (limit 3) |
| 2 | 04 02 02 83 | part pass part 4, first rung |
| 3 | 04 04 04 83 | part pass part 4, second rung; record gate types 0 / 1 (limit 4) |
| 4 / 5 | 05 02 02 84 / 05 04 04 84 | part 5 |
| 6 / 7 | 06 02 02 85 / 06 04 04 85 | part 6 |

Every row's level equals its G level, so rank changes nothing for these three parts (READ: the selects are read, and the bytes
are equal). Byte 0 of each row is the part the code asks for, which agrees with the code's row choice.

### The sets (READ: `em084_00.mpm` → `.mpm.xml` through harvest-monsters.py's `mpm_groups`, identical to `docs/monsters.json` groups, 17 sets)

| ROM part | rung (break level) | set | groups | Parts panel row (part-review em084_00) / option key |
|---|---|---|---|---|
| 2 | 0 (lv < 3) | 11 | 6 on, 16 off, 26 off | row `6,16,26`, option `6` |
| 2 | 1 (lv ≥ 3) | 12 | 6 off, 16 on, 26 on | row `6,16,26`, option `16,26` |
| 3 | 0 (lv < 3) | 9 | 5 on, 15 off, 25 off | row `5,15,25`, option `5` |
| 3 | 1 (lv ≥ 3) | 10 | 5 off, 15 on, 25 on | row `5,15,25`, option `15,25` |
| 4 | 0 (lv < 2) | 13 | 7, 8 on; 17, 18, 28 off | row `7,8,17,18,28`, option `7,8` |
| 4 | 1 (2 ≤ lv < 4) | 14 | 7 off, 8 on, 17 on | row `7,8,17,18,28`, option `8,17` |
| 4 | 2 (lv ≥ 4) | 15 | 7, 8 off; 17, 18, 28 on | row `7,8,17,18,28`, option `17,18,28` |

Side reads, not asked for: part 6 drives sets 1 / 2 / 16 (row `1,2,11,12`). Part 5 drives sets 3..8 (row
`3,4,13,14,20,24,113,114`). In the alt form, sets 6..8 add groups 20 / 24 under the cannon charge `E+0xcadc` / the cannon
actions (7, 0x33..0x35 / 0x3c..0x3e), which matches that row's Charging halves.

### What the shells gate does with this

The records084 gate (`0x1069fe8..0x10a030`: lv < limit) uses the same rows as the part pass for parts 2 and 3, and row 3 for
part 4. So:
- type 3 (L2 M73 → **shell00 66**) is blocked once row `6,16,26` shows its broken option;
- type 2 (L2 M72 → **shell00 65**) is blocked once row `5,15,25` shows its broken option;
- types 0 / 1 (L2 M70 / M71 → shell48 0 / 1) are blocked only at row `7,8,17,18,28`'s third option. They still pass at its second.

INFERRED: none of the part → set → row link. The only INFERRED point is that `[e+0x1420]` is the `.mpm` resource. The set index
and the set contents agree exactly.

## (b) The JS

motion-states.js: put this next to `seregiosParts077`. `userLevel` is a hoisted function declaration further down the file.

```js
// NAKARKOS's break levels of ROM parts 2 / 3 / 4 as his record table's makers read them (render/shells.js records084: 0x9d36c(E, part)
// below .dtp A rows 0 / 1 / 3 -- shell00 66 / 65, shell48 0 / 1), taken from the parts the user shows. His part pass (body vt +0x210
// 0x106b24c -> 0x106b2d0, READ gapH 2026-10-21; rows [[E+0x75f0]+0x64], each row's level == its G level): part 3 below row 1 (3) ->
// set 9 else 10; part 2 below row 0 (3) -> set 11 else 12; part 4 below row 2 (2) -> set 13, below row 3 (4) -> 14, else 15.
// userLevel gives the rung; the level handed on is the rung's floor (0 / 3, 0 / 3, 0 / 2 / 4), which the gate's limits (3 / 3 / 4)
// read the same as any level inside that rung.
const NAKARKOS084 = { 2: { sets: [[11], [12]], lv: [0, 3] }, 3: { sets: [[9], [10]], lv: [0, 3] }, 4: { sets: [[13], [14], [15]], lv: [0, 2, 4] } };
export function nakarkosParts084(monId, table, drawn){
  if (monId !== 'em084_00') return undefined;
  const out = {};
  for (const [part, L] of Object.entries(NAKARKOS084)) out[part] = L.lv[userLevel(L.sets, table, drawn)];
  return out;
}
```

index.html: add `nakarkosParts084` to the motion-states import (line 1492, after `seregiosParts077`). Put the line in shellExtra,
beside `parts077` (about line 9642):

```js
           // Nakarkos's record-table makers (render/shells.js records084): ROM parts 2 / 3 / 4's break levels as the parts show them
           parts084: nakarkosParts084(state.id, motionStates.table, mounted.main && mounted.main.userData.partsDrawn),
```

Tested (scratchpad gapH/t.mjs, node, against the real em084_00 groups, Face / Face Plate held intact):

| parts shown | result |
|---|---|
| all intact | {2:0, 3:0, 4:0} |
| `15,25` | {3:3} |
| `16,26` | {2:3} |
| `8,17` | {4:2} |
| `17,18,28` | {4:4} |
| all three broken | {2:3, 3:3, 4:4} |

Another monster gives `undefined`. `drawn` null gives all 0.

## (c) rom-map rows (proposed, not written)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x106b24c` (body vt+0x210, vtable `0x17f11fc` slot `0x17f140c`) | the part pass's head: `bl 0x106b2d0`, then dying (vt+0x3f4 == 1) → one-shot material clip at `E+0xcb04`, else `0x106b5e8` then `b 0x106b7d4` (material / charge drivers, not sets) | uEm084_00 | R | scratchpad gapH/RESULT.md (a); motion-states.js nakarkosParts084 |
| `0x106b2d0..0x106b5d8` (pool `..0x106b5e4`) | the part pass, ALL 7 `setVisibleGroup`: set 0; part 6 → 1 / 2 / 16 (rows 6 / 7); part 5 → 3 / 4 / 5, or 6 / 7 / 8 when `E+0xcadc == 1` or action (7, 0x33..0x35 / 0x3c..0x3e) and not dying (rows 4 / 5); **part 3 → 9 / 10 (row 1, lv 3); part 2 → 11 / 12 (row 0, lv 3); part 4 → 13 / 14 / 15 (rows 2 / 3, lv 2 / 4)**; rank selects read, every row's level == G | uEm084_00 | R | same |
| `0x72c78(e, set)` | setVisibleGroup: set < 0 or ≥ `[[e+0x1420]+0x68]` returns; entry `[[e+0x1420]+0x74][set]` writes each (group, drawn) into bit `group` of `e+0x110` (PartsDisp). `[e+0x1420]` = the `.mpm` (INFERRED from the shape; set contents match em084_00.mpm exactly) | shared | R | same |
| em084_00 ROM part → Parts row | part 2 = row `6,16,26` (sets 11 / 12); part 3 = row `5,15,25` (9 / 10); part 4 = row `7,8,17,18,28` (13 / 14 / 15); part 5 = row `3,4,13,14,20,24,113,114` (3..8); part 6 = row `1,2,11,12` (1 / 2 / 16) | uEm084_00 | R | same; closes em084-shells-spec §10 "which body parts 2 / 3 / 4 are" (by set and row id, not by name) |
