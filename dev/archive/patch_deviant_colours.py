import os, re
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')
p = 'docs/index.html'
b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')

old_head = """    // THE SECOND COLOUR OF EACH DEVIANT'S PIGMENT. Raven, 2026-10-10: "for the ones that have colors they can select, use
    // the second color". Every Deviant unlocks a two-colour special pigment for armour (Color_Special_1..18, unlock bits
    // +0xd18); the pairs are the ROM's own table, built at runtime by 0x560bd4 and read by 0x55f474(table, id - 2, which)
    // with which = 1 the second colour, u32 0xAABBGGRR (red in the low byte, 0x5daad4) -- extracted by emulation
    // (task board, Armor Viewer "Deviant Pigments"). All 18 have one, so all 18 take its second colour here.
    // GRIMCLAW AND BOLTREAVER ARE SWAPPED from the table's order (11 Grimclaw #93F8FF, 16 Boltreaver #9CD3FF): Raven,
    // 2026-10-10, "Switch Boltreaver and Grimclaw colors".
"""
new_head = """    // THE CHALLENGE APPS' OWN DEVIANT COLOURS (MHGU Challenge Run docs/app.js COLORS -- the same list as the Zenny
    // Gauntlet's). Raven, 2026-10-15: "Challenge App colors, like I had specified", having made "some exceptions to that
    // since I wanted some themes that matched the monster icon more" -- they are hand-picked, not the ROM's pigments.
    // [Until 2026-10-15 this table held the second colour of each Deviant's special armour pigment (the ROM's pairs,
    // 0x560bd4 / 0x55f474; dev/deviant-pigment-mapping.md), from a misreading of "for the ones that have colors they can
    // select, use the second color" as overriding the Challenge Apps; Grimclaw and Boltreaver had been swapped to match
    // the Challenge Apps' blue / cyan, which these colours now give directly.]
"""
assert s.count(old_head) == 1
s = s.replace(old_head, new_head)

COL = {"em060_04": "#CE2A20", "em061_04": "#8E6BC4", "em019_04": "#E8776E", "em001_04": "#4A2A66", "em066_04": "#D07A20",
       "em037_04": "#7A858E", "em045_04": "#CFAE44", "em018_04": "#3F7A2E", "em002_04": "#3E0C05", "em057_04": "#C79A1C",
       "em032_04": "#3070D0", "em080_04": "#D25A18", "em079_04": "#07143C", "em020_04": "#5E9CC8", "em082_04": "#DC6F9E",
       "em081_04": "#22D3DB", "em083_04": "#B8C6CE", "em007_04": "#1E2440"}
i = s.index('const DEVIANTS = {'); j = s.index('};', i)
blk = s[i:j]
n = 0
for em, hexv in COL.items():
    blk, k = re.subn(r'(%s: \["[^"]+", )"#[0-9A-Fa-f]{6}"' % em, r'\g<1>"%s"' % hexv, blk)
    n += k
assert n == 18, n
s = s[:i] + blk + s[j:]
if crlf: s = s.replace('\n', '\r\n')
open(p, 'wb').write(s.encode('utf-8'))
print('ok', n)
