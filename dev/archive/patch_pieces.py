import os
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')


def patch(p, pairs):
    b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for a, r in pairs:
        assert s.count(a) == 1, (p, a[:70], s.count(a)); s = s.replace(a, r)
    if crlf: s = s.replace('\n', '\r\n')
    open(p, 'wb').write(s.encode('utf-8'))


SPEC = 'dev/em044-em045-second-pieces-spec.md'
patch('docs/render/tail-option.js', [
("""  // (states-em044_00.md 0, 3.4)
  em044_00: { piece: 'em044_00_tail', joint: 142, above: 20, landing: ['em044_00u', 905] },""",
"""  // (states-em044_00.md 0, 3.4)
  //   WIRED 2026-10-15 (""" + SPEC + """): both sever calls are in his on-action-start hook vt+0x204 0xe83900 --
  // the tail 0xc2274(e, 0, 0, 0x8f) at 0xe839d8, so the drop joint is 0x8f = 143 (142 was u 900's joint, WITHDRAWN), and
  // the head 0xc2274(e, 1, 0, 3) at 0xe83bc8, JOINT 3. Both fly on CutTail itself (kind 2 on any em but 7 runs 0x73cd8;
  // emulated on his option list, u 906 at k 42, within 1e-4 of CutTail); his .dtp has no option rows, so both land 20 S
  // up. `drops: 'head'` on his head-break row takes the second piece.
  em044_00: { piece: 'em044_00_tail', joint: 143, above: 20, landing: ['em044_00u', 905],
              head: { piece: 'em044_00_head', joint: 3, above: 20, landing: ['em044_00u', 906] } },"""),
("""  // URAGAAN: u 900 names JOINT 142 and the sever is GATED on the tail already being at break level >= 1.
  em045_00: { piece: 'em045_00_tail', joint: 142, above: 20, landing: ['em045_00u', 905] },""",
"""  // URAGAAN: u 900 names JOINT 142 and the sever is GATED on the tail already being at break level >= 1.
  //   2026-10-15 (""" + SPEC + """): the sever call 0xc2274(e, 0, 0, 0x8e) at 0xe8fc48 drops at 0x8e = 142 on both
  // variants, and his .dtp HAS OPTION ROWS: the activation (0x740e8..0x74218) takes the landing height from row 0 for the
  // tail -- 75 S, where every entry before it assumed the shared 20 (WITHDRAWN for this class).
  em045_00: { piece: 'em045_00_tail', joint: 142, above: 75, landing: ['em045_00u', 905] },"""),
("""  // named -- the same gap Barroth's head has. (states-em045_00.md 4, 7)
  em045_04: { piece: 'em045_04_tail', joint: 144, above: 20, landing: ['em045_04u', 905] },""",
"""  // named -- the same gap Barroth's head has. (states-em045_00.md 4, 7)
  //   WIRED 2026-10-15 (""" + SPEC + """): the tail drops at 0x8e = JOINT 142 (144 was u 900's, WITHDRAWN) and 75 S
  // up (.dtp option row 0); the beard is 0xc2274(e, 1, 0, 4) at 0xe8fc84 (variant 4, part 0 only), JOINT 4, landing
  // 30 S up (row 1), u 906. Both on CutTail (em045_04_option.lmt is byte-identical to Barroth's). `drops: 'beard'`.
  em045_04: { piece: 'em045_04_tail', joint: 142, above: 75, landing: ['em045_04u', 905],
              beard: { piece: 'em045_04_head', joint: 4, above: 30, landing: ['em045_04u', 906] } },"""),
])

patch('docs/render/motion-states.js', [
("""  // NOT WIRED, and raised rather than approximated: **the head piece**. `CUT_TAIL` carries one `piece` per monster""",
"""  // [WIRED 2026-10-15 -- the paragraph below is the gap as it stood: CUT_TAIL.em044_00.head flies `em044_00_head` from
  //   joint 3 on CutTail and lands u 906; the head-break row's first arm carries `drops: 'head'`.
  //   """ + SPEC + """]
  // NOT WIRED, and raised rather than approximated: **the head piece**. `CUT_TAIL` carries one `piece` per monster"""),
("""    '3|Motion[1]':  { cycle: [{ levels: [[3, 9], [4, 10]], fire: [null, ['em044_00u', 901]] },""",
"""    '3|Motion[1]':  { cycle: [{ levels: [[3, 9], [4, 10]], fire: [null, ['em044_00u', 901]], drops: 'head' },"""),
("""  //   NOWHERE TO FLY -- the same gap Barroth's head has, raised here rather than dropped silently.
  em045_04: {""",
"""  //   NOWHERE TO FLY -- the same gap Barroth's head has, raised here rather than dropped silently.
  //   [WIRED 2026-10-15: CUT_TAIL.em045_04.beard flies `em045_04_head` from joint 4 and lands u 906 30 S up; the beard
  //   row's first arm carries `drops: 'beard'`. """ + SPEC + """]
  em045_04: {"""),
("""    '3|Motion[1]':  { cycle: [{ levels: [[3], [4]], fire: [null, ['em045_04u', 901]] },""",
"""    '3|Motion[1]':  { cycle: [{ levels: [[3], [4]], fire: [null, ['em045_04u', 901]], drops: 'beard' },"""),
])

patch(r'C:\MHGU-Extract\efx\add_effects.py', [
("""// a second piece (Bloodbath's horn, CUT_TAIL.em007_04.horn: u 906 at its own landing; dev/em007_04-undriven-spec.md 4.1)
if (ct && ct.horn) take(ct.horn.landing, 'event');""",
"""// every second piece (Bloodbath's horn, Barroth's head, Crystalbeard's beard: u 906 at its own landing;
// dev/em007_04-undriven-spec.md 4.1, dev/em044-em045-second-pieces-spec.md 4.3)
if (ct) for (const v of Object.values(ct)) if (v && typeof v === 'object' && !Array.isArray(v) && v.landing) take(v.landing, 'event');"""),
])
print('ok')
