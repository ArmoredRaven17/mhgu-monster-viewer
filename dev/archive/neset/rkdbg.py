# rkdbg.py: emu_fb with a ring of the last block addresses, to name the fault in base59's init
import sys, json, collections
sys.argv = ['emu_fb.py']
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb')
import emu_fb as F
from unicorn import UC_HOOK_BLOCK
RING = collections.deque(maxlen=40)
F.uc.hook_add(UC_HOOK_BLOCK, lambda uc, a, s, u: RING.append(a))
cases = json.load(open('rk_cases.json'))
try:
    F.run(cases[0])
except AssertionError as e:
    print('FAULT', e)
    print(' '.join(hex(a) for a in RING))
