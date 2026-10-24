import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      clip: Akantor, Ukanlos, Gore, Chaotic Gore, Shagaru, Valstrax (L0 starts at M2), Najarala (M11), Amatsu (no List 0).\n"
assert t.count(a) == 1
t = t.replace(a, a + """- [x] (bug) **Diablos L0 M1 had dust while standing still** (Raven, 2026-10-17). It was the state table's held sand effect
      (c 30 / c 40, Bloodbath also u 230) cycling over every play of L0 M1 -- which the ROM requests only from burrowed
      group-6 plays (posture 4), while the plain idle (posture 0; group-6 indices 19 / 45) requests nothing. DONE: copies --
      L0 M1 A the plain idle (opens clean), B c 30, C c 40, Bloodbath D u 230 (CLIP_VARIANTS em007_00 / em007_04).
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
