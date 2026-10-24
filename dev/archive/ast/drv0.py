"""drv.py -- run Boltreaver's (uEm081_00, variant 4) status-7 action bodies tick by tick under unicorn.

Per tick: the status-7 handler 0x1023a6c(E) with E+0x73e0 = 7, +0x73e1 = number. The motion is simulated: a setMotion
stub (0xafe84 / 0xafce8 / 0xafe8c / 0xafd..) records the id and restarts the clip at frame 0; each tick advances it
by STEP (motion frames) and writes the fields the REAL frame gate 0x72714 reads (+0x500 prev, +0x13b8 step, +0x13ac /
+0x13b4 for channel 1, +0x13bc length, +0x508 loop 0, +0x4f4 gate 0, +0x1c dt); 0x72714 and its wrappers run for real.
The ended flag (0xb09c8 -> 0x94dc04: byte +0x4b6 bit 2) is set on the tick the clip reaches its length.
Code inside the class band 0x1010f54..0x1036000 runs for real (bodies, spawners); everything else is stubbed:
0x6f618 / 0x6f62c (action tune float / int: the arc's em081_00_actiontune), 0x3a8430 (rank: RANK), allocators,
0x48b884 (submit: logged with the request), vtable chains (logged), any other call -> 0 (logged once per site)."""
import sys, struct, json, os
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, shellef
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *

HERE = os.path.dirname(os.path.abspath(__file__))
T = armdis.TEXT
E, B, HEAP, STOP, STK = 0x30000000, 0x30400000, 0x31000000, 0x50000000, 0x4000f000
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
ro = armdis.RO_VA & ~0xfff
mu.mem_map(ro, ((armdis.RO_VA + len(armdis.RODATA) - ro) + 0xfff) & ~0xfff); mu.mem_write(armdis.RO_VA, armdis.RODATA)
da = armdis.DA_VA & ~0xfff
mu.mem_map(da, 0x2400000 - da); mu.mem_write(armdis.DA_VA, armdis.DATA)
for base, size in ((E, 0x200000), (B, 0x200000), (HEAP, 0x400000), (0x40000000, 0x10000), (STOP, 0x1000)):
    mu.mem_map(base, size)
# the engine's constant vectors (.bss, static initializer 0x7c4408): zero vec 0x19176b0, unit Z 0x1917700
mu.mem_write(0x1917700, struct.pack('<4f', 0, 0, 1, 0))
TUNE = shellef.fup(open(r'C:\MHGU-Extract\scratch-em\em081_00\enemy\action_tune\em081_00_actiontune.fup', 'rb').read())
MOT = json.load(open(os.path.join(HERE, 'motions.json')))
BAND = (0x1010f54, 0x1036000)
RUNREAL = [(0x72714, 0x72c00), (0xb0968, 0xb09d0), (0x94dc04, 0x94dc40), (0xb0900, 0xb0968)]
RANK = [5]
TAILTIER = [0]
CHARGE = [None]
log = []
st = {'mid': None, 'prev': 0.0, 'cur': 0.0, 'len': 1000.0, 'ended': False, 'stop': None}
heap = [HEAP]
def alloc(uc):
    a = heap[0]; heap[0] += 0x200; uc.mem_write(a, b'\0' * 0x200); return a
def sreg(uc, n): return struct.unpack('<f', struct.pack('<I', uc.reg_read(UC_ARM_REG_S0 + n)))[0]
def set_s0(uc, v): uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', v))[0])
def mlen(mid):
    L, M = mid >> 8, mid & 0xff
    n = MOT.get(str(L), {}).get('Motion[%d]' % M)
    return float(n) if n else 1000.0
def set_motion(uc, kind):
    mid = uc.reg_read(UC_ARM_REG_R1) & 0xffff
    s1 = sreg(uc, 1) if kind in ('afe84', 'afe8c', 'afce8', 'afef0') else 0.0
    st.update(mid=mid, prev=s1, cur=s1, start=s1, len=mlen(mid), ended=False, fresh=True)
    log.append(('setMotion', kind, 'L%d M%d' % (mid >> 8, mid & 0xff), round(sreg(uc, 0), 3), round(sreg(uc, 1), 3)))
    uc.mem_write(E + 0x4b4, struct.pack('<H', mid))
    return 0
def req(uc, r):
    b = bytes(uc.mem_read(r, 0x50)); w = struct.unpack('<20I', b)
    return 'id %#x mode %d' % (w[1], w[2])
def stub_ret(uc, v):
    uc.reg_write(UC_ARM_REG_R0, v & 0xffffffff)
    uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))
STUBS = {
    0x6f618: lambda uc: (set_s0(uc, TUNE['floats'][uc.reg_read(UC_ARM_REG_R1)] if uc.reg_read(UC_ARM_REG_R1) < len(TUNE['floats']) else 0.0), 0)[1],
    0x6f62c: lambda uc: TUNE['ints'][uc.reg_read(UC_ARM_REG_R1)] if uc.reg_read(UC_ARM_REG_R1) < len(TUNE['ints']) else 0,
    0x3a8430: lambda uc: RANK[0],
    0x3f883c: alloc, 0x3fa2bc: alloc, 0x3fb7bc: alloc, 0x3fd7e0: alloc, 0x427c00: alloc,
    0xafe84: lambda uc: set_motion(uc, 'afe84'), 0xafef0: lambda uc: set_motion(uc, 'afef0'), 0xb03f8: lambda uc: set_motion(uc, 'b03f8'), 0xb04d0: lambda uc: set_motion(uc, 'b04d0'), 0xafce8: lambda uc: set_motion(uc, 'afce8'), 0xafe8c: lambda uc: set_motion(uc, 'afe8c'),
}
NAMED = {0xaf4dc: 'END(af4dc)', 0x48b884: 'SUBMIT', 0x6c178: 'vt3d0(chain)', 0x768c8: 'chain768c8', 0xb07b4: 'speed', 0x16b4b4: 'serial',
         0x81614: '81614', 0x81670: 'enraged?', 0x9d36c: 'breakLevel', 0x7ded8: '7ded8', 0x782e4: '782e4'}
seen_calls = {}
def hook(uc, addr, size, ud):
    if BAND[0] <= addr < BAND[1] or any(lo <= addr < hi for lo, hi in RUNREAL): return
    lr = uc.reg_read(UC_ARM_REG_LR)
    if addr == 0x48b884:
        log.append(('SUBMIT', req(uc, uc.reg_read(UC_ARM_REG_R1)), 'L%d M%d f%g' % (st['mid'] >> 8, st['mid'] & 0xff, st['cur']) if st['mid'] is not None else '-', hex(lr)))
        return stub_ret(uc, 1)
    if addr in STUBS:
        return stub_ret(uc, STUBS[addr](uc))
    key = (addr, lr)
    if key not in seen_calls:
        seen_calls[key] = 1
        log.append(('call', NAMED.get(addr, hex(addr)), 'r1=%#x r2=%#x s0=%g' % (uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2), sreg(uc, 0)), hex(lr)))
    # a vtable chain to the next action / the end: stop this action
    if addr == 0xaf4dc:
        st['stop'] = 'end (af4dc -> vt+0x3dc)'
    if addr in (0x6c178, 0x768c8):
        st['stop'] = 'chain (%d, %#x)' % (uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2))
    return stub_ret(uc, 0)
mu.hook_add(UC_HOOK_CODE, hook)

def wf(a, v): mu.mem_write(a, struct.pack('<f', v))
def setup(num, mem=None):
    mu.mem_write(E, b'\0' * 0x30000); mu.mem_write(B, b'\0' * 0x8000)
    mu.mem_write(E, struct.pack('<I', 0x17ec1b0))
    mu.mem_write(E + 0x1428, struct.pack('<I', B))
    mu.mem_write(E + 0x73e0, bytes([7, num]))
    mu.mem_write(E + 0xb5f4, bytes([0x51, 0]))
    for off, i in ((0xcbac, 0x14c), (0xcbb0, 0x14d), (0xcbb4, 0x19d), (0xcbb8, 0x19d), (0xcbbc, 0x19d), (0xcbc0, 0x14e), (0xcbc4, 0x14f), (0xcbc8, 0x19d)):
        mu.mem_write(E + off, struct.pack('<I', i))
    mu.mem_write(E + 0xcb03, bytes([TAILTIER[0]]))  # variant 0 (Astalos): drv0
    if CHARGE[0] is not None: mu.mem_write(E + 0xcb01, bytes([CHARGE[0]] * 3))
    for a, v in (mem or {}).items():
        mu.mem_write(a, v if isinstance(v, (bytes, bytearray)) else struct.pack('<I', v & 0xffffffff))
    st.update(mid=None, prev=0.0, cur=0.0, len=1000.0, ended=False, stop=None, fresh=False)
    heap[0] = HEAP
def frame_fields(step):
    wf(E + 0x500, st['prev']); wf(E + 0x13b8, step); wf(E + 0x13ac, st['prev']); wf(E + 0x13b4, step)
    wf(E + 0x13bc, st['len']); wf(E + 0x508, 0.0); wf(E + 0x4f4, 0.0); wf(E + 0x1c, 1.0)
    b = bytes(mu.mem_read(E + 0x4b6, 1))[0]
    mu.mem_write(E + 0x4b6, bytes([(b | 4) if st['ended'] else (b & ~4)]))
def run(num, ticks=400, step=1.0, mem=None, quiet=False):
    setup(num, mem)
    out = []
    seen_calls.clear()
    for t in range(ticks):
        # the clock: a motion set last tick advances now (its first tick tests [0, 0]: fresh)
        if st['mid'] is not None:
            if st.get('fresh'):
                st['fresh'] = False; st['prev'] = st['cur'] = st.get('start', 0.0); stp = 0.0
            else:
                st['prev'] = st['cur']; st['cur'] = min(st['cur'] + step, st['len']); stp = st['cur'] - st['prev']
                if st['cur'] >= st['len']: st['ended'] = True
        else:
            stp = step
        frame_fields(stp)
        del log[:]
        mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, STOP); mu.reg_write(UC_ARM_REG_R0, E)
        try:
            mu.emu_start(0x1023a6c, STOP, count=200000)
        except Exception as ex:
            log.append(('ERR', str(ex), hex(mu.reg_read(UC_ARM_REG_PC))))
        ph = bytes(mu.mem_read(B + 0x1a1, 1))[0]
        for l in log:
            out.append((t, st['mid'], st['cur'], ph) + l)
        if st['stop'] or any(l[0] == 'ERR' for l in log): break
    return out

if __name__ == '__main__':
    num = int(sys.argv[1], 16)
    if len(sys.argv) > 2: RANK[0] = int(sys.argv[2])
    for row in run(num):
        t, mid, cur, ph = row[:4]
        print('t%3d %s f%-6g ph%d  %s' % (t, ('L%d M%d' % (mid >> 8, mid & 0xff)) if mid is not None else '-', cur, ph, '  '.join(str(x) for x in row[4:])))
