p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
bad = '<scratchpad>\x0cb\rec_shellrec.py'
assert s.count(bad) == 1, s.count(bad)
s = s.replace(bad, '<scratchpad>\\fb\\rec_shellrec.py')
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
