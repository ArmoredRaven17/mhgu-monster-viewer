# probe025.py: Chameleos's vt+0x208 0xe00344 by motion id (0xb0944 stubbed), every frame literal it tests answered alone,
# over the class bytes ctl+0xc / +0x13 -- the creates it makes
import os, sys, json
os.environ['FB_CLASS'] = 'uEm025_00'; os.environ['FB_MON'] = 'em025_00'
sys.argv = ['x']
import trgen as T
T.CLS['uEm025_00']['main'] = 0xe00344
mots = list(range(0x201, 0x20c)) + list(range(0x102, 0x10b)) + [0x30e]
for mot in mots:
  for c0c in (0, 1):
    for c13 in (0, 1, 2):
      ctl = [0] * 0x40; ctl[0xc] = c0c; ctl[0x13] = c13
      r = T.run(7, 0, 0, 0, 0, stub={0xb0944: mot, 0x3a8430: 5}, ctl=ctl, frame=0, frame2=0)
      lits = sorted(set(e[1] for e in r.get('ev', []) if e[0] == 'ftest') | set(e[2][1] for e in r.get('ev', []) if e[0] == 'ftest2'))
      done = set(); todo = list(lits); out = []
      while todo:
        L = todo.pop(0)
        if L in done: continue
        done.add(L)
        r = T.run(7, 0, 0, 0, 0, stub={0xb0944: mot, 0x3a8430: 5}, ctl=ctl, only=L)
        for e in r.get('ev', []):
          if e[0] == 'ftest' and e[1] not in done: todo.append(e[1])
          if e[0] == 'ftest2' and e[2][1] not in done: todo.append(e[2][1])
          if e[0] == 'create': out.append((L, e[1], e[2], e[5]))
          if e[0] == 'chg': out.append((L, 'chg', e[1], e[2]))
      if out: print('L%d M%d c0c %d c13 %d' % (mot >> 8, mot & 0xff, c0c, c13), sorted(set(out)))
