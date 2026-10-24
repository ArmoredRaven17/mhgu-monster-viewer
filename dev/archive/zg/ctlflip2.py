"""ctlflip2.py -- THE CLASS CONTROL BLOCK [e+0xcac0] SET NON-ZERO, following what each poke makes the code read (rom-map trap 117,
2026-10-19). tracec.py / census_c.py / reqtrace.py zero the whole enemy, C included, so anything gated on a C field is invisible
to them. ctlflip.py (v1) flipped only the fields the zeroed run read, one at a time or all at once -- and a short-circuit hides
the rest: Kushala's word reads ctl+0x2c, and only when it is set reads ctl+0x2d (`0x2c && 0x2d`), so v1 never moved it. v2
SEARCHES: a poke's run logs its own C reads, every field it reads for the first time is poked in turn on top of it (to depth 3),
and a poke is reported when its result differs from its parent's (so a deeper poke is listed only for what it adds).

  CLS=uEmNNN_00 EM=NN python ctlflip2.py action <variant> [statuses]
      per action: phases 0..5 x ended {0,1} (frame = ended), follows 1; compared: MOT / CHG / SCRIPT / TURN / CALL / U1400 / HIT
      (tracec) + REQ (vt+0x1d0 u / vt+0x1cc c / 0xa499c level, as reqtrace.py)
  CLS=uEmNNN_00 EM=NN python ctlflip2.py word <variant> <monster id> [statuses]
      the class's PSL word vt+0x13c over every motion the viewer carries for the id x every action the tracer finds (phase 0);
      compared: e+0x13f4. Actions whose zeroed words and C reads equal an earlier action's are not searched again (listed).
Values: byte 1 / 2 / 0xff; half 1 / 0xffff; word 1 / -1 / 1.0f / 20000.0f.
CONTROLS: action -- Chaotic Gore (uEm071_00 EM=71 variant 5, WATCHX=0xfb700c): (7, 7) phase 1 reaches the footfall maker only with
C+0x84 >= 20000.0f (trap 117). word -- Kushala (uEm024_00 EM=24, em024_00): the word moves only with ctl+0x2c AND ctl+0x2d."""
import sys, os, struct, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import tracec as TR
from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_READ
from unicorn.arm_const import UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_SP, UC_ARM_REG_LR
import armdis
mu, E, P, C = TR.mu, TR.E, TR.P, TR.C
D, DA = armdis.DATA, armdis.DA_VA
VT = TR.C_['vtable']
U = struct.unpack_from('<I', D, VT + 0x1d0 - DA)[0]; CC = struct.unpack_from('<I', D, VT + 0x1cc - DA)[0]
WORD = struct.unpack_from('<I', D, VT + 0x13c - DA)[0]
CSPAN = 0x10000
READS = set()
def rd(uc, acc, addr, size, value, ud):
    READS.add((addr - C, size))
mu.hook_add(UC_HOOK_MEM_READ, rd, begin=C, end=C + CSPAN - 1)
def rq(uc, addr, size, ud):
    r1 = uc.reg_read(UC_ARM_REG_R1)
    mot = struct.unpack('<H', uc.mem_read(E + 0x4b4, 2))[0]
    tag = 'u' if addr == U else 'c' if addr == CC else 'level'
    TR.cur.setdefault('ev', []).append('REQ %s %d motion=%#x' % (tag, r1, mot))
for a in {U, CC, 0xa499c}:
    mu.hook_add(UC_HOOK_CODE, rq, begin=a, end=a)
for _w in filter(None, os.environ.get('WATCHX', '').split(',')):
    TR.WATCH[int(_w, 0)] = 'watch'
VALS = {1: [1, 2, 0xff], 2: [1, 0xffff], 4: [1, 0xffffffff, 0x3f800000, 0x469c4000]}
DEPTH = int(os.environ.get('DEPTH', '3')); BUDGET = int(os.environ.get('BUDGET', '600'))

def setup(var, st, n, pokes):
    mu.mem_write(E, b'\0' * 0x200000)
    mu.mem_write(E, struct.pack('<I', VT)); mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0xcac0, struct.pack('<I', C)); mu.mem_write(E + 0xb5f4, bytes([int(os.environ.get('EM', '57')), var]))
    mu.mem_write(E + 0x73e0, bytes([st, n])); mu.mem_write(E + 0x7420, bytes([1]))
    for (off, size), v in pokes:
        mu.mem_write(C + off, (v & ((1 << (8 * size)) - 1)).to_bytes(size, 'little'))

def run_action(var, st, n, ph, ended, pokes=(), follows=1):
    TR.sc = dict(ended=ended, frame=ended)
    setup(var, st, n, pokes); mu.mem_write(P + 0x1a1, bytes([ph]))
    out = []
    for k in range(follows + 1):
        TR.cur.clear()
        mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, TR.STOP)
        try:
            mu.emu_start(TR.C_['main'], TR.STOP, count=300000)
        except Exception:
            pass
        out += [('  ' * k) + e for e in TR.cur.get('ev', []) if not e.startswith('ERR')]
        f = TR.cur.get('follow')
        if not f: break
        mu.mem_write(E + 0x73e0, bytes([f[0], f[1]])); mu.mem_write(P + 0x1a1, b'\0')
        TR.sc = dict(ended=0, frame=0)
    return out

def run_word(var, st, n, motion, pokes=()):
    setup(var, st, n, pokes); mu.mem_write(E + 0x4b4, struct.pack('<H', motion))
    TR.cur.clear(); TR.sc = dict(ended=0, frame=0)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_R1, motion)
    mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, TR.STOP)
    try:
        mu.emu_start(WORD, TR.STOP, count=100000)
    except Exception:
        return None
    return struct.unpack('<I', mu.mem_read(E + 0x13f4, 4))[0]

def search(evaluate, label, describe):
    """evaluate(pokes) -> result dict; the C reads of the call are in READS. Reports pokes whose result differs from the parent's."""
    READS.clear(); base = evaluate(()); r0 = set(READS)
    if not r0: return 0, set()
    seen = {frozenset()}; queue = [((), base, r0)]; spent = 0; found = 0; allread = set(r0)
    while queue:
        pk, pres, reads = queue.pop(0)
        if len(pk) >= DEPTH: continue
        have = {f for f, _ in pk}
        for f in sorted(reads - have):
            for v in VALS.get(f[1], [1]):
                pk2 = tuple(sorted(pk + ((f, v),)))
                if frozenset(pk2) in seen: continue
                seen.add(frozenset(pk2)); spent += 1
                if spent > BUDGET: print('# %s BUDGET spent' % label, flush=True); return found, allread
                READS.clear(); res = evaluate(pk2); rds = set(READS); allread |= rds
                if res != pres:
                    found += 1
                    print('FLIP %s %s: %s' % (label, ' + '.join('%#x/%d=%#x' % (ff[0], ff[1], vv) for ff, vv in pk2), describe(pres, res)), flush=True)
                if rds - reads or res != pres:
                    queue.append((pk2, res, rds | reads))
    return found, allread

def d_action(a, b):
    out = []
    for r in a:
        if a[r] != b[r]:
            add = [x.strip() for x in b[r] if x not in a[r]]; rem = [x.strip() for x in a[r] if x not in b[r]]
            out.append('ph%d e%d +%s -%s' % (r[0], r[1], add[:3], rem[:3]))
    return ' | '.join(out[:4]) + (' (+%d runs)' % (len(out) - 4) if len(out) > 4 else '')

def action_mode(var, sts):
    RUNS = [(ph, e) for ph in range(6) for e in (0, 1)]
    total = 0
    for st in sts:
        for n in range(0x100):
            if not any(run_action(var, st, n, ph, 0, follows=0) for ph in (0, 1)): continue
            f, reads = search(lambda pk: {r: run_action(var, st, n, *r, pokes=pk) for r in RUNS}, '(%d, %#x)' % (st, n), d_action)
            total += f
            if reads: print('# (%d, %#x) read C %s' % (st, n, sorted('%#x/%d' % x for x in reads)), flush=True)
    print('# flips', total)

def word_mode(var, mon, sts):
    mj = json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\monsters.json'))
    ent = [m for m in mj['monsters'] if m['id'] == mon][0]
    mots = set()
    for l in ent['lists']:
        if not str(l['id']).isdigit(): continue
        for c in l['clips']:
            b = c['clip'].replace('_loop', '').replace('_start', '')
            if b.startswith('Motion['): mots.add((int(l['id']) << 8) | int(b[7:-1]))
    mots = sorted(mots)
    acts = [(0, 0)] + [(st, n) for st in sts for n in range(0x100) if run_action(var, st, n, 0, 0, follows=0)]
    print('# word %#x: %d motions x %d actions' % (WORD, len(mots), len(acts)), flush=True)
    total = 0; done = {}
    def d_word(a, b):
        ch = [m for m in mots if a[m] != b[m]]
        return ', '.join('L%d M%d %s->%s' % (m >> 8, m & 0xff, a[m] if a[m] is None else hex(a[m]), b[m] if b[m] is None else hex(b[m])) for m in ch[:6]) + (' (+%d)' % (len(ch) - 6) if len(ch) > 6 else '')
    for st, n in acts:
        READS.clear(); base = {m: run_word(var, st, n, m) for m in mots}; key = (tuple(base[m] for m in mots), frozenset(READS))
        if not READS: continue
        if key in done: print('# word (%d, %#x) as (%d, %#x)' % (st, n, *done[key]), flush=True); continue
        done[key] = (st, n)
        f, reads = search(lambda pk: {m: run_word(var, st, n, m, pk) for m in mots}, 'word (%d, %#x)' % (st, n), d_word)
        total += f
        print('# word (%d, %#x) read C %s' % (st, n, sorted('%#x/%d' % x for x in reads)), flush=True)
    print('# flips', total)

FRAME = struct.unpack_from('<I', D, VT + 0x208 - DA)[0]
def run_frame(var, st, n, ph, ended, pokes=()):
    """the action main (follows 0), then the frame handler vt+0x208 on the same memory (the update order, effect-runtime-engine
    E14): the frame handler's events only -- the class timers (Kushala's barrier, Teostra's aura, ...)"""
    run_action(var, st, n, ph, ended, pokes, follows=0)
    TR.cur.clear(); TR.sc = dict(ended=ended, frame=ended)
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, TR.STOP)
    try:
        mu.emu_start(FRAME, TR.STOP, count=300000)
    except Exception:
        pass
    return [e for e in TR.cur.get('ev', []) if not e.startswith('ERR')]

def frame_mode(var, sts):
    RUNS = [(ph, e) for ph in range(3) for e in (0, 1)]
    total = 0
    print('# frame handler vt+0x208 = %#x' % FRAME, flush=True)
    seen = {}
    for st in [0] + list(sts):
        for n in (range(0x100) if st else [0]):
            if st and not run_action(var, st, n, 0, 0, follows=0): continue
            READS.clear(); base = {r: run_frame(var, st, n, *r) for r in RUNS}; key = (repr(sorted(base.items())), frozenset(READS))
            if key in seen: continue
            seen[key] = (st, n)
            f, reads = search(lambda pk: {r: run_frame(var, st, n, *r, pokes=pk) for r in RUNS}, 'frame (%d, %#x)' % (st, n), d_action)
            total += f
            if reads: print('# frame (%d, %#x) read C %s' % (st, n, sorted('%#x/%d' % x for x in reads)), flush=True)
    print('# flips', total)

if __name__ == '__main__':
    mode, var = sys.argv[1], int(sys.argv[2], 0)
    if mode == 'frame':
        frame_mode(var, [int(x, 0) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 else list(range(0x13)))
    if mode == 'action':
        action_mode(var, [int(x, 0) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 else list(range(0x13)))
    elif mode == 'word':
        word_mode(var, sys.argv[3], [int(x, 0) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 else list(range(0x13)))
