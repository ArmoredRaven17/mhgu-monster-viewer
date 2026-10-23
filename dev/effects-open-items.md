# Effects open items -- one table (Fanged-Wyvern / effects lane, 2026-10-19)

Every item marked "named", "not shown", "NOT READ" / NR, "INFERRED" / I or "stand-in" in the effects specs
(`dev/*effects-spec*.md`) and in the 2026-10-18 rom-map rows, in walk order (dev/effects-walk-order.md). Extraction:
`grep -i -E "not shown|NOT READ|INFERRED|stand-in|named|NR"` over the specs (243 lines, 44 specs) plus each spec's own
"NOT READ, by name" / "Named, open" paragraph; read and de-duplicated by hand.

Categories (the coordinator's, 2026-10-19):

* **a** -- needs hunter / quest / stage / map / net / RNG data the viewer does not have. A legitimate named refusal.
* **b** -- readable now. This lane's; read in walk order, closed with a rom-map row and a spec line the same turn.
* **c** -- buildable as a control the ROM supports (as Boulder / Invisible). Listed for Raven; not built without his call.
* **v** -- not a ROM item: what a record looks like (Raven's eye) or what an author meant (no instruction to read).
* **S** -- the shells agent's (listed, not worked here).

Status: **open**, **CLOSED date** (the row and the spec line named), or **superseded** (a later section of the same spec
already closed it; kept so a reader of the old line finds the answer).

## 1. Cross-monster items (one row, many specs)

| # | Monsters | Item | Why open | Cat | Status |
|---|---|---|---|---|---|
| X1 | em004 em005 em033 em038 em043 em044 em045 em060 em063 | `state.sunk` -- P+0x5c (depth) against `0.9 x MoguriBaseOfs` at the start of a burrow-clip play (`0x81d6c`) | the viewer passes `false`; the depth at a play's start is the previous burrow's, a runtime position | c | open: a "Begins burrowed" toggle per burrowing monster is what the ROM's test supports (trap 99: never in the transcription) |
| X2 | em009 em044 em045 em081(S) | the `0x3a8430` byte (the viewer's 5 = "G") | a quest / rank byte of the quest object | a | open, named |
| X3 | em003 em009 | `e+0x1409` bit 6 -- op 0x1c's "not enraged" override (`0x81688` answers calm) | writer not read | b | CLOSED 2026-10-19 (set `0xc983c`: the rage timer's end; cleared only at spawn, `0xb8bf4`) |
| X4 | em057 em046(S) em070(S) leviathan(S) temnoceran(S) | `e+0x73e8`, the action setter's random draw | runtime RNG | a | open, named (stand-in 0 / "each play the next") |
| X5 | em008 em009 em038 em080 | PSL bits the data names and the class never enables (L2 M12 18/21/22/24/25, L1 M104 b24, L9 M15 b23) | no consumer: the negative is READ (word emulated); what the author meant is not in the ROM | v | -- |
| X6 | all | "what c / u N look like" lines | visuals | v | Raven's |
| X7 | em013 (c 1103), every monster | the shared per-frame stun / flash request `0xa3ef0`: P+0x5e08 bit 4, P+0x5cde == 1, P+0x59c > 0 -- which ailment sets each | writers not read | b | CLOSED 2026-10-19 (bit 4 the stun family; P+0x5cde small monsters only; P+0x59c the flash timer -> a) |
| X8 | em024 em027 | P+0x5e08 bit 1 (Kushala's wind / Teostra's aura held off while set) | writer not read | b | CLOSED 2026-10-19 (bit 1 = poison: `0xa4518` requests c 1100 on it) -> c: a "Poisoned" toggle |

## 2. Per monster, walk order

| # | Monster | Item | Why open | Cat | Status |
|---|---|---|---|---|---|
| 1 | em001 Rathian | `0x3b8eb4` / `0x3b519c`, the quest number (the <= 5 arm) | quest data | a | open, named |
| 2 | em001 | `e+0xb5f0` holds exactly the ids states-em001.md lists | the writer's id list not read here | b | CLOSED 2026-10-19 (`0x6fa58`) |
| 3 | em001 em002 | who issues (7, 0xf5) | no EMC stream found; code-side issuer not scanned | b | superseded (rom-map `0xcf15c8` sel 0xe: g1 s224 / s235) |
| 4 | em001 em002 | an enraged-AND-tired start: `0x81614` is P+0x505 alone; the viewer's `tired` is `!rage && ...` | viewer state shape | c | open: a Tired toggle independent of Rage |
| 5 | em002 Rathalos | who issues L0 M16 / M17's (1, 7) / (1, 8) | issuer not scanned (no record rides them) | b | CLOSED 2026-10-19 (`0xceebe4..`) |
| 6 | em002 | Dreadking's quest numbers (`questLevel`, the <= 5 arm, u 522 / 523) | quest data | a | open, named |
| 7 | em003 Khezu | stream that reaches (7, 0x30 / 0x3b / 0x44 / 0x48 / 0x49), (3, 0x43) | emcfind: none in em003_00_cmdtbl; code-side issuer NR | b | CLOSED 2026-10-19 ((7, 0x48 / 0x49) follows; (7, 0x30) / (3, 0x43) area points -> a; (7, 0x3b) named) |
| 8 | em003 | which landing (L2 M5 / L2 M39) a jump takes | the physics (terrain), no mode test between (I) | a | open, named |
| 9 | em005 Gravios | `0x6feb8` called with a key the pel lacks ((7, 5 / 0xf / 0x15 / 0x10) at f216) | callee's missing-key path not read | b | CLOSED 2026-10-19 (`0x326010`: nothing made) |
| 10 | em005 | which L0 M7 play starts sunk | X1 | c | X1 |
| 11 | em005 | the requester of u 150 (`em005_00_000`, UNIQUE, not a vt+0x1d0 site) | a shell-layer record | S | shells lane |
| 12 | em005 em023 em042 | (13, 1) / (13, 0) / (13, 5) issuers | status 13 is entered from outside the class (rom-map 0xdec968: nothing issues (13, 0)) | a | open, named (quest / demo entry) |
| 13 | em007 Diablos | which event-group-7 stream the engine starts per variant; op 0x20's semantics (I) | EMC dispatch not read | b | CLOSED 2026-10-19 (`0x7fba0` / `0xd32a00`: Bloodbath only; op 0x20 / 0x14 READ) |
| 14 | em007 | who issues (6, 2) at variant 0; which action reaches `0xd3c4a0` | issuer not scanned | b | CLOSED 2026-10-19 ((6, 2) unreachable, named; `0xd3c4a0` = (6, 0xf..0x2c)) |
| 15 | em007 | op-0x6f selector 0x17's field ctl+0x68 (gates g1 s103) | moot at variant 0; not read | b | CLOSED 2026-10-19 (ctl+0x68: (7, 0xb4..0xb8) timer) |
| 16 | em032 Tigrex | which teardown route empties c 25's unit in the viewer; which gate of `0x9b75e8` u 241's hold-80 exits on | needs a viewer trace | b | superseded (spec 2.5, 2026-10-14) |
| 17 | em033 Akantor | P+0x5c at L0 M2's start | X1 | c | X1 |
| 18 | em033 | the update order deciding whether c 1105 fires once for him | order of vt+0x208 vs the shared 0xa3ef0 not read | b | CLOSED 2026-10-19 (sUnit `0xc04728`: +0x24 before +0x28 -> no c 1105) |
| 19 | em033 | the `+0x1404` / `+0x1408` latch setters (u 1400) | writers not read | b | superseded (rom-map latch rows, 2026-10-17) |
| 20 | em033 | `0x18154c` (the stage ray) stand-in, u 605 | stage core | a | open, named |
| 21 | em042 Barioth | the e+0x7420 writer's arm for this class (the G remap's gate) | I from em057's reading (`0xb99c8`, READ there) | b | CLOSED 2026-10-19 (all writers shared) |
| 22 | em042 | (1, 0x0e) for L0 M4; g0 s0 / g13 s0 as behaviours | NR | b | CLOSED 2026-10-19 ((1, 0x0e) g13 s0; g13's starter NR) |
| 23 | em077 Seregios | `[e+0x1c]` as the frame step (I) | consumer not read | b | CLOSED 2026-10-19 (`0xc044c4`: frame step x line rate) |
| 24 | em077 | L1 M1 / M2 / M12 / M13, action (4, 0x15) silencing two | NR | b | CLOSED 2026-10-19 (aerial turns, table `0x16a190c`) |
| 25 | em077 | who issues (7, 0x3e) | nothing found (no control run) | b | CLOSED 2026-10-19 (named, controlled) |
| 26 | em077 | the part pass's set 24 / 28 on the sever bit (I from the note) | NR | b | CLOSED 2026-10-19 (`0xfdf7b4..`) |
| 27 | em077 | shells 0x13d / 0x13e and c 31 | shell records | S | shells lane |
| 28 | em043 Deviljho | who issues (6, 3); P+0x5c MoguriBaseOfs at every start (I) | issuer NR; X1 | b / c | CLOSED 2026-10-19 ((6, 3) named, controlled) |
| 29 | em043 | Deviljho's MoguriBaseOfs value | .dtb value not read | b | CLOSED 2026-10-19 (-2000) |
| 30 | em043 | the end of his dive (6, 0) / (6, 6) L0 M33 | vt+0x3e8 not read for him | b | CLOSED 2026-10-19 (`0xe76e7c`; (6, 6) -> (11, 0x26)) |
| 31 | em043 | which action reaches turn table `0x169e568` (fn `0xe75f04`) | NR | b | CLOSED 2026-10-19 ((2, 0x15)) |
| 32 | em043 em044 em018 | the status-10 / 11 scripts' plays (`0x17c08f0` / `0x17c0bd0`; Barroth's recoveries; Garuga's arm motions) | states notes' readings stand, not re-read | b | CLOSED 2026-10-19 (scrcensus.py: the scripts by action; no row changes) |
| 33 | em044 Barroth | whether a surface action can precede a burrowed L0 M6 / M13 / turn (I: none) | g1 s14's arms not read through | b | CLOSED 2026-10-19 (op 0x69 has no test) |
| 34 | em044 | which action plays L2 M13 (site `0xe89da4`) | NR | b | CLOSED 2026-10-19 ((7, 0 / 3 / 0xe / 0xf) phase 1) |
| 35 | em045 Uragaan | `vt+0x3e8` (`0x75330`) between status-6 steps beyond the EMC chain | NR | b | superseded (rom-map `0x75330`) |
| 36 | em045 em055 | command-table groups 5 / 8 / 13 (the (1, 0) / (1, 0xc) / (1, 2) issuers); op 0x69; op 0x6f's case layout (I by 0x92's) | NR | b | CLOSED 2026-10-19 (op 0x69 / op 0x6f READ; group 12 = the area move (a), 18 an EMC op, 8 / 13 never started) |
| 37 | em055 Duramboros | the (10, 0xe / 0x44 / 0x45 / 0xa7 / 0xbb / 0xbc) reactions sharing the stun clips | which hit reaction each is: NR | b | CLOSED 2026-10-19 (no c 1103 on them; names not in the ROM -> v) |
| 38 | em063 Brachydios | the motion each of the 39 `0xf4653c` spending sites sits under | NR | b | partly CLOSED 2026-10-19 (14 of 45 sites by action; the rest behind stubbed gates) |
| 39 | em063 | who calls vt+0x3c8 (`0xf46898`, refill / gauge 0) | negative without a positive control | b | CLOSED 2026-10-19 (no caller, controlled) |
| 40 | em063 | `0x13ecbfc`'s import name (memclr by signature, I) | sdk import table not read | b | CLOSED 2026-10-19 (`__aeabi_memclr8`) |
| 41 | em063 | the EMC streams issuing the L2 M41 / M42 actions | NR | b | CLOSED 2026-10-19 (the streams; (7, 0x15 / 0x98 / 0xa2 / 0xa6) named) |
| 42 | em080 Glavenus | the dark state P+0x1bb as a viewer input (stand-in 0) | the state is the monster's (writers `0xffe438..0xffe718`) | c | open: a "Tail state" select the ROM's P+0x1bb values support |
| 43 | em080 | the writers `0xffe438..0xffe718` of P+0x1bb site by site | the decode notes' tables used | b | CLOSED 2026-10-19 (site by site) |
| 44 | em008 Kut-Ku | what issues (7, 0xe) | no op 00 names it | b | CLOSED 2026-10-19 (named, controlled) |
| 45 | em009 Gypceros | op 0x80's condition in g1 s4-s6 (`0xc9a9c` / `0x8df40`) | NR | b | CLOSED 2026-10-19 (op 0x80 has no test) |
| 46 | em018 Garuga | op 0x6e query 0x47 (the gate on (7, 0xe4)'s stream, g1 s71) | NR | b | CLOSED 2026-10-19 (a no-repeat gate on e+0x73b2) |
| 47 | em018 | whether u 290's f5-90 run fires when the motion starts at frame 18 | the setMotion start frame vs the walker | b | CLOSED 2026-10-19 (fires at frame 18) -> c: a start-frame field |
| 48 | em079 Malfestio | the AI's stream choice beyond op 0x92 (op 0x14 a call: I) | NR | b | partly CLOSED 2026-10-19 (op 0x14 / 0x6f / 0x92 READ; the rest walked both ways) |
| 49 | em079 | `0xff26fc(e, 3)` on (7, 0xcc / 0xcd) | a shell request | S | em079-shells-spec.md |
| 50 | em079 | `0xff27cc(e, 0)` with handle e+0xcb4c before L1 M27 | NR | b | superseded (rom-map `0xff27cc`, the shells lane) |
| 51 | em085 Great Maccao | ops 0x07 / 0x2a in g1 s73 ((1, 4) vs (1, 0xf)) | NR | b | CLOSED 2026-10-19 (area byte / map byte) -> a |
| 52 | em085 | `0x7206c` on P+0x1bc (I: the timer's step); e+0x13a0 = 15.0 at `0x108e874` | NR | b | CLOSED 2026-10-19 (the counter; layer flag bit 0 NR) |
| 53 | em057 Zinogre | (1, 5) and the catch (9, 1 / 2) | issued from outside the class (scan + census, controls run) | a | named refusal (the hunter side) |
| 54 | em057 | u 42 (id 1006)'s arm in the aura machine; u 280 (id 1009) under `cmp r0, #1` | NR | b | superseded (em057 spec 10) |
| 55 | em057 | the shells 0xf7..0xfb, u 0 / 1 / 60 / 61 / 150 | shell records | S | shells lane |
| 56 | em057 | L2 M43 / M44 keep their own action at G | the clips are only played by remapped actions | v | named stand-in (the clip is on his list) |
| 57 | em021 Congalala | the gas he carries (from an earlier eat; each L2 M16 play shows the next) | runtime history | c | open: a "Gas" select (the class byte, 0..4) |
| 58 | em021 | `asleep` for the pit sleep (P+0x522 / P+0x5e08 set by the sleep: I) | writer not read | b | CLOSED 2026-10-19 (the sleep family sets P+0x5e08 bit 0) |
| 59 | em021 | (1, 0x5a / 0x5b)'s random gas; the item's weighted stage pick | RNG / stage | a | open, named |
| 60 | em023 Rajang | g1 s35's direct (7, 0x3e) -- lit, no beam | a pick with no shell | S | shells side's call |
| 61 | em060 Arzuros | (6, 2)'s sunk (I); c 1102 on L3 M13 (I for which clip carries it first) | the shared `0xa4518` while asleep | b | CLOSED 2026-10-19 (`0xa3df8`: the sleep holds or the nap latch) |
| 62 | em066 Tetsucabra | the carry state across clips (u 10 held only on L4 M11) | the viewer has no "carrying" state | c | superseded: the Boulder control (2026-10-18) is the rock in hand at each play's start |
| 63 | em066 | `[e+0xcac0]+0x30` as the boulder kind (I = states note's ctl+0x30) | reader not read through | b | CLOSED 2026-10-19 (ctl+0x30 by the starting action; P+0x1bb bit 0 the carry flag) |
| 64 | em066 | (10, 0xfb)'s clip (a status-10 script) | the script not read | b | CLOSED 2026-10-19 (no status-10 case) |
| 65 | em067 Zamtrios | u 60's placement (a point the class computes ahead of him) | the point's math not read | b | CLOSED 2026-10-19 and WIRED (`{ ahead: 530 }`, index.html fireAt; em067_00 check) |
| 66 | em070 Nerscylla | e+0x1068, the area's floor flag | area data (2026-10-18 decision) | a | open, named |
| 67 | em088 Ahtal-Ka | anchors' `+4` byte; `e+0xd408` and its writer; which action starts release the anchors | NR | b | CLOSED 2026-10-19 (releases by action; e+0xd408 superseded; the +4 byte -> S) |
| 68 | em088 | `0x329c9c` / `0x8a4dfc` (the thread re-aim); `0x7db70` (list tail) | NR (0x7db70 is READ in rom-map as the hit-record arms) | b | CLOSED 2026-10-19 (`0x8a4dfc` the angle set; the rest superseded) |
| 69 | em088 | who issues (1, 0x1c..0x25) / (1, 0x21) | EMC streams not read | b | partly CLOSED 2026-10-19 (the file's issuers; the odd ones NR) |
| 70 | em088 | whether a data table carries id 1009 / 1010 (u 20) | NR | b | CLOSED 2026-10-19 (no site: literal ids or the slot +8) |
| 71 | em088 | harness-faulting action starts' effect on `e+0xcb0c` | not run | b | CLOSED 2026-10-19 (e+0xcb0c = 4 on 9 of them; the rest leave it) |
| 72 | em088 | the carried objects' identity; the game's action names | not in the ROM | v | -- |
| 73 | em019 / em020 Hermitaur, Ceanataur | "Sharpened Broken" taken as knocked off (I) | its writer not read | b | CLOSED 2026-10-19 (sets 9 / 10 are Shogun's; never Rustrazor's) |
| 74 | em069 Seltas Queen | `e+0xcad0` | reset writers only (census) | -- | CLOSED 2026-10-18 (named false, READ negative) |
| 75 | em013 Fatalis line | c 1103 (X7) | X7 | b | CLOSED 2026-10-19 (X7) |
| 76 | em024 Kushala | the snow map | -- | -- | superseded: CLASS_TIMERS em024_00 `snowMap` (spec 7) |
| 77 | em025 Chameleos | sleep (10, 0x1e) op 1, no motion named: L3 M10 held (I) | as Kushala's (rom-map 0x9f33c row: op 1 sets no motion) | b | CLOSED 2026-10-19 (op 1 sets no motion: the Kushala row) |
| 78 | em025 | the area gate `0x5bfb8` / `0x5c1a8` on (1, 0x11) / (2, 0x14) | read to see what it tests | b | CLOSED 2026-10-19 (a global's per-area timed slots) -> a |
| 79 | em025 | the shimmer path, alpha ramp, meat switch | -- | -- | superseded: spec 8.5 (2026-10-18) |
| 80 | em027 Teostra | the nova machine: ids 1006..1015 (keys 160..165 / 170..173) at `0xe17e3c..0xe1850c` into e+0xcacc | not read, not exported | b | superseded (READ + wired 2026-10-18; rom-map / spec / check recorded 2026-10-19) |
| 81 | em027 | u 10 (size type) | -- | -- | superseded: spec 8, CLASS_CONTROLS2 Size Type |
| 82 | em050 Alatreon | class-table keys 11 / 12 / 37..40 / 530 / 531 (frame handler `0xecce08`, site `0xecce84`) | not read | b | superseded (em050 spec 5) |
| 83 | em058 Amatsu | e+0x15fb (the alternate head sets: u 101 / u 1121) | writer not read | b | superseded (rom-map `0xf091ac`) |
| 84 | em058 | the aura's fade back in (+0x180) | the hold is dropped, the fade not drawn | c | open: buildable (applyCloakAlpha025's pattern) |
| 85 | em058 | the tail drop (no clip carries it) | Raven's call | c | DONE (2026-10-18: MOTION_STATES.em058_00 '3\|Motion[9]' drops: true -- the tail flies on L3 M9, u 900) |
| 86 | em058 em084 | c 1600 / c 1601 (type 20) | renderer type not built | -- | Render's |
| 87 | em084 Nakarkos | the 32 tentacle PSL records, c 800 | the survey's naming stands | b | no read owed (READ already); **BUILT 2026-10-19**: the arms on their own runtimes (dev/em084_00-effects-spec.md "Tentacle PSL"); c 800 exported + placed (placeEvent), recorded (two --grow rounds) and ON; the step back's 0xa55f20 recorded (release sets) -- body and arms clean; 0xa55eec still open |
| 88 | em086 Valstrax | the glow's fade-out (states 2..6) | the stop kept, the fade not drawn | c | open: buildable as 84 |
| 89 | em082 Soulseer | the soul flame P+0x1bb bit 1 (lit after the rage roars) | no viewer state | c | DONE (2026-10-18: the Soul Flame control, CLASS_CONTROLS em082_04; dev/em082-effects-spec.md 5) |
| 90 | em082 | (2, 0x36) repeated (u 330) | a play cannot tell it follows itself | c | open: a copy row for the repeat |

## 3. The shells agent's (listed, not worked here)

| Spec | Its open items |
|---|---|
| amphibian-shells-spec.md | `0x183490`'s 0x40 / 0x80 (NR); `0xc30db4`'s reach (NR); the property name of `0x489e50` / `0x489e44` (I); the camera shake (I) |
| carapaceon-shells-spec.md | the matrix at `0x172d744` (filled at run time, NR) |
| elder-dragon-shells-spec.md | centre012 / spawn012 (stand-in); the phase-3 dust's clip branch (NR); the tornadoes' owner action (not shown, named); line-18 module order (I) |
| em007-shells-spec.md | Bloodbath's five modes without a spawn site; `0x6f618`'s callee (I) |
| em032-shells-spec.md | frames NOT read; the two `+0xcac8` sites probable mode 0; the group level |
| em037_04-shells-spec.md | `0x182b04` (NR); base46's hunter aim (a); the wall stand-in; the owner's +0x40 (I) |
| em057-shells-spec.md | ownerTurn057, stageQuery (stand-ins); G (7, 0xfb / 0xfc) never shown |
| em061-shells-spec.md | the stage floor stand-in; sp_24 `+0x15c0` (I: a hunter's break) |
| em069-em076-shells-spec.md | the target block +0x1d0 (hunter stand-in); consumers NR; his turns not shown |
| em079-shells-spec.md | `0x794f0` (which of L2 M36 / M37); the switches 0x92 / 0x98 / 0x16 |
| em081-shells-spec.md | his shell00's hitdata; `[e+0x4b4]` channel 1; the stage core; the clock divisor `[[0x211f764]+0x38]`; u 40; block vtable +0xd4 (I); section 8 |
| em083-shells-spec.md | folder order (I); durability 999 (I) |
| em084-shells-spec.md | base48's call (NR); the setter actions' issuers (NR); form copy order (I); vt+0x3d8 on every setMotion (I); layer frame rate (I); base31's consumer; a base01 bit; section 10 |
| fanged-beasts-shells-spec.md | `0xac030` after the dung (READ elsewhere: rom-map's 0xac030 row, a 30% shiny drop -- closable by citation); charge stand-ins |
| leviathan-shells-spec.md | base47; the clip length; e+0x73e8 (X4); phase window (I) |
| snake-wyvern-shells-spec.md | base36 state 0xfe counting (I); the bounce not exercised (stage) |
| temnoceran-shells-spec.md | H73E8_STANDIN = 0 (X4) |

## 4. Closed in this sweep

Every reading is a row in rom-map.md's section "Effects open items -- the sweep's reads" (with a Withdrawn-table correction to
the `0x328ba0` row and tooling rows for `pltname.py`, `census_c.py`, `emcfind.py`, `memscan.py`, `hookctl.py`, `spend063.py`), and a
bullet in the monster's spec under "Open items read (2026-10-19)". Shared findings that closed several rows at once:

* EMC ops read from the interpreter `0x82ec4` (jump table `0x836f0`): op 0x14 = call g1 sN; op 0x20 = call g0 sN (group 0 only);
  ops 0x69 and 0x80 = an if with no test (the body never runs); op 0x6f and op 0x92 share one switch (`0x8e088`); op 0x6e = a
  no-repeat gate (e+0x73b2, the stream called before); op 0x07 = the area byte e+0x1054; op 0x2a = e+0x1053 (I the map).
* The PSL / effect request with a missing key makes nothing (`0x326010`).
* sUnit's line pass calls vt+0x24 (action main) before vt+0x28 (frame handler, `0xa4518`, `0xa3ef0`): an ailment / trap action
  that falls to the default in its own update fires no shared per-frame record.
* P+0x5e08 is the ailment byte: bit 0 sleep, bit 2 paralysis, bit 4 stun (each set by changeAction on its status-10 family),
  bit 1 / bit 3 from the hit accumulators (I poison / another).
* e+0x1408 bit 14 (e+0x1409 & 0x40) = the rage's end pending (the rage timer ran out).
* Wired: Zamtrios's u 60 at its ROM point (530 x scale ahead, `fireAt`); the Teostra nova (wired 2026-10-18) recorded in rom-map,
  spec and the elders check.

## 5. For Raven: controls the ROM supports (category c), not built

| Control (working label) | Monsters | What the ROM tests | What it would change on screen |
|---|---|---|---|
| Begins burrowed | Basarios, Gravios, Akantor, Ukanlos, Deviljho, Barroth, Uragaan, Brachydios, Arzuros | `0x81d6c`: posture 4 and P+0x5c below 0.9 x MoguriBaseOfs at the play's start | the burrow clips' footfall / debris bits (the sunk forms) |
| Tired (apart from Rage) | Rathian / Rathalos lines | `0x81614` = P+0x505 alone | an enraged-and-tired start drops L2 M1 / L4 M32's bits |
| Tail state (Normal / Hot / Dark) | Glavenus | P+0x1bb bits 0 / 1 (the tail gauge) | the dark forms light bits 22-23 -- the same records at the same frames: nothing visible |
| Gas | Congalala | the class byte (0..4) his L2 M16 reads | which gas his breath shows (today each play shows the next) |
| Carrying | Tetsucabra / Drilltusk | P+0x1bb bit 0, set with ctl+0x30 at the pick-up | u 10 held across clips, not only on L4 M11 |
| (2, 0x36) repeated | Soulseer | the copy for the repeat | u 330 on the second play |
| Poisoned | Kushala, Teostra (and any monster's shared poison) | P+0x5e08 bit 1 | Kushala's wind and Teostra's aura held off |
| Start frame on a copy | Deadeye Garuga L0 M7 (7, 0xe3 / 0xe5) | the ROM starts the clip at frame 18 | u 290 starts at the clip's frame 18, not 5 |
| Aura fade in / glow fade out | Amatsu, Valstrax | the class alpha ramps (+0x180; [0x16a2fa0]) | the fade is drawn instead of a cut |

(Corrected 2026-10-19 by the coordinator: the Soul Flame control and Amatsu's tail drop were already built; both rows marked DONE and taken off this list.)

**Approved 2026-10-19 (Raven) and built the same day** (rom-map row "the eight approved controls"; dev/checks/class-toggles.mjs,
em021_00.mjs). New rows, with their WORKING labels for Raven to name:

| Row (working label) | Kind | Monsters |
|---|---|---|
| Begins Burrowed | switch (CLASS_TOGGLES `burrowed`) | Basarios, Gravios, Akantor, Ukanlos, Deviljho, Savage Deviljho, Barroth, Uragaan, Brachydios, Raging Brachydios, Arzuros, Redhelm Arzuros |
| Tired (with Rage) | switch (`tiredRage`) | Rathian, Gold Rathian, Dreadqueen, Rathalos, Silver Rathalos, Dreadking |
| Gas Type: None / Gas 1 / Gas 2 / Gas 3 / Gas 4 | select (CLASS_CONTROLS em021_00) | Congalala |
| Poisoned | switch (`poisoned`) | Kushala Daora, Teostra |
| L0 Motion[4] copy D | Clip menu copy | Soulseer |
| L0 Motion[7] copy B (starts at frame 18) | Clip menu copy | Deadeye Yian Garuga |

Not new rows: Carrying was already the Boulder control (2026-10-18); the Amatsu / Valstrax fades follow the existing state (no control).

**Possible control, listed for Raven (2026-10-19, not built): "After First Rage"** -- Khezu and Gypceros: once a spawn's first rage timer runs out, e+0x1408 bit 14 stays set (rom-map: the controlled re-scan) and every later rage issues the calm / plain forms: Khezu's attack clips lose bits 9-11, Gypceros's L4 M7 / M9 lose bits 16-18, while parts and materials still show the rage.
