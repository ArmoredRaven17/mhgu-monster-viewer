import sys, re, os
ARCH = r"C:\MHGU-RE\offline\decode\monster-viewer-scratch"
DEV = r"C:\MHGU-Extract\MHGU-Monster-Viewer\dev"
src = os.path.join(ARCH, sys.argv[1])
dsts = [os.path.join(DEV, d) for d in sys.argv[2:]]
t = open(src, encoding='utf-8').read()
spec = '\n'.join(open(d, encoding='utf-8').read() for d in dsts)
rom = open(os.path.join(DEV, 'rom-map.md'), encoding='utf-8').read()
norm = lambda s: re.sub(r'\s+', ' ', s)
specn = norm(spec)
print('==', sys.argv[1], '->', sys.argv[2:])
miss = []
for a in sorted(set(re.findall(r'0x[0-9a-fA-F]{4,}', t))):
    s = a in spec; r = a in rom
    if not (s and r):
        miss.append(f'{a} spec={s} rom={r}')
print(' addr not in both:', '; '.join(miss) if miss else 'none')
lines = [l.strip() for l in t.split('\n') if l.strip()]
bad = 0
for l in lines:
    key = norm(l.lstrip('-*| '))[:50]
    if len(key) < 15:
        continue
    if key not in specn:
        bad += 1
        print('  not verbatim:', l[:110])
print(' lines not verbatim:', bad, 'of', len(lines))
