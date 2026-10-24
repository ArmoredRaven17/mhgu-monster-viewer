import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
lo, hi = int(sys.argv[1],16), int(sys.argv[2],16)
win = []
masks = {0x1000000,0x2000000,0x4000000,0x8000000,0xf000000,0x3000000,0x6000000,0x7000000,0xe000000,0xc000000}
for a in range(lo, hi, 4):
    ins = list(md.disasm(armdis.TEXT[a:a+4], a))
    s = ('%s %s' % (ins[0].mnemonic, ins[0].op_str)) if ins else '?'
    win.append((a, s)); win = win[-8:]
    m = re.match(r'(tst|ands|bics|teq|cmp|and|ubfx|lsr|bic|sbfx)\S* (\w+), (\w+)(?:, (.*))?', s)
    if not m: continue
    rest = (m.group(4) or '')
    src = m.group(3) if m.group(1) not in ('tst','teq','cmp') else m.group(2)
    hit = False
    if m.group(1) in ('tst','teq','cmp','ands','and','bics','bic'):
        mm = re.search(r'#(0x[0-9a-f]+)', rest if m.group(1) not in ('tst','teq','cmp') else (m.group(3)+','+rest))
        if mm and int(mm.group(1),16) in masks: hit = True
        if 'lsr #0x18' in s or 'lsr #24' in s: hit = True
    else:
        if re.search(r'#0x18', rest): hit = True
    if not hit: continue
    srcs = re.findall(r'r\d+|ip|lr|sb|sl|fp', s.split(' ',1)[1])
    for pa, ps in win[:-1]:
        mm = re.match(r'ldr\S* (\w+), \[\w+, #0x50\]', ps)
        if mm and mm.group(1) in srcs[1:] + ([srcs[0]] if m.group(1) in ('tst','teq','cmp') else []):
            print(hex(a), s, '<-', hex(pa), ps)
