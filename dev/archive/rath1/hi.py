import sys,re
mon=sys.argv[1]
f=set(l.split(' on=')[0] for l in open(mon+'_file.txt'))
for l in open(mon+'_whole.txt'):
    k=l.split(' on=')[0]
    b=int(re.search(r' b(\d+) ',l).group(1))
    out = k not in f
    if b>=6 or out:
        print(('*' if out else ' '), l.rstrip())
