import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      and they gate the e+0xd408 threads and the anchors' re-aim / throw / orbit.\n"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, a + """      RAVEN LOOKED 2026-10-16: "the models and effects look correct for the most part"; "Pole" renamed Dragonator in the
      Carrying control. Frame's hold being re-read (joint per object, any local offset, mod vs glb).
      - [ ] (animation review) Ahtal-Ka: "some things are not as smooth as I would like" -- an Animation Review side issue,
            not models / effects (Raven, 2026-10-16).
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
