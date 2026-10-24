p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
anchor = "### Action dispatch and the per-frame trigger (shared enemy layer"
i = s.index(anchor)
table = """### EMC ops -- the shared table (Seltas duo agent, 2026-10-17; for every monster's command-table read)

The interpreter's op `o` runs at `0x836f0 + [0x836f0 + 4 o]` (`0x836e4..0x836ec`). A BLOCK op's mode byte follows it: 00 open,
01 case, 02 else / default, ff close. Two shapes: a SWITCH computes a value at mode 00 (stored at `[sp]`) and `0x8e088(ctx,
op ptr, op, 0)` compares each `01 NN` case by the op's kind; an IF is a helper `f(ctx, op ptr)` that, at mode 00, returns 0
(enter the then-part) when its test holds, else the skip to its `02` (`0x8df88`), and at mode 02 skips to `ff`. The latch
bytes `e+0x73f0 / 0x73f3 / 0x73f4` (and `+0xba52`) are the interpreter's own: cleared at every walk start (`0x826d4..`, `0x82ab8..`,
`0x82cf0..`) and on an issued action (`0x84590..`), copied from `e+0xb7b1..0xb7b4` when `e+0xb7b0` is set (`0x83ba0..0x83be0`).

| op | handler | shape | what it tests / does | "no hunter" (unaware, fresh walk) |
|---|---|---|---|---|
| `00 st n` | `0x8456c` | action | issue (st, n) (`0x754b8` -> `0x76098`) | -- |
| `02` | `0x84624` | switch | percentage draw (row above) | -- |
| `0a` | `0x84670` | switch, kind 0x0a | `P+0x2c0`, the awareness (0 unaware, 1 aware, 2 noticing: `0x7ea78`) | 0 -> its default |
| `0c` | `0x846cc` | switch, kind 0x0c | `P+0x1ba`, the posture | the unit's posture |
| `14 NN` / `20 NN` | `0x83e1c` / `0x83f4c` | call | g1 / g0 stream NN (row above) | -- |
| `24` | `0x848c8` -> `0x86fac` | if | tired: `0x81634` | not tired |
| `39` | `0x84650` (the default handler) | -- | nothing: `[sp+0x1ff]` = 0 and on to the next op | -- |
| `3f` | `0x84ab4` -> `0x87b40` | if | latch `e+0x73f3` != 0 | 0: else |
| `4e` | `0x84bc0` -> `0x88a44` | if | `e+0x73d8` != 0 OR s8 `e+0x73d3` < 0 (the wander state, below) | then |
| `54` | `0x84c30` -> `0x88c1c` | if | latch `e+0x73f4` != 0 | 0: else |
| `61` | `0x84d38` -> `0x88f34` | if | latch `e+0x73f0` != 0 | 0: else |
| `68` | `0x84df4` -> `0x8914c` | if | `0x81f64(e, 1)`: `P+0x527` bit 0 -- set by `0xbf01c(e, 1)` when the tired state `P+0x505` turns 2 (`0xb9560`, `0xba940`, `0xbd124`..), cleared by `0xc25a4`: JUST EXHAUSTED | 0: else |
| `6f` | `0x8442c` | switch | the class callback vt+0x214 (selector byte) | per class |
| `77` | `0x84f78` | switch, kind 0x15 | distance to the target (row in the duo section) | no target: NOT READ |
| `92` | `0x8453c` | switch | variant byte `e+0xb5f5` | 0 |
| `96 a b` | `0x85290` -> `0x8a740` | action-ish | a target / area search (300.0 = `0x43960000`; `0xc4298`, `0xb4a54`, `0xb5034`, `0x97568`) -- NOT READ through | skipped by `4e` (s8 `73d3` < 0) |
| `97 a` | `0x852a8` -> `0x8b1fc` | action-ish | THE WANDER STATE MACHINE on `e+0x73d3` (0x80..0x85, table `0x8b2b4`), picking points by the RNG `0x7c9234` and sin / cos, through the area navigation (`0xb4a54`, `0xb5034`, `0x97568`, `0xc6d58`, `0xc460c`) -- NOT READ through: needs the stage's navigation | the unaware unit wanders the area |
| `9e a b` | `0x853e0` | jump | sets `[sp+0x184]` bit 0x400, saves the cursor (`+0x7344`) and the current group / stream (`+0x7340` / `+0x7341`), and goes to group a stream b (`0x8d35c`) | -- |

"""
s = s[:i] + table.replace('\n', nl) + s[i:]
# duo rows
a = "| viewer: `+ Seltas leaves` (index.html `releaseMatOf`, `ROM_PARTNER_BODY.em069_00.leaves`)"
i = s.index(a); j = s.index(nl, i)
rows = [
"| THE ENGINE DRAWS JOINT 0 ON THE UNIT, NOT THE `reference` TRACK (Seltas duo agent, 2026-10-17) | his 1:0x13 jump (0, 1392.5, 245) x size at M46's end equals M46's last joint 0 minus M47's first, (0.03, 13.80, 2.446) model units (`duo/roottrack.py` on em076_00_4.glb); M47's `reference` track is (0, 13.932, 0): drawing it would put M47 2.4 behind M46. The unlinked partner is drawn with the reference held (pose.js `holdReference`) and moved by his code | uEm076_00 / shared | R (code + data) | spec §18 |",
"| `0xae370` (the shared move pass, vt+0x28 `0xc9e7c` -> `0xae32c`) | linked (`0xc210c`): the link modes 2..5 place the unit on the partner's joint (`+0x5c30` target, `+0x5c34` joint, `+0x5c2f` mode); unlinked: `P+0x40..0x48` += `P+0x530..0x538` when `P+0x540` (the frame's move request, from the move helpers `0x17e4f0..0x17f0a8`, vertical kept only in postures mask 0x66), then the ground passes `0xa6218` / `0xbde60` / `0xbf284`; at the end the drawn `e+0x40..0x48` = `P+0x40..` + `e+0x1380..0x1388` (an offset `0xbf678` writes) | shared | R (the arms named; the move helpers' callers NR) | spec §18 |",
"| `0x75168` (vt+0x3dc) / `0x7527c` (vt+0x3e0) | the idle choosers: 3dc posture 0, action (0, 0) -- (0, 1) if aware `P+0x2c0` == 1, (0, 2) tired with `P+0x1a8` bit 6 -- then `0x82454` (`e+0x72f0` = 1); 3e0 posture 1 (`0xbf4d4` / `0xbc984`), action (0, 3). His (0, 0) = L0 M1 b10, (0, 3) = L1 M1 b10 (census) | shared / uEm076_00 | R | spec §18 |",
"| his unlinked command table, unaware (em076_00_cmdtbl g0 s0 -> g0 s1) | fresh walk: latches 0 -> posture switch (4: action (6, 3)); else `68` (just exhausted: in the air (3, 0x17), on the ground (1, 9)); awareness `0a` default -> link 0 -> g0 s1: `4e` (wander state < 0) skips `96`, then `97 00` = THE WANDER over the area navigation (NOT READ through). No stream of his unaware root re-combines him: he goes back onto her only on her requests (his g7 answers) | uEm076_00 | R (file + ops) | spec §18 |",
"| `0x7db70` (arm a hit record), linked attacker | with the attacker linked (`0xc210c`), the record's byte +0xa gains the partner's `+0xfec` + `P+0x54` (bits 8..15): his attacks on her back take her facing. Whether a record can hit the PARTNER (her 0x2b on him) is the collision side's -- NOT READ | shared | R (the arm) / NR (the target filter) | spec §18 |",
]
s = s[:j] + nl + nl.join(rows) + s[j:]
open(p, 'w', encoding='utf-8', newline='').write(s)
print('ok')
