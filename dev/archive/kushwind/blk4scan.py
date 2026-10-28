"""kushwind/blk4scan.py <asm>..: readers of a node BLOCK's word +4 (the node instance's +0x104 -> [blk, #4]) and what they test of it
(any immediate): a register-tracked window of 30 instructions. Control: the node init 0xae83c8's bit-0 / 1 / 4 / 5 / 16 / 17 uses."""
import re, sys
for path in sys.argv[1:]:
    L = [l.rstrip() for l in open(path)]
    for i, l in enumerate(L):
        m = re.search(r'ldr\s+(\w+), \[(\w+), #0x104\]$', l.strip())
        if not m: continue
        blk = m.group(1); words = {}
        for k in range(1, 31):
            if i + k >= len(L): break
            t = L[i + k].strip()
            mm = re.search(r'ldr\s+(\w+), \[' + blk + r', #4\]', t)
            if mm: words[mm.group(1)] = t; continue
            for w in list(words):
                if re.search(r'\b(tst|ands|and|ubfx|lsl|lsr|bic|teq|cmp)\b.*\b' + w + r'\b', t):
                    print('%s | %s | %s | %s' % (path.split('/')[-1], l.strip(), words[w], t))
                    del words[w]
            if re.search(r'^\S+\s+\w+\s+' + blk + r',', t) and not t.split()[1].startswith(('str', 'cmp', 'tst')): break
