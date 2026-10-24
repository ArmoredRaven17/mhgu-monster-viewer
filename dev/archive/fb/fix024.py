p = 'emu_fb.py'
b = open(p, 'rb').read()
bad = b"uc.mem_write(G, b'\x00' * 0x100)"
assert b.count(bad) == 1
b = b.replace(bad, b"uc.mem_write(G, b'\\0' * 0x100)")
open(p, 'wb').write(b)
p = 'mk024spec.py'
s = open(p, encoding='utf8').read()
bad = "    if (c.unstub) o.unstub = c.unstub;\n    o.frameStep = 1.0;\"),"
assert s.count(bad) == 1
s = s.replace(bad, "    if (c.unstub) o.unstub = c.unstub;\\n    o.frameStep = 1.0;\"),")
open(p, 'w', encoding='utf8').write(s)
print('ok')
