p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf-8').read()
assert '\n59. **' not in s
s = s.rstrip('\n') + '\n' + (
    "59. **A recording is cut at 900 frames: a shell that lives longer never has its END recorded (2026-10-16).** "
    "efx/record_shells.py capped every set at `min(frames, 900)`. Ahtal-Ka's arena lines (u 90 / 91) stop at 1891; the soak played "
    "L2 M33 and then 1880 frames of other clips, and refused at `0x9b7008` on frame 1891: the stop, which every 900-frame set had cut off. "
    "Before calling a live refusal a new path, compare its frame with the shell plan's `frames`; record past the end with `--len=<N>`.\n")
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok')
