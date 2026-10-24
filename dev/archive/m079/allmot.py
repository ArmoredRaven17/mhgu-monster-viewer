import sys
sys.argv=['x']
exec(open(r'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/m079/motmap.py').read())
for s in starts:
    m=motions(s)
    if m: print('%06x'%s, m)
