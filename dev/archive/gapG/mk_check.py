# Builds gapG/legsnow-check.mjs: dev/shells-elderfrost-check.mjs's ROM machinery (emu_fb.py runs, diffShell / compare) pointed at the
# PATCHED COPY gapG/shells.patched.js, with the leg-snow cases in place of its own, slot / durability pokes in emuCase, input.legSnow083
# in runJS, and its contract / control sections replaced by the leg controls. The repo files are only read.
import re, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
s = open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-elderfrost-check.mjs', encoding='utf-8').read()
def once(old, new):
    global s
    if s.count(old) != 1: sys.exit('anchor x%d: %r' % (s.count(old), old[:80]))
    s = s.replace(old, new)
once("C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js", HERE.replace('\\', '/') + '/shells.patched.js')
# the cases
a = s.index('  const cases = [\n'); b = s.index('  for (const c of cases) c.folders = F083;')
CASES = r'''  const F00 = { 0x161: ['em083_00', '00'], 0x162: ['em083_00', '00_02'], 0x163: ['em083_00', '01'], 0x164: ['em083_00', '13'] };
  const IDS00 = { '0xcae0': [0x61, 1, 0, 0], '0xcae4': [0x63, 1, 0, 0], '0xcae8': [0x64, 1, 0, 0] };
  // a leg case: steps at the listed frames (0xb0968 answered at that frame alone, winFrames; 0xb0974 at `frame` too), the slots
  // e+0xcb50.. at `slots` and every leg part's durability (P+0x3c0 + 12 part, parts 2..5) at 1; `zero` = { frame: [slot..] }: the
  // current levels the move step 0x105006c would have copied from next (= 0, 0x1054624) before that frame -- the harness runs the
  // action main alone
  const LEG = (name, mon, n, phase, frames, seq, slots, legs, x = {}) => {
    const v0 = mon === 'em083_00', shed = new Set();
    const steps = frames.map(F => {
      const st = { fn: '1050a1c', phase, win: 0, winFrames: [F], frame: F };
      const z = (x.zero || {})[F];
      if (z){ st.owner = {}; for (const k of z){ st.owner['0x' + (0xcb50 + 4 * k).toString(16)] = [0, 0, 0, 0]; } }
      return st;
    });
    const ob = Object.assign({ '0x73e0': [7, n] }, v0 ? IDS00 : { '0xcae0': [0x65, 1, 0, 0], '0xcae4': [0x68, 1, 0, 0], '0xcae8': [0x6a, 1, 0, 0] });
    slots.forEach((L, k) => { ob['0x' + (0xcb50 + 4 * k).toString(16)] = [L, 0, 0, 0]; });
    return C(name, n, phase, null, 0, seq, Object.assign({ mon, emVariant: v0 ? 0 : 4, steps, owner_bytes: ob, legs,
      block_bytes: { '0x3d8': [1, 0], '0x3e4': [1, 0], '0x3f0': [1, 0], '0x3fc': [1, 0] }, F: v0 ? F00 : F083 }, x));
  };
  const M6 = [208, 216, 230, 260, 268, 310, 388, 390];
  const cases = [
    LEG('g_00', 'em083_00', 0x00, 1, [116], Q('Motion[1]', 0x00, 120), [2, 2, 2, 2], [2, 2, 2, 2]),
    LEG('g_01', 'em083_00', 0x01, 1, [100], Q('Motion[2]', 0x01, 104), [2, 2, 2, 2], [2, 2, 2, 2]),
    LEG('g_05', 'em083_00', 0x05, 1, M6, Q('Motion[6]', 0x05, 394), [2, 2, 2, 2], [2, 2, 2, 2], { zero: { 260: [1], 388: [0], 390: [1] } }),
    LEG('g_05_l3', 'em083_00', 0x05, 1, M6, Q('Motion[6]', 0x05, 394), [3, 1, 3, 1], [3, 1, 3, 1], { zero: { 260: [1], 388: [0], 390: [1] } }),
    LEG('g_05_one', 'em083_00', 0x05, 1, M6, Q('Motion[6]', 0x05, 394), [0, 0, 0, 2], [0, 0, 0, 2]),
    LEG('g_5a', 'em083_00', 0x5a, 1, [170, 172], Q('Motion[37]', 0x5a, 176), [2, 2, 2, 2], [2, 2, 2, 2]),
    LEG('g_5c', 'em083_00', 0x5c, 2, [170, 172], Q('Motion[37]', 0x5c, 176), [2, 2, 2, 2], [2, 2, 2, 2]),
    LEG('g_05_bare', 'em083_00', 0x05, 1, M6, Q('Motion[6]', 0x05, 394), [0, 0, 0, 0], [0, 0, 0, 0], { none: 1 }),
    LEG('g_05_broken', 'em083_00', 0x05, 1, M6, Q('Motion[6]', 0x05, 394), [4, 4, 4, 4], [4, 4, 4, 4], { none: 1 }),
    LEG('e_00', 'em083_04', 0x00, 1, [116], Q('Motion[1]', 0x00, 120), [2, 2, 0, 0], [2, 2, 0, 0]),
    LEG('e_05', 'em083_04', 0x05, 1, M6, Q('Motion[6]', 0x05, 394), [2, 2, 0, 0], [2, 2, 0, 0], { zero: { 260: [1], 388: [0], 390: [1] } }),
    LEG('e_05_l1', 'em083_04', 0x05, 1, M6, Q('Motion[6]', 0x05, 394), [1, 1, 0, 0], [1, 1, 0, 0], { zero: { 260: [1], 310: [0], 388: [0], 390: [1] } }),
    LEG('e_70', 'em083_04', 0x70, 1, [30], Q('Motion[11]', 0x70, 34, '9'), [2, 2, 0, 0], [2, 2, 0, 0]),
    LEG('e_71', 'em083_04', 0x71, 1, [30], Q('Motion[14]', 0x71, 34, '9'), [2, 1, 0, 0], [2, 1, 0, 0]),
  ];
  for (const c of cases){ c.folders = c.F; delete c.F; }
'''
s = s[:a] + CASES + s[b + len('  for (const c of cases) c.folders = F083;\n'):]
once("questLevel: x.quest, trunkSnow083: x.trunk });", "questLevel: x.quest, trunkSnow083: x.trunk, legSnow083: x.legs });")
once("    if (c.noTurn) o.noTurn = 1;", "    if (c.noTurn) o.noTurn = 1;\n    if (c.block_bytes) o.block_bytes = Object.assign({}, o.block_bytes || {}, c.block_bytes);")
once("  const BASE = { 0x165: 'base00',", "  const BASE = { 0x161: 'base00', 0x162: 'base00', 0x163: 'base01', 0x164: 'base13', 0x165: 'base00',")
# the module's makes per case, printed with the starts (the records)
once("    ok(!why && (c.none ? R.shells.length === 0 : R.shells.length > 0), c.name",
     "    const made = [...J.info.values()].filter(I => I.S.creator == null).map(I => 'm' + I.S.modeIndex + '@' + I.S.spawnFrame + ((I.S.start ? [I.S.start] : []).concat(I.starts).map(q => ' ' + q.listId + ':' + q.key).join('')));\n    console.log('     ' + c.name + ' module: ' + JSON.stringify(made) + '  ROM: ' + JSON.stringify(R.shells.map(x => x.id.toString(16) + ' m' + x.mode)));\n    ok(!why && (c.none ? R.shells.length === 0 : R.shells.length > 0), c.name")
# the contract and controls: the leg controls
a = s.index('  // ---- 2. the contract'); b = s.index('  console.log(`\\n${pass} passed, ${fail} failed`);')
CTL = r'''  // ---- 3. CONTROLS: the module's input moved, the ROM's run kept -- each must FAIL the comparison
  const byName = n => cases.find(c => c.name === n);
  const controls = [
    ['g_05', { legs: [2, 2, 2, 0] }, 'leg 3 shown bare (the ROM at 2)'],
    ['g_00', { joints: Object.assign({}, JOINTS, { 7: J157b }) }, 'another joint 7'],
    ['e_70', { legs: [4, 2, 0, 0] }, 'leg 0 shown broken (the ROM at 2)'],
    ['g_5a', { owner: [0, 0x3001, 0] }, 'the facing one word off'],
  ];
  for (const [n, over, what] of controls){
    const c = byName(n), J = runJS(c, over);
    const { why } = compare(c, ROM[n], J);
    ok(!!why, 'CONTROL ' + n + ' with ' + what + ' fails', why || 'it matched');
  }

'''
s = s[:a] + CTL + s[b:]
# drop the page section (no viewer here)
s = s[:s.index('// ---- 4. IN THE VIEWER')]
s = s.replace("// Elderfrost Gammoth's (em083_04) shells in render/shells.js against the ROM",
              "// gapG (2026-10-20): THE LEG SNOW (0x105fd94) in the PATCHED COPY gapG/shells.patched.js against the ROM; built by mk_check.py from\n// dev/shells-elderfrost-check.mjs, whose header follows.\n// Elderfrost Gammoth's (em083_04) shells in render/shells.js against the ROM", 1)
open(os.path.join(HERE, 'legsnow-check.mjs'), 'w', encoding='utf-8').write(s)
print('wrote legsnow-check.mjs')
