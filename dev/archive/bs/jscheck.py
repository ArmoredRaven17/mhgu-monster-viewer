"""The spec transcriptions of uEm042_00 0xe70b78 and uEm077_00 0xfee088 (the JS functions, ported line for line) against
the ROM under unicorn (bw1/emu13c_bw.py: one instance, ARMv8 model), over motion x status x number x P+0x3b4 x rage x tired.
   python jscheck.py"""
import sys, os, itertools
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bw1'))
import emu13c_bw as E

def base(rage, tired):
    return 0x3f | (0xe00 if rage else 0x7000 if tired else 0x1c0)

A042 = lambda n: n in (0, 1, 0x0f, 0x14, 0x1c, 0x1e)
def em042_00(motion, action, st):
    n = action[1] if action and action[0] == 7 else -1
    if motion == 0x004:
        return 0x180000 if action and action[0] == 1 and action[1] in (0, 0x0e) else 0
    if st['severed']: return 0
    if motion == 0x208: return 0x18000 if A042(n) else 0
    if motion in (0x209, 0x20a): return 0x18000 if A042(n) else 0x60000 if n in (0x21, 0x22) else 0
    return 0

def em077_00(motion, action, st):
    n = action[1] if action and action[0] == 7 else -1
    act = 0x38000 if motion in (0x222, 0x21a) and 0x3a <= n <= 0x40 and (0x63 >> (n - 0x3a)) & 1 else 0
    return {'set': 0x1c0000 | act, 'clear': 0xe0} if st['severed'] else act

def word(fn, motion, action, st):
    r = fn(motion, action, st)
    b = base(st['rage'], st['tired'])
    if isinstance(r, dict): return ((b | r['set']) & ~r['clear']) & 0xffffffff
    return (b | r) & 0xffffffff

CASES = {
    'em042_00': (0x17be9a0, em042_00, [0x001, 0x004, 0x005, 0x207, 0x208, 0x209, 0x20a, 0x20b, 0x210, 0x220, 0x221, 0x30d, 0x111]),
    'em077_00': (0x17e7c08, em077_00, [0x001, 0x101, 0x203, 0x204, 0x214, 0x219, 0x21a, 0x221, 0x222, 0x223, 0x246, 0x30f]),
}
for mon, (vt, fn, motions) in CASES.items():
    runs = bad = 0
    for m, s, n, sev, rage, tired in itertools.product(motions, (0, 1, 6, 7, 13), range(0, 0x48), (0, 1, 2, 3), (0, 1), (0, 1)):
        got = E.run(vt, m=m, st=s, n=n, sever=sev, rage=rage, tired=tired)
        want = word(fn, m, (s, n), {'severed': bool(sev & 1), 'rage': rage, 'tired': tired})
        runs += 1
        if got != want:
            bad += 1
            if bad <= 10: print(mon, 'MISMATCH m %#x (%d, %#x) sev %d rage %d tired %d: rom %#x js %#x' % (m, s, n, sev, rage, tired, got, want))
    print('%s: %d runs, %d mismatches' % (mon, runs, bad))
