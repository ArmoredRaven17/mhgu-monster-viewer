# hookscan.py: every vtable method of Seltas run with him in 1:0x21 (phase 1, linked) and her in 1:0x23 / 1:0x24 -- any
# setMotion, rate change (0xb07b4), action change, link call (0xc2044 / 0xc20f4), or call on her, made from his per-frame side
import struct, json
import tracer as t
import armdis
def rd(va):
    for b, blob in ((armdis.RO_VA, armdis.RODATA), (armdis.DA_VA, armdis.DATA)):
        if b <= va < b + len(blob): return struct.unpack_from('<I', blob, va - b)[0]
cls = 'uEm076_00'; vt = t.CLS[cls]['vtable']
INTEREST = {0xb07b4: 'rate', 0xc2044: 'link', 0xc20f4: 'unlink', 0x9cd6c: 'P+0x3a8 set', 0x9cd84: 'P+0x3a8 clr', 0xc0368: '3a2 clr'}
out = {}
for her in ((1, 0x23), (1, 0x24)):
    for off in range(0, 0x500, 4):
        fn = rd(vt + off)
        if not fn or not (t.CLS[cls]['lo'] <= fn < t.CLS[cls]['hi']): continue
        r = t.run(cls, 1, 0x21, entry=fn, phase=1, link=1, pact=her, extra=[(t.E + 0x7420, b'\1')],
                  sc={'ptest': {her}})
        f = t.fmt(r)
        st = [('%s@%#x' % (INTEREST[s[0]], s[1])) for s in r.get('stubs', []) if s[0] in INTEREST]
        keep = [x for x in f if x.startswith(('MOT', 'CHG', 'PCALL'))] + st
        if keep: out['her %d:%#x vt+%#x %#x' % (her[0], her[1], off, fn)] = keep
print(json.dumps(out, indent=1))
