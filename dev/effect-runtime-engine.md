# The effect runtime -- engine-level reference

(The effects agent owns this file; the sections it writes go above the shell engine's. Section "The shell engine" below is the shells
lane's, 2026-10-18.)

## How to use this file

One section per mechanism. Each says **(a)** what the engine does (the concept, the data, the rule), **(b)** GU's addresses (Switch
ARM32 build, `main.text`), **(c)** how to find it in another MT Framework build (3U / 4U on the 3DS, FU on the PSP: other compilers,
other layouts) -- the class / DTI names, strings, distinctive constants, call shapes, file formats, and the instrument that found it
here with its control. **GU-only** marks what is this build's (the Switch ARM code, the enemy word's bit layout, offsets inside
enemy / block structs); everything else is likely shared MT engine. Detail lives in dev/rom-map.md (the row named) and the specs;
this is where to start, not a copy.

Instruments named below (all in the effects scratchpad, now archived at `<archive>` -- see rom-map "2. Tooling" -- or in efx/): `tracec.py` / `sweep2.py` / `deep.py` (the action main under
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

- **(a, 2026-10-19)** Inside the chosen array the record is FOUND BY KEY, not indexed by it: a linear search for the record
  whose key halfword matches. A key the array lacks makes nothing -- no effect, a null handle (Gravios's u 60 / 70 / 90 / 100).
  **(b)** `0x326010` (search `0x326060..0x326090`, record +0x50 the key, not found -> 0 at `0x326084`; `0x408bc` frees the core).
  **(c)** Follow the request entry (`0x408bc` here) to the call that receives (pel, array, key) and returns success: the loop
  comparing a record halfword against the key is the search. **Trap (GU-tool, withdrawn):** rom-map's `0x328ba0` row read the
  array as indexed by the key.

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
- **Finding the walker in another build (2026-10-24, read from GU's disassembly for the 4U consultation; rom-map "THE PSL ENABLE
  MASK" rows `0x31ca58` / `0x31cd70` / `0x3242e8` / `0x40718`).** How GU first found its walker is unrecorded (INFERRED: from the
  PSL data's consumer side, after the file-mask assumption was withdrawn, rom-map Withdrawn row on the PSL `+0` mask).
  - **(a) The shape.** Per frame the walker looks up the current motion's block (a per-list resource, slot = motion), may copy it
    and let the owner rewrite the copy's mask, expands the run list `(value, frames)` into one 32-bit word per frame stepped (at
    most 32), and for each frame and each bit 0..31 compares this frame's bit with the previous word kept on the sequence object:
    rise / held / fall go to three different callbacks. The rise callback reads the bit's u16 effect number from the block and
    requests it.
  - **(b) GU.** Walker `0x31ca58..0x31cd6c`; slot lookup `0x3242e8` (`[psl+0x64]`, u16 count at +6, `[data+8+4*motion]`); run reader
    `0x31cd70..0x31cef0` (prev word seq+0xbc, rise vt+0x18 / held +0x1c / fall +0x20); rise `0x40718` (`ldrh` at blk+4+2*bit, then
    `0x4d5b2c`, unmapped). Block 0x14c: +0 mask, +4 u16 effectNo[32], +0x44 p1[32], +0xc4 p2[32], +0x144 run count, +0x148 runs.
  - **(c) Fingerprints that survive a recompile:**
    - the 32-bit loop: `cmp rB, #0x20`, `tst`/`and` with `1 << bit`, a previous-word field and three distinct call targets (scan
      `tst` / `ands` / `teq` / `and`, not `tst` alone);
    - the per-step cap `cmp rN, #0x20` + `movge #0x20`, and a stack array of about 33 words for the per-frame values;
    - the run walk: count and runs pointer side by side in the block (GU +0x144 / +0x148), stride 8, an accumulating frame sum,
      a wrap compare against the motion's frame count (the LMT `numFrames`, E22);
    - the effect number read as `add rX, blk, bit, lsl #1` + `ldrh`. Working UP from the effect request is the quickest route:
      of the request's callers, the walker's callback is the one whose key comes from that `ldrh`, not an immediate;
    - on ARMv6K (3DS) expect no `ubfx` / `movw` / `vcvtp`: `lsr` + `and`, literal pools, and a C `ceil` or an FPSCR rounding
      change in their place (INFERRED).
  - **Controls (GU):** Basarios L2 M3 bits 15/17/19/21 outside the file mask, and Rathian L2 M5 (file mask 0) firing u 200 / 201 /
    202 (rom-map "THE PSL ENABLE MASK"). Elsewhere: a known key at a known frame as the positive, a motion with no sequence data as
    the negative, both run the same way.
  - **Not every build copies the block or keeps an enable word.** MH4U walks its LMT pages in place and fires on rise only
    (effects-porting-guide.md "Other builds, as read").

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
- **(c)** The de Bruijn constant `0x03f566ed27179461` is the signature (a 32-bit-only build may use the 32-bit de Bruijn `0x077cb531` instead -- not seen here, a guess for the search). **Trap (method):** the
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

## E14. The update order: action main before the frame handler (2026-10-19)

- **(a)** In one frame each enemy runs its action main (with any same-update follow) and only then its frame handler and the
  shared per-frame state requests (the trap / stun / sleep records). So an action that falls to its default in its own update
  -- a trap or a stun the class has no case for -- is gone before the shared request asks, and its record never fires.
- **(b)** sUnit's line pass `0xc04728` calls vt+0x24 (`0xc04804`), vt+0x2c, then vt+0x28 (`0xc04834`) per unit. vt+0x24 reaches the
  action main through `0xada80` -> `0xa5940`; vt+0x28 = `0xae32c` -> `0xae370` (vt+0x208, `0xa409c`, `0xa41b8`, `0xa4518`) and
  `0xa3ef0` (c 1103). The other pass `0xc044c4` writes unit+0x1c = frame step `[[0x211f764]+0x68]` x the line rate before vt+0x24.
  **(c)** Find the unit manager's line loop (the one that tests the unit's state bits and calls two or three adjacent vtable
  slots in a row); the slot that leads to the action dispatcher is the earlier. **Trap (method):** a refusal "the request may
  fire once" is decided by this order, not by the request's own code.
- **(a)** The ailment byte P+0x5e08 (bit 0 sleep, 2 paralysis, 4 stun) is set by the action change itself, for a family of
  status-10 numbers, and cleared by the first change to an action outside the family -- the shared per-frame records follow it.
  **(b)** changeAction's new-action switch `0x754f8` (table at `0x7581c`, number - 0x1b) -> `0xa2800` / `0xa2b48` / `0xa2e50`;
  the stun's end in `0x76098` (`0x766c4..0x766dc`). **(c)** Search the action-change function for a switch on the new number
  that calls small setters which OR one bit into one byte and store a duration from the monster's ailment data.

## E15. A second unit's own walker, and requests through a class's own control block (2026-10-19)

- **(a)** A part that is a unit of its own class (a tentacle, a rider) has its own PSL walker: its motion, its frame, its own
  lists, its class's enable word (vt+0x13c) and its own pels. Its records are its, not its owner's, so they need a runtime of
  their own, fed that unit's clip and time.
  **(b)** Nakarkos's arms: uEmOstgaloaArm, vtable `0x17f6498`, word `0x107f0e4`, lists em084_00_l_N / r_N, pels em084_00u_l /
  em084_00c_l (_r). Viewer: effect-mounts.js `attachSideEffects` / `detachSideEffects`, index.html `driveArmEffects`.
  **(c)** Look for a second vtable whose +0x13c differs from the body's and whose ctor names its own motion lists. The body's
  lists that `add_effects.plan()` marks "entity motion: not bound" are that unit's.
- **(a)** A class can fill the request's control block itself instead of the shared fill: a point (+0xc0), a scale (+0x40), flags.
  The effect then stands where the class says, with no joint. The block is the same structure every request uses, so the
  runtime takes it as data and the ROM's own request code consumes it.
  **(b)** `0x40a54` builds the block (+4 = 0, +8 = 0, +0xc = 0xfe). The class sets +0xc = the area byte, +0xd0 = its model's handle
  (vt+0x130), +8 = 3, +0x1c |= 3 with +0xc0.. the point, and +0x14 |= 0x40000000 with +0x40.. the scale. Then vt+0x1cc(e, id,
  block) requests it. Nakarkos's c 800: `0x106eff4`. The viewer's schedule.js `placeEvent(pel, key, requesters)` runs the same
  through proof.js's requester.
  **(c)** Search a class band for `bl 0x40a54` followed by a vtable call at +0x1cc / +0x1d0 on the enemy. The stores between the
  two calls are the block.
- **Trap (viewer):** a seek's hard release is not a game event. Releasing a running particle generator walks its destructor's
  free-list arm (`0xa55ea8` -> `0xa55f20`), which only a recording of that release covers (rom-map trap 115).

## E20. The row EXCLUSION arm (doc audit 2026-10-24: index entry; the reads are 2026-09-29/30)

- **(a)** Besides the two inclusion masks of E17 (a row builds when `(w00 & MASK1) && (w04 & MASK2)`), a row is SKIPPED when
  `(effect byte +0x116 | a runtime singleton's +0x228) & row[+4]`. The +0x116 byte is AUTHORED data (read off a resource stream by
  a large loader), not a runtime state; which resource carries it is unread. MASK1 / MASK2 reach the unit through the parameter
  block: payload +0x48 / +0x4c -> block +0x88 / +0x8c -> unit +0x1c8 / +0x1cc (a parent overwrites +0x8c).
- **(b)** exclusion `0x9bb904..0x9bb934` (rows: `[[effect+0xf4]+0x70]` stride 0x44, masks `[[effect+0xf4]+0x68]` stride 0x10);
  inclusion `0x9bb954..0x9bb974`; mask writer `0x9ba670`; loader `0x345d84` (`0x349e44`); copy on clone `0x352b00`; singleton
  `0x183b9ec` -> `0x211f554`; block hand-off `0x31bf5c` / `0x31bf80`, `0x32a2e8`. Rows: rom-map "Row gate (Effects lane)";
  dev/row-exclusion-gate-0x9bb904.md.
- **(c)** Find the row walk (E17's) and read BOTH arms; the exclusion is the `tst` against a byte OR-ed from the effect and a
  global. INFERRED for 3U / 4U: the same two-mask + exclusion shape (unchecked). **Trap (GU tool):** proof.js `proofStart` and
  efx/proof.py read the masks at block +0x58 / +0x5c, which are not the masks (board 3916-3920).

## E21. Who issues an action: the command-table (EMC) interpreter (doc audit 2026-10-24: index entry)

- **(a)** A monster's AI is a byte-coded command table (`<em>_cmdtbl.emc`, groups g0.. of streams s0..). The interpreter walks a
  stream; op `00 st n` issues action (st, n); BLOCK ops (switch / if) carry a mode byte (00 open, 01 case, 02 else, ff close);
  switches test awareness, posture, distance, percentage draws and class callbacks. An action that no stream issues, no class
  code changes to and no script op (`0xfe`) names is a NAMED refusal, not a gap -- every negative here was a full census with a
  control (rom-map "Seltas duo", "Elder Dragons -- the shells" (7, 0x32) row).
- **(b)** op dispatch `0x836f0 + [0x836f0 + 4 o]` (`0x836e4..0x836ec`); op 00 `0x8456c` -> `0x754b8` -> `0x76098`; the case compare
  `0x8e088`; latch bytes e+0x73f0 / 0x73f3 / 0x73f4 (+0xba52). Rows: rom-map "EMC ops -- the shared table" (every op, its handler
  and its "no hunter" answer); tools `emcfind.py` / `emcacts.py` / `fb/emc023.py` (rom-map tooling).
- **(c)** The .emc file format is the entry point (INFERRED shared by the MT titles with these tables: check 3U / 4U files for the
  same group / stream / op layout before reusing a parser). Find the interpreter by its op jump table (a word table indexed by the
  op byte) and op 00's call into the shared setAction. **Trap (method):** a stream can issue the same action in two branches
  (rom-map trap 143); evaluate op 0x92 / selector splits, do not grep for the bytes alone.

## E22. Motion length, layers and the unit's own motion (doc audit 2026-10-24: index entry)

- **(a)** A motion's frame count is the `.lmt` block's `numFrames` (+0x08; `loopFrame` +0x0c), and a PSL block's frame count is
  exactly that; an exported glb clip ends at its last KEYFRAME, so it can be shorter -- test "is the viewer playing this motion"
  against the `.lmt`, never the clip length. The schedule walks real frames. A model plays up to several motion LAYERS: slot 0
  writes every joint, later slots only the joints their clip tracks (blend, or additive by an attribute bit); setMotion resets the
  blend. A unit's position is integrated by the shared mover (pos += dt R v + dt^2 R a / 2), and R turns only in some postures.
- **(b)** `.lmt` v67 (`build/frag/motion-audit/lmt.py`); compositor `0x953ad8` (slots model+0x4b0, 0x140 B, count +0x4a4),
  property table `0x94cf68`, setMotion `0x951678` (blend reset `0x95173c`); vt+0x78 -> `0x72630`; the second-slot users (Valstrax,
  Nakarkos, Ahtal-Neset only); integrator `0x7a820` (`0x7a994..0x7aa98`, posture mask 0x76); layer length hold / clamp `0x725fc` /
  `0x72714`. Rows: rom-map "The viewer's clip duration is NOT the motion's length", "Action dispatch and the per-frame trigger",
  "Shared enemy / command layer".
- **(c)** The `.lmt` header is the portable anchor (INFERRED: same LMT family in 3U / 4U; FU is not MT Framework). The compositor
  is the uModel::Motion property table's owner (find the "mMotionNo" / "mBlend" property names). **Trap (method):** a frame
  test past the layer's held end never passes (gapI: em027_00 c 30 never fires in the game) -- check the hold before calling a
  row missing.

## E23. Draw order: the generator key and the model's mesh key (doc audit 2026-10-24: index entry)

- **(a)** Translucent draws are ordered by a key, not by a scene sort.
  - An effect generator's key is its view depth, clamped at 0. A generator at or behind the camera gets the far key (it draws
    first). A generator flagged by a byte of +0x44 gets 0 before any depth is taken.
  - A skinned model's translucent rows are keyed with ONE view depth for the whole model, plus the mesh row's own bits. Its meshes
    keep their table order and are never depth-sorted against each other.
- **(b)** Generator key `0xaec570`: 0x7ffe at / behind the camera at `0xaec738..0xaec744`, else max(D, 0) at `0xaec748`;
  `[gen+0x44] & 0xff00 == 0xf00` returns 0 at `0xaec5e4`. This is INFERRED on the board; the READ is in the decode note
  effects-draw.md, "The draw-order key at the camera".
  The model draw is `0x9392c0` (uEnemy vt+0x68). Its key is `(0x7fff - clamp(mPriorityBias + model+0x19c - depth)) << 12 | (row+8 >> 8) & 0xff`
  on item types 0x11 / 0x0f; docs/render/monster.js:76-80 transcribes it.
  Rows: rom-map "Effects -- the primitive layer ...", "Colour space -- the model pass".
- **(c)** Find the key builder by its constants (0x7ffe / 0x7fff and the `<< 12` pack) in the draw-item submit. **Trap (viewer):**
  a renderer that sorts meshes per frame (three.js does, by renderOrder ties) makes a model's fins trade places as the camera
  moves. Give each model one depth and keep the mesh table's order.

## E24. The model pass: colour space, alpha test, material binding, distortion, lighting (doc audit 2026-10-24: pointer)

Not effect-runtime code. Effect models and monster models share this pass, so a port needs it. The detail and the controls are in
`dev/model-pass-colour-space.md`; the 3U / 4U consequences are in `dev/gu-lessons-for-3u-4u.md`.

- **Colour space:** `sRender.mSRGBEnable` (+0x29) is built OFF. The model pass computes in display (sRGB-encoded) values throughout
  (model-pass-colour-space.md §0 / §2.1).
- **Alpha test:** NVN colour state taken from the MRL feature word: bit 20 enable, bits 21..23 function, bits 8..15 reference.
  Loader `0xb42ed4`; SetAlphaTest at `0xafdd20`; SetAlphaRef(byte / 255) at `0xbbf2f4`. 190 / 570 monster materials enable it, all
  GREATER (R, 2026-09-13). **GU-only:** the 3DS (PICA) alpha test is encoded elsewhere in its MRL and must be read there.
- **Material binding:** +0x214[i] = the .mrl's find-by-name of the .mod's i-th material name, so the index follows .mod name order,
  not .mrl order. Sites: `0xb4688c` / `0xb45da8` / `0x88c05c` (INFERRED on the board; efx/modmat.py).
- **Distortion:** `0xb03174` makes the same-frame scene copy (nDraw::Scene +0x2e4) that is bound as tDistortionMap (R).
- **Deferred lighting:** the draw path `0x891390` gates on mDeferredLightingForcedForwardRendering (config +0x22d), a companion byte
  +0x22c, and a value <= 2 that picks the lighting technique. The shipped defaults are NOT READ (INFERRED).
- **(c)** The property names (`mSRGBEnable`, `mDeferredLightingForcedForwardRendering`, `tDistortionMap`) are MT reflection strings.
  Look them up by name in another build before searching for code. Rows: rom-map "Colour space -- the model pass".

## E25. Spawn size type: the monster's scale, and what else it selects (doc audit 2026-10-24: index entry)

- **(a)** A spawn entry carries a size TYPE.
  - The enemy takes a scale multiplier from its dtbase.
  - A class virtual then turns the type into the final scale through the class's own table.
  - The same type can select other things: a part group (Kelbi), other parameters (Bnahabra, Konchu, unread), and an effect
    record (Teostra's aura: u 10 instead of u 0 while P+0x5cb6 == 1).
  - Effects on the monster are placed on its joints, so they take the scaled skeleton. An effect's own payload scale is separate
    (E4). This is INFERRED; how the parent's scale reaches an effect is not traced.
- **(b)** Spawn entry (36 B, every `rEmSetList`) byte +7 -> em+0x5cb6 (`0x6fb68`); dtbase multiplier -> mEmScale em+0x1ac
  (`0xb94d0`); class vt+0x1d8 (Kelbi `0x10cc078`, table `0x16a3b48` 0.85 / 1.3 / 1.1); Teostra vt+0x208 `0xe10f7c`. Rows: rom-map
  "Spawn size type -> scale and appearance" (taken from part-review.json, not re-read), "Teostra / Kushala".
- **(c)** The `rEmSetList` entry and `mEmScale` (a reflection name) are the anchors. Read each class's vt+0x1d8 for its own table. A
  type can mean a different thing per class; do not reuse GU's numbers. **Trap (method):** a record picked by the size type looks
  "never fired" at the viewer's default type. Check P+0x5cb6 gates before calling a record missing.

## E26. GU Hyper: a quest flag, a part-aura table, two held auras (2026-10-25) -- GU-ONLY

**GU-only** (Raven, 2026-10-25: "4U lacks hyper, hyper is a GU only thing"). Only the method carries over: a state field that
drives a held aura on a part and switches per-part biases. Do not look for this mechanism in 3U / 4U / FU (4U's Apex state is
added parts, Raven's lead, unread there: dev/effects-porting-guide.md 5).
- **(a) What it is.** A quest's monster entry flags the monster hyper; the class attaches a per-monster data file listing aura
  "parts" in two groups; the shared code holds one aura of each group (an ordinary held effect record), stepping both at HP
  thresholds tied to an action (the rage roar), and per-class hooks fire burst records and change motion rates on chosen frames.
- **(b) GU's addresses.** Flag e+0xb720 (vt+0x170 0xca664, from the spawn setup 0x6fa58 reading byte +0xb of the quest's monster
  entry); data rEmDouMouKaData (`enemy\dou_mou_ka\<id>_doumouka.mdd`, vt+0x150 0xca68c); the aura step 0xca1f8 (u id 47 + ID ->
  u 1300 + ID through the base u table 0x159c7fc; handles e+0xca8c / +0xcaa0; stop 0x329c40(h, 0)); the HP step vt+0x194 0xca980;
  bursts 0xca4e0 (u 1310 + ID) from per-class hooks (Rathian vt+0x478 / +0x490); part biases 0xca6b0 / 0xca754 (per part).
- **(c) How to find it elsewhere in GU.** Grep a monster's arc for `dou_mou_ka`; the class names `cEmDouMouKa_*` are in rodata.
- **(d) Viewer.** The Hyper part toggle (index.html stepHyper, docs/hyper-auras.json); ~~the motion side is held~~ the motion side
  built 2026-10-27 (index.html stepHyperMotion, docs/hyper-motion.json; (g) below; dev/hyper-states.md 6).
- **(e) Which data, and what the bias touches (READ 2026-10-25).** The data file is chosen by quest rank at spawn (G -> the `_g` file:
  e+0xb736 = rank > 4, the loader 0x4bd64's column 0x26 / 0x27); the MeatChange bias (vt+0x18c 0xca900) reaches only the DEFLECT
  classifier (cut / impact x bias -- the Hardness) and the shot deflect paths (+ bias), never damage. Method for another game: find
  the loader by the data class's getDTI (here 0x51400) and its GOT slot's loads; find the bias consumers by the vtable slot's
  `ldr [vt,#slot]; blx` sites behind the state flag.
- **(f) The eyes (2026-10-27, dev/hyper-states.md 5).** The glow is effect DATA, not code: the head aura's own file carries a pair of
  rows per eye selected by a per-monster MASK1 bit -- a reverse-subtract halo (1.22, 1.84, 1.15; bias -15) and an HDR core
  (4.0, 0.99, 0; bias -10) -- placed at the eyes by the effect's own node offsets from the head joint (no eye joint). No class's
  hyper code calls a material / clip / part-set routine (90 sites). **The engine point (likely shared MT):** an opaque-colour model
  particle's depth state depends on the context pass left by whatever drew before it in the frame -- not 0x11: the unsorted emit
  with a fixed depth-WRITE slot (GU 0xc8ea44 / 0xc8f2dc); 0x11 (a GPU node particle's draw leaves it): the sorted emit with the
  row's own flags (here DSZTest, no write) and depth / bias order. A halo drawn in front of its core hides the core on the first
  path and frames it on the second. **Trap:** a harness frame that holds only the effects under test starts every frame at the
  scene setup's pass and shows the first path; compare with an in-game image before calling such a row black or missing.
  **Which pass, READ (GU addresses; the shape is MT's):** a model unit's draw pushes / pops the context state around the model
  render (0x93815c: 0x8777e4 / 0x8787b0), an effect unit's (0x9b75e8) does not, so only an earlier effect unit's node draw changes
  it; sUnit's draw (0xc03cd0) either runs every unit on one context in line order or copies the context to the job workers
  (0x878b38), which take units in a dynamic order -- the pass depends on what else is live and can change frame to frame. Viewer:
  the input "Effects drawn before" (None 0x15 / a GPU-particle effect 0x11) for the units it does not have, render/rom/effect/host.js
  `framePass`. (c) elsewhere: look for the context-state push / pop pair around the model render (a memcpy of the state block onto a
  stack in the context) and check whether the effect unit's draw has it. (c) elsewhere: find the pass setter by its callers' immediates (here
  0x87cf70, 241 sites; the node draw's `movwhi rX, #0x13` default 0x11), and the model draw's unsorted test by the pass compare.
- **(g) The motion side (2026-10-27, dev/hyper-states.md 6).** Two mechanisms change a held aura's motions, neither joins clips:
  (1) a CLASS HOOK per frame (GU: vt+0x1ec below G from the action main, vt+0x1f0 at G from the running frame before the motion
  advance) switches on each held slot's aura ID and the motion id, and at frame tests sets the motion's rate factor (a layer-speed
  factor the next setMotion puts back to 1.0) and requests a burst record (u 1310 + ID); the G hooks test their rates "at or past"
  (re-set each frame), bursts as crossings. (2) the data file's per-ID ACTION table: at every action set, with both groups held,
  group 0's then group 1's entries are searched for the new action (status, number) and a percentage roll; the hit's
  MotionSpeedRate (clamped by its Limit) multiplies the action's base speed, so every motion of that action starts at it. Speed =
  data factor x hook rate. Shell entries (class number, attack, scale) resize the shells that carry a held ID. **Method for
  another build:** don't transcribe hooks by hand -- run each class's dispatcher under an emulator with the slot IDs and motion id
  set, the frame predicate answered from a swept clock, every shared call stubbed and logged (GU:
  `<archive>/hypermotion/hookemu.py`; one class dispatched on a second em field, e+0xb5f0). **Trap:** a hook's own switch is on
  the motion id, the data table on the action -- a viewer that plays clips needs an action -> motion census for the second.
  **Attacks (2026-10-27, dev/hyper-states.md 7):** the data table's AttackRate / PowerRate reach only the hit object's POWER (GU
  0x1689b0: power x rate, a byte + power), never the hit shape; the class action code has no hyper path at all (every action
  emulated off / on, with a positive control). So a hyper attack differs by speed, its bursts, its power and its shells' scale.

## E27. The notice marks: a sense scan, a memory timer and a combat byte (2026-10-25)

- **(a) What it is.** Every frame the enemy's pre-action tests each hunter against a SENSE RECORD from the monster's own tuning
  file: inside a near radius he is seen outright; otherwise he must be inside a horizontal range, inside a yaw cone about the eye's
  facing, inside a height band about the eye (or a pitch cone), with a clear stage segment from his chest to the eye. A seen hunter
  gets a per-hunter MEMORY (a frame count from the base data file), counted down by 1 a frame. A byte moves 0 -> 2 on the first
  sighting while calm ("!" record) and 2 -> 0 when every memory has run out ("?" record); 2 -> 1 (combat) and 1 -> 0 (a timeout of
  its own) fire nothing. The eye is a joint: its translation, and the yaw / pitch of its Z row (optionally turned by two angles).
- **(b) GU's addresses.** Pre-action 0xa50dc: 0xc8d20 (memory 0xc9548, 2 -> 0) -> 0xa5468 (distances) -> 0xc3088 (the scan; test
  0xc3c4c, cone 0xc411c, segment 0x49c08 -> 0x182f04) -> 0x7f010 -> 0x7e9c8 (0 -> 2). Both edges go 0xbcae0 -> 0xa4388 (c 1200 /
  c 1201). Sense records: dttune [obj+0x78], 32 bytes x obj+0xf9, picked by P+0x249 (0x71088); memory: dtbase [obj+0x8c] s16 pair
  (0x71248). Gates: P+0x1a8 bit 0 (0x159c2dc per em id), P+0x24a bit 0 (3 at spawn), the enemy manager's round-robin (one enemy
  scans per frame, 0x5a3b8). All rows: dev/rom-map.md after `0xa4388`.
- **(c) How to find it in another MT build.** Find the "!" / "?" record ids in the shared request table (here 1200 / 1201); the
  request's only callers are the combat-byte setter (0xbcae0 here); its callers with 2 are the notice path, with 0 the timer. The scan
  is the routine that ORs the per-hunter detection bytes; its test reads a 32-byte record from the tune file (range, height, two u16
  half-angles) and converts atan2 to u16 with 10430.378 (65536 / 2 pi). The memory is the s16 loaded into a per-hunter float right
  after the OR. 4U's notice marks (an older note: 1000 / 1001 on a combat flip at 0x91aa88, task board) are UNREAD against this.
- **(d) Viewer.** render/notice-sense.js (the table, senseCone / senseTest / NoticeEdges / eyeOf), index.html stepNotice: the
  stand-in hunter is the Hunter control's point, the stage is the floor plane. The combat byte 1 is set by EVENTS in the ROM (hit
  reactions, group-5 forced transitions, class code -- 0xbcae0(e, 1)), never by rage (0xbcdb0 writes P+0x518 only), and falls back
  to 0 by its own timeout; the viewer's stand-in is the RISING EDGE of the rage it shows after the monster is up (INFERRED: the hits
  that enraged him), a rage held from the mount being no event (lane B3, 2026-10-27; until then Enraged HELD the byte at 1). The Hunter
  control's Far (25000) is beyond every record, so "?" can be reached on every monster. The notice turn (command group 4) is
  animation and is not built.
- **(e) Traps.** The record count varies (1..3 records); reading a fixed 3 gives garbage rows 1 / 2 on 67 monsters. The near radius
  is not small on every monster (Kirin 5000; Lao-Shan, Nakarkos and Ahtal-Neset 20000): a hunter behind at 2100 is still seen. A flag bit (GU: P+0x1a9 bit 7, from the per-em table) sees every hunter outright, so
  the "?" never fires on those monsters (GU: Lao-Shan Lung, Ahtal-Neset, Ahtal-Ka). Rage is not the combat byte: a stand-in that
  holds the byte at 1 while the viewer shows rage hides both marks on a monster whose viewer state is always enraged (GU's Furious
  Rajang, whose "permanent rage" is a look; fixed 2026-10-27: the edge, above) and never lets an enraged monster lose the hunter.

## E28. Flashed: a shared enemy state -- a flash-source list, a cone test, a blindness timer, one held record (2026-10-25)

- **(a) What it is.** A flash item does not hit the monster: its shell REGISTERS A SOURCE (point, radius, area, live) in a small
  table the enemy manager owns. Each frame the enemy's sense scan, after the hunter test, tests every live source in its area
  against the EYE of its sense record: horizontal distance within the source's radius, height within the record's band, and yaw /
  pitch within a second pair of half-angles in the same record (the FLASH cone, wider or narrower than the sight cone). A pass sets
  a BLINDNESS TIMER from the monster's tuning file: a row of three durations (calm / enraged / tired), reduced by a fixed amount for
  each earlier flash (the count is capped) with a floor, counted down 1 a frame and zeroed at death. While it runs, the shared
  per-frame state pass holds ONE record -- the same record and the same handle as the stun's stars, requested once and stopped when
  neither blindness nor stun nor a third (small-monster) condition holds -- and the sense scan sees no hunter, so the notice
  cannot fire; the command interpreter restarts into the flash reaction group (animation). Immunity is DATA: a bit in the base
  data file's flag word (with a second bit allowing it while burrowed); a class can also close the scan's own gate byte at every
  action start, or flip the data bit per state (enraged, underwater).
- **(b) GU's addresses.** Source table G+0x28f8 (8 x 24 B; adder 0x5bacc from uShellPlcom_000 / uShellOt001 / uShellPlw04_000;
  reader 0x49e7c). The test 0xc3934..0xc3bc4 inside the scan 0xc3088: gates P+0x24a bit 1, 0x99c58(e, 4) (P+0x3a8 = dtbase obj
  +0x6c: bit 2 flashable, bit 3 in posture 4), P+0x5a4, the Chameleos area timer 0x5c1a8, e+0x7420, 0x810d4; the cone = sense
  record +0x1c / +0x1e. Timer 0xa1a88 -> P+0x59c = s16 [[dttune obj+0x64]+0x58][1][calm | enraged | tired] (null 1800) - 300 x
  P+0x5a1, floor 300, P+0x5a1 capped 3; countdown 0xc9080; zeroed 0x75be4 (death). The record: 0xa3ef0 (vt+0x28) -> vt+0x1cc id 3
  = c 1103 into e+0xb62c, stop 0x6f124. Hunter test skipped 0xc362c, notice refused 0x7ea24. GU-only: every offset, the bit
  positions, the id 3 / key 1103. Rows: dev/rom-map.md section "Flashed".
- **(c) How to find it in another MT build.** Start from the stun-stars record (here c 1103): its shared requester tests THREE
  conditions; the float one is the blindness timer. Its only setter reads a three-entry s16 row from the tuning file and contains
  the constants 300.0 and 1800.0 (GU; check the build's own) and a count byte capped at 3. The setter's caller is in the sense scan
  (the routine that ORs the per-hunter detection bytes): the loop just after the hunter loop that walks a fixed-size global table and
  converts atan2 with 10430.378. The source table's adder is called by the flash item shells (find them by class name: the player
  common shell, the Palico shell). The immunity bit is the one tested with an AND-equals helper on the per-unit copy of the base
  data's flag word just before that loop. 3U / 4U / FU: UNREAD against this.
- **(d) Viewer.** shared-states.js FLASH / FLASH_BLIND / FLASH_IMMUNE / flashable / flashFrames; index.html `#monFlashed`
  ("Flashed", in the shared row) and stepFlashed (schedule.holdEvent of c 1103, one handle shared with the stun rows; a `dead` row
  stops it; noticeSeen / 0x7f010 refuse while it holds). Held until switched off (the game's time is flashFrames). The flash
  reactions are not built. Instruments: `<archive>/flashed/flashemu.py` (the test under unicorn, controls), `census.py`,
  `flashmeter.mjs` (the draw meter on the switch).
- **(e) Traps.** The flash cone's two u16 are read through a pointer to the record copy + 4, so an offset scan for the record's
  +0x1c finds nothing (rom-map trap 155). Immunity is not only the data bit: GU's Chaotic Gore Magala has the bit and a tune row,
  but its class writes the scan's gate byte to 1 at every action start (trap 156). A row of zeros is not immunity (the floor makes
  it 300: Ahtal-Ka), and a null row is not immunity either (the default: Valstrax 1800). The stun-stars record being the same
  handle means a stun that ends while blind does not stop it, and a blind that ends during a stun does not either.

## The shell engine (shells lane, 2026-10-18)

Written to carry over to other MT Framework builds (3U, 4U, FU, ...). For each mechanism: (a) what it is, (b) GU's addresses, (c) how
to find it elsewhere. Pointers, not copies: the per-monster detail is in dev/*-shells-spec.md and dev/rom-map.md.

### 1. Objects, the table and the files

- **A shell is a unit** (uShell..., derived from the unit base; state byte +4: 1 / 2 running, 0xfe ending, 0xff delete). A class per
  monster shell (`uShellEmNNN_sp_KK` / `uShellEmNNN_VV_KK`) derives from a **base** class `uShellEmBaseKK`. The base runs the motion;
  the class adds a reader (its files -> fields), sometimes a landing / end hook, sometimes its own move.
  - (c) DTI names are in the binary as strings; every shell DTI's parent is a uShellEmBase class. The vtable slots below are the
    same in every build I checked inside GU.
- **The global shell table** (GU `0x175c3e8`, 12 B per id: {class DTI, setup DTI, resource id}; 412 ids; `0x19d` unset). The setup
  DTI (`nShell::cSetupParamEmBaseKK`) names the base -- except a derived base takes its parent's setup (Boltreaver's sp_14 setup
  base00 runs base14; rom-map row 792).
  - The resource id names its file: {hash of the lowercase backslash path, type hash}; the lookup is `0x152530` / `0x159daa0`.
  - (c) Find the table by a run of 12-byte rows whose words 0 / 1 are DTI pointers, the second one of a small set (the setup classes).
    efx/agents/narga-shell-scratch/shelltable.json is GU's, dumped.
- **The files** (per shell folder `shell\em\emNNN_VV_shellKK\`): `.shl` (the EffectLists in order -- a mode's EffectParam list id
  indexes THIS list, not the monster's: rom-map trap 103), per mode ShellParam ints / floats / vecs (`sh`), HitParam (`hit`), sound
  (`snd`), EffectParam pairs (listId, key: (999, -1) = none), ShellScale, and the ShellCmnParam shared by all modes (`cmn`), hitdata
  `.hdt` / hitsize.
  - The getters (GU): ShellParam int `0x4a2470`, float `0x4a24f8`, vec `0x4a2584` (returns a POINTER: readers store it), effect
    `0x4a22f0`, HitParam int `0x4a23f4`, sound `0x4a2378`; ShellCmnParam int / float / vec `0x4a2224` / `0x4a2264` / `0x4a22a8`. An index
    past a file's end reads 0 / 0.0 / the zero vector.
  - (c) A reader is a straight run of `mov r1, #i; bl getter; str r0, [r4, #0x15xx]` -- the shape finds every class reader by its
    getter calls. fb/shl.py prints a shell's files mode by mode, its lists in order.
- **Effect requests**: `0x4a10c8` fills the requester, `0x4a11e4(shell, param, rq)` starts it (null list slot or key < 0: nothing).
  Every shell request resolves in the .pel's UNIQUE array (selector 2; rom-map 2239 / 334). Stop: `0x43b058(h, flag)` (0 graceful, 1 at
  once).

### 2. Life of a shell

- **Made**: a maker allocates a setup (`0x3fa2bc` 0x40 base01, `0x3f883c` 0x30 base00, per-base allocators: `0x4164c8` base33 0x10,
  `0x417640` base34, `0x41c110` base38, `0x41d4d8` base39 ...): +4 id, +8 mode, +0xc owner, then the base's fields (+0x10.. point /
  words, +0x20.. point, +0x30.. words, +0x3c the hit group); `0x48b884(mgr, setup, 0, 0)` creates it **and runs its init at once**
  (a shell made inside another's move is inited on this frame and appended to the unit line).
- **Init** vt+0x13c: owner test (`0x43a850`, `0x4a100c` +0x50 bit 0), the reader vt+0x14c, placement, ef 0 started.
- **Step** vt+0x24: handle hygiene (a unit out of states 1 / 2 dropped), state 1 -> the move, 0xfe -> the ending countdown
  ([0x162493c] 30 x 60 frames, or at once with no live handle) -> 0xff.
- **Move**: anchor +0x1000 = +0x40, the flight step `0x539224` (stepFlight), stage queries `0x183490(mgr, A, B, stage, out, attr, mask,
  ...)` (mask 0x10 floor, 0x20 wall), hit / land -> vt+0x150 (base00's landing; a class may override), end vt+0x148(flag).
- **End** vt+0x148(0): handles stopped gracefully, state 0xfe, an end effect maybe; (1) deletes.
- The frame step every move reads: the unit's +0x1c (dt) or the global `[[0x211f764]+0x68]`.
- **After the motion ends** (2026-10-26): shells and effects run on -- they are units on the move line, stepped every frame whatever
  the monster's motion (`0xc044c4`). A viewer that drives its effects from the clip's time must keep stepping them, on the wall clock,
  once a play-once clip has finished, and freeze them only for the user's pause or scrub (index.html animAdvance, `act.userHeld`).
- **Clip frame vs action frame** (2026-10-26): a maker's frame test reads the ACTION's own counters (dt timers, "on the first
  move", `0xb0968` on the motion it set) -- the same thing as the clip frame only while the action plays its motion from 0 at rate 1. An
  action that enters its motion mid-way (Ahtal-Neset's (1, 0x15): L0 M9 from 230.0 at 0.6) or holds it (his (1, 8): rate 0) needs the
  count from the action's start; the viewer keeps both (render/shells.js: clip rows `frame`, action rows `act`; rom-map trap 162).
- (c) In another build: start from one known shell id's class DTI -> its vtable -> slots +0x13c / +0x24 / +0x14c / +0x148 / +0x150;
  the base's code is shared by every class of that base (a slot-for-slot vtable comparison finds the base: rom-map 139).

### 3. The bases built in the viewer (render/shells.js), one line each

GU addresses are init / move (vt+0x13c / vt+0x24) of a class on that base. Where a row holds several bases, they are each base's
init, in order. The spec holds the rest.

| base | what it does | GU init / move | spec |
| --- | --- | --- | --- |
| base00 | the projectile: joint / owner / request point + offset, words, (vy, vz) launch, gravity, flight timer, collide vt+0x168, landing vt+0x150 | `0x3f8b80` / `0x3f96a0` | em004-shell00-spec, rom-map base00 rows |
| base01 | the placed hit / effect at a point (flags: joint, ground snap, ground angles, owner's ground, size), timer or hit-slot life, the 0x20 effect switch | `0x3fa498` / `0x3faec4` | em004-shell01-spec, carapaceon 2 |
| base11 | base01 with a time table of children (sp_01s along a line) | `0x402fd8` / `0x3faec4` | shells-em001.md, elder 1 (Kirin) |
| base51 | base01 + a sweep A -> B over time with a lagging anchor | `0x428bc4` / base01's | elder 3 |
| base02 / base02g | the beam: a ray from a joint, growth, ground cut, impact | `0x3fb9bc` / `0x3fbdc8` | em004-shell02-spec, dev/beams/ |
| base03 / base19 / base15 | ground-follow (slope step); 19 adds size growth / roll; 15 a zigzag on it; base03's target arms (the Gore line's sp_03): a life from the target's distance, a turn toward it each move; base00's request arm (+0x15e8 0x10 / 0x20: the setup's point and words) | `0x3fd9d8` / `0x3f96a0` / `0x3fddcc` | em003, em061, em081 specs; gore-line-shells-spec 1.2 |
| base04 / base05 | breath / held effects (Khezu, Deviljho) | `0x3ff1a0` / `0x400a50` | shells-em043.md |
| base13 | the lob: speed / gravity arc to a target, life, landing | `0x4044d8` / `0x40500c` | shells-em037.md, fanged-beasts |
| base54 / base55 | the bouncing rock / its variant | `0x42aecc` / `0x42c5cc` | shells-em043.md |
| base07 | debris thrown from a point (Bloodbath) | `0x4022a8` / `0x402914` | em007-base07-spec |
| base06 / base31 | Nakarkos's aura / cannon | `0x4014f8` / `0x413ad4` | em084-shell06-aura, em084-shell31-cannon |
| base12 / base26 | bubbles / thunder spiral | `0x403854` / `0x40fbfc` | leviathan-shells-spec |
| base14 / base50 | ground bolt / eased slide (Boltreaver) | `0x405e90` / `0x428078` | em081-shells-spec |
| base16 | the slab (four timed waits, a body registration) | `0x407ef0` / `0x4081e4` | amphibian-shells-spec 1d |
| base18 | the weave (Zinogre) | `0x408980` / `0x3f96a0` | em057-shells-spec |
| base22 / base23 / base24 | Rajang's rock / Kecha's water shot / Rustrum's lump | `0x40af70` / `0x40c9f4` / `0x40dc14` | fanged-beasts, em065_00, em061 |
| base25 | strike marks | `0x40f198` / `0x40f62c` | leviathan-shells-spec |
| base33 | the ground-riding wind (joint point, floor snap, rides 0 / 1 / 2) | `0x416688` / `0x416d30` | elder 4 |
| base34 | the tornado (turn, sway, floor-held travel, growth, periodic children) | `0x417808` / `0x417c8c` | elder 4 |
| base36 | scales that stick and ring (Najarala) | `0x419218` / `0x419990` | snake-wyvern-shells-spec |
| base37 | Seltas's lob | `0x41b1ec` / `0x41bb10` | em069-em076-shells-spec |
| base38 | the wandering tornado (Lehmer draws, leash, floor / wall) | `0x41c2a0` / `0x41c8a8` | elder 4 |
| base39 | the poison cloud: a placed effect with a life, hit capsules, a blow-away on a hunter's hit; kept in an owner ring of three | `0x41d780` / `0x41d988` | elder 5 |
| base20 | a chain of placed effects: the leader makes the next every interval (index + 1) at a turn-table angle round the owner, ends at the count; the others live by their hit slot | `0x40968c` / `0x409d68` | elder 6 |
| base21 | a placed effect that follows a joint for a while, then holds; a leader waits for the owner's action, then ends and makes a child at its anchor | `0x40a318` / `0x40a7bc` | elder 6 |
| base41 | the held-then-flown meteor: two waits with their effects, a velocity and an acceleration (stepFlight), a landing that may hold it; nine named effect handles | `0x41f410` / `0x41fbe8` | elder 7 |
| base30 | the whirlwind: a placed effect on the ground, flown on a velocity re-turned each frame by a yaw rate, a life | `0x413080` / `0x41330c` | elder 8 |
| base42 | the water line: a point carried from A to B over its life, the stream ef aimed from a joint point at it (placed every move), ground-rayed splashes every 3 frames; started on the walker's ACTIVATION (vt+0x18), not in the init | `0x4207e4` / `0x420ac8` / `0x4212b8` | elder 8 |
| base56 | the homing shot: from a joint, aimed at a point (the target or ahead of the owner, offset by its size), a straight flight, a contact effect by surface type, a life from the COMMON file | `0x42dce4` / `0x42e5e8` | elder 9 |
| base40 | the whirlwind | `0x41e3f8` / `0x41e624` | em079-shells-spec |
| base45 / base46 | tail blades / falling spike (Silverwind) | `0x422dc0` / `0x42480c` | em037_04-shells-spec |
| base57 / base60 / base61 | Ahtal-Ka's objects / web anchors | `0x42f070` / `0x435d28` / `0x438838` | em088-shells-props-spec |

### 4. Finding what a monster makes: the census and its blind spots

- **Method** (<archive> fb/; GU tools):
  - `cengen11.py` / `rungen11.py` -- every action x phase of the class's main under unicorn (`trgen.py`: the band native, every call
    outside it stubbed); each frame test answered alone; the landing answered; creates recorded with their setups.
  - `rungen11k.py` -- the same with class bytes poked (block P+.., the class block [e+0xcac0]+..).
  - `emcvar.py` + `chain*.py` -- which actions the command table issues (op 0x92 the variant switch evaluated), closed over the
    set-action calls.
  - `motqx.py` / `phq.py` / `clipphase.py` -- each phase's clip.
  - (c) Portable: the method is "run the action code with the frame / ended / landed tests answered one at a time, and record the
    create call". Find the create (GU `0x48b884`) as the function every maker ends in with (mgr, setup, 0, 0).
- **Blind spots** (rom-map traps; G = general method trap, T = our GU tools' trap):
  - 83 (G) shells made on a timer, not a frame test: grep the band for every id immediate and account for each site.
  - 84 (T) emu_fb flies children to depth 2 unless `treeDepth`.
  - 85 (G) a census with no .dtp reads every break threshold as 0: fill [[e+0x75f0]+0x64].
  - 86 (T) emu_fb stubs the countdown `0x7206c`: `unstub` it.
  - 87 (G) a create behind no frame test, or behind the landing, needs the first pass and `landed` answered.
  - 88 (G) a census line's motion is phase 0's; a later phase's create plays on that phase's clip.
  - 89 (T) a harness shell that tests its owner / area dies unless the owner is made present.
  - 90 (G) a mode's files are the ones its .shl names, not its number.
  - 91 (T) emu_fb writes the sever halfword after `block_bytes`.
  - 102 (G) one class, several monsters: the variant switch decides the actions.
  - 103 (G) a shell's EffectParam list is its .shl's order.
  - 104 (T) the frame-step global is null in emu_fb unless `frameStep`.
  - 105 (T) emu_fb stubs the current-action test `0x6fe88`: `unstub` it for any arm that asks for an action.
  - 106 (T) the module spawns a step after the frame it tests: harness inputs keyed on steps count from there.
  - 107 (T, order INFERRED) a child of the last unit of line 18 has its hit slot counted before its first move.
  - 108 (T) emu_fb passes every `0xb0968` under `win`: name `winFrames` for a helper with two frame tests.
  - 109 (T) a zero setup point in a trgen run may be the owner's point (trgen's owner is at the origin): read the maker.
  - 110 (G / T) an empty census can be the phase byte living elsewhere (Amatsu's e+0x15e1): read the first helper's phase load.
  - 111 (G / T) action chains go through the virtual vt+0x3d0 (uEnemy 0x6c178 = b 0x768c8), some gated on e+0x7420 (the owner machine;
    set offline): a tracer that stubs out-of-band calls sees no chain. Follow the vtable slot before calling an action unissued.
  - 112 (G / T) rage and fatigue gate actions and spawns: a tracer that answers the rage / tired tests 0 hides them; run 0 / 1 of each
    (e.g. Brachydios's enraged (7, 0xa6): 0xf40104 movne / moveq on 0x81670).
  - 113 (G / T) a new unit is ACTIVATED (vt+0x18) before its first move, in the same pass: a shell may start its effect there.
  - 114 (T) a patched check can lose a comparison to a misplaced comment: grep the patched line.
  - 116 (G / T) a shell is deleted when its handles are EMPTY, not when they were told to stop; a module that deletes it in the same
    step loses those stops (the effects run on).
  - 117 (T) a census with the class block [e+0xcac0] zeroed hides creates gated on its fields (Chaotic Gore's footfall dust at
    C+0x84 >= 20000): read a maker's gate and poke the field before calling it unreached.
  - (T) a shell whose init starts nothing (switch-first: the Gore line's sp_01 2 / 5) has no sh.start; schedule.js scaleOf takes the
    first start's requester (sh.scale0) -- it read sh.start.requester and threw (2026-10-19).
  - (G) timer makers: a phase that counts its own clock (P+0x1bc += the step) and makes a shell every n frames is no frame test;
    find it by the id immediate and run the action main every step in the harness (Alatreon's rain and drops).
  - (G) a shell that waits for its OWNER'S NEXT ACTION (Teostra's leaders) only acts when the play goes on: the module must be told
    the action the play stands for (shells.js ctx.ownerAction), and a lone clip shows the wait and the timeout, not the blast.
  - Also (G): makers in class hooks the census does not run -- vt+0x208 per-frame timers, vt+0x204 action starts, vt+0x2a8 event
    lists (Lao), landings of other shells. Grep the id immediates (`mov rX, #id`) and trace each site to its function's vtable slot.

### 5. Proving a shell: the ROM harness

- `fb/emu_fb.py` runs the whole executable on unicorn: the action main at the case's phase (frame window answered), every created shell
  flown from the ROM's own setup bytes for N moves, children included; the stage is one floor plane.
  - Its case options: `owner_bytes` / `block` / `ctl` / `ownvt` / `unstub` / `stubs` / `pokes` / `setupLen` / `treeDepth` /
    `frameStep` / `dtp` / `creatorCopy` / `slot0Until` (a life per 'id:mode', or a list per flight) / `actionAt` (the owner's action
    from a step on).
- `fb/mk*spec.py` -> `fb/mk_plaincheck.py` writes dev/shells-<monster>-check.mjs. The module (render/shells.js) is run on the same
  inputs and compared move by move: position, state, words, starts (list, key, point), children by id and mode.
- **Controls** in every check: a wrong facing, a moved target, a moved floor, the class state flipped (aura / snow / tusks) -- each must
  FAIL, so a pass is not two blind runs agreeing.
- Then the page (run-check.mjs): the clip spawns the shell, the record runs out without a refusal; and a soak
  (dev/effect-live-soak.mjs --viewer-inputs).
- (c) Portable: what makes the harness trustworthy is the controls. A harness that has never failed a deliberate perturbation proves
  nothing.

## E16. Draws, not starts: the draw meter (2026-10-19)

- **(a)** That a record STARTED and was NOT REFUSED doesn't show it puts anything on screen. Raven, 2026-10-19: "at times you've said
  things passed testing but then no effects were present". So every effects claim reports **draws** separately from **starts**.
  - The measure: what the record's requests submit to the draw, and the pixels they light when drawn alone.
  - Three ways a started record can draw nothing:
    1. Its effect builds no generator. The ROM decides this: a row mask that selects no row, a floor-flag row.
       Or its generator spawns particles with a ZERO life: a row whose col2 block (fade-in / hold / fade-out) is 0 / 0 / 0 puts
       each particle straight into the fade-out with a counter of 1 (spawnLife 0xaea108), and the life pass of its own spawn
       frame (0xa60f68 -> 0xaeae40) frees it before the frame is drawn -- the ROM's own run draws nothing too (Nakarkos u 215,
       lane B3; `<archive>/laneB3/gen215.mjs` shows a record's generators and life steps per frame, headless).
    2. It draws, but no mesh shows. The viewer decides this: a texture or model not loaded, a technique not drawn.
    3. It draws off camera, at zero alpha or at zero scale.
  - The primitive layer queues each unit's primitives and emits every batch at its end (merged across units). So a per-request
    draw count has to come from drawing that request ALONE through the whole draw, flush included; counting what each unit's
    draw adds misses every primitive record.
- **(b)** Viewer: render/rom/effect/live.js `METER` / `meterFrame` / `meterPixels` / `meterAimed`; effect-mounts.js
  `__view.effectMeter(on, { every })` and `__view.effectMeterReport()`.
  - Each live request is counted every frame. On its first frame, and every `every`-th frame after, it is redrawn alone:
    `host.drawFrame(its units)` (the draw gate `(+0xc & 0x4807) == 0x4802`, the primitive layer's 0xbad710 / 0xbad790, the GPU
    particle frame).
  - The draws are synced into a private mesh pool and scene. The scene is rendered from the page camera into a cleared mid-grey
    RGBA8 target (so subtractive blends count) and read back. A pixel counts when it differs from the grey by more than 2.
  - When nothing is lit, it is measured once more from a camera 15 m from its own units, looking at them, with the ROM's camera
    block set to that camera.
  - Verdicts: `live, no draw` / `draws, no visible mesh` (with the hidden reasons) / `visible meshes, no lit pixel` /
    `draws off camera (lit when looked at)` / `draws`.
  - Controls (dev/checks/draw-meter.mjs):
    - P: Rathian's L2 M5 fireball lights pixels.
    - N1: with the camera turned away it lights nothing, but does when aimed at.
    - N2: with textures withheld no mesh shows, and the reason is named.
  - The survey: <archive>/metersurvey.mjs (every clip with records on every monster, both runtimes, calm then enraged) and
    msreport.py.
- **(c)** Elsewhere: wherever the engine draws, count what one request's units submit through the whole draw path alone (the
  batching layer's flush included). Then render those draws alone and count the pixels that change against a mid-grey
  background. Keep an off-screen control and a missing-texture control beside a known-visible record.
- **Trap (method):** a recorder's count of one draw kind is not a draw count. The shell sets that logged "0 GPU draws" draw
  through the primitive, CPU-particle and model paths, which that counter never reached (the shells agent, 2026-10-19).
- **Trap (stand-ins): a stand-in parent's zeros are inputs.** An effect can take its speed from its PARENT unit:
  - (b) payload +0x43 → unit +0x2a3. When it is set, the placement 0x31d16c computes the speed as unit+0x2fc × parent+0x50c
    (0x31f980..0x31f9a0).
  - A zero-filled stand-in parent froze those effects on their first frame, while they "started and were not refused"
    (Deviljho's c 30). The stand-ins now set +0x50c = 1.0.
  - (c) Elsewhere: when an effect runs but never advances, look for a multiply by a parent field in the per-frame placement.
    Then give the stand-in the value a live unit holds.

## E17. The ground under the unit: floor-type rows and the floor height (2026-10-20)

- **(a)** An effect can carry one row set per kind of floor; the floor the unit stands on picks the set.
  - A row builds when `(w00 & MASK1) && (w04 & MASK2)`. MASK1 is the request's (payload +0x48). MASK2 is not in the payload: it
    comes from the PARENT unit's floor block, which the unit's ground probe fills every frame from the polygon it stands on.
  - So the same record, on the same clip, can build different rows on different ground. Some build nothing on a plain floor
    at all. Raven approved a control for it (2026-10-19): the viewer's ground is a CHOICE, offered as the classes the ROM's
    tests tell apart, with working labels for him to name.
  - The floor HEIGHT is part of the same answer. A grounded unit is pinned to the floor, so the ground is the unit's own
    height. A clip whose body goes below its origin (a burrow) does NOT lower the ground.
- **(b)** GU:
  - The probe: 0x18154c writes the polygon's flag word to unit +0x1068 and its attribute byte to +0x1066 (the floor block is
    +0x1060). The effect core's 0x42b88 stores `0x41c74(core, parent+0x1060)` to core+0xdc, which is the parameter block's +0x8c.
  - 0x41c74 decides by the flags, first match wins:

    | flags | MASK2 |
    |---|---|
    | & 6 | 0x11, or 5 when [+0x1074] - [+0x1078] > 5.0 (0x41c88, read and lifted 2026-10-20) |
    | & 0x1040 | 9 |
    | & 8 | 0x21 |
    | & 0x800000 | 0x41 |
    | & 0x800 | 0x81 |
    | attribute bit 1 | 0x101 |
    | none of these | 3 |

  - Viewer types G / H (flag 0x2 with the two floats 100 / 0 and 0 / 0) give flag 6's two results. 0x18154c writes +0x1074 = the water height (the highest
    hit flagged 0x1046) and +0x1078 = the hit below the chosen floor. A 0x1004 polygon is never chosen, so the floor's flags show bit 1,
    never bit 2.
  - Class readers of the same block: Tigrex's ctl+0x29 (flags & 6 -> 2, & 0x40 -> 3, else attribute bit 1); Nerscylla's word
    (flag bit 3).
  - Viewer: index.html `GROUND_TYPES` / `setGround` (the Ground select `#monGroundType` in the Animation panel; a change replays the
    clip, because a row set is chosen when the effect starts; `window.__ground`) -> effect-mounts `setEffectFloor` ->
    host.js `setFloor`. It writes +0x1068 / +0x1066 on every parent of every live runtime. bridge.js's 0x18154c stand-in copies
    the same values into the hit block (+6, +8). The shells read `input.floorFlags` / `input.floorAttr`.
  - The height: 0xbf284 pins `P+0x44 = P+0x5b4` in postures 0 / 3 / 4 / 6. The setter 0xbc7f4 does the same on entering 0 / 4
    (0xbc8e4). The move pass 0xae370 keeps a step's vertical part only in postures 1 / 2 / 5 / 6 (mask 0x66). The burrow's depth
    P+0x5c is a DRAW offset (e+0x1384, dev/air-height.md 5.1), not the unit's.
  - Viewer: index.html `monsterFloorY` / `FLOOR_AT_UNIT`: the burrowers' floor is the clip origin on every clip whose posture
    includes 0 / 3 / 4 / 6.
- **(c)** Elsewhere: find the routine that turns the parent's floor block into a mask (the store just before an effect's row
  loop; the 3DS games build the same row gate). Read its arms and offer one ground per arm (an arm that compares other fields of the block -- GU's flag-6 arm
  compares two floats -- gives one ground per result). A flag whose arm is not read is left out and named, because offering it would
  refuse every effect.
  - For the height, find the posture pin: the per-frame call that copies the ground height into the unit's Y. Every
  unit-height test (a shell's "too far above the ground" delete) then measures from the unit, not from the body's lowest bone.
- **Trap:** a "record that never draws" on a plain floor may be a floor-only record. Read its rows' w04 against MASK2 before
  calling it broken. Up to 138 records build nothing on a plain floor in GU (the scan used the payload's MASK1, so 138 is an upper bound) (c 1500 cm200_041 on almost every monster, cm200_067,
  cm202_200, ...).

## E18. A class request's own block (2026-10-20)

- **(a)** A class can request an effect through a control block it fills itself, rather than the enemy's shared requester. The
  block can carry:
  - a root joint override;
  - a position (with or without its scale and type words);
  - an offset.

  Each is a flag bit plus a field. The runtime must honour them, and the recorder must record with them, or the lifted request
  refuses the unrecorded arm.
- **(b)** GU, the requester block (ctor `0x40a54`; the request reads it from +0x10). The fields:

  | flag | field | used by |
  |---|---|---|
  | +0x14 bit 5 | +0x52 the root joint (u16) | Teostra u 2 / u 3 joint 3; Nerscylla's C+0xb5 requests; the Armor Viewer's weapon aura |
  | +0x14 bit 0 | +0x20.. an offset | Nerscylla u 32 on L4 M30 |
  | +0x14 bit 30 | +0x40.. a scale | -- |
  | +0x14 bit 1 | +0x30.. a rotation | -- |
  | +0x1c bit 0 / bits 0-1 | +0xc0.. a position | Nerscylla (bit 0); the shells and the Gore slots (3) |
  | -- | +8 the type | -- |

  - Viewer: proof.js `requester` { position, positionOnly, flags1c, rootJoint, offset, scale, rotationDeg, type8 }. index.html's
    class-timer fire `{ rootJoint }` / `{ joint, offset }` goes to schedule.placeEvent.
  - Recorder: efx/proofunit.py REQUESTER_JSON with the same names.
- **(c)** Elsewhere: at a class's request site, read which fields the class writes into its block before the request call. Then
  record the record with the same block, before trusting a lifted run that never saw those bits.

## E19. Camera-attached records start only in range of the hunter (2026-10-21)

- **(a)** A record whose payload `+0x36` (the placement mode) is 4 is placed on the camera: eye + payload `+0x00` in camera axes,
  every frame. Its payload `+0x58` is a range, checked by the core's vt+0x68 `0x328d9c`:
  - the check: |pt - parent +0x40| (divided by the parent's +0x60 unless payload +0x42) <= range;
  - pt = core vt+0x64 `0x42aac`: the hunter's +0x40, or the camera eye when there is no hunter;
  - out of range, the start waits (`0x3293c0`: core +0x30 = 1) and no unit is made;
  - a running request that goes out of range has its units ended (`0x3295fc`, the path `0x329650..0x3296ec`).
  - MHGU's base01 shells start four of these as their SECOND init effect: Kushala c 33 / 34 / 35 (ranges 600 / 900 / 1200) and
    Teostra c 34 (900). With the hunter outside the range they never make a unit. A start meter that counts running units (E16)
    shows them as never started.
- **(b)** Viewer:
  - host.js `installGameCamera` / `setGameCamera` stand in for the hunter, using the viewer's target 2100 ahead of the monster
    (index.html rockInput). At that distance none of the four is in range.
  - The out-of-range end `0x329650..` was lifted on 2026-10-21 from efx `add_em024_00_c34_range`. vecdrawsched.py HUNTER_PATH moves
    the hunter by frame. Two inner arms are still unrecorded: `0x329678` (a non-running unit's vt+0x48) and `0x3296d0` (a second
    unit's vt+0x88).
- **(c)** Elsewhere: before calling a mode-4 record missing, put the hunter inside its payload `+0x58`. A start that never makes a
  unit is the range test, not the schedule.

## The shells' hunter contact (contact type 2) -- shells agent, 2026-10-22 (READ: <archive> gapM/RESULT.md; rom-map 'Shell infrastructure')

Portable to every MT-framework MH (3U / 4U / FU use the same hit manager shape):
- **Type 2 is a latch, not a callback.** The hit manager's per-frame move 0x16a6ac steps every registered slot (0x168d30), builds
  the shells' attack shapes and each hunter's hurt capsule, and the pair pass 0x16acf0 -> 0x16b6cc writes the first meeting into the
  shell's slot 0 (byte +6 = 2, +0x20 the contact point on the hunter's surface). The shell's own next stage query 0x43ac8c returns
  it as contact type 2 (and runs the stage only with byte +0x15c1, where a stage hit wins). Slot 1 never lands.
- **The attack shape** is the slot's hitsize group (HTS, 0x30 B): j0 1001 a capsule from the shell's position to its anchor; j0 255
  a sphere (code 0) or capsule (1 / 2) at position + rotated (ZXY words) scaled offsets. Codes 4 / 6: the third type, below (READ,
  effects lane, 2026-10-22). j0 1010 is unread.
- **The hunter's capsule** (player vt+0x36c 0x2821e4): the feet's midpoint (joints 16 / 19) to the head (4), each end pulled in 40,
  radius 40. The in-quest pose is not read (the viewer's Solid hunter uses a standing stand-in).
- **Gates:** the slot on (delay out), mask bit 0, one hunter hit per frame, each slot id once per hunter (a 20-entry ring), kinds
  8 / 9 / 0x34 / 0x45 never hit hunters; the contact never ends a shell by itself (its +0x150 decides).
- The viewer: shells.js hunterPass / collide's hunter arm, data docs/render/shell-hitshapes.js, input.hunterBody (the Hunter control).

### The third hit-shape type: hit-size codes 4 / 6, a flat-ended cylinder (effects lane, 2026-10-22; READ + transcribed)

Shared by a monster's attack records and a shell's hit slots (the same hit manager, the same HTS record). Portable: the build and the
test are hit-manager code, not class code, so another MT-framework MH with these codes should run the same routines (find them by
the shape-type byte 3 the builders leave, and the hunter pass's three-way switch on it).
- **Build** (both builders end at `mov sb, #3`, `0x170160`; R = s x the record's radius, s the builder's scale):
  - a joint's (enemy, `0x16ddd0`; table `0x16deac`): code 4 `0x16e89c`, code 6 `0x16ec78`;
  - the unit's / a shell's (j0 255, `0x16dbd4`; table `0x16dbf4`): code 4 `0x16e368` -> `0x16fcbc`, code 6 `0x16e470` -> `0x170058`;
  - P = the frame's point for s x o0 (exactly as codes 0..2 place o0);
  - code 4: the ends P + (0, s x o1.x, 0) and P + (0, s x o1.y, 0), along the WORLD's up; code 6: P + Y x s x o1.x / o1.y, Y the
    frame's row 1 (a joint: enemy vt+0x54 `0xc156c`, its world matrix; a shell / the unit: the angle words' row 1). The X / Z rows'
    factor is a literal 0.0 (`0x16e964` / `0x170238`), so o1.z is unused. Codes 3 / 5 build no shape.
- **Test** (the hunter pass `0x16b6cc`: the shape's type byte, mgr +0x2030: 1 -> `0x167d2c`, 2 -> `0x1676f0`, **3 -> `0x16b88c` ->
  `0x167f70`**): `0x167f70(shape, hunter capsule, out)` -> `0x7dda24` -> `0x7dc9a0(shape, capsule, &info, &t)`, which calls
  `0x806ce4` (the two axes' closest points), `0x7ebfd8` -> `0x80017c` (the hunter's line through the plane across the axis),
  `0x7db964` -> `0x8069d8`, `0x80448c` -> `0x8060ac`, sqrtf `0x13ecc14`. info: point +0x10, normal +0x20, distance +0x30.
  **Meets when the distance <= the capsule's r** (`0x7dda88`, movwls); **out = point + (distance - r) x normal** (`0x7ddadc..`), w 0
  (`0x167fd0`): the point on the hunter's surface toward the cylinder. The solid is a cylinder with FLAT ends (a probe above the
  end meets only within r of the cap).
- **What 0x7dc9a0 does** (its structure; the transcription is the authority): the two axes normalised; their closest points ->
  C on the cylinder's axis and the plane across the axis at C; if the hunter's line crosses that plane inside the disk (|P - C| < R,
  `0x7ebfd8`) the hunter's axis passes THROUGH the cylinder (normal (P - C) / |P - C|, or the world axis X / Y / Z least along the
  cylinder's when P is on the axis, `0x7dd3d0`; the axes are BSS constants at `0x19176e0` / `0x19176f0` / `0x1917700`, written by
  the static initialiser `0x7c4708..0x7c473c` -- a harness must run the initialisers or that branch reads zeros); else beside the
  SIDE (normal from the axis point, point on the surface, distance |d| - R, `0x7dcf0c`); else near an END (the nearer end's disk,
  `0x8069d8`, then the face or the rim through `0x7db964`, `0x7dd320..0x7dd380`).
- **Transcription**: docs/render/hit-type3.js, generated line by line from main.text by `<archive>/t3/arm2js.py` (one statement
  per instruction, its address the label; f32 registers, unfused vmla / vmls, the FPSCR flags apart from the APSR until vmrs).
  Bit-exact against the ROM on 1537 cases (t3diff.py / t3hunt*.py -> t3diff.mjs), including the axis through the cylinder, rims,
  parallel and degenerate axes. The same method transcribes any other float leaf routine: generate, then diff against the ROM on
  an initialised machine. **Trap:** vcmpe writes the FPSCR flags; the APSR changes only at vmrs, so a conditional instruction between
  a vcmpe and its vmrs still sees the PREVIOUS compare (`0x7dd354..0x7dd368` relies on it).

- **Beams (base02, 2026-10-22):** a beam registers ONE slot, slot 0, from hit 0 (0x3fbab0); hit 0 is int 0 of the HitParam FUP its
  mode's ShellInfoList entry names (0x4a23f4) -- NOT the mode number. Its folder is its shell id's shell-table row (0x175c3e8 res ->
  path). beam-types.js now carries both (`folder`, `hit`; gen_beam_types.py emits them). Its hit-size j0 1010 shapes are the segment
  table +0x1594 the hit line fills (base02 0x3fc1c8 / base58 0x4340fc: n copies of the beam between last move's line and this one).
  The beam's query (0x43ac8c) takes slot 0's hunter latch before the stage, as every shell's does.
- **Hit kinds a standing hunter never takes:** 8 / 9 / 0x34 / 0x45 (never hunters), 0xc / 0xd / 0x1e (0x2f5bf0: only a hunter in action
  group 0x80); 0x41 marks the player (0x2a6640) and leaves the shell alone. Codes 4 / 6 are the flat-ended cylinder (hit-type3.js).

## Class threads: the stretched-effect slots (lane B2, 2026-10-25)

Some classes hold effects in numbered SLOTS that their own pass marks active every frame and re-aims between two points it computes
(Ahtal-Ka's vt+0x208 head 0x10b7798, Ahtal-Neset's 0x10a8438). A slot: +0 handle, +4 active (cleared each call), +8 id, +0xc / +0xd
start kind / param, +0x10 start point, +0x20 start offset, +0x30 / +0x31 end kind / param, +0x40 end point, +0x50 end offset, +0x60
the stop byte (1: stop hard, 0: graceful). An active slot with no handle is requested, then stretched the same frame; an inactive one
with a handle is stopped. POINT KINDS (the same numbers in both classes' passes): 1 a joint's position (0xc164c), 2 a joint +
an offset turned by the joint's matrix rows (0xc15a4: p = t + ox row0 + oy row1 + oz row2), 3 a kept point; end 3 = an OBJECT k by its
slot state in the fight object (0x10ae8d0: 3 a free unit's +0x40, 2 the carrier's joint 0x82, 1 its spot, else (0, 0, 0)). The viewer:
render/class-threads.js (rows) and schedule.js stepThreads (starts: a joint number, `{ joint, offset }`, or `{ point }`). Portable: a
port reads the class's own pass for its slot writes; the kinds and the slot layout are the shared request system's.

## Joint -1 is the unit (effects lane A4, 2026-10-26; audit only -- the shipped rule is unchanged, Raven decides)

* A record's joint is `ldrsh [desc+0x72]` (0xffff = -1). Every placement arm of `0x31d16c..0x31f9b0` sends -1 to the parent's +0xb0 (vt+0x54(-1):
  uModel `0x939278`, the enemy's override `0xc156c`, same body), its translation +0xe0, or (no model) +0x40. **+0xb0 is the unit's world matrix**:
  `0x8a53bc` copies +0x40 into the local translation and `0x8a5480` builds +0xb0 from it (rows x scale; a parent's vt+0x54 x local otherwise).
* The spawn-height test's point (`0x328c10` -> core vt+0xac `0x329b7c`): joint -1 is the parent's +0x40 -- no joint getter at all.
* The viewer (live.js unitMatrix / originBone) puts joint -1 at the gid-0 bone (the hips): ~214 game units above the unit at the median over all
  1436 joint -1 clip records (`<archive>/laneA4/joint1/joint1_table.csv`). Measured what-if (joint -1 = the unit): the seven Gammoth / Elderfrost
  records that die at their 300 limit start and draw; nothing loses a start. For a port: take joint -1 from the unit (P+0x40), not a bone.

## Nodes that face the camera (kushwind, 2026-10-27; READ; rom-map "Kushala's wind aura")
* The node update's tail (`0x9bca10`) calls `0x9bca30(owner, node)` when the node's +0x110 bit 12 is set (node init `0xae83c8`: bit 12 =
  node block +4 & 0x30000, bit 13 = block +4 bit 17). It takes the camera of the first viewport the owner draws in (sCamera `*0x211f504`,
  slot +0x54 + 0x1b0 k for owner +0xc bit 16 + k) and turns the NODE: bit 13 -> `0xafb350` aims the node's Z at camera +0x70 (its
  position) with the camera's up +0x50; bit 12 alone -> rows x inverse(the camera's view). Translation kept; the +0x40 copy follows.
* Every emitter spawns through the node's matrix (`0xa59c1c`), so an emitter offset along Z (shape 6: z = base +0x70) goes TOWARD THE
  CAMERA. Data pair it with the model draw's view-ray push (param +0x10c bit 28, +0x110): Kushala's / Amatsu's aura discs emit 500 toward
  the camera and push 500 back -- on the body from every side. Without the turn they sit 600 along world +Z: right from the front only.
* 1055 of the GU export's records hang rows on such nodes (the shared break flashes cm202_060 and state puffs cm200_004 among them). A
  port must run this per node per frame with the GAME camera, before the spawns. A recorder whose camera is identity-rotation at +z
  cannot show its absence.
* The camera's +0x70 (the point the node aims at, and the effects' distance tests measure from) is written every frame by uCamera
  vt+0x28 (`0x895af8`): the eye recovered from the look-at view, -(translation through the view's 3x3). The bit-12-only arm's inverse
  is `0x232e24`, a straight-line single-precision cofactor inverse (identity on a zero determinant); docs/render/rom/effect/rom-inv44.js
  is its line-by-line transcription, bit-exact against the ROM.
