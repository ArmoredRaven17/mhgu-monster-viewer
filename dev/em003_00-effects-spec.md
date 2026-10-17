# Khezu (em003_00) — effects spec: the PSL enable word

Research agent for the Viewer agent, 2026-10-16 (dev/flying-wyverns-effects-survey.md "Khezu" and "What closing each needs"
item 1; task board "Khezu + Gravios"). Static ROM reading plus unicorn controls; no recorder, no lift, no `--apply`, no docs/
edit. `R` = READ (the consuming instruction read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: the survey (Khezu: 5 bindings outside the file mask, 150 file-mask / 155 whole-block, soak clean, no
record unexported), rom-map.md ("THE PSL ENABLE MASK", "The PSL enable word per class": uEm003_00 `0x17958f0` / `0xd0f728`
UNREAD; the `0x6fe88` row; "Khezu -- the turn clips' postures"), docs/render/psl-mask.js whole (Deviljho / Brachydios /
Gypceros as the models: the `rage` form of a CLIP_ACTIONS entry is Gypceros's), C:\MHGU-RE\offline\decode\notes\states-em003_00.md
(§0, §4 rage, §5 tired, §8 the Taiden question — its table of the status-7 functions and the motions each plays is the
starting point of §3 here, §9 the projectile / discharge families), the task board (grep: no read of this slot; rom-map
"posture-em003_00.md 11.2" rows), dev/em043_00-effects-spec.md (format). Scratch: `<scratchpad>\kg\` (emu_kg.py, jscheck_kg.py,
classify.py, kprobe.py, the plans `em003_00_file.txt` / `_whole.txt`, `cls_em003.txt`).

## 1. The word — uEm003_00 vt+0x13c = `0xd0f728` — R, emulated

Vtable **`0x17958f0`** (checked: `+0x13c` = `0xd0f728`, `+0xf0` = the base copy hook `0xca52c`). One class, one monster, no
variant. Extent **`0xd0f728..0xd0f9a0`**: one `push {r4, r5, fp, lr}`; exits `popne` `0xd0f98c` and `pop` `0xd0f9a0`; the jump
table `0xd0f794..0xd0f8d0` (0x50 words, offsets from `0xd0f794`, bounded by `cmp r0,#0x4f`) is inside; `0xd0f9a4` is the next
function's `push`. Callees: `0xca170` (the base) and `0x6fe88` (the current-action test, rom-map row: `e+0x73e0 == r1 &&
e+0x73e1 == r2`) — nothing else.

    0xd0f734  bl 0xca170                                  ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0xd0f738  s = e+0x73e0, n = e+0x73e1                  ; THE ACTION, read before the motion
      s == 7 (0xd0f77c): n > 0x4f -> nothing; table 0xd0f794[n]:
          -> 0xd0f908 `bfc r0,#9,#3`: CLEAR bits 9-11       n = 0x00 0x02 0x0f 0x11 0x12 0x30 0x44 0x48 0x4e
          -> 0xd0f8d4 `orr r0,r0,#0xe00`: SET bits 9-11     n = 0x09 0x0a 0x0b 0x10 0x3b 0x49 0x4f
          -> 0xd0f91c nothing                                every other n
      s == 3 (0xd0f8e8): n - 0x43 <= 0x12 and bit of 0x41001 -> CLEAR 9-11   n = 0x43 0x4f 0x55
      s == 2 (0xd0f758): n <= 0xe and bit of 0x45e1 -> CLEAR 9-11             n = 0x00 0x05 0x06 0x07 0x08 0x0a 0x0e
      (each through `ldr r0,[r1,r0]!` with r1 = e, so the store `str r0,[r1]` 0xd0f918 is e+0x13f4 -- trap 58's writeback)
    0xd0f91c  THEN BY MOTION (r5 = the motion id):
      L2 M38 (0x226, 0xd0f978): 0x6fe88(e, 7, 0x52) ? |= 0x180000 (bits 19-20) : return
      L2 M37 (0x225, 0xd0f934): |= 0x18000 (bits 15-16), or 0x60000 (bits 17-18) when 0x6fe88(e, 7, 0x52) AND
                                 P+0x1a1 == 3 (the action's phase byte, `ldrb [P,#0x1a1]` 0xd0f95c)
      every other motion: nothing more

So the class does two things: **it makes the enraged group (bits 9-11) follow the ACTION** — forced on for the charged attacks,
forced off for the plain ones and the walks, left to the rage flag for the rest — and it ORs two bits on L2 M37 / M38. It reads
no part, no variant, no rank, no posture.

**What the action pairs are (R, the command table).** Every SET number has a CLEAR twin issued by the same stream under EMC op
0x1c (`0x81688`: enraged, unless `e+0x1409 & 0x40` — rom-map row) — the `1c 00` body (enraged) issues the SET form, `1c 02` the
CLEAR form (em003_00_cmdtbl.emc, emcfind):

| clip | CLEAR form (calm / tired) | SET form (op 0x1c enraged) | streams |
|---|---|---|---|
| L2 M4 -> L2 M5 / L2 M39 (`0xd162b8`) | (7, 0x00) | (7, 0x09) | g1 s8, g1 s11, g8 s0 |
| same | (7, 0x4e) | (7, 0x4f) | g1 s68 |
| L2 M10 (`0xd16c98`) | (7, 0x02) | (7, 0x0a) | g1 s13 |
| L2 M74 (`0xd1837c`) | (7, 0x0f) (also op 0x24's tired arm) | (7, 0x10) | g1 s54 |
| L0 M6 (`0xd18158` / the walk) | (2, 0x07) / (2, 0x03) by op 0x35 | (7, 0x0b) | g1 s55 |

and unpaired: (7, 0x11) (L2 M4, g1 s8 / s23, issued with no rage test) CLEAR; (7, 0x57) (L2 M4, g1 s91) nothing — the rage flag
decides; (7, 0x12) (`0xd18608`, g1 s109) CLEAR; (7, 0x30) / (7, 0x3b) / (7, 0x44) / (7, 0x48) / (7, 0x49) / (3, 0x43) are coded
and issued by no stream (emcfind: none). (3, 0x4f) (g1 s46 / s75 and the rage entry g6 s0 from posture 5) and (3, 0x55) (g1
s24) CLEAR: both are `0xd13a10` modes 4 / 5 — posture 5, the wall turn array `0x1795f08` (rom-map row: L5 M6 / M7 / M39 / M40),
then `0x768c8` -> (7, 0x12) / (7, 0x44) (`0xd13b04..0xd13b30`) — and their L5 clips name no bit 9-11, so they change nothing on
screen. The walks (2, 0 / 5 / 6 / 7 / 8 / 0xa / 0xe) all play L0 M6 (kprobe, every posture 0 / 1 / 5 / 6): CLEAR.

So in the game **the charged forms are the enraged plays and the plain forms the calm ones**, and the class makes the enraged
group follow that choice: an enraged walk, an enraged (7, 0x11) jump, a (7, 0x12) wall jump fire nothing of bits 9-11; a charged
play fires them even if the rage flag were down (it is not, on the AI's own path — except `e+0x1409 & 0x40`, NR).

**Emulated** (`<scratchpad>\kg\emu_kg.py`: bw1/emu13c_bw.py plus the em byte `e+0xb5f4`, the ctl pointer `e+0xcac0`, part
levels, the phase byte `P+0x1a1`; everything in main.text runs, nothing stubbed but `0x712a0`). **Controls first**, reproduced:
Deviljho L2 M10 calm / tired / severed + enraged `0x381ff` / `0x3f03f` / `0xe3f` (em043 spec), Tigrex L2 M10 `0x1ff`, L9 M15 tired
`0x703f`, Basarios L2 M3 (7, 0xa) `0x181ff`, (7, 0x15) enraged `0x600e3f`, L2 M27 (7, 0xd) `0x60001ff`, L0 M7 surface / sunk
`0x180001ff` / `0x1ff` (psl-mask.js em004). Then Khezu:

| case | word |
|---|---|
| L2 M4 (7, 0) calm / enraged | `0x1ff` / `0x3f` (9-11 cleared) |
| L2 M4 (7, 9) calm / tired; (7, 0x57) enraged | `0xfff` / `0x7e3f`; `0xe3f` |
| L0 M6 (2, 0) enraged; (7, 0xb) calm | `0x3f`; `0xfff` |
| L0 M21 (3, 0x43) enraged; L2 M5 (3, 0x4f) / (3, 0x55) enraged | `0x3f`; `0x3f` / `0x3f` |
| L2 M37 (7, 0x2c); (7, 0x52) phase 1; (7, 0x52) phase 3 enraged | `0x181ff`; `0x181ff`; `0x60e3f` |
| L2 M38 (7, 0x2c); (7, 0x52) tired | `0x1ff`; `0x18703f` |
| L2 M28 (7, 0x26) calm / enraged; L2 M74 (7, 0x4f) / (7, 0x50) enraged / (2, 0xf) enraged | `0x1ff` / `0xe3f`; `0xfff` / `0xe3f` / `0xe3f` |

The transcription below against the ROM (`jscheck_kg.py`; node runs the JS through pslMask's own combine `(base | set) &
~clear`, unicorn runs `0xd0f728`): 34 motions x statuses 0 / 1 / 2 / 3 / 6 / 7 / 10 / 11 / 13 x numbers (0..0x5f and 0xff for
2 / 3 / 7) x calm / enraged / tired x phase = **66744 runs, 0 mismatches** (18 distinct words).

Negative with control: the class band `0xd0f1f0..0xd22438` has exactly four `#0x13f4` immediates, `0xd0f8d4` / `0xd0f908` /
`0xd0f968` / `0xd0f990`, all in the method (the scan's own positive control); the same scan over uEm004_00's band finds that
class's six, all in `0xd2e0ec`.

**For psl-mask.js CLASS_MASK:**

    // KHEZU (em003_00), uEm003_00 vtable +0x13c = 0xd0f728 (vtable 0x17958f0; +0xf0 the base 0xca52c), READ whole
    // (0xd0f728..0xd0f9a0, jump table 0xd0f794) and emulated -- 66744 runs against the ROM, 0 mismatches
    // (dev/em003_00-effects-spec.md 1). 0xca170 first, then by the ACTION (e+0x73e0 / +0x73e1), then by motion:
    //   * the enraged group, bits 9-11, follows the action: status 7 n 0x00 / 0x02 / 0x0f / 0x11 / 0x12 / 0x30 / 0x44 / 0x48 /
    //     0x4e, status 3 n 0x43 / 0x4f / 0x55, status 2 n 0x00 / 0x05..0x08 / 0x0a / 0x0e CLEAR it (bfc 9, 3); status 7 n 0x09 /
    //     0x0a / 0x0b / 0x10 / 0x3b / 0x49 / 0x4f SET it (orr 0xe00) -- the charged plays op 0x1c issues while enraged and their
    //     plain twins (CLIP_ACTIONS below): u 260 / 261 / 262 on L0 M6, L2 M4 / M5 / M39, L2 M10, L2 M74 fire on the charged play
    //     only, never on a walk;
    //   * L2 M37 (0x225): bits 15-16 (u 261), but bits 17-18 (nothing named) on (7, 0x52)'s second play (P+0x1a1 == 3);
    //   * L2 M38 (0x226): bits 19-20 (u 320) under (7, 0x52) only;
    //   * every other motion: the base alone (L2 M3 / M12 / M28 / M41 ... fire one triple member per state).
    const EM003_OFF7 = new Set([0x00, 0x02, 0x0f, 0x11, 0x12, 0x30, 0x44, 0x48, 0x4e]);
    const EM003_ON7  = new Set([0x09, 0x0a, 0x0b, 0x10, 0x3b, 0x49, 0x4f]);
    const EM003_OFF3 = new Set([0x43, 0x4f, 0x55]);
    const EM003_OFF2 = new Set([0x00, 0x05, 0x06, 0x07, 0x08, 0x0a, 0x0e]);
    function em003_00(motion, action, state){
      const s = action ? action[0] : -1, n = action ? action[1] : -1;
      const off = (s === 7 && EM003_OFF7.has(n)) || (s === 3 && EM003_OFF3.has(n)) || (s === 2 && EM003_OFF2.has(n));
      let set = (s === 7 && EM003_ON7.has(n)) ? 0xe00 : 0;
      const a52 = s === 7 && n === 0x52;
      if (motion === 0x226) set |= a52 ? 0x180000 : 0;
      else if (motion === 0x225) set |= (a52 && (state.phase | 0) === 3) ? 0x60000 : 0x18000;
      return { set, clear: off ? 0xe00 : 0 };
    }
    // CLASS_MASK: em003_00;  PSL_MASK_MONSTERS: 'em003_00'

(SET and CLEAR never both apply to one action; the motion arm touches bits 15-20 only, so the order of the ROM — action
first, motion second — and pslMask's `(base | set) & ~clear` give the same word. R, by the 66744 runs.)

Inputs, and how the viewer supplies each:

* **`action`** — the play's, from CLIP_ACTIONS (§3); `null` = the base alone (no arm), which is the rage flag's word.
* **`state.phase`** — NEW: P+0x1a1 at the motion start, read on L2 M37 under (7, 0x52) only. The viewer has no phase; the play's
  CLIP_ACTIONS entry carries it (§3) and index.html passes it in the state (`clipPhaseFor`, the twin of `clipPostureFor`;
  em084's L0 M1 arm reads the same field and stays off, its entries naming none).
* rage / tired from the toggles; no part, rank, posture or sever input.

## 2. What the word changes — whole-block plan (150 file-mask -> 155 whole)

`add_effects.py plan` on the file masks and on the whole blocks (`<scratchpad>\bw1\planrows.py em003_00 [--whole]`), every binding
run through the ROM word per play (`classify.py` -> `cls_em003.txt`). **No record to export**: all 24 records the whole blocks
name are in docs/effects/em003_00.json (`bw2/recs.py`: 24 / 24). Every binding not listed sits on bits 0-5 and stays always on.

**Turned ON** (outside the file mask — 5, the survey's):

| binding | record | when |
|---|---|---|
| L2 M5 b0 f8 | c 30 (`cm202_001`) | every play |
| L2 M37 b15 f106-274 | u 261 (`em003_00_001`) | every play but (7, 0x52)'s second (phase 3) |
| L2 M5 b9 f14 | u 262 (`em003_00_002`) | the charged plays (7, 9) / (7, 0x4f) (enraged), and (7, 0x57) while enraged; never (7, 0) / (7, 0x4e) / (7, 0x11) / (7, 0x12) / (3, 0x43) |
| L2 M13 b6 f0 / b9 f0 | u 262 | calm / enraged (the base: L2 M13's plays (7, 5 / 0xe / 0x34 / 0x35 / 0x46 / 0x47 / 0x4d / 0x52) are not keyed) |

**Gated by the action** (in the file mask — the viewer fires them on every play today):

| binding | record | game |
|---|---|---|
| L0 M6 b9 f0-72 / b10 f72-228 | u 260 / u 261 | (7, 0xb) only (the enraged charge-walk); never on the walks (2, n) |
| L2 M4 b9 f0-75; L2 M39 b9 f11-102 | u 260; u 261 | (7, 9) / (7, 0x4f), and (7, 0x57) while enraged; never (7, 0) / (7, 0x4e) / (7, 0x11) (L2 M39 also never (7, 0x12) / (3, 0x43)) |
| L2 M10 b9 f0-126 | u 260 | (7, 0xa) only |
| L2 M74 b9 f0-54 / b10 f48-96 / b11 f127 | u 260 / u 261 / u 262 | (7, 0x10) only |
| L2 M38 b19 f66-126 | u 320 (`em003_00_021`) | (7, 0x52) only, every state; never (7, 0x2c) |

**Gated by state** (in the file mask, the base groups; the viewer fires all three today): L2 M3 / M41 / M43 / M51 / M59 / M60 /
M61 / M64 / M66 / M67 — b6 / b7 calm u 201 / u 200, b9 / b10 enraged u 201 / u 200, b12 / b13 tired u 211 / u 210 (M64 the
order swapped); L2 M12 / M28 — b6 / b7 calm u 260 / u 263 (M28 u 261), b9 / b10 enraged, b12 / b13 tired u 270 / u 271; L2 M45 b6
calm u 260. 82 in-mask bindings (every file-mask bit >= 6) change in all.

**Named but never enabled:** none. (L2 M37's bits 17-18 enabled by (7, 0x52) phase 3 name nothing.)

## 3. Which plays reach the keyed clips — CLIP_ACTIONS

Sources: the action main under unicorn (`<scratchpad>\kg\kprobe.py` over efx/agents/notice-scratch/probe.py, em byte 3, statuses
2 / 3 / 7, numbers 0..0x5f, postures 0 / 1 / 5 / 6: `k_probe0.txt`, `k_probe156.txt`), the setMotion sites (bw1/motsites.py over
`0xd0f1f0..0xd22438`), the status-7 dispatcher `0xd1c920` (table `0xd1c94c`, 0x5a words) and status-3 dispatcher `0xd15870`
(table `0xd158a0`, 0x63 words), the command table (emcfind; ops 0x1c / 0x24 per rom-map).

* **L0 M6** (0x006): the walks (2, 0 / 5 / 6 / 7 / 8 / 0xa / 0xe) at site `0xd11a24` (R); (7, 0xb) / (7, 0x3b) `0xd18158` site
  `0xd181ac` (R). g1 s55: `1c 00 (7, 0xb) | 1c 02` then op 0x35 (2, 3) / (2, 7) — (2, 3) plays L0 M7, (2, 7) L0 M6.
* **L2 M4** (0x204, site `0xd163e0`), **L2 M5** (0x205, `0xd167e8`) and **L2 M39** (0x227, `0xd16694`): all in `0xd162b8`, reached as
  (7, 0) / (7, 9) mode r1 0 / 1, (7, 0x4e) / (7, 0x4f) [sp] 1 with r1 0 / 1, (7, 0x11) and (7, 0x57) (one arm `0xd1cab4`), (7, 0x30)
  r3 1 (R, the dispatcher arms). L2 M4 is phase 0 (the jump); L2 M5 is the landing in phase 2 (`0xbf52c` hit and `P+0x14` < 0,
  `0xd167a0..0xd167e8`); L2 M39 follows `0xb09c8` (motion end) with `0xbf4d4` / `0xbc984` (`0xd16648..0xd16694`) — which play
  lands which way is the physics, not the mode (I: no mode test between). L2 M5 / L2 M39 are also played by `0xd18608`
  ((7, 0x12) / (7, 0x44): L2 M5 `0xd18864`, L2 M39 `0xd18adc`) and by `0xd14614` ((3, 0x43): L0 M21 first, then L2 M5 `0xd14754` /
  L2 M39 `0xd147e0`) (R, the sites; the dispatcher arms `0xd1cdb8` / `0xd1ccd4` / `0xd15cb0`).
* **L2 M10** (0x20a, `0xd16ce8`): (7, 2) / (7, 0xa), `0xd16c98` r1 0 / 1. **L2 M74** (0x24a, `0xd18488`): (7, 0xf) / (7, 0x10) /
  (7, 0x48) / (7, 0x49), `0xd1837c`.
* **L2 M37** (0x225) / **L2 M38** (0x226): (7, 0x2c) `0xd19c60` (sites `0xd19cbc` / `0xd19edc`, g1 s56 under op 0x24's else) and
  (7, 0x52) `0xd1b6c4` (g1 s88). (7, 0x52): phase 0 stores P+0x1a1 = 1 (`0xd1b71c`) then sets L2 M37 (`0xd1b740`) — word read at
  phase **1**; phase 2 (`0xd1b794`, reached only from the table's index 2: branches `0xd1b7d0` / `0xd1b7d8` / `0xd1b80c` / `0xd1b824` /
  `0xd1bbb8`) increments the phase (`0xd1bc0c..0xd1bc10`) and sets L2 M37 again (`0xd1bc2c`) — phase **3**; L2 M38 at `0xd1bd70`.
  L2 M13 sits between (`0xd1bc90`). R.

    // KHEZU (dev/em003_00-effects-spec.md 3). The enraged group follows the action (0xd0f728): each charged attack is op 0x1c's
    // enraged form of a plain one, so each entry's `rage` is the charged play. L2 M5 / L2 M39 are the landings of the L2 M4 jumps
    // and of (7, 0x12) / (3, 0x43); which way a jump lands is the physics. L2 M37 / M38: (7, 0x2c), and (7, 0x52) which plays
    // L2 M37 twice -- the second (`phase: 3`, the new field) without u 261 -- then L2 M38 with u 320.
    em003_00: {
      '0|Motion[6]':  [{ action: [2, 0x05] }, { action: [2, 0x07], rage: [7, 0x0b] }],
      '2|Motion[4]':  [{ action: [7, 0x00], rage: [7, 0x09] }, { action: [7, 0x4e], rage: [7, 0x4f] }, { action: [7, 0x11] },
                       { action: [7, 0x57] }],
      '2|Motion[5]':  [{ action: [7, 0x00], rage: [7, 0x09] }, { action: [7, 0x4e], rage: [7, 0x4f] }, { action: [7, 0x11] },
                       { action: [7, 0x57] }, { action: [7, 0x12] }, { action: [3, 0x43] }],
      '2|Motion[39]': [{ action: [7, 0x00], rage: [7, 0x09] }, { action: [7, 0x4e], rage: [7, 0x4f] }, { action: [7, 0x11] },
                       { action: [7, 0x57] }, { action: [7, 0x12] }, { action: [3, 0x43] }],
      '2|Motion[10]': [{ action: [7, 0x02], rage: [7, 0x0a] }],
      '2|Motion[74]': [{ action: [7, 0x0f], rage: [7, 0x10] }],
      '2|Motion[37]': [{ action: [7, 0x2c] }, { action: [7, 0x52], phase: 1 }, { action: [7, 0x52], phase: 3 }],
      '2|Motion[38]': [{ action: [7, 0x2c] }, { action: [7, 0x52] }],
    },

With these, the ROM's words per play (classify.py): L0 M6 u 260 / 261 on the second entry while enraged only; L2 M4 / M5 / M39 b9
on the first two entries while enraged only, on (7, 0x57) while enraged, never on the rest; L2 M10 / L2 M74 b9-11 while enraged;
L2 M37 b15 on entries 1-2; L2 M38 b19 on entry 2. (7, 0x4f) / (7, 0x09) with the rage toggle OFF — the forced-on case — is not
reachable from the AI (op 0x1c), and the entries do not show it.

## 4. What to implement, in order

1. psl-mask.js: `EM003_*` sets and `em003_00` as §1 into CLASS_MASK; `'em003_00'` into PSL_MASK_MONSTERS; CLIP_ACTIONS
   `em003_00` as §3; **`clipPhaseFor(monId, list, clip, n)`** (the twin of `clipPostureFor`: the entry's `phase`, undefined elsewhere).
2. index.html playNow: `const phase = clipPhaseFor(state.id, list, clip, plays.n);` and `phase` into the pslMask state object.
3. `add_effects.py em003_00 --apply` (CLIP_EFFECTS from the whole blocks: brings c 30 / u 261 / u 262 bindings; **no record export**),
   then `--check`. No `--record` needed unless --apply says otherwise (all 24 records exported). Recorder slot: not needed.
4. Soak with `--viewer-inputs`; Raven verifies: the electric glow u 260 / 261 on L0 M6 only on the enraged charge (not the walk);
   L2 M4 / M5 / M39 / M10 / M74 electricity only enraged and only on the charged entries; L2 M3 / M12 / M28 / M41 ... one triple
   member per state (calm u 201 / enraged u 201 again / tired u 211 — the files differ only by key, so the visible change is the
   tired one); u 261 on L2 M37's first two entries, u 320 on L2 M38's (7, 0x52) entry only; c 30 on L2 M5.

NOT READ, by name: `e+0x1409 & 0x40` (op 0x1c's "not enraged" override — when the plain form is issued while enraged); which
stream reaches (7, 0x30) / (7, 0x3b) / (7, 0x44) / (7, 0x48) / (7, 0x49) / (3, 0x43) (emcfind: none in em003_00_cmdtbl — a code-side
issuer NR; (7, 0x44) / (7, 0x12) are also `0xd13a10`'s follow-ups); which landing (L2 M5 / L2 M39) a given jump takes; what u 260 /
261 / 262 / 320 look like.

**Survey's other Khezu items:** soak clean, no undriven record, no refusal — the enable word was the only gap.
