import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b"TIGREX'S ROCKS"
i = b.index(anchor); j = b.index(b'once their records are exported.', i); eol = b.index(b'\n', j) + 1
crlf = b'\r\n'
lines = [
  "      - [x] 2026-10-19 -- GRIMCLAW'S SHELLS: his rock throws (L2 Motion[5] / [26] / [27]), the L9 attacks (Motion[4], [19]",
  "        with the rocks that split on landing, [15] with the ground wave that steps forward twice, [6] / [9] with the slam's",
  "        bursts) and, while enraged, the bursts on L2 Motion[10] / [15] / [16] and L9 Motion[4] / [12]. Checked against the ROM",
  "        21/21; the effects show once their records are exported.",
  "      - [x] 2026-10-19 -- GRAVIOS AND BASARIOS: the dust on L1 Motion[103] / [104] now appears (both monsters).",
]
b = b[:eol] + crlf.join(l.encode('utf-8') for l in lines) + crlf + b[eol:]
open(p + '.tmp', 'wb').write(b); os.replace(p + '.tmp', p)
print('ok')
