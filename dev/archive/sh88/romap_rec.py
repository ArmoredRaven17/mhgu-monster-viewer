p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf-8').read()
anchor = "| `efx/record_shells.py`, `efx/shellplan.mjs`, `dev/shell-capture.mjs` | shell recordings from the viewer's own inputs |"
i = s.index(anchor)
j = s.index('\n', i) + 1
row = ("| `efx/record_shells.py --carry= / --loop / --then= / --len=` + `ADD_NO_LIFT=1`; `dev/shell-capture.mjs --carry / --loop / --then`; "
       "`efx/shellplan.mjs` named-handle stops (shell implementation agent, 2026-10-15) | Ahtal-Ka's shell inputs: `--carry=<0|1|2|4>` sets the "
       "Carrying control (e+0xcb0c; the pull's pick too, INFERRED one control); `--loop` keeps the clip looping (his webs are made on L2 M30's "
       "first wrap); `--then=<list>:<clip>[:<steps>]` plays a second clip in the SAME session after the first (the pull reads the spot a "
       "shell57 end left in state.spots088; an L3 start releases the webs). All three go in the capture TAG (`_c<v>`, `_loop`, `_t<then>`), "
       "as --wall / --arm-form / --level / --part do, so a capture of other inputs is never reused. `--len=<frames>` (tag `_len<N>`): the recording's frame cap, default 900 -- **a shell living past 900 frames never had its END recorded**: Ahtal-Ka's lines u 90 / 91 stop at 1891 and refused live at `0x9b7008` (lifted 0x9b6e44, `[r4+0x30] != 0`) exactly there (soak L2 M33 -> M35..M39); recorded again `--len=2200`. `ADD_NO_LIFT=1`: record_shells adds its "
       "sets to V= and leaves the lift to ONE run after a batch. shellplan: a start with `slot` maps slot -> request index; `shell.stops` "
       "({slot, mode}, 'start' = request 0) become plan stops (mode 1 = hard); no generic end stop for a shell with `handles` (the anchors "
       "stop their own) | 50 em088_00 sets (2026-10-15): u 231/61/261/70 (`2:Motion[17]:7:0x10 --carry=0 --then=2:Motion[19]_start`), "
       "u 232/62 (`--carry=1`), u 230/60 (`--carry=2`), shell61 u 332/300/330/331/311 (`2:Motion[30]_loop:1:0x1e --loop --then=3:Motion[2]`), "
       "shell60 x5 the same (`...:1:0x22`), balls u 30 -> 31 -> 32 (`2:Motion[26]_loop:7:0x0f` / `7:0x15`), lines u 90/91 "
       "(`2:Motion[33]_loop:1:0x0c --len=2200`, + 4 earlier 900-capped sets), the drop (`2:Motion[28]:1:0x06 --carry=1`) | u 310 (an anchor's end WITHOUT its release byte) "
       "is reached only when the owner is inactive -- no viewer play reaches it, so no set |\n")
s = s[:j] + row + s[j:]
old = ("are exported and need recording / lifting | em088_00 | R (refusals) | probes")
assert s.count(old) == 1
s = s.replace(old, "are exported and need recording / lifting. **RECORDED + LIFTED 2026-10-15** (50 sets, all but u 310: owner-inactive end only; "
              "tooling row `record_shells.py --carry= / --loop / --then= / --len=`); soak (2026-10-16, `--viewer-inputs`): 59 motions played, 0 refused; 13 named shell refusals `carrying nothing (e+0xcb0c = 4)` (the soak's Carrying control is 4) -- before the `--len` lines set L2 M39 refused at `0x9b7008`, before any set L2 M26 at `0xa97d0c` too | em088_00 | R (refusals) | probes")
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok')
