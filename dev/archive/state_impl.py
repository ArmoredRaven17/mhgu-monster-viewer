import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
s = open(p, encoding='utf-8', newline='').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:80])
    s = s.replace(a, b)

# CSS: the row's spacing, and the folded rows (kept as state holders, never shown)
rep("#monRageLevelRow,#monLevelRow,#monVariantRow,#monSizeRow,#monCarryRow{gap:5px;margin-top:7px}",
    "#monRageLevelRow,#monLevelRow,#monVariantRow,#monSizeRow,#monCarryRow,#monStateRow{gap:5px;margin-top:7px}\n"
    "#monRageRow.folded,#monTiredRow.folded,#monRageLevelRow.folded{display:none !important}")

# markup: the State dropdown, ahead of the two toggles it stands for
rep("""          <label class="chk switch" id="monRageRow" hidden><input type="checkbox" id="monRage"><span class="toggle"></span>Enraged</label>""",
    """          <!-- STATE: Normal / Enraged / Exhausted as ONE dropdown. Raven, 2026-10-17: "I would like the drop down for these three
               states since typically a monster cannot be Normal ... Enraged or Exhausted at the same time" (the game never has
               rage and exhaustion together: 0xbcd20, 0x76224). It drives the Enraged / Exhausted toggles below and, where the
               rage has levels, the Rage dropdown -- kept as the state's holders (folded, never shown), so every handler and
               every reader of their rows is unchanged. paintStateSelect builds it. -->
          <div class="field" id="monStateRow" hidden><label for="monState">State</label>
            <select id="monState"></select></div>
          <label class="chk switch" id="monRageRow" hidden><input type="checkbox" id="monRage"><span class="toggle"></span>Enraged</label>""")

# painter: called from paintTired, which every rage / exhaustion repaint ends in
rep("""  row.hidden = !can;
  document.getElementById('monTired').checked = !!state.tired;
}""", """  row.hidden = !can;
  document.getElementById('monTired').checked = !!state.tired;
  paintStateSelect();
}
// THE STATE DROPDOWN (monStateRow): Normal, then Enraged (the rage toggle's own label: part-review `rage.name`, e.g. Raging
// Brachydios's "Red slime") or -- where the rage has levels (a ladder that IS the enrage) -- each level by its rung name,
// then Exhausted where the monster tires. The toggles and the rage ladder it replaces stay as the state's holders, folded.
// Mizutsune / Soulseer keep their own State rung (levels with `tired`): the toggles are hidden there, so this stays hidden.
function paintStateSelect(){
  const row = document.getElementById('monStateRow'), sel = document.getElementById('monState');
  const rageRow = document.getElementById('monRageRow'), tiredRow = document.getElementById('monTiredRow');
  const lvRow = document.getElementById('monRageLevelRow'), lvSel = document.getElementById('monRageLevel');
  const rungs = !lvRow.hidden && ladderIsRage();
  const opts = [];
  if (rungs){
    for (const o of lvSel.options) opts.push(+o.value === 0 ? { v: 'normal', t: 'Normal' } : { v: 'rung:' + o.value, t: o.textContent });
  } else {
    opts.push({ v: 'normal', t: 'Normal' });
    if (!rageRow.hidden){
      const rv = (reviewFor(state.id) || {}).rage || null;
      opts.push({ v: 'rage', t: (rv && rv.name && !ladder.length) ? String(rv.name) : 'Enraged' });
    }
  }
  if (!tiredRow.hidden) opts.push({ v: 'tired', t: 'Exhausted' });
  rageRow.classList.add('folded'); tiredRow.classList.add('folded');
  lvRow.classList.toggle('folded', rungs);
  row.hidden = opts.length < 2;
  sel.textContent = '';
  for (const o of opts){ const el = document.createElement('option'); el.value = o.v; el.textContent = o.t; sel.appendChild(el); }
  const cur = state.tired ? 'tired' : rungs ? ((state.rageLevel | 0) > 0 ? 'rung:' + state.rageLevel : 'normal') : (state.rage ? 'rage' : 'normal');
  sel.value = opts.some(o => o.v === cur) ? cur : opts[0].v;
}""")

# handler: through the holders' own handlers
rep("""document.getElementById('monTired').onchange = e => {""", """document.getElementById('monState').onchange = e => {
  const v = e.target.value;
  const box = document.getElementById('monRage'), tb = document.getElementById('monTired');
  const lvRow = document.getElementById('monRageLevelRow'), lvSel = document.getElementById('monRageLevel');
  const rungs = !lvRow.hidden && ladderIsRage();
  if (v === 'tired'){ tb.checked = true; tb.onchange({ target: tb }); }
  else {
    if (state.tired){ tb.checked = false; tb.onchange({ target: tb }); }
    if (v.startsWith('rung:')){ lvSel.value = v.slice(5); lvSel.onchange({ target: lvSel }); }
    else if (v === 'rage'){ box.checked = true; box.onchange({ target: box }); }
    else if (rungs){ if ((state.rageLevel | 0) > 0){ lvSel.value = '0'; lvSel.onchange({ target: lvSel }); } }
    else if (state.rage){ box.checked = false; box.onchange({ target: box }); }
  }
  paintStateSelect();
};
document.getElementById('monTired').onchange = e => {""")
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)
print('ok')
