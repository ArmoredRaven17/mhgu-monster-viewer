p = 'emu_fb.py'
s = open(p, encoding='utf8').read()
a = "           (ANS.get('slot0Ids') is None or r32(SETUP + 4) in ANS['slot0Ids']): w8(SHELL + 0x13ad, 1)\n"
assert s.count(a) == 1
s = s.replace(a, a + """        # a case's `slot0Until` {'id:mode': move} (2026-10-18): hit slot 0's byte held through that move and cleared after it -- the life the
        # module's slot count gives a timer-0 shell (delay + duration + 1 moves), so both end on the same move
        su = ANS.get('slot0Until')
        kk = '%d:%d' % (r32(SETUP + 4), r32(SETUP + 8))
        if su and kk in su: w8(SHELL + 0x13ad, 1 if k <= su[kk] else 0)
""")
a = "    ANS['creatorCopy'] = bool(c.get('creatorCopy'))\n"
assert s.count(a) == 1
s = s.replace(a, a + "    ANS['slot0Until'] = c.get('slot0Until')\n")
open(p, 'w', encoding='utf8').write(s)
print('ok')
