"""hypermotion/hookemu.py (hyper-motion lane, 2026-10-27): THE HYPER MOTION HOOKS, from each class's own code, under unicorn.

The hooks: enemy vt+0x1ec (run by the action main 0xa5b84 when e+0xb736 == 0, i.e. below G) and vt+0x1f0 (the running frame
0xae0e4..0xae100, before the motion advance, when e+0xb736 != 0: G) -- decode note shared-state-effects.md 9. 40 classes override
them (uEnemy's are 0x6be54 / 0x6be58, empty). Each hook loops over the two aura slots (e+0xca88 + 0x14 g, the held DouMouKaID),
switches on the motion id e+0x4b4, and on frame tests (0xb0974 / 0xb098c / .. -> 0x72714) calls the rate 0xb07b4 (P+0x398, layer
speed factor; setMotion 0xafce8 puts it back to 1.0) and the burst 0xca4e0(e, id) (u 53 + id -> u 1310 + ID).

Method: the class code runs natively (every address >= 0xcec000); every call into the shared band is stubbed (r0 = 0, logged)
except the motion getters 0xb0900..0xb0968 and the predicate entries 0xb0968..0xb09c4, which run natively into 0x72714, which is
ANSWERED from a chosen clip clock (prev = t - 1, cur = t; READ semantics, 0x72714..0x72b40 non-wrapped arms: mode 0 = a crossing
prev < f <= cur (0x7294c -> 0x72b1c), mode 1 = cur >= f (0x72904 -> 0x72b04); any other mode is logged and answers 0).
Pass 1: every motion id L0..L9 x M0..M199, each aura ID alone in its group's slot (the other slot 0 = none held), the clock at
t = 1e6 with tests answering 0: the motions whose code reaches a frame test, rate or burst. Pass 2: per such (ID, motion), the clock
swept t = 0..max(f asked)+2: every rate / burst call and the frame it fires on (`table`, per ID; `sites` = the bl 0xb07b4 / bl 0xca4e0 call sites). Then per pair the viewer can hold
(one group-0 ID, one group-1 ID; `pairs`, keyed as index.html's state.hyper), the same sweep with both slots set: the viewer's table.
   python dev/archive/hypermotion/hookemu.py <monster id ...>  (default: every hyper monster)  -> JSON on stdout
Caveats (named): a hook that reads state the stub zeroes (rage 0x81670, tired 0x81614, a ctl byte) shows its zero-state branch;
every stubbed call is listed per hook in `calls` so such a gate is visible, never silent."""
import sys, struct, os, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import armdis, emclasses
from unicorn import *
from unicorn.arm_const import *
T = armdis.TEXT
CL = emclasses.load()
CLASS_OF = {'em002': 'uEm001_00', 'em005': 'uEm004_00'}
E = 0x30000000; P = 0x30100000; C = 0x30180000; STOP = 0x50000000
CLASS_LO = 0xcec000
NATIVE = set(range(0xb0900, 0xb0968)) | set(range(0xb0968, 0xb09c4))
mu = Uc(UC_ARCH_ARM, UC_MODE_ARM)
try: mu.ctl_set_cpu_model(UC_CPU_ARM_MAX)
except Exception: pass
mu.mem_map(0, (len(T) + 0xfff) & ~0xfff); mu.mem_write(0, T)
ro = armdis.RO_VA & ~0xfff
mu.mem_map(ro, ((armdis.RO_VA + len(armdis.RODATA) - ro) + 0xfff) & ~0xfff); mu.mem_write(armdis.RO_VA, armdis.RODATA)
da = armdis.DA_VA & ~0xfff
mu.mem_map(da, ((armdis.DA_VA + len(armdis.DATA) - da) + 0x800000 + 0xfff) & ~0xfff); mu.mem_write(armdis.DA_VA, armdis.DATA)
mu.mem_map(E, 0x200000); mu.mem_map(0x40000000, 0x10000); mu.mem_map(STOP, 0x1000)
mu.reg_write(UC_ARM_REG_C1_C0_2, mu.reg_read(UC_ARM_REG_C1_C0_2) | (0xf << 20))
mu.reg_write(UC_ARM_REG_FPEXC, 0x40000000)
S = {'t': 1e6, 'ev': [], 'asked': set(), 'calls': set(), 'modes': set(), 'rank': 0}


def f32(r):
    return struct.unpack('<f', struct.pack('<I', mu.reg_read(r) & 0xffffffff))[0]


def ret(uc, v):
    uc.reg_write(UC_ARM_REG_R0, v); uc.reg_write(UC_ARM_REG_PC, uc.reg_read(UC_ARM_REG_LR))


def hook(uc, addr, size, ud):
    if addr in NATIVE or addr == STOP: return
    lr = uc.reg_read(UC_ARM_REG_LR)
    if addr == 0x72714:
        mode, f0 = uc.reg_read(UC_ARM_REG_R1), f32(UC_ARM_REG_S0)
        S['asked'].add(round(f0, 3)); S['modes'].add(mode)
        t = S['t']; prev, cur = t - 1, t
        v = (1 if (prev < f0 <= cur) else 0) if mode == 0 else (1 if cur >= f0 else 0) if mode == 1 else 0
        if mode not in (0, 1): S['calls'].add('pred-mode-%d' % mode)
        S['ev'].append(('test', mode, round(f0, 3), v))
        ret(uc, v); return
    if addr == 0xb07b4:
        S['ev'].append(('rate', round(f32(UC_ARM_REG_S0), 4), lr - 4)); ret(uc, 0); return
    if addr == 0xca4e0:
        S['ev'].append(('burst', uc.reg_read(UC_ARM_REG_R1), lr - 4)); ret(uc, 0); return
    if addr == 0x3a8430:
        ret(uc, 5 if S['rank'] else 3); return
    S['calls'].add('%#x' % addr)
    ret(uc, 0)


def onbad(uc, typ, addr, size, value, ud):
    try: uc.mem_map(addr & ~0xfff, 0x2000); return True
    except Exception: return False


mu.hook_add(UC_HOOK_CODE, hook, begin=0, end=CLASS_LO - 1)
mu.hook_add(UC_HOOK_MEM_READ_UNMAPPED | UC_HOOK_MEM_WRITE_UNMAPPED | UC_HOOK_MEM_FETCH_UNMAPPED, onbad)


def run(cls, em, var, rank, ids, motion, t):
    """one call of the hook: ids = (slot 0 ID, slot 1 ID); returns the rate / burst events."""
    S['t'] = t; S['ev'] = []; S['rank'] = rank
    mu.mem_write(E, b'\0' * 0x10000); mu.mem_write(E + 0xb000, b'\0' * 0x2000)
    mu.mem_write(E, struct.pack('<I', cls['vtable'])); mu.mem_write(E + 0x1428, struct.pack('<I', P))
    mu.mem_write(E + 0xcac0, struct.pack('<I', C))
    mu.mem_write(E + 0xb5f4, bytes([em, var])); mu.mem_write(E + 0xb5f0, struct.pack('<H', em))  # the em number twice: uEm004_00 dispatches on the u16 e+0xb5f0 (0xd2e64c)
    mu.mem_write(E + 0xb720, b'\1'); mu.mem_write(E + 0xb736, bytes([rank]))
    mu.mem_write(E + 0xca88, bytes([ids[0]])); mu.mem_write(E + 0xca9c, bytes([ids[1]]))
    mu.mem_write(E + 0x4b4, struct.pack('<H', motion))
    entry = armdis.u32(cls['vtable'] + (0x1f0 if rank else 0x1ec))
    mu.reg_write(UC_ARM_REG_R0, E); mu.reg_write(UC_ARM_REG_SP, 0x4000f000); mu.reg_write(UC_ARM_REG_LR, STOP)
    try: mu.emu_start(entry, STOP, count=200000)
    except Exception as ex: S['calls'].add('ERR %s' % ex)
    return [e for e in S['ev'] if e[0] != 'test'], [e for e in S['ev'] if e[0] == 'test']


def sweep(cls, em, var, rank, ids, motion):
    """the clock swept over the frames the hook asks: [(frame, kind, value)]"""
    S['asked'] = set()
    run(cls, em, var, rank, ids, motion, 1e6)
    hi = max([a for a in S['asked'] if a < 1e5] + [0]) + 2
    out, t = [], 0
    while t <= hi:
        evs, _ = run(cls, em, var, rank, ids, motion, t)
        for e in evs: out.append((t,) + e)
        hi = max([hi] + [a + 2 for a in S['asked'] if a < 1e5])
        t += 1
    return out


def compact(ev):
    """the sweep -> {rates: [[frame, x]..] (the last rate call of each frame, kept where it changes), bursts: [frame..]}"""
    rates, bursts, last = [], [], None
    sites = sorted({'%#x' % e[3] for e in ev if len(e) > 3})
    for t in sorted({e[0] for e in ev}):
        rs = [e[2] for e in ev if e[0] == t and e[1] == 'rate']
        if rs and rs[-1] != last: rates.append([t, rs[-1]]); last = rs[-1]
        bursts += [[t, e[2]] for e in ev if e[0] == t and e[1] == 'burst']
    return {'rates': rates, 'bursts': bursts, 'sites': sites}


def main(ids):
    HY = json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\hyper-auras.json'))
    res = {}
    for mid in ids:
        h = HY.get(mid)
        if not h: continue
        em, var = int(mid[2:5]), int(mid[6:8])
        cname = CLASS_OF.get(mid[:5], 'uEm%03d_00' % em)
        cls = CL.get(cname)
        if not cls: res[mid] = {'error': 'no class ' + cname}; continue
        out = {'class': cname, 'vtable': '%#x' % cls['vtable'],
               'hook': {'normal': '%#x' % armdis.u32(cls['vtable'] + 0x1ec), 'g': '%#x' % armdis.u32(cls['vtable'] + 0x1f0)}}
        for fk, rank in (('normal', 0), ('g', 1)):
            fd = h.get(fk)
            if not fd: continue
            S['calls'] = set(); S['modes'] = set()
            rows = {}
            for a in fd['auras']:
                slot = (a['id'], 0) if a['group'] == 0 else (0, a['id'])
                for L in range(10):
                    for M in range(200):
                        mot = (L << 8) | M
                        S['asked'] = set()
                        evs, tests = run(cls, em, var, rank, slot, mot, 1e6)
                        if not (evs or tests): continue
                        sw = sweep(cls, em, var, rank, slot, mot)
                        rows.setdefault(str(a['id']), {})['L%d M%d' % (L, M)] = sw
                        if not any(e[1] in ('rate', 'burst') for e in sw): S['calls'].add('tests-only L%d M%d id %d' % (L, M, a['id']))
            # THE PAIRS (what the viewer holds): both slots in one run -- per frame slot 0's calls then slot 1's, the last rate
            # winning, level tests (mode 1) re-setting every frame -- so a pair is swept as itself, not composed from its IDs
            g0 = [a['id'] for a in fd['auras'] if a['group'] == 0] or [0]
            g1 = [a['id'] for a in fd['auras'] if a['group'] == 1] or [0]
            pairs = {}
            for x in g0:
                for y in g1:
                    key = ','.join(str(v) for v in (x, y) if v)
                    mots = sorted({m for i in (x, y) for m in rows.get(str(i), {})})
                    for m in mots:
                        L, M = [int(v[1:]) for v in m.split()]
                        c = compact(sweep(cls, em, var, rank, (x, y), (L << 8) | M))
                        if c['rates'] or c['bursts']: pairs.setdefault(key, {})[m] = c
            out[fk] = {'table': {i: {m: compact(ev) for m, ev in r.items() if any(e[1] in ('rate', 'burst') for e in ev)} for i, r in rows.items()},
                       'pairs': pairs, 'raw': rows if os.environ.get('RAW') else None, 'calls': sorted(S['calls']), 'modes': sorted(S['modes'])}
        res[mid] = out
        print('#', mid, cname, {k: len(out[k]['table']) for k in ('normal', 'g') if k in out}, file=sys.stderr, flush=True)
    json.dump(res, sys.stdout, indent=0)


if __name__ == '__main__':
    HY = json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\hyper-auras.json'))
    main(sys.argv[1:] or [k for k in HY if k.startswith('em') and HY[k]])
