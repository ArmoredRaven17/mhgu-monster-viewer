import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      --len. Audit other monsters' long-lived shells (lingering fire, mud, webs) for the same refusal at their end.\n"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, a + """- [x] (bug) FIXED 2026-10-16: a clip with no shell picks inherited the PREVIOUS pick clip's pick as its action
      (index.html rockInput read rockPlays.names, the last pick clip's list) -- e.g. Ahtal-Ka's L3 M14 after his L2 M30 web
      played (1, 0x1c), not its drop, so the pole stayed in his hands and his enable word kept the carry bits. Any monster
      was exposed after playing a pick clip. Now each clip takes only its own picks. Suite back to the 41 baseline.
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
