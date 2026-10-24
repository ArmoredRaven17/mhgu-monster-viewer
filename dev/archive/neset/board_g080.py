import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b"shell01 on L2 Motion[1] / [10] and the lob on [16]. Checked against the ROM 15/15; they show once their records are exported."
assert b.count(anchor) == 1
i = b.index(anchor); eol = b.index(b'\n', i) + 1
crlf = b'\r\n'
lines = [
  "      - [x] 2026-10-20 -- GLAVENUS: his burning scale shots (L2 Motion[9] x3, [10], [55], [57]) with the flames they leave where",
  "        they land, and the fire lines along the ground on L2 Motion[2] / [11]. The ground line's flame now starts where the game",
  "        starts it (at his tail, before it drops to the floor). Checked against the ROM 12/12 and on the page; they show once their",
  "        records are exported.",
]
b = b[:eol] + crlf.join(l.encode('utf-8') for l in lines) + crlf + b[eol:]
open(p + '.tmp', 'wb').write(b); os.replace(p + '.tmp', p)
print('ok')
