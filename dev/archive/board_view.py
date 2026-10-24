import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      State / Charge State (not rage) stay beside it. Checked headless on 7 monster kinds.\n"
assert t.count(a) == 1
t = t.replace(a, a + """- [x] **Every monster opens on List 0 Motion[1]** (Raven, 2026-10-17: "revert the default animation for each monster to L0,
      M1"). DONE: index.html openingView (Motion[1], else its _loop / _start piece); the 32 part-review `view` entries kept
      as the record, no longer used. 86 of 94 large monsters open on L0 M1; 8 have no L0 Motion[1] and open on their first
      clip: Akantor, Ukanlos, Gore, Chaotic Gore, Shagaru, Valstrax (L0 starts at M2), Najarala (M11), Amatsu (no List 0).
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
