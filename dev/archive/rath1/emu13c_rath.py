"""Unicorn run of uEm001_00's enemy vt+0x13c (0xd09054, the PSL enable word) -- a copy of bw1/emu13c_bw.py plus the em
byte e+0xb5f4, the enemy id halfword e+0xb5f0, and 0x49930 (the quest's number: GOT 0x1831c54 -> quest -> 0x3a8470)
answered by a hook with `ql`. dtp = 'em001_04' etc. loads that monster's .dtp array (bytes from +0x4d) as [[e+0x75f0]+0x64].
   python emu13c_rath.py <vtable hex> <case...>   case = key=value,... (m st n sever rage tired var em eid lvl7 rank ql dtp)"""
import sys, os, struct
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bw1'))
import emu13c_bw as B
from unicorn.arm_const import *
from unicorn import UC_HOOK_CODE

def dtpA(mon):
    p = r'C:\MHGU-Extract\scratch-em\%s\enemy\dt_base\%s_dtbparts.dtp' % (mon, mon)
    b = open(p, 'rb').read()
    return b[0x4d:0x4d + 4 * b[8]]

_QL = [0]
_hooked = [False]
def _setup():
    mu = B._mu()
    if not _hooked[0]:
        def h(uc, addr, size, ud):
            B._SEEN.add(addr)
            uc.reg_write(UC_ARM_REG_R0, _QL[0] & 0xffffffff); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
        mu.hook_add(UC_HOOK_CODE, h, begin=0x49930, end=0x49930)
        for a in (0x9d36c, 0x81614):
            mu.hook_add(UC_HOOK_CODE, lambda uc, addr, size, ud: B._SEEN.add(addr), begin=a, end=a)
        _hooked[0] = True
    return mu

_orig_write = None
def run(vt, em=1, eid=None, ql=0, dtp=None, calls=None, **kw):
    mu = _setup()
    _QL[0] = ql
    var = kw.get('var', 0)
    if eid is None: eid = (var << 8) | em
    # B.run zeroes E / P / RES and writes its fields; patch em / eid / dtp through a one-shot code hook at the entry
    fn = struct.unpack_from('<I', B.DATA, vt + 0x13c - B.DA_VA)[0]
    def pre(uc, addr, size, ud):
        uc.mem_write(B.E + 0xb5f4, bytes([em]))
        uc.mem_write(B.E + 0xb5f0, struct.pack('<H', eid))
        if dtp: uc.mem_write(B.ARR, dtpA(dtp))
    hk = mu.hook_add(UC_HOOK_CODE, pre, begin=fn, end=fn)
    try:
        return B.run(vt, calls=calls, **kw)
    finally:
        mu.hook_del(hk)

def parse(c):
    kw = {}
    for kv in c.split(','):
        k, v = kv.split('=')
        kw[k] = v if k == 'dtp' else int(v, 0)
    return kw

if __name__ == '__main__':
    vt = int(sys.argv[1], 16)
    for c in sys.argv[2:]:
        s = set()
        w = run(vt, calls=s, **parse(c))
        print('%-60s %#010x   %s' % (c, w, ' '.join('%#x' % a for a in sorted(s))))
