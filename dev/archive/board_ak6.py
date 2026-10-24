import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      status-7 web attacks set it, and their clips are not read) and the Ahtal-Neset rows (no Neset beside him).\n"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, a + """      RECORDED 2026-10-16: his shell records (50 sets via record_shells.py, new --carry / --loop / --then / --len flags) and
      lifted; soak 59 played, 0 refused; u 11 now runs (held 300 frames clean); page check 84 / 0. Not reachable: u 310 (an
      anchor's end with the owner inactive). Open: the status-7 web attacks (7, 0x2c..0x37) -- their clips are not read,
      and they gate the e+0xd408 threads and the anchors' re-aim / throw / orbit.
- [ ] (bug) Shell recordings were capped at 900 frames (efx/record_shells.py; rom-map trap 59): a shell living past 900
      frames never had its end recorded -- Ahtal-Ka's arena lines refused at their frame-1891 stop until re-recorded with
      --len. Audit other monsters' long-lived shells (lingering fire, mud, webs) for the same refusal at their end.
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
