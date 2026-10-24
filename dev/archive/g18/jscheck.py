# the proposed JS transcription vs the emulator, every combination: node runs the JS, unicorn the ROM
import subprocess, json, itertools, emu13c_g as g
JS = r'''
const baseMask = ({ rage = false, tired = false } = {}) => 0x3f | (rage ? 0xe00 : tired ? 0x7000 : 0x1c0);
const em018 = v4 => (motion, action, state) => {
  if (motion === 0x007)
    return v4 && action && action[0] === 7 && action[1] >= 0xe3 && action[1] <= 0xe5 ? 0x38000000 : 0;
  if (motion === 0x168) return 0x7000000;
  if (motion === 0x202) return { set: 0, clear: 0x1240 };
  if (motion === 0x20c || motion === 0x441 || motion === 0x44d)
    return state.severed ? 0xe00000 : (v4 && (state.breakLevel7 | 0) >= 2) ? 0x1c0000 : 0x38000;
  return 0;
};
const F = { 0: em018(false), 4: em018(true) };
const cases = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(JSON.stringify(cases.map(([m, s, n, sev, rage, tired, v, lvl]) => {
  const st = { rage: !!rage, tired: !!rage ? false : !!tired, severed: !!sev, breakLevel7: lvl };
  const r = F[v](m, [s, n], st);
  return (typeof r === 'object' ? ((baseMask(st) | r.set) & ~r.clear) : (baseMask(st) | r)) >>> 0;
})));
'''
motions = [0x007, 0x168, 0x202, 0x20c, 0x441, 0x44d, 0x006, 0x20b, 0x44c, 0x90a, 0x203]
actions = [(7, 0xe2), (7, 0xe3), (7, 0xe4), (7, 0xe5), (7, 0xe6), (2, 2), (7, 2), (0, 0)]
cases = [list(c) for c in itertools.product(motions, actions, (0, 1), (0, 1), (0, 1), (0, 4), (0, 1, 2, 3))
         if not (c[2] and c[3])]
cases = [[m, a[0], a[1], sev, rage, tired, v, lvl] for m, a, rage, tired, sev, v, lvl in
         [(c[0], c[1], c[2], c[3], c[4], c[5], c[6]) for c in cases]]
out = json.loads(subprocess.run(['node', '-e', JS], input=json.dumps(cases), capture_output=True, text=True, check=True).stdout)
bad = 0
for c, js in zip(cases, out):
    m, s, n, sev, rage, tired, v, lvl = c
    for rank in (0, 5):
        rom = g.run(0x17abb38, m, s, n, sev, rage, tired, v, lvl, rank)
        if rom != js:
            bad += 1
            if bad < 10: print('MISMATCH', c, rank, hex(rom), hex(js))
print('%d cases x 2 ranks, %d mismatches' % (len(cases), bad))
