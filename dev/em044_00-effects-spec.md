# Barroth (em044_00) — effects spec: the PSL enable word

Research agent for the Viewer agent, 2026-10-15 (dev/brute-wyverns-effects-survey.md "What closing each needs", item 4).
Static ROM reading plus unicorn controls; no recorder, no lift, no `--apply`, no docs/ edit. `R` = READ (the consuming
instruction read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: dev/brute-wyverns-effects-survey.md (Barroth: 13 bindings outside the file mask, 93 file-mask / 106
whole-block; unexported c 40), rom-map.md ("The PSL enable word per class": uEm044_00 `0x17c1434` / `0xe8d714` UNREAD; "THE PSL
ENABLE MASK"; the `0x6fe88`, `0x81d6c` / `0xbf62c`, `0xa3bf4`, `0x3a8430` rows), docs/render/psl-mask.js whole,
dev/em043_00-effects-spec.md (written just before, same method), E:\offline\decode\notes\states-em044_00.md (its vtable table and
§4.6 name this slot "attack hit groups -- and it reads the mud mask" and read the L2 M12 / M13 arm's three values; **the slot is
the PSL enable word** (rom-map's withdrawn "hit groups" trap) and it has four more arms; §4.1 the mud byte, §4.5 the wallow, §5.1
the (2, 6) turn table, §7 the shared clips, §8.1 the burrow — theirs, cited where used), motion-states.js MOTION_STATES em044_00,
part-rest.json, the task board (grep: only the survey's line 1096). Scratch: `<scratchpad>/bw1/` (emu13c_bw.py, jscheck_bw.py,
b44act.py — a copy of efx/agents/barroth-scratch/b44act.py — turntabs.py, calls.py, motsites.py, the plans).

## 1. The word — uEm044_00 vt+0x13c = `0xe8d714` — R, emulated

Vtable **`0x17c1434`** (checked: `+0xf0` = base `0xca52c`, `+0x370` = `0xa3bf4`, `+0x1f4` = `0xe8c7b0` the action main,
`+0x208` = `0xe8cbfc`, `+0x210` = `0xe8caa8`, `+0x3e8` = `0x75330`). Extent **`0xe8d714..0xe8d854`**: one
`push {r4, r5, fp, lr}`; exits `poplt` `0xe8d798` and `pop` `0xe8d854` (every other path branches there); the word at
`0xe8d858` is the method's PIC literal (`0x9a44c4`: `0xe8d790 + 0x9a44c4` = GOT **`0x1831c54`** -> `0x1883c70`, the global whose
object `0x3a8430` reads); `0xe8d85c` is the next function's `push`.

    0xe8d720  bl 0xca170                                   ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0xe8d728  motion > 0x201 (`bgt`) -> 0xe8d768
    0xe8d730    motion > 0xf -> return
    0xe8d740    tst 0xa058, 1 << motion                    ; L0 M3, M4, M6, M13, M15
    0xe8d74c      0x81d6c(e) != 0 -> return                ; posture P+0x1ba == 4 AND P+0x5c < 0.9 x MoguriBaseOfs: sunk
    0xe8d760      else |= 0x18000000 (bits 27-28)
    0xe8d81c    else motion == 0xb (L0 M11) and status e+0x73e0 == 1 (`movweq / ldrbeq / cmpeq`) and number e+0x73e1 == 0xe
                or 2 (`cmp #0xe / cmpne #2`) -> |= 0x1800000 (bits 23-24); else return
    0xe8d768  motion - 0x20c < 2 (L2 M12 / L2 M13) -> 0xe8d7ac:
                m = byte e+0xcada (THE MUD MASK: bit set = that part's mud gone; bit 0 head, bit 1 back -- states-em044_00.md §4.1)
                (m & 3) == 3 -> return                     ; head and back both bare: nothing
                r2 = 0x18000 (bits 15-16)                  ; head muddy, back bare
                (m & 3) == 0 -> r2 = 0x180000 (bits 19-20) ; both muddy
                m & 1 (`tst` + `movne`) -> r2 = 0x60000 (bits 17-18)  ; head bare, back muddy
                |= r2
    0xe8d774  motion - 0x406 < 2 (L4 M6 / L4 M7) -> 0x3a8430([[0x1883c70]]) < 5 -> return (`poplt`), else |= 0x600000 (bits 21-22)
    0xe8d7e4  motion == 0x202 (L2 M2) -> e->vt[+0x370](e, 1) (0xa3bf4, P+0x3b4 bit 0: tail severed) != 0 -> return,
                else |= 0x6000000 (bits 25-26)
    every other motion: the base alone

Every write goes through the write-back pointer `ldr r0,[r4,r0]!` (r0 = the `movw #0x13f4` before it: `0xe8d75c`, `0xe8d7a0`,
`0xe8d7d4`, `0xe8d810`, `0xe8d848`) and the one `str r0,[r4]` at `0xe8d850`. Every `bl` followed: `0xca170`, `0x81d6c` (->
`0xbf62c` -> `0x712a0`), `0x3a8430` (read whole, `0x3a8430..0x3a846c`: `[[obj+0xa4]+0xf]` as a signed byte, returns 5 / 3 / 1 for
those values, else 0 — so ">= 5" is "byte == 5"), `0xa3bf4`.

**Variant tests: none** — the class band `0xe83434..0xe8f0b8` has no `e+0xb5f5` immediate at all (`immscan.py`; the decode note:
"the class has no variant branch"). Inputs: motion; action (L0 M11 only, status 1); P+0x1ba / P+0x5c (the sunk test); the
enemy byte e+0xcada (not P); the sever bit; the rank byte. No break level, no rage test of the class's own.

Negative with control: the band has exactly five `0x13f4` immediates, all in the method (above); the same scan finds uEm043_00's
two (`0xe81018`, `0xe8108c`) and, over `0xe60000..0xe72738`, uEm038_00's and uEm042_00's.

**Emulated** (`<scratchpad>/bw1/emu13c_bw.py`; controls reproduced first — Deadeye / Garuga, Akantor and Ukanlos words, see
dev/em043_00-effects-spec.md §1; mud = e+0xcada, rank = the byte behind `0x3a8430`):

| case | word |
|---|---|
| L0 M3 calm; L0 M4 enraged; L0 M15 tired | `0x180001ff`; `0x18000e3f`; `0x1800703f` |
| L0 M6 (2, 2) surface; (6, 6) posture 4, P+0x5c -1500, base -1500 (sunk); (6, 3) posture 4, P+0x5c 0 | `0x180001ff`; `0x1ff`; `0x180001ff` |
| L0 M13 (6, 2) sunk | `0x1ff` |
| L0 M11 (1, 2) calm; (1, 0xe) enraged; (1, 0); (10, 0x2a); (1, 2) sunk | `0x18001ff`; `0x1800e3f`; `0x1ff`; `0x1ff`; `0x18001ff` |
| L2 M12 mud 0 / 1 / 2 / 3 | `0x1801ff` / `0x601ff` / `0x181ff` / `0x1ff` |
| L2 M13 mud 0x3c (legs and tail bare, head and back muddy); 0x3d enraged; L2 M12 0x22 tired | `0x1801ff`; `0x60e3f`; `0x1f03f` |
| L4 M6 rank byte 5 / 3 / 1 / 7; L4 M7 (1, 7) rank 5 enraged | `0x6001ff` / `0x1ff` / `0x1ff` / `0x1ff`; `0x600e3f` |
| L2 M2 (7, 1) intact / severed / enraged | `0x60001ff` / `0x1ff` / `0x6000e3f` |
| L3 M11, L0 M23 | `0x1ff` each |

The transcription below against the emulator (`jscheck_bw.py`): 22 motions x 9 actions x sever x calm / enraged / tired x 4
posture / P+0x5c cases x mud (9 values on L2 M12 / M13, 2 elsewhere) x rank (0 / 1 / 3 / 5 / 7 on L4 M6 / M7, 2 elsewhere) =
**27648 runs, 0 mismatches**.

**For psl-mask.js CLASS_MASK:**

    // BARROTH (em044_00), uEm044_00 vtable +0x13c = 0xe8d714 (vtable 0x17c1434; +0xf0 the base 0xca52c), READ whole
    // (0xe8d714..0xe8d854; literal 0xe8d858 -> GOT 0x1831c54) and emulated (dev/em044_00-effects-spec.md 1). 0xca170 first,
    // then by motion id -- no variant test (the class has none):
    //   * L0 M3 / M4 / M6 / M13 / M15 (0xa058): bits 27-28 unless 0x81d6c (posture 4 and P+0x5c < 0.9 x MoguriBaseOfs:
    //     under the ground) -- c 0 / c 1 / c 2 / c 3, the footfalls, on the surface only;
    //   * L0 M11: status 1, number 2 or 0xe -> bits 23-24 -- c 90 on the rage roar (1, 2) and (1, 0xe), not on (1, 0) or the
    //     paralysis / stun / shock-trap recoveries;
    //   * L2 M12 / M13: the mud byte e+0xcada (bit 0 head, bit 1 back gone): both muddy bits 19-20 (u 360), head bare bits
    //     17-18 (u 350), back bare bits 15-16 (u 340), both bare nothing;
    //   * L4 M6 / M7: 0x3a8430 == 5 (the rank byte the viewer calls G) -> bits 21-22 (u 210 on L4 M6);
    //   * L2 M2: vt+0x370(e, 1) = 0xa3bf4 (the tail severed) -> nothing, else bits 25-26 (c 40).
    function em044_00(motion, action, state){
      if (motion <= 0xf && ((0xa058 >>> motion) & 1)) return state.sunk ? 0 : 0x18000000;
      if (motion === 0x00b) return action && action[0] === 1 && (action[1] === 2 || action[1] === 0xe) ? 0x1800000 : 0;
      if (motion === 0x20c || motion === 0x20d){
        const m = (state.mud | 0) & 3;
        return m === 3 ? 0 : m === 0 ? 0x180000 : (m & 1) ? 0x60000 : 0x18000;
      }
      if (motion === 0x406 || motion === 0x407) return state.rank === 5 ? 0x600000 : 0;
      if (motion === 0x202) return state.severed ? 0 : 0x6000000;
      return 0;
    }

Inputs, and how the viewer supplies each:

* **`state.mud`** — NEW: the low two bits of e+0xcada, read from the parts SHOWN. His part pass draws the head mud set 9 (group 2
  on) or 10 (group 2 off) and the back set 13 (group 8 on) or 14 (off) straight from the byte (states-em044_00.md §4.1 / §4.2;
  monsters.json em044_00 groups[9] / [10] / [13] / [14]: exactly those). The byte is 0 at spawn (§4.1, all mud on) and his resting
  sets (part-rest.json: 3, 5, 7) name neither group, so a group no set has switched is drawn — muddy. So the input is
  **`mud = (drawn.get(2) === false ? 1 : 0) | (drawn.get(8) === false ? 2 : 0)`** (`=== false`, not `!== true`). Proposed home:
  motion-states.js `SHELL_MUD = { em044_00: { head: 2, back: 8 } }` and `shellMudInput(monId, drawn)` beside `shellTailInput`;
  index.html passes `mud` in pslMask's state. His rows already move the groups: L3 M2 (head set 10, back set 14), L3 M1 (the head
  breaking off forces set 10, as the ROM forces bit 0 — §3.4), L4 M3 / L4 M7 (all mud back on: sets 9 / 13 ...). R (the byte's
  meaning and the sets are the note's; the arm's reading of them here).
* **`state.rank`** — NEW to pslMask's state: the byte `0x3a8430` reads. index.html already states the viewer's quest rank,
  `SHELL_QUEST_RANK = 5` ("G"); pass `rank: SHELL_QUEST_RANK`. What the byte IS remains NR (rom-map's `0x3a8430` row); the
  viewer's 5 is its stated stand-in, and the wallow's own G remap ((1, 6) -> (1, 0xc), (1, 0x12) -> (1, 0x13) at
  `questRank >= 5`, vt+0x1fc, states-em044_00.md §4.5) reads the same byte.
* **`state.severed`** — P+0x3b4 bit 0. His part pass: `setVisibleGroup(e, vt+0x370(e, 1) == 1 ? 8 : 7)` (states-em044_00.md §2);
  monsters.json groups[8] = part 12 (the stump) on, 101 off; groups[7] the reverse; no other set names 12. So **`SHELL_TAIL.em044_00
  = { severed: 12 }`**. His sever row `'3|Motion[16]'` levels `[[19, 7], [20, 8]]` takes it there. R.
* **`action`** — L0 M11 only. With `null` bits 23-24 are OFF, so **without a CLIP_ACTIONS entry c 90 (in the file mask, fired
  today) stops firing on the rage roar** — the entry is required (§3).
* **`state.sunk`** — as Deviljho's (dev/em043_00-effects-spec.md §1, §4): the stand-in `false` for surface plays, a CLIP_ACTIONS
  `sunk` field for the burrow play. His MoguriBaseOfs is -1500.0 (`.dtb`, states-em044_00.md §8.1), so "sunk" is P+0x5c < -1350.

## 2. What the word changes — whole-block plan (93 file-mask -> 106 whole)

`add_effects.py em044_00` (plan: "29 records can go in (29 already are)") and `<scratchpad>/bw1/planrows.py em044_00 [--whole]`;
`recs.py`. Every binding not listed sits on bits 0-5 inside the file mask and stays always-on. No binding of his sits on bits 6-14,
so the base's state groups change nothing on screen.

**Turned ON, always** (outside the mask, bits 0-1 — 4):

| binding | record |
|---|---|
| L2 M9 b0 f95 | c 7 (`cm202_002`) |
| L2 M11 b1 f87 | c 1 (`cm202_001`) |
| L3 M23 b0 f130, 232 / b1 f79, 187, 258 | c 1 / c 0 |

**Turned ON, on the surface only** (outside the mask; off when sunk — 8):

| binding | record |
|---|---|
| L0 M3 b27 f59 / b28 f28 | c 0 / c 1 (`cm202_001`) |
| L0 M4 b27 f55 / b28 f17 | c 0 / c 1 |
| L0 M6 b27 f52 / b28 f14, 90 | c 0 / c 1 |
| L0 M13 b27 f55 / b28 f22 | c 2 / c 3 (`cm202_002`) |

**Turned ON while the tail is on** (outside the mask — 1): **L2 M2 b25 f67, c 40 (`cm202_031`, not exported)**.

**Gated** (in the file mask — the viewer fires them on every play today — 8):

| binding | record | game |
|---|---|---|
| **L0 M11 b23** f165-187 | c 90 (`cm202_050`) | only on (1, 2) / (1, 0xe) — the rage roar, not the recoveries |
| **L2 M12 b19** f95-118 / **L2 M13 b19** f0-25 | u 360 (`em044_00_004`) | head and back both muddy |
| **L2 M12 b17** / **L2 M13 b17** | u 350 | head bare, back muddy |
| **L2 M12 b15** / **L2 M13 b15** | u 340 | head muddy, back bare (none of the three with both bare) |
| **L4 M6 b21** f94-172 | u 210 (`em044_00_005`) | rank byte 5 only (u 200 on b1 always) |

So L2 M12 / M13 fire ONE of u 340 / 350 / 360 per play (today all three), and none once head and back are both bare.

**Named but never enabled:** none. **Turned OFF:** none. (Enabled, named in no block: bit 24 on L0 M11; 16 / 18 / 20 on L2 M12 /
M13; 22 on L4 M6 / M7, 21 on L4 M7; 26 on L2 M2; 27-28 on L0 M15.)

Counts: 13 out-of-mask = 4 always + 8 surface + 1 tail (the survey's 13); 8 in-mask gated.

**Records to export with the `--apply`:** **c 40** (the only one).

## 3. Which plays reach the keyed clips — CLIP_ACTIONS

Sources: the action main under unicorn (`<scratchpad>/bw1/b44act.py`, statuses 0 / 1 / 2 / 6 / 7 / 12 at postures 0 and 4),
`motsites.py`, `turntabs.py` (turn tables, `0x772b4` plays `+0x10` straight / `+0x20` / `+0x30` sides), the command table
(`em044_00_cmdtbl.emc`, barroth-scratch/emcfind.py).

* **L0 M11** (0x00b): **(1, 2)** the rage roar (cmdtbl g6 s0, the forced transition; g5 s0; g0 s6), **(1, 0xe)** (g13 s0) and
  **(1, 0)** (g8 s1, g9 s0) — setMotion0 blend 6 (sites `0xe83fd4`, `0xe846b8`); **(10, 0x2a / 0x2b / 0x70 / 0xa9 / 0xc5)** the
  paralysis / stun / shock-trap / other recoveries (states-em044_00.md §7, theirs). The word fires c 90 on the first two only.
* **L0 M6** (0x006): the walk (2, 0 / 1 / 2 / 3 / 4 / 5 / 0xc / 0xd / 0x14 / 0x1f / 0x20), setMotion0 at posture 0 (sites
  `0xe84af8`, `0xe85274`, `0xe85844`; posture 0 at `0xe84ae4`, `0xe85260`, `0xe8582c`) — footfalls on; **(6, 3) / (6, 6) / (6, 0xe)**
  the travel under the ground, `0xe86430`: posture 4 (`0xe864a8`), setMotion0 L0 M6 (`0xe864bc`), only then `P+0x5c =
  MoguriBaseOfs` (`0xe864e4` / `0xe864ec`) and u 1400 (`b 0xa499c`, `0xe86504`). The word reads the P+0x5c the previous action left.
  Every posture-4 action sets it after its own motion — (0, 7) the underground hold `0xe83dbc` (`0xe83e00..0xe83e28`), (6, 1)
  `0xe862a0` (`0xe86310` / `0xe86318`), (6, 2), (6, 4) `0xe86544` (`0xe865c4` / `0xe865d4`), the L4 M3 re-coats — as does the area
  entry vt+0x224 (`0xe8d1fc`, he arrives under the ground, §8.1); the dive (6, 0) `0xe861ac` plays L4 M4 at posture 0 and ends in
  vt+0x3e8 = **`0x75330`** (shared: posture 4, then changeAction (0, 7) unless status 0xb, then `0x82454`). The streams issue (6, 6)
  after (6, 1) / (6, 4) (g2 s0, g1 s76) and (6, 0xe) after (6, 4) (g12 s0); (6, 3) by none. **So the burrowed L0 M6 starts sunk —
  footfalls off** (R the sites and those streams; I that no surface action ever precedes it — g1 s14's (6, 6) arms were not walked).
* **L0 M3 / L0 M4 / L0 M15**: turn table **`0x169e664`** {L0 M15 straight; L0 M3 / L0 M4 sides} — the (2, 6) turn (`0xe84c08`,
  `0xe85aec`, posture 0; states-em044_00.md §5.1 names the table) and the burrowed turn **(6, 4)** `0xe86544` (posture 4; cmdtbl g1
  s76, g2 s0, g12 s0). L0 M15 is also the straight of `0x169e6a4` {L0 M15; M16 / M17} (`0xe84f50`) and `0x169e724` {L0 M15; M8 / M9}
  (`0xe855fc`).
* **L0 M13**: a side of `0x169e6e4` {-; L0 M13 / L0 M14} (`0xe853a0`, posture 0), and **(6, 2)** `0xe86364` (posture 4 `0xe863b8`,
  setMotion0 L0 M13 `0xe863cc`, P+0x5c after; issued by no stream).
* L2 M12: (7, 0 / 3 / 0xe / 0xf), site `0xe86d8c`; L2 M13: site `0xe89da4` (a later phase; which action: NR) — no action read, the
  mud decides. L4 M6: (1, 6 / 0xc / 0x12 / 0x13) -> `0xe841b0` phase 0, posture 0, site `0xe84234` (the wallow, six loops — §4.5);
  L4 M7: (1, 7 / 0x14) `0xe842bc`, site `0xe84340`. L2 M2: (7, 1), site `0xe8a108`.

    // BARROTH (em044_00), the plays of the clips the word (0xe8d714) keys on an action or the burrow:
    //   L0 M11: (1, 2) the rage roar -- c 90 (bits 23-24; (1, 0xe) the same); (10, 0x2a) the paralysis recovery -- none
    //     ((1, 0) and the other recoveries the same). REQUIRED: with no action the bits are off.
    //   L0 M6: the walk (2, n) at posture 0 -- c 0 / c 1 footfalls; (6, 6) under the ground (0xe86430, posture 4, u 1400) --
    //     begun sunk (0x81d6c), no footfalls.
    em044_00: {
      '0|Motion[11]': [{ action: [1, 2] }, { action: [10, 0x2a] }],
      '0|Motion[6]':  [{ action: [2, 0] }, { action: [6, 6], posture: 4, sunk: true }],
    },

(The burrowed turn (6, 4) on L0 M3 / M4 / M15 and (6, 2) on L0 M13 are left out: the viewer shows those clips as surface turns.
Add `{ action: [6, 4], posture: 4, sunk: true }` / `{ action: [6, 2], posture: 4, sunk: true }` to show them.)

**Flag, not the word's:** MOTION_STATES em044_00 `'0|Motion[6]': { hold: ['em044_00u', 1400] }` holds u 1400 on every L0 M6 play;
the ROM starts it only from the burrow (`0xe86504` is the class's one `0xa499c` site); with the two entries above the walk play
would carry it too — a MOTION_STATES keying question for the Viewer agent.

## 4. What to implement, in order

1. psl-mask.js: `em044_00` as §1 into CLASS_MASK; `'em044_00'` into `PSL_MASK_MONSTERS`; CLIP_ACTIONS `em044_00` as §3 (the L0 M11
   entry in the same change, or c 90 goes dark); `clipSunkFor` if not already added with Deviljho (dev/em043_00-effects-spec.md §4).
2. motion-states.js: `SHELL_TAIL.em044_00 = { severed: 12 }`; `SHELL_MUD = { em044_00: { head: 2, back: 8 } }` and `shellMudInput`.
3. index.html playNow: pass `mud: shellMudInput(state.id, partsDrawn)`, `rank: SHELL_QUEST_RANK` and the play's `sunk` (from
   `clipSunkFor`) in pslMask's state (every other monster's word ignores `mud` / `rank`).
4. `add_effects.py em044_00 --apply` (CLIP_EFFECTS from the whole blocks; exports c 40), `--record`, `--check`. Recorder slot —
   announce (efx: one recorder and one lift at a time).
5. Soak with `--viewer-inputs`; Raven verifies: c 90 on the rage roar's L0 M11 and not on the recovery play; one of u 340 / 350 / 360
   on L2 M12 / M13 by the head and back mud shown (none with both stripped, u 360 after a re-coat); u 210 on the wallow at G; c 40 on
   L2 M2 with the tail on; c 0 / c 1 / c 2 / c 3 footfalls on the surface turns and walk, none on the burrow entry.

NOT READ, by name: what the `0x3a8430` byte is (rom-map; the viewer's 5 = "G" stand-in); whether any surface action can precede a
burrowed L0 M6 / L0 M13 / turn (g1 s14's arms; I: none); which action plays L2 M13 (site `0xe89da4`); the status-10 recovery scripts'
plays of L0 M11 (states-em044_00.md §7, not re-read); what u 340 / 350 / 360, u 210 and c 40 look like.
