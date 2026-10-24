import os, json, re
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
p = os.path.join(D, 'index.html')
s = open(p, encoding='utf-8', newline='').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:80])
    s = s.replace(a, b)
rep("#monRageLevelRow,#monLevelRow,#monVariantRow,#monSizeRow,#monCarryRow,#monStateRow{gap:5px;margin-top:7px}",
    "#monRageLevelRow,#monLevelRow,#monVariantRow,#monSizeRow,#monCarryRow,#monStateRow,#monStanceRow{gap:5px;margin-top:7px}")
rep("""          <div class="field" id="monLevelRow" hidden><label for="monLevel" id="monLevelLab">Level</label>""",
    """          <!-- A STANCE: two states a monster's ACTIONS move it between, each with its own animation (part-review `stance`:
               Nakarkos's Disguise / Revealed). Picking one moves the transport to that state's view (none = the monster's
               opening view). -->
          <div class="field" id="monStanceRow" hidden><label for="monStance" id="monStanceLab">Stance</label>
            <select id="monStance"></select></div>
          <div class="field" id="monLevelRow" hidden><label for="monLevel" id="monLevelLab">Level</label>""")
rep("const STATE_DEFAULTS = { rage: false, tired: false, charged: false, heated: true, beamHeated: false, rageLevel: 0, level: 0, variant: 0, size: 0, carry: 4 };",
    "const STATE_DEFAULTS = { rage: false, tired: false, charged: false, heated: true, beamHeated: false, rageLevel: 0, level: 0, variant: 0, size: 0, carry: 4, stance: 0 };")
rep("""  paintCarry();
""", """  paintCarry();
  paintStance();
""")
rep("""function paintCarry(){""", """// THE STANCE CONTROL (part-review `stance: { name, options: [{ label, view? }] }`). Nakarkos: Raven, 2026-10-17, "Add a toggle
// for Disguise / Revealed. Disguise will play the current DA. Revealed will use L0, M50". The ROM's stance byte E+0xcac4
// (build/hitzone-states/state-decodes.md NAKARKOS): 1 the disguise (idle L0 M1; the Face table left alone), 2 the revealed
// form (L0 M50 among its clips; the Face table switching with the clip) -- set per action at its start (0x1066c14), stance 2
// at spawn above rank 4. Nothing else the model shows hangs on it, so the control moves the animation alone.
function paintStance(){
  const row = document.getElementById('monStanceRow'), sel = document.getElementById('monStance');
  const st = (reviewFor(state.id) || {}).stance;
  row.hidden = !(st && Array.isArray(st.options) && st.options.length > 1);
  if (row.hidden){ state.stance = 0; sel.textContent = ''; return; }
  document.getElementById('monStanceLab').textContent = st.name || 'Stance';
  sel.textContent = '';
  st.options.forEach((o, i) => { const el = document.createElement('option'); el.value = String(i); el.textContent = String(o.label); sel.appendChild(el); });
  if (!(state.stance >= 0 && state.stance < st.options.length)) state.stance = 0;
  sel.value = String(state.stance | 0);
}
document.getElementById('monStance').onchange = e => {
  const st = (reviewFor(state.id) || {}).stance;
  state.stance = +e.target.value | 0;
  const o = st && st.options[state.stance];
  setView(o && o.view ? o.view : null, 'stance');
  saveState();
};
function paintCarry(){""")
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)

q = os.path.join(D, 'part-review.json')
t = open(q, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in t[:2000] else '\n'
m = re.search(r'\n "em084_00": \{' + re.escape(nl), t)
assert m
i = m.end()
ins = ('  "stance": { "name": "Stance", "options": [ { "label": "Disguise" }, { "label": "Revealed", "view": { "list": "0", "clip": "Motion[50]_loop" } } ],' + nl +
       '    "note": "Raven 2026-10-17: Disguise plays the opening animation, Revealed L0 M50. ROM stance byte E+0xcac4: 1 disguise, 2 revealed (state-decodes.md NAKARKOS)." },' + nl)
t = t[:i] + ins + t[i:]
d = json.loads(t)
assert d['em084_00']['stance']['options'][1]['label'] == 'Revealed'
open(q + '.tmp', 'w', encoding='utf-8', newline='').write(t); os.replace(q + '.tmp', q)
print('ok')
