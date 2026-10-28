# Zinogre (em057_00) / Thunderlord Zinogre (em057_04) -- effects spec (Fanged Wyvern effects agent, 2026-10-17)

Raven, 2026-10-17: "resume checking groups again ... for their effects implementations". One class, `uEm057_00`, vtable
`0x17ca8ec` (getDTI `0xf02f7c` once in main.data -- no `uEm057_04`; Thunderlord is the variant byte `e+0xb5f5 == 4`).
Starting point: dev/remaining-classes-effects-survey.md (rows 1-2, Fanged Wyvern). `R` = READ (consuming instruction
read), `I` = INFERRED, `NR` = NOT READ. Scratch (session-local): `<archive>/zg/` -- `word.asm` (the method),
`jscheck057.py` (unicorn vs the transcription), `trace.py` / `allact.py` / `disch.py` / `hook204.py` (action tracer),
`bindtable.mjs` (every binding against the live word), `plan_<mon>_{file,whole}.txt`.

## 1. The PSL enable word -- uEm057_00 vt+0x13c = `0xf0279c` -- R, read whole and emulated

Extent `0xf0279c..0xf02e90` (the last instruction `b 0xf02b30`; literals `0xf02e94..0xf02e9c` are the three PIC offsets
the `ldr r0, [pc, #..]` at `0xf028e0` / `0xf02934` / `0xf02b38` load; `0xf02ea0` is the next function, vt+0x010).
Two jump tables, decoded: variant 4 `0xf027e4` (`cmp #0x3e`, motion - 0x201), variant 0 `0xf029d4` (`cmp #0x26`).

    0xf027a8  bl 0xca170                     ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0xf027b4  e+0xb5f5 == 4 ? THUNDERLORD (0xf027bc) : ZINOGRE (0xf0291c)

**ZINOGRE** (every variant but 4):

    motion > 0x30c:  0x30d (L3 M13) / 0x315 (L3 M21): status 11 and e+0xcb14 != 0          -> |= 0xe00000   (21-23)
                     0x314 (L3 M20): status 1, n - 9 <= 0x1d and bit of 0x22000001 (n 9 / 0x22 / 0x26) -> |= 0x8000
    0x23a..0x23f (L2 M58..M63): 0x3a8430 >= 5                                               -> |= 0xc0000000 (30-31)
    0x14 (L0 M20): status 7, n - 0x5e <= 0x15 and bit of 0x380001 (n 0x5e / 0x71 / 0x72 / 0x73)
                     -> word & 0xffe3f03f | 0x1c0000   (bits 6-11 CLEARED, 18-20 set)
    0x18 (L0 M24): 0x6fe88(e, 1, 4) ? |= 0x7000000 (24-26) : (0x6fe88(e, 1, 0x15) CALLED, RESULT NEVER READ) |= 0x1c0000
    then 0xf02960: 0x816d4 (P+0x5df3, CHARGED) == 0 -> return. Charged:
      e+0xb5f8 == 9: motion in 0x201 / 0x202 / 0x228 / 0x229 / 0x22b / 0x22c (0xf02980..0xf029a0) -> |= 0xc0000000
      else table 0xf029d4: 0x201 0x202 0x20f 0x212 0x219 0x21a 0x225 0x226 0x227                 -> |= 0x38000000 (27-29)

**THUNDERLORD** (variant 4), every arm then reaching the tail `0xf02b38`:

    0x30d / 0x315: status 11 -> |= e+0xcb14 ? 0xe00000 : 0x7000000      0x314: as Zinogre's (bit 15)
    table 0xf027e4:
      0x23a..0x23f (0xf028e0): rank >= 5 -> |= charged ? 0x38000000 : 0xe00000
      0x20f 0x212 0x219 0x21a 0x225 0x226 0x227 (0xf028f8): |= charged ? 0x38000000 : 0xe00000
      0x228 0x229 0x22b 0x22c (0xf02b10): |= charged ? 0xc0000000 : 0x400000
      0x201 0x202 (0xf02c9c): e+0xb5f8 == 9 -> bfc bit 6; then status 7 (`[r5+0x5fec]`, r5 = e+0x13f4: e+0x73e0) and
                    n - 0xfb <= 1 -> |= charged ? 0xc0000000 : 0x400000.  b5f8 != 9 (0xf02d9c): charged ? bfc 6 and
                    |= 0x38000000 : |= 0x40
      0x218 (L2 M24, 0xf02d20): not charged -> word & 0xff1ffffe | 0xe00000 (bit 0 CLEARED, 21-23 set)
      every other 0x201..0x23f: nothing
    0x14 (0xf02dc8): status 7, n in 0x5e / 0x71..0x73 -> bfc 6-11; |= charged ? 0x1c0000 : 0x38000000
    0x18 (0xf02bcc): (1, 4) -> 24-26; (1, 0x15) -> 18-20; else charged ? 0x1c0000 : 0x38000000
    TAIL 0xf02b38: rank >= 5 -> bfc 9, 3 -- THE ENRAGED GROUP IS CLEARED ON EVERY MOTION AT G

Inputs: the motion; the variant `e+0xb5f5`; the action `e+0x73e0 / +0x73e1` (directly, through `[r5+0x5fec]` with r5 =
e+0x13f4, and through `0x6fe88`); `0x816d4` = `[e+0x1428]+0x5df3` (the CHARGED byte, states-em057_00.md 5.0); the quest
rank `0x3a8430` (GOT `0x1831c54` -> `0x1883c70`, signed byte `[obj+0xa4]+0xf`, the viewer's 5); `e+0xb5f8` (section 4);
`e+0xcb14` (died charged: set 1 at every status-11 action start while charged, `0xeed0c8`, states note 1.1).

**TRAP (named here, mapped as rom-map trap 16-style): the survey listed `e+0xb720` as an input. There is none.** At
`0xf02ba4` `ldr r0, [r1, r0]!` leaves r1 = e+0x13f4, so `ldrb r2, [r1, #0xb720]` (`0xf02ba8`) reads **e+0xcb14**, and
`[r5+0x5fec]` (`0xf02cc4`) reads **e+0x73e0** the same way (CLAUDE.md 2: track the pointer, not the offset).

## 2. The transcription against the ROM -- R (emulated)

`jscheck057.py`: unicorn, the real vtable, `e+0x13f4` zeroed as setMotion `0x7256c` does, every call native (`0xca170`,
`0x816d4`, `0x6fe88`, `0x3a8430` through its real chain, `0x81670`, `0x81614`). Variants 0 / 4 x 34 motion ids x 28
actions x charged x rage x tired x rank 0 / 1 / 3 / 5 x `e+0xb5f8` 0 / 9 (and 5 on L2 M1 / M2 / M43) x `e+0xcb14`:
**254464 runs, 0 mismatches** -- against the scratch transcription and again against psl-mask.js's own CLASS_MASK
(`LIVE=1`). Controls: the base words come back (0x1ff / 0xe3f / 0x703f on L0 M1); a mutated transcription (the G clear
removed) gives 15840 mismatches of 63616. psl-mask.js `em057(v4)` is the function; its header is the summary of 1.

`state.charged` (index.html playNow): the Charge State rung the part pass draws while P+0x5df3 is up -- Zinogre's
**Fully Charged** (rung 2; `0xef063c` draws g1 on 0x816d4, monster.js em057_00), Thunderlord's **Overcharged** (rung 1;
`0xef0370` draws g19 on it). A death play reads the same rung as `e+0xcb14`. `state.rank` = SHELL_QUEST_RANK (5).

## 3. Who plays the keyed clips -- R (action main `0xf004a8` under unicorn, every phase, follows re-run)

`allact.py` (generic prober, every (1, n) / (7, n), both variants) then `trace.py` (every motion set in every phase,
`e+0xb5f8` and the action at that moment; a follow re-runs the main the same update with the byte kept):

| clip | plays (command streams: em057_00_cmdtbl op 0x00) | word |
|---|---|---|
| L0 M20 | (1, 0x2d) f0 (g0 s19 / s21, g1 s95; follows (1, 4) at its end), (1, 3) / (1, 0x14) f70 (no stream), **(7, 0x71)** (g1 s132, s144..s150) | (7, 0x71) only: Zinogre u 470; Thunderlord charged u 470 / uncharged u 480; u 440's b6 / b9 off |
| L0 M24 | **(1, 4)** f0 (g1 s48 / s58; (1, 0x2d)'s follow), (1, 0x15) f6 (**no stream, no class site**), (7, 0x71) phase 1 (`0xef8694`) | (1, 4) u 500; (7, 0x71) u 471 (Thunderlord uncharged u 481) |
| L2 M1 / M2 | (7, 0xe7 / 0xe9) / (7, 0xe8 / 0xea / 0xf8 f42) (b5f8 0); **(7, 0xfb) / (7, 0xfc) f24** -- follows only | charged: u 211 / 210 (b5f8 0), u 235 / 234 (the follows) |
| L2 M43 / M44 | (7, 0xfa) / (7, 0xf9) (Thunderlord also (7, 0xfe) / (7, 0xfd)); body `0xefd350` writes b5f8 9 | charged u 232 / 233; Thunderlord uncharged u 242 / 243 |
| L3 M20 | (1, 9) (g0 s3, g6 s0 -- the rage roar), (1, 2) (g9 s0), (1, 0x22) (g13 s0), (1, 0x25), (1, 0x26) (g5 s0 / s1) | bit 15 (c 60) on 9 / 0x22 / 0x26 |
| L3 M21 / M13 | status 11 (the deaths) | died charged u 650 / 651; Thunderlord died uncharged u 680 / 681 |

The follow: `0xefd350` phase 1, at L2 M43 / M44's end with `e+0x7420 != 0`, `vt+0x3d0` (`0x6c178` = `b 0x768c8`) with
(7, 0xfc / 0xfb) (`0xefd498..0xefd4bc`: `mvn #3` / `mvn #4`, uxtb); `0x768c8` with `e+0x7420` set calls `0x76098` and sets
`+0x73ea`, which re-runs the action main the same update (rom-map `0xa5af4..0xa5b14`); body `0xefd50c` sets L2 M1
(`0xefd6a8`) / L2 M2 (`0xefd5cc`) from frame 24 (`vmov.f32 s1, #24`). With `e+0x7420 == 0` the follow is parked in
`+0x73e5..7` instead (`0x76930`) and runs a later update, with b5f8 back at 0: what `e+0x7420` is offline is I (the
arm the word gives these follows only makes sense on the same-update path).

psl-mask.js CLIP_ACTIONS `EM057_ACTIONS` (both monsters): L0 M20 [(1, 0x2d), (7, 0x71)], L0 M24 [(1, 4), (7, 0x71)], L2 M1
[(7, 0xe9), (7, 0xfb)], L2 M2 [(7, 0xea), (7, 0xfc)], L2 M43 [(7, 0xfa)], L2 M44 [(7, 0xf9)] (REQUIRED: with no action b5f8
reads 0 and u 232 / 233 never fire), L3 M20 [(1, 9), (1, 2)], L3 M21 [(11, 0)], L3 M13 [(11, 7)].

## 4. `e+0xb5f8` -- a one-frame byte -- R

* Cleared every frame: `0x6f4e8` ends `0x6f584..0x6f58c` `strb #0, [e+0xb5f8]`, called from the +0x28 pass `0xae35c`
  (after vt+0x208 / vt+0x210, `0xae354`). Shared code below the class bands writes it nowhere else (`movw #0xb5f8`:
  `0x6db88` ctor area, `0x6f584`); changeAction `0x76098..0x76800` does not touch it (scan).
* Written by the class (19 sites, `em057_dis.txt`): 1 / 2 / 3 / 4 / 5 / 6-7 by other bodies, **9 by three bodies at their
  entry, every frame**: `0xefa468` ((7, 0x9d..0xa5) -> L2 M58 / M59 / M40 / M41, then L2 M62 / M63), `0xefa834` ((7,
  0xa6..0xa9) -> L2 M60 / M61), `0xefd350` ((7, 0xf9 / 0xfa / 0xfd / 0xfe) -> L2 M43 / M44). (7, 0xaa / 0xab) -> L2 M58 /
  M59 at 9 too (probe).
* So "b5f8 == 9" at a motion start = the motion set inside one of those bodies, or by a same-update follow out of one --
  psl-mask.js derives it from the action (`Z57_NINE`: (7, 0x9d..0xab), (7, 0xf9..0xfe)); `state.b5f8` is a check input.

## 5. The G remap vt+0x1fc `0xeec1a4` -- R (static, `0xeec1a4..0xeec7e8`)

The states note (1, vtable row +0x1fc) read only its first arm ((7, 0xcf) <-> (7, 0xd0) by `0xc7e3c(e, 0)`). The rest:
* **variant 0 at G** (`0xeec220..0xeec288`, table `0xeec264`, n - 0xf9 <= 5): (7, 0xf9 / 0xfd) -> **(7, 0xa2)**, (7, 0xfa /
  0xfe) -> **(7, 0xa3)**, always. So at G Zinogre never plays L2 M43 / M44 (nor their L2 M1 / M2 follows): those plays
  are below-G ones; the viewer shows the clips' own actions (a named stand-in -- the clip is on his list).
* **variant 4 at G** (`0xeec298..`, table `0xeec2dc`, n - 0xe7 <= 0x17): (7, 0xe7 / 0xe8) -> 0x9e / 0x9f; (7, 0xeb / 0xef)
  -> 0xa2, (7, 0xec / 0xf0) -> 0xa3; (7, 0xf9 / 0xfa) -> 0xa2 / 0xa3, (7, 0xfd / 0xfe) -> 0xaa / 0xab -- each when
  `[e+0x73e8] % 100 <` a threshold that is 100 (always) unless charged and calm, then `0x6f62c(e, 0x14 / 0x17)` (enraged:
  0x15 / 0x18, a tune lookup through `[e+0x75e4]` vt+0x44: values NR); (7, 0xe9 / 0xea / 0xed / 0xee / 0xf7) -> 0xa0 / 0xa1 /
  0xa4 / 0xa5 / 0x9c only while charged; (7, 0xf8) -> 0x9d after (7, 0x9c) (`e+0x73e2 / 3`). (7, 0xfb / 0xfc) untouched.
  So uncharged at G his L2 M43 / M44 (and their follows) do not play either.

## 6. What the word changes -- R (`bindtable.mjs`, every whole-block binding at bits >= 6 against the live word)

**Zinogre** -- turned ON (were outside the file mask): u 470 (L0 M20 (7, 0x71)), u 500 (L0 M24 (1, 4)), u 211 / 210
(L2 M1 / M2 charged), u 235 / 234 (L2 M1 / M2 follows, charged), u 260 / 320 / 350 / 410 (L2 M18 / M25 / M26 / M37 / M38 /
M39 charged), u 650 / 651 (deaths, died charged), c 201 / 202 / 290 and u 200 / 201 / 220 / 221 / 440 on b6 / b9 / b12 by
state, u 234 / 235 b31 on L2 M62 / M63. GATED (fired on every play until now): u 471 (L0 M24, (7, 0x71) only), u 260 b27
on L2 M15 (charged), u 232 / 233 (charged L2 M43 / M44), u 650 / 651 (died charged), c 60 (rage roar only), u 220 b9 (enraged).
NOW NEVER: u 235 / 234 b28 on L2 M58 / M59 and b27 on L2 M60..M63 (Thunderlord's forms), u 410 b27 on L2 M42 (0x22a is in
neither table).

**Thunderlord** -- the same records by charge: 21-23 / 22 forms uncharged (u 270 / 300 / 330 / 360 / 420 / 242 / 243 / 245 /
244), 27-31 forms charged (u 260 / 320 / 350 / 410 / 232 / 233 / 235 / 234 / 251 / 250 / 211 / 210); L0 M20 / M24 u 470 / 471
charged, u 480 / 481 uncharged; deaths u 650 / 651 died charged, u 680 / 681 not. NOW NEVER at G: everything on b9 (u 220 /
221, c 202, u 440) and b12 (no tired state), u 234 / 235 b31 on L2 M58..M63 (Zinogre's form), u 410 / 420 on L2 M42.

Bindings that name a key with no record in the monster's pel (not effects): Zinogre's u 242 / 243 / 244 / 245 / 250 / 251 /
270 / 300 / 330 / 360 / 420 / 480 / 481 / 680 / 681 (Thunderlord's pel has them all).

## 7. Records exported (`add_effects.py --apply`, both)

* em057_00 (+15, 85 in all): u 470 500 201 221 211 200 210 320 350 380 560 410, c 201 202 230.
* em057_04 (+25, 98 in all): u 470 480 500 481 201 221 211 200 210 300 330 320 360 350 380 560 420 410 242 243 251 250
  (SEQUENCE, `em057_04_023`; the rage puff's u 250 is the UNIQUE `em057_04_011`), c 201 202 230.
* c 230 (`cm202_020`, L2 M30 b0): the stage-ray record motion-states.js's header called "refused on purpose"; the ray was
  retired 2026-10-07 (stage_ray()), it exports and records now.

## 8. Named, not wired -- with the reason [SUPERSEDED in part by 10: (1, 0x15), u 90 / u 120, u 30, u 42, u 280 and e+0x7420 are READ and wired there; kept as written]

* **(1, 0x15)** (L0 M24 from f6; its own arm in Thunderlord's word): no command stream (`00 01 15` absent) and no class
  follow / change site issues it (scan of `em057_dis.txt`) -- NR who does; not in CLIP_ACTIONS.
* **The class requests u 90 / u 120** (ids 1005 / 1004, `em057_00_002`): READ -- the discharge `0xeecb28` requests id
  1004 (u 120) when status is 11 and the variant 0, else 1005 (u 90) (`0xeecc7c..0xeecce0`, through vt+0x1d0). Its
  callers: the start of (1, 5) (`0xeed3cc`, states note 5.2 -- L0 M25), the status-11 start while charged (`0xeed0e0`),
  the gauge running out while charged (`0xeed658`), and the discharge slams (7, 0xe3) / (7, 0xdb) / (7, 0xe5) (L9 bodies,
  `0xefb04c` / `0xefb814`, right after a shell spawn `0x48b884`; tracer). NOT WIRED: an emulation of the start hook
  (`hook204.py`, every call outside the band stubbed 0) reached `0xeecb28` for variant 0 only and only charged, where the
  note reads one shared case -- the hook's gauge and part inputs need modelling before u 90 goes on L0 M25's start; who
  issues (1, 5) is NR (no stream); the slams' frame is the shell spawn's (shells lane); a death row cannot test the rung. The
  `movw #0x3ed` at `0xef7414` is NOT a request: it is `0x7ded8(e, 0, 0x3ed)`'s hit id (Thunderlord charged, L2 M33).
* **The other `movw` "request sites" of the states note 1.4, read**: id 1010 at `0xef83a0`, 1009 at `0xef8c78` and 1006 at
  `0xefeee8` are NOT requests -- they are hit ids handed to `0x7db70` / `0x7ded8` (the hit-record arms, rom-map `0x7db70`).
  The real ones: **id 1006 (u 42, Thunderlord's pel only) at `0xeed9c4`** -> `0xeeda88`, inside the aura state machine of
  the start hook (`0xeed68c..0xeedaa0`, states note 5.3, whose table is variant 0's: the arm that requests it, NR -- Zinogre's pel has
  no key 42); **id 1009 (u 280, Thunderlord's) at `0xefb2a0`** through vt+0x1d0 inside the L9 slam bodies under a `cmp r0, #1`
  (NR). u 0 (`em057_00_015`) / u 151: no request site -- shell-layer records (shells lane).
* **The calm gauge auras u 30 / u 31**: the gauge tier (EMC) has no viewer control (unchanged, motion-states.js header).
* **The shells** 0xf7 / 0xf8 (variant 0) and 0xf9 / 0xfa / 0xfb (variant 4), 18 spawn sites (`0x48b884`): shell records
  u 0 / 1 / 60 / 61 / 150 (+ Thunderlord's 16) have no SHELL_DATA entry -- NR, the shells lane.
* **The G remap's tune percentages** (`0x6f62c(e, 0x14 / 0x15 / 0x17 / 0x18)`): NR; the viewer plays each clip's own action.

## 9. Implemented (this session)

psl-mask.js: `em057(v4)` + CLASS_MASK em057_00 / em057_04, PSL_MASK_MONSTERS, CLIP_ACTIONS EM057_ACTIONS; index.html:
`charged` into pslMask; add_effects --apply x2, --record (ADD_NO_LIFT=1) x2, one lift from a copy of lift-effects.sh;
dev/checks/em057_00.mjs: the word table (both monsters) and three in-page plays. Results: 207 (em057_00) + 225
(em057_04) sets recorded, 0 failed; lift rc 0; soaks **em057_00 87 motions 0 refused, em057_04 92 / 0**; page check 146
passed / 2 failed -- both the pre-existing L3 M1 BACK cycle (u 1011 at level 2 never reached in the check's rounds; on the
board since 2026-10-15), not the word.

## 10. The charge gauge, the auras, the discharge, (1, 0x15), e+0x7420, the back -- R (second pass, 2026-10-17)

The coordinator: "An open read on a walked monster stops the walk there, so close Zinogre's / Thunderlord's". Scratch
`hook204.py` (rewritten), `trace.py`.

### 10.1 The start hook, emulated again -- now agreeing with the read

vt+0x204 `0xeecd58` is called **(e, status, number)**: the new action is in r1 / r2 (`0xeecd68` / `0xeecd6c`), not read
from e+0x73e0. The first `hook204.py` left r1 / r2 at 0, never entered the status switch, and saw only the gauge-empty
discharge -- that was the "variant 0 only, only charged" disagreement of 8: an instrument fault, not the note's. Rewritten
(r1 / r2 set, ctl+0 the gauge, P+0x5df3 / P+0x518 / the rank chain native, writes and vt+0x1d0 ids logged), every case
agrees with states-em057_00.md 5.2 / 5.3 except one (10.2): (1, 4) -> charge on, gauge 100; (1, 5) -> discharge, u 90,
whatever the flag; status 11 charged -> `e+0xcb14 = 1`, discharge; (1, 3) +50 / (1, 9) +25 / (2, 0x26..0x2a) +20; the gauge
<= 0 at an action start while charged -> discharge.

### 10.2 The gauge -- R

`ctl+0` = `[e+0xcac0]+0` (s16, 0..100). Income at the action start: (1, 3) +50 (`0xeed208`), (1, 9) the rage roar +25
(`0xeed3d8`), (2, 0x26 / 0x27 / 0x29 / 0x2a) +20 capped 99 (`0xeeceec`), (2, 0x28) +20 (`0xeed128`); the charge-up `0xeec02c`
sets 100. No per-frame fill or drain (scan of every `strh` to `[ctl]` in the band: `0xeeb9a8` reset, `0xeecae4`, `0xeecba4`
the discharge, the hook's five, `0xeefff0` the op-0x6f callback, `0xeedfe8` the attack cost). Depletion, charged only, at the
action start:
* the action's cost `sb` (`0xeed5dc..0xeed62c`): the hunter-hit reactions (1, 0x1c..0x1e) by part {-30, -15, -50, -30, -30,
  -30, -30}, (1, 6 / 0xf / 0x10 / 0x1f..0x21) {-30, 0, 0, -30, -30}, the pit (10, 0x60 / 0x63 / 0x65 / 0x66) -30, the sever
  (10, 0x72) -30, (10, 0xa7) -50, (10, 0xaf) -50;
* status 7 (attacks) `0xeedaf0(e, n)`: table `0xeedb3c` (n <= 0xf8) -> -1 / -3 / -5 / -3 by number group, at rank >= 2
  0 / -1 / -2 / -1 (`0xeedf4c..0xeedf7c`), clamped to [1, 100] (`0xeee010`): **attacks never empty it**;
* **WITHDRAWN (the note's "Thunderlord at G while enraged pays nothing"): it is the reverse.** `0xeed5ec..0xeed61c`: variant
  4 at rank >= 5 -> `isEnraged == 1` ? pay : skip; `0xeedfa8..0xeedfd0` the same for attacks. At G Thunderlord pays only
  WHILE ENRAGED; calm, his gauge never drops.
* No time-out: nothing decrements the gauge per frame (the scan above), so a charge ends only by depletion, (1, 5), death or
  a slam. **What can only come from hunter hits: every negative `sb` above** (and the catch, 10.5).

### 10.3 The auras -- R (`0xeed68c..0xeedaa0`, every action start, one handle of cb08 / cb0c / cb10 at a time)

| variant | state | request (vt+0x1d0 id -> u key) |
|---|---|---|
| 0 | uncharged, tier 0 / 1 (gauge < 50; selector 1 `0xeefec8`: < 25 / < 50 / < 75 / else) | none, all stopped |
| 0 | uncharged, tier 2 / 3 | 1001 -> u 30 / 1002 -> u 31 (byte-identical records) -- NO rage test |
| 0 | charged, calm | 1003 -> u 32, except on the (1, 4) start itself (`0xeed78c..0xeed7a0`) |
| 0 | charged, enraged | none |
| 4 | uncharged, calm | **1006 -> u 42** (`0xeed948..0xeed9c8`; his pel only) -- no gauge tier |
| 4 | charged, calm | 1007 -> u 32 (`0xeeda78..`) |
| 4 | enraged | none |

Viewer (motion-states.js CHARGE_EFFECTS em057_00 / em057_04, new driver fields `calm` / `alive` / `leave`): Zinogre's Normal
= tier 0 / 1, **Charging = tier 2 / 3 (u 30 holds; u 31 is the same record)**, Fully Charged = P+0x5df3 (u 32, calm).
Thunderlord's Charged = flag 0 (u 42, calm), Overcharged = flag 1 (u 32, calm). Zinogre's L0 M24 row no longer holds u 32
(the ROM does not request it on the (1, 4) start).

### 10.4 The discharge -- R

`0xeecb28`: `0xac030` unless status 11; P+0x5df3 = 0; gauge 40 at rank 4, else 0; ctl+8 = 1; rage cleared (`0xba7b8`) or its
request (`0x7fb68(e, 4)`); then `0xeecc2c`: hit tables 0..5 back (`0xbaacc`), **id 1004 (u 120) at status 11 and variant 0,
else id 1005 (u 90)**, the three auras stopped. `0xeecc2c` also runs alone at a status-11 start while uncharged with tier >= 1
(`0xeed0e4..0xeed104`).

| entry | ROM | viewer |
|---|---|---|
| (1, 5) start (`0xeed3cc`) | u 90 | L0 M25 row `start` (both). Who issues (1, 5): no stream, no class site (scan) -- NR |
| gauge <= 0 at an action start (`0xeed658`) | u 90 | dropping OFF the charged rung (`leave`) |
| status-11 start, charged (`0xeed0bc`) | Zinogre u 120, Thunderlord u 90 | death rows `startAt` the charged rung |
| status-11 start, uncharged tier >= 1 (`0xeed104`) | Zinogre u 120 (Thunderlord u 90) | Zinogre's Charging rung; Thunderlord: no rung shows his tier -- not fired |
| (7, 0xe3) L9 M1 f266 (actiontune float 0x27, `0xefb04c`) | u 90 | psl-mask.js ACTION_EFFECTS em057_04 |
| (7, 0xdb) L9 M5 f204 (float 0x3d, `0xefb814`; L9 M4 -> M5 at f166) | u 90 | ACTION_EFFECTS em057_04 |

(7, 0xe5) never reaches its slam: with r5 0 its phase 1 ends the action at L9 M4's end (`0xefb958` -> vt+0x3dc). The floats
are `em057_04_actiontune.fup` (FUP, 25 ints, 68 floats); Zinogre's arc has no action_tune, and list 9 is Thunderlord's alone.

### 10.5 u 280 and (1, 0x15) -- R

* **u 280** (id 1009): body `0xefb210` phase 1, `r5 == 1` -> at L9 M2 f25 (`0xb0974`, 25.0) vt+0x1d0(1009). (7, 0xd9) / (7,
  0xda) play L9 M2 with r5 1 and follow (7, 0xdb) at its end; (7, 0xe4) / (7, 0xf1) with r5 0 (no request) and follow (7,
  0xe5). Wired: ACTION_EFFECTS em057_04 '9|Motion[2]', CLIP_ACTIONS [(7, 0xd9), (7, 0xe4)].
* **(1, 0x15) IS issued -- the earlier "nothing issues it" is WITHDRAWN.** A 30-instruction scan of every change-family call
  (control: it finds the (1, 4) sites `0xef0d38` / `0xef1408` / `0xef3270` the note names, and (1, 0x2d)'s follow
  `0xef1e3c`) finds `0xeff114`: em057_00CatchMove (status 9, `0xefefec`), number 1, plays L2 M36 and at its end follows
  (1, 0x15) (number 2 follows (1, 0x14), L0 M20 from f70). Status 8 (PreCatchMove, L2 M34 -> L0 M13) is followed into at
  `0xef74a0` once `0xc7470(e, 0)` returns a target (not read through: I, a caught hunter); the status-9 numbers have no
  immediate issuer in the band -- NR. **So (1, 0x15) only follows a catch.** CLIP_ACTIONS L0 M24 gets it as a third play
  (18-20 for both variants). The EMC: `00 01 15` / `00 01 05` absent, `00 01 04` found twice (control).

### 10.6 e+0x7420 -- R

Written by `0xb1560` / `0xb15c0` / `0xb1624` (shared): **P+0x1a8 bit 3 clear -> +0x7424 = this machine's id (`0x495d8`) and
+0x7420 = 1**; set -> +0x7420 = (the owner == this machine's id). `0xaf2ac` (base vtable slot `0x172d7d8`) clears it with
+0x7424 = 0xff; `0xad7b8..0xad7d4` (the +0x24 pass, `P+0x1a0 == 0` -> 1: the monster's first update) calls `0xb15c0`. So with
P+0x1a8 bit 3 clear, e+0x7420 = 1 from the first update and the follows of 3 run the same update. What sets P+0x1a8 bit 3: NR
(no `strb ..., [.., #0x1a8]` beside an `orr #8` in the shared code; I: the shared / online form).

### 10.7 The L3 M1 back (the 2 check failures) -- the row is right, the check was short

`userLevel` (motion-states.js) gives the user's level from the parts drawn, and an arm shows max(1, it). The back's ladder
[[7], [7], [8]] makes levels 0 and 1 the same set, so on an intact back its turn is level 1 (no break, no record -- the ROM's
first depletion), and u 1011 shows once the Back row is Broken (set 8, level 2). The check now plays it both ways.

### 10.8 Results

`--states` exported u 90 / u 120 / u 30 (Zinogre) and u 90 / u 280 / u 42 (Thunderlord); recorded 9 + 9 sets, one lift
(copy) rc 0. Soaks: em057_00 87 motions 0 refused, em057_04 92 / 0. Page check dev/checks/em057_00.mjs **167 passed, 0
failed** (the rung / aura / discharge / death / L9 u 280 / back-break asserts added). Word re-check (`LIVE=1`): 0 mismatches.
index.html: a runtime that comes up after the rung was set now gets the rung's held records (`chargeHoldRt`) -- without it
Thunderlord's default-rung u 42 never showed.

## 11. The last named ones (third pass, 2026-10-17)

* **(1, 5) and the catch (9, 1 / 2): no literal issuer anywhere read.** A word-by-word scan of every `b` / `bl` to the
  change family (`0x768c8 / 0x76a40 / 0x7699c / 0x75230 / 0x76098 / 0x754b8 / 0x76088 / 0x76094 / 0x7fba0`) with r1 / r2 from
  the 30 instructions before (`<archive>/zg/issuers.py`): the class band `0xeeb620..0xf0523c` -- 43 calls, control: the
  five (1, 4) sites, (8, 0) at `0xef74a0`, (1, 0x15) at `0xeff114` -- and the shared enemy layer `0x40000..0xc9000` -- 75
  calls, (10, 0x9a), (11, 0x1b) ... -- name no (1, 5) and no status 9; nor does a dynamic census (`follows.py`: every handled
  action, both variants, phases 0..5, frame tests 0 / 1, charged 0 / 1 -- control: it finds (1, 4) from (1, 0x2c / 0x2d),
  (1, 0x15) / (1, 0x14) from (9, 1 / 2)); nor the EMC (`00 01 05`, `00 09 ..` absent; `00 01 04` x2 the control). NAMED
  REFUSAL: both are issued from outside these ranges. **What the catch needs:** its first half (8, 0) is followed into from
  (7, 0x41)'s L2 M33 body (`0xef7448..0xef74a0`) only with `e+0x7420` set, `[P+0x1bc] > 12.0` and `0xc7470(e, 0)` != 0xff --
  `0xc7470` walks the four player slots (`0xc725c(e, slot, 1)` for slots 0..3): **a hunter**. (9, n) then follows from the
  hunter side (NR).
* **The G remap's percentages: READ.** `0x6f62c(e, i)` = actiontune int i (`[e+0x75e4]` vt+0x44 `0x3cb30c`: `ints[i]` if
  i < count, else 0). Thunderlord's `em057_04_actiontune.fup`: int 0x14 = **0**, 0x15 = **30**, 0x17 = **0**, 0x18 = **100**.
  So at G: uncharged -> (7, 0xe7 / 0xe8 / 0xeb / 0xec / 0xef / 0xf0 / 0xf9 / 0xfa / 0xfd / 0xfe) ALWAYS remapped (the default
  100); charged and calm -> NOTHING remapped (ints 0x14 / 0x17 = 0); charged and enraged -> the 0xe7.. / 0xf9.. group
  always (100 / int 0x18 = 100), (7, 0xe9 / 0xea / 0xed / 0xee / 0xf7) 30% (int 0x15) against `[e+0x73e8] % 100` (I: the
  action's random draw). Zinogre's remap (`0xeec220..`) has no percentage: (7, 0xf9 / 0xfa / 0xfd / 0xfe) -> 0xa2 / 0xa3
  always at G. **In the viewer** (CLIP_ACTIONS `onlyIf`, clipActionFor's new `charged`): Zinogre's L2 M1 / M2 lose the
  (7, 0xfb / 0xfc) follows (never at G); Thunderlord keeps them only charged and calm. L2 M43 / M44 keep their own action
  (the only plays of those clips; at G Zinogre never plays them, Thunderlord only charged and calm -- named stand-in). The
  30% draw decides at runtime which of (7, 0xe9) / (7, 0xa0) a charged, enraged Thunderlord plays: each play the next.
* **P+0x1a8 bit 3: READ, per spawn.** Set in the spawn init `0xb8b98` at `0xb99c8`, when `e+0x1405` bit 3 is clear and
  either P+0x5cb7 == 0 or P+0x1a8 & 0x2001; P+0x5cb7 is byte +2 of the spawn record (`0x6fb40..0x6fb44`, the same copy
  that puts byte +3 into P+0x5cb6, the size type -- rom-map `0x6fb68`). With it set, e+0x7420 = (`0x4957c()` ==
  `0x495d8()`), two reads of the net session object `0x3f79c8` (I: equal offline); clear, 1. Either way the follows hold
  offline (I for the set arm).
* **Thunderlord's uncharged death u 90: wired, without a new rung.** His gauge tier changes nothing on his model or his held
  aura (u 42 takes no tier, 10.3) -- it decides only whether a death requests u 90 -- so a rung (a look) is not what the
  ROM has; the death rows instead alternate (a row `cycle`): at the Charged rung the first death is tier 0 (nothing), the
  next tier >= 1 (u 90). Zinogre's Normal rung (tier 0 / 1) the same with u 120. Check: two deaths at the uncharged rung,
  one with the request.

Results: check 169 passed / 0 failed; soaks em057_00 87 / 0, em057_04 92 / 0. No new records.

## Re-metered 2026-10-25 (effects lane A)

* **Zinogre u 31**: the action-start aura machine (`0xeed68c..0xeedaa0`) holds u 30 at gauge tier 2 and u 31 at tier 3 (ctl+0 >= 75,
  op-0x6f selector `0xeefec8`). The two records are byte-identical but are two records; the Charging rung showed u 30 for both. New
  class toggle **Gauge Tier 3** (working label) swaps the hold to u 31 (CHARGE_EFFECTS `holdWhen`). Draws (`<archive>/laneA/tier057.mjs`).
* Thunderlord u 220 / u 221 (L2 M2 / M1 bit 9) fire only below G and enraged -- at G his word clears bits 9-11 on every motion; the
  shared puff u 1121 likewise below G. Both draw at High Rank with Enraged (`<archive>/cen/pq/z57.json`). u 1011 draws.
* Open with ROM reasons for the coordinator: Thunderlord u 30 / u 31 (his aura machine asks 1006 / 1007, never the tier arm's 1001 /
  1002) and c 1104 (no stamina block: never tired).

## Thunderlord c 1104 -- the consumer read (effects lane A2, 2026-10-26)

* u 30 / u 31 accepted as named refusals (coordinator, 2026-10-26).
* c 1104: lane A's "no stamina block" was not enough, because the code that consumes the block had not been read. Now read
  (rom-map "Effects lane A2"). Thunderlord is never tired, for two reasons, and either one is enough:
  1. **P+0x1a8 = 0x4c0201** (`0x159c2dc[45]`, em 0x439) has **bit 19**. Every writer that can set the tired byte P+0x505 to a
     nonzero value requires `(P+0x1a8 & 0x80001) == 1`: `0xbd0c8` (the flip 1 -> 2, the 2 -> 3, the state-record restore),
     `0xbd250` and `0xbd2d4`. The stamina updater `0xbd1a4` also returns at once (`0xbd1d4`). Zinogre's word is 0x440241: no
     bit 19, and bit 6 is set (the tired idle).
  2. **`[tune+0x30]` NULL.** `0x7112c` reads `[[e+0x75ec]+0x94]`, which is tune+0x30. When it is NULL, `0xbd1a4` returns at
     `0xbd1e4` before it touches the stamina count P+0x508, and setAction skips the drain call (`0x75614`). The only write that
     takes P+0x505 off 0 is `0xbd2d4`, when the stamina drains to 0, so it never happens.

  So `0x81614` never returns 1, and the drool `0xa41b8` never asks for c 1104. Emulated with `<archive>/laneA2/stam1104.py`.
  Positive control: Zinogre's word with a block reaches 1, 2 and 3 on the same runs, and his c 1104 draws. With the block NULL,
  Zinogre's drain is skipped as well, so the block stop works on its own. Brought to the coordinator as a ROM reason.

