def patch(p, pairs):
    s = open(p, encoding='utf8', newline='').read()
    for a, b in pairs:
        assert s.count(a) == 1, (p, s.count(a), a[:80])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf8', newline='').write(s)
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render'
patch(R + r'\motion-states.js', [(
"""  '3|Motion[13]':  { dead: true },
  // (10, 0x6c) 0x17ccb38""",
"""  '3|Motion[13]':  { dead: true },
  // THE TAIL SEVER, RE-READ WITH CONTROLS (2026-10-18, Raven: "monsters normally react to their tail being cut off"; spec 7):
  // (10, 0x72)'s script 0x17cca80 is ONE op, 0xfe with arg 0x17cc84c -- and op 0xfe (the stepper 0x9fe88) is not an end: with a
  // non-null arg it CHANGES THE ACTION to the arg's two bytes, here (1, 0x14), through 0x768c8. (1, 0x14)'s phase 0 sets L3 M9
  // (posture 0, 0xbf4d4 / 0xbf700 height calls -- the fall) and its phase 1, when that ends, L3 M8 (posture 3). vt+0x204 0xf08e7c
  // cuts the tail (0xc2274(e, 0, 0, 0x8e), joint 142) at (10, 0x72)'s start, and the follow runs the same update, so the tail
  // leaves at L3 M9 frame 0. The only 0xfe naming (1, 0x14) in the data image is this one; no traced action plays L3 M9 / M8.
  // Controls, the same trace: Rathian (10, 0x72) -> 0x1794c10 L3 M15, Glavenus part 6 -> 0x17ebbe0 L3 M15, Kushala part 2 ->
  // 0x17b4450 L3 M15 -> M16 -- each the viewer's drop row. The tail sets: 13 intact (group 16), 12 severed (group 23).
  '3|Motion[9]':    { levels: [[13], [12]], fire: [null, ['em058_00u', 900]], drops: true },
  // (10, 0x6c) 0x17ccb38""")])
patch(R + r'\tail-option.js', [(
"""  em027_00: { piece: 'em027_00_tail', joint: 143, above: 20, landing: ['em027_00u', 905] },""",
"""  em027_00: { piece: 'em027_00_tail', joint: 143, above: 20, landing: ['em027_00u', 905] },
  // AMATSU (2026-10-18, dev/em058_00-effects-spec.md 7): vt+0x204 0xf08e7c on (10, 0x72) with part 6 calls 0xc2274(e, 0, 0, 0x8e)
  // (emulated) -> JOINT 142; the reaction is the follow (1, 0x14), L3 M9 (motion-states.js). Descriptor [0x172ba68][46] = 0x1597594:
  // word 1 0x7d0a -> 0x159daa0[0x7d0a] = jamcrc(enemy\\em058\\em058_00\\mod\\em058_00_tail), word 2 -1, +0xb4 0x77ed. His .dtp's
  // +0x78 row holds 0.8 / 20.0 (dtp.py) -- 20 above, as Teostra's 0.9 / 20.0.
  em058_00: { piece: 'em058_00_tail', joint: 142, above: 20, landing: ['em058_00u', 905] },""")])
patch(R + r'\psl-mask.js', [(
"""              '3|Motion[18]': [{ action: [10, 0x6c] }, { action: [10, 0x6d], variant: 'B' }],""",
"""              '3|Motion[18]': [{ action: [10, 0x6c] }, { action: [10, 0x6d], variant: 'B' }],
              '3|Motion[9]': [{ action: [1, 0x14] }],""")])
print('ok')
