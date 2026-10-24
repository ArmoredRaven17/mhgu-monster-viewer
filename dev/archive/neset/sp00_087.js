
// ---- AHTAL-NESET's sp_00 (0x176, uShellEm087_sp_00 on BASE00) and HIS OBJECT CLOCKS -- dev/ahtal-neset-shells-spec.md 3D (shells
// agent, 2026-10-20). READ: event type 14 0x10aba68 (setup 0x40: +8 the mode u32(a0), +0x30 the row's raw a2, +0x34 u32(a1)); its
// init 0x10c20bc (+0x15f0 = setup +0x30, the Y degrees; +0x15dc = setup +0x34, the joint; then base00's 0x3f8b80); its reader
// 0x10c20d8 (ef 0 -> +0x15c8, hit 0 -> +0x15d8, float 0 -> +0x15f4 vz, float 1 -> +0x15fc the flight, &vec 0 -> +0x1610; flags 0);
// +0x168 0x10c215c (bx lr). EMULATED: rkrun.py's `row` cases (the type-14 arm on a row in memory; base00's flight).
// THE GATE, kind 14 (vt+0x47c 0x10ab32c; the walker 0x6c590 sends kinds > 13 there WITHOUT his motion test): object e+0xcd10[row byte
// +0x14] -- one of six controllers that drive his motion LAYERS (bound to him by 0x12179fc at 0x10a2f78: +0 him, +4 the kind 0..5,
// +0xc the layer 2..7) -- playing the row's motion (+0x10 == row +0x18) with its clock (+0x18, += his dt every update: 0x1217a58 from
// vt+0x1dc) crossing f0 (0x6ca70 mode 1). The controllers are reset at every action start (vt+0x204, 0x10a6f3c: 0x1217b78) and set by
// event type 8 (0x10ab770: e+0xccf8[a0] == 0 -> 0x1217a30(ctrl, a1): the motion, the clock 0), whose rows are kind 5 (the action
// clock). A controller's own sequence (0x1217bb4: its layer's start / loop / end motions, 0x20a + 3 (kind - 1) .., the layer's end
// 0x94dc04) can end it first (motion 0): NOT MODELLED -- the layers' lengths at the controller's rates (1.7 / 0.6 / 1.2) give about
// 170+ frames for motion 2 and 100+ for motion 3, past the rows' 144 / 90 (INFERRED: the speed argument of vt+0x78 is not read).
// Viewer stand-ins (named): the object clock = the clip frames since its type-8 row fired (his dt 1; the update order -- the clock
// before the walker -- INFERRED, so the shot is at the set frame + f0); e+0xccf8 (the objects' state) 0.
function params087s00(def, mode, idx, got){
  const sh = mode.sh, F = i => f(i < sh.floats.length ? sh.floats[i] : 0);
  return { joint: got.joint087, flags: 0, degX: f(0.0), xDeg: f(0.0), degY: got.degY087, yDeg: got.degY087, vz: F(0), vy: f(0.0),
           flight: F(1), xLo: f(0.0), xHi: f(0.0), yLo: f(0.0), yHi: f(0.0), vec: sh.vecs[0] ? sh.vecs[0].map(f) : ZERO3.slice(),
           from: ZERO3.slice(), aimOff: ZERO3.slice(), gravity: ZERO3.slice() };
}
READER00.uShellEm087_sp_00 = (def, mode, idx, got) => params087s00(def, mode, idx, got);
// type 14: sp_00 mode u32(a0) at joint u32(a1), Y + a2 degrees (the setup's raw float, +0x15f0)
function make087s00(st, D, a, sp, own, J, ctx, out){
  if (!own.facing){ out.refused.push({ action: a.action, shell: 'shell00', mode: sp.mode, why: 'no owner facing (input.owner.y)' }); return; }
  const S = spawnRock(st, D, { ...a, shell: 'shell00', mode: sp.mode, frame: sp.frame }, J, ctx,
                      { requestPos: [0, 0, 0], requestAngles: [0, 0, 0], ownerPos: own.ownerPos ? own.ownerPos.slice() : null, size: own.size.slice(),
                        target: own.target ? own.target.slice() : null, ownerX: own.ownerX, ownerY: own.ownerY, ownerZ: own.ownerZ,
                        joint087: sp.joint, degY087: f(sp.deg) });
  if (S){ st.shells.push(S); out.spawned.push(S); }
  else out.refused.push({ action: a.action, shell: 'shell00', mode: sp.mode, why: 'uShellEm087_sp_00: the init refused (joint ' + sp.joint + ')' });
}
// his object controllers through one action: { mot, set } per object (0..5); kind-14 rows fire at set + f0
function objects087(state, a, fresh){
  if (fresh || !state.obj087 || state.obj087.action !== a) state.obj087 = { action: a, o: [0, 1, 2, 3, 4, 5].map(() => ({ mot: 0, set: null })) };
  return state.obj087.o;
}
SHELL_DATA.em087_00.shells.shell00 = { id: 0x176, cls: 'uShellEm087_sp_00', base: 'base00', reader: 0x10c20d8, folder: 'shell\\em\\em087_00_shell00',
  // em087_00_00 (count 3): floats (vz 60, the flight 60 / 300 / 180), vec 0 zero, hit 0 -> em087_00_00_hitdata (0, 99); ef 0 u 90
  modes: { 0: m057(1.0, [[0, 90]], [0], [], [60.0, 60.0], [[0.0, 0.0, 0.0]]),
           1: m057(2.0, [[0, 90]], [0], [], [60.0, 300.0], [[0.0, 0.0, 0.0]]),
           2: m057(1.0, [[0, 90]], [0], [], [60.0, 180.0], [[0.0, 0.0, 0.0]]) },
  hitdata: [[0, 99]], lists: { 0: { list: 'u', pel: 'em087_00u' } } };
// THE ROWS (<scratchpad>\neset\seq087.txt): type 8 kind 5 (f0: the action clock) -> ev 8 { objs, mot }; type 14 kind 14 -> ev 14
// { obj, mot, at (the object clock), mode, joint, deg }
{
  const all = [0, 1, 2, 3, 4, 5];
  const pair = (mot, at, mode, a, b) => [{ ev: 14, obj: 1, mot, at, mode, joint: a, deg: 0 }, { ev: 14, obj: mot === 2 ? 1 : 4, mot, at, mode, joint: b, deg: 0 }];
  SHELL_DATA.em087_00.actions.push(
    // (7, 7) L2 M28 (selector 7): objects 0..5 motion 2 at its start; object 1 at 144 -> sp_00 1 at joints 41 and 51
    act087(7, 0x07, '2', 'Motion[28]', [{ ev: 8, start: true, objs: all, mot: 2 }, ...pair(2, 144, 1, 41, 51)]),
    // (7, 0xa) L2 M36 (selector 10): the same, set at L2 M36's start (the rows on L0 M1 fire on the object's clock, not his motion)
    act087(7, 0x0a, '2', 'Motion[36]', [{ ev: 8, start: true, objs: all, mot: 2 }, ...pair(2, 144, 1, 41, 51)]),
    // (1, 0) L0 M1, his idle, by the selector his AI took
    act087(1, 0x00, '0', 'Motion[1]', [{ ev: 8, frame: 20, objs: all, mot: 2 }, ...pair(2, 144, 1, 41, 51)], { variant: '1:0x00/s39' }),
    act087(1, 0x00, '0', 'Motion[1]', [{ ev: 8, frame: 20, objs: [1, 4], mot: 3 }, ...pair(3, 90, 0, 41, 51)], { variant: '1:0x00/s40' }),
    act087(1, 0x00, '0', 'Motion[1]', [{ ev: 8, frame: 10, objs: [0, 5], mot: 3 }, { ev: 8, frame: 100, objs: [2, 3], mot: 3 },
      { ev: 14, obj: 0, mot: 3, at: 90, mode: 0, joint: 42, deg: 10 }, { ev: 14, obj: 5, mot: 3, at: 90, mode: 0, joint: 52, deg: -10 },
      { ev: 14, obj: 2, mot: 3, at: 90, mode: 0, joint: 40, deg: -10 }, { ev: 14, obj: 3, mot: 3, at: 90, mode: 0, joint: 50, deg: 10 }], { variant: '1:0x00/s41' }),
    ...[50, 51, 52, 53].map(s => act087(1, 0x00, '0', 'Motion[1]', [{ ev: 8, frame: 20, objs: [1, 4], mot: 3 }, ...pair(3, 90, 0, 41, 51)],
                                        { variant: '1:0x00/s' + s })));
}
