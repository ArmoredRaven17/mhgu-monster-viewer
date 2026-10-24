import os, json, re
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
def edit(path, pairs):
    p = os.path.join(D, path)
    s = open(p, encoding='utf-8', newline='').read()
    for a, b in pairs:
        assert s.count(a) == 1, (path, s.count(a), a[:90])
        s = s.replace(a, b)
    open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)

TAIL = '5,6,15,16,17,40,45,46,47,55,56,57,107'

# ---- index.html ----
edit('index.html', [
 # the reset takes levels.default
 ("""function resetMonsterState(){
  Object.assign(state, STATE_DEFAULTS);""",
  """function resetMonsterState(){
  Object.assign(state, STATE_DEFAULTS);
  // part-review `levels.default`: the rung a fresh mount opens on (Hellblade's Tail State: Blasted)
  { const lv = (reviewFor(state.id) || {}).levels; if (lv && Number.isInteger(lv.default)) state.level = lv.default; }"""),
 # buildGroups ends by placing the level control under its row
 ("""  buildAxisRows(e);
  buildAttachedRows(e);
  buildPartnerRow(e);""",
  """  buildAxisRows(e);
  buildAttachedRows(e);
  buildPartnerRow(e);
  placeLevelRow();"""),
 ("""// A VARIANT IS A WHOLE ALTERNATIVE MODEL SHARING ONE PART TABLE, AND THE PART GROUPS CANNOT SAY SO.""",
  """// THE LEVEL CONTROL UNDER THE ROW IT DRIVES. Raven, 2026-10-17: "Normal Glavenus, move Tail State to be below Tail" /
// "update Hellblade to use the same layout as Glavenus". part-review `levels.under` names that row's key; the control moves
// right after the row's field, and back to its own place (levelHome) for a monster that names none.
const levelHome = document.createComment('monLevelRow home');
{ const r = document.getElementById('monLevelRow'); r.parentNode.insertBefore(levelHome, r); }
function placeLevelRow(){
  const r = document.getElementById('monLevelRow');
  const under = ((reviewFor(state.id) || {}).levels || {}).under;
  const field = under != null ? [...monGroupsEl.children].find(x => x.dataset.row === String(under)) : null;
  if (field) field.after(r);
  else if (r.previousSibling !== levelHome) levelHome.after(r);
}
// A VARIANT IS A WHOLE ALTERNATIVE MODEL SHARING ONE PART TABLE, AND THE PART GROUPS CANNOT SAY SO."""),
 # Hellblade's heat input: the tail overheat is his Tail State's Blasted rung now (levelClip), the old synth items as before
 ("""    ? glavenusHeat(state.id, mounted.main && mounted.main.userData.partsDrawn, synthClipPicked(state.id, 'XfBA1__m04_tail', 'overheat_Loop'),""",
  """    ? glavenusHeat(state.id, mounted.main && mounted.main.userData.partsDrawn,
                   (state.id === 'em080_04' && levelClip() === 'overheat_Loop') || synthClipPicked(state.id, 'XfBA1__m04_tail', 'overheat_Loop'),"""),
 # the zone table's level keys: on while the level control sits on one of the listed rungs
 ("""  // A KEY A SYNTHETIC ROW ANSWERS BY ITS CLIP.""",
  """  // A KEY A LEVEL RUNG ANSWERS (Hellblade's Tail Blasted: his Tail State on Blasted). Its one row is the level control.
  const lvk = sw && sw.level && sw.level[key];
  if (lvk){
    const rows = [{ row: 'level', rv: null, offered: true, reps: lvk.slice(), broken: lvk.indexOf(state.level | 0) >= 0 }];
    return { key, groups: gs, rows, broken: rows[0].broken };
  }
  // A KEY A SYNTHETIC ROW ANSWERS BY ITS CLIP."""),
 ("""  const axisKey = row.indexOf('axis:') === 0 ? row.slice(5) : null;""",
  """  if (row === 'level'){ const f = document.getElementById('monLevelRow'); return f && !f.hidden ? f : null; }
  const axisKey = row.indexOf('axis:') === 0 ? row.slice(5) : null;"""),
])

# ---- monster.js: the rung's clip, and the zone key ----
edit(r'render\monster.js', [
 ("""    byLevel: ['normal', 'normal', 'dark_Change_Loop_End'],
    unless: { part: 17, clip: 'normal' },
  },
};""", """    byLevel: ['normal', 'normal', 'dark_Change_Loop_End'],
    unless: { part: 17, clip: 'normal' },
  },
  // HELLBLADE's TAIL STATE (em080_04; part-review `levels` Heated / Blasted, Raven 2026-10-17 "the same layout as Glavenus"):
  // the parts driver 0x100acf8 plays m04_tail's OVERHEAT clips while P+0x1bb 0x08 holds; the rung picks the clip the Tail
  // row's old "(Heated)" / "(Blasted)" items pinned. A severed tail keeps it, as those items did (Severed (Blasted)).
  em080_04: {
    mats: ['XfBA1__m04_tail'],
    byLevel: ['heat_Loop', 'overheat_Loop'],
  },
};"""),
 ("""    synthClip: { tailBlast: { XfBA1__m04_tail: 'overheat_Loop' } },""",
  """    // Tail Blasted is his Tail State's Blasted rung (part-review levels; index.html breakRowInfo `level`)
    level: { tailBlast: [1] },"""),
])

# ---- part-review.json ----
p = os.path.join(D, 'part-review.json')
t = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in t[:2000] else '\n'
d = json.loads(t)
# Glavenus: under
g = d['em080_00']['levels']
assert 'under' not in g
# Hellblade: the Tail row, rewritten in Glavenus's shape
hb = d['em080_04']
rows = hb['rows']
old = rows[TAIL]
assert old.get('synth') and old['name'] == 'Tail'
forms = [('Intact', '5,6,40,45,47,107'), ('Cracked', '6,15,16,40,46,47,55,56,107'), ('Severed', '15,17,40,55,57')]
key = lambda draw: draw + '|' + draw
new = {'name': 'Tail', 'state': 'level',
       'note': "Raven 2026-10-17: 'update Hellblade to use the same layout as Glavenus' -- Intact / Cracked / Severed here, Heated / Blasted on the Tail State control under it (levels). Each form draws the same parts in both states (the old six synth items, (Heated) and (Blasted), differed only in m04_tail's clip, which the rung now picks: render/monster.js ROM_CLIP_LADDER em080_04).",
       'sheds': {key(forms[2][1]): 'tail'},
       'default': key(forms[0][1]),
       'order': [key(x[1]) for x in forms],
       'options': {key(x[1]): x[0] for x in forms}}
# rebuild the json text: replace the row's value and add the levels, keeping the file's own formatting elsewhere
def dumps(o, ind):
    s = json.dumps(o, indent=1, ensure_ascii=False)
    return s.replace('\n', nl + ' ' * ind)
# locate the em080_04 entry's Tail row text
i = t.index('"em080_04": {')
j = t.index('"' + TAIL + '": {', i)
# find the matching close brace of that row
depth = 0; k = t.index('{', j)
for pos in range(k, len(t)):
    if t[pos] == '{': depth += 1
    elif t[pos] == '}':
        depth -= 1
        if depth == 0: end = pos + 1; break
indent = j - t.rfind(nl, 0, j) - len(nl)
t = t[:k] + dumps(new, indent) + t[end:]
# levels for Hellblade: after its "rows" object -- add as a sibling key right after '"em080_04": {'
i = t.index('"em080_04": {')
ins = i + len('"em080_04": {')
lv_hb = {'name': 'Tail State', 'rungs': ['Heated', 'Blasted'], 'default': 1, 'under': TAIL}
t = t[:ins] + nl + '  "levels": ' + dumps(lv_hb, 2) + ',' + t[ins:]
# Glavenus: add "under" inside his levels object
i = t.index('"em080_00": {')
j = t.index('"levels": {', i)
ins = j + len('"levels": {')
t = t[:ins] + nl + '   "under": "' + TAIL + '",' + t[ins:]
d2 = json.loads(t)
assert d2['em080_00']['levels']['under'] == TAIL and d2['em080_04']['levels']['default'] == 1
assert d2['em080_04']['rows'][TAIL]['state'] == 'level'
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(t); os.replace(p + '.tmp', p)
print('ok')
