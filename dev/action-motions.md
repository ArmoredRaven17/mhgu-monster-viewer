# The action -> motion census (action-motion census lane, 2026-10-27)

The viewer plays CLIPS; the game plays ACTIONS. Every system keyed on the action (Hyper ModifyData's speed factor, psl-mask.js
CLIP_ACTIONS copies, the PSL enable word, the notice / posture rules) needs to know which actions play a clip. Until now only parts
were known: ModifyData's own actions (hypermotion/modmotions.py, 793) and the attack census's arms (attack-hitshapes.json). This is
the full census: every handled action of every one of the 94 list entries (61 classes), what it plays, under what.

- **Data**: `docs/action-motions.json` (built by `<archive>/actmot/build.py`; format below).
- **Tools**: `<archive>/actmot/` -- `amtrace.py` (the machine), `census.py` (one monster), `runall.py` (all 94), `build.py` (the
  viewer table), `resolve21.py`, `ambig.py`, `cand.py` (-> `candidates.md`), `mountcheck.mjs` + `rcd.mjs` (the page). Raw per-monster
  runs stay local (scratchpad `actmot/raw/`).
- rom-map: section "The action -> motion census", tooling row `<archive>/actmot/`, trap 176.

## 1. The method (reusable: any class, any MT Framework build with an action main)

1. **Machine** (zg/tracec.py's, `amtrace.py`): the whole main.text / rodata / data under unicorn; an enemy block E with the class's
   own vtable at +0, P = [E+0x1428], the control block [E+0xcac0]; e+0xb5f4 / +0xb5f5 = em / variant and the u16 **e+0xb5f0 =
   variant << 8 | em** (uEm004_00 and the hyper dispatchers read the u16; rom-map `0x6b340`). The action main is vt+0x1f4. The
   class code = its module band (emclasses.py, per CRO module -- not per class), plus any single-class code above the bands
   (Ahtal-Neset's `0x12178a4` / `0x1217ba0` / `0x12182bc`), run natively. Every other call returns at once (r0 = RET, s0 = RET x 999.0:
   never a value left over from the previous run, trap 92) and is LOGGED by target.
2. **What is recorded** (each with the call site):
   - every setMotion of the family (rom-map row "the setMotion family"): `0xafce8 / 0xafe84 / 0xafe8c / 0xafef0 / 0xb0230 / 0xb03f8 /
     0xb04d0` -- r1 the motion, s0 the blend, s1 the start frame, r2 the flags; `0xb00b4 / 0xb0174` -- r1 the motion, r3 the flags and
     **r2 the PARTNER layer** (vt+0x3d8, then `0x53949c`: `0xb00b4..0xb0170`); `0xb032c / 0xb0004` the partner layer alone;
   - the rate `0xb07b4(e, s0)` after it (P+0x398, held to the motion's end);
   - the posture: `0xbc7f4(e, r1)`; `0xbc984` / `0xbca24` -> 1. A motion in a phase that sets none takes the postures the action set
     in its earlier phases (`in:`);
   - **the angle-picked turns** (trap 94: their motions are data, so a tracer that stubs them sees none): `0x7a258 / 0x7a284 / 0x7a2b0`
     start (mode 0 / 1 / 2), `0x7a27c / 0x7a2a8 / 0x7a2d4` continue; `0x794f0` picks the record: mode 0 = the table itself, mode 1 / 2
     = the table's word 0 / 1 / 2 by |angle| against each record's +0xc (`0x796e4..0x7976c`); `0x772b4` plays the record: +0x10
     straight (only when +0xe != 0 and |angle| <= +0xe; +0x14 blend, +0x18 start, +0x1c flags; `0x77370`), else a side +0x20 / +0x30
     by the angle's sign (P+0x336 bit 0x20 flips it), through `0xb00b4` with +0x10 as the partner when P+0x336 & 0x100. Every motion
     of every record is logged;
   - **the status scripts** `0xa1290(e, script, mode)`: the script's op 0 / 2 motion records (zg/scrdump.py's reading), the posture
     by mode (`0xa1430..0xa145c`);
   - the change family (follow `0x768c8` -- vt+0x3d0 = `0x6c178` --, hold, req, set, changeAction; the defaults kept apart): the
     CHAINS. A followed action is censused on its own, never folded into the follower (the attack census folds it, below).
3. **The sweep**: pass 1, every (status 0..0x14, number 0..0xff) at phase 0 with the shared calls answered 0 and then 1 (actpost.py's
   two answers): live = any motion / partner / rate / posture / turn / script event, a phase written, or a non-default change.
   Pass 2, each live action x phase P+0x1a1 0..7 (and higher while a run writes a higher one) x sub-phase P+0x1a2 0..3 x (ended,
   frame) (0, 0) / (0, 1) / (1, 1) x RET 0 / 1 = 192+ runs. A motion's `when` names the dimensions it does not appear under every
   value of.
4. **The PSL word**: vt+0x13c(e) with e+0x4b4 = the motion and the action set (zg/ctlflip2.py's run_word frame), shared calls 0 / 1 ->
   e+0x13f4, for every (action, motion) the census found. A class without its own vt+0x13c gets the base stubbed: its words read 0.
5. **Controls** (positive, run the same way):
   - **Alatreon** against the shells lane's `<archive>/gapW/actpost.json`: all 105 actions with motions, every motion and every
     (motion, posture) pair found; 19 actions add a motion actpost could not see (status 7, phase 1, ended with the shared calls 0:
     L0 M10 / L1 M3 -- actpost answered every call 0 or every call 1, frame and ended included);
   - **Rathian** against modmotions.json (24 ModifyData actions): every motion found;
   - **the attack census** (attack-hitshapes.json `arms`, 4116 (clip, action) pairs outside Giadrome / Volvidon): 3751 found
     directly, 347 through the action's follow (the attack census credits the follower with the followed action's arms, its
     follows=1 rerun), 18 not: em047 (7, 3 / 4 / 5 / 0xb / 0xc / 0x11 / 0x20) on 0xffff (no motion; its "15|Motion[255]" is the id
     masked), em049 (6, 0xc) id 0x2716, and 4 the attack census put on another motion of the follow (em007 (7, 0x27) L2 M16,
     em043 (7, 0x2c) L2 M12, em069 (16, 5) L4 M169 -- tracec plays (7, 0x2b) on L2 M13 from f15, not M12).
6. **Caveats (named)**: the stubbed shared calls answer all-0 or all-1 together (a path needing one 0 and one 1 is not run); a
   class code reading state the census leaves zero (the control block, breaks beyond vt+0x370's 0 / 1, timers) shows its zero arm --
   `when.ret` marks the rows that need the shared calls true; the EMC (which actions the AI issues) is not read here: a handled
   action is listed whether or not any table issues it; three actions faulted or ran out of budget (`err`: Zinogre / Thunderlord
   (2, 0x28), a frame-test loop; Ahtal-Ka (1, 0x12), an unmapped read at `0x10aebdc`); motion ids above 0xfff (em046 / em049
   `0x27xx`) keep tracec's list nibble -- how the motion player takes the high byte is NOT READ.

## 2. Coverage

All 94 list entries (61 classes; variants run with their own em / variant bytes), 22114 live actions, **21720 that play a motion**,
9931 (monster, clip) pairs with their actions. 394 live actions play none (316 with no chain: they call shared code only -- listed
per action with the shared calls in `none`; 78 change to another action). 4533 actions chain. 1001 actions play their motions ONLY
through a turn table and 4211 ONLY through a status script -- both invisible to every earlier tracer census (tracec / attrace /
modmotions stub them). 28 set motion 0xffff (`minus1`). Fatalis's status 11 is the only default arm the census sees (all 256
numbers play L3 M17, the death); numbers 0xff elsewhere are real actions (the Rath line's (7, 0xff) L9 M2).

## 3. The 21 ModifyData actions that "set no motion" -- resolved

19 play their motions through a **turn table** (0x772b4's records; the tracer's TURN, never its MOT):

| monster | action | motions (record) |
|---|---|---|
| Khezu em003_00 | (2, 2) | L0 M8 / M9 (`0x169b874`), L0 M12 / M13 (`0x169b8f4`) |
| Yian Kut-Ku em008_00 | (7, 0x1e) | L2 M23 / M24 (`0x169bde0`) |
| Gypceros em009_00 | (7, 0x1e) | L2 M23 / M24 (`0x169c064`) |
| Yian Garuga em018_00 | (7, 0x14) / (7, 0x1c) | L4 M64 / M79 (`0x169c9a0` / `0x169c9e0`) |
| Tigrex em032_00 | (2, 0x34) | L0 M60 / M63 (`0x169d894`) |
| | (7, 0x24) / (7, 0x25) | L2 M26 / M27 (`0x169da50`) |
| Deviljho em043_00 | (7, 0) | L0 M14 straight, L2 M3 / M4 (`0x169e468`; rom-map turn-table row) |
| | (7, 0xc) | L2 M7 / M8 (`0x169e4e8`) |
| | (7, 0xe) | L0 M14 straight, L2 M5 / M6 (`0x169e528`) |
| Brachydios em063_00 | (7, 4) / (7, 0x50) | L2 M12 both sides (`0x169ffa4` / `0x169ff24`) |
| | (7, 5) / (7, 0x51) | L2 M10 both sides (`0x169fea4` / `0x169fe24`) |
| | (7, 0x16) | L2 M14 both sides (`0x169fba4`); phase 2 L2 M3 (shared calls true) |
| Tetsucabra em066_00 | (7, 0x53) | L4 M19 (`0x16a06f0`), L4 M24 / M26 (`0x16a0730`); then set (1, 0x51) |
| | (7, 0x6d) | L4 M6 (`0x16a0770`), L4 M25 / M27 (`0x16a07b0`); then set (1, 0x51) |
| | (7, 0x7b) | L4 M5 both sides (`0x16a05dc`) |

All in posture 0, phases 0 and 1 (start, continue). The other two **play nothing of their own**:

- **Congalala em021_00 (7, 0x47)**: not handled. Its status-7 switch sends it to the generic unhandled-action logger `0xca050`
  (`bx [vt+0x3dc]`, rom-map `0xca050`), his vt+0x3dc is the shared idle chooser `0x75168`: posture 0 and the change to (0, 0 / 1 /
  2), whose own action set picks its own ModifyData factor. So (7, 0x47)'s x factor reaches no clip.
- **Duramboros em055_00 (7, 0x15)**: no setMotion in any phase: phase 0 -> 1; phase 1 at the motion's end -> `0x75168`; phase 2 at its
  frame test makes a shell (`0x48b884`, after `0xc164c` / `0xc241c` / `0x9d384`). It plays on whatever motion was running when it
  was entered; no class code chains into it (the census's chains), so its issuer is the EMC (NOT READ here) -- the factor applies
  to the clip its issuer was playing, which the census cannot name.

## 4. The viewer (built): Hyper ModifyData's census branch

index.html hyperMotionAt, a play with no named action: the actions known to set the clip are now arms + actMotions + **the full
census's `motions[clip]`**; one factor among them -> it (`how: 'census'`), several -> 1 (`'ambiguous'`, not guessed); while the
census file loads (fetched on the first Hyper selection, `loadActionMotions`) -> 1 (`'loading'`). Plays with a named action
(CLIP_ACTIONS, a Special entry, a shell pick) are unchanged.

Counted offline over every hyper monster x file (below G / G) x every pair the viewer offers x every clip (`ambig.py`):

| | factor applied ('census') | 'ambiguous' (plays 1) |
|---|---|---|
| before (arms + actMotions) | 101 (pair, clip) cases | 90 cases on 56 (monster, file, clip) |
| after (+ the full census) | 30 cases on 24 clips | **206 cases on 152 clips** |

**The ambiguous count went UP, and that is the finding**: most of the 101 factors the viewer applied were guesses -- the clip is
also played by actions ModifyData does not modify (Rathian's L1 M16: (4, 1) x1.3, and (3, 2 / 0x53 / 0x56 / 0x5b / 0x5f), (10, 0x62),
(12, 0) at x1; L4 M12: (2, 4 / 5) x1.3 and 13 unmodified). They now play at 1. The 24 clips that keep a factor (every action that
plays them shares it): Rathalos / Silver L4 M41 / M46 (pair 1,3; x1.1), Congalala L5 M12 / M18 (G), Nargacuga L2 M9 / M13 (G),
Lagiacrus L2 M2, Najarala L2 M17 / M48 / M49 / M50, Glavenus L4 M10 / M12 (G). Positive control on the page
(`mountcheck.mjs`): Rathian 1,3 L1 M16 plays at 1; Rathalos 1,3 L4 M41 at x1.1 'census' (with its hook's rates).

**Metered** (`<archive>/hypermotion/motionmeter.mjs` through `<archive>/actmot/rcd.mjs`, its own server and profile; outputs
`<archive>/actmot/meter_*.out`): at G, every hyper monster (44), the pair with the most hooked motions, up to 3 clips each: **158
PASS, 0 FAIL** -- the same 132 clips as the hyper lane's `meter_all_g.out`, no factor, played length or verdict changed (19 burst rows
differ by one lit sample, every one draws); `how` now names the census (factor 1) on clips that had no known action. ModifyData
alone below G: Rathian 1,3 L1 M16 51 -> 51 and L4 M12 35 -> 35 (was 40 / 28 at x1.3: now ambiguous, 1); Rathalos 1,3 L4 M46
101 -> 93 (predicted 92) and L4 M41 175 -> 159 (160) at x1.1 'census'. Mount check (`mountcheck.mjs`): 5 / 5.

## 5. Candidates for Raven (NOT applied: no CLIP_ACTIONS copy or menu was changed)

`<archive>/actmot/candidates.md` (cand.py): every clip several actions play that differ in something the viewer shows -- the
posture (AIR_HEIGHT / the floor), the rate (0xb07b4; the viewer plays 1), the PSL enable word (psl-mask.js's bits). Variants with
the identical answer are one row. **790 clips: 521 differ in posture, 226 in rate, 112 in the PSL word; 154 already have
CLIP_ACTIONS entries** (the column says which), 636 have none. Examples: the Rath line L0 M16 / M17 -- (1, 7) / (1, 8) word
0xc0000, (1, 4 / 0xd) / (1, 5 / 0xe) word 0; L1 M16 -- (4, 1) posture 3, (10, 0x62) posture 1.

## 6. Open (named)

- Duramboros (7, 0x15)'s issuer (the EMC) and so the clip its factor reaches.
- The motion player's reading of ids above 0xfff (em046 / em049 `0x27xx`).
- The base PSL word (0xca170) is stubbed: a word difference that only the base makes is not seen.
- attack-hitshapes.json `arms` for **Giadrome em034_00 and Volvidon em062_00 come from the wrong class** (rom-map Withdrawn row,
  trap 176): Akantor's (uEm033_00) and Lagombi's (uEm061_00), byte-identical to theirs; the classes are uEm014_00 / uEm060_00. Not
  mine to regenerate; the census here uses the right classes.

## 7. docs/action-motions.json

```
{ "_about": "...", "<monster id>": {
    "cls", "em", "variant", "live",
    "actions": { "st:0xNN": [ { "m": "L|Motion[N]", "ph": [phases], "via": [setter | "turn:<side>:<record>" | "script:op<k>"],
                               "posture": [n | "in:<earlier>"], "rate"?: [..], "start"?: [..], "blend"?: [..],
                               "when"?: { "sub"?: [..], "ef"?: ["<ended><frame>"..], "ret"?: [0|1] }, "psl"?: [w0, w1] } ] },
    "partner": { "st:0xNN": ["L|Motion[N]"] }, "chains": { "st:0xNN": [[kind, "st:0xNN", [phases]]] },
    "none": { "st:0xNN": { "chains": [...], "stubs": ["0x.."] } },
    "motions": { "L|Motion[N]": ["st:0xNN", ..] },          <- the inverse (main layer)
    "err": {..}, "minus1": [..], "raw": { "st:0xNN": ["0x27..", ..] } } }
```
