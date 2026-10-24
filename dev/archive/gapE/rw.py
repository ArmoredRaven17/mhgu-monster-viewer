import sys, os, struct
sys.path.insert(0, r'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/sh88')
from emu57 import TEXT
w = lambda a: struct.unpack_from('<I', TEXT, a)[0]
base = 0x10be780
for n in [0x2c, 0x2f, 0x31, 0x32, 0x33, 0x34, 0x36, 0x37]:
    print(hex(n), hex(base + w(base + 4*n)))
