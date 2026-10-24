import zlib, fwread as f
B = chr(92)
idx = {f.u32(0x1594ca4 + 8*i): f.u32(0x1594ca4 + 8*i + 4) for i in range(0x89)}
def jam(s): return (~zlib.crc32(s.encode())) & 0xffffffff
cands = []
for em, v in (('em044','em044_00'), ('em045','em045_04'), ('em045','em045_00'), ('em007','em007_04')):
    for suf in ('_tail', '_head', '', '_beard', '_crown', '_horn', '_hige', '_jaw', '_part', '_option'):
        cands.append('enemy'+B+em+B+v+B+'mod'+B+v+suf)
for o in ('em001_00_option', 'em044_00_option', 'em045_04_option', 'em045_00_option', 'em007_04_option'):
    cands.append('enemy'+B+'em_option'+B+'mot'+B+o)
H = {jam(c): c for c in cands}
for t in ('rModel', 'rMotionList'): H[jam(t)] = t
def res(r):
    if r in (None, 0xffffffff): return '-'
    a = 0x159daa0 + r*8
    return '%s %s' % (H.get(f.u32(a), '?%x' % f.u32(a)), H.get(f.u32(a+4), '?%x' % f.u32(a+4)))
for em in (0x2c, 0x42c, 0x2d, 0x42d, 0x407, 0x7):
    i = idx.get(em)
    print('em %#x -> index %s' % (em, i))
    if i is None: continue
    d = f.u32(0x172ba68 + 4*i)
    ws = [f.u32(d + 4*k) for k in range(8)]
    print('  desc %#x words %s +0xb4 %#x' % (d, [hex(w) for w in ws], f.u32(d + 0xb4)))
    for k in (1, 2):
        print('   word[%d] %s' % (k, res(ws[k])))
    print('   +0xb4', res(f.u32(d + 0xb4)))
