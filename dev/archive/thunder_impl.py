import os, json, re
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
p = os.path.join(D, 'render', 'motion-states.js')
s = open(p, encoding='utf-8', newline='').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:80])
    s = s.replace(a, b)
# the driver: sets added once the motion passes a frame
rep("""    // the motion is over -- a play-once clip held on its last frame (index.html `at.ended`): the part pass's "the clip
    // has ended" (0xb09c8), read by STATE_OVERLAY
    if (this.cur) this.cur.ended = !!(at && at.ended);""",
"""    // the motion is over -- a play-once clip held on its last frame (index.html `at.ended`): the part pass's "the clip
    // has ended" (0xb09c8), read by STATE_OVERLAY
    if (this.cur) this.cur.ended = !!(at && at.ended);
    // `setsFrom: [[frame, [sets]], ...]` -- sets the ROM applies only once the motion passes a frame (Thunderlord's dead body
    // at f230), laid over the row's own; null again where nothing applies, as a row without sets
    if (this.cur && this.cur.spec && this.cur.spec.setsFrom){
      if (this.cur.baseSets === undefined) this.cur.baseSets = this.cur.sets;
      const extra = [];
      for (const [f, ss] of this.cur.spec.setsFrom) if (frame >= f) extra.push(...ss);
      const all = (this.cur.baseSets || []).concat(extra);
      this.cur.sets = all.length ? all : this.cur.baseSets;
    }""")
# Thunderlord's death rows
rep("""  //   THE DEATH BODY AT FRAME 230. His dead branch applies set 1 only once the death clip passes frame 230 (200
  //   for motion 0x30d), and UNCONDITIONALLY -- unlike Zinogre he never reads `e+0xcb14`, so it does not matter
  //   whether he died charged. Before that frame the body keeps whatever it had. This table changes things at
  //   frame 0, so the death rows carry the back going dark (set 9) and the lid, and the body is left alone.""",
"""  //   THE DEATH BODY AT FRAME 230. His dead branch applies set 1 only once the death clip passes frame 230 (200
  //   for motion 0x30d), and UNCONDITIONALLY -- unlike Zinogre he never reads `e+0xcb14`, so it does not matter
  //   whether he died charged. Before that frame the body keeps whatever it had. WIRED 2026-10-17 (`setsFrom`): Raven,
  //   "Thunderlord: remove uncharged state option, only display it on death animation" -- set 1 IS the uncharged body,
  //   so the Charge State control no longer offers it and the death rows show it from f230 / f200.""")
rep("""    '3|Motion[21]': { dead: true, sets: [9, 2], clips: [{ mats: ['XfB__m02_light'], clip: 'Death' }] },
    '3|Motion[13]': { dead: true, sets: [9, 2], clips: [{ mats: ['XfB__m02_light'], clip: 'Death' }] },
  },
  // URAGAAN""", """    '3|Motion[21]': { dead: true, sets: [9, 2], setsFrom: [[230, [1]]], clips: [{ mats: ['XfB__m02_light'], clip: 'Death' }] },
    '3|Motion[13]': { dead: true, sets: [9, 2], setsFrom: [[200, [1]]], clips: [{ mats: ['XfB__m02_light'], clip: 'Death' }] },
  },
  // URAGAAN""")
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)

# part-review: two rungs, the rows' keys lose the third segment
q = os.path.join(D, 'part-review.json')
t = open(q, encoding='utf-8', newline='').read()
i = t.index('"em057_04": {')
depth = 0
for pos in range(t.index('{', i), len(t)):
    if t[pos] == '{': depth += 1
    elif t[pos] == '}':
        depth -= 1
        if depth == 0: j = pos + 1; break
seg = t[i:j]
m = re.search(r'"rungs": \[\s*"Charged",\s*"Overcharged",\s*"Uncharged"\s*\]', seg)
assert m
seg = seg[:m.start()] + '"rungs": ["Charged", "Overcharged"]' + seg[m.end():]
for old in ['0,9,15,16,18,23,30,100|0,9,15,16,18,23,40,41,100|0,6,15,17,23,100', '10,12|10,12|7', '11|11|8']:
    new = '|'.join(old.split('|')[:2])
    assert seg.count('"' + old + '"') >= 1, old
    seg = seg.replace('"' + old + '"', '"' + new + '"')
t = t[:i] + seg + t[j:]
d = json.loads(t)
m = d['em057_04']
assert m['levels']['rungs'] == ['Charged', 'Overcharged']
for k, v in m['rows'].items():
    if v.get('state') == 'level':
        for key in [v.get('default')] + list(v.get('options', {}).keys()) + list(v.get('order') or []):
            assert key is None or key.count('|') == 1, (k, key)
open(q + '.tmp', 'w', encoding='utf-8', newline='').write(t); os.replace(q + '.tmp', q)
print('ok')
