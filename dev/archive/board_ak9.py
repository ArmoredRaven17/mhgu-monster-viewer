import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      Carrying control. Frame's hold being re-read (joint per object, any local offset, mod vs glb).\n"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, """      Carrying control. FRAME'S HOLD RE-READ 2026-10-16 (dev/em088-held-objects.md): all three objects are held the same --
      joint 130 for every object (a constant, READ), no local offset or rotation (READ), scale = his size, the mods' one joint
      is identity and the glbs dropped nothing; both of the Wheel's / Frame's mesh groups draw in the game too. The viewer
      already matches -- no change.
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
