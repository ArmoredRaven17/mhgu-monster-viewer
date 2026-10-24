P = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(P, 'rb').read()
NL = b'\r\n' if b'\r\n' in b else b'\n'
a = b"the leap's landing splash; check 14 / 14, page 16 / 16, soak 0 refused. Next: the Leviathans."
assert b.count(a) == 1
i = b.index(a) + len(a)
j = b.index(NL, i)
txt = """      - [x] 2026-10-18 -- LEVIATHANS' SHELLS, part 1 (spec dev/leviathan-shells-spec.md). Lagiacrus: all five classes -- the
        thunderballs (13 plays, aimed X / Y, their landing discharges, tired -> 14), the discharges and discharge lines (sp_01 /
        sp_11: the big ball's nine-bolt fan), L4 M2's nine, L4 M36's owner-sized pair (base01 0x800 now built), L4 M8's strike marks
        (NEW base25, made on a timer the census cannot see; each ends in a bolt) and L4 M10's thunder spiral (NEW base26). Check
        39 / 39 (dev/shells-lagiacrus-check.mjs, every child tree, controls fail), page 26 / 26, dev/checks/em046_00 66 / 0; 18
        records. u 61 (L4 M10's discharge) NOT exported: it stops the effect runtime at construct.js 0xae997c (node block +0xbe) --
        for the effects lane. Royal Ludroth: the spits and puddles, check 12 / 12, page 9 / 9. Agnaktor: the lava drips (L2 M2
        tail, L2 M5 chest) gated by the region's heat, its break and G rank; check 22 / 22, page 5 / 5. Nibelsnarf: sp_47 (sand
        plumes) is map / area gated (vt+0x9c, e+0x1054) -- not built, the viewer has no quest map. Next: Mizutsune / Soulseer (sp_12
        bubbles on a NEW base12, sp_13, sp_01, Soulseer's base26).
      - [ ] (bug) Lagiacrus u 61 (sp_01 0 / 1, L4 M10 f160) is held out of docs/effects/em046_00.json: its generator start reaches
        render/rom/effect/construct.js generatorFlags' unread arm 0xae997c ("node block +0xbe") and the runtime stops. Read the arm,
        then re-export (scratchpad fb/export_plain.py em046_00 em046_00u:61).""".replace('\n', NL.decode()).encode('utf8')
b = b[:j] + NL + txt + b[j:]
open(P, 'wb').write(b)
print('ok')
