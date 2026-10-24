# gapA -- Old Fatalis (em013_02, uEm013_00 variant 2): (7, 0x49)'s pitch and sp_01 mode 9 (2026-10-20)

Every script below lives in `<scratchpad>\gapA\` (plain `python`, FB_CLASS / FB_MON set inside). No repo file was edited.
Replay: `python patch_copy.py && node replay.mjs` -> **27 passed, 0 failed** (the patched COPY `gapA\shells.js`).

## (a) Facts

### 1. (7, 0x49) -- 0xd8716c (READ whole, 0xd8716c..0xd87444; literal pool 0xd87448..0xd87460)

- **Issued**: `emc011.py em013_02 7:0x49` -> groups (0, 8), (0, 9), (0, 14), (1, 116), (1, 123), (1, 124); `fb/reach_em013_02.json`
  holds [7, 73]. Dispatch: `0xd8901c b 0xd8716c` (trgen FB_WATCH: (7, 0x49) -> 0xd8716c).
- Entry: `e+0xb5f8 = 2` every update. **Phase 0** (P+0x1a1 == 0): P+0x1a1 = 1, `0xbc7f4(e, 0)`, P+0x1bb = 0, `0xafe84(e, 0x219, 8.0, ..)` = L2 M25.
- **Phase 1**: `0xb0968(e, 0, 0, 146.0, 0.0)` (the crossing of 146; literals 0xd87448 = 146.0, 0xd8744c = 0.0). When it fires:
  - Q = joint **3**'s world point (`0xc164c(e, 3, sp)`, [sp+0xc] = 0) + v turned **Z, then X, then Y** by the block words P+0x58 / +0x50 / +0x54
    (`ldrh`, x 9.58738e-5 = 0xd87450; sinf 0x13ecc20 / cosf 0x13ecc2c), v = (0.0, -91.6, 132.8) (0xd8744c 0.0 is the x; 0xd87454 = 91.6 enters through
    `vmls`, 0xd87458 = 132.8). v is the same vec as sp_00's &vec 0 (`G` in SHELL_DATA.em013_02) -- INFERRED to be the fireball's own launch offset
    (the shell turns it by the joint's 3x3, this code by the block words: not the same point).
  - A = the target **P+0x1d0..0x1d8** + (0, 0, -1600) turned by Y (0xd8745c = -1600.0): 1600 short of the target along his facing.
  - d = A - Q. yaw = s32(0.5 + atan2f(dx, dz) x 10430.378) (0xd87460); u = uxth(s32(0.5 + atan2f(-dy, sqrtf(dx^2 + dz^2)) x 10430.378)).
  - **Clamps**: `cmp u, #0x2000; movhs u, #0x2000` (unsigned: any u >= 0x2000, i.e. above 45 deg down AND every upward pitch -> 0x2000);
    `uxtah(0xffffbfff, yaw - [P+0x54])`, `cmp #0x7fff; movwlo u, #0x2000` = uxth(yaw - Y) in [0x4001, 0xbfff] (A behind him) -> 0x2000.
  - `[e+0xcac0]+0 = u`; `0xd82024(e, 2, u16 [[e+0xcac0]], 0)` -> sp_00 **0x8a mode 1** (v2: sel 2 -> 1), +0x20.. = (P+0x50 + u, P+0x54, P+0x58)
    (u32 sums), +0x10 the GOT zero vector, +0x1c / +0x2c 0, +0x2e 0xffff.
  - `0xb09c8` (the clip's end) -> vt+0x3dc. **No tune value is read** (no 0x6f618 / 0x6f62c in the function).
- **Emulated** (emu49.py: the function under trgen with sinf / cosf / atan2f / sqrtf answered in float32, 0xc164c answered): 7 cases, joint asked = 3,
  create = (0x8a, 1, +0x20 = X + [e+0xcac0]) every time; phase 0 logs L2 M25 blend 8; phase 1 without the frame makes nothing. The module's
  `pitch013_49` equals the ROM word in all 7 (incl. the two 0x2000 clamps: A behind, A above).

### 2. sp_01 0x8b mode 9 -- **made by 0xd87630, Old's storm strike ((7, 0x50) phase 4)**

- **Every create in the class band** (uEm013_00 lo 0xd7d578 .. hi 0xd8e1c0 + 0x400, per-word disassembly, `scan8b.py`): 14 call sites of
  0x48b884, each id an immediate. The **0x8b** ones and their modes (read at each site):

  | maker | create | mode(s) | reached for Old |
  |---|---|---|---|
  | 0xd7ffcc (dust) | 0xd80208 | kind 5 -> 0xb, 1 -> 0xa, else 0xc | yes |
  | 0xd80e74 (meteors) | 0xd81054 | 5 | yes |
  | 0xd87464(e, hunter) | 0xd875fc | 5 (at the hunter's +0x40) | needs a hunter |
  | **0xd87630** | **0xd879c0** | **9** (`mov r0, #9; str r0, [r1, #8]` at 0xd87930) | **yes: (7, 0x50) phase 4** |
  | 0xd88918 ((7, 0x52)) | 0xd88ab0 | 5 | no ((7, 0x52) not in the reach) |
  | landing 0xd8d08c | 0xd8d2e8 | r5 = 6 / 0 / 8 / 7 / 1 (`stmib r7, {r1, r5}`) | yes |
  | sp_11 +0x168 0xd8db9c | 0xd8de34 | 2 / 3 / 4 | yes |

  The other mode-9 literals in the band are not 0x8b: 0xd80160 (0xd7ffcc's Crimson arm, 0x87), 0xd8c5bc / 0xd8c5f0 (Crimson's landing, 0x87),
  the rest readers / non-create code. **Control (the same scan, `scan8b.py 6`)**: finds `0xd8d134 mov r5, #6` in the landing 0xd8d08c (the known
  mode-6 create). 0xd8b1b4 (`mov r2, #0x8b`) is the per-variant id registration `0x48b71c`, not a create.
- **The shells' methods** (`vt02.py`, vtable extents derived: from the (0, 0) pair before the reader's slot to the first non-.text word):
  sp_01 0x17a7b6c (90 slots, reader +0x14c), sp_51 0x17a7fcc (90), 0x17a7cdc (93, between sp_01's and sp_11's -- INFERRED the beam 0x8c's):
  slot functions + their direct calls to depth 3 make **no** create and no allocation. Controls on the same walk: sp_00 0x17a79f0 shows its
  landing 0xd8d08c (0x3fa2bc x2, 0x48b884), sp_11 0x17a7e58 its +0x168 0xd8db9c (0x3fa2bc x3, b 0x48b884).
- **Why the census never saw it**: (a) cengen11's (7, 0x50) ran phase 4 but `0xd87630` creates only when the ray's **hit byte** is set, and
  trgen's 0x183664 stub writes nothing to it (`uc.mem_write(pf, b'')`) -> the flag stays 0; (b) 0x27482c (the hunter) answers 0, so the aimed arm
  never runs. emu50.py answers the ray (hit byte 1, s0 = the ground) -> two 0x8b mode 9 creates in one update (returning to 0xd879c4).
- **(7, 0x50) 0xd87a18 (READ whole, 0xd87a18..0xd8813c; jump table 0xd87a6c: phases 0..5 -> 0xd87a84 / ae0 / c4c / e1c / f58 / 0xd8807c)**:
  phase 0 L4 M1 (0x401, blend 6), P+0x1bb = 0, ctl+0x40 += 1 when (0x2a >> it) & 1; phase 1 at the end: L4 M2 (0x402), the yaw into ctl+4,
  0xd7ffcc(e, 1, (0, 0, 300)) (the existing Motion[1] row); phase 2 on L4 M2 the flight (block +0x10.. = ((-32900, 25460, 20040) x 0xbe518 -
  P+0x40) / const), its end L4 M3 (0x403); phase 3's end: L4 M4 (0x404), P+0x1a2 = 0, **P+0x40 = (-32900, 25460, 20040) x 0xbe518, P+0x4c = 0,
  P+0x54 = 0xd556, P+0x1bc = 0**. **Phase 4** (every update): e+0x75c0 = 0; `0x7206c(e, &P+0x1bc, 1.0)` out -> hunter `0x27482c(mgr, P+0x1a2 & 3)`
  active (vt+0x88), +0x1051 not excluded (0x693b0 / 0x49184), same area (+0x1054), +0x2506 != 0x100, not 0x2f523c 1 / 7 / 2 -> **0xd87464(e, h)**
  (sp_01 0x8b mode 5 at the hunter; ray 0x180fd4; the same box), else **0xd87630(e)**; then P+0x1bc = 90.0 (0x42b40000), P+0x1a2 + 1.
  Then `0x7206c(e, &ctl+0x3c, 1.0)` out -> **0xd87630(e)**, ctl+0x3c = **27.466667** (0x41dbbbbc). L4 M4's end -> P+0x1a1 + 1 and
  `0x768c8(e, 7, 0x51)`. Phase 5 only tests the end (never ticked: the change is immediate).
- **0x7206c / 0x539d5c (READ)**: t <= 0 -> t = 0, returns 1; else t -= e+0x1c x rate, clamped at 0.0 (0x539dac), returns t <= 0 = shells.js `cd071`.
- **ctl+0x3c's start value**: `[e+0xcac0]` = **P + 0x60** (the ctor tail 0xd7d5d4: `str r1+0x60, [e+0xcac0]`, then ctl+0 / 4 / 8 / 0xc / 0x10 /
  0x2c / **0x3c** / 0x40 = 0, +0x20.. the GOT vec); vt+0x1d8 0xd7d778 writes ctl+0x3c = 0 again; the only other writer in the band is the storm
  (0xd880f4). (Band scan `st3c.py` for `#0x3c]` and for the alias `#0x9c]`: the latter only the init_array 0xd8b534, not the block.) Shared code
  writing P+0x9c: NOT scanned.
- **0xd87630 (READ whole, ..0xd879d0)**: RNG object [GOT 0x1832ae0] = 0x1917a18, `0x7c9234` the **u32**. r4 = rand % 1000; r4 < 0x218 (536) ->
  x = rand % 7000 + (-2500.0), z = rand % 4000 + (-700.0); else rand % 8500 - 2500, rand % 7200 - 700 (vcvt.f32.u32 then vadd; literals 0xd879d8 /
  0xd879dc) -- **stage coordinates**; y = 1000.0; the ray `0x183664(mgr, &p, 0, e+0x1054, [sp] = &flag, 0, 0x40)` (no second point: from 100
  above) -> p.y = s0, flag = the hit byte; **y > 780 && 220 < x < 870 && 3500 < z < 4200 -> x = 545, z = 3850** (0xd879e4..f4, 0x44084000 /
  0x4570a000); hunters 0..3 within (x +-500, z +-500) (0xd87a00 / 04) in his area AND (+0x2506 == 0x100 or 0x2f523c 1 / 7 / 2) clear the flag;
  flag -> setup 0x40: id 0x8b, **mode 9**, owner e, +0x10.. the point, +0x1c 0, +0x20.. [GOT 0x1831a78] = 0x19176b0 (the zero vector),
  +0x2c 0, +0x30.. [GOT 0x18321b0] = 0x1620e60 (zeros), +0x3c 0xffff. Emulated: emu50.py (4 cases + no-timer control) = strike013 on the same draws.
- Mode 9 (SHELL_DATA.em013_02 shell01): ef [[0, 111], [0, 110]], ints [-1, -1, -1, 0, -1] -> flag 0x20 (base01's switch): u111 at the init,
  u110 at the switch -- the same shape as mode 5 (u103 / u100). So the elder spec's "em013_02u u100 / u110 (the lightning's strike)" pairs two
  makers: u100 is mode 5's (meteors / 0xd87464), **u110 mode 9's (the storm)**.

**INFERRED / named in the transcription**
- The viewer's play: its first frame is phase 3's setMotion of L4 M4; phase 4 runs from the next step (the file's convention for every row).
- The strike points are the ROM's stage coordinates put in the viewer's world as they are (the Gore scatter's hunterless arm does the same);
  he is NOT moved to phase 3's point (-32900, 25460, 20040) x size -- named. (Read literally the strikes land ~33000 from that point.)
- The RNG: the viewer's one stand-in stream (rng16's seed); 0x7c9234's u32 = rng16's new fourth word. Seed NOT READ (as everywhere).
- No hunter: 0x27482c answers none, every P+0x1bc strike is 0xd87630's; the aimed mode-5 arm 0xd87464 and the hunter cancel are not built.
- The ray: `ground022` (the stage stand-in's floor from 100 above); its area / mask arguments (e+0x1054, 0x40) not modelled, as elsewhere.
- What the hunter states (0x2f523c 1 / 7 / 2, +0x2506 0x100, 0x693b0 / 0x49184 on +0x1051) mean: NOT READ (unused without a hunter).
- L4 M4 is list '4', clip 'Motion[4]' by the file's convention (L4 M1 = '4' / 'Motion[1]' in the existing row): its length decides the count.

## (b) The JS for docs/render/shells.js (tested as written: `patch_copy.py` applies exactly these four edits to the copy)

**Edit 1 -- the helpers.** Anchor: the end of `s51b013` (its last lines below), immediately before the `{` that opens the em013_02 block
(`const D = SHELL_DATA.em013_02 || ...`). Insert the whole of `gapA\blockA_helpers.js` between `}` and `{`:

```js
    position: [f(P[0] + xr), f(x + P[1]), f(zr + P[2])], angles: [0, u16(own.ownerY), 0], action: a.action, frame: sp.frame }, own, J, ctx, null);
  if (S) push(S);
}
// <-- blockA_helpers.js here (pitch013_49, rng32_013, strike013, storm013)
{
  const D = SHELL_DATA.em013_02 || (SHELL_DATA.em013_02 = { lists: {}, shells: {}, actions: [] });
```

blockA_helpers.js (verbatim):

```js
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
```

(`cd071` is the Gore scatter's module-level 0x539d5c helper, defined later in the file -- called at run time, so no TDZ issue; `rng16`,
`ground022`, `make001`, `jointMatrix`, `sqrtf` are existing module functions.)

**Edit 2 -- do013's fire word.** Replace the line

```js
    const dx = dx0 === 'aim' ? state.aim013 : dx0 === 'aimNow' ? aim013(sp.aim, own) : dx0;
```
with
```js
    const dx = dx0 === 'aim' ? state.aim013 : dx0 === 'aimNow' ? aim013(sp.aim, own) : dx0 === 'pitch49' ? pitch013_49(J, own) : dx0;
```

**Edit 3 -- spawn013's first line.** After `function spawn013(state, D, a, ctx, input, out, fresh){` insert

```js
  if (a.storm013) return storm013(state, D, a, ctx, out, fresh);   // Old's (7, 0x50) phase 4: timers, not frames
```

**Edit 4 -- the rows** (SHELL_DATA.em013_02 `D.actions`). Replace the existing line

```js
    act013(7, 0x50, '4', 'Motion[1]', [{ atEnd: true, kind: 'first', frames: [71.0], dust: [1, [0.0, 0.0, 300.0], 1.8] }]),
```
with
```js
    // (7, 0x49) 0xd8716c phase 1 f146 (READ): the pitch from joint 3's world point to 1600 short of the target (pitch013_49) -> sp_00 1
    act013(7, 0x49, '2', 'Motion[25]', [{ frame: 146, fire: [2, 'pitch49', 0] }]),
    act013(7, 0x50, '4', 'Motion[1]', [{ atEnd: true, kind: 'first', frames: [71.0], dust: [1, [0.0, 0.0, 300.0], 1.8] }]),
    // (7, 0x50) phase 4 on L4 M4 (storm013): sp_01 9 at 0xd87630's stage points, at once and then every 90.0 (P+0x1bc) / 27.47 (ctl+0x3c)
    act013(7, 0x50, '4', 'Motion[4]', [], { storm013: true }),
```

Spec text (dev/elder-dragon-shells-spec.md §3, "Not built (named)"): drop "(7, 0x49) (Old, L2 M25 f146: a pitch from joint 3's world point,
0xd8716c);" and add under "The makers' arguments": `0xd8716c ((7, 0x49), Old, L2 M25 f146): the pitch from joint 3 + (0, -91.6, 132.8) (Z X Y
by the block words) to the target + (0, 0, -1600) by Y; >= 0x2000 or behind him -> 0x2000; 0xd82024(e, 2, u, 0)` and `0xd87a18 ((7, 0x50))
phase 4 / 0xd87630: the storm (sp_01 0x8b mode 9 at random stage points, the two timers 90 / 27.47; the hunter arm 0xd87464 mode 5 not built)`.

## (c) rom-map rows (the "Elder Dragons -- the shells" table)

```
| `0xd8716c` ((7, 0x49), Old, L2 M25) | phase 0 L2 M25 (0x219, blend 8), P+0x1bb = 0; phase 1 at the crossing of 146: Q = joint 3 (`0xc164c`) + (0, -91.6, 132.8) turned Z, X, Y by the block words; A = the target P+0x1d0 + (0, 0, -1600) by Y; u = uxth(s32(0.5 + atan2(-dy, flat) x 10430.378)), u >= 0x2000 (unsigned) or uxth(yaw - Y) in [0x4001, 0xbfff] -> 0x2000; [e+0xcac0]+0 = u; `0xd82024(e, 2, u, 0)` -> sp_00 0x8a mode 1, words (X + u, Y, Z); no tune read | uEm013_00 (Old) | R + E | <scratchpad>/gapA emu49.py (7 cases = the module); shells.js pitch013_49 |
| `0xd87a18` ((7, 0x50), Old's storm) | L4 M1 -> (end) L4 M2 + dust 0xd7ffcc(1) -> flight to (-32900, 25460, 20040) x 0xbe518 -> L4 M3 -> L4 M4 there (Y 0xd556), P+0x1a2 = P+0x1bc = 0; phase 4 every update: P+0x1bc (`0x7206c`, 1.0) out -> hunter P+0x1a2 & 3 valid ? 0xd87464 : 0xd87630, P+0x1bc = 90.0, P+0x1a2 + 1; ctl+0x3c out -> 0xd87630, ctl+0x3c = 27.466667 (0x41dbbbbc); L4 M4's end -> (7, 0x51) | uEm013_00 (Old) | R + E | gapA emu50.py; shells.js storm013 |
| `0xd87630` | Old's random strike: rand % 1000 < 536 ? (rand % 7000 - 2500, rand % 4000 - 700) : (rand % 8500 - 2500, rand % 7200 - 700) (stage coords, 0x7c9234 u32); ray 0x183664 from y 1000, its hit byte gates; y > 780 in x (220, 870) z (3500, 4200) -> (545, y, 3850); a hunter within +-500 in his area in a state (+0x2506 0x100 / 0x2f523c 1, 7, 2) cancels; **sp_01 0x8b MODE 9** at the point, words and +0x30 the GOT zeros | uEm013_00 (Old) | R + E | shells.js strike013 |
| `0xd87464(e, hunter)` | the storm's aimed strike: the hunter's +0x40, ray 0x180fd4, the same box -> sp_01 0x8b mode 5 | uEm013_00 (Old) | R (not built: no hunter in the viewer) | gapA RESULT.md |
| `0xd7d5d4` (ctor tail) / `0xd7d778` (vt+0x1d8) | `[e+0xcac0]` = **P + 0x60** (the class control block is in the block); ctl+0 / 4 / 8 / 0xc / 0x10 / 0x2c / 0x3c / 0x40 = 0, +0x20.. the GOT vec; vt+0x1d8 zeroes ctl+0x3c / 0x40 again. ctl+0x3c's only other band writer: the storm | uEm013_00 | R (band scan for `#0x3c]` / `#0x9c]`; shared code writing P+0x9c not scanned) | gapA st3c.py |
| uEm013_00's 0x8b creates (all, 2026-10-20) | 0xd7ffcc 0xa / 0xb / 0xc; 0xd80e74 5; 0xd87464 5; **0xd87630 9**; 0xd88918 ((7, 0x52), not issued for Old) 5; landing 0xd8d08c 6 / 0 / 8 / 7 / 1; sp_11 0xd8db9c 2 / 3 / 4 -- every 0x48b884 site in the band (14, ids immediate); sp_01 0x17a7b6c (90 slots) / sp_51 0x17a7fcc / 0x17a7cdc vtables create nothing (depth 3) | uEm013_00 | R (controls: `scan8b.py 6` finds the landing's mode 6; the walk finds sp_00's / sp_11's creates) | gapA scan8b.py / vt02.py |
```

Tooling row (the tooling table):

```
| `<scratchpad>\gapA\` emu49.py / emu50.py / scan8b.py <mode> / vt02.py / st3c.py <suffix> / callers.py <hex>.. / patch_copy.py + replay.mjs (2026-10-20) | emu49: 0xd8716c phase 1 under trgen with sinf / cosf / atan2f / sqrtf answered in float32 and 0xc164c answered; emu50: (7, 0x50) phase 4 with the RNG 0x7c9234 and the ray 0x183664 (hit byte, s0) answered; scan8b: a band's creates / allocations / id and mode immediates; vt02: a shell vtable's derived extent and a depth-3 create walk; callers: bl / b and data words to a target | emu49 = pitch013_49 7/7; emu50 = strike013 4/4; scan8b 6 finds 0xd8d134; vt02 finds sp_00's / sp_11's creates | the walk follows direct calls only (no blx through registers) |
```

Trap (next number, 130):

```
130. **trgen's ray stub writes no hit byte (2026-10-20).** `0x183664`'s hook in fb/trgen.py writes `b''` to the stack's hit-byte pointer and
     returns s0 = 0, so every create gated on the ray's hit byte is skipped and a census reports the action as making nothing. Old Fatalis's
     storm 0xd87630 (sp_01 0x8b mode 9, (7, 0x50) phase 4) was missed that way; gapA\emu50.py answers the byte. Same family as trap 105 (a
     stub answering 0 hides an arm): a census "nothing makes mode N" needs the ray and the hunter getter (0x27482c, answered 0) checked first.
```

WITHDRAWN: no written repo claim was found that mode 9 is unmade (grep of the spec / rom-map / check). If the shells lane recorded
"sp_01 mode 9: nothing read makes it" anywhere, move it to the Withdrawn table as:

```
| shells lane (2026-10-20): "Old's sp_01 mode 9 (u 110 / 111): nothing read makes it" (the census cen11_ed013v2) | the census's ray stub writes no hit byte (trap 130), so 0xd87630's create never ran; and the "lightning's strike" u 110 was read as mode 5's | **0xd87630** ((7, 0x50) phase 4, the storm) makes sp_01 0x8b mode 9; u 110 is its switch record, mode 5's is u 100 (gapA) |
```

## (d) The replay -- `gapA\replay.mjs` on `gapA\shells.js` (the patched copy; `python patch_copy.py` rebuilds it from the repo file)

27 / 27:
- pitch013_49 = the ROM's [e+0xcac0] in all 7 emu49 cases (0x159b, 0x1b04, 0x1fb7, 0x2000 behind, 0x2000 above, 0x82b, 0x5f0); controls: joint 3
  moved -> another word; no target -> a named refusal.
- (7, 0x49) L2 M25 end to end: one sp_00 0x8a mode 1 at f146 (step 147 -- the file's pass001 convention; control (7, 0x02) f102 at step 103),
  words (X + 0x1b04, Y, Z) = the ROM's setup, u13 started, no refusals.
- strike013 on the ROM's draws = emu50's creates (hit / the box remap to (545, 900, 3850) / plain / no hit -> none).
- (7, 0x50) L4 M4 end to end (dt 1, floor 0, 200 steps): 11 strikes at steps 1, 1, 29, 57, 85, 91, 113, 141, 169, 181, 197 (the two timers),
  all sp_01 0x8b mode 9 on the floor inside the boxes with words 0, each starting em013_02u u111 at its init (control: the meteors' mode 5
  starts u103 the same way; u110 / u100 are the 0x20 switch's and need hit slots in this harness, both alike); controls: floor above the
  ray's start -> none; L4 M1 -> no storm; a replay resets P+0x1bc (a strike at once) and carries ctl+0x3c (24.467 left -> its next at step 25).
