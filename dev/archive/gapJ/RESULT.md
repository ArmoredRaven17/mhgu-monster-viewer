# gapJ -- Ahtal-Neset's requests of Ahtal-Ka's shell57 (u 320 / u 321), 2026-10-21

**Verdict: REACHABLE, and built in a patched copy.** Both of Neset's shell57 makers sit on reachable paths. The page needs no new
control for this. Neset's (1, 0x15), (1, 8) and (10, 0x8e) each play one clip with one fixed meaning (one exception: section 5).
- Modes 24 / 25 (the B6 "lift") come from (1, 0x15) and (1, 8).
- Modes 20 / 21 (the B2 "drop") come from (10, 0x8e), his HP-threshold reaction, on its first firing.
- Modes 22 / 26 (k 2) are never requested. No caller passes k = 2.
- The INFERRED "24..26 = his b6" is now READ: mode = k + 0x18. Only 24 and 25 are ever asked for.

Replay: `node <gapJ>/replay.mjs` gives **15 pass, 0 fail**, including the controls.

Everything here is in `<gapJ>` (`C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\gapJ\`).
No repo file was written.

---------------------------------------------------------------------------------------------------------------------------------

## (a) READ facts

### a1. The two makers. They are functions, and the addresses in the brief are their call sites.
`0x10ac1c8` and `0x10ac3c8` are the `bl 0x10aebac` sites inside two functions. All addresses below are uEm087_00 band, READ.

| function | what it builds (rec for 0x10aebac(G, rec), G = [GOT 0x1832980] -> 0x2132968) |
|---|---|
| **B6 `0x10ac10c(e, k)`** (`..0x10ac1dc`, bl at `0x10ac1c8`) | rec +0 = k; **+4 mode = k < 3 ? k + 0x18 : 0** (`0x10ac138 addlo r1, r4, #0x18`); +8 = e (Neset, the owner); **+0xc placement 2** (G's spot of k); **+0x10 behaviour 6**; +0x14 = 0; +0x18.. = zero vec `0x1620e60`; +0x30.. = `[0x19176b0]` (bss; INFERRED zero; placement 2 never reads it); +0x3c = 0; +0x40.. = `0x1620e60`'s words (0); **+0x4c = 60.0 (0x42700000), the delay**; +0x50 / +0x51 = 0; **+0x54 = 1, the trail: ef 2**. The handle goes to **e+0xccec + 4k** (`0x10ac1d4`). |
| **B2 `0x10ac1ec(e, k)`** (`..0x10ac3e0`, bl at `0x10ac3c8`) | joint = k < 3 ? **0x82 + k** : 0xff. Its world point is `0xc164c(e, joint, &sp+0x70)`, which goes to **rec +0x30..**. Its record (e+0x498 index, e+0x494 + 0xa0·i, +0x10..+0x4c, the 4x4) goes through `0x7c3a38` (Euler) and `s32(0.5 + a·10430.378)` & 0xffff (literal `0x10ac3e8` = 0x4622f983) to give **rec +0x40.. words**. When the record is 0xff the words are the zero vec's. **mode = `0x10aed14(G, k, 0x57)` = k < 3 ? k + 0x14 : 0**. +8 = e. **+0xc placement 3**, **+0x10 behaviour 2**, +0x14 = 0, +0x18.. = zero vec, +0x3c 0, **+0x4c = 0** (no delay), +0x50 = 0, +0x51 = 1, **+0x54 = 1** (ef 2). Then **e+0xccc1 + 12k = 0** (`0x10ac3d8`): he no longer holds k. |

Supporting reads:
- `0x10aebac` copies the rec into the 0x60-byte setup, as rom-map has it. The +0x4c delay lands at setup +0x4c through `stm r4, {r0, r2, r3, sl}` at `0x10aecbc`.
- **Model.** base57 init `0x42f15c`: when the owner's +0xb5f4 == 0x57, the model is `0x10abf4c(e, k)` = **[e+0xccb0 + 4k]** (k != 4).
  - `0x10a4060` calls `0x10a40f4(e+0xccb0)`, which loads rModel **0x8679 / 0x867a / 0x867b** (`0x10a410c` / `0x10a4148` / `0x10a4184`).
  - These are the same rubble models Ahtal-Ka loads into E+0xcb00.
- **The "holds k" byte** is e+0xccc1 + 12k.
  - Set by `0x10aa368(e, k)`, which also does `0x10ae6c0(G, k, 1, 1)`: G slot k = 1 and the shell released.
  - `0x10abf00` is the "may pick" test: G `0x10ae8d0` == 1 and the byte is 0.

### a2. base57 behaviour 6 (READ whole). The viewer had nothing for it.
- **Init `0x42f864..0x42f8d0`** (behaviour table `0x42f45c`, entry 5 = 0x408):
  - +5 = 1.
  - **+0x173c = int 0** (+0x15e8): the owner's joint.
  - int 0 == 255: vt+0x148(0) at once.
  - **+0x16e0 = 0x3c888889 (1/60)**, the turn's rate.
  - **+0x1744 = 1 / float 0**.
  - Then `0x42fc00`: +0x1670 = R(words); the delay goes to state 1 and `0x10ae6c0(G, k, 1, 0)`.
  - The start +0x16f0.. is the placement's point (`0x42f3ec`). The ctor `0x42ecb8` zeroes +0x1740 and +0x16dc (`0x42f018` / `0x42ef24`).
- **Move `0x4320a4..0x432468`** (move table `0x4305c0`, entry 5):
  - Sub 1 -> 2: the hit (+0x15e0, vt+0x140, not visual).
  - Sub 1 -> 2: the trail `0x432470`, which reads setup +0x54.
  - Sub 1 -> 2: **ef 4** (+0x15dc) at +0x40 through `0x4a10c8` / `0x4a11e4`, into +0x1638.
  - Sub 1 -> 2: start words +0x16e4.. = +0xfe8...
  - Then on every move:
    - No owner (`0x4a0f00`) means vt+0x148(0).
    - **t (+0x1740) = min(t + rate·dt, 1)**.
    - P = `0xc164c(owner, +0x173c)`.
    - **+0x40 = t·P + (1-t)·start** (vmul, then vmla; not fused); +0x4c = 0.
    - The joint record's Euler goes to the rest words +0x16d0.. (kept as they were when the record is 0xff).
    - The turn `0x432efc`.
    - **At t >= 1**: +0x1710 = +0x40, +0x1720 = +0x16d0.., vt+0x148(0).
- Behaviour 5's move `0x431908` stays NOT READ. Nothing calls it (rom-map).

### a3. Who calls the makers, and what reaches those callers (READ)
- **Callers.** I scanned every b / bl in main.text (`xref.py`).
  - Control: the same scan finds rom-map's eight callers of 0x10aebac, exactly.
  - B6 is called from `0x10afdd8`, `0x10b0584` and `0x10b067c`.
  - B2 is called from `0x10a7d58` and `0x10a7e44` (a tail `b`).
  - Nothing reaches either through a pointer (no abs or PIC pointer).
- **Neset's dispatch tables.**
  - The status table `0x10a5760` (e+0x73e0 0..0x11): 1 -> `0x10af6b8`, 10 -> `0x10b11a0`.
  - The status-1 table `0x10af6e0` (e+0x73e1 0..0x15):
    - **8 -> `0x10afc44`**
    - 0xf / 0x10 / 2 -> `0x10b1320(e, 0 / 1 / 2)`
    - **0x11 / 0x12 -> `0x10b16d0(e, 0 / 1)`**
    - 0x14 -> `0x10afebc`
    - **0x15 -> `0x10b029c`**
- **(1, 8) main `0x10afc44`.**
  - Phase 0: L0 M9 (`0xafe84(e, 9)`, blend 0, start 0) and **rate 0.0** (`0xb07b4(e, 0.0)`). +0x1bc = 0; +0x1c0 = 1200.
  - Phase 1 sub 0: `0x7206c(&+0x1bc = 0)` returns 1 at once, so on the first phase-1 move: **B6(e, 1) -> mode 25**.
  - Sub 1 waits until the handles e+0xccec / +0xccf0 / +0xccf4 leave states 1 / 2 (`0x4307c0`), or for the 1200.
  - Then rate 1.0 and `0x10aa368(e, 1)` (he holds 1). Phase 2 runs the motion out, then `0x10ada84`.
- **(1, 0x15) main `0x10b029c`.**
  - Phase 0: L0 M9 via `0xafef0` with **blend 0.0, start 230.0, rate 0.6** (literals `0x10b06d4` / `0x10b06e4` / `0x10b06e8`). +0x1bc = **tune 0x35 = 0.0**.
  - Phase 1 sub 0 (the first phase-1 move): **B6(e, 0) -> mode 24**, then +0x1bc = **tune 0x36 = 40.0**.
  - Sub 1: when it counts out (by dt; see below): **B6(e, 1) -> mode 25**.
  - Sub 2: the shells, or 1200 frames. Then `0x10aa368(e, 0 / 1)`.
  - `0xb0968(e, 2, 0, 260.0, 0.0)` sets rate 1.0. NOT READ beyond the call: it is the clip's, not the shells'.
- **The drops.** Both B2 calls are in **`0x10a7bac(e, 0)`**. With r1 == 0 it does: e+0xd4c8 = 0, then reads **G+0x32** (`0x10ae870`):
  - == 2: P+0x380 = tune 0x17 (0.05); B2(e, 0); B2(e, 1).
  - == 4: P+0x380 = -1.0; B2(e, 1).
  - otherwise: nothing.
- **`0x10a7bac(e, 1)`** takes the other path (`0x10a7d60`): G stage writes (G+0xcb = 2 via `0x10aeafc`, G+0x33 = 1), e+0xd4c8 = 1, `0x10ae878` (Ka's `0x10bc254`). **No shells.**
- **vt+0x204 `0x10a6e58`** (READ; this closes "0x10a75f8's switch NOT READ"):
  - Status 1 goes through the switch on n - 8 (table `0x10a74fc`, 14 entries):
    - **8 -> G+0x32 = 4** (`0x10a7538`; also the rocket cooldown, tune 0x1c, e+0xcd34 |= 0x5f ...)
    - **0xf -> G+0x32 = 3**
    - **0x11 -> 0x10a7bac(e, 0)**
    - **0x12 -> 0x10a7bac(e, 1)**
    - **0x15 -> G+0x32 = 2** (`0x10a7628`)
    - n == 0xf also: `0xac030`, then G+0xcb = 2.
  - Status 10, n == 0x8e (`0x10a7424..0x10a747c`):
    - G+0x32 == 4 is first rewritten to 6.
    - **== 6 -> 0x10a7bac(e, 1)**
    - **== 2 -> 0x10a7bac(e, 0)**
- **(10, 0x8e) main.** `0x10b11a0` -> `0x10b16d0(e, e+0xd4c8)`:
  - d4c8 0 -> **L3 M12 (0x30c**, `0xafce8`, blend 10, start 0, flags 0x11).
  - d4c8 1 -> L3 M16 (0x310).
  - At the motion's end it requests (1, 0xf) or (1, 0x10) (`0x10b1774`, via Neset's own requester `0x10ade4c`).
- **Neset's requests** (`reqscan.py`; the requester family is every function that calls the shared core `0x76098`, in `reqfuncs.txt`, plus `0x6d564`, `0x10ade4c` and `0x10bc334`):
  - spawn vt+0x1d8 `0x10a41cc` -> **(1, 2)** (`0x10a4af4`), after **P+0x380 = tune 0x16 = 0.65** (`0x10a4aec`).
  - (1, 2) main -> **(1, 0x14)** when **G+0xcc** (`0x10b14e8`).
  - (1, 0x14) main `0x10afebc` -> **(1, 0x15)** when **G+0xca** (`0x10b0060`).
  - (1, 0xf) main -> **(1, 8)** when **G+0xca** (`0x10b1454`).
  - (1, 0x11) / (1, 0x12) / (10, 0x8e) bodies -> (1, 0xf) / (1, 0x10) (`0x10b1774`).
  - G+0xca is set only by Ka (`0x10b5e18`, `0x10be23c` -> `0x10aeaf0`). G+0xcc only by Ka (`0x10bdd64` -> `0x10aeb28`). Which of Ka's actions do it: NOT READ.
- **(1, 0x11) / (1, 0x12) are never requested of Neset. This is a negative with a positive control.**
  - `reqscan.py 11 12` over all of main.text gives four hits:
    - `0xda730c` and `0xf380c8`: the uEm018_00 and uEm063_00 bands.
    - `0x10bd5f4` and `0x10bd614`: Ka's own, r4 = E, through his E+0xd485 wrapper.
  - Control: the same scan finds Neset's (1, 0x15) / (1, 8) / (1, 0x14) / (1, 2).
  - `reqscan2.py` (every call including blx in 0x10a0000..0x10c6000): no other hit.
  - `emcacts.py`: em087_00_cmdtbl.emc has no `00 1 11` / `00 1 12` / `00 1 8` / `00 1 f` / `00 1 15` / `00 a *`. Control: it lists (1, 9), (1, 0xa), (1, 0xb), (1, 0xc), (1, 0x13) and so on.
  - `movwscan.py 73e5 73e6 73e7`: the only writers of the request fields are the ctor `0x6dcdc..` and the shared requesters. Control: `ccec` finds its 9 known sites.
  - So the (1, 0x11) arm of vt+0x204 is dead, along with **the G+0x32 == 4 drop** (B2(e, 1) alone). That drop is reached only through it, because (10, 0x8e) turns 4 into 6 first.
- **Mode by mode:**
  - **modes 24 + 25**: (1, 0x15), the fight's opening. Spawn (1, 2) -> Ka sets G+0xcc -> (1, 0x14) -> Ka sets G+0xca -> (1, 0x15), G+0x32 := 2.
  - **modes 20 + 21**: the first (10, 0x8e), while G+0x32 == 2. It plays L3 M12, then (1, 0xf) sets G+0x32 = 3.
  - **mode 25** again: (1, 8). After (1, 0xf), Ka sets G+0xca; G+0x32 := 4.
  - The second (10, 0x8e): G+0x32 4 -> 6, L3 M16, no shells.
- **What fires (10, 0x8e)** (shared engine; rom-map's Amatsu row, `0xf091ac`):
  - Reaction code 0x1a (dispatcher `0x9a76c`, table `0x9a81c` case 26), picked at `0x99280` when P+0x380 >= P+0x370 / P+0x374 (HP / max) with P+0x3a8 bit 16.
  - Neset writes P+0x380 himself: 0.65 at spawn, then 0.05, then -1.0. These are his two HP thresholds.
  - **For Neset, P+0x3a8 bit 16 is NOT READ.** He sets no `#0x3a8` in his band, so it would come from his param data. The (10, 0x8e) gate is therefore READ on the shared side and INFERRED for him.
- **G's spots before anything moves** (placement 2):
  - The static initialiser **`0x10ae0e0`** (init_array `0x18439dc`) fills **`0x21328b0`** = (1800, -90, 1600), (-2100, -90, 1900), (3300, -90, 3800).
  - It also fills **`0x21328e0`** = (0.10472, 0, 0.034907) rad x 3, i.e. (6, 0, 2) degrees.
  - His vt+0x18 **`0x10a2ed8`** passes both to `0x10ae90c(G, k, &pos[k], &ang[k], 0)` (`0x10a3110..0x10a3160`). These are his arena's absolute points, as with PATROL087.
- **Timers and tune.**
  - `0x7206c(e, &t, 1.0)`: t <= 0 at entry returns 1 (t = 0). Otherwise `0x539d5c`: t -= e+0x1c·1.0, clamped at 0, returns t <= 0.
  - em087_00_actiontune.fup layout: 0x14-byte header ('FUP', 2, 0, 0x37 floats, 0x36 vec3), floats from 0x14. Control: index 0x1e = 90.0 and 0x1f.. = 200 / 90 / 170 = shells.js TUNE087_ROCKET. Values: **0x16 0.65, 0x17 0.05, 0x29 300.0, 0x35 0.0, 0x36 40.0** (`tune087.py`).

### a4. What each mode starts (the files in SHELL_DATA.em088_00.shells.shell57, list 0 = em088_00u)
- **20 / 21** (int 0 = 255, unused by placement 3):
  - **u 320 at once.** This is the trail, ef 2, made in the same step it moves.
  - **u 321 at the landing.** ef 0, via `rest57` -> `landEffect57`.
  - Rest point: his position + vec 3 ((1500, 0, -1000) / (-1500, 0, -1000)) turned by his facing, y -90.
- **24 / 25** (joint 130 / 131, float 0 = 50, so 50 moves):
  - After the 60-frame delay: **u 320** (ef 2, the trail) and **u 70** (ef 4).
  - It ends on his joint 130 / 131.

## (b) The JS

`patch_shells.py` applies these edits to a COPY of `docs/render/shells.js`, after checking each anchor appears exactly once.

1. **make57, behaviour 6.** Insert `js/b6init.js` before line **14937**: `  } else return { why: 'shell57 behaviour ' + b + ': not his' };`
2. **step57.** After line **15112** (`  else if (b === 3) move57pull(S, D, ctx, out);`) add:
   `  else if (b === 6) move57lift(S, D, ctx, out);`
3. **move57lift.** Insert `js/b6move.js` before line **15167**: `// the request a row makes (the CU record, per caller above)`
4. **spawn087.** After line **20916** (`    else if (sp.ev === 9) make087s48(...)`) add:
   `    else if (sp.ev === 'ka57') make087ka57(state, D, a, sp, own, J, ctx, out);`
5. **Line 18** (line **25997**). Replace with:
   `    else if (S.base === 'base57') step57(S, ctx, input, S.D57 || D, out);   // S.D57: one Ahtal-Neset made (make087ka57)`
   A shell57 Neset made then steps on Ahtal-Ka's data: em088_00u, his def, the rubble.
6. **Neset's maker and rows.** Insert `js/neset.js` after line **21523** (`SHELL_DATA.em087_00.rockets087 = true;`). It holds `SPOT087`, `D57N`, `make087ka57`, and the rows:
   ```js
   act087(1, 0x15, '0', 'Motion[9]', [{ frame: 1, ev: 'ka57', k: 0, b: 6 }, { frame: 41, ev: 'ka57', k: 1, b: 6 }]),
   act087(1, 0x08, '0', 'Motion[9]', [{ frame: 1, ev: 'ka57', k: 1, b: 6 }]),
   act087(10, 0x8e, '3', 'Motion[12]', [{ start: true, ev: 'ka57', k: 0, b: 2 }, { start: true, ev: 'ka57', k: 1, b: 2 }], { variant: '10:0x8e/g2' }),
   ```
7. **The comment at line 3428** ("Not his: behaviour 6 and Neset's mode 0x14 + k ...") should now say: behaviour 6 and modes 20 / 21 / 24 / 25 are Neset's, built at SHELL_DATA.em087_00 (make087ka57), and 22 / 26 are never asked.

The exact text of each insert is in `<gapJ>/js/b6init.js`, `js/b6move.js` and `js/neset.js`. The result is `<gapJ>/shells.patched.js`.

How the precedents shaped it:
- **The other monster's shell.** Neset's earlier shells all lived in his own SHELL_DATA. So I did not copy the em088 def.
  - The maker passes a small D (`D57N`) to the existing `make57` / `trail57`: em088's lists, its shell57 def and its rubble.
  - It tags the shell `S.D57`, so its moves and records resolve on em088_00u.
  - Line 18's one change makes step57 use that D.
- **The spot.** `ctx.spots088[k]` (this session's, written by a shell57 end) else `SPOT087[k]`. This follows Ka's pull, which refuses when there is no spot; here the ROM's own initial spot is READ, so nothing is refused.

## (c) rom-map rows (proposed; uEm087_00 section, plus one base57 row)

Rows:

| address | what | class | status | detail |
|---|---|---|---|---|
| `0x10ac10c(e, k)` (bl `0x10ac1c8`) | **B6, the lift request**: shell57 mode **k + 0x18** (k < 3), placement 2, behaviour 6, delay 60.0 (+0x4c), trail param 1, owner e; handle e+0xccec + 4k. Callers `0x10afdd8` ((1, 8), k 1) and `0x10b0584` / `0x10b067c` ((1, 0x15), k 0 then k 1 after tune 0x36 = 40 frames) | uEm087_00 | R | gapJ/RESULT.md a1, a3; shells.js make087ka57 |
| `0x10ac1ec(e, k)` (bl `0x10ac3c8`) | **B2, the drop request**: joint 0x82 + k's point -> rec +0x30, its record's Euler words -> +0x40; mode `0x10aed14(G, k, 0x57)` = k + 0x14; placement 3, behaviour 2, no delay, +0x51 1, trail 1; then e+0xccc1 + 12k = 0. Only caller `0x10a7bac(e, 0)` (`0x10a7d58` / `0x10a7e44`) | uEm087_00 | R | same |
| vt+0x204 `0x10a6e58` status-1 switch `0x10a74fc` (n - 8) / status 10 `0x10a7424..` | (1, 8) G+0x32 = 4; (1, 0xf) = 3; (1, 0x15) = 2; (1, 0x11) -> `0x10a7bac(e, 0)`; (1, 0x12) -> `(e, 1)`; (10, 0x8e): 4 -> 6, then 6 -> `(e, 1)`, 2 -> `(e, 0)` | uEm087_00 | R | a3 |
| `0x10a7bac(e, r1)` | kills rockets **0..5** (e+0xcdcc..+0xcde0, `0x435930(h, 0)`); e+0xcdc1 = 0, +0xcdb7 = 8, +0xcd36..+0xcd42 = 0, +0xcd34 &= 0x80. r1 0: e+0xd4c8 = 0, G+0x32 2 -> P+0x380 tune 0x17, B2 k 0, 1; 4 -> P+0x380 -1.0, B2 k 1. r1 1: G stage writes, e+0xd4c8 = 1, no shells | uEm087_00 | R | a3 |
| status table `0x10a5760` / status-1 mains `0x10af6e0` | (1, 8) `0x10afc44`; (1, 2 / 0xf / 0x10) `0x10b1320`; (1, 0x11 / 0x12) `0x10b16d0(e, 0 / 1)`; (1, 0x14) `0x10afebc`; (1, 0x15) `0x10b029c`; (10, 0x8e) `0x10b11a0` -> `0x10b16d0(e, e+0xd4c8)`: L3 M12 / L3 M16 | uEm087_00 | R | a3 |
| Neset's stage chain | spawn vt+0x1d8 `0x10a41cc`: P+0x380 = 0.65, (1, 2) -> G+0xcc (Ka `0x10bdd64`) -> (1, 0x14) -> G+0xca (Ka `0x10b5e18` / `0x10be23c`) -> (1, 0x15); (10, 0x8e) -> (1, 0xf) -> G+0xca -> (1, 8). **(1, 0x11) / (1, 0x12) are never requested** (reqscan.py; control: his four requests found) | uEm087_00 | R (negative with control) / Ka's setting actions NR | a3 |
| `0x21328b0` / `0x21328e0` (static init `0x10ae0e0`, init_array `0x18439dc`) | G's spots k 0..2 before anything moves: (1800, -90, 1600), (-2100, -90, 1900), (3300, -90, 3800); angles (6, 0, 2) deg in radians; set into G by his vt+0x18 `0x10a2ed8` -> `0x10ae90c` (`0x10a3160`) | uEm087_00 / G | R | shells.js SPOT087 |
| e+0xccb0..+0xccb8 / `0x10abf4c` | his object models: rModel 0x8679 / 0x867a / 0x867b (`0x10a4060` -> `0x10a40f4`), base57's model when the owner is Neset | uEm087_00 | R | a1 |
| e+0xccc1 + 12k | "holds object k": `0x10aa368(e, k)` sets it (and G slot 1, the shell released); B2 clears it | uEm087_00 | R | a1 |
| base57 b6: init `0x42f864`, move `0x4320a4` | **the lift**: delay, then t += dt / float 0 (to 1); point = lerp(start, the owner's joint int 0); rest words = that joint's Euler; turn rate 1/60; trail + ef 4 at the first move; end at t = 1. Int 0 255: ended in the init | uShellEmBase57 | R | shells.js move57lift |
| `0x7206c(e, &t, s)` / `0x539d5c` | t <= 0 at entry: returns 1 at once; else t -= e+0x1c · s, clamped 0, returns t <= 0 | shared | R | a3 |
| em087_00_actiontune.fup | header 0x14 ('FUP', 2, 0, 0x37 floats, 0x36 vec3), floats from 0x14 (control: 0x1e = 90, 0x1f.. = TUNE087_ROCKET): 0x16 0.65, 0x17 0.05, 0x29 300, 0x35 0, 0x36 40 | em087_00 | R | gapJ tune087.py |

Tooling (gapJ):

| script | resolves | control |
|---|---|---|
| `xref.py` | b / bl callers and abs pointers to given addresses (main.text / rodata / data). Its "pic lit" lines are a loose heuristic: ignore them | the 8 callers of 0x10aebac |
| `reqscan.py` (+ `reqfuncs.txt`) | calls to the request family with r1 = 1, r2 = #n, whole text | finds Neset's (1, 0x15) / (1, 8) / (1, 0x14) / (1, 2) |
| `reqscan2.py lo hi s,n..` | any call including blx | the same |
| `movwscan.py` | `movw rX, #imm` sites | 0xccec: its 9 sites |
| `picref.py lo hi` | PIC materialisations into a range | 0x21328b0's two users |
| `emcacts.py` | an .emc's action ops (00 s n) | (1, 9 / 0xa / 0xb ...) found |
| `jdis.py` | skipdata disassembly (armdis.py stops at data) | -- |

Traps:
- `armdis.py` stops at the first undecodable word in a band: use `jdis.py` (skipdata).
- Don't name a file `dis.py`: it shadows stdlib `dis` and breaks capstone's import.

WITHDRAWN (proposed):

| claim | why it is wrong | correction |
|---|---|---|
| rom-map "Neset's rocket gate and its handles" row: "`0x10a7bac(e, r1)` kills **all nine** (from 0x10a75f8, a switch NOT READ)" | 0x10a7bac drops six handles, e+0xcdcc..+0xcde0 (`0x10a7bb4..0x10a7c8c`), not nine. The switch is vt+0x204's status-1 table `0x10a74fc` | kills rockets 0..5; called for (1, 0x11) (r1 0) and (1, 0x12) / (10, 0x8e) at G+0x32 6 (r1 1), and (10, 0x8e) at 2 (r1 0). See the 0x10a7bac row |
| shells-draw-table u 320 / 321 "24..26 INFERRED his b6 0x10ac1c8"; shells.js comment line 3428 "Not his" | READ now: 0x10ac10c makes k + 0x18 for k 0 / 1 only. 26 (and 22) are never asked | modes 20 / 21 / 24 / 25 are Neset's, built; 22 / 26 never made. Also: 0x10ac1c8 / 0x10ac3c8 are the bl sites; the functions are 0x10ac10c / 0x10ac1ec |

## (d) Replay
`<gapJ>/replay.mjs` imports `shells.patched.js` (and, as a control, the unpatched repo file). Output: `replay.out`.

- **(1, 0x15) L0 M9:**
  - mode 24 is made at step 2 and mode 25 at step 42. The rows are action frames 1 / 41; line 4 tests the previous advance, hence the one-step shift.
  - Both are state 1 with rubble_01 / _02. Mode 24 starts at G spot 0.
  - **em088_00u:320** and **em088_00u:70** start at steps 62 / 102.
  - They end on joints 130 / 131 at steps 112 / 152.
- **(1, 8):** mode 25 at step 2.
- **(10, 0x8e)/g2 L3 M12:**
  - Modes 20 / 21 are made at step 0, from joints 130 / 131, and **em088_00u:320** starts at step 0.
  - **em088_00u:321** starts at each landing (steps 53 / 65). The rests are at (+-1500, -90, -1000).
- **Controls:**
  - The unpatched shells.js makes nothing for these plays.
  - With joint 131 missing, mode 21 is refused ("no matrix for joint 131 (0x10ac220)").
- **15 pass, 0 fail.** The joints are synthetic (identity matrices at set points), so this checks the transcription's own logic. It is not a ROM-emulated comparison: no unicorn run of 0x10ac10c / 0x10ac1ec / base57 b6 was done.

## Named differences and open items
1. **The clip side, not this lane.**
   - In the game, (1, 0x15) plays L0 M9 from frame 230 at rate 0.6 (then 1.0 after `0xb0968(e, 2, 0, 260)`, NR). (1, 8) holds L0 M9 at frame 0 (rate 0) until the lifts end.
   - The viewer plays both from 0 at rate 1. The lifts' rows are dt timers in action frames, so they still land right.
   - If the page later gives (1, 0x15) a `startFrame` (the psl-mask CLIP_ACTIONS precedent), these rows must stay on the action clock.
2. **Variant selection.**
   - L0 M9 now has two ai variants ('1:0x15', '1:0x08').
   - L3 M12 has '10:0x8e/g2'. (1, 2) / (1, 0xf) / (1, 0x11) also set L3 M12, held, with no shells.
   - The page needs the same variant wiring Neset's other ai rows use. Not checked here: I did not open the page.
3. **G+0x32.** (10, 0x8e) at G+0x32 == 3 makes no drops. That state lasts from (1, 0xf) until Ka sets G+0xca, so the second threshold could in principle fire there.
   - The row is named for the G+0x32 == 2 play (the first threshold) and is not a guess at the state.
4. **Neset's P+0x3a8 bit 16** (the shared reaction gate for code 0x1a): NOT READ.
5. **Not modelled:** the held-object side (e+0xccc1 set by `0x10aa368` after the lift; cleared by the drop).
   - The viewer has no Neset held prop (HELD_PROP is Ka's), so his objects on joints 130 / 131 are not drawn between a lift and a drop.
6. **Absolute arena coordinates.** SPOT087 is in his arena's coordinates (as PATROL087), so the lifts start where the arena has them.
