# cls60.py: every reached shell class's OWN code (vtable slots pointing into the class bands >= 0xcec000, each function to its
# next push, plus its direct callees in the class bands, depth 2) scanned for loads of +0x60 / +0x64 / +0x68 and calls of the
# unit-scale getter 0x1f680 / 0x43ab74.
import json, struct, capstone
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read(); DA = open(r'C:\MHGU-ROM\exefs\main.data', 'rb').read(); DA_VA = 0x1728000
rd = lambda va: struct.unpack_from('<I', DA, va - DA_VA)[0]
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
H = json.load(open('hyperall.json')); C = json.load(open(r'C:\MHGU-Extract\efx\agents\shells-scratch\shellclasses.json'))
vts = {}
for k, r in H.items():
    if r.get('vt'): vts[k] = int(r['vt'], 16)
for n in ('uShellEm023_sp_02', 'uShellEm049_sp_02', 'uShellEm067_sp_02', 'uShellEm043_sp_00', 'uShellEm043_sp_04', 'uShellEm043_sp_54', 'uShellEm043_sp_55', 'uShellEm005_sp_02'):
    vts[n] = C[n]['vtable']
def body(f):
    out = []; a = f
    for n in range(3000):
        w = struct.unpack_from('<I', T, a)[0]
        if n and (w & 0xffff4000) == 0xe92d4000: break
        out.append(a); a += 4
    return out
for k, vt in sorted(vts.items()):
    fns = set(rd(vt + o) for o in range(0, 0x200, 4) if 0xcec000 <= rd(vt + o) < 0x1100000)
    seen = set(); front = set(fns); hits = []
    for d in range(3):
        nxt = set()
        for f in front:
            if f in seen: continue
            seen.add(f)
            for a in body(f):
                l = list(md.disasm(T[a:a + 4], a))
                if not l: continue
                i = l[0]
                if (i.mnemonic.startswith('ldr') or i.mnemonic.startswith('vldr')) and any(x in i.op_str for x in ('#0x60]', '#0x64]', '#0x68]')) and 'sp,' not in i.op_str and 'pc,' not in i.op_str:
                    hits.append('%x %s %s' % (a, i.mnemonic, i.op_str))
                if i.mnemonic == 'bl':
                    t = int(i.op_str.lstrip('#'), 16)
                    if t in (0x1f680, 0x43ab74): hits.append('%x bl %x' % (a, t))
                    if 0xcec000 <= t < 0x1100000: nxt.add(t)
        front = nxt
    print(k, len(seen), 'fns', '; '.join(hits) if hits else '-')
