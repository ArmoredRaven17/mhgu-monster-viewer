import re, collections
def base(r,t): return 0x3f|(0xe00 if r else 0x7000 if t else 0x1c0)
MODE={0:0x1c0000,1:0xe00000,2:0x38000}
T800=[1<<27,1<<27,1<<28,1<<28,0,0,1<<27,1<<27,1<<28,1<<28]
def word(motion, action, mode, r, t):
    w=base(r,t)|MODE.get(mode,0)
    if motion==0x21e:
        if action and action[0]==1 and 0<=action[1]-0x1c<=9: w|=T800[action[1]-0x1c]
    elif action==(10,0xaf): w|=0x7000000
    return w
def rows(fn):
    out={}
    for l in open(fn):
        m=re.match(r'L(\d+) M(\d+) b(\d+) (\S+) (\d+) (\S+) on=(.*?) \| clip: (.*?) \| (.*?) \| (.*)$', l)
        if m: out[(int(m.group(1)),int(m.group(2)),int(m.group(3)),m.group(4)[-1],int(m.group(5)))]=(m.group(7),m.group(6),m.group(8),m.group(9),m.group(10))
    return out
F=rows('rows_file.txt'); W=rows('rows_whole.txt')
acts=[None,(1,0x1c),(1,0x1e),(1,0x22),(1,0x24),(10,0xaf)]
def cls(k):
    L,M,b=k[0],k[1],k[2]; mot=(L<<8)|M
    if b<6: return 'always'
    if b<15: return {6:'calm',7:'calm',8:'calm',9:'rage',10:'rage',11:'rage',12:'tired',13:'tired',14:'tired'}[b]
    if b<24: return 'mode %d'%{15:2,16:2,17:2,18:0,19:0,20:0,21:1,22:1,23:1}[b]
    ons=[a for a in acts if word(mot,a,4,0,0)>>b&1]
    if not ons: return 'NEVER'
    return 'action '+','.join('(%d,%#x)'%a for a in ons if a)
groups=collections.defaultdict(list)
for k,v in W.items():
    c=cls(k); infile=k in F
    groups[(c,infile)].append((k,v))
for (c,infile),lst in sorted(groups.items()):
    print('== %s, %s: %d'%(c,'in file mask' if infile else 'OUTSIDE file mask',len(lst)))
    if c in ('always','calm','rage','tired') and infile: continue
    for k,v in sorted(lst):
        print('   L%d M%d b%d %s %d on=%s [%s] clip=%s eff=%s efl=%s'%(k[0],k[1],k[2],k[3],k[4],v[0],v[1],v[2],v[3],v[4]))
