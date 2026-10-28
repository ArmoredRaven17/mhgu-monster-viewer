# hypereye/b720hooks.py (hyper-eye lane, 2026-10-27): the per-class e+0xb720 sites of laneB3/immb720.out (class bands, >= 0xd00000):
# for each, the function it sits in (from the site to the first `pop {..pc}` / `ldm sp!, {..pc}` -- the extent is the first return, a
# heuristic: an early return can cut it short) and what it calls: the burst 0xca4e0 (u 1310 + ID), the rate setter 0xb07b4, the frame
# test 0xb0974, a stop 0x329c40, and every MATERIAL / PART-SET call armdis.KNOWN names (setMaterialAt, setMatClip, clearAllSlots,
# findMatClipByName, setVisibleGroup) -- to say whether any class's hyper code touches the eyes' look.
#   python dev/archive/hypereye/b720hooks.py
import sys, struct, re, os
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis as D
import capstone
T = D.TEXT
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'laneB3', 'immb720.out')
sites = [int(l.split()[0], 16) for l in open(SRC) if re.match(r'^[0-9a-f]{8} ', l)]
sites = [s for s in sites if s >= 0xd00000]
NAMES = {0xca4e0: 'burst', 0xb07b4: 'rate', 0xb0974: 'frameTest', 0x329c40: 'stop', **D.KNOWN}
tally = {}
for s in sites:
    calls, n = [], 0
    for i in md.disasm(T[s:s + 0x1400], s):
        n += 1
        if i.mnemonic in ('bl', 'blx') and i.op_str.startswith('#'):
            calls.append(int(i.op_str[1:], 16))
        if (i.mnemonic == 'pop' and 'pc' in i.op_str) or (i.mnemonic.startswith('ldm') and 'pc' in i.op_str) or n > 1200: break
    named = sorted({NAMES[c] for c in calls if c in NAMES})
    other = len({c for c in calls if c not in NAMES})
    key = ','.join(named) or '-'
    tally[key] = tally.get(key, 0) + 1
    print('%08x  span %4d  %s  (+%d other callees)' % (s, n, key, other))
print('tally', tally)
