
// ---- BASE12 (uShellEmBase12): Mizutsune's / Soulseer's bubbles (shell12) -- DRAFT, not patched ---------------------------------
// READ 2026-10-18 (dev/leviathan-shells-spec.md 5): ctor 0x4033e0 (0x43a78c; ef +0x15c8 / +0x15cc 0, hits +0x15d0 / +0x15d4, the joint
// +0x15d8, +0x15dc = -1; +0x15e0..+0x15f4 0; +0x15f8 the zero vector; +0x15fc -1; +0x1600..+0x1608 0; +0x15a8 0xc), init 0x403854
// (bit 1 of +0x15e0 defers the real init 0x4038cc to the first move), move 0x40350c, the step 0x40362c, end 0x403e88, +0x158
// 0x403dbc (slot 1: not a slot). sp_12's reader 0x104f15c, +0x150 0x104f2e8, +0x154 0x104f318, +0x15c / +0x160 the hit side.
function params082s12(mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), dxyz: I(1), flags: (I(2) !== -1 ? 1 : 0) | (I(3) !== -1 ? 2 : 0), degX: F(0), degY: F(1), vz: F(2),
           drift: F(3), life: F(4), vec: (sh.vecs[0] || ZERO3).map(f) };
}
// the real init 0x4038cc(shell, setup): state 1, the life +0x1600 = float 4; the joint's point (0xc15a4 row 3) and the offset
// through its 3x3 (+0x15dc == -1) or as it is; the words X = setup +0x10 + block X + u16(degX), Y = block Y + u16(degY), Z 0; the
// velocity (0, 0, float 2) turned X then Y; the drift +0x1020 = (0, f3 sin dX, -0.3 f3 cos dX) turned by Y (dX the degree offset's
// own word); ef 0 at the point -> +0x1604; slot 0 = hit 0 (vt +0x140; not the life: base12 counts its own)
function init12(S, k, setup, own, J){
  if (k.joint === -1) return 'joint -1 (+0x40 the ctor\'s: no mode of his)';
  const M = jointMatrix(J, k.joint);
  if (!M) return 'no joint ' + k.joint;
  let p = [f(M[12]), f(M[13]), f(M[14])];
  const [x, y, z] = k.vec;
  const v = k.dxyz === -1 ? [mla(mla(f(y * M[4]), x, M[0]), z, M[8]), mla(mla(f(y * M[5]), x, M[1]), z, M[9]), mla(mla(f(y * M[6]), x, M[2]), z, M[10])]
                          : [x, y, z];
  p = [f(p[0] + v[0]), f(v[1] + p[1]), f(v[2] + p[2])];
  S.position = p; S.anchor = p.slice();
  const dXw = s32(mla(0.5, k.degX, DEG_TO_U16)), dYw = s32(mla(0.5, k.degY, DEG_TO_U16));
  const X = (((setup.word10 >>> 0) + (own.ownerX >>> 0)) + u16(dXw)) >>> 0, Y = ((own.ownerY >>> 0) + u16(dYw)) >>> 0;
  S.angles = [X, Y, 0];
  // the velocity: (0, 0, vz) turned by X, then Y
  let r = f(u16(X) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const vy = mls(f(cs * 0.0), k.vz, sn), vz1 = mla(f(k.vz * cs), sn, 0.0);
  r = f(u16(Y) * U16_TO_RAD); const sY = sinf(r), cY = cosf(r);
  const vz2 = mls(f(vz1 * cY), 0.0, sY), vx1 = mla(f(0.0 * cY), vz1, sY);
  S.velocity = [mls(vx1, vy, 0.0), mla(vy, vx1, 0.0), vz2];
  // the drift (+0x1020): from the degree offset's own word, then turned by Y
  const rd = f(u16(dXw) * U16_TO_RAD), sd = sinf(rd), cd = cosf(f(u16(s32(mla(0.5, k.degX, DEG_TO_U16))) * U16_TO_RAD));
  const ay = f(k.drift * sd), az = f(f(k.drift * cd) * f(-0.3));
  S.gravity = [mla(f(0.0 * cY), az, sY), ay, mls(f(az * cY), 0.0, sY)];
  S.life = k.life; S.life0 = k.life;
  S.state = 1;
  return null;
}
// the step 0x40362c (state 1): anchor = position, 0x539224 (stepFlight); in the life's last third the drift = -velocity / (life
// / 3) (re-taken every move); the life counted down by the step (ended at 0); base00's collide query 0x43ac8c -> sp_12's +0x150
// (a contact of any type but 1 ends it); +0x15c / +0x160 the hit side (no hunter)
function step12(S, ctx, input, D, out){
  S.moves++;
  if (S.effect && !S.effect.gone && input.effectAlive && !input.effectAlive(S, 0, S.effect)) S.effect.gone = true;
  if (S.effect2 && !S.effect2.gone && input.effectAlive && !input.effectAlive(S, 1, S.effect2)) S.effect2.gone = true;
  if (S.state === 0){ /* the deferred init (bit 1): its first move inits on this frame's joints */ }
  if (S.state === 1){
    S.anchor = S.position.slice();
    stepFlight(S, ctx.dt);
    const third = f(S.life0 / 3.0);
    if (S.life < third) S.gravity = S.velocity.map(c => f(f(-c) / third));
    if (!(S.life > 0)){ S.life = f(0); end12(S, D, out); return; }
    const t = f(S.life - ctx.dt);
    S.life = (0 >= t) ? f(0) : t;
    if (!(t > 0)){ end12(S, D, out); return; }
    const hit = collide(S, null, ctx.stage);
    if (hit && hit.type !== 1){ S.events.push({ ev: 'hit', point: hit.point, type: hit.type }); end12(S, D, out); }
    return;
  }
  if (S.state === 0xfe){
    const T = S.timer;
    if (!(T > 0)){ S.timer = 0; S.state = 0xff; return; }
    const t = f(T - ctx.dt);
    S.timer = (0 >= t) ? 0 : t;
    if (!(t > 0) || (!(S.effect && !S.effect.gone) && !(S.effect2 && !S.effect2.gone))) S.state = 0xff;
  }
}
// the end 0x403e88(shell, 0): ef 0 (+0x1604) stopped gracefully, 0x4a1de4, vt +0x154 (sp_12's 0x104f318: ef 1 at its point ->
// +0x1608, the pop), state 0xfe, the wait +0x1600 = 1800
function end12(S, D, out){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = S.effect ? { param: 0, request: 0, key: S.effect.key } : null;
  contactStart(S, D, 1, S.position, 'end');
  S.state = 0xfe; S.timer = ENDING_FRAMES;
  out.ended.push(S);
}
