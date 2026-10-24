# Generate MHGU-Monster-Viewer/docs/render/beam-types.js: every beam (base02) shell mode in the ROM's arcs that starts an
# effect, reduced to one entry per distinct look (monster x beam effect x impact effect), with the parameters its CLASS's
# reader gives the base (vtable +0x14c; the maps are dev/rom-map.md's beam-base rows, read 2026-09-30):
#   default reader: sh int 0 -> +0x1658 joint, sh float 0 -> +0x1660 (the base init copies it to the life +0x15cc),
#     sh float 1 -> +0x165c (the length +0x160 reads), sh vec 0 -> +0x1678 origin offset, sh vec 1 -> +0x1680 angles,
#     ef 0 -> +0x1644 (the beam, started at activation), ef 1 -> +0x1648 (the step's impact at the stage hit)
#   uShellEm005_sp_02 (Basarios / Gravios): cmn int 0 joint, cmn float 0 length, cmn float 1 push, cmn vec 0 offset,
#     sh float 0 life, sh vec 0 angles
#   uShellEm013_*_02 (the Fatalis): sh float 0 -> +0x165c length, sh float 1 -> +0x1660 life, sh floats 2 / 3 ->
#     +0x168c / +0x1690, the thresholds of its own +0x160 (0xd8bf20: 500 above +0x1690, the full length below +0x168c,
#     a ramp between)
#   +0x1664 (the growth the base's +0x160 divides by; +0x15d0 counts it down): sh float 2 for Em081_04 / Em082
#   the flags word +0x1674: Em010 bit 0 <- sh int 1; Em019 / Em023 / Em033 / Em038 / Em050 bit 3 <- sh int 1;
#     Em049 bit 0 <- sh int 2, bit 1 <- sh int 1; Em081_04 bit 2 <- sh int 1; Em082 bit 2 always; Em084 bit 2 <- sh int 2
#   Em050's step (0xecfdb8) runs the base step only when the hit is within sh float 4 (+0x168c) of the ray's end;
#   Em033's +0x168 (0xe3e73c) holds the ray's end at the anchor's height except in modes 5 / 6.
import json, os, sys
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import shellef, glob
SEP = chr(92)
VIEWER = 'C:/MHGU-Extract/MHGU-Monster-Viewer'
CLASS = {'em004_00': 'uShellEm005_sp_02', 'em005_00': 'uShellEm005_sp_02', 'em010_00': 'uShellEm010_sp_02',
         'em013_00': 'uShellEm013_00_02', 'em013_01': 'uShellEm013_01_02', 'em013_02': 'uShellEm013_02_02',
         'em019_00': 'uShellEm019_sp_02', 'em019_04': 'uShellEm019_sp_02', 'em020_00': 'uShellEm020_sp_02',
         'em020_04': 'uShellEm020_04_02', 'em023_00': 'uShellEm023_sp_02', 'em023_05': 'uShellEm023_sp_02',
         'em024_00': 'uShellEm024_sp_02', 'em033_00': 'uShellEm033_sp_02', 'em038_00': 'uShellEm038_sp_02',
         'em049_00': 'uShellEm049_sp_02', 'em050_00': 'uShellEm050_sp_02', 'em056_00': 'uShellEm056_sp_02',
         'em058_00': 'uShellEm058_sp_02', 'em067_00': 'uShellEm067_sp_02', 'em081_04': 'uShellEm081_04_02',
         'em082_00': 'uShellEm082_sp_02', 'em082_04': 'uShellEm082_sp_02', 'em083_04': 'uShellEm083_04_02',
         'em084_00': 'uShellEm084_sp_02'}
# what this viewer does NOT transcribe for a class, named per entry (each is refused or left out by name at run time)
NOT_READ = {
    'uShellEm010_sp_02': 'its step (0xd6cce8) and +0x154 (0xd6c970) also make a CHILD SHELL at the hit (+0x1690), not transcribed',
    'uShellEm038_sp_02': 'its step 0xe647cc replaces the base step (periodic impacts on a floor hit, +0x1698), not transcribed: no impact',
    'uShellEm019_sp_02': 'flag bit 3 (after +0x1668 frames the direction comes from 0x3fcd3c / 0x3fcec8) not transcribed',
    'uShellEm023_sp_02': 'flag bit 3 (after +0x1668 frames the direction comes from 0x3fcd3c / 0x3fcec8) not transcribed',
    'uShellEm033_sp_02': 'flag bit 3 (after +0x1668 frames the direction comes from 0x3fcd3c / 0x3fcec8) not transcribed',
    'uShellEm050_sp_02': 'flag bit 3 (after +0x1668 frames the direction comes from 0x3fcd3c / 0x3fcec8) not transcribed',
}
names = {m['id']: m['name'] for m in json.load(open(os.path.join(VIEWER, 'docs', 'monsters.json'), encoding='utf-8'))['monsters']}

# THE CHILDREN (read 2026-09-30; dev/rom-map.md's beam-base rows):
#   Em010 (Plesioth): the reader 0xd6caf0 sets +0x168c iff sh int 2 != -1, and then +0x154 0xd6c970 keeps ONE child shell
#     0x7c (uShellEm010_sp_00) mode 0 at the beam's hit, turned with the beam's angle words, ended by hit type 3 or the
#     beam's end. The child's reader 0xd6c55c: flags 0x800 / 0x10 / 0x20 from sh ints 0 / 1 / 2 != -1, | 0x40; the
#     bytes +0x1660 / +0x1661 (follow the point / the angles) = ints 1 / 2 != -1; flight = sh float 0; ef 0 its effect.
#   Em038 (Ukanlos): +0x158 0xe647cc replaces the base step. The tables (0xe63d74, by mode): delays = cmn floats 0..5 /
#     6..11 / 12..17 (modes 0,5 / 1,6 / 2,7), cmn float 18 x5 (3,4); child modes 8..13 / 15,14 x3 / 17,16 x3 / 18..22
#     (LITERALS in the code); the count cmn int 0 (int 1 for 3 / 4) must be > 5 (> 4) or the shell ends at init. The child
#     0xce is uShellEm038_sp_00 (base00): its reader 0xe63400 (ef 0..3 -> +0x15c8 / +0x15cc / +0x15d4 / +0x15d0; sh
#     floats 0..4 -> vz / vy / flight / X deg / Y deg; vecs 0 / 1 -> offset / gravity; flags 0x40 | 0x10 (int 2) |
#     0x20 (int 3)), its init's random scale (cmn f1 + f2 x r, modes 8..17; f3 + f4 x r, 18..22) and +0x16c's jitter
#     (cmn f0).
UKANLOS_MODES = {0: (0, [8, 9, 10, 11, 12, 13]), 5: (0, [8, 9, 10, 11, 12, 13]), 1: (6, [15, 14, 15, 14, 15, 14]),
                 6: (6, [15, 14, 15, 14, 15, 14]), 2: (12, [17, 16, 17, 16, 17, 16]), 7: (12, [17, 16, 17, 16, 17, 16]),
                 3: (None, [18, 19, 20, 21, 22]), 4: (None, [18, 19, 20, 21, 22])}

def folder_of(T, mon, n):
    base = 'shell' + SEP + 'em' + SEP + '%s_shell%02d' % (mon, n) + SEP + '%s_%02d' % (mon, n)
    return base if (base, '4aa69872') in T else None

sys.path.insert(0, 'C:/MHGU-Extract/efx/agents/rathian-shell-scratch')
import shlparse

def shell_scales(T, base):
    # the .shl's ShellInfoList: ShellScale per mode (rShell::cShellInfo; agents/rathian-shell-scratch/shlparse.py), read off
    # the .shl's own bytes (load_typed: its ShellCmnParam shares the path)
    count, rows, _ = shlparse.parse(T[(base, '4aa69872')])
    return {r['index']: r['scale'][0] for r in rows}

def child_mode(T, base, m):
    ef = []
    k = (base + '_ef%03d' % m, '1eb12c38')
    if k in T:
        ef = [[p[0], p[1] if p[1] < 0x80000000 else -1] for prm in shellef.parse_ef(T[k])['params'] for p in prm['arr']]
    shk = (base + '_sh%03d' % m, '496f8f22')
    sh = shellef.fup(T[shk]) if shk in T else {'ints': [], 'floats': [], 'vecs': []}
    return {'ef': ef, 'sh': sh, 'scale': shell_scales(T, base).get(m, 1.0)}

def children_of(T, mon, cls, mode, sh, cmn):
    I = lambda i: sh['ints'][i] if i < len(sh['ints']) else -1
    if cls == 'uShellEm010_sp_02' and I(2) != -1:
        base = folder_of(T, mon, 0)
        if not base: return None
        return {'kind': 'follow', 'id': 0x7c, 'cls': 'uShellEm010_sp_00', 'pel': pel_of(T, base), 'mode': 0,
                'modes': {0: child_mode(T, base, 0)}}
    if cls == 'uShellEm038_sp_02' and mode in UKANLOS_MODES:
        base = folder_of(T, mon, 0)
        first, cm = UKANLOS_MODES[mode]
        f = cmn['floats']
        delays = [f[18]] * 5 if first is None else f[first:first + 6]
        count = (cmn['ints'][1] if first is None else cmn['ints'][0]) if len(cmn['ints']) > 1 else -1
        return {'kind': 'ukanlos', 'id': 0xce, 'cls': 'uShellEm038_sp_00', 'pel': pel_of(T, base),
                'count': count, 'delays': delays, 'childModes': cm,
                'cmn': shellef.fup(T[(base, '496f8f22')]) if (base, '496f8f22') in T else None,
                'modes': {m: child_mode(T, base, m) for m in sorted(set(cm))}}
    return None

def pel_of(T, base):
    # THE .shl'S ONE EFFECT LIST. Every beam .shl names exactly one rProofEffectList (its own u pel); which of the 8 slots
    # holds it cannot be read off the strings alone -- a null in front of it may be the mode list's (Basarios: slot 0)
    # or the list's own (Gravios: slot 1, the pel-tied sound list likewise) -- and every ef record of the file names that
    # slot (Gravios's say 1, the rest 0), which is how the game resolves them (0x4a11e4: +0x1388 + 4 x listId).
    import re
    b = T[(base, '4aa69872')]
    runs = [m.group().decode() for m in re.finditer(rb'[ -~]{4,}', b)]
    paths = [s.split(SEP)[-1] for s in runs if s.startswith('effect') and (SEP + 'pel' + SEP) in s]
    return paths[0] if len(paths) == 1 else None

out = []
for arc in sorted(glob.glob(r'C:\MHGU-ROM\romfs\nativeNX\arc\enemy\em*.arc')):
    mon = os.path.basename(arc)[:-4]
    if mon not in CLASS: continue
    T = shellef.load_typed(arc)
    base = 'shell' + SEP + 'em' + SEP + mon + '_shell02' + SEP + mon + '_02'
    if (base, '4aa69872') not in T: continue
    pel0 = pel_of(T, base)
    if not pel0: continue
    cmn = shellef.fup(T[(base, '496f8f22')]) if (base, '496f8f22') in T else {'ints': [], 'floats': [], 'vecs': []}
    cls = CLASS[mon]
    seen = {}
    for (nm, th), b in sorted(T.items()):
        if th != '1eb12c38' or not nm.startswith(base + '_ef'): continue
        mode = int(nm.split('_ef')[-1])
        r = shellef.parse_ef(b)
        ef = [[p[0], p[1] if p[1] < 0x80000000 else -1] for prm in r['params'] for p in prm['arr']]
        shk = (base + '_sh%03d' % mode, '496f8f22')
        sh = shellef.fup(T[shk]) if shk in T else {'ints': [], 'floats': [], 'vecs': []}
        I = lambda i: sh['ints'][i] if i < len(sh['ints']) else -1
        F = lambda i: sh['floats'][i] if i < len(sh['floats']) else 0.0
        if not ef or ef[0][0] > 7 or ef[0][1] < 0: continue
        pel = pel0
        imp = ef[1] if len(ef) > 1 and ef[1][0] <= 7 and ef[1][1] >= 0 else None
        if cls == 'uShellEm005_sp_02':
            life, length = F(0), (cmn['floats'][0] if cmn['floats'] else 0.0)
        elif cls.startswith('uShellEm013'):
            life, length = F(1), F(0)
        else:
            life, length = F(0), F(1)
        growth = F(2) if cls in ('uShellEm081_04_02', 'uShellEm082_sp_02') else 0.0
        flags = 0
        if cls == 'uShellEm010_sp_02' and I(1) != -1: flags |= 1
        if cls in ('uShellEm019_sp_02', 'uShellEm023_sp_02', 'uShellEm033_sp_02', 'uShellEm038_sp_02', 'uShellEm050_sp_02') and I(1) != -1: flags |= 8
        if cls == 'uShellEm049_sp_02':
            if I(2) != -1: flags |= 1
            if I(1) != -1: flags |= 2
        if cls == 'uShellEm081_04_02' and I(1) != -1: flags |= 4
        if cls == 'uShellEm082_sp_02': flags |= 4
        if cls == 'uShellEm084_sp_02' and I(2) != -1: flags |= 4
        e = {'id': '%s:%d' % (mon, mode), 'mon': mon, 'name': names.get(mon, mon), 'cls': cls, 'mode': mode,
             'beam': [pel, ef[0][1]], 'impact': [pel0, imp[1]] if imp else None,
             'life': round(life, 3), 'length': round(length, 3), 'growth': round(growth, 3), 'flags': flags}
        if cls.startswith('uShellEm013'): e['ramp'] = [round(F(2), 3), round(F(3), 3)]
        if cls == 'uShellEm050_sp_02': e['stepGate'] = round(F(4), 3)
        if cls == 'uShellEm033_sp_02' and mode not in (5, 6): e['flatEnd'] = True
        ch = children_of(T, mon, cls, mode, sh, cmn)
        if ch: e['child'] = ch
        if cls in NOT_READ: e['notRead'] = NOT_READ[cls]
        look = (e['beam'][1], e['impact'][1] if e['impact'] else None, flags & 4)
        prev = seen.get(look)
        # one entry per look: the first mode, unless a later one lives long enough to see (>= 60 frames) and it does not
        if prev is None or (prev['life'] < 60 <= e['life']):
            seen[look] = e
    out += sorted(seen.values(), key=lambda x: x['mode'])
head = ('// GENERATED by efx/agents/basarios-scratch/shell02/gen_beam_types.py from the ROM arcs -- every beam (base02) shell\n'
        '// mode that starts an effect, one entry per look (monster x beam effect x impact effect x the ground cut), with the\n'
        '// parameters its class\'s reader gives the base. The Special-list Beam Test on Basarios (render/shells.js BEAM_SHOWCASE) cycles them.\n'
        '// Do not edit by hand: the reader maps and their addresses are in the generator\'s header and dev/rom-map.md.\n')
js = head + 'export const BEAM_TYPES = [\n' + ''.join('  ' + json.dumps(e) + ',\n' for e in out) + '];\n'
p = r'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/beam-types.test.js'
open(p, 'w', encoding='utf-8', newline='\n').write(js)
print(len(out), 'types ->', p)
for e in out: print('  %-12s %-22s m%-3d beam %s impact %s life %s len %s grow %s flags %s' % (e['id'], e['name'][:22], e['mode'], e['beam'], e['impact'], e['life'], e['length'], e['growth'], e['flags']))
