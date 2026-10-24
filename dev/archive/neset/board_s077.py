import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b"against the ROM 8/8; the effects show once their records are exported."
i = b.index(anchor); eol = b.index(b'\n', i) + 1
crlf = b'\r\n'
lines = [
  "      - [x] 2026-10-19 -- SEREGIOS'S BLADESCALES: thrown on L2 Motion[3] / [4] (G rank), [20], [21], [26], [34], [65] / [66]",
  "        (G rank) and, from his frame handler, on [29] and [48]. They aim at the target where the game aims them; which kind is",
  "        thrown follows the tail cut, the left hind leg's and the head's breaks as the Parts panel shows them. Checked against the",
  "        ROM 38/38; the effects (u 30-32, u 40-42) show once their records are exported.",
]
b = b[:eol] + crlf.join(l.encode('utf-8') for l in lines) + crlf + b[eol:]
open(p + '.tmp', 'wb').write(b); os.replace(p + '.tmp', p)
print('ok')
