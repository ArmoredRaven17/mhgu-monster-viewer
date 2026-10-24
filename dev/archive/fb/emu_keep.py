# emu_keep.py cases.json out.json: emu_fb.py, keeping a copy of the cases and the output in the scratchpad (debugging a check)
import sys, shutil, subprocess, os
d = os.path.dirname(os.path.abspath(__file__))
n = len([x for x in os.listdir(d) if x.startswith('kept_cases')])
shutil.copy(sys.argv[1], os.path.join(d, 'kept_cases%d.json' % n))
r = subprocess.call([sys.executable, os.path.join(d, 'emu_fb.py'), sys.argv[1], sys.argv[2]])
shutil.copy(sys.argv[2], os.path.join(d, 'kept_out%d.json' % n))
sys.exit(r)
