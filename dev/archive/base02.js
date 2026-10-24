// em004_00 / em005_00 shell02's spawner 0xd28bb4 (EMC, dev/em004-shell02-spec.md 2): phase 1, after the
// frame test at 0xd28d54 (142.0), `mov sb,#1` at 0xd28d6c then `cmp [+0xb5f4],#4` -- Basarios keeps mode 1;
// Gravios falls through and recomputes it from the [+0xcac0]+0x24 flag bits. The spawn at 0xd29570 writes
// the class id and the mode, and 0xd2958c..0xd295a0 puts THE OWNER'S OWN +0x40/+0x44/+0x48 into the
// request's +0x10/14/18 -- the monster's position at spawn time, which the viewer hands shells as ownerPos.
//
// THE AIM, request +0x20 (read 2026-09-30). Phase 0 (the action's first update) raises the target 100
// (0xd28c20: P+0x1d4 += 100.0) and CLASSIFIES it into P+0x1a2 (0xd28f94..0xd290fc) in the owner's frame, against a
// point v0 x size above the owner (v0 = (0, 330, 0): the constant at 0x2123650, read in the initialised image): class 2
// when the target is behind it (the forward component < 0), or below it by no more than 330 x size, or below it and
// within 700 x size; otherwise 1 or 0 by its pitch word (0xd290f4: <= 0x8000 -> 1). At the spawn (0xd292a0) class 2
// leaves the aim 0; class 0 / 1 aims (0xd292ac..0xd29540): the pitch word to the target from JOINT 3 in the owner's
// vertical plane, less the head's own pitch word (the owner's forward and up rows against joint 3's forward row),
// clamped to -0x38d .. +0x1555 around the head. The owner's rotation is the tilt 0xd29708 (the monster's up vector
// against the world's: identity on the viewer's flat floor) times the matrix of its quaternion, which the viewer
// rebuilds from the yaw word it keeps (the monster never pitches or rolls here) -- both stand-ins, named.
const V0_02 = [f(0.0), f(330.0), f(0.0)];       // 0x2123650 (.bss, filled at boot; read under the emulator)
function owner02(own){                          // the owner's rows: tilt (identity) x its quaternion's matrix (0xd28e8c..)
  const y = f(f(own.ownerY & 0xffff) * U16_TO_RAD);
  const qy = sinf(f(y * f(0.5))), qw = cosf(f(y * f(0.5)));
  const qy2 = f(qy + qy), yy = f(qy * qy2), yw = f(qy2 * qw);
  return [[f(1 - yy), 0, f(0 - yw)], [0, f(1), 0], [yw, 0, f(1 - yy)]];     // rows 0 (right), 1 (up), 2 (forward)
}
const dot3r = (r, d) => mla(mla(f(r[1] * d[1]), r[0], d[0]), r[2], d[2]);   // the vmul / vmla order the ROM uses
function class02(own){                          // phase 0's P+0x1a2
  const M = owner02(own), size = f(own.size[0] * own.size[1]);
  const T = [own.target[0], f(own.target[1] + f(100.0)), own.target[2]];
  const v = V0_02.map(x => f(size * x));
  const ref = [0, 1, 2].map(k => f(mla(mla(f(v[1] * M[1][k]), v[0], M[0][k]), v[2], M[2][k]) + own.ownerPos[k]));
  const d = [f(T[0] - ref[0]), f(T[1] - ref[1]), f(T[2] - ref[2])];
  const fwd = dot3r(M[2], d);
  if (fwd < 0) return 2;
  const up = dot3r(M[1], d);
  if (!(up > 0)){
    if (up >= f(-f(V0_02[1] * size))) return 2;
    if (mla(f(fwd * fwd), up, up) <= f(f(size * f(700.0)) * f(size * f(700.0)))) return 2;
  }
  const lat = dot3r(M[0], d);                   // less v1 = the shared empty vector (0x1831a78): nothing
  const w = u16(s32(mla(f(0.5), atan2f(f(-up), sqrtf(mla(f(fwd * fwd), lat, lat))), RAD_TO_U16)));
  return w <= 0x8000 ? 1 : 0;
}
function aim02(own, J3){                        // the spawn's request +0x20 for class 0 / 1 (0xd292ac..0xd29540)
  const M = owner02(own), T = [own.target[0], f(own.target[1] + f(100.0)), own.target[2]];
  const jr2 = [J3[8], J3[9], J3[10]], jp = [J3[12], J3[13], J3[14]];
  const headF = dot3r(M[2], jr2), headU = dot3r(M[1], jr2);
  const d = [f(T[0] - jp[0]), f(T[1] - jp[1]), f(T[2] - jp[2])];
  const fwd = dot3r(M[2], d), up = dot3r(M[1], d);
  const wt = s32(mla(f(0.5), atan2f(f(-up), sqrtf(f(fwd * fwd))), RAD_TO_U16));
  const wh = s32(mla(f(0.5), atan2f(f(-headU), sqrtf(f(headF * headF))), RAD_TO_U16));
  const r1 = wt - wh, x = u16(r1 + 0x38d);
  let r6 = 0xfc73;
  if (x < 0x8c71) r6 = 0x1555;
  if (x <= 0x18e2) r6 = r1;
  return u16(r6 + wh);
}
function spawn02b(state, D, a, ctx, input, out){
  const own = owner001(input);
  const why = !own.ownerPos ? 'no owner position (input.ownerPos), the spawn point (0xd2958c)'
            : !own.facing ? 'no owner facing (input.owner.y), the frame its class and aim are taken in'
            : !own.target ? 'no target (input.rock.target), which phase 0 classifies (0xd28f94)' : null;
  if (!why && state.cls02 == null) state.cls02 = class02(own);          // phase 0: once, as the action begins
  for (const sp of (a.spawns || [])){
    const frames = sp.frames || [], modes = sp.modes || (sp.mode != null ? [sp.mode] : []);
    frames.forEach((F, j) => {
      if (!pass001(state, F)) return;
      const mode = modes[j] != null ? modes[j] : modes[0];
      const def = D.shells[sp.shell], m = def && def.modes[mode];
      if (!m) return;
      if (why){ out.refused.push({ action: a.action, shell: sp.shell, mode, frame: F, why: 'em004_00 shell02: ' + why }); return; }
      const J3 = state.prevJoints(3) || state.prevJoints(0);
      const aim = state.cls02 <= 1 ? aim02(own, J3) : 0;
      const S = make02(state, D, sp.shell, mode, own, state.prevJoints, aim, ctx.ownerMotion, a.action, F);
      if (S.refused){ out.refused.push({ action: a.action, shell: sp.shell, mode, frame: F, why: S.refused }); return; }
      out.spawned.push(S); state.shells.push(S);
    });
  }
}

// ---- base02: init, activation, move, ending (em004_00 / em005_00 shell02, u 130: the FIRE BEAM) -----------------------
// Read 2026-09-30, ROM-run under the emulator on the em004_00 arc (scratchpad bshell/b02run.py: kharness's scaffolding
// with the ShellCmnParam getters answered from the real FUP), which is how each link below was checked.
//   init  = vtable +0x13c 0xd30b84: 0x3fb9bc (the reader; +0x15d4 = the owner's motion id, +0x15cc = life, state 1),
//           then the base's 0x3fc750 -- the ORIGIN +0x15e0 = the joint's position (0xc164c) + the cmn offset in the
//           joint's space, and the RAY: +0x40 = origin + (the angle words' forward x length) x the aim matrix, +0x1000
//           (the anchor) = origin + (+0x167c, the shared empty vector) -- then its own body pushes the origin by the cmn
//           float 1 along the joint's second row. The aim matrix is the class's +0x15c (0xd30e30) for a code-1 mode
//           (table 0x169bbb0: modes 1 2 5 6): the owner's rotation made angles (0x7c3a38), the request's +0x20 added to
//           the pitch (x 2pi/65536), rebuilt (0xd31104..). The length is +0x160 (0x3fd288): the cmn float 0, scaled by
//           (+0x1664 - +0x15d0) / +0x1664 where +0x1664 is set (the ctor's 0 here), and 1.0 where it comes out 0.
//   activation = vtable +0x18 0x3fbaf8 (the unit manager's state 1 -> 2): +0x168 first, then ITS EFFECT -- _ef param 0
//           (+0x1644) started at the origin with the rotation override (+0x14 |= 2) from the origin toward +0x40
//           (pitch, yaw, and a roll atan2(-dx, dy)), kept at +0x1600.
//   move  = vtable +0x24 0x3fbdc8 -> 0x3fbe60, per frame: +0x168 (0xd30cec: END when the joint's position is more than
//           250 x size from the origin), the stage query 0x3fc070 (whose hit only feeds +0x1648's effect and bit 2's
//           position copy: neither is his -- below), 0x3fc378 (the effect RE-PLACED at the origin, pitch / yaw toward
//           +0x40 and roll = the owner's Z word P+0x58), then the life +0x15cc counted down by the owner's rate x dt (END
//           at 0) and END when the owner's motion is no longer +0x15d4 (+0x170 0x3fd4c4).
//   end   = vtable +0x148 0x3fc698(0): both handles stopped gracefully (0x43b058), state 0xfe, +0x15cc = 30 x 60; the
//           ending +0x150 0x3fc610 counts it down and waits for the handles (the per-frame entry drops a dead one).
// WHAT IS NOT TRANSCRIBED, BY NAME -- every one inert on this monster's data, each refused where it would matter:
//   * flags +0x1674 bits 0 / 1 / 2 / 3 (the owner-matrix arm 0x3fcac0, the X-angle turn 0x232118, the position copy
//     0x3fd300 and the length stretch 0x3fc540, the other direction 0x3fcd3c): the base ctor stores 0 (0x3fb940) and
//     his reader writes nothing there;
//   * the step's own effect (+0x1648, _ef param 1, created at 0x3fd424): his reader fills +0x1644 alone;
//   * the joint -1 arm (the owner's +0x40 and its vtable +0x54 matrix): his joint is 3;
//   * the other behaviour codes of +0x15c (2: an angle from request +0x20 alone; 3 / 4: a normalisation) -- his mode is
//     code 1; and the hit capsules (0x3fc1c8) and the sound link (+0x16c: 0x4eeed0 with the _snd id 201, ROM-run).
// Stand-ins, also named: the owner's rotation is rebuilt from the yaw word (no tilt, pitch or roll), its rate is ctx.speed.
function make02(state, D, name, modeIndex, own, J, aim, motionId, action, F){
  const def = D.shells[name], mode = def.modes[modeIndex];
  const k = READERS02[def.reader];
  if (!k) return { refused: 'no base02 reader for 0x' + (def.reader || 0).toString(16) };
  const p = k(def, mode);
  const code = [1, 1, 2, 4, 1, 1, 2, 2, 2, 3, 3, 4][modeIndex - 1];          // 0x169bbb0 by mode - 1
  if (code !== 1) return { refused: 'base02 behaviour code ' + code + ' (mode ' + modeIndex + ') is not transcribed: only code 1' };
  if (p.joint === -1) return { refused: "base02's joint -1 arm (the owner's +0x40 and vtable +0x54 matrix) is not transcribed" };
  const S = { id: state.nextId++, monId: state.monId, shell: name, cls: def.cls, globalId: def.id, base: 'base02',
              mode, modeIndex, action, spawnFrame: F, state: 1, position: null, anchor: null, origin: null, angles: null,
              timer: 0, life: p.life, motionId, activated: false, p, effect: null, effect2: null, start: null, place: null,
              stop: null };
  const Jm = J(p.joint) || J(0);                                               // 0xc15a4 / 0xc164c: an unmapped joint is joint 0's
  const o = p.offset;
  // 0x3fc848..: the joint's position, then the offset in its space (the vmul / vmla order of 0x3fca58..0x3fcabc)
  const origin = [0, 1, 2].map(i => f(mla(mla(f(o[1] * Jm[4 + i]), o[0], Jm[i]), o[2], Jm[8 + i]) + Jm[12 + i]));
  // the aim matrix (+0x15c, code 1): the owner's rows made angles (0x7c3a38), request +0x20 onto the pitch, rebuilt
  const M = owner02(own);
  const ex = f(-asinf(M[2][1])), ey = f(-atan2f(f(-M[2][0]), M[2][2])), ez = f(-atan2f(f(-M[0][1]), M[1][1]));
  const x = mla(ex, f(aim), U16_TO_RAD);
  const sx = sinf(x), sy = sinf(ey), sz = sinf(ez), cx = cosf(x), cy = cosf(ey), cz = cosf(ez), sxy = f(sx * sy);
  const A = [[mla(f(cy * cz), sxy, sz), f(sz * cx), mls(f(f(sx * sz) * cy), sy, cz)],
             [mls(f(sy * f(sx * cz)), sz, cy), f(cx * cz), mla(f(f(sx * cy) * cz), sy, sz)],
             [f(sy * cx), f(-sx), f(cx * cy)]];
  // the length, +0x160 (0x3fd288): +0x1664 is the ctor's 0 here, so the cmn float as it is, 1.0 where that is 0
  const L = p.length === 0 ? f(1) : p.length;
  // the angle words (0x3fc804..: degrees x 182.0444, +0.5, truncated), the forward of those angles x L (0x3fcbc8..)
  const wx = u16(s32(mla(f(0.5), p.angles[0], DEG_TO_U16))), wy = u16(s32(mla(f(0.5), p.angles[1], DEG_TO_U16)));
  const ax = f(f(wx) * U16_TO_RAD), ay = f(f(wy) * U16_TO_RAD);
  const s29 = mla(f(L * cosf(ax)), sinf(ax), 0);
  const dy = mls(f(cosf(ax) * 0), L, sinf(ax)), dz = mls(f(s29 * cosf(ay)), sinf(ay), 0), dx = mla(f(cosf(ay) * 0), sinf(ay), s29);
  S.position = [0, 1, 2].map(i => f(mla(mla(f(dy * A[1][i]), A[0][i], dx), dz, A[2][i]) + origin[i]));   // +0x40
  S.anchor = origin.slice();                                                  // +0x1000: origin + the empty vector
  // 0xd30b84's body, after the base's: the origin pushed along the joint's second row by the cmn float 1
  S.origin = [0, 1, 2].map(i => mla(origin[i], p.push, Jm[4 + i]));
  S.folder = def.folder;
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (D.lists[listId] || {}).list || null, key, started: false }));
  return S;
}
function angles02(S){                           // pitch, yaw and the activation's roll, from the origin toward +0x40
  const d = [f(S.position[0] - S.origin[0]), f(S.position[1] - S.origin[1]), f(S.position[2] - S.origin[2])];
  const word = a => u16(s32(mla(f(0.5), a, RAD_TO_U16)));
  return { pitch: word(atan2f(f(-d[1]), sqrtf(mla(f(d[2] * d[2]), d[0], d[0])))), yaw: word(atan2f(d[0], d[2])),
           roll: word(atan2f(f(-d[0]), d[1])) };
}
function far02(S, J, own){                      // +0x168 0xd30cec: the joint more than 250 x size from the origin
  const jm = J(S.p.joint) || J(0), o = S.origin;
  const dy = f(jm[13] - o[1]), dx = f(jm[12] - o[0]), dz = f(jm[14] - o[2]);
  const r = f(f(own.size[0] * own.size[1]) * f(250.0));
  return mla(mla(f(dy * dy), dx, dx), dz, dz) > f(r * r);
}
function end02(S, out){                          // vtable +0x148(0) 0x3fc698
  if ((S.state & 0xfe) === 0xfe) return;
  S.state = 0xfe;
  S.life = ENDING_FRAMES;                                                       // +0x15cc: the life becomes the cap
  S.stop = (S.effect && !S.effect.gone) ? { param: 0, request: 0, key: S.effect.key } : null;   // 0x43b058 -> 0x329c40(h, 0)
  out.ended.push(S);
}
function step02(S, J, ctx, input, D, out){
  const alive = p => (input.effectAlive ? !!input.effectAlive(S, p) : true);
  const own = owner001(input);
  if (!S.activated){                           // vtable +0x18 0x3fbaf8, run once by the unit manager as the unit goes live
    S.activated = true;
    if (far02(S, J, own)) end02(S, out);                                        // its +0x168 first
    const a = angles02(S), p = S.mode.ef[0], L = p && D.lists[p[0]];           // then the effect, whatever +0x168 did
    if (p && p[0] <= 7 && p[1] >= 0 && L){
      S.start = { param: 0, listId: p[0], list: L.list, pel: L.pel, key: p[1],
                  requester: { position: S.origin.slice(),
                               rotationDeg: [f(a.pitch * U16_TO_DEG), f(a.yaw * U16_TO_DEG), f(a.roll * U16_TO_DEG)],
                               scale: [f(S.mode.scale), f(S.mode.scale), f(S.mode.scale)], parent: 'shell',
                               flags14: 0x40000002, flags1c: 3, type8: 3 } };
      S.effect = { param: 0, key: p[1] };
      S.effects[0].started = true;
    }
  }
  // vtable +0x24 0x3fbdc8: a handle whose unit left states 1 / 2 is dropped, then the state byte decides
  if (S.effect && !S.effect.gone && S.start && !alive(0)) S.effect.gone = true;
  const live = () => !!(S.effect && !S.effect.gone);
  if (S.state === 0xfe){                                                        // +0x150 0x3fc610, the ending
    S.place = null;
    const T = S.life;
    if (!(T > 0)){ S.life = 0; S.state = 0xff; return; }
    const n = f(T - ctx.dt);
    S.life = f(0) >= n ? f(0) : n;
    if (!(n > 0) || !live()) S.state = 0xff;
    return;
  }
  if (S.state !== 1) return;
  // the move 0x3fbe60: +0x168, the stage query, the hit sweep, the placement, the sound, the life
  if (far02(S, J, own)) end02(S, out);                                          // 0xd30cec -- and the chain goes on
  const a = angles02(S);                                                        // 0x3fc378: at the origin, while held
  S.place = live() ? { param: 0, position: S.origin.slice(),
                       rotationDeg: [f(a.pitch * U16_TO_DEG), f(a.yaw * U16_TO_DEG), f(f(own.ownerZ >>> 0) * U16_TO_DEG)] } : null;
  const T = S.life;                                                             // +0x15cc (0x3fbfc8..0x3fc048)
  if (!(T > 0)){ S.life = 0; end02(S, out); return; }
  const n = mls(T, ctx.speed, ctx.dt);                                          // the owner's rate x the frame delta
  S.life = f(0) >= n ? f(0) : n;
  if (!(n > 0)){ end02(S, out); return; }
  if (ctx.ownerMotion != null && ctx.ownerMotion !== S.motionId) end02(S, out); // +0x170 0x3fd4c4: another motion
}
