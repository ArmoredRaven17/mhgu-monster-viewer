import sys, re
# usage: snap.py <tag>  -> writes clip_<mon>_<tag>.txt for each monster: CLIP_EFFECTS block text
src = open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\monster.js', encoding='utf-8').read()
start = src.index('export const CLIP_EFFECTS = {')
out = sys.argv[1]
for mon in ('em037_00', 'em037_04', 'em038_00'):
    i = src.index('\n  %s: {' % mon, start)
    j = src.index('{', i)
    d = 0; k = j
    while True:
        c = src[k]
        if c == '{': d += 1
        elif c == '}':
            d -= 1
            if d == 0: break
        k += 1
    blk = src[i:k + 1]
    open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\clip_%s_%s.txt' % (mon, out), 'w', encoding='utf-8').write(blk)
    print(mon, len(blk.splitlines()), 'lines')
