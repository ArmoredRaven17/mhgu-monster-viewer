# Export every base02 (beam) shell's effect records -- ef param 0 (the beam) and 1 (the step's impact) of every mode --
# as `shell` records from the pel's UNIQUE array, into the owning monster's docs/effects json.
import glob, os, sys, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import shellef, add_effects as A
SEP = chr(92)
ems = ['005', '010', '013', '019', '020', '023', '024', '033', '038', '049', '050', '056', '058', '067', '081', '082', '083', '084']
plan = {}
for arc in sorted(glob.glob(r'C:\MHGU-ROM\romfs\nativeNX\arc\enemy\em*.arc')):
    mon = os.path.basename(arc)[:-4]
    if mon[2:5] not in ems: continue
    T = shellef.load_typed(arc)
    for (nm, th), b in T.items():
        if th != '1eb12c38' or ('_shell02' + SEP) not in nm or '_ef' not in nm: continue
        r = shellef.parse_ef(b)
        for prm in r['params']:
            for lid, uid in prm['arr']:
                if lid is None or lid > 7 or uid is None or uid >= 0x80000000: continue
                plan.setdefault(mon, set()).add(uid)
for mon, keys in sorted(plan.items()):
    if not os.path.exists(os.path.join(A.DOCS, 'effects', mon + '.json')):
        print(mon, 'no json -- skipped'); continue
    recs = [(mon + 'u', k, 'UNIQUE', 'shell') for k in sorted(keys)]
    print(mon, sorted(keys), flush=True)
    try:
        A.export(mon, recs)
        d = A.existing_def(mon)
        A.stage_models(d)
    except SystemExit as e:
        print('  export refused:', e)
    except Exception as e:
        print('  export error:', repr(e)[:300])
