import sys, re, subprocess, collections
lo, hi = sys.argv[1], sys.argv[2]
out = subprocess.run([sys.executable, 'sdis.py', lo, hi], capture_output=True, text=True).stdout.splitlines()
bl = collections.Counter(); vt = collections.Counter(); gots = collections.Counter()
for i, l in enumerate(out):
    m = re.search(r'\b(bl|b)\s+#(0x[0-9a-f]+)', l)
    if m:
        t = int(m.group(2), 16)
        if not (int(lo,16) <= t < int(hi,16)): bl[(m.group(1), hex(t))] += 1
    m = re.search(r'ldr\s+(\w+), \[(\w+), #(0x[0-9a-f]+)\]', l)
    if m and i+1 < len(out):
        # a vtable slot load: next few lines blx/bx that reg
        for k in range(1, 5):
            if i+k < len(out) and re.search(r'\b(blx|bx)\s+' + m.group(1) + r'\b', out[i+k]):
                vt[m.group(3)] += 1; break
    m = re.search(r'GOT (0x[0-9a-f]+) -> (0x[0-9a-f]+)', l)
    if m: gots[m.group(2)] += 1
print('external calls:', sorted(bl.items()))
print('indirect slot offsets called:', sorted(vt.items()))
print('GOT targets:', sorted(gots.items()))
