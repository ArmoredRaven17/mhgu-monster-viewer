# gen_table.py: dev/shells-draw-table.md from drawtable.json (classify.py) plus the reasons named by hand (REASONS below)
import json, collections, os, re
rows = json.load(open('drawtable.json'))
names = {}
try:
    M = json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\monsters.json', encoding='utf8'))
    for m in (M if isinstance(M, list) else M['monsters']): names[m['id']] = m.get('name') or m.get('label') or m['id']
except Exception: pass
REASONS = {}
for fn in ('reasons_agents.json', 'reasons_me.json', 'reasons.json'):
    if os.path.exists(fn): REASONS.update(json.load(open(fn)))
WH = set('%s:%s' % (m, x) for m, v in json.load(open('wallhunter.json')).items() for x in v) if os.path.exists('wallhunter.json') else set()
REFUSE = {"em002_00": "; its hit kind 0xd (0x16ae64 -> 0x2f5bf0) is tested only on a hunter in action group 0x80 with an action in 2 / 5 / 6 / 9 / 10 / 12 / 13 / 15 / 16 / 18 / 19: a standing hunter (the ctor group 1) never is (gapN)", "em002_02": "; hit kind 0xd: only a hunter in action group 0x80 (0x2f5bf0; gapN)", "em002_04": "; hit kind 0xd: only a hunter in action group 0x80 (0x2f5bf0; gapN)"}
def cat(r):
    k = '%s:%s:%d' % (r[0], r[1], r[2])
    s = r[5]
    if s == 'draws': return ('DRAWS', "with the Hunter control's Solid body (a type-2 contact)" if k in WH else '')
    if s == 'draws off camera': return ('DRAWS', 'off the meter\'s camera, lit when aimed at')
    if k in REASONS: return tuple(REASONS[k])
    if s.startswith('CONTACT'): return ('NO WALL / HUNTER', "its ef slot is the type-0 (wall) / type-2 (hunter) contact of its base's +0x150: the stage is a floor only, and the Solid hunter (the Hunter control) did not meet it at 0 / 500 / 1200 in front or 500 behind" + REFUSE.get(r[0], ''))
    if s.startswith('NO DRAW'): return ('ROM GIVES NOTHING', s[9:])
    return ('OPEN', s)
out = []
tot = collections.Counter()
by = collections.defaultdict(list)
for r in rows:
    c, why = cat(r); tot[c] += 1; by[r[0]].append((r, c, why))
out.append('# Shell draw table -- every shell record of every monster with SHELL_DATA (shells agent, 2026-10-20)')
out.append('')
out.append('For every record in `docs/effects/<mon>.json` with `when: \'shell\'` (%d of them, on %d monsters), what the effects agent\'s' % (len(rows), len(by)))
out.append('draw meter (`__view.effectMeter`) measured when the page played every clip that makes its shells:')
out.append('- **starts**: how often it started;')
out.append('- **lit**: lit samples / samples;')
out.append('- **verdict**.')
out.append('')
out.append('A record that never started has a named reason.')
out.append('')
out.append('## Totals')
out.append('')
out.append('| verdict | records |')
out.append('|---|---|')
for k, n in tot.most_common(): out.append('| %s | %d |' % (k, n))
out.append('| **all** | **%d** |' % sum(tot.values()))
out.append('')
out.append('## How it was measured')
out.append('')
out.append('- **The plays** (`<archive>\\fb\\smfull.mjs`):')
out.append('  - every clip of the monster whose shells start a record in a node replay of `stepShells`, over every pick of that clip;')
out.append('  - Tigrex\'s / Grimclaw\'s four grounds;')
out.append('  - every beam row\'s clip with its partner clips, in a rage pass where the row asks for rage.')
out.append('- **The meter** (`shellmeter.mjs`):')
out.append('  - plays every menu entry of each clip (its copies, and both halves of a split clip);')
out.append('  - lets a clip wrap through its picks, because a wrap is a new play;')
out.append('  - runs with the clip loop on, through the shared two-slot soak lock.')
out.append('- **The state sweep** (records still unstarted): every option of each state control the page shows for that monster, the')
out.append('  plays again each time. The controls: State, the class controls, Carrying, Stance, Boulder, Level, the class toggles, and the')
out.append('  Quest Rank (High / Low).')
out.append("- **Rounds 3 to 7** (2026-10-20 / 21): the plays the node replay could not plan -- the play's action (Zinogre's picks), rage in the")
out.append("  picks, the Snow Variants list, the Charge rung, the Rockets and Wind Aura controls, Quest Level 0, the tentacle forms (the")
out.append("  attached rows), the Parts rows, chained plays on one shell state, a _loop's wraps -- and the makers built for this table.")
out.append('- The best measurement of each record across all runs is kept (`classify.py`, `drawtable.json`).')
out.append('')
out.append('## Built and fixed for this table (shells agent and its decode helpers, 2026-10-20)')
out.append('')
for line in [
 "- FIXED index.html unitGamePos: the unit stood still through a pass (the travel is the `reference` node's) -- Mizutsune's / Soulseer's trail.",
 "- FIXED slam060: an attributed Ground is refused by name (the stage number is not an input) instead of the plain dust.",
 "- FIXED params11n: sp_11's init starts nothing (base11 starts only +0x15c8 / +0x15cc) -- Nakarkos u_r 10 no longer started at it.",
 "- FIXED Kushala sp_01 startEf2 (its ef 1 is an init start).",
 "- FIXED (2026-10-21) stepShells: a fresh motion first seen at frame 1 / 2 starts its history at 0 (Thunderlord u 180, Chaotic u 90 / 91).",
 "- FIXED (2026-10-21) Kecha Wacha's hang height (motion-states.js AIR_HEIGHT em065_00 `hang`, READ 0xf51fc4): his drop starts above the floor (u 12).",
 "- WIRED (2026-10-21) Nakarkos input.parts084 from the Parts rows (the part pass 0x106b2d0, READ).",
 "- BUILT (2026-10-22) the shells' HUNTER CONTACT (type 2: the hit manager's slot-0 latch, 0x16acf0 -> 0x16b6cc -> 0x43ac8c, READ gapM): shells.js hunterPass + collide's hunter arm, the shapes in shell-hitshapes.js; the hunter's capsule 0x2821e4 on a stand-in standing pose (its in-quest pose NOT READ). Met through the effects agent's Hunter control (Body: Solid).",
 "- LISTED (2026-10-22) Ahtal-Neset's (10, 0x8e) drops: the reaction fires at HP 65% (P+0x380 0.65 at spawn, dtbase bit 16; READ gapL). Congalala's last charges through the effects agent's Charges control (gas021Last).",
 "- BUILT (2026-10-21) Neset's lifts (1, 0x15) / (1, 8): Ahtal-Ka's sp_57 24 / 25 (u 320 / 70; 0x10ac10c READ).",
 "- The meter (2026-10-21): a split clip played as _start then _loop pairs (the pick advances only on the _start); a child made 300 frames on needs the window.",
 "- BUILT Kirin's status-2 strikes; Old Fatalis (7, 0x49) and the storm (sp_01 9); Nargacuga / Silverwind 0xe47b0c; the Nakarkos rank pair,",
 "  sp_11 2's fall and the record table's 65 / 66; Valstrax (7, 0x33) and (3, 4); Ahtal-Ka's anchors' sub-states 2 / 3; Soulseer's base12",
 "  deferred init; Kushala's frame handler (the pulse, sp_01 0..4 / 9 / 10 / 12 / 13); Gammoth's / Elderfrost's leg snow.",
]: out.append(line)
out.append('')
out.append('## The verdicts')
out.append('')
out.append('- **DRAWS**: it lights pixels. A record the meter found drawing off its camera, lit when aimed at, also counts.')
out.append('- **NO WALL / HUNTER**: its only trigger is a contact the viewer cannot give.')
out.append('- **ROM GIVES NOTHING**: it starts, but the ROM builds nothing to draw (a row mask), or the ROM never starts it.')
out.append('- **ROM CONDITION**: the ROM refuses it under the viewer\'s real inputs, for example 900+ above the floor while he flies.')
out.append('- **INPUT STAND-IN**: the viewer\'s stand-in for a game input keeps it from starting.')
out.append('- **INPUT MISSING**: it needs a game input the viewer has no control for.')
out.append('- **NOT EXPORTED**: built, but the monster whose page plays it carries no such record in its effects export.')
out.append('- **NOT BUILT**: its maker is read but not transcribed.')
out.append('- **UNREAD**: a gate on its path is not read yet (named).')
out.append('')
out.append('## Per monster')
for mon in sorted(by):
    out.append('')
    out.append('### %s (%s)' % (mon, names.get(mon, '')))
    out.append('')
    out.append('| record | starts | lit | verdict | why |')
    out.append('|---|---|---|---|---|')
    for r, c, why in sorted(by[mon], key=lambda x: (x[0][1], x[0][2])):
        out.append('| %s %d | %s | %s | %s | %s |' % (r[1][-1], r[2], r[3] or '-', r[4], c, why.replace('|', '/')))
open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-draw-table.md', 'w', encoding='utf8', newline='\r\n').write('\n'.join(out) + '\n')
print(tot)
