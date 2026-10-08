# 0xbb43ac's flag-8 arm: why no recording covers it, and the one recording that does

Research agent for the Viewer agent, 2026-10-05. Static reads (`efx/armdis.py`), the recorded sets
(`efx/vectors/*/*.blocks`, `prim.json`, `draw.json`), and the agent's own unicorn scripts in the session scratchpad
(`scratchpad/bb43ac/`: `probe1.py`..`probe5.py`, `mk_vds.py` -> `vds_prim.py`). **No efx recorder or lift was run**:
the scripts write only to the scratchpad. (`shellplan.mjs` was run in `--list` mode, and once with the plan written
to the scratchpad. Both scratch plans are byte-identical to `efx/plans/em084_00/shell_em084_00_L2M82_start_70x33_{0,1}.json`.)

Marks: **READ** = I read the instruction that consumes the value, or an emulator run of the ROM printed it at that
instruction. **INFERRED** = a name, a comment, or what the data looks like.

The refusal: `unverified path: 0xbb43c8 branch to unrecorded 0xbb43e8` (`docs/render/rom/effect/lifted-prim.js`, `L_bb43ac`).

---

## 0. Answer in four lines

1. The record that takes the arm is the **type-2 generator row of `em084_00_064.efl`** (u 100 in the cannon, u 211 in
   L3 M63). It is not u 101's polyline. That row's draw goes through `0x889100`, which builds a **type-3 primitive record**:
   word 0 = `0x?0023`, and word 1 = the generator's draw-flag word `gen+0xf4` = **8**. That 8 comes from bit 7 of the
   row's draw word `0x00100080`.
2. The shell recorder **never draws the primitive layer**. `vecdrawsched.py`'s `draw_all` calls only uEffect's draw
   `0x9b75e8`. It never calls `0xbad710` / `0xbad790`, which `host.js` drawFrame calls every frame. So `0xbab58c` ->
   `0xbac62c` -> `0xbb43ac` show 0 calls in **every** `draw.json` set (11,701 of them). The record IS built in u 100's
   set (`0x889100`: 38 calls) but is never drawn. The only sets that cover `0xbb43ac` are the 23 `vecprim.py` sets
   (`prim.json`), and none of them has bit 8.
3. The camera, the run length and the record spec play no part. The input that matters is that the harness must run
   the primitive draw on this row.
4. **What to do:** under the slot, record `em084_00_064.efl` with `vecprim.py --parent` (60 frames), put the set on
   `V=`, and lift. An equivalent harness run reaches the arm at frame 16 (38 draws). It reaches no other lifted refusal
   site in the primitive path. §4 has the command. §5 has the harness change that closes the whole class of gap.

---

## 1. What `0xbac7ac` draws (Q1)

| claim | st | evidence |
|---|---|---|
| `0xbac7ac` is in **`0xbac62c`, the primitive BATCH draw**. Its caller is `0xbab58c`, the draw system's primitive-list draw, at `0xbac520` (flushes a batch when the next record does not join it) and `0xbac5cc` (the last batch) | R | `armdis 0xbab58c 0xbac62c`; lifted-prim.js `L_bac62c` |
| r5 (r0 in the slot) = **the draw system**, vtable `0x178e584`. Slots: `+0x30 0xbad710`, `+0x34 0xbad790`, `+0x40 0xbab58c`, `+0x44 0xbadd68`, `+0x48 0xbb4214`, **`+0x4c 0xbb43ac` (word at `0x178e5d0`)**, `+0x50 0xbb44f8`, `+0x54 0xbb46d8` | R | vtable words read from `.data` |
| The class name is not read. `*0x211f8b4` holds the object | I | `docs/render/rom/effect/prim.js` header |
| `0xbac62c` calls, in order: `+0x44` (`0xbadd68`, returns r3), `+0x50` (`0xbb44f8`), `+0x4c` (`0xbb43ac`), `+0x48` (`0xbb4214`, the GPU batch). Each gets (system, ctx, desc). `0xbb44f8` was not read | R | `0xbac768..0xbac7d8` |
| r4 (r1 in the slot) = **the draw context** (the VIEW host.js passes to `0xbad790`): `0xbab58c` keeps its r1 at `[sp+0x48]`, calls `0x87cf70(ctx, 0x11, 0)` on it, and passes it as r1 to `0xbac62c` | R | `0xbab5a4`, `0xbab5d0`, `0xbab5fc`, `0xbac5a0` |
| **r7 / r2 = the batch DESCRIPTOR on `0xbab58c`'s stack at `sp+0xa0`**: `[sp+0xa0]` = the batch's first record's word 0 with bits 30..31 cleared, `[sp+0xa4]` = its word 1 | R | `0xbac540..0xbac558` (`str r1,[sp,#0xa4]` = `[sl+4]`; `bfc r5,#0x1e,#2; str r5,[sp,#0xa0]`, r5 = `[sl]`); `sl` = `[entry]`, entries 8 bytes, from `[r2+4]` of `0xbab58c` |
| A primitive record is 0x28 bytes (+0 word 0, +4 word 1, +8 sort key, +0x10 state copy ...), with one 8-byte list entry {record, word +8} | R | writers `0x8a2fe0..0x8a30a0` and `0x889724..0x8897dc` |
| **Word 0 bits 0..4 = the primitive TYPE.** `0x8a2e58` puts its 5th argument there (`bfi sl, [sp+0x28], #0, #5`, `0x8a3018`); the quad callers pass 4 (`0xa7b734`, `0xa7bc40`, `0xa80afc`, `0xa80f50`), others 0xd / 0x11 / 0x12. **`0x889100` ORs in 3** after clearing bits 2..4 and 30..31 (`0x889758`, `0x88977c`) | R | — |
| So `0x20024` / `0x10024` are type-4 quad records, and **`0x20023` is a type-3 record from `0x889100`** | R | above |
| Word 0 bits 16..25 = `[ctx+0x94] & 0x3ff` (`0x889138`, `0x889230`, `0x889738..0x889754`). Calling it the texture-set index is INFERRED, after efx_draw.py's comment. The viewer's `0x20023` against the probe's `0x10023` is that index: the viewer registered u 101's set first | R (compute) / I (meaning) | `0xbb43ac` never reads word 0 (its loads are `[r2+4]` and the byte `[r2+6]`) | 
| **Word 1 = the descriptor's word 1, unchanged** (`stm r6,{r0,r5}` with r5 = `[desc+4]`, `0x889778`) | R | — |

### Which row, which record (dynamic, READ in the emulator)

| record | row -> record builder | word 0 / word 1 at `0xbb43ac` | first frame | source |
|---|---|---|---|---|
| **u 100** `em084_00_064.efl` | the type-2 generator (vtable `0x1789834`), caller `0xa9ab30` -> `0x889100`, desc `{0x20, 0x8}` | `0x10023` / **`0x8`**, 38 calls | 16 | probe1 (proofunit.Request) |
| **u 211** `em084_00_064.efl` | the same row and call | `0x10023` / **`0x8`**, 38 calls | **16** (the viewer's stop frame) | probe1 |
| u 101 `em084_00_062_s.efl` | its polyline: **type-2** records (`0x?010022`). The builder was not identified | `0x400200` only, 180 calls | 20 | probe1. The recorded arm: **u 101 does not reach the refusal** |

The source of the 8 (READ, the emulator plus the instructions):
- `0xa9d05c` / `0xa9d068`: `ldr r1,[gen,#0xf4]; str r1,[draw,#0x1c]`. The draw object's `+0x18` / `+0x1c` is the
  descriptor `0x889100` gets (`add r3, r8, #0x18`, `0xa9ab00`). Each frame, `0xa578cc` rewrites only bit 13 (0x2000)
  of `+0x1c`, from the byte `[owner+0x1c4]`.
- `gen+0xf4` is written at generator init: 0 at `0xa55e34` and `0xa564cc`, then `|=` the return value of `0x9b38dc` at
  `0xa566d0..0xa566d4`. A write-watch caught every write, from frame 0. `0x9b38dc` was given the row's draw word
  `[row+4]` = **`0x00100080`** and returned **`0x8`**. The four model rows have `0x00100000` and return `0x200`.
- In `0x9b38dc`, `0x9b3910..0x9b3918` is `r2 = 8 & (w >> 4)`: **result bit 3 = draw-word bit 7.** The rest of
  `0x9b38dc` from `0x9b3958` was **not read in full**. That nothing later clears bit 3 is shown only by the returned value.

### What bit 8 selects (READ, `0xbb43ac..0xbb44e4`, the whole function)

`0xbb43ac` is the **depth-stencil and rasterizer state select**. `ctx+0x11c` gets a state record from a context slot
`ctx+0x204+8*i`, then `ctx+0x10c` is updated (`& 0x1f00 | 0x2000`) when the record changed:

| word 1 bits | arm | slot (record name, from mfx index `i`) |
|---|---|---|
| none | `0xbb4404 -> 0xbb4480` | `ctx+0xfdc` (443, DSZTest) |
| 0x10 | `0xbb43cc -> 0xbb43d4 -> 0xbb4460` | `ctx+0xfcc` (441, DSZTestWrite) |
| **8** | **`0xbb43e8 -> 0xbb4418 -> 0xbb4490`** | **`ctx+0xfc4` (440, DSDefault)** |
| 8 + 0x10 | `0xbb43e8 -> 0xbb43f0 -> 0xbb4470` | `ctx+0xfe4` (444, DSZWrite) |
| + 0x2000 | the tables at `0x159d390` / `0x159d398` / `0x159d3a0` / `0x159d3a8`, indexed by `[sys+0x138]` | — |

Then the rasterizer: byte `[r2+6]` bit 1 (word 1 bit 17) picks `ctx+0x1014` (RSMesh) or `ctx+0x108c` (RSPrim) for
`ctx+0x120`. The slot choice and the offsets are READ. The meanings "bit 8 = no depth test", "bit 0x10 = depth write"
are INFERRED from the mfx record names.

---

## 2. Why no recording runs the arm (Q2)

| claim | st | evidence |
|---|---|---|
| `vecdrawsched.py` `draw_all` (`:196-218`) draws each live effect with `0x9b75e8` and nothing more. **There is no `0xbad710` / `0xbad790` call** and no `0x881584` service. The viewer calls both every frame (`host.js:535`, `:543`) | R | the source |
| So in every `draw.json` set, `0xbab58c`, `0xbac62c` and `0xbb43ac` are keys (LIFTED_FNS) with **0 calls**. The `.blocks` census: **11,701 sets list `0xbb43ac` with no blocks**. In the L2M82 sets, `0xbab58c` = `0xbb43ac` = 0 calls | R | `scratchpad/bb43ac/blk2.py`; `draw.json` `functions` |
| **The record IS built in the existing recordings.** `shell_em084_00_L2M82_start_70x33_1` (u 100): `0x889100` 38 calls, `0xa996c8` 39, `0xa9dd14` 38. The same in `_70x34_1` and `_70x35_1`. So it is not a missing motion, a camera test or a short window | R | `draw.json` call counts |
| **Positive control: the only sets that cover `0xbb43ac` are the 23 `vecprim.py` sets** (`vectors/*/prim.json`: em043_*, em027_00_019, unit003*, unit02406k160, unit07000k270draw, unit08204k*draw, add_em002_04_u380prim). Their vectors read word 1 as `0x400200`, `0x600200`, `0x400000` and `0x200`. **None has bit 8.** Their path is `0xbb43ac -> 43cc -> 4404 -> 4480 -> 449c -> (44a8) -> 44b8`, the one now lifted | R | `scratchpad/bb43ac/ctrl.py` reads the 4 bytes at `args.r2+4` from each vector's reads |
| Set naming: **`_0` = u 101 (`em084_00_062_s`), `_1` = u 100 (`em084_00_064`)**. The brief's "u 101's log `_1`" is u 100's. `shellplan --list` gives `[{k:0, u 101}, {k:1, u 100}]`, and `draw.json` `file` agrees. u 100's set calls `0x9b75e8` only 57 times because its effect is short; u 101's calls it 339 times | R | — |
| `_near` changes nothing: the 8 is fixed at init from row data, and the per-frame rewrite (`0xa578cc`) reads only `[owner+0x1c4]`. The `_near` sets also have 0 calls at `0xbb43ac` | R (the writes) / R (the census) | §1 |

**Control for my copy of the recorder** (`vds_prim.py` = `vecdrawsched.py` with FNS cut to the primitive path and its
output sent to the scratchpad). With the same env as `record_shells.py` (`GPU_DRAW_ROM=1 MODEL_MATERIAL_STUB=1
ED4_BACKOUT=1 PARENT_JOINTS=joints/em084_00_viewer_rest.json SHELL_PLAN=<the _1 plan>`, 497 frames, scale 1.1, specs
`0:<em084_00_064.efl>:em084_00u:100:UNIQUE 257:stop:0`) and **without** the primitive layer, it reproduces the real
set: `0x889100` 38 calls, `0xbb43ac` 0.

---

## 3. What makes a recording cover it (Q3), and how far that is proven

| run (own scripts, nothing written under efx) | result at `0xbb43ac` | lifted refusal sites the run reaches* |
|---|---|---|
| `probe2.py em084_00_064 - 60` = **`vecprim.py --parent`'s harness** (LoadedEffect, Parent.attach, `x.start()`, per frame `parent.frame` / move `0x9b6130` / `PrimDraw(snapshot=False).frame()` + `.prim_frame()`, the 0x881584 / 0x87f734 / 0x87f798 / 0xbd0ab0 services as vecprim's), without vectors.record | **`[r2+4]` = 0x8, 38 calls, from frame 16**; blocks `0xbb43e8`, `0xbb4418`, `0xbb4490`, both `0xbb44a8` (x7) and `0xbb44b8` (x31) | `lifted-prim.js` **`0xbb43c8 -> 0xbb43e8` only** (plus `lifted-request.js 0x9b2390 -> 0x9b2504`, which comes from the plain `x.start()` and is not on the viewer's request path: INFERRED) |
| `vds_prim.py` **with `PRIM_ROM=1`** (the §5 change), the u 100 shell plan | **38 calls, `[r2+4]` = 0x8**, blocks `0xbb43ac`, `0xbb43e8`, `0xbb4418`, `0xbb4490`, `0xbb44a8` / `0xbb44b8` (frame 17 in plan frames); `0xbac62c` desc `{0x10023, 0x8}` | **`0xbb43c8 -> 0xbb43e8` only** |
| `vds_prim.py PRIM_ROM=1`, the u 101 shell plan (`_0`) | 283 calls, word 1 `0x400200` only | none |
| `lift.py` -> **scratchpad** `lifted_test.js` from the PRIM_ROM u 100 set alone, root `0xbb43ac` | the 0x8 arm lifts: `bb43e8 -> bb4418 -> bb4490 -> bb449c ...` with no refusal on it | — |

\* "Reaches" means the run executed the branch target, or the fall-through instruction, of an `Unverified(...)` in the
current `docs/render/rom/effect/lifted-*.js` (regex over the files). The runs' block sets are the vectors' blocks
(`vds_prim`) or a block hook over `0x800000..0xd00000` (probe2). Two caveats, both INFERRED. The emulator's context
stand-ins (`ctx+0x11c`, `+0x10c`, the slot records) are engprim's, not the viewer's, so the viewer could take an
`0xbb449c` arm the probe did not; the probe took both. And in the viewer, word 1 becomes `0x2008` if `[owner+0x1c4]`
is ever non-zero, which goes down the `0x159d398` table arm. The viewer's log shows `0x8`.

---

## 4. What to do (the viewer agent, under the slot)

**A. Close this refusal: one set, existing tool, no code change.**

```
cd C:/MHGU-Extract/efx
python vecprim.py C:/MHGU-Extract/scratch-effects-em/effect/em/em084/em084_00_064.efl 60 add_em084_00_064prim --parent
#   expect bb43ac with ~38 calls; vectors/add_em084_00_064prim/prim.json
# add vectors/add_em084_00_064prim to V= in lift-effects.sh (the add_em002_04_u380prim precedent), then: sh lift-effects.sh
```

60 frames covers it: the row draws from frame 16 to about frame 53. `--proof em084_00u:100` does **not** work:
`proof.configure` refuses with "placement state 3; only the parent states 0..2 are transcribed" (run here). Then
re-check u 211 (L3 M63) and the L2 M82 cannon with `dev/effect-live-soak.mjs` and the per-record page check.
Expected: `0xbb43c8` is gone, and no other primitive-path refusal comes from this row (§3).

**B. Close the class: the recorder never draws the primitive layer.** Every shell and `add_effects --record` set
records 0 calls on the whole primitive path. Any primitive-path refusal reached only by an effect that no vecprim set
draws will repeat this one. The change, as `scratchpad/bb43ac/mk_vds.py` applies it to a copy:
- in `draw_all`, under `GPU_DRAW_ROM` (or a new flag), once: the draw system's ROM constructor
  `0xbab054..0xbab168` on `o['SYS']`, `SYS+0x54 = 1`, and a registry at `SYS+0x58` pointing at `o['TEXSETS']`
  (engprim.PrimDraw `__init__`). Every frame: `LIST+0x64 = 0`, `PRIM+0x54 = 0`, the stack-top word 0,
  `x.call(0xbad710, (SYS, VIEW, 0, 0))` **before** the effect draws and `x.call(0xbad790, (SYS, VIEW, 0, 0))`
  **after** them. That is host.js's order.
- add `0x881584: ('prim_draw', 2, ..., result)` to SERVICES, handing out scratch VB / IB as vecprim's `prim_result`
  does.
- the primitive functions are already in FNS via LIFTED_FNS, so nothing else needs naming.

B is proven only on the two em084 shell plans above, not on a full re-record. The pass reset that `draw_all` already
does at frame start (`0x87cf70(VIEW, 0x15, 0)`) undoes the `0x11` that `0xbab5fc` leaves. That this keeps the model
draws' pass as host.js keeps it is INFERRED (host.js comment), not measured.

---

## 5. Proposed `dev/rom-map.md` rows

Under a new heading `### The primitive draw: the draw system and the batch state (research agent for the Viewer agent, 2026-10-05; dev/effect-bb43ac-flag8.md)`:

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x178e584` (`+0x30..+0x58`) | the draw system's vtable: +0x30 `0xbad710` layer begin, +0x34 `0xbad790` layer draw, +0x40 `0xbab58c` list draw, +0x44 `0xbadd68`, +0x48 `0xbb4214` GPU batch, **+0x4c `0xbb43ac` (word `0x178e5d0`)**, +0x50 `0xbb44f8` (not read), +0x54 `0xbb46d8` | draw system (`*0x211f8b4`, name not read) | R | §1 |
| `0xbac62c` | primitive BATCH draw `(sys, ctx, ?, desc)`: vt +0x44, +0x50, +0x4c, +0x48 on (sys, ctx, desc); desc = `0xbab58c`'s `sp+0xa0` = {first record's word 0 & 0x3fffffff, word 1} (`0xbac540..0xbac558`) | draw system | R | §1 |
| `0xbb43ac` | depth-stencil + rasterizer select from desc word 1: bits 8 / 0x10 / 0x2000 pick `ctx+0xfdc` / `0xfcc` / `0xfc4` / `0xfe4` or the tables `0x159d390..0x159d3a8`, into `ctx+0x11c`; byte +6 bit 1: `ctx+0x1014` / `0x108c` into `ctx+0x120` | draw system | R (names I) | §1 table |
| primitive record (0x28 B) | word 0 bits 0..4 = TYPE (`0x8a2e58`: arg 5, quads pass 4; `0x889100`: 3); bits 16..25 = `[ctx+0x94] & 0x3ff` (`0x889100`); word 1 = the caller's descriptor word 1 | — | R (set-index name I) | §1 |
| `0x889100` | the type-3 (strip) record builder; called by the genType-2 draws (`0xa99a3c..0xa9e804`, 24 sites incl. `0xa9ab30`) | — | R | §1 |
| `gen+0xf4` (genType 2, vtable `0x1789834`) | the draw-flag word, = record word 1 (`0xa9d05c..0xa9d068`); built at init `0xa566d0` from `0x9b38dc(row)`: result bit 3 = row draw-word bit 7 (`0x9b3910..18`); per frame `0xa578cc` sets bit 13 from `[owner+0x1c4]` | genType 2 | R (rest of `0x9b38dc` from `0x9b3958` not read) | §1 |

In the Tooling table:

| script | resolves | validated control | caveats |
|---|---|---|---|
| `efx/vecprim.py` | the ONLY recorder that runs the primitive layer (`0xbad710` / `0xbad790` -> `0xbab58c` -> `0xbac62c` -> `0xbb43ac` / `0xbb4214`); one efl, `--parent` or `--proof` | 23 sets cover `0xbb43ac` | `--proof` refuses compose state > 2 (em084_00u:100 is 3). **`vecdrawsched.py` / `record_shells.py` / `add_effects --record` never draw the primitive layer**: those functions are keys with 0 calls in every `draw.json` |

In the Traps list:

46. **A shell recording BUILDS primitive records but never DRAWS them (2026-10-05).** `0x889100` / `0x8a2e58`
    calls in a `draw.json` show the record was built. Nothing under `0xbad790` ran: vecdrawsched has no primitive
    layer. A refusal in `lifted-prim.js` needs a `vecprim.py` set (or §4 B), not a re-record with record_shells.

---

## 6. Scratch (session scratchpad, `bb43ac/`)

`blk2.py` / `blk3.py` (block census), `ctrl.py` (word 1 in the prim sets), `probe1.py` (request + PrimDraw + hooks),
`probe2.py` (vecprim-equivalent + refusal-site check), `probe3.py` / `probe4.py` / `probe5.py` (descriptor, `gen+0xf4`,
`0x9b38dc` input), `mk_vds.py` -> `vds_prim.py` (vecdrawsched copy, `PRIM_ROM=1`), `probe_u100_{prim,ctrl}.draw.json`,
`probe_u101_prim.draw.json`, `liftset/` + `lifted_test.js`. Copy them before relying on them: session scratch.
