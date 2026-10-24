"""rom-map: the 0xa92798 row upgraded to READ (old claim to WITHDRAWN), the 0xaef400 lift, the _lod tooling row, trap 72."""
import re
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
t = open(P, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in t else '\n'
lines = t.split(nl)

# --- A. the address row -------------------------------------------------------------------------------------------
i = next(k for k, l in enumerate(lines) if l.startswith('| `0xa92798` (in `0xa9272c`, lifted in lifted-draw.js, not in lift-effects.sh)'))
old = lines[i]
lines[i] = ('| `0xa92798` (in `0xa9272c` = the Model generator\'s draw, reached from `0xa92710` (gen `+0x46` == 5 / 30) at vtable '
 '`0x1789734` +0x54; lifted in lifted-draw.js, and ON lift-effects.sh\'s lifted-draw line) | **the arm of a NON-ZERO distance-LOD '
 'mask, not of a list state**: `0xa92788 cmp r0, #0` / `0xa92794 beq 0xa927c4` test `0xa718b8`\'s return (kept at `[sp+0x40]`). '
 'With a mask it walks the generator\'s live-particle list `[gen+0xb0]` to the first node with `[node+8] & (mask & 3) == 0` '
 '(`0xa927a8..0xa927bc`; none: `0xa927c0` -> exit `0xa934a0`), and the per-particle draw loop\'s next step does the same '
 '(`0xa928f4..0xa9291c`). The list: head `+0xb0` / tail `+0xb4`, node `+0` prev / `+4` next, appended at emission '
 '(`0xa576a8..0xa576d4`, in `0xa574c4`) from the free list `+0xb8` / `+0xbc`; emission keeps the node\'s `+8` low half '
 '(`0xa576e0..0xa57708`), so `[node+8] & 3` is set elsewhere (per-particle hide bits: INFERRED, setter not read). '
 '`0xa718b8`: 0 when `[gen+0xe8]` bits 8..11 == 6, else `0xb8f014(mgr, level, |cam[+0x70] row 3 - [gen+0x18] +0x30|)` = '
 '`0x166aa50[level*3 + class]`, class 0 / 1 / 2 for distance < `mgr+0x1f4+8*level` (2000.0) / < `+0x1f8` (5000.0) / beyond '
 '(manager `*0x211f554`, ctor `0xb8c858`: `0xb8ca24..0xb8ca54`); table levels 0..5 = {0,1,3} {0,1,1} {0,0,1} {3,1,0} '
 '{1,1,0} {1,0,0}. Every older set drew from efx_draw.py\'s camera 1000 away: class 0, mask 0 for levels 0..2. '
 '**RECORDED 2026-10-17** (effects-recording agent): `add_em056_00_u20_lodmid` / `_lodfar`, `add_em057_00_u531_lodmid` / '
 '`_lodfar` (masks 1 / 3, reach `0xa92798` / `0xa927a0`; control: `add_em056_00_u20` / `_near` masks [0], no walk block; '
 'u 530\'s generators are all level 6, its `_lod` sets add nothing). Still unrecorded: `0xa927b4` (a node skipped), '
 '`0xa92900` (masked next step, 2+ live particles). Soak after the lift: em056_00 71 motions 0 refused, em057_00 78 / 0, '
 'em057_04 84 / 0; nibel2 clean through L3 M19 and L0 M7 | R | this row; tooling row `<scratchpad>\\rec_lod.py` |')
# the next refusal the walk uncovered, as its own row
lines.insert(i + 1, '| `0xaef400` (case `0xaee610` of `0xaee498`\'s switch, lifted-particles.js) + `0xaee9ac` `0xaeeda0` `0xaf2b2c` '
 '`0xaf2c84` `0xaf2e14` | NOT LIFTED until 2026-10-17: once `0xa92798` was covered, Zinogre / Thunderlord L3 M9 (u 531 alive) '
 'refused at "call to 0xaef400, which is not translated (from 0xaee618)". The `_lod` sets already held their vectors (56 calls); '
 'put on lift-effects.sh\'s lifted-added.js line (add_effects.add_routines; 0xaef400\'s direct bl callees by disassembly) and '
 're-lifted: 0 refused | R (lifted from recorded blocks) | lift-effects.sh lifted-added line |')

# --- B. withdrawn -------------------------------------------------------------------------------------------------
w = next(k for k, l in enumerate(lines) if l.strip() == '| claim | why wrong | correction |')
lines.insert(w + 2, '| rom-map row `0xa92798` (2026-10-15) and task board "Effects: Nibelsnarf\'s unrecorded branch 0xa92798" (2026-09-25): '
 '"the list walk `sb = [r5+0xb0]` with the list NON-EMPTY falls into code never recorded; every recording so far saw it empty"; '
 '"0xa9272c ... NOT in lift-effects.sh"; the fix "a recording on ANIMATED joints" | the branch at `0xa92794` tests `0xa718b8`\'s '
 'return, not the list: the list (live particles) was non-empty in every set that drew (`0xa927cc` recorded); and `0xa9272c` IS '
 'on the lifted-draw line | the arm of a non-zero distance-LOD mask: camera >= 2000 from a level-0..2 generator (row `0xa92798`, '
 'READ 2026-10-17); cured by recording with the camera far (`_lodmid` / `_lodfar`), joints unchanged |')

# --- C. tooling -----------------------------------------------------------------------------------------------------
k = next(n for n, l in enumerate(lines) if l.startswith('| `efx/vecdrawsched.py` SHELL_PLAN stops'))
lines.insert(k, '| `<scratchpad>\\rec_lod.py <mon> <side><key>,..` (+ `lodcov.py <set>..`, `lift_lod.py`) (effects-recording agent, '
 '2026-10-17) | add_effects.record()\'s own \'\' run per record (spec, frames, notices, rest joints) with `CAMERA_AT=0,0,3500` '
 '(`_lodmid`, LOD class 1) / `0,0,7000` (`_lodfar`, class 2), `ADD_NO_LIFT=1`; `lodcov.py` prints per set `0xa718b8`\'s masks and '
 'levels and which of `0xa9272c`\'s masked-walk blocks it covers; `lift_lod.py` lifts once from a copy under the lift lock '
 '(kept fresh past the 900 s stale age) | `add_em056_00_u20` / `_near` masks [0] vs `_lodmid` [0, 1] / `_lodfar` [0, 3] | '
 'the camera is a fixed point on +z: a class needs the distance, not a pose; record() regenerated '
 '`joints/em056_00_viewer_rest.json` (missing 17, 22, 100) on the way |')

# --- D. trap ----------------------------------------------------------------------------------------------------------
last = max(n for n, l in enumerate(lines) if re.match(r'^\d+\. ', l))
num = int(re.match(r'^(\d+)\. ', lines[last]).group(1)) + 1
lines.insert(last + 1, '%d. **The recorder\'s camera sits 1000 from the effect, so every distance-LOD test reads the NEAR class (2026-10-17).** '
 '`0xa718b8` -> `0xb8f014` gives a model generator a mask only at 2000+ (level 0..2); the viewer\'s camera is often there, so '
 'its draw took `0xa92798` where no set ever had -- written up for a month as "a list never non-empty" and as needing animated '
 'joints. A branch on a distance needs a recording at that distance (`CAMERA_AT`). Read the compare before naming its input.' % num)

open(P, 'w', encoding='utf-8', newline='').write(nl.join(lines))
print('patched; withdrawn at', w + 2, 'tool at', k, 'trap', num)
