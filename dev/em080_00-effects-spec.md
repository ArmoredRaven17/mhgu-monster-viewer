# Glavenus (em080_00) and Hellblade Glavenus (em080_04) — effects spec: the PSL enable word

Research agent for the Viewer agent, 2026-10-15 (the Brute Wyverns survey, "What closing each needs" 1 and 4). Static
ROM reading plus unicorn controls; no recorder, no lift, no `--apply`, no docs/ edit. `R` = READ (the consuming
instruction read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: dev/brute-wyverns-effects-survey.md (Glavenus 24 / Hellblade 30 outside the file mask; 184 / 221
file-mask bindings, 208 / 251 whole-block; unexported c 50 c 51 c 52 c 53 u 430 u 501, + u 511 on Hellblade; "c 0 exported
but undriven"), rom-map.md ("The PSL enable word per class" row uEm080_00 `0x1000910` UNREAD; the uEm080_00 section: the
selector `[e+0x1428]+0x1bb` read by the frame handler `0xfffb24`, its writers `0xffe438..` "what the bits mean NOT READ",
the RULED key-0 leftovers), E:\offline\decode\notes\states-em080_00.md (§1.1 the init, §1.5 **already transcribes this
word** -- "what reads e+0x13f4: NOT READ", answered by rom-map's PSL section; §3 the heat) and states-em080_04.md (§4 the
P+0x1bb bit table for variant 4), docs/render/psl-mask.js whole, motion-states.js em080_00 / em080_04 (the heat comment,
H_TAIL), part-review.json em080_00 / em080_04 (Tail, Throat rows), monsters.json groups, index.html playNow / synthIndex,
the task board (grep Glavenus / Hellblade: the 2026-09-23 "glow layer's display flag" item and the enrage material
machine; nothing on this word). Scratch: `<scratchpad>/bw3/` (emu_bw.py, jscheck.py, words.mjs, classify.py, the plans).

**A correction to the brief first.** "c 0 bound only outside the mask (L0 M3 / M4 / M6 b27, L3 M23 b1; Hellblade L0 M6
b30)" is the survey's **Barroth** line (c 0, line 75) and **Uragaan** line (line 87), not Glavenus's. Glavenus's and
Hellblade's c 0 is bound **inside** the file mask, `L0 M6 b0 f98` (em080_00c 0, `cm202_001`), on bits 0-5 -- always on.
Why it is "exported but undriven" is a tooling fault, not the word (§2.4).

## 1. The word — uEm080_00 vt+0x13c = `0x1000910` — R, emulated

Vtable **`0x17eac74`** (checked: `+0xf0` = base `0xca52c`, `+0x1d0` = `0x1000974`, the next method; `+0x208` =
`0xfffb24`). One class for both (states-em080_04.md: the vtable diff is empty both ways; Hellblade is `e+0xb5f5 == 4`).
Extent **`0x1000910..0x1000970`**: `push {r4, lr}`, one `pop {r4, pc}` at `0x1000970`, no branch but the `bl 0xca170`;
`0x1000974` is vt+0x1d0 (rom-map). 25 instructions:

    0x1000918  bl 0xca170                                  ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0x1000924  ldr r0, [r4, #0x13f4]!                       ; r4 = e + 0x13f4 from here on (pre-indexed)
    0x1000928  ldr r1, [r4, #0x34]                          ; = [e + 0x1428] = P -- the pointer, not a new offset
    0x100092c  b = P+0x1bb:
               r3 = 0x0c000000 (bits 26-27); bit 2 (tst #4)    -> r3 = 0x00038000 (bits 15-17)
                                             bit 4 (tst #0x10) -> r3 = 0x70000000 (bits 28-30)     ; |= r3, str
    0x100094c  b = P+0x1bb (re-read):
               r2 = 0x00300000 (bits 20-21); bit 0 -> 0x00c00000 (22-23); bit 1 -> 0x000c0000 (18-19);
                                                                     bit 3 -> 0x03000000 (24-25)   ; |= r2, str
    every motion, every action, both variants: the same two fields

**It reads no motion, no action, no variant, no part and no sever** -- only the byte P+0x1bb, Glavenus's heat bitfield.
The later test wins in each field (`movne` chains): throat overheat over throat lit; tail overheat over hot over dark.
The decode note's §1.5 transcription matches this read; its "what reads e+0x13f4" is the PSL walker (rom-map, "THE PSL
ENABLE MASK").

The bits of P+0x1bb (the decode notes' reads, cited -- theirs):

| bit | meaning | Glavenus (variant 0) | Hellblade (variant 4) |
|---|---|---|---|
| 0 | tail **dark** | gauge `e+0xcae4` falls to <= 0 (bit 1 drops the same frame); L2 M16 (7, 0x10 / 0xf8) f190 clears it (states-em080_00.md §3) | never (states-em080_04.md §4) |
| 1 | tail **hot** | gauge >= 100 | set by the init `0xffe43c`; cleared only by the tail machine's death entry `0x100bcac` |
| 2 | throat **lit** | action start of (7, 8) / (7, 0xf2) (L2 M8); cleared by the tired branch at the next action start and (10, 0x72) | set by the init `0xffe478`; never cleared |
| 3 | tail **overheat** | never | L2 M16 f190 `0x10048f0`; cleared by its 5400-frame timer, the tail break, the sever, death |
| 4 | throat **overheat** | never | action start of (7, 8) / (7, 0xf2), `0xfff940`; cleared by its timer, (10, 0x72) part 0, death |

So the word, per state:

| field | Glavenus | Hellblade (in life) |
|---|---|---|
| throat | lit -> bits 15-17; not lit -> 26-27 | lit -> 15-17; overheating -> 28-30 (26-27 never) |
| tail | normal -> 20-21; hot -> 18-19; dark -> 22-23 | hot -> 18-19; overheating -> 24-25 (20-21 only on the corpse, 22-23 never) |

Negative with control: the class band `0xffe0dc..0x100c340` has exactly one `0x13f4` immediate, `0x100091c`; the same
scan over uEm018_00's band finds its four.

**Emulated** (`<scratchpad>/bw3/emu_bw.py`, the same emulator and controls as dev/em063_00-effects-spec.md §1 -- Ukanlos,
Deadeye / Garuga, Akantor reproduced; case field 12 = the byte P+0x1bb):

| P+0x1bb (L2 M5, calm) | word |
|---|---|
| 0x00 | `0x0c3001ff` |
| 0x01 dark / 0x02 hot / 0x03 | `0x0cc001ff` / `0x0c0c01ff` / `0x0c0c01ff` |
| 0x04 throat / 0x05 / 0x06 | `0x003381ff` / `0x00c381ff` / `0x000f81ff` |
| 0x08 / 0x0a / 0x0e | `0x0f0001ff` / `0x0f0001ff` / `0x030381ff` |
| 0x10 / 0x14 / 0x16 | `0x703001ff` / `0x703001ff` / `0x700c01ff` |
| 0x1e / 0x1f | `0x730001ff` / `0x730001ff` |
| L0 M6 v4 0x16 enraged; L0 M6 v0 0x00 severed tired; L9 M10 v4 0x06 | `0x700c0e3f`; `0x0c30703f`; `0x000f81ff` |

And the transcription below against the ROM (`jscheck.py`): 9 motions x rage / tired x sever x variant 0 / 4 x all 32
byte values -- **4608 runs, 0 mismatches**; the same checker with one constant mutated (dark -> `0xc000000`) reports 576.

**For psl-mask.js CLASS_MASK:**

    // GLAVENUS (em080_00) and HELLBLADE GLAVENUS (em080_04), one class uEm080_00 (vtable 0x17eac74; +0xf0 the base
    // 0xca52c), vtable +0x13c = 0x1000910, READ whole (0x1000910..0x1000970) and emulated (dev/em080_00-effects-spec.md 1).
    // 0xca170 first, then two fields from the heat byte P+0x1bb (reached as [e+0x13f4+0x34] after the pre-indexed load) --
    // no motion, action, variant or part input:
    //   throat: bit 4 (overheat, Hellblade) -> bits 28-30; else bit 2 (lit) -> bits 15-17; else bits 26-27;
    //   tail:   bit 3 (overheat, Hellblade) -> bits 24-25; else bit 1 (hot) -> 18-19; else bit 0 (dark) -> 22-23;
    //           else bits 20-21.
    // So every clip's throat and tail effects come in forms, one per heat state (L2 M1 u 260 / 261 lit, c 42 / c 90 not;
    // L2 M13 u 430 per tail state; L2 M14 c 51 + u 500 hot / normal / dark, u 511 + u 512 overheat ...).
    // state.heat = that byte as the parts shown give it (motion-states.js glavenusHeat).
    function em080(motion, action, state){
      const h = state.heat | 0;
      const throat = (h & 0x10) ? 0x70000000 : (h & 4) ? 0x38000 : 0xc000000;
      const tail = (h & 8) ? 0x3000000 : (h & 2) ? 0xc0000 : (h & 1) ? 0xc00000 : 0x300000;
      return throat | tail;
    }
    // CLASS_MASK: em080_00: em080, em080_04: em080

Inputs, and how the viewer supplies each — **one new field, `state.heat`** (the P+0x1bb byte), built in motion-states.js
from what the viewer already shows (`glavenusHeat(monId, drawn, tailItem)`), and passed by index.html playNow into
pslMask's state:

* **Glavenus**: bit 1 (tail hot) = **part 40 drawn**: the hot sets 23 / 24 / 25 are the only sets drawing part 40
  (monsters.json em080_00 groups[23..25]: 40 on; 20..22: 40 off), and the Tail row's three "Heated" items all draw it
  (part-review.json). R (sets) -- the ROM swaps 20..22 -> 23..25 on the same bit (states-em080_00.md §0 "TAIL HOT").
  Bit 2 (throat lit) = **part 60 drawn** -- the Throat row's "Heated" item. **I**: in the ROM part 60 is drawn the
  whole life (set 4; the lit state is the `XfBA1_m06_nodo_r` heat_Loop material clip only, states-em080_00.md §3), so the
  viewer's Throat row is Raven's display of the bit, not the ROM's mesh switch; it is the state the user chose. Bit 0
  (dark): **no viewer state** -- the dark tail is material-only (the hot groups go off, the same parts as normal), and no
  row offers it: STAND-IN 0, named; with it the dark forms (bits 22-23: L2 M13 u 430, L2 M14 c 51 / u 500, L2 M36 c 52 /
  u 501, L2 M37 c 52 / u 502 -- the same records as the normal forms, at the same frames) never show, and the normal
  forms show in their place.
* **Hellblade**: bit 1 and bit 2 **always** (in life; the init sets both, only death clears bit 1, nothing clears bit 2
  on variant 4 -- states-em080_04.md §4). Bit 4 (throat overheat) = **part 70 drawn** (set 5 = 60 off, 70 / 80 on, the
  Throat row's "Blasted"; set 4 = 60 on, 70 / 80 off). R (sets). Bit 3 (tail overheat) = **the Tail row's synth item is
  a "(Blasted)" one** -- its `clip` is `XfBA1__m04_tail: overheat_Loop` (part-review.json em080_04; index.html
  synthIndex / synthPicked) -- the overheat moves no mesh (states-em080_04.md §0), so the parts drawn cannot say it.
  The Throat row's "Normal" (none drawn) is not a live Hellblade state: with bit 2 constant, it still reads lit.

        export function glavenusHeat(monId, drawn, tailOverheat){
          const d = p => !!drawn && drawn.get(p) === true;
          if (monId === 'em080_00') return (d(40) ? 2 : 0) | (d(60) ? 4 : 0);            // dark: no viewer state
          if (monId === 'em080_04') return 2 | 4 | (tailOverheat ? 8 : 0) | (d(70) ? 0x10 : 0);
          return 0;
        }

* rage / tired from the toggles (the base groups); no action, so **no CLIP_ACTIONS** for either monster.

## 2. What the word changes — whole-block plan (Glavenus 184 -> 208, Hellblade 221 -> 251)

`add_effects.py em080_00` / `em080_04` (plan; `planwhole.py <mon> [--whole]`). Glavenus: 50 records in the file plan (48
exported; the two missing are **c 50 / c 53**, file-mask bits 0-5, `cm202_020`, no longer refused as stage rays --
they come in with any `--apply`, word or not), 54 in the whole -- **c 51, c 52, u 430, u 501 come in**. Hellblade: 60 /
57 file (missing c 50, c 52, c 53), 64 whole -- **c 51, u 430, u 501, u 511 come in**. Classified against the
transcription over the states each variant reaches (`classify.py`: Glavenus P+0x1bb in {0, 1, 2, 4, 5, 6}, Hellblade
{6, 0xe, 0x16, 0x1e}). Every binding not listed sits on bits 0-5 and stays always-on.

### 2.1 Turned ON, always (outside the file mask)

| binding | record | monsters |
|---|---|---|
| L2 M56 b0 f19 / b1 f49 | c 10 (`cm202_002`) / c 1 (`cm202_001`) | both |
| L9 M10 b2 f254-289 | c 70 (`cm202_040`) | Hellblade |

### 2.2 Turned ON, gated by the heat (outside the file mask)

| binding (frames) | record | Glavenus | Hellblade |
|---|---|---|---|
| L2 M13 b18 / b20 / b22 / b24 (f88) | u 430 (`cm202_030`) -- to export | hot / normal / dark / never: **one u 430 every play** | b18 hot, b24 overheat (one every play); b20 / b22 never |
| L2 M14 b18 / b20 / b22 (f98) | c 51 (`cm202_020`) -- to export | hot / normal / dark: one every play | b18 hot only -- **no c 51 while the tail overheats** |
| L2 M14 b19 / b23 (f92) | u 500 (`cm202_031`) | hot / dark (b21 in the mask: normal) | b19 hot; b23 never |
| L2 M14 b24 (f92) | u 511 | never (no record) | **overheat** (`em080_04_013`) -- to export |
| L2 M36 b18 / b20 / b22 (f17) | c 52 (`cm202_020`) -- to export | hot / normal / dark | b18 hot only |
| L2 M36 b19 / b21 / b23 / b25 (f4) | u 501 (`cm202_031`) -- to export | hot / normal / dark / never | b19 hot, b25 overheat |
| L2 M37 b18 / b20 / b22 (f58) | c 52 | hot / normal / dark | b18 hot only |
| L2 M37 b24 (f51) | u 502 | never | overheat |
| L4 M11 b24 (f0-28) | u 510 | never (no record) | overheat (`em080_04_012`) |
| L9 M10 b18 / b20 / b22 (f106-109) | c 52 | -- | b18 hot only |
| L9 M15 b20 / b22 | c 52 | -- | never |

### 2.3 Gated (in the file mask -- the viewer fires every form on every play today)

**The throat forms** (one per play: lit / not lit / overheat):

| motion | lit (bits 15-17) | not lit (26-27) | overheat (28-30) |
|---|---|---|---|
| L2 M1 | b15 u 260, b16 u 261 | b26 c 42, b27 c 90 | b28 c 42, b29 c 90 |
| L2 M9 | b15 u 201, b16 u 200 | -- | b28 u 201, b29 u 200 |
| L2 M10 | b15 u 201, b16 u 200 | -- | -- |
| L2 M15 | b15 u 262, b16 u 263 | b26 c 90, b27 c 42 | -- |
| L2 M17 / M18 / M19 / M23 | b15 u 261, b16 u 260 | -- | -- |
| L2 M22 | b15 u 260 | -- | -- |
| L2 M27 | b15 u 238, b16 u 239 | b26 u 236, b27 u 234 | b28 u 241, b29 u 240 |
| L2 M55 / L2 M57 | b16 u 201, b17 u 200 | b26 c 10, b27 c 11 | b29 u 201, b30 u 200 |
| L9 M2..M6 (Hellblade) | b15 u 239 | -- | b28 u 240 |
| L9 M7 (Hellblade) | b15 u 242, b16 u 414 | b26 u 233, b27 u 414 | b28 u 237, b29 u 414 |

Glavenus: the lit column only while his throat is lit (after (7, 8) / (7, 0xf2), until he tires or (10, 0x72)), the
not-lit column otherwise; **the overheat column never** (named-never-enabled: L2 M1 b28 / b29, L2 M9 b28 / b29, L2 M27
b28 / b29, L2 M55 / M57 b29 / b30 -- 10). Hellblade: lit or overheat; **the not-lit column never** (L2 M1 b26 / b27,
L2 M15 b26 / b27, L2 M27 b26 / b27, L2 M55 / M57 b26 / b27, L9 M7 b26 / b27 -- 12).

**The tail forms** (in the mask): L2 M2 / L2 M11 b18 u 251 hot, b20 u 250 normal (Hellblade: b20 never); L2 M14 b21
u 500 normal (Hellblade never), **b25 u 512 overheat** (Glavenus: no record; Hellblade `em080_04_014`); L2 M37 b19 / b21 /
b23 u 502 hot / normal / dark (Hellblade: b19 only); L4 M10 b24 u 510 overheat (Glavenus no record); L9 M10 b19 / b21 /
b23 / b25 u 503 (Hellblade: b19 hot, b25 overheat); L9 M15 b18 c 52 hot, b19 / b21 / b24 u 504, b23 u 503 (Hellblade:
b18 / b19 hot, b24 overheat).

**The state groups** (in the mask): L2 M9 / M10 / M55 / M57 b12 u 220 -- tired and calm only.

**Turned OFF -- never enabled, fired today**: Glavenus 12 in-mask (the 10 overheat-throat bindings above, L2 M14 b25 and
L4 M10 b24 -- the last two recordless); Hellblade 21 in-mask (the 12 not-lit-throat bindings, L2 M2 / M11 b20, L2 M14
b21, L2 M37 b21 / b23, L9 M10 b21 / b23, L9 M15 b21 / b23). **Named, never enabled, outside the mask**: Glavenus 5 (L2 M13
b24, L2 M14 b24 (no record), L2 M36 b25, L2 M37 b24, L4 M11 b24 (no record)); Hellblade 15 (every dark / normal tail
form outside the mask).

Counts: Glavenus -- 2 out-of-mask ON always, 17 ON gated, 5 never; 45 in-mask gated, 12 in-mask never. Hellblade --
3 / 12 / 15; 61 / 21. 24 / 30 out-of-mask, as the survey counted.

Records to export with the `--apply`: **Glavenus c 51, c 52, u 430, u 501** (+ c 50 / c 53, file-mask, not the word's).
**Hellblade c 51, u 430, u 501, u 511** (+ c 50 / c 52 / c 53; c 52 is in Hellblade's file mask already at L9 M15 b18).

### 2.4 Why c 0 is "exported but undriven" (both monsters) -- the clip-block writer's array twin

The file plan has `L0 M6 b0 em080_00c 0 SEQUENCE cm202_001` and `docs/effects/em080_00.json` exports c 0 (`cm202_001`,
when `clip`), but CLIP_EFFECTS em080_00 / em080_04 `'L0 Motion[6]'` carries bit 1 only. `add_effects.py clip_block`
builds its key -> efl map with `seq.setdefault((name, key), efl)` over `T.pel(name)` **in file order, every array**, and
em080_00c holds **six RULED records with key 0 and an empty efl before the SEQUENCE one** (rom-map's "em080_00c /
em080_04 key 0, in the RULED array with an empty efl name"). So key 0 maps to `''`, the bit's efl test fails, and the
binding is dropped while the record stays exported. `plan()` takes SEQUENCE first and is right. The fix is efx's
(prefer the SEQUENCE record in clip_block, as plan does), not the word's; any monster whose c-pel holds a RULED key ahead
of a bound SEQUENCE twin loses that binding the same way. R (tool read, data listed).

## 3. What to implement, in order

1. motion-states.js: `glavenusHeat` (§1); index.html playNow: `heat = glavenusHeat(state.id, partsDrawn, tailOverheat)`
   for em080_00 / em080_04, `tailOverheat` from the em080_04 Tail row's current synth item (`clip.XfBA1__m04_tail ===
   'overheat_Loop'`), passed in pslMask's state. (The one new viewer input; the heat comment in motion-states.js em080_00
   "want a heat state the effects side can read" is this.)
2. psl-mask.js: `em080` as §1 for em080_00 and em080_04 into CLASS_MASK; both ids into `PSL_MASK_MONSTERS`. No
   CLIP_ACTIONS.
3. efx: clip_block's SEQUENCE-first lookup (§2.4) -- so L0 M6 b0 c 0 is written -- then `add_effects.py em080_00
   --apply` / `em080_04 --apply` (exports §2's records; Glavenus u 510 / 511 / 512 have no record and stay out), `--record`,
   `--check`. Recorder slot -- announce.
4. Raven decides whether the Glavenus Tail row offers a "Dark" item (bit 0); without it the dark forms never show and the
   normal forms stand in (same records, same frames).
5. Soak with `--viewer-inputs`; Raven verifies: L2 M1 shows u 260 / 261 only with the throat Heated, c 42 / c 90 otherwise
   (Glavenus) or with the throat Blasted (Hellblade); L2 M13 one u 430; L2 M14 c 51 + u 500 (Hellblade Blasted tail:
   u 511 + u 512, no c 51); L2 M55 / M57 one set of forms; L4 M10 / M11 u 510 only with Hellblade's tail Blasted.

NOT READ, by name: Glavenus's dark state as a viewer input (stand-in 0); what each form looks like (visuals are Raven's);
whether the PSL author meant L9 M15 b23's u 503 (the only off-pattern record in the tail forms) -- it is never enabled on
Hellblade either way; the writers `0xffe438..0xffe718` of P+0x1bb site by site (the decode notes' tables are used as
theirs).

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **P+0x1bb's writers -- READ site by site** (rom-map row "P+0x1bb writers in uEm080_00's band"): the dark bit is set when the tail
  gauge e+0xcae4 falls to actiontune int 4 (0) and cleared by the vent (`0x1004930`) or the gauge's rise; the hot bit at the gauge's
  top (int 2 = 100) and cleared at int 3 (0). The decode notes' table (section 1) is now the class's own read, not theirs.
* Still open, category c: the dark state as a viewer input (a "Tail state" select: Normal / Hot / Dark -- the dark forms bits 22-23
  are the same records at the same frames as the normal ones, so on screen it changes nothing but which bits light).
