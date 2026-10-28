import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
d = open(p, 'rb').read().decode('utf-8')
rep = [
    ("every 'shell' record of every SHELL_DATA monster, 949 on 86 (Neset's export now carries Ahtal-Ka's u 320 / 321 / 70), metered on the page in fourteen rounds: **852 draw**",
     "every 'shell' record of every SHELL_DATA monster, 973 on 88 (Neset's export now carries Ahtal-Ka's u 320 / 321 / 70; Brachydios / Raging's 24 added 2026-10-25), metered on the page in fifteen rounds: **874 draw**"),
    ("39 the ROM never draws (Chameleos u 1: its gob starts 458 x size under his ground, gapP)",
     "40 the ROM never draws (Chameleos u 1: its gob starts 458 x size under his ground, gapP; Brachydios u 51: sp_01 mode 8, no maker)"),
    ("3 inputs the viewer lacks (Redhelm u 0 / 10: the stage number; Elderfrost u 110: a second Elderfrost)",
     "4 inputs the viewer lacks (Redhelm u 0 / 10: the stage number; Elderfrost u 110: a second Elderfrost; Raging u 41: a Red arm with rage off)"),
]
for a, b in rep:
    assert d.count(a) == 1, a[:60]
    d = d.replace(a, b)
open(p + '.tmp', 'wb').write(d.encode('utf-8'))
os.replace(p + '.tmp', p)
print('totals ok')
