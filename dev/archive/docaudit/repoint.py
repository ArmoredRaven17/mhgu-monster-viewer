import os, re, sys, glob, io
REPO = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
APPLY = '--apply' in sys.argv
files = glob.glob(os.path.join(REPO, 'dev', '**', '*.md'), recursive=True)
files += glob.glob(os.path.join(REPO, 'docs', 'render', '**', '*.js'), recursive=True)
files = [f for f in files if 'node_modules' not in f]
TOK = re.compile(r'<scratchpad>')
# "scratchpad/x" or "scratchpad\x" written as a direct path
DIRECT = re.compile(r'(?<![<A-Za-z])scratchpad(?=[\\/][A-Za-z0-9_])')
# prose "scratchpad" directly followed by a path-like token
PATHTOK = r"(?=[ :]+\(?`?[A-Za-z0-9_{}.\-]+(?:[\\/]|\.(?:py|mjs|txt|md|json|js|sh|out|pkl)\b))"
BARE = re.compile(r"(?:(?:the |this )?(?:session's |session |shells agent's |effects )?)?(?<![<A-Za-z])scratchpad(?:'s)?" + PATHTOK)
total = {'tok': 0, 'direct': 0, 'bare': 0}
for f in files:
    raw = open(f, 'rb').read()
    txt = raw.decode('utf-8')
    nl = '\r\n' if '\r\n' in txt else '\n'
    lines = txt.split('\n')
    changed = False
    for i, line in enumerate(lines):
        new = line
        n1 = len(TOK.findall(new)); new = TOK.sub('<archive>', new)
        if 'bbae25d7' in new or '%TEMP%' in new:
            n2 = 0
        else:
            n2 = len(DIRECT.findall(new)); new = DIRECT.sub('<archive>', new)
        n3 = len(BARE.findall(new)); new = BARE.sub('<archive>', new)
        if new != line:
            total['tok'] += n1; total['direct'] += n2; total['bare'] += n3
            if not APPLY and (n2 or n3):
                print(os.path.relpath(f, REPO), i + 1)
                print('  -', line.strip()[:400])
                print('  +', new.strip()[:400])
            lines[i] = new; changed = True
    if changed and APPLY:
        out = '\n'.join(lines)
        # re-read right before writing; abort that file if it changed under us
        if open(f, 'rb').read() != raw:
            print('CHANGED UNDER US, skipped', f); continue
        open(f, 'wb').write(out.encode('utf-8'))
print(total)
