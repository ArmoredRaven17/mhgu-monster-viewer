"""kushwind/bit3scan.py <asm>..: node-instance +0x10c bit 3 readers. Tracks a pointer left by `ldr rX, [rB, #0x108]!` (then +0x10c is
[rB, #4]) and direct `[rB, #0x10c]` loads; reports the loaded register's next test of bit 3 (tst #8 / ands #8 / ubfx #3 / lsl #0x1c
/ lsr #3) within 24 instructions, register redefinition ending the track. Control: the mode field `ubfx #0x10, #4` is reported too."""
import re, sys
for path in sys.argv[1:]:
    L = [l.rstrip() for l in open(path)]
    for i, l in enumerate(L):
        m = re.search(r'ldr\s+(\w+), \[(\w+), #0x108\]!', l)
        bases = []
        if m: bases.append((m.group(2), '#4'))
        m2 = re.search(r'ldr\s+(\w+), \[(\w+), #0x10c\]', l)
        loaded = {}
        if m2: loaded[m2.group(1)] = l
        for k in range(1, 25):
            if i + k >= len(L): break
            t = L[i + k]
            for b, off in bases:
                mm = re.search(r'ldr\s+(\w+), \[' + b + r', ' + off + r'\]', t)
                if mm: loaded[mm.group(1)] = t
            for reg, src in list(loaded.items()):
                if re.search(r'\b(tst|ands|ubfx|lsl|lsr|and|bic|bics|teq)\b\s+\w*,?\s*' + reg + r'\b', t) or re.search(r'\btst\s+' + reg + r',', t):
                    if re.search(r'#8\b|#0x8\b|#3, #1|lsl #0x1c|#0x10, #4|#0x1c', t):
                        print(path, '|', l.strip(), '|', src.strip(), '|', t.strip())
                    del loaded[reg]
                elif re.match(r'\s*\w+\s+\w+\s+' + reg + r',', t.split('  ',1)[-1] if False else t[10:]):
                    pass
