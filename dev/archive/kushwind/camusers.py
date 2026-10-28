"""kushwind/camusers.py: what the game reads from the viewport camera -- every `ldr rC, [rX, #0x54]` that is preceded (within 6) by an
`mla`/`add` with 0x1b0 or a load of sCamera (the viewport slot pattern), then the fields read from rC in the next 24 instructions.
Counts per field across the image: which camera fields the systems use as its position."""
import sys, re, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
ins = list((i.address, i.mnemonic, i.op_str) for i in md.disasm(armdis.TEXT, 0))
cnt = collections.Counter(); sites = collections.defaultdict(list)
for k, (a, m, o) in enumerate(ins):
    mm = re.match(r'(\w+), \[(\w+), #0x54\]$', o)
    if m != 'ldr' or not mm: continue
    if not any(('#0x1b0' in o2) for _, m2, o2 in ins[max(0, k - 6):k]): continue
    c = mm.group(1)
    for a2, m2, o2 in ins[k + 1:k + 25]:
        f = re.search(r'\[' + c + r', #(0x[0-9a-f]+)\]', o2)
        if f and m2 in ('ldr', 'vldr', 'ldrd', 'str', 'vstr', 'strd'): key = ('W ' if m2.startswith(('str', 'vstr')) else '') + f.group(1); cnt[key] += 1; sites[key].append(hex(a2))
        if re.match(r'(mov|ldr|add)\w*$', m2) and o2.startswith(c + ','): break
for f, n in cnt.most_common(): print(f, n, sites[f][:8])
