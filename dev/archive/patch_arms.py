import os, json
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')


def patch(p, pairs):
    b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for a, r in pairs:
        assert s.count(a) == 1, (p, a[:70], s.count(a)); s = s.replace(a, r)
    if crlf: s = s.replace('\n', '\r\n')
    open(p, 'wb').write(s.encode('utf-8'))


patch('docs/index.html', [
# the key text: ',S1' for the added part on, ',S1:0' when that item also names its own slime level
("""function optKeyText(o){ return o.sOn ? o.key + ',S' + o.sPart : o.key; }""",
 """function optKeyText(o){ return o.sOn ? o.key + ',S' + o.sPart + (o.sLevel !== undefined ? ':' + o.sLevel : '') : o.key; }"""),
("""  const sTok = t => /^s\\.?\\s*(?:part\\s*)?(\\d+)$/.exec(t.trim());
  const sHit = raw.split(',').map(sTok).find(Boolean);
  const sPart = sHit ? (sHit[1] | 0) : undefined;
  if (sHit) raw = raw.split(',').filter(t => !sTok(t)).join(',').trim();
  const sOf = o => o.sOn ? o.sPart : undefined;""",
 """  // ...and may name the slime LEVEL its item sets, "4,15,S1:0" -- Brachydios's Depleted arm (Raven, 2026-10-15: "Remap
  // the arms as needed"), the third item beside "4,15,S1" and "4,15" -- so the level is part of the match too.
  const sTok = t => /^s\\.?\\s*(?:part\\s*)?(\\d+)(?::(\\d+))?$/.exec(t.trim());
  const sHit = raw.split(',').map(sTok).find(Boolean);
  const sPart = sHit ? (sHit[1] | 0) + (sHit[2] !== undefined ? ':' + (sHit[2] | 0) : '') : undefined;
  if (sHit) raw = raw.split(',').filter(t => !sTok(t)).join(',').trim();
  const sOf = o => o.sOn ? o.sPart + (o.sLevel !== undefined ? ':' + o.sLevel : '') : undefined;"""),
("""      const optValue = o => o.sOn ? o.rep + ',S' + o.sPart : String(o.rep);""",
 """      const optValue = o => o.sOn ? o.rep + ',S' + o.sPart + (o.sLevel !== undefined ? ':' + o.sLevel : '') : String(o.rep);"""),
("""        const namesAdded = String(k).toLowerCase().split(',').some(t => /^s\\.?\\s*(?:part\\s*)?\\d+$/.test(t.trim()));""",
 """        const namesAdded = String(k).toLowerCase().split(',').some(t => /^s\\.?\\s*(?:part\\s*)?\\d+(?::\\d+)?$/.test(t.trim()));"""),
# the items: the added part's item is still level 1; a second added item sets level 0
("""  const off = o => Object.assign({}, o, { slimeArm: slot, slime: t.spawnLevel, sPart: slot + 1, sOn: false });
  // The added item leads its ROM twin. Raven dictated "In (Primed), In (Diminished), Br", and Primed
  // as the BRIGHTER green is a reading -- his words say which two greens, not which is which.
  const out = [];
  for (const o of opts){
    if (o === intact) out.push(Object.assign(off(o), { slime: S_PART_SLIME_LEVEL, sOn: true }));
    out.push(off(o));
  }
  return out;""",
 """  const off = o => Object.assign({}, o, { slimeArm: slot, slime: t.spawnLevel, sPart: slot + 1, sOn: false });
  // The added items lead their ROM twin. THREE INTACT ARMS, one per slime level the part driver shows (Raven, 2026-10-15:
  // "Brachy's arms go from Depleted (reduced slime) to Primed (normal slime) to Enraged (slime slightly grows)", then
  // "Remap the arms as needed", after the renders dev/shots/brachy-arms/): level 0 -- slime on the fist tips only -- is
  // DEPLETED, the key "<parts>,S<n>:0"; the spawn level 2 -- the normal coat -- is PRIMED, the ROM twin itself; level 1 --
  // the fullest coat -- is ENRAGED, "<parts>,S<n>". Level 0 is also the level the class's enable word reads as the arm
  // spent (psl-mask.js em063: c 130 / 131 / 140 / 141, the impact cloud on his punches). (Until 2026-10-15 the twins were
  // Primed = 1 and Diminished = 2, a reading of "In (Primed), In (Diminished), Br", and level 0 was not offered.)
  const out = [];
  for (const o of opts){
    if (o === intact){
      out.push(Object.assign(off(o), { slime: 0, sOn: true, sLevel: 0 }));
      out.push(Object.assign(off(o), { slime: S_PART_SLIME_LEVEL, sOn: true }));
    }
    out.push(off(o));
  }
  return out;"""),
])

p = 'docs/part-review.json'
b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
for side, key, s_tok, broken in (('Left Pounder', '4,15', 'S1', '5,16'), ('Right Pounder', '6,17', 'S2', '7,18')):
    i = s.index('"name": "%s"' % side, s.index('"em063_00": {'))
    assert i < s.index('"em063_05": {') if '"em063_05": {' in s and s.index('"em063_05": {') > s.index('"em063_00": {') else True
    j = s.index('"default"', i); k = s.index('\n', j)
    s = s[:j] + '"default": "%s",' % key + s[k:]
    j = s.index('"options"', i); k = s.index('}', j)
    new = ('"options": {\n     "%s,%s:0": "Depleted",\n     "%s": "Primed",\n     "%s,%s": "Enraged",\n     "%s": "Broken"\n    },\n'
           '    "order": ["%s,%s:0", "%s", "%s,%s", "%s"]') % (key, s_tok, key, key, s_tok, broken, key, s_tok, key, key, s_tok, broken)
    s = s[:j] + new + s[k + 1:]
d = json.loads(s)
for rk in ('4,5,15,16', '6,7,17,18'): print(rk, {k: v for k, v in d['em063_00']['rows'][rk].items() if k != 'note'})
if crlf: s = s.replace('\n', '\r\n')
open(p, 'wb').write(s.encode('utf-8'))

patch('docs/render/monster.js', [
("""// Raven, 2026-09-13, on normal Brachydios's arms: "they go from dimmer green to brighter green", then
// "Have Arms use In (Primed), In (Diminished), Br". Which LEVEL is Primed and which Diminished is a
// reading, not in the ROM: Primed = 1 (the brightest row), Diminished = 2 (the dimmer green, and the
// spawn level). Level 0, near black, is not offered.""",
 """// Raven, 2026-09-13, on normal Brachydios's arms: "they go from dimmer green to brighter green", then
// "Have Arms use In (Primed), In (Diminished), Br". Which LEVEL is Primed and which Diminished is a
// reading, not in the ROM: Primed = 1 (the brightest row), Diminished = 2 (the dimmer green, and the
// spawn level). Level 0, near black, is not offered.
//   [REMAPPED 2026-10-15. Rendered (dev/shots/brachy-arms/), level 0 is NOT near black -- it is slime on the fist tips
// only -- level 2 the normal coat and level 1 the fullest. Raven: "Depleted (reduced slime) to Primed (normal slime) to
// Enraged (slime slightly grows)", "Remap the arms as needed": Depleted = 0, Primed = 2 (the spawn level), Enraged = 1
// (index.html armSlimeOptions). The paragraph above is the old reading, kept.]"""),
])
print('ok')
