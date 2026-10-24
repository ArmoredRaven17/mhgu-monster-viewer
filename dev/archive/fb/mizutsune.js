
// ---- MIZUTSUNE / SOULSEER (em082_00 / em082_04): uEm082_00's bubbles (sp_12, NEW base12) -----------------------------------------
// READ 2026-10-18 (dev/leviathan-shells-spec.md 5). One class for both (variant byte e+0xb5f5 0 / 4); the ids are fields
// (0x1035040): e+0xcac8 sp_12 (0x158 / 0x15c), +0xcacc sp_13, +0xcac0 sp_01, +0xcac4 sp_02 (the beam, render/beam-spawns.js), +0xcad0
// 04_26 (Soulseer). Folders by the path table (res 0x8aa5 / 0x8aa9). Census: scratchpad fb/cen12_em082_00.txt / _04.txt (all 16
// statuses, the ids and the .dtp filled).
// THE CHOOSER 0x104b540(e, k, r2) (READ; run natively for every k, fb/chooser082.py): -1 while tired for k in 0x22243495, with the
// head broken (0x1036e24) for k 9 / 11, with the tail severed (0x103780c) for k 3 / 19 / 22 / 24 / 28; else by the action number
// e+0x73e1 -- the 18 of G1_082 table A, (7, 0x10 / 0x12) x < 10 ? B : C with x = u16((r2 + k) x 0x17 + e+0x73e8 + 0x9c4) % 100, (7, 0x5d
// / 0x5e) B, any other action 0.
const A082 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 40, 17, 18, 19, 20, 21, 22, 23, 24, 25, 41, 42, 43];
const B082 = [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 14, 15, 16, 40, 17, 18, 19, 20, 21, 22, 23, 24, 25, 41, 42, 43];
const C082 = [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 14, 15, 16, 58, 17, 18, 19, 20, 21, 22, 23, 24, 25, 41, 42, 43];
const G1_082 = new Set([0, 1, 6, 7, 9, 0xa, 0xc, 0xd, 0x13, 0x14, 0x15, 0x16, 0x17, 0x2a, 0x2e, 0x30, 0x31, 0x73]);
function choose082(n, k, r2, st){
  if (st.tired && k <= 0x1d && ((0x22243495 >>> k) & 1)) return -1;
  if (st.head && (k | 2) === 0xb) return -1;
  if (st.tail && ((k - 3) >>> 0) < 0x1a && ((0x2290001 >>> (k - 3)) & 1)) return -1;
  if (G1_082.has(n)) return A082[k];
  if (n === 0x10 || n === 0x12){
    const x = u16((r2 + k) * 0x17 + st.h + 0x9c4) % 100;
    return x < 10 ? B082[k] : C082[k];
  }
  if (n === 0x5d || n === 0x5e) return B082[k];
  return 0;
}
// THE MAKER 0x104a298(e, k'): k' -> mode (MAKER082[k' + 1]; k' -1 none), + 100 for Soulseer; a 0x14-byte base12 setup (0x403394):
// +4 the id, +8 the mode, +0xc the owner, +0x10 = u16(s32(0.5 + e+0xcb9c x -50 x 182.04445)) -- the X word's tilt
const MAKER082 = [null, 0, 1, 36, 37, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 42, 43, 44, 47, 48, 49, 50, 51, 52, 53, 54, 55, 12, 13, 38, 39,
                  14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 45, 56, 57, 58, 24, 25, 40, 41, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 46];
const tilt082 = cb9c => u16(s32(mla(0.5, f(cb9c * f(-50.0)), DEG_TO_U16)));
// e+0xcb9c (0x1041af8, (7, 9) phase 0 only; kept by every later bubble): the pitch word from the block to the target (the block's
// point + 0 x size), less the block's X word, wrapped to +-0x8000; its upward part / -9102 (50 deg), 1.0 past it
function cb9c082(own){
  const P = own.ownerPos, T = own.target;
  if (!P || !T) return null;
  const dx = f(T[0] - f(P[0] + 0)), dz = f(T[2] - f(f(0) + P[2])), dy = f(T[1] - f(f(0) + P[1]));
  const h = sqrtf(mla(f(dz * dz), dx, dx));
  let r = (u16(s32(mla(0.5, atan2f(f(-dy), h), RAD_TO_U16))) - (own.ownerX >>> 0)) | 0;
  if (r > 0x8000) r -= 0x10000; else if (r < -0x8000) r += 0x10000;
  if (r < -9102) return f(1.0);
  return f(f(Math.min(r, 0)) / f(-9102.0));
}
@BASE12@
// make12: the bubble from its setup (mode, the tilt word) on the previous pose's joints
function make12(state, D, m, word10, own, J, ctx, action, frame){
  const def = D.shells.shell12, mode = def.modes[m];
  if (!mode) return { why: 'shell12 mode ' + m + ': no files in this arc (the game makes an effectless shell)' };
  const k = params082s12(mode);
  if (k.flags & 2) return { why: 'shell12 mode ' + m + ': base12 deferred init (+0x15e0 bit 1): no census mode of his' };
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell12', cls: def.cls, globalId: def.id, base: 'base12', mode, modeIndex: m,
              action, spawnFrame: frame, motion: ctx.motion, state: 1, k, position: null, anchor: null, angles: null, velocity: null,
              gravity: null, timer: 0, moves: 0, events: [], place: null, start: null, stop: null, effect: null, effect2: null,
              effects: mode.ef.map(([listId, key], param) => ({ param, listId, key, started: false })) };
  const why = init12(S, k, { word10 }, own, J);
  if (why) return { why: 'shell12 mode ' + m + ': ' + why };
  S.start = rockRequest(D, mode, 0, S.position, 'shell12');
  S.effect = S.start ? { param: 0, key: S.start.key } : null;
  if (S.start) S.effects[0].started = true;
  return { S };
}
// THE SPAWNER (code 'em082'), line 4: each row a frame of the action (pass001) and either a chooser k (k, r2) through the maker or a
// literal mode (lit) through the second maker 0x104a840 (none while tired for 160 / 162 / 165 / 168 / 171: 0x925 over mode - 0xa0).
// The Soulseer soul-flame arms (P+0x1bb bit 1: literal 185..190, 174..176) are not taken: the viewer shows the flame unlit
// (dev/em082-effects-spec.md 3). input.mizu082 = { headBroken } (motion-states.js mizutsuneHead082), input.tailSevered, the tired
// state; e+0x73e8 the named stand-in 0 (H73E8_STANDIN).
function spawn082(state, D, a, ctx, input, out, fresh){
  const own = ctx.own001;
  if (a.cb9c && fresh){ const v = cb9c082(own); if (v != null) state.cb9c082 = v; else out.refused.push({ action: a.action, why: 'no owner position / target: e+0xcb9c (the tilt) kept' }); }
  if (fresh || !state.hist || !state.prevJoints) return;
  const st = { tired: !!ctx.tired, head: !!(input.mizu082 && input.mizu082.headBroken), tail: !!input.tailSevered, h: H73E8_STANDIN };
  const word10 = tilt082(state.cb9c082 || f(0));
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    let m;
    if (sp.lit != null){
      if (((sp.lit - 0xa0) >>> 0) <= 0xb && ((0x925 >>> (sp.lit - 0xa0)) & 1) && st.tired) continue;
      m = sp.lit;
    } else {
      const k2 = choose082(a.action[1], sp.k, sp.r2 || 0, st);
      if (k2 < 0) continue;
      m = MAKER082[k2 + 1];
      if (m == null) continue;
      if (D.variant082 === 4 && k2 < 0x3b) m += 100;
    }
    const why = missing001(own, { facing: true });
    if (why){ out.refused.push({ action: a.action, shell: 'shell12', mode: m, why }); continue; }
    const r = make12(state, D, m, word10, own, state.prevJoints, ctx, a.action, sp.frame);
    if (!r.S){ out.refused.push({ action: a.action, shell: 'shell12', mode: m, why: r.why }); continue; }
    state.shells.push(r.S); out.spawned.push(r.S);
  }
}
const act082 = (st, n, clip, spawns, x = {}) => Object.assign({ action: [st, n], code: 'em082', list: '2', clip, pick: 'ai',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x);
const K082 = (pairs) => pairs.map(([frame, k]) => ({ frame, k }));
const L082 = (frame, modes) => modes.map(lit => ({ frame, lit }));
for (const [mon, v, id, res, modes] of [['em082_00', 0, 0x158, 'em082_00_shell12', @MODES00@], ['em082_04', 4, 0x15c, 'em082_04_shell12', @MODES04@]]){
  const D = SHELL_DATA[mon];
  delete D.beamsOnly;
  D.name = v === 4 ? 'Soulseer Mizutsune' : 'Mizutsune';
  D.variant082 = v;
  // shell12: the bubbles (u 61 drifting, u 60 the pop at their end; Soulseer's own u.pel)
  D.shells.shell12 = { id, cls: 'uShellEm082_sp_12', base: 'base12', reader: 0x104f15c, folder: 'shell@em@' + res, modes };
  const L21 = v === 4 ? [[74, 7], [82, 8], [136, 9], [138, 10], [150, 11]] : [[70, 7], [78, 8], [86, 9], [136, 10], [150, 11]];
  D.actions = D.actions.concat([
    act082(7, 0x00, 'Motion[42]', K082([[94, 18], [100, 19], [104, 20]])),                     // 0x104c258: tune 0x49..0x4b
    act082(7, 0x01, 'Motion[3]', K082([[46, 0], [46, 2], [46, 1], [46, 3]])),                   // 0x104c358: tune 0 / 1 (phase 3)
    act082(7, 0x09, 'Motion[20]', K082([[43, 14], [48, 15], [56, 16]]), { cb9c: true }),          // 0x104c444 (+ 0x1041af8's tilt)
    act082(7, 0x0a, 'Motion[64]', K082([[42, 24], [44, 25], [42, 26]]), { also: [[7, 0x73]] }),  // 0x104c760: tune 0x53..0x55
    act082(7, 0x0c, 'Motion[20]', K082([[43, 4], [48, 5], [56, 6]]), { also: [[7, 0x2e]] }),     // 0x104c860: tune 4..6
    act082(7, 0x0d, 'Motion[21]', K082(L21), { also: [[7, 0x30]] }),                             // 0x104cb7c: tune 7..0xb / 0x8c..0x90
    act082(7, 0x2a, 'Motion[89]', K082([[114, 21], [120, 22], [124, 23]]), { also: [[7, 0x31]] }), // 0x104cea8: tune 0x50..0x52
    ...(v === 0 ? [act082(7, 0x5e, 'Motion[26]', K082([[50, 27], [54, 28], [56, 29]]))] : []),   // 0x104d310: tune 0x5b..0x5d
    // status 2: 0x103cedc / 0x103d238 -- Mizutsune k 12 / 13 (0x104b4f0 / 0x104bb10: tune 0xc / 0xd), Soulseer the second maker's
    // literals at tune 0x7d / its pair (162..164 / 165..167; 174..176 / .. with the soul flame)
    act082(2, 0x06, 'Motion[39]', v === 4 ? L082(36, [162, 163, 164]) : K082([[38, 12]]), { also: [[2, 0x14], [2, 0x15]] }),
    act082(2, 0x34, 'Motion[39]', v === 4 ? L082(36, [162, 163, 164]) : K082([[38, 12]])),
    act082(2, 0x07, 'Motion[10]', v === 4 ? L082(26, [165, 166, 167]) : K082([[21, 13]]), { also: [[2, 0x16], [2, 0x17]] }),
    act082(2, 0x35, 'Motion[10]', v === 4 ? L082(26, [165, 166, 167]) : K082([[21, 13]])),
    // (7, 0x7d) 0x1041c9c: the second maker's 159 / 160 / 161 at f44 (Mizutsune's file has no such modes: refused by name)
    act082(7, 0x7d, 'Motion[64]', L082(44, [159, 160, 161])),
  ]);
}
