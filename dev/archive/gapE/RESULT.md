# Gap E — Ahtal-Ka (em088_00) web anchors, sub-states 2 / 3 (research helper, 2026-10-20)

Scope: shell60 (base60) sub-states 2 / 3 (the re-aim and throw from (7, 0x2c / 0x2f / 0x31 / 0x36), `0x4380e4`) and shell61
(base61) sub-states 2 / 3 (the orbit and dive from (7, 0x34), `0x43a374`). I edited no repo file. Everything here is under
`<scratchpad>\gapE\`.

Result: **both are transcribed and match the ROM bit for bit**. That covers 18 anchors in five plays: every move, every word,
every velocity and every effect start. u 301 (shell60 ef 7) and u 360 (shell61 ef 4) are now READ, where before they were
INFERRED.

Files:
- `emu60x.py`: the ROM harness. It is sh88/emu60.py's Run, plus `reaimAt` / `orbitAt`, which call `0x4380e4(S, P+0x1d0)` /
  `0x43a374(S)` before that frame's move. It also logs the sound call `0x4a1430` and snapshots the timer and orbit fields.
- `patch.py`: applies the JS below to a COPY (`gapE/render/shells.js`, CRLF kept), using exact single-occurrence anchors.
  `shells.diff` is the resulting diff against today's repo file.
- `replay.mjs`: the node replay against the patched copy. `replay.out` is its output: **43 passed, 0 failed**.
- `ahtal-check-patched.mjs` / `.out`: the existing `dev/shells-ahtal-check.mjs` run on the patched copy gives 71 / 72. The one
  FAIL is expected: the L2 M17 picks contract now also lists `7:0x31`. See (b) note 3. On the repo file the check gives 72 / 72
  (`ahtal-check-repo.out`).

---

## (a) READ facts (addresses), with INFERRED marked

### The action side (uEm088_00)

- **vt+0x204 `0x10b4828`, status-7 switch** (table `0x10b4c90`, index n − 0x10). Entry `0xa8` → `0x10b4d38` serves exactly
  0x2c, 0x2f, 0x31 and 0x36 (slots at `0x10b4d00` / `0d0c` / `0d14` / `0d28`). Entry `0xb60` → `0x10b57f0` serves 0x34 only
  (`0x10b4d20`). READ.
- **`0x10b4d38`** calls `0x4380e4(h, [E+0x1428] + 0x1d0)` for each non-zero handle `e+0xd420`, `+0xd424`, `+0xd428`, `+0xd42c`,
  `+0xd430`, in that order. It then writes `e+0xd439 = 0`. There is no state test. READ.
- **`0x10b57f0`** calls `0x43a374(h)` for each non-zero `e+0xd450`..`+0xd45c`. There is no state test. READ.
- **The clips** come from the status-7 body table `0x10be780` (index `e+0x73e1`). READ:
  - (7, 0x2c) `0x10befe0`: **L2 M16 from 0** (`0xafe84(E, 0x210, blend 4, 0)`). Phase 1 (`0x10bf2d8`) ends at the motion's end
    (`0xb09c8` → `0x6d53c`).
  - (7, 0x2f) `0x10bf1bc` and (7, 0x36) `0x10bf144` both run `0x10c1800(E, 6 / 2)`: **L2 M3 / L2 M2 from 0** (`0x203` / `0x202`,
    blend 4). Phase 1 turns −40 / +40 deg (`0x76dd0`, `0xffffe38e` / `0x1c72`, f98..110), then ends at the motion's end.
  - (7, 0x31) `0x10bf040`: **L2 M17 from 0** (`0x211`, blend 4). Phase 1 (`0x10bf39c`): crossing f152 (`0xb0968(E, 1, 0, 152)`)
    → `0x10bc334(E, 7, 0x32, 0)`, the throw (7, 0x32). That throw plays L2 M17 from 160 (`0x10bf08c`) and throws the carried
    shell57 at its start (`0x10b51e4`, already transcribed).
  - (7, 0x34) `0x10bf1cc`: **L2 M35 from 94** (`0x223`, blend 6). Phase 1 (`0x10bf40c`): f136 → (7, 0x37), which plays L2 M35
    from 144.
  - (7, 0x33) `0x10bf0f0`: L2 M35 from 0 (`0x223`, blend 4). Phase 1 (`0x10bf3d4`): f86 → `0x10bc334(E, 7, 0x34, 2)`.
- **Issued** (`emc011.py em088_00`, READ parse):
  - (7, 0x2c) by g1 s110; (7, 0x2f) and (7, 0x36) by g1 s105; (7, 0x31) by g1 s111 / s112 / s113. These are the same streams
    that issue the shell60 wind-ups (1, 0x1c) and (1, 0x22).
  - **(7, 0x34) is issued by no stream.** All 16 `0x10bc334` call sites in the band were scanned. Its only issuer is (7, 0x33)'s
    chain at `0x10bf3f4`, and (7, 0x33) is g1 s106's, the stream that also issues (1, 0x1e) (shell61 modes 0..2).

### base60 (shell60), band `0x435b40..0x4385f8`

- **`0x4380e4(S, &tgt)`, the re-aim:**
  - `bfi` word +4 bits 8..23 = 2: sub-state 2, phase 0, byte 7 untouched.
  - The yaw word is `u16(s32(0.5 + atan2(tgt.x − H.x, tgt.z − H.z) × 10430.38))`, with H = `+0x1670`.
  - **T** (`+0x16a0`, `+0x16a8`) = tgt + vec 2 (pointer `+0x1640`, **not** × size) turned by that yaw: x = vx·cos + vz·sin,
    z = vz·cos − vx·sin. `+0x16a4` = `+0x16ac` = 0. READ.
- **state-1 `0x43630c`** dispatches byte 5 through the table `0x436394`: sub-state 2 → `0x436c94`, 3 → `0x437a20`. READ.
- **sub-state 2 `0x436c94`**, phase table `0x436cc0`: 0 `0x436cd4`, 1 `0x436f54`, 2 `0x436d3c`, 3 `0x436f98`, 4 `0x436e00`. READ:
  - **Phase 0:** phase → 1. `+0x40` = H, `+0x4c` = 0. Timer `+0x1664` = f6 × 60. It falls through into phase 1 on the same move.
  - **Phase 1:** counts the timer down. At 0, phase → 2 and:
    - D = `+0x40` + (0, f8, 0), written to `+0x1680`..; `+0x168c` = 0.
    - `0x437e4c(S, |f8 / f7|, 0, dest D, src +0x40)` starts the drop.
    - Target words = (pitch, yaw, 0) from D toward T (`+0x16b8`..). Start words = `+0xfe8`..; t `+0x16b0` = 0; rate `+0x16b4` =
      1 / ((f7 + f2 × 60) × 0.7).
    - **u 331 stops** (`0x43b058(S, [+0x1650], 0)`).
  - **Phase 2:**
    - The blend runs (per axis as `0x432efc`, with **no** phase step at t = 1). Then the flight `0x539224`.
    - Once D is passed in 3D: phase → 3, `+0x40` = D, shake timer `+0x1690` = f2 × 60, angle `+0x1694` = 0.
    - `0x437e4c(S, f10, f11, dest +0x40, src T)`: the velocity points **away from T**.
    - `0x4a1430(S, 0xfb, +0x40, 1)` is a sound (INFERRED, as in the rom-map's `0x4a1430` row). Byte 7 is cleared.
  - **Phase 3:**
    - The blend runs.
    - While byte 7 = 0, the flight runs. Once the velocity's direction turns against itself (dot of the normalised before and
      after vectors ≤ 0), `+0x1010..+0x102c` are zeroed and byte 7 = 1.
    - The **shake** runs: angle += wrap(f4) × dt degrees; each axis of `+0x40` gains (A(1 − |s|) + (A ± (0, f3, 0))|s|) − A,
      with A = `+0x1680` and s = sin(angle).
    - The shake timer counts down. At 0, phase → 4, timer `+0x1664` = f12 **raw** (frames, not × 60), angle 0, A = `+0x40`.
  - **Phase 4:** the shake runs with f14 / f13. The timer counts down. At 0 the sub-state becomes 3, phase 0 (`0x437254`).
- **sub-state 3 `0x437a20`.** READ:
  - **Phase 0:**
    - Words = (pitch, yaw, 0) toward T.
    - `0x437e4c(S, f1, 0, dest T, src +0x40)`.
    - Hit 0 `vt+0x140` (the attack volume, not drawn).
    - **ef 7 (+0x15e8 = u 301) starts at +0x40** (`0x437c2c`, `0x4a11e4`) → `+0x1660`.
    - ef 4 (+0x15dc = u 231) starts → `+0x1654` (`0x437cac`).
    - **u 300 stops** (`0x437ce8`, mode 0).
    - It falls through into phase 1.
  - **Phase 1:** the flight runs. Once T is passed in 3D: `+0x40` = T, then `vt+0x148(S, 0)` (end60 with flag 0 → u 310 at T, plus
    the stops of u 332 / 300 / 331 / 231 / 301). `0x43ac04(S, int 1)` is a camera id; it is −1 in every mode, so nothing.
- **u 301 starts only at `0x437c2c`.** Census of `#0x15e8` in the base60 band: one site, `0x437bc4`, in sub-state 3. The positive
  control is the same census finding the known sub-state 0 / 1 starts (`0x15cc` `0x4364b4`, `0x15d0` / `0x15d4` in sub-state 0,
  `0x15d8` `0x43691c`). (A `movw`-immediate census; it agrees with the full disassembly read.) READ.

### base61 (shell61), band `0x4385f8..0x43a78c`

- **init `0x438838`** (the fields the orbit uses). READ:
  - `+0x16a0` rx = f2; `+0x16a4` rz = f3; `+0x16a8` θ = f1 deg (rad); **`+0x16ac` the dive spin = f7 deg (rad)**.
  - **`+0x16b0` = his Y word** (P+0x54, 32-bit load).
  - `+0x16c0..` C = his P+0x40..; `+0x16cc` = 0.
  - **`+0x16f4` = word(+0xfec) × 360/65536 − u16(atan2(C − O) as a word) × 360/65536**: the yaw offset, in degrees.
- **`0x43a374`, the orbit-on:** `bfi` word +4 bits 8..23 = 2 (sub-state 2, phase 0). READ.
- **sub-state 2 `0x4397ec`**, phase table `0x439824`: 0 `0x439834`, 1 `0x439938`, 2 `0x439a20`, 3 `0x439a60`. READ:
  - **Phase 0:** phase → 1. `+0x40` = O (`+0x1690`).
    - **ef 4 (+0x15d8 = u 360) starts at +0x40** (`0x4398e4`) → `+0x1670`.
    - **u 331 stops** (`0x43990c`, mode 0).
    - Clock `+0x1680` = 0; spin `+0x16d0` = f13 deg (rad).
    - It falls through into phase 1.
  - **Phase 1:** the orbit `0x43a1f4` runs. The Y word `+0xfec` = u16(s32(0.5 + `+0x16f4` × 182.044) + yaw(C − `+0x40`)); the
    pitch computed beside it is discarded. When the orbit returns 1: phase → 2, `+0x1680` = f23 raw.
  - **Phase 2:** counts the timer down. At 0: phase → 3, hit 0 `vt+0x140`, clock 0.
  - **Phase 3:** the dive `0x439f9c` runs, then the Y word. If y ≤ 0, y = 0. When the clock ≥ f18, the sub-state becomes 3
    (`0x4a184c`, the hit off).
- **orbit `0x43a1f4`:**
  - clock += dt; θ += dt·w.
  - The ellipse point: (sin θ·rx, cos θ·rz) turned by u16(s32(0.5 + f6 × 182.044) + `+0x16b0`), added to C (x and z only).
  - w += dt·f14 deg.
  - It returns 1 and sets w = 0 when w changes sign (> 0 to < 0, or < 0 to > 0). READ.
- **dive `0x439f9c`:**
  - clock += dt; θ += dt·`+0x16ac`.
  - While f9 < clock ≤ f10: w += dt·f8 deg. Then f12 deg is applied as a floor (`bhi` keeps w > lo), or as a cap when f12 < 0
    (`bge`). Then f11 deg is applied as a cap, or as a floor when f11 < 0 (`vstrls`).
  - While f16 < clock ≤ f17: y += dt·f15.
  - The ellipse point.
  - rx += dt·f5; rz += dt·f5·rz / rx (using the new rx). READ.
- **sub-state 3 `0x439c10`.** READ:
  - **Phase 0:** velocity (0, f19, 0) and acceleration (0, f20, 0). Hit 2 `vt+0x140`. ef 5 (`+0x15dc`) → `+0x1674`; it is
    (999, −1) in all four modes, so nothing starts. It falls through into phase 1.
  - **Phase 1:** the dive, then the flight. If y ≤ 0: y = 0, then `vt+0x148(0)` (end, u 310).
- **u 360 starts only at `0x4398e4`.** Census of `#0x15d8` in the base61 band: the ctor's clear `0x4386d4` (not a start) and
  `0x43987c`. Control: the census finds the sub-state 0 / 1 starts (`0x15c8` `0x43900c`, `0x15cc` / `0x15d0` / `0x15d4`). READ.
- **shell61 mode 3** (made only by (1, 0x24)): f13 = f14 = 0, so w never changes sign and `0x43a1f4` never returns 1. It **stays
  in sub-state 2 phase 1 at O, with u 360 on, until a release.** The ROM run agrees through 1800 moves. READ.

### Still INFERRED / not read

- **The step on which (7, 0x34)'s start lands in the viewer.** The ROM chains at (7, 0x33)'s f86 crossing, then plays L2 M35 from
  94. The viewer plays L2 M35 from 0 and orbits on the f86 crossing step (`pass001`, the house convention used by the pull's f92).
  The 8-frame skip 87..93 cannot be shown. INFERRED alignment.
- **Whether the game empties `e+0xd420` / `+0xd450` when an anchor dies:** NR. The viewer skips a dead anchor (0xff); an ending one
  (0xfe) is unaffected either way.
- **`0x4a1430(S, 0xfb, …)` as a sound:** INFERRED (rom-map's existing row).

---

## (b) The JS for docs/render/shells.js

There are six hunks, all string-anchored. Line numbers below are today's repo file; the repo moves by about 13 lines while other
agents work. The file is **CRLF**. `python gapE/patch.py` applies the same edits to a copy and stops if an anchor is not unique.
The full diff is `gapE/shells.diff` (353 lines). Summary:

1. **The action rows**, inserted after `act088(1, 0x24, '2', 'Motion[30]', …)` (about line 3456):
   ```js
   act088(7, 0x2c, '2', 'Motion[16]', [{ atStart: true, reaim: 'shell60' }]),
   act088(7, 0x2f, '2', 'Motion[3]', [{ atStart: true, reaim: 'shell60' }]),
   act088(7, 0x36, '2', 'Motion[2]', [{ atStart: true, reaim: 'shell60' }]),
   act088(7, 0x31, '2', 'Motion[17]', [{ atStart: true, reaim: 'shell60' }, { frame: 160, shell: 'shell57', throw: true }]),
   act088(7, 0x33, '2', 'Motion[35]', [{ frame: 86, orbit: 'shell61' }]),
   ```
   Each carries its comment block (addresses as in (a)).
2. **spawn088**, after `if (sp.lines){ if (fresh) lines088(…); continue; }`:
   ```js
   if (sp.reaim || sp.orbit){                                     // the anchors' sub-state 2 (anchors088): nothing made
     if (sp.atStart ? fresh : (!fresh && !!state.hist && pass001(state, f(sp.frame)))) anchors088(state, sp, ctx, out, a);
     continue;
   }
   ```
   This must come before the shell57 path, which would otherwise refuse the row with "carrying nothing".
3. **The BASE60 / BASE61 header comment**: the band lists now name sub-states 0..3, re-aim, dive, orbit and orbit-on, and the "not
   transcribed" text is replaced by what sub-states 2 / 3 do.
4. **make61**: `angles` is hoisted, and an `orbit` object is added: `{ rx, rz, theta, wDive, hisY, wOrbit, yawOff }`, from the
   init fields above.
5. **New functions** after `sub160` and before `// the end 0x438214 / 0x43a3ac (flag)`: `reaim60`, `turn60` (blend60's turn with no
   phase step), `shake60`, `sub260`, `sub360`, `yawToC61`, `ellipse61`, `orbit61`, `dive61`, `sub261`, `sub361`, `anchors088`.
   The effect slots are `'u301'` (ef 7) and `'u231'` (ef 4) on base60, `'u360'` (ef 4) on base61, and `'u300'` / `'u331'` for the
   stops. These slots match the names end60 already stops. base61 ef 5 is requested as `'ef5'` and is always nothing.
6. **step60**:
   ```js
   else if (S.sub === 2){ if (S.base === 'base61') sub261(S, D, ctx, out); else sub260(S, D, ctx, out); }
   else if (S.sub === 3){ if (S.base === 'base61') sub361(S, D, ctx, out); else sub360(S, D, ctx, out); }
   ```

How the sub-states are driven, compared with sub-states 0 / 1:
- Sub-states 0 / 1 run from the anchor's own move once web088 makes it, at the L2 M30 wrap.
- Sub-states 2 / 3 start when a play's action row fires `anchors088`. For (7, 0x2c / 0x2f / 0x36 / 0x31) that is the clip's first
  step (`fresh`, as vt+0x204 at the action start). For the orbit it is the (7, 0x33) L2 M35 step crossing f86.
- Either way, the same step's move (line 18, after the spawns on line 4) runs phase 0. That ordering is the one the emulator
  reproduces (`reaimAt` / `orbitAt` before that move).
- `webAnchors088` needs no change: its d420 gate `sub <= 2` (`0x4381d8`) drops the threads at the throw, and the d450 gate is state
  1 only.

Notes for the shells agent:
1. **The variant picker gains entries:** `7:0x2c` on L2 M16, `7:0x2f` on L2 M3, `7:0x36` on L2 M2, `7:0x31` on L2 M17 and
   `7:0x33` on L2 M35. If L2 M2 / M3 are also generic turn clips, the picker will offer these there; that is ROM-true.
2. **(7, 0x31) carry:** heldUntil088 returns 160 for it, which is correct for the chained (7, 0x32) throw. psl-mask
   `CLIP_ACTIONS.em088_00['2|Motion[17]']` and `em088Drops` do not know (7, 0x31). In the ROM it keeps the object until (7, 0x32)
   starts, so `em088Drops` = false is right for its own start. Whether to list it in CLIP_ACTIONS is the carry lane's call.
3. **dev/shells-ahtal-check.mjs line ~310** expects `'2:0x0f,7:0x10,7:0x32'` for the L2 M17 picks. With the new row it is
   `'2:0x0f,7:0x10,7:0x32,7:0x31'`; update the expectation if the row is kept.
4. The replay below could be folded into shells-ahtal-check (`emu60x.py` is a drop-in for `emu60.py`).

---

## (c) rom-map rows (dev/rom-map.md, section "Ahtal-Ka -- his shells read and built")

**Replace** the row `| \`0x10b4d38\` / \`0x10b57f0\` | … **their clips NR, not transcribed** | uEm088_00 | R (spawner) / NR (clips) | b60\notes |`
with the first row below; the others are new rows beside the existing base60 / base61 rows. This is an NR → R upgrade, not a
withdrawal.

```
| `0x10b4d38` / `0x10b57f0` | (7, 0x2c / 0x2f / 0x31 / 0x36): `0x4380e4(h, [E+0x1428]+0x1d0)` on each non-empty d420 handle (then e+0xd439 = 0); (7, 0x34): `0x43a374` on each d450 -- no state test. Clips (body table `0x10be780`): 0x2c L2 M16 from 0; 0x2f / 0x36 `0x10c1800(E, 6 / 2)` L2 M3 / M2 from 0 (turn -40 / +40 f98..110); 0x31 L2 M17 from 0, f152 -> (7, 0x32) (L2 M17 from 160, the throw); 0x34 L2 M35 from 94, f136 -> (7, 0x37); **(7, 0x34) issued only by (7, 0x33)'s f86 chain `0x10bf3f4`** (L2 M35 from 0; g1 s106) | uEm088_00 | R | gapE/RESULT.md; shells.js act088 rows, anchors088 |
| `0x4380e4` | base60 re-aim: sub-state 2 phase 0 (bfi bits 8..23); T `+0x16a0` = target + vec 2 (NOT x size) turned by yaw(target - H), y 0 | uShellEmBase60 | R | shells.js reaim60 |
| `0x436c94` | base60 sub 2: 0 +0x40 = H, timer f6 x 60; 1 then D = +0x40 + (0, f8, 0), flight to D at \|f8/f7\|, words blend to (D->T) at 1/((f7 + f2 x 60) x 0.7), **u 331 stops**; 2 blend + flight, D passed -> shake timer f2 x 60, flight AWAY from T (f10, accel f11), sound 0xfb (`0x4a1430`, I); 3 blend, flight until v reverses (then 0, byte 7), shake (f4 deg/f, f3), then A = +0x40, timer f12 raw; 4 shake (f14, f13) -> sub 3 | uShellEmBase60 | R | shells.js sub260 / shake60 |
| `0x437a20` | base60 sub 3: words to T, flight to T at f1, **ef 7 u 301 (`0x437c2c` -> +0x1660) and ef 4 u 231 (`0x437cac`) at +0x40, u 300 stops**; T passed -> +0x40 = T, end(0) (u 310); camera int 1 (-1) | uShellEmBase60 | R | shells.js sub360 |
| `0x438838` (orbit fields) | base61 init also: +0x16ac dive spin = f7 deg, +0x16b0 his Y word (P+0x54), +0x16c0 C = his point, +0x16f4 yaw offset deg = word(pos->O) - word(O->C) | uShellEmBase61 | R | shells.js make61 (orbit) |
| `0x43a374` / `0x4397ec` | base61 orbit-on: sub 2 phase 0. Sub 2: 0 +0x40 = O, **ef 4 u 360 (`0x4398e4` -> +0x1670)**, **u 331 stops**, clock 0, spin f13 deg; 1 orbit + Y word (yaw(C - pos) + offset) until the spin reverses, then timer f23 raw; 2 timer; 3 dive + Y word, y >= 0, clock >= f18 -> sub 3. **Mode 3 (f13 = f14 = 0) never leaves phase 1** | uShellEmBase61 | R | shells.js sub261 |
| `0x43a1f4` / `0x439f9c` | base61 orbit: clock += dt, theta += dt w, ellipse (sin rx, cos rz) turned u16(f6 word + his Y) about C (x / z), w += dt f14 deg, 1 on a sign change / dive: theta += dt w_dive; f9 < clock <= f10: w += dt f8 deg, f12 floor, f11 cap (sign-swapped when negative); f16 < clock <= f17: y += dt f15; ellipse; rx += dt f5, rz += dt f5 rz / rx | uShellEmBase61 | R | shells.js orbit61 / dive61 |
| `0x439c10` | base61 sub 3: v (0, f19, 0), a (0, f20, 0), ef 5 (none in every mode); dive + flight; y <= 0 -> y 0, end(0) (u 310) | uShellEmBase61 | R | shells.js sub361 |
```

Tooling row (the tooling table):
```
| tooling: `<scratchpad>\gapE\emu60x.py` (2026-10-20) | sh88/emu60.py + `reaimAt` / `orbitAt` (0x4380e4 / 0x43a374 before that move), sound 0x4a1430 logged | gapE/replay.mjs: 18 anchors (shell60 modes 0 / 6 / 8 / 9 / 11 / 12, shell61 0..3) bit for bit through sub 2 / 3; controls (re-aim one move late, no orbit-on) FAIL | stubs as emu60.py: hit / sound / camera not run |
```

WITHDRAWN: **none.** Nothing earlier is wrong. The NR status of the `0x10b4d38` / `0x10b57f0` row is upgraded, and the shells.js
header's "not transcribed" is replaced. One clarification for the row at about line 3119 ("Ahtal-Ka anchor releases …"): it lists
`0x4380e4` / `0x43a374` beside the releases, but they are **not releases**. They set sub-state 2; the releases are `0x438204` /
`0x43a39c`. A one-word note there would stop a misreading.

Task-board grep (`em088` / `Ahtal`): there was no entry on these sub-states, so I am not proposing a board change.

---

## (d) The replay

`gapE/replay.mjs` runs against `gapE/render/shells.js`. Run `python patch.py` first, then `node replay.mjs`. The run is in
`replay.out`: **43 passed, 0 failed**.

Plays:
- A: (1, 0x22) web → (7, 0x2c) L2 M16. Modes 11 / 12 / 8 / 9 / 0.
- B: (1, 0x1c) → (7, 0x2f) L2 M3. Mode 6.
- C: (1, 0x22) → (7, 0x36) L2 M2 after only 60 hold frames. The anchors are re-aimed **mid sub-state 0**; this exercises "no state
  test".
- D: (1, 0x24) → (7, 0x33) L2 M35. Modes 0..3.
- E: (1, 0x1e) → (7, 0x33) L2 M35. Modes 0..2.

Results:
- Every anchor matches the ROM move for move: state, sub-state, phase, +0x40, words, velocity and starts.
- **u 301 starts at each shell60's throw.** Example: A mode 0, step 448 = move 438. The throw starts u 231 too, and the end is u 310
  at T.
- **u 360 starts at each shell61's orbit-on**, step 397 = the L2 M35 f86 crossing. Modes 0..2 dive and end on the ground with
  u 310. Mode 3 stays parked at O, as the ROM does.
- Controls: a ROM run re-aimed one move later differs at move 300, and a ROM run with no orbit-on differs at move 387.
