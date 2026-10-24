import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      clip: Akantor, Ukanlos, Gore, Chaotic Gore, Shagaru, Valstrax (L0 starts at M2), Najarala (M11), Amatsu (no List 0).\n"
assert t.count(a) == 1
t = t.replace(a, a + """      Raven 2026-10-17: "Update Tigrex to use L0, M25 as its default; I will be making adjusts, I simply wanted to restore the
      base line after finding out some animations I thought were better defaults were things like exhausted animations before
      effects were in place". DONE: part-review `opening: {list, clip}` (new field, apart from the old `view`), Tigrex L0 M25.
      - [ ] (idea) Raven's further opening-clip adjustments go in part-review `opening`.
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
