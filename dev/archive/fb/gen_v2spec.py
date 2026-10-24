s = open('mk013v1spec.py').read()
start = s.index('rows = ['); end = s.index(']\ncases = [') + 2
F5 = '["phase: 0"] + ["phase: 1, win: 1, frame: %d.0" % F for F in (80, 140, 200, 260, 320)]'
rows = '''rows = [  # name, st, n, list, clip, len, steps
  ('s300', 3, 0x00, '1', 1, 152, ["phase: 1, ended: 1"]),
  ('s401', 4, 0x01, '1', 5, 12, ["phase: 1, win: 1, frame: 10.0"]),
  ('s02', 7, 0x02, '2', 7, 104, ["phase: 0", "phase: 1, win: 1, frame: 102.0"]),
  ('s03', 7, 0x03, '2', 8, 100, ["phase: 0", "phase: 1, win: 1, frame: 98.0"]),
  ('s05', 7, 0x05, '2', 10, 32, ["phase: 0", "phase: 2, win: 1, frame: 30.0"]),
  ('s07e', 7, 0x07, '2', 11, 72, ["phase: 1, ended: 1"]),
  ('s07', 7, 0x07, '2', 12, 22, ["phase: 2, win: 1, frame: 20.0"]),
  ('s0d', 7, 0x0d, '2', 15, 52, ["phase: 4, win: 1, frame: 50.0"]),
  ('m0e', 7, 0x0e, '2', 2, 322, F5),
  ('m12', 7, 0x12, '2', 2, 322, F5),
  ('m23', 7, 0x23, '2', 21, 542, ["phase: 0"] + ["phase: 1, win: 1, frame: %d.0" % F for F in (180, 240, 300, 360, 420, 480, 540)]),
  ('s25', 7, 0x25, '2', 24, 92, ["phase: 0", "phase: 1, win: 1, frame: 90.0"], ', noTurn: 1'),
  ('s26b', 7, 0x02, '2', 7, 104, ["phase: 0", "phase: 1, win: 1, frame: 102.0"], ', target: [400.0, 0.0, 900.0]'),
  ('s2d', 7, 0x2d, '2', 16, 56, ["phase: 1, win: 1, frame: 54.0"]),
  ('s2e', 7, 0x2e, '2', 44, 32, ["phase: 0", "phase: 2, win: 1, frame: 30.0"]),
  ('s3ae', 7, 0x3a, '2', 11, 72, ["phase: 1, ended: 1"]),
  ('s3a', 7, 0x3a, '2', 12, 22, ["phase: 2, win: 1, frame: 20.0"]),
  ('s46', 7, 0x46, '4', 7, 227, ["phase: 1, win: 1, frame: 225.0"], ', noTurn: 1'),
  ('s50', 7, 0x50, '4', 1, 72, ["phase: 1, ended: 1"]),
  ('s53', 7, 0x53, '4', 11, 168, ["phase: 1, win: 1, frame: 166.0"], ', noTurn: 1'),
  ('s54', 7, 0x54, '4', 12, 168, ["phase: 1, win: 1, frame: 166.0"], ', noTurn: 1'),
  ('s55', 7, 0x55, '2', 43, 168, ["phase: 1, win: 1, frame: 166.0"], ', noTurn: 1'),
  ('s56', 7, 0x56, '2', 40, 168, ["phase: 1, win: 1, frame: 166.0"], ', noTurn: 1'),
]
'''.replace('F5)', F5 + ')')
s = s[:start] + rows + s[end:]
s = s.replace("mon = 'em013_01'", "mon = 'em013_02'")
i = s.index("cases.append(\"    C('m0e_r'"); j = s.index("spec = {")
s = s[:i] + '''cases.append("    C('m0e_r', 0x0e, 1, null, 0, %s, { %s, frames: 600, target: [-700.0, 120.0, 1900.0], owner: [0, 0x9abc, 0] })," % (M('2', 2, '7:0x0e', 322), ST(*(["phase: 0"] + ["phase: 1, win: 1, frame: %d.0" % F for F in (80, 140, 200, 260, 320)]))))
cases.append("    C('s56_r', 0x56, 1, null, 0, %s, { %s, frames: 600, target: [-2500.0, 300.0, 1800.0], owner: [0, 0x7654, 0], noTurn: 1 })," % (M('2', 40, '7:0x56', 168), ST("phase: 1, win: 1, frame: 166.0")))
''' + s[j:]
s = s.replace("'name': 'crimson-fatalis', 'title': 'Crimson Fatalis', 'mon': mon, 'main': 'd8a634', 'variant': 1,", "'name': 'old-fatalis', 'title': 'Old Fatalis', 'mon': mon, 'main': 'd8a634', 'variant': 2,")
s = s.replace("'folders': {hex(0x86): [mon, '00'], hex(0x87): [mon, '01'], hex(0x89): [mon, '51']},", "'folders': {hex(0x8a): [mon, '00'], hex(0x8b): [mon, '01'], hex(0x8d): [mon, '11'], hex(0x8e): [mon, '51']},")
s = s.replace("'bases': {hex(0x86): 'base00', hex(0x87): 'base01', hex(0x89): 'base01'},", "'bases': {hex(0x8a): 'base00', hex(0x8b): 'base01', hex(0x8d): 'base01', hex(0x8e): 'base01'},")
s = s.replace("Crimson Fatalis's (em013_01) shells in render/shells.js against the ROM -- uEm013_00 variant 1: sp_00 (0x86, base00 through 0xd8c254 / 0xd8c3bc, its", "Old Fatalis's (em013_02) shells in render/shells.js against the ROM -- uEm013_00 variant 2: sp_00 (0x8a, base00 through 0xd8cf8c, its")
s = s.replace("landing 0xd8c52c making sp_01; the meteors 0xd80e74), sp_01 (0x87, base01 through 0xd8c7f4) and sp_51 (0x89,", "landing 0xd8d08c making sp_01 / sp_11), sp_01 (0x8b, base01 through 0xd8d41c: strikes, dust, the meteors' lightning), sp_11 (0x8d) and sp_51 (0x8e,")
s = s.replace("base51 through 0xd8cdf0: the sweep). dev/elder-dragon-shells-spec.md 3b.", "base51 through 0xd8dfa8: the sweep about its point). dev/elder-dragon-shells-spec.md 3c.")
s = s.replace("shells-crimson-fatalis-check.mjs", "shells-old-fatalis-check.mjs")
s = s.replace("spec_crimson.json", "spec_old.json")
ci = s.index("  'contract':"); cj = s.index("  'controls':")
s = s[:ci] + open('old_contract.txt').read() + s[cj:]
ki = s.index("  'controls':"); kj = s.index("  'page':")
s = s[:ki] + open('old_controls.txt').read() + s[kj:]
s = s.replace("[['2', 'Motion[2]', 'shell00', 100], ['2', 'Motion[40]', 'shell51', 30]]", "[['2', 'Motion[7]', 'shell00', 0], ['2', 'Motion[40]', 'shell51', 30]]")
s = s.replace("[['em013_01u', 0], ['em013_01u', 2], ['em013_01u', 11], ['em013_01u', 1], ['em013_01u', 30], ['em013_01u', 31], ['em013_01u', 100], ['em013_01u', 101], ['em013_01u', 103], ['em013_01u', 130]]", "[['em013_02u', 0], ['em013_02u', 1], ['em013_02u', 2], ['em013_02u', 11], ['em013_02u', 12], ['em013_02u', 13], ['em013_02u', 103], ['em013_02u', 111], ['em013_02u', 30], ['em013_02u', 31], ['em013_02u', 32], ['em013_02u', 33]]")
open('mk013v2spec.py', 'w').write(s)
print('ok')
