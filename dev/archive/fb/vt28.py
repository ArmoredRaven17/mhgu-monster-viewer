import sys, collections
sys.argv = ['x']
import emu_fb as E
cnt = collections.Counter(); ex = {}
for sid in sorted(E.ROWS):
    try:
        newf, _ = E.kind_of(sid)
        E.uc.mem_write(E.SHELL, b'\0' * 0x1800)
        E.E.call(newf, ())
        vt = E.r32(E.SHELL)
        v = E.r32(vt + 0x28)
        cnt[v] += 1; ex.setdefault(v, []).append(hex(sid))
    except Exception as e:
        pass
for v, n in cnt.most_common(): print(hex(v), n, ex[v][:6])
