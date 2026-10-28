"""questroster.py (hyper audit, 2026-10-28): every quest file romfs/nativeNX/loc/quest/questData/questData_*.ext (1849): the five
13-byte large-monster entries at file +0x64 (u16 em id = variant << 8 | em, the encoding 0x50aa8 / 0x3a964c's `ldrh [r6]` take;
byte +3 = 0 / 1), the quest rank byte at file +0x13 (values 0 / 1 / 3 / 5 = the 0x3a8430 enum on resource +0xf; INFERRED).
Prints the census of entry byte +3 against the .mdd roster (docs/hyper-auras.json) -> questroster.json {id: {ranks, quests}}.
INFERRED: byte +3 is the file's form of the in-memory entry's +0xb (the hyper flag 0x3a964c copies); the file -> memory copy is not read.
    python questroster.py"""
import os, json, collections
Q = r'C:\MHGU-ROM\romfs\nativeNX\loc\quest\questData'
H = os.path.dirname(os.path.abspath(__file__))
HA = json.load(open(os.path.join(H, '..', '..', '..', 'docs', 'hyper-auras.json')))
R, QS, b3 = collections.defaultdict(collections.Counter), collections.defaultdict(list), collections.Counter()
for f in sorted(os.listdir(Q)):
    d = open(os.path.join(Q, f), 'rb').read()
    for i in range(5):
        e = d[0x64 + i * 13: 0x64 + i * 13 + 13]
        if e[:4] == b'\0' * 4: continue
        b3[e[3]] += 1
        if not e[3]: continue
        k = 'em%03d_%02d' % (e[0], e[1]); R[k][str(d[0x13])] += 1; QS[k].append([f[10:17], d[0x13]])
json.dump({k: {'ranks': dict(R[k]), 'quests': QS[k]} for k in sorted(R)}, open(os.path.join(H, 'questroster.json'), 'w'), indent=0)
mdd = {k for k in HA if not k.startswith('_')}
print('entry byte +3:', dict(b3), '| monsters with a hyper entry:', len(R), '| .mdd monsters:', len(mdd),
      '| equal sets:', set(R) == mdd)
for k in sorted(R): print(k, dict(R[k]))
