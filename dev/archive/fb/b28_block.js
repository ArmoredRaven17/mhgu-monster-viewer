// ---- BASE28 (uShellEmBase28; Seregios's sp_28 0x13e, his thrown scales) -- dev/em077-shells-spec.md (shells agent, 2026-10-19;
// emulator check dev/shells-seregios28-check.mjs). The base's band 0x4111b0..0x411fac (READ whole): ctor 0x4111b0, init +0x13c 0x4111e4,
// the move +0x24 0x411b4c, the end +0x148 0x411e70; +0x154 / +0x158 `bx lr`; his class: reader +0x14c 0xfeef90, landing +0x150
// 0xfef178 (vtable 0x17e92e0, its extent to +0x158).
//   The setup (0x24, cSetupParamEmBase28): +0x10 an index into the common vecs (-> +0x1618: the degree offsets), +0x1c a byte (the aim:
//   -> +0x1628), +0x20 an index into the common vecs (-> +0x161c: the clamp).
//   His reader: ef 0..3 -> +0x15c8..+0x15d4; hit 0 -> +0x15d8; ints 0..3 -> +0x15dc (the joint) / +0x15e0 / +0x15e4 (0: the height
//   from the owner's) / +0x15e8 (0: the X clamp's absolute arm); float 0 -> +0x15ec; vecs 0 / 1 / 2 / 3 -> +0x1608 (the offset) / +0x1600
//   (the speed) / +0x160c (the aim offset) / +0x1610 (the height offset); cmn vec [+0x1618] -> +0x1604 (X / Y degrees); cmn vec
//   [+0x161c] -> +0x15f0 = -x, +0x15f4 = x, +0x15f8 = -y, +0x15fc = y (the X / Y clamps, degrees)
//   THE INIT 0x4111e4: the base's 0x43a850; the setup's three; the owner unit live (0x4a100c, byte +0x50 bit 0) else deleted; the reader;
//   the point 0x4114a0; the words 0x411774; +0xfe8 = X, +0xfec = Y, +0xff0 = 0; the velocity +0x1010 = vec +0x1600 turned X then Y (the
//   Z step's angle the literal 0.0); state 1; ef 0 at +0x40 -> +0x1620; the hit registration (0x4a1ad8; slot 0 from hit 0)
//   THE POINT 0x4114a0: +0x40 = the joint's position (0xc164c) + its matrix's 3x3 x the offset; with +0x15e4 == 0 the y is the owner
//   block's +0x44 plus the height offset (x the size 0xbe518) turned by the owner's Z word then X word (+0x58 / +0x50; e+0x74ec, the
//   tilt factor, 0 in the viewer: a stand-in) -- the y of the vector so turned
//   THE WORDS 0x411774: aim byte 0 -> X = owner X + u16(deg.x), Y = owner Y + u16(deg.y); set -> the yaw / pitch from +0x40 to the target
//   block +0x1d0 + the aim offset, then per word: clamp lo == 0 -> owner word + deg; else the relative arm (the aim less the owner's less
//   deg, clamped circularly into [lo, hi], plus the owner's and deg) -- X with +0x15e8 == 0 instead clamps (aim + owner X) and takes
//   that less twice the owner's X (0x4119bc..0x411a3c, as read)
//   THE MOVE 0x411b4c: 0x4a1698 (the hit side); the handles +0x1620 / +0x1624 dropped when their unit left states 1 / 2; 0xfe: +0x1614 +=
//   dt, past [0x162493c] x 60 -> deleted, a live handle -> kept, else 0xff; 1 -> 0x411c48: the owner gone -> the end; +0x1000 = +0x40;
//   0x539224 (stepFlight); X = atan2(-vy, |(vx, vz)|), Y = atan2(vx, vz); the hit slot +0x13ad clear -> THE END (the shell lives while
//   its hit slot does); else the stage query 0x43ac8c (+0x40 / +0x1000) -> a hit: +0x150
//   HIS LANDING 0xfef178 (state 1): type 0 / 1 / 2 -> ef +0x15cc / +0x15d0 / +0x15d4 at the contact (0x411ef8 -> +0x1624), then the end
//   THE END 0x411e70(flag): not ending -> ef 0 (+0x1620) stopped (0x43b058(h, flag)), 0x4a1de4, state 0xfe, +0x1614 = 0; flag 1 -> deleted
function params077s28(def, mode, setup){
  const sh = mode.sh, cv = def.cmn.vecs, I = i => i < sh.ints.length ? sh.ints[i] : -1;
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  const deg = (cv[setup.i10] || ZERO3).map(f), cl = (cv[setup.i20] || ZERO3).map(f);
  return { joint: I(0), i15e0: I(1), i15e4: I(2), i15e8: I(3), f15ec: f(sh.floats.length ? sh.floats[0] : 0),
           offset: V(0), speed: V(1), aimOff: V(2), height: V(3), deg, loX: f(-cl[0]), hiX: cl[0], loY: f(-cl[1]), hiY: cl[1], aim: !!setup.aim };
}
const deg28 = d => s32(mla(0.5, d, DEG_TO_U16));
function clamp28(v, lo, hi){                                 // 0x4118e8..0x411904: u16(v - lo) > u16(hi - lo) -> the nearer end
  const a = u16(v - lo), w = u16(hi - lo);
  if (a > w) return ((0x8000 | (w >>> 1)) > a) ? hi : lo;
  return v;
}
function make28(st, D, sp, own, J, ctx, out, action, F){
  const def = D.shells.shell28, m = sp.mode >>> 0, mode = def && def.modes[m];
  const no = why => out.refused.push({ action, shell: 'shell28', mode: m, frame: F, why: st.monId + ' shell28: ' + why });
  if (!mode) return no('mode ' + m + ': no files');
  const k = params077s28(def, mode, sp);
  if (!own.ownerPos || !own.facing) return no('no owner position / facing');
  const M = jointMatrix(J, k.joint);
  if (!M) return no('no joint ' + k.joint);
  // 0x4114a0: the joint's position + its 3x3 x the offset (the vldr order of 0x411560..0x4115c8)
  const o = k.offset;
  const pos = [0, 1, 2].map(i => f(mla(mla(f(o[1] * M[4 + i]), o[0], M[i]), o[2], M[8 + i]) + M[12 + i]));
  if (k.i15e4 === 0){
    const sc = size001(own), h = k.height;
    const vy = f(sc * h[1]), vz = f(sc * h[2]), vx = f(sc * h[0]);
    const rz = f(u16(own.ownerZ) * U16_TO_RAD), szn = sinf(rz), czn = cosf(rz);
    const rx = f(u16(own.ownerX) * U16_TO_RAD), sxn = sinf(rx), cxn = cosf(rx);
    const y1 = mla(f(vy * czn), vx, szn);                    // 0x4116d0 / 0x4116f0
    const y2 = mls(f(y1 * cxn), vz, sxn);                    // 0x4116fc / 0x411704
    pos[1] = f(y2 + own.ownerPos[1]);                        // the block's +0x44 (the viewer's owner point)
  }
  // 0x411774: the words
  const oX = own.ownerX >>> 0, oY = own.ownerY >>> 0, dX = deg28(k.deg[0]), dY = deg28(k.deg[1]);
  let X, Y;
  if (!k.aim){ X = u16(dX + oX); Y = u16(dY + oY); }
  else {
    if (!own.target) return no('no target (input.rock.target), which the aim reads');
    const T = [f(own.target[0] + k.aimOff[0]), f(own.target[1] + k.aimOff[1]), f(own.target[2] + k.aimOff[2])];
    const dx = f(T[0] - pos[0]), dz = f(T[2] - pos[2]);
    Y = u16(s32(mla(0.5, atan2f(dx, dz), RAD_TO_U16)));
    const dist = sqrtf(mla(f(dz * dz), dx, dx)), dy = f(T[1] - pos[1]);
    X = u16(s32(mla(0.5, atan2f(f(-dy), dist), RAD_TO_U16)));
    if (k.loX === 0) X = u16(dX + oX);
    else if (k.i15e8 === 0){
      const v = u16(X + oX), lo = deg28(k.loX), hi = deg28(k.hiX);
      X = u16(u16(clamp28(v, lo, hi)) + u16((0x10000 - oX) << 1));
    } else {
      const v = u16(X - oX - dX), lo = deg28(k.loX), hi = deg28(k.hiX);
      X = u16(oX + u16(dX) + u16(clamp28(v, lo, hi)));
    }
    if (k.loY === 0) Y = u16(dY + oY);
    else {
      const v = u16(Y - oY - dY), lo = deg28(k.loY), hi = deg28(k.hiY);
      Y = u16(u16(oY + u16(clamp28(v, lo, hi))) + u16(dY));
    }
  }
  const A = [X, Y, 0];
  // the velocity: the vec turned X then Y (0x4112c4..0x411394; the first turn's literal 0.0)
  const s = k.speed, Z = f(0.0);
  const x0 = mls(s[0], s[1], Z), y0 = mla(s[1], s[0], Z), z0 = s[2];
  const rX = f(u16(X) * U16_TO_RAD), sX = sinf(rX), cX = cosf(rX);
  const y1 = mls(f(y0 * cX), z0, sX), z1 = mla(f(z0 * cX), y0, sX);
  const rY = f(u16(Y) * U16_TO_RAD), sY = sinf(rY), cY = cosf(rY);
  const vel = [mla(f(x0 * cY), z1, sY), y1, mls(f(z1 * cY), x0, sY)];
  const S = { id: st.nextId++, monId: st.monId, shell: 'shell28', cls: def.cls, globalId: def.id, base: 'base28', mode, modeIndex: m,
              action, spawnFrame: F, motion: ctx.motion, state: 1, k, lists: def.lists || D.lists, timer: f(0),
              position: pos.slice(), anchor: pos.slice(), velocity: vel, gravity: ZERO3.slice(), angles: A.slice(), moves: 0, events: [],
              folder: def.folder, effect: null, effect2: null, start: null, stop: null, unitScale: f(mode.scale), slots: null };
  S.launch = { position: pos.slice(), velocity: vel.slice(), gravity: ZERO3.slice(), angles: A.slice(), timer: f(0) };
  if (own.hitLife) S.slots = slotsOf011(def, mode, out.refused).filter(sl => sl.slot === 0);
  const rq = rockRequest(D, mode, 0, pos, 'flight', S.lists);
  if (rq){ S.start = rq; S.effect = { param: 0, key: rq.key }; }
  st.shells.push(S); out.spawned.push(S);
  return S;
}
function end28(S, out){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = S.effect ? { param: 0, request: 0, key: S.effect.key } : null;
  S.state = 0xfe; S.timer = f(0);
  out.ended.push(S);
}
function step28(S, J, ctx, input, D, out){
  S.moves++;
  const alive = p => !input.effectAlive ? true : !!input.effectAlive(S, p, p ? S.effect2 : S.effect);
  if (S.effect && !alive(0)) S.effect = null;
  if (S.effect2 && !alive(1)) S.effect2 = null;
  if (S.state === 0xfe){
    S.timer = f(f(ctx.dt) + S.timer);
    if (S.timer > ENDING_FRAMES || (!S.effect && !S.effect2)) S.state = 0xff;
    return;
  }
  if (S.state !== 1) return;
  if (!ctx.own001.ownerPos){ end28(S, out); return; }
  S.anchor = S.position.slice();
  stepFlight(S, ctx.dt);
  const v = S.velocity;
  const hs = sqrtf(mla(f(v[2] * v[2]), v[0], v[0]));
  S.angles = [u16(s32(mla(0.5, atan2f(f(-v[1]), hs), RAD_TO_U16))), u16(s32(mla(0.5, atan2f(v[0], v[2]), RAD_TO_U16))), S.angles[2]];
  if (!(S.slots && S.slots.some(sl => sl.on))){ end28(S, out); return; }
  const hit = collide(S, null, ctx.stage);
  if (!hit) return;
  S.events.push({ ev: 'hit', point: hit.point, type: hit.type });
  const param = [1, 2, 3][hit.type];
  if (param != null && S.mode.ef[param]){
    const rq = rockRequest(D, S.mode, param, hit.point, 'landing', S.lists);
    if (rq){ S.effect2 = { param, key: rq.key, started: true }; out.started.push({ shell: S, start: rq }); }
  }
  end28(S, out);
}

