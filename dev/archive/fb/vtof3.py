# vtof3.py <sid>..: the shell class's vtable (constructed in emu_fb) -- the slots the bases use, and its toff
import sys
sids = [int(x, 0) for x in sys.argv[1:]]
sys.argv = ['emu_fb.py']
src = open('emu_fb.py', encoding='utf8').read().replace("if __name__ == '__main__':", "if False:")
g = {}; exec(compile(src, 'emu_fb.py', 'exec'), g)
r = g['r32']
for sid in sids:
    newf, toff = g['kind_of'](sid)
    g['uc'].mem_write(g['SHELL'], b'\0' * 0x1800); g['E'].call(newf, ())
    vt = r(g['SHELL'])
    print(hex(sid), g['ROWS'][sid]['cls']['name'], 'vt', hex(vt), 'new', hex(newf), 'toff', toff)
    print('  ' + ' '.join('+%#x:%#x' % (k, r(vt + k)) for k in range(0, 0x170, 4)))
