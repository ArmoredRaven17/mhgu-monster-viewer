p = r'C:\MHGU-Extract\efx\shader\mfxprog.py'
s = open(p, encoding='utf8', newline='').read()
a = "sys.path.insert(0, r'E:\\offline\\root')"
assert s.count(a) == 1, s.count(a)
b = a + "\nsys.path.insert(0, r'C:\\MHGU-RE\\offline\\root')   # the offline tree moved here on 2026-10-15; searched first, E: kept as before"
s = s.replace(a, b)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
