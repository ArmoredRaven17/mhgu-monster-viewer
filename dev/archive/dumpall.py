import sys, io, contextlib, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx\shader')
sys.path.insert(0, r'C:\MHGU-RE\offline\root')
sys.path.insert(0, r'C:\MHGU-Extract')
import mfx, mfxprog
out = open(sys.argv[1], 'w', encoding='utf-8')
kinds = collections.Counter()
ok = bad = 0
for i, r in enumerate(mfx.records):
    if r is None: continue
    nm = r.get('name') if isinstance(r, dict) else None
    if not nm: continue
    kinds[r.get('kind')] += 1
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            mfxprog.Reader(nm).show()
        out.write('### %d %s kind=%s\n%s\n' % (i, nm, r.get('kind'), buf.getvalue())); ok += 1
    except Exception as e:
        bad += 1
print(ok, bad, kinds.most_common(12))
