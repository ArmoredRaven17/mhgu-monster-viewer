import sys, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch'); sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\cephadrome-scratch')
import probe, scr
cls, em = sys.argv[1], int(sys.argv[2], 0)
by = collections.defaultdict(set)
for st in (10, 11):
    for n in range(256):
        for part in range(8):
            for d in range(8):
                h = probe.probe(cls, st, n, em, 0, 0, part, d)['hit']
                if h.startswith('script') or h.startswith('setMotion'):
                    by[h].add((st, n, part, d))
for h, s in sorted(by.items()):
    acts = sorted({(a, b) for a, b, _, _ in s})
    parts = sorted({p for _, _, p, _ in s}); dirs = sorted({d for _, _, _, d in s})
    clips = ''
    if h.startswith('script'):
        a = int(h.split()[1], 16)
        clips = ' | ' + '; '.join(x.strip() for x in scr.dump(a) if 'op 0x0' in x or 'op 0x2' in x or 'op 0x35' in x or 'end' in x)
    print('%s  actions %s parts %s dirs %s%s' % (h, ' '.join('(%d,%#x)' % a for a in acts), parts, dirs, clips))
