# jscheckpd.py: the CHG axis (cg) also drives, by AXIS env: 'heat' -- P+0x1bb (already written) as state.heat (Glavenus);
# 'mud' -- e+0xcada = cg & 3 as state.mud (Barroth); 'arms' -- ctl+0x20 = cg & 3, ctl+0x2c = cg >> 2 as state.armEmpty =
# [row in {0, 3}] (Brachydios). And P+0x3b4 bit 1 as state.beardOff (Crystalbeard).
p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\zg\jscheckpd.py'
s = open(p, encoding='utf8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a
    s = s.replace(a, b)
rep("    if LVP: mu.mem_write(CTL + 0x24, bytes([ctl24(lv, rank)]))\n",
    "    if LVP: mu.mem_write(CTL + 0x24, bytes([ctl24(lv, rank)]))\n"
    "    if AXIS == 'mud': mu.mem_write(E + 0xcada, bytes([chg & 3]))\n"
    "    if AXIS == 'arms': mu.mem_write(CTL + 0x20, bytes([chg & 3])); mu.mem_write(CTL + 0x2c, bytes([chg >> 2]))\n")
rep("LVP = [int(x) for x in os.environ['LV'].split(',')] if os.environ.get('LV') else []",
    "LVP = [int(x) for x in os.environ['LV'].split(',')] if os.environ.get('LV') else []\nAXIS = os.environ.get('AXIS', '')")
rep("state=dict(breakLevel7=lvof(lv, 7),",
    "state=dict(heat=cg if AXIS == 'heat' else 0, mud=cg & 3 if AXIS == 'mud' else 0, "
    "armEmpty=[(cg & 3) in (0, 3), (cg >> 2) in (0, 3)] if AXIS == 'arms' else [False, False], beardOff=bool(sv & 2), breakLevel7=lvof(lv, 7),")
open(p, 'w', encoding='utf8').write(s)
print('ok')
