"""owner.py <addr hex> ... -- the function holding an address (back to the nearest push {.., lr} after a bx lr / pop pc), the
.data/.rodata words that point at it (vtables), and the class name from each vtable's getDTI (+0x14) via efx/dti-table.json.
Flashed read 2026-10-25. The function start is a heuristic (I): check it in the listing."""
import sys, struct, json, capstone
sys.path.insert(0, r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\archive\flashed')
from d import TEXT, DA, DA_VA, RO, RO_VA, u32, dis
DTI = json.load(open(r'C:\MHGU-Extract\efx\dti-table.json'))
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
def fstart(a):
    a &= ~3
    while a > 0:
        a -= 4
        i = list(md.disasm(TEXT[a:a+4], a))
        if i and i[0].mnemonic == 'push' and 'lr' in i[0].op_str:
            p = list(md.disasm(TEXT[a-4:a], a-4))
            if not p or p[0].mnemonic in ('bx', 'b') or 'pc' in p[0].op_str or p[0].mnemonic == 'andeq' or not p: return a
            return a
def getdti(fn):
    # getDTI: ldr r0,[pc,#x]; ldr r0,[pc,r0] (GOT) ; bx lr  -> GOT word
    L = dis(fn, fn + 12)
    if len(L) >= 2 and L[0][1] == 'ldr' and L[1][1] == 'ldr':
        lit = u32(fn + 8 + int(L[0][2].split('#')[1].rstrip(']'), 0))
        got = (fn + 4 + 8 + lit) & 0xffffffff
        return u32(got)
for x in sys.argv[1:]:
    a = int(x, 16); f = fstart(a)
    hits = []
    for base, buf in ((DA_VA, DA), (RO_VA, RO)):
        w = struct.pack('<I', f); k = buf.find(w)
        while k >= 0:
            if k % 4 == 0: hits.append(base + k)
            k = buf.find(w, k + 1)
    names = []
    for h in hits:
        # walk back to the vtable start: a vtable here is preceded by an offset-to-top 0 and a typeinfo word -- not reliable; try slots
        for back in range(0, 0x600, 4):
            vt = h - back
            g = u32(vt + 0x14)
            if g and g < len(TEXT):
                d = getdti(g)
                if d and ('0x%x' % d) in DTI:
                    names.append((hex(h), hex(vt), DTI['0x%x' % d]['name'], 'slot +0x%x' % back)); break
    print(x, 'fn', hex(f), 'refs', [hex(h) for h in hits], names[:4])
