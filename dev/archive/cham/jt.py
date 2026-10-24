import sys, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
def table(addadr, count):
    base = addadr + 8 + 4
    return [(n, (base + armdis.u32(base + 4 * n)) & 0xffffffff) for n in range(count)]
def follow(t, lim=40):
    out = []
    for a in range(t, t + 4 * lim, 4):
        i = next(md.disasm(armdis.TEXT[a:a+4], a), None)
        if not i: break
        out.append('%x %s %s' % (a, i.mnemonic, i.op_str))
        if i.mnemonic in ('b', 'bx') or (i.mnemonic.startswith('pop') and 'pc' in i.op_str): break
    return out
if __name__ == '__main__':
    addadr, count = int(sys.argv[1], 16), int(sys.argv[2], 0)
    want = set(int(x, 16) for x in sys.argv[3:])
    for n, t in table(addadr, count):
        f = follow(t)
        hit = [l for l in f if any(('#0x%x' % w) in l for w in want) or any(int(l.split()[0], 16) == w for w in want)]
        print('n=%#04x -> %x  %s' % (n, t, (' HIT ' + str(hit)) if hit else f[-1]))
