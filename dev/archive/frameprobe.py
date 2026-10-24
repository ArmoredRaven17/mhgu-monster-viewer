"""Run a class's per-frame handler (vt+0x208) under unicorn, frame by frame over a motion, and record every shell
create 0x48b884 (setup +4 id, +8 mode) and every class effect request (vt+0x1cc / +0x1d0 are stubbed: logged by the
call-site address).
   python frameprobe.py <handler hex> <band lo hex> <band hi hex> <motion hex>[,...] [--frames N] [--ret 0|1]
                        [--act S:N] [--cac0 OFF=BYTE,...] [--variant V] [--em EM]
Real code: the class band, the motion getter / frame queries (0xb0944..0xb09d0, 0x72714..0x72b40), the action test
0x6fe88. Every other call is stubbed to return --ret. The frame queries see prev = f - 1, step 1.0, gate 0."""
import sys, os, struct, argparse
from unicorn import Uc, UC_ARCH_ARM, UC_MODE_ARM, UC_HOOK_CODE
from unicorn.arm_const import *
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read()
RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
pg = lambda n: (n + 0xfff) & ~0xfff
E, P, C, HEAP, STK, STOP = 0x30000000, 0x30100000, 0x30180000, 0x30200000, 0x4000f000, 0x50000000

ap = argparse.ArgumentParser()
ap.add_argument('handler'); ap.add_argument('lo'); ap.add_argument('hi'); ap.add_argument('motions')
ap.add_argument('--frames', type=int, default=400); ap.add_argument('--ret', type=int, default=0)
ap.add_argument('--act', default='0:0'); ap.add_argument('--cac0', default='')
ap.add_argument('--variant', type=int, default=0); ap.add_argument('--em', type=int, default=0)
ap.add_argument('--vt', default='0'); ap.add_argument('--skip', default='')
a = ap.parse_args()
H, LO, HI = int(a.handler, 16), int(a.lo, 16), int(a.hi, 16)
SKIP = {int(x, 16) for x in a.skip.split(',') if x}
REAL = [(LO, HI), (0xb0944, 0xb09d0), (0x72714, 0x72b40), (0x6fe88, 0x6feb8)]

mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
mu.mem_map(0, pg(len(TEXT))); mu.mem_write(0, TEXT)
mu.mem_map(RO_VA, pg(len(RO))); mu.mem_write(RO_VA, RO)
mu.mem_map(DA_VA, pg(len(DATA)) + 0x800000); mu.mem_write(DA_VA, DATA)
mu.mem_map(E, 0x400000); mu.mem_map(0x40000000, 0x10000); mu.mem_map(STOP, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20)); mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
log = []
heap = [HEAP]


def hook(uc, addr, size, ud):
    if addr == STOP or (addr not in SKIP and any(l <= addr < h for l, h in REAL)):
        return
    lr = uc.reg_read(UC_ARM_REG_LR)
    if addr == 0x48b884:
        s = uc.reg_read(UC_ARM_REG_R1)
        sid, mode = struct.unpack('<II', bytes(uc.mem_read(s + 4, 8)))
        log.append(('shell', hex(sid), mode, hex(lr - 4)))
        uc.reg_write(UC_ARM_REG_R0, 1)
    elif addr == 0x3fa2bc or addr == 0x3f883c:
        b = heap[0]; heap[0] += 0x200
        uc.mem_write(b, b'\0' * 0x200)
        uc.reg_write(UC_ARM_REG_R0, b)
    else:
        log.append(('call', hex(addr), hex(lr - 4)))
        uc.reg_write(UC_ARM_REG_R0, a.ret)
    uc.reg_write(UC_ARM_REG_PC, lr)


mu.hook_add(UC_HOOK_CODE, hook)
f32 = lambda x: struct.pack('<f', x)
st, nm = (int(x, 0) for x in a.act.split(':'))


def run(motion, f):
    mu.mem_write(E, b'\0' * 0x10000)
    mu.mem_write(E + 0x10000, b'\0' * 0x10000)
    mu.mem_write(P, b'\0' * 0x10000)
    mu.mem_write(C, b'\0' * 0x1000)
    if int(a.vt, 16):
        mu.mem_write(E, struct.pack('<I', int(a.vt, 16)))
    mu.mem_write(E + 0x1428, struct.pack('<I', P)); mu.mem_write(E + 0xcac0, struct.pack('<I', C))
    mu.mem_write(E + 0xb5f4, bytes([a.em, a.variant]))
    for kv in filter(None, a.cac0.split(',')):
        k, v = (int(x, 0) for x in kv.split('='))
        mu.mem_write(C + k, bytes([v]))
    mu.mem_write(E + 0x4b4, struct.pack('<H', motion))
    mu.mem_write(E + 0x73e0, bytes([st, nm]))
    mu.mem_write(E + 0x4f4, f32(0.0)); mu.mem_write(E + 0x13c0, b'\0')
    mu.mem_write(E + 0x500, f32(f - 1.0)); mu.mem_write(E + 0x13ac, f32(f - 1.0))
    mu.mem_write(E + 0x13b4, f32(1.0)); mu.mem_write(E + 0x13b8, f32(1.0))
    mu.mem_write(E + 0x13bc, f32(10000.0)); mu.mem_write(E + 0x508, f32(0.0))
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_SP, STK); mu.reg_write(UC_ARM_REG_LR, STOP)
    del log[:]
    try:
        mu.emu_start(H, STOP, count=200000)
    except Exception as ex:
        log.append(('err', str(ex), hex(mu.reg_read(UC_ARM_REG_PC))))
    return list(log)


def motions(spec):
    out = []
    for part in spec.split(','):
        if '-' in part:
            x, y = (int(v, 16) for v in part.split('-')); out += list(range(x, y + 1))
        else:
            out.append(int(part, 16))
    return out


for m in motions(a.motions):
    ev = {}
    for f in range(0, a.frames + 1):
        for x in run(m, f):
            if x[0] in ('shell', 'err'):
                ev.setdefault(x[:3] if x[0] == 'shell' else ('err', x[2]), []).append(f)
    for k, fs in ev.items():
        rng, s0, p = [], fs[0], fs[0]
        for f in fs[1:] + [None]:
            if f is not None and f == p + 1: p = f; continue
            rng.append('%d' % s0 if s0 == p else '%d-%d' % (s0, p))
            if f is not None: s0 = p = f
        print('motion %#05x %s f %s' % (m, k, ' '.join(rng)))
