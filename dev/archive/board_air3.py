import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      Seregios's shells now see 985.5 on L1 M1 (c 30 deleted every pulse), 784.8 on L1 M5 f46 (c 32 kept), 0 on L1 M4.\n"
assert t.count(a) == 1
t = t.replace(a, a + """      THE LOW HOVER (read 2026-10-17, dev/air-height.md 5): the common in-game hover is POSTURE 3 -- the unit pinned to the
      ground every frame, the body drawn FlyOfs x S + P+0x5c x m above it -- so the hover dust's 900 test sees 0 and the dust
      always spawns there. Per-clip rows for the Rath line (L1 M2 / M4 / M11 / M12, L2 M10 / M11 / M12, L4 M25 / M26 / M27;
      Dreadking L4 M25 body 400 up, unit on the ground); L1 M1 stays the high hover (985.5 x ...). Seregios L1 M2 posture 3
      too (his P+0x5c not read). Not shown: L1 M1's (4, 3) descent, the AI's pick of actions.
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
