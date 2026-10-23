# Duramboros (em061_00) / Rustrum Duramboros (em061_04) -- shells spec (shells agent, 2026-10-18)

**[MISLABELLED -- WITHDRAWN 2026-10-18: em061_00 / em061_04 are LAGOMBI / SNOWBARON LAGOMBI (docs/monsters.json, rom-map uEm061_00);
Duramboros is em055. Read every "Duramboros" / "Rustrum" below as Lagombi / Snowbaron: the ball is Lagombi's snowball, the lumps
Snowbaron's. The check file names (dev/shells-duramboros-check.mjs, shells-rustrum-check.mjs) are kept.]**

One class `uEm061_00` (action main `0xf32798`, dispatch table `0xf31438`). Its ids are fields, written by vt+0x158 `0xf23ec0`
by the variant byte `e+0xb5f5`:

| field | variant 0 (Duramboros) | variant 4 (Rustrum) | class |
|---|---|---|---|
| `e+0xcac8` | 0x105 | 0x108 | uShellEm061_sp_00 (base00) |
| `e+0xcacc` | 0x106 | 0x109 | uShellEm061_sp_01 (base01) |
| `e+0xcad0` | 0x19d (none) | 0x10a | uShellEm061_sp_13 (base13) |
| `e+0xcad4` | 0x107 | 0x10b | uShellEm061_sp_19 (base19 over base03) |
| `e+0xcad8` | 0x19d (none) | 0x10c | uShellEm061_sp_24 (base24) |

Census of the action main per variant: scratchpad `fb/cen2_em061_v0.txt` / `_v4.txt`. Transcribed: docs/render/shells.js
`SHELL_DATA.em061_00` / `SHELL_DATA.em061_04`. Checks: dev/shells-duramboros-check.mjs (20 / 20), dev/shells-rustrum-check.mjs
(24 / 24, page 19 / 19, soak em061_04 98 motions, 0 refused).

## 1. Readers -- READ whole

- sp_00 `0xf32e84` -> `0xf32ebc` (0x105) / `0xf3304c` arm (0x108): ef 0..3; hit 0; int 0 joint; +0x15e8 0x80 always, 0x200 int 1,
  0x40 int 2; the 0x108 arm adds 0x10 int 3, 0x20 int 4; floats degY / vz / vy / flight; &vec 1 offset, &vec 0 gravity
  (`params061s00`). Landing `0xf3322c`: modes 4..6 make sp_01 0 at a type 0 / 1 contact.
- sp_01 `0xf334f0` (both ids): 0x4 int 0, 0x8 int 1; no EffectParam -- a hit volume.
- sp_19 `0xf34434` -> `0xf34470` (0x107: `params061s19`) / `0xf34608` (0x10b: `params061s19v4`): ef 0 +0x15c8, ef 1 +0x1660 (the
  end's); v4 also 0x10 / 0x20 int 1, 0x400 int 2 (sizes x the owner's), 2 int 3 (the Y aim, clamped to floats 8 / 9), int 4 ->
  +0x1664 bit 3 (the turn: float 10 the rate, float 11 the limit, degrees), float 7 the delay +0x1718.
- sp_13 `0xf33858` (0x10a): flags 0x101 (| 2 int 1, | 8 int 2), floats speed / per unit / arc height / near / far / life / scale,
  limits -0.01 / 0.01, ef 3 -> +0x1690 (the crumble); ctor `0xf33710` blend count +0x1684 = 5.
- sp_24 `0xf34c74` (0x10c): ef 0 / 1 / 2 flight / end / landing; flags 0x10 int 1, 0x20 int 2, 2 int 3, 4 always, 0x40 int 4;
  floats Y deg / distance / vy / life / radius / size / spin; &vec 1 the offset, &vec 0 gravity.

## 2. base03 / base19 (Duramboros's ball) -- READ

- base03's follow `0x3fdf18` gates its SLOPE step on `+0x1664` bit 1 (`0x3fe740`): Khezu's reader sets it (`0xd21bec`), the base03
  ctor zeroes the byte (`0x3fd878`) and sp_19 never writes it -- so the ball takes only the ground's y and keeps its roll word
  (shells.js `follow03` `k.slope`).
- base19 init `0x408ea0`, step `0x408ffc` (both READ whole): sizes / grow / rise, the delay, base03's follow, the rise, the roll
  word; the end `0x3fd820` starts ef +0x1660. The flight's ef 0 is base00's init's (`0x3f9298`) at the joint point, before the
  ground snap and the rise.
- base00's init scales the joint offset by the size with flag 0x80 on the joint path too (`0x3f8ec4` -> `0x3f8f9c`): init03 and
  init00's joint arm now do (checked: `dm_ball_6f_big`, `dm_lump_ad_big`, size 1.25 x 1.1).
- Duramboros's (7, 0xe6) makes sp_00 mode 7, which his file lacks: the ROM's shell starts and creates nothing and leaves state 1 on
  its first move; the module makes none (the check counts it as empty).

## 3. Rustrum's lump chain -- READ

- **base24** (ctor `0x40da80` over the plain shell `0x43a78c`; init `0x40dc14`, snap `0x40e6f0`, landing +0x150 `0x40d808`, +0x154
  `0x40d9c8`, update `0x40e984`, step `0x40ea90`, flight `0x40ec60`, end `0x40ed6c`; all READ whole): the throw solves the fall from
  the offset's height to radius x size above the ground under gravity's y with float 2 up, the horizontal speed covering float 1
  less the offset's z; X / Y / Z turn; spin while airborne; the rocks' query with the contact offset (0, -radius x scale, 0); a
  type-1 contact lands it (velocity and gravity 0, ef 2); its life ends it (ef 1, unless converted). `0x40e6f0` places it on the
  ground 550 (mode 0) / 200 + radius x size (mode 1) ahead of its owner. (`ray24`: the 0x183664 ray, mask 0x40, from 10000 below
  to 10000 above -- the stage stand-in's floor.)
- the actions (L9): M2 (7, 0xf1 / 0xf2 / 0xf9 / 0xfc) f85 throw mode 0; M10 (7, 0xfa / 0xff) f104 throw mode 1 and +0xcae0 = 0;
  M3 (7, 0xed / 0xee / 0xf5) start: place mode 0 when no live lump is held (else snap a held one that has not landed), f32 roll
  (`0xf34a20`: sp_19 8 / 7 / 2); (7, 0xe5) plays M10 from 182: place mode 1, f184 lift (`0xf34b4c`: sp_13 0), +0xcae0 = 1; M11
  (7, 0xf6) f59 +0xcae0 = 2. The held lump is `e+0xcadc`, the last one made (`state.held24`).
- **sp_19 v4**: the lump's point and words (0x10 / 0x20), Y aimed at the target from the owner's point and clamped to [float 8,
  float 9] (yAdjust37, flag 4 clear); modes 7 / 8 turn toward the target's side at float 10 a frame up to float 11 degrees
  (`turn19`, `0x409018..0x409104`).
- **sp_13** (base13 init on flags 0x109: joint 15, the half-point x size, state 1): held while the owner's motion is L9 M10 / M11
  (`0xf33e40`): a joint-parented coordinate (`0x8a46a0`, inherit mode 2: the parent's rotation dropped, so its words are 0) whose
  point is joint 15's matrix on vec 0 (`0x29d00`); +0x40 blends to it over 5 updates (0.2 + 0.8 i / 5). +0xcae0 == 2 throws it:
  the thrown point (`0x405500`, Khezu's arm: distance to the target clamped [800, 3000] along the aim from the shell), the Y word,
  the launch (`0x404dc8`, the arc-height arm); flight with the turn skipped (+0x15e1 bit 0); landing `0xf33a8c` -> ef 1 / 2 and
  the burst `0xf33b1c`: sp_01 1, sp_00 0x17 / 0x18 / 0x19 at the contact, words (0, Y, 0). Another motion crumbles it: ef 3 at
  the unit's +0xe0 (INFERRED its position) and the end.

## 4. The harness (scratchpad fb/emu_fb.py), for these runs

- `convert` {id, fn, args, after}: the monster's own conversion call on the held shell, before the move of the `after`-th frame
  that starts with it landed in state 1 (the enemy's line 4 runs before the shells' line 18).
- `pokes` {k: {off: bytes}} with `pokeDepth`: owner bytes written before frame k's move of a shell at that depth.
- `ownvt54`: the owner's vt+0x54 answered with the enemy's own `0xc156c` (a joint's world matrix).
- the ray 0x183664 meets the floor plane from below too (base24 casts upward through it).

## 5. Not modelled / stand-ins

- the stage: the floor plane stand-in for every query and ray (the stage core is not read).
- sp_24's +0x15c0 (read by the place / lift tests) is never set in the viewer (INFERRED a hunter's break of the lump).
- the hit slots (life <= 0 paths) of base24 / base19 are not transcribed (no Rustrum mode reaches them).
