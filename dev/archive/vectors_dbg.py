"""Record CALL VECTORS from the game's own code: for each call of a watched function during an effect
run, every byte it read (before writing it), every byte it wrote, its integer and VFP arguments, and
its return values. A translation of that function into JS is correct on those calls exactly when,
given the same inputs, it reads nothing outside them and writes the same bytes.

    python vectors.py <file.efl> <frames> <out.json> <fn hex> [fn hex ...]

Callees are part of the call (their reads and writes belong to it), so a translation can be checked
leaf-first or as a subtree. Writes below the entry stack pointer are the function's own frame and are
dropped. Vectors are deduplicated by the set of blocks executed, keeping up to MAX_PER_PATH per
distinct path and MAX_PER_FN per function.
"""
import sys, os, io, contextlib, struct, json, collections, hashlib
sys.path.insert(0, 'C:/MHGU-Extract/efx')
from unicorn import UC_HOOK_BLOCK, UC_HOOK_MEM_READ, UC_HOOK_MEM_WRITE, UC_HOOK_CODE
from unicorn.arm_const import *
from efx_load import LoadedEffect
import emu as E

MAX_PER_PATH, MAX_PER_FN = 2, 60
TEXT_END = 0x13eec18


def runs(bytemap):
    """{addr: byte} -> [[start, hex], ...] contiguous runs"""
    out = []
    for a in sorted(bytemap):
        if out and out[-1][0] + len(out[-1][1]) == a:
            out[-1][1].append(bytemap[a])
        else:
            out.append([a, bytearray([bytemap[a]])])
    return [[s, bytes(b).hex()] for s, b in out]


def record(path, frames, watch, max_per_fn=MAX_PER_FN, construction=False, after_move=None, services=None,
           before_start=None, before_move=None, start=True):
    """after_move(x): called after each frame's move with the recorder live (the draw probe uses it).
    services: {address: (name, stack_words, capture[, result])} -- engine routines stubbed as SERVICES:
    each call returns at once and is recorded on the open calls with r0..r3, its first stack_words stack
    arguments, and capture(u, args, stack) -> {label: hex} for any memory the arguments point at.
    result(u, args, stack) -> r0 (default 0) gives the stub a return value; memory it writes through
    uc.mem_write is the service's, not the watched calls', and a checker replays it from capture.
    start=False: before_start started the effect itself (proof.py: the list set through vtable +0x6c starts it)."""
    sink = io.StringIO()
    holder = {}
    stack = []
    # IMPORTS: the emulator's libc stubs (memset/memclr/memcpy) write with uc.mem_write, which no memory
    # hook sees -- so a call that copied or cleared memory through them recorded neither the bytes it
    # wrote nor the source bytes it read. Both are fed to the open calls here.
    orig_store, orig_plt = E.Emu._store, E.Emu._on_plt
    def store_seen(self, addr, data):
        orig_store(self, addr, data)
        for fr in stack:
            for i, b in enumerate(data):
                fr['written'].add(addr + i)
                fr['writes'][addr + i] = b
    def plt_seen(self, u, addr, size, ud):
        name = E.PLT.get(addr)
        if stack and name in ('memcpy', 'memmove', '__memcpy_chk', '__memmove_chk', '__aeabi_memcpy',
                              '__aeabi_memcpy4', '__aeabi_memcpy8', '__aeabi_memmove', '__aeabi_memmove4',
                              '__aeabi_memmove8'):
            src, n = u.reg_read(UC_ARM_REG_R1), u.reg_read(UC_ARM_REG_R2)
            cur = bytes(u.mem_read(src, n))
            for fr in stack:
                r, w = fr['reads'], fr['written']
                for i in range(n):
                    if src + i not in w and src + i not in r:
                        r[src + i] = cur[i]
        if stack and name is not None:
            for fr in stack:
                fr.setdefault('imports', []).append([name, [u.reg_read(x) for x in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2)]])
        return orig_plt(self, u, addr, size, ud)
    E.Emu._store, E.Emu._on_plt = store_seen, plt_seen
    if construction:
        import efx_emu
        efx_emu.EARLY_HOOKS[:] = [lambda emu: holder.setdefault('emu', emu)]
    uc = None
    watch = set(watch)
    kept = collections.defaultdict(list)
    seen = collections.Counter()
    total = collections.Counter()
    frame_no = [-1]

    def on_block(u, addr, size, ud):
        sp = u.reg_read(UC_ARM_REG_SP)
        while stack and addr == stack[-1]['lr'] and sp == stack[-1]['sp']:
            finish(u, stack.pop())
        for fr in stack:
            fr['blocks'].add(addr)
        if addr in (0x329c40, 0x329874, 0x327e7c, 0x329908, 0x44ab0):
            print('BLK %#x sp %#x lr %#x depth %d top %s' % (addr, sp, u.reg_read(UC_ARM_REG_LR), len(stack), stack and ('%#x/%#x/%#x' % (stack[-1]['fn'], stack[-1]['lr'], stack[-1]['sp']))), file=sys.stderr, flush=True)
        if addr in watch:
            # 64-bit registers are split into 32-bit halves: JSON numbers above 2**53 are rounded by
            # JavaScript's parser, which corrupted the low (s-register) half of any d with a high half.
            vfp = [[d & 0xFFFFFFFF, d >> 32] for d in (u.reg_read(r) for r in (
                UC_ARM_REG_D0, UC_ARM_REG_D1, UC_ARM_REG_D2, UC_ARM_REG_D3,
                UC_ARM_REG_D4, UC_ARM_REG_D5, UC_ARM_REG_D6, UC_ARM_REG_D7))]
            stack.append({'fn': addr, 'sp': sp, 'lr': u.reg_read(UC_ARM_REG_LR),
                          'args': [u.reg_read(r) for r in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)],
                          'd': vfp, 'reads': {}, 'written': set(), 'writes': {}, 'blocks': {addr},
                          'frame': frame_no[0]})

    def finish(u, fr):
        fn = fr['fn']
        if fn in (0x329c40, 0x329874, 0x327e7c, 0x44ab0):
            print('FIN %#x' % fn, file=sys.stderr, flush=True)
        total[fn] += 1
        key = (fn, hashlib.md5(repr(sorted(fr['blocks'])).encode()).hexdigest())
        seen[key] += 1
        if seen[key] > MAX_PER_PATH or len(kept[fn]) >= max_per_fn:
            return
        writes = {a: v for a, v in fr['writes'].items()
                  if not (E.STACK_LO <= a < fr['sp'])}
        reads = {a: v for a, v in fr['reads'].items() if a >= TEXT_END}   # .text reads are literal pools
        kept[fn].append({
            'frame': fr['frame'], 'sp': fr['sp'], 'args': fr['args'], 'd': fr['d'],
            'ret': {'r0': u.reg_read(UC_ARM_REG_R0), 'r1': u.reg_read(UC_ARM_REG_R1),
                    'd0': [u.reg_read(UC_ARM_REG_D0) & 0xFFFFFFFF, u.reg_read(UC_ARM_REG_D0) >> 32]},
            'path': key[1][:12], 'nblocks': len(fr['blocks']), 'blocks': sorted(fr['blocks']),
            'reads': runs(reads), 'writes': runs(writes), 'services': fr.get('services', []),
            'imports': fr.get('imports', [])})

    def on_read(u, acc, addr, size, val, ud):
        if not stack:
            return
        cur = bytes(u.mem_read(addr, size))
        for fr in stack:
            r, w = fr['reads'], fr['written']
            for i in range(size):
                b = addr + i
                if b not in w and b not in r:
                    r[b] = cur[i]

    def on_write(u, acc, addr, size, val, ud):
        if not stack:
            return
        data = (val & ((1 << (8 * size)) - 1)).to_bytes(size, 'little')
        for fr in stack:
            for i in range(size):
                fr['written'].add(addr + i)
                fr['writes'][addr + i] = data[i]

    def install(u):
        u.hook_add(UC_HOOK_BLOCK, on_block)
        u.hook_add(UC_HOOK_MEM_READ, on_read)
        u.hook_add(UC_HOOK_MEM_WRITE, on_write)
    import efx_emu, efx_load
    # SERVICES: the harness stubs the ROM calls out to (allocator, unique id, resource manager, file
    # stream). Their results are recorded on every open call, in order, so a checker can replay them.
    def service(kind, orig, result):
        def wrapped(self):
            u = self.e.uc
            args = [u.reg_read(r) for r in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)]
            orig(self)
            out = result(self, u, args)
            for fr in stack:
                fr.setdefault('services', []).append([kind, args, out])
        return wrapped
    patched = [
        (efx_emu.EfxEmu, '_alloc', lambda self, u, a: u.reg_read(UC_ARM_REG_R0)),
        (efx_emu.EfxEmu, '_next_id', lambda self, u, a: u.reg_read(UC_ARM_REG_R0)),
        (efx_load.LoadedEffect, '_res_load', lambda self, u, a: [u.reg_read(UC_ARM_REG_R0), self.loaded[-1][1]]),
        (efx_load.LoadedEffect, '_stream_size', lambda self, u, a: u.reg_read(UC_ARM_REG_R0)),
        (efx_load.LoadedEffect, '_stream_read', lambda self, u, a: [u.reg_read(UC_ARM_REG_R0),
                                                                    bytes(u.mem_read(a[1], min(a[2], 1 << 20))).hex()]),
    ]
    saved = [(cls, name, getattr(cls, name)) for cls, name, _ in patched]
    for cls, name, res in patched:
        setattr(cls, name, service(name.lstrip('_'), getattr(cls, name), res))
    orig_call = efx_emu.EfxEmu.call
    def call_and_close(self, addr, args, label):
        r = orig_call(self, addr, args, label)
        u = self.e.uc
        if addr == 0x329c40:
            print('AFTERSTOP depth %d top %s' % (len(stack), [('%#x' % f['fn'], '%#x' % f['lr']) for f in stack[-4:]]), file=sys.stderr, flush=True)
        while stack and stack[-1]['lr'] == E.RET:            # returned to the harness sentinel
            finish(u, stack.pop())
        return r
    efx_emu.EfxEmu.call = call_and_close
    if construction:
        efx_emu.EARLY_HOOKS[:] = [lambda emu: install(emu.e.uc)]
        with contextlib.redirect_stdout(sink):
            frame_no[0] = -2
            x = LoadedEffect(path)
        efx_emu.EARLY_HOOKS[:] = []
    else:
        # built after the service patches, so the allocator and resource stubs it registers are the
        # recording ones: a draw that allocates (0xbad790's sort buffer) records the allocation
        with contextlib.redirect_stdout(sink):
            x = LoadedEffect(path)
        install(x.e.uc)
    # the services are hooked before before_start: a start that builds objects (vecproofunit.py) calls them
    for addr, spec in (services or {}).items():
        name, nstack, capture = spec[:3]
        result = spec[3] if len(spec) > 3 else None
        def stubbed(u, a, sz, ud, name=name, nstack=nstack, capture=capture, result=result):
            args = [u.reg_read(r) for r in (UC_ARM_REG_R0, UC_ARM_REG_R1, UC_ARM_REG_R2, UC_ARM_REG_R3)]
            sp = u.reg_read(UC_ARM_REG_SP)
            st = list(struct.unpack('<%dI' % nstack, bytes(u.mem_read(sp, 4 * nstack)))) if nstack else []
            d0 = u.reg_read(UC_ARM_REG_D0)
            cap = capture(u, args, st) if capture else {}
            r0 = result(u, args, st) & 0xFFFFFFFF if result else 0
            rec = [name, args, [st, [d0 & 0xFFFFFFFF, d0 >> 32], cap], r0]
            for fr in stack:
                fr.setdefault('services', []).append(rec)
            u.reg_write(UC_ARM_REG_R0, r0)
            u.reg_write(UC_ARM_REG_PC, u.reg_read(UC_ARM_REG_LR))
        x.e.uc.hook_add(UC_HOOK_CODE, stubbed, begin=addr, end=addr)
    if before_start:                                         # e.g. a parent unit for the effect (vecparent.py)
        before_start(x)
    with contextlib.redirect_stdout(sink):
        frame_no[0] = -1
        if start:
            x.start()
        stack.clear()
        for f in range(frames):
            frame_no[0] = f
            if before_move:
                before_move(x, f)
            x.call(0x9b6130, (x.OW,), 'move')
            stack.clear()
            if after_move:
                after_move(x)
                stack.clear()
    efx_emu.EfxEmu.call = orig_call
    for cls, name, fn in saved:
        setattr(cls, name, fn)
    E.Emu._store, E.Emu._on_plt = orig_store, orig_plt
    return kept, total


if __name__ == '__main__':
    path, frames, dest = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    fns = [int(a, 16) for a in sys.argv[4:]]
    kept, total = record(path, frames, fns)
    out = {'file': os.path.basename(path), 'frames': frames,
           'functions': {'%#x' % fn: {'calls': total[fn], 'vectors': kept[fn]} for fn in fns}}
    json.dump(out, open(dest, 'w'), separators=(',', ':'))
    for fn in fns:
        paths = len({v['path'] for v in kept[fn]})
        print('%#x: %d calls, %d vectors kept over %d distinct paths' % (fn, total[fn], len(kept[fn]), paths))
