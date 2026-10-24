# status 10 / 11 clips by posture: the unicorn tables s10_em067.txt / s11_em067.txt (script per posture) walked with scr.py
import sys, re, json
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\zamtrios-scratch')
import scr
clip = {}
for fn in ('s10_em067.txt', 's11_em067.txt'):
    for line in open(r'C:\MHGU-Extract\efx\agents\zamtrios-scratch' + '\\' + fn):
        m = re.match(r'\((\d+), (0x[0-9a-f]+)\): (.*)', line.strip())
        if not m: continue
        act = '%s,%s' % (m.group(1), m.group(2))
        for arm in m.group(3).split(' | '):
            mm = re.match(r'posture ([0-9,]+)(?: part [0-9,]+)?: script (0x[0-9a-f]+)', arm)
            if not mm: continue
            ps = [int(x) for x in mm.group(1).split(',')]
            for l in scr.dump(int(mm.group(2), 16)):
                for c in re.findall(r'op 0x(?:0|2|35) (L\d M\d+)', l):
                    for p in ps: clip.setdefault(c, {}).setdefault(p, set()).add(act)
for c in sorted(clip, key=lambda s: (int(s[1]), int(s.split('M')[1]))):
    print('%-7s forms %-4s %s' % (c, ''.join(str(f) for f in sorted(clip[c])), ' '.join('f%d:%s' % (f, '/'.join(sorted(clip[c][f]))) for f in sorted(clip[c]))))
json.dump({c: {str(f): sorted(v) for f, v in d.items()} for c, d in clip.items()}, open('s1011.json', 'w'), indent=0)
