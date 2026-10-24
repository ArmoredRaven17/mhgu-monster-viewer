import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b"        and on the page 5/5; they show once their records are exported."
assert b.count(anchor) == 1
i = b.index(anchor); eol = b.index(b'\n', i) + 1
crlf = b'\r\n'
lines = [
  "      - [x] 2026-10-20 -- IODROME and GIADROME: their spit (L4 Motion[2] / [3] / [1]) and lob (L4 Motion[2]) with what they leave",
  "        where they land. Checked against the ROM 9/9 each and on the page 3/3 each; they show once their records are exported.",
]
b = b[:eol] + crlf.join(l.encode('utf-8') for l in lines) + crlf + b[eol:]
open(p + '.tmp', 'wb').write(b); os.replace(p + '.tmp', p)
print('ok')
