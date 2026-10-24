import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb')
import shellef, shlmap
SEP = chr(92)
arc = r'C:\MHGU-Extract\scratch-em\em084_00\em084_00.arc'
FT = shellef.load_typed(arc)
M = shlmap.modes(FT)
for fold in sys.argv[1].split(','):
    for (fo, idx), row in sorted(M.items()):
        if fo != fold: continue
        if len(sys.argv) > 2 and idx not in [int(x) for x in sys.argv[2].split(',')]: continue
        print(fo, idx, row)
# scales
count, ents, _ = shlmap._ns['parse'](FT[('shell'+SEP+'em'+SEP+'em084_00_shell'+sys.argv[1].split(',')[0]+SEP+'em084_00_'+sys.argv[1].split(',')[0], '4aa69872')])
for e in ents: print('scale', e['index'], e.get('scale'), {k: e.get(k) for k in ('sh','hit','ef')})
