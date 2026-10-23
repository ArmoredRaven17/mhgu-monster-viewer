# Gravios (em005_00) — effects spec: the PSL enable word, the gas requests, the cut tail, the 0x9b76e4 refusal

Research agent for the Viewer agent, 2026-10-16 (dev/flying-wyverns-effects-survey.md "Gravios" and "What closing each needs"
items 1-2; task board "Khezu + Gravios ... + Gravios tail"). Static ROM reading plus unicorn controls and one headless soak; no
recorder, no lift, no `--apply`, no docs/ edit. `R` = READ (the consuming instruction read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: the survey (Gravios: 61 bindings outside the file mask, 154 file-mask / 215 whole-block; u 271 / 290 / 301 /
390 not exported; L4 M59 / M60 refused at `0x9b76e4`), rom-map.md ("THE PSL ENABLE MASK": `0xd2e0ec` / `0xd2e35c` "body NOT READ";
"The PSL enable word per class": uEm004_00 "em 5 tail UNREAD"; the uEm004_00 section — `0xd22e8c` ctl+0x24, the beam modes; rows
`0x9b76d8` / `0x9b76e4` and `0xc03cd0` (the refusal, CLOSED 2026-10-14); `0x169bb80`; "Barioth / Basarios / Ukanlos" `0xd22d14`,
`0xc22f8`, the option descriptors; trap 50), docs/render/psl-mask.js whole (Basarios's em004 is this method's other half),
docs/render/tail-option.js (CUT_TAIL em005_00), motion-states.js (SHELL_PARTS, Gravios's break rows), dev/beams/em005_00.md (the
head bit), dev/em004-fireball-actions.md (the gas arms), C:\MHGU-RE\offline\decode\notes\states-em005_00.md (parts, .dtp rows,
the part pass), the task board (u 241 rows; "Khezu + Gravios"). Scratch: `<scratchpad>\kg\` (emu_kg.py, jscheck_kg.py,
classify.py, kprobe.py, `g_probe.txt`, the plans, `cls_em005.txt`, `em004band.txt`).

## 1. The word — uEm004_00 vt+0x13c = `0xd2e0ec`, its em-5 tail `0xd2e35c` — R, emulated

Vtable **`0x1797c8c`** (Basarios and Gravios, one class; `+0x13c` = `0xd2e0ec`, `+0xf0` = `0xca52c`). The head (`0xd2e0ec..`) calls
`0xca170`, reads the em byte **`e+0xb5f4`** (`0xd2e0fc`): 5 -> `pop` and `b 0xd2e35c` (`0xd2e290` / `0xd2e294`); 4 -> Basarios's arms
(psl-mask.js em004, unchanged); else return. The em-5 tail extent **`0xd2e35c..0xd2e524`**: one `push {r4-r7, fp, lr}`, every exit
the `pop` at `0xd2e524` (`popeq` `0xd2e444`); literals `0xd2e528` / `0xd2e52c` (the rank chain's GOT, as Basarios's); `0xd2e530` is
the next function (a `b 0xca048` thunk). Callees: `0x9d36c` (part break level = `[P+0x3bc + 12 part]`, read: `0x9d36c..0x9d380`),
`0x3a8430` (the quest-rank byte, rom-map), `0x81d6c` (sunk), nothing else; the base `0xca170` from the head. Every write through
`ldr rX,[r4,rX]!` (r4 := e+0x13f4) then `str [r4]` (trap 58). No variant read.

    0xd2e364  k = motion - 0x203
    k <= 0x1e and bit k of 0x38000003  -> L2 M3, L2 M4, L2 M30, L2 M31, L2 M32 (the gas / the beam's end):
        status != 7 -> nothing;  n = e+0x73e1
        n 0x0a, 0x32, 0x3c (0xd2e468): r5 = 0x9d36c(e, 0) (part 0, THE BACK); t = .dtp +0x64 byte 1 (rank <= 4) or byte 2
                                        (rank > 4); r5 >= t ? 0x180000 (bits 19-20) : 0x18000 (bits 15-16)
        n 0x07, 0x3b       (0xd2e4b8): the same test -> 0x600000 (bits 21-22) : 0x60000 (bits 17-18)
        any other n: nothing
    k <= 0x1e and bit k of 0x40200000, or motion == 0x43b -> L2 M24, L2 M33, L4 M59 (the beams):
        status 7 and n in {0x0e, 0x11, 0x34}: b = [[e+0xcac0]+0x24]: b & 4 -> 0xe0000000 (bits 29-31);
        else b & 2 -> 0x3800000 (bits 23-25); else nothing (`popeq` 0xd2e444); other actions nothing
    motion == 7 (L0 M7): 0x81d6c(e) ? nothing : 0x18000000 (bits 27-28)        ; Basarios's arm, the same code shape
    every other motion: the base alone

**`ctl+0x24`** is rebuilt at EVERY action start for em 5 by the on-action-start hook vt+0x204 `0xd22a14` (`0xd22e8c..0xd22fac`, read
here again whole): cleared, em 4 returns, then bit 0 = `0x9d36c(e, 5)` >= .dtp byte 0xd / 0xe (the head, row 3), **bit 1 =
`0x9d36c(e, 6)` >= byte 9 / 0xa (the belly, row 2)**, **bit 2 = `0x9d36c(e, 0)` >= byte 1 / 2 (the back, row 0)**, each threshold
rank-chosen by `0x3a8430` <= 4 (R). So bit 2 and the gas arm's direct read are ONE test (part 0 against row 0); the beam arm's
is latched at the action's start, the gas arm's at the motion's — the same thing for a viewer play.

The rows (`em005_00_dtbparts.dtp` +0x64, dtp.py 237 / 237 EXACT, and emu_kg's loader: `{part, low, high, group}`): row 0 = (0, 1, 2,
2) — the back breaks at level 1 below G rank, 2 at G; row 2 = (6, 2, 2, 3) — the belly's second stage, level 2 at both ranks (R,
data). The part pass draws those exact tests (states-em005_00.md §2.2, theirs): `breakLevel(0) < thr(rows[1], rows[2]) ? set 17 :
set 18` (`0xd2431c`), `breakLevel(6) < thr(rows[9], rows[0xa]) ? set 11 : set 12` (`0xd2422c`). monsters.json em005_00 groups:
**set 18 = {16 off, 17 on}**, **set 12 = {10 off, 11 on}** — the only sets drawing groups 17 / 11 (R, the file). So:

* **`state.backBroken`** = group 17 drawn (the back's broken mesh);  **`state.bellyBroken`** = group 11 drawn (the belly's second
  stage). Via SHELL_PARTS, as Gravios's `headBroken: 3` already is: `SHELL_PARTS.em005_00 = { headBroken: 3, backBroken: 17,
  bellyBroken: 11 }`, and index.html passes `partsIn.backBroken` / `partsIn.bellyBroken` in the pslMask state. (That the rest
  state reads both groups false, as group 3 does: I — the viewer's rest draw, not the ROM.)

**Emulated** (`<scratchpad>\kg\emu_kg.py`, controls reproduced first — Deviljho `0x381ff` / `0x3f03f` / `0xe3f`, Tigrex `0x1ff` /
`0x703f`, Basarios L2 M3 (7, 0xa) `0x181ff`, (7, 0x15) enraged `0x600e3f`, L2 M27 (7, 0xd) `0x60001ff`, L0 M7 surface / sunk
`0x180001ff` / `0x1ff`):

| case (em 5, real .dtp) | word |
|---|---|
| L2 M3 (7, 0xa) back level 0; level 1 rank 0; level 1 rank 5; level 2 rank 5 | `0x181ff`; `0x1801ff`; `0x181ff`; `0x1801ff` |
| L2 M3 (7, 7); (7, 0x3b) level 1 rank 0; (7, 0x15) | `0x601ff`; `0x6001ff`; `0x1ff` |
| L2 M30 (7, 0x32); L2 M32 (7, 0x3c) enraged | `0x181ff`; `0x18e3f` |
| L2 M24 (7, 0x11) ctl24 0 / 2 / 6; L2 M33 (7, 0xe) ctl24 4 tired | `0x1ff` / `0x38001ff` / `0xe00001ff`; `0xe000703f` |
| L4 M59 (7, 0x34) ctl24 3; (7, 0x38) ctl24 6; (1, 0x34) ctl24 6; (7, 0x11) ctl24 4 | `0x38001ff`; `0x1ff`; `0x1ff`; `0xe00001ff` |
| L0 M7 surface; posture 4, P+0x5c -2000, MoguriBaseOfs -2000 | `0x180001ff`; `0x1ff` |
| L2 M26 (partner of M24) (7, 0x11) ctl24 4 | `0x1ff` |

The transcription below against the ROM (`jscheck_kg.py`): 23 motions x statuses 1 / 2 / 6 / 7 / 13 x numbers (0..0x47 for 7) x
calm / enraged / tired x back level 0 / 1 / 2 x belly 0 / 2 x rank 0 / 5 (ctl+0x24 built from the levels as `0xd22e8c` builds it)
x three posture / burrow cases on L0 M7 = **82800 runs, 0 mismatches** (24 distinct words).

Negative with control: uEm004_00's band `0xd22438..0xd31b64` has exactly six `#0x13f4` immediates, `0xd2e308` / `0xd2e338` (the
em-4 half) and `0xd2e3f0` / `0xd2e448` / `0xd2e504` / `0xd2e514` (this tail) — the scan finds all of the method's own stores (its
positive control) and nothing else.

**For psl-mask.js CLASS_MASK:**

    // GRAVIOS (em005_00), uEm004_00's em-5 tail 0xd2e35c of vtable +0x13c = 0xd2e0ec (the head reads e+0xb5f4: 5 -> here, 4 ->
    // Basarios's em004 above), READ whole (0xd2e35c..0xd2e524) and emulated -- 82800 runs against the ROM, 0 mismatches
    // (dev/em005_00-effects-spec.md 1). After 0xca170:
    //   * L2 M3 / M4 / M30 / M31 / M32 (0x38000003 over motion - 0x203), status 7: n 0x0a / 0x32 / 0x3c -> bits 15-16, or 19-20
    //     with THE BACK broken (0x9d36c(e, 0) >= .dtp row 0's rank-chosen level: 1 below G, 2 at G); n 0x07 / 0x3b -> bits 17-18,
    //     or 21-22 broken: u 260 + u 261 / u 290 + u 291 intact, u 271 + u 261 / u 301 + u 291 broken; on the beam's end
    //     L2 M30-32 (7, 0x32) u 260 + u 380 / u 270 + u 390;
    //   * L2 M24 / L2 M33 / L4 M59 (0x40200000, 0x43b), status 7, n 0x0e / 0x11 / 0x34: ctl+0x24 (the action start's part bits,
    //     0xd22e8c) back broken -> bits 29-31 (u 270 / 261 / 390), else belly stage 2 broken -> bits 23-25 (u 260 / 261 / 380),
    //     else nothing;
    //   * L0 M7: bits 27-28 unless 0x81d6c (sunk) -- Basarios's arm;  every other motion: the base alone.
    // state.backBroken / state.bellyBroken: motion-states.js SHELL_PARTS em005_00 (groups 17 / 11, sets 18 / 12).
    const EM005_GAS = new Set([0x203, 0x204, 0x21e, 0x21f, 0x220]);
    const EM005_BEAM = new Set([0x218, 0x221, 0x43b]);
    function em005_00(motion, action, state){
      const n = action && action[0] === 7 ? action[1] : -1;
      if (EM005_GAS.has(motion)){
        if (n === 0x0a || n === 0x32 || n === 0x3c) return state.backBroken ? 0x180000 : 0x18000;
        if (n === 0x07 || n === 0x3b) return state.backBroken ? 0x600000 : 0x60000;
        return 0;
      }
      if (EM005_BEAM.has(motion)){
        if (n !== 0x0e && n !== 0x11 && n !== 0x34) return 0;
        return state.backBroken ? 0xe0000000 : state.bellyBroken ? 0x3800000 : 0;
      }
      if (motion === 0x007) return state.sunk ? 0 : 0x18000000;   // 0x81d6c; the viewer plays it from the surface
      return 0;
    }
    // CLASS_MASK: em005_00;  PSL_MASK_MONSTERS: 'em005_00'   (pslMask's `>>> 0` keeps bit 31)

Inputs: **`action`** (CLIP_ACTIONS §3; `null` = the base alone — no gas / beam-vent bits at all on these clips); **`state.backBroken`
/ `state.bellyBroken`** (new SHELL_PARTS keys, above); **`state.sunk`** (the stand-in `false`; Gravios's MoguriBaseOfs is -2000, `.dtb
+0xa8` file +0x22+16 — controls em007_00 -1100 / em003_00 0 / em045_00 -2000 reproduce the rom-map row; R file); rage / tired from
the toggles. The rank enters only through the back's threshold, which the parts shown already carry.

## 2. What the word changes — whole-block plan (154 file-mask -> 215 whole)

`planrows.py em005_00 [--whole]` and every binding through the ROM word per play (`classify.py` -> `cls_em005.txt`; parts intact /
belly / back / both at G rank). 61 out-of-mask (the survey's) = 9 always + 52 by state, play or part; 45 in-mask bindings change (every file-mask bit >= 6 but L0 M7 b27 / b28, which stay on).

**Turned ON, always** (bits 0-5 outside the file mask — 9): c 120 (`cm202_022`) L2 M12 b0; u 380 L2 M19 b0; u 232 L2 M31 / M32 /
M33 / M34 / M35 b0; u 261 L2 M32 b1; u 230 L2 M54 b2.

**Turned ON by state** (the base groups, outside the mask): u 251 b13 tired on L2 M24 / M25 / M26 / M27 / M28 / M29 / M46 / M50 /
M55; L2 M46 b9 enraged / b12 tired (u 230); L2 M50 b6-8 calm (u 240 / 241 / 242), b9-11 enraged (240 / 241 / 242), b12-14 tired (u 230
/ 251 / 242); L2 M55 b6 / b9 / b12 (u 230).

**Turned ON by the gas action and the back** (L2 M3, outside the mask):

| binding | record | game |
|---|---|---|
| L2 M3 b15 f151-234 | u 260 (`em004_00_002`) | (7, 0xa), back intact |
| L2 M3 b17 f151-234 | **u 290 (not exported)** | (7, 7), back intact |
| L2 M3 b19 f151-234 | **u 271 (not exported)** | (7, 0xa), back broken |
| L2 M3 b21 f151-234 | **u 301 (not exported)** | (7, 7), back broken |

and the in-mask charge halves L2 M3 b16 u 261 / b18 u 291 (intact) / b20 u 261 / b22 u 291 (broken) — today all four fire on every
play; the game fires one, and none on (7, 5) / (7, 0xf) / (7, 0x10) / (7, 0x15) (Gravios's other four L2 M3 actions).

**The beam's end, L2 M30 / M31 / M32 under (7, 0x32)** (M31 / M32 the blend partners `0xb03f8` sets with it, `0xd29648..0xd2969c`):
b15 u 260 + b16 u 380 back intact; b19 u 270 + b20 **u 390 (not exported)** back broken (M30 b15 / b19 in the mask — today both
fire every play; M31 / M32 all outside).

**The beam vents, L2 M24 (7, 0x11) / L2 M33 (7, 0x0e) / L4 M59 (7, 0x34)** (all outside the mask): back broken -> b29 u 270, b30 u 261
(M24 / M59) , b31 **u 390** (M24 / M59; M33 b29 u 270 / b30 u 390); belly broken, back intact -> b23 u 260, b24 u 261 (M33: u 380),
b25 u 380; neither -> nothing. Not on the tired forms (7, 0x0c) / (7, 0x0d) / (7, 0x38).

**Gated in the mask, by state, through the play's tired form**: L2 M24 b6 / b7 calm, b9 / b10 enraged (7, 0x11), b12 tired = (7, 0xc)
(u 230 / u 242); L4 M59 b6-8 calm / b9-11 enraged (7, 0x34), b12-14 tired (7, 0x38) (u 240 / 241 / 242, u 230 / 251 / 232); L2 M25-29
/ L4 M60 / L2 M46 the base triples.

**Named but never enabled:** none (bits 29-31 / 23-25 are reachable through the parts).

**Records to export with `--apply`: u 271, u 290, u 301, u 390** (SEQUENCE, `em004_00_002` — the survey's four; every one reachable).

## 3. Which plays reach the keyed clips — CLIP_ACTIONS

Sources: the action main under unicorn (kprobe.py, em byte 5, statuses 0 / 1 / 2 / 3 / 6 / 7, postures 0 / 4: `g_probe.txt`; first
setMotion sites by lr), the status-7 stubs into `0xd28bb4` (r1 / r2: (7, 0xd) `0xd2cdf8` (0, 0), (7, 0xe) `0xd2ce04` (1, 0), (7, 0x32)
`0xd2cf78` (1, 1)) and its end (`0xd295d0..0xd2969c`: r5 = r2 — 0 -> L2 M33 + M34 / M35, 1 -> L2 M30 + M31 / M32), the action main's
status table `0xd2dfd0` (status 13 n 1 -> `0xd2dcc0`: L2 M27 + M28 then L2 M33 + M34 at `0xd2dd78`), em005_00_cmdtbl.emc (emcfind;
streams identical to Basarios's g1 s10 / s11 / s12 / s21 / s23 / s40 / s46 / s47; op 0x24 = the tired-calm arm `0x81634`).

* **L2 M3** then **L2 M4** (`0xd2855c` phase 0 `0xd285c4` / phase 2 `0xd286a0`): (7, 0xa) g1 s12 / s21 / s47; (7, 7) g1 s11; (7, 5) /
  (7, 0xf) and (7, 0x15) / (7, 0x10) g1 s10 / s46 (op 0x24: tired-calm takes the second of each pair). (7, 0x3b) / (7, 0x3c) issued by
  no stream (R, em004-fireball-actions.md §5 and emcfind).
* **L2 M30** (+ M31 / M32): (7, 0x32), g1 s23 / s24 / s68 / s69 (s23's op 0x24 issues (7, 0xd) when tired-calm — that play ends on
  L2 M33). **L2 M33** (+ M34 / M35): (7, 0xe) (ten streams), its tired twin (7, 0xd) (g1 s22 / s23), and (13, 1).
* **L2 M24** (+ M25 / M26): (7, 0x11), tired twin (7, 0xc) (g1 s23 / s68). **L4 M59**: (7, 0x34), tired twin (7, 0x38) (g1 s40).

    // GRAVIOS (dev/em005_00-effects-spec.md 3). L2 M3 / M4: the gas plays, Basarios's four streams (g1 s10..s12 / s46 / s47);
    // his word lights the clouds for (7, 0xa) / (7, 7) only, by the back. L2 M30-32: the beam's end on (7, 0x32); L2 M33-35 on
    // (7, 0xe) or its tired twin (7, 0xd); L2 M24 (7, 0x11) / (7, 0xc); L4 M59 (7, 0x34) / (7, 0x38) -- op 0x24's tired arm.
    em005_00: {
      '2|Motion[3]':  [{ action: [7, 0x0a] }, { action: [7, 0x07] }, { action: [7, 0x05], tired: [7, 0x0f] },
                       { action: [7, 0x15], tired: [7, 0x10] }],
      '2|Motion[4]':  [{ action: [7, 0x0a] }, { action: [7, 0x07] }, { action: [7, 0x05], tired: [7, 0x0f] },
                       { action: [7, 0x15], tired: [7, 0x10] }],
      '2|Motion[30]': [{ action: [7, 0x32] }],
      '2|Motion[31]': [{ action: [7, 0x32] }],
      '2|Motion[32]': [{ action: [7, 0x32] }],
      '2|Motion[33]': [{ action: [7, 0x0e], tired: [7, 0x0d] }],
      '2|Motion[24]': [{ action: [7, 0x11], tired: [7, 0x0c] }],
      '4|Motion[59]': [{ action: [7, 0x34], tired: [7, 0x38] }],
    },

(L0 M7 needs no entry: the stand-in `sunk = false` is the surface word; which of his L0 M7 plays — (6, 3) start 100 `0xd27bbc`,
(7, 0x18) / (7, 0x19) (op 0x1c calm / enraged), (7, 0x1a) / (7, 0x1d) start 102 — begins sunk: NR.)

**THE CLASS'S OWN GAS REQUEST — a gap the survey could not see (it lists PSL and exports only).** The six gas actions run
`0xd2855c` for both monsters; phase 1 waits for frame **216.0** (`vldr` literal `0xd288b4`, `0xb0974` at `0xd285e4`) and the selector
arm (table `0xd28624`, sel = mode - 1) asks vt+0x1d0 `0xd2e0bc` for id 1001..1008 -> table `0x169bb80` -> a key, `0x6feb8(e, 2, key)`
— **no em test** in the arms (only sel 2's hit id) nor in `0xd2e0bc` (R, both read). Gravios's `em005_00u` UNIQUE holds keys **0, 10,
30, 40** (and 130 / 131 / 150 / 900 ... — proof.parse of the .pel), all four `em004_00_002`; Basarios's holds 0 / 30 / 60 / 70 / 90 /
100. So:

    // GRAVIOS, L2 Motion[3]: the gas actions' f216 class request (0xd2855c, the same code as Basarios's) -- (7, 0x0a) id 1001 ->
    // u 0, (7, 0x07) id 1002 -> u 30, from HIS pel (em005_00u UNIQUE, em004_00_002). (7, 5) / (7, 0xf) / (7, 0x15) / (7, 0x10) ask
    // for u 60 / 70 / 90 / 100, which his pel does not hold (what 0x6feb8 does with a missing key: NR -- nothing is drawn, I).
    // ACTION_EFFECTS:
    em005_00: {
      '2|Motion[3]': { frame: 216, by: {
        '7:0x0a': ['em005_00u', 0, 'UNIQUE'],   '7:0x07': ['em005_00u', 30, 'UNIQUE'],
      } },
    },

**Records to export for it: u 0, u 30** (UNIQUE). u 10 / u 40 (ids 1007 / 1008, (7, 0x3c) / (7, 0x3b)) stay never-requested (no
issuer, em004-fireball-actions.md §5). Whether L2 M3's clip in Gravios's arc runs to frame 216 (Basarios's `em005_00_2` slot 3 is 235
frames, loop 222 — the same file, em004-fireball-actions.md §3): R (theirs).

## 4. The cut tail — CUT_TAIL.em005_00 — R (no change)

`{ piece: 'em005_00_tail', joint: 143, above: 20, landing: ['em005_00u', 905] }` is right, now on the ROM rather than on u 900:

* **joint 143**: the sever is uEm004_00's on-action-start hook (vt+0x204 `0xd22a14`) arm (10, 0x72) with part 7 (`0x9e8d8` == 7,
  `0xd22cf0..0xd22d04`) -> **`0xc2274(e, 0, 0, 0x8f)`** (`mov r3,#0x8f` `0xd22d14`, `bl` `0xd22d20`) — no em test between the action
  switch and the call (the em test of this hook is after the switch, `0xd22ea0`), so Gravios and Basarios pass the same byte; `0xc22f8`
  stores it to option +0x1477, the drop joint (rom-map rows). 0x8f = 143 = u 900's joint too, which is why the old reading was not
  wrong in value (trap: withdrawn rows for Diablos / Barroth).
* **above 20, speed 1.0**: `em005_00_dtbparts.dtp` option rows `[+0x91]` = **0** (dtp.py, 237 / 237 bytes EXACT) -> the activation's
  default (`0x740e8..0x74218`, trap 50).
* **the piece**: option descriptor `[0x172ba68][113]` = `0x159aaf8`: word 1 = **0x8437**, word 2 -1, **+0xb4 = 0x77ed** (em001_00_option,
  the shared list); `0x159daa0[0x8437]` = {**0x6fd5ce61** = jamcrc(`enemy\em005\em005_00\mod\em005_00_tail`), 0x58a15856 rModel}
  (control: `[0x8413]` = 0x6e3343ff = jamcrc(`...em004_00_tail`), Basarios's row). `docs/models/monsters/em005_00_tail.glb` is staged
  and monsters.json carries it (`kind: 'tail'`). R.
* **landing u 905**: kind 1 -> id 5 (`0x703b8`) -> `0x159c7fc[5]` = 905; em005_00u UNIQUE holds 905, exported (`event`). R.

The comment in tail-option.js may say "the sever's 4th argument 0x8f at 0xd22d14" for the joint.

## 5. The 0x9b76e4 refusal (L4 M59 / M60) — CLOSED, verified

rom-map `0x9b76d8` / `0x9b76e4` and `0xc03cd0` (2026-10-14): the refusal was the viewer drawing an ENDED unit (u 241, state 3);
host.js drawFrame now draws only `(+0xc & 0x4807) == 0x4802`. Soaked today with the current tree: `node dev/effect-live-soak.mjs
em005_00 "L4 Motion[59]" "L4 Motion[60]" --viewer-inputs` -> **L4 M59 838 frames, 20 started, 2 beams (em005_00:10, f135); L4 M60 906
frames, 22 started; 0 refused** (18 s). Nothing left of the survey's item 2 for Gravios.

## 6. What to implement, in order

1. psl-mask.js: `EM005_GAS` / `EM005_BEAM` / `em005_00` (§1) into CLASS_MASK; `'em005_00'` into PSL_MASK_MONSTERS; CLIP_ACTIONS
   `em005_00` (§3); ACTION_EFFECTS `em005_00` (§3).
2. motion-states.js `SHELL_PARTS.em005_00 = { headBroken: 3, backBroken: 17, bellyBroken: 11 }`; index.html passes `backBroken:
   !!partsIn.backBroken, bellyBroken: !!partsIn.bellyBroken` in the pslMask state.
3. `add_effects.py em005_00 --apply` (CLIP_EFFECTS from the whole blocks; exports **u 271 / 290 / 301 / 390**) — and **u 0 / u 30**
   (UNIQUE) for the ACTION_EFFECTS row (if --apply does not take ACTION_EFFECTS records, export them as Basarios's u 0..100 were);
   `--record`, `--check`. Recorder slot — announce.
4. Soak `--viewer-inputs`; Raven verifies: on L2 M3 one gas per play — (7, 0xa) u 260 cloud + u 261 charge, (7, 7) u 290 + u 291,
   the other two plays no PSL gas; with the back broken (Back row at its last rung) u 271 / u 301 instead; u 0 / u 30 at f216; the
   beam vents on L2 M24 / M33 / L4 M59 only once the back or the belly's second stage is broken; tired forms without them.

NOT READ, by name: `0x6feb8` with a key the pel lacks (Gravios's (7, 5) / (7, 0xf) / (7, 0x15) / (7, 0x10) at f216); which L0 M7 play
starts sunk; the requester of u 150 (`em005_00_000`, UNIQUE — not one of the class's eight vt+0x1d0 sites, the band's only request
calls); (13, 1)'s issuer; what u 260 / 270 / 271 / 290 / 301 / 380 / 390 look like (all `em004_00_002`).

## Re-walk 2026-10-18 (Fanged-Wyvern effects agent): tracer diff, request census, word re-emulation

(6, 3) asks `0xa499c(e, 2)` (u 1400) on L0 M7 as Basarios does (`0xd27be4`, one class) -- em005_00u holds no key 1400, so nothing shows and no copy is made for him. His word re-emulated with the real .dtp +0x64 rows and part levels (jscheckpd.py LV=0,5,6: the gas arm's part 0 vs bytes 1 / 2, the ctl+0x24 latch's parts 5 / 6 / 0). L2 M31 / M32 are (7, 0x32)'s blend partners (r2 of 0xb03f8, 0xd29648..0xd2969c).

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **`0x6feb8` with a key the pel lacks -- READ: nothing is made.** The request reaches `0x326010` (through vt+0x138 `0x6fd8c` ->
  `0x53a7d8` -> `0x408bc`), which searches the UNIQUE array for the record whose halfword +0x50 is the key; none -> 0, the core is
  freed and the handle is 0. So Gravios's (7, 5) / (7, 0xf) / (7, 0x15) / (7, 0x10) requests at f216 (u 60 / 70 / 90 / 100) draw
  nothing, as the viewer shows (no record, no row). The I in section 2 is now R.
* Still open: u 150's requester (a shell-layer record: the shells lane); (13, 1) (status 13 is entered from outside the class --
  category a); which L0 M7 play begins sunk (category c, the cross-monster "Begins burrowed" toggle).
* **Begins Burrowed -- BUILT 2026-10-19** (CLASS_TOGGLES `burrowed`, working label, approved by Raven): on, every posture-4 play
  reads sunk (0x81d6c: posture 4 and P+0x5c below 0.9 x MoguriBaseOfs); off, only the entries that name sunk. Checked on
  Basarios's L0 M7 B (dev/checks/class-toggles.mjs).
