# pfdisp.py: which per-frame slots in the pfarm outputs are ACTION DISPATCHERS (read e+0x73e0 / +0x73e1, the status / number, in their
# first 12 instructions or the first callee's) -- their arms belong to actions (attrace), not to every motion
import sys, re, os, glob, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
def disp(a, depth=0):
    for i in md.disasm(armdis.TEXT[a:a + 4 * 14], a):
        if '#0x73e0' in i.op_str or '#0x73e1' in i.op_str: return True
        if depth == 0 and i.mnemonic in ('b', 'bl') and i.op_str.startswith('#'):
            if disp(int(i.op_str[1:], 16), 1): return True
            if i.mnemonic == 'b': return False
    return False
out = {}
for p in glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pfa', 'em*.txt')):
    head = open(p).readline()
    m = re.search(r"slots (\[.*\])", head)
    if not m: continue
    sl = eval(m.group(1))
    out[os.path.basename(p)[:-4]] = sorted(o for o, f in sl if disp(int(f, 16)))
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pfdisp.json'), 'w'), indent=0)
import collections; print(collections.Counter(tuple(v) for v in out.values()).most_common(12))
