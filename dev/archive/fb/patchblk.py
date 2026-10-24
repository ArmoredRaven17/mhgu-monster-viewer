# patchblk.py <block.js> <marker-not-present>: insert a block before BASE60 in shells.js
import sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(P, encoding='utf8').read()
blk = open(sys.argv[1], encoding='utf8').read()
assert sys.argv[2] not in s, 'already in'
a = "// ---- BASE60 / BASE61: Ahtal-Ka's web anchors"
assert s.count(a) == 1
s = s.replace(a, blk + "\n" + a)
open(P, 'w', encoding='utf8').write(s)
print('ok')
