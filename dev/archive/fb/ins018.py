# ins018.py (2026-10-20): Yian Garuga (em018_00) and Deadeye (em018_04) into docs/render/shells.js -- uEm018_00; sp_00 (base00) and sp_01
# (base01) by e+0xcac4 / +0xcac8 (Garuga 0x94 / 0x95, Deadeye 0x96 / 0x97), Deadeye's 04_07 (base07) by e+0xcacc (0x98)
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'
BS = chr(92)
SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
def rep(a, b, cnt=1):
    global s
    a = a.replace('\n', NL); b = b.replace('\n', NL)
    assert s.count(a) == cnt, (s.count(a), a[:70])
    s = s.replace(a, b)

blk = r'''// ---- YIAN GARUGA (em018_00) / DEADEYE (em018_04): uEm018_00 -- dev/em018-shells-spec.md (shells agent, 2026-10-20;
// dev/shells-garuga-check.mjs / dev/shells-deadeye-check.mjs). The ids from e+0xcac4 (sp_00) / +0xcac8 (sp_01) / +0xcacc (Deadeye's 04_07).
// The census (trgen r18cap.py, the phases r18ph.py):
//   (7, 0x0a) L4 M52 f120 / f164 sp_00 1; (7, 0x15) the same sp_00 4; (7, 0x10) L4 M28 -> M29 (phase 2) f40 sp_00 10; (7, 0x12) L4 M68 f60
//   sp_00 10; (7, 0x23) L4 M51 f62 sp_00 0; Deadeye also (7, 0x30 / 0x32) L4 M51 f62 sp_00 0, (7, 0xca) L9 M13 -> L9 M8 (from 30, phase 3)
//   f40 sp_00 15, (7, 0xcc) L9 M17 .. L9 M8 (phase 4) f40 sp_00 15 and 04_07 0 / 1 / 2 at f40 / 42 / 44
// sp_00 (vtable 0x17ad114, base00; reader 0xdb34fc READ whole): ef 0..3; hit 0; int 0 the joint; ints 1 / 2 the cameras; int 3 -> bit 0 (the
//   X aim); floats 0 X deg, 1 Y deg, 2 vz, 3 the flight, 4 / 5 the X clamp; &vec 0 the offset, &vec 1 the aim's origin, &vec 2 the aim
//   offset; no gravity. Landing 0xdb36dc (READ whole): modes 14 / 15 ((m & 0xfe) == 0xe) -> nothing, not even the end; type 1 ef 2 and
//   (owner active) sp_01 [+0xcac8] 1 at the contact with its words +0xfe8.. (+0x3c its +0x13dc), then, the contact record's +8 halfword
//   without 0x1040, sp_01 3 the same; type 0 ef 1 and sp_01 2; type 2 ef 3; then 0x3f8970 and the end
// sp_01 (vtable 0x17ad290, base01; reader 0xdb3b68 READ whole): ef 0 / 1; hit 0 / 1; +0x15ec: 1 int 0, 2 int 2, 0x80 int 3, 0x800 int 4,
//   4 int 5, 8 int 6, 0x1000 int 7; int 1 the joint; float 0 the timer; &vec 0. Its +0x158 0xdb3d34: the hit side's re-registration
// 04_07 (vtable 0x17acfa8, base07; reader 0xdb31f4 READ whole): Bloodbath's map (params07). Its +0x28 0xdb33a0: base's 0x4a1770, then a
//   ground marker for modes <= 2 (0x43b2b0, not visual)
function params018s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0.0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: I(0), flags: I(3) !== -1 ? 1 : 0, degX: F(0), xDeg: F(0), degY: F(1), yDeg: F(1), vz: F(2), vy: f(0.0), flight: F(3),
           xLo: F(4), xHi: F(5), yLo: f(0.0), yHi: f(0.0), vec: V(0), from: V(1), aimOff: V(2), gravity: ZERO3.slice() };
}
function landing018s00(S, D, hit, ctx){
  if ((S.modeIndex & 0xfe) === 0xe) return 'keep';
  const make = m => ctx.create(S, 'shell01', { mode: m, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0), action: S.action, frame: S.spawnFrame });
  if (hit.type === 1){
    if (ctx && ctx.create){ make(1); if (!((hit.attr || 0) & 0x1040)) make(3); }
    contactStart(S, D, 2, hit.point, 'landing');
  } else if (hit.type === 0){
    if (ctx && ctx.create) make(2);
    contactStart(S, D, 1, hit.point, 'landing');
  } else if (hit.type === 2) contactStart(S, D, 3, hit.point, 'landing');
}
READER00.uShellEm018_sp_00 = (def, mode) => params018s00(def, mode);
AIMX00.uShellEm018_sp_00 = (S, k, p, got) => xAdjust37(k, p, got);
LANDING.uShellEm018_sp_00 = landing018s00;
function params018s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  const flags = (I(0) !== -1 ? 1 : 0) | (I(2) !== -1 ? 2 : 0) | (I(3) !== -1 ? 0x80 : 0) | (I(4) !== -1 ? 0x800 : 0) | (I(5) !== -1 ? 4 : 0) |
                (I(6) !== -1 ? 8 : 0) | (I(7) !== -1 ? 0x1000 : 0);
  return { flags, joint: I(1), timer: f(sh && sh.floats.length ? sh.floats[0] : 0), f1600: f(0.0), f15fc: f(1.0),
           vec: sh && sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0),
           why: !sh ? 'uShellEm018_sp_01: a mode its files do not carry' : null, efAt: { 0x15c8: 0, 0x15cc: 1, 0x15d0: null } };
}
READERS01[0xdb3b68] = sh => params018s01(sh);
function spawn018(state, D, a, ctx, input, out){
  const own = ctx.own001, J = state.prevJoints;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    if (sp.shell === 'shell07'){
      const why = missing001(own, { facing: true, pos: true });
      if (why){ out.refused.push({ action: a.action, shell: 'shell07', mode: sp.mode, why }); continue; }
      const r = make07(state, D, sp.mode, own, ctx, a.action, sp.frame);
      if (r.S){ state.shells.push(r.S); out.spawned.push(r.S); }
      else if (r.why) out.refused.push({ action: a.action, shell: 'shell07', mode: sp.mode, why: r.why });
      continue;
    }
    if (!own.facing){ out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why: 'no owner facing (input.owner.y)' }); continue; }
    const S = spawnRock(state, D, { ...a, shell: 'shell00', mode: sp.mode, frame: sp.frame }, J, ctx,
                        { requestPos: [0, 0, 0], requestAngles: [0, 0, 0], ownerPos: own.ownerPos ? own.ownerPos.slice() : null, size: own.size.slice(),
                          target: own.target ? own.target.slice() : null, ownerX: own.ownerX, ownerY: own.ownerY, ownerZ: own.ownerZ });
    if (S){ out.spawned.push(S); state.shells.push(S); }
    else out.refused.push({ action: a.action, shell: 'shell00', mode: sp.mode, why: 'em018 shell00: the init refused' });
  }
}
{
  const MODES = {
    em018_00: { m00: {
@@M00_00@@
    }, h00: @@H00_00@@, m01: {
@@M00_01@@
    }, h01: @@H00_01@@ },
    em018_04: { m00: {
@@M04_00@@
    }, h00: @@H04_00@@, m01: {
@@M04_01@@
    }, h01: @@H04_01@@, m07: {
@@M04_07@@
    }, h07: @@H04_07@@ },
  };
  const mk = (mon, name, ids, rows) => {
    const u = { 0: { list: 'u', pel: mon + 'u' } };
    const D = { name, lists: u, actions: [], shells: {
      shell00: { id: ids[0], cls: 'uShellEm018_sp_00', base: 'base00', reader: 0xdb34fc, folder: 'shell@@BS@@em@@BS@@' + mon + '_shell00', lists: u,
                 cmn: { ints: [], floats: [], vecs: [] }, modes: MODES[mon].m00, hitdata: MODES[mon].h00 },
      shell01: { id: ids[1], cls: 'uShellEm018_sp_01', base: 'base01', reader: 0xdb3b68, folder: 'shell@@BS@@em@@BS@@' + mon + '_shell01',
                 lists: { 0: { list: 'u', pel: mon + 'u' }, 1: { list: 'c', pel: 'em018_00c' } }, modes: MODES[mon].m01, hitdata: MODES[mon].h01 } } };
    if (MODES[mon].m07) D.shells.shell07 = { id: ids[2], cls: 'uShellEm018_04_07', base: 'base07', reader: 0xdb31f4, folder: 'shell@@BS@@em@@BS@@' + mon + '_shell07',
                                             lists: u, modes: MODES[mon].m07, hitdata: MODES[mon].h07 };
    for (const [n, list, clip, spawns, more] of rows)
      D.actions.push(Object.assign({ action: [7, n], code: 'em018', list, clip, partners: [], pick: 'ai', variant: '7:0x' + n.toString(16).padStart(2, '0'),
                                     spawns: spawns.map(([F, sh, m]) => ({ frame: F, shell: sh, mode: m, modes: [m] })) }, more || {}));
    SHELL_DATA[mon] = D;
  };
  const common = [[0x0a, '4', 'Motion[52]', [[120, 'shell00', 1], [164, 'shell00', 1]]], [0x15, '4', 'Motion[52]', [[120, 'shell00', 4], [164, 'shell00', 4]]],
                  [0x10, '4', 'Motion[29]', [[40, 'shell00', 10]]], [0x12, '4', 'Motion[68]', [[60, 'shell00', 10]]], [0x23, '4', 'Motion[51]', [[62, 'shell00', 0]]]];
  mk('em018_00', 'Yian Garuga', [0x94, 0x95], common);
  mk('em018_04', 'Deadeye Yian Garuga', [0x96, 0x97, 0x98], common.concat([
    [0x30, '4', 'Motion[51]', [[62, 'shell00', 0]]], [0x32, '4', 'Motion[51]', [[62, 'shell00', 0]]], [0xca, '9', 'Motion[8]', [[40, 'shell00', 15]]],
    [0xcc, '9', 'Motion[8]', [[40, 'shell00', 15], [40, 'shell07', 0], [42, 'shell07', 1], [44, 'shell07', 2]]]]));
}
'''
import json, ast, subprocess, sys
def modes_of(mon, tag):
    L = open(SP + r'\shl_%s.txt' % mon, encoding='utf8').read().split('\n')
    i = [k for k, l in enumerate(L) if l.startswith('== ') and tag in l][0]
    out = []
    for l in L[i+1:]:
        l2 = l.strip()
        if l2.startswith('=='): break
        if not l2.startswith('mode '): continue
        n = int(l2.split()[1]); d = json.loads(l2[l2.index('{'):])
        ef = [[a, (-1 if b == 4294967295 else b)] for a, b in d['ef'][0]['arr']]
        out.append("      %d: { scale: %r, ef: %s, hit: %s, sh: { ints: %s, floats: %s, vecs: %s } }," % (n, d['scale'][0], json.dumps(ef).replace(' ', ''), json.dumps(d['hit']['ints']), json.dumps(d['sh']['ints']), json.dumps(d['sh']['floats']), json.dumps(d['sh']['vecs'])))
    return '\n'.join(out)
for mon, tags in (('em018_00', ('00', '01')), ('em018_04', ('00', '01', '07'))):
    hd = subprocess.check_output([sys.executable, SP + r'\hit.py', mon], text=True)
    HD = {}
    for line in hd.strip().split('\n'):
        parts = line.split(' ', 3)
        HD[parts[1]] = json.dumps([list(t) for t in ast.literal_eval(parts[3])])
    k = mon[-2:]
    for tag in tags:
        blk = blk.replace('@@M%s_%s@@' % (k, tag), modes_of(mon, 'shell' + tag)).replace('@@H%s_%s@@' % (k, tag), HD['%s_%s_hitdata' % (mon, tag)])
blk = blk.replace('@@BS@@', BS + BS).replace('\n', NL)
A = '// ---- IODROME (em016_00) / GIADROME'
assert s.count(A) == 1
s = s.replace(A, blk + A)
rep("  } else if (a && !fresh && state.prevJoints && a.code === 'em014'){",
    "  } else if (a && !fresh && state.prevJoints && a.code === 'em018'){\n    spawn018(state, D, a, ctx, input, out);                  // Garuga's / Deadeye's fireballs and Deadeye's debris\n  } else if (a && !fresh && state.prevJoints && a.code === 'em014'){")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
