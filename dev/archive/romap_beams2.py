p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
s = raw.decode('utf-8').replace('\r\n', '\n') if crlf else raw.decode('utf-8')

# tooling rows: before the Armor Viewer's lift-roots subsection
tools = """| `dev/effect-live-soak.mjs --beam-state <json>` (Viewer agent, 2026-09-30) | the state a beam on its own monster fires in (`tired`, `rage`, `rank`, `parts`), merged over the viewer's own `beamState` for the shells' step; each motion's line now ends with the shells spawned, the beam types, and **`SHELL REFUSED:`** with stepShells' reasons (schedule.js `shellTally` -- the schedule dropped `out.refused` before, so a refused beam was silent in a soak) | Alatreon L2 M11: 1 shell, `em050_00:0`, nothing refused | the pick on a multi-row clip is `--rock`'s, not the state's |
| scratchpad `checkrows.mjs` / `scales02b.py` (Viewer agent, 2026-09-30) | every `beam-spawns.js` row against monsters.json (list, clip or its `_start`/`_loop`, the frame inside the motion) and BEAM_MODES; the shell02 `.shl` ShellScale per mode without shlparse's 1.0 assumption | 104 / 104 rows; `scales02b.py` agrees with shlparse on every arc shlparse parses | session scratch: copy before relying on it |

"""
anchor = '### Lift roots reported by the Armor Viewer agent'
assert s.count(anchor) == 1
k = s.index(anchor)
s = s[:k] + tools + s[k:]

trap = """
41. **A generated table carries only what its generator read (Viewer agent, 2026-09-30).** `render/beam-types.js`
   gave the beam runtime every type's life, length, ray and effects -- and no ShellScale, so `step02g` hard-coded the
   requester's scale to 1 and the Beam Test drew Boltreaver's beams (1.2) and Nakarkos's G-rank ones (2.0 / 2.3) at
   1.0, and Raven reviewed them that way. Nothing refused: a missing field reads as the default. Found only because
   Gravios's class path (`make02`) carries `mode.scale` and the two paths were compared. The tool beside it had its
   own version: `agents/rathian-shell-scratch/shlparse.py` finds the first ShellInfoList entry by a ShellScale of
   exactly 1.0, which em083_04's first entry (0.78) is not -- it throws there, and on an arc whose first entry were
   non-1 at a different offset it could have walked garbage. **When a runtime takes a constant where the ROM takes a
   per-record value, list the fields the ROM's own requester fills (proof.js's comment: `0x4a10c8` writes +0x40 =
   ShellScale) and check each against the generator's output.**
"""
s = s.rstrip('\n') + '\n' + trap
if crlf: s = s.replace('\n', '\r\n')
open(p, 'wb').write(s.encode('utf-8'))
print('ok crlf', crlf)
