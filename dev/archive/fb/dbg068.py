import sys, json
sys.argv = ['emu_fb.py', 'dbg068.json', 'dbg068_out.json']
src = open('emu_fb.py', encoding='utf8').read().replace("if __name__ == '__main__':", "if False:")
exec(compile(src, 'emu_fb.py', 'exec'))
orig = snap
def snap2(t):
    d = orig(t); d['b'] = [r8(SHELL + 0x1644), r8(SHELL + 0x1648), r8(SHELL + 0x1054), r8(OWNER + 0x1054), r8(SHELL + 0x151e), r8(BLOCK + 0x1bb)]; return d
snap = snap2
c = json.load(open('dbg068.json'))[0]
o = run(c)
r = o['shells'][0]['run']
for fr in r['frames'][40:50]: print(fr['k'], fr['state'], fr['b'], round(fr['timer'], 2), fr['log'][:6])
