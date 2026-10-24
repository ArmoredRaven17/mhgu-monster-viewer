import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b"        where they land. Checked against the ROM 9/9 each and on the page 3/3 each; they show once their records are exported."
assert b.count(anchor) == 1
i = b.index(anchor); eol = b.index(b'\n', i) + 1
crlf = b'\r\n'
lines = [
  "      - [x] 2026-10-20 -- YIAN GARUGA and DEADEYE: the fireballs (L4 Motion[52] three times, at 78 / 120 / 164, L4 Motion[29],",
  "        [68], [51]; Deadeye's L9 Motion[8]) with what they leave where they land, and Deadeye's three falling pieces on L9 Motion[8].",
  "        Checked against the ROM 11/11 and 15/15 and on the page; they show once their records are exported.",
]
b = b[:eol] + crlf.join(l.encode('utf-8') for l in lines) + crlf + b[eol:]
open(p + '.tmp', 'wb').write(b); os.replace(p + '.tmp', p)
print('ok')
