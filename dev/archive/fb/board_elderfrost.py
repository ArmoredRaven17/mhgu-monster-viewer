p = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(p, 'rb').read()
nl = b'\r\n' if b'\r\n' in b else b'\n'
old = ("      - [ ] (next) Elderfrost Gammoth (em083_04): 04_13, 04_00, sp_00_03, 04_02 (base02), sp_00 mode 4, sp_13 mode 6 (L9 M8), sp_01" + nl.decode() +
       "        16 / 18 / 26 / 27 / 30 / 31 and the L9 rows (census fb/cen_em083_v4.txt)." + nl.decode()).encode('utf8')
assert b.count(old) == 1, b.count(old)
new = """      - [x] 2026-10-18 -- Elderfrost Gammoth (em083_04): Gammoth's rows on his files, HIS SNOWBALL (L2 M23, four picks, its own class
        0x16b: held and thrown as Gammoth's, modes 1 / 2 split at EVERY rank into 0x166 pieces, mode 4 thrown along the target's
        bearing clamped to +-80 degrees), L9 M6's sp_01 16 / 18 and its L9 M7 icicles (sp_00_03, 130 degrees either side), L9 M8's
        held / thrown sp_13 6, L9 M11 / M14 / M19 / M23's sp_01, L9 M15's turned shot (sp_00 4: the action setter's e+0xcb10 turn,
        the reader aiming its own request). L9 M17's beam starts no effect: not made. Check 29 / 29 (dev/shells-elderfrost-check.mjs,
        controls fail), page 26 / 26, soak 94 motions 0 refused, dev/checks/em083_04 54 / 0; 20 records exported. Spec
        dev/em083-shells-spec.md.
      - [ ] (open) Elderfrost's snow-armour sp_01 20 (u 62 on joint 157): 0x1060e28 at three actions' frames (tune floats 0x53..0x55;
        callers 0x1058208 / 0x1058428 / 0x1059184), gated by the part table e+0xcb50 (0x1053d8c) and a break check (0x9d36c) -- which
        actions and the gate's state are unread; needs the viewer's armour state as an input.
""".replace('\n', nl.decode()).encode('utf8')
b = b.replace(old, new)
open(p, 'wb').write(b)
print('ok')
