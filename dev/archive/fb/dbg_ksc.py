import sys, json
sys.argv = ['emu_fb.py', 'ksc_case.json', 'ksc_out.json']
src = open('emu_fb.py', encoding='utf8').read().replace("if __name__ == '__main__':", "if False:")
exec(compile(src, 'emu_fb.py', 'exec'))
from unicorn.arm_const import UC_ARM_REG_PC, UC_ARM_REG_R6, UC_ARM_REG_R7
trail = []
def tr(u, a, s, d):
    trail.append(a)
    if len(trail) > 60: trail.pop(0)
uc.hook_add(UC_HOOK_CODE, tr, begin=0xfae824, end=0xfaf300)
c = json.load(open('ksc_case.json'))[0]
try: run(c)
except AssertionError as e: print('fault', e)
print([hex(a) for a in trail[-40:]])
