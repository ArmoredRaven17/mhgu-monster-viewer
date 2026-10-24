## How to use this file

One section per mechanism. Each says **(a)** what the engine does (the concept, the data, the rule), **(b)** GU's addresses (Switch
ARM32 build, `main.text`), **(c)** how to find it in another MT Framework build (3U / 4U on the 3DS, FU on the PSP: other compilers,
other layouts) -- the class / DTI names, strings, distinctive constants, call shapes, file formats, and the instrument that found it
here with its control. **GU-only** marks what is this build's (the Switch ARM code, the enemy word's bit layout, offsets inside
enemy / block structs); everything else is likely shared MT engine. Detail lives in dev/rom-map.md (the row named) and the specs;
this is where to start, not a copy.

Instruments named below (all in the effects scratchpad or efx/): `tracec.py` / `sweep2.py` / `deep.py` (the action main under
unicorn), `reqtrace.py` (request census by action), `jscheckpd.py` / `wordsweep.py` / `wordclip.py` (the enable word against its
transcription), `vecdrawsched.py` / `vecprim.py` / `rec_shellrec.py` (the recorders) and `lift-effects.sh` (the lift that turns
recorded blocks into docs/render/rom/effect/lifted-*.js). rom-map's tooling table has each one's control.

## E1. Requests: who asks for an effect, and how the key is found

- **(a)** An effect is a RECORD in a `.pel` effect list (rProofEffectList): three arrays -- SEQUENCE (PSL-bound, played by motion
  bits), RULED, UNIQUE (asked for by code: class code, shells, shared states). A request names (list, array, key). A class asks
  through two virtual slots, one per list (common c / own u), each with its own id -> key table; ids below 1000 go to the shared
  base tables, ids from 1000 to the class's table (`key = table[id - 1000]`, a WORD array). Shared code asks with fixed ids: the
  "level" request (ids 0..6 -> u 1120 / 1121 / 1400 / 900 / 901 / 905 / 906: the rage puff pair, the burrow, the two severs and
  their landings), the break code (`key = 999 + 5 * part + level`).
  - A shell's `ef` entry is (listId, uniqueId): listId indexes THAT shell's .shl EffectLists, the key resolves in UNIQUE.
    **The same key in SEQUENCE and UNIQUE is two different records** (different .efl) -- the Fatalis line's shell records were
    "recorded" for years from the SEQUENCE twins and refused live (2026-10-18).
- **(b)** vt+0x1cc (c) / vt+0x1d0 (u); base `0xa3dc0` / `0xa3ddc`; base tables `0x159c798` / `0x159c7fc` (one block); the level
  request `0xa499c(e, level)` (table `0x159c7fc`); array select `0x328ba0` (`*(pel + 0x74 + sel * 0x14)`, sel 2 = UNIQUE); break
  `0xa442c`. Rows: rom-map "Effect request funnel and the tables", "u 1400 -- the per-class sweep", the Withdrawn rows of 2026-10-18.
- **(c)** The .pel's three-array descriptor block at +0x74 (0x14 bytes each) is the file's signature. The class slots are the two
  adjacent vtable entries that branch to the shared request when id < 1000 (`cmp r1, #0x3e8`). The level table: a short word array
  {1120, 1121, 1400, 900, 901, 905, 906} -- search the data for that run. Instrument: `reqtrace.py` hooks 0xa499c and both slots
  over every action (control: Barroth (6, 6) r1 = 2, (6, 3) r1 = 0); a static census (`reqcensus.py`) finds the call sites and
  `sitefn.py` maps each to its function. **Trap (method):** a site's level is NOT its caller's -- Barroth's 0xe86430 maps r1 to
  (r1 == 1) ? 2 : 0; trace per action. **Trap (method):** "the clip was taken for the request" -- a request made by one action
  (the burrow) was held on every play of the clip (11 rows, 2026-10-18).

## E2. The PSL enable word (which motion bits fire)

- **(a)** The motion's PSL block carries a bit mask, but for an enemy the walker copies the block and REPLACES the mask with a per-
  motion word the class builds at setMotion: a base part (bits 0-5 always; a state group: 6-8 calm, 9-11 enraged, 12-14 tired) and
  class bits (15-31) by motion id, the action, posture, part breaks, variant, rank, class bytes. A bit outside the file mask can fire;
  a bit inside it may not.
- **(b)** setMotion wrapper `0x7256c` ([e+0x13f4] = 0; vt+0x13c(e, motion)); base word `0xca170`; the walker's copy `0x31cc88`,
  sequence vt+0x24 `0x40780` -> enemy vt+0xf0 `0xca52c` (`copy->mask = [e+0x13f4]`); tired `0x81614` (P+0x505), enraged
  `0x81670` (P+0x518). **GU-only:** the word at e+0x13f4, the group layout, every class's vt+0x13c. Rows: rom-map "THE PSL ENABLE
  MASK", "The PSL enable word per class"; transcriptions in docs/render/psl-mask.js.
- **(c)** Find the walker by the PSL block size (0x14c memcpy) and the notice word update (`& 0xfff0`); the base word by its
  constants (`orr #0x3f`, `0x1c0` / `0xe00` / `0x7000`). Instrument: `jscheckpd.py` emulates a class's word over motions x actions x
  posture x depth x rage x tired x rank x part levels and compares the transcription; `wordsweep.py` runs every class with a
  negative control (another class's transcription must mismatch). **Traps (method):** feed every input the word reads before
  trusting a mismatch -- the id word e+0xb5f0, the part levels behind [e+0x75f0]+0x64, a class pointer like Brachydios's
  [e+0xcacc] (a zero pointer reads .text and can match by accident); a transcription must not hide a stand-in in its code
  (Basarios's L0 M7, 2026-10-18).

## E3. The setMotion family and the action main

- **(a)** A class's action main (per status / number, phase byte) plays motions through a family of setMotion wrappers (plain,
  start-frame, blend, blend-partner, loop, ...); the motion id is `(list << 8) | motion`. A status script (8-byte ops: 0 / 2 / 0x35
  setMotion, 1 a record with no motion, 0xfe with an arg = change action, 0xff end) can also play them.
- **(b)** wrappers `0xafce8`, `0xafe84`, `0xafe8c`, `0xafef0`, `0xb032c`, `0xb0230`, `0xb00b4`, `0xb0174`, `0xb03f8` (blend: the
  partner in r2), `0xb04d0`, `0xb0004`; the current motion `[e+0x4b4]` (getter `0xb0944`); script reader `0xa1290` / `0x9fe88`;
  the follow `0x768c8`. **GU-only:** the addresses, e+0x4b4.
- **(c)** Every wrapper ends in the motion player and is called with a `(list << 8) | motion` immediate: a BL scan for callers of
  the core setMotion finds the family (the 2026-10-18 scan found five beyond the first five). Instrument: `tracec.py` hooks the
  family; `sweep2.py` runs every action; `deep.py` answers the gates a plain sweep stubs. **Traps (GU tool):** the stubbed float
  getter leaves s0 from the previous run, so landings appear by run order; the tracer prints r1 only (a blend partner is r2);
  turn-table plays name their motions in data (+0x10 / +0x20 / +0x30 of the table). **Trap (method):** a gate unanswered is not a
  mismatch -- answer it (the landing, a roll counter, the current motion, a frame test) and play the clip.

## E4. The parameter block, placement and the ground ray

- **(a)** A request copies the record's payload into a parameter block (offset, rotation in degrees, scale, key, joint (-1 = the
  unit), mode, space, row masks, spawn-height limit) and places the effect: mode -> a compose state (0 / 1 re-placed every frame,
  2..4 placed once), joint matrix or the parent's position; the ground height resolves to a STAGE ray when the payload asks (+0x52
  with +0x5c bit 4) -- the game raycasts the map.
- **(b)** block ctor `0x31b6b0`, copy `0x31c4ac` (block = payload + 0x10); compose `0x329d88`; recompose `0x327188` (gate
  `0x327238`); placement `0x31d16c`; joint `0x939278`; ground `0x42744` -> `0x31f904`; stage query `0x18154c` (area e+0x1054,
  output e+0x1060.., height +0x1074). Rows: rom-map "Effect parameter block, descriptor and placement", "0x18154c -- the stage ray".
- **(c)** The payload is the record's fixed 160 bytes (the .pel row); the 900.0 spawn-height limit at +0x58 is a findable constant.
  The stage query is the collision singleton's ray (null in a harness: answer it). Viewer stand-in: one floor plane, the same one
  the shells take (bridge.js native, host.stageFloorY from rockInput.floorY, per runtime). **Trap (GU tool):** the recorder's
  collision singleton is null -- the real ray faults inside its traversal; answer, never run.

## E5. The draw-LOD class (0xa92798 / 0xa718b8)

- **(a)** A model generator draws a subset of its particles by DISTANCE CLASS: near / mid / far by the camera's distance to the
  generator, thresholds held on the effect manager per level (2000.0 / 5000.0 at level 0), a table maps (level, class) to a hide
  mask; with a mask set, the draw walks the live-particle list skipping nodes whose hide bits match.
- **(b)** `0xa718b8` (0 when [gen+0xe8] bits 8..11 == 6, else `0xb8f014(mgr, level, distance)`), table `0x166aa50`, manager ctor
  `0xb8c858` (`mgr+0x1f4 + 8 * level`); the draw arm `0xa92788..0xa927c4` in `0xa9272c`; list `[gen+0xb0]`. Row: rom-map
  `0xa92798`.
- **(c)** Constants 2000.0 and 5000.0 side by side in the manager ctor; a 6 x 3 byte table of small masks. **Trap (method + GU
  tool): the recorder's camera sits 1000 from the effect, so every recording reads the NEAR class** -- record `_lodmid` /
  `_lodfar` sets (camera at 3000 / 6000) for any model generator.

## E6. The GPU quad batch flush and the stop-versus-draw order (0xb978cc)

- **(a)** The GPU particle batch stages quads per frame (index count reset at frame begin, raised by each add); the flush with no
  quads staged takes its own arm. The game's frame order is STOP, MOVE, DRAW: a request stopped between steps is not drawn until
  a step has moved it.
- **(b)** flush `0xb978cc` (vtable `0x178e210` +0xc), count `[sb+0xf8]`, add `0xb99750`, frame begin `0xb8fcbc`. Row: rom-map
  `0xb97910` (with its Withdrawn correction). Viewer: schedule.js keeps a stopped request out of the draw until a step.
- **(c)** The flush is the batch class's +0xc slot; the count field is the one the frame begin zeroes. **Trap (method):** a viewer
  that draws in a render with no step reaches arms the game never does; match the ROM's order before recording.

## E7. The effect slot pool (finder 0x4187c / release 0x419e0)

- **(a)** Live effect objects register in a per-bank bitmap pool (five 32-bit words = 160 bits, 144 table slots); the finder
  returns the lowest free slot (de Bruijn), -1 when full -- and a full pool leaves the new object UNREGISTERED (it runs, the
  manager never sees it). The release clears the slot whose table entry is the object.
- **(b)** finder `0x4187c` (mgr + 0x74 + 20 * bank; de Bruijn table at mgr+0x770, constant 0x03f566ed27179461), store
  `0x41808` (mgr + 0xb0 + 0x240 * bank), release `0x419e0`. Both are complete natives in bridge.js (unicorn control 3000 / 0).
  Row: rom-map `0x4187c` / `0x419e0`.
- **(c)** The de Bruijn constant `0x03f566ed27179461` (or its 32-bit cousin `0x077cb531`) is the signature. **Trap (method):** the
  "pool full" path is the finder's word-0-full step, not a full pool; pile-ups (Mizutsune's bubbles) degrade the game's way.

## E8. Generator flags and the bounds arm (0xae997c)

- **(a)** A generator's start copies its node block's BOUNDS (radius, two vec3) when the node carries a bounds offset and the
  effect's flag allows it; a nibble of the generator's draw flags then selects sphere / box cull tests, and two bits keep a
  generator outside the view drawn.
- **(b)** `0xae9970..0xae99e8` (node block +0xbe the offset, +0xa2 the nibble, [[g+8]+0x118] bit 27); consumers `0xa64894`,
  `0xae9bc4`, `0xaec0xx`, `0xae9dc4`, `0xaec1fc`; the sphere test `0x881d94` (a native). Transcribed: construct.js generatorFlags.
  Row: rom-map `0xae997c` (Lagiacrus u 61).
- **(c)** The node block's +0xbe u16 offset to a bounds block (radius at +0x20); the cull tests read g+0x50 bits 24..27.

## E9. Generator type 20 (SizeBillboard) and the primitive layer (0xbae8cc)

- **(a)** Generator type 20 (cParticleGeneratorSizeBillboard) draws through the draw system's primitive layer, which only the
  primitive recorder runs; its GPU shader variant must be translated too.
- **(b)** factory arm `0x9bb150`, ctor `0xa7e2b0` (vtable `0x178918c`), getDTI `0xa81ef4`; the draw reaches `0xbadd68` at
  `0xbae8cc` (packet word 1 bit 22 clear); shader FPrimitiveCalcPosParticleNT. Rows: rom-map "genType 20", `efx/vecprim.py`.
- **(c)** The DTI string "cParticleGeneratorSizeBillboard"; the generator factory's type switch. **Trap (GU tool):**
  vecdrawsched / record_shells / add_effects --record never draw the primitive layer -- use vecprim.py, then glsl.py for the shader.

## E10. Keyed curves: kind 1 (0xaf7ba8)

- **(a)** A keyed vec3 track evaluator switches on an interpolation kind when no segment is found (0 inline, 1, 2, > 3 the
  constant). A thrown rock's 3-key track takes kind 1.
- **(b)** `0xaf7930` (table `0xaf7ab4`: kind 1 -> `0xaf7ba8`), reached from the node update `0xae8e34` -> `0xae9050`. Row: rom-map
  "u 0 (em066_00 ...)".
- **(c)** **Trap (GU tool):** the harness never evaluates such a track (0 calls), so the arm is lifted from another set that does
  (a weapon's: vectors/w02_u800). A fix that lived only in another viewer's lift was missing here -- share sets on V.

## E11. Units: the two-pass delete, the end, and the draw gate

- **(a)** An ended unit is not destroyed at once: the update walker moves it 3 -> 4 on the next pass and destroys it on the pass
  after; a stop request on a core walks its unit array (each unit's end). The unit's draw is gated on a state-and-flags test, and
  a core-level "shown" byte propagates into each unit's flag so a running effect can be hidden.
- **(b)** walker `0xc044c4` (3 -> 4 at `0xc045c0`, destroy `0xc045e0..0xc04600`); stop `0x329c40` -> `0x329874` -> unit vt+0x128
  `0x44ab0` -> end `0x327e7c`; core +0x1c1 -> +0x18c -> unit +0xc bit 11 (`0x43370`, `0x43da0`), draw only at
  `(+0xc & 0x4807) == 0x4802` (`0xc03e2c` / `0xc03fa8`). Rows: rom-map `0x7abfb8` hang (two-pass delete), "The request STOP and
  the unit end", `0x43370`.
- **(c)** The unit base's state byte and the walker's three-state switch. **Trap (GU tool):** a harness that deletes at the end of
  the frame a unit ended in makes a later stop walk a corpse (vtable wound back to the base, +0x128 = 0 -> blx 0); the harness
  now follows the walker (proofunit.py).

## E12. The hit system's partner exclusion (0x168f20)

- **(a)** An attack does not hit its linked partner: the pair pass excludes owner / target pairs where either is linked to the
  other (a two-monster duo).
- **(b)** pair pass `0x16acf0`, exclusion `0x168f20` (link target `P+0x5c30`). Row: rom-map `0x168f20`; dev/em069-duo-spec.md 19.
- **(c)** The pair pass iterates 4 hunters then 10 enemies; the exclusion compares a link-target field both ways.

## E13. Instruments and their controls (a method summary)

- Every READ needs the consuming instruction read; every negative a positive control run the same way (Barroth's r1 = 2; the
  known `0xe11120` reader found by the same immediate scan; another class's transcription as the word sweep's negative).
- An unrecorded path ("unverified path" / "falls into unrecorded code") is fixed by reading the branch's test, then recording a
  set that takes it (the right record -- UNIQUE vs SEQUENCE --, the right camera distance, the concurrency it needs:
  vecdrawsched takes several starts in one schedule) and lifting; never by patching the lifted code.
- A shell record needs the shells joints file (`joints/<mon>_shells_rest.json`, all joints at rest) before `rec_shellrec.py`.

