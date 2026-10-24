import sys, drv
nums = [int(x, 16) for x in sys.argv[1].split(',')]
rank = int(sys.argv[2]) if len(sys.argv) > 2 else 5
tier = int(sys.argv[3]) if len(sys.argv) > 3 else 0
drv.RANK[0] = rank; drv.TAILTIER[0] = tier
for n in nums:
    rows = drv.run(n, ticks=int(sys.argv[4]) if len(sys.argv) > 4 else 600)
    print('==== (7,%#x) rank %d tier %d' % (n, rank, tier))
    for row in rows:
        t, mid, cur, ph = row[:4]
        kind = row[4]
        if kind in ('setMotion', 'SUBMIT', 'ERR') or (kind == 'call' and row[5] in ('vt3d0(chain)', 'chain768c8', '0x3a8430', 'END(af4dc)')) or (kind=='call' and t < 3 and False):
            print('  t%3d %s f%-5g ph%d  %s' % (t, ('L%d M%d' % (mid >> 8, mid & 0xff)) if mid is not None else '-', cur, ph, '  '.join(str(x) for x in row[4:])))
    print('  stop:', drv.st['stop'], ' last frame', drv.st['cur'], 'len', drv.st['len'])
