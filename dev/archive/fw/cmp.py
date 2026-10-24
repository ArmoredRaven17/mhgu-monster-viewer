import re,sys
def parse(fn):
    out={}
    for l in open(fn,encoding='utf-8'):
        m=re.match(r"\s+'([^']+)': \{ frames: (\d+), bits: \[(.*)\] \},?$",l.rstrip())
        if not m: continue
        bits=re.findall(r"\{ bit: (\d+), efl: '([^']+)', key: (\d+), on: (\[\[.*?\]\])",m.group(3))
        out[m.group(1)]={(int(b),e,int(k),o) for b,e,k,o in bits}
        out[m.group(1)+'#frames']=m.group(2)
    return out
a=parse(sys.argv[1]); b=parse(sys.argv[2])
for k in sorted(set(a)|set(b)):
    if k.endswith('#frames'):
        if a.get(k)!=b.get(k): print('FRAMES',k,a.get(k),b.get(k))
        continue
    x=a.get(k,set()); y=b.get(k,set())
    for t in sorted(x-y): print('-',k,t)
    for t in sorted(y-x): print('+',k,t)
