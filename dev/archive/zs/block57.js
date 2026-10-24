// ---- ZINOGRE (em057_00) / THUNDERLORD ZINOGRE (em057_04): THEIR SHELLS -----------------------------------------------------
// (2026-10-17, the Fanged Wyvern effects agent: their shells unread; dev/em057-shells-spec.md, dev/rom-map.md "Zinogre / Thunderlord
// -- the shells".) ONE class uEm057_00 (vtable 0x17ca8ec; Thunderlord is e+0xb5f5 == 4). The ids are FIELDS the class fills:
// E+0xcafc / +0xcb00 / +0xcb04 = 0xf7 / 0xf8 / 0x19d (variant 0) or 0xf9 / 0xfb / 0xfa (variant 4) -- the sp_01, the sp_18 and the
// sp_11 every spawner names through them. 0x19d is the shell table's unset sentinel (0x175c3e8 holds rows 0..411): Zinogre has no
// sp_11 class or file. Table rows 247..251: 0xf7 / 0xf9 uShellEm057_sp_01 (vtable 0x17cbad8, cSetupParamEmBase01), 0xfa
// uShellEm057_sp_11 (0x17cbc48: base11 over base01), 0xf8 / 0xfb uShellEm057_sp_18 (0x17cbdbc, cSetupParamEmBase00) -- BASE18, base00
// with its own init +0x13c 0x408980 and step +0x160 0x408a10 (the weave). Values: em057_00.arc / em057_04.arc shell\em\em057_0N_shellNN
// (scratchpad zs/shl.txt; hitdata zs/hit). Every .shl names EffectList [em057_0Nu]; em057_04_11 names none (it only makes shell01s).
const m057 = (scale, ef, hit, ints, floats, vecs) => ({ scale, ef, hit, sh: { ints, floats, vecs } });
SHELL_DATA.em057_00 = {
  name: 'Zinogre',
  lists: { 0: { list: 'u', pel: 'em057_00u' } },
  shells: {
    // shell01 (0xf7): base01 with the reader 0xf05358 -> 0xf0538c (params057s01). 0..11 the L0 M20 strikes (u 60 -> u 61 at the hit
    // onset: base01's 0x20 switch), 12 / 13 the rays' (u 150).
    shell01: { id: 0xf7, cls: 'uShellEm057_sp_01', base: 'base01', reader: 0xf05358, folder: 'shell\\em\\em057_00_shell01',
      modes: {
      0: m057(1.0, [[0, 60], [0, 61]], [0], [0, 0, 0], [], [[0.0, 0.0, 1300.0], [0.0, 350.0, 0.0]]),
      1: m057(1.0, [[0, 60], [0, 61]], [0], [0, 0, 0], [], [[0.0, 0.0, 600.0], [0.0, 40.0, 0.0]]),
      2: m057(1.0, [[0, 60], [0, 61]], [0], [0, 0, 0], [], [[0.0, 0.0, 1000.0], [0.0, 260.0, 0.0]]),
      3: m057(1.0, [[0, 60], [0, 61]], [0], [0, 0, 0], [], [[0.0, 0.0, 500.0], [0.0, 180.0, 0.0]]),
      4: m057(1.0, [[0, 60], [0, 61]], [0], [0, 0, 0], [], [[0.0, 0.0, 800.0], [0.0, 190.0, 0.0]]),
      5: m057(1.0, [[0, 60], [0, 61]], [0], [0, 0, 0], [], [[0.0, 0.0, 950.0], [0.0, 245.0, 0.0]]),
      6: m057(1.0, [[0, 60], [0, 61]], [0], [0, 0, 0], [], [[0.0, 0.0, 1000.0], [0.0, 315.0, 0.0]]),
      7: m057(1.0, [[0, 60], [0, 61]], [0], [0, 0, 0], [], [[0.0, 0.0, 900.0], [0.0, 30.0, 0.0]]),
      8: m057(1.0, [[0, 60], [0, 61]], [0], [0, 0, 0], [], [[0.0, 0.0, 500.0], [0.0, 270.0, 0.0]]),
      9: m057(1.0, [[0, 60], [0, 61]], [0], [0, 0, 0], [], [[0.0, 0.0, 500.0], [0.0, 90.0, 0.0]]),
      10: m057(1.0, [[0, 60], [0, 61]], [0], [0, 0, 0], [], [[0.0, 0.0, 1200.0], [0.0, 130.0, 0.0]]),
      11: m057(1.0, [[0, 60], [0, 61]], [0], [0, 0, 0], [], [[0.0, 0.0, 1200.0], [0.0, 150.0, 0.0]]),
      12: m057(1.0, [[0, 150], [999, -1]], [1], [-1, -1, -1], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      13: m057(1.0, [[0, 150], [999, -1]], [2], [-1, -1, -1], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      },
      hitdata: [[50, 10], [0, 10], [0, 10]] },
    // shell18 (0xf8): base18 with the reader 0xf05ef0 -> 0xf05f2c (params057s18). 0..5 the thunderbug leaps', 42..55 the G-rank
    // escorts' (0xeefc34; the file has no 52 / 53). u 0 the flight, u 1 every landing. hitdata (0, 9999).
    shell18: { id: 0xf8, cls: 'uShellEm057_sp_18', base: 'base18', reader: 0xf05ef0, folder: 'shell\\em\\em057_00_shell18',
      modes: {
      0: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, -1], [400.0, -30.0, 30.0, 35.0, 35.0, -600.0, 60.0, 0.0], [[0.0, 150.0, 0.0], [0.0, 0.0, 0.0]]),
      1: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, -1], [400.0, -30.0, 30.0, 35.0, 2.0, -400.0, 60.0, 0.0], [[0.0, 150.0, 0.0], [0.0, 0.0, 0.0]]),
      2: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, -1], [400.0, -30.0, 30.0, 35.0, -15.0, -600.0, 60.0, 0.0], [[0.0, 150.0, 0.0], [0.0, 0.0, 0.0]]),
      3: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, -1], [400.0, -30.0, 30.0, 35.0, -30.0, 600.0, 60.0, 0.0], [[0.0, 150.0, 0.0], [0.0, 0.0, 0.0]]),
      4: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, -1], [400.0, -30.0, 30.0, 35.0, 3.0, 400.0, 60.0, 0.0], [[0.0, 150.0, 0.0], [0.0, 0.0, 0.0]]),
      5: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, -1], [400.0, -30.0, 30.0, 35.0, 20.0, 600.0, 60.0, 0.0], [[0.0, 150.0, 0.0], [0.0, 0.0, 0.0]]),
      42: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, 0], [400.0, -30.0, 30.0, 35.0, -30.0, 600.0, 60.0, 0.0], [[500.0, 150.0, 200.0], [0.0, 0.0, 0.0]]),
      43: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, 0], [400.0, -30.0, 30.0, 35.0, 3.0, 400.0, 60.0, 0.0], [[400.0, 150.0, 240.0], [0.0, 0.0, 0.0]]),
      44: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, 0], [400.0, -30.0, 30.0, 35.0, 35.0, -600.0, 60.0, 0.0], [[-500.0, 150.0, 200.0], [0.0, 0.0, 0.0]]),
      45: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, 0], [400.0, -30.0, 30.0, 35.0, 2.0, -400.0, 60.0, 0.0], [[-400.0, 150.0, 240.0], [0.0, 0.0, 0.0]]),
      46: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, 0], [400.0, -30.0, 30.0, 35.0, 215.0, -600.0, 60.0, 0.0], [[-100.0, 150.0, 200.0], [0.0, 0.0, 0.0]]),
      47: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, 0], [400.0, -30.0, 30.0, 35.0, 182.0, -400.0, 60.0, 0.0], [[0.0, 150.0, 0.0], [0.0, 0.0, 0.0]]),
      48: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, 0], [400.0, -30.0, 30.0, 35.0, 35.0, -600.0, 60.0, 0.0], [[0.0, 150.0, 100.0], [0.0, 0.0, 0.0]]),
      49: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, 0], [400.0, -30.0, 30.0, 35.0, 2.0, -400.0, 60.0, 0.0], [[150.0, 150.0, 200.0], [0.0, 0.0, 0.0]]),
      50: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, 0], [400.0, -30.0, 30.0, 35.0, 215.0, -600.0, 60.0, 0.0], [[-50.0, 150.0, -660.0], [0.0, 0.0, 0.0]]),
      51: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, 0], [400.0, -30.0, 30.0, 35.0, 182.0, -400.0, 60.0, 0.0], [[-200.0, 150.0, -400.0], [0.0, 0.0, 0.0]]),
      54: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, 0], [400.0, -30.0, 30.0, 35.0, 35.0, -600.0, 60.0, 0.0], [[-500.0, 150.0, 200.0], [0.0, 0.0, 0.0]]),
      55: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [0], [-1, 0, 0], [400.0, -30.0, 30.0, 35.0, 2.0, -400.0, 60.0, 0.0], [[-400.0, 150.0, 240.0], [0.0, 0.0, 0.0]]),
      },
      hitdata: [[0, 9999]] },
  },
  actions: null,          // actions057(false) below
  perFrame057: null,
};
SHELL_DATA.em057_04 = {
  name: 'Thunderlord Zinogre',
  lists: { 0: { list: 'u', pel: 'em057_04u' } },
  shells: {
    // shell01 (0xf9): base01 with the reader 0xf05358 -> 0xf05488 (params057s01, by mode). Its ShellCmnParam ints [0, 0, 0], floats
    // [1500, 1500, 600, 600, 600, 600] (the ground snap's reaches by mode, below).
    shell01: { id: 0xf9, cls: 'uShellEm057_sp_01', base: 'base01', reader: 0xf05358, folder: 'shell\\em\\em057_04_shell01',
      cmn: { ints: [0, 0, 0], floats: [1500.0, 1500.0, 600.0, 600.0, 600.0, 600.0], vecs: [] },
      modes: {
      0: m057(1.0, [[0, 70], [0, 71]], [0], [-1, 0, 0, 0], [], [[0.0, 0.0, 1300.0], [0.0, 350.0, 0.0]]),
      1: m057(1.0, [[0, 70], [0, 71]], [0], [-1, 0, 0, 0], [], [[0.0, 0.0, 600.0], [0.0, 40.0, 0.0]]),
      2: m057(1.0, [[0, 70], [0, 71]], [0], [-1, 0, 0, 0], [], [[0.0, 0.0, 1000.0], [0.0, 260.0, 0.0]]),
      3: m057(1.0, [[0, 70], [0, 71]], [0], [-1, 0, 0, 0], [], [[0.0, 0.0, 500.0], [0.0, 180.0, 0.0]]),
      4: m057(1.0, [[0, 70], [0, 71]], [0], [-1, 0, 0, 0], [], [[0.0, 0.0, 800.0], [0.0, 190.0, 0.0]]),
      5: m057(1.0, [[0, 70], [0, 71]], [0], [-1, 0, 0, 0], [], [[0.0, 0.0, 950.0], [0.0, 245.0, 0.0]]),
      6: m057(1.0, [[0, 70], [0, 71]], [0], [-1, 0, 0, 0], [], [[0.0, 0.0, 1000.0], [0.0, 315.0, 0.0]]),
      7: m057(1.0, [[0, 70], [0, 71]], [0], [-1, 0, 0, 0], [], [[0.0, 0.0, 900.0], [0.0, 30.0, 0.0]]),
      8: m057(1.0, [[0, 70], [0, 71]], [0], [-1, 0, 0, 0], [], [[0.0, 0.0, 500.0], [0.0, 270.0, 0.0]]),
      9: m057(1.0, [[0, 70], [0, 71]], [0], [-1, 0, 0, 0], [], [[0.0, 0.0, 500.0], [0.0, 90.0, 0.0]]),
      10: m057(1.0, [[0, 70], [0, 71]], [0], [-1, 0, 0, 0], [], [[0.0, 0.0, 1200.0], [0.0, 130.0, 0.0]]),
      11: m057(1.0, [[0, 70], [0, 71]], [0], [-1, 0, 0, 0], [], [[0.0, 0.0, 1200.0], [0.0, 150.0, 0.0]]),
      12: m057(1.0, [[0, 160], [999, -1]], [1], [-1, -1, -1, -1], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      13: m057(1.0, [[0, 160], [999, -1]], [2], [-1, -1, -1, -1], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      14: m057(1.0, [[0, 210], [999, -1]], [3], [-1, -1, 0, 0], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      15: m057(1.0, [[0, 12], [999, -1]], [4], [-1, -1, 0, 0], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      16: m057(1.0, [[0, 2], [999, -1]], [5], [-1, -1, 0, 0], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      17: m057(1.0, [[0, 60], [0, 180]], [6], [-1, 0, 0, -1], [], [[0.0, 0.0, 950.0], [0.0, 0.0, 0.0]]),
      18: m057(1.899999976158142, [[0, 60], [0, 180]], [8], [-1, 0, 0, -1], [], [[0.0, 0.0, 900.0], [0.0, 0.0, 0.0]]),
      19: m057(1.5, [[0, 60], [0, 61]], [7], [-1, 0, 0, -1], [], [[0.0, 0.0, 300.0], [0.0, 0.0, 0.0]]),
      20: m057(1.5, [[0, 60], [0, 61]], [7], [-1, 0, 0, -1], [], [[0.0, 0.0, 300.0], [0.0, 0.0, 0.0]]),
      21: m057(1.0, [[0, 150], [999, -1]], [1], [-1, -1, -1, -1], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      22: m057(1.0, [[0, 150], [999, -1]], [1], [-1, -1, -1, -1], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      23: m057(1.0, [[0, 60], [0, 61]], [9], [-1, 0, 0, -1], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      24: m057(1.5, [[0, 60], [0, 61]], [10], [-1, 0, 0, -1], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      25: m057(1.7999999523162842, [[0, 60], [0, 61]], [11], [-1, 0, 0, -1], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      26: m057(1.0, [[0, 60], [0, 61]], [0], [-1, 0, 0, -1], [], [[0.0, 0.0, -300.0], [0.0, 0.0, 0.0]]),
      27: m057(1.0, [[0, 60], [0, 61]], [0], [-1, 0, 0, -1], [], [[500.0, 0.0, -300.0], [0.0, 0.0, 0.0]]),
      28: m057(1.0, [[0, 60], [0, 61]], [0], [-1, 0, 0, -1], [], [[-400.0, 0.0, -500.0], [0.0, 0.0, 0.0]]),
      29: m057(1.0, [[0, 60], [0, 61]], [0], [-1, 0, 0, -1], [], [[800.0, 0.0, 500.0], [0.0, 0.0, 0.0]]),
      30: m057(1.0, [[0, 60], [0, 61]], [0], [-1, 0, 0, -1], [], [[-600.0, 0.0, 300.0], [0.0, 190.0, 0.0]]),
      31: m057(1.0, [[0, 60], [0, 61]], [0], [-1, 0, 0, -1], [], [[0.0, 0.0, 450.0], [0.0, 245.0, 0.0]]),
      32: m057(1.0, [[0, 60], [0, 61]], [0], [-1, 0, 0, -1], [], [[900.0, 0.0, 400.0], [0.0, 0.0, 0.0]]),
      33: m057(1.0, [[0, 60], [0, 61]], [0], [-1, 0, 0, -1], [], [[-800.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      34: m057(1.0, [[0, 60], [0, 61]], [0], [-1, 0, 0, -1], [], [[700.0, 0.0, -100.0], [0.0, 270.0, 0.0]]),
      35: m057(1.0, [[0, 60], [0, 61]], [0], [-1, 0, 0, -1], [], [[0.0, 0.0, -200.0], [0.0, 0.0, 0.0]]),
      36: m057(1.0, [[0, 60], [0, 61]], [0], [-1, 0, 0, -1], [], [[800.0, 0.0, -300.0], [0.0, 0.0, 0.0]]),
      37: m057(1.0, [[0, 60], [0, 61]], [0], [-1, 0, 0, -1], [], [[-1000.0, 0.0, -200.0], [0.0, 0.0, 0.0]]),
      38: m057(1.0, [[0, -1], [999, -1]], [12], [-1, -1, 0, 0], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      39: m057(1.0, [[0, 170], [999, -1]], [13], [-1, -1, -1, -1], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      40: m057(1.0, [[0, 171], [999, -1]], [14], [145, -1, 0, -1], [], [[0.0, 0.0, -50.0], [0.0, 0.0, 0.0]]),
      41: m057(1.0, [[0, 220], [999, -1]], [3], [-1, -1, 0, 0], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      42: m057(1.0, [[0, -1], [999, -1]], [12], [-1, -1, 0, 0], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      43: m057(1.0, [[0, 220], [999, -1]], [15], [-1, -1, 0, 0], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      44: m057(1.0, [[0, -1], [999, -1]], [16], [-1, -1, 0, 0], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      45: m057(1.0, [[999, -1], [999, -1]], [2], [-1, -1, -1, -1], [], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      },
      hitdata: [[60, 10], [0, 10], [0, 10], [0, 10], [0, 300], [0, 300], [30, 10], [50, 10], [40, 10], [50, 10], [50, 10], [50, 10],
                [0, 10], [0, 8], [0, 8], [0, 10], [0, 10]] },
    // shell11 (0xfa): base11 (the timed creator) with the reader 0xf059e0 (params057s11) and the create +0x168 0xf05b20 (create057s11)
    shell11: { id: 0xfa, cls: 'uShellEm057_sp_11', base: 'base11', reader: 0xf059e0, folder: 'shell\\em\\em057_04_shell11',
      modes: {
      0: m057(1.0, [], [], [3], [0.0, 18.0, 38.0], [[0.0, 0.0, 300.0], [0.0, 0.0, 700.0], [0.0, 0.0, 1200.0]]),
      1: m057(1.0, [], [], [2], [0.0, 68.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 200.0], [500.0, 0.0, 0.0]]),
      } },
    shell18: { id: 0xfb, cls: 'uShellEm057_sp_18', base: 'base18', reader: 0xf05ef0, folder: 'shell\\em\\em057_04_shell18',
      modes: {
      6: m057(1.0, [[0, 10], [0, 11], [0, 11], [0, 11]], [1], [-1, -1], [400.0, -30.0, 30.0, 32.0, -30.0, -1200.0, 35.0, 15.0], [[0.0, 150.0, 0.0], [0.0, -1.2000000476837158, 0.0]]),
      7: m057(1.0, [[0, 10], [0, 11], [0, 11], [0, 11]], [1], [-1, -1], [400.0, -30.0, 30.0, 25.0, -10.0, -900.0, 50.0, 28.0], [[0.0, 150.0, 0.0], [0.0, -1.2999999523162842, 0.0]]),
      8: m057(1.0, [[0, 10], [0, 11], [0, 11], [0, 11]], [1], [-1, -1], [400.0, -30.0, 30.0, 30.0, -25.0, 800.0, 65.0, 25.0], [[0.0, 150.0, 0.0], [0.0, -1.2999999523162842, 0.0]]),
      9: m057(1.0, [[0, 10], [0, 11], [0, 11], [0, 11]], [1], [-1, -1], [400.0, -30.0, 30.0, 25.0, 15.0, 800.0, 40.0, 15.0], [[0.0, 150.0, 0.0], [0.0, -1.100000023841858, 0.0]]),
      14: m057(1.0, [[0, 10], [0, 11], [0, 11], [0, 11]], [1], [-1, -1], [400.0, -30.0, 30.0, 70.0, 0.0, -500.0, 40.0, 45.0], [[0.0, 150.0, 0.0], [0.0, -2.0, 0.0]]),
      15: m057(1.0, [[0, 10], [0, 11], [0, 11], [0, 11]], [1], [-1, -1], [400.0, -30.0, 30.0, 70.0, 0.0, 500.0, 40.0, 45.0], [[0.0, 150.0, 0.0], [0.0, -2.0, 0.0]]),
      16: m057(1.0, [[0, 10], [0, 11], [0, 11], [0, 11]], [1], [-1, -1], [400.0, -30.0, 30.0, 70.0, -20.0, -500.0, 40.0, 40.0], [[0.0, 150.0, 0.0], [0.0, -2.0, 0.0]]),
      17: m057(1.0, [[0, 10], [0, 11], [0, 11], [0, 11]], [1], [-1, -1], [400.0, -30.0, 30.0, 70.0, -20.0, 500.0, 40.0, 40.0], [[0.0, 150.0, 0.0], [0.0, -2.0, 0.0]]),
      18: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, -30.0, 30.0, 30.0, -60.0, -1200.0, 30.0, 15.0], [[0.0, 150.0, 0.0], [0.0, -0.8999999761581421, 0.0]]),
      19: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, -30.0, 30.0, 30.0, -70.0, -900.0, 30.0, 23.0], [[0.0, 150.0, 0.0], [0.0, -1.2999999523162842, 0.0]]),
      20: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, -30.0, 30.0, 40.0, -20.0, -400.0, 30.0, 30.0], [[0.0, 150.0, 0.0], [0.0, -1.2999999523162842, 0.0]]),
      21: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, -30.0, 30.0, 15.0, 15.0, 300.0, 40.0, 30.0], [[0.0, 150.0, 0.0], [0.0, -1.2999999523162842, 0.0]]),
      22: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, -30.0, 30.0, 30.0, 60.0, 1100.0, 25.0, 20.0], [[0.0, 150.0, 0.0], [0.0, -1.399999976158142, 0.0]]),
      23: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, -30.0, 30.0, 30.0, 70.0, 750.0, 25.0, 15.0], [[0.0, 150.0, 0.0], [0.0, -0.800000011920929, 0.0]]),
      24: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [145, -1], [400.0, -30.0, 30.0, 25.0, 120.0, 800.0, 50.0, 20.0], [[0.0, 150.0, 0.0], [0.0, -0.699999988079071, 0.0]]),
      25: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [145, -1], [400.0, -30.0, 30.0, 25.0, 0.0, 800.0, 50.0, 20.0], [[0.0, 150.0, 0.0], [0.0, -0.699999988079071, 0.0]]),
      26: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [145, -1], [400.0, -30.0, 30.0, 25.0, -120.0, 800.0, 50.0, 20.0], [[0.0, 150.0, 0.0], [0.0, -0.699999988079071, 0.0]]),
      27: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, -30.0, 30.0, 25.0, 120.0, -800.0, 50.0, 20.0], [[0.0, 150.0, 0.0], [0.0, -0.699999988079071, 0.0]]),
      28: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, -30.0, 30.0, 25.0, 0.0, -800.0, 50.0, 20.0], [[0.0, 150.0, 0.0], [0.0, -0.699999988079071, 0.0]]),
      29: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, -30.0, 30.0, 25.0, -120.0, -800.0, 50.0, 20.0], [[0.0, 150.0, 0.0], [0.0, -0.699999988079071, 0.0]]),
      30: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, -30.0, 30.0, 70.0, 0.0, -800.0, 36.0, 45.0], [[0.0, 150.0, 0.0], [0.0, -2.0, 0.0]]),
      31: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, -30.0, 30.0, 70.0, 0.0, 0.0, 30.0, 50.0], [[0.0, 150.0, 0.0], [0.0, -2.0, 0.0]]),
      32: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, -30.0, 30.0, 70.0, 0.0, 800.0, 36.0, 45.0], [[0.0, 150.0, 0.0], [0.0, -2.0, 0.0]]),
      33: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, -30.0, 30.0, 60.0, -20.0, 800.0, 34.0, 40.0], [[0.0, 150.0, 0.0], [0.0, -2.0, 0.0]]),
      34: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, -30.0, 30.0, 60.0, -20.0, 0.0, 30.0, 45.0], [[0.0, 150.0, 0.0], [0.0, -2.0, 0.0]]),
      35: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, -30.0, 30.0, 60.0, -20.0, -800.0, 34.0, 40.0], [[0.0, 150.0, 0.0], [0.0, -2.0, 0.0]]),
      36: m057(1.0, [[0, 10], [0, 11], [0, 11], [0, 11]], [1], [-1, -1], [40.0, 0.0, 0.0, 70.0, 20.0, -500.0, 40.0, 40.0], [[0.0, 150.0, 0.0], [0.0, -2.0, 0.0]]),
      37: m057(1.0, [[0, 10], [0, 11], [0, 11], [0, 11]], [1], [-1, -1], [400.0, 0.0, 0.0, 70.0, 20.0, 500.0, 40.0, 40.0], [[0.0, 150.0, 0.0], [0.0, -2.0, 0.0]]),
      38: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, 0.0, 0.0, 60.0, 20.0, 800.0, 34.0, 40.0], [[0.0, 150.0, 0.0], [0.0, -2.0, 0.0]]),
      39: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, 0.0, 0.0, 60.0, 20.0, 0.0, 30.0, 45.0], [[0.0, 150.0, 0.0], [0.0, -2.0, 0.0]]),
      40: m057(1.0, [[0, 0], [0, 1], [0, 1], [0, 1]], [2], [-1, -1], [400.0, 0.0, 0.0, 60.0, 20.0, -800.0, 34.0, 40.0], [[0.0, 150.0, 0.0], [0.0, -2.0, 0.0]]),
      },
      hitdata: [[0, 9999], [0, 9999], [0, 9999]] },
  },
  actions: null,          // actions057(true) below
};

// THE READERS. sp_01's +0x14c 0xf05358 dispatches on the shell's own id (0x4a0ecc): 0xf7 -> 0xf0538c, 0xf9 -> 0xf05488 (READ whole).
//   0xf0538c (Zinogre): ef 0 -> +0x15c8, ef 1 -> +0x15d0 (the 0x20 switch's: switch01); hit 0 -> +0x15d8; the flags +0x15ec over the
//   ctor's 0 (bfc / orrne): 0x4 = int 1 != -1 (the ground snap), 0x8 = int 2 (the ground's angles), 0x20 = int 0 (the switch); vec 0
//   -> +0x1608 (the offset), vec 1 -> +0x160c (the words' degree offsets, init011's k.deg). The rest the ctor's: joint -1, timer 0
//   (each lives while its hit slot is on), reaches 500 / 500, +0x1604 900.
//   0xf05488 (Thunderlord): the same ef / hit / vecs; int 0 -> the joint +0x15e4; flags 0x1 = int 0, 0x4 = int 2, 0x8 = int 3, 0x20 =
//   int 1; then by the mode (0x4a0ee4, table 0xf055e0, 38 entries): 0..11 / 26..37 -> 0x10 by cmn int 0, the reaches +0x15f4 / +0x15f8
//   = cmn floats 0 / 1; 17 / 18 -> cmn int 1, floats 2 / 3; 21..25 -> cmn int 2, floats 4 / 5; 12..16 / 19 / 20 / 38.. nothing more.
//   Base01's flag 0x10 has no test in its band (zs: the census of 0x3fa2f8..0x3fb5d0's `tst` / `ands` on +0x15ec; NOT a positive-
//   controlled negative), so it is carried, not used.
function params057s01(sh, def, modeIndex){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const why = !sh ? 'uShellEm057_sp_01: a mode its files do not carry' : null;
  const efAt = { 0x15c8: 0, 0x15cc: null, 0x15d0: 1 };
  if (def.id !== 0xf9)
    return { flags: (I(1) !== -1 ? 4 : 0) | (I(2) !== -1 ? 8 : 0) | (I(0) !== -1 ? 0x20 : 0), joint: -1, timer: f(0.0), f1600: f(0.0),
             f15fc: f(1.0), vec: V(0), deg: V(1), up: f(500.0), down: f(500.0), maxH: f(900.0), why, efAt };
  let flags = (I(0) !== -1 ? 1 : 0) | (I(2) !== -1 ? 4 : 0) | (I(3) !== -1 ? 8 : 0) | (I(1) !== -1 ? 0x20 : 0);
  let up = f(500.0), down = f(500.0);
  const c = def.cmn, cI = i => c && i < c.ints.length ? c.ints[i] : -1, cF = i => c && i < c.floats.length ? f(c.floats[i]) : f(0.0);
  const m = modeIndex;
  const arm = (m <= 11 || (m >= 26 && m <= 37)) ? 0 : (m === 17 || m === 18) ? 1 : (m >= 21 && m <= 25) ? 2 : -1;
  if (arm >= 0){ flags = cI(arm) !== -1 ? (flags | 0x10) : (flags & ~0x10); up = cF(2 * arm); down = cF(2 * arm + 1); }
  return { flags, joint: I(0), timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: V(0), deg: V(1), up, down, maxH: f(900.0), why, efAt };
}
// sp_11's +0x14c 0xf059e0 (READ whole): the count +0x1658 = int 0 (>= 1), the times +0x1654[k] = float k. Nothing of base01's: flags
// 0 (the setup's point, its words), timer 0. Mode 0: 3 at 0 / 18 / 38; mode 1: 2 at 0 / 68.
function params057s11(def, mode){
  const sh = mode.sh, n = sh.ints.length && sh.ints[0] >= 1 ? sh.ints[0] : 0, table = [];
  for (let k = 0; k < n; k++) table.push(k < sh.floats.length ? f(sh.floats[k]) : f(0.0));
  return { flags: 0, joint: -1, timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0), table };
}
// sp_11's +0x168 0xf05b20(shell, k) (READ whole): with the owner active (always, in the viewer), sh vec k turned by the shell's Y word
// (ldrh +0xfec: x cos + z sin, y, z cos - x sin -- create11's operations) plus its point; a shell01 (id [owner+0xcafc]) of mode
// 0x17 + k (mode 0) or 0x11 + k (mode 1) with this shell's words at +0x30.. (+0x3c the owner's P+0xb0a / this shell's +0x1588: the hit
// side). Any other mode nothing.
function create057s11(S, idx, ctx, D){
  if (S.modeIndex !== 0 && S.modeIndex !== 1) return;
  const sh = S.mode.sh, v = idx < sh.vecs.length ? sh.vecs[idx].map(f) : [0, 0, 0];
  const r = f(u16(S.angles[1]) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const P = S.position;
  ctx.create(S, 'shell01', { mode: (S.modeIndex === 0 ? 0x17 : 0x11) + idx, angles: S.angles.map(w => w >>> 0),
                             position: [f(mla(f(v[0] * cs), v[2], sn) + P[0]), f(v[1] + P[1]), f(mls(f(v[2] * cs), v[0], sn) + P[2])] });
}
// sp_01's +0x154 0xf057a4(shell) (READ whole), in base01's end: with the owner active, byte +0x15c0 = 1; mode 21 / 22 sets the byte
// +0x1654 (the L2 M1 / M2 rays' charged forms), which (7, 0xa6) / (7, 0xa7)'s charged enraged ray also gets at its spawn (0xefabec:
// r2 == 0); with it set, a shell11 (id [owner+0xcb04]) of mode 0 at this shell's point with its words (+0x20 the zero vector, +0x3c
// 0xffff). Zinogre's +0xcb04 is the sentinel and no Zinogre shell01 sets the byte.
function endCreate057(S, ctx, events){
  if (S.modeIndex === 21 || S.modeIndex === 22) S.b1654 = true;
  if (!S.b1654) return;
  const D = SHELL_DATA[S.monId];
  if (!D || !D.shells.shell11) return;
  if (!ctx || !ctx.create) throw new Error('shells.js: sp_01 end create (0xf057a4) without the create context');
  ctx.create(S, 'shell11', { mode: 0, position: S.position.slice(), angles: S.angles.map(w => w >>> 0) }, events);
}
// sp_18's +0x14c 0xf05ef0 dispatches on the id (0x4a0ecc): 0xf8 -> 0xf05f2c, 0xfb -> 0xf06140 (READ whole). Both: ef 0..3 -> +0x15c8 /
// +0x15cc / +0x15d0 / +0x15d4 (no swap); hit 0 -> +0x15d8; floats 0 -> the flight +0x15fc, 4 -> degY +0x15f0, 3 -> vz +0x15f4, 7 -> vy
// +0x15f8, 1 / 2 -> the X clamp +0x1600 / +0x1604, 5 -> the weave's amplitude +0x1660, 6 -> its period +0x1664; int 0 -> the joint
// +0x15dc; vec 0 -> the offset +0x1610, vec 1 -> the gravity +0x161c; the flags +0x15e8 (base00's) = (flags & ~0xbf) | 0xa2 | (int 1
// != -1): 0x20 the setup's words, 0x80 the offset times the size, 0x2 base00's Y aim (its clamp the ctor's [0, 0]: it adds 0), 0x1
// base00's X aim (Zinogre's int 1 = 0; Thunderlord's -1). Zinogre's also: int 2 == 0 -> 0x800 (base00's byte +0x15ac, the hit side),
// int 2 -> +0x1620 (the ctor's -1 otherwise; no consumer read). degX +0x15ec and the aim vectors +0x1614 / +0x1618 keep the ctor's 0.
function params057s18(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  const flags = 0xa2 | (I(1) !== -1 ? 1 : 0) | (def.id === 0xf8 && I(2) === 0 ? 0x800 : 0);
  return { joint: I(0), flags, flight: F(0), degX: f(0), degY: F(4), xDeg: f(0), yDeg: F(4), vz: F(3), vy: F(7), xLo: F(1), xHi: F(2),
           yLo: f(0), yHi: f(0), amp: F(5), period: F(6), vec: V(0), gravity: V(1), aimOff: ZERO3.slice(), from: ZERO3.slice() };
}

// ---- BASE18 (uShellEm057_sp_18 is its one subclass): THE WEAVE --------------------------------------------------------------
// READ whole (scratchpad zs/base18.txt): ctor tail 0x408900 (+0x1660 / +0x1664 / +0x1674 / +0x1678 = 0, +0x1668.. the shared zero
// words, +0x15a8 = 0x12); init +0x13c 0x408980 -> base00's 0x3f8b80 (init00), then +0x1678 (the clock) = 0, +0x1674 (the last offset)
// = 0, +0x1668 = the X word +0xfe8 (after base00's X aim), +0x166c = the Y word +0xfec plus u16(s32(0.5 + degY x 182.04445)) (uxtah
// -- degY a second time: base00's flag 2 kept it off +0xfec), +0x1670 = 0; the move is base00's 0x3f96a0 -> 0x3f9738, whose vt+0x160
// is base18's 0x408a10 (move18): the rest of 0x3f9738 (the owner active, the flight timer +0x162c, the collide vt+0x168 0x3f99e0, the
// landing vt+0x150, the end 0x3f9ef4) is base00's as move00 transcribes it.
function init18(S, def, J, got){
  if (!init00(S, def, J, got)) return false;
  const k = S.k;
  S.clock18 = f(0.0);                                         // +0x1678
  S.last18 = f(0.0);                                          // +0x1674
  S.xw18 = S.angles[0] >>> 0;                                 // +0x1668
  S.yw18 = ((S.angles[1] >>> 0) + u16(s32(mla(f(0.5), k.degY, DEG_TO_U16)))) >>> 0;   // +0x166c (uxtah)
  S.launch.weave = { xw: S.xw18, yw: S.yw18 };
  return true;
}
// 0x408a10 (vt+0x160): the clock += dt (+0x1c); anchor = position; while the clock is below the period (vcmpe / bpl): the lateral
// offset T[idx] x amplitude, idx = the low 12 bits of (1.5 x 2^23 + clock / period x 180 x 0.0174533 x 651.899) -- the engine's sine
// table 0x190f568 (sinTable57), half a turn over the period -- its change over dt the velocity's x; the velocity's y 0 when the gravity
// vec's y is 0, else kept; its z = vz; (y, z) turned by the X word +0x1668, then (x, z) by the Y word +0x166c (each ldrh x 9.58738e-05,
// sinf 0x13ecc20 / cosf 0x13ecc2c). Past the period the velocity is left as it is. Then 0x539224 (stepFlight) and the words from the
// velocity: X = atan2(-vy, |(x, z)|), Y = atan2(vx, vz), as u16 (+0xfe8 / +0xfec; +0xff0 kept).
function step18(S, ctx){
  const k = S.k, dt = ctx.dt;
  const t = f(S.clock18 + dt);
  S.clock18 = t;
  S.anchor = S.position.slice();
  if (t < k.period){
    const ph = f(f(f(t / k.period) * f(180.0)) * DEG_RAD57);
    const x = mla(ROUND57, ph, HALF_TURN_TABLE57), bits = new Uint32Array(new Float32Array([x]).buffer)[0];
    const lat = f(sinTable57()[bits & 0xfff] * k.amp);
    const vx = f(f(lat - S.last18) / dt);
    S.last18 = lat;
    const vy = k.gravity[1] === 0 ? f(0.0) : S.velocity[1];
    const vz = k.vz;
    const rx = f(f(u16(S.xw18)) * U16_TO_RAD), sx = sinf(rx), cx = cosf(rx);
    const vy1 = mls(f(vy * cx), vz, sx), vz1 = mla(f(vz * cx), vy, sx);
    const ry = f(f(u16(S.yw18)) * U16_TO_RAD), sy = sinf(ry), cy = cosf(ry);
    S.velocity = [mla(f(vx * cy), vz1, sy), vy1, mls(f(vz1 * cy), vx, sy)];
  }
  stepFlight(S, dt);
  const [vx, vy, vz] = S.velocity;
  const h = sqrtf(mla(f(vz * vz), vx, vx));
  S.angles = [u16(s32(mla(0.5, atan2f(f(-vy), h), RAD_TO_U16))), u16(s32(mla(0.5, atan2f(vx, vz), RAD_TO_U16))), S.angles[2]];
}
function move18(S, ctx, D){
  step18(S, ctx);
  const r = flightTimer(S, S.k.flight, ctx.dt);
  if (r !== 'query') return r;
  const hit = collide(S, null, ctx.stage);                     // vt+0x168 = base00's 0x3f99e0
  if (!hit) return 'keep';
  S.events.push({ ev: 'hit', point: hit.point, type: hit.type });
  landing057s18(S, D, hit, ctx);
  return 'end';
}
// sp_18's landing +0x150 0xf06314(shell, &point, &result, type) (READ whole): type 0 / 1 / 2 -> ef +0x15cc / +0x15d0 / +0x15d4 (ef 1 /
// 2 / 3) started at the contact (0x3f8970); type 1 first, for modes 6..9 / 14..17 / 36 / 37 (mode - 6 in mask 0xc0000f0f) a shell01
// of mode 15, for 18..35 / 38..40 (mode - 0x12 in 0x73ffff) one of 16 -- id [owner+0xcafc], 0x3fa2bc(0x40): +0x10 the contact, +0x20
// the zero vector, +0x30.. the zero words, +0x3c this shell's +0x13dc; byte +0x15c0 = 1 (both are Thunderlord's: no Zinogre mode is in
// either mask). Then vt+0x148(0).
function landing057s18(S, D, hit, ctx){
  const t = hit.type, m = S.modeIndex;
  if (t === 1){
    const a = (m - 6) & 0xff, b = (m - 0x12) & 0xff;
    const mode01 = (a <= 0x1f && ((0xc0000f0f >>> a) & 1)) ? 15 : (b <= 0x16 && ((0x73ffff >>> b) & 1)) ? 16 : null;
    if (mode01 != null) ctx.create(S, 'shell01', { mode: mode01, position: hit.point.slice(), angles: [0, 0, 0] });
  }
  if (t >= 0 && t <= 2) contactStart(S, D, t + 1, hit.point, 'landing');
}
// a shell18: base18's ctor, the reader, init18; ef 0 at +0x40 (base00's 0x3f928c..: u 0 / u 10) -> +0x1624; hit slot 0 with
// input.hitLife (base00's +0x164 0x3f9aec: the hit side)
function make18(state, D, m, J, own, ctx, action, frame){
  const def = D.shells.shell18, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return null;
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell18', cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 1,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null, trail: null,
              timer: 0, moves: 0, bounces: 0, held: false, launch: null, events: [], folder: def.folder,
              effect: null, effect2: null, start: null, place: null, stop: null, slots: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  if (!init18(S, def, J, own)) return null;
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  if (own.hitLife) S.slots = slotsOf011(def, mode, ctx.out ? ctx.out.refused : null).filter(sl => sl.slot === 0);
  return S;
}

// ---- WHO MAKES THEM (READ: each body's own code; the census zs/cen4.txt: every status-7 action x phase x charged x rage, both
// variants, the band native on unicorn, tune / rank / quest answered). `charged` = P+0x5df3 (0x816d4: input.charged, the Charge State
// rung index.html gives -- Zinogre's Fully Charged, Thunderlord's Overcharged); `rage` 0x81670 (input.rage).
//   THE THUNDERBUG LEAPS 0xf00590 (Zinogre) / 0xf010e8 (Thunderlord) (e, kind, which), from the leap bodies 0xefdaf4 and 0xef77b8: L2 M31
// f88 `which` 0, L2 M32 f58 `which` 1 (the clip's first update, phase 0, stores the owner's yaw P+0x54 in [+0xcac0]+0x18: the leap's
// heading). Base00 setups (0x3f883c(0x30)): +0x10 the zero vector, +0x20.. the words (P+0x50, [+0xcac0]+0x18, P+0x58) -- Thunderlord
// X = Z = 0 -- +0x2c 0, +0x2e 0xffff, mode by (kind, which, charged), several a call (LEAP057). The kinds: 0 (7, 0x20 / 0x21 / 0x22 /
// 0x42 / 0x57 / 0x76 / 0x77 / 0xd3 / 0xd4 / 0xdd / 0xe0 / 0xf3), 1 (0x69 / 0x6b / 0xde / 0xe1 / 0xf4), 2 (0x3d / 0x6a / 0x6c / 0x78 /
// 0x79 / 0xd5 / 0xdf / 0xe2 / 0xf5), 3 (0x7a: L2 M32 alone; Zinogre none). M32 is played by 0x20 / 0x57 / 0xd4 / 0xe0 / 0x77 (kind 0),
// 0x6b / 0xe1 (1), 0x3d / 0x6c / 0xd5 / 0xe2 / 0x79 (2), 0x7a (3).
const LEAP057 = {
  0: { 0: [[0], [0, 1]], 1: [[3], [3, 4]] }, 1: { 0: [[1], [0, 1]], 1: [[4], [3, 4]] }, 2: { 0: [[2], [1, 2]], 1: [[5], [4, 5]] },
  3: { 0: [[], []], 1: [[], []] },
};
const LEAP057V4 = {
  0: { 0: [[6, 7], [18, 19, 20]], 1: [[8, 9], [21, 22, 23]] }, 1: { 0: [[6, 7], [24, 25, 26]], 1: [[8, 9], [27, 28, 29]] },
  2: { 0: [[14, 15], [30, 31, 32]], 1: [[16, 17], [33, 34, 35]] }, 3: { 0: [[], []], 1: [[36, 37], [38, 39, 40]] },
};
//   THE G-RANK ESCORTS (Zinogre's vt+0x2a8 0xeef638, every frame, by the motion; the spawner 0xeefc34(e, k): variant 0 and 0x3a8430 >=
// 5, modes 0x2a + 2k (+ 0x2b + 2k charged), the owner's words P+0x50.., the zero vector): L2 M15 f117 k0, L2 M18 f117 k1, L2 M24 f6 k2,
// L2 M26 f72 k3, L2 M30 f89 k4, L2 M38 f138 k5, L2 M37 f138 k6. k5's 52 / 53 have no entry in em057_00_18 (no effect param: nothing to
// draw, not made here).
const PERFRAME057 = [
  { clip: 'Motion[15]', frame: 117, k: 0 }, { clip: 'Motion[18]', frame: 117, k: 1 }, { clip: 'Motion[24]', frame: 6, k: 2 },
  { clip: 'Motion[26]', frame: 72, k: 3 }, { clip: 'Motion[30]', frame: 89, k: 4 }, { clip: 'Motion[38]', frame: 138, k: 5 },
  { clip: 'Motion[37]', frame: 138, k: 6 },
];
//   THE STRIKES (7, 0x71) 0xef8478 -> 0xef870c(e, k): L0 M20, k = P+0x1a2 (zeroed at phase 0) at the frames 0x169f23c (66, 106, 136,
// 156, 176, 186, 196, 206, 216, 226, 236, 246) -- Thunderlord charged at actiontune floats 0x2a.. (2, 32, 62, 92, 122, 152, 172, 192,
// 216, 226, 236, 246) -- a shell01 of mode 0x169f2ac[k] = k (charged Thunderlord 0x169f2b8[k] = 26 + k): Zinogre at his own point
// e+0x40, Thunderlord at the target block +0x1d0; +0x30.. the zero words, +0x20 the zero vector, +0x3c 0xffff. Then L0 M24 at f278.
const STRIKE057 = [66, 106, 136, 156, 176, 186, 196, 206, 216, 226, 236, 246];
const STRIKE057C = [2, 32, 62, 92, 122, 152, 172, 192, 216, 226, 236, 246];
//   THE RAYS: a joint's point to the ground (0x183664, mask 0x40: from 100 above it to 300 below; no hit, no shell), a shell01 there with
// the owner's words e+0xfe8.. (+0x3c P+0xb0a). (7, 0xa6..0xa9) 0xefa834: L2 M60 (joint 40; L2 M61 joint 50 when [+0xcac0]+0x118)
// f18 -- mode 13; Thunderlord charged 45 calm / 39 enraged, (7, 0xa6 / 0xa7)'s 39 with +0x1654 set (its end makes shell11 0). (7, 0xfb)
// / (7, 0xfc) 0xefd50c: L2 M1 (joint 40) / L2 M2 (joint 50) f57 -- 12; Thunderlord charged 21 / 22. (7, 0xe7 / 0xe9 / 0xeb / 0xed /
// 0xef) / (7, 0xe8 / 0xea / 0xec / 0xee / 0xf0 / 0xf8) 0xefc044: Thunderlord charged only, L2 M1 (joint 40) / L2 M2 (joint 50) f57 --
// 19 / 20 (the M41 / M40 actions on the M1 / M2 they follow into from 24).
//   ON THE OWNER (e+0x40, the words e+0xfe8.., +0x3c 0xffff unless said): (7, 0x55 / 0xc6 / 0xcb / 0xce / 0xd2) 0xef9554: L2 M30, at
// actiontune float 0x3b (82), Thunderlord enraged, charged and the tail not severed (vt+0x370(e, 1) 0xa3bf4 == 0) -- shell01 40 (joint
// 145). (7, 0xe3) 0xefae84: L9 M1 at tune 0x27 / 0x28 (266 / 278) -- 0x3a8430 >= 5 ? 41 / 42 : 14 / 38. (7, 0xdb) / (7, 0xe5) 0xefb470:
// L9 M4 phase 1 charged at tune 0x10 (2) -- shell11 1 (+0x3c P+0xb0a); (7, 0xdb) only (r5 1) goes on at f166 into L9 M5: at tune 0x3d /
// 0x3e (204 / 216) shell01 43 / 44. (Zinogre has no actiontune -- its frames would be 0 -- and no List 9 in the viewer.)
//   THUNDERLORD's CHARGED TRIO (7, 0x00 / 0xcf) / (7, 0x01 / 0xd0) 0xef67a0: L2 M15 / L2 M18 phase 1, charged and the quest number
// 0x49930 >= actiontune int 12 (5), at tune floats 0x23..0x25 (116 / 122 / 128) shell18 24 / 25 / 26 (M15) or 27 / 28 / 29 (M18), the
// leaps' setup (the words P+0x50 = 0, [+0xcac0]+0x18, 0): that heading is the last leap's (these actions do not write it).
const act057 = (status, n, list, clip, spawns, x = {}) => Object.assign({ action: [status, n], code: 'em057', list, clip,
  pick: x.pick || 'ai', variant: x.variant || (status + ':0x' + n.toString(16).padStart(2, '0')), spawns },
  x.also ? { also: x.also.map(m => [status, m]) } : {});
function actions057(v4){
  const A = [
    act057(7, 0x20, '2', 'Motion[31]', [{ frame: 88, leap: 0, which: 0 }], { also: [0x21, 0x22, 0x42, 0x57, 0x76, 0xd3, 0xd4, 0xdd, 0xe0, 0xf3] }),
    act057(7, 0x69, '2', 'Motion[31]', [{ frame: 88, leap: 1, which: 0 }], { also: [0x6b, 0xde, 0xe1, 0xf4] }),
    act057(7, 0x3d, '2', 'Motion[31]', [{ frame: 88, leap: 2, which: 0 }], { also: [0x6a, 0x6c, 0x78, 0xd5, 0xdf, 0xe2, 0xf5] }),
    act057(7, 0x20, '2', 'Motion[32]', [{ frame: 58, leap: 0, which: 1 }], { also: [0x57, 0xd4, 0xe0, 0x77] }),
    act057(7, 0x6b, '2', 'Motion[32]', [{ frame: 58, leap: 1, which: 1 }], { also: [0xe1] }),
    act057(7, 0x3d, '2', 'Motion[32]', [{ frame: 58, leap: 2, which: 1 }], { also: [0x6c, 0xd5, 0xe2, 0x79] }),
    act057(7, 0x7a, '2', 'Motion[32]', [{ frame: 58, leap: 3, which: 1 }]),
    // (7, 0x71): L0 M20's plays are (1, 0x2d) / (7, 0x71) by psl-mask.js CLIP_ACTIONS -- resolved by the play's action (input.action)
    act057(7, 0x71, '0', 'Motion[20]', [{ strikes: true }], { pick: 'act' }),
    // L2 M60: (7, 0xa6 / 0xa7) and (7, 0xa8 / 0xa9) differ only in the charged enraged ray's end (Thunderlord)
    act057(7, 0xa6, '2', 'Motion[60]', [{ frame: 18, ray: 'a834', joint: 40, end: true }], v4 ? { also: [0xa7] } : { pick: 'always', also: [0xa7, 0xa8, 0xa9] }),
    // L2 M1 / M2: CLIP_ACTIONS' (7, 0xe9) / (7, 0xea), Thunderlord's (7, 0xfb) / (7, 0xfc) charged and calm
    act057(7, 0xe9, '2', 'Motion[1]', [{ frame: 57, ray: 'c044', joint: 40 }], { pick: 'act' }),
    act057(7, 0xea, '2', 'Motion[2]', [{ frame: 57, ray: 'c044', joint: 50 }], { pick: 'act' }),
    act057(7, 0xfb, '2', 'Motion[1]', [{ frame: 57, ray: 'd50c', joint: 40 }], { pick: 'act' }),
    act057(7, 0xfc, '2', 'Motion[2]', [{ frame: 57, ray: 'd50c', joint: 50 }], { pick: 'act' }),
  ];
  for (const n of [0xe7, 0xeb, 0xed, 0xef]) A.push(act057(7, n, '2', 'Motion[1]', [{ frame: 57, ray: 'c044', joint: 40 }], { pick: 'act' }));
  for (const n of [0xe8, 0xec, 0xee, 0xf0, 0xf8]) A.push(act057(7, n, '2', 'Motion[2]', [{ frame: 57, ray: 'c044', joint: 50 }], { pick: 'act' }));
  if (v4) A.push(
    act057(7, 0xa8, '2', 'Motion[60]', [{ frame: 18, ray: 'a834', joint: 40 }], { also: [0xa9] }),
    act057(7, 0x00, '2', 'Motion[15]', [116, 122, 128].map((F, i) => ({ frame: F, trio: 24 + i })), { pick: 'always', also: [0xcf] }),
    act057(7, 0x01, '2', 'Motion[18]', [116, 122, 128].map((F, i) => ({ frame: F, trio: 27 + i })), { pick: 'always', also: [0xd0] }),
    act057(7, 0x55, '2', 'Motion[30]', [{ frame: 82, owner01: 40, gate: 'tail' }], { pick: 'always', also: [0xc6, 0xcb, 0xce, 0xd2] }),
    act057(7, 0xe3, '9', 'Motion[1]', [{ frame: 266, owner01: [14, 41] }, { frame: 278, owner01: [38, 42] }], { pick: 'act' }),
    act057(7, 0xdb, '9', 'Motion[4]', [{ frame: 2, sp11: 1 }], { pick: 'always', also: [0xe5] }),
    act057(7, 0xdb, '9', 'Motion[5]', [{ frame: 204, owner01: 43 }, { frame: 216, owner01: 44 }], { pick: 'act' }));
  return A;
}
SHELL_DATA.em057_00.actions = actions057(false);
SHELL_DATA.em057_00.perFrame057 = PERFRAME057;
SHELL_DATA.em057_04.actions = actions057(true);

// the unit's world matrix +0xb0 as base00's owner arm reads it (0x3f8da0..: its 3x3 turns the offset): the viewer's owner is level,
// so the turn by its yaw word -- rows (cos, 0, -sin), (0, 1, 0), (sin, 0, cos). A stand-in, named: the matrix itself is the game's.
function ownerTurn057(own){
  const r = f(u16(own.ownerY) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  return [cs, 0, -sn, 0, 0, 1, 0, 0, sn, 0, cs, 0, 0, 0, 0, 1].map(f);
}
// a ray's ground point (0x183664 from p + (0, 100, 0) to p + (0, -300, 0), mask 0x40): the stage stand-in's floor (stageQuery, mask 0x10
// -- the plane the viewer shows; the stage core is NOT READ, as for every query here); s0 the hit's height, the point (p.x, y, p.z)
function ray057(p, stage){
  const q = stageQuery([p[0], f(p[1] + f(-300.0)), p[2]], [p[0], f(p[1] + f(100.0)), p[2]], stage, 0x10);
  return q ? [p[0], q.point[1], p[2]] : null;
}
// the actions' spawns (SHELL_DATA.em057_0N.actions), on the previous pose's joints, by pass001 of each row's frame
function spawn057(state, D, a, ctx, input, out, fresh){
  const own = ctx.own001, v4 = state.monId === 'em057_04', charged = !!input.charged, rage = !!input.rage;
  if (fresh){
    state.yaw057 = own.facing ? own.ownerY >>> 0 : null;       // [+0xcac0]+0x18 = P+0x54 at the action's first update
    state.strike057 = 0;                                      // P+0x1a2 = 0 (0xef84c4)
  }
  if (fresh || !state.hist || !state.prevJoints) return;
  const J = state.prevJoints;
  const no = (sp, why, modes) => out.refused.push({ action: a.action, shell: sp.shell || null, modes, why });
  const push = S => { state.shells.push(S); out.spawned.push(S); };
  for (const sp of a.spawns){
    if (sp.strikes){
      // 0xef85b8..0xef863c: one test a step, of the counter's frame; the spawn advances the counter
      const k = state.strike057;
      if (k > 11) continue;
      const F = v4 && charged ? STRIKE057C[k] : STRIKE057[k];
      if (!pass001(state, f(F))) continue;
      state.strike057 = k + 1;
      const why = missing001(own, v4 ? { facing: true, target: true, ground: true } : { facing: true, pos: true, ground: true });
      if (why){ no(sp, why, [k]); continue; }
      const m = v4 && charged ? 26 + k : k;
      const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: m, position: (v4 ? own.target : own.ownerPos).slice(),
                                               angles: [0, 0, 0], action: a.action, frame: F }, own, J, ctx, null);
      if (S) push(S);
      continue;
    }
    if (!pass001(state, f(sp.frame))) continue;
    const at = sp.frame;
    if (sp.leap != null || sp.trio != null){
      // the leaps (0xf00590 / 0xf010e8) and Thunderlord's charged trio (0xef67a0): base00 setups, the words P+0x50 / the heading / P+0x58
      let modes;
      if (sp.trio != null){
        if (!v4 || !charged) continue;
        if (!(Number.isFinite(input.questLevel) && input.questLevel >= 5)){ no(sp, 'no quest number >= 5 (input.questLevel; 0x49930 vs actiontune int 12)', [sp.trio]); continue; }
        modes = [sp.trio];
      } else modes = (v4 ? LEAP057V4 : LEAP057)[sp.leap][sp.which][charged ? 1 : 0];
      if (!modes.length) continue;
      const why = missing001(own, { facing: true, pos: true, target: !v4 });
      if (why){ no(sp, why, modes); continue; }
      const yaw = state.yaw057 == null ? own.ownerY >>> 0 : state.yaw057;
      const words = v4 ? [0, yaw, 0] : [own.ownerX >>> 0, yaw, own.ownerZ >>> 0];
      for (const m of modes){
        const S = make18(state, D, m, J, Object.assign({}, own, { requestPos: [0, 0, 0], requestAngles: words }), ctx, a.action, at);
        if (S) push(S); else no(sp, 'shell18 mode ' + m + ': base00 init refused', [m]);
      }
      continue;
    }
    if (sp.ray){
      // 0xefa834 / 0xefd50c / 0xefc044: the joint's point (0xc164c) to the ground; the shell01 there with the owner's words
      let m;
      if (sp.ray === 'c044'){ if (!v4 || !charged) continue; m = sp.joint === 50 ? 20 : 19; }
      else if (sp.ray === 'd50c') m = v4 && charged ? (sp.joint === 50 ? 22 : 21) : 12;
      else m = v4 && charged ? (rage ? 39 : 45) : 13;
      const why = missing001(own, { facing: true, floor: true });
      if (why){ no(sp, why, [m]); continue; }
      const M = jointMatrix(J, sp.joint);
      if (!M){ no(sp, 'no matrix for joint ' + sp.joint, [m]); continue; }
      const g = ray057([M[12], M[13], M[14]], ctx.stage);
      if (!g) continue;                                         // the ray found no ground: no shell (0xefaa58 / 0xefd7b8 / 0xefc1a4)
      const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: m, position: g, angles: ownerWords001(own),
                                               action: a.action, frame: at }, own, J, ctx, null);
      if (S){ if (sp.end && m === 39) S.b1654 = true; push(S); }
      continue;
    }
    if (sp.owner01 != null){
      // on the owner: e+0x40 and the words e+0xfe8..
      if (sp.gate === 'tail' && !(v4 && rage && charged && !input.tailSevered)) continue;
      const m = Array.isArray(sp.owner01) ? (own.rank >= 5 ? sp.owner01[1] : sp.owner01[0]) : sp.owner01;
      const why = missing001(own, { facing: true, pos: true, ground: true });
      if (why){ no(sp, why, [m]); continue; }
      const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: m, position: own.ownerPos.slice(), angles: ownerWords001(own),
                                               action: a.action, frame: at }, own, J, ctx, null);
      if (S) push(S);
      continue;
    }
    if (sp.sp11 != null){
      if (!charged || !D.shells.shell11) continue;
      const why = missing001(own, { facing: true, pos: true });
      if (why){ no(sp, why, [sp.sp11]); continue; }
      const S = make001(state, D, 'shell11', { id: D.shells.shell11.id, mode: sp.sp11, position: own.ownerPos.slice(), angles: ownerWords001(own),
                                               action: a.action, frame: at }, own, J, ctx, null);
      if (S) push(S);
      continue;
    }
    throw new Error('shells.js: em057 spawn row not transcribed: ' + JSON.stringify(sp));
  }
}
// Zinogre's escorts (vt+0x2a8 0xeef638 -> 0xeefc34): by the motion and its frame, G rank (0x3a8430 >= 5: input.rank)
function perFrame057(state, D, ctx, input, out, fresh){
  if (String(input.list) !== '2' || fresh || !state.hist || !state.prevJoints) return;
  const own = ctx.own001;
  if (!(own.rank >= 5)) return;
  const clip = String(input.clip || '').replace(/_(start|loop)$/, '');
  for (const r of D.perFrame057){
    if (r.clip !== clip || !pass001(state, f(r.frame))) continue;
    const modes = [0x2a + 2 * r.k].concat(input.charged ? [0x2b + 2 * r.k] : []);
    const why = missing001(own, { facing: true, pos: true, target: true });
    if (why){ out.refused.push({ perFrame: clip, shell: 'shell18', modes, why }); continue; }
    const words = [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0];
    for (const m of modes){
      if (!D.shells.shell18.modes[m]) continue;                // 52 / 53: no file entry, nothing to draw
      const S = make18(state, D, m, state.prevJoints, Object.assign({}, own, { requestPos: [0, 0, 0], requestAngles: words }), ctx, null, r.frame);
      if (S){ S.perFrame = clip; state.shells.push(S); out.spawned.push(S); }
    }
  }
}

