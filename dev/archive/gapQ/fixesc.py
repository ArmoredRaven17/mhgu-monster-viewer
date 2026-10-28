import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
d = open(p, 'rb').read()
BS = b'\\'
a = b'<archive>' + BS + b'gapQ' + b'\r' + b'eplay063live.mjs'
b = b'<archive>' + BS + b'gapQ' + BS + b'replay063live.mjs'
c = b'<archive>' + b'\x0c' + b'b' + BS + b'shellmeter.mjs'
e = b'<archive>' + BS + b'fb' + BS + b'shellmeter.mjs'
assert d.count(a) == 1 and d.count(c) == 1
d = d.replace(a, b).replace(c, e)
assert d.count(b'\r\n') == d.count(b'\n') and b'\x0c' not in d
open(p + '.tmp', 'wb').write(d)
os.replace(p + '.tmp', p)
print('fixed')
