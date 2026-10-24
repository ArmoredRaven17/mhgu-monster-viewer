      },
      hitdata: [[0, 999], [0, 999], [0, 999], [0, 999], [0, 999], [0, 999], [0, 0], [0, 0], [0, 0]] },
  },
  // the action rows (spawn088): `throw` / `pull` / `drop` name the request; a clip several actions play lists each in the
  // order psl-mask.js CLIP_ACTIONS gives (one play, one action: rockInput hands the same pick to both); a clip every one of
  // whose actions makes the same request takes one 'always' row
  actions: [
    act088(2, 0x0f, '2', 'Motion[17]', []),                                   // (2, 0xf): plays L2 M17 from 0, keeps the object
    act088(7, 0x10, '2', 'Motion[17]', [{ frame: 160, shell: 'shell57', throw: true }]),
    act088(7, 0x32, '2', 'Motion[17]', [{ frame: 160, shell: 'shell57', throw: true }]),
    act088(1, 0x05, '2', 'Motion[19]', [{ frame: 92, shell: 'shell57', pull: true }], { pick: 'always', also: [[1, 0x0e]] }),
    act088(1, 0x0d, '2', 'Motion[37]', [{ frame: 92, shell: 'shell57', pull: true }], { pick: 'always', also: [[1, 0x13]] }),
    act088(1, 0x10, '2', 'Motion[28]', []),                                   // the rage end keeps it
    act088(1, 0x06, '2', 'Motion[28]', [{ atStart: true, shell: 'shell57', drop: 4 }]),
    act088(1, 0x01, '0', 'Motion[4]', []),                                    // the roar keeps it
    act088(1, 0x20, '0', 'Motion[4]', [{ atStart: true, shell: 'shell57', drop: 4 }]),
    act088(0, 0x02, '0', 'Motion[13]', DROP088, { pick: 'always', also: [[1, 2]] }),
    act088(10, 0x1d, '3', 'Motion[15]', DROP088, { pick: 'always' }),        // sleep (L3 M15 -> M16 -> M17 -> M18)
    act088(10, 0x1f, '3', 'Motion[14]', DROP088, { pick: 'always' }),        // paralysis (L3 M14 -> M18)
    act088(10, 0x20, '3', 'Motion[23]', DROP088, { pick: 'always' }),        // the stun (L3 M23 -> M16 -> M17)
    act088(10, 0xaf, '3', 'Motion[3]', DROP088, { pick: 'always', also: [[10, 0x94], [10, 0xa7]] }),
    act088(10, 0x94, '3', 'Motion[4]', DROP088, { pick: 'always' }),
    act088(10, 0x94, '3', 'Motion[6]', []),                                   // the middle of (10, 0x94)'s L3 M4 -> M6 -> M8
    act088(10, 0xbb, '3', 'Motion[6]', DROP088),
    act088(10, 0x94, '3', 'Motion[8]', []),
    act088(10, 0xbc, '3', 'Motion[8]', DROP088),
    act088(10, 0x07, '3', 'Motion[1]', []),                                   // parts 4..6 keep it
    act088(10, 0xbd, '3', 'Motion[1]', DROP088, { also: [[10, 0xbe]] }),
    act088(10, 0x9b, '3', 'Motion[27]', DROP088, { pick: 'always' }),
    act088(10, 0xa1, '3', 'Motion[28]', DROP088, { pick: 'always' }),
    act088(10, 0xa9, '3', 'Motion[31]', DROP088, { pick: 'always', also: [[10, 0xab], [10, 0xc5]] }),
    act088(11, 0x00, '3', 'Motion[19]', DROP088, { pick: 'always' }),        // death, every status-11 number
  ],
};
