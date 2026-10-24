# scanbase.py <move-addr>... : every shell-table id whose class's vt+0x24 (move) is one of those (2026-10-18)
import sys
want = set(int(x, 0) for x in sys.argv[1:])
sys.argv = ['emu_fb.py']
src = open('emu_fb.py', encoding='utf8').read().replace("if __name__ == '__main__':", "if False:")
g = {}; exec(compile(src, 'emu_fb.py', 'exec'), g)
r = g['r32']
for sid in sorted(g['ROWS']):
    try:
        newf, toff = g['kind_of'](sid)
        g['uc'].mem_write(g['SHELL'], b'\0' * 0x1800)
        g['E'].call(newf, ())
        vt = r(g['SHELL'])
        if r(vt + 0x24) in want or r(vt + 0x13c) in want:
            print(hex(sid), g['ROWS'][sid]['cls']['name'], 'init', hex(r(vt + 0x13c)), 'move', hex(r(vt + 0x24)), 'reader', hex(r(vt + 0x14c)))
    except Exception as ex:
        pass
