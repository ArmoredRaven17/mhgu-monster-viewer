import os, json
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')
SV = 'dev/carapaceons-neopterons-effects-survey.md'


def patch(p, pairs):
    b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for a, r in pairs:
        assert s.count(a) == 1, (p, a[:70], s.count(a)); s = s.replace(a, r)
    if crlf: s = s.replace('\n', '\r\n')
    open(p, 'wb').write(s.encode('utf-8'))


patch('docs/render/motion-states.js', [
("""const D_EXHAUST = { start: [['em019_00c', 1109]] };""",
"""const D_EXHAUST = { start: [['em019_00c', 1109]] };
// THE SHOCK TRAP's start on L3 M2: (10, 0x6e) = script 0x17ae250 plays L3 M2 to frame 40 (P+0x568 = 40) and then holds
// L3 M10, with c 1105 every 42 while the action lasts (0x80254 tests (10, 0x6e), period READ at 0xa4890). L3 M10 is
// paralysis's hold, so the trap shows on its own play clip, as Basarios's L3 M9 and the dromes' L3 M15 do.
const D_TRAP    = { every: [['em019_00c', 1105], 42] };
// THE CRAB LINE'S AILMENTS -- Stonefist, Shogun and Rustrazor take Daimyo's ailment layout clip for clip. Probed this
// pass (efx/agents/notice-scratch/probe.py, the class action main under unicorn, then scr.py; control: Daimyo's probe
// returns exactly the scripts states-em019_00.md names): exhaust (10, 0x1b) L3 M2 -> L3 M3; sleep (10, 0x1d) L3 M11,
// hold (10, 0x1e) L0 M16; paralysis (10, 0x1f) L3 M10 hold; stun (10, 0x20) L3 M5 -> M7 (hold) -> M9, direction 2
// L3 M4 -> M6 -> M8; shock trap (10, 0x6e) L3 M2 to f40 -> L3 M10. Stonefist's scripts are Daimyo's (em 0x13 variant 4
// = variant 0); Shogun's and Rustrazor's are their own class's (em 0x14, variants 0 and 4 identical) with the same clips.
// u 1400 is the class's own held record on L0 M4: the site 0xdbb68c in the helper 0xdbb304, shared by both crab
// classes (rom-map u 1400 sweep). THEIR BREAKS ARE NOT HERE: their .dtp / .mpm and the break records' keys are not read
// (Stonefist's em019_04u 1010-1031, Shogun's 1011 / 1025 / 1030 are unexported), so L3 M1 and the claws' L3 M2 arms are
// left out rather than borrowed from Daimyo. Nor rage, tired or death clips: not read for them. (""" + SV + """)
function crabLine(u, c){
  return {
    '0|Motion[4]':  { hold: [u, 1400] },
    '3|Motion[2]':  { cycle: [{ start: [[c, 1109]] }, { every: [[c, 1105], 42] }] },
    '0|Motion[16]': { every: [[c, 1102], 90], puffOff: true },
    '3|Motion[10]': { every: [[c, 1101], 60] },
    '3|Motion[4]':  { hold: [c, 1103] },
    '3|Motion[6]':  { hold: [c, 1103] },
    '3|Motion[8]':  { hold: [c, 1103] },
    '3|Motion[5]':  { hold: [c, 1103] },
    '3|Motion[7]':  { hold: [c, 1103] },
    '3|Motion[9]':  { hold: [c, 1103] },
  };
}"""),
("""    // order -- the Rath line's shape. L3 M2 is ALSO the shock trap's start (to frame 40, (10, 0x6e)), which shows
    // nothing of its own and so is not in the rotation.
    '3|Motion[2]':  { cycle: [D_CLAW_P, D_CLAW_M, D_EXHAUST] },""",
"""    // order -- the Rath line's shape. L3 M2 is ALSO the shock trap's start (to frame 40, (10, 0x6e)), with c 1105 every
    // 42 while the trap lasts: a fourth turn (D_TRAP). [2026-10-15: this said the trap's start "shows nothing of its
    // own and so is not in the rotation" -- written before c 1105 was wired anywhere; withdrawn, as on the dromes.]
    '3|Motion[2]':  { cycle: [D_CLAW_P, D_CLAW_M, D_EXHAUST, D_TRAP] },"""),
("""    '3|Motion[12]': { dead: true },
    '3|Motion[20]': { dead: true },
  },
  // GYPCEROS (em009_00)""",
"""    '3|Motion[12]': { dead: true },
    '3|Motion[20]': { dead: true },
  },
  // STONEFIST HERMITAUR (em019_04), SHOGUN CEANATAUR (em020_00) and RUSTRAZOR CEANATAUR (em020_04): the crab line's
  // ailments and u 1400 (crabLine above). c records are the class pel's (Stonefist em019_00c, the Ceanataurs em020_00c),
  // u records their own.
  em019_04: crabLine('em019_04u', 'em019_00c'),
  em020_00: crabLine('em020_00u', 'em020_00c'),
  em020_04: crabLine('em020_04u', 'em020_00c'),
  // GYPCEROS (em009_00)"""),
("""  em019_00: { period: 30, joint: 1, records: [['em019_00u', 1120], ['em019_00u', 1121]], pick: () => 0 },""",
"""  em019_00: { period: 30, joint: 1, records: [['em019_00u', 1120], ['em019_00u', 1121]], pick: () => 0 },
  // STONEFIST, SHOGUN, RUSTRAZOR: the stub shape -- vtable +0x2a4 is the base 0x6bf64 on both crab classes, so the request
  // is always u 1121; their 1120 / 1121 are Daimyo's em019_00_003 on joint 1, pos (0, 0, 50), byte-identical but the key.
  // Neither class writes e+0xb7d2 (scan of 0xdb3f7c..0xdcd604), so the puff runs. (""" + SV + """)
  em019_04: { period: 30, joint: 1, records: [['em019_04u', 1120], ['em019_04u', 1121]], pick: () => 0 },
  em020_00: { period: 30, joint: 1, records: [['em020_00u', 1120], ['em020_00u', 1121]], pick: () => 0 },
  em020_04: { period: 30, joint: 1, records: [['em020_04u', 1120], ['em020_04u', 1121]], pick: () => 0 },
  // SELTAS: the stub shape too (vtable +0x2a4 the base stub; no e+0xb7d2 writer in 0xfc40ec..0xfd963c): cm200_007 on
  // joint 1, pos (0, 0, 80), scale 1.3, 1120 / 1121 byte-identical but the key. (""" + SV + """)
  em076_00: { period: 30, joint: 1, records: [['em076_00u', 1120], ['em076_00u', 1121]], pick: () => 0 },"""),
("""  em018_00: ['em018_00c', 1104], em018_04: ['em018_00c', 1104], em019_00: ['em019_00c', 1104],""",
"""  em018_00: ['em018_00c', 1104], em018_04: ['em018_00c', 1104], em019_00: ['em019_00c', 1104],
  // SELTAS QUEEN: states-em069_00.md 5 (cm200_006 on joint 1; the class writes neither e+0xb7d2 nor e+0xb7d3)
  em069_00: ['em069_00c', 1104],"""),
])

p = 'docs/effect-mounts.json'
b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
lst = json.loads(s)['_autoOnRage']
add = [m for m in ('em019_04', 'em020_00', 'em020_04', 'em076_00') if m not in lst]
i = s.index('"_autoOnRage": ['); j = s.index(']', i)
s = s[:i] + s[i:j].rstrip() + ''.join(',\n  "%s"' % m for m in add) + '\n ' + s[j:]
json.loads(s)
if crlf: s = s.replace('\n', '\r\n')
open(p, 'wb').write(s.encode('utf-8'))
print('ok', add)
