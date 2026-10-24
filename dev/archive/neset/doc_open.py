# doc_open.py: Neset's open reads closed (the rate, the order, the bss lists, the selectors, the state) -- rom-map rows + a WITHDRAWN
# entry for my own "vt+0x1dc" / INFERRED claims, and the spec
import os
NL = b'\r\n'
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
b = open(P, 'rb').read()
i = b.find(b"| Neset's sp_00 BUILT (shells agent 2026-10-20)"); assert i >= 0
j = b.find(NL, i)
rows = [
 b"| Neset's open reads CLOSED (shells agent 2026-10-20) | **THE ORDER**: his vt+0x2a8 `0x10a57d0` runs the walker `0x6c590` FIRST, then the six "
 b"controllers' `0x1217a58` (`0x10a5828..0x10a586c`) -> a controller set on frame F fires its kind-14 row (f0) on F + f0. **THE RATE**: vt+0x78 "
 b"`0x72630` -> `0x951678(unit, layer, motion, flags, s0 blend -> +0x4f0 / +0x4f4, s1 start, s2 -> +0x50c)`; the layer step loads +0x50c "
 b"(`0x94ed08`) and advances its frame +0x4fc by dt x it (`0x94ee24`, `0x94eee8..0x94ef08`). The controller: start 0x20a + 3k at 1.7 / 0.6 / "
 b"1.2, loop 0x20b + 3k for 9 / 12, end 0x20c + 3k at 1.0 (`0x1217e08`) -> motion 2 about 166..170 frames, motion 3 about 105..107 (his L2 "
 b"M10..M27: 77 / 79, ends 29): no shot is cut. **THE STATE** e+0xccf8[k]: zeroed at the action start (vt+0x204 `0x10a7198..`), 1 / 2 by the "
 b"action-start pre-pass vt+0x478 `0x10ab508` (from `0x6d074`) for type 12 / 13 rows when 0; his shot rows' objects have none -> 0. **THE "
 b"8 RUN-TIME LISTS** (table idx 1 / 4 / 6 / 24 / 25 / 27 / 44 / 45 -> 0x2132a28 + 0x2c i): zero-filled statics -- every static initialiser "
 b"run with a write hook (the TU's own `0x10aee1c` / `0x10af450` write 0x2132970..0x21329c4 / 0x21329d0..0x2132a24: the control) leaves "
 b"them 0, and the only pointers to them are the table's own (a GOT scan of 0x2132900..0x2132c00): EMPTY, nothing fires from them. **THE "
 b"SELECTORS 17 / 28 / 35..38 / 62..65**: rows in his table, but no a3 (0, n) of his .emc names them (emcpair087.txt) and e+0xcac8's only "
 b"other writers are the ctor (`0x6c3c8`: 0xff) and the state copy `0x6d4fc` (117 movw sites scanned): never selected | uEm087_00 | R | "
 b"shells.js objects087's comment; spec 3D |",
]
b = b[:j] + NL + NL.join(rows) + b[j:]
# my own claims, withdrawn (the clock's caller, and the INFERRED order / end)
anchor = b"| rom-map row \"em032 consequence\""
k = b.find(anchor); assert k >= 0
wd = (b"| rom-map row \"Neset's sp_00 BUILT\" (shells agent, 2026-10-20, same day): \"`0x1217a58` (vt+0x1dc, every update)\"; \"the sequence's own end "
      b"not modelled (INFERRED long enough)\"; the clock-before-the-walker order INFERRED | `0x1217a58`'s callers are `0x10a5830..0x10a586c`, inside "
      b"his vt+0x2a8 `0x10a57d0`, AFTER the walker; vt+0x1dc is `0x10a4bdc` (the rocket cooldown) | the order and the rate are READ (row "
      b"\"Neset's open reads CLOSED\"); the shot frames (set + f0) stand, now READ |" + NL)
b = b[:k] + wd + b[k:]
open(P + '.tmp', 'wb').write(b); os.replace(P + '.tmp', P)
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\ahtal-neset-shells-spec.md'
b = open(P, 'rb').read()
o = b"Also open: the 8 event lists built in bss at run time (idx 1 / 4 / 6 / 24 / 25 / 27 / 44 / 45), the selectors with no row (17, 28,"
assert b.count(o) == 1
i = b.find(o); j = b.find(NL + NL, i)
b = b[:i] + (b"CLOSED 2026-10-20 (shells agent; rom-map row \"Neset's open reads CLOSED\"):" + NL +
 b"- The 8 table lists in bss (idx 1 / 4 / 6 / 24 / 25 / 27 / 44 / 45) are zero-filled statics that nothing writes, so nothing fires from them." + NL +
 b"- The selectors 17 / 28 / 35..38 / 62..65 have rows, but nothing in his EMC selects them." + NL +
 b"- The object types 8 / 12 / 13 are read (3D)." + NL +
 b"- Still not read: type 7 (`0x10a5680`, a class action, not a shell) and type 15 (the kind gate on e+0xcb02 / 0xc44c70).") + b[j:]
o = b"- **Stand-ins, named:** the clock is the clip frames since the set. Each controller's own sequence (its layer's start, hold and end"
i = b.find(o); assert i >= 0
j = b.find(NL + b"- **Draws (the meter):** u 90 draws", i)
b = b[:i] + (b"- **The order and the rate are READ (2026-10-20, later).**" + NL +
 b"  - His vt+0x2a8 runs the walker before the six controllers' clock updates, so a shot is exactly the set frame plus f0." + NL +
 b"  - The start motion's rate (1.7 / 0.6 / 1.2) is the layer's playback speed (+0x50c x dt)." + NL +
 b"  - So the sequences run about 166..170 (motion 2) and 105..107 (motion 3) frames, past every row's f0." + NL +
 b"  - The objects' state e+0xccf8 is 0 for the shot rows. Only type 12 / 13 rows set it (at the action start), and the shot rows' objects" + NL +
 b"    have none." + NL +
 b"  - What remains a viewer choice: the clip frame as his action clock, the module's general alignment for frame rows.") + b[j:]
open(P + '.tmp', 'wb').write(b); os.replace(P + '.tmp', P)
print('ok')
