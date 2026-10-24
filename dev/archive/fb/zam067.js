// ---- ZAMTRIOS (em067_00): uEm067_00's sp_13 (0x124) and its children, beside his beams (render/beam-spawns.js, sp_02 0x123) ----------
// READ 2026-10-18 (dev/amphibian-shells-spec.md 2). vt+0x158 0xf77488 registers 0x122 sp_01, 0x123 sp_02 AND 0x124 sp_13 (immediates;
// states-em067_00.md 1.6 lists two); res 0x8a75..0x8a77. Census scratchpad fb/cen11_em067_a/b/c.txt (all 16 statuses, the .dtp filled,
// cengen11):
//   (7, 0x21 / 0x36) L2 M12 f58 (0xf70448..0xf70784): sp_13 4 at the target, then (r7 0) sp_13 3 with +0x30 = 0 and 1; (7, 0x22 / 0x37)
//   the first only -- each at variant 0 alone (e+0xb5f5);
//   (7, 0x18 / 0xca / 0xcb) L4 M37 (0xf6f15c): phase 1, at every pass of f140, P+0x1a2 += 1 and the hop (0xc10d4, toward the class's
//   point table 0x212e090 / 0x212e130 / 0x212e1d0 by r1: nine points, (-1, -1, -1) after -- P+0x1a3 = 1, the phase's end at the motion's
//   end), then sp_13 (P+0x1a2 % 3 == 1 ? 1 : 0) with +0x30 = P+0x1a2 - 1: nine shots, one a pass;
//   NOT BUILT, by name: sp_01 (0x122) as the actions make it -- (1, 0x43) / (7, 0xc / 0xd) / (12, 0) L4 M20 f26 mode 4, (2, 7) / (7, 0x43)
//   L4 M66 f150 mode 1, (7, 0xb / 0x3a / 0x41 / 0x42 / 0x44 / 0x45) L4 M12 f190 mode 3: its reader takes no EffectParam (below) -- hit
//   volumes that draw nothing. The landings' children (sp_01 8..11) are made, as the ROM makes them, and start nothing.
// sp_13's reader 0xf78934 (READ whole): ef 0..3; hit 0; +0x15e0 (bfc / orrne over the ctor's 0): 8 int 0, 0x10 int 1, then |= 0x60; floats
// 0 speed +0x15ec, 2 gravity +0x15f4, 1 per unit +0x160c, 4 far +0x1600, 3 near +0x15fc, 5 life +0x15f8; &vec 0 -> both points; the far and
// the near times the owner's size (0xbe518); bytes +0x15c1 = +0x15c3 = 1; then by the mode (0x4a0ee4): < 2 -> the ShellCmnParam's int 0
// points (cmn vecs 0.., 0x4a22a8), 3 -> its int 1 points (cmn vecs 9..), into the array +0x167c (count +0x1684, 16 B each). The joint
// +0x15e4 the ctor's -1 (0x404350)
function params067s13(def, mode, m){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const c = def.cmn, V = (k, n) => Array.from({ length: n }, (_, i) => (c.vecs[k + i] || ZERO3).map(f));
  return { joint: -1, flags: 0x60 | (I(0) !== -1 ? 8 : 0) | (I(1) !== -1 ? 0x10 : 0),
           speed0: F(0), speedPer: F(1), gravity: F(2), near: F(3), far: F(4), life: F(5), y1614: f(0.0), f15f0: f(0.0),
           limitA: f(0.0), limitB: f(0.0), vec: (sh.vecs[0] || ZERO3).map(f),
           points: m < 2 ? V(0, c.ints[0]) : m === 3 ? V(9, c.ints[1]) : null };
}
// vt+0x170 0xf79090 (READ whole), the target: modes < 2 -> point [+0x1640] (the setup's +0x30) x the size, turned by the block's words Z
// (+0x58), X (+0x50), Y (+0x54), plus the block's +0x40; mode 3 the same with y = the target's (block +0x1d4); any other the block's
// target +0x1d0 (base13's own 0x405a60)
function target067s13(S, own){
  const k = S.k, m = S.modeIndex;
  if (m >= 2 && m !== 3) return own.target.slice();
  const p = k.points[S.point067] || ZERO3, sz = size001(own);
  const v = turnByWords([f(sz * p[0]), f(sz * p[1]), f(sz * p[2])], [own.ownerX, own.ownerY, own.ownerZ]);
  const P = own.ownerPos;
  const T = [f(P[0] + v[0]), f(P[1] + v[1]), f(P[2] + v[2])];
  if (m === 3) T[1] = own.target[1];
  return T;
}
// 0x405500 on +0x15e0 0x68 / 0x78 (0x40: from the owner's block +0x40; 4 clear: the clamp arm): the distance to vt+0x170's point clamped
// [near, far] (already times the size), along the aim 0x4053e4 -- 0x10 (mode 4): the owner's facing; else 0x20: the bearing from the
// owner's block point to that point, clamped to the limits (the ctor's 0 / 0: not clamped) -- the setup's +0x20 added, the height the
// point's plus +0x1614
function thrown067s13(S, own){
  const k = S.k, P = own.ownerPos, T = target067s13(S, own);
  const dx = f(T[0] - P[0]), dz = f(T[2] - P[2]);
  let d = sqrtf(mla(mla(0.0, dx, dx), dz, dz));
  d = k.near > d ? k.near : d;
  d = d > k.far ? k.far : d;
  let a;
  if (k.flags & 0x10) a = own.ownerY >>> 0;
  else {
    a = wordOf(dx, dz);
    const dd = u16(a - own.ownerY), limB = wordOfDeg(k.limitB), limA = wordOfDeg(k.limitA);
    if (dd > limB && limB !== 0) a = (own.ownerY + limB) >>> 0;
    else if (!(dd >= limA)) a = (own.ownerY + limA) >>> 0;
  }
  const rad = f(u16(a) * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
  const ox = f(0.0 + S.centre[0]), oz = f(d + S.centre[2]);
  return [f(P[0] + mla(f(ox * cs), oz, sn)), f(T[1] + S.y1614), f(P[2] + mls(f(oz * cs), ox, sn))];
}
function make067s13(state, D, m, point, own, ctx, action, frame){
  const def = D.shells.shell13, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'shell13 mode ' + m + ': no files in this arc' };
  if (!own.ownerPos || !own.target) return { why: 'no owner position / target (input.ownerPos, input.rock.target)' };
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell13', cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 2, point067: point,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              centre: null, lifetime: 0, timer: 0, clock: 0, moves: 0, aim: 0, launch: null, events: [],
              folder: def.folder, effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params067s13(def, mode, m);
  S.k.far = f(size001(own) * S.k.far); S.k.near = f(size001(own) * S.k.near);   // the reader's 0xbe518 (0xf78ad8..0xf78b04)
  if (S.k.points && !S.k.points[point]) return { why: 'shell13 mode ' + m + ': no point ' + point + ' in its ShellCmnParam' };
  if (!init13t(S, own, thrown067s13)) return { why: 'shell13 mode ' + m + ': its init path is not his' };
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return { S };
}
// base13's init 0x4044d8 with joint -1 and 0x80 clear (Tetsucabra's and Zamtrios's sp_13): the owner's +0x40 plus the points' midpoint
// turned by his words and, with flag 8, times his size; the launch to `thrown` (0x404dc8: the file's gravity, the speed + per unit x the
// distance); the pitch ratio's second pair moves +0x40 by nothing (both points vec 0)
function init13t(S, own, thrown){
  const k = S.k;
  S.centre = ZERO3.slice();
  S.y1614 = k.y1614;
  S.lifetime = k.life;
  S.angles = [0, 0, 0];
  if (k.joint !== -1 || !own.ownerPos || !own.target) return false;
  const W = [own.ownerX, own.ownerY, own.ownerZ], sz = (k.flags & 8) ? size001(own) : f(1.0);
  const pair = r => {
    const v = turnByWords([0, 1, 2].map(i => mla(k.vec[i], f(k.vec[i] - k.vec[i]), r)), W);
    return (k.flags & 8) ? v.map(x => f(sz * x)) : v;
  };
  const m1 = pair(f(0.5));
  let pos = [f(m1[0] + own.ownerPos[0]), f(m1[1] + own.ownerPos[1]), f(m1[2] + own.ownerPos[2])];
  S.position = pos;
  const T = thrown(S, own), P = S.position;
  const ex = f(P[0] - T[0]), ez = f(P[2] - T[2]);
  let dy = f(T[1] - P[1]);
  dy = dy > 0 ? (k.f15f0 > 0 ? f(0.0) : dy) : dy;
  const dist = sqrtf(mla(mla(0.0, ex, ex), ez, ez));
  const speed = mla(k.speed0, k.speedPer, dist);
  const t = f(dist / speed);
  const vy = f(mla(dy, f(f(t * t) * k.gravity), f(-0.5)) / t);
  const a = wordOf(f(T[0] - pos[0]), f(T[2] - pos[2]));
  const rad = f(u16(a) * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
  S.velocity = [f(speed * sn), vy, f(speed * cs)];
  S.gravity = [f(0.0), k.gravity, f(0.0)];
  const h = sqrtf(mla(f(speed * speed), f(0.0), f(0.0)));
  const w = u16(0x10000 - u16(s32(mla(0.5, atan2f(f(-vy), h), RAD_TO_U16))));
  const ratio = w > 0x8000 ? f(1.0) : w > 0x2000 ? f(0.0) : mla(f(1.0), f(w), f(-0.0001220703125));
  const m2 = pair(ratio);
  pos = [0, 1, 2].map(i => f(m2[i] + f(pos[i] - m1[i])));
  S.position = pos;
  S.anchor = pos.slice();
  S.aim = a;
  S.ratio = ratio;
  S.launch = { point: pos.slice(), thrown: T.slice(), aim: a, dist, speed, t, ratio,
               velocity: S.velocity.slice(), gravity: S.gravity.slice(), life: S.lifetime, angles: [0, 0, 0] };
  S.timer = f(0.0);
  return true;
}
// sp_13's landing 0xf78ed0 (READ whole), state 2 only: type 0 -> ef 1 (+0x15cc), type 1 -> ef 2 (+0x15d0), each after 0xf78f60 (owner
// active, mode <= 4 with bit (0x1b >> mode): sp_01 [0x16a0be0][mode] = {8, 9, 8, 10, 11} at the contact, its words +0xfe8.. at +0x30, +0x3c
// the shell's +0x13dc, the zero vector at +0x20); then 0x4042bc at the contact and the end; type 2 -> ef 3, no end; any other the end
const CHILD067 = [8, 9, 8, 10, 11];
function landing067s13(S, D, ctx, out){
  const hit = S.events.find(e => e.ev === 'hit');
  if (!hit || S.state !== 2) return 'keep';
  const n = S.events.length, m = S.modeIndex;
  if ((hit.type === 0 || hit.type === 1) && m <= 4 && ((0x1b >> m) & 1) && ctx && ctx.create)
    ctx.create(S, 'shell01', { mode: CHILD067[m], position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
  const param = [1, 2, 3][hit.type];
  if (param) contactStart(S, D, param, hit.point, 'landing');
  for (const e of S.events.slice(n)) if (e.ev === 'start') out.started.push({ shell: S, start: e.start });
  if (hit.type === 2) return 'keep';
}
// sp_01's reader 0xf78458 (READ whole): hit 0; +0x15ec 4 int 0, 8 int 1, 0x1000 int 2 -- and NO EffectParam: +0x15c8..+0x15d4 keep the
// ctor's 0 (0x3fa2f8), so no mode starts its file's (0, 1) / (0, 11); the timer +0x15f0 the ctor's 0
function params067s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  return { flags: (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0) | (I(2) !== -1 ? 0x1000 : 0), joint: -1, timer: f(0.0), f1600: f(0.0),
           f15fc: f(1.0), vec: [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0),
           why: !sh ? 'uShellEm067_sp_01: a mode its files do not carry' : null, efAt: { 0x15c8: null, 0x15cc: null, 0x15d0: null } };
}
// the spawners (code 'em067'): rows { frame, made: [[mode, point], ..] } by pass001; `hop067`: one shot a pass of f140 (state.shots, kept
// across the clip's wraps -- the phase loops the motion -- and cleared by a new motion; past the ninth a new action)
function spawn067(state, D, a, ctx, input, out, fresh){
  if (fresh || !state.hist || !state.prevJoints) return;
  const own = ctx.own001;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    let made = sp.made;
    if (sp.hop067){
      state.shots = (state.shots || 0) >= 9 ? 1 : (state.shots || 0) + 1;
      made = [[state.shots % 3 === 1 ? 1 : 0, state.shots - 1]];
    }
    for (const [m, point] of made){
      const r = make067s13(state, D, m, point, own, ctx, a.action, sp.frame);
      if (!r.S){ out.refused.push({ action: a.action, shell: 'shell13', mode: m, why: r.why }); continue; }
      state.shells.push(r.S); out.spawned.push(r.S);
    }
  }
}
const act067 = (n, list, clip, spawns, x = {}) => Object.assign({ action: [7, n], code: 'em067', list, clip, pick: 'ai',
  variant: '7:0x' + n.toString(16).padStart(2, '0'), spawns }, x);
delete SHELL_DATA.em067_00.beamsOnly;
SHELL_DATA.em067_00.name = 'Zamtrios';
// shell13: his ice / mud balls (u 0 / 10 flying, u 1 / 11 at a contact); cmn: the ShellCmnParam (ints 9, 2: the two point lists)
SHELL_DATA.em067_00.shells.shell13 = { id: 0x124, cls: 'uShellEm067_sp_13', base: 'base13', reader: 0xf78934, folder: 'shell\\em\\em067_00_shell13',
  modes: @M13@,
  cmn: @CMN13@, hitdata: [[0, 99], [0, 99], [0, 99], [0, 99]] };
// shell01: hit volumes (its reader takes no EffectParam)
SHELL_DATA.em067_00.shells.shell01 = { id: 0x122, cls: 'uShellEm067_sp_01', base: 'base01', reader: 0xf78458, folder: 'shell\\em\\em067_00_shell01',
  modes: @M01@, hitdata: @HD01@ };
SHELL_DATA.em067_00.actions = SHELL_DATA.em067_00.actions.concat([
  act067(0x21, '2', 'Motion[12]', [{ frame: 58, made: [[4, 0], [3, 0], [3, 1]] }], { also: [[7, 0x36]] }),
  act067(0x22, '2', 'Motion[12]', [{ frame: 58, made: [[4, 0]] }], { also: [[7, 0x37]] }),
  act067(0x18, '4', 'Motion[37]', [{ frame: 140, hop067: true }], { also: [[7, 0xca], [7, 0xcb]] }),
]);
