# status_fill.py: write the final Status cell of each row of dev/effects-open-items.md and the "Closed in this sweep" list
import io, re
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\effects-open-items.md'
t = io.open(P, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in t else '\n'
C = 'CLOSED 2026-10-19'
S = {
 'X3': C + ' (set: the rage timer\'s end pending, `0xc983c`; the clear NR)',
 'X7': C + ' (bit 4 = the stun family, set / cleared by changeAction; P+0x5cde / P+0x59c NR)',
 'X8': C + ' (bit 1 = the first hit-ailment accumulator, I poison) -> c: a "Poisoned" toggle',
 '2': C + ' (`0x6fa58`)', '3': 'superseded (rom-map `0xcf15c8` sel 0xe: g1 s224 / s235)', '5': C + ' (`0xceebe4..`)',
 '7': C + ' ((7, 0x48 / 0x49) follows; (7, 0x30) / (3, 0x43) area points -> a; (7, 0x3b) named)',
 '9': C + ' (`0x326010`: nothing made)', '13': C + ' (`0x7fba0` / `0xd32a00`: Bloodbath only; op 0x20 / 0x14 READ)',
 '14': C + ' ((6, 2) unreachable, named; `0xd3c4a0` = (6, 0xf..0x2c))', '15': C + ' (ctl+0x68: (7, 0xb4..0xb8) timer)',
 '16': 'superseded (spec 2.5, 2026-10-14)', '18': C + ' (sUnit `0xc04728`: +0x24 before +0x28 -> no c 1105)',
 '19': 'superseded (rom-map latch rows, 2026-10-17)', '21': C + ' (all writers shared)', '22': C + ' ((1, 0x0e) g13 s0; g13\'s starter NR)',
 '23': C + ' (`0xc044c4`: frame step x line rate)', '24': C + ' (aerial turns, table `0x16a190c`)', '25': C + ' (named, controlled)',
 '26': C + ' (`0xfdf7b4..`)', '28': C + ' ((6, 3) named, controlled)', '29': C + ' (-2000)', '30': C + ' (`0xe76e7c`; (6, 6) -> (11, 0x26))',
 '31': C + ' ((2, 0x15))', '32': 'open (b, deferred: the states notes\' readings stand)', '33': C + ' (op 0x69 has no test)',
 '34': C + ' ((7, 0 / 3 / 0xe / 0xf) phase 1)', '35': 'superseded (rom-map `0x75330`)',
 '36': C + ' (op 0x69 / op 0x6f READ; groups 8 / 12 / 13 / 18\'s starters NR)', '37': 'open (b, deferred)',
 '38': 'partly ' + C + ' (14 of 45 sites by action; the rest behind stubbed gates)', '39': C + ' (no caller, controlled)',
 '40': C + ' (`__aeabi_memclr8`)', '41': C + ' (the streams; (7, 0x15 / 0x98 / 0xa2 / 0xa6) named)', '43': C + ' (site by site)',
 '44': C + ' (named, controlled)', '45': C + ' (op 0x80 has no test)', '46': C + ' (a no-repeat gate on e+0x73b2)',
 '47': C + ' (fires at frame 18) -> c: a start-frame field', '48': 'partly ' + C + ' (op 0x14 / 0x6f / 0x92 READ; the rest walked both ways)',
 '50': 'superseded (rom-map `0xff27cc`, the shells lane)', '51': C + ' (area byte / map byte) -> a', '52': C + ' (the counter; layer flag bit 0 NR)',
 '54': 'superseded (em057 spec 10)', '58': C + ' (the sleep family sets P+0x5e08 bit 0)', '61': 'partly: the sleep bit READ (X7 row); which arm of `0xa4518` requests c 1102: NR',
 '63': C + ' (ctl+0x30 by the starting action; P+0x1bb bit 0 the carry flag)', '64': C + ' (no status-10 case)',
 '65': C + ' and WIRED (`{ ahead: 530 }`, index.html fireAt; em067_00 check)', '67': 'partly: e+0xd408 superseded; anchors +4 / release NR',
 '68': 'partly: `0x329c9c` / `0x7db70` superseded; `0x8a4dfc` NR', '69': 'partly ' + C + ' (the file\'s issuers; the odd ones NR)',
 '70': 'open (b, deferred)', '71': 'open (b, deferred)', '73': C + ' (sets 9 / 10 are Shogun\'s; never Rustrazor\'s)',
 '77': C + ' (op 1 sets no motion: the Kushala row)', '78': C + ' (a global\'s per-area timed slots) -> a',
 '80': 'superseded (READ + wired 2026-10-18; rom-map / spec / check recorded 2026-10-19)', '82': 'superseded (em050 spec 5)',
 '83': 'superseded (rom-map `0xf091ac`)', '87': 'open (b, deferred: the arms are their own units -- dev/em084-*.md)',
}
out = []
for line in t.split(nl):
    m = re.match(r'\| (X\d|\d+) \|', line)
    if m and m.group(1) in S:
        cells = line.split(' | ')
        cells[-1] = S[m.group(1)] + ' |'
        line = ' | '.join(cells)
    out.append(line)
t = nl.join(out)
io.open(P, 'w', encoding='utf8', newline='').write(t)
left = [l for l in t.split(nl) if 'see below' in l]
print('rows still "see below":', len(left))
for l in left: print(l[:100])
