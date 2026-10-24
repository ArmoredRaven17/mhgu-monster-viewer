# Monster effects: a porting guide for the 3U, 4U and FU viewers

Written 2026-10-24 (doc audit), for whoever starts effects in another viewer. Open this first. It explains how the GU
viewer gets a monster's effects from the ROM to the screen, the order of work that worked, the tools, and the mistakes
already paid for. It does not repeat the detail: that lives in

- `dev/effect-runtime-engine.md` (E1..E22, the shell engine): one section per engine mechanism, each with (a) the concept,
  (b) GU's addresses, (c) how to find it in another MT Framework build;
- `dev/rom-map.md`: every address, its status (READ / INFERRED / WITHDRAWN), its tooling row with the validated control, and
  the numbered traps;
- the per-monster specs `dev/emNNN*-effects-spec.md` / `dev/*-shells-spec.md`, and `dev/gu-lessons-for-3u-4u.md` (the
  render / material side, already written for 3U and 4U).

`<archive>` below is `dev/archive/` in this repo, the decode scripts and notes. The full set, with the bulk outputs, is the local
copy `C:\MHGU-RE\offline\decode\monster-viewer-scratch\`; rom-map "2. Tooling" defines both. `efx\` is `C:\MHGU-Extract\efx\` and is
not under git. See "Where things live" at the end.

---

## 1. The big picture

### How an effect reaches the screen

A monster never names an effect file. Its code asks for an effect by an id or by a motion bit. The id or bit picks a
RECORD in the monster's effect list (`.pel`, rProofEffectList). The record names an effect (`.efl`) and carries a fixed
payload: where to put it, which joint, how to scale it, and which rows to build. The engine builds a uEffect from the record,
hangs it from a parent unit (the monster's bones), steps it every 1/60 s and draws it.

The viewer does the same, with the game's own code doing the building, stepping and drawing. Most of it is hand-translated,
and the long routines are lifted instruction by instruction from the ROM. All of it is checked against recordings of the
ROM's own runs.

### Where requests come from (four sources)

1. **Motion bits: the PSL enable word.** A motion's `.psl` block binds SEQUENCE records to frame ranges and bits. For an
   enemy, the bit mask in the file is REPLACED by a per-motion word that the class builds at setMotion (calm / enraged /
   tired groups, plus class bits from posture, breaks, variant and rank). A bit outside the file's mask can fire, and a bit
   inside it may not. Engine E2; rom-map "THE PSL ENABLE MASK", "The PSL enable word per class"; viewer `psl-mask.js`.
2. **Class code: UNIQUE requests by id.** Two adjacent vtable slots (common list c / own list u). An id below 1000 goes to the
   shared tables; 1000 and up goes to the class's own id -> key table. Engine E1, E15, E18; rom-map "Effect request funnel".
3. **Shared enemy code.** The "level" request (the rage puff, the burrow, the severs and their landings), the break code
   (`999 + 5 * part + level`), and the shared states (poison, dung, paint and the like, keyed by record id). Engine E1;
   rom-map "Shared enemy code — state effects"; viewer `shared-states.js`.
4. **Shells.** Projectiles, beams and auras are shell objects (`uShellEmNNN_sp_NN` on shared bases). Each shell's `.shl` names
   its own effect lists, and its `ef` entries resolve in UNIQUE. **The same key in SEQUENCE and UNIQUE is two different
   records.** Engine "The shell engine"; rom-map "Shell infrastructure"; viewer `shells.js`.

Who issues the ACTIONS that play those motions and run that code is the command table (`.emc`). See engine E21 and rom-map
"EMC ops -- the shared table".

### The pieces in the viewer

| piece | what it is | where |
|---|---|---|
| the records and files | `.pel` records, `.efl` / `.ean` files, textures and meshes, exported byte for byte, plus which joints each effect binds to | `efx\export_effects.py` -> `docs/effects/<mon>.json` + `files/` + `tex/` |
| motion-bound plan | every SEQUENCE record on every motion, the clip it plays on, and whether the runtime can build it | `efx\add_effects.py <mon>` (plan) / `--apply` (writes CLIP_EFFECTS in `monster.js`) |
| schedule | WHEN each record runs: always / calm / rage / rageStart / rageEnd / clip / event / shell | `docs/render/rom/effect/schedule.js` |
| request | what the game does to start a record: the parameter block, the parent mode, the row masks, then the start | `proof.js` (the emulator twin is `efx\proof.py`) |
| host | the engine around the effect, laid out where the ROM reads it: heap, resources, camera, stage floor, timers | `host.js` |
| hand translations | construction, the effect's own frame, emission, spawn, life, curves, generator types | `construct.js`, `owner.js`, `emit.js`, `spawn.js`, `life.js`, `curve.js`, `billboard.js`, `polyline.js` ... |
| lifted routines | long ROM routines lifted instruction by instruction from recorded call vectors; a branch no vector reached throws `Unverified` | `lifted-*.js` (generated: never edit), run on `cpu.js`; `bridge.js` joins the hand and lifted code |
| live | runs every live record each 1/60 s, draws it into three.js with the ROM's own vertices, shaders and blend state, and holds the draw meter | `live.js` (+ `effect-mounts.js` for `__view.effectMeter`) |
| parent | one parent unit per monster whose joint matrices are the bones. Stand-in fields must hold what a live unit holds (E16 trap: +0x50c = 1.0) | `host.js`, `proof.js` |
| floor | the stage ray answered by one floor plane, and the floor-type rows (MASK2) picked by the Ground control | engine E4, E17; `host.stageFloorY`; index.html `GROUND_TYPES` |
| shells | each shell base rebuilt in JS from its ROM reads, starting its UNIQUE records through the same request path | `docs/render/shells.js`, `beam-types.js`, `shell-hitshapes.js` |

### One diagram

```
 ROM (romfs + exefs main)                         VIEWER (docs/render)
 ------------------------                         ---------------------------------------------
 .emc command table --issues--> action (st, n)
        |                          |
        |                    action main / class code ----- class request (c/u id) ---.
        |                          |                                                  |
        |                    setMotion --> PSL enable word ---- motion bit ------------+
        |                          |        (class vt+0x13c)                           |
        |                    shared enemy code -- level / break / state id ------------+
        |                          |                                                  |
        |                    shell create --> shell (.shl ef: list, UNIQUE key) ------+
        |                                                                             v
 .pel record (SEQUENCE / UNIQUE, 160-byte payload)  <-- export_effects / add_effects --> docs/effects/<mon>.json
        |                                                                             |
        v                                                                             v
 uMHProofEffect: parameter block, placement mode,              schedule.js (when) -> proof.js (request)
   row masks, parent = monster unit, floor ray                        |                 host.js (heap, camera,
        |                                                             |                  parent, floor plane)
        v                                                             v
 uEffect -> generators -> particles -> draw          construct / owner / emit / spawn (hand)  +  lifted-*.js
                                                        (bridge.js <-> cpu.js)  checked by dev/effect-check.mjs
                                                                      |
                                                                      v
                                                      live.js draw -> three.js meshes -> screen
                                                                      |
                                                      draw meter: starts vs draws vs lit pixels (E16)
```

---

## 2. The order of work that worked

### Per monster

1. **Look before reading.** Grep rom-map, the task board (`C:\Coding Repos\MHGU-TASKS.md`, never committed) and the viewer
   code comments (`shells.js`, `motion-states.js`, `rom/effect/*.js`). Then open the row and the file it cites. On 2026-09-29/30,
   three things were re-derived that were already written down.
2. **The class and its code band.** Name the class from its DTI (getDTI's GOT load, not string overlap). Derive the band
   from the vtable's own methods and their transitive calls. Never choose an extent.
3. **The PSL enable word.** Read the class's vt+0x13c. Transcribe it. Prove it with `jscheckpd.py` over every input it reads,
   with `wordsweep.py`'s negative control. Then `add_effects.py <mon>` plans every motion-bound record and `--apply` writes
   them.
4. **Class requests.** Trace every action with `reqtrace.py` (both slots and the level request), with a static census
   `reqcensus.py` + `sitefn.py` beside it. Trace per action: a site's level is not its caller's.
5. **Shared states and hooks.** The frame handler vt+0x208, the action start vt+0x204, the event lists vt+0x2a8: requests and
   shells made there are not seen by an action census.
6. **Shells.** Run the census (`cengen11.py` / `trgen.py`) over every action x phase, with each frame test answered alone and
   the landing answered. Grep the band for every shell-id immediate and account for each site. Read the files (`.shl` via
   `shlmap.py` / `shellres.py`). Build each base. Prove it with the ROM harness (`emu_fb.py` -> `mk_plaincheck.py` ->
   `dev/shells-<mon>-check.mjs`), including controls that must FAIL.
7. **Record what the runtime refuses, then lift.** `dev/effect-live-soak.mjs` (and `--rock <pick>`) says what refuses.
   `record_shells.py` / `rec_shellrec.py` / `vecdrawsched.py` record the path, and `lift-effects.sh` regenerates
   `lifted-*.js`. Never patch lifted code.
8. **Measure draws, not starts.** Use the draw meter (`__view.effectMeter`, `metersurvey.mjs`) on every clip with records,
   calm then enraged.
9. **Write it down in the same turn.** Add the rom-map row(s), the spec section, and a portable engine note when the mechanism
   is engine-level.

**Done** means every request the ROM makes on that monster:

- starts, and the draw meter says `draws`, or the record is a NAMED refusal with its reason;
- has a rom-map row and a spec line;
- has been seen on screen by Raven.

Checks prove that a request started, not that anything drew. A monster is left only when Raven confirms it.

### Per game: what to find first in a new build

Do these in order. Each needs its instrument and a positive control before you trust a negative.

| # | find | how to find it in an MT Framework build (INFERRED for 3U / 4U until done there) | GU control that proved it |
|---|---|---|---|
| 1 | the code image and its layout | 3DS: one `code.bin` image. MH4U has no `.cro` modules (MH4U viewer, 2026-10-24); 3U on the 3DS is unchecked. A `roEmNNN.cro` name in older notes names a code GROUPING, not a file that can be loaded or bounded (CLAUDE.md §3), so bound a class by its vtable's closure (headache 6), never by a module; Wii U: an RPX (PowerPC, big-endian); Switch: `main` split into text / rodata / data | the GU loader note in rom-map "Build" (no `.cro` on Switch) |
| 2 | the DTI table and class names | `uEmNNN_NN` strings, getDTI functions (`ldr` of a DTI, `bx lr`). Names come through relocations, so name a class by its getDTI's GOT load, never by key or string overlap | `gotrefs.py` (uEm088_00 DTI at `0x10bc448`) |
| 3 | the effect list format | `.pel`: three 0x14-byte array descriptors at +0x74 (SEQUENCE / RULED / UNIQUE); the record payload (GU: 160 bytes) | `0x328ba0` array select |
| 4 | the request funnel | two adjacent vtable slots that branch to the shared request when id < 1000 (`cmp r1, #0x3e8` on ARM); the level table, a word run {1120, 1121, 1400, 900, 901, 905, 906} | `reqtrace.py` on Barroth (6, 6) r1 = 2 |
| 5 | the PSL walker and the enable word | the 0x14c-byte block copy, the notice word update (`& 0xfff0`), the base word's constants (`orr #0x3f`, `0x1c0` / `0xe00` / `0x7000`) | `wordsweep.py` with another class's transcription as the negative |
| 6 | setMotion and the action main | the setMotion family (frame tests, ended, landed); the action main = the vtable slot that dispatches on (status, number) | `tracec.py` (`0xb0974` frame test) |
| 7 | the parameter block and placement | the payload copy into the block; the 900.0 spawn-height constant; the placement modes (0 / 1 re-placed every frame, 2..4 once, 4 = camera-attached) | E4, E19 |
| 8 | the stage ray and floor flags | the collision singleton's ray (null in a harness: answer it); the floor block written THROUGH A POINTER | E17; the Ground control |
| 9 | the shell create | the one function every shell maker ends in, `(mgr, setup, 0, 0)`; the shell table and the path hash that names each shell's folder | `0x48b884`; `0x175c3e8` -> `0x159daa0` |
| 10 | the command table | the `.emc` op jump table (a word table indexed by the op byte); op 00 = issue action | E21; rom-map "EMC ops" |
| 11 | the effect runtime | uEffect's vtable, the generator types dispatched by vtable, the draw entry | `effect-check.mjs` vectors from Savage's `em043_05_002_s` |

---

## 3. The tools

All the GU tools assume ARM32 Switch code and GU addresses. The method transfers; the scripts do not, unless rewritten for the
new build. The validated control for each is in rom-map's tooling table.

| tool | for | validated control | traps | lives in |
|---|---|---|---|---|
| `armdis.py` | disassembly of `main.text` with PIC address resolution (the `ldr` literal + `add pc` pair, resolved at the ADD) | resolves known strings | its first version resolved from the literal's address and landed on a nearby string. It maps `.text` / `.rodata` / `.data` but not `.bss` | `efx\armdis.py` |
| unicorn harnesses | run the ROM's own code: `efx_emu.py` (particle generators on a real `.efl`), `emu_fb.py` (whole executable after the static initialisers, shells flown from their own setups), `t3emu.py` (one leaf routine) | the static-init machine: init_array 2334 / 2334 clean, Khezu's ORB_SLOT_POINT 18 / 18 (rom-map `0x1917xxx` row); `emu_fb`: each check's controls that must FAIL | anything the harness does not set up reads 0: the collision singleton, the camera, the frame step, a stand-in parent. Answer these; never run into them | `efx\` ; `<archive>\fb\emu_fb.py` ; `<archive>\t3\` |
| tracers | the action main under unicorn with the band native and the rest stubbed: `tracec.py` / `sweep2.py` / `deep.py` (motions), `reqtrace.py` (requests), `trgen.py` / `cengen11.py` (shell creates with setups), `gapD\issuers8.py` / `fb\emcvar.py` / `chain*.py` (who issues an action) | Barroth (6, 6) r1 = 2; every known sp_01 maker found | stubs give one answer per address (trap 132); stubbed rage / tired tests hide arms (112); vt+0x3d0 chains (111); zeroed class blocks (117) | `<archive>\zg\`, `<archive>\fb\` |
| static census | `reqcensus.py` + `sitefn.py` (request sites -> function), `xref.py`, `movwscan.py`, `picref.py`, `st3a8.py`, `vst.py`, `gotrefs.py` | each has a known site it must find (rom-map tooling rows) | accept the tail-call form (trap 27); `movweq` / `stmib` hide values (28); flag tests are `tst` / `ands` / `bics` / `teq` (2) | `<archive>\` root and lane folders |
| efx recorder | records the ROM's call vectors for a draw or a schedule: `vecdrawsched.py` (several effects in one frame, PSL bit states, a hunter path), `vecprim.py` (the only recorder that runs the primitive layer), `record_shells.py` (shell plans from the viewer's own inputs) | the sets on `lift-effects.sh`'s V | the recorder's collision singleton is null; `vecdrawsched` / `record_shells` never draw the primitive layer (rom-map "primitive layer"); one recorder and one lift at a time (shared with the Armor Viewer agent) | `efx\` |
| lift | `lift.py` / `lift-effects.sh`: every instruction the vectors executed becomes JS over `cpu.js`; unreached branches throw `Unverified` | `dev/effect-check.mjs`: byte for byte against the same vectors | regenerate, never hand-patch. A missing path is fixed by recording a set that takes it | `efx\lift.py`, `efx\lift-effects.sh` |
| `export_plain.py` / `export_effects.py` / `add_effects.py` | export records and files into `docs/effects/<mon>.json`; `export_plain` adds a monster's shell UNIQUE records (`<pel>:<keys>`) | the plan's own refusals, read against the `.lmt` (not the glb clip length) | an array is part of a record's identity (trap 14): export UNIQUE for shells | `<archive>\fb\export_plain.py`; `efx\` |
| `rec_shellrec.py` | records a monster's shell UNIQUE records standalone at the origin, plain and with the camera at it, onto the lift's V | needs `joints/<mon>_shells_rest.json` first | the lift is the caller's (ADD_NO_LIFT) | `<archive>\fb\rec_shellrec.py` |
| draw meter | per live request: counted every frame, redrawn alone through the whole draw (flush included) into a mid-grey target, pixels counted | `dev/checks/draw-meter.mjs`: P (Rathian fireball lights), N1 (camera away: none until aimed), N2 (textures withheld: named) | a recorder's count of one draw kind is not a draw count | `live.js` METER, `effect-mounts.js`; survey `<archive>\metersurvey.mjs` + `msreport.py` |
| checks | `dev/effect-check.mjs` (runtime vs vectors), `dev/shells-*-check.mjs` (module vs ROM harness, move by move, controls that must FAIL), `dev/checks/*.mjs`, `dev/effect-live-soak.mjs`, `dev/motion-states-check.mjs`, `<archive>\run-check.mjs` (the page) | each check's own controls | a check proves the request started, not that it draws. Pair it with the meter and Raven's eye | `dev/`, `dev/checks/` |
| `arm2js.py` (t3) | one ARM-VFP leaf routine -> JS, one statement per instruction | `t3diff` against the ROM run | VFP compare flags reach the APSR only at `vmrs` | `<archive>\t3\` |

---

## 4. Headaches already paid for

**G** = a general method error that will recur in any game. **T** = specific to GU's tools or this setup.

1. **"Passes" while nothing drew (G).** Starts, refusals and checks all said yes while the screen was empty. Rule: report draws
   separately from starts (the draw meter, E16), and Raven looks. Three causes: no generator built (row masks, floor-flag
   rows), no mesh shown (texture or technique), drawn off camera or at zero alpha.
2. **A fit reported as a read (G).** A name, a DTI parent, a comment or "the values look like" was written as READ. Rule: READ
   only when the consuming instruction is read (CLAUDE.md §2). Examples are in rom-map traps 7 and 8 and the Withdrawn rows on
   field names (`f104`).
3. **Negatives without a positive control (G).** "Nothing writes it" came from scans that could not find a known writer:
   - the floor block's setter "does not exist" (the writer stores through a POINTER);
   - the shared empty 4x4 "no site writes it" (a static initialiser does);
   - the Tetsucabra tail "no joint-scale store" (`str` of float bits, not `vstr`).

   Rule: run the scan on a known case first. Track the pointer, not the offset (trap 3).
4. **Flag tests found by one mnemonic (G).** A `tst`-only scan finds about a quarter of them. Use `tst` / `ands` / `bics` / `teq`
   and `cmp` against a mask (trap 2).
5. **Compare flags taken at the `cmp` instead of `vmrs` (G, ARM-VFP).** `vcmpe` writes the FPSCR. The APSR changes only at `vmrs`,
   so a conditional between them still sees the PREVIOUS compare (engine "third hit-shape type"; `0x7dd354..0x7dd368`).
6. **Per-module code ranges (G).** A class's code range is not the range of its own methods (trap 37). Derive the band from the
   vtable's closure, in every build. Do not bound a scan by a module: GU (Switch) and MH4U (3DS, one `code.bin`, 2026-10-24)
   have no `.cro` modules, and a `roEmNNN.cro` name is a grouping carried over from older notes (CLAUDE.md §3). 3U is unchecked.
7. **Harness setups that skipped the static initialisers (T, and G as a warning).** A zeroed stand-in reads 0 spuriously, and a
   value an arc load writes also reads 0 (rom-map tooling `basshell.py` caveat; `0x1917xxx` "zero after main's 2,334
   initialisers"). Run every `init_array` entry first, then answer what is still null.
8. **Mistaken monster names (G).** Key-overlap attribution named em002_00 as uEmOstgaloaArm and em001_00 as uEm056_00, and "the
   Rathalos line uEm002_00" was named by analogy. Rule: name a class by its getDTI's GOT load.
9. **Slot numbers that are only one monster's (G).** A vtable slot means different things in different bases (`+0x150` is
   base00's landing and base02's ending). A list / motion number identifies one monster's slot only. A field offset means
   something different in every derived class (rom-map trap "A field offset means something different in every derived class"; the trap list has two number 15s). Rule: read each monster's own; check another monster's flag word bit by
   bit.
10. **SEQUENCE vs UNIQUE twins (G).** The same key in two arrays is two records. The Fatalis line's shell records were recorded
    for years from the SEQUENCE twins and refused live (E1; trap 14).
11. **Stand-in zeros are inputs (T).** A zero-filled parent froze effects that take speed from parent +0x50c (E16). Fill a
    stand-in with what a live unit holds.
12. **Clip length is not motion length (G).** A glb clip ends at its last keyframe; the `.lmt` `numFrames` is the PSL's frame
    count. A layer's held end can stop a frame test from ever passing (E22).
13. **Camera-attached records wait for the hunter (G).** A mode-4 record outside its payload range never makes a unit, so it looks
    "never started" (E19).
14. **Census blind spots (G / T).** Timer makers, hook makers (vt+0x208 / +0x204 / +0x2a8), variant switches, rage / tired gates,
    zeroed class blocks, landings answered, phase bytes living elsewhere. Engine "Finding what a monster makes" lists each one
    with its trap number.
15. **Shared-file writes through a shell (T).** Bash heredocs halve backslashes (trap 32). A `\r` in a Windows path became a line
    break inside a rom-map row (found and repaired 2026-10-24). Use the Write / Edit tools or Python with `chr(92)`.
16. **Hand-patching generated code (T).** Lifted code is regenerated from vectors. A path it lacks is recorded, never typed in
    (E13).

The retrospectives `dev/retro-effects.md`, `dev/retro-emc.md` and `dev/retro-render.md` (2026-09-30) group the withdrawals by
cause. Read section 3 of each before starting a new game.

---

## 5. What carries over and what won't

### Likely MT Framework generic (reuse after checking; all INFERRED for 3U / 4U until read there)

- The record model: `.pel` with SEQUENCE / RULED / UNIQUE arrays, `.efl` effect lists, `.ean` animations, the request by id with
  the shared / class split at 1000.
- uEffect -> generators -> particles, and the generator types dispatched by vtable (LiteBillboard, LitePolyline, Model,
  PolygonStrip, Filter). The hand translations in `rom/effect/` carry as LOGIC once the same routines are found and checked
  against that build's own vectors.
- The parameter block and placement modes (0..4, camera-attached 4), the parent unit, the row masks, the stage-ray floor.
- PSL motion sequences, the LMT motion format (`numFrames` / `loopFrame`), shells on shared bases with `.shl` files, the
  hit-shape files (HDS / HTS), and the `.emc` command tables (MH-specific on MT; check the layout).
- The material and shader side: `dev/gu-lessons-for-3u-4u.md` already records which GU render code is byte-identical in 3U / 4U.
- **Measured 2026-10-24: the MH4U Monster Viewer's render modules are a fork, not byte-identical.** Against GU's working copy
  (line endings normalised), only `stage.js` and `lens.js` match; `assets.js`, `fx.js`, `grid.js`, `material.js`, `materials-db.js`,
  `pose.js` and `skeleton.js` differ, and it has no `docs/render/rom/` at all (so none of the effect runtime). Do not reconcile by
  hand-copying: sync through the shared base (`C:\Coding Repos\VIEWER-BASE-PLAN.md`; `dev/sync-render.py`, to become
  `sync-base.py`), with every fix made upstream and pulled.

4U is probably the nearest to GU (INFERRED from the series' history, MHX / MHGU following 4U on the 3DS, not from a read). 3U is older. Both are INFERRED until a file or a
routine has been read in that game.

### GU-specific (will differ)

- **Every address** in rom-map and the engine notes, and every vtable slot number.
- **Struct offsets:** the enemy (`e+..`), the status block (`P+..`), the class blocks, the record payload offsets (likely close,
  but read them), and the enable word's bit layout.
- **The code:** Switch ARM32 with VFP. The 3DS games are ARM11 (ARMv6K): ARM mode is close, but INFERRED: no `movw` / `movt`
  (ARMv6T2+), so immediate scans must read literal pools. 3U on Wii U is PowerPC, big-endian: `cpu.js`, `lift.py` and every ARM
  scan do not apply.
- **`lifted-*.js`** is GU machine code turned into JS. It does not port. The lifter's method (record vectors, lift what ran,
  check byte for byte) does.
- **The alpha-test and colour state:** NVN in the Switch MRL. The PICA's is encoded elsewhere and must be read for the 3DS.

### Other builds, as read

Reported READ by the other viewers' own sessions. These are THOSE builds' addresses: they are not in GU's rom-map, and the detail
lives in the cited notes.

**MH4U (3DS)** -- the MH4U Monster Viewer, 2026-10-24; detail in `C:\MH4U-Extract\notes\effects.md`.
- No `.pel` / `.psl`. Each monster has two `.mef` files (rMhMotionEffect); a record names an `.efl` by number, a joint and a
  placement, and the sequence timing sits in the LMT (each motion's +0x34 -> four sequence pages).
- **The sequence walker.** The driver is `cMhMotionEffect` at enemy+0xc78, and it walks the LMT pages itself.
  - ctor `0x3933fc`: page 2, bits 0..31.
  - update `0x39329c`: the bits over (last, now] through `0x95fda8`; pending = bits & ~last.
  - walker `0x3915bc`: the enemy stops after bit 16; key 1100 is a marker.
  - `0x3918c8`: a record's byte 0 is a condition bit tested against the per-frame word +0x30.
- **The contrast with GU.** GU copies the PSL block and the enemy overwrites the copy's mask with its enable word, then fires
  rise / held / fall (effect-runtime-engine.md E2). 4U walks the pages IN PLACE, with no copy and no enable-word overwrite, and
  fires on RISE only. Do not carry GU's enable-word machinery into 4U.
- **The generator factory** `0xafe1d8`, jump table `0xafe33c`: types 0 Billboard, 1 Polyline, 2 Polygon, 5 Model, 9 Filter, with a
  full / Lite pick on row word 3 & 0xf0. Compare GU: there only 5 Model is pinned, and 0 / 1 carry "Lite" names as unpinned
  guesses (construct.js GENERATOR_TYPES).

### FU (PSP)

Both engines involved are Capcom's own, built in-house:

- **MT Framework** dates from 2006. The 3DS games run MT Framework Mobile. GU and, INFERRED, 3U and 4U on the 3DS are built on it.
- **FU is not MT Framework.** It runs on Capcom's older Monster Hunter engine for the PSP, which comes from the PS2 Monster Hunter
  line.

The 3U Wii U version's engine is INFERRED (MT Framework, not checked here).

So for FU, no record format, runtime routine, address, vtable or file layout here transfers. The CPU differs as well. The PSP is
MIPS (Allegrex), little-endian. armdis, the unicorn harnesses, the tracers and the lifter all need a MIPS mode (capstone and unicorn
both have one), and `cpu.js` would need a MIPS core. What transfers is the method:

- read the consumer before calling a value READ;
- give every negative a positive control;
- derive extents;
- census per action with each test answered alone, and account for every id immediate;
- report draws separately from starts, and have Raven look;
- keep one map of every address, with withdrawn entries kept beside their correction.

---

## Where things live

| what | where | durable? |
|---|---|---|
| viewer runtime, checks, notes | `C:\MHGU-Extract\MHGU-Monster-Viewer` (`docs/render/`, `dev/`) | git |
| recorder, lifter, exporters, vectors | `C:\MHGU-Extract\efx\` | on disk, **not under git** |
| decode helpers' scripts and RESULT notes (tracers, censuses, harnesses, meter survey) | `<archive>` = `dev/archive/` (scripts and notes, in the repo; see its README) and `C:\MHGU-RE\offline\decode\monster-viewer-scratch\` (the full set with bulk outputs; archived 2026-10-24 from the session scratchpad; what was lost before that is listed in rom-map "2. Tooling") | `dev/archive/`: git; the full set: on disk, not under git |
| decode notes | `C:\MHGU-RE\offline\decode\notes\` | on disk |
| task board (a SOURCE of reads) | `C:\Coding Repos\MHGU-TASKS.md` | never committed |
