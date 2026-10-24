import sys
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf-8', newline='').read()
NL, CRLF = chr(10), chr(13) + chr(10)
anchor = "| MOTION_STATES em007_04 `0|Motion[1]` holds |"
i = s.index(anchor); j = s.index(CRLF, i) + 2
rows = open(sys.argv[1], encoding='utf-8').read().strip(NL) + NL
s = s[:j] + rows.replace(NL, CRLF) + s[j:]
open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
