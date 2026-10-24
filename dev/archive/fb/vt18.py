# vt18.py: every shell-table class whose vt+0x18 (the unit manager's start, 0xc04598: state 1 -> 2, then the move in the same pass) is not
# the base's `bx lr` 0x4a1694
import sys
sys.argv = ['emu_fb.py']
src = open('emu_fb.py', encoding='utf8').read().replace("if __name__ == '__main__':", "if False:")
g = {}; exec(compile(src, 'emu_fb.py', 'exec'), g)
r = g['r32']; seen = {}
for sid in sorted(g['ROWS']):
    try:
        newf, toff = g['kind_of'](sid)
        g['uc'].mem_write(g['SHELL'], b'\0' * 0x1800); g['E'].call(newf, ())
        vt = r(g['SHELL']); v18 = r(vt + 0x18)
        if v18 != 0x4a1694: print(hex(sid), g['ROWS'][sid]['cls']['name'], hex(v18))
    except Exception as ex: print(hex(sid), 'ERR', ex)
