import os
ROOT = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
def patch(rel, pairs):
    p = os.path.join(ROOT, rel)
    raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
    s = raw.decode('utf-8').replace('\r\n', '\n') if crlf else raw.decode('utf-8')
    for old, new in pairs:
        assert s.count(old) == 1, (rel, old[:70], s.count(old))
        s = s.replace(old, new)
    if crlf: s = s.replace('\n', '\r\n')
    open(p + '.tmp', 'wb').write(s.encode('utf-8')); os.replace(p + '.tmp', p)
    print('patched', rel)

# the label is the Beam Test's alone (Raven, 2026-10-01: "For beams outside of the Beam Test animation, we don't need the
# display saying what beam it is")
patch(r'docs\index.html', [
("""import { pickVariantsFor, beamLabelFor, BEAM_TYPES } from './render/shells.js';""",
 """import { pickVariantsFor, BEAM_TYPES } from './render/shells.js';"""),
("""// the beam showcase's label: the type this play of Basarios's Special 'Beam Test' fires (render/beam-types.js), or hidden
const beamLabel = document.getElementById('beamLabel');
let beamLabelShown = null;
function paintBeamLabel(variant, clipName){
  const m = /^beam:(\\d+)$/.exec(variant || ''), t = m && BEAM_TYPES[+m[1]];
  // a beam on its own monster: the pick this play fires, and the state it needs (render/beam-spawns.js)
  const own = !m && clipName ? beamLabelFor(state.id, state.list, clipName, variant, beamState()) : null;
  const text = own ? own : !t ? null : 'Beam Test '""",
 """// the beam showcase's label: the type this play of Basarios's Special 'Beam Test' fires (render/beam-types.js), or hidden.
// The Beam Test's alone -- a beam on its own monster shows no label (Raven, 2026-10-01: "For beams outside of the Beam
// Test animation, we don't need the display saying what beam it is")
const beamLabel = document.getElementById('beamLabel');
let beamLabelShown = null;
function paintBeamLabel(variant){
  const m = /^beam:(\\d+)$/.exec(variant || ''), t = m && BEAM_TYPES[+m[1]];
  const text = !t ? null : 'Beam Test '"""),
("""  paintBeamLabel(names.length ? names[Math.max(0, rockPlays.n) % names.length] : null, clipName);""",
 """  paintBeamLabel(names.length ? names[Math.max(0, rockPlays.n) % names.length] : null);"""),
])
patch(r'docs\render\shells.js', [
("""import { BEAM_SPAWNS, beamRowsFor, beamRowsLabel } from './beam-spawns.js';""",
 """import { BEAM_SPAWNS, beamRowsFor } from './beam-spawns.js';"""),
("""// the viewer's beam label for a play of a clip carrying beams on their own monster (render/beam-spawns.js), or null
export function beamLabelFor(monId, list, clip, variant, opts){
  return beamRowsLabel(monId, list, clip, variant, opts, BEAM_MODES);
}
""", ""),
])
patch(r'docs\render\beam-spawns.js', [
("""//   label        what the viewer's beam label adds for this pick (a state the viewer cannot show, named)
""", ""),
("""    { list: '2', clip: 'Motion[8]',  frame: 24, type: 'em024_00:0', action: [7, 0x15], when: { rage: true }, label: 'enraged, on a stage other than 3 / 14 / 20' },
    { list: '2', clip: 'Motion[8]',  frame: 24, type: 'em024_00:1', action: [7, 0x15], variant: '7:0x15 stage', when: { rage: true },
      label: 'enraged, on stage 3, 14 or 20 (e+0x1053, which the viewer does not have)' },
    { list: '2', clip: 'Motion[27]', frame: 24, type: 'em024_00:0', action: [7, 0x1a], when: { rage: false } },
    { list: '2', clip: 'Motion[27]', frame: 24, type: 'em024_00:0', action: [7, 0x1a], when: { rage: true }, label: 'enraged, on a stage other than 3 / 14 / 20' },
    { list: '2', clip: 'Motion[27]', frame: 24, type: 'em024_00:1', action: [7, 0x1a], variant: '7:0x1a stage', when: { rage: true },
      label: 'enraged, on stage 3, 14 or 20 (e+0x1053, which the viewer does not have)' },""",
 """    { list: '2', clip: 'Motion[8]',  frame: 24, type: 'em024_00:0', action: [7, 0x15], when: { rage: true } },     // any other stage
    { list: '2', clip: 'Motion[8]',  frame: 24, type: 'em024_00:1', action: [7, 0x15], variant: '7:0x15 stage', when: { rage: true } },   // stage 3 / 14 / 20
    { list: '2', clip: 'Motion[27]', frame: 24, type: 'em024_00:0', action: [7, 0x1a], when: { rage: false } },
    { list: '2', clip: 'Motion[27]', frame: 24, type: 'em024_00:0', action: [7, 0x1a], when: { rage: true } },    // any other stage
    { list: '2', clip: 'Motion[27]', frame: 24, type: 'em024_00:1', action: [7, 0x1a], variant: '7:0x1a stage', when: { rage: true } },  // stage 3 / 14 / 20"""),
("""// the beam label's text for a play of a clip carrying rows (the pick the play names), or null
export function beamRowsLabel(monId, list, clip, variant, opts, modes){
  const rows = beamRowsFor(monId, list, clip, opts);
  const pick = new Set(rows.map(r => r.variant)).size > 1 ? rows.filter(r => r.variant === variant) : rows;
  if (!pick.length) return null;
  const t0 = modes.find(x => x.id === pick[0].type), picks = [...new Set(rows.map(r => r.variant))];
  return 'Beam: ' + (t0 ? t0.name : monId) + ' (' + pick[0].action.map((x, i) => i ? '0x' + x.toString(16) : x).join(', ') + ') -- ' +
    pick.map(r => (r.atStart ? 'first frame' : 'f' + r.frame) + ' ' + r.type).join(', ') +
    (pick[0].label ? ' -- ' + pick[0].label : '') + (picks.length > 1 ? '  [pick ' + (1 + picks.indexOf(pick[0].variant)) + ' / ' + picks.length + ']' : '');
}
""", ""),
])
