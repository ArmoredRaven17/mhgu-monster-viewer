D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + '\\'
s00 = open(D + 's00_04.txt').read().rstrip('\n')
s01 = open(D + 's01_04.txt').read().rstrip('\n')
s13 = open(D + 's13_04.txt').read().rstrip('\n')
BS = chr(92) * 2
out = """
// ---- ELDERFROST GAMMOTH (em083_04): uEm083_00 with the variant byte e+0xb5f5 = 4 ------------------------------------------------------
// The same class (dev/em083-shells-spec.md): ids e+0xcae0 0x165 (uShellEm083_sp_00), +0xcae4 0x168 (sp_01), +0xcae8 0x16a (sp_13),
// written by 0x105f164; immediates 0x166 (uShellEm083_04_00), 0x167 (uShellEm083_sp_00_03), 0x169 (uShellEm083_04_02, base02),
// 0x16b (uShellEm083_04_13). Folders by the ids' order (INFERRED, as every monster's: no path table read). His actions (census
// scratchpad fb/cen_em083_v4.txt; tune floats 0xb7..0xbc = 12 / 12 / 47 / 47 / 30 / 100, ints 0x35 / 0x36 = 15 / 90):
//   Gammoth's L2 M61 / M62 / M5 / M9 / M14 / M15 / M20 / M21 / M37 rows on his files; L2 M23 is his own snowball (0x105faec ->
//   0x16b, its tests 0xb0974: (7, 0x7e) mode 4 too) -- NOT BUILT, refused by name;
//   L9 M6 (7, 0x6f; 0x105adf8): at its start sp_01 16 / 18 (0x1060d4c: the zero point, the owner's words) and the leap's landing
//   point written into the target slot; its L9 M7 makes sp_00_03 0 / 1 at 12 and 47 (0x1060be8) -- NOT BUILT, refused by name;
//   L9 M8 (7, 0x72; 0x105b674): sp_13 6 at 30 (e+0xcb0c = 1), thrown at 100 (= 2); L9 M11 / M14 (7, 0x70 / 0x71) f30 sp_01 30 / 31;
//   L9 M19 (7, 0x75 / 0x83 / 0x85) / L9 M23 (7, 0x76 / 0x84 / 0x86) f120 sp_01 26 / 27 (0x105f4ac); L9 M15 (7, 0x77 / 0x81) f95 sp_00
//   4 (0x1060aa4), turned by e+0xcb10 (turn083); L9 M17 (7, 0x6c) f111 the beam 0x169 -- NOT BUILT, refused by name.
SHELL_DATA.em083_04 = {
  name: 'Elderfrost Gammoth',
  lists: { 0: { list: 'u', pel: 'em083_04u' } },
  tune083: { i35: 15, i36: 90 },
  shells: {
    shell00: { id: 0x165, cls: 'uShellEm083_sp_00', base: 'base00', reader: 0x1062afc, folder: 'shell@em@em083_04_shell00',
      modes: {
%s
      }, hitdata: [[0, 500], [0, 500]] },
    shell01: { id: 0x168, cls: 'uShellEm083_sp_01', base: 'base01', reader: 0x10637c4, folder: 'shell@em@em083_04_shell01',
      modes: {
%s
      }, hitdata: [[0, 500], [0, 500], [0, 500], [0, 100], [0, 500], [25, 105], [0, 6], [0, 6], [0, 6], [0, 500], [30, 110], [0, 6], [0, 30],
                   [0, 100], [0, 6], [0, 6], [0, 500], [0, 30], [0, 10], [0, 10]] },
    // shell13: his sp_13 (L9 M8 mode 6; 0..2 are the files', his L2 M23 is 0x16b's): no split (variant 4: 0x1063cd8)
    shell13: { id: 0x16a, cls: 'uShellEm083_sp_13', base: 'base13', reader: 0x1063b2c, folder: 'shell@em@em083_04_shell13', v4: true,
      modes: {
%s
      }, hitdata: [[0, 3000], [0, 3000], [0, 3000]] },
  },
  actions: null,
};
const act083v = (n, list, clip, spawns, x = {}) => Object.assign({ action: [7, n], code: 'em083', list, clip, pick: x.pick || 'ai',
  variant: '7:0x' + n.toString(16).padStart(2, '0'), spawns }, x);
const UNBUILT083 = (shell, mode, frame, why) => ({ frame, shell, mode, kind: 'unbuilt', why });
const SNOW083V4 = 'uShellEm083_04_13 (0x16b: reader 0x10619a0, init 0x10622f4, +0x15c 0x1061ef4, +0x158 0x1062138, landing 0x1061d6c): not transcribed';
SHELL_DATA.em083_04.actions = SHELL_DATA.em083_00.actions.filter(r => r.clip !== 'Motion[23]').map(r => Object.assign({}, r)).concat([
  act083v(0x1d, '2', 'Motion[23]', [UNBUILT083('shell13_02', 0, 220, SNOW083V4)], { also: [[7, 0x7a], [7, 0x7d]] }),
  act083v(0x1c, '2', 'Motion[23]', [UNBUILT083('shell13_02', 1, 220, SNOW083V4)], { also: [[7, 0x79], [7, 0x7c]] }),
  act083v(0x1b, '2', 'Motion[23]', [UNBUILT083('shell13_02', 2, 220, SNOW083V4)], { also: [[7, 0x78], [7, 0x7b]] }),
  act083v(0x7e, '2', 'Motion[23]', [UNBUILT083('shell13_02', 4, 220, SNOW083V4)]),
  act083v(0x6f, '9', 'Motion[6]', [{ at: 'start', shell: 'shell01', mode: 16, zero: true }, { at: 'start', shell: 'shell01', mode: 18, zero: true }]),
  act083v(0x6f, '9', 'Motion[7]', [12, 12, 47, 47].map((F, i) => UNBUILT083('shell00_03', i & 1, F,
    'uShellEm083_sp_00_03 (0x167, reader 0x1063568) and the leap\\'s target write (0x105aee8..0x105b35c): not transcribed'))),
  act083v(0x72, '9', 'Motion[8]', [{ frame: 30, shell: 'shell13', mode: 6 }, { frame: 100, kind: 'release' }]),
  act083v(0x70, '9', 'Motion[11]', [{ frame: 30, shell: 'shell01', mode: 30 }]),
  act083v(0x71, '9', 'Motion[14]', [{ frame: 30, shell: 'shell01', mode: 31 }]),
  act083v(0x75, '9', 'Motion[19]', [{ frame: 120, shell: 'shell01', mode: 26 }], { also: [[7, 0x83], [7, 0x85]] }),
  act083v(0x76, '9', 'Motion[23]', [{ frame: 120, shell: 'shell01', mode: 27 }], { also: [[7, 0x84], [7, 0x86]] }),
  act083v(0x77, '9', 'Motion[15]', [{ frame: 95, shell: 'shell00', mode: 4, kind: 'turnShot' }], { turn083: [0, 1, 1] }),
  act083v(0x81, '9', 'Motion[15]', [{ frame: 95, shell: 'shell00', mode: 4, kind: 'turnShot' }], { turn083: [0, 1, 0] }),
  act083v(0x6c, '9', 'Motion[17]', [UNBUILT083('shell02', 0, 111, 'uShellEm083_04_02 (0x169, base02, reader 0x106170c): not transcribed')]),
]);
""" % (s00, s01, s13)
out = out.replace('@', BS)
open(D + 'elderfrost.js', 'w', encoding='utf8').write(out)
print(out[:300])
