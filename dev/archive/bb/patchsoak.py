p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\effect-live-soak.mjs'
s = open(p, encoding='utf-8', newline='').read()
pairs = [
    ("const viewerInputs = flag('--viewer-inputs');\n",
     "const viewerInputs = flag('--viewer-inputs');\n"
     "// --part <row>=<option>: one part row of the panel set before the soak (its data-row and an option's value or label, as\n"
     "// dev/shell-capture.mjs --part) -- the parts shown feed the shells' and the enable word's inputs (Bloodbath's tail severed)\n"
     "const partOpt = opt('--part');\n"),
    ("function pageSoak(MONID, ONLY, CAMERA, RAGE, WIRING, ROCK, BEAMSTATE, VIEWERINPUTS){",
     "function pageSoak(MONID, ONLY, CAMERA, RAGE, WIRING, ROCK, BEAMSTATE, VIEWERINPUTS, PARTSPEC){"),
    ("        monSel.value = MONID; await monSel.onchange();\n      }\n      V.state.loop = true;",
     "        monSel.value = MONID; await monSel.onchange();\n      }\n"
     "      if (PARTSPEC){\n"
     "        const i = PARTSPEC.lastIndexOf('='), row = PARTSPEC.slice(0, i), want = PARTSPEC.slice(i + 1);\n"
     "        const sel = [...document.querySelectorAll('#monGroups .field')].filter(x => x.dataset.row === row).map(x => x.querySelector('select'))[0];\n"
     "        const o = sel && [...sel.options].find(x => x.value === want || x.textContent === want);\n"
     "        if (!o) throw new Error('no part row ' + row + ' option ' + want);\n"
     "        sel.value = o.value; if (sel.onchange) await sel.onchange();\n"
     "      }\n"
     "      V.state.loop = true;"),
    ("${JSON.stringify(viewerInputs)})`)",
     "${JSON.stringify(viewerInputs)}, ${JSON.stringify(partOpt || null)})`)"),
]
NL=chr(10); CR=chr(13)
if CR+NL in s: pairs=[(a.replace(NL,CR+NL), b.replace(NL,CR+NL)) for a,b in pairs]
for a, b in pairs:
    assert s.count(a) == 1, a
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
