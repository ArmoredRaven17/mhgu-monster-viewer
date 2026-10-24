# the proposed JS transcriptions (uEm003_00 Khezu, uEm004_00's em-5 arm Gravios) vs the ROM under unicorn, every
# combination: node runs the JS (pslMask's own combine: (base | set) & ~clear), unicorn runs 0xd0f728 / 0xd2e0ec.
import subprocess, json, itertools, emu_kg as g
JS = r'''
const baseMask = ({ rage = false, tired = false } = {}) => 0x3f | (rage ? 0xe00 : tired ? 0x7000 : 0x1c0);
const EM003_S7_OFF = 0x00004000_00011000 ;
'''
JS = r'''
const baseMask = ({ rage = false, tired = false } = {}) => 0x3f | (rage ? 0xe00 : tired ? 0x7000 : 0x1c0);
const EM003_OFF7 = new Set([0x00, 0x02, 0x0f, 0x11, 0x12, 0x30, 0x44, 0x48, 0x4e]);
const EM003_ON7  = new Set([0x09, 0x0a, 0x0b, 0x10, 0x3b, 0x49, 0x4f]);
const EM003_OFF3 = new Set([0x43, 0x4f, 0x55]);
const EM003_OFF2 = new Set([0x00, 0x05, 0x06, 0x07, 0x08, 0x0a, 0x0e]);
function em003_00(motion, action, state){
  const s = action ? action[0] : -1, n = action ? action[1] : -1;
  const off = (s === 7 && EM003_OFF7.has(n)) || (s === 3 && EM003_OFF3.has(n)) || (s === 2 && EM003_OFF2.has(n));
  let set = (s === 7 && EM003_ON7.has(n)) ? 0xe00 : 0;
  const a52 = s === 7 && n === 0x52;
  if (motion === 0x226) set |= a52 ? 0x180000 : 0;
  else if (motion === 0x225) set |= (a52 && (state.phase | 0) === 3) ? 0x60000 : 0x18000;
  return { set, clear: off ? 0xe00 : 0 };
}
const EM005_GAS = new Set([0x203, 0x204, 0x21e, 0x21f, 0x220]);
const EM005_BEAM = new Set([0x218, 0x221, 0x43b]);
function em005_00(motion, action, state){
  const n = action && action[0] === 7 ? action[1] : -1;
  if (EM005_GAS.has(motion)){
    if (n === 0x0a || n === 0x32 || n === 0x3c) return state.backBroken ? 0x180000 : 0x18000;
    if (n === 0x07 || n === 0x3b) return state.backBroken ? 0x600000 : 0x60000;
    return 0;
  }
  if (EM005_BEAM.has(motion)){
    if (n !== 0x0e && n !== 0x11 && n !== 0x34) return 0;
    return state.backBroken ? 0xe0000000 : state.bellyBroken ? 0x3800000 : 0;
  }
  if (motion === 0x007) return state.sunk ? 0 : 0x18000000;
  return 0;
}
const F = { 3: em003_00, 5: em005_00 };
const cases = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(JSON.stringify(cases.map(([em, m, s, n, rage, tired, st]) => {
  const state = Object.assign({ rage: !!rage, tired: !!rage ? false : !!tired }, st);
  const r = F[em](m, s < 0 ? null : [s, n], state);
  return (typeof r === 'object' ? ((baseMask(state) | r.set) & ~r.clear) : (baseMask(state) | r)) >>> 0;
})));
'''
VT = {3: 0x17958f0, 5: 0x1797c8c}
cases = []   # (em, motion, status, number, rage, tired, js state, rom kwargs)
# KHEZU: every motion his PSLs name, a spread of others, statuses 0..13 x numbers 0..0x5f (+0xff), phase 0..4
mot3 = [0x006, 0x015, 0x203, 0x204, 0x205, 0x20a, 0x20c, 0x20d, 0x21c, 0x21d, 0x224, 0x225, 0x226, 0x227, 0x229,
        0x22b, 0x233, 0x23b, 0x23c, 0x23d, 0x240, 0x242, 0x243, 0x24a, 0x24b, 0x001, 0x002, 0x00f, 0x301, 0x302, 0x501,
        0x505, 0x525, 0x102]
for m in mot3:
    for s in (0, 1, 2, 3, 6, 7, 10, 11, 13):
        nums = list(range(0, 0x60)) + [0xff] if s in (2, 3, 7) else [0, 2, 0x0a, 0x43, 0x52, 0xff]
        for n in nums:
            for rage, tired in ((0, 0), (1, 0), (0, 1)):
                phases = (0, 1, 2, 3, 4) if m in (0x225, 0x226) and (s, n) in ((7, 0x52), (7, 0x2c)) else (0, 3)
                for ph in phases:
                    cases.append((3, m, s, n, rage, tired, {'phase': ph}, dict(em=3, phase=ph, dtp='em003_00')))
# GRAVIOS: em 5, every keyed motion and neighbours; part 0 level 0..3 x rank 0 / 3 / 5 / 6, ctl24 0..7 (consistent with
# the levels as the action start builds it: bit 2 = back, bit 1 = belly row 2), posture / burrow
mot5 = [0x007, 0x006, 0x008, 0x203, 0x204, 0x205, 0x218, 0x219, 0x21a, 0x21b, 0x21d, 0x21e, 0x21f, 0x220, 0x221,
        0x222, 0x22e, 0x232, 0x43b, 0x43c, 0x405, 0x001, 0x30a]
def thr(rank, lo, hi): return lo if rank <= 4 else hi
for m in mot5:
    for s in (1, 2, 6, 7, 13):
        nums = list(range(0, 0x48)) if s == 7 else [0, 1, 3, 0x0a, 0x34]
        for n in nums:
            for rage, tired in ((0, 0), (1, 0), (0, 1)):
                for lv0, lv6, rank in itertools.product((0, 1, 2), (0, 2), (0, 5)):
                    back = lv0 >= thr(rank, 1, 2); belly = lv6 >= 2
                    ctl = (4 if back else 0) | (2 if belly else 0)
                    sunks = ((0, 0.0, -2000.0, False), (4, -2000.0, -2000.0, True), (4, 0.0, -2000.0, False)) if m == 7 else ((0, 0.0, -2000.0, False),)
                    for post, p5c, mog, sunk in sunks:
                        cases.append((5, m, s, n, rage, tired, {'backBroken': back, 'bellyBroken': belly, 'sunk': sunk},
                                      dict(em=5, ctl24=ctl, lv=[lv0, 0, 0, 0, 0, 0, lv6, 0], rank=rank, dtp='em005_00',
                                           post=post, p5c=p5c, mog=mog)))
js_in = [[c[0], c[1], c[2], c[3], c[4], c[5], c[6]] for c in cases]
out = json.loads(subprocess.run(['node', '-e', JS], input=json.dumps(js_in), capture_output=True, text=True, check=True).stdout)
bad = 0; per = {3: 0, 5: 0}; words = {}
for c, js in zip(cases, out):
    em, m, s, n, rage, tired, st, kw = c
    rom = g.run(VT[em], m=m, st=s, n=n, rage=rage, tired=tired, **kw)
    per[em] += 1
    words.setdefault(em, set()).add(rom)
    if rom != js:
        bad += 1
        if bad < 15: print('MISMATCH', em, hex(m), (s, hex(n)), rage, tired, st, hex(rom), hex(js))
print('runs', per, 'mismatches', bad)
for em in words: print(em, 'distinct words', sorted(hex(w) for w in words[em]))
