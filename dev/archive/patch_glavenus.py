import os
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')


def patch(p, pairs):
    b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for a, r in pairs:
        assert s.count(a) == 1, (p, a[:70], s.count(a)); s = s.replace(a, r)
    if crlf: s = s.replace('\n', '\r\n')
    open(p, 'wb').write(s.encode('utf-8'))


patch('docs/render/motion-states.js', [
("""export function shellPartsInput(monId, drawn){""",
"""// GLAVENUS / HELLBLADE's HEAT BYTE P+0x1bb as the viewer shows it (their enable word 0x1000910 reads nothing else;
// psl-mask.js em080, dev/em080_00-effects-spec.md 1): bit 0 tail dark, 1 tail hot, 2 throat lit, 3 tail overheat,
// 4 throat overheat.
//   Glavenus: bit 1 = part 40 drawn (only the hot sets 23 / 24 / 25 draw it; R). Bit 2 = part 60 drawn, the Throat row's
//   "Heated" (INFERRED: the ROM draws part 60 the whole life and lights it by a material clip, so this is the state the
//   user chose). Bit 0, the dark tail, has NO viewer state (material-only, no row offers it): STAND-IN 0, so the dark
//   forms (the same records at the same frames) show as the normal ones.
//   Hellblade: bits 1 and 2 always in life (the init sets both; states-em080_04.md 4). Bit 4 = part 70 drawn (set 5,
//   the Throat row's "Blasted"; R). Bit 3 = the Tail row's applied item pins XfBA1__m04_tail to overheat_Loop -- the
//   overheat moves no mesh, so the parts drawn cannot say it; index.html passes it.
export function glavenusHeat(monId, drawn, tailOverheat){
  const d = p => !!drawn && drawn.get(p) === true;
  if (monId === 'em080_00') return (d(40) ? 2 : 0) | (d(60) ? 4 : 0);
  if (monId === 'em080_04') return 2 | 4 | (tailOverheat ? 8 : 0) | (d(70) ? 0x10 : 0);
  return 0;
}
export function shellPartsInput(monId, drawn){"""),
])

patch('docs/render/psl-mask.js', [
("// GREAT MACCAO (em085_00), uEm085_00",
"""// GLAVENUS (em080_00) and HELLBLADE GLAVENUS (em080_04), one class uEm080_00 (vtable 0x17eac74), vtable +0x13c =
// 0x1000910, READ whole (0x1000910..0x1000970) and emulated (dev/em080_00-effects-spec.md 1). 0xca170 first, then two
// fields from the heat byte P+0x1bb (reached as [e+0x13f4+0x34] after the pre-indexed load) -- no motion, action,
// variant or part input:
//   throat: bit 4 (overheat, Hellblade) -> bits 28-30; else bit 2 (lit) -> bits 15-17; else bits 26-27;
//   tail:   bit 3 (overheat, Hellblade) -> bits 24-25; else bit 1 (hot) -> 18-19; else bit 0 (dark) -> 22-23;
//           else bits 20-21.
// So every clip's throat and tail effects come in forms, one per heat state (L2 M1 u 260 / 261 lit, c 42 / c 90 not;
// L2 M13 u 430 per tail state; L2 M14 c 51 + u 500 hot / normal / dark, u 511 + u 512 overheat ...).
// state.heat = that byte as the viewer shows it (motion-states.js glavenusHeat).
function em080(motion, action, state){
  const h = state.heat | 0;
  const throat = (h & 0x10) ? 0x70000000 : (h & 4) ? 0x38000 : 0xc000000;
  const tail = (h & 8) ? 0x3000000 : (h & 2) ? 0xc0000 : (h & 1) ? 0xc00000 : 0x300000;
  return throat | tail;
}

// GREAT MACCAO (em085_00), uEm085_00"""),
("em043_00: em043, em043_05: em043, em044_00 };", "em043_00: em043, em043_05: em043, em044_00,\n  em080_00: em080, em080_04: em080 };"),
("'em043_00', 'em043_05', 'em044_00'];", "'em043_00', 'em043_05', 'em044_00',\n  'em080_00', 'em080_04'];"),
])

patch('docs/index.html', [
("shellTailInput, shellPartsInput, shellMudInput,", "shellTailInput, shellPartsInput, shellMudInput, glavenusHeat,"),
("""function synthIndex(key, rv){""",
"""// whether the current monster's applied synthetic item pins material `mat` to `clip` (Hellblade's Tail "(Blasted)" items:
// XfBA1__m04_tail -> overheat_Loop, the one state of his heat byte no part shows; motion-states.js glavenusHeat)
function synthClipPicked(id, mat, clip){
  for (const [k, rv] of Object.entries(reviewRows(id))){
    if (!rv || !Array.isArray(rv.synth) || !rv.synth.length) continue;
    const it = rv.synth[synthIndex(k, rv)] || {};
    if (it.clip && it.clip[mat] === clip) return true;
  }
  return false;
}
function synthIndex(key, rv){"""),
("""  const mud = shellMudInput(state.id, mounted.main && mounted.main.userData.partsDrawn);""",
"""  const mud = shellMudInput(state.id, mounted.main && mounted.main.userData.partsDrawn);
  // Glavenus / Hellblade's heat byte P+0x1bb, all their word reads (psl-mask.js em080)
  const heat = /^em080_0[04]$/.test(state.id)
    ? glavenusHeat(state.id, mounted.main && mounted.main.userData.partsDrawn, synthClipPicked(state.id, 'XfBA1__m04_tail', 'overheat_Loop'))
    : 0;"""),
("""mud, rank: SHELL_QUEST_RANK, posture, charge, sunk })""", """mud, rank: SHELL_QUEST_RANK, heat, posture, charge, sunk })"""),
])
print('ok')
