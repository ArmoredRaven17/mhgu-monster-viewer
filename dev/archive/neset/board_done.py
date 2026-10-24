import os
P = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(P, 'rb').read(); NL = b'\r\n'
o = (b"      - [ ] (pending) Shell records for Gravios, Tigrex, Grimclaw, Akantor, Barioth, Seregios, Barroth, Uragaan, Crystalbeard," + NL +
     b"        Glavenus, Hellblade, Kut-Ku, Gypceros, Iodrome, Giadrome, Garuga, Deadeye and Diablos: exported and being recorded" + NL +
     b"        2026-10-20; lift, soak and the draw meter follow.")
assert b.count(o) == 1
n = (b"      - [x] 2026-10-20 -- SHELL EFFECTS for Gravios, Tigrex, Grimclaw, Akantor, Barioth, Seregios, Barroth, Uragaan, Crystalbeard," + NL +
     b"        Glavenus, Hellblade, Kut-Ku, Gypceros, Iodrome, Giadrome, Garuga, Deadeye and Diablos are in: 134 records, 107 measured" + NL +
     b"        drawing. Two of Grimclaw's start but the game gives them nothing to draw. 24 need something the viewer has no setting for" + NL +
     b"        (a wall or a hunter to hit, Tigrex's fourth ground type, a broken head, low rank) or never fire in the game. The draw meter" + NL +
     b"        also found two shells that vanished on their first frame -- Crystalbeard's L9 shards and Tigrex's dust; both fixed.")
b = b.replace(o, n)
open(P + '.tmp', 'wb').write(b); os.replace(P + '.tmp', P); print('ok')
