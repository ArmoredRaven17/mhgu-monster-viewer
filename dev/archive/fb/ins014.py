# ins014.py (2026-10-20): Iodrome (em016_00) and Giadrome (em034_00) into docs/render/shells.js -- the dromes' class uEm014_00; each has
# sp_00 (base00), sp_01 (base01), sp_13 (base13); Iodrome 0x8f / 0x90 / 0x91, Giadrome 0xc3 / 0xc4 / 0xc5
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

blk = r'''// ---- IODROME (em016_00) / GIADROME (em034_00): the dromes' class uEm014_00 -- dev/em014-shells-spec.md (shells agent, 2026-10-20;
// dev/shells-dromes-check.mjs). Their shell classes are one code twice (Iodrome's 0xd96280.., Giadrome's 0xd96cb4..: the instructions
// equal but for the child id 0x90 / 0xc4 and the literal pools); the ids are immediates. The census (trgen d14cap.py):
//   Iodrome (7, 0x06) L4 M2 f88 sp_00 0, (7, 0x0e) L4 M3 f108 sp_00 2, (7, 0x28) L4 M1 f120 sp_00 4, (7, 0x2a) L4 M2 f84 sp_13 0;
//   Giadrome (7, 0x3c) L4 M2 f88 sp_00 2, (7, 0x3e) L4 M3 f108 sp_00 2, (7, 0x40) L4 M1 f120 sp_00 5, (7, 0x42) L4 M2 f84 sp_13 1
// sp_00 (vtables 0x17a94a8 / 0x17a9914, base00): reader 0xd96280 (READ whole): ef 0..3; hit 0; int 0 the joint; floats 1 X deg +0x15ec, 2 Y deg
//   +0x15f0, 3 vz +0x15f4, 4 vy +0x15f8, 0 the flight +0x15fc; &vec 0 the offset, &vec 1 the gravity. Landing 0xd963d0, state 1 only: type 1
//   ef 2 and (owner active, mode <= 5) sp_01 [child] of the table (Iodrome 0x169c6f0: 0 1 0 1 2 3; Giadrome 0x169c710: 0 0 1 1 2 3) at the
//   contact, its words +0xfe8.., +0x3c its +0x13dc; type 0 ef 1; type 2 ef 3; then 0x3f8970 and the end
// sp_01 (base01): reader 0xd96690 (READ whole): ef 0; hit 0; +0x15ec 4 int 0, 8 int 1; float 0 the timer; &vec 0
// sp_13 (base13): reader 0xd96868 (READ whole): ef 0..3; hit 0; int 0 the joint; +0x15e0: int 1 -> |= 2 (else & ~0x52), then |= 0x50; floats
//   0 speed, 2 gravity, 1 per unit, 4 far, 3 near, 5 life; &vec 0 -> +0x161c, &vec 1 -> +0x1620 (two points). base13's init with joint -1:
//   the owner's +0x40, flag 2 forced (0x4046d0: the points' midpoint turned by his words, 0x43ae70); the thrown point's 0x40 arm. Landing
//   0xd96a00, state 2 only: type 1 ef 2 and vt+0x174 (0xd96a90: owner active, mode 0 / 1 -> sp_01 0 / 1 at the contact, its words, +0x3c its
//   +0x13dc); type 0 ef 1; type 2 ef 3; then 0x4042bc and the end
function params014s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0.0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: I(0), flags: 0, degX: F(1), xDeg: F(1), degY: F(2), yDeg: F(2), vz: F(3), vy: F(4), flight: F(0),
           xLo: f(0.0), xHi: f(0.0), yLo: f(0.0), yHi: f(0.0), vec: V(0), gravity: V(1), from: ZERO3.slice(), aimOff: ZERO3.slice() };
}
const CHILD014 = { uShellEm016_sp_00: [0, 1, 0, 1, 2, 3], uShellEm034_sp_00: [0, 0, 1, 1, 2, 3] };
function landing014s00(S, D, hit, ctx){
  if (S.state !== 1) return;
  if (hit.type === 1){
    const t = CHILD014[S.cls];
    if (ctx && ctx.create && S.modeIndex <= 5)
      ctx.create(S, 'shell01', { mode: t[S.modeIndex], position: hit.point.slice(), angles: S.angles.map(w => w >>> 0), action: S.action, frame: S.spawnFrame });
    contactStart(S, D, 2, hit.point, 'landing');
  } else if (hit.type === 0) contactStart(S, D, 1, hit.point, 'landing');
  else if (hit.type === 2) contactStart(S, D, 3, hit.point, 'landing');
}
for (const c of ['uShellEm016_sp_00', 'uShellEm034_sp_00']){ READER00[c] = (def, mode) => params014s00(def, mode); LANDING[c] = landing014s00; }
function params014s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  return { flags: (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0), joint: -1, timer: f(sh && sh.floats.length ? sh.floats[0] : 0),
           f1600: f(0.0), f15fc: f(1.0), vec: sh && sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0),
           why: !sh ? 'uShellEm014 sp_01: a mode its files do not carry' : null, efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
READERS01[0xd96690] = sh => params014s01(sh);
READERS01[0xd970c4] = sh => params014s01(sh);                  // Giadrome's: the same instructions
function params014s13(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), flags: 0x50 | (I(1) !== -1 ? 2 : 0),
           speed0: F(0), speedPer: F(1), gravity: F(2), near: F(3), far: F(4), life: F(5), y1614: f(0.0), f15f0: f(0.0),
           limitA: f(0.0), limitB: f(0.0), vec: (sh.vecs[0] || ZERO3).map(f), vec2: (sh.vecs[1] || sh.vecs[0] || ZERO3).map(f) };
}
function make014s13(state, D, m, own, ctx, action, frame){
  const def = D.shells.shell13, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'shell13 mode ' + m + ': no files' };
  if (!own.ownerPos || !own.target) return { why: 'no owner position / target (input.ownerPos, input.rock.target)' };
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell13', cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 2,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              centre: null, lifetime: 0, timer: 0, clock: 0, moves: 0, aim: 0, launch: null, events: [],
              folder: def.folder, effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params014s13(def, mode);
  if (!init13t(S, own, (S2, o) => thrown008s13(S2, o))) return { why: 'shell13 mode ' + m + ': its init path is not his' };
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return { S };
}
const LANDING014S13 = (S, D, ctx, out) => {
  const hit = S.events.find(e => e.ev === 'hit');
  if (!hit || S.state !== 2) return 'keep';
  const n0 = S.events.length;
  if (hit.type === 1 && ctx && ctx.create && (S.modeIndex === 0 || S.modeIndex === 1))
    ctx.create(S, 'shell01', { mode: S.modeIndex, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0), action: S.action, frame: S.spawnFrame });
  const param = [1, 2, 3][hit.type];
  if (param) contactStart(S, D, param, hit.point, 'landing');
  for (const e of S.events.slice(n0)) if (e.ev === 'start') out.started.push({ shell: S, start: e.start });
};
LANDING13.uShellEm016_sp_13 = LANDING014S13;
LANDING13.uShellEm034_sp_13 = LANDING014S13;
function spawn014(state, D, a, ctx, input, out){
  const own = ctx.own001, J = state.prevJoints;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    if (sp.shell === 'shell13'){
      const r = make014s13(state, D, sp.mode, own, ctx, a.action, sp.frame);
      if (r.why){ out.refused.push({ action: a.action, shell: 'shell13', mode: sp.mode, why: r.why }); continue; }
      state.shells.push(r.S); out.spawned.push(r.S);
      continue;
    }
    if (!own.facing){ out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why: 'no owner facing (input.owner.y)' }); continue; }
    const S = spawnRock(state, D, { ...a, shell: 'shell00', mode: sp.mode, frame: sp.frame }, J, ctx,
                        { requestPos: [0, 0, 0], requestAngles: [0, 0, 0], ownerPos: own.ownerPos ? own.ownerPos.slice() : null, size: own.size.slice(),
                          target: own.target ? own.target.slice() : null, ownerX: own.ownerX, ownerY: own.ownerY, ownerZ: own.ownerZ });
    if (S){ out.spawned.push(S); state.shells.push(S); }
    else out.refused.push({ action: a.action, shell: 'shell00', mode: sp.mode, why: 'drome shell00: the init refused' });
  }
}
{
  const mk = (mon, name, ids, readers, rows) => {
    const u = { 0: { list: 'u', pel: mon + 'u' } };
    const D = { name, lists: u, actions: [], shells: {
      shell00: { id: ids[0], cls: 'uShellEm' + mon.slice(2, 5) + '_sp_00', base: 'base00', reader: readers[0], folder: 'shell@@BS@@em@@BS@@' + mon + '_shell00', lists: u,
                 cmn: { ints: [], floats: [], vecs: [] }, modes: MODES[mon].m00, hitdata: MODES[mon].h00 },
      shell01: { id: ids[1], cls: 'uShellEm' + mon.slice(2, 5) + '_sp_01', base: 'base01', reader: readers[1], folder: 'shell@@BS@@em@@BS@@' + mon + '_shell01', lists: u,
                 modes: MODES[mon].m01, hitdata: MODES[mon].h01 },
      shell13: { id: ids[2], cls: 'uShellEm' + mon.slice(2, 5) + '_sp_13', base: 'base13', reader: readers[2], folder: 'shell@@BS@@em@@BS@@' + mon + '_shell13', lists: u,
                 modes: MODES[mon].m13, hitdata: MODES[mon].h13 } } };
    for (const [n, clip, F, sh, m] of rows)
      D.actions.push({ action: [7, n], code: 'em014', list: '4', clip, partners: [], pick: 'ai', variant: '7:0x' + n.toString(16).padStart(2, '0'),
                       spawns: [{ frame: F, shell: sh, mode: m, modes: [m] }] });
    SHELL_DATA[mon] = D;
  };
  const MODES = {
    em016_00: { m00: {
@@M016_00@@
    }, h00: @@H016_00@@, m01: {
@@M016_01@@
    }, h01: @@H016_01@@, m13: {
@@M016_13@@
    }, h13: @@H016_13@@ },
    em034_00: { m00: {
@@M034_00@@
    }, h00: @@H034_00@@, m01: {
@@M034_01@@
    }, h01: @@H034_01@@, m13: {
@@M034_13@@
    }, h13: @@H034_13@@ },
  };
  mk('em016_00', 'Iodrome', [0x8f, 0x90, 0x91], [0xd96280, 0xd96690, 0xd96868],
     [[0x06, 'Motion[2]', 88, 'shell00', 0], [0x0e, 'Motion[3]', 108, 'shell00', 2], [0x28, 'Motion[1]', 120, 'shell00', 4], [0x2a, 'Motion[2]', 84, 'shell13', 0]]);
  mk('em034_00', 'Giadrome', [0xc3, 0xc4, 0xc5], [0xd96cb4, 0xd970c4, 0xd9729c],
     [[0x3c, 'Motion[2]', 88, 'shell00', 2], [0x3e, 'Motion[3]', 108, 'shell00', 2], [0x40, 'Motion[1]', 120, 'shell00', 5], [0x42, 'Motion[2]', 84, 'shell13', 1]]);
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
for mon in ('em016_00', 'em034_00'):
    hd = subprocess.check_output([sys.executable, SP + r'\hit.py', mon], text=True)
    HD = {}
    for line in hd.strip().split('\n'):
        parts = line.split(' ', 3)
        HD[parts[1]] = json.dumps([list(t) for t in ast.literal_eval(parts[3])])
    k = mon[2:5]
    for tag in ('00', '01', '13'):
        blk = blk.replace('@@M%s_%s@@' % (k, tag), modes_of(mon, 'shell' + tag)).replace('@@H%s_%s@@' % (k, tag), HD['%s_%s_hitdata' % (mon, tag)])
blk = blk.replace('@@BS@@', BS + BS).replace('\n', NL)
A = '// ---- GYPCEROS (em009_00'
assert s.count(A) == 1
s = s.replace(A, blk + A)
rep("  } else if (a && !fresh && state.prevJoints && a.code === 'em009'){",
    "  } else if (a && !fresh && state.prevJoints && a.code === 'em014'){\n    spawn014(state, D, a, ctx, input, out);                  // Iodrome's / Giadrome's spit and lob\n  } else if (a && !fresh && state.prevJoints && a.code === 'em009'){")
# init13t's two points (base13 init 0x404768: p1 + (p2 - p1) x r): a reader that writes a second point (the dromes' &vec 1)
i = s.index('function init13t(S, own, thrown){')
a = "    const v = turnByWords([0, 1, 2].map(i => mla(k.vec[i], f(k.vec[i] - k.vec[i]), r)), W);"
j = s.index(a, i); assert j - i < 1500
s = s[:j] + "    const P2 = k.vec2 || k.vec;                                    // +0x1620: the second point (the dromes' &vec 1), else vec 0\r\n    const v = turnByWords([0, 1, 2].map(i => mla(k.vec[i], f(P2[i] - k.vec[i]), r)), W);" + s[j + len(a):]
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
