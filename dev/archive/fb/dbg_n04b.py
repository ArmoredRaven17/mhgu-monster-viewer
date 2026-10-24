import sys, json
sys.argv = ['emu_fb.py', 'n04_case.json', 'n04_out.json']
src = open('emu_fb.py', encoding='utf8').read().replace("if __name__ == '__main__':", "if False:")
exec(compile(src, 'emu_fb.py', 'exec'))
seen = {}
def tr(u, a, s, d): seen[a] = seen.get(a, 0) + 1
for a in (0x10a5740, 0x10a5680, 0x10b0784, 0x10b095c, 0x10b0e04, 0x10abc08, 0x10b0e98, 0x48b884, 0x10a57c0):
    uc.hook_add(UC_HOOK_CODE, tr, begin=a, end=a)
c = json.load(open('n04_case.json'))[0]
r = run(c)
print(len(r['shells']), {hex(k): v for k, v in sorted(seen.items())})
