import os, sys
p = r'C:\Coding Repos\MHGU-TASKS.md'
d = open(p, 'rb').read()
METER = sys.argv[1] if len(sys.argv) > 1 else 'metering pending (the page did not load: QUEST_RANKS TDZ in hyperMeatBias, reported)'
A = "- [ ] (feature) **Raging Brachydios's red/orange STATIC effect.**".encode('utf-8')
B = "### Raging Brachydios's on-hit slime eruption \u2014 logged, not started".encode('utf-8')
assert d.count(A) == 1, d.count(A)
assert d.count(B) == 1, d.count(B)
TAG = b'(shells lane 2026-10-25'
if TAG in d:
    raise SystemExit('already noted')
note_static = ("      -> ANSWERED (shells lane 2026-10-25, <archive>\\gapQ\\RESULT.md): em063_05u 10 / 100 / 110 are the SLIME POOLS' records "
               "(base35's ef 0: sp_35 modes 1 / 0 / 4), not a static aura. Built as shells: render/shells.js SHELL_DATA em063_05, "
               "exported `when: shell`; spec dev/em063_00-effects-spec.md 5a.\r\n").encode('utf-8')
note_erupt = ("      -> SHELLS BUILT (shells lane 2026-10-25): the eruption 0xf46234 is sp_01 modes 23..38 at joint 3 / 40 / 50 / 143 (u 210), "
              "fired on the effects lane's Slime Hit fuse burn-out (index.html slimeShellInput -> shellExtra erupt063); the pools (sp_35, "
              "300 / 150 frames, then sp_01 at the spot), the fists' instant explosions, L2 M41 / M42's sp_11 lines, L2 M22's frame-handler "
              "fists, for both Brachydios and Raging. Check: node dev/shells-brachydios-check.mjs (20 / 20). " + METER + ".\r\n").encode('utf-8')
i = d.index(A); j = d.index(b'\n', i) + 1
d = d[:j] + note_static + d[j:]
i = d.index(B); j = d.index(b'\n', i) + 1
d = d[:j] + note_erupt + d[j:]
open(p + '.tmp', 'wb').write(d)
os.replace(p + '.tmp', p)
print('board ok')
