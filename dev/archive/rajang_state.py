import os, json, re
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
p = os.path.join(D, 'index.html')
s = open(p, encoding='utf-8', newline='').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:80])
    s = s.replace(a, b)
rep("#monRageRow.folded,#monTiredRow.folded,#monRageLevelRow.folded{display:none !important}",
    "#monRageRow.folded,#monTiredRow.folded,#monRageLevelRow.folded,#monLevelRow.folded{display:none !important}")
# the painter: a level axis that owns rage is folded into the State dropdown, Exhausted after its rungs
rep("""  const rungs = !lvRow.hidden && ladderIsRage();
  const opts = [];
  if (rungs){""", """  const rungs = !lvRow.hidden && ladderIsRage();
  const opts = [];
  // A LEVEL AXIS THAT OWNS RAGE (part-review `levels.rage`: Rajang's Normal / Enraged / Armor Mode, Furious Rajang's) is the
  // state: its rungs are the options, then Exhausted. Raven, 2026-10-17: "Rajang: Combine state drop downs". Not where a
  // rung is itself exhaustion (levels.mat: Mizutsune / Soulseer keep their own State rung, the toggles hidden).
  const lvAxis = (reviewFor(state.id) || {}).levels, levelRow = document.getElementById('monLevelRow');
  const ownsRage = !!(lvAxis && Array.isArray(lvAxis.rage) && !tiredRung() && !levelRow.hidden);
  levelRow.classList.toggle('folded', ownsRage);
  if (ownsRage){
    for (const o of document.getElementById('monLevel').options) opts.push({ v: 'lv:' + o.value, t: o.textContent });
  } else if (rungs){""")
rep("""  const cur = state.tired ? 'tired' : rungs ? ((state.rageLevel | 0) > 0 ? 'rung:' + state.rageLevel : 'normal') : (state.rage ? 'rage' : 'normal');""",
    """  const cur = state.tired ? 'tired' : ownsRage ? 'lv:' + (state.level | 0)
            : rungs ? ((state.rageLevel | 0) > 0 ? 'rung:' + state.rageLevel : 'normal') : (state.rage ? 'rage' : 'normal');""")
# the handler: a level option drives the level control; Exhausted first moves that axis to its first rung without rage
rep("""  const rungs = !lvRow.hidden && ladderIsRage();
  if (v === 'tired'){ tb.checked = true; tb.onchange({ target: tb }); }
  else {
    if (state.tired){ tb.checked = false; tb.onchange({ target: tb }); }
    if (v.startsWith('rung:')){""", """  const rungs = !lvRow.hidden && ladderIsRage();
  const lvAxis = (reviewFor(state.id) || {}).levels, levSel = document.getElementById('monLevel');
  const ownsRage = !!(lvAxis && Array.isArray(lvAxis.rage) && !tiredRung() && !document.getElementById('monLevelRow').hidden);
  if (v === 'tired'){
    if (ownsRage && lvAxis.rage[state.level | 0]){
      const calm = lvAxis.rage.findIndex(r => !r);
      if (calm >= 0){ levSel.value = String(calm); levSel.onchange({ target: levSel }); }
    }
    tb.checked = true; tb.onchange({ target: tb });
  }
  else {
    if (state.tired){ tb.checked = false; tb.onchange({ target: tb }); }
    if (v.startsWith('lv:')){ levSel.value = v.slice(3); levSel.onchange({ target: levSel }); }
    else if (v.startsWith('rung:')){""")
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)

# part-review: Rajang's "Calm" rung reads "Normal" (Raven's name for the state)
q = os.path.join(D, 'part-review.json')
t = open(q, encoding='utf-8', newline='').read()
i = t.index('"em023_00": {')
m = re.compile(r'"rungs": \[\s*"Calm",').search(t, i)
assert m and m.start() - i < 20000
t = t[:m.start()] + '"rungs": ["Normal",' + t[m.end():]
d = json.loads(t)
assert d['em023_00']['levels']['rungs'][0] == 'Normal'
open(q + '.tmp', 'w', encoding='utf-8', newline='').write(t); os.replace(q + '.tmp', q)
print('ok')
