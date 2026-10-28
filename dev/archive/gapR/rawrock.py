# rawrock.py <emc>: every op 0x00 7 n in EVERY stream of the command table (reached or not), for the rock action ranges of
# 0xe78e34 (shells-em043.md 6 / 9.1): which (7, n) appear anywhere, against the walk's set (issued043.py)
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\state-scratch')
import emc
ver, groups = emc.load(sys.argv[1])
got = {}
nops = 0
for g, ss in enumerate(groups):
    for k, s in enumerate(ss):
        for o in emc.parse(s):
            b = o.split(' '); nops += 1
            if b[0] == '00' and len(b) == 3 and int(b[1], 16) == 7:
                got.setdefault(int(b[2], 16), []).append('g%ds%d' % (g, k))
print('streams', sum(len(ss) for ss in groups), 'ops', nops, 'distinct (7, n)', len(got))
R = {'kind0 idx0 (modes 0)': range(0x08, 0x0a), 'kind0 idx0b': range(0x13, 0x15), 'kind0 idx1..2 (modes 1, 2)': range(0x15, 0x1d),
     'kind0 idx3 (mode 3)': range(0x22, 0x26), 'kind1 (modes 4..7)': range(0x3e, 0x4e), 'kind2 sub0 (shell00 8..11)': range(0x4e, 0x5e),
     'kind3 sub0 (shell54 0..3)': range(0x5e, 0x6e), 'kind2 sub1 (shell00 12..15)': range(0x6e, 0x7e), 'kind3 sub1 (shell54 4..7)': range(0x7e, 0x8e)}
for name, r in R.items():
    hit = [(n, got[n]) for n in r if n in got]
    print('%-30s %s' % (name, ' '.join('%#04x:%s' % (n, '/'.join(v)) for n, v in hit) or 'NONE'))
