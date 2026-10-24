p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\emu_fb.py'
s = open(p, encoding='utf8').read()
# 1. the ground probe 0x49a90(e, &p, null, byte, [sp] &hit, [sp+4] 0, [sp+8] mask, [sp+0xc] &result): straight down from p (0x180fd4
#    with no second point) onto the floor plane; the result's attribute byte +8 = 0x10 (the plane's: no record)
a = "hook(0x183664, ray)"
b = """hook(0x183664, ray)
def probe49():
    Fp = [rf(uc.reg_read(UC_ARM_REG_R1) + 4 * i) for i in range(3)]
    sp = uc.reg_read(UC_ARM_REG_SP)
    hb, res = r32(sp), r32(sp + 0xc)
    Y = FLOOR_Y[0]
    hit = Fp[1] >= Y
    LOG.append(['probe', Fp, hit])
    if hb: w8(hb, 1 if hit else 0)
    if res and hit:
        uc.mem_write(res, b'\\0' * 0x20); w8(res + 8, 0x10)
    set_s0(Y if hit else 0.0)
    ret(1 if hit else 0)
hook(0x49a90, probe49)"""
assert s.count(a) == 1; s = s.replace(a, b)
# 2. hit slot 0 kept on (byte +0x13ad) before each move of a case's top-level shells (`slot0`): the base00 shells whose life is it
a = """        tr = TRACK.get(k)
        if tr is not None:"""
b = """        if ANS.get('slot0') and DEPTH[0] == 0: w8(SHELL + 0x13ad, 1)
        tr = TRACK.get(k)
        if tr is not None:"""
assert s.count(a) == 1; s = s.replace(a, b)
a = """def fly_tree(sid, raw, frames, depth=0, b1654=0):
    # the shell's own state lives at SHELL: a child is flown after its parent's whole run (the parent's snapshots are taken)
    o = fly(sid, raw, frames, b1654)"""
b = """DEPTH = [0]
def fly_tree(sid, raw, frames, depth=0, b1654=0):
    # the shell's own state lives at SHELL: a child is flown after its parent's whole run (the parent's snapshots are taken)
    DEPTH[0] = depth
    o = fly(sid, raw, frames, b1654)"""
assert s.count(a) == 1; s = s.replace(a, b)
a = "    owner_setup(c)\n    set_joints(c['joints'])"
b = "    owner_setup(c)\n    ANS['slot0'] = bool(c.get('slot0'))\n    set_joints(c['joints'])"
assert s.count(a) == 1; s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
print('ok')
