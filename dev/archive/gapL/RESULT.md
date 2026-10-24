# gapL -- what fires Ahtal-Neset's (10, 0x8e), 2026-10-22

**Verdict: REACHABLE. In the game (10, 0x8e) fires for Neset when his HP reaches 65% of max (first), then 5% (second).**
- **The bit is data.** P+0x3a8 is copied whole from his `em087_00_dtbase.dtb` at file +0x1d (u32). His value is
  **0x00050402**: bit 16 set, bit 15 clear.
- **Only Amatsu shares it.** Of 130 dtbase files, bit 16 is set only in em087_00 and em058_00 (Amatsu).
- **The threshold is P+0x380.** It is also an HP floor: damage cannot take HP below int(max x P+0x380). Neset sets it himself: 0.65 at spawn, 0.05 at the first (10, 0x8e), -1.0 (no floor) at the second.
- **The viewer needs no HP input for the shells.** The action is the threshold event, and the drops are made at its start. gapJ's row stands as written (section b).

Everything is in `<gapL>` = `C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\gapL\`.
No repo file was written.

---------------------------------------------------------------------------------------------------------------------------

## (a) READ facts

### a1. Where P+0x3a8 is written (P = [e+0x1428])
Three shared helpers, `0x9cd50..0x9cd98`, are the only P+0x3a8 stores in shared code (`st3a8.py`):
- `0x9cd50(e)`: **P+0x3a8 = `0x711c8(e)` = [[e+0x75e8]+0x6c]**. This is the dtbase object's word +0x6c (`0x711c8..0x711d4`).
- `0x9cd6c(e, m)`: P+0x3a8 |= m.
- `0x9cd84(e, m)`: P+0x3a8 &= ~m.

Who calls them:
- **`0x9cd50` has one caller, `0xa4b90`** (`bl` at `0xa4bd4`).
  - `0xa4b90` is called by the enemy base init **`0xad4e0`** (`0xad504`, r1 0) and by `0xb8ce8` (r1 1).
- **Neset reaches it.** His vt+0x18 is `0x10a2ed8` (vtable `0x17f9aec`). It calls `0xc9df4` at `0x10a3180`, and `0xc9df4` is `b 0xad4e0`. The chain is the same as the arm's row in rom-map (`0x107b440 -> 0xc9df4 -> 0xad4e0 -> 0xa4b90`).
- **Shared callers of the or / bic helpers touch only bits 0x40 / 0x20.** They are `0xc93f4`, `0xc9448` (or) and `0xc26c0`, `0xc26d8` (bic).
- **The class callers (xref) include none in Neset's code.**
  - Ka: `0x10b3880` (or 4), `0x10bd640` / `0x10bd6e8` (bic).
  - Amatsu: `0xf07278`, `0xf075ec`, `0xf075f8`, `0xf08e08`, `0xf08e1c`, `0xf0d3b4`, `0xf0d3c0`.
- **No direct store to +0x3a8..+0x3ab anywhere in 0x10a0000..0x10c6000.** The scans cover str / strb imm12, strh imm8, movw + register-offset, mov-imm + register-offset, vstr imm8, and add-base + offset.
  - Control: the same `st3a8.py` finds the three shared helpers' stores `0x9cd64` / `0x9cd7c` / `0x9cd94`.
- **Status:** the copy is READ. That Neset's e+0x75e8 holds his own `em087_00_dtbase` is INFERRED.
  - Basis: the only writer of e+0x75e8 is `0x70960` (`str` at `0x70970`). It is reached by pointer (`0x1832a90`), and its one direct caller is the arm's loader, which passes its own dtbase.
  - The generic caller for an ordinary enemy was not traced. Every effects lane already uses e+0x75e8 as the monster's own dtbase.

### a2. The field in the file (the dtbase loader `0x53800`, run under `tune_emu.Loader`)
- **dtbase object +0x6c = a u32 read from file +0x1d.** The loader does `add r1, sb, #0x6c; mov r2, #4; bl 0x8241e4` at `0x53a3c..0x53a48`. The run's read log: `read at 0x53a48: file 0x1d size 0x4 -> obj+0x6c`.
  - The neighbouring fields: file +0x15 (4 bytes) -> obj +0x64 (1.0, the scale multiplier), then +0x19..+0x1c -> obj +0x68..+0x6b, then +0x21 -> obj +0xb8, then +0x22 (0x14 bytes) -> obj +0x98 (FlyOfs and the rest; this agrees with rom-map's FlyOfs row).
- **Neset (`C:\MHGU-Extract\scratch-em\em087_00\enemy\dt_base\em087_00_dtbase.dtb`, 195 bytes, all consumed):**
  - **+0x6c = 0x00050402**, bits 1, 10, **16**, 18. **Bit 15 = 0.**
- **Controls (`dtbsurvey.py`):** the loader runs on all 130 `scratch-em/*/enemy/dt_base/*_dtbase.dtb`. Each consumes the whole file, and obj+0x6c == file u32 @ 0x1d in every file.
  - **Bit 16 is set in exactly two: em087_00 (0x00050402) and em058_00 Amatsu (0x00c18c06, bits 1, 2, 10, 11, 15, 16, 22, 23).**
  - Ka em088_00 = 0x00000006 (bit 16 clear). Rathian em001_00 = 0x08400066.
  - These are the two classes with a (10, 0x8e) consumer: Amatsu's `0xf091ac`, and Neset's vt+0x204 `0x10a7424..` and main `0x10b11a0`.

### a3. The trigger of reaction code 0x1a, in the damage step `0x97d20` (READ, `d_97d20.txt`)
**Entry.** The step returns at once unless all three hold:
- e+0x7420 != 0 (`0x97d54..0x97d64`)
- status e+0x73e0 != 0xe
- P+0x5ccc == 0

**Hit loop and HP.**
- The hit loop runs over 8 slots (`0x9807c..0x9899c`).
- After it, HP is subtracted (`0x98a28..`, `0x98aec..`): P+0x370 -= damage, clamped to 0..max.
- **Then the floor (`0x98a7c..0x98a98` and `0x98b4c..0x98b6c`): if HP < int(max x P+0x380), HP = int(max x P+0x380)** (max = P+0x374, int).
- HP <= 0 takes the death codes (`0x98c00..`). The pick below needs HP > 0.

**The code ladder, in priority order.** These are the conditions for reaching the 0x1a pick:
1. Not the (sp+0x10) arm, which gives code 0x28. Not the posture 5 / 6 special codes (0x2a, ..) (`0x98cac..0x98d14`).
2. **P+0x3a2 == 0, and not in (10, 0x88 / 0x89)** (`0x80490`). Otherwise code 0 (`0x98d18..0x98d40`).
3. P+0x3a4 == 0 (`0x98d9c`) and P+0x3a3 == 0 (`0x98dc0`; else code 0x1c).
4. **A trigger this frame** (`0x98e88..0x98ea0`, `0x990f4..0x99124`): any of
   - r8 (= `0x9a290(e)`, the ailment pass)
   - the entry's P+0x5a0 latch
   - P+0x444
   - e+0x7587
   - `0x82540(e)` == 0xd
   - the posture-0 P+0x91b / P+0x3ab bit 3 / P+0x91e == 6 arm

   Otherwise no code. The branches are READ; what each flag means is NOT READ. INFERRED: "he was hit this frame".
5. Not posture 0 with P+0x91b and P+0x3ab bit 3 and P+0x91e == 6 (code 0x24, `0x98ec8..0x98efc`).
6. `0x82540(e)` != 0xd. Otherwise the 0xa96c4 / 0xa92e4 arm (`0x98f00`; NOT READ further).
7. `0x81fd0(e, P+0x484)` == 0 (`0x991b0`). Otherwise exit.
8. **Not in (10, 0x8a / 0x8b / 0x8c / 0x8d)** (`0x804c4`), **and not in (10, 0x6a..0x6d / 0xc8..0xcb)** (`0x80b8c`). Otherwise code 0.
   - (10, 0x8e) itself is not in either list.
9. Not (e+0x7587 and `0xa8cd4(e, 0, 0)` == 1), which gives code 0x20 (`0x99200..0x99234`).
10. **`0x99238..0x99288`: P+0x380 >= (float)P+0x370 / (float)P+0x374, AND P+0x3a8 bit 16 (`tst #0x10000`), AND (bit 15 clear, or posture P+0x1ba == 3) -> P+0x3ae = 0x1a.**
    - Failing this falls to the part flinch, code 0xe (`0x9928c..`). So the threshold beats a flinch on the same hit.

**Dispatch.**
- The step tail-calls `0x9a76c` (`0x98d98`), which switches on P+0x3ae - 1 (table `0x9a81c`).
- **Code 0x1a = index 25 = +0x3cc = `0x9abe8`: `0x76a40(e, 10, 0x8e)`.** This is fixed, for every class.
- Neset's vt+0x1fc is `0x6d63c` = `bx lr`, so there is no remap.

**The only (10, 0x8e) request in the text is `0x9abf4`.** `req10.py` checks every b / bl to the requester family plus `0x76a40` / `0x9b1ec` with r1 #10, r2 #n.
- Control: the same scan finds (10, 0x88) `0x9adf0` and (10, 0xb8 / 0xb9) `0x9cc78` / `0x9cd44`.
- So Neset's (10, 0x8e) comes only from code 0x1a.

### a4. P+0x380, the threshold (READ)
- **Shared default -1.0.** `0xb8b98` (called from the base init `0xad5b0`) stores r6 = 0xbf800000 at `0xb9708`.
  - r6 is set at `0xb92fc` / `0xb9300` and not rewritten before the store; calls preserve it.
  - At -1.0 there is no floor, and code 0x1a can never be picked (HP / max >= 0 > -1).
- **Neset's writers.** These are all the stores to +0x380 that his code makes (`vst.py`, `st3a8.py`). The control: the same scans find the shared `0xb9708`.
  - `0x10a4aec`, spawn vt+0x1d8: **tune 0x16 = 0.65** (`0x6f618(e, 0x16)`).
  - `0x10a7d50`, in `0x10a7bac(e, 0)` when G+0x32 == 2: **tune 0x17 = 0.05**, then B2 k 0 / 1.
  - `0x10a7e34`, `0x10a7bac(e, 0)` when G+0x32 == 4: **-1.0**, then B2 k 1. This path is dead (gapJ: (1, 0x11) is never requested).
  - **`0x10a7e00`, `0x10a7bac(e, 1)` (the G+0x32 == 6 path): -1.0.** gapJ's row for this path left this store out (section c).
  - (`0x10a848c` is a `strb` into another object (r5 array), so it is not P.)
- tune 0x16 / 0x17 are gapJ's em087_00_actiontune.fup reads (0.65 / 0.05).

### a5. What happens in the game for Neset (READ, except where marked)
1. **Spawn.** The base init sets P+0x3a8 = 0x00050402 and P+0x380 = -1.0. Then vt+0x1d8 sets P+0x380 = 0.65.
   - The order is INFERRED: vt+0x1d8 makes his first request (1, 2), so it runs after the init.
2. **The opening chain** (gapJ): (1, 2) -> (1, 0x14) -> (1, 0x15). G+0x32 := 2, and lifts 24 / 25 run.
3. **The first threshold.** Damage takes HP down to int(max x 0.65) and the floor holds it there. On a hit frame that passes the ladder (a3), **code 0x1a -> (10, 0x8e)**.
   - vt+0x204, with G+0x32 == 2, calls `0x10a7bac(e, 0)`:
     - rockets 0..5 killed
     - e+0xd4c8 = 0
     - **floor := 0.05**
     - **B2 k 0, k 1 -> modes 20 / 21** (u 320 at once, u 321 at each landing)
   - The main `0x10b16d0(e, 0)` plays **L3 M12**. At its end it requests (1, 0xf) (G+0x32 := 3).
4. **(1, 8).** Ka sets G+0xca -> (1, 8): G+0x32 := 4, lift mode 25.
5. **The second threshold, at 5%.** Code 0x1a -> (10, 0x8e). G+0x32 goes 4 -> 6 and `0x10a7bac(e, 1)` runs:
   - e+0xd4c8 = 1
   - **floor := -1.0**
   - the G stage writes
   - **no shells**
   - The main plays **L3 M16**. After this he can die.
6. **Corners (READ as branches; whether the game reaches them is NOT READ).**
   - If the floor is reached while G+0x32 is 0 or 3 (before (1, 0x15), or between (1, 0xf) and (1, 8)), vt+0x204 does nothing:
     - the floor stays where it is
     - e+0xd4c8 keeps its value (L3 M12 or M16)
     - no shells are made
     - code 0x1a can fire again on the next hit that passes
   - Re-runs of `0xb8b98` (other callers `0x5ecd0`, `0x6643c`, `0x66704`, `0xcc104`; when they run is NR, per rom-map) would reset the floor to -1.0.

### a6. Amatsu as the positive control
- **Positive for the data and the dispatch.** His dtbase sets bit 16, his class consumes (10, 0x8e) (`0xf091ac`, rom-map R), and code 0x1a is the only source of (10, 0x8e) (a3).
- **But no writer of HP threshold P+0x380 was found for Amatsu.** The searches found none in his band and none in shared code except the -1.0.
  - Scans: `vst.py` and `st3a8.py` over the whole text; `fieldscan.py 0x380` (0xf00000..0xf10000 gives only `0xf0888c`, a literal-pool `ldr pc`); `addvst.py`.
  - A block copy, memcpy, or stm over P would not be seen by these scans.
  - With P+0x380 at -1.0, a3 step 10 can never pass. So the rom-map Amatsu row's "an HP-fraction state" is **unresolved for Amatsu**. Either a writer exists that these scans miss, or his (10, 0x8e) is unreachable.
  - **This does not touch Neset's verdict**: Neset's own writers are READ (a4). It is flagged for whoever owns em058_00: the CLASS_CONTROLS em058_00 HP State control rests on that row.
- **Ka is the negative control.** Bit 16 is clear, yet he writes his own P+0x380 (`0x10b3304`, `0x10b38ec`, `0x10b5e28`). So he gets the HP floor but never code 0x1a.

## (b) The viewer

**No HP input is needed for the shells.** The drops are made at the start of (10, 0x8e) itself (vt+0x204, the action-start hook). Playing that action's clip is the same as "HP just reached 65%". gapJ's row models it exactly, and these reads confirm its gate:

```js
act087(10, 0x8e, '3', 'Motion[12]', [{ start: true, ev: 'ka57', k: 0, b: 2 }, { start: true, ev: 'ka57', k: 1, b: 2 }], { variant: '10:0x8e/g2' }),
```

(keep gapJ's `js/neset.js` / `shells.patched.js` as written)

Optional (the clip lane's call): the second firing, which makes no shells, could get a named variant on L3 M16:
```js
act087(10, 0x8e, '3', 'Motion[16]', [], { variant: '10:0x8e/g6' }),
```
- It is listed only so the page can name the second threshold. It makes no requests.

An HP-State control (the em058_00 precedent) would be needed only to show a threshold state other than the action. Neset has none:
- no head-set or effect switch is keyed on the floor
- e+0xd4c8 only picks M12 vs M16, and the variant already carries that

## (c) rom-map rows (proposed)

| address | what | class | status | detail |
|---|---|---|---|---|
| `0x9cd50` / `0x9cd6c` / `0x9cd84` | P+0x3a8 = `0x711c8(e)` = **[[e+0x75e8]+0x6c]** (the dtbase flag word); or m / bic m. `0x9cd50`'s only caller is `0xa4b90` (`0xa4bd4`), from the base init `0xad4e0` (`0xad504`) and `0xb8ce8`. Shared or / bic callers touch only 0x40 / 0x20 (`0xc93f4`, `0xc9448`, `0xc26c0`, `0xc26d8`) | shared enemy | R | gapL a1 |
| dtbase loader `0x53800`, `0x53a3c..0x53a48` | **file +0x1d (u32, unaligned) -> dtbase +0x6c**; +0x15 -> +0x64; +0x19..+0x1c -> +0x68..+0x6b; +0x21 -> +0xb8; +0x22 (0x14) -> +0x98 | data / shared | R (emulated read log + the static store) | gapL a2, `tune_emu.py` |
| `.dtb` +0x6c flags (file +0x1d) | **bit 16 (the code-0x1a gate) is set only in em087_00 (0x00050402, bit 15 clear) and em058_00 (0x00c18c06, bit 15 set)** of 130 dtbase files; em088_00 0x00000006, em001_00 0x08400066 | data | R (file; whole survey) | gapL dtbsurvey.txt |
| `0xb9708` (in `0xb8b98`) | P+0x380 = **-1.0** (r6, `0xb92fc`): the shared default, so no floor and no code 0x1a | shared enemy | R (store) / path NR | gapL a4 |
| `0x98a7c..0x98a98`, `0x98b4c..0x98b6c` | **HP floor**: after the hit's damage, P+0x370 = max(P+0x370, int(P+0x374 x P+0x380)) | shared enemy | R | gapL a3 |
| `0x99238..0x99288` (gate of the rom-map Amatsu row, read whole) | code 0x1a when P+0x380 >= HP / max (float) and P+0x3a8 bit 16 and (bit 15 clear or posture 3). The ladder's earlier exits: P+0x3a2, (10, 0x88 / 0x89), P+0x3a3 / 0x3a4, a trigger flag (r8 / P+0x5a0 / P+0x444 / e+0x7587 / 0x82540 == 0xd: meaning NR), `0x81fd0`, (10, 0x8a..0x8d), (10, 0x6a..0x6d / 0xc8..0xcb), code 0x20. It beats the part flinch (0xe) | shared enemy | R (branches) / I (trigger flags = "a hit") | gapL a3 |
| `0x9abe8` (table `0x9a81c` index code - 1 = 25, +0x3cc) | code 0x1a -> `0x76a40(e, 10, 0x8e)`, the same for every class. **`0x9abf4` is the only (10, 0x8e) request in the text** (req10.py; control: (10, 0x88) / (10, 0xb8 / 0xb9) found) | shared | R (negative with control) | gapL a3 |
| Neset P+0x380 writers | `0x10a4aec` spawn 0.65 (tune 0x16); `0x10a7d50` 0.05 (tune 0x17, G+0x32 2); `0x10a7e34` -1.0 (G+0x32 4, dead path); **`0x10a7e00` -1.0 on `0x10a7bac(e, 1)`** | uEm087_00 | R | gapL a4 |
| Neset (10, 0x8e): when | first at **HP 65%** (G+0x32 2: floor 0.05, B2 k 0 / 1 modes 20 / 21, L3 M12); second at **HP 5%** (G+0x32 4 -> 6: floor -1, L3 M16, no shells) | uEm087_00 | R (the gates) / I (G+0x32 is 2 by the first threshold) | gapL a5 |
| Amatsu P+0x380 | **no writer found** in his band or shared code except the -1.0 default, so his code 0x1a (the 0xf091ac row's "HP-fraction state") cannot pass as read: **OPEN**, not withdrawn (a block copy would not be seen) | uEm058_00 | U | gapL a6 |

Amend gapJ's proposed `0x10a7bac(e, r1)` row: "r1 1: G stage writes, e+0xd4c8 = 1, **P+0x380 = -1.0 (`0x10a7e00`)**, no shells".

Tooling (gapL):

| script | resolves | control | caveat |
|---|---|---|---|
| `st3a8.py <offs> [lo hi]` | integer stores to the fields: str / strb imm12, strh / strd imm8, movw + register-offset store | the three `0x9cd5x..0x9cd9x` stores; Neset's `0x10a7e00` / `0x10a7e34` | no VFP stores (use vst.py); no block copies |
| `vst.py <off> lo hi` | vstr [rN, #off] | Neset's `0x10a4aec` / `0x10a7d50` | -- |
| `addvst.py <off> lo hi` | add rX, rN, #k, then a store at off - k within 10 | none found anywhere (no positive control) | treat its silence as weak |
| `dtbsurvey.py` | every scratch-em dtbase's +0x6c via the loader, and the file u32 @ 0x1d | em087 / em058 values match a2's single runs | -- |
| `req10.py n..` | (10, n) requests to the requester family + `0x76a40` / `0x9b1ec` | (10, 0x88 / 0xb8 / 0xb9) | the 8-word window: a `b` to a shared tail (e.g. `0x9cd44`) is matched only at the tail |

Traps:
- `tune_emu.Loader` ends every dtbase run with "fault ... 3885957120" (a fetch at 0xe79f0000). It still consumes the whole file and returns 0. INFERRED: this is the harness's return, not a loader failure.
- **dtbase +0x6c is file +0x1d, unaligned.** The fields are read one by one off a stream, so object offsets do not map linearly to file offsets.
- **P+0x380 is two things at once:** the code-0x1a threshold, and an HP floor that applies to every monster. Ka has a floor but no code 0x1a.
