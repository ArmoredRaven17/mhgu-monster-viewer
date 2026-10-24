import sys, json, struct
sys.argv = ['emu_fb.py', 'ksc_case.json', 'ksc_out.json']
src = open('emu_fb.py', encoding='utf8').read().replace("if __name__ == '__main__':", "if False:")
exec(compile(src, 'emu_fb.py', 'exec'))
seen = {}
def tr(u, a, s, d): seen[a] = seen.get(a, 0) + 1
for a in (0xfaeeb8, 0xfaeee0, 0xfaef7c, 0xfaf014, 0xfaf064, 0xfaf070, 0xfaf08c, 0xfaf148, 0xfaf14c, 0xfaf16c, 0xfaf188, 0xfaee88, 0xfaf200):
    uc.hook_add(UC_HOOK_CODE, tr, begin=a, end=a)
c = json.load(open('ksc_case.json'))[0]
r = run(c)
print(len(r['shells']), {hex(k): v for k, v in sorted(seen.items())})
print('d4', r8(CTL + 0xd4), 'f8', struct.unpack('<f', bytes(uc.mem_read(CTL + 0xf8, 4)))[0], 'f4', struct.unpack('<f', bytes(uc.mem_read(CTL + 0xf4, 4)))[0], 'f2', r8(CTL + 0xf2))
