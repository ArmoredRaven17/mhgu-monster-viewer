p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
anchor = "| uEm061 sp_00 mode 7 ((7, 0xe6))"
i = s.index(anchor); j = s.index(nl, i) + len(nl)
rows = [
"| `0xa5fdf0` -> `0xa60744` -> `0xa63efc` | the particle update: with gen+0x10 bit 2 and a live particle (gen+0xb0) it switches on the generator TYPE gen+0x40 bits 20..23 (= efl row word [row+0xc] & 0xf, `0xa55fe0`); type 6 -> `0xa60744`, `0xa63efc` per live particle (`0xa607e8`). Congalala's em021_00_004 row 10 (u 200 UNIQUE) is type 6 -- not a LOD / camera branch | effect runtime | R | dev/fanged-beasts-shells-spec.md 1 (CLOSED 2026-10-18) |",
"| tooling: `<scratchpad>\fb\rec_shellrec.py <mon> <pel>:<key>,..` | records a shell's UNIQUE record standalone (plain + `_near`), adds the sets to lift-effects.sh V (ADD_NO_LIFT) -- for a routine only the UNIQUE record reaches; the routine must already be on a lift line (vecdrawsched records only those) | -- | -- | control: em021_00 u 200 reached 0xa60744 / 0xa63efc only this way |",
]
s = s[:j] + nl.join(rows) + nl + s[j:]
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
