SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\checks\em069_00.mjs'
src = open(SP, encoding='utf-8').read()
body = src[src.index("  const out = [];"):src.index("  return out;\n}\nexport const pageCheck")]
s = open(P, encoding='utf-8').read()
h = s.index("  const duo = async () => {\n") + len("  const duo = async () => {\n")
e = s.index("      return out;\n  };\n  for (const row of await duo()) out.push(row);")
s = s[:h] + body + s[e:]
old = "  // 0x4f with his 7:0x3f, one clock across a loop wrap, a scrub and a pause, his claws and the blends. Its own scope:\n  // it reuses no name above.\n"
assert s.count(old) == 1
s = s.replace(old, "  // 0x4f with his 7:0x3f, one clock across a loop wrap, a scrub and a pause, his claws and the blends; and HER RECORDS on\n  // the combined list (schedule, PSL word, state rows, parts: as on the raw clip; the joined entry per piece), a view file\n  // and the Hit Zones panel on a combined entry. Its own scope: it reuses no name above.\n")
open(P, 'w', encoding='utf-8').write(s)
print('ok')
