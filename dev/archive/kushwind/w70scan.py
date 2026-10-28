"""kushwind/w70scan.py: candidate writers of a camera's +0x70 vector -- every place in main.text that stores +0x70, +0x74 and +0x78
of one base register within 12 instructions (str / vstr / stm forms), and that base also has +0x40 or +0x60 touched within 80
instructions (a camera's mCameraPos / mTargetPos). Prints the function's nearest push and the window."""
import sys, re, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
T = armdis.TEXT
lo, hi = (int(sys.argv[1], 16), int(sys.argv[2], 16)) if len(sys.argv) > 2 else (0, len(T))
ins = [(i.address, i.mnemonic, i.op_str) for i in md.disasm(T[lo:hi], lo)]
st = re.compile(r'^(v?str)$')
for k, (a, mn, op) in enumerate(ins):
    if not st.match(mn) or not op.endswith('#0x70]'): continue
    base = op.split('[')[1].split(',')[0]
    win = ins[k:k + 12]
    if not all(any(st.match(m) and o.endswith('[%s, #0x%x]' % (base, off)) for _, m, o in win) for off in (0x74, 0x78)): continue
    near = ins[max(0, k - 80):k + 80]
    cam = [x for x in near if x[2].endswith('[%s, #0x40]' % base) or x[2].endswith('[%s, #0x60]' % base) or x[2].endswith('[%s, #0x50]' % base)]
    if not cam: continue
    fn = next((x[0] for x in reversed(ins[max(0, k - 600):k]) if x[1] == 'push' and 'lr' in x[2]), None)
    print('%08x %s %s  fn~%s  camera-field uses %d' % (a, mn, op, hex(fn) if fn else '?', len(cam)))
