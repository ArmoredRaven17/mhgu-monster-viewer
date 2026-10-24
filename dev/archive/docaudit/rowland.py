import sys, re, difflib, os
ARCH = r"C:\MHGU-RE\offline\decode\monster-viewer-scratch"
ROM = r"C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md"
rom = open(ROM, encoding='utf-8').read()
romlines = rom.split('\n')
norm = lambda s: re.sub(r'\s+', ' ', s.strip())
romnorm = [norm(l) for l in romlines]
romset = set(romnorm)
hexre = re.compile(r'0x[0-9a-fA-F]{4,}')
def first_cell(l):
    c = [x.strip() for x in l.strip().strip('|').split('|')]
    return c[0] if c else ''
for rel in sys.argv[1:]:
    p = os.path.join(ARCH, rel)
    lines = open(p, encoding='utf-8').read().split('\n')
    print('=====', rel)
    for i, l in enumerate(lines, 1):
        if not l.strip().startswith('|') or re.match(r'^\|[\s\-:|]+\|?$', l.strip()):
            continue
        n = norm(l)
        if n in romset:
            print(f'  L{i}: EXACT @{romnorm.index(n)+1}')
            continue
        # candidates sharing first cell or hex
        fc = first_cell(l)
        hexes = hexre.findall(l)
        cands = [j for j, r in enumerate(romnorm) if r.startswith('|') and ((fc and len(fc) > 3 and fc in r) or any(h in r for h in hexes[:2]))]
        best = (0, None)
        for j in cands[:400]:
            ratio = difflib.SequenceMatcher(None, n, romnorm[j]).ratio()
            if ratio > best[0]:
                best = (ratio, j)
        if best[1] is None:
            # broad scan
            for j, r in enumerate(romnorm):
                if not r.startswith('|'): continue
                ratio = difflib.SequenceMatcher(None, n[:200], r[:200]).quick_ratio()
                if ratio > best[0]:
                    best = (ratio, j)
        print(f'  L{i}: best {best[0]:.2f} @{(best[1] or 0)+1} | draft: {n[:110]}')
