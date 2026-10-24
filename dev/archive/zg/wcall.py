import subprocess, sys, os
from wordsweep import VT
MONS = sys.argv[1:]
for mon in MONS:
    e = dict(os.environ, EM=str(int(mon[2:5])), VAR=str(int(mon[6:8])))
    r = subprocess.run([sys.executable, 'wordclip.py', '%x' % VT[mon[:5]], mon], env=e, capture_output=True, text=True)
    print((r.stdout + r.stderr[-800:]).strip(), flush=True)
