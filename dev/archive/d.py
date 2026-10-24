"""Quick disassembler: python d.py START [END|nWORDS]  (stops at nothing; prints pc-rel ldr values and add-pc addresses)."""
import sys, struct, capstone
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(EX + r'\main.text', 'rb').read()
RODATA = open(EX + r'\main.rodata', 'rb').read()
DATA = open(EX + r'\main.data', 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000

def u32(va):
    if 0 <= va <= len(TEXT) - 4: return struct.unpack_from('<I', TEXT, va)[0]
    if RO_VA <= va <= RO_VA + len(RODATA) - 4: return struct.unpack_from('<I', RODATA, va - RO_VA)[0]
    if DA_VA <= va <= DA_VA + len(DATA) - 4: return struct.unpack_from('<I', DATA, va - DA_VA)[0]
    return None

def cstr(va, n=80):
    if RO_VA <= va < RO_VA + len(RODATA):
        s = RODATA[va - RO_VA: va - RO_VA + n].split(b'\0')[0]
        if len(s) >= 2 and all(0x20 <= c < 0x7f for c in s): return s.decode('latin1')
    return None

md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)

def dis(lo, hi):
    out = []
    va = lo
    lits = {}
    while va < hi:
        w = TEXT[va:va + 4]
        ins = next(md.disasm(w, va), None)
        if ins is None:
            out.append('%08x: .word 0x%08x' % (va, struct.unpack('<I', w)[0])); va += 4; continue
        note = ''
        o = ins.op_str
        if ins.mnemonic.startswith('ldr') and '[pc, #' in o and o.endswith(']'):
            imm = int(o.split('#')[1].rstrip(']'), 0)
            lv = u32(va + 8 + imm)
            rd = o.split(',')[0]
            lits[rd] = lv
            note = ' ; =0x%x' % (lv if lv is not None else -1)
        elif ins.mnemonic.startswith('add') and ', pc, ' in o:
            p = [x.strip() for x in o.split(',')]
            if p[2] in lits and lits[p[2]] is not None:
                a = (va + 8 + lits[p[2]]) & 0xffffffff
                s = cstr(a)
                note = ' ; -> 0x%x%s (=[0x%x])' % (a, (' "%s"' % s) if s else '', u32(a) or 0)
        elif ins.mnemonic.startswith('ldr') and ', pc]' in o:
            pass
        out.append('%08x: %-8s %s%s' % (va, ins.mnemonic, o, note))
        va += 4
    return out

if __name__ == '__main__':
    lo = int(sys.argv[1], 16)
    hi = int(sys.argv[2], 16) if len(sys.argv) > 2 else lo + 0x100
    if hi < lo: hi = lo + hi * 4
    print('\n'.join(dis(lo, hi)))
