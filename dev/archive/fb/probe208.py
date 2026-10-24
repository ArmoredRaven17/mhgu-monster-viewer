# probe208.py <class> <mon> <ppoke-json-list> : a class's vt+0x208 by motion id (0xb0944 stubbed; every list's clips), every frame literal it
# (0xb6fac -- e+0x1054 == G+0x49, the monster in the loaded area -- answered 1: true in the viewer)
# tests answered alone, under each block poke set -- the creates it makes (2026-10-18; probe025.py generalised)
import os, sys, json, struct
cls, mon, pokes = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
os.environ['FB_CLASS'] = cls; os.environ['FB_MON'] = mon
sys.argv = ['x']
import trgen as T
vt = T.CLS[cls]['vtable']
h208 = struct.unpack('<I', bytes(T.mu.mem_read(vt + 0x208, 4)))[0]
T.CLS[cls]['main'] = h208
M = json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\monsters.json', encoding='utf8'))
e = [x for x in M['monsters'] if x['id'] == mon][0]
mots = set()
import re
for l in e['lists']:
    if not str(l['id']).isdigit(): continue
    for c in l['clips']:
        m = re.match(r'Motion\[(\d+)\]', c['clip'])
        if m: mots.add((int(l['id']) << 8) | int(m.group(1)))
for mot in sorted(mots):
  for pk in pokes:
    pp = {T.P + int(k, 0): v for k, v in pk.items()}
    r = T.run(7, 0, 0, 0, 0, stub={0xb0944: mot, 0x3a8430: 5, 0xb6fac: 1}, poke=pp, frame=0, frame2=0)
    lits = sorted(set(e[1] for e in r.get('ev', []) if e[0] == 'ftest') | set(e[2][1] for e in r.get('ev', []) if e[0] == 'ftest2'))
    done = set(); todo = list(lits); out = set()
    for e in r.get('ev', []):
      if e[0] == 'create': out.add(('ALL0', e[1], e[2]))
    while todo:
      L = todo.pop(0)
      if L in done: continue
      done.add(L)
      r = T.run(7, 0, 0, 0, 0, stub={0xb0944: mot, 0x3a8430: 5, 0xb6fac: 1}, poke=pp, only=L)
      for e in r.get('ev', []):
        if e[0] == 'ftest' and e[1] not in done: todo.append(e[1])
        if e[0] == 'ftest2' and e[2][1] not in done: todo.append(e[2][1])
        if e[0] == 'create': out.add((L, e[1], e[2]))
    if out: print('L%d M%d %s' % (mot >> 8, mot & 0xff, json.dumps(pk)), sorted(out, key=str))
