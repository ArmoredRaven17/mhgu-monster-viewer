"""hypermdd.py (2026-10-25, the Hyper read): every large monster's rEmDouMouKaData (enemy\\dou_mou_ka\\<id>_doumouka.mdd and _g.mdd,
XFS, parsed by efx/agents/state-fx-scratch/xfsdata.py) -> hyper.json: per monster the aura table (PartsAuraData: DouMouKaID, the
group, the part, the meat-change groups and bias), the PartsChange steps (HP rate, action), BuiFirstRandomFlag, and ModifyData (per
aura ID: the actions with MotionSpeedRate / Limit / AttackRate / PowerRate), and which u 1300+ID / 1310+ID records the u.pel holds.
    python hypermdd.py > hyper.json"""
import subprocess, re, json, glob, os, sys
XFS = r'C:\MHGU-Extract\efx\agents\state-fx-scratch\xfsdata.py'
mons = json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\monsters.json'))['monsters']
out = {}
def parse(path):
    t = subprocess.run([sys.executable, XFS, path], capture_output=True, text=True).stdout.split('\n')
    auras, steps, mods, cur, curmod, flag = [], [], {}, None, None, None
    mode = None
    for l in t:
        s = l.strip()
        if s.startswith('mPartsChangeData'): mode = 'pc'
        elif s.startswith('mPartsAuraData'): mode = 'pa'
        elif s.startswith('mModifyData'): mode = 'md'
        m = re.match(r'(\w+)(\[\d+\])? = (.*)$', s)
        if not m: continue
        k, idx, v = m.group(1), m.group(2), m.group(3)
        try: v = json.loads(v.lower()) if v in ('True', 'False') else (float(v) if '.' in v else int(v))
        except Exception: pass
        if k == 'BuiFirstRandomFlag': flag = v
        if mode == 'pc':
            if k == 'PartsChangeHpRate': steps.append({'hp': v})
            elif k in ('PartsChangeActSt', 'PartsChangeActNo') and steps: steps[-1][k[-5:]] = v
        elif mode == 'pa':
            if k == 'DouMouKaID': cur = {'id': v, 'meat': []}; auras.append(cur)
            elif cur is not None:
                if k == 'SpecificPartsGroup': cur['group'] = v
                elif k == 'SpecificParts': cur['part'] = v
                elif k == 'MeatChange_Group' and v != 255: cur['meat'].append(v)
                elif k == 'MeatChange_SpecificParts_Bias': cur['meatBias'] = v
        elif mode == 'md':
            if k == 'DouMouKaID': curmod = mods.setdefault(v, [])
            elif k == 'ActionStatus' and curmod is not None: curmod.append({'st': v})
            elif curmod and k in ('ActionNo', 'MotionSpeedRate', 'MotionSpeedRateLimit', 'AttackRate', 'PowerRate', 'Rate'): curmod[-1][k] = v
    return {'firstRandom': flag, 'auras': auras, 'steps': steps, 'modify': mods}
for m in mons:
    if m.get('small'): continue
    i = m['id']
    files = sorted(glob.glob(r'C:\MHGU-Extract\scratch-em\%s\enemy\dou_mou_ka\*.mdd' % i))
    if not files: out[i] = None; continue
    out[i] = {os.path.basename(f): parse(f) for f in files}
json.dump(out, sys.stdout, indent=0)
