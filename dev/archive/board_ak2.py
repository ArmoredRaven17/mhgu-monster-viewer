import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      (effect\\base\\em088_00_100..104, em087 rubble) (agent).\n"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, a + """      LATER: enable word READ (dev/em088_00-effects-spec.md): e+0xcb0c is the CARRIED OBJECT -- 0 / 1 / 2 / 4 none -- picking bits
      18-20 / 21-23 / 15-17 on every motion (the viewer fires all three today); L2 M30 / (10, 0xaf) action arms. Ahtal-Neset's
      word = base | 0xff8000 on every motion (96 bindings in). Class records: u 120 (always alive) + u 130 (enraged), held --
      showable now; ~25 silk-thread records (stretched joint -> object / web anchor / Neset joint) need a two-point stretched
      owner and positions. PROPS (dev/em088-shells-props-spec.md): the carried objects are Ahtal-Neset's rubble -- rubble_01
      the spiked pole (broken Dragonator), _02 a wheel, _03 a broken siege frame (names INFERRED from shapes + sound names) --
      held on JOINT 130 by uEm088_Rubble while e+0xcb0c != 4 (glbs already staged); thrown / dropped as shell57 (base57 sets
      the shell's model to the rubble). Shells: 00 (silk ball), 01 (arena silk), 48 (ballista balls), 57 (the thrown piece),
      58, 60 / 61 (web anchors) -- bases 48 / 57 / 58 / 60 / 61 are NEW; 00 / 01 have own overrides; an event-table driver is
      needed. Ahtal-Neset's rubble should parent to Neset joints 130 / 131 / 132 (the viewer fans it beside him).
      PLAN (proposed to Raven): a "Carrying" control (Nothing / Pole / Wheel / Frame) that mounts the held piece on joint 130
      AND sets the enable word's group; u 120 / u 130; then the shells.
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
