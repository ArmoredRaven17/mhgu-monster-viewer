import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      L1 M5 f46: 920.6) -- rom-map trap 65. Whether the game's arena floor gives the same answer is not read.\n"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, a + """      READ 2026-10-16 (dev/air-height.md): on an AIR list the clip origin IS the unit; the ground is H below it, set by
      state: the lift into posture 1 adds FlyOfs x size (.dtb +0x22: Seregios / Rath / Astalos 500, Malfestio 300) and the
      standard takeoff curve adds +485.5 (unscaled) -> H = 985.5 for Seregios / Rathian / Astalos, 785.5 Malfestio. The Grid
      Floor's lowest-reach rule sits too high on air clips (Seregios L1 M1 -702 vs -985.5). Game: c 30 deleted on every
      L1 M1 pulse; c 32 on L1 M5 f46 KEPT (~785) where the viewer deletes it. SECOND BUG: the viewer hands shells the hips
      (gid 0) as ownerPos where the ROM uses the unit P+0x40 (rom-map trap 67). Both await Raven's call (2026-10-16).
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
