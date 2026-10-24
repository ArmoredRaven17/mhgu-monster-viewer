import sys, drv, time
rank = int(sys.argv[1]); lvl = int(sys.argv[2]) if len(sys.argv) > 2 else 0
drv.RANK[0] = rank; drv.CHARGE[0] = lvl
t0 = time.time()
for n in range(1, 0xf5):
    rows = drv.run(n, ticks=700)
    ev = []
    for row in rows:
        t, mid, cur, ph = row[:4]
        k = row[4]
        if k == 'setMotion': ev.append('set %s(%s,start %s)' % (row[6], row[5], row[8]))
        elif k == 'SUBMIT': ev.append('SUBMIT[%s @ %s]' % (row[5], row[6]))
        elif k == 'ERR': ev.append('ERR %s %s' % (row[5], row[6]))
        elif k == 'call' and row[5] in ('vt3d0(chain)', 'chain768c8', 'END(af4dc)'): ev.append('%s %s' % (row[5], row[6]))
    print('(7,%#04x) %s | stop %s | end f%g/%g' % (n, ' ; '.join(ev), drv.st['stop'], drv.st['cur'], drv.st['len']), flush=True)
print('time', time.time() - t0)
