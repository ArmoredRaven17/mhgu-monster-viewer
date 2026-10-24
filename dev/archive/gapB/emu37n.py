"""gapB (2026-10-20): Nargacuga's (em037_00, 0xc9) and Silverwind's (em037_04, 0xcb) shell01 MODE 1 on the ROM -- sw37/emu37.py's
machine (the whole executable after its static initialisers, the getters answered with the arc's files), the setup the frame handler
0xe47b0c builds (READ 0xe47e7c..0xe47f08 / 0xe48308..0xe48390 / 0xe47cd4..0xe47d60 + the shared tail 0xe48394..0xe483c4):
  +0 0x174e638 + 8, +4 [e+0xcc98], +8 1, +0xc the owner, +0x10.. (e+0x40, e+0x10f0, e+0x48), +0x1c 0, +0x20.. [[0x1831a78]]
  (0x19176b0), +0x2c 0, +0x30.. [[0x18321b0]] = 0x1620e60 (the zero vector), +0x3c 0xffff
then the sp_01 ctor 0xe597c4 (-> base01 0x3fa2f8), init 0x3fa498 (the reader 0xe597e4 runs for real), move 0x3faec4 each frame.
The owner block the base01 0x80 arm reads: BLOCK+0x40 / +0x44 / +0x48, ground BLOCK+0x5b4, facing BLOCK+0x54, size BLOCK+0x1ac x
+0x1b0, base scale [[e+0x75e8]+0x64]. No hit registration (0x4a1ad8 -> 0): a timer-0 shell ends at its first move.
Usage: python emu37n.py cases.json out.json"""
import sys, os, struct, json
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\sw37')
import emu37 as H
import shellef

TABLES = {}
for mon in ('em037_00', 'em037_04'):
    H.FILES = shellef.load(r'C:\MHGU-Extract\scratch-em\%s\%s.arc' % (mon, mon))
    T = {}
    for m in range(2):
        T[('01', m)] = {'sh': H.fup('%s_01_sh%03d' % (mon, m)), 'hit': H.fup('%s_01_hit%03d' % (mon, m)), 'ef': H.efp('%s_01_ef%03d' % (mon, m))}
    TABLES[mon] = T
BASEBLK = H.S + 0x9f800

def run(c):
    H.SH.clear(); H.SH.update(TABLES[c['mon']])
    H.owner_setup(c)
    H.w8(H.OWNER + 0xb5f5, 4 if c['mon'] == 'em037_04' else 0)
    sid = 0xcb if c['mon'] == 'em037_04' else 0xc9
    H.w32(H.OWNER + 0xcc98, sid)
    oX, oY, oZ = c['owner']
    H.wf(H.BLOCK + 0x5b4, c['ground'])
    H.wf(H.BLOCK + 0x1ac, c['size'][0]); H.wf(H.BLOCK + 0x1b0, c['size'][1])
    H.uc.mem_write(BASEBLK, bytes(0x80)); H.wf(BASEBLK + 0x64, c['base'])
    H.w32(H.OWNER + 0x75e8, BASEBLK)
    # +0x10.. = (e+0x40, e+0x10f0, e+0x48): owner_setup writes ownerPos to e+0x40 too; e+0x10f0 is the case's `u10f0`
    raw = struct.pack('<4I', 0x174e638 + 8, sid, 1, H.OWNER) + struct.pack('<3f', c['ownerPos'][0], c['u10f0'], c['ownerPos'][2]) + \
          struct.pack('<I', 0) + struct.pack('<3f', 0, 0, 0) + struct.pack('<I', 0) + struct.pack('<3I', 0, 0, 0) + \
          struct.pack('<I', 0xffff)
    o = H.fly('01', raw, c.get('frames', 8), None)
    o['setup'] = raw.hex()
    o['flags'] = H.r32(H.SHELL + 0x15ec)
    o['ef'] = [H.r32(H.SHELL + 0x15c8), H.r32(H.SHELL + 0x15cc)]
    o['hitIdx'] = H.r32(H.SHELL + 0x15d8)
    return o

if __name__ == '__main__':
    cases = json.load(open(sys.argv[1]))
    json.dump({c['name']: run(c) for c in cases}, open(sys.argv[2], 'w'))
    print(len(cases), 'cases')
