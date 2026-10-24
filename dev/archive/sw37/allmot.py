"""Every status-7 number of uEm037_00 (variant 4) under trace.py: the motions it sets and the shells it creates (one path:
stubs return 0). Output: sw37/allmot.json"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import trace as T
out = {}
for n in range(1, 0x100):
    try:
        t = T.Tr(n, 400, quiet=True)
        log = t.run()
    except Exception as ex:
        out[hex(n)] = {'error': str(ex)}; continue
    mot = []; cre = []
    for x in log:
        if x[3] == 'setMotion': mot.append(x[5])
        if x[3] == 'CREATE': cre.append((x[1], x[2], x[4]))
        if x[3] == 'FAULT': mot.append('FAULT ' + x[5])
    out[hex(n)] = {'motions': mot, 'creates': cre}
    print(hex(n), mot, cre, flush=True)
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'allmot.json'), 'w'), indent=1)
