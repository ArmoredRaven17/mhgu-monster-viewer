p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
s = open(p, encoding='utf-8').read()
a = "if (!seen[seen.length - 1] && !(c.clip === 'S. Motion[76]-[79]' && f >= 252)) bad.push"
b = "if (!seen[seen.length - 1] && !(c.clip === 'S. Motion[76]-[79]' && f >= 252) && !(c.clip === 'Seltas Motion[33] with her 7:0x4e' && f >= 353)) bad.push"
assert s.count(a) == 1
s = s.replace(a, b)
a = "the joined grab from M78, the one-frame M3)'"
b = "the joined grab from M78, the one-frame M3, and his M33 held at its end while she does 7:0x4f -- 7:0x3f phase 5, 0xfd5b2c)'"
assert s.count(a) == 1
s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
