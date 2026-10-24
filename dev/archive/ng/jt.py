"""Action dispatch map: python jt.py <action-main addr> [status ...]
For the action main (switch on e+0x73e0) and each status handler (switch on e+0x73e1), find the first PIC jump table
(`cmp rN,#K / bhi / lsl / add rX,pc,#4 / ldr / add pc`), with an optional `sub rN,rN,#b` bias before the cmp, and print
number -> target. Read-only."""
import sys, struct, capstone
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True


def table(fn, limit=0x200):
    ins = list(md.disasm(T[fn:fn + limit], fn))
    bias, cnt = 0, None
    for k, i in enumerate(ins):
        if i.mnemonic == 'sub' and i.op_str.count('#') == 1 and cnt is None:
            try: bias = int(i.op_str.split('#')[1], 0)
            except ValueError: pass
        if i.mnemonic == 'cmp' and '#' in i.op_str:
            cnt = int(i.op_str.split('#')[1], 0)
        if i.mnemonic == 'add' and i.op_str.endswith('pc, #4'):
            base = i.address + 12
            out = {}
            for n in range(cnt + 1):
                o = struct.unpack_from('<i', T, base + 4 * n)[0]
                out[n + bias] = base + o
            return out
        if i.mnemonic in ('pop', 'bx') and k > 40: break
    return None


def follow(a):
    """a stub `mov r0,r4 / pop {r4,lr} / b X` -> X"""
    for i in md.disasm(T[a:a + 16], a):
        if i.mnemonic == 'b' and i.op_str.startswith('#'): return int(i.op_str[1:], 16)
        if i.mnemonic.startswith('b') or i.mnemonic == 'pop' and 'pc' in i.op_str: break
    return a


if __name__ == '__main__':
    am = int(sys.argv[1], 16)
    st = table(am)
    want = [int(x, 0) for x in sys.argv[2:]] or sorted(st)
    for s in want:
        h = follow(st[s])
        sub = table(h)
        if not sub:
            print('status %#x -> %#x (no table)' % (s, h)); continue
        print('status %#x -> %#x' % (s, h))
        for n, t in sorted(sub.items()):
            print('   (%#x, %#x) -> %#x' % (s, n, t))
