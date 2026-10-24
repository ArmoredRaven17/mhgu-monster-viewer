import os, struct, re, collections, sys
root = r'C:\MHGU-Extract'
c = collections.Counter(); ver = collections.Counter(); n=0
for dp, dn, fn in os.walk(root):
    if 'node_modules' in dp: continue
    for f in fn:
        if not f.endswith('.tex'): continue
        p = os.path.join(dp, f)
        if not re.search(r'[\/]em\d{3}', p) and not re.search(r'em\d{3}_', f): continue
        try: h = open(p, 'rb').read(16)
        except: continue
        if h[:4] != b'TEX\0': continue
        w1, w2, w3 = struct.unpack_from('<III', h, 4)
        fmt = (w3 >> 8) & 0xff
        m = re.search(r'_([A-Z]{2,4})(?:_HQ)?(?:_NOMIP)?\.tex$', f)
        role = m.group(1) if m else '?'
        c[(role, fmt)] += 1; ver[w1 & 0xffff] += 1; n += 1
print(n, 'files; versions', {hex(k): v for k, v in ver.items()})
for (r, f), k in sorted(c.items()): print(r, f, k)
