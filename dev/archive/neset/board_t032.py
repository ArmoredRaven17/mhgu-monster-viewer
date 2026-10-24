import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b"BASARIOS'S FIREBALLS NOW FAN AND AIM"
i = b.index(anchor); j = b.index(b'page and soak clean.', i); eol = b.index(b'\n', j) + 1
crlf = b'\r\n'
lines = [
  "      - [x] 2026-10-19 -- TIGREX'S ROCKS: his three-rock kick (L2 Motion[5]) now throws as in the game, aimed at the target, and",
  "        the dust where he lands (L0 M28, L1 M1, L1 M2, L2 M8) now appears. The rocks change with the floor in the game (four",
  "        kinds); the viewer has no floor data, so it shows the plain-ground rocks. Checked against the ROM 18/18; the effects show",
  "        once their records are exported.",
]
b = b[:eol] + crlf.join(l.encode('utf-8') for l in lines) + crlf + b[eol:]
open(p + '.tmp', 'wb').write(b); os.replace(p + '.tmp', p)
print('ok')
