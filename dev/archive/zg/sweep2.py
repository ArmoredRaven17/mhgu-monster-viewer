"""The fully hooked tracer over a class's action main: for every (status, number, phase, ended), the motions set directly (all
eight setMotion wrappers, tracec.py) AND the motions its status script names (ops 0 / 2 records; op 0xfe with an arg = a follow
action, recorded). One JSON line per action.   CLS=uEmNNN_00 EM=NN python sweep2.py <variant> > out.jsonl"""
import sys, re, json, struct, tracec as TR
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
D = armdis.DATA; DA = armdis.DA_VA
def script(a):
    mots, follow = [], None
    for i in range(48):
        op, arg = struct.unpack_from('<II', D, a - DA + 8 * i)
        if op == 0xff: break
        if op == 0xfe:
            if DA <= arg < DA + len(D): follow = list(D[arg - DA:arg - DA + 2])
            break
        if op in (0, 2, 0x35) and DA <= arg < DA + len(D):
            m = struct.unpack_from('<I', D, arg - DA)[0]
            mots.append('L%d M%d' % ((m >> 8) & 0xf, m & 0xff))
    return mots, follow
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_R0, UC_ARM_REG_PC, UC_ARM_REG_LR
K = {'v': None}
def _part(uc, addr, size, ud):
    if K['v'] is not None and addr in (0x9e8d8, 0x9e8c0):
        uc.reg_write(UC_ARM_REG_R0, K['v']); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
TR.mu.hook_add(UC_HOOK_CODE, _part, begin=0x9e8c0, end=0x9e8d8)
var = int(sys.argv[1], 0)
for st in range(0, 0x12):
    for n in range(0, 0x100):
        mot, scr, fol = set(), set(), set()
        for k in ((None,) + tuple(range(8)) if st == 10 else (None,)):
          K['v'] = k
          for ph in range(0, 4):
            for e in (0, 1):
                for x in TR.run(var, st, n, ph, e, e, 0, follows=1):
                    m = re.search(r'MOT L(\d+) M(\d+) \(', x)
                    if m: mot.add('L%s M%s' % (m.group(1), m.group(2)))
                    m = re.search(r'SCRIPT (0x[0-9a-f]+)', x)
                    if m:
                        a = int(m.group(1), 16)
                        if DA <= a < DA + len(D):
                            ms, f = script(a); scr.update(ms)
                            if f: fol.add(tuple(f))
        if mot or scr or fol:
            print(json.dumps({'a': [st, n], 'mot': sorted(mot), 'scr': sorted(scr), 'follow': sorted(fol)}), flush=True)
