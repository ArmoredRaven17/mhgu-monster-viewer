"""hypermotion/hyperdiff_carry.py: the control for hyperdiff.py's residual diffs -- each differing run repeated OFF / OFF (and ON / ON):
a diff that also shows between two identical runs is state carried between runs (a .data global), not Hyper.
   python dev/archive/hypermotion/hyperdiff_carry.py <monster id>"""
import sys, os, json, runpy
mid = sys.argv[1]
sys.argv = [sys.argv[0], mid, '99']                     # import the machine without its sweep (status 99: none)
g = runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hyperdiff.py'), run_name='hd')
D = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hyperdiff', mid + '.json')))
res = {'carry': 0, 'hyper': []}
for x in D['diffs']:
    st, n = [int(v, 0) for v in x['act'].split(':')]
    a1 = g['one'](st, n, x['phase'], x['ended'], x['frame'], 0); a2 = g['one'](st, n, x['phase'], x['ended'], x['frame'], 0)
    b1 = g['one'](st, n, x['phase'], x['ended'], x['frame'], 1); b2 = g['one'](st, n, x['phase'], x['ended'], x['frame'], 1)
    if a1 != a2 or b1 != b2: res['carry'] += 1
    else: res['hyper'].append(x)
print(json.dumps({'mon': mid, 'diffs': len(D['diffs']), 'carry': res['carry'], 'hyper': res['hyper'][:5]}))
