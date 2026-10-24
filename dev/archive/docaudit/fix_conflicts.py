import re, sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
APPLY = '--apply' in sys.argv
T = ' [doc audit 2026-10-24]'
raw = open(P, 'rb').read(); L = raw.decode('utf-8').split('\n')
def cells(x): return len(re.split(r'(?<!\\)\|', x.strip().strip('|')))
def find1(pred, what):
    idx = [i for i, s in enumerate(L) if pred(s)]
    assert len(idx) == 1, (what, [i + 1 for i in idx])
    return idx[0]
def section(head):
    s = find1(lambda x: x.startswith(head), head)
    e = s + 1
    while not L[e].startswith('### ') and not L[e].startswith('## '): e += 1
    return s, e
log = []
# 1. stray \" in the audit's own rows
n = 0
for i, s in enumerate(L):
    if '[doc audit 2026-10-24]' in s and '\\"' in s:
        L[i] = s.replace('\\"', '"'); n += 1
log.append('unescaped quotes in %d rows' % n)

# 2. conflict 1: 0x48b71c
i = find1(lambda s: s.startswith('| `0x10a1ddc` (Valstrax vt+0x158) / `0x10a1e04` |'), 'valstrax row')
L[i] = ('| `0x10a1ddc` (Valstrax vt+0x158) / `0x10a1e04` | registers the unit as an owner of shells 0x174 and 0x175: `0x48b71c(mgr, e, 0x174)` then a tail call `b 0x48b71c` with `movw r2, #0x175` at `0x10a1e04` (row `0x48b71c` in "Shell infrastructure"): a registration that loads the two shells\' resources on first use, not a create and not a kill | uEm086_00 | R (read 2026-10-24, `0x10a1ddc..0x10a1e0c`) | <archive>\\gapD\\RESULT.md §3 (its "kill" withdrawn)' + T + ' |')
row48 = ('| `0x48b71c(mgr, owner, id)` (`..0x48b874`) | **the shell id\'s owner registration and first-use load**: returns 0 when owner is null or `[owner+0xc] & 7` is not 1 / 2 (that field\'s meaning NOT READ); otherwise stores owner in the first empty of 16 words at mgr + id x 0x40 + 0x68c..0x6c8 (all full: returns 0); then, if mgr+0x1c + 4 x id is null, loads the id\'s resource `0x152530([0x18500c8], [0x175c3e8 + 12 x id + 8], DTI 0x188b2c8)` and stores the handle there; returns 1. No release path in it. Callers are the classes\' vt+0x158 id setups (rows `0xd2e538`, `0xff23f4`, `0xfad4ec`, `0x10a1ddc`) | shell manager | shared | R (read whole 2026-10-24; GOT `0x1836778` -> `0x175c3e8`, `0x18366c4` -> `0x188b2c8`, `0x1831ca4` -> `0x18500c8`) | efx/armdis.py `48b71c 48b884`' + T + ' |')
wd = []
wd.append('| `<archive>\\gapD\\RESULT.md` §3 (2026-10-21) and its rom-map row: "`0x48b71c` at `0x10a1e04` (in-band `movw #0x175`) is the kill of 0x174 / 0x175" | read 2026-10-24: `0x48b71c` stores the owner in a free slot of the id\'s 16 and loads the id\'s resource when absent; it frees nothing | row `0x48b71c(mgr, owner, id)` in "Shell infrastructure"; Valstrax vt+0x158 `0x10a1ddc` registers 0x174 / 0x175 (`0xd2e538`\'s "loaded" and gapA / gapG\'s "registration" are each half of it)' + T + ' |')

# 3. conflict 2: the 0xed0a38 boundary
i = find1(lambda s: s.startswith('| `0xed0a38` / `0xed0a3c` / `0xed0aa8` / `0xed0aac` (sp_41 0xf3 class'), 'sp41 row')
L[i] = ('| uShellEm050_sp_41 vtable `0x17c860c` (`..0x17c8764`) | ends at +0x158: uEm055_00\'s vtable `0x17c8768` = `0x17c860c` + 0x15c follows it (its getDTI thunk at +0x14). So `0xed0a38` / `0xed0a3c` / `0xed0aa8` / `0xed0aac`, read as sp_41\'s +0x15c..+0x16c, are **uEm055_00 vt+0 / +4 / +8 / +0x10** (the dtor `b 0xc9cdc`, the deleting dtor, `b 0xca04c`, ...). sp_41\'s own slots end with +0x14c `0xed0478` (reader) and +0x150 `0x41eed4` | uShellEm050_sp_41 / uEm055_00 | R (vtables read 2026-10-24) | <archive>\\docaudit\\bands.py; the notes050 claim withdrawn' + T + ' |')
bands = [
 ('| Alatreon band (derived) `0xec4890..0xed0834` | first function the ctor `0xec4890` (`bl 0xc9c34`, stores vtable `0x17c7254` = GOT `0x183f674` + 8); the vtable closure of uEm050_00 and uShellEm050_sp_00 / 01 / 02 / 11 / 41 spans `0xec490c..0xed0758` (497 functions, none outside); then sp_41\'s TU static initialiser `0xed0760..0xed0834` (init_array `0x1843718`; owner by layout: every TU here ends getDTI thunk + static init, as `0xedf668` / `0xedf678`). The older "`0xec480c..0xed0a38`" took 0x84 of the previous TU\'s initialiser and Duramboros\'s ctor `0xed0838..0xed0a34` | uEm050_00 | R (closure) / I (the initialiser\'s owner, by layout) | <archive>\\docaudit\\bands.py' + T + ' |'),
 ('| Duramboros band (derived) `0xed0838..0xedf74c` | first function the ctor `0xed0838` (`bl 0xc9c34`, stores vtable `0x17c8768` = GOT `0x183f6b0` + 8); the vtable closure of uEm055_00 and uShellEm055_sp_01 spans `0xed0a38..0xedf670` (778 functions); last the TU static initialiser `0xedf678..0xedf748` (after sp_01\'s getDTI `0xedf668`). The older "`0xed0a38..0xedec14`" missed the ctor and `0xedec14..0xedf74c`; its negatives re-run word by word on the added parts 2026-10-24: no `#0x13f4`, `#0xb7d0..#0xb7d3` or `#0xb700` immediate (control: the same scan finds `0xede180` / `0xede1d4` / `0xede1e4`) -- they stand | uEm055_00 | R (closure, ctor; negatives with control) | <archive>\\docaudit\\bands.py' + T + ' |'),
]
wd.append('| `<archive>\\fb\\notes050.md` (2026-10-19) and its rom-map row: "sp_41 0xf3 class +0x15c `0xed0a38` / +0x160 `0xed0a3c` / +0x164 `0xed0aa8` / +0x16c `0xed0aac`" | the vtable read ran past sp_41\'s end into the next vtable (uEm055_00 at `0x17c8768` = sp_41 + 0x15c) | those are uEm055_00 vt+0 / +4 / +8 / +0x10; row "uShellEm050_sp_41 vtable `0x17c860c`"' + T + ' |')
wd.append('| the bands "`0xec480c..0xed0a38`" (Alatreon: elder spec 7, em050 spec, notice-marks) and "`0xed0a38..0xedec14`" (Duramboros: this map\'s uEm055_00 heading and band row, em055 spec, states-em055_00.md, motion-states.js) | chosen extents (emclasses slack, a lowest-override boundary), not derived; `0xed0838..0xed0a34` is Duramboros\'s ctor | derived: Alatreon `0xec4890..0xed0834`, Duramboros `0xed0838..0xedf74c` (rows "Alatreon band (derived)" / "Duramboros band (derived)"); Duramboros\'s negatives re-run and stand' + T + ' |')
i = find1(lambda s: s.startswith('### uEm055_00 (Duramboros — vtable `0x17c8768`, code `0xed0a38..0xedec14`'), 'em055 heading')
L[i] = L[i].replace('code `0xed0a38..0xedec14`', 'code `0xed0838..0xedf74c` (derived 2026-10-24; was `0xed0a38..0xedec14`)', 1)
i = find1(lambda s: s.startswith('| band `0xed0a38..0xedec14` | three `0x13f4` immediates'), 'em055 band row')
L[i] = L[i].replace('| band `0xed0a38..0xedec14` |', '| band `0xed0a38..0xedec14` (re-run on the derived `0xed0838..0xedf74c`: the same three) |', 1)

# 4. conflict 3: Alatreon's (7, 2 / 0x21) maker
i = find1(lambda s: s.startswith('| `0xec66d4` / `0xec7b80` / `0xec7f14`'), 'makers row')
L[i] = L[i].replace('| `0xec66d4` / `0xec7b80` / `0xec7f14`', '| `0xec66d4` / `0xec7ae0` (was "`0xec7b80`", withdrawn) / `0xec7f14`', 1)
i = find1(lambda s: s.startswith('| `0xec6754` / `0xec7c74` / `0xec8064`'), 'sites row')
L[i] = L[i].replace('NB the makers row cites `0xec7b80` for sp_00 side L2 M6 f76 where the note / spec §7 give `0xec7ae0(e, side)`: not reconciled', 'RESOLVED 2026-10-24: the maker is `0xec7ae0(e, side)` (status-7 cases 2 / 0x21 at `0xecc094` / `0xecbe70`: `b 0xec7ae0` with r1 0 / 1); `0xec7b80` is its `mov r0, #0xef` (sp_00) and `0xec7c70` its `bl 0x48b884`', 1)
wd.append('| rom-map makers row "`0xec66d4` / `0xec7b80` / ..." (shells agent, 2026-10-19): `0xec7b80` as the maker of sp_00 side L2 M6 f76 | `0xec7b80` is a mid-function instruction (`mov r0, #0xef`, the sp_00 id) inside `0xec7ae0`, which has the only `push` before it; no branch or pointer targets `0xec7b80` | the maker is `0xec7ae0(e, side)`, reached by `b 0xec7ae0` from status-7 cases 2 (`0xecc094`, r1 0) and 0x21 (`0xecbe70`, r1 1); its create is `bl 0x48b884` at `0xec7c70` (read 2026-10-24; the note and elder spec 7 had it right)' + T + ' |')

# 5. misplaced rows: collect, remove, reinsert at the end of their sections
ws, we = section('### Withdrawn — kept')
moves = []
for k in range(ws, we):
    s = L[k]
    if s.startswith('|') and cells(s) == 5: moves.append(k)
ps, pe = section('### The PSL enable word per class')
for k in range(ps, pe):
    s = L[k]
    if s.startswith('|') and any(s.startswith(p) for p in ('| `0xf51fc4`', '| em065_00 `.dtb` +0x22', '| uEm065_00 `P+0x92c`', '| L2 M126 / M117 / M115')): moves.append(k)
dest = {}
SHR, AHT, ELD, FBS, KHZ = '### Shared enemy / command layer', '### Ahtal-Ka -- his shells read and built', '### Elder Dragons -- the shells: Kirin', '### Fanged Beasts -- the shells: Congalala', '### Khezu / Gravios -- the PSL enable words'
for k in moves:
    s = L[k]
    if 'Khezu' in s: d = KHZ
    elif s.startswith('| `0x9cd50`') or s.startswith('| dtbase loader') or s.startswith('| `.dtb` +0x6c') or s.startswith('| `0xb9708`') or s.startswith('| `0x98a7c') or s.startswith('| `0x99238') or s.startswith('| `0x9abe8`') or s.startswith('| `0x7206c(e, &t, s)`'): d = SHR
    elif s.startswith('| Amatsu P+0x380'): d = ELD
    elif 'em065' in s or 'uEm065' in s or s.startswith('| `0xf51fc4`') or s.startswith('| L2 M126 / M117 / M115'): d = FBS
    else: d = AHT
    tag = ' [moved here 2026-10-24 from the %s table]' % ('Withdrawn' if ws <= k < we else 'PSL enable-word')
    dest.setdefault(d, []).append(s.rstrip()[:-1].rstrip() + tag + ' |')
log.append('moving %d rows: %s' % (len(moves), {d[:30]: len(v) for d, v in dest.items()}))
for k in sorted(moves, reverse=True): del L[k]

# 6. Shell infrastructure header to 5 columns
si, se = section('### Shell infrastructure')
assert L[si + 2] == '| addr | what | st | detail |' and L[si + 3] == '|---|---|---|---|', (L[si+2], L[si+3])
L[si + 2] = '| addr | what | owner | st | detail |'; L[si + 3] = '|---|---|---|---|---|'
OWN = {'`0x175c3e8` w1': 'data', '`dti.json` parentDti': 'data', 'em004 shell01 hit': 'uShellEm004_sp_01', 'HDS records': 'data',
       '`0xd0e958`': 'uShellEm001_sp_01', '`0x3fa2f8`': 'uShellEmBase01'}
nfix = 0
for k in range(si + 4, se):
    s = L[k]
    if s.startswith('|') and cells(s) == 4:
        parts = re.split(r'(?<!\\)\|', s)  # ['', c1, c2, c3, c4, '']
        key = parts[1].strip()
        own = next((v for kk, v in OWN.items() if key.startswith(kk)), 'shared')
        parts.insert(3, ' %s ' % own)
        L[k] = '|'.join(parts); nfix += 1
log.append('Shell infrastructure: header 5 columns, %d 4-cell rows given an owner cell' % nfix)

# 7. insert: 0x48b71c row + bands + moved rows at section table ends; Withdrawn rows
def table_end(head):
    s = find1(lambda x: x.startswith(head), head) + 1
    while not L[s].startswith('|'): s += 1
    while s < len(L) and L[s].startswith('|'): s += 1
    return s
ins = {'### Shell infrastructure': [row48], ELD: bands, '### Withdrawn — kept so they are not rediscovered': wd}
for d, v in dest.items(): ins.setdefault(d, []).extend(v)
for p, h in sorted(((table_end(h), h) for h in ins), reverse=True):
    L[p:p] = ins[h]; log.append('%s +%d at %d' % (h[:40], len(ins[h]), p + 1))
for x in log: print(x)
if APPLY:
    assert open(P, 'rb').read() == raw
    open(P, 'wb').write('\n'.join(L).encode('utf-8')); print('applied')
