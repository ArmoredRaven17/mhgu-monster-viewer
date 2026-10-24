import os
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')


def patch(p, pairs):
    b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for a, r in pairs:
        assert s.count(a) == 1, (p, a[:70], s.count(a)); s = s.replace(a, r)
    if crlf: s = s.replace('\n', '\r\n')
    open(p, 'wb').write(s.encode('utf-8'))


TRAP15 = """  await play('3', 'Motion[14]'); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[15]'); await frames(3);
  check(same(fired, [1105]) && isSet(drawn(), 2), 'L3 Motion[15] play 3 is the shock trap: c 1105 at once (every 42 while it lasts), and no mesh change', { fired, d: drawn() });
"""
for f in ('em014_00', 'em015_00', 'em016_00', 'em034_00'):
    p = 'dev/checks/%s.mjs' % f
    s = open(p, encoding='utf-8').read()
    pairs = [("  check(await pick('2,102', 'Broken'), 'the Head row set to Broken');\n",
              TRAP15 + "  check(await pick('2,102', 'Broken'), 'the Head row set to Broken');\n"),
             ("'L3 Motion[15] play 3, back to the head at level 3:", "'L3 Motion[15] play 4, back to the head at level 3:")]
    if "IS A `cycle` OF TWO: the head break and the tune+0x44 status (c 1109)" in s:
        pairs.append(("IS A `cycle` OF TWO: the head break and the tune+0x44 status (c 1109)",
                      "IS A `cycle` OF THREE: the head break, the tune+0x44 status (c 1109) and the shock trap's start (c 1105, 2026-10-15)"))
    patch(p, pairs)

patch('dev/checks/em019_00.mjs', [
("""  check(same(fired, [1109]), 'L3 Motion[2] play 3 is the tune+0x44 status: c 1109 once', fired);
""",
"""  check(same(fired, [1109]), 'L3 Motion[2] play 3 is the tune+0x44 status: c 1109 once', fired);
  // play 4 is the shock trap's start (D_TRAP, 2026-10-15): (10, 0x6e) plays L3 M2 to f40, c 1105 every 42
  await play('3', 'Motion[3]'); await frames(2);
  fired.length = 0;
  await play('3', 'Motion[2]'); await frames(3);
  check(same(fired, [1105]), 'L3 Motion[2] play 4 is the shock trap: c 1105 at once', fired);
"""),
("'L3 Motion[2] play 4, the +X claw at level 2:", "'L3 Motion[2] play 5, the +X claw at level 2:"),
])

patch('dev/checks/em010_00.mjs', [
("""  check(body.cycle.length === 3, 'L3 Motion[2] carries a three-rung cycle: the head, the back and the exhaust status',""",
"""  check(body.cycle.length === 4, 'L3 Motion[2] carries a four-rung cycle: the head, the back, the exhaust status and the shock trap (c 1105, 2026-10-15)',"""),
])

patch('dev/checks/em008_00.mjs', [
("""  // SIX, not seven: c 1105 (the shock trap) shares the paralysis hold, so his table never names it and it is not
  // exported. A record the table cannot request is a record the viewer cannot play, and every monster wired before
  // the rule carried a dead one. He is the first with none.""",
"""  // [2026-10-15: c 1105 is no longer dead -- the shock trap's own play clip, L3 M9, carries it now (MOTION_STATES
  // em008_00 '3|Motion[9]'). The count below was already stale at HEAD (27 event: the shared blast / notice / hyper
  // records were exported since); not revised here.]
  // SIX, not seven: c 1105 (the shock trap) shares the paralysis hold, so his table never names it and it is not
  // exported. A record the table cannot request is a record the viewer cannot play, and every monster wired before
  // the rule carried a dead one. He is the first with none."""),
])
print('ok')
