"""insgrep.py lo hi regex [ctx] -- word-by-word ARM disassembly of main.text [lo, hi) (capstone stops at data otherwise),
print every instruction whose 'mnemonic op_str' matches regex, with ctx instructions before it. (hyper audit, 2026-10-28)"""
import sys, re, capstone
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
lo, hi, rx = int(sys.argv[1], 16), int(sys.argv[2], 16), re.compile(sys.argv[3])
ctx = int(sys.argv[4]) if len(sys.argv) > 4 else 0
win = []
for a in range(lo, hi, 4):
    s = next((f'{i.mnemonic} {i.op_str}' for i in md.disasm(T[a:a + 4], a)), '.word')
    win.append((a, s)); win = win[-(ctx + 1):]
    if rx.search(s): print(' ; '.join(f'{x:x}: {y}' for x, y in win))
