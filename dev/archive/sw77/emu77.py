"""Seregios (em077_00) shell 0x13c (uShellEm077_sp_01 : base01) on the ROM: the whole executable after its static
initialisers (emu37.py's machine and hooks), the getters answered with em077_00.arc's shell01 files. The setup is the
frame handler 0xfddfcc's own (0x3fa2bc(0x40): +4 0x13c, +8 mode, +0xc the owner, +0x10.. P+0x40.., +0x1c 0, +0x20.. the zero
vector, +0x2c 0, +0x30.. P+0x50 / +0x54 / +0x58 (whole words), +0x3c 0xffff; READ 0xfde1e0..0xfde26c); then the sp_01 ctor
0xfeeb78 (-> base01 0x3fa2f8), init 0x3fa498 (its reader 0xfeeb98 runs for real), move 0x3faec4 every frame. The owner block
the base01 0x80 arm reads: P+0x40 / +0x44 / +0x48, ground P+0x5b4, facing P+0x54, size P+0x1ac x P+0x1b0, base scale
[[e+0x75e8]+0x64]. No hit registration (0x4a1ad8 -> 0): a timer-0 shell ends at its first move.
Usage: python emu77.py cases.json out.json"""
import sys, os, struct, json
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\sw37')
import emu37 as H
import shellef

H.FILES = shellef.load(r'C:\MHGU-Extract\scratch-em\em077_00\em077_00.arc')
for m in range(2):
    sh = H.fup('em077_00_01_sh%03d' % m)
    H.SH[('77', m)] = {'sh': sh, 'hit': H.fup('em077_00_01_hit%03d' % m), 'ef': H.efp('em077_00_01_ef%03d' % m)}
H.KINDS['77'] = (0xfeeb78, 0x3fa498, 0x3faec4, 0x1614)
BASEBLK = H.S + 0x9f800

def run(c):
    H.owner_setup(c)
    oX, oY, oZ = c['owner']
    H.wf(H.BLOCK + 0x5b4, c['ground'])
    H.wf(H.BLOCK + 0x1ac, c['size'][0]); H.wf(H.BLOCK + 0x1b0, c['size'][1])
    H.uc.mem_write(BASEBLK, bytes(0x80)); H.wf(BASEBLK + 0x64, c['base'])
    H.w32(H.OWNER + 0x75e8, BASEBLK)
    raw = struct.pack('<4I', 0x174e638 + 8, 0x13c, c['mode'], H.OWNER) + struct.pack('<3f', *c['ownerPos']) + \
          struct.pack('<I', 0) + struct.pack('<3f', 0, 0, 0) + struct.pack('<I', 0) + struct.pack('<3I', oX, oY, oZ) + \
          struct.pack('<I', 0xffff)
    o = H.fly('77', raw, c.get('frames', 20), None)
    o['setup'] = raw.hex()
    o['flags'] = H.r32(H.SHELL + 0x15ec)
    o['ef'] = [H.r32(H.SHELL + 0x15c8), H.r32(H.SHELL + 0x15cc)]
    return o

if __name__ == '__main__':
    cases = json.load(open(sys.argv[1]))
    json.dump({c['name']: run(c) for c in cases}, open(sys.argv[2], 'w'))
    print(len(cases), 'cases')
