# uEm007_00 vt+0x13c (0xd4532c): the proposed Diablos transcription (em007_00) and the shipped Bloodbath one (em007_04,
# copied verbatim from docs/render/psl-mask.js) vs the ROM under unicorn (bw1/emu13c_bw.py), every combination.
# node runs the JS, unicorn the ROM. Variant 0 checks em007_00; variant 4 checks em007_04 (control); variants 1/2/3/5
# check that every non-4 variant gives Diablos's word.
import sys, subprocess, json, itertools
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\bw1')
import emu13c_bw as g
JS = r'''
const baseMask = ({ rage = false, tired = false } = {}) => 0x3f | (rage ? 0xe00 : tired ? 0x7000 : 0x1c0);
const EM007_T1 = [0x8000000, 0x30000000, 0x30000000, 0xc0000000, 0xc0000000];
const EM007_T2 = [0x30000000, 0x30000000, 0xc0000000, 0xc0000000];
const vt3f4 = a => !!a && (a[0] === 11 || a[0] === 14 || (a[0] === 12 && a[1] === 0xff));
function em007_04(motion, action, state){
  const tail = state.severed ? 0x1c0000 : 0x38000;
  const n = action && action[0] === 7 ? action[1] : -1;
  if (motion <= 0x20e)
    return tail | ((motion === 5 || motion === 7) && (state.posture | 0) === 0 ? 0x7000000 : 0);
  if (motion === 0x20f)
    return n >= 0xb4 && n <= 0xb8 ? { set: tail | EM007_T1[n - 0xb4], clear: 0x3f } : tail;
  if (motion === 0x213)
    return n === 0xb7 || n === 0xb8 ? { set: tail | 0xc0000000, clear: 0x3f } : tail;
  if (motion === 0x216) return tail | (n === 0x67 ? 0x200000 : 0);
  if (motion === 0x21f || motion === 0x90b)
    return n >= 0xb5 && n <= 0xb8 ? { set: tail | EM007_T2[n - 0xb5], clear: 0x3f } : tail;
  if (motion === 0x314) return tail | (vt3f4(action) ? 0x800000 : 0x400000);
  return tail;
}
// PROPOSED: Diablos = the same method's variant != 4 side: L2 M22 (7, 0x67) returns at the popne 0xd454c0 with the
// tail bits only; every other arm is variant-blind
function em007_00(motion, action, state){
  if (motion === 0x216) return state.severed ? 0x1c0000 : 0x38000;
  return em007_04(motion, action, state);
}
const F = { 0: em007_00, 4: em007_04 };
const cases = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(JSON.stringify(cases.map(([v, m, s, n, sev, rage, tired, post]) => {
  const st = { rage: !!rage, tired: !!rage ? false : !!tired, severed: !!sev, posture: post };
  const r = F[v](m, [s, n], st);
  return (typeof r === 'object' ? ((baseMask(st) | r.set) & ~r.clear) : (baseMask(st) | r)) >>> 0;
})));
'''
VT = 0x17994cc
mots = [0x001, 0x005, 0x007, 0x006, 0x00e, 0x20e, 0x20f, 0x210, 0x213, 0x216, 0x21f, 0x21e, 0x220, 0x201, 0x30f,
        0x314, 0x315, 0x313, 0x90b, 0x90a, 0x910, 0x91e, 0x105, 0x113]
acts = [(7, 0x03), (7, 0x07), (7, 0x5f), (7, 0x67), (7, 0x6a), (7, 0x83), (7, 0xb3), (7, 0xb4), (7, 0xb5), (7, 0xb6),
        (7, 0xb7), (7, 0xb8), (7, 0xb9), (10, 0x63), (10, 0x72), (11, 0x03), (11, 0x07), (14, 0), (12, 0xff), (12, 0),
        (2, 0), (6, 3)]
cases = []
for m, a, sev, (rage, tired), post in itertools.product(mots, acts, (0, 1), ((0, 0), (1, 0), (0, 1), (1, 1)), (0, 4, 1)):
    cases.append([m, a[0], a[1], sev, rage, tired, post])
js_in = [[v] + c for v in (0, 4) for c in cases]
out = json.loads(subprocess.run(['node', '-e', JS], input=json.dumps(js_in), capture_output=True, text=True, check=True).stdout)
js = {}
for c, w in zip(js_in, out): js[tuple(c)] = w
bad = 0; runs = {}
for var in (0, 4, 1, 2, 3, 5):
    jv = 4 if var == 4 else 0
    for c in cases:
        m, s, n, sev, rage, tired, post = c
        rom = g.run(VT, m=m, st=s, n=n, sever=sev, rage=rage, tired=tired, var=var, post=post)
        runs[var] = runs.get(var, 0) + 1
        want = js[tuple([jv] + c)]
        if rom != want:
            bad += 1
            if bad < 15: print('MISMATCH var', var, c, hex(rom), hex(want))
print('runs', runs, 'total', sum(runs.values()), 'mismatches', bad)
# named cases for the spec
for name, var, kw in [('L2 M22 (7,0x67) v0', 0, dict(m=0x216, st=7, n=0x67)), ('L2 M22 (7,0x67) v4', 4, dict(m=0x216, st=7, n=0x67)),
                      ('L2 M22 (7,0x07) v0', 0, dict(m=0x216, st=7, n=7)), ('L2 M22 (7,0x67) v0 severed', 0, dict(m=0x216, st=7, n=0x67, sever=1)),
                      ('L2 M15 (7,0x03) v0', 0, dict(m=0x20f, st=7, n=3)), ('L2 M15 (7,0xb4) v0', 0, dict(m=0x20f, st=7, n=0xb4)),
                      ('L2 M19 (7,0x83) v0', 0, dict(m=0x213, st=7, n=0x83)), ('L2 M19 (7,0xb8) v0', 0, dict(m=0x213, st=7, n=0xb8)),
                      ('L2 M31 (7,0xb5) v0', 0, dict(m=0x21f, st=7, n=0xb5)),
                      ('L0 M5 posture 0 v0', 0, dict(m=5)), ('L0 M5 posture 4 v0', 0, dict(m=5, post=4)),
                      ('L0 M7 posture 0 v0 enraged', 0, dict(m=7, rage=1)), ('L0 M7 posture 4 v0', 0, dict(m=7, post=4)),
                      ('L3 M20 (11,7) v0', 0, dict(m=0x314, st=11, n=7)), ('L3 M20 (10,0x63) v0', 0, dict(m=0x314, st=10, n=0x63)),
                      ('L2 M25 v0 intact / severed', 0, dict(m=0x219)), ('L2 M25 v0 severed', 0, dict(m=0x219, sever=1)),
                      ('L2 M24 v0 tired', 0, dict(m=0x218, tired=1)), ('L0 M1 v0 calm', 0, dict(m=1))]:
    print('%-32s %#010x' % (name, g.run(VT, var=var, **kw)))
