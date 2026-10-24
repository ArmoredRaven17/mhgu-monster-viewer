// (7, 0x49) 0xd8716c (READ whole, 0xd8716c..0xd87444): phase 0 L2 M25 (0x219, blend 8.0), P+0x1bb = 0; phase 1 at the crossing of
// 146 (0xb0968(e, 0, 0, 146.0, 0.0)): THE PITCH -- Q = joint 3's world point (0xc164c) + (0, -91.6, 132.8) turned Z, X, Y by the block
// words (+0x58 / +0x50 / +0x54; the vec is sp_00's own &vec 0, G below); A = the target P+0x1d0 + (0, 0, -1600) turned by Y (1600 short
// of it along his facing); d = A - Q: yaw = s32(0.5 + atan2(dx, dz) x 10430.378), u = uxth(s32(0.5 + atan2(-dy, |d.xz|) x 10430.378));
// u >= 0x2000 (unsigned: a point above Q too) -> 0x2000; uxth(yaw - Y) in [0x4001, 0xbfff] (A behind him) -> 0x2000. Into
// [e+0xcac0]+0, then 0xd82024(e, 2, u, 0): sp_00 0x8a mode 1, words (X + u, Y, Z). The clip's end: vt+0x3dc. No tune value is read.
function pitch013_49(J, own){
  if (!own.target) return 'the Old Fatalis pitch 0xd8716c without the target (input.rock.target)';
  const M = jointMatrix(J, 3);
  if (!M) return 'the Old Fatalis pitch 0xd8716c: no matrix for joint 3';
  const ang = w => f(f(u16(w)) * U16_TO_RAD), k0 = f(0.0), ky = f(91.5999984741211), kz = f(132.8000030517578), back = f(-1600.0);
  const Y = ang(own.ownerY), sY = sinf(Y), cY = cosf(Y), T = own.target;                  // 0xd87220 / 0xd872bc (the Y word, twice)
  const Z = ang(own.ownerZ), sZ = sinf(Z), cZ = cosf(Z), X = ang(own.ownerX), sX = sinf(X), cX = cosf(X);
  const y1 = mls(f(sZ * k0), cZ, ky), x1 = mla(f(cZ * k0), sZ, ky);                       // 0xd872cc..0xd872f4 (literals 0xd8744c / 0xd87454)
  const z2 = mla(f(cX * kz), y1, sX), y2 = mls(f(y1 * cX), sX, kz);                        // 0xd872f8 / 0xd87300; 0xd87320 / 0xd87324 (0xd87458)
  const qx = f(f(M[12]) + mla(f(x1 * cY), z2, sY)), qz = f(mls(f(z2 * cY), x1, sY) + f(M[14])), qy = f(y2 + f(M[13]));
  const ax = f(T[0] + mla(f(sY * back), cY, k0)), az = f(mls(f(cY * back), sY, k0) + T[2]); // 0xd87334..0xd87354 (0xd8745c)
  const dx = f(ax - qx), dz = f(az - qz), dy = f(f(T[1] + k0) - qy);
  const yaw = s32(mla(f(0.5), atan2f(dx, dz), RAD_TO_U16));                               // r6 (0xd8736c..0xd8739c)
  let u = u16(s32(mla(f(0.5), atan2f(f(-dy), sqrtf(mla(f(dx * dx), dz, dz))), RAD_TO_U16)));
  if (u >= 0x2000) u = 0x2000;                                                              // 0xd873e8 / 0xd873ec (movhs)
  const h = (yaw - (own.ownerY | 0)) & 0xffff;                                              // 0xd873d0..0xd873dc: uxtah(~0x4000, r6 - [P+0x54])
  if (h >= 0x4001 && h < 0xc000) u = 0x2000;                                                // 0xd873f0 / 0xd87400 (movwlo)
  return u;
}
// (7, 0x50) 0xd87a18 (READ whole, 0xd87a18..0xd8813c): OLD'S STORM. Phase 0 L4 M1 (0x401); its end: phase 2, L4 M2 and the dust
// 0xd7ffcc(e, 1, (0, 0, 300)) (the Motion[1] row); phase 2 the flight on L4 M2 to (-32900, 25460, 20040) x 0xbe518 (0xd88150..58), its
// end L4 M3; phase 3's end L4 M4 (0x404) with him set at that point (P+0x54 = 0xd556), P+0x1a2 = 0, P+0x1bc = 0. PHASE 4 (0xd87f58),
// every update: P+0x1bc by 0x7206c (rate 1.0): out -> hunter P+0x1a2 & 3 (0x27482c) active, in his area (+0x1054) and not in a state
// (+0x2506 == 0x100, 0x2f523c 1 / 7 / 2) -> 0xd87464 (sp_01 0x8b MODE 5 at that hunter's +0x40, the ray 0x180fd4, the same box);
// else 0xd87630; then P+0x1bc = 90.0, P+0x1a2 + 1. Then ctl+0x3c ([e+0xcac0] = P+0x60, the ctor 0xd7d5d4) by 0x7206c: out ->
// 0xd87630 and ctl+0x3c = 27.466667 (0x41dbbbbc). L4 M4's end -> (7, 0x51) (0x768c8). THE VIEWER HAS NO HUNTER: 0x27482c answers
// none, so every P+0x1bc strike is 0xd87630's (named; the hunter arm's mode 5 is not built). ctl+0x3c's writers in the band: the ctor
// (0), vt+0x1d8 0xd7d778 (0) and this (27.47) -- 0 at the first play, the last storm's remainder after (state.ctl3c013).
// 0xd87630 (READ whole, ..0xd879d0): r = rand % 1000 (0x7c9234, the u32); r < 536 -> x = rand % 7000 - 2500, z = rand % 4000 - 700,
// else rand % 8500 - 2500, rand % 7200 - 700 (STAGE coordinates); the ray 0x183664 from (x, 1000, z) down (no second point; its hit
// byte the flag; s0 the y); y > 780 inside x (220, 870), z (3500, 4200) -> (545, y, 3850); a hunter within +-500 of it in his area and in
// one of those states clears the flag; flag -> sp_01 0x8b MODE 9 at (x, y, z), the words and +0x30 the GOT zeros (0x19176b0 /
// 0x1620e60), owner him. The viewer's world is not the stage: the points are the ROM's numbers (as the Gore scatter's hunterless arm),
// and he is not placed at phase 3's point -- named.
function rng32_013(state){ rng16(state); return state.rng[3] >>> 0; }   // 0x7c9234's u32 (rng16's step keeps it in the fourth word)
function strike013(state, D, a, ctx, out, draw = () => rng32_013(state)){
  const own = ctx.own001;
  const small = (draw() % 1000) < 0x218;                                // 0xd87660..0xd8768c (umull 0x10624dd3 >> 6: / 1000)
  const x = f(f(draw() % (small ? 7000 : 8500)) + f(-2500.0));          // 0xd87690..0xd876c0 (0xd879d8)
  const z = f(f(draw() % (small ? 4000 : 7200)) + f(-700.0));           // 0xd876cc..0xd87700 (0xd879dc)
  const y = ground022([x, f(1000.0), z], ctx.stage);                    // 0xd87724: the ray from 100 above (1000.0 = 0x447a0000)
  if (y == null) return null;                                           // no hit byte: no strike
  let px = x, pz = z;
  if (y > f(780.0) && px > f(220.0) && px < f(870.0) && pz > f(3500.0) && pz < f(4200.0)){ px = f(545.0); pz = f(3850.0); }   // 0xd87728..0xd877a0
  const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: 9, position: [px, y, pz], angles: [0, 0, 0], action: a.action,
                                            frame: null }, own, state.prevJoints || ctx.J, ctx, null);
  if (S){ state.shells.push(S); out.spawned.push(S); }
  return S;
}
function storm013(state, D, a, ctx, out, fresh){
  if (state.ctl3c013 == null) state.ctl3c013 = f(0.0);
  if (fresh){ state.storm013 = { t1bc: f(0.0), n1a2: 0 }; return; }   // the play's first frame is phase 3's setMotion; phase 4 runs from the next
  const s = state.storm013;
  if (!s) return;
  let [t, fired] = cd071(s.t1bc, ctx.dt);                               // 0x7206c = cd071 (0x539d5c, clamped at 0.0: 0x539dac)
  s.t1bc = t;
  if (fired){ strike013(state, D, a, ctx, out); s.t1bc = f(90.0); s.n1a2 = (s.n1a2 + 1) & 0xff; }   // 0xd88094..0xd880b8
  [t, fired] = cd071(state.ctl3c013, ctx.dt);
  state.ctl3c013 = t;
  if (fired){ strike013(state, D, a, ctx, out); state.ctl3c013 = f(27.46666717529297); }               // 0xd880e0..0xd880f4
}
