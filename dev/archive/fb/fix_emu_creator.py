p = 'emu_fb.py'
s = open(p, encoding='utf8').read()
a = """    if depth >= ANS.get('treeDepth', 2): return o     # (a case's treeDepth: Lagiacrus's sp_00 -> sp_01 -> sp_11 -> sp_01)
    for fr in o['frames']:
        for cr in fr['created']:
            b = bytes.fromhex(cr)
            cid = struct.unpack_from('<I', b, 4)[0]"""
b = """    if depth >= ANS.get('treeDepth', 2): return o     # (a case's treeDepth: Lagiacrus's sp_00 -> sp_01 -> sp_11 -> sp_01)
    # a case's `creatorCopy` (2026-10-18): a child whose setup +0x10 names its creator (Chameleos's cloud reads the creator's +0xfec) gets
    # a copy of the creator as its flight left it -- SHELL itself is the next child's by then
    cc = None
    if ANS.get('creatorCopy'):
        cc = S + 0xe0000 + 0x2000 * depth
        uc.mem_write(cc, bytes(uc.mem_read(SHELL, 0x1800)))
    for fr in o['frames']:
        for cr in fr['created']:
            b = bytes.fromhex(cr)
            if cc is not None and len(b) >= 0x14 and struct.unpack_from('<I', b, 0x10)[0] == SHELL:
                b = b[:0x10] + struct.pack('<I', cc) + b[0x14:]
            cid = struct.unpack_from('<I', b, 4)[0]"""
assert s.count(a) == 1
s = s.replace(a, b)
a = "    ANS['slotSelf'] = bool(c.get('slotSelf'));"
assert s.count(a) == 1
s = s.replace(a, "    ANS['creatorCopy'] = bool(c.get('creatorCopy'))\n" + a)
open(p, 'w', encoding='utf8').write(s)
print('ok')
