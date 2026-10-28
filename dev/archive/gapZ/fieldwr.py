# fieldwr.py <hexoff>...: every write to shell+<off> in the whole main.text: movw rX,#off then a store [rB, rX] (incl. ! writeback),
# or add rX, rB, #off then a store [rX] / vstr [rX], or add rX, rB, #(off & ~0xff) then a store [rX, #(off & 0xff)].
# Prints addr, function start, and the window.
import struct, sys, capstone
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
offs = [int(x, 16) for x in sys.argv[1:]]
def fstart(a):
    while a > 0:
        w = struct.unpack_from('<I', T, a)[0]
        if (w & 0xffff4000) == 0xe92d4000: return a
        a -= 4
    return 0
def win(a, n=8):
    out = []
    for i in range(n):
        b = T[a + 4 * i: a + 4 * i + 4]
        l = list(md.disasm(b, a + 4 * i))
        out.append('%s %s' % (l[0].mnemonic, l[0].op_str) if l else '.word')
    return out
hits = []
for a in range(0, len(T) - 4, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w >> 28) == 0xf: continue
    rd = None
    if (w & 0x0ff00000) == 0x03000000:   # movw
        imm = ((w >> 4) & 0xf000) | (w & 0xfff)
        if imm in offs: rd = (w >> 12) & 0xf; kind = 'movw'; off = imm
    elif (w & 0x0fe00000) == 0x02800000:  # add imm
        rot = ((w >> 8) & 0xf) * 2; v = w & 0xff; imm = ((v >> rot) | (v << (32 - rot))) & 0xffffffff if rot else v
        for o in offs:
            if imm == o or imm == (o & ~0xff) or imm == (o & ~0x3f):
                rd = (w >> 12) & 0xf; kind = 'add'; off = o
    if rd is None: continue
    ws = win(a, 7)
    r = 'r%d' % rd if rd < 10 else ['sl', 'fp', 'ip', 'sp', 'lr', 'pc'][rd - 10]
    st = [x for x in ws[1:] if (x.startswith('str') or x.startswith('vstr') or x.startswith('stm')) and r in x.split(',', 1)[-1]]
    if st: hits.append((a, fstart(a), ws))
for a, f, ws in hits:
    print('%x fn %x | %s' % (a, f, ' | '.join(ws)))
