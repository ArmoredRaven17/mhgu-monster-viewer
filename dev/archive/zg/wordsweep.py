# The three groups' enable words against their transcriptions (jscheckpd.py), plus a negative control per class.
#   python wordsweep.py [mon ...]
import os, re, sys, subprocess, json
HERE = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\zg'
MONJS = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\monster.js'
VT = {'em001': 0x1793c28, 'em002': 0x1793c28, 'em003': 0x17958f0, 'em004': 0x1797c8c, 'em005': 0x1797c8c, 'em007': 0x17994cc,
      'em008': 0x179ac54, 'em009': 0x179c5d8, 'em014': 0x17a813c, 'em015': 0x17a813c, 'em016': 0x17a813c, 'em034': 0x17a813c,
      'em018': 0x17abb38, 'em032': 0x17b8748, 'em033': 0x17ba1c4, 'em037': 0x17bc47c, 'em038': 0x17bd9ac, 'em042': 0x17be9a0,
      'em043': 0x17bfd1c, 'em044': 0x17c1434, 'em045': 0x17c257c, 'em055': 0x17c8768, 'em063': 0x17d92c4, 'em077': 0x17e7c08,
      'em079': 0x17e9444, 'em080': 0x17eac74, 'em081': 0x17ec1b0, 'em085': 0x17f74a8}
BURROW = {'em044_00', 'em055_00'}
LVMAP = {'em001_04': ('7', '0,1,2,3'), 'em002_04': ('7', '0,1,2,3'), 'em005_00': ('0,5,6', '0,1,2'), 'em009_00': ('6', '0,1,2,3'), 'em018_04': ('7', '0,1,2,3')}
SEVER = {'em007_00', 'em007_04', 'em033_00', 'em038_00', 'em077_00', 'em001_00', 'em001_02', 'em001_04', 'em002_00', 'em002_02', 'em002_04', 'em018_00', 'em018_04', 'em042_00', 'em043_00', 'em043_05', 'em044_00', 'em045_00', 'em045_04', 'em063_00', 'em063_05', 'em080_00', 'em080_04'}
src = open(MONJS, encoding='utf8').read()
CLIP = re.compile(r"'L(\d+) Motion\[(\d+)\]': \{ frames")
def motions(mon):
    best = []
    for m in re.finditer(r'\n  ' + mon + r': \{', src):
        j = src.find('\n  },', m.start())
        got = sorted({(int(l) << 8) | int(n) for l, n in CLIP.findall(src[m.start():j])})
        if len(got) > len(best): best = got
    return best
def run(mon, js, env, sts='0,1,2,4,6,7,10,12,13'):
    em, var = int(mon[2:5]), int(mon[6:8])
    mot = motions(mon)
    if not mot: return 'no CLIP_EFFECTS motions'
    e = dict(os.environ, EM=str(em), VAR=str(var), **env)
    r = subprocess.run([sys.executable, 'jscheckpd.py', '%x' % VT[mon[:5]], mon, ','.join('%x' % m for m in mot), sts, js],
                       cwd=HERE, env=e, capture_output=True, text=True)
    lines = (r.stdout + r.stderr).strip().splitlines()
    return ('%d motions; ' % len(mot)) + ' | '.join([l for l in lines if l.startswith('MISMATCH')][:3] + lines[-1:])
if __name__ == '__main__':
    for mon in sys.argv[1:]:
        # every class: the sunk test answered (MoguriBaseOfs -1000 -> threshold -900) over depths either side of it and of -550
        env = {'MOGURI': '-1000', 'RANKS': '5'} if mon in BURROW else {'MOGURI': '-1000', 'DEPTHS': '0,-549,-551,-1000'}
        # the inputs the words read beyond action / posture / depth / rage / tired / rank: P+0x3b4 (severed; SEV) and the part
        # break levels against the real .dtp rows (LV, jscheckpd.py) -- a grid lighter on depth where they multiply it
        if mon in LVMAP: env.update(LV=LVMAP[mon][0], LVLS=LVMAP[mon][1], DEPTHS='0,-1000')
        # the class's own extra input on the CHG axis (jscheckpd.py AXIS): Glavenus's heat byte, Barroth's mud, Brachydios's arm rows
        if mon[:5] == 'em080': env.update(AXIS='heat', CHG=','.join(str(i) for i in range(32)), DEPTHS='0', RANKS='5')
        if mon == 'em044_00': env.update(AXIS='mud', CHG='0,1,2,3', DEPTHS='0,-1000')
        if mon[:5] == 'em063': env.update(AXIS='arms', CHG=','.join(str(i) for i in range(16)), DEPTHS='0,-1000', RANKS='5')
        if mon[:5] in ('em001', 'em002'): env['IDW'] = '0x%x' % ((int(mon[6:8]) << 8) | int(mon[2:5]))   # e+0xb5f0, as CLASS_MASK's rath(em, id)
        if mon in SEVER:
            env['SEV'] = '1'
            if mon not in BURROW: env['DEPTHS'] = '0,-1000'
        print(mon, 'TRANSCRIPTION:', run(mon, mon, env), flush=True)
        neg = 'em033_00' if mon[:5] != 'em033' else 'em032_00'
        # the control only has to show the instrument sees a different transcription: a reduced grid
        print(mon, 'CONTROL vs %s:' % neg, run(mon, neg, dict(env, DEPTHS='0', RANKS='5'), '0,7'), flush=True)
