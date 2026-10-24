import os
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
A50 = ' [derived 2026-10-24: `0xec4890..0xed0834`; rom-map "Alatreon band (derived)"]'
A55 = ' [derived 2026-10-24: `0xed0838..0xedf74c`, the negatives re-run and stand; rom-map "Duramboros band (derived)"]'
E = [
 ('elder-dragon-shells-spec.md', 342, 'band 0xec480c..0xed0a38', 'band 0xec480c..0xed0a38' + A50),
 ('em050_00-effects-spec.md', 33, 'band 0xec480c..0xed0a38.', 'band 0xec480c..0xed0a38' + A50 + '.'),
 ('notice-marks.md', 1045, 'code 0xec480c..0xed0a38,', 'code 0xec480c..0xed0a38' + A50 + ','),
 ('em055_00-effects-spec.md', 38, 'his band `0xed0a38..0xedec14`', 'his band `0xed0a38..0xedec14`' + A55),
 ('em055_00-effects-spec.md', 199, 'anywhere in `0xed0a38..0xedec14`', 'anywhere in `0xed0a38..0xedec14`' + A55),
 ('states-em055_00.md', 8, 'own code `0xed0a38..0xedec14`', 'own code `0xed0a38..0xedec14`' + A55),
 ('states-em055_00.md', 160, 'his code range `0xed0a38..0xedec14`', 'his code range `0xed0a38..0xedec14`' + A55),
]
for f, n, old, new in E:
    p = os.path.join(D, f); raw = open(p, 'rb').read(); L = raw.decode('utf-8').split('\n')
    assert L[n - 1].count(old) == 1, (f, n, L[n - 1][:120])
    L[n - 1] = L[n - 1].replace(old, new)
    open(p, 'wb').write('\n'.join(L).encode('utf-8')); print('ok', f, n)
