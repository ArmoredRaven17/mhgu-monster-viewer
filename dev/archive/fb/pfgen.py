# pfgen.py <mon> (2026-10-19): the PER-FRAME shell census -- cengen11 runs a class's action main only, so a shell made by a per-frame
# vtable method keyed on the motion id (Tigrex's frame handler vt+0x208 0xe21294: shell01 on L1 M1 / M2, L2 M8) is never seen. This
# runs every vtable slot in +0x190..+0x240 that the class overrides (its target inside the class band) under trgen's model, once per
# motion id the monster ships (docs/poses: (list << 8) | n), with the motion id at e+0x4b4, every frame test answered 1 then each
# frame literal alone, rage 0 / 1, and prints the creates: 'PF +slot fn mot [frames] {id mN fF site: [scenarios]}'.
# Env as runfbb.py (FB_CLASS / FB_EM / FB_POKE are set from the monster here).
import sys, os, json, struct, re
D = os.path.dirname(os.path.abspath(__file__))
mon = sys.argv[1]
SHARED = {'002': 'uEm001_00', '005': 'uEm004_00', '015': 'uEm014_00', '016': 'uEm014_00', '034': 'uEm014_00', '062': 'uEm060_00', '072': 'uEm071_00'}
cls = SHARED.get(mon[2:5], 'uEm%s_00' % mon[2:5]); var = int(mon[6:8])
os.environ['FB_CLASS'] = cls; os.environ['FB_MON'] = mon; os.environ['FB_EM'] = str(int(mon[2:5]))
IDS = json.load(open(os.path.join(D, 'ids_fbb.json'))).get(mon) or {}
sys.argv = ['x']
import trgen as T
POKE = {T.E + int(k, 16): list(struct.pack('<I', int(v, 16))) for k, v in IDS.items()}
c = T.CLS[cls]; lo, hi = c['lo'], c['hi'] + 0x400
import armdis
slots = []
for off in range(0x190, 0x244, 4):
    t = struct.unpack_from('<I', armdis.DATA, c['vtable'] - armdis.DA_VA + off)[0]
    if lo <= t < hi: slots.append((off, t))
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
mots = []
# (2026-10-19) the monster's lists AS monsters.json gives them -- a variant's lists 0..3 are often its base's files (em032_04 plays
# em032_00_0..3.glb): reading only <mon>_N.glb skipped every shared list
MJ = json.load(open(os.path.join(V, 'monsters.json'), encoding='utf8'))
ML = MJ if isinstance(MJ, list) else MJ.get('monsters', MJ)
ent = [m for m in (ML if isinstance(ML, list) else ML.values()) if isinstance(m, dict) and m.get('id') == mon][0]
for li in ent.get('lists', []):
    if not str(li.get('id', '')).isdigit(): continue
    L = int(li['id']); b = open(os.path.join(V, li['file']), 'rb').read(); n = struct.unpack_from('<I', b, 12)[0]
    J = json.loads(b[20:20 + n])
    for an in J.get('animations', []):
        mm = re.search(r'Motion\[(\d+)\]', an.get('name', ''))
        if mm: mots.append((L << 8) | int(mm.group(1)))
mots = sorted(set(mots))
print('#', mon, cls, 'slots', [(hex(o), hex(t)) for o, t in slots], len(mots), 'motions', flush=True)
for off, t in slots:
    for mid in mots:
        seen = {}; lits = set()
        for rg in (0, 1):
            for fr in (1, 0):
                r = T.run(7, 0, 0, var, 0, rage=rg, stub={0x3a8430: 5, 0x49930: 10}, poke=POKE, fn=t, mot=mid, frame=fr, frame2=fr)
                for e in r.get('ev', []):
                    if e[0] == 'ftest': lits.add(e[1])
                    if e[0] == 'ftest2': lits.add(e[2][1])
                    if e[0] == 'create': seen.setdefault('%s m%d fALL%d %s' % (e[1], e[2], fr, e[5]), set()).add('r%d' % rg)
        for L in sorted(x for x in lits if x is not None):
            for rg in (0, 1):
                r = T.run(7, 0, 0, var, 0, rage=rg, stub={0x3a8430: 5, 0x49930: 10}, poke=POKE, fn=t, mot=mid, only=L)
                for e in r.get('ev', []):
                    if e[0] == 'create': seen.setdefault('%s m%d f%s %s' % (e[1], e[2], L, e[5]), set()).add('r%d' % rg)
        if seen: print('PF +%#x %#x mot %#x' % (off, t, mid), {k: sorted(v) for k, v in sorted(seen.items())}, flush=True)
print('# done', flush=True)
