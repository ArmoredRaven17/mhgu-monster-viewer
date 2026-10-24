import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      Ahtal-Neset: enable word transcribed (base | 0xff8000); 0xaaeb90 / 0xa996b0 (all 34 refusals) queued for lift.\n"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, """      Ahtal-Neset: enable word transcribed (base | 0xff8000); 0xaaeb90 / 0xa996b0 lifted -- soak 81 played, 0 refused.
      WEB THREADS DONE 2026-10-15: the start point READ (dev/em088-d410-writer.md: his position + (0, 4000 x size, 0), written
      once at the wind-up's start; d410 for the five-anchor web, d440 for the three / four) -- u 341 from that point to each
      anchor, u 340 from his joint 149 to it; page check 83 / 0. Still off, named: the rows behind e+0xd408 (only the
      status-7 web attacks set it, and their clips are not read) and the Ahtal-Neset rows (no Neset beside him).
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
