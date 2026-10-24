import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\checks\em079_04.mjs'
s = open(p, encoding='utf-8', newline='').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:80])
    s = s.replace(a, b)
rep("""  check(JSON.stringify(diffs) === JSON.stringify(['3|Motion[17]', '3|Motion[12]', '3|Motion[20]']),
        'and with his u.pel substituted the ONLY motions that differ are the three deaths', diffs);""",
    """  // 2026-10-17: the deaths no longer differ (u 200 fires only while CLOAKED, 0xff01c8, and the viewer shows him uncloaked);
  // his L2 M24 does -- (7, 0xca) / (7, 0xd2) play it with set 13, where Malfestio's (7, 0x18) has the dive set 14
  check(JSON.stringify(diffs) === JSON.stringify(['2|Motion[24]']),
        'and with his u.pel substituted the ONLY motion that differs is L2 M24 (his plays of it carry no dive set)', diffs);""")
rep("""  // WHAT HIS VARIANT ADDS: entering status 11 cancels the cloak. vtable +0x204 fires u 200 and sets e+0xcb00 = 1.""",
    """  // WHAT HIS VARIANT ADDS: entering status 11 cancels the cloak. vtable +0x204 fires u 200 and sets e+0xcb00 = 1 -- ONLY WHILE
  // CLOAKED (0xff01c8..0xff0204, dev/em079-hypnosis-and-gaps.md G4); the viewer shows him uncloaked, so no death fires it.""")
rep("""    check(fired.includes(200) && S.rage === false,
          'L3 ' + m + ' (death): the CLOAK IS CANCELLED -- u 200 fired -- and the rage shown goes off', { fired, rage: S.rage });""",
    """    check(!fired.includes(200) && S.rage === false,
          'L3 ' + m + ' (death), uncloaked: no u 200 (the cloak cancel needs the cloak) -- and the rage shown goes off', { fired, rage: S.rage });""")
open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
