import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\motion-states.js'
s = open(p, encoding='utf-8', newline='').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:90])
    s = s.replace(a, b)

# the driver: frame windows beside setsFrom
rep("""    // `setsFrom: [[frame, [sets]], ...]` -- sets the ROM applies only once the motion passes a frame (Thunderlord's dead body
    // at f230), laid over the row's own; null again where nothing applies, as a row without sets
    if (this.cur && this.cur.spec && this.cur.spec.setsFrom){
      if (this.cur.baseSets === undefined) this.cur.baseSets = this.cur.sets;
      const extra = [];
      for (const [f, ss] of this.cur.spec.setsFrom) if (frame >= f) extra.push(...ss);""",
"""    // `setsFrom: [[frame, [sets]], ...]` -- sets the ROM applies only once the motion passes a frame (Thunderlord's dead body
    // at f230) -- and `setsAt: [[from, to, [sets]], ...]` -- sets over a frame window, both ends included (Malfestio's eye
    // set 3, 0xff188c) -- laid over the row's own; null again where nothing applies, as a row without sets
    if (this.cur && this.cur.spec && (this.cur.spec.setsFrom || this.cur.spec.setsAt)){
      if (this.cur.baseSets === undefined) this.cur.baseSets = this.cur.sets;
      const extra = [];
      for (const [f, ss] of this.cur.spec.setsFrom || []) if (frame >= f) extra.push(...ss);
      for (const [a, b, ss] of this.cur.spec.setsAt || []) if (frame >= a && frame <= b) extra.push(...ss);""")

# Malfestio's rows
rep("""    '3|Motion[1]':  { levels: M_HEAD, fire: [null, null, [u, 1001]] },
    // L3 Motion[2] IS FOUR THINGS""", """    // (+ the eye set 3 over frames 2..12 -- the blink machine 0xff188c, dev/em079-hypnosis-and-gaps.md)
    '3|Motion[1]':  { levels: M_HEAD, fire: [null, null, [u, 1001]], setsAt: [[2, 12, [3]]] },
    // L3 Motion[2] IS FOUR THINGS""")
rep("""    '0|Motion[18]': { sets: [3] },
    '0|Motion[20]': { sets: [3] },
    // DEATH: L3 M17""", """    '0|Motion[18]': { sets: [3] },
    '0|Motion[20]': { sets: [3] },
    // THE ACTION SETS of the part pass 0xff05f8 (dev/em079-hypnosis-and-gaps.md; Raven, 2026-10-17: "Malfestio's Hypnosis
    // attack does not turn on the Hypnosis effect"): set 16 (group 31, the "Hypno Effect" row) while the action is (7, 0x10)
    // / (7, 0x12) -- the HYPNOSIS, L2 M16 -> M17 / M18 -> M19 (0xffb208) -- and set 14 (groups 9 + 105, the row named
    // "Torso" -- not a break: the DIVES' overlay) while it is (7, 0x15 / 0x16 / 0x18 / 0xcb / 0xda): L2 M21 -> M22 -> M25 ->
    // M23, L2 M24 -> M20 -> M25 -> M23 (0xffb3b4 / 0xffb5d8 / 0xff71cc). Set 15 / 13 otherwise. Nothing else plays these clips
    // (117 setMotion sites + the 9 turn tables, with a control), so every play carries the set, for the whole clip. L2 M23
    // also shows the eye set 3 over frames 4..64 (0xff188c).
    '2|Motion[16]': { sets: [16] }, '2|Motion[17]': { sets: [16] }, '2|Motion[18]': { sets: [16] }, '2|Motion[19]': { sets: [16] },
    '2|Motion[20]': { sets: [14] }, '2|Motion[21]': { sets: [14] }, '2|Motion[22]': { sets: [14] },
    '2|Motion[23]': { sets: [14], setsAt: [[4, 64, [3]]] }, '2|Motion[24]': { sets: [14] }, '2|Motion[25]': { sets: [14] },
    // DEATH: L3 M17""")
rep("""function nightcloak(){
  const t = malfestio('em079_04u');
  for (const k of ['3|Motion[17]', '3|Motion[12]', '3|Motion[20]'])
    t[k] = Object.assign({}, t[k], { start: [['em079_04u', 200]] });
  return t;
}""", """// [2026-10-17: u 200 is requested on death ONLY WHILE CLOAKED (0xff01c8..0xff0204, dev/em079-hypnosis-and-gaps.md G4); the
// viewer shows him uncloaked, so his death rows no longer fire it.] His L2 M24 is (7, 0xca) / (7, 0xd2)'s, which chain to
// (7, 0xcb) / (7, 0xda) only after it -- so no set 14 there (op 0x92 sends Malfestio to (7, 0x18), which has it).
function nightcloak(){
  const t = malfestio('em079_04u');
  t['2|Motion[24]'] = {};
  return t;
}""")
# the ground-pinned air clips
rep("""  em079_00: { flyOfs: 300 }, em079_04: { flyOfs: 300 },""",
    """  // Malfestio / Nightcloak: L2 M35 (0xff7aec), L1 M22 / M27 / M28 set posture 3 -- the unit on the ground (dev/em079-hypnosis-
  // and-gaps.md G5; his shells' floor snap needs it)
  em079_00: { flyOfs: 300, clips: MALF_GROUND }, em079_04: { flyOfs: 300, clips: MALF_GROUND },""")
rep("""export const AIR_HEIGHT = {""", """const MALF_GROUND = { '2|Motion[35]': { posture: 3 }, '1|Motion[22]': { posture: 3 }, '1|Motion[27]': { posture: 3 }, '1|Motion[28]': { posture: 3 } };
export const AIR_HEIGHT = {""")
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)
print('ok')
