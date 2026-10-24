# every shell whose vtable init (+0x13c) or step (+0x158) is the given address
import sys, json
sys.argv = ['x'] + sys.argv[1:]
want = [int(x, 0) for x in sys.argv[1:]]
sys.argv = ['x']
import emu_fb as E
for sid in sorted(E.ROWS):
    try:
        newf, _ = E.kind_of(sid)
        E.uc.mem_write(E.SHELL, b'\0' * 0x1800)
        E.E.call(newf, ())
        if E.E.fault: continue
        vt = E.r32(E.SHELL)
        if E.r32(vt + 0x13c) in want or E.r32(vt + 0x158) in want or E.r32(vt + 0x24) in want: print(hex(sid), E.ROWS[sid]['cls']['name'], hex(E.r32(vt + 0x13c)), hex(E.r32(vt + 0x24)))
    except Exception as ex:
        pass
