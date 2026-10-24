import re, fwread as f
def scan(lo, hi, name):
    hits = []
    a = lo
    while a < hi:
        got = False
        for i in f.md.disasm(f.T[a:hi], a):
            got = True
            for m in re.findall(r'#(0x[0-9a-f]+|\d+)', i.op_str):
                v = int(m, 0)
                if 0xb7c0 <= v <= 0xb7e0 or v in (0xb700, 0xb400, 0xb000, 0xb800, 0xb600):
                    hits.append('%x: %s %s' % (i.address, i.mnemonic, i.op_str))
            a = i.address + 4
        if not got or a < hi:
            a += 4   # skip an undecodable word (data) and continue
    print(name, hex(lo), hex(hi), len(hits))
    for h in hits: print('   ', h)
scan(0xe5a104, 0xe64e24, 'uEm038_00 Ukanlos')
scan(0xec480c, 0xed0a38, 'uEm050_00 Alatreon (positive control)')
scan(0xde1908, 0xdeef70, 'uEm023_00 Rajang (positive control)')
