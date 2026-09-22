// SHELLS: the objects a monster's ACTION code spawns (a breath's body, thrown rocks, debris), translated from the ROM.
//
// Decode notes (every address below is explained there): E:\offline\decode\notes\shells-em043.md.
// ROM: C:\MHGU-ROM\exefs main.text (VA 0), main.rodata (VA 0x13ef000), main.data (VA 0x1728000). Data: the monster's
// .arc (C:\MHGU-Extract\scratch-em\em043_05\em043_05.arc), folder shell\em\em043_05_shellNN.
//
// WHAT THIS MODULE IS. A step function the effect runtime calls once per game frame (1/60 s, the same step as
// render/rom/effect/schedule.js). It reproduces, from the clip the viewer plays, what the monster's code does:
//   * WHEN a shell spawns: the attack action tests "the motion passed frame F" (0xb0974 -> 0x72714) in the enemy's
//     action code, which runs BEFORE that game frame's motion advance (enemy frame 0xada80: action main 0xadddc,
//     advance 0xae10c -> 0x71984 -> 0x94e1a0, joint build 0xae16c -> 0xa807c). The test reads the PREVIOUS advance:
//     prev = motion +0x500 (the frame before it), cur = +0x500 + step (+0x13b8) = the frame the pose now shows.
//     So at step k (pose F[k]) the test is F[k-2] < F <= F[k-1], and the shell's init reads the joint matrices built
//     for pose F[k-1]. The shell is then appended to unit move line 18 (0x48ba04: (r2 & 1) | 9 << 1), which the unit
//     manager walks after the enemy's line 4 (0xc0437c walks lines 0..n in order; enemies 0x4ec18), so its first
//     move runs in the SAME game frame, on the joints built for F[k].
//   * WHERE it is and how it moves: the class's init (vtable +0x13c) and per-frame move (+0x24), line by line,
//     in float32 as the ARM code computes them (Math.fround on every VFP result, trunc for vcvt.s32).
//   * WHICH effect it starts, where, and when it stops it: the .shl's per-mode rShellEffectParam (listId, uniqueId);
//     listId 0 = the .shl EffectLists[0] = effect\pel\em\em043_05u (u.pel). The request is handed to the caller as
//     data (the requester fields the ROM fills); the caller (the Effects Agent's runtime) starts, places and stops
//     the effect. This module never touches render/rom/effect/*.
//   * THE ROCKS (shell00, shell54; notes section 9): thrown in L2 Motion[23] / Motion[24] when the motion passes
//     114.0 (the same frame test and joints as above), aimed, launched, flown and landed as base00 / base54 do.
//     Their effect is never placed by the shell: the flying rock's record is bound to the shell, which only keeps its
//     own position / anchor / angle words current; bounces and landings start placed effects at the contact point.
//     Three things the ROM takes from the game are NOT READ and come in as explicit inputs, with no default:
//     which rock (the AI's pick of command stream 36 / 56 / 57), the target the launch pitch is aimed at (enemy
//     block +0x1d0) and the stage the flight collides with (0xc30b30; here a horizontal plane at a given height).
//   * NARGACUGA'S TAIL SPIKES (em037_00; notes E:\offline\decode\notes\shells-em037.md): shell00 is a base00 shell
//     like Savage's rock, thrown in L2 Motion[8] when it passes 46.0 -- 3 or 5 spikes at once, one per mode, made by
//     the spawner 0xe48fc8 -- and flown and landed by the same base00 code, with its own reader (0xe59050: flags from
//     the mode's ints), base00's own angle path at the init (setup angles or the owner's; the X aim 0x3f9378 with its
//     circular clamp; the Y spread 0x3f9cc4) and its own landing (0xe59334), which drops shell01 at a floor contact
//     (an event: shell01 mode 0 draws nothing). The same inputs as the rocks, NOT READ: which action (the AI's pick,
//     input.rock.variant names it: pickVariantsFor), the target (read only by the aimed kinds), the stage.
//
// UNITS AND FRAMES. Positions are GAME units in world space (the viewer's world is game units / 100: live.js
// MT_TO_VIEW). Joint matrices are the game's: 16 floats in memory order (row-vector convention, rows = axes, row 3 =
// translation) -- exactly three.js `matrixWorld.elements` with the translation multiplied by 100, the array live.js
// hands host.setJointMatrix. Angles are the ROM's u16 binary angles (65536 = one turn) where the ROM keeps them, and
// degrees where the ROM hands degrees to the effect. Frames are motion frames at 60/s (index.html driveClipEffects:
// action.time * 60 plus a _loop clip's _start length).
//
// NOT MODELLED (the viewer has no such state; see the notes):
//   * the owner's special state +0xb720 (enemy vtable +0x170 sets it, 0xca664): with it on, base04 multiplies its
//     beam length by a per-kind factor from tables at enemy +0xca98 / +0xcaac (0x43aa78). Off on a normal monster.
//   * base55's extra end test 0xc99a4: [[owner+0x1428]+0x5ea7] > 0 ends the shell (meaning not read).
//   * hit, sound and the unit's own draw: not visual here (hit vtable +0x140, sound 0x3fffcc / 0x42d29c).
//   * the effect's liveness is the caller's (input.effectAlive); without it the effect counts as alive.
//   * rocks: the monster's own turn while the frame is below 50 (0x76c08(e, 0x60, 0)) and so its facing at 114 --
//     input.owner.y instead; the rock hitting a hunter (hit slot +0x13ae, type 2 at the hit position) -- the viewer
//     has no hunters, so every contact is the stage query's; an inactive owner ending the flight (0x4a0f38); the
//     hit-slot fields a held rock writes (+0x1404 / +0x14bc = 20.0 / 0). shell00 modes 1..7, 9..15 and shell54
//     modes 1..3, 5..7 are not transcribed (no read command stream plays them, notes 9.11).
//   * spikes (em037_00): as the rocks (the owner's turn during M7 / M8 is NOT READ: input.owner.y instead); shell01
//     mode 1 (the ground impact c 30 of L0 M28 f20, L1 M1 f60, L1 M2 f2): not built -- its lifetime rests on the hit
//     slots and L1 M2's condition 0x6fe88 is not read (notes 6, 11); its data is in SHELL_DATA.
const f = Math.fround;

// ---- ROM constants (float literals as stored) -------------------------------------------------------------------
const RAD_TO_U16 = f(10430.3779296875);      // 0x4622f983 = 65536 / 2pi (0x3ff8cc, 0x3ffec0)
const U16_TO_RAD = f(9.58738019107841e-05);  // 0x38c90fdb = 2pi / 65536 (0x3ff578)
const U16_TO_DEG = f(0.0054931640625);       // 0x3bb40000 = 360 / 65536 (0x3ff774, 0x3fffc8)
const DEG_TO_U16 = f(182.04444885253906);    // 0x43360b61 = 65536 / 360 (0x3ff574)
const HALF_PI = f(1.5707963705062866);       // 0x3fc90fdb (0x7c3af0 / 0x7c3acc, negated)
const ENDING_FRAMES = f(f(30.0) * f(60.0));  // [0x162493c] = 30.0 times 60.0 (end 0x400280 / 0x42d550)
const SNAP = f(0.0005);                      // 0x3a03126f: a frame this close under an integer is that integer

const sinf = x => f(Math.sin(x)), cosf = x => f(Math.cos(x)), atan2f = (y, x) => f(Math.atan2(y, x));
const asinf = x => f(Math.asin(x)), acosf = x => f(Math.acos(x)), sqrtf = x => f(Math.sqrt(x));
// vcvt.s32.f32: round toward zero, saturating; NaN -> 0
const s32 = x => (x !== x) ? 0 : x >= 2147483647 ? 2147483647 : x <= -2147483648 ? -2147483648 : Math.trunc(x);
const u16 = x => x & 0xffff;
const mla = (acc, a, b) => f(acc + f(a * b));        // vmla.f32 (not fused): round the product, then the sum
const mls = (acc, a, b) => f(acc - f(a * b));        // vmls.f32
const nmls = (acc, a, b) => f(f(a * b) - acc);       // vnmls.f32: d = n*m - d

// ---- the data read from the ROM and the .arc ---------------------------------------------------------------------
// Per mode, the .shl (XFS 4aa69872, class rShell::cShellInfo 0x32003f1c: ShellScale f32, EffectParam, SoundParam,
// HitParam, ShellParam; the mode indexes ShellInfoList, 0x4a22f0..0x4a2584) names four files. `sh` is the ShellParam
// rFreeUseParam (FUP: ints / floats / vec3s; getters +0x44 / +0x4c / +0x54 = 0x3cb30c / 0x3cb330 / 0x3cb35c, an index
// past the end reads 0 / 0.0 / the zero vector). `ef` is the rShellEffectParam list (listId, uniqueId); `scale` is
// ShellScale. Values are the files' own, em043_05.arc.
export const SHELL_DATA = {
  em043_05: {
    name: 'Savage Deviljho',
    // the monster's effect lists by listId: the .shl EffectLists (rProofEffectList), index 0 in every em043_05 .shl
    lists: { 0: { list: 'u', pel: 'em043_05u' } },
    shells: {
      // global shell id 0xda (ctor 0xe727d0 stores it at enemy +0xcacc for variant 5); table 0x175c3e8[0xda] =
      // {uShellEm043_sp_04 DTI 0x188c928, uShellEmBase04::cSetupParamEmBase04 DTI 0x1885bf8, resource 0x8a2d};
      // class size 0x1650, ctor 0xe82924 (base 0x3ff080), vtable 0x17c0ff4 -- only slots 1, 5 and 83 (+0x14c, the
      // param reader 0xe82944) are its own, the rest is uShellEmBase04.
      shell04: {
        id: 0xda, cls: 'uShellEm043_sp_04', base: 'base04', folder: 'shell\\em\\em043_05_shell04',
        modes: {
          // em043_05_04_sh001 / _ef001 (mode 0 has no files: ShellInfoList[0] is all null)
          1: { scale: 1.0, ef: [[0, 60], [999, -1]],
               sh: { ints: [3, 6, 0, 0, -1], floats: [1200.0, 98.0, 200.0], vecs: [[0.0, -60.0, 60.0], [20.0, 0.0, 0.0]] } },
          // em043_05_04_sh002 / _ef002: only the beam length differs
          2: { scale: 1.0, ef: [[0, 70], [999, -1]],
               sh: { ints: [3, 6, 0, 0, -1], floats: [1700.0, 98.0, 200.0], vecs: [[0.0, -60.0, 60.0], [20.0, 0.0, 0.0]] } },
        },
      },
      // global shell id 0xdc (enemy +0xcad4); uShellEm043_sp_55 DTI 0x188c968 : uShellEmBase55 (setup DTI 0x18878a8),
      // size 0x1670, ctor 0xe83188 (base 0x42c484), vtable 0x17c12cc, param reader 0xe831a8 (+0x14c)
      shell55: {
        id: 0xdc, cls: 'uShellEm043_sp_55', base: 'base55', folder: 'shell\\em\\em043_05_shell55',
        modes: {
          // em043_05_55_sh000 / _ef000
          0: { scale: 1.0, ef: [[0, 70], [999, -1]],
               sh: { ints: [3, -1], floats: [1700.0, 42.0, 100.0], vecs: [[0.0, -120.0, 80.0], [0.0, 0.0, 0.0]] } },
        },
      },
      // THE ROCKS. `cmn` is the class's ShellCmnParam FUP (getters 0x4a2224 / 0x4a2264 / 0x4a22a8), shared by every
      // mode; `ef` are EffectParams 0.. (u.pel em043_05u: u 0 = cm202_200, joint -1, placement mode 0, end 1 -- the
      // flying rock, bound to the shell; u 10 = cm202_250 and u 20 = cm202_001, joint -1, placement mode 3 -- placed
      // at a contact; u 40 / 50 / 100 the same three for shell54 modes 4..7). ShellScale 1.0 in every entry.
      // global shell id 0xd8 (enemy +0xcac4 for variant 5); table 0x175c3e8[0xd8] = {uShellEm043_sp_00 DTI 0x188c8e8,
      // uShellEmBase00::cSetupParamEmBase00 DTI 0x1885948, resource 0x8a2b}; size 0x1660, ctor 0xe81ff4 (base
      // 0x3f8a04), vtable 0x17c0d08, param reader 0xe82304 (its +0x14c 0xe82028 takes it for id 0xd8)
      shell00: {
        id: 0xd8, cls: 'uShellEm043_sp_00', base: 'base00', folder: 'shell\\em\\em043_05_shell00',
        // em043_05_00: ints [joint gid], floats [flight time modes 0..7, modes 8..15], vecs [launch offset in the
        // joint's space, modes 0..11; modes 12..15]
        cmn: { ints: [4], floats: [72.0, 216.0], vecs: [[0.0, 200.0, 60.0], [0.0, -80.0, 300.0]] },
        modes: {
          // em043_05_00_ef000 / _sh000: floats [launch speed along +Z, along +Y], vecs [gravity per frame]
          0: { scale: 1.0, ef: [[0, 0], [0, 10], [0, 10], [0, 10]],
               sh: { ints: [], floats: [50.0, 12.5], vecs: [[0.0, -0.75, 0.0]] } },
          // em043_05_00_ef008 / _sh008
          8: { scale: 1.0, ef: [[0, 0], [0, 10], [0, 10], [0, 10]],
               sh: { ints: [], floats: [50.0, 0.0], vecs: [[0.0, -0.75, 0.0]] } },
        },
      },
      // global shell id 0xdb (enemy +0xcad0); uShellEm043_sp_54 DTI 0x188c948 : uShellEmBase54 (setup DTI 0x1887808),
      // size 0x1670, ctor 0xe82c30 (base 0x42ad30), vtable 0x17c115c, param reader 0xe82e8c (0xe82c64 takes it for
      // any id but 0xd8, 0xe82c70)
      shell54: {
        id: 0xdb, cls: 'uShellEm043_sp_54', base: 'base54', folder: 'shell\\em\\em043_05_shell54',
        // em043_05_54: ints [joint gid, bounces before the landing], floats [flight time, lift modes 0..3, lift modes
        // 4..7, bounce speed, bounce speed factor, horizontal speed factor at a bounce], vecs as shell00's
        cmn: { ints: [4, 2], floats: [240.0, 0.0, 120.0, 24.0, 0.8, 0.3], vecs: [[0.0, 200.0, 60.0], [0.0, -80.0, 300.0]] },
        modes: {
          // em043_05_54_ef000 / _sh000: EffectParams 0 flight, 1..3 landing by type, 4 first bounce, 5 later bounces
          0: { scale: 1.0, ef: [[0, 0], [0, 10], [0, 10], [0, 10], [0, 20], [0, 20]],
               sh: { ints: [], floats: [50.0, 12.5], vecs: [[0.0, -0.75, 0.0]] } },
          // em043_05_54_ef004 / _sh004: starts HELD at the joint until the motion passes 124
          4: { scale: 1.0, ef: [[0, 40], [0, 50], [0, 50], [0, 50], [0, 100], [0, 100]],
               sh: { ints: [], floats: [50.0, 12.5], vecs: [[0.0, -0.75, 0.0]] } },
        },
      },
    },
    // The attack actions that spawn them (status 7 switch 0xe7b1d4, table 0xe7b200), each read to its spawn.
    // `pick` is how the monster's command table chooses it (em043_00_cmdtbl in em043_05.arc; op 0x6f switch value
    // is enemy vtable +0x214 = 0xe80d28, arg 1 = 0xe80e30: on variant 5 it is 2 when ENRAGED (0x81670) else 1):
    //   'calm' / 'rage' = group 1 stream 3 (M25) or 8 (M26): switch(v1) { case 2: rage action; default: calm action }
    //   'chain' = only reached from another action's code, never from a clip start (see the notes).
    actions: [
      // 0xe78a24(e, r1, r2): phase 0 setMotion 0x219 (r1 0) / 0x21a (r1 1), blend 6 (r2 != 2); phase 1 spawns shell04
      // when the motion passes 130.0 (r1 0) / 136.0 (r1 1); variant 5: mode 1 when r2 == 0, else 2 (0xe78c38..0xe78da8)
      { action: [7, 0x06], code: 0xe78a24, args: [0, 0], list: '2', clip: 'Motion[25]', frame: 130.0, shell: 'shell04', mode: 1, pick: 'calm' },
      { action: [7, 0x31], code: 0xe78a24, args: [0, 1], list: '2', clip: 'Motion[25]', frame: 130.0, shell: 'shell04', mode: 2, pick: 'rage' },
      { action: [7, 0x07], code: 0xe78a24, args: [1, 0], list: '2', clip: 'Motion[26]', frame: 136.0, shell: 'shell04', mode: 1, pick: 'calm' },
      { action: [7, 0x32], code: 0xe78a24, args: [1, 1], list: '2', clip: 'Motion[26]', frame: 136.0, shell: 'shell04', mode: 2, pick: 'rage' },
      // chained from 0xe77650 when its motion passes 130 (0xe7796c); starts M26 at max(int(prev - 130) + 38, 0)
      { action: [7, 0x34], code: 0xe78a24, args: [1, 2], list: '2', clip: 'Motion[26]', frame: 136.0, shell: 'shell04', mode: 2, pick: 'chain' },
      // 0xe7af24(e, r1): setMotion 0x229 (r1 0) / 0x22a (r1 1), blend 2; spawns shell55 mode 0 when the motion passes
      // 86.0 (0xe7b0fc..0xe7b184). Chained from 0xe7a9f8's end: 0xe7ae28(e, 0) == 1 ? (7, 0x93) : (7, 0x94) (0xe7ad50)
      { action: [7, 0x93], code: 0xe7af24, args: [0], list: '2', clip: 'Motion[41]', frame: 86.0, shell: 'shell55', mode: 0, pick: 'chain' },
      { action: [7, 0x94], code: 0xe7af24, args: [1], list: '2', clip: 'Motion[42]', frame: 86.0, shell: 'shell55', mode: 0, pick: 'chain' },
      // THE ROCKS. 0xe78e34(e, r1, index, kind, sub): phase 0 setMotion 0x218 (L2 M24) for r1 0 / 2, 0x217 (M23) for
      // r1 1 / 3 (r1 0 -> 0x218 at 0xe78f8c, else 0x169e640 = [0x217, 0x218, 0x217][r1 - 1]), blend 2; phase 1 spawns
      // when the motion passes 114.0 (sub 0, [0xe78fdc]) / 108.0 (sub 1, [0xe78fd8]) -> 0xe78fec(e, index, kind, sub):
      // kind 0 -> shell00 mode 0x1592318[index], kind 2 -> shell00 mode 0x161f25c[sub*4 + index], kind 3 -> shell54
      // mode 0x161f27c[sub*4 + index]. `args` = (r1, index, kind, sub), read from each case body (status 7 switch
      // 0xe7b1d4, table 0xe7b200) to the call. r1 0 and 2 (1 and 3) give the same motion, shell, mode and frame; which
      // one a stream takes (ops 0x2e / 0x24) is not read. pick 'rock': the command table's group 1 stream 36 (shell00
      // mode 0), 56 (shell00 mode 8) and 57 (shell54 mode 0) issue them; WHICH stream the AI takes is NOT READ, so the
      // viewer's input.rock.variant chooses (rockActionFor). pick 'unread': no read command stream plays it; only a
      // forced input.action reaches it.
      { action: [7, 0x08], code: 0xe78e34, args: [0, 0, 0, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell00', mode: 0, pick: 'rock', variant: 'shell00_0' },
      { action: [7, 0x09], code: 0xe78e34, args: [1, 0, 0, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell00', mode: 0, pick: 'rock', variant: 'shell00_0' },
      { action: [7, 0x13], code: 0xe78e34, args: [2, 0, 0, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell00', mode: 0, pick: 'rock', variant: 'shell00_0' },
      { action: [7, 0x14], code: 0xe78e34, args: [3, 0, 0, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell00', mode: 0, pick: 'rock', variant: 'shell00_0' },
      { action: [7, 0x4e], code: 0xe78e34, args: [0, 0, 2, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell00', mode: 8, pick: 'rock', variant: 'shell00_8' },
      { action: [7, 0x4f], code: 0xe78e34, args: [1, 0, 2, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell00', mode: 8, pick: 'rock', variant: 'shell00_8' },
      { action: [7, 0x50], code: 0xe78e34, args: [2, 0, 2, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell00', mode: 8, pick: 'rock', variant: 'shell00_8' },
      { action: [7, 0x51], code: 0xe78e34, args: [3, 0, 2, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell00', mode: 8, pick: 'rock', variant: 'shell00_8' },
      { action: [7, 0x5e], code: 0xe78e34, args: [0, 0, 3, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell54', mode: 0, pick: 'rock', variant: 'shell54_0' },
      { action: [7, 0x5f], code: 0xe78e34, args: [1, 0, 3, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell54', mode: 0, pick: 'rock', variant: 'shell54_0' },
      { action: [7, 0x60], code: 0xe78e34, args: [2, 0, 3, 0], list: '2', clip: 'Motion[24]', frame: 114.0, shell: 'shell54', mode: 0, pick: 'rock', variant: 'shell54_0' },
      { action: [7, 0x61], code: 0xe78e34, args: [3, 0, 3, 0], list: '2', clip: 'Motion[23]', frame: 114.0, shell: 'shell54', mode: 0, pick: 'rock', variant: 'shell54_0' },
      // (7, 0x7e..0x81) (0xe7bbd8..0xe7bc2c -> 0xe7c084): kind 3, sub 1 -> shell54 mode 0x161f27c[4] = 4, at 108.0
      { action: [7, 0x7e], code: 0xe78e34, args: [0, 0, 3, 1], list: '2', clip: 'Motion[24]', frame: 108.0, shell: 'shell54', mode: 4, pick: 'unread' },
      { action: [7, 0x7f], code: 0xe78e34, args: [1, 0, 3, 1], list: '2', clip: 'Motion[23]', frame: 108.0, shell: 'shell54', mode: 4, pick: 'unread' },
      { action: [7, 0x80], code: 0xe78e34, args: [2, 0, 3, 1], list: '2', clip: 'Motion[24]', frame: 108.0, shell: 'shell54', mode: 4, pick: 'unread' },
      { action: [7, 0x81], code: 0xe78e34, args: [3, 0, 3, 1], list: '2', clip: 'Motion[23]', frame: 108.0, shell: 'shell54', mode: 4, pick: 'unread' },
    ],
  },

  // NARGACUGA (notes shells-em037.md). uEm037_00 (ctor 0xe46f28, vtable 0x17bc47c) serves em037_00 (variant byte
  // +0xb5f5 = 0) and Silverwind em037_04 (variant 4); its vtable +0x158 0xe47320 loads, for variant 0, the global
  // shells 0xc8 / 0xc9 (0x48b71c) and keeps them at enemy +0xcc94 / +0xcc98 (0xe47390..0xe473c8). Values below are the
  // files' own, em037_00.arc (C:\MHGU-Extract\scratch-em\em037_00\em037_00.arc). Each shell names its own effect
  // lists (the .shl's EffectLists): shell00's listId 0 is the u.pel, shell01's the c.pel.
  em037_00: {
    name: 'Nargacuga',
    shells: {
      // THE TAIL SPIKES. Global shell id 0xc8; table 0x175c3e8[0xc8] = {uShellEm037_sp_00 DTI 0x188c7c8,
      // uShellEmBase00::cSetupParamEmBase00 DTI 0x1885948, resource 0x8a1b}; size 0x1670, ctor 0xe59014 (base00 ctor
      // 0x3f8a04; +0x1660 = 0, byte +0x1665 = 1), vtable 0x17bd408. Its own slots: +0x13c init 0xe594d4 (-> base00
      // 0x3f8b80), +0x14c the reader 0xe59050, +0x150 the landing 0xe59334, +0x154 0xe595ac (Silverwind's modes 8 / 13
      // / 14 only), +0x158 the state-1 move 0xe5953c (-> base00 0x3f9738); the rest is uShellEmBase00's (vtable
      // 0x174e2e4: move +0x24 0x3f96a0, end +0x148 0x3f9ef4, ending +0x15c 0x3f986c, collision +0x168 0x3f99e0, Y
      // adjust +0x16c 0x3f9cc4, gravity +0x170 0x3f9f98).
      shell00: {
        id: 0xc8, cls: 'uShellEm037_sp_00', base: 'base00', folder: 'shell\\em\\em037_00_shell00',
        // the .shl em037_00_00: EffectLists[0] = effect\pel\em\em037_00u, the rest null; ShellCmnParam null
        lists: { 0: { list: 'u', pel: 'em037_00u' } },
        // em037_00_00_sh### (the reader, params37): ints [joint gid, X aimed, Y aimed, (not read), offset from the final
        // angles, byte +0x1664, angles from the setup, X word 0]: an int other than -1 sets the flag; floats [X
        // degrees, Y degrees (the spread), speed along +Z, flight time, X min, X max, Y min, Y max, speed along +Y];
        // vecs [launch offset in the joint's space, (not read), gravity per frame]. em037_00_00_ef###: EffectParams 0
        // the flying spike (u 0 = em037_00_007), 1 landing type 0 (u 2 = cm202_001), 2 landing type 1, the floor (u 1
        // = em037_00_002), 3 landing type 2, a hunter (u 3 = em037_00_000). ShellScale 1.0 in every entry.
        // ShellInfoList has 24 entries; 8 and 12..15 have no files, and no action spawns them.
        modes: {
          0: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, 0, -1, -1, -1, -1, 0, -1], floats: [0.0, -20.0, 65.0, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          1: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, -1, -1, -1, -1, -1, 0, -1], floats: [0.0, 0.0, 62.4, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          2: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, -1, -1, -1, -1, -1, 0, -1], floats: [0.0, 20.0, 63.7, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          3: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, -1, -1, -1, -1, -1, 0, -1], floats: [0.0, -40.0, 65.0, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          4: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, -1, -1, -1, -1, -1, 0, -1], floats: [0.0, -20.0, 62.4, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          5: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, -1, -1, -1, -1, -1, 0, -1], floats: [0.0, 0.0, 63.7, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          6: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, -1, -1, -1, -1, -1, 0, -1], floats: [0.0, 20.0, 65.0, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          // mode 7's vec 0 is (0, 0, 0): it launches from the joint itself (its (0, 0, 50) is vec 1, which is not read)
          7: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, -1, -1, -1, -1, -1, 0, -1], floats: [0.0, 40.0, 62.4, 400.0, 0.0, 0.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 0.0], [0.0, 0.0, 50.0], [0.0, 0.0, 0.0]] } },
          9: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
               sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, -20.0, 65.0, 400.0, -45.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          10: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 62.4, 400.0, -45.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          11: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 20.0, 63.7, 400.0, -45.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          16: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, -20.0, 65.0, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          17: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 62.4, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          18: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 20.0, 63.7, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          19: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, -40.0, 65.0, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          20: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, -20.0, 62.4, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          21: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 0.0, 63.7, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          22: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 20.0, 65.0, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
          23: { scale: 1.0, ef: [[0, 0], [0, 2], [0, 1], [0, 3]],
                sh: { ints: [143, 0, -1, -1, -1, -1, -1, -1], floats: [0.0, 40.0, 62.4, 400.0, 10.0, 45.0, 0.0, 0.0, 0.0], vecs: [[0.0, 0.0, 50.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] } },
        },
      },
      // Global shell id 0xc9; table 0x175c3e8[0xc9] = {uShellEm037_sp_01 DTI 0x188c7e8, uShellEmBase01::
      // cSetupParamEmBase01 DTI 0x18859e8, resource 0x8a1c}; size 0x1660, ctor 0xe597c4 (base01 ctor 0x3fa2f8),
      // vtable 0x17bd584: only +0x14c, the reader 0xe597e4, is its own (base01: init +0x13c 0x3fa498, move +0x24
      // 0x3faec4, end +0x148 0x3fb264). Mode 0 is what a spike drops at its floor contact (0xe593d8): its one
      // EffectParam (999, -1) is refused (0x4a11e4: listId > 7), so it never draws -- shells.js reports it as an event.
      // Mode 1 is the ground impact the per-frame 0xe47b0c spawns in three landing motions: not built (see the header).
      shell01: {
        id: 0xc9, cls: 'uShellEm037_sp_01', base: 'base01', folder: 'shell\\em\\em037_00_shell01',
        // the .shl em037_00_01: EffectLists[0] = effect\pel\em\em037_00c
        lists: { 0: { list: 'c', pel: 'em037_00c' } },
        // em037_00_01_sh### (the reader 0xe597e4): ints [!= -1: flag 0x80, 4, 8, 0x1000], floats [timer +0x1614 = +0x15f0],
        // vecs [+0x1608]; em037_00_01_ef###: c 30 = cm200_040
        modes: {
          0: { scale: 1.0, ef: [[999, -1]], sh: { ints: [-1, -1, -1, -1], floats: [0.0], vecs: [[0.0, 0.0, 0.0]] } },
          1: { scale: 1.0, ef: [[0, 30]], sh: { ints: [0, -1, -1, 0], floats: [0.0], vecs: [[0.0, 0.0, 0.0]] } },
        },
      },
    },
    // The spawner 0xe48fc8(e, xIdx, kind): the pitch offsets in degrees by xIdx (0x169dc74; xIdx is not checked) and
    // the modes by kind (the jump table 0xe49044), each mode one shell, created in that order.
    spawner: { fn: 0xe48fc8, xoff: [60.0, 40.0, 20.0, 10.0, 5.0],
               kinds: { 0: [0, 1, 2], 1: [3, 4, 5, 6, 7], 2: [9, 10, 11], 3: [16, 17, 18], 4: [19, 20, 21, 22, 23] } },
    // The actions. Every spike attack plays L2 Motion[7] then L2 Motion[8]; the spikes spawn when Motion[8] passes
    // 46.0. Status 7 switch 0xe4fe74 (number byte +0x73e1, table 0xe4fea4), each case body read to its call:
    //   0xe5181c(e, xIdx, kind) (bodies 0xe5034c..0xe50458, 0xe5074c): phase 0 setMotion 0x207 (L2 M7) blend 6.0,
    //     start 0.0; phase 1, kind 0: M7 cur >= 44.0 (0xb0968 mode 1) -> setMotion 0x208 (L2 M8) blend 4.0, start 0.0;
    //     kinds 1 / 2: M7's end (0xb09c8) -> setMotion 0x208 blend 0.0, start 0.0; phase 2: M8 passes 46.0 (0xb0968
    //     mode 0, the pass test of 0xb0974) -> 0xe48fc4 -> the spawner 0xe48fc8(e, xIdx, kind); M8's end -> +0x3dc.
    //   0xe55030(e, r1) (0x83 -> 0xe5075c r1 0, 0x84 -> 0xe5052c r1 1): phase 0 setMotion 0x207 blend 6.0, start 6.0;
    //     phase 1 M7 cur >= 44.0 -> setMotion 0x208 blend 4.0, start 0.0; phase 2 M8 passes 46.0 (0xb0974) -> the
    //     spawner 0xe48fc8(e, 0, r1 == 1 ? 4 : 3).
    // `spawnArgs` = the spawner's (xIdx, kind), `modes` = its modes for the kind. pick 'ai': issued by a read command
    // stream (enemy\cmd_tbl\em037_00_cmdtbl, op 0x00) or by a chain; which one the AI takes is NOT READ, so the viewer
    // names it (input.rock.variant = `variant`; pickVariantsFor lists them). pick 'unread': nothing read issues it;
    // only a forced input.action reaches it. The target is read only by kinds 2..4 (the aimed pitch).
    actions: [
      // g1 s8, s38, s73, s148: `16 00 00 | 16 01 07 | 00 07 28 | 16 01 0a | 00 07 29 | 16 01 14 | 00 07 2a | 16 02 |
      // 00 07 2b | 16 ff` (op 0x16's value and compare are NOT READ: a distance band is the notes' inference)
      { action: [7, 0x28], code: 0xe5181c, args: [0, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 0], modes: [0, 1, 2], pick: 'ai', variant: '7:0x28' },
      { action: [7, 0x29], code: 0xe5181c, args: [1, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [1, 0], modes: [0, 1, 2], pick: 'ai', variant: '7:0x29' },
      { action: [7, 0x2a], code: 0xe5181c, args: [2, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [2, 0], modes: [0, 1, 2], pick: 'ai', variant: '7:0x2a' },
      { action: [7, 0x2b], code: 0xe5181c, args: [3, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [3, 0], modes: [0, 1, 2], pick: 'ai', variant: '7:0x2b' },
      // g1 s22 `00 02 02 | 00 07 1b | 00 07 2c`, g1 s25 `00 02 02 | 00 07 2c`
      { action: [7, 0x2c], code: 0xe5181c, args: [4, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [4, 0], modes: [0, 1, 2], pick: 'ai', variant: '7:0x2c' },
      { action: [7, 0x2d], code: 0xe5181c, args: [0, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      { action: [7, 0x2e], code: 0xe5181c, args: [1, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [1, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      { action: [7, 0x2f], code: 0xe5181c, args: [2, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [2, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      { action: [7, 0x30], code: 0xe5181c, args: [3, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [3, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      { action: [7, 0x31], code: 0xe5181c, args: [4, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [4, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      { action: [7, 0x32], code: 0xe5181c, args: [0, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 0], modes: [0, 1, 2], pick: 'unread' },
      { action: [7, 0x33], code: 0xe5181c, args: [1, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [1, 0], modes: [0, 1, 2], pick: 'unread' },
      { action: [7, 0x34], code: 0xe5181c, args: [2, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [2, 0], modes: [0, 1, 2], pick: 'unread' },
      // chained: (7, 0x1d) (g1 s38) -> 0xe515d4(e, 2): L0 M27 -> L0 M28, which passing 92.0 sets (7, 0x35) (0xe51774,
      // 0x768c8); it throws exactly as (7, 0x2b)
      { action: [7, 0x35], code: 0xe5181c, args: [3, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [3, 0], modes: [0, 1, 2], pick: 'ai', variant: '7:0x35' },
      { action: [7, 0x36], code: 0xe5181c, args: [4, 0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [4, 0], modes: [0, 1, 2], pick: 'unread' },
      { action: [7, 0x37], code: 0xe5181c, args: [0, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      { action: [7, 0x38], code: 0xe5181c, args: [1, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [1, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      { action: [7, 0x39], code: 0xe5181c, args: [2, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [2, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      // chained: (7, 0x1e) (g1 s39) -> 0xe515d4(e, 3): L0 M27 -> L0 M28, which passing 92.0 sets (7, 0x3a) (0xe517a8)
      { action: [7, 0x3a], code: 0xe5181c, args: [3, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [3, 1], modes: [3, 4, 5, 6, 7], pick: 'ai', variant: '7:0x3a' },
      { action: [7, 0x3b], code: 0xe5181c, args: [4, 1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [4, 1], modes: [3, 4, 5, 6, 7], pick: 'unread' },
      // g0 s3 (after (2, 3) / (7, 0x1b)): aimed at the target, the pitch clamped to [-45, +45] degrees
      { action: [7, 0x82], code: 0xe5181c, args: [0, 2], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 2], modes: [9, 10, 11], pick: 'ai', variant: '7:0x82' },
      { action: [7, 0x83], code: 0xe55030, args: [0], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 3], modes: [16, 17, 18], pick: 'unread' },
      // g0 s4, s5, s6, g1 s38, s189: aimed, the pitch clamped to [+10, +45] degrees
      { action: [7, 0x84], code: 0xe55030, args: [1], list: '2', clip: 'Motion[8]', frame: 46.0, shell: 'shell00', spawner: 0xe48fc8, spawnArgs: [0, 4], modes: [19, 20, 21, 22, 23], pick: 'ai', variant: '7:0x84' },
    ],
  },
};

// The action the monster would be playing this clip in. A clip reached only by 'chain' has one action; a clip the
// command table picks by rage has two, and rage decides (the switch is evaluated when the action is chosen, i.e. at
// the motion's start). `force` = [status, number] overrides. Returns null when nothing in the table plays the clip.
export function actionFor(monId, list, clip, rage, force){
  const D = SHELL_DATA[monId];
  if (!D) return null;
  const cands = D.actions.filter(a => a.list === String(list) && a.clip === clip);
  if (force) return cands.find(a => a.action[0] === force[0] && a.action[1] === force[1]) || null;
  const byRage = cands.filter(a => a.pick === (rage ? 'rage' : 'calm'));
  if (byRage.length === 1) return byRage[0];
  const chained = cands.filter(a => a.pick === 'chain');
  // a clip played from its start is never the mid-motion (7, 0x34) entry
  const whole = chained.filter(a => !(a.action[0] === 7 && a.action[1] === 0x34));
  return whole.length === 1 ? whole[0] : null;
}

// The rocks a rock clip can throw, by the viewer's choice: which one the AI picks (command stream 36 / 56 / 57) is NOT
// READ, so the caller names it. Returns the first table entry (lowest status number) for that rock and clip, or null.
export const ROCK_VARIANTS = ['shell00_0', 'shell00_8', 'shell54_0'];
export function rockActionFor(monId, list, clip, variant){
  const D = SHELL_DATA[monId];
  if (!D || !variant) return null;
  return D.actions.find(a => a.pick === 'rock' && a.variant === variant && a.list === String(list) && a.clip === clip) || null;
}

// Any monster's viewer-named action: Savage's rocks (pick 'rock', the variants above -- rockActionFor's answer) and
// Nargacuga's tail spikes (pick 'ai', the variant is the action, '7:0x28' ... '7:0x84'). null when the clip has none.
export function variantActionFor(monId, list, clip, variant){
  const D = SHELL_DATA[monId];
  if (!D || !variant) return null;
  return D.actions.find(a => (a.pick === 'rock' || a.pick === 'ai') && a.variant === variant && a.list === String(list) && a.clip === clip) || null;
}

// The variants a clip's shells can be thrown with, in a fixed order (the actions table's), for the viewer to name one
// per play in input.rock.variant -- the AI's pick among them is NOT READ. Savage's rock clips (L2 Motion[23] / [24]):
// ROCK_VARIANTS; Nargacuga's spike clip (L2 Motion[8]): its issued actions '7:0x28', '7:0x29', '7:0x2a', '7:0x2b',
// '7:0x2c', '7:0x35', '7:0x3a', '7:0x82', '7:0x84'. Any other clip: [] (its shells, if any, need no pick). `clip` may
// carry a _start / _loop suffix.
export function pickVariantsFor(monId, list, clip){
  const D = SHELL_DATA[monId];
  if (!D || !clip) return [];
  const base = String(clip).replace(/_(start|loop)$/, '');
  const names = [];
  for (const a of D.actions)
    if ((a.pick === 'rock' || a.pick === 'ai') && a.variant && a.list === String(list) && a.clip === base && !names.includes(a.variant)) names.push(a.variant);
  return names;
}

// ---- joint reads -------------------------------------------------------------------------------------------------
// 0xc15a4(enemy, gid, out): the joint's world matrix (joint + 0x10, 0x539db0: index byte [[e+0x498] + gid], joint =
// [e+0x494] + index * 0xa0); a gid the model does not map falls back to gid 0.
function jointMatrix(joints, gid){
  const m = joints(gid);
  if (m) return m;
  return joints(0) || null;
}

// 0x7c3a38(out, m): Euler angles (radians) from a row-vector matrix
function eulerOf(m){
  if (!(m[9] < 1.0)) return { x: f(-HALF_PI), y: 0, z: f(-atan2f(m[2], m[0])) };            // 0x7c3ab4
  if (m[9] <= -1.0) return { x: HALF_PI, y: 0, z: atan2f(m[8], m[0]) };                      // 0x7c3ad8
  return { x: f(-asinf(m[9])), y: f(-atan2f(f(-m[8]), m[10])), z: f(-atan2f(f(-m[1]), m[5])) };
}

// 0x72dec(q, m): quaternion (x, y, z, w) from a matrix (Shoemake; next-axis table 0x159c504 = [1, 2, 0])
function quatOf(m){
  const q = [0, 0, 0, 0];
  const tr = f(f(m[0] + m[5]) + m[10]);
  if (tr > 0){
    let s = sqrtf(f(tr + 1.0));
    q[3] = f(s * 0.5);
    s = f(0.5 / s);
    q[0] = f(s * f(m[6] - m[9]));
    q[1] = f(s * f(m[8] - m[2]));
    q[2] = f(s * f(m[1] - m[4]));
    return q;
  }
  let i = m[5] > m[0] ? 1 : 0;
  if (m[10] > m[i * 5]) i = 2;
  const NEXT = [1, 2, 0], j = NEXT[i], k = NEXT[j];
  let s = sqrtf(f(f(f(m[i * 5] - m[j * 5]) - m[k * 5]) + 1.0));
  q[i] = f(s * 0.5);
  s = f(0.5 / s);
  q[3] = f(s * f(m[j * 4 + k] - m[k * 4 + j]));
  q[j] = f(s * f(m[i * 4 + j] + m[j * 4 + i]));
  q[k] = f(s * f(m[i * 4 + k] + m[k * 4 + i]));
  return q;
}

// 0x3ff778 (base04) / 0x42c950 (base55): the joint point and its angles. vec0 is transformed by the whole joint
// matrix (homogeneous, divided by w; w == 0 gives 0); angles: the matrix's Euler angles as u16, plus `angOff` on X --
// or, when the angle-mode int is 1, X = owner X angle + angOff, Y = atan2f(m[8], m[10]), Z = owner Z angle.
function jointPoint(M, vec0, angOff, angleMode, owner){
  const [x, y, z] = vec0;
  let w = f(y * M[7]); w = mla(w, x, M[3]); w = mla(w, z, M[11]); w = f(M[15] + w);
  const inv = w === 0 ? 0 : f(1.0 / w);
  let px = f(y * M[4]); px = mla(px, x, M[0]); px = mla(px, z, M[8]);
  let py = f(y * M[5]); py = mla(py, x, M[1]); py = mla(py, z, M[9]);
  let pz = f(y * M[6]); pz = mla(pz, x, M[2]); pz = mla(pz, z, M[10]);
  const P = [f(inv * f(M[12] + px)), f(inv * f(M[13] + py)), f(inv * f(M[14] + pz))];
  let A;
  if (angleMode === 1){
    const Y = atan2f(M[8], M[10]);                                           // 0x3ff8b4 (s0 = m[8], s1 = m[10])
    A = [u16((owner.x >>> 0) + angOff), u16(s32(mla(0.5, Y, RAD_TO_U16))), owner.z >>> 0];
  } else {
    const e = eulerOf(M);
    A = [u16(s32(mla(0.5, e.x, RAD_TO_U16)) + angOff), u16(s32(mla(0.5, e.y, RAD_TO_U16))), u16(s32(mla(0.5, e.z, RAD_TO_U16)))];
  }
  return { P, A };
}

// the direction the init and the moves build from the u16 angles: (0, 0, 1) turned by Z, X, Y as the compiler left
// it (the x and y terms multiply by the literal 0.0 and stay in, 0x3ff334 / 0x3ffb28 / 0x42c724)
function dirOf(A){
  const az = f(u16(A[2]) * U16_TO_RAD), ax = f(u16(A[0]) * U16_TO_RAD), ay = f(u16(A[1]) * U16_TO_RAD);
  const sz = sinf(az), cz = cosf(az), sx = sinf(ax), cx = cosf(ax), sy = sinf(ay), cy = cosf(ay);
  const a = f(sz * 0.0), b = f(cz * 0.0);
  const s = f(a + b), d = f(b - a);                         // (sin z * 0) + (cos z * 0), (cos z * 0) - (sin z * 0)
  const c = mla(cx, s, sx);                                 // cos x + s * sin x
  const dx = mla(f(d * cy), c, sy);                         // d*cos y + c*sin y
  const dy = nmls(sx, s, cx);                               // s*cos x - sin x
  const dz = mls(f(c * cy), d, sy);                         // c*cos y - d*sin y
  return [dx, dy, dz];
}

// 0x3ffe38 / 0x42d108: the effect aimed from the anchor E at the shell's position, in degrees for 0x329d04
function aimOf(pos, E, ownerZ){
  const dxz = f(pos[0] - E[0]), dzz = f(pos[2] - E[2]);
  const yaw = u16(s32(mla(0.5, atan2f(dxz, dzz), RAD_TO_U16)));
  const horiz = sqrtf(mla(f(dzz * dzz), dxz, dxz));
  const pitch = u16(s32(mla(0.5, atan2f(f(-f(pos[1] - E[1])), horiz), RAD_TO_U16)));
  return [f(pitch * U16_TO_DEG), f(yaw * U16_TO_DEG), f((ownerZ >>> 0) * U16_TO_DEG)];
}

// ---- the requester the ROM fills to start a shell's effect param (init 0x3ff648..0x3ff700, 0x42c80c..0x42c8c8) ----
// 0x4a10c8: +0x1c |= 3; +0xc0 = position (the anchor, shell +0x1000); +0xd0 = parent = shell vtable +0x130 = the
// shell's own model interface (shell +0xfd0, vtable 0x1764cd8, forwards to the shell's uModel slots); +0x14 |=
// 0x40000000 with +0x40..+0x48 = ShellScale; +4 = 0; byte +0xc = byte shell +0x1054 (not read). The init then sets
// +0x14 |= 2 with +0x30..+0x38 = (X deg, Y deg, 0). 0x4a11e4: listId must be <= 7 and uniqueId >= 0 (else no
// effect); +8 = 3; start = shell vtable +0x138 (0x4a119c -> 0x53a7d8(shell, list, 2, uniqueId, req, ...)).
function effectRequest(D, mode, param, E, A){
  const p = mode.ef[param];
  if (!p || p[0] > 7 || p[1] < 0) return null;
  const L = D.lists[p[0]];
  if (!L) return null;
  return { param, listId: p[0], list: L.list, pel: L.pel, key: p[1],
           requester: { position: E.slice(), rotationDeg: [f(A[0] * U16_TO_DEG), f(A[1] * U16_TO_DEG), 0.0],
                        scale: [f(mode.scale), f(mode.scale), f(mode.scale)], parent: 'shell',
                        flags14: 0x40000002, flags1c: 3, type8: 3 } };
}

// ---- base04 (uShellEmBase04): init 0x3ff1a0, move 0x3ff938 -> 0x3ffa10, end 0x400234 ----------------------------
function params04(sh){          // sp_04's reader 0xe82944 (its vtable +0x14c)
  const I = i => i < sh.ints.length ? sh.ints[i] : 0, F = i => i < sh.floats.length ? f(sh.floats[i]) : 0;
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  return { joint: I(0),                       // +0x1624
           count: I(1),                       // +0x1628: trail entries
           angleMode: I(2),                   // +0x1630: 1 = owner angles + yaw from the matrix
           flags: (I(3) !== -1 ? 1 : 0) | (I(4) !== -1 ? 2 : 0),   // +0x162c (0xe82a14..0xe82a64)
           length: F(0),                      // +0x1634 (0x43aa78's factor: not modelled, see the header)
           life: F(1),                        // +0x1638 -> timer +0x15cc
           start: F(2),                       // +0x163c: the anchor's distance along the direction
           vec0: V(0), vec1: V(1) };          // +0x1640 offset in joint space, +0x1644 .x = pitch offset (degrees)
}

function init04(S, sh, J, owner){
  const k = params04(S.mode.sh);
  S.k = k;
  const M = jointMatrix(J, k.joint);
  if (!M) return false;
  const angOff = u16(s32(mla(0.5, k.vec1[0], DEG_TO_U16)));
  const { P, A } = jointPoint(M, k.vec0, angOff, k.angleMode, owner);
  const [dx, dy, dz] = dirOf(A);
  const f2 = k.start;
  const ox = f(f2 * dx), oy = f(dy * f2), oz = f(f2 * dz);
  S.position = [f(P[0] + ox), f(oy + P[1]), f(oz + P[2])];           // +0x40
  if (k.count <= 0) return false;                                    // 0x3ff3d8: no trail -> delete
  const len = f(k.length - f2);
  const tx = f(dx * len), ty = f(dy * len), tz = f(dz * len);
  S.trail = [];                                                      // +0x15dc, count +0x15e0 (16-byte entries)
  for (let i = 0; i < k.count; i++){
    const t = f(f(k.count - i) / f(k.count));
    S.trail.push([mla(ox, tx, t), mla(oy, ty, t), mla(oz, tz, t)]);
  }
  S.timer = k.life;                                                  // +0x15cc
  S.shift = 0;                                                       // +0x15d0
  S.anchor = S.position.slice();                                     // +0x1000
  S.angles = A.slice();
  S.jointPoint = P;
  return true;
}

function move04(S, J, input, D){
  const k = S.k, owner = input.owner;
  S.prevPosition = S.position.slice();                               // +0x15f0
  const M = jointMatrix(J, k.joint);
  if (!M) return 'end';
  const angOff = u16(s32(mla(0.5, k.vec1[0], DEG_TO_U16)));
  const { P, A } = jointPoint(M, k.vec0, angOff, k.angleMode, owner);
  const [dx, dy, dz] = dirOf(A);
  const last = S.trail[S.trail.length - 1];
  S.position = [f(P[0] + last[0]), f(P[1] + last[1]), f(P[2] + last[2])];      // 0x3ffb80..0x3ffba0
  let ex, ey, ez;
  if (!(k.flags & 1)){ ex = f(dx * k.start); ey = f(dy * k.start); ez = f(dz * k.start); }
  else {                                                                       // 0x3ffbf4: along the oldest entry
    let s = f(last[1] * last[1]); s = mla(s, last[0], last[0]); s = mla(s, last[2], last[2]);
    const r = f(k.start * f(1.0 / sqrtf(s)));
    ex = f(last[0] * r); ey = f(last[1] * r); ez = f(last[2] * r);
  }
  S.anchor = [f(ex + P[0]), f(ey + P[1]), f(ez + P[2])];                       // +0x1000
  const len = k.length;                     // +0x15d4; flag 2 calls vtable +0x158 = 0x400564 (bx lr): unchanged
  S.trail[0] = [f(dx * len), f(dy * len), f(dz * len)];
  S.shift = mla(S.shift, input.dt, 0.5);                                       // 0x3ffcec
  while (S.shift >= 1.0){                                                      // 0x3ffd10: every entry moves one down
    for (let i = S.trail.length - 1; i >= 1; i--) S.trail[i] = S.trail[i - 1].slice();
    S.shift = f(S.shift + -1.0);
  }
  S.angles = A.slice();                                                        // +0xfe8
  S.jointPoint = P;
  return lifetime(S, input, D);
}

// ---- base55 (uShellEmBase55): init 0x42c5cc, move 0x42cb28 -> 0x42cc34, end 0x42d504 ---------------------------
function params55(sh){          // sp_55's reader 0xe831a8
  const I = i => i < sh.ints.length ? sh.ints[i] : 0, F = i => i < sh.floats.length ? f(sh.floats[i]) : 0;
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  return { joint: I(0),                       // +0x1644
           angleMode: I(1),                   // +0x164c
           length: F(0),                      // +0x1650
           life: F(1),                        // +0x1654 -> timer +0x15cc
           start: F(2),                       // +0x1658
           vec0: V(0), vec1: V(1) };          // +0x165c, +0x1660
}

function init55(S, sh, J, owner){
  const k = params55(S.mode.sh);
  S.k = k;
  const M = jointMatrix(J, k.joint);
  if (!M) return false;
  const angOff = u16(s32(mla(0.5, k.vec1[0], DEG_TO_U16)));
  const { P, A } = jointPoint(M, k.vec0, angOff, k.angleMode, owner);
  S.quat = quatOf(M);                                                // 0x42c950 -> 0x72dec(shell +0x1620, m)
  const [dx, dy, dz] = dirOf(A);
  S.position = [mla(P[0], k.start, dx), mla(P[1], dy, k.start), mla(P[2], k.start, dz)];   // 0x42c7a4
  S.timer = k.life;
  S.grow = 0;                                                        // +0x1610
  S.acc = 0;                                                         // +0x1614
  S.anchor = S.position.slice();
  S.angles = A.slice();
  S.jointPoint = P;
  return true;
}

function move55(S, J, input, D){
  const k = S.k, owner = input.owner;
  S.prevPosition = S.position.slice();
  const M = jointMatrix(J, k.joint);
  if (!M) return 'end';
  const angOff = u16(s32(mla(0.5, k.vec1[0], DEG_TO_U16)));
  const { P, A } = jointPoint(M, k.vec0, angOff, k.angleMode, owner);
  const qj = quatOf(M);
  const [dx, dy, dz] = dirOf(A);
  const step = f(input.dt * input.speed);                                    // 0xb0910: owner +0x1c * +0x50c
  S.grow = Math.min(mla(S.grow, step, 0.125), 1.0);                          // 0x42cd90 (vmin with 1.0)
  S.acc = f(step + S.acc);                                                   // 0x42cdd0
  if (S.acc >= 8.0){                                                         // 0x42ce3c: slerp toward the joint
    const t = f(8.0 / S.acc), q = S.quat;
    let dot = f(qj[1] * q[1]); dot = mla(dot, qj[0], q[0]); dot = mla(dot, qj[2], q[2]); dot = mla(dot, qj[3], q[3]);
    const neg = 0 > dot, c = neg ? f(-dot) : dot, sign = neg ? -1.0 : 1.0;
    let w1, w2 = t;
    if (c < f(0.9999998807907104)){                                          // 0x3f7ffffe
      const th = acosf(c);
      const inv = f(1.0 / sinf(th));
      w1 = f(sinf(f(f(1.0 - t) * th)) * inv);
      w2 = f(inv * sinf(f(t * th)));
    } else w1 = f(1.0 - t);
    const a = f(sign * w1);
    S.quat = [mla(f(qj[0] * a), q[0], w2), mla(f(qj[1] * a), q[1], w2), mla(f(qj[2] * a), q[2], w2), mla(f(qj[3] * a), q[3], w2)];
    S.acc = 8.0;
  }
  const [x, y, z, w] = S.quat;
  const lg = f(k.length * S.grow);                                           // +0x15d4
  const lgg = f(lg * S.grow);
  S.anchor = [mla(P[0], dx, k.start), mla(P[1], dy, k.start), mla(P[2], dz, k.start)];   // 0x42cfac..0x42cfe0
  const y2 = f(y + y), z2 = f(z + z), x2 = f(x + x);
  const ax = mla(f(y2 * w), x, z2);                                          // 2yw + 2xz
  const ay = mls(f(y * z2), x2, w);                                          // 2yz - 2xw
  const az = f(1.0 - mla(f(y * y2), x, x2));                                 // 1 - (2y^2 + 2x^2)
  S.position = [mla(P[0], ax, lgg), mla(P[1], ay, lgg), mla(P[2], az, lgg)];
  S.angles = A.slice();
  S.jointPoint = P;
  return lifetime(S, input, D);
}

// the end test both bases share (0x3ffd98 / 0x42d044): the timer runs on the OWNER's step (0xb0910); the shell ends
// when it runs out or the owner's motion is no longer the one it spawned in (+0x15d8 vs enemy +0x4b4)
function lifetime(S, input){
  let T = S.timer;
  if (T > 0){ T = f(T - f(input.dt * input.speed)); if (S.base === 'base04') T = T > 0 ? T : 0; else if (T < 0){ S.timer = 0; return 'end'; } S.timer = T; }
  if (!(T > 0)) return 'end';
  if (S.motion !== input.motion) return 'end';
  return 'keep';
}

// ---- base00 / base54: the thrown rocks (shell00, shell54), notes section 9 -------------------------------------------
// shell00 = uShellEm043_sp_00 : uShellEmBase00 -- init 0x3f8b80 (after the reader 0xe82304), move 0x3f96a0 -> 0x3f9738
// (state 1) / ending 0x3f986c, landing 0x3f8878, end 0x3f9ef4. shell54 = uShellEm043_sp_54 : uShellEmBase54 -- init
// 0x42aecc (reader 0xe82e8c), move 0x42b874 -> 0x42b980 / ending inline at 0x42b908, bounce 0x42bec8..0x42bff0,
// landing 0x42ac38, end 0x42c0c0. Every float operation below is the VFP instruction the code runs, in its order
// (vmla / vmls round the product first; vcvt.s32 = s32; ldrh / uxth = u16); library calls are Math.* rounded to
// float32. dev/shells-rock-check.mjs runs these flights against the ROM itself (the Unicorn harness in
// efx\agents\rock-scratch), move by move, bit for bit.
const SEG_EPS = f(1.1920928955078125e-07);  // 0x34000000 = 2^-23: a query segment shorter than this is not asked (0x183584)
const RAD_TO_DEG = f(57.2957763671875);     // 0x42652ee0 (0x43ae38)
const SLOPE_LIMIT = f(90.0);                // +0x15c4 = 90.0 (enemy-shell base ctor 0x43a78c): a surface this steep is type 0
const BOUNCE_UP = f(10.0);                  // vmov.f32 s4, #10.0 (0x42bee4)
const atanf = x => f(Math.atan(x));

// 9.3, the launch point p: the joint's world matrix M turns the common vec v by its 3x3 and adds row 3 -- no w divide
// (reader 0xe820e0..0xe82110, init 0x3f8e90..0x3f8ec0 + 0x3f9140.., base54 0x42b1ec..0x42b21c + 0x42b45c.. and
// 0x42b734..0x42b780: the same operations everywhere)
function launchPoint(M, v){
  const [x, y, z] = v;
  const ox = mla(mla(f(y * M[4]), x, M[0]), z, M[8]);
  const oy = mla(mla(f(y * M[5]), x, M[1]), z, M[9]);
  const oz = mla(mla(f(y * M[6]), x, M[2]), z, M[10]);
  return [f(ox + M[12]), f(oy + M[13]), f(oz + M[14])];
}

// 9.3, the pitch offset of shell00 modes 0..3 (reader 0xe82234..0xe822e4) and of every shell54 mode (0x42b6a4,
// 0x42b730..0x42b810): from the target's height over p and its horizontal distance; clamped to +22.5 / -11.25 degrees
function aimLinear(p, T){
  const dy = f(T[1] - p[1]), dx = f(p[0] - T[0]), dz = f(p[2] - T[2]);
  const a = s32(f(f(f(dy + 65.0) / 10.0) * 48.0));
  const h = sqrtf(mla(mla(0.0, dx, dx), dz, dz));
  const b = s32(f(f(f(h + -2100.0) / 50.0) * 96.0));
  const d = u16(-(b + a));
  return d < 0x8000 ? Math.min(d, 0x1000) : Math.max(d, 0xf800);
}

// 9.3, the pitch offset of shell00 modes 8..15: 0xe810e4(owner, &p, v = 50.0, g = 0.75) (literals 0xe82130 /
// 0xe82134) solves the launch at speed v under gravity g aimed 50 above the target (literal 0xe81250) and keeps the
// steeper root, the high lob; relative to the owner's X angle
function aimBallistic(p, T, X, v, g){
  const dx = f(p[0] - T[0]), dz = f(p[2] - T[2]);
  const d = sqrtf(mla(mla(0.0, dx, dx), dz, dz));
  const A = f(f(f(d * d) * g) / f(f(v * v) + f(v * v)));
  const B = f(d / A), C = f(f(f(T[1] - p[1]) + 50.0) / A);
  let D = nmls(f(C + 1.0), f(B * B), 0.25);                  // vnmls: (B*B) * 0.25 - (C + 1)
  D = D !== D ? D : (D > 0 ? D : 0);                          // vmax with 0.0 (0xe8118c): NaN stays NaN
  const r = sqrtf(D), hB = f(B * 0.5);
  const a1 = s32(mla(0.5, atanf(f(r - hB)), RAD_TO_U16));
  const a2 = s32(mla(0.5, atanf(f(f(-r) - hB)), RAD_TO_U16));
  const mag = a => u16((a & 0x8000) ? 0x10000 - a : a);      // 0xe811fc..0xe81228
  return u16((mag(a1) > mag(a2) ? a1 : a2) - X);
}

// 9.4.5, the launch velocity (0x3f91a0..0x3f928c; base54 0x42b4c8..0x42b5b4): (0, vy, vz) turned by Z, then X, then Y
// (each angle word's low half, ldrh, times 9.58738e-05); the literal 0.0 products stay in
function launchVelocity(vy, vz, A){
  const rz = f(u16(A[2]) * U16_TO_RAD), sz = sinf(rz), cz = cosf(rz);
  const x1 = mls(f(cz * 0.0), vy, sz), y1 = mla(f(vy * cz), sz, 0.0);
  const rx = f(u16(A[0]) * U16_TO_RAD), sx = sinf(rx), cx = cosf(rx);
  const y2 = mls(f(y1 * cx), vz, sx), z2 = mla(f(vz * cx), y1, sx);
  const ry = f(u16(A[1]) * U16_TO_RAD), sy = sinf(ry), cy = cosf(ry);
  return [mla(f(x1 * cy), z2, sy), y2, mls(f(z2 * cy), x1, sy)];
}

// 9.4.4, the per-frame acceleration +0x1020 (base00 vtable +0x170 = 0x3f9f98, base54 +0x164 = 0x42c164): the sh vec
// turned by Y (its x is not read); set once, at the init
function gravityOf(g, Yword){
  const ry = f(u16(Yword) * U16_TO_RAD), sy = sinf(ry), cy = cosf(ry);
  return [mla(f(cy * 0.0), g[2], sy), g[1], mls(f(g[2] * cy), sy, 0.0)];
}

// 0x539224, the flying step: t = the shell's dt (+0x1c) times vtable +0x90 (0x5392f8: 1.0), h = t*t*0.5; per axis
// pos += h*acc + vel*t (the velocity before this step), then vel += t*acc
function stepFlight(S, dt){
  const t = f(dt * 1.0), h = f(f(t * t) * 0.5), p = S.position, v = S.velocity, a = S.gravity;
  S.position = [0, 1, 2].map(i => f(mla(f(h * a[i]), v[i], t) + p[i]));
  S.velocity = [0, 1, 2].map(i => mla(v[i], t, a[i]));
}

// 0x183490's front and the stage, for the segment from the previous point B (anchor + off) to the new A (position +
// off). The ROM's own part: |A - B|^2 below 2^-23 is not queried (0x183560..0x18358c). The rest -- 0xc30b30, the
// stage's collision core -- is NOT READ; THE PLANE STAND-IN answers for it (the viewer's floor at floorY, not a ROM
// value): hit iff B.y >= y0 > A.y; contact c = B + t (A - B) per axis with t = (B.y - y0) / (B.y - A.y), c.y = y0;
// normal (0, 1, 0), attribute 0x10 (the ROM's own value for a hit with no attribute record, 0x183628). No floor
// given this step: nothing to hit.
function stageQuery(A, B, floorY){
  const dy = f(A[1] - B[1]), dx = f(A[0] - B[0]), dz = f(A[2] - B[2]);
  let d2 = f(dy * dy); d2 = mla(d2, dx, dx); d2 = mla(d2, dz, dz);
  if (d2 < SEG_EPS) return null;
  if (floorY == null) return null;
  const y0 = floorY;
  if (!(B[1] >= y0 && A[1] < y0)) return null;
  const t = f(f(B[1] - y0) / f(B[1] - A[1]));
  return { point: [f(B[0] + f(t * f(A[0] - B[0]))), y0, f(B[2] + f(t * f(A[2] - B[2])))], normal: [0, 1, 0], attr: 0x10 };
}

// 0x43addc..0x43ae58, the hit type: attribute & 0x22 -> 0; else 1, and 0 when the surface's angle from level
// reaches +0x15c4 (an unordered compare keeps 1). The ROM adds n.z twice where n.z^2 would be (0x43ae10 / 0x43ae14).
function hitType(attr, n){
  if (attr & 0x22) return 0;
  let s = f(n[1] * n[1]); s = mla(s, n[0], n[0]); s = f(n[2] + s); s = f(n[2] + s);
  return f(acosf(f(n[1] / sqrtf(s))) * RAD_TO_DEG) >= SLOPE_LIMIT ? 0 : 1;
}

// 0x43ac8c(shell, &out, &type, &result, off). Its hit path -- the hit slot +0x13ae != 0xff, the rock's attack having
// connected, type 2 at the hit position -- needs a hunter and never runs here; so the stage query: +0x15c2 == 0 ->
// mask 0x30, +0x15c3 == 0 -> 0x4a1e84 (base00: A = +0x40, B = +0x1000) or 0x4a1f68 (base54: both plus off) ->
// 0x183490; a nonzero return is a hit, typed as above.
function collide(S, off, floorY){
  const add = P => [f(P[0] + off[0]), f(P[1] + off[1]), f(P[2] + off[2])];
  const q = off ? stageQuery(add(S.position), add(S.anchor), floorY) : stageQuery(S.position, S.anchor, floorY);
  return q ? { point: q.point, normal: q.normal, attr: q.attr, type: hitType(q.attr, q.normal) } : null;
}

// The requester a rock fills (0x4a10c8 at 0x3f92e4, 0x3f8934, 0x42b60c, 0x42bfc8, 0x42acf4): +0xc0 = the given point,
// +0xd0 = the shell's model interface (shell +0xfd0: vtable +0x130), +0x14 |= 0x40000000 with ShellScale x3; the
// bases write nothing more, so NO rotation override (the breath's +0x14 |= 2). 0x4a11e4 refuses listId > 7 or
// uniqueId < 0. `kind`: 'flight' (param 0, on the shell), 'bounce' / 'landing' (at the contact). `lists`: the shell's
// own .shl EffectLists when its class names them (Nargacuga), else the monster's.
function rockRequest(D, mode, param, point, kind, lists){
  const p = mode.ef[param];
  if (!p || p[0] > 7 || p[1] < 0) return null;
  const L = (lists || D.lists)[p[0]];
  if (!L) return null;
  const s = f(mode.scale);
  return { param, listId: p[0], list: L.list, pel: L.pel, key: p[1], kind,
           requester: { position: point.slice(), rotationDeg: null, scale: [s, s, s], parent: 'shell',
                        flags14: 0x40000000, flags1c: 3, type8: 3 } };
}

// sp_00's reader 0xe82304: what base00 reads, from the mode's files and the common FUP
function params00(def, mode, idx){
  const c = def.cmn, sh = mode.sh, late = (idx & 0xf8) === 8;
  return { joint: c.ints[0],                                  // +0x15dc: common int 0
           flight: f(c.floats[late ? 1 : 0]),                 // +0x15fc: common float [mode & 0xf8 == 8] (0xe8238c)
           flags: 0x20 | (late ? 0x40 : 0),                   // +0x15e8: angles from the setup; 0x40 keeps them (0xe823ac)
           vz: f(sh.floats[0]), vy: f(sh.floats[1]),          // +0x15f4 / +0x15f8: sh floats 0 / 1
           vec: c.vecs[(idx & 0xfc) === 0xc ? 1 : 0].map(f),  // +0x1610: &common vec [(mode & 0xfc) == 0xc] (0xe82430)
           gravity: sh.vecs[0].map(f) };                      // +0x161c: &sh vec 0
}

// sp_54's reader 0xe82e8c
function params54(def, mode, idx){
  const c = def.cmn, sh = mode.sh, late = (idx & 0xfc) === 4;
  return { joint: c.ints[0],                                  // +0x15e4: common int 0
           bounces: c.ints[1],                                // +0x15f0: common int 1, bounces before the landing
           vz: f(sh.floats[0]), vy: f(sh.floats[1]),          // +0x1608 / +0x160c: sh floats 0 / 1
           flight: f(c.floats[0]),                            // +0x1610
           lift: f(c.floats[late ? 2 : 1]),                   // +0x1614: common float 1, modes 4..7 float 2 (0xe82ea8, 0xe83020)
           bounceSpeed: f(c.floats[3]),                       // +0x1618
           bounceFactor: f(c.floats[4]),                      // +0x161c
           across: f(c.floats[5]),                            // +0x1620: the horizontal speed factor at a bounce
           holdEnd: f(124.0),                                 // +0x1624 = 124.0 (0xe83080..0xe83098)
           vec: c.vecs[late ? 1 : 0].map(f),                  // +0x1628: &common vec [(mode & 0xfc) == 4]
           gravity: sh.vecs[0].map(f),                        // +0x162c: &sh vec 0
           flags: late ? 0x104 : 4,                           // +0x15fc (0xe8305c..0xe8307c; the ctor leaves 0)
           motions: [0x218, 0x217] };                         // +0x15f4 / +0x15f8: the rock motions, L2 M24 / M23
}

// base00 init 0x3f8b80 with the reader's aim. J = the joint matrices built for the previous pose; `got` = the inputs
// that are not read (target, owner angles).
function init00(S, def, J, got){
  const k = S.k = params00(def, S.mode, S.modeIndex);
  const M = jointMatrix(J, k.joint);                    // 0xc15a4 (reader 0xe820a4, init 0x3f8d70)
  if (!M) return false;
  const p = launchPoint(M, k.vec);
  // the aim by mode (0xe82120..: 0x4a0ee4 = the mode): 8..15 the lob, 0..3 the linear offset; 4..7 (0xe82178, the
  // direct angle) is not transcribed -- no read stream plays those modes
  let d;
  if (S.modeIndex >= 8 && S.modeIndex <= 15) d = aimBallistic(p, got.target, got.ownerX, f(50.0), f(0.75));
  else if (S.modeIndex <= 3) d = aimLinear(p, got.target);
  else return false;
  const setup = [(got.ownerX + d) >>> 0, got.ownerY, 0];  // setup +0x20 = X + d, +0x24 = Y, +0x28 = 0 (0xe82204..)
  // flag 0x20: the angle words are the setup's (0x3f8c9c); the init then adds 0 to X and Y (0x3f9378 / vtable +0x16c:
  // flag bits 0 / 1 clear, the degree offsets +0x15ec / +0x15f0 are 0 from the ctor)
  S.angles = setup.slice();
  S.timer = k.flight;                                   // +0x162c = +0x15fc
  S.position = p;                                       // +0x40 = row 3 + offset (0x3f8d74, 0x3f9140..0x3f9168)
  S.anchor = p.slice();                                 // +0x1000 (0x3f916c..0x3f918c)
  S.gravity = gravityOf(k.gravity, S.angles[1]);        // +0x1020
  S.velocity = launchVelocity(k.vy, k.vz, S.angles);    // +0x1010
  S.launch = { point: p.slice(), target: got.target.slice(), aim: d, setup, angles: S.angles.slice(),
               position: S.position.slice(), anchor: S.anchor.slice(), velocity: S.velocity.slice(),
               gravity: S.gravity.slice(), timer: S.timer };
  return true;
}

// base54 init 0x42aecc (its aim 0x42b6a4 runs right after the reader)
function init54(S, def, J, got){
  const k = S.k = params54(def, S.mode, S.modeIndex);
  const M = jointMatrix(J, k.joint);                    // 0xc15a4 (0x42b0c8; the aim's own read 0x42b6fc)
  if (!M) return false;
  const p = launchPoint(M, k.vec);
  const d = aimLinear(p, got.target);
  const setup = [(got.ownerX + d) >>> 0, got.ownerY, 0];  // 0x42b81c..0x42b830
  S.held = (k.flags & 0x100) !== 0;                     // byte +7 = 1 unless flag 0x100 (0x42af50..0x42af78)
  S.offset = [0, f(-k.lift), 0];                        // +0x1660..+0x1668: the ctor's zero vector, y = -lift (0x42af94)
  S.bounceSpeed = k.bounceSpeed;                        // +0x1654 = +0x1618
  S.bounces = 0;                                        // +0x1650 (ctor)
  S.angles = setup.slice();                             // flag 4: the setup's words (0x42aff4); X / Y += 0 (+0x1600 / +0x1604)
  S.timer = k.flight;                                   // +0x1634 = +0x1610
  S.position = [p[0], f(k.lift + p[1]), p[2]];          // 0x42b45c..0x42b490: y = lift + (o.y + m13)
  S.anchor = S.position.slice();
  S.gravity = gravityOf(k.gravity, S.angles[1]);        // vtable +0x164
  S.velocity = launchVelocity(k.vy, k.vz, S.angles);    // 0x42b4c8..0x42b5b4, (vy, vz) = (+0x160c, +0x1608)
  S.launch = { point: p.slice(), target: got.target.slice(), aim: d, setup, angles: S.angles.slice(),
               position: S.position.slice(), anchor: S.anchor.slice(), velocity: S.velocity.slice(),
               gravity: S.gravity.slice(), timer: S.timer, held: S.held };
  return true;
}

// the flight timer (base00 0x3f9760..0x3f97f8 on +0x162c, base54 0x42b9a8..0x42ba00 on +0x1634): 'query' goes on to
// the collision, 'end' ends the shell. A flight time <= 0 takes another branch (0x3f97bc / 0x42ba04: the hit-slot
// bytes +0x13ad / +0x1465), not transcribed -- every transcribed mode's is positive.
function flightTimer(S, flight, dt){
  if (!(flight > 0)) throw new Error('shells.js: a rock with flight time ' + flight + ' (0x3f97bc / 0x42ba04, not transcribed)');
  const T = S.timer;
  if (!(T > 0)){ S.timer = 0; return 'end'; }                       // ble
  const t = f(T - dt);
  S.timer = (0 >= t) ? 0 : t;                                        // vselge
  return t > 0 ? 'query' : 'end';                                    // bhi
}

// a bounce's or landing's start: the param's requester at the contact point, handle -> +0x1628 (base00) / +0x163c
// (base54), over the previous one. A param the mode lacks is not started and leaves the handle as it was.
function contactStart(S, D, param, point, kind){
  if (!S.mode.ef[param]) return;
  const rq = rockRequest(D, S.mode, param, point, kind, listsOf(D, S));
  S.events.push(rq ? { ev: 'start', param, kind, start: rq } : { ev: 'refused', param, kind });
  S.effect2 = rq ? { param, key: rq.key, kind, move: S.moves } : null;
  if (rq && S.effects[param]) S.effects[param].started = true;
}

// vtable +0x150 (base00 0x3f8878, base54 0x42ac38): by the type, EffectParam 1 (type 0), 2 (type 1) or 3 (type 2) at
// the contact point (types 0 / 1 first call 0x43ac04 with +0x15e0 / +0x15e4, base54 +0x15e8 / +0x15ec: -1 from the
// ctors, so it returns at once); the caller then ends the shell (vtable +0x148 with 0)
function landing(S, D, hit){
  const param = [1, 2, 3][hit.type];
  if (param) contactStart(S, D, param, hit.point, 'landing');
}

// base54's bounce (0x42bec8..0x42bff0): type 1 with fewer than +0x15f0 bounces so far
function bounce(S, D, hit){
  const k = S.k, c = hit.point, v = S.velocity;
  S.position = [c[0], f(f(c[1] + BOUNCE_UP) + k.lift), c[2]];      // w = 0
  S.velocity = [f(k.across * v[0]), S.bounceSpeed, f(k.across * v[2])];
  const param = S.bounces === 0 ? 4 : 5;                             // subeq at 0x42bf68: EffectParam 4 first, then 5
  S.bounceSpeed = f(S.bounceSpeed * k.bounceFactor);                 // 0x42bf6c
  contactStart(S, D, param, c, 'bounce');                            // handle -> +0x163c
  S.bounces += 1;
}

// base00's state-1 move (0x3f9738)
function move00(S, ctx, D){
  const k = S.k;
  S.anchor = S.position.slice();                        // 0x3f98f4 (vtable +0x160): anchor = position, then the step
  stepFlight(S, ctx.dt);
  if (!(k.flags & 0x40)){                               // 0x3f9948..0x3f99d0: X / Y from the new velocity, as u16
    const [vx, vy, vz] = S.velocity;
    const h = sqrtf(mla(f(vz * vz), vx, vx));
    S.angles = [u16(s32(mla(0.5, atan2f(f(-vy), h), RAD_TO_U16))), u16(s32(mla(0.5, atan2f(vx, vz), RAD_TO_U16))), S.angles[2]];
  }
  const r = flightTimer(S, k.flight, ctx.dt);
  if (r !== 'query') return r;
  const hit = collide(S, null, ctx.floorY);             // vtable +0x168 = 0x3f99e0
  if (!hit) return 'keep';
  S.events.push({ ev: 'hit', point: hit.point, type: hit.type });
  (LANDING[S.cls] || landing)(S, D, hit);               // vtable +0x150: base00's 0x3f8878 unless the class has its own
  return 'end';
}

// base54's state-1 move (0x42b980)
function move54(S, J, ctx, D){
  const k = S.k;
  S.anchor = S.position.slice();                        // vtable +0x15c = 0x42c020; base54 never turns its angles
  stepFlight(S, ctx.dt);
  const r = flightTimer(S, k.flight, ctx.dt);
  if (r !== 'query') return r;
  if (S.held){                                          // byte +7 == 0 (0x42ba24..0x42baf4)
    // held while the owner plays a rock motion (u16 +0x4b4 == +0x15f8 / +0x15f4) and 0xb09a4(owner, 2, 0, 124.0,
    // 0.0) -- 0x72714 mode 2 on the frame pair the enemy's action code saw this frame: F[k-1] < 124
    if ((ctx.ownerMotion === k.motions[0] || ctx.ownerMotion === k.motions[1]) && ctx.frameSeen < k.holdEnd){
      const M = jointMatrix(J, k.joint);                // 0x42bb04: this frame's joints (the shell moves after the build)
      if (M) S.position = launchPoint(M, k.vec);        // no lift; the velocity keeps integrating
    } else S.held = false;                              // release: byte +7 = 1 (0x42b6a4 re-aims into the setup; nothing reads it, 9.9)
  }
  const hit = collide(S, S.offset, ctx.floorY);         // 0x42bdd0: off = &+0x1660
  if (!hit) return 'keep';
  S.events.push({ ev: 'hit', point: hit.point, type: hit.type });
  if (hit.type === 1 && S.bounces < k.bounces){ bounce(S, D, hit); return 'keep'; }
  landing(S, D, hit);
  return 'end';
}

// one rock's move this step (vtable +0x24: base00 0x3f96a0, base54 0x42b874)
function stepRock(S, J, ctx, input, D, out){
  S.events = [];
  S.place = null;                                       // the shell never places its effect (no 0x329c9c / 0x329d04)
  const alive = h => input.effectAlive ? !!input.effectAlive(S, h.param, h) : true;
  // a handle whose unit left states 1 / 2 is dropped first (0x3f96ac..0x3f9700, 0x42b880..0x42b8e4)
  if (S.effect && !S.effect.gone && !alive(S.effect)) S.effect.gone = true;
  if (S.effect2 && !S.effect2.gone && !alive(S.effect2)) S.effect2.gone = true;
  if (S.state === 1){
    S.moves++;
    const r = S.base === 'base00' ? move00(S, ctx, D) : move54(S, J, ctx, D);
    for (const e of S.events){
      if (e.ev === 'start') out.started.push({ shell: S, start: e.start });
      else if (e.ev === 'create') out.created.push({ shell: S, create: e });   // a shell the move created (0x48b884)
    }
    if (r === 'end'){                                   // vtable +0x148 with 0 (0x3f9ef4 / 0x42c0c0)
      end(S);
      if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
      out.ended.push(S);
    }
  } else if (S.state === 0xfe){                         // the ending (0x3f986c / 0x42b908): wait for the effects
    const T = S.timer;
    if (!(T > 0)){ S.timer = 0; S.state = 0xff; }                                    // ble: delete
    else {
      const t = f(T - ctx.dt);
      S.timer = (0 >= t) ? 0 : t;
      if (t <= 0) S.state = 0xff;                                                    // bls: delete
      else if (!(S.effect && !S.effect.gone) && !(S.effect2 && !S.effect2.gone)) S.state = 0xff;   // both handles gone
    }
  }
}

// the rock's inputs the ROM takes from the game and this module does not read: all required, no defaults
function rockInputs(input){
  const r = input.rock, o = input.owner, t = r && r.target;
  if (!r) return { why: 'no input.rock' };
  if (!t || !Number.isFinite(t.x) || !Number.isFinite(t.y) || !Number.isFinite(t.z)) return { why: 'no target (input.rock.target)' };
  if (!Number.isFinite(r.floorY)) return { why: 'no floor (input.rock.floorY)' };
  if (!o || !Number.isFinite(o.y)) return { why: 'no owner facing (input.owner.y)' };
  return { target: [f(t.x), f(t.y), f(t.z)], ownerX: o.x >>> 0, ownerY: o.y >>> 0 };
}

// the owner's motion id (enemy u16 +0x4b4) of a List 2 clip: 0x200 + its slot (0x217 = Motion[23], 0x219 = Motion[25],
// 0x229 = Motion[41]: sections 4 and 6); null otherwise (only 0x217 / 0x218 are ever compared)
function motionIdOf(list, clip){
  const m = /^Motion\[(\d+)\]$/.exec(clip || '');
  return String(list) === '2' && m ? 0x200 + Number(m[1]) : null;
}

const isRockAction = (D, a) => { const d = D.shells[a.shell]; return !!d && (d.base === 'base00' || d.base === 'base54'); };
// the joint a shell's init reads (base01 -- Nargacuga's shell01 -- reads none)
const shellJoint = (def, mode) => def.base === 'base01' ? null : def.cmn ? def.cmn.ints[0] : mode.sh.ints[0];
// the effect lists a shell's requests name: its own .shl's when the data gives them per shell, else the monster's
const listsOf = (D, S) => (D.shells[S.shell] && D.shells[S.shell].lists) || D.lists;

function spawnRock(state, D, a, J, ctx, got){
  const def = D.shells[a.shell], mode = def && def.modes[a.mode];
  if (!mode) return null;                                             // a mode not transcribed
  const S = { id: state.nextId++, monId: state.monId, shell: a.shell, cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: a.mode, action: a.action, spawnFrame: a.frame, motion: ctx.motion, state: 1,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null, trail: null,
              timer: 0, moves: 0, bounces: 0, held: false, launch: null, events: [], folder: def.folder,
              effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (D.lists[listId] || {}).list || null, key, started: false }));
  const ok = def.base === 'base00' ? init00(S, def, J, got) : init54(S, def, J, got);
  if (!ok) return null;
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight');           // EffectParam 0 at +0x40 -> +0x1624 / +0x1638
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return S;
}

// ---- Nargacuga's tail spikes: base00 with uShellEm037_sp_00's own reader, init path and landing ------------------------
// Notes shells-em037.md sections 2..5. The flight is base00's, exactly as Savage's rock above (move 0x3f96a0 -> the
// class's state-1 move 0xe5953c -> 0x3f9738: move00 / stepRock); what is the class's own is below: the reader
// 0xe59050 (params37), base00's init 0x3f8b80 as it runs with that reader's flags (init37: the angle words, the X
// adjust 0x3f9378 with the aim 0x3f9b58 and the circular clamp, the Y adjust 0x3f9cc4), the landing 0xe59334
// (landing37, with the shell01 drop 0xe593d8), and the spawner 0xe48fc8, which makes all of an action's spikes at
// once. dev/shells-spike-check.mjs runs them against the ROM's flights (efx\agents\narga-shell-scratch\
// narga-spike-reference.json: 0xe48fc8, 0xe59014, 0xe594d4 and 0x3f96a0 run on the ROM), move by move, bit for bit.

// sp_00's reader 0xe59050 (vtable +0x14c): what base00 reads, from the mode's ShellParam (getters 0x4a2470 / 0x4a24f8 /
// 0x4a2584; an index past a file's end reads 0 / 0.0 / the zero vector)
function params37(sh){
  const I = i => i < sh.ints.length ? sh.ints[i] : 0, F = i => i < sh.floats.length ? f(sh.floats[i]) : 0;
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  // +0x15e8 (0xe590f4..0xe591c0): bit 0 = int 1 != -1, bit 1 = int 2 != -1, bit 2 always, bit 3 = int 4 != -1, bit 5
  // (0x20) = int 6 != -1, bit 9 (0x200) = int 7 != -1; every other bit keeps base00's ctor 0 (0x3f8ab0). em037_00:
  // 0x25 (mode 0), 0x24 (modes 1..7), 0x05 (modes 9..23), as the ROM leaves them after the init
  const flags = (I(1) !== -1 ? 1 : 0) | (I(2) !== -1 ? 2 : 0) | 4 | (I(4) !== -1 ? 8 : 0) | (I(6) !== -1 ? 0x20 : 0) |
                (I(7) !== -1 ? 0x200 : 0);
  return { joint: I(0),                    // +0x15dc: sh int 0 (143)
           flags,
           xDeg: F(0), yDeg: F(1),         // +0x15ec / +0x15f0: the X / Y offsets, degrees
           vz: F(2),                       // +0x15f4: launch speed along +Z
           vy: F(8),                       // +0x15f8: along +Y (float 8, read before float 3)
           flight: F(3),                   // +0x15fc: flight time
           xLo: F(4), xHi: F(5),           // +0x1600 / +0x1604: the X clamp, degrees
           yLo: F(6), yHi: F(7),           // +0x1608 / +0x160c: the Y clamp
           vec: V(0),                      // +0x1610 = &vec 0: the launch offset in the joint's space
           gravity: V(2),                  // +0x161c = &vec 2 (+0x1614 = 0; +0x1618 keeps the ctor's zero vector)
           b1664: I(5) !== -1 };           // byte +0x1664: 0x43b2b0 after each move (0xe59574) -- 0 in every em037_00 mode
}

// 0x3f9b58(shell, &aX, &aY, from, T, off): the angles from `from` to the target T, as u16. off = [+0x1618], which
// base00's ctor points at the zero vector (0x3f8a98) and this reader leaves: its branch runs with (0, 0, 0) -- the
// yaw it turns the offset by and the additions are kept as the ROM computes them (they add signed zeros); it also
// writes +0x1640..+0x1648 = T + the turned offset, which nothing reads after the init.
function aim37(from, T){
  let dx = f(T[0] - from[0]), dy = f(T[1] - from[1]), dz = f(T[2] - from[2]);
  const off = [0, 0, 0];
  const r = f(u16(s32(mla(0.5, atan2f(dx, dz), RAD_TO_U16))) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const ox = mla(f(off[0] * cs), off[2], sn), oz = mls(f(off[2] * cs), off[0], sn);     // 0x3f9bf4..0x3f9c04
  dy = f(dy + off[1]); dz = f(dz + oz); dx = f(dx + ox);                                // 0x3f9c14..0x3f9c28
  const Y = s32(mla(0.5, atan2f(dx, dz), RAD_TO_U16));                                  // 0x3f9c54..0x3f9c84
  const h = sqrtf(mla(f(dz * dz), dx, dx));
  const X = s32(mla(0.5, atan2f(f(-dy), h), RAD_TO_U16));                               // 0x3f9c9c..0x3f9cb0
  return { X: u16(X), Y: u16(Y) };
}

// the circular clamp of a 32-bit angle v to [lo, hi] (X 0x3f9530..0x3f9588, Y 0x3f9e80..0x3f9ed8): d = u16(v - lo),
// r = u16(hi - lo); d <= r keeps u16(v); else the nearer end, hi when (0x8000 | r >> 1) > d, else lo
function clampCircular(v, lo, hi){
  const d = u16(v - lo), r = u16(hi - lo);
  if (d <= r) return u16(v);
  return u16((0x8000 | (r >>> 1)) > d ? hi : lo);
}

// 0x3f9378: the X adjust. Flag 1 clear: the X offset +0x15ec in degrees, as u16. Flag 1 set (this reader always sets
// flag 4: the aim starts at the launch point p): the aim's X from p to the target minus the owner's X word, plus the
// offset (32-bit), clamped to [+0x1600, +0x1604]. `got.target` is null only for a kind that never depends on it: the
// one aimed mode among them (mode 0) has lo == hi, and then the clamp gives lo whatever the aim.
function xAdjust37(k, p, got){
  const deg = s32(mla(0.5, k.xDeg, DEG_TO_U16));
  if (!(k.flags & 1)) return u16(deg);
  if (!(k.flags & 4)) throw new Error('shells.js: base00 X aim from the owner (flag 4 clear, 0x3f93f0..0x3f9498): not transcribed');
  const lo = s32(mla(0.5, k.xLo, DEG_TO_U16)), hi = s32(mla(0.5, k.xHi, DEG_TO_U16));
  if (!got.target){
    if (u16(hi - lo) === 0) return u16(lo);
    throw new Error('shells.js: an aimed spike without a target');
  }
  return clampCircular(deg + (aim37(p, got.target).X - got.ownerX), lo, hi);
}

// vtable +0x16c = 0x3f9cc4: the Y adjust, the same with flag 2, the aim's Y minus the owner's Y word, the offset
// +0x15f0 and the clamp [+0x1608, +0x160c]. No em037_00 mode sets flag 2: every spike takes its spread, +0x15f0.
function yAdjust37(k, p, got){
  const deg = s32(mla(0.5, k.yDeg, DEG_TO_U16));
  if (!(k.flags & 2)) return u16(deg);
  if (!(k.flags & 4)) throw new Error('shells.js: base00 Y aim from the owner (flag 4 clear, 0x3f9d3c..0x3f9de4): not transcribed');
  const lo = s32(mla(0.5, k.yLo, DEG_TO_U16)), hi = s32(mla(0.5, k.yHi, DEG_TO_U16));
  if (!got.target){
    if (u16(hi - lo) === 0) return u16(lo);
    throw new Error('shells.js: an aimed spike without a target');
  }
  return clampCircular(deg + (aim37(p, got.target).Y - got.ownerY), lo, hi);
}

// base00's init 0x3f8b80 after the reader 0xe59050 (sp_00's init 0xe594d4 calls it, then keeps a hunter unit at
// +0x1660 = 0xc2df8(...) that only Silverwind's +0x154 reads). `setup` = the spawner's angle words (setup +0x20..+0x28);
// J = the joints built for the previous pose; `got` = the inputs not read (the owner's words, the target).
function init37(S, J, got, setup){
  const k = S.k = params37(S.mode.sh);
  if (k.b1664) throw new Error('shells.js: byte +0x1664 set (0x43b2b0 after each move): not transcribed');
  if (k.flags & 8) throw new Error('shells.js: base00 flag 8 (the offset from the final angles, 0x3f9040..): not transcribed');
  // the angle words (0x3f8c60..0x3f8cac): flag 0x20 -> the setup's; else the owner's X (0 with flag 0x200), Y and 0
  const A = (k.flags & 0x20) ? setup.slice() : [(k.flags & 0x200) ? 0 : got.ownerX, got.ownerY, 0];
  S.timer = k.flight;                                   // state 1; timer +0x162c = +0x15fc (0x3f8cb0..0x3f8cc8)
  // the launch point: flag 0x10 is never set by this reader, so the joint +0x15dc (-1 would take the owner's own
  // matrix: no em037_00 mode); M = its world matrix (0xc15a4), position = row 3; flag 8 clear: the offset vec 0
  // through M's 3x3 (0x3f8e70..0x3f8ec0), p = row 3 + offset (0x3f8fb0..0x3f8fdc; flag 0x80, the owner's scale 0xbe518,
  // is never set by this reader)
  if (k.joint === -1) throw new Error('shells.js: a base00 shell on the owner\'s own matrix (+0x15dc == -1): not transcribed');
  const M = jointMatrix(J, k.joint);
  if (!M) return false;
  const p = launchPoint(M, k.vec);
  const ax = xAdjust37(k, p, got), ay = yAdjust37(k, p, got);
  A[0] = (A[0] + ax) >>> 0;                             // +0xfe8 += the X adjust, 32-bit (0x3f8fe8..0x3f8ff4)
  A[1] = (A[1] + ay) >>> 0;                             // +0xfec += the Y adjust (0x3f9030..0x3f9038)
  S.angles = A;
  S.position = p;                                       // (flags & 0x108) != 8: +0x40 = p (0x3f9140..0x3f9168)
  S.anchor = p.slice();                                 // +0x1000 (0x3f916c..0x3f918c)
  S.gravity = gravityOf(k.gravity, A[1]);               // vtable +0x170 = 0x3f9f98 with vec 2
  S.velocity = launchVelocity(k.vy, k.vz, A);           // 0x3f91a0..0x3f928c: (0, +0x15f8, +0x15f4) turned by Z, X, Y
  S.launch = { setup: setup.slice(), point: p.slice(), target: got.target ? got.target.slice() : null, flags: k.flags,
               xAdjust: ax, yAdjust: ay, angles: S.angles.slice(), position: S.position.slice(), anchor: S.anchor.slice(),
               velocity: S.velocity.slice(), gravity: S.gravity.slice(), timer: S.timer };
  return true;
}

// Nargacuga's landing, vtable +0x150 = 0xe59334(shell, &contact, &result, type): only in state 1; type 1 (the floor)
// first drops shell01 (0xe593d8), then EffectParam 2 (+0x15d0); type 0 EffectParam 1 (+0x15cc); type 2 (a hunter:
// never here) EffectParam 3 (+0x15d4); any other type none. 0x3f8970 starts it at the contact (handle -> +0x1628; a
// null param starts nothing -- contactStart), byte +0x1665 = 0, then the end (vtable +0x148 with 0: the caller's).
// Unlike base00's 0x3f8878 there is no 0x43ac04 call.
function landing37(S, D, hit){
  if (hit.type === 1) dropShell01(S, D, hit.point);
  const param = [1, 2, 3][hit.type];
  if (param) contactStart(S, D, param, hit.point, 'landing');
}

// 0xe593d8(shell, &contact): owner active (0x4a0f38) -> a setup (0x40 bytes, 0x3fa2bc): vtable 0x174e638 + 8, +4 =
// [owner +0xcc98] (0xc9), +8 = mode 0, +0xc = the owner, +0x10..+0x18 = the contact, +0x1c = 0, +0x20..+0x28 = the zero
// vector, +0x2c = 0, +0x30..+0x38 = the spike's angle words +0xfe8..+0xff0, halfword +0x3c = shell +0x13dc (a hit field,
// not read); 0x48b884(mgr, setup, 0, 0). shell01 mode 0's init (base01 0x3fa498) sits at the contact with those angles
// and starts its only EffectParam, (999, -1), which 0x4a11e4 refuses (listId > 7): it never draws. Its hit and its
// lifetime are not visual here, so it is reported as an event ('create'), not stepped as a shell.
function dropShell01(S, D, point){
  const def = D.shells.shell01, mode = def && def.modes[0];
  const start = mode ? rockRequest(D, mode, 0, point, 'shell01', def.lists) : null;
  S.events.push({ ev: 'create', shell: 'shell01', id: def ? def.id : null, cls: def ? def.cls : null, mode: 0,
                  position: point.slice(), angles: S.angles.slice(), start, refused: !start });
}

// vtable +0x150 by class, where the class has its own
const LANDING = { uShellEm037_sp_00: landing37 };

// 0xe48fc8(e, xIdx, kind): the setups of an action's shells. off = s32(mla(0.5, [0x169dc74 + 4 xIdx], 182.04445)); X =
// the owner's X word + u16(off) (uxtah, 32-bit); Y, Z = the owner's words through vcvt.f32.u32 then vcvt.u32.f32 (exact
// below 2^24); kind > 4 makes nothing (0xe49018); kinds 0 / 1 set +0x20..+0x28 = (X, Y, Z), kinds 2..4 the vector at
// 0x1620e60 = (0, 0, 0); the modes by kind (0xe49044), created in that order with 0x48b884(mgr, setup, 0, 0).
function spawner37(D, xIdx, kind, got){
  const sp = D.spawner, modes = sp.kinds[kind];
  if (!modes) return [];
  const cvt = w => { const x = f(w >>> 0); return x >= 4294967295 ? 4294967295 : Math.trunc(x); };
  const words = kind <= 1 ? [(got.ownerX + u16(s32(mla(0.5, f(sp.xoff[xIdx]), DEG_TO_U16)))) >>> 0, cvt(got.ownerY), cvt(got.ownerZ)]
                          : [0, 0, 0];
  return modes.map(mode => ({ mode, setup: words.slice() }));
}

// the spikes' inputs the ROM takes from the game and this module does not read: the floor and the owner's facing Y
// (required), the owner's X / Z words (0 when not given: the viewer's untilted monster), the target (required by the
// aimed kinds 2..4 only; kinds 0 / 1 never depend on it)
function spikeInputs(input, kind){
  const r = input.rock, o = input.owner, t = r && r.target;
  if (!r) return { why: 'no input.rock' };
  const hasT = !!t && Number.isFinite(t.x) && Number.isFinite(t.y) && Number.isFinite(t.z);
  if (kind >= 2 && !hasT) return { why: 'no target (input.rock.target)' };
  if (!Number.isFinite(r.floorY)) return { why: 'no floor (input.rock.floorY)' };
  if (!o || !Number.isFinite(o.y)) return { why: 'no owner facing (input.owner.y)' };
  return { target: hasT ? [f(t.x), f(t.y), f(t.z)] : null, ownerX: (o.x || 0) >>> 0, ownerY: o.y >>> 0, ownerZ: (o.z || 0) >>> 0 };
}

// every shell of the action, in the spawner's order, each inited on the joints of the previous pose; each starts its
// EffectParam 0 at its launch point (0x3f928c..0x3f9300: requester at +0x40, parent shell +0xfd0, ShellScale, no
// rotation; handle -> +0x1624). All of them then move once in the same step (line 18).
function spawnSpikes(state, D, a, J, ctx, got){
  const def = D.shells[a.shell], lists = def.lists, made = [];
  for (const { mode: m, setup } of spawner37(D, a.spawnArgs[0], a.spawnArgs[1], got)){
    const mode = def.modes[m];
    if (!mode) continue;                                 // no ShellInfoList files for the mode (none of em037_00's kinds)
    const S = { id: state.nextId++, monId: state.monId, shell: a.shell, cls: def.cls, globalId: def.id, base: def.base,
                mode, modeIndex: m, action: a.action, spawnFrame: a.frame, motion: ctx.motion, state: 1,
                position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null, trail: null,
                timer: 0, moves: 0, bounces: 0, held: false, launch: null, events: [], folder: def.folder,
                effect: null, effect2: null, start: null, place: null, stop: null };
    S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
    if (!init37(S, J, got, setup)) continue;
    S.prevPosition = S.position.slice();
    S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
    S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
    if (S.start) S.effects[0].started = true;
    made.push(S);
  }
  return made;
}

// ---- the step ------------------------------------------------------------------------------------------------------
export function createShellState(monId){
  return { monId, data: SHELL_DATA[monId] || null, motion: null, action: null, hist: null, prevJoints: null,
           shells: [], nextId: 1, frames: 0 };
}

// a frame within 0.0005 under an integer is that integer (0x94ef64..0x94ef94, the motion advance; 0x72854 the test)
function snapFrame(x){
  const a = s32(f(x + SNAP)), b = s32(x);
  return a !== b ? f(a) : f(x);
}

// input: { monId, list, clip (base name, no _start/_loop), frame (60/s, _loop clips offset by their _start),
//          loopStart? (for a _loop clip: its _start clip's length in frames, where the motion loops back to),
//          joints: gid => 16 floats (game convention, this step's pose) or null,
//          rage (the viewer's Enraged state), action?: [status, number] to force, speed? (motion speed, 1),
//          dt? (unit step, 1), owner?: { x, y, z } (u16 angles, 0 for the viewer's untilted monster; y, the facing,
//          forward = (sin Y, 0, cos Y), is read only by the rocks and the spikes and is required by them; the spikes
//          also read x and z),
//          rock?: { variant: 'shell00_0' | 'shell00_8' | 'shell54_0' | null, target: { x, y, z } | null,
//                   floorY: number } -- the rocks' inputs that are NOT READ from the game (the AI's pick of the rock,
//                   the target its aim reads, the stage it hits: a plane at floorY); no rock without all of them.
//                   Nargacuga's spikes read the same object: variant = the action, '7:0x28' .. '7:0x84'
//                   (pickVariantsFor(monId, list, clip) lists a clip's names), the target only for the aimed
//                   '7:0x82' / '7:0x84', the floor always; owner.y (the facing) always, owner.x / .z as given (0),
//          effectAlive?: (shell, param, handle) => bool }
// returns { spawned, started, ended, removed, alive, refused, created }. spawned / ended / removed / alive are shells;
// each carries `start` (spawned: the effect request), `place` (each moving step: what 0x329c9c / 0x329d04 give the
// effect; always null for a rock or a spike) and `stop` (ended: 0x329c40(h, 0) when 0x43b058 says). `started`: the
// effects a shell's move started this step, { shell, start } in ROM order (a rock's bounce / landing, a spike's
// landing). `refused`: a rock or spike action whose spawn test passed without its inputs, { action, shell, mode |
// modes, why }. `created`: the shells a move created that are not stepped here, { shell, create } -- a spike's shell01
// drop at its floor contact ({ shell: 'shell01', id 0xc9, mode 0, position, angles, start: null, refused: true }: it
// never draws). A request's `pel` names the effect list its key is in (Savage 'em043_05u'; Nargacuga's spikes
// 'em037_00u').
// A rock also carries, every step: position (+0x40, after the step), anchor (+0x1000, the position before it), angles
// (the three u32 words +0xfe8 / +0xfec / +0xff0, as the ROM keeps them), velocity (+0x1010), timer, moves, bounces,
// held, events (this step's move: { ev: 'hit' | 'start' | 'stop', ... } in ROM order), launch (what the init left),
// effect (the flying effect's handle, param 0) and effect2 (the last bounce / landing effect's handle).
export function stepShells(state, input){
  const out = { spawned: [], started: [], ended: [], removed: [], alive: [], refused: [], created: [] };
  const D = state.data;
  if (!D) return out;
  state.frames++;
  const ctx = { dt: f(input.dt == null ? 1.0 : input.dt), speed: f(input.speed == null ? 1.0 : input.speed),
                owner: input.owner || { x: 0, z: 0 }, motion: input.clip ? input.monId + '|' + input.list + '|' + input.clip : null,
                // the rocks: this step's stage floor, the owner's motion id (u16 +0x4b4), the frame its action code saw
                floorY: input.rock && Number.isFinite(input.rock.floorY) ? f(input.rock.floorY) : null,
                ownerMotion: input.clip ? motionIdOf(input.list, input.clip) : null, frameSeen: null };
  const J = typeof input.joints === 'function' ? input.joints : (() => null);
  const frame = input.clip ? snapFrame(input.frame) : 0;
  // THE MOTION. A new clip is a new motion id. A frame that went back is either the motion's own loop -- a _loop
  // clip wrapping to its start (input.loopStart, the _start clip's length as driveClipEffects computes it) -- or the
  // viewer replaying a clip that does not loop, which for the game is the same action issued again (same motion
  // id, so a live shell is not ended by it).
  let fresh = false;
  const back = !!(state.hist && frame < state.hist[1]);
  if (ctx.motion !== state.motion || (back && input.loopStart == null)){
    state.motion = ctx.motion;
    state.action = ctx.motion ? actionFor(input.monId, input.list, input.clip, !!input.rage, input.action) : null;
    state.hist = [frame, frame];
    fresh = true;
  }
  state.loopStart = input.loopStart == null ? null : snapFrame(input.loopStart);
  // 1. line 4, the enemy: its action code tests the previous advance, (F[k-2], F[k-1]], on last frame's joints.
  // A rock clip (L2 M23 / M24) has no action the table picks by itself: which rock the monster throws is the command
  // stream the AI takes (NOT READ), so input.rock.variant names it -- read at each spawn test. Nargacuga's spike clip
  // (L2 M8) the same: the variant names the action.
  const a = state.action || (input.action ? null : variantActionFor(input.monId, input.list, input.clip, input.rock && input.rock.variant));
  if (a && !fresh && state.prevJoints){
    const [prev, cur] = state.hist, F = a.frame;
    // 0x72b1c: cur >= f && prev < f; after the motion looped (0x7294c): (loopStart <= f && cur >= f) || prev < f
    const passed = prev <= cur ? (!(cur < F) && prev < F)
                               : ((state.loopStart != null && state.loopStart <= F && !(cur < F)) || prev < F);
    if (passed && a.spawner === 0xe48fc8){
      // Nargacuga's spawner: every shell of the action in this step, each inited here and moved below
      const got = spikeInputs(input, a.spawnArgs[1]);
      if (got.why) out.refused.push({ action: a.action, shell: a.shell, modes: a.modes.slice(), why: got.why });
      else for (const S of spawnSpikes(state, D, a, state.prevJoints, ctx, got)){ out.spawned.push(S); state.shells.push(S); }
    } else if (passed && isRockAction(D, a)){
      const got = rockInputs(input);
      if (got.why) out.refused.push({ action: a.action, shell: a.shell, mode: a.mode, why: got.why });
      else {
        const S = spawnRock(state, D, a, state.prevJoints, ctx, got);
        if (S){ out.spawned.push(S); state.shells.push(S); }
      }
    } else if (passed){
      const S = spawn(state, D, a, state.prevJoints, ctx);
      if (S){ out.spawned.push(S); state.shells.push(S); }
    }
  }
  ctx.frameSeen = state.hist ? state.hist[1] : null;               // F[k-1], for a held rock (0xb09a4)
  // 2. line 18, the shells, in the order they were made: each one's move (vtable +0x24) on this frame's joints
  for (const S of state.shells){
    if (S.base === 'base00' || S.base === 'base54'){ stepRock(S, J, ctx, input, D, out); continue; }
    const alive = p => (input.effectAlive ? !!input.effectAlive(S, p) : true);
    if (S.state === 1){
      if (S.effect && !alive(0)) S.effect.gone = true;                // 0x3ff944: a dead handle is cleared
      const r = S.base === 'base04' ? move04(S, J, ctx, D) : move55(S, J, ctx, D);
      S.place = (S.effect && !S.effect.gone) ? { param: 0, position: S.anchor.slice(), rotationDeg: aimOf(S.position, S.anchor, ctx.owner.z) } : null;
      if (r === 'end'){ end(S); out.ended.push(S); }
    } else if (S.state === 0xfe){                                     // 0x3ff998 / 0x42cbbc: waiting for the effect
      S.place = null;
      let T = S.timer;
      if (!(T > 0)){ S.timer = 0; S.state = 0xff; }
      else {
        T = f(T - ctx.dt); S.timer = 0 >= T ? 0 : T;
        const any = (S.effect && !S.effect.gone && alive(0)) || (S.effect2 && alive(1));
        if (!(T > 0) || !any) S.state = 0xff;
      }
    }
  }
  for (const S of state.shells) if (S.state === 0xff) out.removed.push(S);
  state.shells = state.shells.filter(S => S.state !== 0xff);
  out.alive = state.shells.slice();
  // (no motion yet -- the viewer shows the monster before any clip plays -- leaves hist unset; a motion's start sets it)
  state.hist = [state.hist ? state.hist[1] : frame, frame];
  // the joint matrices this step's pose was built with: the next step's action code reads these
  const snap = new Map();
  state.prevJoints = gid => { if (!snap.has(gid)){ const m = J(gid); snap.set(gid, m ? Array.from(m) : null); } return snap.get(gid); };
  // eager copy of the joints a shell may ask for, so the snapshot is this step's even if the caller reuses arrays
  for (const sh of Object.values(D.shells)) for (const m of Object.values(sh.modes)){
    const g = shellJoint(sh, m);
    if (g != null) state.prevJoints(g);
  }
  state.prevJoints(0);
  return out;
}

function spawn(state, D, a, J, ctx){
  const def = D.shells[a.shell], mode = def && def.modes[a.mode];
  if (!mode) return null;                                             // no ShellInfoList entry for the mode
  const S = { id: state.nextId++, monId: state.monId, shell: a.shell, cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: a.mode, action: a.action, spawnFrame: a.frame, motion: ctx.motion, state: 1,
              position: null, prevPosition: null, anchor: null, angles: null, trail: null, timer: 0,
              effect: null, effect2: null, start: null, place: null, stop: null };
  const ok = def.base === 'base04' ? init04(S, mode.sh, J, ctx.owner) : init55(S, mode.sh, J, ctx.owner);
  if (!ok) return null;                                               // the init's own refusals delete the shell
  S.prevPosition = S.position.slice();
  S.start = effectRequest(D, mode, 0, S.anchor, S.angles);            // _ef param 0, on the shell itself
  S.effect = S.start ? { param: 0, key: S.start.key } : null;
  S.folder = def.folder;
  // every effect param the mode names, as (list, key); only param 0 is ever started (param 1 is (999, -1), which
  // 0x4a11e4 refuses: listId > 7)
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (D.lists[listId] || {}).list || null, key,
                                                       started: param === 0 && !!S.start }));
  return S;
}

// vtable +0x148 with 0 (0x400234 / 0x42d504): stop the effect gracefully, wait up to 30 x 60 frames for it. The move
// placed the effect first (0x3ffd70 / 0x42d020 run before the end test), so this step's `place` stands.
function end(S){
  S.state = 0xfe;
  S.timer = ENDING_FRAMES;
  S.stop = (S.effect && !S.effect.gone) ? { param: 0, request: 0, key: S.effect.key } : null;   // 0x43b058 -> 0x329c40(h, 0)
}

// game-convention joint matrix from a three.js matrixWorld (viewer units): translation times 100, as live.js does
export function gameJointFrom(elements){
  const m = Array.from(elements);
  m[12] = f(m[12] / 0.01); m[13] = f(m[13] / 0.01); m[14] = f(m[14] / 0.01);
  for (let i = 0; i < 16; i++) m[i] = f(m[i]);
  return m;
}
