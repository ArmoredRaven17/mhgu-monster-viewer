p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shell-capture.mjs'
s = open(p, encoding='utf-8', newline='').read()
pairs = [
    ("const LEVEL = opt('--level', null);\n",
     "const LEVEL = opt('--level', null);\n"
     "// --part <row>=<option>: set one part row of the panel (its data-row, e.g. '4,101', and an option's value or label, e.g.\n"
     "// 'Broken') before the clip runs -- the parts shown are what the shells' inputs read (index.html shellExtra: Bloodbath's\n"
     "// shell07 spawns by the tail severed, render/motion-states.js SHELL_TAIL em007_04 part 4)\n"
     "const PART = opt('--part', null);\n"),
    ("async function pageCapture(MONID, LISTID, CLIPNAME, VAR, N, WALLAT, ARMG, LVL){",
     "async function pageCapture(MONID, LISTID, CLIPNAME, VAR, N, WALLAT, ARMG, LVL, PARTSPEC){"),
    ("  if (LVL != null) V.state.level = LVL;\n",
     "  if (LVL != null) V.state.level = LVL;\n"
     "  if (PARTSPEC){\n"
     "    const i = PARTSPEC.lastIndexOf('='), row = PARTSPEC.slice(0, i), want = PARTSPEC.slice(i + 1);\n"
     "    const sel = [...document.querySelectorAll('#monGroups .field')].filter(x => x.dataset.row === row).map(x => x.querySelector('select'))[0];\n"
     "    const o = sel && [...sel.options].find(x => x.value === want || x.textContent === want);\n"
     "    if (!o) return { error: 'no part row ' + row + ' option ' + want };\n"
     "    sel.value = o.value; if (sel.onchange) await sel.onchange();\n"
     "  }\n"),
    ("${LEVEL == null ? 'null' : +LEVEL})`);",
     "${LEVEL == null ? 'null' : +LEVEL}, ${JSON.stringify(PART)})`);"),
]
for a, b in pairs:
    assert s.count(a) == 1, a
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8', newline='').write(s)

p = r'C:\MHGU-Extract\efx\record_shells.py'
s = open(p, encoding='utf-8', newline='').read()
pairs = [
    ("LEVEL = None\n_argv = []\nfor a in sys.argv[1:]:\n",
     "LEVEL = None\n"
     "# --part=<row>=<option>: one part row of the panel set for the capture (dev/shell-capture.mjs --part; Bloodbath's shell07\n"
     "# reads the tail severed from the parts shown). IN THE TAG, as the wall, the form and the level are.\n"
     "PART = None\n"
     "_argv = []\nfor a in sys.argv[1:]:\n"
     "    if a.startswith('--part='):\n"
     "        PART = a.split('=', 1)[1]\n"
     "        continue\n"),
    ("('_lv' + LEVEL if LEVEL else ''))",
     "('_lv' + LEVEL if LEVEL else '') + ('_p' + re.sub(r'\\W', '', PART) if PART else ''))"),
    ("(['--level', LEVEL] if LEVEL else []),",
     "(['--level', LEVEL] if LEVEL else []) + (['--part', PART] if PART else []),"),
]
for a, b in pairs:
    assert s.count(a) == 1, a
    s = s.replace(a, b)
open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
