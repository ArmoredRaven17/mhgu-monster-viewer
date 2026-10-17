# Barioth (em042_00) — effects spec — paused 2026-10-14, **RESOLVED 2026-10-16** (§4..§8 below: the whole-block plan, the plays and the remap, the transcription checked against the ROM, CLIP_ACTIONS, what to implement)

Research agent for the Viewer agent, 2026-10-14. Static ROM reading plus unicorn controls; no recorder, no docs/ edit.
Class `uEm042_00`, vtable `0x17be9a0` (checked: +0xf0 = base `0xca52c`, +0x208 = `0xe70300` the frame handler,
+0x14 `0xe711e0`), band `0xe64e24..0xe71a68`. `R` READ, `I` INFERRED, `NR` NOT READ.

Gaps (survey): enable word unread (6 bindings outside the file mask, all L2 M32 / L2 M33 b15-17); u 905 exported
as an `event` with nothing driving it.

## 1. The PSL enable word — uEm042_00 vt+0x13c = `0xe70b78` — R, emulated

Extent `0xe70b78..0xe70d14` (shared `pop` at `0xe70d14`; `0xe70d18` is the next function's `push`). The decode note
states-em042_00.md 11 lists "+0x13c (attack hit groups)" as NOT READ: that label was a guess; the slot is this word.

    0xe70b84  bl 0xca170                                         ; the base
    0xe70b88  motion 0x209 / 0x20a (L2 M9 / L2 M10), status 7, n = e+0x73e1 <= 0x22, table 0xe70c0c (35 words,
              bounded by `cmp r0,#0x22`):
                n 0x00, 0x01, 0x0f, 0x14, 0x1c, 0x1e -> 0xe70cf0
                n 0x21, 0x22                         -> 0xe70c98
                every other n                        -> nothing
    0xe70b98  motion 0x208 (L2 M8), status 7, n <= 0x1e and bit n of 0x50108003 (`tst r2, r1, lsl r0`;
              n 0x00, 0x01, 0x0f, 0x14, 0x1c, 0x1e) -> 0xe70cf0
    0xe70ba0  motion 0x004 (L0 M4), status **1**, n == 0x0e or 0 -> |= 0x180000 (bits 19-20)
    0xe70c98  P+0x3b4 bit 0 set (tail severed) -> nothing; else |= 0x60000 (bits 17-18)
    0xe70cf0  P+0x3b4 bit 0 set -> nothing; else |= 0x18000 (bits 15-16)
    every other motion: the base alone

**Emulated control** (`<scratchpad>/emu13c.py`): L2 M8 (7,0/1/0xf/0x14/0x1c/0x1e) `0x181ff`; (7,0x21) / (7,2)
`0x1ff`; severed `0x1ff`; L2 M9 (7,0) `0x181ff`, (7,0x21) `0x601ff`; L2 M10 (7,0x22) `0x601ff`, severed `0x1ff`;
enraged (7,0x1e) `0x18e3f`; status 6 `0x1ff`; L0 M4 (1,0) / (1,0xe) `0x1801ff`, (1,1) / (7,0) `0x1ff`; tired +
severed (1,0xe) `0x18703f`; L2 M11 / L2 M32 / L2 M33 (7,0x21) `0x1ff`. All match the read.

**For psl-mask.js CLASS_MASK:**

    const EM042_A = n => (n === 0 || n === 1 || n === 0x0f || n === 0x14 || n === 0x1c || n === 0x1e);
    function em042_00(motion, action, state){
      const n = action && action[0] === 7 ? action[1] : -1;
      if (motion === 0x004) return action && action[0] === 1 && (action[1] === 0 || action[1] === 0x0e) ? 0x180000 : 0;
      if (state.severed) return 0;                                         // both tail arms test P+0x3b4 bit 0
      if (motion === 0x208) return EM042_A(n) ? 0x18000 : 0;
      if (motion === 0x209 || motion === 0x20a) return EM042_A(n) ? 0x18000 : (n === 0x21 || n === 0x22) ? 0x60000 : 0;
      return 0;
    }

(The L0 M4 arm does not test the sever; the L2 arms do.) Inputs: motion; action (status 7 for L2 M8-M10; status 1
for L0 M4 — states-em042_00.md 1 names L0 M4 as (1, 0), the rage-on roar, I from that table; (1, 0x0e) NR);
`P+0x3b4` bit 0 = the tail sever (R, states-em042_00.md 3.4: `0xc2274` ORs it, the part pass reads it).

**Consequence for the survey's six bindings (I, pending the whole-block plan):** the survey's out-of-mask bindings
are L2 M32 / L2 M33 b15-17 (u 324 / 325 / 330 / 331 / 340 / 341). **No arm of `0xe70b78` touches 0x220 / 0x221**, so
those six are named-but-never-enabled (Bloodbath's group F), not missing — the viewer should NOT bind them. The arms
instead gate bits 15-20 on L2 M8 / M9 / M10 and L0 M4, which are presumably IN the file masks (so the viewer fires
them today in every action and after the sever): **the whole-block plan per binding was not run before the pause (NR)**.
**[RESOLVED 2026-10-16: R — §4 (the plan) and §5 (who plays each clip). The six stay off; the four in-mask bindings
on bits 15-20 become action- and sever-gated. (1, 0x0e) is R too: `0xe66154` -> `0xe65d6c` sets L0 M4 (`0xe65dbc`).]**

## 2. u 905 — the cut tail's landing, a CUT_TAIL entry, not a MOTION_STATES row — R (by the shared code)

* u 905 = base u table `0x159c7fc[5]` (states-em042_00.md 3.2); record cm202_001, no joint, scale 0.75, mode 3.
* **It is the landing of the cut tail**, requested by the shared uEnemyOption code at option frame k = 42, at G
  (`0x703b8`; docs/render/tail-option.js header, from tail-option-em043.md, READ under the emulator by the tail
  agent). Every other monster's u 905 is driven by a `CUT_TAIL` entry's `landing`; **em042_00 has no CUT_TAIL
  entry**, which is why it is undriven.
* What the entry needs is already read (states-em042_00.md 3.4): sever kind **0x8f** (`0xc2274` at `0xe657f8` in the
  on-action-start hook vt+0x204 `0xe65568`, (10, 0x72) with part 7); u 900 on **joint 144**; descriptor
  `[0x172ba68][123]` = `0x159b2f0` word [1] = 0x8537 != -1 -> uEnemyOption slot 0 exists; `em042_00_tail.glb` is
  staged (`docs/models/monsters/em042_00_tail.glb`, R: file present) and monsters.json carries the `option` list
  `em001_00_option`. So:
  `em042_00: { piece: 'em042_00_tail', joint: 144, above: 20, landing: ['em042_00u', 905] }` — the Akantor / Ukanlos
  shape. Not read: which file resource 0x8537 names (the same gap the note records).
* The sever clip in motion-states is L3 Motion[13] (10, 0x72) with `fire u 900` — check it carries `drops: true`.
* **[RESOLVED 2026-10-16: DONE in the viewer — R (the files).** `docs/render/tail-option.js` carries
  `CUT_TAIL.em042_00 = { piece: 'em042_00_tail', joint: 143, above: 20, landing: ['em042_00u', 905] }` (143 = the
  sever's kind byte `0x8f`, the Withdrawn-table correction of the 144 above), and motion-states.js `em042_00`
  `'3|Motion[13]'` carries `drops: true`. Nothing left for u 905.]**

## 3. Not started before the pause

The whole-block plan diff per binding (which in-mask bits 15-20 on L2 M8/M9/M10 and L0 M4 become action- or
sever-gated), CLIP_ACTIONS for those clips, and the "what to implement, in order" list.
**[RESOLVED 2026-10-16: §4 – §7.]**

## 4. What the word changes — whole-block plan (124 file-mask bindings -> 130 whole-block) — R

`<scratchpad>/bw1/planrows.py em042_00 [--whole]` (add_effects.plan with em042_00 forced into psl_mask_monsters; outputs
`<scratchpad>/bs/em042_00_{file,whole}.txt`). **Barioth has no binding on bits 6-14 at all** — every binding but the ten
below sits on bits 0-5 and stays always-on, so the state groups change nothing for him.

**Gated** (in the file mask — the viewer fires them today on every play and after the sever):

| binding | record | game |
|---|---|---|
| L0 M4 b19 f120-130 | c 90 (`cm202_050`, exported) | only on (1, 0) / (1, 0x0e); not on (1, 0x0b). No sever test |
| L2 M8 b15 f43 | u 200 (`cm202_022`, exported) | only on (7, 0x0f) / (7, 0x14), and only with the tail on; not on (7, 0x11) / (13, 5) |
| L2 M9 b17 f79-110 | u 240 (`em042_00_005`, exported) | only on (7, 0x21), and only with the tail on (§5: that is every intact play) |
| L2 M10 b17 f79-110 | u 240 | only on (7, 0x22), tail on (the same) |

(Bit 16 / 18 / 20 name nothing on these clips; bits 15-16 on L2 M9 / M10 name nothing either.)

**Never enabled** (outside the file mask, named, all exported, and the word never sets them — the viewer must NOT bind
them): L2 M32 b15 u 331 / b16 u 330 / b17 u 325, L2 M33 b15 u 341 / b16 u 340 / b17 u 324 (`em042_00_006`). Control: no
arm of `0xe70b78` tests 0x220 / 0x221; the ROM sweep in §6 includes L2 M32 / M33 with every (7, n) — including their own
plays (7, 0x3c) / (7, 0x3d) (§5) — and returns the base word on every one.

So the class turns ON nothing new, keeps the six L2 M32 / M33 bindings off, and gates four by action and the sever.

## 5. Who plays each clip, and the remap that decides it — R

Action main vt+0x1f4 `0xe701d4` (statuses 0..0x11, table `0xe701f4`); status 7 `0xe6e550`, status 1 `0xe65f5c`
(`<scratchpad>/ng/jt.py`; first motions by `efx/agents/notice-scratch/probe.py`, every (1, n) / (7, n), postures 0 and 1
the same). Later phases read by hand.

* **L2 M9 / L2 M10**: (7, 0) / (7, 0x21) -> `0xe6e684` / `0xe6e978` setMotion0 **0x209**; (7, 1) / (7, 0x22) ->
  `0xe6e6d8` / `0xe6e7d8` **0x20a**. One phase each (phase 1 = the end -> vt+0x3dc idle chooser, `0xe6e9e8`). They
  differ in the attack data only (`0x7db70` r2 1 / 0x1e, 2 / 0x1f).
* **The action remap vt+0x1fc `0xe64f48` (R, whole: `..0xe65534`, status-7 table `0xe65034`, n <= 0x3d)** rewrites the
  number in place: **(7, 0) -> (7, 0x21) and (7, 1) -> (7, 0x22) while the tail is ON** (`0xe6524c` / `0xe65268`:
  `ldrb [P+0x3b4]; tst #1; bne keep`); (7, 0x0f) -> 0x1c, (7, 0x11) -> 0x1d, (7, 0x14) -> 0x1e while BOTH wing-arms are
  broken (part 2's level `0x9d36c(e, 2)` >= .dtp `+0x64` byte 1 / 2 by rank `0x3a8430` <= 4, and part 3's >= byte 5 / 6:
  row 0 / row 1 level 1 at both ranks, states-em042_00.md 3.1); tired (`0x81614`): 2 / 0x2c / 0x2d -> 0x1f, 0x15 / 0x2e
  -> 0x20, 0x12 -> 0x29, 0x27 -> 0x2a, 0x34 -> 0x35; part 2 broken: 0x3c -> 0x3e; part 3 broken: 0x3d -> 0x3f.
  It runs inside changeAction (`0x763f4`, iterated to a fixed point) whenever the mode is 1, or not 3 with `e+0x7420`
  set — and `e+0x7420` is 1 for him (`0xb1560` writes it when P+0x1a8 bit 3 is clear; his word is 0x00440241,
  states-em042_00.md 1; the `0xb1560` reading is states-em022_00.md 542's, I for this class).
  **So the ROM plays (7, 0) / (7, 1) only with the tail cut, and (7, 0x21) / (7, 0x22) only with it on.** The command
  streams issue (7, 0) / (7, 1) (g1 s0, s20, s68, g8 s0); nothing issues 0x21 / 0x22 directly.
* **L2 M8** — three bodies, each mode 0 only (mode 1 plays L2 M16 instead): `0xe6b5ac` (7, 0x0f) mode 0 / (7, 0x1c)
  mode 1: L2 M7 (posture 3) -> at its end L2 M8 (`0xe6b9c8`) / L2 M16 (`0xe6b8c0`); `0xe6c938` (7, 0x14) / (7, 0x1e):
  L1 M17 -> L2 M14 -> L2 M8 (`0xe6d00c`) / L2 M16; `0xe6c0c4` (7, 0x11) / (7, 0x1d): L2 M14 -> L2 M8 (`0xe6c560`) /
  L2 M16. A fourth, `0xe6fa54` (the same L1 M17 -> L2 M14 -> L2 M8 body), is status 13: (13, 5) mode 0 / (13, 6) mode 1
  (`0xe702e4` / `0xe702ec`, status-13 table `0xe70298`). Issued: (7, 0x0f) g1 s13; (7, 0x14) g1 s39, s85; (7, 0x11) by
  class code only — the follow at `0xe676d0` / `0xe6776c` inside `0xe672f0`, the (2, 0x12) body (`0xe67d98`).
  So with the tail on and the wings not both broken, the word gives u 200 on (7, 0x0f) / (7, 0x14) and not on
  (7, 0x11) / (13, 5); (7, 0) / (7, 1) / (7, 0x1c) / (7, 0x1e) are in the word's L2 M8 set but never play L2 M8.
* **L0 M4**: (1, 0) -> `0xe65aa4` (`0xe65af0`) — the rage roar (g6 s0, g5 s0 / s1, g9 s0, g0 s11); (1, 0x0b) -> `0xe660ac`
  (`0xe660ec`) — issued by g0 s0 alone; (1, 0x0e) -> `0xe65d6c` (`0xe65dbc`) — issued by g13 s0. c 90 on (1, 0) /
  (1, 0x0e), not (1, 0x0b). (What g0 s0 / g13 s0 stand for — a first-sighting roar, a group-13 roar — is I.)
* **L2 M32 / M33**: (7, 0x3c) / (7, 0x3d) first motions (probe); the word sets nothing on them whatever the action.

## 6. The transcription, checked against the ROM — R (emulated)

`<scratchpad>/bs/jscheck.py`: the JS below ported line for line against `0xe70b78` under unicorn (`bw1/emu13c_bw.py`, one
instance, ARMv8; control first: Ukanlos's spec words `0x381ff` / `0x1c01ff` reproduced) over 13 motions (L0 M1 / M4 / M5,
L1 M17, L2 M7 / M8 / M9 / M10 / M11 / M16 / M32 / M33, L3 M13) x status 0 / 1 / 6 / 7 / 13 x number 0..0x47 x P+0x3b4
0..3 x rage x tired: **74880 runs, 0 mismatches.**

    // BARIOTH (em042_00), uEm042_00 vtable +0x13c = 0xe70b78 (vtable 0x17be9a0; +0xf0 the base 0xca52c), READ whole
    // (0xe70b78..0xe70d14) and emulated -- 74880 runs against the ROM, 0 mismatches (dev/em042_00-effects-spec.md 1, 6).
    // 0xca170 first, then by motion id -- no variant, posture or part-break input:
    //   * L2 M8 (0x208), status 7, number <= 0x1e in 0x50108003 (0 / 1 / 0x0f / 0x14 / 0x1c / 0x1e), tail on (P+0x3b4
    //     bit 0 clear) -> bits 15-16: u 200 on (7, 0x0f) / (7, 0x14), the two that play it (the others never do);
    //   * L2 M9 / M10 (0x209 / 0x20a), status 7, table 0xe70c0c: the same six -> bits 15-16 (nothing bound), 0x21 / 0x22
    //     -> bits 17-18 (u 240), tail on only. The remap vt+0x1fc 0xe64f48 makes (7, 0) / (7, 1) INTO 0x21 / 0x22 while
    //     the tail is on, so every intact play fires u 240 and no severed one does;
    //   * L0 M4 (0x004), status 1, number 0 or 0x0e -> bits 19-20 (c 90 on the rage roar), no sever test;
    //   * every other motion: the base alone -- L2 M32 / M33's u 324 / 325 / 330 / 331 / 340 / 341 are never enabled.
    const EM042_A = n => (n === 0 || n === 1 || n === 0x0f || n === 0x14 || n === 0x1c || n === 0x1e);
    function em042_00(motion, action, state){
      const n = action && action[0] === 7 ? action[1] : -1;
      if (motion === 0x004) return action && action[0] === 1 && (action[1] === 0 || action[1] === 0x0e) ? 0x180000 : 0;
      if (state.severed) return 0;                                         // both tail arms test P+0x3b4 bit 0
      if (motion === 0x208) return EM042_A(n) ? 0x18000 : 0;
      if (motion === 0x209 || motion === 0x20a) return EM042_A(n) ? 0x18000 : (n === 0x21 || n === 0x22) ? 0x60000 : 0;
      return 0;
    }

Inputs: `state.severed` — P+0x3b4 bit 0, the tail sever (0xc2274 at `0xe657f8`). The viewer already has the sever row
(`'3|Motion[13]'`, set 18 -> set 19, group 14 on / 101 off) but **no `SHELL_TAIL.em042_00`**: add
`SHELL_TAIL.em042_00 = { severed: 14 }` — R: set 19 is his sever row's set, and monsters.json em042_00 `groups[19]` =
[[14, on], [101, off]] is the ONLY set that draws part 14 (`groups[18]` draws it off; scanned every set). The action from
CLIP_ACTIONS (§7).

## 7. CLIP_ACTIONS — R (the plays, §5)

    // BARIOTH (dev/em042_00-effects-spec.md 5). L2 M8: (7, 0x0f) (L2 M7 -> L2 M8) and (7, 0x14) (L1 M17 -> L2 M14 -> L2 M8)
    // fire u 200 with the tail on; (7, 0x11) (followed from (2, 0x12)) plays the same clip without it. All three become
    // L2 M16 plays once both wing-arms are broken (the remap 0xe64f48), so L2 M8 is shown as the wings-whole plays.
    // L2 M9 / L2 M10: the ROM plays them as (7, 0x21) / (7, 0x22) while the tail is on and (7, 0) / (7, 1) once it is cut
    // (the remap); both forms give the word's answer through state.severed, so one entry each. L0 M4: the rage roar (1, 0)
    // fires c 90, the g0 s0 roar (1, 0x0b) does not ((1, 0x0e), g13 s0, fires it like (1, 0)).
    em042_00: {
      '2|Motion[8]':  [{ action: [7, 0x0f] }, { action: [7, 0x14] }, { action: [7, 0x11] }],
      '2|Motion[9]':  [{ action: [7, 0x21] }],
      '2|Motion[10]': [{ action: [7, 0x22] }],
      '0|Motion[4]':  [{ action: [1, 0x00] }, { action: [1, 0x0b] }],
    },

**These entries are REQUIRED**: with no action the word gives 0 on L2 M8 / M9 / M10 / L0 M4, and u 200 / u 240 / c 90
would never fire once em042_00 is in PSL_MASK_MONSTERS.

## 8. What to implement, in order

1. psl-mask.js: `CLASS_MASK.em042_00` as §6; `'em042_00'` into `PSL_MASK_MONSTERS`; the `CLIP_ACTIONS.em042_00` block of §7.
2. motion-states.js: `SHELL_TAIL.em042_00 = { severed: 14 }` (set 19, the sever row's, is the only set drawing part 14),
   so `state.severed` follows the parts shown.
3. `add_effects.py em042_00 --apply`, `--record`, `--check`: CLIP_EFFECTS regenerated from the whole blocks adds the six
   L2 M32 / M33 bindings, which the runtime word keeps off; **no record to export** (all ten are exported). Recorder slot
   — announce.
4. Soak with `--viewer-inputs`; Raven verifies: u 240 on L2 M9 / M10 with the tail on, none cut; u 200 on L2 M8's first two
   plays, not the third; c 90 on the rage roar only.
Nothing else is open in the survey's Barioth section: u 905 is driven by CUT_TAIL.em042_00 (§2).

NOT READ, by name: who issues (13, 5) (no stream, no class follow found by `<scratchpad>/bs/actsites.py`; it fires
nothing, so it changes no word); what g0 s0 / g13 s0 are as behaviours; the e+0x7420 writer's arm for this class
(the remap's gate) is I from the shared reading.
