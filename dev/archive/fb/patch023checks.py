for p in [r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\checks\em023_00.mjs', r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\checks\em023_05.mjs']:
    s = open(p, encoding='utf8', newline='').read()
    nl = '\r\n' if '\r\n' in s else '\n'
    def rep(a, b):
        global s
        a = a.replace('\n', nl); b = b.replace('\n', nl)
        assert s.count(a) == 1, (p, s.count(a), a[:60])
        s = s.replace(a, b)
    rep("""  // L2 M8'S PLAYS (shells.js pickVariantsFor: the beams (7, 6) / (7, 0xa) then the ball's (7, 5) / (7, 0xc) / (7, 0x3b), one action
  // a play; index.html takes the play's action from that pick): the word lights bits 15-17 (u 291) on the beams' numbers only --
  // 2 plays in 5, as table 0xded140 has it (6 / 0xa in, 5 / 0xc / 0x3b out). The tired remaps (7, 0x3e) / (7, 0x43) and g1 s35's
  // direct (7, 0x3e) (lit, no beam) are not in the rotation.""",
"""  // L2 M8'S PLAYS (shells.js pickVariantsFor: the beams (7, 6) / (7, 0xa), then the ball's (7, 5) / (7, 0xc) / (7, 0x3b), then g1
  // s35's direct (7, 0x3e) -- no beam, no shell -- one action a play; index.html takes the play's action from that pick): the word
  // lights bits 15-17 (u 291) on 3 plays in 6, as table 0xded140 has it (6 / 0xa / 0x3e in, 5 / 0xc / 0x3b out). The tired remap
  // (7, 0x43) is not in the rotation (tired, the word lights nothing).""")
    rep("""    check(picks.join(' ') === '7:0x06 7:0x0a 7:0x05 7:0x0c 7:0x3b', 'L2 M8 rotates the five shell actions', picks);""",
        """    check(picks.join(' ') === '7:0x06 7:0x0a 7:0x05 7:0x0c 7:0x3b 7:0x3e', 'L2 M8 rotates the six actions', picks);""")
    rep("""for (let i = 0; i < 5; i++){ await play('2', 'Motion[8]_start');""", """for (let i = 0; i < 6; i++){ await play('2', 'Motion[8]_start');""")
    rep("""    check(lit.filter(Boolean).length === 2, 'L2 M8 in the page: bits 15-17 on 2 plays in 5 (the beams)',""",
        """    check(lit.join(' ') === 'true true false false false true', 'L2 M8 in the page: bits 15-17 on 3 plays in 6 (the beams and (7, 0x3e))',""")
    open(p, 'w', encoding='utf8', newline='').write(s)
    print('ok', p)
