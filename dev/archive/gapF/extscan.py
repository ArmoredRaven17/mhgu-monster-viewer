# extscan.py -- does any out-of-band callee of the band (direct calls / tail calls, 165 targets) reach the submit 0x48b884?
# Closure by rdesc.walk over the whole text from each target, direct edges only (indirect calls named, not followed).
import sys, json
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.path.insert(0, '.')
import armdis, rdesc
d = json.load(open('band024.json'))
SUB = 0x48b884
tg = sorted(int(k, 16) for k in d['ext'] if k.startswith('0x') and int(k, 16) != SUB)
seen, ent, ext, unres, tables, fptr = rdesc.walk([t for t in tg], 0x10000, len(armdis.TEXT))
# who calls the submit inside the closure
callers = [a for a, (m, o) in seen.items() if m in ('bl', 'b') and o == '#0x48b884']
print('closure: %d insns, %d entries, %d unresolved pc writes, %d indirect tail calls' % (len(seen), len(ent), len(unres), sum(1 for k in ext if not str(k).startswith('0x') and not isinstance(k, int))))
print('submit callers reached from the band\'s callees:', [hex(a) for a in sorted(callers)])
# attribute each caller to the band targets that reach it (reverse BFS over call edges)
import collections
