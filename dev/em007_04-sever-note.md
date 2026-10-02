# Bloodbath Diablos (em007_04): the sever records 905 / 906 — evidence, not an entry

Written for Render (the CUT_TAIL / staging side) and EMC (the part-table read), so neither starts from
scratch. **Nothing here is a CUT_TAIL entry and nothing here should be turned into one without EMC's part
read** — the two pairs cannot be assigned to the two staged pieces from this evidence alone.

Effects agent, 2026-09-30. Status letters as in `dev/rom-map.md`: R read, I inferred.

## CORRECTED 2026-09-30 — the array read changes this note

The first version of this note read keys 900 and 901 as one record each. **They are two records each**, in
different arrays, and only one of the two was exported. The array is part of a record's identity
(`dev/rom-map.md`, the `0x328ba0` row): a request path resolves in **UNIQUE**, a PSL clip bit in SEQUENCE.

| record | array | file | `when` | state |
|---|---|---|---|---|
| `em007_04u 900` | SEQUENCE idx 37 | `em007_04_000` | `clip` | **driven** — PSL bit 21, frames 7-8 |
| `em007_04u 901` | SEQUENCE idx 38 | `em007_04_000` | `clip` | **driven** — PSL bit 0, frames 0-90 |
| `em007_04u 900` | UNIQUE idx 10 | `cm202_062` | `event` | exported 2026-09-30, **UNDRIVEN** |
| `em007_04u 901` | UNIQUE idx 12 | `cm202_062` | `event` | exported 2026-09-30, **UNDRIVEN** |
| `em007_04u 905` | UNIQUE idx 11 | `cm202_001` | `event` | **UNDRIVEN** |
| `em007_04u 906` | UNIQUE idx 13 | `cm202_001` | `event` | **UNDRIVEN** |

Both layers are real — this is not one record mislabelled. The clip records are correctly SEQUENCE, and
Diablos, who has **no** PSL bit for 900 or 901, correspondingly has no SEQUENCE record on either key.

**The pairing question this note was written to hold open is now mostly answered**, by the arrays rather than
by counting. Diablos's sever band is `UNIQUE 900` = `cm202_062` (the cut) and `UNIQUE 905` = `cm202_001`
(the landing) — one pair, both `event`, driven by his CUT_TAIL entry. Bloodbath's is **the same shape
doubled**: `UNIQUE 900`/`901` = `cm202_062` and `UNIQUE 905`/`906` = `cm202_001`. So the pairs are
**900 ↔ 905 and 901 ↔ 906**, cut and landing, and the tempting "900/905 vs 901/906" guess the note warned
against turns out to be the right grouping — but it is now held by the array and the Diablos parallel, not
by the coincidence of two numbers, which is what made it unusable as evidence before.

**What is still open is only the last step:** which of the two staged pieces each pair belongs to. That is
unchanged and still needs EMC's part read.

## Why they are undriven — R

`em007_00` has a **CUT_TAIL entry**; `em007_04` **does not** (it is absent from `tail-option.js`'s 31
entries). On the Rath line the pattern is `u 900` at the cut and `u 905` as the cut piece lands, fired by
CUT_TAIL's `fireAt`. With no entry, nothing fires the landing — so both landings sit loaded and silent.

This is not an effect-row gap. A CUT_TAIL entry stages a cut model and flies it; that is the part/model
side, which is why it was not improvised here.

## The band — R

    em007_04u UNIQUE:  900, 901, 905, 906, 1120, 1121, 1400
    em007_00u UNIQUE:  900,      905,      1120, 1121, 1400

Bloodbath's band is **richer** than Diablos's, not poorer: it has a second pair, `901` / `906`. Read with
the arrays, the two are the same mechanism with one pair versus two — and the files match across the two
monsters (`cm202_062` for the cut, `cm202_001` for the landing), which is the strongest reason to trust the
grouping.

## Two staged pieces where Diablos stages one — R

    em007_04 parts glbs:  em007_04_head.glb  AND  em007_04_tail.glb
    em007_00 parts glbs:  em007_00_tail.glb

Two staged models, two record pairs. **That is a correspondence, not an assignment** — see the open
question.

## The sever action — R

    (10, 0x72) -> script 0x179a400 -> op 0xa turn 148..244 (angle 0x8000), then L3 Motion[15], end 0xff

**The same script address for em007_00 and em007_04.** `(10, 0x73)` is not an action on either monster.
`L3 Motion[15]` exists in em007_04's list 3. Read with `probe.py` then `scr.py`; the reader was validated on
Cephadrome's `0x17ab0f0` (documented L3 M9 / M13) and on em007_00 part 0 before use.

Note Diablos's own row uses that clip already: `'3|Motion[15]': { levels: [[9], [10]], fire: [null, [u 900]],
drops: true }` — one pair, one piece, `drops` real because its `uEnemyOption` slot 0 resolves
`em007_00_tail`.

## THE OPEN QUESTION — do not guess this  *(narrowed; see the correction at the top)*

**Which pair belongs to which piece is UNREAD.** The tempting reading is 900/905 for one piece and 901/906
for the other, with the head and tail glbs taken in some order. There is no evidence here for the
assignment, and two specific traps apply:

- The two pairs and the two glbs matching in **count** is a correspondence of two numbers. `dev/rom-map.md`
  trap 6 and the `u 1034` case both turned on exactly that kind of coincidence.
- **em007_04 may not have a "tail" option at all.** It stages a **head**, and a head is not severed. One of
  these pairs may be a break-and-fall rather than a sever, and CUT_TAIL may be the wrong mechanism for it.

**What settles it:** EMC's read of em007_04's own break/sever part table — which part each sever pair is
filed under — which is the same read owed for `u 1034` (that record inverts to part 7 level 0 and sits on
joint 3, the head, with the offset em007_00 uses for a **horn**, while em007_00's part 7 is the **tail**).
All three questions are one question: **what the parts are on this monster.**

## What an entry would need, once that lands

1. Which glb stages for which pair, from the part read — not from the count.
2. `drops`: whether each piece is actually dropped (em007_00's is, via its `uEnemyOption` slot).
3. The landing fired by `fireAt` per pair: `u 905` and `u 906`.
4. Whether `L3 Motion[15]` carries both pairs (one clip, two reactions → the `cycle` device) or whether the
   second piece has its own action. **Only `(10, 0x72)` was found; no second sever action exists on either
   monster**, which if it holds means one clip serves both and the viewer has no way to know which piece
   was cut — the same limitation as the break cycle already in `motion-states.js` for em007_04.

## Already done, so it is not redone

`em007_04`'s MOTION_STATES block exists as of 2026-09-30 and carries its breaks, exhaust, sleep, paralysis,
stun chain, tired idle and shock trap, all read from its own action scripts. **It has no sever row** — that
is this note. The block also states that its part-set levels are unread, which is the same gap.
