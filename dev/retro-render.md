# Why we keep missing effects — the render leg's account

Written 2026-09-30 by the render (on-screen) leg, from this session's work. Nothing here is new
investigation. Numbers and addresses are from measurements made on em001_00 Rathian on 2026-09-29.

The short version: **every leg but this one measures the DATA, and "correct" is only defined on the
screen.** An effect can be exported, wired, driven, reachable and still be in the wrong place, at the
wrong time, or never asked for. The three accounting words we use — exported, driven, wired — say
nothing about what is drawn, and for most of this effort nobody was looking.


## 1. What the screen found that the accounting did not

Six cases on Rathian. In each, the other legs' number was not wrong about what it measured; it was
answering a different question from the one we needed answered.

**1.1 Placement: "wired" is not "in the right place."** Effects' coverage oracle is built on "does the
record fire". Sixteen of Rathian's wired records fired and drew in the wrong place (the gate at
`0x31f6b4`), and no coverage count could see it. The screen splits them cleanly: `c 30` (mode 0/1) and
`u 1120` / `u 1121` (mode 0/0) hold gap 0.0 to their joint through 8091 units of joint travel;
`c 2`, `c 3`, `c 4`, `c 6` (all mode 1/1) spawn on their joint and then hold still in world space, the
gap growing by exactly the joint's travel (`c 3`: 38 → 1071 while joint 80 moved 1071). Effects' later
ROM read confirmed the same line from the other side — mode → compose state at `0x329d88`, per-frame
recompose skipped for state ≥ 2 at `0x327238`–`0x327240`. Two independent readings, one from memory and
one from the screen, agreeing. That is what a sign-off should look like.

**1.2 A test that could not fail.** Effects' first placement proof used `u 900` (joint 144), `u 1302`
(joint 200) and `u 1303` (joint 9) and reported it exact under a 90° yaw and scale 1.4. All three have
offset `(0,0,0)`, which is invariant under any rotation or scale. The proof could not have failed and
therefore proved only that the anchor lands on its joint. `c 1104` at `(0,-10,60)` was the first record
on the monster that actually exercises the transform: its offset is constant in JOINT space across 8
spawns while the world delta varies as the head turns 7–20°. That is the on-screen certification of the
`0x31f6b4` fix, and it exists only because someone went looking for a record with a non-zero offset.

**1.3 The origin was the wrong one, and a bogus constant came out of it.** `u 260` (joint 1, state 1,
authored offset `(0,0,200)`) measured from the joint gives |d| = 176 and joint-space Z = 155 — which I
explained as a 0.88 linear scale on joint 1, and Effects accepted. Measured from the parent UNIT, the
delta's Z is 190–200: the authored value, no correction needed. The 0.88 was an artefact of measuring
from the wrong origin. A reading that needs a fudge factor to work is usually measuring the wrong thing;
we both let it stand for several exchanges because it was self-consistent.

**1.4 Static reachability undercounts shells by a whole generation.** Effects' rebuilt `driven-split`
concluded ten of Rathian's thirteen shell records were undriven, by enumerating the modes the actions in
`SHELL_DATA.em001_00` name. The screen shows six of those ten firing: `u 31@114`, `u 32@168`, `u 33@150`,
`u 34@138`, `c 3@108` on L4 Motion[16], `u 61@72`, `u 62@78` on L4 Motion[65], with 6–8 shells live and
1231 visible draws. The two actions on Motion[16] are both **shell00 mode 8**, and that one action
produced records the table lists as shell01 modes 6/9/8/7 — a spawned shell spawns further shells from
its landing (the `LANDING` map). An enumeration over action modes cannot see the second generation. I
disagree with that conclusion and the disagreement is settled by frames, not by argument.

**1.5 One clip, four records, one per play.** `motion-states.js` `rathLine()` puts `u 1000`, `u 1005`,
`u 1010` and `c 1109` on a CYCLE attached to L3 Motion[2]: each play fires the next. A sweep that plays
every clip once sees `u 1000` and reports the other three as not firing. Four plays give
`u 1000@6`, `u 1005@3`, `u 1010@2`, `c 1109@1`. Nothing in the accounting distinguishes "one record per
clip" from "four records taking turns on one clip".

**1.6 The reverse case.** `u 36` was counted driven and never fires, because it is ef param 3 of shell00
mode 8 — the landing for a hit on a hunter, which the viewer never selects. Here the screen agreed with
"undriven" against the tally. Both directions of error are live at once.


## 2. My own instrument faults

Six in one day, on one monster. Grouped by cause:

**Measuring before the measured thing exists.** (1) The draw audit read `host.modelDraws` inside
`drawFrame`, which runs before `live.js` `syncModels` attaches `d.mesh` — so every draw reported as
synced-but-never-visible. Caught only by comparing against a screenshot that plainly showed dust.

**Hooking the layer that does not carry the traffic.** (2) I hooked `schedule.start`. Shell-carried
effects never pass through it: `stepShells` calls `host.requestEffect` directly. Seven records read as
"never fires".

**Wall time is not animation time.** (3) Per-clip budgets and `duration × passes` both under-play a clip
because headless renders slower than realtime. Motion[16] reached frame 156 of 243 and Motion[65] 96 of
225, so `u 231`, `u 232`, `u 350`, `u 511` and `u 32` all read as never firing. All five fire.

**Concurrency.** (4) Node buffers stdout to a redirected file and flushes on exit, so a working sweep
looked hung. I attached a second CDP driver and swept the same page while the first sweep was running;
the one runtime death observed in that window (`0xb911d8`) was reported as a finding and withdrawn — it
does not reproduce with one driver across 162 clips.

**No assertion of preconditions.** (5) The monster picker's type loop outran the list repopulating,
`monSel.value = 'em001_02'` silently failed, and a sweep ran fifteen minutes against Rathian while
labelled Gold. (6) Cycles played once instead of through.

**Which of these produce plausible wrong data rather than a visible gap: all six.** Not one of them
throws, and every one produces a clean-looking table. (2) is the worst: it was reported, recorded, and
became the premise of another agent's static tool inside one message — a retraction chased it but the
number had already moved. (5) is the most dangerous in principle, because its output would have been
filed under the wrong monster's name and nothing downstream could tell.

**What a sweep must assert before its output means anything:**
- the monster it is on, checked at entry and re-checked per list (`state.id`), and named in the output;
- a hook every path goes through (`host.requestEffect`, not `schedule.start`);
- the walker's own frame range per clip, and specifically that each record's site frame was visited —
  "did not fire" is only a finding if the frame was reached;
- cycles played through, with the cycle length known from `motion-states.js`, not guessed;
- states driven explicitly and named in the output (rage, tired, the shared-state toggles) rather than
  inherited from whatever the previous clip left set;
- `failed === null` after every clip — `live.js` `fail()` stops the whole set at the first refusal, and a
  dead runtime reports zeros that look exactly like "nothing fires here";
- one driver per page;
- draws counted after the sync, not before;
- the denominator computed from the file the runtime loads, never adopted from another agent's tally.


## 3. What the architecture makes hard, and what cannot be seen at all

**The viewer fires effects from CLIPS; the game fires them from ACTIONS.** An action picks a motion, and
carries state the motion does not: which hit type, which part, which AI branch. The viewer has motions
only. Every record selected by an action's state rather than by its motion is unreachable by
construction — `u 36` (ef param 3, hit type 2) is the clean example. This is also why the notice marks
and the turn direction are both stuck on the same missing EMC action mapping: it is one gap, not three.

**No hunter.** Targets, hits and AI choices do not exist. `rockInput()` is a labelled stand-in for three
of them. Any effect whose condition is "a hunter did something" cannot be driven.

**Second-generation shells.** A record can be reached only through a shell that another shell spawned on
landing. Nothing static over the action table finds those; only playing the clip does.

**Per-record draw attribution is not available.** Draws are pushed per effect unit inside one loop in
`host.drawFrame`, and from outside the host a `modelDraw` cannot be traced back to the record that
produced it. So the leg can answer "did anything draw while this record was live", not "did THIS record
draw". Every draw statement I have made is bounded by that.

**The unit never yaws — so a whole class of placement question is untestable today.** `live.js`
`writeJoints` hands the effect host the unit's pose through `setParentPose`; the op-`0x0a` turns apply to
the `reference` node inside the proxy and never reach that matrix, so `unitMatrix()` always reads yaw 0.
World space and unit space are therefore the same basis in every measurement I can make, and
"placed by the unit's rotation" cannot be separated from "not rotated at all". Rathian's only op-`0x0a`
turns are on L3 Motion[15]/[28] and `u 260` fires on L1/L2, so no clip has both.

**Colour and correctness of appearance.** I can count visible meshes, blend, depth and render order. I
cannot say an effect looks right. A black albedo, a wrong constant, a missing filter pass and a correct
draw all count as "visible".


## 4. The same pattern in the earlier render-side work

Every one of these was found by Raven looking at the screen, after the agent had signed it off:

- **The turn feature was invisible for its whole first life.** `pose.step` poses bones by world matrix,
  so any transform on the monster group is divided straight back out. The feature was complete, the
  numbers moved, and nothing on screen turned. "Wired is not correct", exactly as with effects.
- **A measurement that compared a thing to a copy of itself.** I reported the proxy's rotation as working
  by reading gid-0's yaw off the same object I had just written. Structurally identical to Effects'
  `(0,0,0)` placement proof: a test that cannot fail.
- **Statistics that change between runs.** A PCA axis is a line with no direction and flips ±180°; a
  re-picked bone pair gave 0° one run and 80° the next. Either will confirm whatever you already believe.
- **Five successive rules for "what a turn looks like"**, each fitted to one monster and corrected by
  Raven against the next. The roster is heterogeneous; a rule derived from one monster is a hypothesis,
  not a finding ([[no-list-motion-assumptions-across-monsters]]).
- **Valstrax, Alatreon, Thunderlord, Seltas Queen** sit on the board as open render items precisely
  because they were signed on the mechanism and not on the appearance.

The common shape: **the agent that built a thing certified it, using a measurement derived from the same
model it built the thing from.** That is not a check; it is a restatement.


## 5. How the work was organised

**Two legs measure data, one leg looks at the screen, and the screen leg was added last.** EMC reads the
ROM, Effects reads the records; both produce counts. The only place "correct" is defined had one agent
on it, starting seven monsters behind, and the two data legs had already signed six of those seven.

**Conclusions crossed lanes without their evidence.** My wrong "8 shell records never fire" became the
premise of Effects' rebuilt reachability tool inside one message. The retraction had to chase it. The
status table records verdicts; it does not record what measurement produced them, so a correction cannot
propagate automatically — someone has to notice.

**The shared words are not shared.** "Wired" means exported to one leg, driven to another, drawn to me.
Rathian's split was quoted as 74/54/20, 74/53/21, 74/51/23 and 74/44/30 within a few hours, all correct
under their own definitions. No accounting can be checked against another until the word is fixed.

**Going down the list monster by monster re-finds the same class of fault per monster.** The instrument
faults above are not Rathian facts; they would have recurred on every one of the 94.

**The PM's part, directly.** The PM asked for a per-monster number ("seen / not seen, one line each")
before the instrument that produces it had been shown to be trustworthy, and that is the direct cause of
the worst propagation: I reported shell records as never firing because I was asked for a count, and the
count was recorded. Asking for one line per monster pushes toward a verdict when what the walk needs is
an evidence record. Relaying each leg's numbers to the others is useful, but relaying a conclusion
without its measurement is how 1.4 happened. Against that, two PM interventions were the most valuable
things anyone did today: refusing "the viewer agrees with its own decode" as a sign-off and demanding the
ROM address, which is what produced the `0x329d88` / `0x327238` read; and insisting on a coverage count
per monster, which is what exposed the cycle, the shells and `u 36` at all.


## 6. What to change, in priority order

**1. Run the on-screen sweep FIRST, on all 94, before any decode.** It is cheap relative to a ROM read
and it defines the target. Every decode question this session answered was raised by something seen on
screen. Doing it first also means the decode legs work on records that are known to reach the screen.

**2. Make it fast and deterministic, which is one change.** Today the runtime's clock is animation time
(`live.js` `advance`) and I drive it by playing in wall time, which is why frames get missed and why a
monster takes 10–15 minutes. Instead the harness should step the mixer in fixed increments and force a
render per step: every frame visited exactly once, no clip under-played, a clip costing its frame count
rather than its duration. That single change removes the whole "frame never reached" fault class and
brings 94 monsters into range. It needs nothing from the ROM side.

**3. Tag each draw with the unit that produced it** — record `modelDraws.length` before and after each
`drawEffect` inside `host.drawFrame`. Ten lines, and "did this record draw" becomes answerable per
record instead of per clip. Without it the render leg can never certify more than "something drew".

**4. Fix the denominator once.** One definition, computed from `docs/effects/<id>.json` (what the runtime
loads), with the layer split, published in one place. No leg reports a number derived from another leg's
number.

**5. Put the evidence in the table, not the verdict.** Record the clip, the frame, and the hook alongside
every "fires". A retraction then propagates because the table holds a measurement.

**6. Give the unit a yaw.** Either route the op-`0x0a` turn into the pose handed to `setParentPose`, or
add a debug control that yaws the unit, so rotation-dependent placement is testable at all.

**7. Drive states that only exist as clip cycles today** — part breaks, sever, tired, hyper — from
controls rather than from having to know which clip carries which cycle.

**8. Stop signing off on the mechanism.** The agent that built a thing should not be the one to certify
it, and a certification whose test cannot fail is not a certification. Both of today's placement proofs —
mine on the turn, Effects' on `(0,0,0)` records — failed that test in the same way.
