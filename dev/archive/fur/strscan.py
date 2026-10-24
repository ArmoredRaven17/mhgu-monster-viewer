# every pc-relative address (ldr rX,[pc,#k] ; add rX,pc,rX) formed in a code band, resolved to a string / data word
import sys, struct
sys.path.insert(0, __file__.rsplit('\\', 1)[0])
from fdis_lib import TEXT, w, cstr, md
lo, hi = int(sys.argv[1], 0), int(sys.argv[2], 0)
ins = []
for a in range(lo, hi, 4):
    ins.extend(list(md.disasm(TEXT[a:a+4], a))[:1])
print('decoded', len(ins), 'of', (hi-lo)//4)
lit = {}
out = []
for k, i in enumerate(ins):
    if i.mnemonic == 'ldr' and '[pc, #' in i.op_str:
        r = i.op_str.split(',')[0]
        off = int(i.op_str.split('[pc, #')[1].split(']')[0], 0)
        lit[r] = (w(i.address + 8 + off), i.address)
    elif i.mnemonic == 'add' and ', pc, ' in i.op_str:
        p = [x.strip() for x in i.op_str.split(',')]
        src = p[2]
        if src in lit:
            tgt = (lit[src][0] + i.address + 8) & 0xffffffff
            s = cstr(tgt)
            out.append((i.address, tgt, s))
for a, t, s in out:
    print('%08x -> %#x %s' % (a, t, repr(s) if s else ''))
