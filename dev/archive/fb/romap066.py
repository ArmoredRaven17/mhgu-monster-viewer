P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + '\\'
s = open(P, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
rows = open(D + 'romap066.md', encoding='utf8').read().replace('\r\n', '\n').rstrip('\n')
anchor = '| tooling: emu_fb `unstub` for `0x7206c`'
i = s.index(anchor); j = s.index('\n', i) + 1
s = s[:j] + rows.replace('\n', nl) + nl + s[j:]
idx = '| `leviathan-shells-spec.md` |'
i = s.index(idx); j = s.index('\n', i) + 1
line = ('| `amphibian-shells-spec.md` | Amphibians shells (shells agent): 0xc241c is a camera (withdrawn as a shell spawn); Tetsucabra / Drilltusk\'s '
        'rocks (base00), thrown rock (base13, flag 0x40\'s owner origin), the slab (base16 new: BodyDataList, the ray\'s start, the kill), the map-gated '
        'snow modes and the sp_01 hit volumes named; Zamtrios | 2026-10-18 | 14 KB |')
s = s[:j] + line + nl + s[j:]
t86 = '86. **emu_fb stubs 0x7206c (the countdown) to 0 for every case (2026-10-18).**'
i = s.index(t86); j = s.index('\n', i) + 1
t87 = ('87. **cengen10 recorded a create only in its per-literal passes and never answered the landing (2026-10-18).** A shell made behind no '
       'frame test, or behind `0xbf52c` / `0xbf0bc` (the landing, stubbed 0) with P+0x14 < 0, was invisible: Tetsucabra\'s (3, 0x50..0x55) '
       'landing sp_01 showed only once both were answered. cengen11 records the first pass\'s creates and runs every phase with `landed` = 1 '
       'and P+0x14 = -1.0 too; the earlier groups were re-run with it (scratchpad fb/recen11.py, amphibian spec 3). And a census never runs '
       'the action START (vt+0x204): his sp_16 is made there -- account for every id field\'s load in the band, as trap 83 says for the '
       'immediates. (dev/amphibian-shells-spec.md 1a, 1e)')
s = s[:j] + t87 + nl + s[j:]
open(P, 'w', encoding='utf8', newline='').write(s)
print('ok')
