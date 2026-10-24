import os, re, collections
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\archive'
P = re.compile(r'[A-Za-z]:[\\/]+[A-Za-z0-9_.\\/ -]+')
c = collections.Counter(); mods = collections.Counter()
for r, d, fs in os.walk(R):
    for f in fs:
        if not f.endswith(('.py', '.mjs', '.sh', '.js')): continue
        t = open(os.path.join(r, f), encoding='utf-8', errors='replace').read()
        for m in P.findall(t):
            parts = [x for x in re.split(r'[\\/]+', m) if x]
            c['/'.join(parts[:3]) if 'Temp' not in m else '<a temp scratchpad>'] += 1
        for m in re.findall(r'^\s*(?:import|from)\s+([A-Za-z_][\w]*)', t, re.M): mods[m] += 1
for k, v in c.most_common(25): print(v, k)
print([m for m in mods.most_common(40)])
