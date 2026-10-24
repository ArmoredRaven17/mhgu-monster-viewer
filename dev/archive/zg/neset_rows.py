p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\motion-states.js'
s = open(p, encoding='utf8').read()
a = "// ZAMTRIOS's u 60 (dev/em067_00-effects-spec.md 3;"
b = """// AHTAL-NESET's states (dev/em087_00-effects-spec.md 3; read here; his word was transcribed before: base | bits 15-23 always).
// Status 10 (tracer, partscr): (10, 7) parts 0 / 1 / 2 / 5 / 6 / 7 -> 0x18041f0 (L3 M1), 3 -> 0x1804220 (L3 M6 -> wait 1500 -> L3 M7
// -> L3 M8), 4 -> 0x1804278 (L3 M9 -> wait 1500 -> L3 M10 -> L3 M11); (10, 0x14) every part -> 0x18042d0 (L3 M3 -> wait 1440 -> L3
// M4 -> L3 M5); sleep, paralysis, the stun, the second counter (10, 0x72): no reaction -- the handler sets (1, 0) (0x10adab4); no
// death case under status 11 (tracer); no EMC group 6. The part pass vt+0x210 0x10a7ed0, RUN (ppemu.py): part 3 set 13 -> 14 (u 1015),
// part 4 11 -> 12 (u 1020); part 2's .dtp row is level 5 (u 1014 at its fifth depletion, nothing drawn).
MOTION_STATES.em087_00 = {
  '3|Motion[1]':  { cycle: [{ levels: [[], [], [], [], [], []], at: 5, fire: [null, null, null, null, null, ['em087_00u', 1014]] }, {}] },
  '3|Motion[6]':  { levels: [[13], [14]], fire: [null, ['em087_00u', 1015]] },
  '3|Motion[9]':  { levels: [[11], [12]], fire: [null, ['em087_00u', 1020]] },
};
"""
assert s.count(a) == 1; s = s.replace(a, b + a)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
