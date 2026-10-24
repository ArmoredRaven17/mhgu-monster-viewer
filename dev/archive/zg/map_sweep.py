# map_sweep.py: the input sweep (2026-10-19, round 2) -> rom-map rows + a Withdrawn entry; append-only
import io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
t = io.open(P, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in t else '\n'
lines = t.split(nl)
i = next(k for k, l in enumerate(lines) if l.startswith('| the viewer\'s TEMPORARY hide `HIDE_MODELS`'))
S = '<scratchpad>'
rows = [
"| THE INPUT SWEEP (draw meter, 2026-10-19, round 2): `%s/metersweep.mjs` | every clip a record names on every list the page makes (the Snow Variants, the combined list, the Special list), each Clip-menu copy, each clip replayed once per shell pick (up to 6); then every visible control set to each value (State, Rage, Level, Variant, Carry, Boulder, the class control -- Wind Aura, Fire Aura, Gas -- the switches and class toggles) with the shell / state clips replayed under it; the meter on throughout; `never` = exported records that still never started. Run on the shells agent's batch 2 + Kushala, Alatreon, the Seltas Queen's combined list: **every record that started draws** (Kushala 56, Alatreon 68, the Queen's duo 79, Nakarkos 78 incl. both arms, Valstrax 100, Tetsucabra 57 / Drilltusk 74, the Rath line, Kirin 25, Savage 46); the ones that did not start are listed per monster in `%s/sw/<id>.out` -- break-, rank- and hit-gated (Rath u 5xx clip records, Tetsucabra's u 100 / 101 / 110 / 111 / 21..43, Nakarkos's arm shells), not claimed | all | R (measured) | %s/sw/ |" % (S, S, S),
"| -- OFF CAMERA, explained: the survey camera, not the placement | the units of every 'off camera' shell record sit on their shell's end point; the far coordinates were ABSOLUTE after the monster's travel accumulated over the survey's clips (Lagombi u 12 probed alone: unit z 975, shell19 mode 1 ends at z 2096, 1121 ahead -- the shells agent's offline replay 1170 -- and u 12's units there). The survey camera rides the travel and stands in front of the monster, in the shells' path. Dreadking (7, 0x0a) shell00 30 lands on his floor 1087 below the hovering unit (L2 is his flight list; the shells agent's replay) -- not through it. Nakarkos u 220: the record's own absolute point. Shagaru u 124: the shells agent to confirm | shells / viewer camera | R | rows above |",
"| -- Kushala's c 29 / 30 / 32..35 and u 130 / 131 -- never start | his sp_00 landing (0xdfd748) picks its ef by hit type (shells.js hitType: 0 a wall or a steep slope, 1 a flat floor, 2 a hunter hit); the page's flat floor gives type 1 (c 31, which draws). A wall forced with `__view.box('wall', -15)` at Wind Aura 3, every pick twice: no type-0 landing started (c 31 only) -- what the shells' stage reads for a wall: the shells agent. Type 2: no hunters. c 33..35 are placement MODE 4 (camera-attached): not reached -- their start is a hit type the page cannot make | uEm024_00 shells | open | %s/wallprobe2.mjs |" % S,
]
lines[i + 1:i + 1] = rows
w = next(k for k, l in enumerate(lines) if l.startswith('### Withdrawn'))
w = next(k for k in range(w, len(lines)) if lines[k].startswith('|---')) + 1
lines.insert(w, "| rom-map \"the draw survey\" OFF CAMERA row and the effects lane's messages (2026-10-19): far shell positions \"Lagombi / Snowbaron u 12 (z 26413 / 31230)\", \"Kushala u 120 (z 15625)\" etc. as the shells' reach | those were the effect's FIRST VERTEX and absolute world points after the monster's travel over many survey clips, not distances from the monster; for a polygon record the first vertex is not even the effect's position | the effect units sit on their shells' end points (Lagombi: 1121 ahead, the replay's 1170); \"OFF CAMERA, explained\" row; the meter's diag now carries `unitsAt` |")
io.open(P, 'w', encoding='utf8', newline='').write(nl.join(lines))
print('ok')
