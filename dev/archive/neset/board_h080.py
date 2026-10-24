import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b"starts it (at the point he throws it from, before it drops to the floor). Checked against the ROM 12/12 and on the page; they show once their"
assert b.count(anchor) == 1
i = b.index(anchor); i = b.index(b'\n', i) + 1; eol = b.index(b'\n', i) + 1
crlf = b'\r\n'
lines = [
  "      - [x] 2026-10-20 -- HELLBLADE GLAVENUS: all 43 of his shell sites -- the scale shots (L2 Motion[9] / [10] / [55] / [57] / [15] /",
  "        [1] / [17], the turns [18] / [19], L9 Motion[7]), the short flames on L2 Motion[13] / [14] / [36] / [37]) and the ground",
  "        fire lines (L2 Motion[2] / [11]), whose hotter kind leaves a flame where each line ends. Checked against the ROM 23/23 and on",
  "        the page 7/7; they show once their records are exported.",
]
b = b[:eol] + crlf.join(l.encode('utf-8') for l in lines) + crlf + b[eol:]
open(p + '.tmp', 'wb').write(b); os.replace(p + '.tmp', p)
print('ok')
