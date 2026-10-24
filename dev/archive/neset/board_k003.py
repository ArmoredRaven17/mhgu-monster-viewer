import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b"ROM 38/38; the effects (u 30-32, u 40-42) show once their records are exported."
i = b.index(anchor); eol = b.index(b'\n', i) + 1
crlf = b'\r\n'
lines = [
  "      - [x] 2026-10-19 -- KHEZU: his drop from the ceiling now leaves its spark where he lands (L5 Motion[8] / [3]), and L0",
  "        Motion[46] leaves the ground spark too. The ground patch on L2 Motion[64] now faces the way he does (it was always facing",
  "        one way). Checked against the ROM 12/12.",
]
b = b[:eol] + crlf.join(l.encode('utf-8') for l in lines) + crlf + b[eol:]
open(p + '.tmp', 'wb').write(b); os.replace(p + '.tmp', p)
print('ok')
