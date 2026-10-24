p = r'C:\MHGU-Extract\efx\proofunit.py'
s = open(p, encoding='utf8', newline='').read()
a = """    for u, _ in list(x.proof_units):                 # update pass
        e.poke32(u + 0x1c, struct.unpack('<I', struct.pack('<f', DT))[0])
        w = e.u32(u + 0xc)
        if w & 7 == 1:"""
b = """    for ent in list(x.proof_units):                  # update pass (the walker 0xc044c4, in the line's order)
        u = ent[0]
        e.poke32(u + 0x1c, struct.unpack('<I', struct.pack('<f', DT))[0])
        w = e.u32(u + 0xc)
        # THE UNIT'S END, AS THE WALKER DOES IT (READ 2026-10-18, 0xc04568..0xc04600; the Elder Dragon effects lane, with the
        # coordinator's go-ahead): a unit found at state 4 is put to state 0 (bfc), unlinked (0xc0462c) and destroyed (vt+4,
        # 0xc045e0..0xc04600); one found at state 3 is only moved to 4 (0xc045c0, with 0xc04150 taking it off the manager's
        # lists -- not modelled) -- so a unit that ends in a frame is destroyed TWO update passes later, and the core's walk
        # reaps it in between. This used to destroy it at the end of the frame it ended in, and a stop the class requested
        # the next frame (0x329c40 -> 0x329904, vt+0x128) walked the corpse -- vtable wound back to cUnit 0x17828bc, +0x128 = 0:
        # blx 0 ran the static initialisers and the DTI self-link made 0x7abfb8 loop for ever (Kirin u 60, Amatsu u 1120
        # stopped at 60). Slot 1, not 0, as before: the heap half of the delete is not run (a bump allocator).
        if w & 7 == 4:
            e.poke32(u + 0xc, w & ~7)
            x.proof_units.remove(ent)
            _vcall(x, u, 4, (), 'unit %#x dtor' % u)
            continue
        if w & 7 == 3:
            e.poke32(u + 0xc, (w & ~7) | 4)
            continue
        if w & 7 == 1:"""
assert s.count(a) == 1
s = s.replace(a, b)
a = """    for ent in [t for t in x.proof_units if e.u32(t[0] + 0xc) & 7 == 3]:
        x.proof_units.remove(ent)
        _vcall(x, ent[0], 4, (), 'unit %#x dtor' % ent[0])"""
b = """    #   NOW IN THE UPDATE PASS ABOVE (2026-10-18): the walker's state 3 -> 4 -> destroyed, two passes after the end."""
assert s.count(a) == 1
s = s.replace(a, b)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
