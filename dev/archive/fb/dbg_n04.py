import sys, json
sys.argv = ['emu_fb.py', 'n04_case.json', 'n04_out.json']
src = open('emu_fb.py', encoding='utf8').read().replace("if __name__ == '__main__':", "if False:")
exec(compile(src, 'emu_fb.py', 'exec'))
c = json.load(open('n04_case.json'))[0]
r = run(c)
vt = r32(SHELL)
print('shells', len(r['shells']), [ (hex(s['id']), s['mode']) for s in r['shells']], 'vt', hex(vt), 'reader +0x14c', hex(r32(vt + 0x14c)), '+0x150', hex(r32(vt + 0x150)), '+0x154', hex(r32(vt+0x154)), '+0x158', hex(r32(vt+0x158)))
print(r['shells'][0]['raw'] if r['shells'] else None)
