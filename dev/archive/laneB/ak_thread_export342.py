# laneB (2026-10-25): Ahtal-Ka's d408 threads u 342 / 343 / 344 (class-threads.js em088D408 / em088Webs). From ak_thread_export340.py:
# Export Ahtal-Ka's web threads u 340 (dev/em088-d410-writer.md) (dev/em088_00-effects-spec.md 3.2; the thread pass 0x10b7798), `when: 'thread'`:
# export_effects.py has no 'thread' when, so they go out as 'event' and are re-marked before the merge (render/class-threads.js).
import os, sys, json, subprocess
EFX = r'C:\MHGU-Extract\efx'
sys.path.insert(0, EFX)
os.chdir(EFX)
import add_effects as A

MON = 'em088_00'
WANT = [('em088_00u', k, 'event') for k in (342, 343, 344)]
d = A.existing_def(MON)
have = {(e['record']['pel'], e['record']['key'], A.array_of(e['record']['pel'], e['record']['key'], e['record'].get('index'), e['record'].get('path')))
        for e in d['effects'] if e.get('record')}
specs = []
for pel, key, when in WANT:
    arr = A.array_of(pel, key)
    A.array_of(pel, key)
    holders = [a for a, rs in A._ARRAYS[pel].items() if any(x['key'] == key for x in rs)]
    print(pel, key, 'arrays holding it:', holders)
    if 'UNIQUE' not in holders:
        raise SystemExit('%s %d is not in UNIQUE' % (pel, key))
    if (pel, key, 'UNIQUE') in have:
        print('already exported:', pel, key); continue
    specs.append('record=%s:%d:UNIQUE@%s' % (pel, key, when))
if not specs:
    raise SystemExit('nothing to export')
tmp = MON + '__thr'
r = subprocess.run([sys.executable, 'export_effects.py', tmp, 'clip'] + specs, cwd=EFX, capture_output=True, text=True)
print(r.stdout.strip()); print(r.stderr.strip()[-2000:])
if r.returncode:
    raise SystemExit('export_effects failed')
tp = os.path.join(A.DOCS, 'effects', tmp + '.json')
added = json.load(open(tp))
os.remove(tp)
for e in added['effects']: e['when'] = 'thread'
d = A.existing_def(MON)                     # re-read just before the write
d['effects'] += added['effects']
for k, v in added['resources'].items():
    slot = d['resources'].setdefault(k, {})
    for kk, vv in v.items(): slot.setdefault(kk, vv)
A.write_atomic(os.path.join(A.DOCS, 'effects', MON + '.json'), json.dumps(d, indent=1))
for e in added['effects']:
    print('exported', e['record']['pel'], e['record']['key'], e['record']['index'], e['efl'], e['when'], e.get('stop'), e['joints'])
A.write_joints(MON, d)
A.stage_models(d)
