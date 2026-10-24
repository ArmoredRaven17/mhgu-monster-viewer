import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b"the page 7/7; they show once their records are exported."
assert b.count(anchor) == 1
i = b.index(anchor); eol = b.index(b'\n', i) + 1
crlf = b'\r\n'
lines = [
  "      - [x] 2026-10-20 -- YIAN KUT-KU: his fireballs (L2 Motion[1] four, [2] three, [3]) with what they start where they land, the lobbed",
  "        fireball (L2 Motion[3]), what his frame handler leaves at his feet (L0 Motion[24] / [27] / [30], L1 Motion[4] / [14] / [17] /",
  "        [19] / [102] / [105] / [106]) and what he leaves under him while he hovers (L2 Motion[21], every 8 frames). Checked against the",
  "        ROM 22/22 and on the page 7/7; they show once their records are exported.",
  "      - [ ] Kut-Ku L2 Motion[2] (and every clip that ships as _start + _loop): the page plays one half at a time, so his first",
  "        fireball (frame 26) shows on the _start pick and the other two (48 / 86) only on the _loop pick. A combined entry would",
  "        show all three.",
]
b = b[:eol] + crlf.join(l.encode('utf-8') for l in lines) + crlf + b[eol:]
open(p + '.tmp', 'wb').write(b); os.replace(p + '.tmp', p)
print('ok')
