import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
bad1 = 'C:\\MHGU-RE\\offline\\decode\notes\\states-em088_00.md'          # \n became a newline
good1 = 'C:\\MHGU-RE\\offline\\decode\\notes\\states-em088_00.md'
bad2 = '(effect\base\\em088_00_100..104, em087 rubble)'                 # \b became a backspace
good2 = '(effect\\base\\em088_00_100..104, em087 rubble)'
assert t.count(bad1) == 1, t.count(bad1)
assert t.count(bad2) == 1, t.count(bad2)
t = t.replace(bad1, good1).replace(bad2, good2)
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('fixed')
