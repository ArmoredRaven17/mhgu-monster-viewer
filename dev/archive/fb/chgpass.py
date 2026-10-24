# chgpass.py <statuses> [variant] (2026-10-19): a CHAIN-ONLY pass of a class (env FB_CLASS / FB_MON / FB_EM / FB_POKE as cengen11) --
# every action, phases 0..8, with the timer helper 0x7206c answered 1 and e+0x7420 = 1 (a chain behind a timer: Bloodbath's (7, 0x62),
# 0xd40ec4..0xd40eec), printing `CHG st:n [targets]` lines for fbbcmp.mjs's reach closure
import sys, json, os
st_list = [int(x, 0) for x in sys.argv[1].split(',')]; var = int(sys.argv[2]) if len(sys.argv) > 2 else 0
sys.argv = ['x']
import trgen as T
STUB = {0x3a8430: int(os.environ.get('FB_RANK', '5')), 0x49930: 10}
POKE = {T.E + int(k, 0): v for k, v in json.loads(os.environ.get('FB_POKE', '{}')).items()}
POKE[T.E + 0x7420] = [1]
for st in st_list:
    for n in range(256):
        chg = set()
        for ph in range(9):
            for scn in ({'frame': 1, 'frame2': 1, 'timer': 1}, {'frame': 1, 'frame2': 1, 'ended': 1, 'timer': 1}):
                r = T.run(st, n, ph, var, 0, rage=0, stub=STUB, poke=POKE, **scn)
                for e in r.get('ev', []):
                    if e[0] == 'chg' and isinstance(e[1], int): chg.add('%d:%#04x' % (e[1], e[2] & 0xff))
        if chg: print('CHG', '%d:%#04x' % (st, n), sorted(chg), flush=True)
