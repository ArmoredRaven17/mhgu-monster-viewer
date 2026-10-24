# gapO: every BEAM_TYPES entry's FOLDER (from the shell id its monster's spawn requests -> 0x175c3e8 row's res -> 0x159daa0
# path hash) and HIT (the mode's HitParam FUP ints; hit[0] is what every beam reader stores to +0x1654 through 0x4a23f4).
#   python beamreads.py  -> beamreads.json (per entry) + a printed table; asserts every control.
import sys, os, json, zlib, struct, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, 'C:/MHGU-Extract/efx')
sys.path.insert(0, os.path.join(HERE, '..', 'gapN'))
import shellef, arclist, shlinfo
import w                                  # gapN's disassembler (main.text / rodata / data)
import capstone
SEP = chr(92)
VIEWER = 'C:/MHGU-Extract/MHGU-Monster-Viewer'
ARCS = r'C:\MHGU-ROM\romfs\nativeNX\arc\enemy'
TAB = {r['id']: r for r in json.load(open(r'C:\MHGU-Extract\efx\agents\narga-shell-scratch\shelltable.json'))}
PATHS = 0x159daa0                          # [res] = {~crc32(lowercase path), type} (rom-map 0x48b784..0x48b7b0)

# THE ID EACH MONSTER'S BEAM SPAWN WRITES TO THE SETUP +4 (dev/beams/<mon>.md, each READ there; the sites re-checked below):
#   ('imm', [addr..], id): a literal at each address;  ('slot', field, writer addr, id, [spawn load addr]): the class's field,
#   written by its vt+0x158 (or the helper named) at the address given.
IDS = {
  'em004_00': ('slot', 0xcacc, 0xd2e538, 0x6c, 'vt+0x158 0xd2e538 em 4; spawn stmib {[e+0xcacc], sb} 0xd29570'),
  'em005_00': ('slot', 0xcacc, 0xd2e538, 0x6e, 'vt+0x158 0xd2e538 em 5; same spawn 0xd29570'),
  'em010_00': ('imm', [], 0x7d, 'literal at every spawner (dev/beams/em010_00.md; 7 submits, census)'),
  'em013_00': ('imm', [0xd86708], 0x84, '0xd865a0 variant 0'),
  'em013_01': ('imm', [0xd867a0], 0x88, '0xd865a0 variant 1'),
  'em019_00': ('slot', 0xcacc, 0xdc09d4, 0x9a, 'vt+0x158 0xdc09d4 (variant != 4)'),
  'em019_04': ('slot', 0xcacc, 0xdc09d4, 0x9c, 'vt+0x158 0xdc09d4 (variant 4)'),
  'em020_00': ('slot', 0xcad8, 0xdc3e8c, 0x9e, 'vt+0x158 0xdc3e8c: mov r2,#0x9e (movweq #0xa0 on variant 4) -> [e+0xcad8] 0xdc3eb4; helper 0xdc5e44 stmib'),
  'em020_04': ('imm', [0xdc5f04], 0xa0, 'helper 0xdc5edc: mov r0,#0xa0 0xdc5f04'),
  'em023_00': ('imm', [0xde8948, 0xde8970], 0xa9, '0xde8908: ldrb [e+0xb5f5] 0xde8924, cmp #5 0xde8940 -> 0xad else 0xa9'),
  'em023_05': ('imm', [0xde8948, 0xde8970], 0xad, 'same, variant 5'),
  'em024_00': ('imm', [0xdf8d78, 0xdf8f4c], 0xb1, 'the two 0x30 requests (submit 0xdf8fa8)'),
  'em033_00': ('imm', [], 0xc2, '8 base02 requests, all 0xc2 (dev/beams/em033_00.md); registration 0xe361e0'),
  'em038_00': ('imm', [], 0xd0, 'each arm mov r0,#0xd0 / str [r1,#4] (dev/beams/em038_00.md)'),
  'em049_00': ('imm', [], 0xee, 'mov r0,#0xee after alloc 0xeba55c; 0xebb77c submit'),
  'em050_00': ('imm', [0xec8924, 0xec8814], 0xf1, 'mov r0,#0xf1'),
  'em056_00': ('imm', [], 0xf5, 'mov r0,#0xf5 after alloc 0xee54e0 / 0xee5878'),
  'em058_00': ('imm', [], 0xfe, 'requests 0xf0d064 / 0xf0d100 in 0xf0cf34'),
  'em067_00': ('imm', [0xf6fc00, 0xf7150c, 0xf72418], 0x123, 'movw r0,#0x123'),
  'em081_04': ('slot', 0xcbb8, 0x1019c1c, 0x153, 'vt+0x158 0x1019c1c: variant 4 movw #0x153 0x1019c6c -> str [e+0xcbb8] 0x1019cc8; helper 0x102feb4 ldr 0x102fee4'),
  'em082_00': ('slot', 0xcac4, 0x1035040, 0x15a, 'vt+0x158 0x1035040: movw r3,#0x15a 0x103508c -> str [e+0xcac4]! 0x10350a4'),
  'em082_04': ('slot', 0xcac4, 0x1035040, 0x15e, 'vt+0x158 0x1035040: variant 4 movw r3,#0x15e 0x1035068'),
  'em084_00': ('imm', [0x106f6d4, 0x107cb18], 0x16e, 'movw r0,#0x16e'),
}
# literal sites to CHECK by disassembly (address -> immediate): every one must be a mov / movw of that id
CHECK = {0xd86708: 0x84, 0xd867a0: 0x88, 0xdc5f04: 0xa0, 0xdf8d78: 0xb1, 0xdf8f4c: 0xb1, 0xec8924: 0xf1, 0xec8814: 0xf1,
         0xf6fc00: 0x123, 0xf7150c: 0x123, 0xf72418: 0x123, 0x106f6d4: 0x16e, 0x107cb18: 0x16e,
         0x1019c6c: 0x153, 0x103508c: 0x15a, 0x1035068: 0x15e}
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
def imm_at(a):
    i = next(md.disasm(w.TEXT[a:a + 4], a))
    m = re.search(r'#(0x[0-9a-f]+|\d+)$', i.op_str)
    return i.mnemonic, i.op_str, (int(m.group(1), 0) if m else None)
# the windows to scan for a literal site, where the note cites only the function (each window = the spawner as cited)
SCAN = {'em010_00': (0xd67000, 0xd6cce8), 'em033_00': (0xe3a000, 0xe3e76c), 'em038_00': (0xe60e00, 0xe63400),
        'em049_00': (0xeba400, 0xebb800), 'em056_00': (0xee5400, 0xee5900), 'em058_00': (0xf0cf34, 0xf0d200),
        'em023_00': (0xde8908, 0xde8990)}
def scan(lo, hi, v):
    out = []
    for a in range(lo, hi, 4):
        try: mn, op, im = imm_at(a)
        except StopIteration: continue
        if mn.startswith('mov') and im == v: out.append(a)
    return out

def path_of(res):
    return w.u32(PATHS + res * 8), w.u32(PATHS + res * 8 + 4)

_arcpaths = {}
def arc_paths(mon):
    if mon not in _arcpaths:
        d = {}
        ver, rows = arclist.entries(os.path.join(ARCS, mon + '.arc'))
        for nm, th, comp, dec, off in rows:
            h = (zlib.crc32(nm.lower().encode()) ^ 0xffffffff) & 0xffffffff
            d.setdefault(h, set()).add((nm, th))
        _arcpaths[mon] = d
    return _arcpaths[mon]

def resolve(mon, sid):
    r = TAB[sid]
    res = int(r['res'], 16)
    ph, ty = path_of(res)
    hits = arc_paths(mon).get(ph) or arc_paths(mon).get(ph & 0x7fffffff) or set()
    names = sorted({nm for nm, th in hits})
    assert len(names) == 1, (mon, hex(sid), names)
    return r, res, ph, ty, names[0]

def load_types():
    src = open(os.path.join(VIEWER, 'docs', 'render', 'beam-types.js'), encoding='utf-8').read()
    i = src.index('export const BEAM_TYPES'); j = src.index('export const BEAM_MODES')
    t = [json.loads(l.strip().rstrip(',')) for l in src[i:j].splitlines() if l.strip().startswith('{')]
    m = [json.loads(l.strip().rstrip(',')) for l in src[j:].splitlines() if l.strip().startswith('{')]
    return t, m

def hitshapes():
    src = open(os.path.join(VIEWER, 'docs', 'render', 'shell-hitshapes.js'), encoding='utf-8').read()
    return json.loads(src[src.index('{', src.index('export const HITSHAPES')):src.rindex('}') + 1])

def main():
    types, modes = load_types()
    HS = hitshapes()
    # 1. the literal sites
    for a, v in CHECK.items():
        mn, op, im = imm_at(a)
        assert mn.startswith('mov') and im == v, (hex(a), mn, op, hex(v))
    scans = {}
    for mon, (lo, hi) in SCAN.items():
        scans[mon] = [hex(a) for a in scan(lo, hi, IDS[mon][2])]
        assert scans[mon], mon
    # 2. per entry
    out, T_ = [], {}
    for lst, tag in ((types, 'T'), (modes, 'M')):
        for e in lst:
            mon, m, cls = e['mon'], e['mode'], e['cls']
            kind = IDS[mon]
            sid = kind[3] if kind[0] == 'slot' else kind[2]
            r, res, ph, ty, path = resolve(mon, sid)
            assert r['cls']['name'] == cls, (e['id'], r['cls']['name'], cls)                 # the row's class is the entry's
            assert r['setup']['name'].endswith('cSetupParamEmBase02'), r['setup']
            folder = SEP.join(path.split(SEP)[:-1])
            T = T_.get(mon) or T_.setdefault(mon, shellef.load_typed(os.path.join(ARCS, mon + '.arc')))
            assert (path, '4aa69872') in T, path                                              # the .shl itself
            info = shlinfo.shell_info(T, path)
            # control: the walk's EffectParam for the mode is the _ef### the generator took for it, its scale the generator's
            efp = info[m]['ef'][1] if m < len(info) and info[m]['ef'] else None
            assert efp == path + '_ef%03d' % m, (e['id'], efp)
            assert abs(info[m]['scale'] - e['scale']) < 1e-4, (e['id'], info[m]['scale'], e['scale'])
            ints = shlinfo.hit_ints(T, info, m)
            h0 = shlinfo.hit0(ints)
            hs = HS.get(folder)
            rec = hs['hitrec'][h0] if hs and 0 <= h0 < len(hs['hitrec']) else None
            out.append({'list': tag, 'id': e['id'], 'cls': cls, 'mode': m, 'sid': hex(sid), 'res': hex(res), 'hash': '%#010x' % ph,
                        'type': '%#x' % ty, 'shl': path, 'folder': folder, 'hitParam': info[m]['hit'][1] if info[m]['hit'] else None,
                        'hit': ints if ints is not None else None, 'hit0': h0, 'hitrec0': rec,
                        'inHitshapes': hs is not None, 'genFolder': folder == 'shell' + SEP + 'em' + SEP + mon + '_shell02'})
    json.dump({'scans': scans, 'entries': out}, open(os.path.join(HERE, 'beamreads.json'), 'w'), indent=1)
    for o in out:
        if o['list'] != 'T': continue
        print('%-12s %-19s m%-3d id %-6s res %s %-28s hitParam %-10s hit %-10s rec0 %s' % (
            o['id'], o['cls'], o['mode'], o['sid'], o['res'], o['folder'].split(SEP)[-1], (o['hitParam'] or '-').split('_')[-1],
            o['hit'], o['hitrec0']))
    bad = [o['id'] for o in out if not o['inHitshapes'] or not o['genFolder'] or o['hitrec0'] is None]
    print('entries', sum(o['list'] == 'T' for o in out), 'types +', sum(o['list'] == 'M' for o in out), 'modes; no-record / mismatch:', bad)
    print('scans', scans)

# POSITIVE CONTROLS (the same walk where the answer is already read elsewhere):
#   Neset sp_58 0x179 -> em087_00_shell58 (rom-map 0x10aa3a0 row, shells.js SHELL_DATA hit [0] per mode 0..2);
#   Basarios shell01 0x6b -> em004_00_shell01, modes 0 / 1 hit [0] / [1] (shells.js SHELL_DATA em004_00 shell01, EMC 2026-09-30)
def controls():
    for mon, sid, want in (('em087_00', 0x179, {0: [0], 1: [0], 2: [0]}), ('em004_00', 0x6b, {0: [0], 1: [1]})):
        r, res, ph, ty, path = resolve(mon, sid)
        T = shellef.load_typed(os.path.join(ARCS, mon + '.arc'))
        info = shlinfo.shell_info(T, path)
        got = {m: shlinfo.hit_ints(T, info, m) for m in want}
        print('control', mon, hex(sid), r['cls']['name'], hex(res), path, got, 'PASS' if got == want else 'FAIL')
        assert got == want

if __name__ == '__main__':
    controls()
    main()
