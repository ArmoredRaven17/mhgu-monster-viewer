# Seregios (em077_00) — effects spec — paused 2026-10-14, **RESOLVED 2026-10-16** (§4..§9 below: the plays of L2 M26 / M34, the whole-block plan, the transcription checked against the ROM, CLIP_ACTIONS, the c 30 shell's reader and cadence, the records to export, what to implement)

Research agent for the Viewer agent, 2026-10-14. Static ROM reading plus unicorn controls; no recorder, no lift, no
docs/ edit. Class `uEm077_00`, vtable `0x17e7c08` (checked: +0xf0 = base `0xca52c`, +0x208 = `0xfddfcc` = the frame
handler class-effects.json names, +0x14 = `0xfee134` getDTI -> `0x184a498` uEm077_00; the 4-bytes-low trap does not
apply), band `0xfda0ac..0xfee698`. `R` = READ (consuming instruction read), `I` = INFERRED, `NR` = NOT READ.

Gaps from dev/flying-wyverns-effects-survey.md: enable word unread (9 bindings outside the file mask); PSL records
not exported u 200 / 201 / 202 / 203 / 230 / 234; c 30 exported as `shell` with no SHELL_DATA driver.

## 1. The PSL enable word — uEm077_00 vt+0x13c = `0xfee088` — R, emulated

Extent `0xfee088..0xfee128` (the `pop` at `0xfee128`; `0xfee12c` / `0xfee130` are unrelated veneers, `0xfee134` the
getDTI thunk).

    0xfee094  bl 0xca170                                   ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0xfee098  r0 = e->vt[+0x370](e, 1)                     ; 0xa3bf4: ldrh P+0x3b4 & 1 -> 0/1 (the sever bit)
    0xfee0ac  cmp r0,#1 / bne                              ; severed:
    0xfee0c0    +0x13f4 = (+0x13f4 & 0xffe3ff1f) | 0x1c0000   ; CLEAR bits 5, 6, 7 and SET bits 18-20
    0xfee0d4  motion == 0x222 (L2 M34) or 0x21a (L2 M26):
    0xfee0ec    status e+0x73e0 == 7 else return (popne)
    0xfee0f8    n = e+0x73e1; n - 0x3a <= 6 and bit (n - 0x3a) of 0x63 (`tst r2, r1, lsl r0`)
    0xfee118    -> |= 0x38000 (bits 15-17)   ; n in {0x3a, 0x3b, 0x3f, 0x40}
    every other motion: nothing more

Inputs: the motion id; `P+0x3b4` bit 0 (R: set by the sever `0xc2274`, states-em077_00.md 4.4 — the only P+0x3b4
bit his class sets); the action (status 7, number) on L2 M26 / L2 M34 only. No variant, posture or map byte.

**Emulated control** (`<scratchpad>/emu13c.py`, unicorn, real vtable, e+0x13f4 zeroed as setMotion 0x7256c does;
the same harness reproduced Bloodbath's six published words from em007_04-list9-census.md 1.1 first):

| case | word |
|---|---|
| L2 M3, intact, calm | `0x1ff` |
| L2 M3, severed, calm / enraged / tired | `0x1c011f` / `0x1c0e1f` / `0x1c701f` |
| L2 M34 (7,0x3a) / (7,0x3b) / (7,0x3f) / (7,0x40) | `0x381ff` |
| L2 M34 (7,0x3c..0x3e) / (7,0x39) / (7,0x41) | `0x1ff` |
| L2 M26 (7,0x3a) | `0x381ff`; severed + enraged + (7,0x40) `0x1f8e1f` |
| L2 M26 status 6 | `0x1ff` |
| L2 M33 (7,0x3a) | `0x1ff` |
| P+0x3b4 = 2 / 3 | `0x1ff` / `0x1c011f` (bit 0 only) |

**For psl-mask.js CLASS_MASK (shape as em007_04: an arm that clears returns `{ set, clear }`):**

    function em077_00(motion, action, state){
      const sev = !!state.severed;                       // P+0x3b4 bit 0: the tail sever (render: SHELL_TAIL / S_TAIL)
      const n = action && action[0] === 7 ? action[1] : -1;
      const act = (motion === 0x222 || motion === 0x21a) && n >= 0x3a && n <= 0x40 && ((0x63 >> (n - 0x3a)) & 1) ? 0x38000 : 0;
      return sev ? { set: 0x1c0000 | act, clear: 0xe0 } : act;
    }

Order note (R): the sever arm runs first (clear 5-7, set 18-20), the action arm ORs after; nothing clears bits 15-17,
so `{ set, clear: 0xe0 }` applied as OR-then-clear gives the same word.

The viewer can supply: `state.severed` (the tail sever is already a viewer state — CUT_TAIL.em077_00, motion-states
`'3|Motion[15]'` S_TAIL); the action for L2 M26 / L2 M34 needs CLIP_ACTIONS entries naming which group-7 numbers play
those clips — **NR** (which of 0x3a/0x3b/0x3f/0x40 play L2 M26 vs L2 M34 was not traced before the pause).
**[RESOLVED 2026-10-16: R — §4. (7, 0x3a) / (7, 0x3b) play L2 M25 -> L2 M26; (7, 0x3f) / (7, 0x40) play L2 M70 -> L2 M34,
followed into from the L2 M26 dive at its frame 80. NOTE: `state.severed` is NOT yet a viewer input for him — there is no
`SHELL_TAIL.em077_00`, and his two severed sets need a two-part test (§6).]**

**Not done before the pause:** the whole-block plan diff (add_effects plan with em077_00 in psl_mask_monsters) per
binding, so the record list below is the survey's, mapped to the arms by bit number only: **[RESOLVED 2026-10-16: the plan
was run — §5; the table below stands, R.]**

| survey binding (outside file mask) | arm that turns it on |
|---|---|
| L1 M17 b0 (c 21) | base, always |
| L2 M3 b6, L2 M4 b6, L2 M20 b6 (u 200, u 201, u 230) | base calm group — **but cleared when severed** |
| L2 M4 b9, L2 M20 b9 (u 201, u 230) | base enraged group |
| L2 M3 b18, L2 M4 b18 (u 202, u 203) | sever arm (tail severed) |
| L2 M34 b15 (u 234) | action arm, (7, 0x3a/0x3b/0x3f/0x40) |

The sever arm also switches OFF any in-mask binding on bits 5, 6, 7 while severed — not yet listed per motion (NR).
**[RESOLVED 2026-10-16: R — there is none. The whole blocks name no binding on bit 5 or bit 7 anywhere, and every bit-6
binding (L2 M3 u 200, L2 M4 u 201, L2 M20 u 230) is outside the file mask; those three are the only bindings the clear
removes (§5).]**

## 2. c 30 (em077_00c UNIQUE 30, cm200_040) — the shell — partly R

* Carrier (R): `effects_triage.py em077_00` names `c UNIQUE 30 cm200_040: shells: shell01 mode 0` (and c 32 on mode 1).
* Shell (R): global id **0x13c** (registered by vt+0x158 `0xfda0c4` -> `0x48b71c`, with 0x13d / 0x13e). Table
  `0x175c3e8[0x13c]` at `0x175d2b8` = {`uShellEm077_sp_01` DTI `0x188d2a8`, **`cSetupParamEmBase01`** DTI `0x18859e8`,
  res `0x8a8f`} -> **base01** (the DTI parent says Base37: the mapped trap, not the base).
* Vtable (R): `0x17e9010` (getDTI `0xfeecdc`), 92 slots to the next vtable `0x17e9180`; slot-for-slot against
  uShellEm037_sp_01 (`0x17bd584`, stated base01 in shells.js) only **+0x4 `0xfeeccc`, +0x14 `0xfeecdc`, +0x14c the
  reader `0xfeeb98`** differ. So shells.js needs **no new base**: base01 plus this class's reader (`0xfeeb98`, NR —
  compare it to Nargacuga's `0xe597e4` before reusing that layout). **[RESOLVED 2026-10-16: R, read whole — §7. It is NOT
  Nargacuga's layout (that one reads a timer float); it is Malfestio's `0xffd644` map plus ef 1.]**
* Spawners (R, static): 12 sites set setup +4 = 0x13c in the frame handler `0xfddfcc`'s motion switch (`0xb0944`):
  **mode 0** at `0xfde204`, `0xfde59c`, `0xfde660`, `0xfde730`, `0xfde954`; mode 1 at `0xfde3d8`, `0xfde7e0`,
  `0xfde89c`, `0xfdea04`, `0xfdeae8`, `0xfdeba4`, `0xfdec98`. Three mode-0 sites are gated on the byte
  **`[e+0xcac0]+0x80` != 0** (`0xfde1d4`, `0xfde56c`, `0xfde630`), the first also on `0x6fe88(e, 4, 0x15) == 0`; the
  others on `0xb09a4` frame tests.
* Emulated (`<scratchpad>/frameprobe.py`, the handler frame by frame, frame queries real, other calls stubbed 0):
  with `[e+0xcac0]+0x80 = 1`, **L1 M1, L1 M2, L1 M12, L1 M13 create shell 0x13c mode 0 EVERY frame**; with it 0,
  none. **Limit:** 21 motion ids (0x005, 0x00b, 0x00c, 0x018, 0x01b, 0x01e, 0x030, 0x031, 0x104, 0x105, 0x113, 0x114,
  0x11d, 0x120, 0x122, 0x13e, 0x21d, 0x230, 0x30b, 0x311, 0x312) fault at `0x72750` (`vseleq`, an ARMv8 VFP op the
  unicorn build does not run) — their frame-tested sites, including the other mode-0 sites, are **NR** by the probe.
* **NR:** what `[e+0xcac0]+0x80` is (who writes it), and the per-frame mode-0 cadence beyond "every frame the byte
  is set" — if real, c 30 is a continuous (flight / hover) effect, not a one-shot.
  **[RESOLVED 2026-10-16: R — §7.2. `ctl+0x80` is a one-frame pulse every 100.0 of a free-running clock (vt+0x1dc
  `0xfdae58`), so c 30 comes once per ~100 frames in L1 M1 / M2 / M12 / M13, not every frame; the 21 faulted motions
  are read (static, and three re-emulated with the ARMv8 model): L1 M4 f2 / L1 M20 f52 mode 0, seven mode-1 sites (L1 M5 / M19 / M29 / M32 / M34 / M62, L0 M24 / M27 / M30).]**

## 3. Not started before the pause

Per-record answers for u 200 / 201 / 202 / 203 / 230 / 234 (files and buildability from the survey: cm202_002 ×4,
em077_00_000 ×2), the remaining frame-tested spawn sites, and the "what to implement, in order" list.
**[RESOLVED 2026-10-16: §5 (records), §7.3 (the spawn sites), §9 (the list).]**

## 4. Who plays L2 M26 and L2 M34 — R

Action main vt+0x1f4 `0xfdb030`; status 7 `0xfdca44` (`ldrb n; cmp #0x40`, table `0xfdca70`). (`<scratchpad>/ng/jt.py`
printed this table with a bias of 8: it took the handler's `sub sp, sp, #8` for an index bias — subtract 8 from its
numbers. Named so it is not trusted for a handler that opens with a stack adjust.) First motions by
`efx/agents/notice-scratch/probe.py`; the phases by hand.

* **L2 M25 -> L2 M26** — body `0xfe0e8c(e, r1, r2, r3, [sp] = 5)`: phase 0 L2 M25 (`0xfe0ef8`), at its end phase 2
  L2 M26 (`0xfe1064`, posture 3), unconditionally. Status-7 callers: **(7, 0)** (`0xfdcb74`: r2 1, r3 0), **(7, 3)** and
  **(7, 0x38)** (`0xfdcb84`: r2 0), **(7, 0x3a)** (`0xfdcb74`), **(7, 0x3b)** (`0xfdcf60`: r2 1, r3 1). Also a status-1
  caller (`0xfdb454`, r1 1) — status 1, so the word's action arm is off for it.
* **L2 M33 -> L2 M34** — body `0xfe9a5c(e, 5)`: phase 0 L2 M33, at its end L2 M34 (`0xfe9d70`). Callers **(7, 8)** and
  **(7, 0x39)** (`0xfdcba8`).
* **L2 M70 -> L2 M34** — body `0xfeb7c8(e, r1, 5)`: phase 0 L2 M70, at its end L2 M34 (`0xfebaec`). Callers **(7, 0x3e)** /
  **(7, 0x3f)** (`0xfdcbbc`, r1 0) and **(7, 0x40)** (`0xfdcfa4`, r1 1).
* **Who issues them.** Command streams (em077_00_cmdtbl, op 0x00): (7, 0) g1 s0; (7, 3) g1 s5 / s6 / s131 / s132;
  (7, 8) g0 s23, g1 s5 / s6 / s131 / s132; **(7, 0x3a) g1 s47, (7, 0x3b) g1 s54** (`14 1e | 1d 00 00 40 | 1d 02 | 14 17 |
  1d ff | 00 07 3a`). The remap vt+0x1fc `0xfda310` (status-7 table `0xfda59c`, n - 3) makes (7, 3) -> (7, 0x38) and
  (7, 8) -> (7, 0x39) at quest rank `0x3a8430` >= 5; it writes none of 0x3a / 0x3b / 0x3e / 0x3f / 0x40.
  **(7, 0x3f) / (7, 0x40) are class follows from the dive body**: in `0xfe0e8c`'s phase 2, when r2 != 0 and L2 M26
  reaches frame **80.0** (`0xb0968(e, 1, 0)` at `0xfe1564`, s0 literal `0xfe165c`), `0x768c8(e, 7, r3 == 1 ? 0x40 :
  0x3f)` (`0xfe160c..0xfe1620`) — unless the 5th argument is 4, which takes (7, 0x3e) (`0xfe1574..0xfe1588`); every
  caller passes 5. So: **(7, 0) and (7, 0x3a) are followed by (7, 0x3f), (7, 0x3b) by (7, 0x40)**; (7, 3) / (7, 0x38)
  (r2 0) have no follow. Nothing found issues (7, 0x3e) (no stream; the `0xfe1580` arm needs a 5th argument 4 no caller
  passes).

So with the word (§1): **L2 M26 fires bits 15-17 (u 233, in the mask) on (7, 0x3a) / (7, 0x3b) only** — not on (7, 0) /
(7, 3) / (7, 0x38) — and **L2 M34 fires them (u 234) on (7, 0x3f) / (7, 0x40)** — the landing after a (7, 0) / 0x3a /
0x3b dive — not on (7, 8) / (7, 0x39).

## 5. What the word changes — whole-block plan (139 file-mask bindings -> 148 whole-block) — R

`<scratchpad>/bw1/planrows.py em077_00 [--whole]` (outputs `<scratchpad>/bs/em077_00_{file,whole}.txt`). Every binding not
listed is on bits 0-4 and stays always-on. No binding sits on bit 5 or bit 7; none on bits 10-14 or 16-17, 19-31.

**Turned ON** (outside the file mask today):

| binding | record | export | game |
|---|---|---|---|
| L1 M17 b0 f19, f98 | c 21 (`cm202_021`) | exported | always |
| L2 M3 b6 f57 | u 200 (`cm202_002`, joint 143) | **NOT** | calm (not tired), tail ON |
| L2 M3 b18 f57 | u 202 (`cm202_002`, joint 143) | **NOT** | tail CUT, any state |
| L2 M4 b6 f57 | u 201 (`cm202_002`, joint 143) | **NOT** | calm, tail ON |
| L2 M4 b9 f57 | u 201 | **NOT** | enraged, tail on or cut |
| L2 M4 b18 f57 | u 203 (`cm202_002`, joint 143) | **NOT** | tail CUT |
| L2 M20 b6 f53-72, f84-105 | u 230 (`em077_00_000`, joint 145) | **NOT** | calm, tail ON |
| L2 M20 b9 f53-72, f84-105 | u 230 | **NOT** | enraged |
| L2 M34 b15 f70-84 | u 234 (`em077_00_000`, joint 18) | **NOT** | (7, 0x3f) / (7, 0x40) only |

**Gated** (in the file mask — fired today on every play):

| binding | record | game |
|---|---|---|
| L2 M20 b18 f53-72, f84-105 | u 231 (`em077_00_000`) | tail CUT only |
| L2 M26 b15 f67-81 | u 233 (`em077_00_000`) | (7, 0x3a) / (7, 0x3b) only |

So the word turns on 9 bindings (7 of them need records exported: u 200 / 201 / 202 / 203 / 230 / 234), gates 2, and its
sever clear (bits 5-7) removes exactly the three bit-6 bindings above while the tail is cut. Tired (bits 12-14) names
nothing of his, so a tired, intact L2 M3 / M4 / M20 fires none of these. (Joints from `efx/effects_triage.py em077_00`.)

## 6. The transcription, checked against the ROM — R (emulated)

`<scratchpad>/bs/jscheck.py` (with Barioth's; control Ukanlos `0x381ff` / `0x1c01ff`): §1's `em077_00` ported line for line
against `0xfee088` over 12 motions (L0 M1, L1 M1, L2 M3 / M4 / M20 / M25 / M26 / M33 / M34 / M35 / M70, L3 M15) x status
0 / 1 / 6 / 7 / 13 x number 0..0x47 x P+0x3b4 0..3 x rage x tired: **69120 runs, 0 mismatches.** §1's function is the
one to paste, with this header:

    // SEREGIOS (em077_00), uEm077_00 vtable +0x13c = 0xfee088 (vtable 0x17e7c08; +0xf0 the base 0xca52c), READ whole
    // (0xfee088..0xfee128) and emulated -- 69120 runs against the ROM, 0 mismatches (dev/em077_00-effects-spec.md 1, 6).
    // 0xca170 first, then:
    //   * EVERY motion: vt+0x370(e, 1) = 0xa3bf4, P+0x3b4 bit 0 -- the tail cut (0xc2274 at 0xfdae24) -- CLEARS bits 5-7
    //     and ORs 18-20: u 200 / 201 / 230 (b6, calm) go, u 202 / 203 / 231 (b18) come; the enraged b9 forms stay;
    //   * L2 M26 (0x21a) / L2 M34 (0x222), status 7, number 0x3a / 0x3b / 0x3f / 0x40 (0x63 over n - 0x3a) -> bits 15-17:
    //     u 233 on the (7, 0x3a) / (7, 0x3b) dives, u 234 on the (7, 0x3f) / (7, 0x40) landings that follow them.
    // A clearing arm returns { set, clear }, as Bloodbath's.

**`state.severed` for him (a viewer gap, R by the files):** SHELL_TAIL has no em077_00 entry, and one part cannot carry
it: his sever row S_TAIL `{ calm: [[4], [24]], enraged: [[16], [28]] }` lands on set 24 (scales flat) or set 28 (erect),
and monsters.json em077_00 draws **part 16 only on set 24** and **part 18 only on set 28** (part 20 is drawn on 16 and
28, so not it). So `severed = drawn(16) || drawn(18)`: either `SHELL_TAIL.em077_00 = { severed: [16, 18] }` with
`shellTailInput` taking any of a list, or the sever row's own state — the Viewer agent's choice. (The class's part pass
`0xfdf644` choosing 24 / 28 on the sever bit is states-em077_00.md's reading, I here.)

## 7. c 30 — the shell, its reader and its cadence — R

### 7.1 The reader `0xfeeb98` (uShellEm077_sp_01 vtable `0x17e9010` +0x14c), READ whole `0xfeeb98..0xfeecc8` (the pop)

    getEffect(0) -> +0x15c8          getEffect(1) -> +0x15cc          (0x4a22f0)
    accA(hit, 0) -> +0x15d8          (0x4a23f4)
    flags +0x15ec, each bit cleared (bfc) then set (orrne) from getInt(i, default -1) != -1 (0x4a2470), over the ctor's 0:
      bit 2 (0x4) = int 2     bit 3 (0x8) = int 3     bit 7 (0x80) = int 0     bit 11 (0x800) = int 1     bit 12 (0x1000) = int 4
    accVec(0) -> +0x1608             (0x4a2584)

Nothing else: the joint +0x15e4 stays base01's -1, the timer +0x15f0 its 0 (so each shell lives while its hit slot is
on — move011's T <= 0 arm), +0x15f4 / +0x15f8 500.0, +0x15fc 1.0, +0x1604 900.0, +0x160c the zero vector (base01 ctor
`0x3fa2f8`, rom-map). It is **Malfestio's `0xffd644` map exactly** (params079s01: 0x80 = int 0, 0x800 = int 1, 4 = int 2,
8 = int 3, 0x1000 = int 4, vec 0) **plus getEffect(1) -> +0x15cc**, which base01's init starts beside +0x15c8
(`0x3fad08..0x3fadf8`). Not Nargacuga's `0xe597e4` (that one reads a timer float).

    // SEREGIOS's sp_01 reader 0xfeeb98 (uShellEm077_sp_01; READ whole 0xfeeb98..0xfeecc8, dev/em077_00-effects-spec.md 7):
    // Malfestio's 0xffd644 map -- 0x80 = int 0, 0x800 = int 1, 0x4 = int 2, 0x8 = int 3, 0x1000 = int 4 (bfc / orrne over the
    // ctor's 0), accA(hit, 0) -> +0x15d8, vec 0 -> +0x1608 -- plus getEffect(1) -> +0x15cc, which base01's init starts beside
    // +0x15c8. Joint, timer, reaches: the ctor's. His modes 0 / 1: ints [0, -1, -1, -1, 0] -> 0x1080.
    function params077s01(sh){
      const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
      const flags = (I(0) !== -1 ? 0x80 : 0) | (I(1) !== -1 ? 0x800 : 0) | (I(2) !== -1 ? 4 : 0) | (I(3) !== -1 ? 8 : 0) | (I(4) !== -1 ? 0x1000 : 0);
      const why = !sh ? 'uShellEm077_sp_01: a mode SHELL_DATA does not carry' : null;
      return { flags, joint: -1, timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: V(0),
               up: f(500.0), down: f(500.0), maxH: f(900.0), why, efAt: { 0x15c8: 0, 0x15cc: 1, 0x15d0: null } };
    }
    // READERS01 += { 0xfeeb98: params077s01 }

(`I(i)` past the file's end: -1, as params079s01's — the getter's default r2 = -1 at every call, `mvn r2, #0`.)

### 7.2 The shell data (em077_00.arc, R: `efx/shellef.py` load_typed + `rathian-shell-scratch/shlparse.py`)

Global id **0x13c**, `uShellEm077_sp_01`, base **base01** (setup `cSetupParamEmBase01`), folder
`shell\em\em077_00_shell01`, .shl `em077_00_01`: ShellInfoList 2 entries, EffectLists[0] = `effect\pel\em\em077_00c`, **no
ShellCmnParam** (one resource at the .shl path).

    shell01: { id: 0x13c, cls: 'uShellEm077_sp_01', base: 'base01', reader: 0xfeeb98, folder: 'shell\\em\\em077_00_shell01',
      lists: { 0: { list: 'c', pel: 'em077_00c' } },
      modes: {
        0: { scale: 1.0, ef: [[0, 30], [999, -1]], hit: [0], sh: { ints: [0, -1, -1, -1, 0], floats: [], vecs: [[0, 0, 100]] } },
        1: { scale: 1.0, ef: [[0, 32], [999, -1]], hit: [1], sh: { ints: [0, -1, -1, -1, 0], floats: [], vecs: [[0, 0, 0]] } },
      },
      hitdata: [[14, 10], [14, 10]] },

ef 1 is (999, -1) on both — refused at the init (`0x4a11e4`, listId > 7), so each mode starts its ef 0 only: **mode 0 =
c 30, mode 1 = c 32** (both `cm200_040`). Flags 0x1080 on both (0x80: init011's owner-ground arm; 0x1000 the hit side's,
as Malfestio's modes 0 / 1 / 2). hitdata (`em077_00_01_hitdata`, HDS v`0x20160209`, 2 entries): word 0 of each 0x38-byte
entry = `0x000a000e` -> (14, 10), the same halves Malfestio's `0x00080000` -> (0, 8) gives his.

### 7.3 Who spawns it, when — R

The frame handler vt+0x208 `0xfddfcc` (called from the +0x28 pass `0xae370`, `0xae774`) switches on the motion; its list-1
table (`0xfde0bc`, motion - 0x101 <= 0x3d) sends:

| motion | gate | mode | record |
|---|---|---|---|
| L1 M12, L1 M13 (`0xfde1b4`) | action not (4, 0x15) (`0x6fe88`) and `ctl+0x80` | 0 | c 30 |
| L1 M1 (`0xfde564`) | `ctl+0x80` | 0 | c 30 |
| L1 M2 (`0xfde610`) | action not (4, 0x15) and `ctl+0x80` | 0 | c 30 |
| L1 M4 (`0xfde6ec`) | frame crosses 2.0 | 0 | c 30 |
| L1 M20 (`0xfde910`) | frame crosses 52.0 | 0 | c 30 |
| L1 M5 (`0xfde79c`) | frame crosses 46.0 | 1 | c 32 |
| L1 M19 / M29 / M32 / M34 (`0xfde858` / `0xfde9c0` / `0xfdeaa4` / `0xfdeb60`) | frame crosses 2.0 | 1 | c 32 |
| L1 M62 (`0xfdec54`) | frame crosses 4.0 | 1 | c 32 |
| L0 M24 / M27 / M30 (`0xfde394`, the list-0 table `0xfde2e0`, motion - 5 <= 0x2c) | frame crosses 2.0 | 1 | c 32 |

These are all twelve sites: the handler `0xfddfcc..0xfdf498` holds exactly twelve `#0x13c` immediates (the band's
thirteenth, `0xfda0d0`, is the vt+0x158 registration).

(The frame gates are `0xb09a4(e, 0, 0)`, the frame in **s0** (trap 21); mode 0 of `0x72714` is the crossing test
`0x7294c`.) The request (`0xfde1f4..0xfde6e8`): +4 id 0x13c, +8 mode, +0xc the owner, **+0x10..+0x18 = P+0x40 / +0x44
/ +0x48** (the monster's position), +0x1c / +0x2c 0, +0x20..+0x28 the shared empty vec (GOT `0x1831a78` -> `0x19176b0`),
**+0x30..+0x38 = P+0x50 / +0x54 / +0x58**, +0x3c = 0xffff; created through `0xfdf3e0`.
Emulated control (`<scratchpad>/bs/frameprobe2.py` = frameprobe.py with the ARMv8 model and a zero .dtp block, `ctl+0x80`
0): L1 M4 shell 0x13c mode 0 at f2, L1 M20 mode 0 at f52, L1 M5 mode 1 at f46 — the static table (2.5 min for 61 frames
x 3 motions: the rest of the 21 the first probe lost are read statically only — L1 M19 / M29 / M32 / M34 / M62 and L0 M24
/ M27 / M30 above; the other ten (L0 M5 / M11 / M12 / M48 / M49, L2 M29 / M48, L3 M11 / M17 / M18) have no 0x13c site).

**`ctl+0x80`** (`ctl` = `[e+0xcac0]` = P+0x60, states-em077_00.md 1): written only at `0xfda194` (the per-reset init
vt+0x1d8, 0) and in vt+0x1dc `0xfdae58` — called every frame from the +0x24 pass's running frame `0xada80` (`0xaddc8`),
BEFORE the +0x28 pass that runs the frame handler: `ctl+0x80 = 0` (`0xfdaf64`); `ctl+0x54 += [e+0x1c] x 1.0` (`0x7264c`
-> `0x539d48`); if `ctl+0x54 >= 100.0` (literal `0xfdb02c`): `ctl+0x54 = 0`, `ctl+0x80 = 1` (`0xfdaf9c`). So it is a
**one-frame pulse every 100.0 of a free-running clock** that no motion resets, and L1 M1 / M2 / M12 / M13 make one c 30 on
each pulse that falls inside them — about one per 100 frames, at a phase the motion does not choose. (`[e+0x1c]` as the
per-frame step, 1.0 at normal speed: I.) What L1 M1 / M2 / M12 / M13 are (flight idles / hovers by their sites' company)
is I.

**For the viewer**: a base01 shell entry as 7.2 with the reader 7.1, plus per-motion spawns — mode 0 at the crossing
frames on L1 M4 / L1 M20, mode 1 on the seven crossing rows, and on L1 M1 / M2 / M12 / M13 a mode-0 spawn every 100 frames
of a clock running since the reset (the viewer has no such clock; one at the clip's start frame 0 and every 100 after is
the honest stand-in — name it). c 32 must be exported first (§8).

## 8. Records to export, and the other gaps — R

* **PSL (`add_effects.py --apply` exports them once the word lists him):** u 200, u 201, u 202, u 203 (`cm202_002`,
  joint 143), u 230 (`em077_00_000`, joint 145), u 234 (`em077_00_000`, joint 18).
* **Shell:** **c 32** UNIQUE (`cm200_040`, shell01 mode 1) — NOT exported (`docs/effects/em077_00.json` has c 30
  UNIQUE `when: 'shell'` and no c 32); export it as a `when: 'shell'` record with the shell entry.
* **CUT_TAIL.em077_00 has joint 144 — it should be 145. R:** his one sever, `0xfdae24 bl 0xc2274` under `cmp r0, #7`
  (part 7, `0xfdae04`), passes **`mov r3, #0x91`** (`0xfdae18`) = option +0x1477 = the drop joint 145 (`0xc22f8`, the
  Barioth / Barroth correction); 144 is u 900's joint (states-em077_00.md 0). This closes the rom-map sevscan row's
  "em077_00 carries u 900's joint" lead (I -> R).
* **Not in this spec's lane, named:** his other two shells, **0x13d shell27** (u 0, `em077_00_005`) and **0x13e shell28**
  (u 30 / 31 / 32 / 40 / 41 / 42, the bladescales) have no shells.js entry either; c 31 UNIQUE (`cm200_040`) has no
  carrier found ("nothing found", effects_triage); c 12 / c 13 SEQUENCE are named by no PSL bit. Not read here (NR).

## 9. What to implement, in order

1. psl-mask.js: `CLASS_MASK.em077_00` as §1 (header §6); `'em077_00'` into `PSL_MASK_MONSTERS`; CLIP_ACTIONS:

       // SEREGIOS (dev/em077_00-effects-spec.md 4). L2 M26 is the dive after L2 M25: (7, 0x3a) (g1 s47) and (7, 0x3b) (g1 s54)
       // fire u 233, (7, 0) / (7, 3) / (7, 0x38) do not. L2 M34 is the landing: after (7, 0) / (7, 0x3a) the dive body follows
       // into (7, 0x3f), after (7, 0x3b) into (7, 0x40), at L2 M26 f80 -- L2 M70 -> L2 M34 with u 234; (7, 8) / (7, 0x39) play
       // L2 M33 -> L2 M34 without it.
       em077_00: {
         '2|Motion[26]': [{ action: [7, 0x3a] }, { action: [7, 0x3b] }, { action: [7, 0x03] }],
         '2|Motion[34]': [{ action: [7, 0x3f] }, { action: [7, 0x40] }, { action: [7, 0x08] }],
       },

   REQUIRED: with no action u 233 never fires once he is listed (it fires today on every play).
2. `state.severed` for him (§6): the two-part test over parts 16 / 18.
3. `add_effects.py em077_00 --apply` (exports u 200 / 201 / 202 / 203 / 230 / 234 and adds the nine bindings), `--record`,
   `--check`. Recorder slot — announce.
4. tail-option.js: `CUT_TAIL.em077_00.joint` 144 -> **145** (§8).
5. shells.js: `params077s01` + `READERS01[0xfeeb98]`, the `shell01` entry of 7.2 under SHELL_DATA em077_00, the spawns of
   7.3; export c 32 (`when: 'shell'`); record the shell sets.
6. Soak `--viewer-inputs`; Raven verifies: L2 M3 / M4 / M20 sparks by state and sever, u 233 / u 234 on the 0x3a / 0x3b
   dive and its landing, c 30 / c 32 in flight.

NOT READ, by name: `[e+0x1c]` as the frame step (I); the meaning of L1 M1 / M2 / M12 / M13 and of action (4, 0x15) that
silences two of them; who issues (7, 0x3e) (nothing found); the part pass's choice of set 24 / 28 on the sever bit (I from
the note); shells 0x13d / 0x13e and c 31.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **`[e+0x1c]` -- READ**: sUnit's line pass `0xc044c4` writes it before each unit's move as the frame step `[[0x211f764]+0x68]` times
  the line's rate (+0x30). The c 30 clock (`ctl+0x54 += [e+0x1c]`) therefore runs in frames at normal speed (the line rate's value:
  I 1.0).
* **L1 M1 / M2 / M12 / M13 and (4, 0x15) -- READ**: (4, 0x15), (4, 4) and (4, 0x1c) are his aerial TURNS (table `0x16a190c`: L1 M2
  straight, L1 M12 / L1 M13 the sides). L1 M1 is the hover ((0, 3), (4, 3) / (4, 0x19), the status-3 flight moves), L1 M2 also the
  hover idle (0, 6) and the end of his air attacks. So the c 30 table's "not (4, 0x15)" silences the pulse on one of three aerial
  turns; the viewer's plays of L1 M12 / M13 / M2 stand for (4, 4) / (4, 0x1c), which keep it. No change.
* **(7, 0x3e) -- named, controlled**: no stream issues it and no action follows into it (the census finds the (7, 0x3f) / (7, 0x40)
  follows at `0xfe1620`, the control).
* **Set 24 / 28 -- READ** (`0xfdf7b4..0xfdf930`): calm 24, enraged 28, each when vt+0x370(e, 1) -- P+0x3b4 bit 0, the sever -- else
  4 / 16. The section-6 I is R; `severed = drawn(16) || drawn(18)` stands.
