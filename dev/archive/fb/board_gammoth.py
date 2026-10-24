p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
nl = b'\r\n' if b'\r\n' in b else b'\n'
anchor = b"        records u 0 / 1 / 2 / 10 / 11 / 12, c 31. Spec dev/em065_00-shells-spec.md." + nl
assert b.count(anchor) == 1, b.count(anchor)
assert b'-- Gammoth (em083_00): ' not in b
note = """      - [x] 2026-10-18 -- Gammoth (em083_00): the aimed ice shot (L2 M61 / M62, aimed X and Y at the target), THE SNOWBALL (L2 M23,
        three picks: made at 220 on joint 157, held, thrown at 266, bursting into sp_01 0 / 1 / 2; at G rank modes 1 / 2 split the frame
        they are thrown -- u 2 at the split, the flight swapped for u 1, one or two sp_00_02 pieces aimed past the target), and the
        stomps' / hit volumes' sp_01 (L2 M5 / M9 / M14 / M15 / M20 / M21 / M37). Any other action drops a held snowball (the setter
        clears e+0xcb0c). Check 28 / 28 (dev/shells-gammoth-check.mjs, controls fail), page 17 / 17, soak 80 motions 0 refused; 12
        records exported. Spec dev/em083-shells-spec.md. Also: base00's Y aim with flag 4 now takes its aim offset (0x3f9e0c --
        yAdjust37 left it off); every shells check re-run, all pass.
      - [ ] (next) Elderfrost Gammoth (em083_04): 04_13, 04_00, sp_00_03, 04_02 (base02), sp_00 mode 4, sp_13 mode 6 (L9 M8), sp_01
        16 / 18 / 26 / 27 / 30 / 31 and the L9 rows (census fb/cen_em083_v4.txt).
"""
note = note.replace('\n', nl.decode()).encode('utf8')
b = b.replace(anchor, anchor + note)
open(p, 'wb').write(b)
print('ok')
