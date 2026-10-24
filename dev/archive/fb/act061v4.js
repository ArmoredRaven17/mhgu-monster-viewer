// his actions (scratchpad fb/cen2_em061_v4.txt, the census of uEm061_00's action main 0xf32798 at variant 4; the L9 rows read from
// 0xf2fd84 (7, 0xed / 0xee / 0xf5), 0xf302a8 (7, 0xf1 / 0xf2 / 0xf9 / 0xfc), 0xf30fxx / 0xf31220 (7, 0xfa / 0xff), 0xf304d4 (7, 0xe5)
// and 0xf2ffxx (7, 0xf6); the dispatch table 0xf31438). The rocks are Duramboros's actions on his files: (7, 0xe6 / 0xf7 / 0xfd) and
// (7, 0xf4) throw 17 / 18 / 19, (7, 0xe7 / 0xf8 / 0xfe) and (7, 0xf3) 12 / 13 / 14
const act061r = (n, clip, spawns24, x = {}) => Object.assign({ action: [7, n], code: 'em061r', list: '9', clip, pick: x.pick || 'ai',
  variant: '7:0x' + n.toString(16).padStart(2, '0'), spawns: [], spawns24 }, x);
SHELL_DATA.em061_04.actions = [
  act061(0x46, '2', 'Motion[28]', S00(120, 0)), act061(0x4d, '2', 'Motion[28]', S00(120, 1), { also: [[7, 0x97]] }),
  act061(0x4f, '2', 'Motion[28]', S00(120, 3)), act061(0xe6, '2', 'Motion[28]', S00(120, 17, 18, 19), { also: [[7, 0xf7], [7, 0xfd]] }),
  act061(0x49, '2', 'Motion[22]', S00(120, 1)), act061(0x4e, '2', 'Motion[22]', S00(120, 0), { also: [[7, 0x98]] }),
  act061(0x96, '2', 'Motion[22]', S00(120, 2)), act061(0xe7, '2', 'Motion[22]', S00(120, 12, 13, 14), { also: [[7, 0xf8], [7, 0xfe]] }),
  act061(0x47, '2', 'Motion[21]', S00(50, 0), { also: [[7, 0x48]] }), act061(0xf3, '2', 'Motion[21]', S00(50, 12, 13, 14)),
  act061(0x4a, '2', 'Motion[23]', S00(50, 1), { also: [[7, 0x4b]] }), act061(0xf4, '2', 'Motion[23]', S00(50, 17, 18, 19)),
  act061(0xad, '2', 'Motion[56]', S00(110, 4)), act061(0xae, '2', 'Motion[56]', S00(110, 5)), act061(0xaf, '2', 'Motion[56]', S00(110, 6)),
  act061(0x7d, '2', 'Motion[56]', [{ frame: 110, shell: 'shell19', mode: 1 }]),
  act061(0x6f, '2', 'Motion[46]', [{ frame: 94, shell: 'shell19', mode: 0 }], { also: [[7, 0x7c]], pick: 'always' }),
  // L9 M2: the throw at 85 (0xb0974), mode 0, setup +0x12 = 0
  act061r(0xf1, 'Motion[2]', [{ frame: 85, kind: 'throw', mode: 0 }], { also: [[7, 0xf2], [7, 0xf9], [7, 0xfc]], pick: 'always' }),
  // L9 M3: at its start the lump placed when none is held (mode 0, +0x12 = 1); at 32 (0xb0968 mode 1) rolled as sp_19 8 / 7 / 2
  act061r(0xed, 'Motion[3]', [{ frame: 0, kind: 'place', mode: 0 }, { frame: 32, kind: 'roll', mode: 8 }]),
  act061r(0xee, 'Motion[3]', [{ frame: 0, kind: 'place', mode: 0 }, { frame: 32, kind: 'roll', mode: 7 }]),
  act061r(0xf5, 'Motion[3]', [{ frame: 0, kind: 'place', mode: 0 }, { frame: 32, kind: 'roll', mode: 2 }]),
  // L9 M10: (7, 0xfa / 0xff) throw mode 1 at 104 (+0xcae0 = 0); (7, 0xe5) plays it from 182 -- the lump placed there (mode 1), lifted
  // as sp_13 at 184 (0xb0968 mode 1), +0xcae0 = 1
  act061r(0xfa, 'Motion[10]', [{ frame: 104, kind: 'throw', mode: 1, clear: true }], { also: [[7, 0xff]] }),
  act061r(0xe5, 'Motion[10]', [{ frame: 182, kind: 'place', mode: 1 }, { frame: 184, kind: 'lift' }]),
  // L9 M11: (7, 0xf6) at 59 (0xb0974) +0xcae0 = 2 -- the held sp_13 is thrown
  act061r(0xf6, 'Motion[11]', [{ frame: 59, kind: 'release' }], { pick: 'always' }),
];
