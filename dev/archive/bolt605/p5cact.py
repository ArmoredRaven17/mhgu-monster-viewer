# p5cact.py (effects lane, 2026-10-25): which uEm081_00 actions enter the six functions that call the P+0x5c setters (0xbf700 /
# 0xbf71c; p5c081_sites.txt), run with actprobe81's harness up to the first setMotion (phase 0), variants 0 / 4.
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\boltreaver-scratch'); sys.path.insert(0, r'C:\MHGU-Extract\efx')
import actprobe81 as A
from unicorn import UC_HOOK_CODE
FNS = [0x101aafc, 0x101bff8, 0x10247ec, 0x1025478, 0x1025b48, 0x102c1dc]
hit = []
def h(uc, addr, size, ud): hit.append(addr)
for f in FNS: A.mu.hook_add(UC_HOOK_CODE, h, begin=f, end=f)
for v in (0, 4):
    for st in range(16):
        for n in range(0x100):
            hit.clear()
            r = A.probe(st, n, 0, v, 0x51)
            if hit and 'unhandled' not in r:
                print('v%d (%d, %#x) %s  enters %s' % (v, st, n, r.split(' blend')[0], ' '.join(hex(x) for x in sorted(set(hit)))))
