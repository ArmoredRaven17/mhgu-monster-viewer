import os
sp = os.path.dirname(os.path.abspath(__file__))
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-ahtal-check.mjs'
s = open(p, encoding='utf-8').read()
anchor = "// CONTROLS: a wrong target, joint and object must fail\n"
assert s.count(anchor) == 1
block = open(os.path.join(sp, 'checkweb.js'), encoding='utf-8').read()
s = s.replace(anchor, block + anchor)
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok')
