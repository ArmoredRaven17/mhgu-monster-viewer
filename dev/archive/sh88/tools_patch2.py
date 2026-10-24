p = r'C:\MHGU-Extract\efx\record_shells.py'
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a[:60]
    s = s.replace(a, b)
rep("""THEN = None
_argv = []
for a in sys.argv[1:]:""", """THEN = None
# --len=<frames>: the recording's frame cap (default 900). A shell living longer is cut at 900 and its END is never recorded --
# Ahtal-Ka's arena lines (u 90 / 91) stop at 1891 and refused live at 0x9b7008 there. In the tag as `_len<N>`.
LENCAP = None
_argv = []
for a in sys.argv[1:]:
    if a.startswith('--len='):
        LENCAP = a.split('=', 1)[1]
        continue""")
rep("""('_t' + re.sub(r'\\W', '', THEN) if THEN else ''))""", """('_t' + re.sub(r'\\W', '', THEN) if THEN else '') + ('_len' + LENCAP if LENCAP else ''))""")
rep("""            frames = min(info['frames'], 900)""", """            frames = min(info['frames'], int(LENCAP) if LENCAP else 900)""")
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok')
