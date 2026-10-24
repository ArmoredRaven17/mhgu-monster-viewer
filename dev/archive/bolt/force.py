import sys, drv
nums=[int(x,16) for x in sys.argv[1].split(',')]
forces={int(k,16):int(v) for k,v in (x.split('=') for x in sys.argv[2].split(','))} if len(sys.argv)>2 and sys.argv[2] else {}
drv.CHARGE[0]=int(sys.argv[3]) if len(sys.argv)>3 else 2
drv.RANK[0]=int(sys.argv[4]) if len(sys.argv)>4 else 5
for a,v in forces.items(): drv.STUBS[a]=(lambda v: (lambda uc: v))(v)
for n in nums:
    rows=drv.run(n, ticks=700)
    ev=[]
    for row in rows:
        k=row[4]
        if k=='setMotion': ev.append('set %s(start %s)'%(row[6],row[8]))
        elif k=='SUBMIT': ev.append('SUBMIT[%s @ %s]'%(row[5],row[6]))
        elif k=='ERR': ev.append('ERR %s'%row[6])
        elif k=='call' and row[5] in ('vt3d0(chain)','chain768c8','END(af4dc)'): ev.append('%s %s'%(row[5],row[6]))
    print('(7,%#04x) %s | stop %s | end f%g/%g'%(n,' ; '.join(ev),drv.st['stop'],drv.st['cur'],drv.st['len']))
