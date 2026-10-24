// AHTAL-KA (em088_00) -- HIS SHELLS (Raven, 2026-10-15: "we will likely follow the ROM as is instead of a proxy";
// dev/em088-shells-props-spec.md, dev/em088_00-effects-spec.md, dev/rom-map.md "Ahtal-Ka -- shell57 / base57"). Ids
// 0x17b..0x181 (table 0x175c3e8 rows 379..385), every .shl's one list effect\pel\em\em088_00u; values: em088_00.arc
// shell\em\em088_00_shellNN (the files' own, shellef.load_typed; scratchpad ahtal/shl088.txt).
//   SHELL57 = uShellEm088_sp_57 (vtable 0x1809c94; base57 its only class): THE CARRIED OBJECT IN FLIGHT. All its requests
// come from the fight's control unit (G, GOT 0x1832980 -> 0x2132968; 0x10aebac(G, rec): a 0x60-byte cSetupParamEmBase57,
// setup +0x14 = rec +0 the object k, +8 rec +4 the mode, +0xc rec +8 the owner, +0x18 rec +0xc the PLACEMENT, +0x1c rec +0x10
// the BEHAVIOUR, +0x20 rec +0x14 a point (pointer), +0x24.. rec +0x18.. three words, +0x30.. rec +0x30.. a position, +0x40..
// rec +0x40.. words, +0x4c the delay, +0x50 / +0x51 bytes, +0x54 the trail param; nothing for k = 4, 0x10aebac's `beq`).
// Ahtal-Ka's four (READ, every caller of 0x10aebac in his band):
//   * THE THROW, (7, 0x10) / (7, 0x32) at their start (0x10b51e4 -> 0x10bb7c0(E, 0x211, rec, s0 160.0)): he is posed at
//     L2 M17 frame 160 (setMotion 0xafe84 + advance 0x94e1a0 + joints 0x539c5c), the shell made from that pose, then
//     e+0xcb0c = 4 (0x10bb8cc) and his motion restored; the action body then plays L2 M17 FROM FRAME 160 (0x10bf0d4:
//     0xafe84(E, 0x211, blend 6, start 160.0)). rec: k = e+0xcb0c, mode = 0x10aed44(G, k) = k, placement 1 (his joint),
//     behaviour 1, trail param 1. The viewer plays L2 M17 from 0: the spawn is the step showing frame 160.
//   * THE PULL, (1, 5) / (1, 0xe) L2 M19 and (1, 0xd) / (1, 0x13) L2 M37 (0x10bfd64(E, r5 6 / 2, r6 1 / 0), status-1 table
//     0x10bc790): phase 1 crossing tune float 15 = 92.0 (0x6f618(E, 0xf), 0xb0968(E, 1, 0, 92)): rec k = e+0xd471 (the
//     AI's pending pick), mode = 0x10aed04 = k + 8, PLACEMENT 2 (the object's spot in G), behaviour 3, +0x14 = joint 130's
//     world point (0xc164c(E, 0x82)), +0x18.. = joint 130's Euler words (0x7c3a38), byte +0x50 = 1, trail param 2; handle
//     e+0xd488. Then (0x10c006c) it waits for the shell to leave states 1 / 2 (0x4307c0) or 600 frames, plays L2 M20 / M38
//     and sets e+0xcb0c = e+0xd471 (0x10c00e0).
//   * THE DROP AT (1, 6) / (1, 0x20) (vt+0x204 0x10b5298 -> 0x10b613c(E, e+0xcb0c, 1), then e+0xcb0c = 4): mode = 0x10aed54 =
//     k + 0x10, placement 1, behaviour 4, +0x14 = tune vec 4 / 6 / 8 (k 0 / 1 / 2) with y = -90.0, +0x18 = (0x444,
//     s32(tune vec 5 / 7 / 9 .y x 182.04444 + 0.5) & 0xffff, 0x16c), trail param 1. (1, 6) plays L2 M28 (0x10bd330), (1, 0x20)
//     L0 M4 (0x10bfc84 -> 0xafe84(E, 4)).
//   * THE DROP AT EVERY AILMENT / REACTION / DEATH START and (0, 2) / (1, 2) (0x10b5f44, psl-mask.js em088Drops): mode =
//     0x10aed14(G, k, 0x58) = k + 0xc, placement 1, behaviour 2, trail param 1, then e+0xcb0c = 4 (0x10b6114). (With a pull in
//     flight, e+0xd488 != 0, it drops the PENDING object from the pulled shell's point instead -- not a viewer state.) Rows
//     here on the FIRST clip of each such action only (states-em088_00.md 3.3): a later clip of the same action has no
//     object left to drop.
// Not his: behaviour 6 and Neset's mode 0x14 + k (0x10ac1c8 / 0x10ac3c8, uEm087_00); behaviour 5 has no caller (the eight
// callers of 0x10aebac: 0x10ac1c8 / 0x10ac3c8 / 0x10b6058 / 0x10b610c / 0x10b62d8 / 0x10bb8b8 / 0x10bd988 / 0x10c0048).
// (1, 0x12) (0x10bd6c0 -> 0x10bd988: the pull of object 1, written at 0x10bd7c0, 30 frames into L0 M1, the idle every other
// action plays too) is named and not listed.
const act088 = (status, n, list, clip, spawns, x = {}) => Object.assign({ action: [status, n], code: 'em088', list, clip,
  pick: x.pick || 'ai', variant: status + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x.also ? { also: x.also } : {});
// the drop at an action's start (0x10b5f44): behaviour 2, mode k + 0xc
const DROP088 = [{ atStart: true, shell: 'shell57', drop: 2 }];
SHELL_DATA.em088_00 = { name: 'Ahtal-Ka', lists: { 0: { list: 'u', pel: 'em088_00u' } },
  // the owner's object models, E+0xcb00 / +0xcb04 / +0xcb08 (0x10a40f4: rModel 0x8679 / 0x867a / 0x867b), as the Carrying
  // control's pieces (render/monster.js HELD_PROP: em087_00's part records): base57's init sets the shell's own model to
  // [E+0xcb00 + 4k] (0x42f18c -> 0x10bb5d0; none for k = 4)
  rubble: { source: 'em087_00', models: ['em087_00_rubble_01', 'em087_00_rubble_02', 'em087_00_rubble_03'] },
  shells: {
    // shell57: uShellEm088_sp_57 (vtable 0x1809c94), base57; its reader 0x10c4598 (params57). cmn vec (6, 180, 2): the rest
    // angles in degrees (0x430098..0x43013c). hitdata (0, 999) x 6, (0, 0) x 3.
    shell57: { id: 0x17e, cls: 'uShellEm088_sp_57', base: 'base57', reader: 0x10c4598, folder: 'shell\\em\\em088_00_shell57',
      cmn: { ints: [], floats: [], vecs: [[6.0, 180.0, 2.0]] },
      modes: {
