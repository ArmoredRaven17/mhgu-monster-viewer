# THE SHELL PATH TABLE: shell id -> the global shell table 0x175c3e8's res id -> 0x159daa0[res] = {~crc32(lowercase path), type}
# matched against every path in the named arcs. python shellres.py <arc name> [<arc name>..] [--ids lo-hi]
import sys, zlib, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import arclist
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad')
from d import u32
BASE = 0x159daa0
TAB = json.load(open(r'C:\MHGU-Extract\efx\agents\narga-shell-scratch\shelltable.json'))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
rng = None
for a in sys.argv[1:]:
    if a.startswith('--ids='):
        lo, hi = a[6:].split('-'); rng = (int(lo, 16), int(hi, 16))
paths = {}
for arc in args:
    ver, rows = arclist.entries(r'C:\MHGU-ROM\romfs\nativeNX\arc\enemy\%s.arc' % arc)
    for nm, th, comp, dec, off in rows:
        h = (zlib.crc32(nm.lower().encode()) ^ 0xffffffff) & 0xffffffff
        paths.setdefault(h, []).append(nm)
for r in TAB:
    if rng and not (rng[0] <= r['id'] <= rng[1]): continue
    res = int(r['res'], 16)
    if not res: continue
    ph = u32(BASE + res * 8)
    m = paths.get(ph) or paths.get(ph & 0x7fffffff)
    if rng or m:
        print('%#x %-26s res %#x path %#010x -> %s' % (r['id'], (r['cls'] or {}).get('name'), res, ph, sorted(set(m)) if m else None))
