"""Flying Wyvern effects survey (Raven, 2026-10-14): per monster, what is implemented and what is not.

  python fw_survey.py [mon ...] > fw_survey.json
"""
import sys, os, json, re, io, collections, contextlib
sys.path.insert(0, r'C:\MHGU-Extract\efx')
os.chdir(r'C:\MHGU-Extract\efx')
import add_effects as A
import effects_status as S

VIEWER = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
FW = ['em001_00', 'em001_02', 'em001_04', 'em002_00', 'em002_02', 'em002_04', 'em003_00', 'em004_00', 'em005_00',
      'em007_00', 'em007_04', 'em032_00', 'em032_04', 'em033_00', 'em037_00', 'em037_04', 'em038_00', 'em042_00',
      'em077_00', 'em081_00', 'em081_04']
mons = sys.argv[1:] or FW

shells_js = open(os.path.join(VIEWER, 'docs', 'render', 'shells.js'), encoding='utf-8').read()
psl_js = open(os.path.join(VIEWER, 'docs', 'render', 'psl-mask.js'), encoding='utf-8').read()
mask_list = set(re.findall(r"'(em\d{3}_\d\d)'", re.search(r'PSL_MASK_MONSTERS\s*=\s*\[([^\]]*)\]', psl_js).group(1)))

drv = S.drivers(); clips = S.clip_pairs(); rage_list = S.auto_on_rage()


def plan_rows(mon, whole):
    real = A.psl_mask_monsters
    if whole:
        A.psl_mask_monsters = lambda: real() | {mon}
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            cfg, entry, rows, records = A.plan(mon)
    finally:
        A.psl_mask_monsters = real
    return cfg, rows


out = {}
for mon in mons:
    r = {'mon': mon}
    try:
        effp = os.path.join(VIEWER, 'docs', 'effects', mon + '.json')
        eff = json.load(open(effp, encoding='utf-8'))['effects'] if os.path.exists(effp) else []
        exported = {(e['record']['pel'], e['record']['key']) for e in eff if e.get('record')}
        named = S.state_named(mon)
        st = collections.Counter(S.status_of(mon, e, drv, clips, rage_list, named) for e in eff)
        wired = [(e['record']['pel'][-1] + str(e['record']['key']), e.get('when')) for e in eff
                 if e.get('record') and S.status_of(mon, e, drv, clips, rage_list, named) == 'wired']
        r.update(exported=len(eff), implemented=st['implemented'], wiredNotDriven=st['wired'],
                 wiredList=sorted(set('%s(%s)' % w for w in wired))[:40])
        cfg, rows_f = plan_rows(mon, False)
        _, rows_w = plan_rows(mon, True)
        key = lambda x: (x[0], x[1], x[3])
        fset = {key(x) for x in rows_f}
        extra = [x for x in rows_w if key(x) not in fset]
        def recname(x):
            return '%s%s' % ('c' if x[4] == cfg['cpel'] else 'u', x[5])
        notExp = sorted({recname(x) for x in rows_w if (x[4], x[5]) not in exported and x[9].startswith('ok')})
        refused = sorted({'%s L%s M%s b%s: %s' % (recname(x), x[0], x[1], x[3], x[9]) for x in rows_w
                          if x[9].startswith(('refused', 'missing'))})[:15]
        r.update(enableWordRead=mon in mask_list,
                 pslBindingsFileMask=len(rows_f), pslBindingsWhole=len(rows_w),
                 outsideMaskBindings=len(extra),
                 outsideMaskRecords=sorted({recname(x) for x in extra}),
                 pslRecordsNotExported=notExp, pslRefusedOrMissing=refused)
        r['shellData'] = bool(re.search(r"\b%s:\s*\{" % mon, shells_js))
        r['shellRecordsExported'] = sum(1 for e in eff if e.get('when') == 'shell')
    except Exception as ex:
        r['error'] = '%s: %s' % (type(ex).__name__, ex)
    out[mon] = r
    print('done', mon, file=sys.stderr, flush=True)
print(json.dumps(out, indent=1))
