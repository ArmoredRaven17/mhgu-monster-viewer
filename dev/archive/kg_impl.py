import os
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
cur = {'s': ''}
def load(p):
    cur['p'] = os.path.join(V, p); cur['s'] = open(cur['p'], encoding='utf-8', newline='').read()
def rep(a, b):
    s = cur['s']; assert s.count(a) == 1, (s.count(a), a[:80]); cur['s'] = s.replace(a, b)
def save():
    open(cur['p'] + '.tmp', 'w', encoding='utf-8', newline='').write(cur['s']); os.replace(cur['p'] + '.tmp', cur['p'])

load(r'docs\render\psl-mask.js')
rep("export const CLASS_MASK = { em001_00:", """// KHEZU (em003_00), uEm003_00 vt+0x13c = 0xd0f728, READ whole (..0xd0f9a0) and emulated (dev/em003_00-effects-spec.md:
// 66,744 runs, 0 mismatches). The enraged group (bits 9-11) follows the ACTION: the charged attacks set it, their plain
// twins and the walks clear it (the AI issues the charged form while enraged, EMC op 0x1c). L2 M37 adds bits 15-16 (u 261),
// or 17-18 on (7, 0x52)'s second play (P+0x1a1 == 3: the entry's `phase`, state.phase); L2 M38 adds 19-20 (u 320) under
// (7, 0x52) only.
const EM003_OFF7 = new Set([0x00, 0x02, 0x0f, 0x11, 0x12, 0x30, 0x44, 0x48, 0x4e]);
const EM003_ON7 = new Set([0x09, 0x0a, 0x0b, 0x10, 0x3b, 0x49, 0x4f]);
const EM003_OFF3 = new Set([0x43, 0x4f, 0x55]);
const EM003_OFF2 = new Set([0x00, 0x05, 0x06, 0x07, 0x08, 0x0a, 0x0e]);
function em003_00(motion, action, state){
  const s = action ? action[0] : -1, n = action ? action[1] : -1;
  const off = (s === 7 && EM003_OFF7.has(n)) || (s === 3 && EM003_OFF3.has(n)) || (s === 2 && EM003_OFF2.has(n));
  let set = s === 7 && EM003_ON7.has(n) ? 0xe00 : 0;
  const a52 = s === 7 && n === 0x52;
  if (motion === 0x226) set |= a52 ? 0x180000 : 0;
  else if (motion === 0x225) set |= a52 && (state.phase | 0) === 3 ? 0x60000 : 0x18000;
  return { set, clear: off ? 0xe00 : 0 };
}
// GRAVIOS (em005_00), uEm004_00 vt+0x13c 0xd2e0ec with its em-5 tail 0xd2e35c..0xd2e524, READ whole and emulated
// (dev/em005_00-effects-spec.md: 82,800 runs, 0 mismatches). The gas clips by action and the BACK break; the beam clips by
// action and the back / belly breaks (state.backBroken / bellyBroken: SHELL_PARTS em005_00, the groups only the broken sets
// draw); L0 M7 the burrow (state.sunk, the viewer's false stand-in).
const EM005_GAS = new Set([0x203, 0x204, 0x21e, 0x21f, 0x220]);
const EM005_BEAM = new Set([0x218, 0x221, 0x43b]);
function em005_00(motion, action, state){
  const n = action && action[0] === 7 ? action[1] : -1;
  if (EM005_GAS.has(motion)){
    if (n === 0x0a || n === 0x32 || n === 0x3c) return state.backBroken ? 0x180000 : 0x18000;
    if (n === 0x07 || n === 0x3b) return state.backBroken ? 0x600000 : 0x60000;
    return 0;
  }
  if (EM005_BEAM.has(motion)){
    if (n !== 0x0e && n !== 0x11 && n !== 0x34) return 0;
    return state.backBroken ? 0xe0000000 : state.bellyBroken ? 0x3800000 : 0;
  }
  if (motion === 0x007) return state.sunk ? 0 : 0x18000000;
  return 0;
}

export const CLASS_MASK = { em003_00, em005_00, em001_00:""")
rep("  'em001_00', 'em001_02', 'em001_04', 'em002_00', 'em002_02', 'em002_04',",
    "  'em001_00', 'em001_02', 'em001_04', 'em002_00', 'em002_02', 'em002_04', 'em003_00', 'em005_00',")
rep("  // NIGHTCLOAK, L1 M27:", """  // KHEZU (dev/em003_00-effects-spec.md 2): each entry's `rage` is the charged form the AI issues while enraged (op 0x1c);
  // L2 M37's (7, 0x52) plays twice, the second with P+0x1a1 = 3 (`phase`, clipPhaseFor)
  em003_00: {
    '0|Motion[6]':  [{ action: [2, 5] }, { action: [2, 7], rage: [7, 0xb] }],
    '2|Motion[4]':  [{ action: [7, 0], rage: [7, 9] }, { action: [7, 0x4e], rage: [7, 0x4f] }, { action: [7, 0x11] }, { action: [7, 0x57] }],
    '2|Motion[5]':  [{ action: [7, 0], rage: [7, 9] }, { action: [7, 0x4e], rage: [7, 0x4f] }, { action: [7, 0x11] }, { action: [7, 0x57] },
                     { action: [7, 0x12] }, { action: [3, 0x43] }],
    '2|Motion[39]': [{ action: [7, 0], rage: [7, 9] }, { action: [7, 0x4e], rage: [7, 0x4f] }, { action: [7, 0x11] }, { action: [7, 0x57] },
                     { action: [7, 0x12] }, { action: [3, 0x43] }],
    '2|Motion[10]': [{ action: [7, 2], rage: [7, 0xa] }],
    '2|Motion[74]': [{ action: [7, 0xf], rage: [7, 0x10] }],
    '2|Motion[37]': [{ action: [7, 0x2c] }, { action: [7, 0x52], phase: 1 }, { action: [7, 0x52], phase: 3 }],
    '2|Motion[38]': [{ action: [7, 0x2c] }, { action: [7, 0x52] }],
  },
  // GRAVIOS (dev/em005_00-effects-spec.md 2): `tired` is the form his tired streams issue
  em005_00: {
    '2|Motion[3]':  [{ action: [7, 0xa] }, { action: [7, 7] }, { action: [7, 5], tired: [7, 0xf] }, { action: [7, 0x15], tired: [7, 0x10] }],
    '2|Motion[4]':  [{ action: [7, 0xa] }, { action: [7, 7] }, { action: [7, 5], tired: [7, 0xf] }, { action: [7, 0x15], tired: [7, 0x10] }],
    '2|Motion[30]': [{ action: [7, 0x32] }],
    '2|Motion[31]': [{ action: [7, 0x32] }],
    '2|Motion[32]': [{ action: [7, 0x32] }],
    '2|Motion[33]': [{ action: [7, 0xe], tired: [7, 0xd] }],
    '2|Motion[24]': [{ action: [7, 0x11], tired: [7, 0xc] }],
    '4|Motion[59]': [{ action: [7, 0x34], tired: [7, 0x38] }],
  },
  // NIGHTCLOAK, L1 M27:""")
rep("""export const ACTION_EFFECTS = {
  em004_00: {""", """export const ACTION_EFFECTS = {
  // GRAVIOS: the same class routine at frame 216 with no em test (dev/em005_00-effects-spec.md 5) -- his own em005_00u
  // UNIQUE 0 / 30 for (7, 0x0a) / (7, 0x07). His (7, 5 / 0xf / 0x15 / 0x10) ask for u 60 / 70 / 90 / 100, which his pel
  // lacks (what 0x6feb8 does then: NR) -- not listed.
  em005_00: {
    '2|Motion[3]': { frame: 216, by: { '7:0x0a': ['em005_00u', 0, 'UNIQUE'], '7:0x07': ['em005_00u', 30, 'UNIQUE'] } },
  },
  em004_00: {""")
rep("""export function clipPostureFor(monId, list, clip, n){""", """// the P+0x1a1 phase a play stands for, where the entry names it (Khezu's L2 M37 (7, 0x52) second play); undefined elsewhere
export function clipPhaseFor(monId, list, clip, n){
  const t = CLIP_ACTIONS[monId], a = t && t[String(list) + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (!a || !a.length) return undefined;
  return a[((n | 0) % a.length + a.length) % a.length].phase;
}
export function clipPostureFor(monId, list, clip, n){""")
save()

load(r'docs\render\motion-states.js')
rep("export const SHELL_PARTS = { em005_00: { headBroken: 3 },",
    "// Gravios's back / belly (psl-mask.js em005_00): group 17 only set 18 draws (back >= .dtp row 0), group 11 only set 12\n"
    "// (belly >= row 2) -- the word's and ctl+0x24's own tests (dev/em005_00-effects-spec.md 3; false at rest: I)\n"
    "export const SHELL_PARTS = { em005_00: { headBroken: 3, backBroken: 17, bellyBroken: 11 },")
save()

load(r'docs\index.html')
rep("import { pslMask, clipActionFor, clipPostureFor, clipSunkFor,", "import { pslMask, clipActionFor, clipPostureFor, clipPhaseFor, clipSunkFor,")
rep("  const beardOff = !!partsIn.beardOff;           // Crystalbeard's word reads the beard cut (psl-mask.js em045)\n",
    "  const beardOff = !!partsIn.beardOff;           // Crystalbeard's word reads the beard cut (psl-mask.js em045)\n"
    "  const backBroken = !!partsIn.backBroken, bellyBroken = !!partsIn.bellyBroken;   // Gravios's (psl-mask.js em005_00)\n"
    "  const phase = clipPhaseFor(state.id, list, clip, plays.n);   // Khezu's L2 M37 second play (psl-mask.js em003_00)\n")
rep("questLevel: SHELL_QUEST_LEVEL, heat, posture, charge, sunk, carry })",
    "questLevel: SHELL_QUEST_LEVEL, heat, posture, charge, sunk, carry, backBroken, bellyBroken, phase })")
save()
print('ok')
