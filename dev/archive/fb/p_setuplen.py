p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\emu_fb.py'
s = open(p, encoding='utf8').read()
a = "    CREATED.append(bytes(uc.mem_read(st, 0x50)))"
b = "    CREATED.append(bytes(uc.mem_read(st, ANS.get('setupLen', 0x50))))   # (a case's setupLen: Lao-Shan Lung's sp_13 setup is 0x70)"
assert s.count(a) == 1; s = s.replace(a, b)
a = "    uc.mem_write(SETUP, b'\\0' * 0x50); uc.mem_write(SETUP, raw[:0x50]); w32(SETUP + 0xc, OWNER)"
assert s.count(a) == 1, 'x'
s = s.replace(a, "    n = ANS.get('setupLen', 0x50); uc.mem_write(SETUP, b'\\0' * n); uc.mem_write(SETUP, raw[:n]); w32(SETUP + 0xc, OWNER)")
a = "ANS['stubs'] = set(int(x, 0) for x in c.get('stubs', []))"
assert s.count(a) == 1
s = s.replace(a, a + "; ANS['setupLen'] = c.get('setupLen', 0x50)")
open(p, 'w', encoding='utf8').write(s)
print('ok')
