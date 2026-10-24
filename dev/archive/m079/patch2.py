import io,sys
P=r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s=io.open(P,encoding='utf-8',newline='').read(); nl='\r\n' if '\r\n' in s else '\n'
a='| `em079_00-effects-spec.md` |'
i=s.find(a); j=s.find(nl,i)
if 'em079-hypnosis-and-gaps.md` |' in s: sys.exit('done already')
row='| `em079-hypnosis-and-gaps.md` | Malfestio / Nightcloak: the part pass\'s action sets (16 Hypnosis on (7, 0x10 / 0x12) over L2 M16-M19; 14 the dives over L2 M20-M25, Nightcloak\'s L2 M24 excepted), the L2 M23 f4-64 eye window, and the live effect census with the gaps (u 200 death mis-gated, L2 M35 / M43 ground shells, u 10 recording) | 2026-10-17 | 20 KB |'
s=s[:j+len(nl)]+row+nl+s[j+len(nl):]
io.open(P,'w',encoding='utf-8',newline='').write(s); print('ok')
