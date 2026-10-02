// THE BEAMS ON THEIR OWN MONSTERS (Raven, 2026-09-30, after the Beam Test: "I have looked at various beams, add them to
// their respective monsters since each look correct"). Each beam where its monster's class code fires it, read per monster
// in dev/beams/<monster>.md (every row there READ at the consuming instruction, then ROM-run through the class's own action
// main; the rom-map rows point at those notes). The beam itself is render/shells.js's base02g runtime with the monster's
// OWN ray (ray02real: base02's 0x3fc750 in full, bit-exact against the ROM), not the showcase's stand-in.
// A row:
//   list, clip   the motion its action plays: the viewer's list id and the bare slot name 'Motion[N]' (a _start/_loop split
//                motion is matched on the bare name, its frames counted over the whole motion)
//   frame        the motion frame the spawner's frame test passes (the spawn happens on the step that crosses it)
//   atStart      instead of a frame: the spawner makes the request in the action's FIRST update, with the setMotion (no
//                frame test) -- spawned on the clip's first step
//   type         'emXXX_YY:mode' -- render/beam-types.js BEAM_MODES (the shell mode the spawner writes into the setup's +8)
//   action       [status, number], the action that plays it; `variant` defaults to its 'S:0xNN' name
//   variant      the pick name: a clip carrying rows of several picks plays one pick per play, in the rows' order (rows
//                sharing a pick all fire in that play -- one action, several shells)
//   when         the state the spawner tests, each READ in the note: tired (0x81614), rage (0x81670), rank ('G' = questRank
//                > 4, 'low' = <= 4; the viewer's rank is index.html SHELL_QUEST_RANK), part ({ name: shown } -- a part the
//                model shows: render/motion-states.js SHELL_PARTS). A row without `when` fires in every state.
//   setup        the setup's angle words +0x20 (/ +0x24 / +0x28) as the spawner writes them literally; only the direction
//                hooks (+0x15c) of Plesioth, the Fatalis line and Gravios read +0x20
//   aim          the +0x20 word the spawner COMPUTES (render/shells.js beamAim): Plesioth's frame-22 pitch, the Fatalis
//                0xd81e80, Gravios's phase-0 pitch
//   partners     the blend partners of the same play (the spawn's frame counted on whichever clip is shown)
//   arm          the attached body whose OWN action fires it (Nakarkos's 'left' / 'right' arm): the ray is built from that
//                body's joints (input.attachedJoints, index.html shellExtra), not the monster's
//   leave        where the ACTION leaves the beam's motion, when it sets its next motion itself: the beam's +0x170 (base02's
//                0x3fd4c4: the owner's motion is no longer the spawn's) ends it on that update, while the viewer's clip
//                plays on. { frame: F } -- a mode-1 test, 0xb0968(e, 1, 0, F): the frame has reached F; { end: true } --
//                0xb09c8, the motion's ended flag, which the layer update raises on the update whose frame reaches the
//                motion's length -- a loop's wrap included (0x94f374). Without it a beam ends by its life or a clip change.
//                And since the game never sees that motion loop, the viewer's loop of the clip is the action played again:
//                an `atStart` row with `leave` fires anew on every pass (render/shells.js stepShells `rearm`)
//   NOT HERE, by name: actions nothing issues (no op-00 in the command table and no code-side change-action -- each note's
//   section 3, positive-controlled), and modes whose arc entry starts no effect (ef 999 / -1: drawn as nothing).
const AIM010 = { kind: 'em010_00 f22', frame: 22, joint: 0x68, y: -150.0 };          // 0xd67fd8.. / 0xd68e64.. / 0xd692b0..
const AIM013 = { kind: 'em013_00 0xd81e80', limit: 0x18e4, v: [0.0, 250.0, 800.0], raise: 380.0 };   // 0xd86684..0xd866bc
const AIM005 = { kind: 'em005_00 0xd288b8', partners: { 'Motion[25]': 0xce39, 'Motion[26]': 0x31c7 } };   // phase 0
export const BEAM_SPAWNS = {
  // GRAVIOS (uEm004_00, em byte 5; dev/beams/em005_00.md, READ): shell 0x6e. (7, 0x0e) / (7, 0x32) -- modes 1 / 2, 5 / 6
  // with the head broken -- are behaviour code 1 of the class's +0x15c and run Basarios's class path (SHELL_DATA em005_00,
  // spawn02b / make02); these are codes 2 and 3, whose +0x168 is the base's ray builder (0xd30cec tail-calls 0x3fc750) and so
  // base02g's. (7, 0x11): L2 M24 blended with M25 (target above) / M26 (else) by the phase-0 pitch, f118, mode 3 / 8 (calm /
  // enraged, 0x81670) or 7 / 9 with the head broken (ctl+0x24 bit 0: part 5 at the break level, rebuilt each action start by
  // 0xd22a14 -- the broken head mesh the model shows); +0x20 = that pitch, clamped to +-70 degrees. (7, 0x34): L4 M59, f134,
  // mode 10 / 11 (head), +0x20 = 0. (7, 0x39) / (7, 0x47) (L4 M60, modes 4 / 12) are not issued and start no effect.
  em005_00: [
    { list: '2', clip: 'Motion[24]', partners: ['Motion[25]', 'Motion[26]'], frame: 118, type: 'em005_00:3', action: [7, 0x11], aim: AIM005,
      when: { rage: false, part: { headBroken: false } } },
    { list: '2', clip: 'Motion[24]', partners: ['Motion[25]', 'Motion[26]'], frame: 118, type: 'em005_00:8', action: [7, 0x11], aim: AIM005,
      when: { rage: true, part: { headBroken: false } } },
    { list: '2', clip: 'Motion[24]', partners: ['Motion[25]', 'Motion[26]'], frame: 118, type: 'em005_00:7', action: [7, 0x11], aim: AIM005,
      when: { rage: false, part: { headBroken: true } } },
    { list: '2', clip: 'Motion[24]', partners: ['Motion[25]', 'Motion[26]'], frame: 118, type: 'em005_00:9', action: [7, 0x11], aim: AIM005,
      when: { rage: true, part: { headBroken: true } } },
    { list: '4', clip: 'Motion[59]', frame: 134, type: 'em005_00:10', action: [7, 0x34], setup: [0], when: { part: { headBroken: false } } },
    { list: '4', clip: 'Motion[59]', frame: 134, type: 'em005_00:11', action: [7, 0x34], setup: [0], when: { part: { headBroken: true } } },
  ],
  // PLESIOTH (uEm010_00; dev/beams/em010_00.md, READ): shell 0x7d, seven spawners; the mode is the only thing the rank
  // changes (questRank > 4 -> the second, `movwgt`). +0x20: the literal 0xe39 (7, 6), 0 (7, 8 / 9 / 0xf.. / 0x27), or the
  // pitch toward the target taken at f22 from joint 0x68 150 below (clamped +-29.998 deg, kept in e+0xcae8) for (7, 0xd) /
  // (7, 0x28) / (7, 0x32). (7, 0x17) = (7, 0x10)'s spawn and is not issued.
  em010_00: [
    { list: '2', clip: 'Motion[10]', frame: 130, type: 'em010_00:2',  action: [7, 0x06], setup: [0x0e39], when: { rank: 'low' } },
    { list: '2', clip: 'Motion[10]', frame: 130, type: 'em010_00:17', action: [7, 0x06], setup: [0x0e39], when: { rank: 'G' } },
    { list: '2', clip: 'Motion[12]', frame: 126, type: 'em010_00:3',  action: [7, 0x08], setup: [0], when: { rank: 'low' } },
    { list: '2', clip: 'Motion[12]', frame: 126, type: 'em010_00:18', action: [7, 0x08], setup: [0], when: { rank: 'G' } },
    { list: '2', clip: 'Motion[11]', frame: 126, type: 'em010_00:3',  action: [7, 0x09], setup: [0], when: { rank: 'low' } },
    { list: '2', clip: 'Motion[11]', frame: 126, type: 'em010_00:18', action: [7, 0x09], setup: [0], when: { rank: 'G' } },
    { list: '2', clip: 'Motion[6]',  frame: 86,  type: 'em010_00:0',  action: [7, 0x0d], aim: AIM010, when: { rank: 'low' } },
    { list: '2', clip: 'Motion[6]',  frame: 86,  type: 'em010_00:15', action: [7, 0x0d], aim: AIM010, when: { rank: 'G' } },
    { list: '2', clip: 'Motion[7]',  frame: 116, type: 'em010_00:5',  action: [7, 0x0f], setup: [0], when: { rank: 'low' } },
    { list: '2', clip: 'Motion[7]',  frame: 116, type: 'em010_00:20', action: [7, 0x0f], setup: [0], when: { rank: 'G' } },
    { list: '2', clip: 'Motion[7]',  frame: 116, type: 'em010_00:1',  action: [7, 0x10], setup: [0], when: { rank: 'low' } },
    { list: '2', clip: 'Motion[7]',  frame: 116, type: 'em010_00:16', action: [7, 0x10], setup: [0], when: { rank: 'G' } },
    { list: '2', clip: 'Motion[7]',  frame: 116, type: 'em010_00:10', action: [7, 0x15], setup: [0], when: { rank: 'low' } },
    { list: '2', clip: 'Motion[7]',  frame: 116, type: 'em010_00:25', action: [7, 0x15], setup: [0], when: { rank: 'G' } },
    { list: '2', clip: 'Motion[7]',  frame: 116, type: 'em010_00:9',  action: [7, 0x16], setup: [0], when: { rank: 'low' } },
    { list: '2', clip: 'Motion[7]',  frame: 116, type: 'em010_00:24', action: [7, 0x16], setup: [0], when: { rank: 'G' } },
    { list: '2', clip: 'Motion[14]', frame: 116, type: 'em010_00:4',  action: [7, 0x27], setup: [0], when: { rank: 'low' } },
    { list: '2', clip: 'Motion[14]', frame: 116, type: 'em010_00:19', action: [7, 0x27], setup: [0], when: { rank: 'G' } },
    { list: '2', clip: 'Motion[15]', frame: 112, type: 'em010_00:6',  action: [7, 0x28], aim: AIM010, when: { rank: 'low' } },
    { list: '2', clip: 'Motion[15]', frame: 112, type: 'em010_00:21', action: [7, 0x28], aim: AIM010, when: { rank: 'G' } },
    { list: '2', clip: 'Motion[13]', frame: 124, type: 'em010_00:13', action: [7, 0x32], aim: AIM010, when: { rank: 'low' } },
    { list: '2', clip: 'Motion[13]', frame: 124, type: 'em010_00:28', action: [7, 0x32], aim: AIM010, when: { rank: 'G' } },
  ],
  // FATALIS / CRIMSON FATALIS (uEm013_00; dev/beams/em013_00.md, READ): one spawner 0xd865a0, f94, mode 0, the id by the
  // variant byte (0x84 / 0x88; em013_02's 0x8c starts no effect). +0x20 = 0x2d8 (4 deg) for (7, 0x32) / (7, 0x33), the aim
  // 0xd81e80 for (7, 0x3e) / (7, 0x3f) -- from 250 up / 800 ahead of the body to 380 above the target, clamped +-35 deg.
  em013_00: [
    { list: '2', clip: 'Motion[46]', frame: 94, type: 'em013_00:0', action: [7, 0x32], setup: [0x02d8] },
    { list: '2', clip: 'Motion[46]', frame: 94, type: 'em013_00:0', action: [7, 0x3e], aim: AIM013 },
    { list: '2', clip: 'Motion[47]', frame: 94, type: 'em013_00:0', action: [7, 0x33], setup: [0x02d8] },
    { list: '2', clip: 'Motion[47]', frame: 94, type: 'em013_00:0', action: [7, 0x3f], aim: AIM013 },
  ],
  em013_01: [
    { list: '2', clip: 'Motion[46]', frame: 94, type: 'em013_01:0', action: [7, 0x32], setup: [0x02d8] },
    { list: '2', clip: 'Motion[46]', frame: 94, type: 'em013_01:0', action: [7, 0x3e], aim: AIM013 },
    { list: '2', clip: 'Motion[47]', frame: 94, type: 'em013_01:0', action: [7, 0x33], setup: [0x02d8] },
    { list: '2', clip: 'Motion[47]', frame: 94, type: 'em013_01:0', action: [7, 0x3f], aim: AIM013 },
  ],
  // DAIMYO / STONEFIST (uEm019_00; dev/beams/em019_00.md, READ): one helper 0xdb9a88, no frame test of its own -- mode 1
  // for Daimyo at questRank >= 5, else 0 (Stonefist always 0). The six beam actions call it at f96 when NOT tired
  // ((7, 3) L2 M18; (7, 0x1a) / (7, 0x1c) / (7, 0x31) L2 M54); the turn after a beam action (L2 M57 / M55, reached only
  // from those actions' phase 3) calls it in its first update when no beam was made since the beam action began
  // (ctl+0x52): that is, after a TIRED beam action. (7, 0x2e) / (7, 0x2f) are not issued.
  em019_00: [
    { list: '2', clip: 'Motion[18]', frame: 96, type: 'em019_00:0', action: [7, 0x03], when: { tired: false, rank: 'low' } },
    { list: '2', clip: 'Motion[18]', frame: 96, type: 'em019_00:1', action: [7, 0x03], when: { tired: false, rank: 'G' } },
    { list: '2', clip: 'Motion[54]', frame: 96, type: 'em019_00:0', action: [7, 0x1a], when: { tired: false, rank: 'low' } },
    { list: '2', clip: 'Motion[54]', frame: 96, type: 'em019_00:1', action: [7, 0x1a], when: { tired: false, rank: 'G' } },
    { list: '2', clip: 'Motion[57]', atStart: true, type: 'em019_00:0', action: [2, 0x22], when: { tired: true, rank: 'low' } },
    { list: '2', clip: 'Motion[57]', atStart: true, type: 'em019_00:1', action: [2, 0x22], when: { tired: true, rank: 'G' } },
    { list: '2', clip: 'Motion[55]', atStart: true, type: 'em019_00:0', action: [2, 0x23], when: { tired: true, rank: 'low' } },
    { list: '2', clip: 'Motion[55]', atStart: true, type: 'em019_00:1', action: [2, 0x23], when: { tired: true, rank: 'G' } },
  ],
  em019_04: [
    { list: '2', clip: 'Motion[18]', frame: 96, type: 'em019_04:0', action: [7, 0x03], when: { tired: false } },
    { list: '2', clip: 'Motion[54]', frame: 96, type: 'em019_04:0', action: [7, 0x1a], when: { tired: false } },
    { list: '2', clip: 'Motion[57]', atStart: true, type: 'em019_04:0', action: [2, 0x31], when: { tired: true } },
    { list: '2', clip: 'Motion[55]', atStart: true, type: 'em019_04:0', action: [2, 0x32], when: { tired: true } },
  ],
  // SHOGUN / RUSTRAZOR (uEm020_00; dev/beams/em020_00.md, READ). Shogun (7, 0x32): L2 M27 f50, 0x9e mode 4, only while
  // his shell is type 3 (e+0xcadc), the one part pass 0xdc5228 shows as set 3 -- the yado01 skull, part 109. Rustrazor
  // (0xa0; list 9 is his alone): (7, 0xc9) / (7, 0xca) at the first frame of L9 M31 / M33, mode 0; (7, 0xd4) as L2 M73's
  // f34 sets L2 M74, mode 2 (the beam lives on M74); (7, 0xdf) / (7, 0xe2) L9 M20 f50 (tune float 0x28), mode 1 / 3 --
  // each only when not tired. (7, 0xd5) is not issued.
  //   WHERE THEY END (Raven, 2026-10-01: "Review Rustrazor's water beams"; dev/beams/em020_00.md section 5). Modes 0 / 2
  // live 2000 frames, so it is the ACTION that ends them, by setting L2 M75 (0x24b) -- the beam's +0x170 then sees another
  // motion (his class keeps the base's 0x3fd4c4): (7, 0xc9) / (7, 0xca) at L9 M31 / M33's frame 70 (0xdca660: 0xb0968(e,
  // 1, 0, tune float 0x1b = 70.0)), after turning the unit -150 / +150 degrees over frames 2..70 (0x76dd0, tune 0x1a /
  // 0x1c: render/motion-states.js CLIP_TURN, so the beam sweeps); (7, 0xd4) when L2 M74 first ENDS (0xdcb480: 0xb09c8) --
  // the start and one pass of its loop, 106 frames. Modes 1 / 3 (L9 M20) live 108 frames and end by themselves, 103
  // before the action's own end at the motion's (0xdcc00c); that action's turn, frames 50..56 toward the hunter's
  // bearing + 180 degrees (0x7840c, tune 0x25..0x27 / 0x29), follows a target the viewer does not have. Shogun's mode 4
  // lives 2000 too: (7, 0x32) ends at M27's end (vt+0x3ec = 0x75388: action (0, 8), whose first update 0xdc61b0 sets
  // L5 M1, 0x501, on the ceiling), so his beam ends there -- in the viewer, at the replay of M27.
  em020_00: [
    { list: '2', clip: 'Motion[27]', frame: 50, type: 'em020_00:4', action: [7, 0x32], when: { part: { skull: true } }, leave: { end: true } },
  ],
  em020_04: [
    { list: '9', clip: 'Motion[31]', atStart: true, type: 'em020_04:0', action: [7, 0xc9], when: { tired: false }, leave: { frame: 70 } },
    { list: '9', clip: 'Motion[33]', atStart: true, type: 'em020_04:0', action: [7, 0xca], when: { tired: false }, leave: { frame: 70 } },
    { list: '2', clip: 'Motion[74]', atStart: true, type: 'em020_04:2', action: [7, 0xd4], when: { tired: false }, leave: { end: true } },
    { list: '9', clip: 'Motion[20]', frame: 50, type: 'em020_04:1', action: [7, 0xdf], when: { tired: false } },
    { list: '9', clip: 'Motion[20]', frame: 50, type: 'em020_04:3', action: [7, 0xe2], when: { tired: false } },
  ],
  // RAJANG / FURIOUS RAJANG (uEm023_00; dev/beams/em023_00.md, READ): 0xa9 / 0xad (variant 5). (7, 6) mode 2 / (7, 0xa)
  // mode 1 on L2 M8 f80; (7, 0x34) / (7, 0x35) mode 0 on L2 M20 / M21 f74. Tired, the remap 0xde1f50 swaps each for its
  // no-beam twin; Furious is never tired.
  em023_00: [
    { list: '2', clip: 'Motion[8]',  frame: 80, type: 'em023_00:2', action: [7, 0x06], when: { tired: false } },
    { list: '2', clip: 'Motion[8]',  frame: 80, type: 'em023_00:1', action: [7, 0x0a], when: { tired: false } },
    { list: '2', clip: 'Motion[20]', frame: 74, type: 'em023_00:0', action: [7, 0x34], when: { tired: false } },
    { list: '2', clip: 'Motion[21]', frame: 74, type: 'em023_00:0', action: [7, 0x35], when: { tired: false } },
  ],
  em023_05: [
    { list: '2', clip: 'Motion[8]',  frame: 80, type: 'em023_05:2', action: [7, 0x06], when: { tired: false } },
    { list: '2', clip: 'Motion[8]',  frame: 80, type: 'em023_05:1', action: [7, 0x0a], when: { tired: false } },
    { list: '2', clip: 'Motion[20]', frame: 74, type: 'em023_05:0', action: [7, 0x34], when: { tired: false } },
    { list: '2', clip: 'Motion[21]', frame: 74, type: 'em023_05:0', action: [7, 0x35], when: { tired: false } },
  ],
  // KUSHALA DAORA (uEm024_00; dev/beams/em024_00.md, READ): 0xdf8c28 for every issued action -- L2 M1 to f40, then L2 M8
  // (L2 M27 blended with M8 for (7, 0x1a)), 0xb1 at f24 of it: mode 1 when he was enraged at the action start (ctl+0x2c)
  // AND the stage byte e+0x1053 is 3, 14 or 20 (ctl+0x2d), else mode 0. The viewer has no stage: enraged, both picks play.
  em024_00: [
    { list: '2', clip: 'Motion[8]',  frame: 24, type: 'em024_00:0', action: [7, 0x15], when: { rage: false } },
    { list: '2', clip: 'Motion[8]',  frame: 24, type: 'em024_00:0', action: [7, 0x15], when: { rage: true } },     // any other stage
    { list: '2', clip: 'Motion[8]',  frame: 24, type: 'em024_00:1', action: [7, 0x15], variant: '7:0x15 stage', when: { rage: true } },   // stage 3 / 14 / 20
    { list: '2', clip: 'Motion[27]', frame: 24, type: 'em024_00:0', action: [7, 0x1a], when: { rage: false } },
    { list: '2', clip: 'Motion[27]', frame: 24, type: 'em024_00:0', action: [7, 0x1a], when: { rage: true } },    // any other stage
    { list: '2', clip: 'Motion[27]', frame: 24, type: 'em024_00:1', action: [7, 0x1a], variant: '7:0x1a stage', when: { rage: true } },  // stage 3 / 14 / 20
  ],
  // AKANTOR (uEm033_00; dev/beams/em033_00.md, READ): 0xc2. (7, 4) L2 M5 blended with M22 / M23: f152 mode 1 (f112 mode 0 and
  // f152's mode 2 start no effect); (7, 0xf) L2 M14 blended with M24 / M25: f172 mode 3 -- at questRank >= 5 the remap
  // 0xe36550 makes it (7, 0x27), f162 (f132 mode 0 and the mode 4 beside 3 start no effect); (7, 0x26) L2 M31: f201 mode 5,
  // f330 mode 6.
  em033_00: [
    { list: '2', clip: 'Motion[5]',  partners: ['Motion[22]', 'Motion[23]'], frame: 152, type: 'em033_00:1', action: [7, 0x04] },
    { list: '2', clip: 'Motion[14]', partners: ['Motion[24]', 'Motion[25]'], frame: 172, type: 'em033_00:3', action: [7, 0x0f], when: { rank: 'low' } },
    { list: '2', clip: 'Motion[14]', partners: ['Motion[24]', 'Motion[25]'], frame: 162, type: 'em033_00:3', action: [7, 0x27], when: { rank: 'G' } },
    { list: '2', clip: 'Motion[31]', frame: 201, type: 'em033_00:5', action: [7, 0x26] },
    { list: '2', clip: 'Motion[31]', frame: 330, type: 'em033_00:6', action: [7, 0x26] },
  ],
  // UKANLOS (uEm038_00; dev/beams/em038_00.md, READ): status 7's number table 0xe61f40 -> the spawners 0xe60ef8 (M5 / M41)
  // and 0xe615e8 (M34), each 0x3fb7bc + id 0xd0 + a literal mode, submitted at the frame 0xb0968 passes. (7, 0x0f) is the
  // same mode-1 spawn as (7, 8) and no stream issues it; modes 5 / 6 are coded and never reached (no caller passes them).
  em038_00: [
    { list: '2', clip: 'Motion[5]', frame: 125, type: 'em038_00:0', action: [7, 0x09], setup: null, variant: '7:0x09' },
    { list: '2', clip: 'Motion[5]', frame: 125, type: 'em038_00:1', action: [7, 0x08], setup: null, variant: '7:0x08' },
    { list: '2', clip: 'Motion[5]', frame: 125, type: 'em038_00:2', action: [7, 0x0a], setup: null, variant: '7:0x0a' },
    { list: '2', clip: 'Motion[41]', frame: 120, type: 'em038_00:7', action: [7, 0x11], setup: null, variant: '7:0x11' },
    { list: '2', clip: 'Motion[34]', frame: 218, type: 'em038_00:3', action: [7, 0x0c], setup: null, variant: '7:0x0c' },
    { list: '2', clip: 'Motion[34]', frame: 218, type: 'em038_00:4', action: [7, 0x0d], setup: null, variant: '7:0x0d' },
  ],
  // AGNAKTOR (uEm049_00; dev/beams/em049_00.md, READ): 0xee. L2 M4 f120 -- (7, 0x1f) mode 0, (7, 4) mode 6 -- and L2 M30
  // f120 (7, 0x38) mode 9, each turned by the remap 0xeb4ae0 into a no-beam action when tired; L2 M28 f236 mode 1, L2 M27
  // f168 mode 2, L2 M11 f118 mode 3, in any state. (7, 0x20) (mode 5) is not issued.
  em049_00: [
    { list: '2', clip: 'Motion[4]',  frame: 120, type: 'em049_00:0', action: [7, 0x1f], when: { tired: false } },
    { list: '2', clip: 'Motion[4]',  frame: 120, type: 'em049_00:6', action: [7, 0x04], when: { tired: false } },
    { list: '2', clip: 'Motion[28]', frame: 236, type: 'em049_00:1', action: [7, 0x0a] },
    { list: '2', clip: 'Motion[27]', frame: 168, type: 'em049_00:2', action: [7, 0x21] },
    { list: '2', clip: 'Motion[11]', frame: 118, type: 'em049_00:3', action: [7, 0x25] },
    { list: '2', clip: 'Motion[30]', frame: 120, type: 'em049_00:9', action: [7, 0x38], when: { tired: false } },
  ],
  // ALATREON (uEm050_00; dev/beams/em050_00.md, READ): 0xf1 mode 0 at frame 22 of L2 M11 (after the L2 M8 lead-in), for
  // (7, 0xe) and the turning (7, 0x25) alike.
  em050_00: [
    { list: '2', clip: 'Motion[11]', frame: 22, type: 'em050_00:0', action: [7, 0x0e] },
  ],
  // NIBELSNARF (uEm056_00; dev/beams/em056_00.md, READ): 0xf5. (7, 0xd) L2 M17 f102 mode 0; (7, 0x24) / (7, 0x25) -- reached
  // only from (7, 0xe) / (7, 0x23) as L2 M18 ends -- L2 M35 f55 mode 1, which lives on through the sweep (+0x170 0xeeb410).
  em056_00: [
    { list: '2', clip: 'Motion[17]', frame: 102, type: 'em056_00:0', action: [7, 0x0d] },
    { list: '2', clip: 'Motion[35]', frame: 55,  type: 'em056_00:1', action: [7, 0x24] },
  ],
  // AMATSU (uEm058_00; dev/beams/em058_00.md, READ): 0xfe, (7, 0xa) L2 M18: mode 0 at f270 and mode 1 at f410 (tune floats
  // 33 / 34).
  em058_00: [
    { list: '2', clip: 'Motion[18]', frame: 270, type: 'em058_00:0', action: [7, 0x0a] },
    { list: '2', clip: 'Motion[18]', frame: 410, type: 'em058_00:1', action: [7, 0x0a] },
  ],
  // ZAMTRIOS (uEm067_00; dev/beams/em067_00.md, READ): 0x123. L4 M59 / M60 f36 mode 0 ((7, 0x1b) / (7, 0x1c); (7, 0x4a)
  // enters M60 at frame 6 and fires at the same 36); L4 M57 / M58 f10 mode 1 ((7, 0x48) / (7, 0x49)).
  em067_00: [
    { list: '4', clip: 'Motion[59]', frame: 36, type: 'em067_00:0', action: [7, 0x1b] },
    { list: '4', clip: 'Motion[60]', frame: 36, type: 'em067_00:0', action: [7, 0x1c] },
    { list: '4', clip: 'Motion[57]', frame: 10, type: 'em067_00:1', action: [7, 0x48] },
    { list: '4', clip: 'Motion[58]', frame: 10, type: 'em067_00:1', action: [7, 0x49] },
  ],
  // BOLTREAVER (uEm081_00, variant 4 only; dev/beams/em081_04.md, READ): 0x153 through 0x102feb4. (7, 0xca) L9 M1 f48
  // mode 4, then at its f90 (7, 0xd2) L9 M2 mode 5 in its first update; (7, 0xd0) / (7, 0xe4) L9 M21 f78 mode 7, then at
  // f116 (7, 0xd1) / (7, 0xe5) L9 M22 mode 8 in its first update.
  em081_04: [
    { list: '9', clip: 'Motion[1]',  frame: 48, type: 'em081_04:4', action: [7, 0xca] },
    { list: '9', clip: 'Motion[2]',  atStart: true, type: 'em081_04:5', action: [7, 0xd2] },
    { list: '9', clip: 'Motion[21]', frame: 78, type: 'em081_04:7', action: [7, 0xd0] },
    { list: '9', clip: 'Motion[22]', atStart: true, type: 'em081_04:8', action: [7, 0xd1] },
  ],
  // MIZUTSUNE / SOULSEER (uEm082_00; dev/beams/em082_00.md, READ): [e+0xcac4] (0x15a / 0x15e), variant 4 adding 10 to the
  // mode. (7, 0x2b) / (7, 0x2c) L2 M75: mode 2 at f2, mode 0 at f100 (tune float 20); (7, 0x21) / (7, 0x7c) L2 M81: mode 2
  // at f20, mode 1 at f100 (tune float 21). (7, 0x1d) / (7, 0x1e) enter L2 M75 at frame 64 and so fire only its f100.
  em082_00: [
    { list: '2', clip: 'Motion[75]', frame: 2,   type: 'em082_00:2', action: [7, 0x2b] },
    { list: '2', clip: 'Motion[75]', frame: 100, type: 'em082_00:0', action: [7, 0x2b] },
    { list: '2', clip: 'Motion[81]', frame: 20,  type: 'em082_00:2', action: [7, 0x21] },
    { list: '2', clip: 'Motion[81]', frame: 100, type: 'em082_00:1', action: [7, 0x21] },
  ],
  em082_04: [
    { list: '2', clip: 'Motion[75]', frame: 2,   type: 'em082_04:12', action: [7, 0x2b] },
    { list: '2', clip: 'Motion[75]', frame: 100, type: 'em082_04:10', action: [7, 0x2b] },
    { list: '2', clip: 'Motion[81]', frame: 20,  type: 'em082_04:12', action: [7, 0x21] },
    { list: '2', clip: 'Motion[81]', frame: 100, type: 'em082_04:11', action: [7, 0x21] },
  ],
  // NAKARKOS (uEm084_00 and its two arms, uEmOstgaloaArm; dev/beams/em084_00.md, READ): 0x16e. The body's own (7, 0x43)
  // L0 M63 f146 (tune float 14), mode 14. Most beams are the ARMS' (`arm`: the attached body that fires it -- its own
  // joints, render/monster.js ROM_ATTACHED_BODY): 0x107ca4c(arm, idx), the mode from four tables by side and rank. The
  // viewer plays an arm's clip only beside the body clip of the same name (index.html playAttached), and of the arm beam
  // clips only L2 M86 has one: body (7, 0x44) / (7, 0x45) play body L2 M86 and order BOTH arms to (7, 0x21) -- idx 1, left
  // 1 / G 56, right 8 / G 57 -- and body (7, 0x4a) / (7, 0x4b) the same clip with both arms (7, 0x22) -- idx 6, left 25 /
  // G 58, right 26 / G 59; f146 (tune float 7). NOT HERE, by name: the arm beams on arm clips no body clip shares (L2 M1 /
  // M2 / M5 / M6 / M13 / M14 / M28 / M50 / M51 -- the tentacle lists are hidden, Raven 2026-09-13), and idx 2 (modes 2 / 9),
  // which no caller passes.
  em084_00: [
    { list: '0', clip: 'Motion[63]', frame: 146, type: 'em084_00:14', action: [7, 0x43] },
    { list: '2', clip: 'Motion[86]', frame: 146, type: 'em084_00:1',  action: [7, 0x44], arm: 'left',  when: { rank: 'low' } },
    { list: '2', clip: 'Motion[86]', frame: 146, type: 'em084_00:8',  action: [7, 0x44], arm: 'right', when: { rank: 'low' } },
    { list: '2', clip: 'Motion[86]', frame: 146, type: 'em084_00:56', action: [7, 0x44], arm: 'left',  when: { rank: 'G' } },
    { list: '2', clip: 'Motion[86]', frame: 146, type: 'em084_00:57', action: [7, 0x44], arm: 'right', when: { rank: 'G' } },
    { list: '2', clip: 'Motion[86]', frame: 146, type: 'em084_00:25', action: [7, 0x4a], arm: 'left',  when: { rank: 'low' } },
    { list: '2', clip: 'Motion[86]', frame: 146, type: 'em084_00:26', action: [7, 0x4a], arm: 'right', when: { rank: 'low' } },
    { list: '2', clip: 'Motion[86]', frame: 146, type: 'em084_00:58', action: [7, 0x4a], arm: 'left',  when: { rank: 'G' } },
    { list: '2', clip: 'Motion[86]', frame: 146, type: 'em084_00:59', action: [7, 0x4a], arm: 'right', when: { rank: 'G' } },
  ],
};
const actionName = a => a[0] + ':0x' + a[1].toString(16).padStart(2, '0');
for (const rows of Object.values(BEAM_SPAWNS)) for (const r of rows) if (!r.variant) r.variant = actionName(r.action);

// a row's `when` against the state the viewer gives (opts: { tired, rage, rank, parts }); no opts: every row
function whenHolds(w, o){
  if (!w || !o) return true;
  if (w.tired != null && !!o.tired !== w.tired) return false;
  if (w.rage != null && !!o.rage !== w.rage) return false;
  if (w.rank === 'G' && !(o.rank > 4)) return false;
  if (w.rank === 'low' && !(o.rank <= 4)) return false;
  if (w.part) for (const [k, v] of Object.entries(w.part)) if (!!(o.parts && o.parts[k]) !== v) return false;
  return true;
}
// the rows a clip carries in this state: its own, and those whose partners include it
export function beamRowsFor(monId, list, clip, opts){
  const rows = BEAM_SPAWNS[monId];
  if (!rows || !clip) return [];
  const base = String(clip).replace(/_(start|loop)$/, '');
  return rows.filter(r => r.list === String(list) && (r.clip === base || (r.partners || []).includes(base)) && whenHolds(r.when, opts));
}
