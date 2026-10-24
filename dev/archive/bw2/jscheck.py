# the proposed JS transcriptions vs the emulator (emu_bw.py = emu13c2.py), every combination: node runs the JS, unicorn the ROM
import subprocess, json, itertools, emu_fast as g, emu_bw
JS = r'''
const baseMask = ({ rage = false, tired = false } = {}) => 0x3f | (rage ? 0xe00 : tired ? 0x7000 : 0x1c0);
const em045 = v4 => (motion, action, state) => {
  const n = action && action[0] === 7 ? action[1] : -1;
  const beard = v4 && state.beardOff ? 0x18000000 : 0x6000000;
  const act = (n === 4 || n === 0x90) ? (state.tired ? 0x1800000 : 0x600000) : n === 2 ? (state.tired ? 0x180000 : 0x60000) : 0;
  if (motion === 0x201 || motion === 0x205 || motion === 0x20d || motion === 0x20e) return beard;
  if (motion === 0x202 || motion === 0x203) return act;
  if (motion === 0x20a) return beard | act;
  if (motion === 0x00b) return action && action[0] === 1 && (action[1] === 2 || action[1] === 0xc) ? 0x18000 : 0;
  if (motion === 0x006) return state.sunk ? 0 : 0x60000000;
  return 0;
};
function em055_00(motion, action, state){
  if (motion === 0x003 || motion === 0x004 || motion === 0x006 || motion === 0x00f) return state.sunk ? 0x1c0000 : 0xe00000;
  if (motion === 0x00b && action && action[0] === 1){
    if (action[1] === 2) return { set: 0, clear: 0xffffffff };
    if (action[1] === 0 || action[1] === 0xd) return 0x8000;
  }
  return 0;
}
const F = { em045_00: em045(false), em045_04: em045(true), em055_00 };
const cases = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(JSON.stringify(cases.map(([mon, m, s, n, sev, rage, tired, sunk]) => {
  const st = { rage: !!rage, tired: !!tired, beardOff: !!(sev & 2), severed: !!(sev & 1), sunk: !!sunk };
  const r = F[mon](m, [s, n], st);
  return (typeof r === 'object' ? ((baseMask(st) | r.set) & ~r.clear) : (baseMask(st) | r)) >>> 0;
})));
'''
POS = [(0, 0.0, -2000.0), (4, 0.0, -2000.0), (4, -2000.0, -2000.0), (4, -1800.0, -2000.0), (4, -1801.0, -2000.0), (0, -2000.0, -2000.0), (4, 0.0, 0.0), (4, -2000.0, 0.0)]
sunk = lambda p: 1 if (p[0] == 4 and p[1] < 0.9 * p[2]) else 0
SET = {
  'em045_00': (0x17c257c, 0, list(range(0x200, 0x210)) + [0x000, 0x001, 0x006, 0x00b, 0x00a, 0x011, 0x215, 0x106, 0x30b, 0x906],
               [(7, 0), (7, 1), (7, 2), (7, 3), (7, 4), (7, 5), (7, 0x8a), (7, 0x90), (7, 0x91), (1, 0), (1, 2), (1, 0xc), (1, 0xd), (2, 2), (6, 3), (10, 0x20)]),
  'em055_00': (0x17c8768, 0, list(range(0x000, 0x012)) + [0x103, 0x10b, 0x203, 0x219, 0x220, 0x30b],
               [(1, 0), (1, 1), (1, 2), (1, 0xc), (1, 0xd), (7, 2), (6, 5), (0, 0), (10, 0x2b)]),
}
SET['em045_04'] = (0x17c257c, 4, SET['em045_00'][2], SET['em045_00'][3])
tot = bad = 0
for mon, (vt, var, motions, actions) in SET.items():
    cases, roms = [], []
    for m, a, sev, rage, tired, p in itertools.product(motions, actions, (0, 1, 2, 3), (0, 1), (0, 1), POS):
        if rage and tired: continue
        cases.append([mon, m, a[0], a[1], sev, rage, tired, sunk(p)])
        roms.append(g.run(vt, m, a[0], a[1], sev, rage, tired, posture=p[0], p5c=p[1], moguri=p[2], variant=var))
    out = json.loads(subprocess.run(['node', '-e', JS], input=json.dumps(cases), capture_output=True, text=True, check=True).stdout)
    b = 0
    for c, js, rom in zip(cases, out, roms):
        if js != rom:
            b += 1
            if b < 8: print('MISMATCH', c, hex(rom), hex(js))
    print('%s: %d runs, %d mismatches' % (mon, len(cases), b)); tot += len(cases); bad += b
print('total %d runs, %d mismatches' % (tot, bad))
