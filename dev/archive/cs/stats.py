import sys, os
from PIL import Image, ImageChops, ImageStat
S = r'C:/MHGU-Extract/MHGU-Monster-Viewer/dev/shots'
runs = sys.argv[1].split(','); names = sys.argv[2].split(',')
for n in names:
    ims = {r: Image.open(os.path.join(S, 'colour-space-' + r, n + '.png')).convert('RGBA') for r in runs}
    mask = ims[runs[0]].getchannel('A').point(lambda a: 255 if a > 250 else 0)
    line = [n]
    for r in runs:
        st = ImageStat.Stat(ims[r].convert('RGB'), mask)
        lo = ImageStat.Stat(ims[r].convert('L'), mask)
        line.append('%s rgb(%.0f,%.0f,%.0f) L%.1f sd%.1f' % (r, *st.mean, lo.mean[0], lo.stddev[0]))
    for a, b in zip(runs, runs[1:]):
        d = ImageChops.difference(ims[a].convert('RGB'), ims[b].convert('RGB'))
        ds = ImageStat.Stat(d.convert('L'), mask)
        big = sum(1 for p in d.convert('L').getdata() if p > 12)
        line.append('|%s-%s| %.1f, >12: %d px' % (a, b, ds.mean[0], big))
    print('  '.join(line))
