import os, json, re
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
def edit(path, pairs):
    p = os.path.join(D, path)
    s = open(p, encoding='utf-8', newline='').read()
    for a, b in pairs:
        assert s.count(a) == 1, (path, s.count(a), a[:80])
        s = s.replace(a, b)
    open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)

edit(r'render\monster.js', [(
"""  em070_00: [[2, 1]],                                  // Nerscylla -- confirmed at 0xf9bd30""",
"""  // Nerscylla -- RE-READ 2026-10-17 (dev/em070-part50-spec.md 5): his site has its OWN shape, `bl 0x81670; cmp r0,#1;
  // movne r1,#1; moveq r1,#2` (0xf9bd30..0xf9bd44), so ENRAGED takes set 2 (parts 1 / 12, the XfB__m01_add layer, on), calm
  // set 1. The [[2, 1]] "confirmed" here before was the header's shape applied to a site that does not have it (withdrawn
  // in rom-map); part-review's `none|1,12` row already showed the ROM's polarity.
  em070_00: [[1, 2]],""")])

edit(r'render\motion-states.js', [(
"""  // URAGAAN (em045_00) and CRYSTALBEARD (em045_04): E:\\offline\\decode\\notes\\states-em045_00.md, read by the""",
"""  // NERSCYLLA (em070_00): the part pass vt+0x210 0xf9bd10 applies set 16 (part 13 ON: 362 v on joints 130-133, the
  // extending JAWS) while the current motion e+0x4b4 is 0x206 / 0x207 / 0x20a / 0x21a / 0x254 / 0x255 / 0x422, set 17
  // (off) at every other moment -- 0xf9becc..0xf9bf18 / 0xf9bfc0; no action, frame, rage or break term, so the whole
  // motion, every play (dev/em070-part50-spec.md). Raven, 2026-10-17: "Nerscylla has a part that turns on for some of its
  // large bite attacks ... off when those animations are not being played". The actions: L2 M6 (7, 1) / (7, 0x3e) /
  // (7, 0xc) from f60, L2 M7 (7, 0x1e), L2 M10 (7, 2), L2 M26 (7, 0x3a), L2 M84 -> M85 (7, 0x3f), L4 M34 (7, 0x3b) /
  // (6, 2) / (12, 0). The Special list's copies of L2 M7 / M10 resolve to no list-2 row (no `motions` flag), so they
  // carry their own.
  em070_00: {
    '2|Motion[6]':  { sets: [16] }, '2|Motion[7]':  { sets: [16] }, '2|Motion[10]': { sets: [16] },
    '2|Motion[26]': { sets: [16] }, '2|Motion[84]': { sets: [16] }, '2|Motion[85]': { sets: [16] },
    '4|Motion[34]': { sets: [16] },
    'Special|S. L2 Motion 7': { sets: [16] }, 'Special|S. L2 Motion 10': { sets: [16] },
  },
  // URAGAAN (em045_00) and CRYSTALBEARD (em045_04): E:\\offline\\decode\\notes\\states-em045_00.md, read by the""")])

q = os.path.join(D, 'part-review.json')
t = open(q, encoding='utf-8', newline='').read()
i = t.index('"em070_00": {')
j = t.index('"13": {', i)
k = t.index('"default": "13"', j)
assert k - j < 400
t = t[:k] + '"default": "none"' + t[k + len('"default": "13"'):]
d = json.loads(t)
assert d['em070_00']['rows']['13']['default'] == 'none'
open(q + '.tmp', 'w', encoding='utf-8', newline='').write(t); os.replace(q + '.tmp', q)
print('ok')
