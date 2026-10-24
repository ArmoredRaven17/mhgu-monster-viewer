import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
s = raw.decode('utf-8').replace('\r\n', '\n') if crlf else raw.decode('utf-8')

anchor = "| `0x6f618` → `0x3cb330` |"
assert s.count(anchor) == 1
rows = """| `0xbdf54` mode 1 (`0xbe048`..`0xbe33c`) | **the tilt pass's PER-FOOT mode, READ (Viewer agent, 2026-10-01)**: only when `0xc3be4(e, 2)` == 1 or the one-shot `P+0x5df0` (else the normal is kept); points p0 / p1 = the record's `e+0x7480` / `e+0x7490` × size (`P+0x1ac` × `P+0x1b0`), turned by the yaw `P+0x54` (a proper rotation) and offset by the unit's position, each `y` probed by `0x49b50` (or left on the plane `P+0x5b4`); c = the unit's position (`[e+0x1424]`); normal = **(c − p0) × (p1 − p0)**, normalised, into `e+0x7460`. The ceiling record's normal `e+0x1080` is NEVER read in this mode | R | index.html `MOUNT` |
| `em020_00` tilt record (`.dtb` +0x74, `tiltrec.py`) | **mode 1**, p0 = **(180, 0, 150)**, p1 = **(−180, 0, 150)** → on ANY flat surface the fitted normal is (0, +1, 0) (y = (−150)(−360) − (−180)(0) > 0): **Shogun is never rolled on a ceiling**; his class writes roll = pitch = 0 on attaching (`0xdc7844` / `0xdc784c`, posture 6 at `0xdc77f8`, L5 M8) and writes no roll / pitch lock (`P+0x342` / `+0x343`: no store in his code); his origin is pinned to the ceiling (`0xbf284`) and his ceiling clips are authored hanging (root Y −230.3). Khezu (mode 0) takes the ceiling's own normal → roll 180 | R | posture-mount.md §3.5 (Khezu); index.html `MOUNT` |
| Shogun's status-7 table `0xdc80a4` (256 offsets from `0xdc807c`) | 61 targets; default `0xdc8870` = the generic unhandled-action logger `0xca050` (`(7,3)` lands there: Shogun has no Daimyo beam action). His own functions plus one shared Daimyo-band function `0xdbc82c` ((7,0xa..0xc / 0x17..0x19 / 0x30 / 0x47..0x4d): L2 M19 → M20) | R | scratchpad beamsB/run_em020_sweep.py |
| **L2 M18 is never played by Shogun** | the family's water-beam motion (Daimyo fires his beam there at f96; Shogun's and Rustrazor's PSLs bind the charge u 231 f20–59 and flash u 230 f88 on it), but in the whole Ceanataur band only Daimyo's beam fn sets `0x212` (`0xdbc3b4`; a `.text`-wide `movw #0x212` scan, 63 sites, none in Shogun's code), every setMotion id in Shogun's code is a literal and none is `0x212`, and a harness sweep of every action his command table issues (statuses 1 / 2 / 3 / 6 / 7) never sets it. **Control**: the same harness on Daimyo's (7,3) logs `0x212` and his spawn at f96 | R (negative, controlled) | scratchpad beamsB/run_em020_sweep2.py, run_em019_control.py |
"""
s = s[:s.index(anchor)] + rows + s[s.index(anchor):]

trap = """
42. **A transform on a monster's GROUP reaches neither its drawn body nor its bones (Viewer agent, 2026-10-01).**
   render/pose.js writes every bone by WORLD matrix against the driver's `frame` (`world`), so the group's own
   transform is divided straight back out (stepTurn's note, 2026-09-27), and three.js's ATTACHED bind mode resets a
   skinned mesh's `bindMatrixInverse` to the inverse of its own world matrix on every update, so the group's
   transform does not reach the drawn mesh either. The posture mount had been written onto the group: on Khezu's
   ceiling clips it moves only bones the driver does not pose (some of his vertices drawn at the ceiling, the rest
   where the clip puts them), and every effect and shell -- which read the posed bones -- stays with the un-mounted
   body. Measured headless with the viewer's OWN loop (a soak steps frames itself and never runs the posture code):
   Shogun's shell joint stayed ~85 above the floor with his group lifted to the ceiling, so his water beam ended in
   the floor beneath him. A transform meant for the body goes on the frame the bones are posed in (index.html
   `mountFrame`, Shogun's mount) or on the proxy (stepTurn) -- never on the group.
"""
s = s.rstrip('\n') + '\n' + trap
if crlf: s = s.replace('\n', '\r\n')
open(p + '.tmp', 'wb').write(s.encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
