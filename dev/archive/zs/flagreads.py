# every read of a shell field during the ROM runs of dev/shells-zinogre-check.mjs's cases (emu_zinogre.py), by pc
import sys, json
CASES = sys.argv[1]; sys.argv = ['emu_zinogre.py']
import emu_zinogre as Z
from unicorn import UC_HOOK_MEM_READ
FIELDS = {int(a, 0): a for a in sys.stdin.read().split()} if False else {}
WATCH = [(0x15bc, 4, '+0x15bc'), (0x15ac, 1, '+0x15ac')]
HITS = {}
def onread(uc, acc, addr, size, val, ud):
    off = addr - Z.SHELL
    for o, n, nm in WATCH:
        if o <= off < o + n:
            pc = uc.reg_read(Z.UC_ARM_REG_PC)
            HITS.setdefault(nm, {}).setdefault(Z.CUR[0], set()).add(pc)
Z.uc.hook_add(UC_HOOK_MEM_READ, onread, begin=Z.SHELL, end=Z.SHELL + 0x1800)
cases = json.load(open(CASES))
for c in cases: Z.run(c)
for nm, d in HITS.items():
    for k, pcs in d.items(): print(nm, k, ' '.join(hex(p) for p in sorted(pcs)))
