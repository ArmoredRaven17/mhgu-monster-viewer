"""ctlsum.py [mode] [kind]: ctl/<mode>_*.txt (ctlflip2) -> per monster, the flips by kind: REQ (a class request appears / goes),
CHG (a follow / change), MOT, HIT (WATCHX), SCRIPT / CALL / TURN / U1400. For REQ and CHG, each distinct (action, item, +/-) with
the smallest poke that makes it. kind: print only that kind's detail."""
import os, re, sys, glob, collections, ast
HERE = os.path.dirname(os.path.abspath(__file__))
mode = sys.argv[1] if len(sys.argv) > 1 else 'action'
want = sys.argv[2] if len(sys.argv) > 2 else None
LINE = re.compile(r'^FLIP \((\d+), (0x[0-9a-f]+)\) (\S+(?: \+ \S+)*): (.*)$')
RUN = re.compile(r'ph(\d) e(\d) \+(\[.*?\]) -(\[.*?\])(?= \||$| \()')
for f in sorted(glob.glob(os.path.join(HERE, 'ctl', mode + '_*.txt'))):
    mon = os.path.basename(f)[len(mode) + 1:-4]
    kinds = collections.Counter(); detail = collections.OrderedDict()
    for l in open(f):
        m = LINE.match(l.rstrip('\n'))
        if not m: continue
        st, n, pk, rest = int(m.group(1)), int(m.group(2), 16), m.group(3), m.group(4)
        for r in RUN.finditer(rest):
            for sign, lst in (('+', r.group(3)), ('-', r.group(4))):
                try: items = ast.literal_eval(lst)
                except Exception: continue
                for it in items:
                    k = it.split(' ')[0]
                    kinds[k] += 1
                    if k in ('REQ', 'CHG', 'HIT') or (want and k == want):
                        key = (st, n, sign, re.sub(r' @0x[0-9a-f]+', '', it))
                        if key not in detail or len(pk) < len(detail[key]): detail[key] = pk
    if not kinds: continue
    print('%s: %s' % (mon, ', '.join('%s %d' % kv for kv in kinds.most_common())))
    for (st, n, sign, it), pk in detail.items():
        k = it.split(' ')[0]
        if want and k != want: continue
        if not want and k not in ('REQ',): continue
        print('    (%d, %#x) %s%s   <- %s' % (st, n, sign, it, pk))
