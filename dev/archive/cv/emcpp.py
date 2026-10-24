# emcpp.py gN sM -- pretty-print a stream of t3/em025_emc.txt with block indentation (XX 00 begin / 01 case / 02 else / ff end)
import sys
T = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\t3\em025_emc.txt'
want = sys.argv[1] + ' ' + sys.argv[2] + ':'
for line in open(T):
    if not line.startswith(want): continue
    ins = [x.strip() for x in line.split(':', 1)[1].split('|') if x.strip()]
    dep = 0
    BLK = {'1c','6f','79','2a','07','0c','4e','43','61','3f','54','0a','6a','0b','02','57','16','1f','38','1d','58','75','76','40','05','35','6e'}
    for x in ins:
        b = x.split()
        if len(b) >= 2 and b[0] in BLK and b[1] in ('00','01','02','ff'):
            if b[1] == 'ff': dep -= 1; print('  ' * dep + x); continue
            if b[1] in ('01', '02'): print('  ' * (dep - 1) + ' ' + x); continue
            print('  ' * dep + x); dep += 1; continue
        print('  ' * dep + x)
