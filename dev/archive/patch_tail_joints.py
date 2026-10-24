import os
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')


def patch(p, pairs):
    b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for a, r in pairs:
        assert s.count(a) == 1, (p, a[:70], s.count(a)); s = s.replace(a, r)
    if crlf: s = s.replace('\n', '\r\n')
    open(p, 'wb').write(s.encode('utf-8'))


patch('docs/render/tail-option.js', [
("""  em047_00: { piece: 'em047_00_tail', joint: 143, above: 20, landing: ['em047_00u', 905] },""",
"""  //   2026-10-15: the drop joint is the sever call's kind byte, mov r3,#0x8e at 0xeabc90 = JOINT 142 -- 143 was u 900's
  // joint (WITHDRAWN; dev/leviathans-effects-survey.md). His .dtp has no option rows (dtp.py: +0x78 empty), so 20 S stands.
  em047_00: { piece: 'em047_00_tail', joint: 142, above: 20, landing: ['em047_00u', 905] },"""),
("""  em057_00: { piece: 'em057_00_tail', joint: 144, above: 20, landing: ['em057_00u', 905] },
  em057_04: { piece: 'em057_04_tail', joint: 144, above: 20, landing: ['em057_04u', 905] },""",
"""  //   2026-10-15: the sever call 0xeed254 passes kind byte 0x8f = JOINT 143 for both -- 144 was u 900's joint (WITHDRAWN;
  // dev/remaining-classes-effects-survey.md). No .dtp option rows on either (dtp.py: +0x78 empty), so 20 S stands.
  em057_00: { piece: 'em057_00_tail', joint: 143, above: 20, landing: ['em057_00u', 905] },
  em057_04: { piece: 'em057_04_tail', joint: 143, above: 20, landing: ['em057_04u', 905] },"""),
])
patch('dev/checks/em047_00.mjs', [
("""  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 143, 'his cut tail is on joint 143', TO.CUT_TAIL[MON]);""",
"""  // the drop joint is the sever call's kind byte 0x8e = 142 (0xeabc90), not u 900's 143
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 142, 'his cut tail drops from joint 142', TO.CUT_TAIL[MON]);"""),
])
patch('dev/checks/em057_00.mjs', [
("""  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 144, 'his cut tail is on joint 144', TO.CUT_TAIL[MON]);""",
"""  // the drop joint is the sever call's kind byte 0x8f = 143 (0xeed254), not u 900's 144
  check(TO.CUT_TAIL[MON] && TO.CUT_TAIL[MON].joint === 143, 'his cut tail drops from joint 143', TO.CUT_TAIL[MON]);"""),
])
print('ok')
