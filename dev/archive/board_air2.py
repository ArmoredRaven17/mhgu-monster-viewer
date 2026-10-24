import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      (gid 0) as ownerPos where the ROM uses the unit P+0x40 (rom-map trap 67). Both await Raven's call (2026-10-16).\n"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, """      (gid 0) as ownerPos where the ROM uses the unit P+0x40 (rom-map trap 67). DONE 2026-10-17 (Raven: "Do both, follow
      the ROM"): Grid Floor on air clips = clip origin - H (motion-states.js AIR_HEIGHT: Rath line, Seregios incl. L1 M4
      posture 3 and L1 M5 ledge climb, Malfestio, Astalos); shells take the unit as ownerPos (index.html unitGamePos).
      Seregios's shells now see 985.5 on L1 M1 (c 30 deleted every pulse), 784.8 on L1 M5 f46 (c 32 kept), 0 on L1 M4.
- [ ] Air height for the OTHER flyers: their takeoff curve is not read (FlyOfs is, .dtb +0x22, all monsters), so Khezu,
      Diablos, Kut-Ku, Gypceros, Garuga, Kushala, Teostra, Tigrex, Nargacuga, Barioth, Akantor, Ukanlos, ... keep the
      lowest-reach floor. Read each class's standard takeoff curve (dev/air-height.md method) and add AIR_HEIGHT rows.
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
