# THE .shl's ShellInfoList, per mode, with every resource each cShellInfo names (gapO, 2026-10-22).
# rShell::cShellInfo (0x18 B; dev notes shells-em043.md): +4 ShellScale, +8 EffectParam, +0xc SoundParam, +0x10 HitParam,
# +0x14 ShellParam -- one resource pointer each. Serialised in that order: ShellScale (u32 n, f32 x n), then four resource
# lists (u32 n, then each: byte 2, type name z-string, and either 'null' + 1 byte or the path z-string).
# The walk is gen_beam_types.shell_scales's (first entry found by its header), recording the paths instead of skipping them.
# The getters, READ 2026-10-22 (gapO RESULT 2):
#   0x4a23f4 HitParam int(i): res [shell+0x1384] (null -> -1); list = res vt+0x40 (the ShellInfoList); mode = byte
#     [[shell+0x136c]+8] (null setup -> 0xff); elem = [[list+0x10] + 4 mode] (no bound; null -> -1); 0x48a4a8 elem -> [elem+0x10]
#     (the HitParam; null -> -1); tail vt+0x44 = 0x3cb30c (the FUP vtable 0x174d378): i >= [+0x64] -> 0, else [[+0x70] + 4 i].
import re, struct, sys
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import shellef

_ENTRY = re.compile(rb'\x05\x00......\x01\x00\x00\x00....\x01\x00\x00\x00\x02', re.S)
PROPS = ('ef', 'snd', 'hit', 'sh')

def shell_info(T, base):
    """[{'scale': f, 'ef': path|None, 'snd': .., 'hit': .., 'sh': ..}] by ShellInfoList index (= the mode)."""
    b = T[(base, '4aa69872')]
    p = _ENTRY.search(b, b.index(b'ShellParam\0')).start()
    count = struct.unpack_from('<I', b, p - 4)[0]
    out = []
    for k in range(count):
        p += 8
        n = struct.unpack_from('<I', b, p)[0]; p += 4
        scale = struct.unpack_from('<%df' % n, b, p)[0]; p += 4 * n
        e = {'scale': scale}
        for prop in PROPS:
            nn = struct.unpack_from('<I', b, p)[0]; p += 4
            paths = []
            for _ in range(nn):
                assert b[p] == 2, hex(p)
                z = b.index(b'\0', p + 1); t = b[p + 1:z]; p = z + 1
                if t == b'null': p += 1; paths.append(None)
                else:
                    z = b.index(b'\0', p); paths.append((t.decode(), b[p:z].decode())); p = z + 1
            assert nn <= 1, (base, k, prop, nn)
            e[prop] = paths[0] if paths else None
        out.append(e)
    return out

def hit_ints(T, info, mode):
    """the HitParam FUP's ints for `mode` as the getter sees them: None = the getter's -1 path (no element / no HitParam)."""
    if mode >= len(info): return None            # past the list: the ROM reads past the array (no bound) -- refused by name
    h = info[mode]['hit']
    if not h: return None
    typ, path = h
    assert typ == 'rFreeUseParam', typ
    return shellef.fup(T[(path, '496f8f22')])['ints']

def hit0(ints):
    """0x4a23f4(S, 0): -1 with no HitParam; 0x3cb30c: 0 past the FUP's ints; else ints[0]"""
    if ints is None: return -1
    return ints[0] if ints else 0
