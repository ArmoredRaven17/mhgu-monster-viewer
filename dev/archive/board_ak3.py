import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      AND sets the enable word's group; u 120 / u 130; then the shells.\n"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, a + """      DONE 2026-10-15 (Raven: "Yes, build the Carrying control and u 120 / u 130"): #monCarry (Nothing / Pole / Wheel /
      Frame) under Size; HELD_PROP em088_00 -- the rubble glb on joint 130, out of the pose driver (trap 54), shown while the
      play's action keeps e+0xcb0c != 4 (drop rule READ at 0x10b4828: ailments / most reactions / death drop it, the break
      reactions and exhaust keep it); psl-mask em088_00 (carry groups, L2 M30, (10, 0xaf)); 10 clip records exported; u 120
      (always) / u 130 (rage) as class holds with CLASS_HOLD_OFF (L2 M28, death) + schedule.holdRage covering `always`;
      em088_00 on _autoOnRage. NODE TRANSFORM MODE 3 (0x9bbb4c) transcribed in owner.js -- it was killing his runtime on
      rage and on L3 M19; ALSO MODE 2 WAS WRONG (it took the full product's rows; the ROM takes the LOCAL rows + the product's
      translation) -- fixed; for Raven: Khezu's em003_00_006 (mode-2 nodes) may now look different where its attach is
      rotated. NR: whether the draw puts the owner's transform back on a mode-3 node (if his rage glow ever lags when he
      moves). (look) On L2 M4 f140 the held piece sits on the ground ahead -- likely dragged on silk. NEXT, running: the seven
      shells (agent), the silk threads (agent: a two-point owner, ROM as is, no proxies -- Raven 2026-10-15).
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
