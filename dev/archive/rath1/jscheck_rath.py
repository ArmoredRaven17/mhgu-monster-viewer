# em001.js (the proposed uEm001_00 vt+0x13c transcription for em 1) vs the ROM under unicorn, every combination
import subprocess, json, itertools, time, sys
import emu13c_rath as R
VT = 0x1793c28
mots = [0x001, 0x00f, 0x010, 0x011, 0x012, 0x200, 0x201, 0x202, 0x203, 0x204, 0x205, 0x215, 0x405, 0x406, 0x407,
        0x41f, 0x420, 0x426, 0x431, 0x432, 0x434, 0x437, 0x440, 0x441, 0x442, 0x901, 0x902, 0x906, 0x907, 0x30f]
acts = [(1, 7), (1, 8), (1, 9), (1, 4), (7, 0xf5), (7, 0xf4), (7, 0x29), (7, 3), (7, 0x2b), (7, 0x77), (0, 0), (10, 7)]
RT = [(0, 0), (1, 0), (0, 1), (1, 1)]
STATES = {0: [(l, q, r) for l in (0, 2) for q in (0, 10) for r in (5,)],
          2: [(l, q, r) for l in (0, 2) for q in (0, 10) for r in (5,)],
          4: [(l, q, r) for l in (0, 1, 2, 3) for q in (0, 5, 6, 10, -1) for r in (0, 3, 5)]}
cases = []
for v, sts in STATES.items():
    for m, a, sev, (rage, tired), (l, q, r) in itertools.product(mots, acts, (0, 1), RT, sts):
        cases.append([v, m, a[0], a[1], sev, rage, tired, l, q, r])
if '--quick' in sys.argv: cases = cases[::37]
out = json.loads(subprocess.run(['node', 'em001.js'], input=json.dumps(cases), capture_output=True, text=True, check=True).stdout)
t = time.time(); bad = 0; words = {}
for c, js in zip(cases, out):
    v, m, s, n, sev, rage, tired, l, q, r = c
    rom = R.run(VT, em=1, var=v, m=m, st=s, n=n, sever=sev, rage=rage, tired=tired, lvl7=l, ql=q, rank=r,
                dtp='em001_04' if v == 4 else None)
    words.setdefault((v, m), set()).add(rom)
    if rom != js:
        bad += 1
        if bad < 15: print('MISMATCH', c, hex(rom), hex(js))
print('runs', len(cases), 'mismatches', bad, '%.0fs' % (time.time() - t))
json.dump({'%d:%#x' % k: sorted('%#x' % w for w in v) for k, v in words.items()}, open('words.json', 'w'), indent=0)
