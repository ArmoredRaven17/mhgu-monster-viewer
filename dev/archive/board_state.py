import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "## Monsters (`MHGU-Monster-Viewer`, built 2026-09-04, deployed as TEST)\n"
assert t.count(a) == 1
t = t.replace(a, a + """- [x] **One State dropdown: Normal / Enraged / Exhausted** (Raven, 2026-10-17: "we have been inconsistent ... I would like
      the drop down for these three states since typically a monster cannot be Normal ... Enraged or Exhausted at the same
      time"; "Normal" replaces "calm"). DONE 2026-10-17: index.html monStateRow / paintStateSelect -- Normal, then Enraged
      (or the rage's review name, e.g. Raging Brachydios "Red Slime"; or, where rage has levels, each level: Gore
      Magala Level 1..Max), then Exhausted where the monster tires. The old toggles and the rage-level dropdown stay as
      folded state holders driven through their own handlers. Mizutsune / Soulseer keep their own State rung; Bloodbath
      State / Charge State (not rage) stay beside it. Checked headless on 7 monster kinds.
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
