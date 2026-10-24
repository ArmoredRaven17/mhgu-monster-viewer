# the proposed JS transcriptions (uEm043_00, uEm044_00) vs the emulator, every combination: node runs the JS, unicorn the ROM
import subprocess, json, itertools, emu13c_bw as g
JS = r'''
const baseMask = ({ rage = false, tired = false } = {}) => 0x3f | (rage ? 0xe00 : tired ? 0x7000 : 0x1c0);
const EM043_TAIL = new Set([0x203, 0x204, 0x20a, 0x213, 0x214, 0x215]);
function em043(motion, action, state){
  if (EM043_TAIL.has(motion)) return state.severed ? 0 : 0x38000;
  if (motion === 0x005)
    return action && action[0] === 10 && (action[1] === 0xa7 || action[1] === 0x2a || action[1] === 0x70) ? 0 : 0x38000;
  if (motion === 0x006 || motion === 0x00b || motion === 0x00e) return state.sunk ? 0 : 0x38000;
  return 0;
}
function em044_00(motion, action, state){
  if (motion <= 0xf && ((0xa058 >>> motion) & 1)) return state.sunk ? 0 : 0x18000000;
  if (motion === 0x00b) return action && action[0] === 1 && (action[1] === 2 || action[1] === 0xe) ? 0x1800000 : 0;
  if (motion === 0x20c || motion === 0x20d){
    const m = (state.mud | 0) & 3;
    return m === 3 ? 0 : m === 0 ? 0x180000 : (m & 1) ? 0x60000 : 0x18000;
  }
  if (motion === 0x406 || motion === 0x407) return state.rank === 5 ? 0x600000 : 0;
  if (motion === 0x202) return state.severed ? 0 : 0x6000000;
  return 0;
}
const F = { 43: em043, 44: em044_00 };
const cases = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(JSON.stringify(cases.map(([cls, m, s, n, sev, rage, tired, sunk, mud, rank]) => {
  const st = { rage: !!rage, tired: !!rage ? false : !!tired, severed: !!sev, sunk: !!sunk, mud, rank };
  const r = F[cls](m, [s, n], st);
  return (typeof r === 'object' ? ((baseMask(st) | r.set) & ~r.clear) : (baseMask(st) | r)) >>> 0;
})));
'''
VT = {43: 0x17bfd1c, 44: 0x17c1434}
mot43 = [0x005, 0x006, 0x00b, 0x00e, 0x007, 0x00a, 0x00c, 0x00d, 0x203, 0x204, 0x20a, 0x213, 0x214, 0x215, 0x205,
         0x209, 0x210, 0x216, 0x202, 0x21f, 0x229, 0x30f, 0x403, 0x001]
mot44 = [0x003, 0x004, 0x006, 0x00d, 0x00f, 0x00b, 0x005, 0x00e, 0x010, 0x011, 0x201, 0x202, 0x20c, 0x20d, 0x20b,
         0x20e, 0x406, 0x407, 0x405, 0x408, 0x30b, 0x902]
act43 = [(10, 0xa7), (10, 0x2a), (10, 0x70), (10, 0x6e), (1, 2), (1, 0x12), (2, 0), (6, 3), (7, 0x2a), (0, 0)]
act44 = [(1, 2), (1, 0xe), (1, 0), (1, 0x14), (10, 0x2a), (2, 2), (7, 0xe), (6, 6), (0, 0)]
SUNK = {0: dict(post=0, p5c=0.0, mog=-1500.0), 1: dict(post=4, p5c=-1500.0, mog=-1500.0),
        2: dict(post=4, p5c=0.0, mog=-1500.0), 3: dict(post=0, p5c=-1500.0, mog=-1500.0)}
cases = []
for cls, mots, acts, muds, ranks in ((43, mot43, act43, (0,), (0, 5)), (44, mot44, act44, (0, 1, 2, 3, 0x3c, 0x3d, 0x3e, 0x3f, 0x22), (0, 1, 3, 5, 7))):
    for m in mots:
        md = muds if m in (0x20c, 0x20d) else (0, 0x3f)
        rk = ranks if m in (0x406, 0x407) else (0, 5)
        for a, sev, (rage, tired), sk, mud, rank in itertools.product(acts, (0, 1), ((0, 0), (1, 0), (0, 1)), (0, 1, 2, 3), md, rk):
            cases.append([cls, m, a[0], a[1], sev, rage, tired, sk, mud, rank])
js_in = [[c[0], c[1], c[2], c[3], c[4], c[5], c[6], 1 if c[7] == 1 else 0, c[8], c[9]] for c in cases]
out = json.loads(subprocess.run(['node', '-e', JS], input=json.dumps(js_in), capture_output=True, text=True, check=True).stdout)
bad = 0; per = {43: 0, 44: 0}
for c, js in zip(cases, out):
    cls, m, s, n, sev, rage, tired, sk, mud, rank = c
    for var in ((0, 5) if cls == 43 else (0,)):
        rom = g.run(VT[cls], m=m, st=s, n=n, sever=sev, rage=rage, tired=tired, var=var, mud=mud, rank=rank, **SUNK[sk])
        per[cls] += 1
        if rom != js:
            bad += 1
            if bad < 12: print('MISMATCH', c, 'var', var, hex(rom), hex(js))
print('runs', per, 'mismatches', bad)
