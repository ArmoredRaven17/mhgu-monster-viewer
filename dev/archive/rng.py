import sys, re
f, lo, hi = sys.argv[1], int(sys.argv[2], 16), int(sys.argv[3], 16)
pat = re.compile(sys.argv[4]) if len(sys.argv) > 4 else None
neg = re.compile(sys.argv[5]) if len(sys.argv) > 5 else None
for l in open(f):
    a = int(l[:8], 16)
    if lo <= a < hi and (not pat or pat.search(l)) and not (neg and neg.search(l)):
        print(l.rstrip())
