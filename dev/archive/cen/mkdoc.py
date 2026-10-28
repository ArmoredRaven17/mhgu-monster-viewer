# mkdoc.py: dev/effects-coverage.md from cen/coverage_tables.md (cenreport.py) + the method; dev/effects-walk-order.md status column in place
import json, re, os
SP = os.path.dirname(os.path.abspath(__file__))
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
tables = open(os.path.join(SP, 'coverage_tables.md'), encoding='utf8').read()
head = """# Effects coverage -- every monster, every record, measured (effects lane, 2026-10-24; Flying Wyverns re-metered 2026-10-25; Brute, Bird and Fanged Wyverns re-metered by census3 + probes, lane A, 2026-10-25)

Raven: "Before I start reviewing animations, I would like to ensure we have effects covered for each monster group." This is the one
current, draw-level answer. It supersedes the coverage side of dev/effects-open-items.md (2026-10-19) and the walk-order status column
(brought up to date from this file).

## How it was measured

- **The records**: every record of `docs/effects/<id>.json` (the arms' `_left` / `_right` exports included) that is not a shell
  record -- clip-bound (UNIQUE / SEQUENCE through a PSL bit), event (class-requested, state, break, shared-state rows), rage puff,
  rage / calm / always, thread. **Shells are not re-metered**: their columns are dev/shells-draw-table.md's verdicts (949 records).
- **The meter**: `__view.effectMeter` (render/rom/effect/live.js; dev/effect-runtime-engine.md E16), one page per monster through the
  slot-2 lock, `<archive>/cen/census.mjs` (raw output `<archive>/cen/out/<id>.out`, report `<archive>/cen/cenreport.py`; `<archive>` = dev/archive/):
  - **A**: every clip a record names -- CLIP_EFFECTS, MOTION_STATES rows, the shells' action clips, every copy on the Clip menu,
    every list the page builds (Snow Variants, the combined duo list, the Special list);
  - **B**: each visible input set to each value, replaying the clips whose records had not started yet: State, Rage, Stance,
    Level, Variant, Carry, Boulder, the class controls (CLASS_CONTROLS), the switches (Enraged / Tired / Charge / Heated ...), the
    class toggles, the shared-state rows (c 1100 / c 1108), Severed Parts;
  - **C**: every Parts row stepped through its options (a break fires on the change), then all parts broken and the clips replayed;
  - **D**: every Ground type, Quest Rank and Quest Level value, the not-started clips replayed under each.
- **The retries** (each later measurement replaces a "never", and a draw replaces a "starts, no draw"): `<archive>/cen/census2.mjs`
  (2026-10-24: each clip replayed once per CLIP_ACTIONS entry and shell pick); `<archive>/cen/census3.mjs` (2026-10-25, the Flying
  Wyverns first: **census / census2 never played a copy of a split clip** (`Motion[7]_start#B` -- the `_start` strip ran before the
  copy suffix), played only the `_start` piece of a split motion, stopped plays at 360 frames, ignored ACTION_EFFECTS and the Special
  entries' `tired` arms, and replayed a cycling MOTION_STATES row too few times; census3 fixes all five -- rom-map trap list); the
  targeted probes `<archive>/cen/probe.mjs` + `<archive>/cen/pq/*.json` (one input combination each: the slime hit, c 1500 lying on
  Ground H, a Parts sweep under a levels row, the Hyper pairs) and `<archive>/cen/hypermeter.mjs` (every Hyper option, 90 frames).
- **The buckets** (each record in exactly one):
  - **draws**: the meter's verdict `draws` -- lit pixels against its target in the redraw of the record's own units;
  - **starts, no draw**: it started, any other verdict (named with it);
  - **not requested**: the ROM requests it (a class request site's key, efx/class-effects.json) and the viewer exports no such
    record -- these are counted beside the exported records, not inside "records";
  - **named refusal**: **Raven's decisions only** (2026-10-25, his words: "The only effects I recall not wanting was Paint since we
    would need a projectile to simulate a Paintball being throw and Slime since that would require building up to the proc and
    unlike Poison it is simply a small explosion that happens once it procs"): **Paint c 1106** (the paint timer P+0x5db8, 0xc0c48,
    set on damage type 16) and **the blastblight proc c 1130-1137** (the 0xaab98 band, one record per proc by the part P+0x5db0).
    Every earlier "by decision" refusal an agent recorded is reopened (hyper u 1301-1320, c 1500, u 1400 on the latch monsters,
    Raging Brachydios's slime u 200-204); notice c 1200 / 1201 are HELD (open) until Raven answers, and so are the hyper BURSTS
    u 1311-1320 (the motion side: Raven, 2026-10-25, "hold off on the animations"); the ROM's "never requests it" reasons accepted by
    the coordinator (2026-10-25: Gold Rathian u 522 / 523, Rathalos / Dreadking u 290 / 291, u 1120 on the stub-pick classes) are
    named refusals with that reason, and so are the Flying Wyvern pass's (accepted 2026-10-25: Gravios u 10 / u 40, Diablos u 200,
    Akantor c 1104 / c 1105 / c 1109 / u 1400);
  - **open**: exported, never started under any of the inputs above -- the list below, closed group by group (each with its
    reason where one is read; a ROM reason goes to the coordinator, never to "named refusal" on an agent's say).
- Starts and draws are separate: a start is never counted as a draw.

## Totals and per group

"""
open(os.path.join(V, 'dev', 'effects-coverage.md'), 'w', encoding='utf8').write(head + tables)
# the walk order's status column, in place
d = json.load(open(os.path.join(SP, 'census.json')))
p = os.path.join(V, 'dev', 'effects-walk-order.md')
L = open(p, encoding='utf8').read().split('\n')
for i, l in enumerate(L):
    c = l.split('|')
    if len(c) > 8 and re.match(r'^ \d+ $', c[1]) and c[2].strip() in d:
        r = d[c[2].strip()]
        if 'error' in r: continue
        sh = r['shells']; shd = sh.get('DRAWS', 0); sho = sum(sh.values()) - shd
        st = ' census 2026-10-24 (dev/effects-coverage.md): %d records -- %d draw, %d start no draw, %d named refusal, %d open; %d not requested; shells %s ' % (
            r['universe'], len(r['draws']), len(r['starts_nodraw']), len(r['refusal']), len(r['open']), len(r['not_requested']), ('%d / %d' % (shd, shd + sho)) if sh else '--')
        # the status column is the last filled cell before the closing pipe
        c[-2] = st
        L[i] = '|'.join(c)
open(p, 'w', encoding='utf8').write('\n'.join(L))
print('ok')
