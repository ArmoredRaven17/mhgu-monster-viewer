// ---- AHTAL-KA'S SILK BALLS: shell00 = uShellEm088_sp_00 on base00, and the motion event table that fires them --------------
// dev/rom-map.md "Ahtal-Ka -- his shells read and built" (READ: sp_00 ctor 0x10c30d4, init 0x10c315c, reader 0x10c34c0, +0x158
// 0x10c3224, +0x168 0x10c375c, +0x150 0x10c389c; base00's init / move / X aim as transcribed above). Checked against the ROM run
// (scratchpad sh88/emu00.py) by dev/shells-ahtal-check.mjs.
// THE READER 0x10c34c0: ef 0..3 -> +0x15c8..+0x15d4, ef 4 -> +0x1670; hit 0 / 1 -> +0x15d8 / +0x1668; int 0 the joint; the flags
// (base00's ctor 0) bit 0 = int 1, bit 1 = int 2, bit 2 = int 3, 0x10 = int 4, 0x20 = int 5 (each != -1); floats 0..6 -> vz, vy,
// flight, X lo / hi, Y lo / hi; vec 0 the offset, vec 1 the aim offset +0x1618; float 7 -> +0x1660 (the split factor); +0x15ec
// (degX) and +0x161c (the gravity) not written: 0 and the zero vector. +0x15f0 (degY) is the init's: setup +0x30, THE YAW OFFSET
// IN DEGREES the event row gives (0x10c3164; base00's Y adjust 0x3f9cc4 adds it, bit 1 clear).
function params088s00(mode, yaw){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: I(0), flags: (I(1) !== -1 ? 1 : 0) | (I(2) !== -1 ? 2 : 0) | (I(3) !== -1 ? 4 : 0) | (I(4) !== -1 ? 0x10 : 0) | (I(5) !== -1 ? 0x20 : 0),
           xDeg: f(0), yDeg: f(yaw || 0), vz: F(0), vy: F(1), flight: F(2), xLo: F(3), xHi: F(4), yLo: F(5), yHi: F(6),
           vec: V(0), aimOff: V(1), split: F(7), gravity: ZERO3.slice() };
}
// base00's init 0x3f8b80 on sp_00's reader, then sp_00's tail (0x10c3184..0x10c3214): +0x1664 = the ground distance from +0x40 to
// the aim's target +0x1640 (0x3f9b58: T + the turned aim offset) times float 7. Mode 0 (flags 5): the joint's point, the owner's
// words, X aimed at the target from that point (clamp X lo..hi), Y + the yaw offset; mode 1 (flags 0x30, the split child): the
// request's point and words
function make088s00(state, D, m, J, own, ctx, req){
  const def = D.shells.shell00, mode = def.modes[m];
  if (!mode) return { why: 'shell00 mode ' + m + ': no files' };
  const k = params088s00(mode, req.yaw);
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell00', cls: def.cls, globalId: def.id, base: 'base00', mode,
              modeIndex: m, action: req.action, spawnFrame: req.frame, motion: ctx.motion, state: 1, k,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null, trail: null,
              timer: 0, moves: 0, bounces: 0, held: false, launch: null, events: [], folder: def.folder,
              effect: null, effect2: null, start: null, place: null, stop: null, split: f(0.0) };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (D.lists[listId] || {}).list || null, key, started: false }));
  let p, A;
  if (k.flags & 0x10){
    p = req.pos.map(f);
    A = (k.flags & 0x20) ? req.words.map(w => w >>> 0) : [own.ownerX >>> 0, own.ownerY >>> 0, 0];
    p = [f(p[0] + k.vec[0]), f(p[1] + k.vec[1]), f(p[2] + k.vec[2])];
  } else {
    A = (k.flags & 0x20) ? req.words.map(w => w >>> 0) : [own.ownerX >>> 0, own.ownerY >>> 0, 0];
    const M = jointMatrix(J, k.joint);
    if (!M) return { why: 'no matrix for joint ' + k.joint };
    p = launchPoint(M, k.vec);
  }
  const got = { target: own.target, ownerX: own.ownerX >>> 0, ownerY: own.ownerY >>> 0 };
  if ((k.flags & 1) && !got.target) return { why: 'no target (input.rock.target): the X aim reads block +0x1d0' };
  const ax = xAdjust37(k, p, got), ay = yAdjust37(k, p, got);
  A[0] = (A[0] + ax) >>> 0; A[1] = (A[1] + ay) >>> 0;
  S.angles = A;
  S.aimTarget = (k.flags & 1) ? aim37(p, got.target, k.aimOff).target : (got.target ? got.target.slice() : null);
  S.timer = k.flight;
  S.position = p; S.anchor = p.slice(); S.prevPosition = p.slice();
  S.gravity = gravityOf(k.gravity, A[1]);
  S.velocity = launchVelocity(k.vy, k.vz, A);
  if (S.aimTarget){
    const dx = f(S.aimTarget[0] - p[0]), dz = f(S.aimTarget[2] - p[2]);
    S.split = f(sqrtf(mla(mla(0.0, dx, dx), dz, dz)) * k.split);
  }
  S.start = rockRequest(D, mode, 0, S.position, 'flight');
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return { S };
}
// sp_00's collide, vt+0x168 0x10c375c: NO stage query -- (no hunter hit) the world plane y = 0: at or below it, a type-1 contact at
// (x, 0, z) (the y a literal 0 over the point's), which base00's landing (0x10c389c = 0x3f8878 for type 1) starts ef 2 (u 32) at
const COLLIDE00 = { uShellEm088_sp_00: S => (S.position[1] > 0) ? null : { point: [S.position[0], f(0.0), S.position[2]], normal: [0, 1, 0], attr: 0, type: 1 } };
// sp_00's +0x158 after base00's move (0x10c3224..): still in state 1 with +0x1664 > 0, the step's ground travel (+0x1000 against
// +0x40) taken off it; below 0, shell00 MODE 1 at this point with these words (+0x30 0), and this shell ends (vt+0x148(0))
const AFTER00 = {
  uShellEm088_sp_00(S, ctx, D, out){
    if (S.state !== 1 || !(S.split > 0)) return;
    const a = S.anchor, p = S.position;
    const step = sqrtf(mla(mla(0.0, f(a[0] - p[0]), f(a[0] - p[0])), f(a[2] - p[2]), f(a[2] - p[2])));
    const rem = f(S.split - step);
    S.split = rem;
    if (!(rem < 0)) return;
    const r = ctx.state088 ? make088s00(ctx.state088, D, 1, ctx.J, ctx.own001, ctx,
                                        { pos: p.slice(), words: S.angles.slice(), yaw: 0, action: S.action, frame: S.spawnFrame }) : null;
    if (r && r.S){ r.S.creator = S.id; ctx.state088.shells.push(r.S); out.spawned.push(r.S); }
    S.events.push({ ev: 'create', stepped: true, shell: 'shell00', mode: 1, child: r && r.S ? r.S.id : null });
    end(S);
    if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
    out.ended.push(S);
  },
};
// THE MOTION EVENT TABLE (0x6c590, run from E's frame update; its rows `ahtal/seq088.txt`): a row of the selector the action runs
// under (EMC op 0xa3 (0, n), applied at the action's start, 0x6cb14), of the playing motion, fires its type when its kind holds:
// kind 1 the frame crossing (0x72714 mode 0: pass001), kind 5 the crossing of f0 by the clock cad0 (cad4 <= f0 < cad0; cad0 +=
// [E+0x50c] x dt each frame, zeroed at the action start and at setMotion, not at a loop). Type 8 = shell00 mode 0 with the row's
// yaw offset (0x10bb298). Here: the clock from the clip's fresh start (cad0 0 on that step), the motion's rate input.speed.
function events088(state, D, a, ctx, input, out, fresh){
  if (fresh){ state.cad088 = f(0.0); state.cad4088 = f(0.0); }
  else { state.cad4088 = state.cad088; state.cad088 = mla(state.cad088 || f(0.0), ctx.speed, ctx.dt); }
  for (const sp of a.spawns){
    if (!sp.events) continue;
    if (fresh){ state.evSet088 = sp.sets[(state.evPlays088 = (state.evPlays088 || 0) + 1, state.evPlays088 - 1) % sp.sets.length]; }
    const set = state.evSet088;
    if (!set || fresh) continue;
    for (const row of set.rows){
      const due = row.kind === 1 ? (!!state.hist && pass001(state, f(row.f)))
                : row.kind === 5 ? (state.cad4088 <= row.f && state.cad088 > row.f) : false;
      if (!due) continue;
      const own = ctx.own001;
      const r = make088s00(state, D, 0, state.prevJoints || ctx.J, own, ctx, { yaw: row.yaw, action: a.action, frame: row.f });
      if (!r.S){ out.refused.push({ action: a.action, shell: 'shell00', mode: 0, why: r.why }); continue; }
      r.S.selector = set.sel;
      state.shells.push(r.S); out.spawned.push(r.S);
    }
  }
}
