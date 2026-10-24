D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
p = D + r'\rom-map.md'
s = open(p, encoding='utf8').read()
assert '\n117. ' not in s
i = s.index('\n115. **A viewer seek is a release the game never makes'); j = s.index('\n', i + 1)
s = s[:j + 1] + ("117. **A census with the class's control block zeroed hides creates gated on it (2026-10-19).** Chaotic Gore Magala's footfall "
  "dust (0xfb700c, sp_01 1) passes only with C+0x84 (`[e+0xcac0]+0x84`) at 20000 or more: the census (C zeroed) found none of his "
  "18 calls, Shagaru's identical calls (no gate) all. Before calling a maker unreached, read its gate and poke the field (fb/ff071.py: "
  "15000 none, 20000 one). Worked example and rows: gore-line-shells-spec 2.3.\n") + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)
p = D + r'\effect-runtime-engine.md'
s = open(p, encoding='utf8').read()
a = "    step loses those stops (the effects run on).\n"
assert s.count(a) == 1 and '  - 117 ' not in s
s = s.replace(a, a + "  - 117 (T) a census with the class block [e+0xcac0] zeroed hides creates gated on its fields (Chaotic Gore's footfall dust at\n"
                     "    C+0x84 >= 20000): read a maker's gate and poke the field before calling it unreached.\n")
open(p, 'w', encoding='utf8').write(s)
print('ok')
