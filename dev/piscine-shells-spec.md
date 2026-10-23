# Piscine Wyverns -- shells spec (shells agent, 2026-10-18)

Census: scratchpad `fb/cen9_em010.txt` / `cen9_em017.txt` / `cen9_em036.txt` (every status x number x phase, G rank) and
`cen9r3_em017.txt` / `cen9r3_em036.txt` (rank 3: the same rows). The census answers every frame test at once, so a helper with
several tests shows only its first: each helper was read for the rest. Folders READ off the path table (`0x175c3e8` res ->
`0x159daa0`; scratchpad `shellres.py`). Generic machinery: docs/render/shells.js `spawnPlain` / `makePlain` (code 'plain'):
a row `{ frame, shell, mode }` (or `at: 'start'`, `untired`), the shell made from the zero vector's setup and placed / aimed by
its own reader.

## Plesioth (em010_00) -- already complete

Every shell his actions make is the beam 0x7d (uShellEm010_sp_02), (7, 6 / 8 / 9 / 0xd / 0xf / 0x10 / 0x15 / 0x16 / 0x27 / 0x28 /
0x32), already in render/beam-spawns.js with its children (0x7c, makeChild02g); (7, 0x17) is not issued (beam-spawns' note).

## Cephadrome (em017_00) -- DONE

Check dev/shells-cephadrome-check.mjs 15 / 15 (9 ROM cases, 2 contract, 4 controls FAIL), page 4 / 4, soak 74 motions 0 refused,
dev/checks/em017_00 54 / 0; records u 0 / 1.

- sp_00 0x92 reader `0xda39fc`: ef 0..3; joint int 0; flags 1 int 1 (the X aim), 2 int 2, 8 int 3, 4 int 4; floats degX, degY,
  vz, vy, flight, X clamp; vec 0 the offset, vec 1 +0x1614 (the aim's own point offset: flag 4 clear -> aimFrom001). Landing
  `0xda3c28` (state 1): ef by type, type 1 also sp_01 0 (`0xda3cb4`, the shell's point and words: a hit volume).
- sp_01 0x93 reader `0xda3eb4`: flags 4 / 8 by ints 0 / 1, timer float 0, vec 0; no EffectParam.
- Actions: L2 M6 (7, 1 / 0x1c) f78 mode 0; L2 M14 (7, 5 / 0x1d..0x1f) f58 mode 1 ([0x169c860][r6]); L2 M22 (7, 0x10 / 0x16 /
  0x19) f84 modes 3 / 4 / 5; L2 M23 (7, 0x11 / 0x17 / 0x1a) f25 6 / 7 / 8 and f70 9 / 10 / 11; L2 M24 (7, 0x12 / 0x18 / 0x1b)
  f25 12 / 13 / 14 and f70 15 / 16 / 17 (`0xda2b94(e, kind, r6, r8)`, only r6 = 0). With e+0xb5f7 set the class is the small
  Delex (ems012) and makes 0x184: not his.

## Lavasioth (em036_00) -- DONE

Check dev/shells-lavasioth-check.mjs 14 / 14 (9 ROM cases incl. a 1300-move pool, 1 contract, 4 controls FAIL), page 16 / 16,
soak 55 motions 0 refused, dev/checks/em036_00 61 / 0; records u 0..4, 30..33, 90, 91, 100..102.

- sp_00 0xc6 reader `0xe45e64`: flags 1 / 2 / 0x10 / 4 / 0x800 / 0x20 by ints 1..6; floats degX, degY, vz, vy, flight, X and Y
  clamps; vec 0 the offset, vec 1 the gravity. Both aims (AIMX00 / AIMY00): from the shell (flag 4) or the owner (aimFrom001).
  Landing `0xe46118` (state 1): type 1 while still rising does nothing; else ef 2 after the children `0xe461c4` (mode 0 / 1 ->
  sp_00 2 / 3 / 4 and sp_01 0 / 1 at the contact; 5 -> sp_00 8 / 9; 14..22 -> sp_01 2 with (0, Y, 0)).
- sp_01 0xc7: reader `0xe469d8` (one EffectParam; timer float 0; flags 4 / 8; vec 0); +0x154 `0xe46ac0` at its end: modes 0 / 1 /
  2 (the 1200-frame pools, u 90) leave 3 / 4 / 5 (u 91). Its +0x160 `0xe46cf8` ends a pool when byte +0x151e != 0xff (the hit
  side: no hunter in the viewer).
- Actions (maker `0xe3f610`): L2 M6 (7, 1 / 2) f78 mode 0; L2 M10 (7, 3) f58 mode 0, (7, 0x11) f58 mode 1; L2 M13 (7, 6) f60 13,
  f110 12; L4 M1 (7, 0x16 / 0x17 / 0x18) f130 / 184 / 238 modes 16 / 15 / 14, 19 / 18 / 17, 22 / 21 / 20, none while tired
  (`0x81614`); (7, 0x12) L2 M11's leap: on coming down (block +0x44 <= the ground, falling) L2 M12, his facing turned 0x8000 and
  sp_00 5 / 6 / 7 (`0xe44078`) -- the viewer makes them at L2 M12's start with the facing it shows.
  Checked in the page (2026-10-18): at L2 M12's start the viewer's body faces the shells' way (joint 0 -> joint 2 at about
  -17 degrees off +z, the three shells along +z), so the turn is not visible as a mismatch and is left named, not applied.
