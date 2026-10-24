# Teostra's size-type option (Raven, 2026-10-18): a SECOND class control (CLASS_CONTROLS2, state.classCtl2), driving u 10 for
# u 0 in his aura hold by the ROM's rule (vt+0x208 0xe10f7c: id 1002 = u 10 while P+0x5cb6 == 1, at 0xe11120).
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
def patch(path, pairs):
    s = open(path, encoding='utf8', newline='').read()
    NL = '\r\n' if s.count('\r\n') > s.count('\n') / 2 else '\n'
    for a, b in pairs:
        a2, b2 = a.replace('\n', NL), b.replace('\n', NL)
        assert s.count(a2) == 1, (path, a[:80])
        s = s.replace(a2, b2)
    open(path, 'w', encoding='utf8', newline='').write(s)

patch(V + r'\render\motion-states.js', [
 ("              holds: c => c.ctl === 1 ? [['em027_00u', 0]] : [],\n              records: [0, 1].map(k => ['em027_00u', k, 'UNIQUE']) },",
  "              // u 10 for u 0 while P+0x5cb6 (the spawn entry's size type) == 1 (0xe11120): the Size Type control (CLASS_CONTROLS2)\n"
  "              holds: c => c.ctl === 1 ? [['em027_00u', c.ctl2 === 1 ? 10 : 0]] : [],\n"
  "              records: [0, 1, 10].map(k => ['em027_00u', k, 'UNIQUE']) },"),
 ("                ctl: user.classCtl | 0, eyesOff:",
  "                ctl: user.classCtl | 0, ctl2: user.classCtl2 | 0, eyesOff:"),
 ("export const CLASS_CONTROLS = {",
  "// A SECOND CLASS BYTE, where a monster needs two (state.classCtl2; index.html paintClassControl2). TEOSTRA's P+0x5cb6: the spawn\n"
  "// entry's size type, written once at spawn by 0x6fb64..0x6fb70 from the quest's rEmSetList [entry+3] (rom-map 0x6fb68). His\n"
  "// class reads it twice (every #0x5cb6 in 0xe10054..0xe1ab24; control: the known 0xe11120 found): 0xe11120, the aura hold --\n"
  "// == 1 holds id 1002 = u 10 for id 1001 = u 0 (CLASS_TIMERS.em027_00); and 0xe104fc in vt+0x1d8 (spawn setup) -- != 1 (and the\n"
  "// area 0x4987c not 4 / 6) sets P+0x3b4 bit 15, the mask of his eight conditional leg capsules (.bdd records 0-7, slot 5 on\n"
  "// joints 14-21), which duplicate the unconditional records 12-19 (the same slot, the same joints): no hit-zone change, and the\n"
  "// carve-table filter 0xc1ee4 that also reads P+0x3b4 is rewards. The shared code's own readers (0x6a1b8: id 0x1b, a distance\n"
  "// loop; the 0x64..0x67 quest modes; the reward / stat lookups 0x498a8 / 0x49214 / 0x5c8b4) draw nothing. So the one visual\n"
  "// reader is u 10. The ROM tests == 1 only: every other type behaves as 0. Working label, for Raven to name.\n"
  "export const CLASS_CONTROLS2 = {\n"
  "  em027_00: { key: 'sizeType', label: 'Size Type', options: [[0, 'Type 0'], [1, 'Type 1']],\n"
  "              title: 'P+0x5cb6, the spawn entry\\'s size type: 1 holds u 10 in place of u 0 while the Fire Aura is on (0xe11120).' },\n"
  "};\n"
  "export const CLASS_CONTROLS = {"),
])
patch(V + r'\index.html', [
 ("postureOf, turnAt, CEILING_ABOVE_GAME, clipHeat, airLift, BOULDER, CLASS_CONTROLS, trunkSnow083,",
  "postureOf, turnAt, CEILING_ABOVE_GAME, clipHeat, airLift, BOULDER, CLASS_CONTROLS, CLASS_CONTROLS2, trunkSnow083,"),
 ("#monBoulderRow,#monClassCtlRow,#monStateRow",
  "#monBoulderRow,#monClassCtlRow,#monClassCtl2Row,#monStateRow"),
 ("          <div class=\"field\" id=\"monClassCtlRow\" hidden>\n            <label for=\"monClassCtl\" id=\"monClassCtlLab\">State</label>\n            <select id=\"monClassCtl\"></select></div>\n",
  "          <div class=\"field\" id=\"monClassCtlRow\" hidden>\n            <label for=\"monClassCtl\" id=\"monClassCtlLab\">State</label>\n            <select id=\"monClassCtl\"></select></div>\n"
  "          <div class=\"field\" id=\"monClassCtl2Row\" hidden>\n            <label for=\"monClassCtl2\" id=\"monClassCtl2Lab\">State</label>\n            <select id=\"monClassCtl2\"></select></div>\n"),
 ("carry: 4, stance: 0, boulder: 0, classCtl: 0 };", "carry: 4, stance: 0, boulder: 0, classCtl: 0, classCtl2: 0 };"),
 ("  paintClassControl();\n  paintStance();", "  paintClassControl();\n  paintClassControl2();\n  paintStance();"),
 ("document.getElementById('monClassCtl').onchange = e => {",
  "// the second class byte (render/motion-states.js CLASS_CONTROLS2): Teostra's size type P+0x5cb6\n"
  "function paintClassControl2(){\n"
  "  const spec = CLASS_CONTROLS2[state.id] || null;\n"
  "  const row = document.getElementById('monClassCtl2Row'), sel = document.getElementById('monClassCtl2');\n"
  "  row.hidden = !spec;\n"
  "  sel.textContent = '';\n"
  "  if (!spec) return;\n"
  "  document.getElementById('monClassCtl2Lab').textContent = spec.label;\n"
  "  row.title = spec.title || '';\n"
  "  if (!spec.options.some(([v]) => v === (state.classCtl2 | 0))) state.classCtl2 = spec.options[0][0];\n"
  "  for (const [v, label] of spec.options){\n"
  "    const el = document.createElement('option');\n"
  "    el.value = String(v); el.textContent = label;\n"
  "    sel.appendChild(el);\n"
  "  }\n"
  "  sel.value = String(state.classCtl2 | 0);\n"
  "}\n"
  "document.getElementById('monClassCtl2').onchange = e => {\n"
  "  state.classCtl2 = +e.target.value | 0;\n"
  "  saveState();\n"
  "  plays.key = null; plays.motion = null;\n"
  "};\n"
  "document.getElementById('monClassCtl').onchange = e => {"),
 ("  if (Number.isInteger(o.classCtl) && o.classCtl >= 0 && o.classCtl < 256) state.classCtl = o.classCtl;\n",
  "  if (Number.isInteger(o.classCtl) && o.classCtl >= 0 && o.classCtl < 256) state.classCtl = o.classCtl;\n"
  "  if (Number.isInteger(o.classCtl2) && o.classCtl2 >= 0 && o.classCtl2 < 256) state.classCtl2 = o.classCtl2;\n"),
 ("action: plays.key ? plays.action : undefined, classCtl: state.classCtl | 0 }, now);",
  "action: plays.key ? plays.action : undefined, classCtl: state.classCtl | 0, classCtl2: state.classCtl2 | 0 }, now);"),
])
print('ok')
