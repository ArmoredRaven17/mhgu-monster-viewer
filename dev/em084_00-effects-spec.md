# Nakarkos (em084_00) -- effects spec (Elder Dragon walk, 2026-10-18)

Class `uEm084_00`. His word was read and transcribed before (dev/em084-psl-mask.md). Scratch: `<archive>/zg/sweepev.py`,
`states060.py`, `scrdump.py`.

## 3. This walk -- R

- **The puff**: vt+0x2a4 the base 0x6bf64, no e+0xb7d2 / P+0x5d04 write (survey): the shared puff runs, always u 1121 (em084_00_120,
  joint 0). RAGE_PUFF.em084_00 added (he was on `_autoOnRage` with no entry).
- **His class u 1121** (rom-map u 1400 sweep rows; tracer `sweepev.py`): the dive actions (6, 0x64) (`0x1073474`, once on P+0x1a2)
  and (6, 0x66) (`0x10739d0`, phase 0, L0 M50) call `0xa499c(e, 1)` -> u 1121, end 0: once at the play's start. L0 M50 copy B
  ((6, 0x64) / (6, 0x66)); A the idle (0, 0) and the many other plays.
- Status 10: (10, 7) / (10, 0x14) -> `0x17f1b90` (L3 M50), (10, 0x72) -> `0x17f1bc0` (wait 32, L3 M50), nothing else (no ailment
  case; no c 1101..1105 in his file). Death (11, 0) -> L3 M63 (`dead`).
- u 1400: closed before (the latch: nothing requests it).

## 4. Named, open

His breaks: .dtp rows exist (parts 0..6) but no break record in his pel; the part pass is the existing work's (dev/em084-*.md) --
not re-read. The 32 tentacle PSL records and c 800 / c 1600 / c 1601 stay as the survey named them.
u 1121 is both his puff (ragePuff) and his class request: the json now carries an `event` twin of the record so `fire` finds it. Check dev/checks/elders.mjs pass. Soak **48 motions, 0 refused**.

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **Nakarkos's 32 tentacle PSL records and c 800 -- no read owed**: both are READ (elder survey; dev/em084-class-effects.md 3:
  c 800 x3 on L3 M65 at tune vecs 1..3 x size, yaw-turned). What remains is building: the arm as an effect parent (board PHASE 3,
  the Render lane) and c 800's export, recording (the efx slot) and a placed row. Listed for the coordinator, not a b read.

## Tentacle PSL, built (2026-10-19)

* **Each arm on its own effect runtime.** In the game each arm is a unit of its own class (uEmOstgaloaArm, vtable 0x17f6498). Its
  PSL walker reads its own motion and frame on its own lists (em084_00_l_N / r_N), and its enable word is its class's: 0x107f0e4,
  transcribed as psl-mask.js `armMask084` / `armPlay084` and emulated with every call native (`<archive>/zg/jscheckarm.py`:
  5602 runs, 0 mismatches; the control mismatches). Its records come from its own pels and hang from its joints.
  * Built: docs/effects/em084_00_left.json / _right.json (32 records each, `<archive>/zg/arm_export.py`), and CLIP_EFFECTS
    em084_00_left (72 motions) / _right (69), keyed `'Ll_2 Motion[1]'`.
  * One runtime per arm (render/rom/effect-mounts.js `attachSideEffects`). Its root is the arm's mounted model, and its unit is
    the frame the arm hangs on (attachFrame: body joint 200 / 203).
  * index.html `driveArmEffects` feeds it the arm's clip as playAttached plays it (a.fxList / a.fxClip), at the arm's own time.
    The mask is the arm word over the play's body action and the arm's own action (ARM084_PLAYS, in turn per play) and the arm's
    form.
  * INFERRED: rage / tired are the body's. The word reads them through the arm's own P; the arm's bytes are not read.
* **Check:** dev/checks/em084_00.mjs, 17 items:
  * both runtimes come up on the arms' models, each unit a matrix;
  * l_2 M1: u 10 at f114 and u 130 at f105, on the left runtime only; u 201 (bit 18) stays off under (7, 0x9a);
  * l_2 M5: u 200 on, u 201 off;
  * a step back clears the arm's requests;
  * effects off, effects on, and a monster change drop and remake the runtimes.
* **Soak:** `<archive>/armsoak.mjs`, every body and arm clip (254) on the page's own loop: **0 refused**, 698 arm starts.
* **A step back is an open gap -- the body's too, and in HEAD.** clearClipEffects hard-releases the running generators. An
  em084_00_050 / _007 record alive (u 135 holds through every idle) takes the destructor 0xa55ea8's +0xb8 != 0 case, 0xa55f20,
  which no recording has; the host is dead after the throw.
  * The arms take it as a named refusal: index.html seekTo drops that runtime and driveArmEffects makes it again.
  * **The body's own step back still throws** (L0 M2 at f60, seen with the arms' clears held off).
  * The fix is a recording of that path (efx slot); rom-map trap 115.

## c 800, built and held off (2026-10-19)

* **Read whole:** the requester 0x106eff4..0x106f214, the stop 0x10698d0, and the second end 0x1069d88..0x1069dc0. The rows are in
  rom-map under "Effects open items".
  * Three requests of c 1001 (= c 800). Each goes through its own control block: point P+0x40.. + (x cos + z sin, y,
    z cos - x sin) x size; tune vecs 1..3 (430, 250, 1350) / (420, 280, 1200) / (410, 310, 1050); scale vec 4 (1.8, 2.3, 1.8);
    +0x14 |= 0x40000000, +0x1c |= 3, +8 = 3, +0xc the area byte.
  * Stopped (0x329c40(h, 0), handles zeroed, latch cleared) at every action start, **and on L3 M66 as it crosses f172** (tune
    float 0x27). This corrects em084-class-effects.md 3's "through M66".
* **Built:**
  * Exported `em084_00c 800 UNIQUE @event` (efl em084_00_200).
  * schedule.js `placeEvent` (requesters) and live.js `placeEvent`.
  * index.html `stepC800`: a latch per play; at the next play, `holdEvent` off. A clip pick is its own play in the viewer, so c 800
    runs while L3 M65 plays.
  * The check (dev/checks/em084_00.mjs) matched the three points and the block bit for bit.
* **Held off:** `C800.on = false`. Its effect refuses at **unverified 0xaf6734 in L_af63c4** on its first frames, and a refusal stops
  every Nakarkos effect. It goes on once the efx recorder has an em084_00c 800 set and the lift carries it. The check's c 800 block
  runs when `__view.c800()` is true.
* Not drawn: the two scene objects 0x106af68 enables (E+0x262a0 / +0x262a4, 0xc44c70), not read.

## Recorded and on (efx slot, 2026-10-19)

* **The step back:** a new recorder notice, vecdrawsched.py `<frame>:release:<n>`, is the viewer's releaseRequest. It takes the
  core and its effects off the passes and destroys them (vt+4).
  * Sets: add_em084_00_c135_rel60 (the body's u 135), add_em084_00_c135l_rel60 (the arm's u 135), add_em084_00_c130l_rel8 and
    add_em084_00_c130l_rel45 (the arm's u 130, mid-emission and after its bit is off).
  * Lifted: 0xa55f20 is in lifted-proof.js. A step back with u 135 running is clean on the body and both arms (the check: no
    throw, no runtime dropped, the requests cleared, u 135 back).
  * 0xa55eec ([r5] != 0) is still unrecorded; the arms keep the named drop for it.
* **c 800:** sets add_em084_00_c800 / _stop / _near.
  * Two --grow rounds: 0xaf6ac0 (called from 0xaf6740), then 0x13b7264 (a game matrix routine, from 0xaf6fa4). Each went onto
    lifted-added.js's line, the sets were recorded again, and a lift followed. The earlier sets are in
    <archive>/zg/sets_c800_r1 / _r2.
  * **C800.on = true.** dev/checks/em084_00.mjs passes 26/26: three requests at the ROM's points and block, held across the
    loop with no refusal, stopped at the next play.

* **Draw meter (2026-10-19):** 73 of 74 records draw (the body, 34; each arm, 20). u 220 (L3 M63) draws at its payload's absolute point (5000, 50000, 5000), space 2, off camera -- the ROM's data.
