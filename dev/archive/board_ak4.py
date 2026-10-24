import os
p = r'C:\Coding Repos\MHGU-TASKS.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw; t = raw.decode('utf-8').replace('\r\n', '\n')
a = "      shells (agent), the silk threads (agent: a two-point owner, ROM as is, no proxies -- Raven 2026-10-15).\n"
assert t.count(a) == 1, t.count(a)
t = t.replace(a, a + """      SHELLS DONE 2026-10-15 (agent; dev/shells-ahtal-check.mjs 72/72 vs unicorn runs of the base code): shell57 the thrown /
      dropped / pulled piece (draws its rubble model; throw on L2 M17 f160, pull on L2 M19 / M37 f92 from the spot a previous
      throw or drop left -- refused by name without one), shell60 / 61 the web anchors (plant, fly with the spike, hang,
      release), shell00 the silk ball (event-table driver on L2 M26), shell01 the arena silk lines (L2 M33). NOT WIRED:
      shell48 the ballista balls (the ROM fires them when a HUNTER cuts a silk line -- no hunters in the viewer; ready behind a
      "cut line k" input if Raven wants it), shell58 (draws nothing). 21 shell records exported; recording + lift queued.
      Web threads u 341: anchors now exposed (webAnchors088); their START e+0xd410 has no writer found -- read assigned.
      Ahtal-Neset: enable word transcribed (base | 0xff8000); 0xaaeb90 / 0xa996b0 (all 34 refusals) queued for lift.
""")
open(p + '.tmp', 'wb').write((t.replace('\n', '\r\n') if crlf else t).encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
