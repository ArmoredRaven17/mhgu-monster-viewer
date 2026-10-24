import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b"KHEZU'S LANDING CHILDREN now live"
i = b.index(anchor)
# the end of that entry: its third line ends with "unchanged."
j = b.index(b'Check 76/76 unchanged.', i)
eol = b.index(b'\n', j) + 1
crlf = b'\r\n' if b[eol - 2:eol] == b'\r\n' else b'\n'
lines = [
  "      - [x] 2026-10-19 -- BASARIOS'S FIREBALLS NOW FAN AND AIM as in the game: the single ones turn 5 / -10 / 5 / -5 degrees",
  "        up and down by attack, the three-ball spread goes out left / middle / right (-35 / -1 / 30), and a new attack (his",
  "        L4 Motion[8], thrown down at a target below him, 10 to 90 degrees) is on the list. Before this every fireball of his",
  "        flew straight along his facing. Checked against the ROM 15/15; page and soak clean.",
]
note = crlf.join(l.encode('utf-8') for l in lines) + crlf
b = b[:eol] + note + b[eol:]
open(p + '.tmp', 'wb').write(b); os.replace(p + '.tmp', p)
print('ok', crlf)
