# motqx.py <class> <mon> st:n,st:n,..: each action's motions by phase (frame / ended scenarios), every setMotion-family setter hooked
import sys, os
acts = [tuple(int(x, 0) for x in a.split(':')) for a in sys.argv[3].split(',')]
os.environ['FB_CLASS'] = sys.argv[1]; os.environ['FB_MON'] = sys.argv[2]
sys.argv = ['x']
import trgen as T
for a, nm in ((0xb00b4, 'b00b4'), (0xb0174, 'b0174'), (0xb0230, 'b0230'), (0xb03f8, 'b03f8'), (0xb04d0, 'b04d0'), (0xb0004, 'b0004')): T.MOT[a] = nm
import struct
for st, n in acts:
    out = []
    for ph in range(6):
        for sc in ({'frame': 0, 'frame2': 0}, {'frame': 1, 'frame2': 1}, {'ended': 1}):
            r = T.run(st, n, ph, 0, 0, stub={0x3a8430: 5}, **sc)
            ms = sorted(set(e[1] for e in r.get('ev', []) if e[0] == 'mot'))
            nph = T.mu.mem_read(T.P + 0x1a1, 1)[0]
            if ms: out.append('p%d%s->p%d %s' % (ph, 'F' if sc.get('frame') else 'E' if sc.get('ended') else '0', nph, ' '.join(ms)))
    print('%d:%#04x' % (st, n), ' | '.join(sorted(set(out))))
