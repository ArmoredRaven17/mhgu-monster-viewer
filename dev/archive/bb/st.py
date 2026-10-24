from d import *
import re,sys
offs=[int(x,16) for x in sys.argv[1:]]
pat=re.compile(r'\[(\w+), #(0x[0-9a-f]+)\]')
n=0
for i in md.disasm(TEXT, 0):
    if i.mnemonic.startswith(('str','ldr')) :
        m=pat.search(i.op_str)
        if m and int(m.group(2),16) in offs:
            print("%08x %s %s"%(i.address,i.mnemonic,i.op_str))
