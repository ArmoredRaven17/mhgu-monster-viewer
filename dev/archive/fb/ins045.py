p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'
BS = chr(92)
def rep(a, b, cnt=1):
    global s
    a = a.replace('\n', NL); b = b.replace('\n', NL)
    assert s.count(a) == cnt, (s.count(a), a[:70])
    s = s.replace(a, b)

blk = r'''// ---- URAGAAN (em045_00, uEm045_00): his shell01 0xdf (base01) and shell13 0xe0 (base13) -- dev/em045-shells-spec.md (shells agent,
// 2026-10-19; emulator check dev/shells-uragaan-check.mjs). Ids from the enemy fields e+0xcb14 (sp_01) / e+0xcb18 (sp_13). The census:
//   (7, 0x00) L2 M1 phase 1 at 180 (0xe94d5c..0xe94e18) and (7, 0x8a) L2 M10 phase 4 at 226 (0xe983c0): sp_01 mode 0 (u 200) --
//     0x3fa2bc(0x40): +0x10.. HIS OWN +0x40.., +0x20.. a GOT zero vector, +0x30.. his words, +0x3c P+0xb0a
//   (7, 0x8e) L2 M16 phase 1 at 202 (0xe98a70..0xe98b18, 0xb0968(e, 0, 0, F)): sp_13 mode 0 (u 50) -- 0x4041a8(0x40): +0x10.. / +0x20..
//     a GOT zero vector, +0x30 0, +0x34 0xffff
// His sp_01 (vtable 0x17c3614, base01; reader 0xe9dec8, +0x158 0xe9e010 the hit side: two slots, not visual): ef 0 -> +0x15c8; hit 0 /
//   1 -> +0x15d8 / +0x15dc; int 0 -> the joint +0x15e4; +0x15ec: int 0 -> bit 0, int 1 -> 0x800, int 2 -> 4, int 3 -> 8, int 4 ->
//   0x1000 (bfc / orrne over the ctor's 0); vec 0 -> +0x1608. No timer: it lives while a hit slot does (em045_00_01_hitdata)
// His sp_13 (vtable 0x17c3784, base13: init 0x4044d8, move 0x405164; reader 0xe9e1f8, landing 0xe9e380, +0x174 0xe9e408): READER ef
//   0..3 -> +0x15c8..+0x15d4; hit 0; int 0 -> the joint +0x15e4; int 1 -> +0x15e0 bit 1 (2); floats 0 / 2 / 1 / 3 / 4 / 5 -> +0x15ec (the
//   speed) / +0x15f4 (gravity) / +0x160c (the speed per unit) / +0x1600 (far) / +0x15fc (near) / +0x15f8 (life); &vec 0 -> +0x161c and
//   +0x1620. INIT 0x4044d8 (R, the arms this reader takes): +0x40 the joint's row 3; flag 0x80 clear -> the points [+0x161c] / [+0x1620]
//   meet at 0.5; bit 1 SET -> that midpoint turned by the OWNER's words (0x43ae70; bit clear: the joint's 3x3, 0x4047b0); bit 3 clear
//   -> no size; added. Then the aim word (+0x16c), the launch 0x404dc8 (the drop clamp with +0x15f0 = 0 not taken; g = +0x15f4) -- as
//   Gravios's sp_13. LANDING 0xe9e380 (state 2): the param by type (0 -> +0x15cc, 1 -> +0x15d0, 2 -> +0x15d4), vt+0x174 (0xe9e408: owner
//   active -> shell01 [owner+0xcb14] mode 4 -- mode 5 at variant 4 with the quest number 0x49930 > 8 -- at the contact, +0x30.. THIS
//   shell's words, +0x3c its +0x13dc), base13's landing effect 0x4042bc at the contact, vt+0x148 (the end)
function params045s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  const V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const flags = (I(0) !== -1 ? 1 : 0) | (I(1) !== -1 ? 0x800 : 0) | (I(2) !== -1 ? 4 : 0) | (I(3) !== -1 ? 8 : 0) | (I(4) !== -1 ? 0x1000 : 0);
  const why = !sh ? 'uShellEm045_sp_01: a mode SHELL_DATA does not carry' : null;
  return { flags, joint: I(0), timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: V(0), deg: [0, 0, 0], up: f(500.0), down: f(500.0),
           maxH: f(900.0), why, efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
READERS01[0xe9dec8] = params045s01;
function params045s13(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0.0);
  return { joint: I(0), flags: I(1) !== -1 ? 2 : 0, speed0: F(0), gravity: F(2), speedPer: F(1), far: F(3), near: F(4), life: F(5),
           f15f0: f(0.0), limitA: f(0.0), limitB: f(0.0), y1614: f(0.0), vec: (sh.vecs[0] || ZERO3).map(f) };
}
function init045s13(S, J, own){
  const k = S.k;
  S.centre = [f(0.0), f(0.0), f(0.0)];
  S.y1614 = f(0.0);
  S.lifetime = k.life;
  S.angles = [0, 0, 0];
  const M = jointMatrix(J, k.joint);
  if (!M) return false;
  const v = k.vec;
  const mid = [0, 1, 2].map(i => mla(v[i], f(v[i] - v[i]), 0.5));
  const m = (k.flags & 2) ? turnByWords(mid, [own.ownerX, own.ownerY, own.ownerZ])
          : [mla(mla(f(M[4] * mid[1]), M[0], mid[0]), M[8], mid[2]), mla(mla(f(M[5] * mid[1]), M[1], mid[0]), M[9], mid[2]),
             mla(mla(f(M[6] * mid[1]), M[2], mid[0]), M[10], mid[2])];
  let pos = [f(m[0] + f(M[12])), f(m[1] + f(M[13])), f(m[2] + f(M[14]))];
  S.position = pos;
  const T = thrown13(S, k, own);
  const a = wordOf(f(T[0] - pos[0]), f(T[2] - pos[2]));        // vtable +0x16c
  const L = launch13(S, k, own);
  const rad = f(u16(a) * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
  S.velocity = [f(L.velocity[2] * sn), L.velocity[1], f(L.velocity[2] * cs)];
  S.gravity = L.acceleration.slice();
  pos = [0, 1, 2].map(i => f(m[i] + f(pos[i] - m[i])));       // 0x404c08..0x404c48
  S.position = pos;
  S.anchor = pos.slice();
  S.aim = a;
  S.launch = { point: pos.slice(), thrown: L.thrown.slice(), aim: a, dist: L.dist, speed: L.speed, t: L.t,
               velocity: S.velocity.slice(), gravity: S.gravity.slice(), life: S.lifetime };
  S.timer = f(0.0);
  return true;
}
function make045s13(state, D, m, J, own, ctx, a, frame){
  const def = D.shells.shell13, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'uShellEm045_sp_13 mode ' + m + ': no files' };
  if (!own.target) return { why: "Uragaan's sp_13 aims at the target: no target (input.rock.target)" };
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell13', cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: m, action: a.action, spawnFrame: frame, motion: ctx.motion, state: 2,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              centre: null, lifetime: 0, timer: 0, clock: 0, moves: 0, aim: 0, launch: null, events: [],
              folder: def.folder, effect: null, effect2: null, start: null, place: null, stop: null };
  S.k = params045s13(def, mode);
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  if (!init045s13(S, J, own)) return { why: 'no joint ' + S.k.joint };
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return { S };
}
function landing045s13(S, D, ctx, out){
  const hit = S.events.find(e => e.ev === 'hit');
  if (!hit) return;
  const param = [1, 2, 3][hit.type];
  const own = ctx.own001;
  const m = (D.variant === 4 && own && own.questLevel != null && own.questLevel > 8) ? 5 : 4;
  if (ctx.create) ctx.create(S, 'shell01', { mode: m, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
  if (!S.mode.ef[param]) return;
  const rq = rockRequest(D, S.mode, param, hit.point, 'landing', listsOf(D, S));
  S.events.push(rq ? { ev: 'start', param, kind: 'landing', start: rq } : { ev: 'refused', param, kind: 'landing' });
  if (rq){ S.effect2 = { param, key: rq.key, kind: 'landing', move: S.moves }; out.started.push({ shell: S, start: rq }); }
}
LANDING13.uShellEm045_sp_13 = landing045s13;
function spawn045(state, D, a, ctx, input, out){
  const own = ctx.own001, J = state.prevJoints;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    if (sp.shell === 'shell13'){
      const r = make045s13(state, D, sp.mode, J, own, ctx, a, sp.frame);
      if (r.why){ out.refused.push({ action: a.action, shell: 'shell13', mode: sp.mode, why: r.why }); continue; }
      state.shells.push(r.S); out.spawned.push(r.S);
    } else {
      const why = missing001(own, { facing: true, pos: true });
      if (why){ out.refused.push({ action: a.action, shell: 'shell01', mode: sp.mode, why }); continue; }
      const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: sp.mode, position: own.ownerPos.slice(), angles: ownerWords001(own),
                                               action: a.action, frame: sp.frame }, own, J, ctx, null);
      if (S){ state.shells.push(S); out.spawned.push(S); }
    }
  }
}
SHELL_DATA.em045_00 = {
  name: 'Uragaan',
  lists: { 0: { list: 'u', pel: 'em045_00u' } },
  actions: [
    { action: [7, 0x00], code: 'em045', list: '2', clip: 'Motion[1]', partners: [], pick: 'ai', variant: '7:0x00', spawns: [{ frame: 180, shell: 'shell01', mode: 0, modes: [0] }] },
    { action: [7, 0x8a], code: 'em045', list: '2', clip: 'Motion[10]', partners: [], pick: 'ai', variant: '7:0x8a', spawns: [{ frame: 226, shell: 'shell01', mode: 0, modes: [0] }] },
    { action: [7, 0x8e], code: 'em045', list: '2', clip: 'Motion[16]', partners: [], pick: 'ai', variant: '7:0x8e', spawns: [{ frame: 202, shell: 'shell13', mode: 0, modes: [0] }] },
  ],
  shells: {
    shell01: { id: 0xdf, cls: 'uShellEm045_sp_01', base: 'base01', reader: 0xe9dec8, folder: 'shell@@BS@@em@@BS@@em045_00_shell01',
      lists: { 0: { list: 'u', pel: 'em045_00u' } },
      modes: {
@@MODES01@@
      },
      hitdata: [[0, 4], [2, 6], [0, 10], [0, 10], [0, 10]] },
    shell13: { id: 0xe0, cls: 'uShellEm045_sp_13', base: 'base13', reader: 0xe9e1f8, folder: 'shell@@BS@@em@@BS@@em045_00_shell13',
      lists: { 0: { list: 'u', pel: 'em045_00u' } },
      modes: {
@@MODES13@@
      },
      hitdata: [[0, 100]] },
  },
};
'''
import json
L = open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\shl_em045_00.txt', encoding='utf8').read().split('\n')
def modes_of(tag, cnt):
    i = [k for k, l in enumerate(L) if l.startswith('== ') and tag in l][0]
    out = []
    for l in L[i+1:]:
        l = l.strip()
        if l.startswith('=='): break
        if not l.startswith('mode '): continue
        n = int(l.split()[1]); d = json.loads(l[l.index('{'):])
        ef = [[a, (-1 if b == 4294967295 else b)] for a, b in d['ef'][0]['arr']]
        hit = [h for h in d['hit']['ints']]
        out.append("        %d: { scale: %r, ef: %s, hit: %s, sh: { ints: %s, floats: %s, vecs: %s } }," % (n, d['scale'][0], json.dumps(ef).replace(' ', ''), json.dumps(hit), json.dumps(d['sh']['ints']), json.dumps(d['sh']['floats']), json.dumps(d['sh']['vecs'])))
    return '\n'.join(out)
blk = blk.replace('@@MODES01@@', modes_of('shell01', 5)).replace('@@MODES13@@', modes_of('shell13', 1)).replace('@@BS@@', BS + BS).replace('\n', NL)
A = '// ---- BASE60 / BASE61'
assert s.count(A) == 1
s = s.replace(A, blk + A)
rep("  } else if (a && !fresh && state.prevJoints && a.code === 'em044'){",
    "  } else if (a && !fresh && state.prevJoints && a.code === 'em045'){\n    spawn045(state, D, a, ctx, input, out);                  // Uragaan's / Crystalbeard's shell01 / shell13\n  } else if (a && !fresh && state.prevJoints && a.code === 'em044'){")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
