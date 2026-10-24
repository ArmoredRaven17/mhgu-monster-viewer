"""ctlpair.py <variant> <list> <slot> <st,n> [<st,n> ...]: the class's PSL word (ctlflip2.run_word) on one motion for several actions,
C zeroed -- does an action the zeroed census never paired with the clip give it a different word than the listed ones?"""
import sys
import ctlflip2 as CF
var, lst, slot = int(sys.argv[1], 0), int(sys.argv[2]), int(sys.argv[3])
for a in sys.argv[4:]:
    st, n = (int(x, 0) for x in a.split(','))
    w = CF.run_word(var, st, n, (lst << 8) | slot)
    print('(%d, %#x) L%d M%d word %s' % (st, n, lst, slot, hex(w) if w is not None else w))
