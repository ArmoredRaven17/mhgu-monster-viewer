import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
anchor = b"GRAVIOS AND BASARIOS: the dust on L1 Motion[103]"
i = b.index(anchor); eol = b.index(b'\n', i) + 1
crlf = b'\r\n'
lines = [
  "      - [x] 2026-10-19 -- UKANLOS'S BODY SHELLS: the ice that falls from the sky during his roars (L2 Motion[4], fourteen",
  "        patterns), the ice he throws on L2 Motion[12] / [33], and the slam pair at the end of his dive (L4 Motion[7]). Checked",
  "        against the ROM 15/15.",
  "      - [ ] Akantor: his burrow tell (the bulge before he bursts out, L0 Motion[2]) is built but the clip menu offers no copy that",
  "        plays it -- needs a copy entry for (6, 3) (asked).",
]
b = b[:eol] + crlf.join(l.encode('utf-8') for l in lines) + crlf + b[eol:]
open(p + '.tmp', 'wb').write(b); os.replace(p + '.tmp', p)
print('ok')
