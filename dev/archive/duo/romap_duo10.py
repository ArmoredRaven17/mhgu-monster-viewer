p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
a = "| `0x16acf0` (the hit manager's pair pass;"
i = s.index(a)
row = ("| `0xfd5a90` / `0xfd5ad8` / `0xfd5b08` / `0xfd5a40` literals `0xfd5e18..0xfd5e2c` (105 / 100 / 40 / 60 / 120) | his 7:0x3f timeline (duo agent's frame check of the shells agent's read): phase 1 to f40 then a 20-frame timer (`0xfd5ac8`); phase 2 to f60 (first) / f120 (repeats), then M33 from 40 b4 (`0xfd5dc0`); phase 3's f100: +0x6c += 1, <= 2 -> M33 from 100 b4 (`0xfd5d48`) + the timer, else phase 4: flag at f105. In the viewer: entry frames 0 / 60 / 120 / 140 / 200 / 220 / 285 (flag), 15 spits at 88 88 108 108 116 116 168 168 188 188 196 196 248 268 276 | uEm076_00 | R | spec §14.3; render/monster.js partnerList |" + nl)
s = s[:i] + row + s[i:]
open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
