# romap_duo2.py: the in-repo notes index row for dev/em069-duo-spec.md (re-reads the file; append after the em067 row)
import io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8').read()
assert '`dev/em069-duo-spec.md`' not in s
key = '| `dev/em067-forms-spec.md` |'
i = s.index(key); j = s.index('\n', i) + 1
row = ('| `dev/em069-duo-spec.md` | Seltas Queen + Seltas -- every clip of hers classed combined / solo / release / both / '
       'unresolved (158), her requests (`[+0xcac0]+0x18`) and his event-group-7 answers with motion / blend / time rule, '
       'the link and unlink sites, his claw stage (zeroed at every action start -> part 10), the grab clips (joint-200 '
       'scan), the kill-grab read, the tail-tip correction re-checked, the timing (update order NOT READ) | 2026-10-17 | 43 KB |\n')
s = s[:j] + row + s[j:]
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('ok')
