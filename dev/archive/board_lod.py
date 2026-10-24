P = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(P, 'rb').read()
nl = b'\r\n' if b'\r\n' in b else b'\n'
lines = b.split(nl)
i = next(k for k, l in enumerate(lines) if b"**Effects: Nibelsnarf's unrecorded branch 0xa92798**" in l)
j = i + 1
while j < len(lines) and lines[j].startswith(b'      '):
    j += 1
add = [
 "      CURED HEADLESS 2026-10-17 (effects-recording agent), awaiting Raven's look: the diagnosis above was WRONG -- the",
 "      branch at 0xa92794 tests 0xa718b8's DISTANCE-LOD mask, not the list (the live-particle list was non-empty in every",
 "      set). Camera >= 2000 from a level-0..2 model generator gives mask 1 / 3; the recorder's camera sat 1000 away. Sets",
 "      add_em056_00_u20_lodmid/_lodfar and add_em057_00_u530/u531_lodmid/_lodfar (CAMERA_AT 0,0,3500 / 0,0,7000), plus",
 "      0xaef400 + 5 callees lifted (Zinogre's next refusal). Soaks: em056_00 71/0 refused, em057_00 78/0, em057_04 84/0;",
 "      nibel2 clean through L3 M19. Map: rom-map rows 0xa92798 / 0xaef400, WITHDRAWN row, trap 72.",
]
lines[j:j] = [a.encode('utf-8') for a in add]
open(P, 'wb').write(nl.join(lines))
print('board: appended after line', j)
