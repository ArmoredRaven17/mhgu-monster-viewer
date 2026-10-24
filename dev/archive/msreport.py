"""msreport.py <out files...> [--when shell] [--all]: the draw meter survey's REPORT lines -> per monster, the records by verdict and,
for every record that is not 'draws', its row (starts, live frames, draw frames, draws by kind, hidden reasons, lit samples, the
diagnosis snapshot, the clips it started on)."""
import sys, json, re, collections
files = [a for a in sys.argv[1:] if not a.startswith('--')]
when = sys.argv[sys.argv.index('--when') + 1] if '--when' in sys.argv else None
allrows = '--all' in sys.argv
for f in files:
    for l in open(f, encoding='utf8', errors='replace'):
        m = re.match(r'^FAIL REPORT (\S+)\s+--\s+(\{.*\})\s*$', l)
        if not m: continue
        mon, d = m.group(1), json.loads(m.group(2))
        if 'error' in d: print(mon, 'ERROR', d['error']); continue
        recs = [r for r in d['recs'] if when is None or r['w'] == when]
        c = collections.Counter(r['verdict'] for r in recs)
        print('%s: played %d clips in %ds, %d records: %s%s' % (mon, d['played'], d['secs'], len(recs), dict(c),
              ('  missing clips %s' % d['missing'][:6]) if d['missing'] else ''))
        for r in sorted(recs, key=lambda r: (r['verdict'], r['k'])):
            if r['verdict'] == 'draws' and not allrows: continue
            print('    %-44s %-18s %-30s st %d live %d df %d vf %d d %s hid %s lit %d/%d px %d clips %s%s' % (
                r['k'], r['efl'], r['verdict'], r['st'], r['live'], r['df'], r['vf'], r['d'], r['hid'], r['lit'], r['s'], r['px'],
                r['clips'], ('  diag ' + json.dumps(r['diag'])[:300]) if r.get('diag') else '') + (('  nodraw ' + json.dumps(r['nodraw'])[:400]) if r.get('nodraw') else ''))
