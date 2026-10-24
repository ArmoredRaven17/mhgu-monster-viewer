import os
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')


def patch(p, pairs):
    b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for a, r in pairs:
        assert s.count(a) == 1, (p, a[:70], s.count(a)); s = s.replace(a, r)
    if crlf: s = s.replace('\n', '\r\n')
    open(p, 'wb').write(s.encode('utf-8'))


MS_TAIL = """    '3|Motion[17]': { dead: true },
    '3|Motion[12]': { dead: true, settled: true },
    '3|Motion[20]': { dead: true, settled: true },
  },
};
"""

patch('docs/render/motion-states.js', [
# Rajang: the cycle becomes the plain paralysis row (copy A); the trap moves to copy B below
("""    // the two take turns on the hold -- Bulldrome's shape (em030_00) -- each play showing the next.
    '3|Motion[13]': { cycle: [{ every: [['em023_00c', 1101], 60] },
                              { every: [['em023_00c', 1105], 42] }] },""",
 """    // the two took turns on the hold -- Bulldrome's shape (em030_00). [2026-10-15, Raven: "we simply replicate a shared
    // animation and use one of the shared effects for each animation" -- the cycle is replaced by COPIES: this row is copy A,
    // paralysis; copy B, the trap's hold, is '3|Motion[13]#B' (CLIP_VARIANTS below).]
    '3|Motion[13]': { every: [['em023_00c', 1101], 60] },"""),
# Seltas: his block, from the survey's probes (no states note exists for him)
("""  em020_04: crabLine('em020_04u', 'em020_00c'),
""",
 """  em020_04: crabLine('em020_04u', 'em020_00c'),
  // SELTAS (em076_00): no states note exists for him. The clips are the category survey's probes
  // (dev/carapaceons-neopterons-effects-survey.md, Seltas: efx/agents/notice-scratch/probe.py, em 0x4c, then scr.py --
  // emulated): exhaust (10, 0x1b) 0x17e7000 L3 M9; sleep (10, 0x1d) 0x17e6fd0 L3 M14, hold (10, 0x1e) 0x17e6fe0 L0 M19;
  // paralysis (10, 0x1f) 0x17e6fb0 L3 M13 hold; stun (10, 0x20) 0x17e7168 (not sided) L3 M26 -> L0 M19 (hold) -> L0 M20;
  // shock trap (10, 0x6e) 0x17e7230 L3 M1 to f60 -> L3 M13 hold. L0 M19 IS BOTH THE SLEEP HOLD AND THE STUN HOLD, and
  // Raven, 2026-10-15: "add an additional L0, M19. Label one A and one B, A is sleep and B is stun" -- so L0 M19 is
  // copied (CLIP_VARIANTS below): A carries the zzz, B the stun's held c 1103. L3 M13 is likewise paralysis (A) and the
  // trap's hold (B). L3 M1 is also the break reaction of parts 1-6, which shows nothing. His eyes, break sets, rage and
  // tired clips are not read: no rows for them.
  em076_00: {
    '3|Motion[9]':  { start: [['em076_00c', 1109]] },
    '3|Motion[1]':  { every: [['em076_00c', 1105], 42] },
    '0|Motion[19]': { every: [['em076_00c', 1102], 90], puffOff: true },          // copy A: asleep
    '3|Motion[13]': { every: [['em076_00c', 1101], 60] },                         // copy A: paralysed
    '3|Motion[26]': { hold: ['em076_00c', 1103] },
    '0|Motion[20]': { hold: ['em076_00c', 1103] },
  },
"""),
(MS_TAIL,
 MS_TAIL + """
// ONE CLIP, TWO STATES: COPIED. Raven, 2026-10-15: "add an additional L0, M19. Label one A and one B, A is sleep and B is
// stun", then for every hold the shock trap shares with paralysis: "we simply replicate a shared animation and use one of
// the shared effects for each animation". A clip listed here shows in the Clip menu once per copy -- 'Motion[19]_loop A',
// 'Motion[19]_loop B' (every _start / _loop piece of the motion) -- and plays the same clip; copy A is the clip's own row
// (and keeps the plain clip name, so saved views and checks still find it), any other copy is the row keyed
// '<list>|Motion[N]#<copy>'. Keyed by the motion, '<list>|Motion[N]'. index.html reads it (buildClips, state.clipVariant).
//   The shared shock-trap holds, each READ in its states note ((10, 0x6e) -> the hold, wait 0x200): Congalala L3 M6
// (states-em021_00.md 779), Blangonga L3 M9 (679), Rajang / Furious L3 M13 (states-em023_05.md 672), Lagombi / Snowbaron
// L3 M13 and L3 M73 -> M13 from f42 (states-em061_00.md 623), Nibelsnarf L3 M3_loop (states-em056_00.md 633). Seltas's
// two from the probes above.
export const CLIP_VARIANTS = {
  em076_00: { '0|Motion[19]': ['A', 'B'], '3|Motion[13]': ['A', 'B'] },
  em023_00: { '3|Motion[13]': ['A', 'B'] }, em023_05: { '3|Motion[13]': ['A', 'B'] },
  em021_00: { '3|Motion[6]': ['A', 'B'] },  em022_00: { '3|Motion[9]': ['A', 'B'] },
  em061_00: { '3|Motion[13]': ['A', 'B'], '3|Motion[73]': ['A', 'B'] },
  em061_04: { '3|Motion[13]': ['A', 'B'], '3|Motion[73]': ['A', 'B'] },
  em056_00: { '3|Motion[3]': ['A', 'B'] },
};
// the copies' own rows: B is the shock trap's hold (c 1105 every 42 while the action lasts), Seltas's L0 M19 B the stun
const TRAP_B = c => ({ every: [[c, 1105], 42] });
Object.assign(MOTION_STATES.em076_00, { '0|Motion[19]#B': { hold: ['em076_00c', 1103] }, '3|Motion[13]#B': TRAP_B('em076_00c') });
MOTION_STATES.em023_00['3|Motion[13]#B'] = TRAP_B('em023_00c');
MOTION_STATES.em023_05['3|Motion[13]#B'] = TRAP_B('em023_00c');
MOTION_STATES.em021_00['3|Motion[6]#B'] = TRAP_B('em021_00c');
MOTION_STATES.em022_00['3|Motion[9]#B'] = TRAP_B('em022_00c');
for (const id of ['em061_00', 'em061_04'])
  Object.assign(MOTION_STATES[id], { '3|Motion[13]#B': TRAP_B('em061_00c'), '3|Motion[73]#B': TRAP_B('em061_00c') });
MOTION_STATES.em056_00['3|Motion[3]#B'] = TRAP_B('em056_00c');
// the copy a Clip-menu value names: 'Motion[19]_loop#B' -> { clip: 'Motion[19]_loop', variant: 'B' } (no '#': copy A / none)
export function clipVariantOf(value){
  const m = /^(.*)#([^#]+)$/.exec(String(value || ''));
  return m ? { clip: m[1], variant: m[2] } : { clip: String(value || ''), variant: '' };
}
// the copies of one menu clip, or null: [{ value, label }] -- copy A keeps the plain clip name
export function clipVariantsFor(monId, list, clip){
  const base = String(clip).replace(/_(start|loop)$/, '');
  const v = CLIP_VARIANTS[monId] && CLIP_VARIANTS[monId][list + '|' + base];
  return v ? v.map((x, i) => ({ value: i === 0 ? clip : clip + '#' + x, label: clip + ' ' + x })) : null;
}
"""),
])

patch('docs/index.html', [
("import { MotionStates, MOTION_STATES, RAGE_BY_LEVEL, RAGE_PUFF, TIRED_DROOL, JOINT_SCALE, JointScale, shellTailInput, shellPartsInput, shellMudInput, glavenusHeat,",
 "import { MotionStates, MOTION_STATES, RAGE_BY_LEVEL, RAGE_PUFF, TIRED_DROOL, JOINT_SCALE, JointScale, shellTailInput, shellPartsInput, shellMudInput, glavenusHeat,\n         CLIP_VARIANTS, clipVariantOf, clipVariantsFor,"),
("""  monClipSel.innerHTML = '<option value="">Bind pose</option>' +
    clips.map(c => '<option value="' + c.clip + '">' + c.clip + ' &mdash; ' + c.dur.toFixed(2) + ' s</option>').join('');""",
 """  // ONE CLIP, TWO STATES (render/motion-states.js CLIP_VARIANTS): a copied motion shows once per copy, 'Motion[19]_loop A'
  // / 'Motion[19]_loop B'; the value of a copy past A carries '#B', which state.clipVariant keeps and state.clip does not
  monClipSel.innerHTML = '<option value="">Bind pose</option>' +
    clips.map(c => (clipVariantsFor(state.id, state.list, c.clip) || [{ value: c.clip, label: c.clip }])
      .map(v => '<option value="' + v.value + '">' + v.label + ' &mdash; ' + c.dur.toFixed(2) + ' s</option>').join('')).join('');"""),
("""    state.clip = pick ? pick.clip : '';
  }
  monClipSel.value = state.clip;
}""",
 """    state.clip = pick ? pick.clip : '';
    state.clipVariant = '';
  }
  monClipSel.value = state.clip + (state.clipVariant ? '#' + state.clipVariant : '');
  if (monClipSel.value === '' && state.clip){ state.clipVariant = ''; monClipSel.value = state.clip; }
}"""),
("""  state.list = list.id; state.clip = clip.clip;""", """  state.list = list.id; state.clip = clip.clip; state.clipVariant = '';"""),
("""  state.id = monSel.value; state.groups = null; state.list = ''; state.clip = '';""",
 """  state.id = monSel.value; state.groups = null; state.list = ''; state.clip = ''; state.clipVariant = '';"""),
("""  state.list = monListSel.value; state.clip = '';""", """  state.list = monListSel.value; state.clip = ''; state.clipVariant = '';"""),
("""    state.id = id; state.groups = null; state.list = ''; state.clip = '';""",
 """    state.id = id; state.groups = null; state.list = ''; state.clip = ''; state.clipVariant = '';"""),
("""monClipSel.onchange = async () => { state.clip = monClipSel.value; await play(); saveState(); };""",
 """monClipSel.onchange = async () => {
  const v = clipVariantOf(monClipSel.value);
  state.clip = v.clip; state.clipVariant = v.variant;
  await play(); saveState();
};"""),
# the row a play reads: the copy's own where the shown clip is a copy past A
("""  const row = (MOTION_STATES[state.id] || {})[list + '|' + clip] || null;""",
 """  const vkey = state.clipVariant && state.clip.replace(/_(start|loop)$/, '') === clip ? list + '|' + clip + '#' + state.clipVariant : null;
  const row = (MOTION_STATES[state.id] || {})[vkey] || (MOTION_STATES[state.id] || {})[list + '|' + clip] || null;"""),
("""function driveMotionStates(){
  const act = pose.action;
  const clipName = act && act.getClip ? act.getClip().name : null;
  const base = clipName ? clipName.replace(/_(start|loop)$/, '') : null;""",
 """function driveMotionStates(){
  const act = pose.action;
  const clipName = act && act.getClip ? act.getClip().name : null;
  const base = clipName ? clipName.replace(/_(start|loop)$/, '') : null;
  // a copied clip (CLIP_VARIANTS) past copy A reads its own row, '<list>|Motion[N]#B' -- the state table's key only
  const rowClip = base && state.clipVariant && state.clip.replace(/_(start|loop)$/, '') === base
                && (MOTION_STATES[state.id] || {})[state.list + '|' + base + '#' + state.clipVariant] ? base + '#' + state.clipVariant : base;"""),
("""              : motionStates.step(state.id, state.list, base, act ? act.time * 60 + loopStart : 0,""",
 """              : motionStates.step(state.id, state.list, rowClip, act ? act.time * 60 + loopStart : 0,"""),
])
print('ok')
