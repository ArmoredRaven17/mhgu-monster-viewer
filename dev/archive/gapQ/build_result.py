import os
H = os.path.dirname(os.path.abspath(__file__))
rd = lambda n: open(os.path.join(H, n), encoding='utf-8').read()
code = rd('code063.js').replace('//@@DATA063@@', rd('data063.js').rstrip())
rep = rd('replay063.out').splitlines()
keep, cur = [], None
for l in rep:
    if l.startswith('=='): cur = l; keep.append(l); n = 0; continue
    n += 1
    if n <= 6: keep.append(l)
    elif n == 7: keep.append('  ...')
mid = '''
## (b) The JS for docs/render/shells.js

Paste the block below anywhere after `m057`, `READERS01`, `READERS11` and `CREATE11` exist (the end of the file works: that is where the
replay's copy has it), and put these three hooks into `stepShells` (exactly what `apply063.py` does to the copy):

```js
  // 1. the action dispatch, beside the other classes' (before `} else if (a && a.code === 'em061'){`):
  } else if (a && a.code === 'em063'){
    spawn063(state, D, a, ctx, input, out, fresh);           // Brachydios's / Raging's fists, pools and lines
  // 2. after `if (D.perFrame007) perFrame007(...)` (line 4):
  if (D.perFrame063) perFrame063(state, D, ctx, input, out, fresh);   // Brachydios's / Raging's frame handler 0xf3552c (L2 M22's fists), line 4
  if (D.erupt063 && input.erupt063) eruptStep063(state, D, ctx, input, out);   // Raging's eruption 0xf46234 (the fuse's burn-out), line 4
  // 3. in the shells' move loop, beside base25's:
    else if (S.base === 'base35') step35(S, ctx, input, D, out);   // Brachydios's slime pools
```

`erupt063(state, D, ctx, input, out, slot)` is exported (the function the task names); `eruptStep063` is its per-step wrapper reading
`input.erupt063 = { slots: [..] }`. The replay drives the eruption through the input.

### The records to export `when: 'shell'` (neither docs/effects/em063_00.json nor em063_05.json holds any of them)

* **em063_00u**: 0 (em063_00_000, the pool), 10 (em063_00_003, the big pool), 1 (em063_00_001, the pool's explosion), 11 (em063_00_004, the
  big pool's explosion -- its efl has the type-25 cParticleNodeInfinite row the triage flags), 30 (em063_00_007, the line), 31
  (em063_00_008, the scatter), 50 (em063_00_011, the enraged fist), 40 (em063_00_011, both fists / the L2 M22 fist), 41 (em063_00_011, one
  fist). (51 only names the unmade mode 8.)
* **em063_05u**: 100 / 110 (em063_05_000, the pool calm / enraged), 10 (em063_05_002, the big pool), 1 / 111 (em063_00_001, the pools'
  explosions), 11 (em063_00_004), 30, 31, 50 (the Red fist, modes 3 / 14), 40, 41, 130 / 131 (em063_00_011, both / one fist enraged), 210
  (em063_00_001, the eruption). (21: no record; only the unmade mode 8 names it.)

```js
''' + code + '''```
'''
tail = rd('RESULT_tail.md').replace('@@REPLAY@@', '\n'.join(keep))
open(os.path.join(H, 'RESULT.md'), 'w', encoding='utf-8').write(rd('RESULT_head.md') + mid + tail)
print(len(rd('RESULT_head.md') + mid + tail))
