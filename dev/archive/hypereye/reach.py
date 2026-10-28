# hypereye/reach.py (hyper-eye lane, 2026-10-27): DIRECT-call reachability over main.text: from ROOTS, every function reachable by BL /
# BLX-imm / tail `b` into another function's start, and the shortest path to TARGET. Function extent: from a start to the next `push
# {..lr}` (a heuristic: a function without a push is folded into the one before it). Indirect calls (blx rX, vtables) are NOT followed:
# a path found is real (check it by reading); "unreachable" is NOT a negative.
#   python dev/archive/hypereye/reach.py <target hex> <root hex> [root ..] [--depth N]
import sys, struct, bisect, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis as D
T = D.TEXT
args = [a for a in sys.argv[1:] if not a.startswith('--')]
depth = int(sys.argv[sys.argv.index('--depth') + 1]) if '--depth' in sys.argv else 12
target = int(args[0], 16); roots = [int(a, 16) for a in args[1:] if not a.isdigit()]
N = len(T) & ~3
starts = []
for a in range(0, N, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w & 0xffff4000) == 0xe92d4000: starts.append(a)
def calls(f):
    i = bisect.bisect_right(starts, f)
    end = starts[i] if i < len(starts) else N
    end = min(end, f + 0x4000)
    out = []
    for a in range(f, end, 4):
        w = struct.unpack_from('<I', T, a)[0]
        if (w >> 25) & 7 != 5: continue
        off = w & 0xffffff
        if off & 0x800000: off -= 0x1000000
        d = a + 8 + (off << 2)
        link = (w >> 24) & 1
        if w >> 28 == 0xf: d += link << 1; link = 1
        if link: out.append((a, d))
        elif not (f <= d < end): out.append((a, d))          # a tail branch out of the function
    return out
seen = {r: None for r in roots}
q = collections.deque((r, 0) for r in roots)
while q:
    f, k = q.popleft()
    if f == target: break
    if k >= depth: continue
    for site, d in calls(f):
        if d not in seen:
            seen[d] = (f, site); q.append((d, k + 1))
if target in seen:
    path, x = [], target
    while seen[x]: f, site = seen[x]; path.append('%x (call at %x)' % (f, site)); x = f
    print('REACHED', hex(target), 'via', ' <- '.join(['%x' % target] + path))
else:
    print('not reached (direct calls only, depth %d), %d functions visited' % (depth, len(seen)))
