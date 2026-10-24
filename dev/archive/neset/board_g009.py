import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b"        show all three."
assert b.count(anchor) == 1
i = b.index(anchor); eol = b.index(b'\n', i) + 1
crlf = b'\r\n'
lines = [
  "      - [x] 2026-10-20 -- GYPCEROS: his spit (L4 Motion[4] twice, L4 Motion[6]), the lob (L4 Motion[6]), the puddles they leave",
  "        where they land (the puddle slides forward as it grows), the orb (L4 Motion[6], the 12..14 shots) that flashes after its",
  "        delay, what his frame handler leaves at his feet (L1 Motion[4] / [5] / [14] / [17] / [19] / [102] / [103] / [105] / [106],",
  "        and every 100 frames of L1 Motion[1] / [2]) and under him while he hovers (L2 Motion[21]). Checked against the ROM 23/23",
  "        and on the page 5/5; they show once their records are exported.",
]
b = b[:eol] + crlf.join(l.encode('utf-8') for l in lines) + crlf + b[eol:]
open(p + '.tmp', 'wb').write(b); os.replace(p + '.tmp', p)
print('ok')
