# Merge-export one request record into a monster's docs/effects/<mon>.json (ak_class_export.py's way: a temporary export,
# then the entries appended to the re-read file, resources merged, never a regeneration).
#   python exp_rec.py <mon> <pel> <key> <when>
import os, sys, json, subprocess
EFX = r'C:\MHGU-Extract\efx'
sys.path.insert(0, EFX)
os.chdir(EFX)
import add_effects as A
MON, pel, key, when = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
d = A.existing_def(MON)
if any(e.get('record') and e['record']['pel'] == pel and e['record']['key'] == key and e['when'] == when for e in d['effects']):
    raise SystemExit('already exported: %s %d %s' % (pel, key, when))
A.array_of(pel, key)
holders = [a for a, rs in A._ARRAYS[pel].items() if any(x['key'] == key for x in rs)]
print(pel, key, 'arrays holding it:', holders)
arr = 'UNIQUE' if 'UNIQUE' in holders else holders[0]
tmp = MON + '__rec'
r = subprocess.run([sys.executable, 'export_effects.py', tmp, 'clip', 'record=%s:%d:%s@%s' % (pel, key, arr, when)], cwd=EFX,
                   capture_output=True, text=True)
print(r.stdout.strip()); print(r.stderr.strip()[-2000:])
if r.returncode: raise SystemExit('export_effects failed')
tp = os.path.join(A.DOCS, 'effects', tmp + '.json')
added = json.load(open(tp)); os.remove(tp)
d = A.existing_def(MON)
d['effects'] += added['effects']
for k, v in added['resources'].items():
    slot = d['resources'].setdefault(k, {})
    for kk, vv in v.items(): slot.setdefault(kk, vv)
A.write_atomic(os.path.join(A.DOCS, 'effects', MON + '.json'), json.dumps(d, indent=1))
for e in added['effects']: print('exported', e['record']['pel'], e['record']['key'], e['record']['index'], e['efl'], e['when'], e['joints'])
A.write_joints(MON, d)
A.stage_models(d)
