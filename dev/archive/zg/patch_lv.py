# jscheckpd.py: part break levels and the monster's real .dtp +0x64 rows (LV=parts), for the words that read 0x9d36c against
# them (Rath variant 4 part 7, Gypceros part 6, Garuga / Deadeye part 7, Gravios parts 0 / 6 and ctl+0x24).
p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\zg\jscheckpd.py'
s = open(p, encoding='utf8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a
    s = s.replace(a, b)
rep("mu.mem_map(E, 0x20000);", "RES, ARR = 0x40210000, 0x40211000\nmu.mem_map(RES, 0x2000)\nmu.mem_map(E, 0x20000);")
rep("def rom(motion, action, posture, depth, rage, tired, rank, chg=0, sev=0):",
    r"""LVP = [int(x) for x in os.environ['LV'].split(',')] if os.environ.get('LV') else []
def dtpA(mon):
    b = open(r'C:\MHGU-Extract\scratch-em\%s\enemy\dt_base\%s_dtbparts.dtp' % (mon, mon), 'rb').read()
    return b[0x4d:0x4d + 4 * b[8]]
A = dtpA(MON) if LVP else b''
def thr(rank, lo, hi): return A[lo] if rank <= 4 else A[hi]
def lvof(lv, part): return dict(zip(LVP, lv)).get(part, 0)
def ctl24(lv, rank):   # em 5's action-start latch vt+0x204 0xd22e8c..0xd22fac: head part 5 row 3, belly part 6 row 2, back part 0 row 0
    if MON != 'em005_00': return 0
    return ((lvof(lv, 5) >= thr(rank, 0xd, 0xe)) << 0) | ((lvof(lv, 6) >= thr(rank, 9, 0xa)) << 1) | ((lvof(lv, 0) >= thr(rank, 1, 2)) << 2)
def rom(motion, action, posture, depth, rage, tired, rank, chg=0, sev=0, lv=()):""")
rep("    mu.emu_start(FN, RET, count=20000)",
    """    mu.mem_write(E + 0x75f0, struct.pack('<I', RES)); mu.mem_write(RES + 0x64, struct.pack('<I', ARR)); mu.mem_write(ARR, A or b'\\0')
    for part, l in zip(LVP, lv): mu.mem_write(P + 0x3bc + 12 * part, bytes([l]))
    if LVP: mu.mem_write(CTL + 0x24, bytes([ctl24(lv, rank)]))
    mu.emu_start(FN, RET, count=20000)""")
rep("cases = list(itertools.product(MOT, ACT, (0, 4), DEPTHS, (0, 1), (0, 1), RANKS, CHGS, SEVS))",
    "LVS = list(itertools.product(range(4), repeat=len(LVP))) if LVP else [()]\ncases = list(itertools.product(MOT, ACT, (0, 4), DEPTHS, (0, 1), (0, 1), RANKS, CHGS, SEVS, LVS))")
rep("    (m, a, po, d, r, t, rk, cg, sv) = c\n    return dict(motion=m, action=list(a) if a else None, state=dict(",
    "    (m, a, po, d, r, t, rk, cg, sv, lv) = c\n    return dict(motion=m, action=list(a) if a else None, state=dict("
    "breakLevel7=lvof(lv, 7), crestBroken=bool(LVP) and lvof(lv, 6) >= thr(rk, 1, 2), "
    "backBroken=bool(ctl24(lv, rk) & 4) if MON == 'em005_00' else False, bellyBroken=bool(ctl24(lv, rk) & 2) if MON == 'em005_00' else False, ")
open(p, 'w', encoding='utf8').write(s)
print('ok')
