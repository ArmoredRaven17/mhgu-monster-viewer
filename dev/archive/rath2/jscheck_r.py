# the proposed JS transcription of uEm001_00 vt+0x13c (0xd09054) for em 2 (Rathalos / Silver / Dreadking) vs the
# emulator, every combination: node runs the JS, unicorn the ROM
import subprocess, json, itertools, emu13c_r as g
JS = r'''
const baseMask = ({ rage = false, tired = false } = {}) => 0x3f | (rage ? 0xe00 : tired ? 0x7000 : 0x1c0);
const EM002_L4M32 = n => n === 0x03 || n === 0x29 || n === 0x2b || n === 0x2c || n === 0x48 || n === 0x49;
const em002 = (silver, v4) => (motion, action, state) => {
  const s = action ? action[0] : -1, n = action ? action[1] : -1;
  if (motion === 0x203 || motion === 0x204){
    if (state.severed) return 0xe00000;
    const q = state.questLevel;
    if (v4 && ((state.breakLevel7 | 0) >= 2 || (q != null && (q >>> 0) <= 5))) return 0x1c0000;
    return 0x38000;
  }
  if (motion === 0x201) return silver && !state.tired ? 0x7000000 : 0;
  if (motion === 0x420) return s === 7 && !state.tired && EM002_L4M32(n) ? 0x38000000 : 0;
  if (motion === 0x426) return s === 7 && n === 0xf5 ? { set: 0xc0000000, clear: 0x1fc0 } : 0;
  if (motion === 0x010 || motion === 0x011) return s === 1 && (n === 7 || n === 8) ? 0xc0000 : 0;
  return 0;
};
const F = { 0: em002(false, false), 2: em002(true, false), 4: em002(false, true) };
const cases = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(JSON.stringify(cases.map(([v, m, s, n, sev, rage, tired, lvl7, q]) => {
  const st = { rage: !!rage, tired: !!tired, severed: !!sev, breakLevel7: lvl7, questLevel: q };
  const r = F[v](m, [s, n], st);
  return (typeof r === 'object' ? ((baseMask(st) | r.set) & ~r.clear) : (baseMask(st) | r)) >>> 0;
})));
'''
mots = [0x001, 0x00f, 0x010, 0x011, 0x012, 0x200, 0x201, 0x202, 0x203, 0x204, 0x205, 0x20f, 0x215, 0x30f, 0x405,
        0x406, 0x407, 0x41f, 0x420, 0x421, 0x425, 0x426, 0x427, 0x432, 0x434, 0x437, 0x441, 0x442, 0x901, 0x902, 0x906, 0x90b]
acts = [(7, 3), (7, 0x29), (7, 0x2a), (7, 0x2b), (7, 0x2c), (7, 0x2d), (7, 0x48), (7, 0x49), (7, 0x4a), (7, 0xf5), (7, 0xf4),
        (7, 0x43), (1, 7), (1, 8), (1, 6), (1, 9), (1, 4), (2, 4), (9, 3), (0, 0), (1, 0xf5), (7, 0x0c)]
cases = []
for v in (0, 2, 4):
    for m in mots:
        a_list = acts if m in (0x010, 0x011, 0x420, 0x426) else [(0, 0), (7, 0x0c), (7, 0xf5), (1, 7)]
        lv = (0, 1, 2) if m in (0x203, 0x204) else (0,)
        qs = (0, 5, 6, 10, -1) if m in (0x203, 0x204) else (10,)
        for a, sev, (rage, tired), lvl7, q in itertools.product(a_list, (0, 1), ((0, 0), (1, 0), (0, 1), (1, 1)), lv, qs):
            cases.append([v, m, a[0], a[1], sev, rage, tired, lvl7, q])
out = json.loads(subprocess.run(['node', '-e', JS], input=json.dumps(cases), capture_output=True, text=True, check=True).stdout)
bad = 0; n = 0
for c, js in zip(cases, out):
    v, m, s, nn, sev, rage, tired, lvl7, q = c
    for rank in (1, 5):
        rom = g.run(m=m, st=s, n=nn, sever=sev, rage=rage, tired=tired, var=v, em=2, lvl7=lvl7, q=q, rank=rank)
        n += 1
        if rom != js:
            bad += 1
            if bad < 15: print('MISMATCH', c, 'rank', rank, hex(rom), hex(js))
print('runs', n, 'mismatches', bad)
