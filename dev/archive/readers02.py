# Field maps of the base02 readers: every accessor call (the getter, its index in r1) and where its result is stored.
import sys, json, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis as A
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
ACC = {0x4a22f0: 'ef', 0x4a23f4: 'hitA', 0x4a2470: 'shI', 0x4a24f8: 'shF', 0x4a2584: 'shV', 0x4a2224: 'cmnI',
       0x4a2264: 'cmnF', 0x4a22a8: 'cmnV', 0x4a2378: 'sndI', 0x4a0ee4: 'mode', 0x4a0f00: 'owner'}
READERS = {'Em005_sp_02': 0xd30a90, 'Em010_sp_02': 0xd6caf0, 'Em013_00_02': 0xd8bcdc, 'Em013_01_02': 0xd8ca2c,
  'Em013_02_02': 0xd8d698, 'Em019_sp_02': 0xdcdb98, 'Em020_04_02': 0xdce00c, 'Em020_sp_02': 0xdce2d8,
  'Em023_sp_02': 0xdee77c, 'Em024_sp_02': 0xdfde00, 'Em033_sp_02': 0xe3e76c, 'Em038_sp_02': 0xe63ba4,
  'Em049_sp_02': 0xec4640, 'Em050_sp_02': 0xecfc04, 'Em056_sp_02': 0xeeb328, 'Em058_sp_02': 0xf0fd08,
  'Em067_sp_02': 0xf785ec, 'Em081_04_02': 0x10316a8, 'Em082_sp_02': 0x104ee78, 'Em083_04_02': 0x106170c,
  'Em084_sp_02': 0x10896d8}
def insns(lo):
    out = []
    for off in range(lo, lo + 0x400, 4):
        x = next(md.disasm(A.TEXT[off:off+4], off), None)
        if x is None: out.append((off, '.word', '')); continue
        out.append((off, x.mnemonic, x.op_str))
        if (x.mnemonic == 'pop' and 'pc' in x.op_str) or (x.mnemonic == 'bx' and x.op_str == 'lr'): break
        if x.mnemonic == 'b' and not x.op_str.startswith('#0x') is False and off > lo + 8:
            pass
    return out
res = {}
for name, lo in READERS.items():
    ins = insns(lo)
    regs = {}          # reg -> immediate
    last = None        # (accessor, idx, at)
    rows = []
    for off, m, o in ins:
        ops = [p.strip() for p in o.split(',')]
        if m in ('mov', 'movw') and len(ops) == 2 and ops[1].startswith('#'):
            try: regs[ops[0]] = int(ops[1][1:], 0)
            except: pass
        if m == 'mvn' and len(ops) == 2 and ops[1] == '#0': regs[ops[0]] = -1
        if m == 'bl':
            t = int(o.split('#')[1], 16)
            if t in ACC:
                last = (ACC[t], regs.get('r1'), off)
                regs.pop('r1', None); regs.pop('r2', None)
            else:
                rows.append(('call', hex(t), hex(off))); last = None
            continue
        if last and (m in ('str', 'vstr', 'strb', 'strh')) and ('r0' in ops[0] or 's0' in ops[0]):
            dst = o.split('[')[1].rstrip(']!')
            parts = [p.strip() for p in dst.split(',')]
            off2 = None
            if len(parts) == 2 and parts[1].startswith('#'): off2 = int(parts[1][1:], 0)
            elif len(parts) == 2 and parts[1] in regs: off2 = regs[parts[1]]
            elif len(parts) == 1: off2 = regs.get(parts[0], 0) if parts[0] != 'r4' else 0
            rows.append((last[0], last[1], hex(off2) if off2 is not None else dst, hex(off)))
            last = None
        if m in ('add',) and len(ops) == 3 and ops[1] == 'r4':
            if ops[2] in regs: regs[ops[0]] = regs[ops[2]]
            elif ops[2].startswith('#'): regs[ops[0]] = int(ops[2][1:], 0)
    res[name] = {'reader': hex(lo), 'len': len(ins), 'rows': rows}
json.dump(res, open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\readers02.json', 'w'), indent=1)
for n, r in res.items():
    print('%-12s %s (%d)' % (n, r['reader'], r['len']), ' '.join('%s%s->%s' % (a, '' if i is None else '(%s)' % i, s) if a != 'call' else 'CALL:%s' % i for a, i, s, *_ in r['rows']))
