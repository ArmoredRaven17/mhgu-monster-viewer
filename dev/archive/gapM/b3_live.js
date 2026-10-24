// ---- THE HUNTER PASS (input.hunterBody): the hit manager's attack-vs-hunter test (gapM RESULT; rom-map rows 0x16a6ac..)
const HURT_R = f(40.0);                              // 0x2821e4: the capsule radius and the pull-in at each end
const EPS23 = f(1.1920928955078125e-07);             // 2^-23 (0x282308 / 0x7ce374 / 0x16742c literals)
const EPS3 = f(0.001);                               // 0x167018 / 0x7ce4d8 / 0x167428
const EPS5 = f(1e-5);                                // 0x167420
// INFERRED stand-in: the hunter's joints 16 / 19 / 4 relative to his unit, facing +Z -- the Armor Viewer's pl_make.glb
// Motion[170]_loop frame 0 (a character-creation stand, x 100). His in-quest pose is NOT READ (gapM RESULT a3).
const HUNTER_JOINTS = { 16: [27.29, 10.98, 12.10], 19: [-6.70, 10.26, -3.56], 4: [-0.51, 152.50, -1.45] };

function hunterCapsule(T, yaw){                      // player vt+0x36c 0x2821e4 (+0x13cc bit 3 clear: joints 16, 19, 4)
  const c = cosf(f(yaw || 0)), s = sinf(f(yaw || 0));
  const J = id => { const j = HUNTER_JOINTS[id];     // vt+0xd4 -> 0x539e08: the joint's world point (stand-in)
    return [f(T[0] + f(f(j[0] * c) + f(j[2] * s))), f(T[1] + f(j[1])), f(T[2] + f(f(j[2] * c) - f(j[0] * s)))]; };
  const A = J(16), B = J(19), C = J(4);
  const p0 = [f(f(A[0] + B[0]) * 0.5), f(f(A[1] + B[1]) * 0.5), f(f(A[2] + B[2]) * 0.5)];   // 0x282270..0x282290
  let dx = f(C[0] - p0[0]), dy = f(C[1] - p0[1]), dz = f(C[2] - p0[2]);                    // s20 / s16 / s18
  const len = sqrtf(mla(mla(f(dy * dy), dx, dx), dz, dz));
  if (!(len < EPS23)){ const r = f(1.0 / len); dz = f(dz * r); dy = f(dy * r); dx = f(dx * r); }
  const ox = f(dx * HURT_R), oy = f(dy * HURT_R), oz = f(dz * HURT_R);
  return { p0: [f(ox + p0[0]), f(oy + p0[1]), f(oz + p0[2])], p1: [f(C[0] - ox), f(C[1] - oy), f(C[2] - oz)], r: HURT_R };
}

// unit +0x38 == 4 (the uCoord ctor's 0x8a4728): Z, then X, then Y -- 0x16f060..0x16f0f0 / 0x16f808..0x16f88c
function coordRows4(W){
  const X = f(f(W[0] >>> 0) * U16_TO_RAD), Y = f(f(W[1] >>> 0) * U16_TO_RAD), Z = f(f(W[2] >>> 0) * U16_TO_RAD);
  const sx = sinf(X), sy = sinf(Y), sz = sinf(Z), cx = cosf(X), cy = cosf(Y), cz = cosf(Z);
  const sxsy = f(sx * sy), sxsz = f(sx * sz), sxcz = f(sx * cz), sxcy = f(sx * cy);
  return [[mla(f(cy * cz), sxsy, sz), f(sz * cx), mls(f(sxsz * cy), sy, cz)],
          [mls(f(sy * sxcz), sz, cy), f(cx * cz), mla(f(sxcy * cz), sy, sz)],
          [f(sy * cx), f(-sx), f(cx * cy)]];
}
const turnRows = (M, o) => [mla(mla(f(o[1] * M[1][0]), o[0], M[0][0]), o[2], M[2][0]),     // 0x16f1d8..0x16f22c
                            mla(mla(f(o[1] * M[1][1]), o[0], M[0][1]), o[2], M[2][1]),
                            mla(mla(f(o[1] * M[1][2]), o[0], M[0][2]), o[2], M[2][2])];

// 0x169290 -> 0x16d970 -> 0x16da04 for a shell (kind 2): its hitsize group's shapes at the manager's pass
function shellHitShapes(S, def, rec, hitsize){
  const g = hitsize && hitsize[rec[3]];
  if (!g) return { why: 'no hitsize group ' + rec[3] + ' (HDS byte +0x19) in ' + def.folder };
  const s = f(S.mode && S.mode.scale != null ? S.mode.scale : 1.0);          // H+0x14 = ShellScale (0x4a1c3c..0x4a1c80)
  const P = S.position, out = [];
  let M = null;
  const at = o => { M = M || coordRows4(S.angles);
    const w = turnRows(M, [f(s * o[0]), f(s * o[1]), f(s * o[2])]); return [f(w[0] + P[0]), f(w[1] + P[1]), f(w[2] + P[2])]; };
  for (const r of g){
    const R = f(s * f(r.r));
    if (r.j0 === 1001){                                                        // 0x16e000..0x16e18c: +0x40 to +0x1000
      if (r.j1 === 2001) return { why: 'hitsize j1 2001 (0x16e190..): offsets not transcribed' };   // in no shell file
      out.push({ type: 2, p0: P.slice(), p1: (S.anchor || P).slice(), r: R });
    } else if (r.j0 === 255){                                                  // 0x16dbd4: by the code
      if (r.code === 0) out.push({ type: 1, c: at(r.o0), r: R });              // 0x16e270
      else if (r.code === 1 || r.code === 2) out.push({ type: 2, p0: at(r.o0), p1: at(r.o1), r: R });   // 0x16dc10
      else if (r.code === 4 || r.code === 6) return { why: 'hitsize code ' + r.code + ': a type 3 shape (0x167f70 not read)' };
      // codes 3 / 5: no shape (0x170164, type 0)
    } else if (r.j0 === 1010) return { why: 'hitsize j0 1010: the shell segment table +0x1594 (0x16dd2c) not transcribed' };
    else return { why: 'hitsize j0 ' + r.j0 + ': a shell-model joint (0x16ddd0) not read' };
  }
  return { shapes: out };
}

function segPointT(C, P){                            // 0x8069d8: d^2 to the segment, t a LENGTH along it in [0, L]
  const ay = f(C.p1[1] - C.p0[1]), ax = f(C.p1[0] - C.p0[0]), az = f(C.p1[2] - C.p0[2]);
  const ry = f(P[1] - C.p0[1]), rz = f(P[2] - C.p0[2]), rx = f(P[0] - C.p0[0]);
  const inv = f(1.0 / sqrtf(mla(mla(f(ay * ay), ax, ax), az, az)));
  const uy = f(ay * inv), ux = f(ax * inv), uz = f(az * inv);
  const L = mla(mla(f(uy * ay), ux, ax), uz, az), Sd = mla(mla(f(ry * uy), rx, ux), rz, uz);
  let t = L < Sd ? L : Sd; t = t > 0 ? t : 0;
  const dy = mls(ry, uy, t), dx = mls(rx, ux, t), dz = mls(rz, uz, t);
  return { d2: mla(mla(f(dy * dy), dx, dx), dz, dz), t };
}
function unit3(v){ const l = sqrtf(mla(mla(f(v[1] * v[1]), v[0], v[0]), v[2], v[2]));   // y, x, z order as the ROM's
  if (l < EPS23) return v; const r = f(1.0 / l); return [f(v[0] * r), f(v[1] * r), f(v[2] * r)]; }

// 0x167d2c -> 0x7ce35c(hunter capsule, attack sphere): the point on the hunter's surface toward the sphere, or null
function sphereVsHunter(A, cap){
  const ay = f(cap.p1[1] - cap.p0[1]), ax = f(cap.p1[0] - cap.p0[0]), az = f(cap.p1[2] - cap.p0[2]);
  if (mla(mla(f(ay * ay), ax, ax), az, az) < EPS23) return { why: 'a point capsule: 0x7cc734 not read' };
  const { d2, t } = segPointT(cap, A.c), dist = sqrtf(d2);
  const inv = f(1.0 / sqrtf(mla(mla(f(ay * ay), ax, ax), az, az)));
  const Q = [mla(cap.p0[0], t, f(ax * inv)), mla(cap.p0[1], t, f(ay * inv)), mla(cap.p0[2], t, f(az * inv))];
  const R = [f(A.c[0] - Q[0]), f(A.c[1] - Q[1]), f(A.c[2] - Q[2])];
  let n;
  if (!(d2 < EPS3)) n = unit3(R);                                              // 0x7ce5c0
  else {                                                                        // 0x7ce4f4: R less its part along the axis
    const a = unit3([ax, ay, az]);
    const w0 = mls(f(R[1] * a[0]), R[0], a[1]), w1 = mls(f(R[0] * a[2]), R[2], a[0]), w2 = mls(f(R[2] * a[1]), R[1], a[2]);
    n = unit3([mls(f(a[2] * w1), a[1], w0), mls(f(a[0] * w0), a[2], w2), mls(f(a[1] * w2), a[0], w1)]);
  }
  if (!(f(dist - f(cap.r + A.r)) <= 0)) return null;                         // movwls: <= 0 meets
  return { point: [mla(Q[0], n[0], cap.r), mla(Q[1], n[1], cap.r), mla(Q[2], n[2], cap.r)] };
}

function closestSegSeg(A, B){                        // 0x166e1c (Ericson 5.1.9, EPS 0.001): s, t in [0, 1]
  const d1 = A.d, d2 = B.d, rx = f(A.p0[0] - B.p0[0]), ry = f(A.p0[1] - B.p0[1]), rz = f(A.p0[2] - B.p0[2]);
  const a = mla(mla(f(d1[1] * d1[1]), d1[0], d1[0]), d1[2], d1[2]), e = mla(mla(f(d2[1] * d2[1]), d2[0], d2[0]), d2[2], d2[2]);
  const cl = v => { v = f(v + 0); v = v > 0 ? v : 0; return v < 1 ? v : 1; };
  let s = 0, t = 0;
  if (a <= EPS3 && e <= EPS3) return { s, t, d2: f(f(rz * rz) + mla(f(ry * ry), rx, rx)) };
  const F = mla(mla(f(ry * d2[1]), rx, d2[0]), rz, d2[2]);
  if (!(a > EPS3)) t = cl(f(F / e));
  else {
    const c = mla(mla(f(ry * d1[1]), rx, d1[0]), rz, d1[2]);
    if (!(e > EPS3)) s = cl(f(-f(c / a)));
    else {
      const b = mla(mla(f(d1[1] * d2[1]), d1[0], d2[0]), d1[2], d2[2]), den = mls(f(a * e), b, b);
      if (den !== 0) s = cl(f(mls(f(b * F), c, e) / den));
      t = f(mla(F, b, s) / e);
      if (t < 0){ t = 0; s = cl(f(f(-c) / a)); }
      else if (t > 1){ t = 1; s = cl(f(f(b - c) / a)); }
    }
  }
  const c1 = [mla(A.p0[0], s, d1[0]), mla(A.p0[1], s, d1[1]), mla(A.p0[2], s, d1[2])];
  const c2 = [mla(B.p0[0], t, d2[0]), mla(B.p0[1], t, d2[1]), mla(B.p0[2], t, d2[2])];
  const gy = f(c2[1] - c1[1]), gx = f(c2[0] - c1[0]), gz = f(c2[2] - c1[2]);
  return { s, t, d2: f(f(gz * gz) + mla(f(gy * gy), gx, gx)) };
}
function capExt(C){                                  // 0x1676f0's per-capsule block: d, mid, bound
  const d = [f(C.p1[0] - C.p0[0]), f(C.p1[1] - C.p0[1]), f(C.p1[2] - C.p0[2])];
  const mid = [f(f(C.p0[0] + C.p1[0]) * 0.5), f(f(C.p0[1] + C.p1[1]) * 0.5), f(f(C.p0[2] + C.p1[2]) * 0.5)];
  const my = f(mid[1] - C.p0[1]), mx = f(mid[0] - C.p0[0]), mz = f(mid[2] - C.p0[2]);
  return { p0: C.p0, p1: C.p1, r: C.r, d, mid, bound: f(sqrtf(mla(mla(f(my * my), mx, mx), mz, mz)) + C.r) };
}
// 0x1676f0 -> 0x167024(attack, hunter): the point on the hunter's surface toward the attack's axis, or null
function capsuleVsHunter(Acap, cap){
  const A = capExt(Acap), B = capExt(cap), R2 = f(A.bound + B.bound);
  const qy = f(A.mid[1] - B.mid[1]), qx = f(A.mid[0] - B.mid[0]), qz = f(A.mid[2] - B.mid[2]);
  if (!(mla(mla(f(qy * qy), qx, qx), qz, qz) <= f(R2 * R2))) return null;    // 0x8002a4
  const { s, t, d2 } = closestSegSeg(A, B);
  const cA = [mla(A.p0[0], s, A.d[0]), mla(A.p0[1], s, A.d[1]), mla(A.p0[2], s, A.d[2])];
  const cB = [mla(B.p0[0], t, B.d[0]), mla(B.p0[1], t, B.d[1]), mla(B.p0[2], t, B.d[2])];
  let n = [f(cB[0] - cA[0]), f(cB[1] - cA[1]), f(cB[2] - cA[2])], dist;
  if (d2 < EPS5){                                                              // 0x16724c..0x16732c: crossing axes
    const a = A.d, b = B.d; dist = 0;
    n = [mls(f(a[1] * b[2]), a[2], b[1]), mls(f(a[2] * b[0]), b[2], a[0]), mls(f(b[1] * a[0]), a[1], b[0])];
    if (mla(mla(f(n[1] * n[1]), n[0], n[0]), n[2], n[2]) < EPS5){
      n = [f(-a[2]), 0, a[0]];                                                 // A.d x Y
      if (mla(mla(f(n[1] * n[1]), n[0], n[0]), n[2], n[2]) < EPS5) n = [a[1], f(-a[0]), 0];   // A.d x Z
    }
  } else dist = sqrtf(d2);
  const depth = f(dist - f(A.r + B.r));
  const nn = mla(mla(f(n[1] * n[1]), n[0], n[0]), n[2], n[2]);
  if (nn > EPS3) n = unit3(n);                                                 // 0x167384..0x1673f8
  if (!(depth < 0)) return null;                                               // movwmi: strictly below 0
  return { point: [mls(cB[0], B.r, n[0]), mls(cB[1], B.r, n[1]), mls(cB[2], B.r, n[2])] };
}

// The manager's pass for the proxy hunter (0x16a740's hunter capsule + 0x16acf0 pass (1) + 0x16b6cc), run once per step
// AFTER every slot's countdown (0x168d30 = slotStep). Sets S.hunterHit (slot 0's H+6 = 2, H+0x20) for the next move.
function hunterPass(state, input, D, out){
  for (const S of state.shells) S.hunterHit = null;                           // 0x168d40: H+6 = 0xff at every pass
  const t = input.rock && input.rock.target;
  if (!input.hunterBody || !t) return;
  const H = state.hunter || (state.hunter = { ring: new Array(20).fill(0xffff), k: 0 });   // player +0x31e4
  const cap = hunterCapsule([f(t.x), f(t.y), f(t.z)], input.hunterYaw);
  let struck = false;                                                          // player +0x31e0 (its clear: NOT READ)
  for (let i = state.shells.length - 1; i >= 0; i--){                           // mgr+0x2020: last registered first
    const S = state.shells[i];
    if (S.state === 0xff || (S.state & 0xfe) === 0xfe || !S.position) continue;
    const def = (S.D57 || D).shells[S.shell];
    if (!def) continue;
    const HS = HITSHAPES[def.folder] || {}, hitrec = def.hitrec || HS.hitrec, hitsize = def.hitsize || HS.hitsize;
    // the slots the shell registers (0x4a16f4): a base01 shell's own (S.slots, counted by the life loop above), else its mode's
    // hit 0 / 1 records counted here from its making (0x168d30 = slotStep) -- they decide nothing of the shell's life
    let slots = S.slots;
    if (!slots){
      if (!S.hslots){
        S.hslots = [];
        const mh = (S.mode && S.mode.hit) || [];
        for (const slot of [0, 1]){ const idx = mh[slot]; if (idx == null || idx < 0 || !hitrec || !hitrec[idx]) continue;
          S.hslots.push({ slot, record: idx, on: true, delay: f(hitrec[idx][0]), duration: f(hitrec[idx][1]) }); }
      } else for (const sl of S.hslots) slotStep(sl, f(1.0));
      slots = S.hslots;
    }
    for (const sl of slots) if (sl.id == null) sl.id = S.id;                  // its id (0x168a60 / +0x1588): the shell's own -- INFERRED
    for (let k = slots.length - 1; k >= 0; k--){
      const sl = slots[k];
      if (!(sl.on && !(sl.delay > 0))) continue;                               // 0x168ebc
      const rec = hitrec && hitrec[sl.record];
      if (!rec){ out.refused.push({ shell: S.shell, id: S.id, why: 'hunter pass: no HDS kind / group for record ' + sl.record }); continue; }
      const kind = rec[2];
      if (kind === 0x41){ out.refused.push({ shell: S.shell, id: S.id, why: 'hunter pass: kind 0x41 -> 0x2a6640 not read' }); continue; }
      if (struck) continue;                                                    // 0x16add8..0x16ade4
      if (sl.id !== 0xffff && H.ring.includes(sl.id)) continue;               // 0x16b5e0
      if (!((sl.mask == null ? 0x1f : sl.mask) & 1)) continue;                 // H+8 bit 0 (0x16ae10)
      if (kind === 8 || kind === 9 || kind === 0x34 || kind === 0x45) continue; // table 0x16ae64 -> 0x16af84
      if (kind === 0xc || kind === 0xd || kind === 0x1e){ out.refused.push({ shell: S.shell, id: S.id, why: 'hunter pass: kind ' + kind + ' needs 0x2f5bf0(player), not read' }); continue; }
      if (S.namedTarget && S.namedTarget !== 'hunter') continue;              // 0x16940c (base28's 0x168d1c)
      const sh = shellHitShapes(S, def, rec, hitsize);
      if (!sh.shapes){ out.refused.push({ shell: S.shell, id: S.id, why: 'hunter pass: ' + sh.why }); continue; }
      for (const A of sh.shapes){                                              // 0x16b78c: list order, the first that meets
        const c = A.type === 1 ? sphereVsHunter(A, cap) : capsuleVsHunter(A, cap);
        if (c && c.why){ out.refused.push({ shell: S.shell, id: S.id, why: 'hunter pass: ' + c.why }); break; }
        if (!c) continue;
        struck = true;                                                         // 0x175c1c / 0x178784
        if (sl.id !== 0xffff){ H.ring[H.k] = sl.id; H.k = H.k + 1 > 19 ? 0 : H.k + 1; }   // 0x1702ec
        if (sl.slot === 0) S.hunterHit = { point: c.point };                   // +0x13ae = 2, +0x13c8.. (slot 1: unread by 0x43ac8c)
        if (S.events) S.events.push({ ev: 'hunter', slot: sl.slot, point: c.point });
        break;
      }
    }
  }
}
