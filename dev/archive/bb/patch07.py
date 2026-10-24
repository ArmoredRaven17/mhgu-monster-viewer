p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf-8', newline='').read()
a = """        if (S){ state.shells.push(S); out.spawned.push(S); }
      }
    } else throw new Error('shells.js: em007 spawn of ' + sp.shell + ' not transcribed');
  }
}
"""
b = """        if (S){ state.shells.push(S); out.spawned.push(S); }
      }
    } else if (sp.shell === 'shell07'){
      // 0xd41b48 phase 1: vt +0x370(e, 1) -- the tail severed (P+0x3b4 bit 0: input.tailSevered, the parts shown) -- picks
      // the table 0x169bc78 (`severed`) over 0x169bc60 (`modes`); 0x402014(0x30): +4 0x72, +8 the mode, +0xc the enemy, +0x10..
      // a GOT vec3 and +0x20 [P+0xb0a], neither read by base07's init on his flags (dev/em007-base07-spec.md 3, 6)
      const modes = own.tailSevered ? sp.severed : sp.modes;
      const why = missing001(own, { facing: true, pos: true });
      if (why){ out.refused.push({ action: a.action, shell: 'shell07', modes: modes.slice(), why }); continue; }
      for (const m of modes){
        const r = make07(state, D, m, own, ctx, a.action, sp.frame);
        if (r.S){ state.shells.push(r.S); out.spawned.push(r.S); }
        else if (r.why) out.refused.push({ action: a.action, shell: 'shell07', mode: m, why: r.why });
      }
    } else throw new Error('shells.js: em007 spawn of ' + sp.shell + ' not transcribed');
  }
}
// ---- BASE07 (uShellEmBase07): Bloodbath's L9 M10 debris (shell07 0x72) ---------------------------------------------------
// dev/em007-base07-spec.md (READ end to end, 2026-10-08). uShellEm007_04_07's reader 0xd46a94: ef 0..3 -> +0x15c8 / +0x15cc /
// +0x15d0 / +0x15d4 (the flight, the landing's types 0 / 1 / 2); hit 0 -> +0x15d8; int 0 the joint +0x15dc; ints 1 / 2 the
// landings' camera ids (0x43ac04: an event only, not modelled); flags +0x15e8 = 0x2 (int 3 != -1: keep the words) | 0x4 (int 4:
// the vecs x the owner's size 0xbe518) | 0x8 (int 5: 0x43ab74, NOT READ -- refused); float 0 the flight F +0x15ec, float 1 the
// height H +0x15f0; vec 0 / vec 1 (+0x15f4 / +0x15f8) the start offset / the target offset. Not modelled, named: the hit side
// (+0x160 0x402c98), and the class's +0x28 0xd46c40 -> 0x43b2b0 (a pooled ground marker each frame: INFERRED a shadow).
function params07(mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  return { joint: I(0), flags: (I(3) !== -1 ? 2 : 0) | (I(4) !== -1 ? 4 : 0) | (I(5) !== -1 ? 8 : 0), F: F(0), H: F(1),
           v0: V(0), v1: V(1) };
}
// base07's turn of a vector by the owner's words (u16 halves, x 9.58738e-05): Z, then X, then Y, each product rounded
// (0x4024ec..0x4025ac; the same for vec 1 at 0x40268c..0x40274c)
function turn07(v, W){
  const Z = f(u16(W[2]) * U16_TO_RAD), X = f(u16(W[0]) * U16_TO_RAD), Y = f(u16(W[1]) * U16_TO_RAD);
  const sZ = sinf(Z), cZ = cosf(Z), sX = sinf(X), cX = cosf(X), sY = sinf(Y), cY = cosf(Y);
  const [x, y, z] = v;
  const a = mla(f(y * cZ), x, sZ), b = mls(f(x * cZ), y, sZ);
  const c = mla(f(z * cX), a, sX);
  return [mla(f(b * cY), c, sY), mls(f(a * cX), z, sX), mls(f(c * cY), b, sY)];
}
// base07's init 0x4022a8 (spec 3): P = the owner's own +0x40.. (joint -1; bit 0 never set) + vec 0 (x size when 0x4) turned;
// T = P + vec 1 (the same) turned; velocity (dx / F, H / (F x 0.5 x 0.5), dz / F) with dx / dz the rounded T - P; gravity y =
// H / (h x (h x -0.5)) in double, h = F x 0.5; the words the owner's; life +0x1600 = F + F; ef 0 at +0x40 on the shell.
// `own` = owner001's; returns { S } or { why } (or { S: null } where the init returns 0: F <= 0)
function make07(state, D, m, own, ctx, action, frame){
  const def = D.shells.shell07, mode = def.modes[m];
  if (!mode) return { why: 'uShellEm007_04_07: mode ' + m + ' not in SHELL_DATA (not transcribed)' };
  const k = params07(mode);
  if (k.flags & 8) return { why: 'base07 flag 0x8 (0x43ab74 at the end of the init): not read' };
  if (k.joint !== -1) return { why: 'base07 on a joint (+0x15dc ' + k.joint + ', 0xc15a4): not transcribed (no Bloodbath mode names one)' };
  if (!(k.F > 0)) return { S: null };                                        // 0x402390: F <= 0 -> the init returns 0
  const W = ownerWords001(own), size = f(own.size[0] * own.size[1]);        // 0xbe518 = block +0x1ac x +0x1b0
  const sc = v => (k.flags & 4) ? v.map(x => f(x * size)) : v;
  const O = own.ownerPos, d0 = turn07(sc(k.v0), W);
  const P = [f(O[0] + d0[0]), f(d0[1] + O[1]), f(d0[2] + O[2])];
  const d1 = turn07(sc(k.v1), W);
  const T = [f(d1[0] + P[0]), f(P[1] + d1[1]), f(P[2] + d1[2])];          // +0x1610.. (0x402760..0x402784)
  const dx = f(T[0] - P[0]), dz = f(T[2] - P[2]);
  const h = f(k.F * 0.5);
  const vy = f(k.H / f(h * 0.5));                                            // +0x1014
  const g = f(k.H / (h * (h * -0.5)));                                       // +0x1024: vmul.f64 x2, vdiv.f64, vcvt.f32.f64
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell07', cls: def.cls, globalId: def.id, base: 'base07', mode,
              modeIndex: m, action: action || null, spawnFrame: frame == null ? null : frame, motion: ctx.motion, state: 1,
              folder: def.folder, position: P, prevPosition: P.slice(), anchor: P.slice(), angles: W.slice(), k, target: T,
              velocity: [f(dx / k.F), vy, f(dz / k.F)], gravity: [0, g, 0],
              timer: f(k.F + k.F), moves: 0, events: [], effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (D.lists[listId] || {}).list || null, key, started: false }));
  S.start = rockRequest(D, mode, 0, S.position, 'flight', listsOf(D, S));  // 0x402840..0x4028a8: ef 0 at +0x40 -> +0x1604
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return { S };
}
// base07's state-1 step (vt +0x158 = 0x402a1c, spec 4): +0x15c 0x402bac -- the previous point, 0x539224 (stepFlight's
// arithmetic), the words from the velocity unless 0x2 --; the life; the rocks' query 0x43ac8c and, on a hit, the landing
// 0x402050: ef 1 / 2 / 3 by the type at the contact (base00's `landing`), then the end
function move07(S, ctx, D){
  S.anchor = S.position.slice();
  stepFlight(S, ctx.dt);
  if (!(S.k.flags & 2)){                                // 0x402c00..0x402c88
    const [vx, vy, vz] = S.velocity;
    const hz = sqrtf(mla(f(vz * vz), vx, vx));
    S.angles = [u16(s32(mla(0.5, atan2f(f(-vy), hz), RAD_TO_U16))), u16(s32(mla(0.5, atan2f(vx, vz), RAD_TO_U16))), S.angles[2]];
  }
  const T = S.timer;
  if (!(T > 0)){ S.timer = 0; return 'end'; }            // 0x402a60 ble
  const t = f(T - ctx.dt);
  S.timer = (0 >= t) ? 0 : t;                            // vselge
  if (t <= 0) return 'end';                              // 0x402a88 bls
  const hit = collide(S, null, ctx.stage);
  if (!hit) return 'keep';
  S.events.push({ ev: 'hit', point: hit.point, type: hit.type });
  landing(S, D, hit);
  return 'end';
}
"""
assert s.count(a) == 1
s = s.replace(a, b)
pairs = [
    ("    const r = S.base === 'base00' ? move00(S, ctx, D) : move54(S, J, ctx, D);",
     "    const r = S.base === 'base00' ? move00(S, ctx, D) : S.base === 'base07' ? move07(S, ctx, D) : move54(S, J, ctx, D);"),
    ("    else if (S.base === 'base00' || S.base === 'base54') stepRock(S, J, ctx, input, D, out);",
     "    else if (S.base === 'base00' || S.base === 'base54' || S.base === 'base07') stepRock(S, J, ctx, input, D, out);   // base07: its move 0x402914 has base00's shape"),
    ("                                : def.cls === 'uShellEm081_04_11' ? mode.sh.ints[0]      // (its spawner's point and its follow: joint 138)",
     "                                : def.cls === 'uShellEm081_04_11' ? mode.sh.ints[0]      // (its spawner's point and its follow: joint 138)\n"
     "                                : def.base === 'base07' ? null                            // (Bloodbath's shell07: the owner's +0x40, int 0 = -1)"),
]
for x, y in pairs:
    assert s.count(x) == 1, x
    s = s.replace(x, y)
open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
