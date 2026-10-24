# gap D -- Valstrax (em086_00, uEm086_00): u 140 (sp_01 10), c 30 (sp_01 6), u 502 (sp_01 9)

Helper's result, 2026-10-20. No repo file was edited. All tools are in this folder (`gapD\`). `<fb>` means `scratchpad\fb\`.
R = READ (the instruction that uses the value was read). E = run under emulation (trgen). I = INFERRED.

## Short answer

| record | sp_01 mode | result |
|---|---|---|
| em086_00u:140 | 10 | **REACHED, rows given.** (7, 0x33) follows (7, 0x32 / 0x34 / 0x35) at phase 6. (7, 0x34 / 0x35) are command-table actions (g1 s29). The walk missed it for two reasons: chainx runs phases 0..5 only, and issuers.py looks only 4 instructions ahead for the `bx`. |
| em086_00c:30 | 6 | **REACHED, rows given.** Only (3, 4) makes it. (3, 4) follows the status-2 actions (2, 0 / 9 / 0xc / 0xd / 0xe) when the stage's area-point query finds a point. trgen gives every stub one fixed answer, so this branch was never taken. |
| em086_00u:502 | 9 | **No maker anywhere, checked against a positive control.** Named refusal. The record is already exported (shell-tagged) but nothing creates it. |
| (u 500 via sp_01 11) | 11 | The makers are READ: (3, 0), (13, 0), (13, 1). The callers are **NOT READ**: (3, 0) only appears in command stream g1 s43, and nothing in the table calls that stream; status 13 has no caller. Rows are given, but only behind `--named`. |

---

## (a) What was read, with addresses

### 1. (7, 0x33) and sp_01 10 (u 140)

- **The handler `0x109a5b4` (R) does not depend on the action number.** It handles (7, 0x32), (7, 0x34) and (7, 0x35) the same way. It never reads e+0x73e1, the action number byte. The band's 0x73e1 reads are at 0x10942cc, 0x1094bbc, 0x1095cf0, 0x10971dc, 0x109bbd8, 0x109c424, 0x109e5ac and 0x109edf8, and none lies in 0x109a5b4..0x109b07c.
  - Phase table `0x109a620`: 0 `0x109a63c`, 1 `0x109a758`, 2 `0x109a974`, 3 `0x109aa50`, 4 `0x109aab8`, 5 `0x109ac28`, 6 `0x109ac48`.
  - Phases 0..3 are already in the effects spec 5 and the shells spec 9: L2 M70, then L2 M71 with sp_01 7 (tail call `0x109a970`), then L2 M72, then L1 M5.
  - Phase 4: when the timer expires the motion is set to 0xffff and id 1002 is requested.
  - Phase 5: the unseen flight. When it ends: the yaw += 0x8000, P+0x1bc = tune float 0x28 (**150**, `0x109ad64..0x109ad74`), the flight vector toward e+0xcad0.., and id 1001 into e+0xcb18.
  - **Phase 6 (`0x109ac48`)** sets P+0x918 / P+0x990 = 1 and e+0x13a8 = 0, then runs `0x7206c(e, &P+0x1bc, 1.0)`:
    - not expired: the turn at `0x109af5c`;
    - expired: stop the e+0xcb18 handle (`0x329c40`), then **e+0x7420 != 0 -> `vt+0x3d0(e, 7, 0x33)`** (`0x109acb4..0x109acd4`; the `bx r3` is the 5th instruction after the `ldr r3, [r0, #0x3d0]`), else `vt+0x3e0(e)` (`0x109b030`).
  - E: `gapD\run33.py`. Phase 6 with the timer answered 1 gives `chg (7, 0x33)` for 0x32, 0x34 and 0x35 alike. Control: with own7420 0 there is no change.
- **Why the walk did not reach it:**
  - `<fb>\chainx.py` walks `for ph in range(6)`, so phase 6 is never run.
  - `<scratchpad>\zg\issuers.py` accepts the `bx` only 1..4 instructions after the `ldr #0x3d0`. Widened to 8 (`gapD\issuers8.py`), it also finds (3, 6) `0x109656c`, (7, 0x33) `0x109acd4` and (12, 1) `0x109d6c4` in his band.
- **The handler `0x109b07c` for (7, 0x33) (R)**, phase table `0x109b0f0`:
  - **Phase 0 `0x109b100`:** P+0x342 / +0x918 / +0x990 = 1, posture 1, `0xbee74`, motion 0xffff, P+0x1bc = tune float 0x29 (60). This is where u 120 is requested (effects spec 5).
  - **Phase 1 `0x109b378`:** while P+0x1bc > dt, steps along (`0x7b53c`). At the end the block = e+0xcad0.. and the words = e+0xcac0.. (`0x109b704..0x109b754`). When `0x7206c` expires: phase 2, L1 M5 (0x105), u 130 (id 1004, `0x109b7d8`), hit arm `0x7db70(e, 0, 0x13, 9)`.
  - **Phase 2 `0x109b410`:** e+0x13a8 = tune float 0x1f. The fall continues until P+0x44 <= P+0x1d4 + **857.0** (literal `0x109b83c`). Then the block = P+0x1d0.., P+0x5b4 = e+0x10f0 = P+0x1d4, u 130 is stopped, phase 3, posture 0, **L2 M73 (0x249)**, yaw += 0xe001, hit arm (0, 0x14, 0x19), `0x4dfad0`.
  - **Phase 3 `0x109b570`:** at **tune float 0x2a = 2.0** (`0xb0974`) of L2 M73, **sp_01 10** (`0x109b58c..0x109b648`):
    - position e+0x40.., words e+0xfe8 / +0xfec / +0xff0;
    - +0x3c = halfword P+0xb0a; +0x20.. = the shared zero vector.
    - Then two timed turns `0x76dd0`, the P+0x910 ramp (`0xb0968` mode 2, 40.0; `0xb0974` 40.0 -> 1.0), and at the end `vt+0x3dc`.
  - E: `gapD\run33b.py 7 0x33 4`, phase 3 frame=1 gives `create 0x175 m10`, last frame test 2.0. The tune floats come from em086_00_actiontune.fup through trgen: 0x24 30, 0x25 90, 0x28 150, 0x29 60, 0x2a 2, 0x1f 3.
- **sp_01 10's files (.shl):** ef 0 = (-1, 999), i.e. none; ef 1 = (0, 140) through the 0x20 switch (int 3 = 0); 0x800 (int 0 = 0); hit 8.
- **The records already exist:** docs/effects/em086_00.json has `when: 'shell'` entries for u 140 (`em086_00_306.efl`) and c 30 (`cm200_040.efl`).
- **(7, 0x32) itself has no caller (named refusal, controls run).** Its handler is (7, 0x34 / 0x35)'s, so it makes nothing those two do not already make. Checked:
  - the command table, every group (`emc011.py`: 7:0x32 [], control 7:0x34 g1 s29);
  - his band 0x1094024..0x10a2e44 with issuers8 (16 calls; controls (7, 0x33) and (3, 4) found);
  - the shared layer 0x40000..0xc9000 (75 calls, none (7, 0x32));
  - script op 0xfe (`gapD\fescan.py`: 22 records in main.data, control (10, 0x1d) at 0x17ab290);
  - his vt+0x1fc remap `0x109f7c8`, read whole: it only maps (0, 0) -> (1, 0) when P+0x1bb is set, and (2, 0) -> (2, 0xd) when `0x816e8` is true.

### 2. sp_01 6 (c 30) and sp_01 11 (u 500): the status-3 / 13 makers

- **The dispatch:** main `0x109f650` uses the status table `0x109f670` (statuses 0..0x11). Status 3 goes to `0x10971dc`. Status 13 goes to `0x109f734`: n 0 -> `0x109d6e8`, n 1 -> `0x109f788`.
- **The makers (E, census `gapD\cen3_13.py 3,13 0x10`).** These are the only creates in statuses 3 / 13, n 0..0xf:
  - (3, 0): sp_01 11 in phase 1;
  - (3, 4): sp_01 6 in phase 2;
  - (13, 0): sp_01 11 in phase 1;
  - (13, 1): sp_01 11 in phase 4.
- **(3, 4) = `0x109699c`, read whole.** Phase table `0x10969d0`.
  - **Phase 0:** posture 0; L0 M34 (0x22) with blend 6; the vt+0x78 call; hit arm `0x7db70(e, 0, 0x12, 0xb)`.
  - **Phase 1 `0x1096bf0`:** at L0 M34's end, lift `0xbc984` and **L0 M35 (0x23)**; the flight toward the point that 0x1095114 found (e+0xcaf8 / e+0xcafc).
  - **Phase 2 `0x1096a54`:** flies (`0x7a820(e, P+0x50, 1)`). Once landed, i.e. `0xbf52c(e, 674.0)` returns P+0x44 <= floor + size x 674, and when L0 M35 reaches frame 20 (`0xb0968(e, 1, 20.0, 0.0)`): phase 3, posture 0, **L0 M36 (0x24)**, hit arm (0, 0x12, 0x18).
  - **Height test, same update (`0x1096ae0..0x1096b04`):** if P+0x44 > P+0x5b4 + **900.0** (literal `0x1096dac`; unordered counts as greater), no shell. Otherwise **sp_01 6** at **P+0x40..** (the block's point), words e+0xfe8.., +0x3c 0xffff (tail call `0x1096bc4`).
  - **Phase 3:** at the end, vt+0x3dc.
  - I: the landing test (674 x size) implies the 900 test whenever size <= 1.335. The new row still carries the 900 test as `maxH`.
- **What issues (3, 4) (R + E): `0x1095114(e)`.** It has 8 call sites (0x1095084 / 0x1095098 / 0x1095520 / 0x109557c / 0x10959bc / 0x1095a24 / 0x1095c3c / 0x1095c74). Its logic:
  - It requires e+0x7420.
  - Query 1: `0xa6c48(e, 0, 0x400, 0x3000, 4)`.
  - If query 1 finds a point: `0xa76f4` (distance) -> e+0xcaf8, the index -> e+0xcafc, then `0xa6c1c(e, 0, 0x8000000, 4)`. If that returns -1: **(3, 3)** when point y - his y > 600.0 (`0x1095240`), else **(3, 2)**. If it returns anything else: no change.
  - If query 1 finds none: query 2, `0xa6c48(e, 0, 0x10000, 0x3000, 4)`. Found: e+0xcafc, then **(3, 4)** through vt+0x3d0 (`0x1095224`). None: no change.
  - E: `gapD\cen3iss.py 0,1,2 0x20` answers the queries in sequence (query 1 = -1, then query 2 = 0). (2, 0x00 / 0x09 / 0x0c / 0x0d / 0x0e), phases 1 and 2, then change to (3, 4) @0x1095228. With query 1 found and `0xa6c1c` = -1 they change to (3, 2).
  - Those status-2 actions are command-table actions (emcvar v0: 2:0x00 / 0x09 / 0x0c / 0x0e; g12 s0 also issues (2, 0xe)).
  - The points are the stage's area points (`0xa6c48`, the same query as rom-map row `0xd25e14`). The viewer has no list of them.
  - trgen answers every stub with one constant (0 = "found index 0"). That gives `0xa6c1c` != -1 and so no change, which is why the earlier walk never reached status 3.
- **(3, 0) `0x1096130..0x10962a4`, (13, 0) `0x109d840..0x109d9b8`, (13, 1) `0x109ddc0..0x109df30` (R).** At L1 M1's end:
  - phase += 1, lift `0xbc984`, **L1 M2 (0x102)**;
  - the block += its yaw-turned offset x size, P+0x50 = 0xe001, P+0x342 = 1;
  - **sp_01 11** at **e+0x40..** (the unit's point, read before the block's move reaches it), words e+0xfe8.., +0x3c 0xffff.
  - (13, 1) reaches L1 M1 after L3 M3 -> L0 M11 -> L0 M12.
  - sp_01 11: ef 0 = (0, 500), u 500, hit 7.
- **What issues (3, 0): NOT READ. This is the open read.**
  - The only issuer found is cmdtbl **g1 s43** (`6f 00 00 | 6f 01 01 | 00 01 03 | 6f 02 | 6f ff | 00 02 65 | 00 03 00 | ff`).
  - No `14 2b` / `20 2b` op exists in any group. The table's one `9e` is `9e 00 00` (g0 s0). Streams g1 s36..39 / s46..59 are `a6 | ff`; op a6 runs the default handler `0x84650`, which does nothing. g1 s40..45 are called by no op.
  - The shared layer's computed g1 calls are the synthesized `14 NN ff` streams. **87 sites** in 0x8b404..0x97500 write `0x14, NN, 0xff..` to e+0xba34 and point group 2's cursor e+0x72f8 at it (e.g. `0x96d14..0x96d68`). `gapD\ba35.py`: no literal NN.
  - NN = `0xb4d9c(e, k, ..)` = byte `[e+0x7628] + 0x14 + k` (`0x6996d8`). e+0x7628 = record e+0xb5f6 of the resource `[G+0x2590]` (`0x70bac..0x70bd8`), loaded only when `0x5ba54(G) == 1`. Which record and NN that gives is NOT READ.
  - The spec's "(3, 0) / (3, 1) come from 0x1093018" is **WITHDRAWN**: 0x1093018 is **uEm085_00's** function. Its only callers are 0x108eb68 / 0x108ee14 in uEm085_00's band (emclasses 0x108b450..). Valstrax's (3, 1) / (3, 5) are g1 s44 / s45; (3, 6) follows (3, 1) at phase 2 (`0x109656c`).
- **(13, 0) / (13, 1): no caller.**
  - Nothing in his band (issuers8; controls found).
  - Nothing in the shared layer (75 calls).
  - No `00 0d nn` in his table (emc011: [] for both).
  - No script op 0xfe.
  - So the rom-map row "status 13 (13, n) issuers" (entered from outside the monster's code) holds for him.
- **Clips (docs/monsters.json em086_00):** L0 M34 0.65 s, M35 `_start` 0.4 / `_loop` 0.5, **M36 1.283**; L1 M1 2.217, **M2 0.383**, M5 `_loop`; L2 M70 / M71 / M72 / **M73 3.583**. All exist. psl-mask.js CLIP_ACTIONS already names `'2|Motion[73]'` (7, 0x33) and `'1|Motion[5]'` (3, 0) / (13, 0).

### 3. sp_01 9 (u 502): no maker

- **Census `gapD\id175.py 0x175`:** every `movw rX, #0x175` in all of main.text (21 sites), with its +4 / +8 stores.
  - Five lie outside his band (0x1d10c0, 0x2dd73c, 0x35d7d4, 0x44f9c4, 0x1304e18). None stores into a request's +4, so none is a create.
  - The one at 0x10a1e04 is the kill of 0x174 / 0x175 (`0x48b71c`, vt+0x158 `0x10a1ddc`).
- **In-band submits to 0x48b884 (`gapD\calls.py`): 15.** Their modes:

  | site | sp_01 mode |
  |---|---|
  | 0x109620c | 11 |
  | 0x1096b24 | 6 |
  | 0x1097bb4 | 13 |
  | 0x10980d8 (shared tail 0x1098170) | 12 |
  | 0x109908c | 3 |
  | 0x1099138 | 4 |
  | 0x1099280 | 1 |
  | 0x109932c | 2 |
  | 0x109a040 | 5 |
  | 0x109a434 | 8 |
  | 0x109a8cc | 7 |
  | 0x109b5b4 | 10 |
  | 0x109d920 | 11 |
  | 0x109de98 | 11 |
  | 0x10a2950 / 0x10a2a30 (sp_56 +0x150) | 14 if (sp_56 mode - 6) <u 6, else 0 |

  0x1098ebc is the sp_56 create (sl = 0x174).
- **Every mode is an immediate except the 0 / 14 pair.** No 9 appears.
- **Positive control:** the same census finds all 14 other modes.
- **The shared shell code makes no child:** no 0x48b884 call in 0x3f8000..0x3fd000 or 0x42c000..0x430000, around base01 / BASE56's methods. **Caveat:** those two ranges were chosen around the known methods, not derived.
- **Named refusal:** sp_01 9 (u 502) is in his files but no code creates it. I: mode 9 is mode 8's twin (hit 6, vec (-600, 0, 0)), an unused variant of (7, 0x31)'s blast.

---

## (b) JS for docs/render/shells.js (anchored on text: the live file's line numbers moved while I worked)

`gapD\patch086.py <src> <dst> [--named]` applies exactly this, keeping the file's CRLF line ends. `gapD\render\shells.js` is the result, built from the live file of 2026-10-20 22:05.

**A. In `function spawn086(...)`, directly after its line**
`    if (!own.ownerPos || !own.facing){ refuse('no owner position / facing'); continue; }`
(the 2nd of four such lines in the file; the one inside spawn086), insert:

```js
    // maxH: the block's +0x44 <= its ground +0x5b4 + maxH, else no shell ((3, 4)'s 0x1096ae0..0x1096b04: 900, unordered -> none)
    if (sp.maxH != null){
      if (own.ground == null){ refuse('no ground (input.ground or input.rock.floorY)'); continue; }
      if (!(own.ownerPos[1] <= f(own.ground + f(sp.maxH)))) continue;
    }
```

**B. In SHELL_DATA.em086_00.actions, directly after**
`    ...[0x34, 0x35].map(n => act086(7, n, '2', 'Motion[71]', [{ start: true, shell: 'shell01', mode: 7 }])),`
insert:

```js
    // 0x109b07c (7, 0x33), READ whole -- REACHED: 0x109a5b4's phase 6 ((7, 0x32 / 0x34 / 0x35) alike: P+0x1bc = tune float 0x28 (150)
    // run out, 0x7206c) with e+0x7420 set -> vt+0x3d0(e, 7, 0x33) (0x109acb4..0x109acd4); e+0x7420 clear -> vt+0x3e0. Phase 0 motion
    // 0xffff, P+0x1bc = tune 0x29 (60); phase 1 the block to e+0xcad0.. / words e+0xcac0.. at the run-out, L1 M5 (0x105); phase 2 the
    // fall, his +0x44 <= the block +0x1d4 + 857 -> the block on the +0x1d0 point, posture 0, L2 M73 (0x249); phase 3 at tune float 0x2a
    // (2.0) of L2 M73 (0xb0974) sp_01 10 at his +0x40 with his words, +0x3c = P+0xb0a (0x109b58c..0x109b648): u 140 by the 0x20 switch
    act086(7, 0x33, '2', 'Motion[73]', [{ frame: 2, shell: 'shell01', mode: 10 }]),
    // 0x109699c (3, 4), READ whole -- REACHED: (2, 0x00 / 0x09 / 0x0c / 0x0d / 0x0e) phases 1 / 2 call 0x1095114: e+0x7420 set, the area
    // point query 0xa6c48(e, 0, 0x400, 0x3000, 4) finds none and 0xa6c48(e, 0, 0x10000, 0x3000, 4) finds one -> vt+0x3d0(e, 3, 4)
    // (0x1095224; the stage's points decide, the viewer has no list of them). Phase 0 L0 M34 (0x222); phase 1 at its end L0 M35 (0x223);
    // phase 2 landed (0xbf52c(e, 674.0)) and L0 M35 f20 (0xb0968 mode 1) -> posture 0, L0 M36 (0x224) and, the block's +0x44 <= +0x5b4
    // + 900, sp_01 6 at the block's +0x40 with his words, +0x3c 0xffff (0x1096ae0..0x1096bc4): c 30 (ef 0, list 1)
    act086(3, 0x04, '0', 'Motion[36]', [{ start: true, shell: 'shell01', mode: 6, maxH: 900.0 }]),
```

**C. Only with `--named`.** These rows have READ makers but no established caller ("open read is a stop"). Your call or Raven's; I would leave them out until g1 s43's caller is read.

```js
    // (3, 0) 0x1096130.. / (13, 0) 0x109d840.. / (13, 1) 0x109ddc0.., READ: L1 M1's end (13, 1: after L3 M3 / L0 M11 / M12 / L1 M1) ->
    // the lift 0xbc984, L1 M2 (0x102), the block moved, P+0x50 = 0xe001, sp_01 11 at his +0x40 with his words, +0x3c 0xffff: u 500 (ef 0).
    // ISSUERS NOT READ: (3, 0) only cmdtbl g1 s43 (no 0x14 / 0x20 / 0x9e names s43; the shared '14 NN ff' streams' NN = 0xb4d9c's
    // record byte -- which NN, NOT READ); status 13 from no code of his or the shared layer (rom-map 'status 13 (13, n) issuers')
    act086(3, 0x00, '1', 'Motion[2]', [{ start: true, shell: 'shell01', mode: 11 }]),
    ...[0x00, 0x01].map(n => act086(13, n, '1', 'Motion[2]', [{ start: true, shell: 'shell01', mode: 11 }])),
```

**Optional, your judgement:** (7, 0x32) runs (7, 0x34 / 0x35)'s handler, and psl-mask.js already lists it for L2 M70..M72. The row `...[0x34, 0x35].map(...)` could become `[0x32, 0x34, 0x35]`, but (7, 0x32) has no caller (named), so I left it as it is.

**Spec 9 text (elder-dragon-shells-spec.md), replacements for the shells agent:**
- For "(7, 0x32 / 0x33: NOT REACHED by the walk -- (7, 0x33) is (7, 0x32)'s vt+0x3d0 chain; its sp_01 10 named.)", use:
  "(7, 0x33) follows 0x109a5b4's phase 6 for (7, 0x32 / 0x34 / 0x35) alike (0x109acd4). 0x109b07c phase 3: L2 M73 f2, sp_01 10 (u 140). (7, 0x32) has no caller: named."
- For the "NOT BUILT, named: ... (3, 0) / (3, 4) / (13, 0) / (13, 1)'s sp_01 11 / 6 ..." clause, use:
  "(3, 4) BUILT: L0 M36 start, sp_01 6 (c 30) under the 900 height test; reached from (2, 0 / 9 / 0xc / 0xd / 0xe) through 0x1095114 when a stage area point answers. (3, 0) / (13, 0) / (13, 1) sp_01 11: makers READ, callers NOT READ (g1 s43; status 13). sp_01 9: no maker (census)."

---

## (c) rom-map rows (the "Elder Dragons -- the shells" table: addr | what | class | st | detail)

```
| `0x109a5b4` phase 6 `0x109ac48` (Valstrax, (7, 0x32 / 0x34 / 0x35) alike: the handler reads no e+0x73e1) | P+0x1bc = tune float 0x28 (150) at phase 5's end (`0x109ad64..0x109ad74`); `0x7206c` run out -> e+0xcb18 stopped, e+0x7420 set -> **vt+0x3d0(e, 7, 0x33)** (`0x109acb4..0x109acd4`, the bx 5 after the ldr), clear -> vt+0x3e0 (`0x109b030`) | uEm086_00 | R + E (gapD run33.py; own7420 0 control) | elder spec 9 |
| `0x109b07c` (Valstrax (7, 0x33)) | phase table `0x109b0f0`: 0 motion 0xffff, P+0x1bc = tune 0x29 (60); 1 to e+0xcad0.. / words e+0xcac0.. at the run-out, L1 M5 + id 1004, hit (0, 0x13, 9); 2 the fall to P+0x44 <= P+0x1d4 + 857 (`0x109b83c`) -> block = +0x1d0.., posture 0, **L2 M73**, hit (0, 0x14, 0x19); 3 at tune float 0x2a (2.0) `0xb0974` **sp_01 10** at e+0x40 with e+0xfe8.., +0x3c = P+0xb0a (`0x109b58c..0x109b648`), turns `0x76dd0`, end vt+0x3dc | uEm086_00 | R + E | elder spec 9; shells.js act086 (7, 0x33) |
| `0x109699c` (Valstrax (3, 4)) | phase table `0x10969d0`: 0 L0 M34 (0x222) b6, hit (0, 0x12, 0xb); 1 at its end lift + L0 M35, the flight to the point 0x1095114 found (e+0xcaf8 / +0xcafc); 2 `0x7a820`, landed `0xbf52c(e, 674.0)` and L0 M35 f20 (`0xb0968` mode 1) -> posture 0, **L0 M36** (0x224), hit (0, 0x12, 0x18), and P+0x44 <= P+0x5b4 + 900 (`0x1096dac`; else none) **sp_01 6** at P+0x40 with e+0xfe8.., +0x3c 0xffff (`0x1096ae0..0x1096bc4`); 3 end vt+0x3dc | uEm086_00 | R + E | elder spec 9; shells.js act086 (3, 4) maxH |
| `0x1095114(e)` (Valstrax; 8 sites `0x1095084..0x1095c74`, from (2, 0 / 9 / 0xc / 0xd / 0xe) phases 1 / 2) | e+0x7420 -> `0xa6c48(e, 0, 0x400, 0x3000, 4)`: found -> `0xa76f4` -> e+0xcaf8, idx e+0xcafc, `0xa6c1c(e, 0, 0x8000000, 4)` == -1 -> (3, 3) (point y - his y > 600, `0x1095240`) / (3, 2), else nothing; none -> `0xa6c48(e, 0, 0x10000, 0x3000, 4)` found -> (3, 4) (vt+0x3d0 `0x1095224`); returns 1 when it changed. The stage's points decide | uEm086_00 | R + E (gapD cen3iss.py, the queries answered in sequence) | elder spec 9 |
| `0x1096130..0x10962a4` / `0x109d840..0x109d9b8` / `0x109ddc0..0x109df30` (Valstrax (3, 0) / (13, 0) / (13, 1)) | at L1 M1's end: lift, **L1 M2** (0x102), the block += a turned offset x size, P+0x50 = 0xe001, **sp_01 11** (u 500) at e+0x40 with e+0xfe8.., +0x3c 0xffff. Issuers: (3, 0) cmdtbl g1 s43 only (called by no op; the shared `14 NN ff` streams' NN NOT READ); status 13 none | uEm086_00 | R (makers) / NR (issuers) | elder spec 9 |
| `0x109f670` (Valstrax main `0x109f650`'s status table) / `0x109f7c8` (vt+0x1fc) | statuses 0 `0x10942c0`, 1 `0x1094bb0`, 2 `0x1095cf0`, 3 `0x10971dc`, 7 `0x109bbcc`, 10 `0x109c3b4`, 11 `0x109f6dc` (scripts), 12 `0x109f718`, 13 `0x109f734` (n 0 `0x109d6e8`), 17 `0xaf4dc`, the rest `0xca05c`; vt+0x1fc: (0, 0) -> (1, 0) with P+0x1bb, (2, 0) -> (2, 0xd) when `0x816e8` -- nothing else | uEm086_00 | R | elder spec 9 |
| Valstrax sp_01 0x175 creates -- the census (gapD id175.py / calls.py) | 15 in-band submits to `0x48b884`; sp_01 modes 11 `0x109620c`, 6 `0x1096b24`, 13 `0x1097bb4`, 12 `0x10980d8`, 3 / 4 / 1 / 2 `0x109908c..0x109932c`, 5 `0x109a040`, 8 `0x109a434`, 7 `0x109a8cc`, 10 `0x109b5b4`, 11 `0x109d920` / `0x109de98`, 0 / 14 `0x10a2950` / `0x10a2a30`; no other `movw #0x175` in main.text stores a request id. **Mode 9 (u 502): no maker** (control: the other 14 found) | uEm086_00 | R (negative, controlled) | elder spec 9 |
| `0x96d14..0x96d68` (and 86 more, `0x8b404..0x97500`) / `0xb4d9c` / `0x6996d8` / `0x70bac..0x70bd8` | the shared layer's COMPUTED g1 calls: a synthesized stream `14 NN ff` at e+0xba34 made group 2's cursor (e+0x72fc = 2, e+0x72f8 = e+0xba34); NN = `0xb4d9c(e, k, ..)` = byte [[e+0x7628] + 0x14 + k]; e+0x7628 = record e+0xb5f6 of the resource [G+0x2590] (only when `0x5ba54(G)` == 1). Which NN a monster gets: NOT READ -- the only route left to a g1 stream no op names (Valstrax g1 s40..45) | shared | R (the mechanism) / NR (the values) | gapD RESULT |
| tooling: `<scratchpad>\gapD\` (gapD helper, 2026-10-20) | `issuers8.py` (issuers.py with the vt+0x3d0 bx looked for 1..8 after the ldr: +3 in Valstrax's band), `run33.py` / `run33b.py` (trgen phases 0..7), `cen3_13.py` (trgen census, creates / changes / motions), `cen3iss.py` (trgen with SEQUENCED stub answers -- `Seq`, for queries asked twice), `id175.py` (every movw #ID with its request stores), `calls.py`, `fescan.py` (script op 0xfe args), `ba35.py` (the `14 NN ff` sites), `patch086.py` / `replay086.mjs` | controls in each row above | trgen answers each stub with ONE value: a function asked twice (0xa6c48) never takes its second arm -- use cen3iss's Seq |
```

**Traps (append to the numbered list):**
- **trgen's stubs give one answer per address.** Code that calls the same query twice and branches on the second answer (`0x1095114`: `0xa6c48` x 2) never takes that arm. Answer the calls in sequence (`gapD\cen3iss.py` `Seq`).
- **chainx.py walks phases 0..5 only.** A follow in phase 6+ (Valstrax's comet, `0x109ac48`) is invisible to it.

**WITHDRAWN table (claim | why wrong | correction):**

```
| elder-dragon-shells-spec.md 9 / chainx (shells lane, 2026-10-19): "(7, 0x32 / 0x33: NOT REACHED by the walk -- (7, 0x33) is (7, 0x32)'s vt+0x3d0 chain; its sp_01 10 named" | chainx walks phases 0..5 (`range(6)`); the follow is 0x109a5b4's PHASE 6, and that handler serves (7, 0x32 / 0x34 / 0x35) without reading the number; issuers.py looked 4 instructions for the bx (it is the 5th) | (7, 0x33) follows (7, 0x34 / 0x35) (cmdtbl g1 s29) at phase 6's run-out (`0x109acd4`); 0x109b07c phase 3 makes sp_01 10 (u 140) at L2 M73 f2. Only (7, 0x32) has no caller |
| elder-dragon-shells-spec.md 9 (shells lane, 2026-10-19): "(3, 0) / (3, 1) come from 0x1093018 (below his band)" | 0x1093018 is uEm085_00's: its callers `0x108eb68` / `0x108ee14` lie in uEm085_00's band (emclasses 0x108b450..); the same-shaped helper of HIS is `0x1095114` | Valstrax's (3, 0) / (3, 1) / (3, 5): cmdtbl g1 s43 / s44 / s45 (called by no op: NR); (3, 2 / 3 / 4) from `0x1095114`; (3, 6) follows (3, 1) (`0x109656c`) |
| elder-dragon-shells-spec.md 9 (shells lane, 2026-10-19): "the walk reaches no status 3 or 13 action ... (3, 4) from 0x1095114 (vt+0x3d0)" (status 3 / 13 read as reactions) | trgen answers 0xa6c48 with one constant (found), so `0xa6c1c` != -1 and 0x1095114 never changed the action | (2, 0 / 9 / 0xc / 0xd / 0xe) phases 1 / 2 reach (3, 4) (and (3, 2) / (3, 3)) when the stage's area-point query answers (gapD cen3iss.py). Status 3 here is the area-point flights (I), not a reaction. Status 13: still no caller |
```

---

## (d) The replay: `gapD\replay086.mjs` (`node replay086.mjs`; exit 1 on a failure)

- It imports `gapD\render\shells.js` (the patched copy, built with `--named`) and, as the control, `gapD\render\shells.orig.js` (the live file copied unchanged). Their own imports (beam-*.js) are copied beside them.
- For each case it steps the clip frame by frame with the action named in `input.rock.variant`, and prints every shell made and every record started (the shell's init start and `out.started`). Output: `gapD\replay086.out`. **all passed**.

```
PASS (7, 0x33) L2 M73 f2 -> sp_01 10, u 140
   patched: made [{"frame":3,"shell":"shell01","mode":10,...}] starts [{"frame":3,"shell":"shell01 10","list":0,"key":140}]
   original: made 0, starts 0
PASS (3, 4) L0 M36 start -> sp_01 6, c 30
   patched: made [{"frame":0,"shell":"shell01","mode":6,...}] starts [{"frame":0,"shell":"shell01 6","list":1,"key":30,"at":"init"}]
   original: made 0, starts 0
PASS CONTROL (3, 4) 901 over the ground -> no shell (0x1096b04)
PASS CONTROL (3, 4) at 900 over the ground -> the shell (<=)
PASS CONTROL (3, 4) no ground -> refused by name
PASS (named rows) (3, 0) L1 M2 start -> sp_01 11, u 500      (starts list 0 key 500 at init)
PASS (named rows) (13, 1) L1 M2 start -> sp_01 11, u 500
PASS REGRESSION (7, 0x34) L2 M71 start -> sp_01 7, u 500 (unchanged row; original the same)
all passed
```

- The f2 row is made at step 3. That is the module's frame-test convention (pass001: the test reads the previous advance), as for the other f-rows.
- u 140 starts in the step the shell is made (mode 10's 0x20 switch). Mode 7's u 500 starts at step 23, as before.
- Not run: emu_fb.py, a viewer or a soak. Comparing the ROM's own flight of sp_01 6 / 10 / 11 with the module (like dev/shells-valstrax-check.mjs's cases) is the shells agent's check. Suggested cases:
  - (7, 0x33): `steps: [{fn:'109f650', phase:3, frame:2.0}]`, owner_bytes 0x73e0 [7, 0x33];
  - (3, 4): phase 2 with ended / landed answered, owner_bytes [3, 4], ground 0.
