P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + '\\'
s = open(P, encoding='utf8').read()
blk = open(D + 'carap.js', encoding='utf8').read()
assert 'params019s01' not in s
def rep(a, b):
    global s
    assert s.count(a) == 1, a
    s = s.replace(a, b)
rep("// ---- BASE60 / BASE61: Ahtal-Ka's web anchors", blk + "\n// ---- BASE60 / BASE61: Ahtal-Ka's web anchors")
open(P, 'w', encoding='utf8').write(s)
print('ok')
