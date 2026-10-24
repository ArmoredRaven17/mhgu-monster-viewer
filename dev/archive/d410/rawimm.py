"""Raw-encoding census over main.text: every movw / mov / add / sub / ldr-literal whose constant could
build an address in [LO, HI) from a base (the constant itself in [LO-0x1000, HI+0x1000), i.e. a near
base like 0xd000 / 0xd400 / 0xd3xx). Decodes ARM data-processing immediates by hand (no capstone),
so it covers the whole binary quickly and independent of the symbolic scanner.
usage: rawimm.py LO HI [band_lo band_hi]"""
import sys, struct
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
LO, HI = int(sys.argv[1], 0), int(sys.argv[2], 0)
blo, bhi = (int(sys.argv[3], 0), int(sys.argv[4], 0)) if len(sys.argv) > 4 else (0, len(T))
near = lambda c: LO - 0x1000 <= c < HI + 0x10 or LO - 0x1000 <= ((-c) & 0xffffffff) < HI + 0x10
out = []
for a in range(blo & ~3, bhi, 4):
    w = struct.unpack_from('<I', T, a)[0]
    cond = w >> 28
    if cond == 0xf: continue
    # movw
    if (w & 0x0ff00000) == 0x03000000:
        c = ((w >> 4) & 0xf000) | (w & 0xfff)
        if LO - 0x100 <= c < HI + 0x10: out.append((a, 'movw', c, w))
        continue
    # data processing immediate: add(4) sub(2) mov(d) rsb(3) orr(c)
    if (w & 0x0e000000) == 0x02000000:
        op = (w >> 21) & 0xf
        rot = ((w >> 8) & 0xf) * 2
        imm = w & 0xff
        c = ((imm >> rot) | (imm << (32 - rot))) & 0xffffffff if rot else imm
        if op in (2, 4, 0xd, 0xc) and c >= 0x100 and (LO - 0x1000 <= c < HI + 0x10):
            out.append((a, {2: 'sub', 4: 'add', 0xd: 'mov', 0xc: 'orr'}[op], c, w))
        continue
    # ldr rT,[pc,#imm] literal
    if (w & 0x0f7f0000) == 0x051f0000:
        off = w & 0xfff
        la = a + 8 + (off if w & 0x00800000 else -off)
        if 0 <= la < len(T) - 4:
            c = struct.unpack_from('<I', T, la)[0]
            if LO - 0x1000 <= c < HI + 0x10: out.append((a, 'ldr=', c, w))
for a, k, c, w in out:
    print('%08x %-5s 0x%x  (%08x)' % (a, k, c, w))
print(len(out), 'hits')
