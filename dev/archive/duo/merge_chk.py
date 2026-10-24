SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\checks\em069_00.mjs'
src = open(SP, encoding='utf-8').read()
a = src.index("  const out = [];")
b = src.index("  return out;\n}\nexport const pageCheck")
body = src[a:b]
s = open(P, encoding='utf-8').read()
h = s.index("  const duo = async () => {\n") + len("  const duo = async () => {\n")
e = s.index("      return out;\n  };\n  for (const row of await duo()) out.push(row);")
s = s[:h] + body + s[e:]
# the block's heading: the layout it now checks
old = "  // a reload / list change / the joined clip, HIS OWN DECISION LOOP under her plain clips (seeded, reproducible on a\n"
i = s.index(old)
j = s.rfind("\n  //", 0, i)
# find the start of the comment paragraph above `const duo`
k = i
while True:
    prev = s.rfind("\n", 0, k - 1)
    line = s[prev + 1:k]
    if not line.startswith("  //"):
        break
    k = prev + 1
head = s[k:s.index("  const duo = async () => {\n")]
new_head = """  // ---- THE SELTAS DUO (dev/em069-duo-spec.md, dev/rom-map.md 'Seltas duo'). Her raw lists 0/3/4 play her ALONE (Raven,
  // 2026-10-17); one combined list ('duo', "Combined (with Seltas)") carries every animation the ROM plays with him: her
  // required clips, the joined S. Motion[76]-[79], her request-7 clips where he LEAVES her (released into world space at
  // her frame 0: his root stops following joint 200; M46 then M47; glow off), his own clips, and her both clips with him
  // on his own seeded decision loop. Every entry is swept for its ROM pair; then the pairs at live frames, a list change
  // in flight, THE GRABS (his root in her pincers frame by frame, the M78/M79 freeze on his M79 frame 6), her 7:0x4e /
  // 0x4f with his 7:0x3f, one clock across a loop wrap, a scrub and a pause, his claws and the blends. Its own scope:
  // it reuses no name above.
"""
s = s[:k] + new_head + s[s.index("  const duo = async () => {\n"):]
open(P, 'w', encoding='utf-8').write(s)
print('replaced head:\n' + head)
