# livepatch.py <gap>: run a decode helper's copy-patch script against the LIVE docs/render/shells.js -- its edits unchanged, its
# copy-only steps (the import rewrites, test-only exports) dropped, the result written CRLF over the live file (a .tmp, os.replace)
import sys, os, re
gap = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
LIVE = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
CRLF = chr(13) + chr(10)
def write_live(s):
    s = s.replace(CRLF, chr(10))
    open(LIVE + '.tmplive', 'w', encoding='utf-8', newline=CRLF).write(s)
    os.replace(LIVE + '.tmplive', LIVE)
    print('live written', len(s))
if gap == 'gapA':
    src = open(os.path.join(HERE, 'gapA', 'patch_copy.py'), encoding='utf-8').read()
    a = src.index("# the copy's imports -> the repo's modules")
    src = src[:a] + "write_live(s)\n"
elif gap == 'gapC':
    src = open(os.path.join(HERE, 'gapC', 'patch.py'), encoding='utf-8').read()
    a = src.index("# the copy's imports point at the repo's modules")
    src = src[:a] + "write_live(s)\n"
elif gap == 'gapE':
    src = open(os.path.join(HERE, 'gapE', 'patch.py'), encoding='utf-8').read()
    a = src.index("open(os.path.join(OUT, 'shells.js'), 'w'")
    src = src[:a] + "write_live(s)\n"
    src = src.replace("for m in ('beam-types.js', 'beam-groups.js', 'beam-spawns.js'):\n    shutil.copyfile(os.path.join(SRC, m), os.path.join(OUT, m))\n", "")
else: sys.exit('unknown gap')
g = {'__file__': os.path.join(HERE, gap, 'x.py'), '__name__': '__main__', 'write_live': write_live}
exec(compile(src, gap + '-live', 'exec'), g)
