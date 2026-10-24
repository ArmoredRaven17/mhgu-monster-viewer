// behaviour 6 (0x4320a4, READ whole, gapJ 2026-10-21): THE LIFT -- the object carried from where it lies to its owner's joint.
// Sub (+5) 1 -> 2: the hit (+0x15e0, vt+0x140: not visual); the trail 0x432470 (setup +0x54 1 -> ef 2, 2 -> ef 3, -> +0x1630);
// ef 4 (+0x15dc) at +0x40 (0x4a10c8 / 0x4a11e4) -> +0x1638; the start words +0x16e4.. = the words +0xfe8... Then, that move and
// every one after (0x4321ec..): no owner (0x4a0f00) -> vt+0x148(0); t +0x1740 = min(t + +0x1744 x dt, 1.0); P = the owner's
// joint +0x173c (0xc164c); +0x40.. = t x P + (1 - t) x the start +0x16f0.. (vmul, then vmla), +0x4c = 0; the joint's record matrix
// (owner +0x498 / +0x494, +0x10..+0x4c; 0xff: kept) -> Euler (0x7c3a38) -> the rest words +0x16d0..; the turn 0x432efc; at
// t >= 1.0 the rest point +0x1710 = +0x40, the rest words +0x1720 = +0x16d0.., vt+0x148(0) (end57)
function move57lift(S, D, ctx, out){
  if (S.phase === 1){
    S.phase = 2;
    const st = trail57(D, S);
    if (st){ S.effect = { param: S.trailParam, key: st.key }; out.started.push({ shell: S, start: st }); S.events.push({ ev: 'start', param: S.trailParam, key: st.key }); }
    const e4 = rockRequest(D, S.mode, 4, S.position.slice(), 'lift');
    if (e4){ S.effect3 = { param: 4, key: e4.key }; out.started.push({ shell: S, start: e4 }); S.events.push({ ev: 'start', param: 4, key: e4.key }); }
    S.startWords = S.angles.slice();
  }
  const M = ctx.J ? ctx.J(S.liftJoint) : null;
  if (!M){ S.events.push({ ev: 'refused', why: 'no matrix for the owner\'s joint ' + S.liftJoint + ' (0xc164c)' }); return; }
  const t = Math.min(mla(S.liftT, S.liftRate, ctx.dt), f(1.0));
  S.liftT = f(t);
  const u = f(f(1.0) - t), P = [f(M[12]), f(M[13]), f(M[14])];
  S.position = [0, 1, 2].map(i => mla(f(t * P[i]), u, S.from[i]));
  const e = eulerOf(M);
  S.endWords = [word57(e.x), word57(e.y), word57(e.z)];
  turn57(S, ctx.dt);
  if (!(t < 1.0)){
    S.fin = S.position.slice(); S.finWords = S.endWords.slice();
    end57(S, out, ctx, 0);
  }
}
