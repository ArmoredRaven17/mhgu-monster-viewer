p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
s = raw.decode('utf-8').replace('\r\n', '\n') if crlf else raw.decode('utf-8')
def rep(old, new):
    global s
    assert s.count(old) == 1, (old[:70], s.count(old))
    s = s.replace(old, new)

# 1. Gravios rows in the uEm004_00 section, after the 0xd288b8 blend row
anchor = "| `0xd28984` / `0xd28a38`..`0xd28a60` | `0xd288b8`: L2 M24 blended with M25 (`0x219`, above) / M26 (`0x21a`, below); shell02 at f118 in mode 3 / 8 (flag bit 0 of `[+0xcac0]+0x24` clear; calm / enraged) or 7 / 9 (set); no em test | R | SHELL_DATA note |"
assert s.count(anchor) == 1
i = s.index(anchor) + len(anchor)
add = """
| `0xd2891c`..`0xd28b04` | `0xd288b8` phase 0, **the +0x20 word**: pitch word w from `P+0x40` to the target `P+0x1d0` (no +100 here; dz² then + dx², `atan2(-dy, h)` × 10430.378 + 0.5, truncated, `uxth`); w ≤ 0x8000 → `min(w, 0x31c7)` and partner M26, else `0x10000 − min(0x10000 − w, 0x31c7)` and M25; M24's weight `1 + r5 / −12743.0` (`0xd28bb0`); kept in `ctl+0xc` (`0xd28b04`) and stored `strh` at the f118 spawn (`0xd28aa0`) | R | shells.js `aim005`; dev/beams/em005_00.md (Viewer agent, 2026-09-30) |
| `0xd28d7c`..`0xd29290` | `0xd28bb4`'s **em-5 mode**: `sb = (r2 == 1 ? 2 : 1) \\| (ctl+0x24 bit 0) << 2` → (7,0x0e) 1 / 5, (7,0x32) 2 / 6; id `[e+0xcacc]` = 0x6e | R | dev/beams/em005_00.md (agent A) |
| `0xd22e8c`..`0xd22fac` | on-action-start (vt+0x204 `0xd22a14`), em 5: `ctl+0x24` = 0, then **bit 0 = head (part 5) break level ≥ .dtp row 3's** (+0xd, or +0xe at questRank > 4), bit 1 part 6 row 2, bit 2 part 0 row 0 (bits 1 / 2 pick late hit records only) — the viewer reads bit 0 as the broken head mesh shown (part 3, set 4: motion-states.js `SHELL_PARTS`) | R (the part link: the viewer's data) | dev/beams/em005_00.md (agent A) |
| `0xd2a778` / `0xd2a7d0` | `0xd2a714` ((7,0x34), L4 M59): spawn gate **r1 == 0** (the opposite sense); f134; mode `10 \\| head bit`; +0x20 = 0 | R | dev/beams/em005_00.md (agent A) |
| `0xd2adbc` / `0xd2ae14` | `0xd2a8c4` (L4 M60): spawn iff `(r1 \\| 2) == 2`, f160, mode `4 \\| head << 3` — modes 4 / 12 start no effect (ef 999), and (7,0x39) / (7,0x47) are not issued | R | dev/beams/em005_00.md (agent A) |"""
s = s[:i] + add + s[i:]

# 2. the partial 0xd30e30 row points down
rep("| `0xd30e30` | shell02 `+0x15c`: 12-entry jump table on mode−1 → 3–4 behaviours, `sinf`/`cosf` on angle words | R (partial) | shell02-spec |",
    "| `0xd30e30` | shell02 `+0x15c`: 12-entry jump table on mode−1 → 3–4 behaviours, `sinf`/`cosf` on angle words | R (partial) | shell02-spec — **READ IN FULL below (\"The beams on their own monsters\", Viewer agent, 2026-09-30)** |")

# 3. the new section before 1b
sec = open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\romap_beams_section.md', encoding='utf-8').read()
k = s.index('## 1b. The decode notes')
s = s[:k] + sec + '\n' + s[k:]
if crlf: s = s.replace('\n', '\r\n')
open(p, 'wb').write(s.encode('utf-8'))
print('ok crlf', crlf)
