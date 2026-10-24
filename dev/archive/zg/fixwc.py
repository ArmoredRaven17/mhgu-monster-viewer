p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\zg\wordclip.py'
s = open(p, encoding='utf8', newline='').read()
a = s.index('MONJS = open(')
b = s.index('    got = {}')
good = (r"""MONJS = open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\monster.js', encoding='utf8').read()
BOUND, _best = {}, 0
for mm in re.finditer(r'\n  ' + mon + r': \{', MONJS):
    blk = MONJS[mm.start():MONJS.find('\n  },', mm.start())]
""")
s = s[:a] + good + s[b:]
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
