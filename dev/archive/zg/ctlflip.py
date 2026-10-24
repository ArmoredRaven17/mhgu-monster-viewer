"""ctlflip.py -- THE CLASS CONTROL BLOCK [e+0xcac0] SET NON-ZERO (rom-map trap 117, 2026-10-19). tracec.py / census_c.py /
reqtrace.py run every action with the whole enemy zeroed, the control block C included, so a request, a motion or a follow gated
on a C field is invisible to them (Chaotic Gore's footfall dust: C+0x84 >= 20000). This runs the same harness with the C reads
LOGGED, then re-runs each action with every field it read set to non-zero values -- one field at a time, and all of them at
once -- and reports what changes, the way RAGE / TIRED are answered.

  CLS=uEmNNN_00 EM=NN python ctlflip.py action <variant> [statuses] > out.txt
      events compared: MOT / CHG / SCRIPT / TURN / CALL / U1400 (tracec) + REQ (vt+0x1d0 / vt+0x1cc / 0xa499c, as reqtrace)
      per action: phases 0..5 x ended {0,1} (frame = ended), follows 1
  CLS=uEmNNN_00 EM=NN python ctlflip.py word <variant> <monster id> [statuses]
      the class's PSL word vt+0x13c over every motion the viewer's lists carry for <monster id> x every action the census finds
      (phase 0); compared: e+0x13f4
Values: byte 1 / 2 / 3 / 0xff; half 1 / 0xffff; word 1 / 2 / -1 / 1.0f / 20000.0f / 1e7f.
CONTROL (`control` mode): uEm071_00 action census must flip Chaotic's footfall path on C+0x84 (trap 117's worked example)."""
import sys, os, struct, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import tracec as TR
from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_READ
from unicorn.arm_const import UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_SP, UC_ARM_REG_LR, UC_ARM_REG_PC
import armdis
mu, E, P, C = TR.mu, TR.E, TR.P, TR.C
D, DA = armdis.DATA, armdis.DA_VA
VT = TR.C_['vtable']
U = struct.unpack_from('<I', D, VT + 0x1d0 - DA)[0]; CC = struct.unpack_from('<I', D, VT + 0x1cc - DA)[0]
WORD = struct.unpack_from('<I', D, VT + 0x13c - DA)[0]
CSPAN = 0x10000
READS = {'on': False, 'set': set()}
def rd(uc, acc, addr, size, value, ud):
    if READS['on'] and C <= addr < C + CSPAN:
        READS['set'].add((addr - C, size))
mu.hook_add(UC_HOOK_MEM_READ, rd, begin=C, end=C + CSPAN - 1)
def rq(uc, addr, size, ud):
    r1 = uc.reg_read(UC_ARM_REG_R1)
    mot = struct.unpack('<H', uc.mem_read(E + 0x4b4, 2))[0]
    tag = 'u' if addr == U else 'c' if addr == CC else 'level'
    TR.cur.setdefault('ev', []).append('REQ %s %d motion=%#x' % (tag, r1, mot))
for a in {U, CC, 0xa499c}:
    mu.hook_add(UC_HOOK_CODE, rq, begin=a, end=a)

for _w in filter(None, os.environ.get('WATCHX', '').split(',')):      # WATCHX=0xfb700c: log entries to a maker (tracec WATCH)
    TR.WATCH[int(_w, 0)] = 'watch'
VALS = {1: [1, 2, 3, 0xff], 2: [1, 0xffff], 4: [1, 2, 0xffffffff, 0x3f800000, 0x469c4000, 0x4b189680]}
def poke(pokes):
    for (off, size), v in pokes:
        mu.mem_write(C + off, (v & ((1 << (8 * size)) - 1)).to_bytes(size, 'little'))

def run_action(var, st, n, ph, ended, pokes=(), follows=1):
    """tracec.run with the C pokes written after the zero fill (the same steps, the same order)"""
    TR.sc = dict(ended=ended, frame=ended)
    mu.mem_write(E, b'\0' * 0x200000)
    mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0xcac0, struct.pack('<I', C)); mu.mem_write(E + 0xb5f4, bytes([int(os.environ.get('EM', '57')), var]))
    mu.mem_write(E + 0x73e0, bytes([st, n])); mu.mem_write(P + 0x1a1, bytes([ph]))
    mu.mem_write(E + 0x7420, bytes([1]))
    poke(pokes)
    out = []
    for k in range(follows + 1):
        TR.cur.clear()
        mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, TR.STOP)
        try:
            mu.emu_start(TR.C_['main'], TR.STOP, count=300000)
        except Exception as ex:
            TR.cur.setdefault('ev', []).append('ERR %s' % str(ex)[:60])
        out += [('  ' * k) + e for e in TR.cur.get('ev', []) if not e.startswith('ERR')]
        f = TR.cur.get('follow')
        if not f: break
        mu.mem_write(E + 0x73e0, bytes([f[0], f[1]])); mu.mem_write(P + 0x1a1, b'\0')
        TR.sc = dict(ended=0, frame=0)
    return out

def flips(fields):
    for fld in sorted(fields):
        for v in VALS.get(fld[1], [1]):
            yield ('%#x/%d=%#x' % (fld[0], fld[1], v), [(fld, v)])
    for v in (1, 0xff):
        yield ('ALL=%#x' % v, [(fld, v if fld[1] == 1 else (v if v == 1 else (1 << (8 * fld[1])) - 1)) for fld in sorted(fields)])
    yield ('ALL=20000.0f', [(fld, 0x469c4000 if fld[1] == 4 else 1) for fld in sorted(fields)])

def action_mode(var, sts):
    RUNS = [(ph, e) for ph in range(6) for e in (0, 1)]
    found = 0
    for st in sts:
        for n in range(0x100):
            READS['on'] = True; READS['set'] = set()
            base = {r: run_action(var, st, n, *r) for r in RUNS}
            READS['on'] = False
            fields = set(READS['set'])
            if not fields or not any(base.values()): continue
            for name, pk in flips(fields):
                diff = []
                for r in RUNS:
                    got = run_action(var, st, n, *r, pokes=pk)
                    if got != base[r]:
                        add = [x for x in got if x not in base[r]]; rem = [x for x in base[r] if x not in got]
                        diff.append('ph%d e%d +%s -%s' % (r[0], r[1], add[:3], rem[:3]))
                if diff:
                    found += 1
                    print('FLIP (%d, %#x) %s: %s' % (st, n, name, ' | '.join(diff[:4])), flush=True)
            print('# (%d, %#x) read C %s' % (st, n, sorted('%#x/%d' % f for f in fields)), flush=True)
    print('# flips', found)

def run_word(var, st, n, motion, pokes=()):
    mu.mem_write(E, b'\0' * 0x200000)
    mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0xcac0, struct.pack('<I', C)); mu.mem_write(E + 0xb5f4, bytes([int(os.environ.get('EM', '57')), var]))
    mu.mem_write(E + 0x73e0, bytes([st, n])); mu.mem_write(E + 0x4b4, struct.pack('<H', motion))
    poke(pokes)
    TR.cur.clear(); TR.sc = dict(ended=0, frame=0)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, TR.STOP)
    try:
        mu.emu_start(WORD, TR.STOP, count=100000)
    except Exception:
        return None
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]

def word_mode(var, mon, sts):
    mj = json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\monsters.json'))
    ent = [m for m in mj['monsters'] if m['id'] == mon][0]
    mots = set()
    for l in ent['lists']:
        if not str(l['id']).isdigit(): continue
        for c in l['clips']:
            b = c['clip'].replace('_loop', '').replace('_start', '')
            if b.startswith('Motion['): mots.add((int(l['id']) << 8) | int(b[7:-1]))
    acts = [(0, 0)]
    for st in sts:
        for n in range(0x100):
            if run_action(var, st, n, 0, 0, follows=0): acts.append((st, n))
    print('# word %#x: %d motions x %d actions' % (WORD, len(mots), len(acts)), flush=True)
    found = 0
    for st, n in acts:
        READS['on'] = True; READS['set'] = set()
        base = {m: run_word(var, st, n, m) for m in sorted(mots)}
        READS['on'] = False
        fields = set(READS['set'])
        if not fields: continue
        for name, pk in flips(fields):
            ch = [(m, base[m], w) for m in sorted(mots) for w in [run_word(var, st, n, m, pk)] if w != base[m]]
            if ch:
                found += 1
                print('FLIP word (%d, %#x) %s: %s' % (st, n, name, ', '.join('L%d M%d %s->%s' % (m >> 8, m & 0xff, hex(a) if a is not None else a, hex(b) if b is not None else b) for m, a, b in ch[:6])), flush=True)
        print('# word (%d, %#x) read C %s' % (st, n, sorted('%#x/%d' % f for f in fields)), flush=True)
    print('# flips', found)

if __name__ == '__main__':
    mode, var = sys.argv[1], int(sys.argv[2], 0)
    if mode == 'action':
        sts = [int(x, 0) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 else list(range(0x13))
        action_mode(var, sts)
    elif mode == 'word':
        sts = [int(x, 0) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 else list(range(0x13))
        word_mode(var, sys.argv[3], sts)
