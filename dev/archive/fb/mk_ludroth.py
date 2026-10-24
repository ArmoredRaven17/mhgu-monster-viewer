D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + '\\'
g = open(D + 'gen047.out').read()
def section(n):
    out, on = [], False
    for ln in g.splitlines():
        if ln.startswith('// shell'): on = (ln == '// shell' + n); continue
        if on: out.append(ln)
    return '\n'.join(out)
BS = chr(92) * 2
blk = """
// ---- ROYAL LUDROTH (em047_00): uEm047_00 (band 0xeab874..0xeb4950, action main 0xeb0614) ---------------------------------------------
// READ 2026-10-18 (dev/leviathan-shells-spec.md). Ids immediates: 0xeb uShellEm047_sp_00 (base00), 0xec uShellEm047_sp_01 (base01);
// folders by the path table (res 0x8a3e / 0x8a3f). The water spits (census scratchpad fb/cen10_em047.txt, every frame test answered
// alone): L2 M6 (7, 2) f82 mode 0, (7, 0x1f) mode 1; L2 M4 (7, 0x19) f82 / 142 / 202 modes 2 / 3 / 4, L2 M16 (7, 0x1a) 5 / 6 / 7, L2 M5
// (7, 0x1b) 8 / 9 / 10 (the third in phase 2, the clip playing on); L2 M17 (7, 0x15 / 0x16 / 0x1c / 0x1d / 0x1e / 0x23) f102 18, f140 19,
// f170 18, f208 19 (the 0x1c family's phases 2 / 4 restart L2 M17 at 164 and fire 170 / 208 again: one pass here); L2 M31 (7, 0x3e) f72
// mode 22. NOT HERE, by name: (7, 0xd / 0xe / 0xf / 0x22 / 0x25 / 0x26 / 0x27) modes 11..17 at 76 / 80 -- their action sets motion
// 0xffff (0xeaeb28: no clip), so no clip of the viewer's is theirs.
// sp_00's reader 0xeb4398 (READ whole): ef 0..3; hit 0; int 0 the joint +0x15dc; +0x15e8: 1 int 1 (the X aim, from the shell: 4), 4 int 2;
// floats 2 degX +0x15ec, 3 degY +0x15f0, 0 vz +0x15f4, 4 / 5 the X clamp, 6 the flight; &vec 1 the offset +0x1610, &vec 0 the gravity
function params047s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  const flags = (I(1) !== -1 ? 1 : 0) | (I(2) !== -1 ? 4 : 0);
  return { joint: I(0), flags, degX: F(2), xDeg: F(2), degY: F(3), yDeg: F(3), vz: F(0), vy: f(0), flight: F(6), xLo: F(4), xHi: F(5),
           yLo: f(0), yHi: f(0), vec: V(1), from: ZERO3.slice(), aimOff: ZERO3.slice(), gravity: V(0) };
}
// sp_00's landing 0xeb4558 (READ whole; any state): type 0 -> ef 1 (camera +0x15e0), type 2 -> ef 3, type 1 -> ef 2 (camera +0x15e4) and,
// the owner active, sp_01 [0x169eb40][mode] (modes 0..10 -> 0, 11..17 -> 1, 18..22 none) at the contact with the zero vector's words;
// then 0x3f8970 at the contact and the end
const CHILD047 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
function landing047s00(S, D, hit, ctx){
  if (hit.type === 1){
    const c = CHILD047[S.modeIndex];
    if (c != null && c <= 1 && ctx && ctx.create) ctx.create(S, 'shell01', { mode: c, position: hit.point.slice(), angles: [0, 0, 0] });
  }
  const param = [1, 2, 3][hit.type];
  if (param) contactStart(S, D, param, hit.point, 'landing');
}
// sp_01's reader 0xeb4808 (READ whole): ef 0; hit 0; +0x15ec: 4 int 0, 8 int 1; float 0 the timer +0x15f0 (the puddles' 300)
function params047s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? f(0) : i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { flags: (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0), joint: -1, timer: F(0), f1600: f(0.0), f15fc: f(1.0),
           vec: [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0), why: !sh ? 'uShellEm047_sp_01: a mode its files do not carry' : null };
}
SHELL_DATA.em047_00 = {
  name: 'Royal Ludroth',
  lists: { 0: { list: 'u', pel: 'em047_00u' } },
  shells: {
    // shell00: the water spits (u 30 / u 0 on them, u 31 / 34 / 1 / 2 at a contact)
    shell00: { id: 0xeb, cls: 'uShellEm047_sp_00', base: 'base00', reader: 0xeb4398, folder: 'shell@em@em047_00_shell00',
      modes: {
@00@
      }, hitdata: [[0, 9999], [0, 9999], [0, 9999]] },
    // shell01: the puddles a spit leaves (u 32, 300 frames)
    shell01: { id: 0xec, cls: 'uShellEm047_sp_01', base: 'base01', reader: 0xeb4808, folder: 'shell@em@em047_00_shell01',
      modes: {
@01@
      }, hitdata: [[0, 560], [0, 560]] },
  },
  actions: null,
};
const SPIT047 = (frames, modes) => frames.map((frame, i) => ({ frame, shell: 'shell00', mode: modes[i], aimed: modes[i] === 22 }));
SHELL_DATA.em047_00.actions = [
  actPlain(7, 0x02, '2', 'Motion[6]', SPIT047([82], [0])),
  actPlain(7, 0x1f, '2', 'Motion[6]', SPIT047([82], [1])),
  actPlain(7, 0x19, '2', 'Motion[4]', SPIT047([82, 142, 202], [2, 3, 4])),
  actPlain(7, 0x1a, '2', 'Motion[16]', SPIT047([82, 142, 202], [5, 6, 7])),
  actPlain(7, 0x1b, '2', 'Motion[5]', SPIT047([82, 142, 202], [8, 9, 10])),
  actPlain(7, 0x15, '2', 'Motion[17]', SPIT047([102, 140, 170, 208], [18, 19, 18, 19]), { also: [[7, 0x16], [7, 0x1c], [7, 0x1d], [7, 0x1e], [7, 0x23]] }),
  actPlain(7, 0x3e, '2', 'Motion[31]', SPIT047([72], [22])),
];
""".replace('@00@', section('00')).replace('@01@', section('01')).replace('@', BS)
open(D + 'ludroth.js', 'w', encoding='utf8').write(blk)
print('ok')
