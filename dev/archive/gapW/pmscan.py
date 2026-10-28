# pmscan.py: Alatreon's band (0xec4890..0xed0834), word by word: every posture setter call (0xbc7f4(e, r1) posture r1; 0xbc984(e, s0)
# posture 1 with the lift) and every setMotion (0xafce8 / 0xafe84 / 0xafef0 / 0xafe8c, r1 = the motion id) with the r1 immediate found in
# the 12 instructions before (mov / movw r1), grouped by function (a `push {... lr}` starts one). Motion id = (list << 8) | slot.
import struct, sys, json
import capstone
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
LO, HI = 0xec4890, 0xed0834
POST = {0xbc7f4: 'posture', 0xbc984: 'posture1'}
MOT = {0xafce8, 0xafe84, 0xafef0, 0xafe8c}
def dec(a):
    return next(md.disasm(T[a:a + 4], a), None)
def r1_before(a):
    v = None
    for b in range(a - 48, a, 4):
        i = dec(b)
        if not i: continue
        if i.mnemonic in ('mov', 'movw') and i.op_str.startswith('r1, #'):
            try: v = int(i.op_str[5:], 0)
            except ValueError: pass
        elif i.op_str.startswith('r1,') and i.mnemonic not in ('cmp', 'tst', 'str', 'strb', 'strh', 'vstr'): v = None if i.mnemonic not in ('mov', 'movw') else v
    return v
funcs = []; cur = None
for a in range(LO, HI, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w & 0xffff4000) == 0xe92d4000:            # push {..., lr}
        cur = {'start': a, 'ev': []}; funcs.append(cur)
    if cur is None: continue
    if (w >> 25) & 7 == 5 and (w >> 28) != 0xf:
        off = w & 0xffffff
        if off & 0x800000: off -= 0x1000000
        t = a + 8 + off * 4
        if t in POST:
            cur['ev'].append([hex(a), POST[t], 1 if t == 0xbc984 else r1_before(a)])
        elif t in MOT:
            m = r1_before(a)
            cur['ev'].append([hex(a), 'motion', None if m is None else 'L%d M%d' % (m >> 8, m & 0xff)])
out = [f for f in funcs if f['ev'] and any(e[1] != 'motion' for e in f['ev'])]
for f in out:
    print(hex(f['start']), ' '.join('%s:%s=%s' % (e[0][-5:], e[1][0], e[2]) for e in f['ev']))
json.dump(funcs, open(sys.argv[1] if len(sys.argv) > 1 else 'pmscan.json', 'w'))
