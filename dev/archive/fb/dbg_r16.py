import sys, json, struct
sys.argv = ['x']
import emu_fb as E
I = lambda v: list(struct.pack('<I', v))
c = {'name': 'r16', 'mon': 'em082_04', 'folders': {'352': ['em082_04', '26']}, 'variant': 4, 'owner': [0, 0x3000, 0],
     'ownerPos': [120.5, 15.25, -80.75], 'target': [900.0, 40.0, 2400.0], 'floorY': 0.0, 'ground': 0.0, 'size': [1.0, 1.0], 'base': 1.0,
     'rank': 5, 'quest': 10, 'owner_bytes': {'0x73e0': [1, 0x16], '0xcac0': I(0x15d), '0xcac4': I(0x15e), '0xcac8': I(0x15c), '0xcacc': I(0x15f), '0xcad0': I(0x160)},
     'joints': {'0': [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 100, 200, 300, 1]}, 'frames': 5, 'noTurn': 1, 'unstub': ['0x7206c'],
     'steps': [{'fn': '1035b58', 'phase': 0, 'frame': 0.0, 'winFrames': []}] + [{'fn': '1035b58', 'phase': 2, 'frame': float(k), 'winFrames': []} for k in range(1, 511)]}
# a probe on the counters and the phase byte after each step
orig = E.call_action
seen = []
def probe(c, step):
    r = orig(c, step)
    if step['frame'] in (0.0, 1.0, 2.0, 499.0, 500.0, 501.0):
        seen.append((step['frame'], E.r8(E.BLOCK + 0x1a1), [round(E.rf(E.OWNER + 0xcb34 + 4 * i), 2) for i in range(4)], len(r), E.r8(E.OWNER + 0x73e0), E.r8(E.OWNER + 0x73e1)))
    return r
E.call_action = probe
out = E.run(c)
for s in seen: print(s)
print('shells', len(out['shells']))
