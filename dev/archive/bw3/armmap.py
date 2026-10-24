import capstone, bisect, re, collections
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
LO, HI = 0xf35038, 0xf48200
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
ins = list(md.disasm(T[LO:HI], LO))
starts = sorted(i.address for i in ins if i.mnemonic == 'push' and 'lr' in i.op_str)
fn = lambda a: starts[bisect.bisect_right(starts, a) - 1]
mot = collections.defaultdict(list)
for l in open('mot063.txt'):
    a = int(l.split()[0], 16); mot[fn(a)].append(l.split('r1=')[1].strip())
idx = {i.address: k for k, i in enumerate(ins)}
for k, i in enumerate(ins):
    if i.mnemonic == 'bl' and i.op_str == '#0xf4653c':
        r1 = r2 = None
        for j in range(k - 1, k - 12, -1):
            p = ins[j]
            if r1 is None and re.match(r'^r1, ', p.op_str) and p.mnemonic.startswith('mov'): r1 = p.op_str.split(', ')[1]
            if r2 is None and re.match(r'^r2, ', p.op_str) and p.mnemonic.startswith(('mov', 'mvn')): r2 = p.mnemonic + ' ' + p.op_str.split(', ')[1]
        f = fn(i.address)
        print('%#x fn %#x slot %s delta %s | motions in fn: %s' % (i.address, f, r1, r2, ' '.join(mot.get(f, [])) or '-'))
