# p4static.py (effects lane A4, 2026-10-26): every posture-setter and P+0x5c-writer SITE in every enemy class band, static.
#   bl/b 0xbc7f4 (the posture setter) with r1 resolved backwards in the same basic run (mov r1,#imm / mov r1,rX -> rX's mov);
#   bl/b 0xbf700 (P+0x5c = s0), 0xbf71c (P+0x5c += s0 x dt), 0xbca24 (P+0x5c = 0 via posture 1), 0xbf62c (MoguriBaseOfs);
#   vstr sX,[rY,#0x5c] and str rX,[rY,#0x5c] where rY was loaded from [rZ,#0x1428] (P) earlier in the run (no intervening write);
#   strb rX,[rY,#0x1ba] with rY = P (a direct posture store outside the setter).
# Bands: efx/agents/notice-scratch/emclasses.json (per module). Also the shared text outside every band (for 0xbc7f4(4) callers).
# Output: p4static.txt.  usage: python p4static.py
import sys, struct, json, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
import numpy as np
T = armdis.TEXT
W = np.frombuffer(T[:len(T) & ~3], dtype='<u4')
CLS = json.load(open(r'C:\MHGU-Extract\efx\agents\notice-scratch\emclasses.json'))
TGT = {0xbc7f4: 'posture', 0xbc984: 'post1', 0xbf700: 'p5c_set', 0xbf71c: 'p5c_add', 0xbca24: 'bca24', 0xbf62c: 'moguri',
       0x75330: 'vt3e8_75330'}
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.detail = False

def dis(a):
    i = next(md.disasm(T[a:a + 4], a), None)
    return (i.mnemonic, i.op_str) if i else ('.word', '')

def back(a, n=24):
    out = []
    for k in range(1, n + 1):
        b = a - 4 * k
        m, o = dis(b)
        out.append((b, m, o))
        if m in ('bx', 'pop') and ('lr' in o or 'pc' in o): break
        if m == 'b' or m == 'bl' and k > 1 and False: break
    return out

def resolve_reg(a, reg, depth=0):
    """value of reg at a (immediate) by walking back; stops at a branch target-insensitive heuristic."""
    for b, m, o in back(a, 40):
        ops = [x.strip() for x in o.split(',')]
        if not ops: continue
        if m.startswith('bl') and reg in ('r0', 'r1', 'r2', 'r3'):
            return '?call@%#x' % b
        if ops[0] == reg and m.startswith(('mov', 'movw', 'mvn', 'ldr', 'add', 'sub', 'orr', 'and', 'uxtb', 'ldrb', 'ldrh', 'ldrsb', 'eor')):
            cond = m[3:] if m.startswith('mov') and len(m) > 3 and m not in ('movw', 'movs', 'movt') else ''
            if m in ('mov', 'movs', 'movw') or m.startswith('mov') and len(m) == 5:
                if ops[1].startswith('#'):
                    v = int(ops[1][1:], 0)
                    return '%d%s' % (v, ('(' + m + ')') if m not in ('mov', 'movs', 'movw') else '')
                if ops[1].startswith('r') and depth < 3:
                    return resolve_reg(b, ops[1], depth + 1) + '<-' + ops[1]
            return '%s %s' % (m, o)
    return '?'

def s0src(a):
    for b, m, o in back(a, 30):
        ops = [x.strip() for x in o.split(',')]
        if m.startswith('bl'):
            try: t = int(o.split('#')[-1], 16)
            except Exception: t = None
            if t == 0xbf62c: return 'MoguriBaseOfs(0xbf62c@%#x)' % b
            return '?call %s@%#x' % (o, b)
        if ops and ops[0] == 's0':
            if m.startswith('vldr') and 'pc' in o:
                off = int(o.split('#')[-1].rstrip(']'), 0) if '#' in o else 0
                sgn = -1 if '#-' in o else 1
                lit = b + 8 + off
                v = struct.unpack('<f', armdis.rd(lit))[0]
                return '%g (lit %#x)' % (v, lit)
            if m.startswith('vmov') and o.split(',')[1].strip().startswith('#'):
                return o.split(',')[1].strip()
            return '%s %s @%#x' % (m, o, b)
    return '?'

def _is1428(a, reg):
    for b, m, o in back(a, 12):
        if o.startswith(reg + ','):
            return m.startswith('mov') and o.endswith('#0x1428')
    return False

def preg(a, reg):
    """reg = P?  loaded from [x,#0x1428], [x, rO] / [x, rO]! with rO = 0x1428, or [rZ] with rZ = x + 0x1428
    (add #0x1428, or left by a post-indexed ldr [rZ, rO]! -- CLAUDE.md 2: track the pointer, not the offset)."""
    for b, m, o in back(a, 60):
        ops = [x.strip() for x in o.split(',')]
        if ops and ops[0] == reg and not m.startswith(('str', 'vstr', 'cmp', 'tst', 'vcmp', 'push', 'stm')):
            if '#0x1428]' in o: return True
            mm = re.match(r'r\d+, \[(r\d+), (r\d+)\]!?$', o)
            if m.startswith('ldr') and mm and _is1428(b, mm.group(2)): return True
            mm = re.match(r'r\d+, \[(r\d+)\]$', o)
            if m.startswith('ldr') and mm:
                rz = mm.group(1)
                for b2, m2, o2 in back(b, 400):
                    if m2.startswith('add') and o2.startswith(rz + ',') and o2.endswith('#0x1428'): return True
                    m3 = re.match(r'r\d+, \[' + rz + r', (r\d+)\]!$', o2)
                    if m2.startswith('ldr') and m3 and _is1428(b2, m3.group(1)): return True
            return False
        if m in ('bl', 'blx') and reg in ('r0', 'r1', 'r2', 'r3', 'r12'):
            return False
    return False

def bands():
    seen = {}
    for k, v in CLS.items():
        seen.setdefault((v['lo'], v['hi']), []).append(k)
    return sorted(seen.items())

def scan(lo, hi):
    rows = []
    i0, i1 = lo // 4, hi // 4
    w = W[i0:i1]
    # bl / b immediate
    isb = (w & 0x0E000000) == 0x0A000000
    for j in np.nonzero(isb)[0]:
        a = (i0 + j) * 4
        x = int(w[j]); imm = x & 0xFFFFFF
        if imm & 0x800000: imm -= 0x1000000
        t = (a + 8 + imm * 4) & 0xFFFFFFFF
        if t in TGT and (x >> 28) != 0xF:
            kind = TGT[t]; link = 'bl' if x & 0x01000000 else 'b'
            cond = (x >> 28)
            info = ''
            if kind in ('posture', 'post1'):
                info = 'r1=' + resolve_reg(a, 'r1')
            elif kind in ('p5c_set', 'p5c_add'):
                info = 's0=' + s0src(a)
            rows.append((a, kind, link + ('' if cond == 0xE else '.c%x' % cond), info))
    # vstr sX,[rY,#0x5c]  (cond 1101 1D00 Rn Vd 1010 imm8, U=1)
    m5 = ((w & 0x0FB00F00) == 0x0D800A00) & ((w & 0xFF) == 0x17)
    # str rX,[rY,#0x5c] (cond 0101 1000 Rn Rt 0x05c)
    m6 = (w & 0x0FF00FFF) == 0x0580005C
    # strb rX,[rY,#0x1ba]
    m7 = (w & 0x0FF00FFF) == 0x05C001BA
    for mask, kind in ((m5, 'vstr5c'), (m6, 'str5c'), (m7, 'strb1ba')):
        for j in np.nonzero(mask)[0]:
            a = (i0 + j) * 4
            m, o = dis(a)
            rn = o.split('[')[1].split(',')[0].strip()
            if rn == 'sp': continue
            if preg(a, rn):
                rows.append((a, kind, m, o))
    return sorted(rows)

if __name__ == '__main__':
    out = []
    allb = bands()
    for (lo, hi), names in allb:
        rows = scan(lo, hi)
        out.append('== %s  %#x..%#x  (%d sites)' % ('/'.join(sorted(names)), lo, hi, len(rows)))
        for a, k, l, i in rows:
            out.append('  %#x %-10s %-6s %s' % (a, k, l, i))
    # shared text (outside every band): posture(4) / p5c writers
    lo0 = min(v['lo'] for v in CLS.values())
    out.append('== SHARED 0..%#x' % lo0)
    for a, k, l, i in scan(0x10000, lo0):
        if k in ('posture',) and not i.startswith('r1=4'): continue
        out.append('  %#x %-10s %-6s %s' % (a, k, l, i))
    open(__file__.replace('.py', '.txt'), 'w').write('\n'.join(out) + '\n')
    print('\n'.join(out[:5])); print(len(out), 'lines')
