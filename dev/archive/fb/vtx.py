import sys
ids = [int(x, 0) for x in sys.argv[1:]]
sys.argv = ['emu_fb.py']
src = open('emu_fb.py', encoding='utf8').read().replace("if __name__ == '__main__':", "if False:")
g = {}; exec(compile(src, 'emu_fb.py', 'exec'), g)
for sid in ids:
    newf, toff = g['kind_of'](sid)
    g['uc'].mem_write(g['SHELL'], b'\0' * 0x1800)
    g['E'].call(newf, ())
    vt = g['r32'](g['SHELL']); r = g['r32']
    print(hex(sid), g['ROWS'][sid]['cls']['name'], 'vt', hex(vt), 'init', hex(r(vt + 0x13c)), 'move', hex(r(vt + 0x24)), 'reader', hex(r(vt + 0x14c)),
          ' '.join('%x:%x' % (o, r(vt + o)) for o in range(0x148, 0x174, 4)))
