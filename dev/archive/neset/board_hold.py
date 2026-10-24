import os
P = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(P, 'rb').read(); NL = b'\r\n'
o = (b"        fireball (frame 26) shows on the _start pick and the other two (48 / 86) only on the _loop pick. A combined entry would" + NL +
     b"        show all three.")
assert b.count(o) == 1
n = o + NL + (b"        ON HOLD (Raven, 2026-10-20, via the coordinator): he wants real sequences later -- Start -> Loop x n -> End, where only" + NL +
              b"        the loop part repeats -- not joined clips, and will handle it in review. Leave as is.")
b = b.replace(o, n)
open(P + '.tmp', 'wb').write(b); os.replace(P + '.tmp', P); print('ok')
