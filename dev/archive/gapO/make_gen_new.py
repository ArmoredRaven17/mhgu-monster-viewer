# builds gapO/gen_beam_types.new.py from the generator (read only) and writes gapO/gen_beam_types.diff (not applied)
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
G = r'C:\MHGU-Extract\efx\agents\basarios-scratch\shell02\gen_beam_types.py'
s = open(G, encoding='utf-8', newline='').read()
assert '\r\n' not in s

def rep(a, b):
    global s
    assert s.count(a) == 1, a[:80]
    s = s.replace(a, b)

# 1. the header: what the two new fields are, where they are read
rep("""#   Em033's +0x168 (0xe3e73c) holds the ray's end at the anchor's height except in modes 5 / 6.
""", """#   Em033's +0x168 (0xe3e73c) holds the ray's end at the anchor's height except in modes 5 / 6.
#   folder (READ 2026-10-22, gapO; was '<mon>_shell02' by NAME): the shell id the monster's beam spawn writes to the setup
#     +4 (BEAM_ID below) -> the shell table 0x175c3e8 row's res (0x48b79c -> 0x152530) -> 0x159daa0[res] = {~crc32 of the
#     lowercase path, type}, matched against the arc's own paths: the .shl, whose folder is the HITSHAPES key. The row's
#     class must be CLASS[mon] (so CLASS is now checked by the id, not taken by name).
#   hit (READ 2026-10-22, gapO): the mode's HitParam FUP ints -- the .shl ShellInfoList[mode] +0x10, named by the mode's
#     own entry (not by the mode number: em033_00 mode 6 names _hit006 = [5]). Every beam reader stores int 0 to +0x1654
#     through 0x4a23f4 (res [+0x1384] -> vt+0x40 list -> [[list+0x10] + 4 x setup byte +8] -> 0x48a4a8 [elem+0x10] -> FUP
#     vt+0x44 0x3cb30c; a null on the way -1, past the ints 0) and base02 registers it as slot 0 (0x3fbab0..0x3fbae4).
""")

# 2. the id table and the path resolution, after CLASS
rep("""# what this viewer does NOT transcribe for a class, named per entry""",
"""# THE BEAM'S SHELL ID per monster: what its spawn writes to the setup +4 (each READ in dev/beams/<mon>.md; the literal
# sites re-checked by disassembly, scratchpad gapO beamreads.py)
BEAM_ID = {
    'em004_00': 0x6c,    # [e+0xcacc], vt+0x158 0xd2e538 (em 4: 0xd2e570 -> str 0xd2e590); spawn stmib {[e+0xcacc], sb} 0xd29570
    'em005_00': 0x6e,    # [e+0xcacc], 0xd2e538 em 5 (0xd2e55c); the same spawn
    'em010_00': 0x7d,    # literal at the seven spawners (0xd6777c 0xd67924 0xd682a8 0xd684c8 0xd68d08 0xd69108 0xd69554)
    'em013_00': 0x84,    # 0xd865a0 variant 0, literal 0xd86708
    'em013_01': 0x88,    # variant 1, 0xd867a0
    'em013_02': 0x8c,    # variant 2, 0xd86734..0xd86758
    'em019_00': 0x9a,    # [e+0xcacc], vt+0x158 0xdc09d4 (mov r3,#0x9a 0xdc0a20 -> str 0xdc0a48)
    'em019_04': 0x9c,    # variant 4: movweq r3,#0x9c 0xdc0a3c
    'em020_00': 0x9e,    # [e+0xcad8], vt+0x158 0xdc3e8c (mov r2,#0x9e 0xdc3e98 -> str 0xdc3eb4); helper 0xdc5e44 stmib
    'em020_04': 0xa0,    # helper 0xdc5edc: mov r0,#0xa0 0xdc5f04
    'em023_00': 0xa9,    # 0xde8908: ldrb [e+0xb5f5] 0xde8924, cmp #5 0xde8940; 0xa9 0xde8970
    'em023_05': 0xad,    # 0xad 0xde8948
    'em024_00': 0xb1,    # literals 0xdf8d78 / 0xdf8f4c (submit 0xdf8fa8)
    'em033_00': 0xc2,    # the eight base02 requests (0xe3b228 0xe3b2b8 0xe3b334 0xe3bae8 0xe3bb84 0xe3bc00 0xe3c620 0xe3c6b8)
    'em038_00': 0xd0,    # each arm mov r0,#0xd0 (0xe6100c 0xe61078 0xe610c4 0xe61114 0xe61174 0xe611c0 0xe616c4 0xe61710)
    'em049_00': 0xee,    # 0xeba564 / 0xebb6ac / 0xebb71c
    'em050_00': 0xf1,    # 0xec8814 / 0xec8924
    'em056_00': 0xf5,    # 0xee54e8 / 0xee5880
    'em058_00': 0xfe,    # 0xf0d06c / 0xf0d108 (requests 0xf0d064 / 0xf0d100)
    'em067_00': 0x123,   # movw 0xf6fc00 / 0xf7150c / 0xf72418
    'em081_04': 0x153,   # [e+0xcbb8], vt+0x158 0x1019c1c (variant 4 movw 0x1019c6c -> 0x1019cc8); helper 0x102feb4 ldr 0x102fee4
    'em082_00': 0x15a,   # [e+0xcac4], vt+0x158 0x1035040 (movw r3,#0x15a 0x103508c -> str 0x10350a4)
    'em082_04': 0x15e,   # variant 4: movw r3,#0x15e 0x1035068
    'em083_04': 0x169,   # immediate (dev/rom-map.md 'uEm083_00 shells, variant 4'); its arc entry starts no effect
    'em084_00': 0x16e,   # movw 0x106f6d4 / 0x107cb18
}
SHELL_TABLE = {r['id']: r for r in json.load(open('C:/MHGU-Extract/efx/agents/narga-shell-scratch/shelltable.json'))}
_RODATA, _RO_VA = open('C:/MHGU-ROM/exefs/main.rodata', 'rb').read(), 0x13EF000

def shl_of(arc, mon, cls):
    # the .shl the beam's shell id names (rom-map '0x48b784..0x48b7b0'; scratchpad shellres.py's match)
    import zlib, struct, arclist
    row = SHELL_TABLE[BEAM_ID[mon]]
    assert row['cls']['name'] == cls, (mon, row['cls']['name'], cls)
    res = int(row['res'], 16)
    h = struct.unpack_from('<I', _RODATA, 0x159daa0 + 8 * res - _RO_VA)[0]
    names = sorted({nm for nm, th, comp, dec, off in arclist.entries(arc)[1]
                    if (zlib.crc32(nm.lower().encode()) ^ 0xffffffff) & 0xffffffff in (h, h & 0x7fffffff)})
    assert len(names) == 1, (mon, hex(BEAM_ID[mon]), names)
    return names[0]

def hit_of(T, hits, mon, mode):
    # the mode's HitParam ints; a mode the getter answers -1 (no entry / no HitParam) or 0 (no ints) for is refused by name
    path = hits.get(mode)
    if path is None: sys.exit('refused: %s mode %d names no HitParam (0x4a23f4 -> -1)' % (mon, mode))
    ints = shellef.fup(T[(path, '496f8f22')])['ints']
    if not ints: sys.exit('refused: %s mode %d HitParam %s has no ints (0x3cb30c -> 0)' % (mon, mode, path))
    return ints

# what this viewer does NOT transcribe for a class, named per entry""")

# 3. shell_scales records each mode's HitParam path when asked
rep("""def shell_scales(T, base):""", """def shell_scales(T, base, hits=None):""")
rep("""        for _ in range(4):                       # EffectParam, SoundParam, HitParam, ShellParam: resources or null
            nn = struct.unpack_from('<I', b, p)[0]; p += 4
            for _ in range(nn):
                assert b[p] == 2, hex(p)
                z = b.index(b'\\0', p + 1); t = b[p + 1:z]; p = z + 1
                p = p + 1 if t == b'null' else b.index(b'\\0', p) + 1
""", """        for j in range(4):                       # EffectParam, SoundParam, HitParam, ShellParam: resources or null
            nn = struct.unpack_from('<I', b, p)[0]; p += 4
            for _ in range(nn):
                assert b[p] == 2, hex(p)
                z = b.index(b'\\0', p + 1); t = b[p + 1:z]; p = z + 1
                if t == b'null': p += 1; continue
                z = b.index(b'\\0', p)
                if j == 2 and hits is not None:       # HitParam: cShellInfo +0x10 (0x48a4a8), an rFreeUseParam
                    assert t == b'rFreeUseParam' and nn == 1, (base, k, t, nn); hits[k] = b[p:z].decode()
                p = z + 1
""")

# 4. the folder from the id; the hit per mode
rep("""    base = 'shell' + SEP + 'em' + SEP + mon + '_shell02' + SEP + mon + '_02'
    if (base, '4aa69872') not in T: continue""", """    base = shl_of(arc, mon, CLASS[mon])         # the .shl the beam's shell id names (was '<mon>_shell02' by name)
    folder = SEP.join(base.split(SEP)[:-1])     # the HITSHAPES key (render/shell-hitshapes.js)
    if (base, '4aa69872') not in T: continue""")
rep("""    scales = shell_scales(T, base)               # the shell unit's +0x60, which its effects take as their parent's scale
""", """    hits = {}
    scales = shell_scales(T, base, hits)         # the shell unit's +0x60, which its effects take as their parent's scale
""")
rep("""'cls': cls, 'mode': mode,
""", """'cls': cls,
             'folder': folder, 'hit': hit_of(T, hits, mon, mode), 'mode': mode,
""")

# 5. an output path for a run that must not touch the viewer
rep("""p = os.path.join(VIEWER, 'docs', 'render', 'beam-types.js')""",
    """p = sys.argv[1] if len(sys.argv) > 1 else os.path.join(VIEWER, 'docs', 'render', 'beam-types.js')""")

new = os.path.join(HERE, 'gen_beam_types.new.py')
open(new, 'w', encoding='utf-8', newline='\n').write(s)
d = subprocess.run(['git', 'diff', '--no-index', '--no-color', G, new], capture_output=True, text=True).stdout
d = d.replace(G.replace('\\', '/'), 'efx/agents/basarios-scratch/shell02/gen_beam_types.py').replace(new.replace('\\', '/'), 'efx/agents/basarios-scratch/shell02/gen_beam_types.py')
open(os.path.join(HERE, 'gen_beam_types.diff'), 'w', encoding='utf-8', newline='\n').write(d)
print('wrote', new, 'and the diff,', d.count('\n'), 'lines')
