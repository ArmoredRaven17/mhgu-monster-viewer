"""Static call closure of one or more functions by recursive descent (direct bl / b / blx #imm only), then list every
instruction in the closure carrying one of the given immediates.
   python closure.py <imm,imm> <fn hex> [fn hex ...] [--depth N] [--show]
Each function is walked from its entry following fallthrough and every direct branch; a branch whose target is a
function START (a push {.., lr} there, or a target already known as a bl target) is treated as a tail call. Stops a
path at pop {.., pc}, bx lr, ldm .. pc. Reports indirect calls (blx rX, ldr pc / add pc jump tables) unresolved."""
import sys, struct, re, capstone
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
args = [a for a in sys.argv[1:] if not a.startswith('--')]
want = [int(x, 16) for x in args[0].split(',')]
roots = [int(x, 16) for x in args[1:]]
depth = int(sys.argv[sys.argv.index('--depth') + 1]) if '--depth' in sys.argv else 99
show = '--show' in sys.argv
if '--depth' in sys.argv:
    roots = [r for r in roots if r != depth]


def ins_at(a):
    for i in md.disasm(T[a:a + 4], a):
        return i
    return None


def is_push_lr(a):
    w = struct.unpack_from('<I', T, a)[0]
    return (w & 0xFFFF0000) == 0xE92D0000 and (w & 0x4000)


funcs, todo, indirect, hits, order = {}, [(r, 0) for r in roots], [], [], []
while todo:
    f, d = todo.pop()
    if f in funcs or f >= len(T):
        continue
    funcs[f] = d
    order.append(f)
    seen, stack = set(), [f]
    while stack:
        a = stack.pop()
        while a not in seen and a < len(T):
            seen.add(a)
            i = ins_at(a)
            if i is None:
                break
            m, o = i.mnemonic, i.op_str
            for x in re.findall(r'#(-?0x[0-9a-f]+|-?\d+)', o):
                if (int(x, 0) & 0xffffffff) in want:
                    hits.append((f, a, m, o))
            cond = not m.startswith(('b', 'pop', 'ldm')) or len(m) > 1 and m[-2:] in (
                'eq', 'ne', 'hs', 'lo', 'mi', 'pl', 'vs', 'vc', 'hi', 'ls', 'ge', 'lt', 'gt', 'le', 'cs', 'cc')
            base = m[:-2] if m[-2:] in ('eq', 'ne', 'hs', 'lo', 'mi', 'pl', 'vs', 'vc', 'hi', 'ls', 'ge', 'lt', 'gt', 'le',
                                        'cs', 'cc') and m not in ('bl', 'b') else m
            if base in ('bl', 'blx') and o.startswith('#'):
                t = int(o[1:], 16)
                if d < depth:
                    todo.append((t, d + 1))
            elif base == 'blx' or (base == 'bx' and o != 'lr'):
                indirect.append((f, a, m, o))
            elif base == 'b' and o.startswith('#'):
                t = int(o[1:], 16)
                if is_push_lr(t) or t in funcs:
                    if d < depth:
                        todo.append((t, d + 1))
                    if m == 'b':
                        break
                else:
                    stack.append(t)
                    if m == 'b':
                        break
            elif base == 'bx' and o == 'lr':
                if m == 'bx':
                    break
            elif (base == 'pop' or base.startswith('ldm')) and 'pc' in o:
                if base == m:
                    break
            elif ('pc' in o.split(',')[0]) and base in ('ldr', 'add', 'mov'):
                indirect.append((f, a, m, o))
                if base == m:
                    break
            a += 4
print('closure: %d functions from %s' % (len(funcs), ' '.join('%#x' % r for r in roots)))
if show:
    print(' '.join('%#x' % f for f in order))
print('hits for %s:' % ','.join('%#x' % w for w in want))
for f, a, m, o in hits:
    print('  fn %#x  %#x  %s %s' % (f, a, m, o))
print('indirect transfers: %d' % len(indirect))
for f, a, m, o in indirect[:60]:
    print('  fn %#x  %#x  %s %s' % (f, a, m, o))
