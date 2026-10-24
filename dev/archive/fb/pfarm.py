# pfarm.py <mon> (effects lane 2026-10-22, from pfgen.py): the PER-FRAME ATTACK-ARM census -- every 0x7db70 / 0x7ded8 / 0x7dee0 /
# 0x7df34 call of the class's per-frame vtable methods (+0x190..+0x240) per motion id, with the frame literal it is armed under.
# (pfgen.py's header follows:) the PER-FRAME shell census -- cengen11 runs a class's action main only, so a shell made by a per-frame
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
from unicorn import UC_HOOK_CODE
from unicorn.arm_const import UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3
ARMS = {0x7db70: 'arm', 0x7ded8: 'arm0', 0x7dee0: 'armT', 0x7df34: 'armX'}
GOT = []
def _hk(uc, addr, size, ud):
    GOT.append((ARMS[addr], uc.reg_read(UC_ARM_REG_R1), uc.reg_read(UC_ARM_REG_R2), 0 if addr == 0x7ded8 else uc.reg_read(UC_ARM_REG_R3)))
for _a in ARMS: T.mu.hook_add(UC_HOOK_CODE, _hk, begin=_a, end=_a)
slots = []
for off in list(range(0x190, 0x244, 4)) + [0x13c, 0x298, 0x29c, 0x2a0, 0x2a4, 0x2a8, 0x488]:   # (+ the PSL word, the class passes after the walker, vt+0x488)
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
                GOT.clear()
                r = T.run(7, 0, 0, var, 0, rage=rg, stub={0x3a8430: 5, 0x49930: 10}, poke=POKE, fn=t, mot=mid, frame=fr, frame2=fr)
                for e in r.get('ev', []):
                    if e[0] == 'ftest': lits.add(e[1])
                    if e[0] == 'ftest2': lits.add(e[2][1])
                for g in GOT: seen.setdefault(g, set()).add('ALL%d' % fr)
        for L in sorted(x for x in lits if x is not None):
            for rg in (0, 1):
                GOT.clear()
                r = T.run(7, 0, 0, var, 0, rage=rg, stub={0x3a8430: 5, 0x49930: 10}, poke=POKE, fn=t, mot=mid, only=L)
                for g in GOT: seen.setdefault(g, set()).add('f%s' % L)
        for (kind, slot, hid, fl), how in sorted(seen.items()):
            fs = sorted(h for h in how if h.startswith('f'))
            gate = fs[0][1:] if fs else '-1'
            print('PFARM +%#x mot L%d M%d %s slot %d hit %#x flags %#x gate %s  (%s)' % (off, mid >> 8, mid & 0xff, kind, slot, hid, fl, gate, ','.join(sorted(how))), flush=True)
print('# done', flush=True)
