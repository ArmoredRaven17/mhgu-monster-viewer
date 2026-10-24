# shell_audit.py <reach output>: every record a monster's shells reach (reach.mjs) against docs/effects/<mon>.json's 'shell' entries
# and the recorded sets. A record the json lacks makes the schedule's request null: the shell spawns and draws nothing (the effects
# agent's Bloodbath find, 2026-10-20: em007_04 named em007_00c 0 / 1 / 2 with no entry in em007_04.json).
import sys, json, os, re
DOCS = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\effects'
EFX = r'C:\MHGU-Extract\efx'
bad = 0
for line in open(sys.argv[1]):
    if not re.match(r'^em\d{3}_\d\d em', line): continue
    p = line.split(); mon = p[0]
    path = os.path.join(DOCS, mon + '.json')
    d = json.load(open(path, encoding='utf8')) if os.path.exists(path) else {'effects': []}
    shell = {(e['record']['pel'], e['record']['key']) for e in d['effects'] if e.get('record') and e.get('when') == 'shell'}
    miss = []
    for part in p[1:]:
        pel, ks = part.split(':')
        for k in map(int, ks.split(',')):
            if (pel, k) not in shell: miss.append('%s %d' % (pel, k))
    if miss:
        bad += len(miss)
        print(mon, 'NO SHELL ENTRY:', ', '.join(miss))
print('missing entries', bad)
