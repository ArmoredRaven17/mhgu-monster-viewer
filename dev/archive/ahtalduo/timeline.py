"""The combined timelines of Ahtal-Ka + Ahtal-Neset, from the ROM reads in dev/em088-em087-combined-spec.md (frame by frame,
float32, dt 1.0 a viewer frame). Neset's (1, 0x14) L0 M9 (0x10afebc): rate 1 to frame 226, then P+0x398 -= 0.25 dt a frame
(floor 0.1, literal 0x10b0280) from 226; at frame >= 230 rate 0 and frame = 230.0 (0x10b00c4..0x10b00ec); G+0xcd when that is
reached and P+0x5c (+4.0 dt a frame, tune 0x2a, to tune 0x29 = 300) is up (0x10b0240..0x10b026c). The update order (the main reads
the frame, then the layer advances by the rate) is INFERRED. Prints the update count to G+0xcd and the frame each update."""
import numpy as np
f32 = np.float32
f, rate, p5c, k = f32(0), f32(1), f32(0), 0
trace = []
while True:
    r8 = 1
    p5c = f32(p5c + f32(4.0))
    if p5c >= f32(300): p5c = f32(300); r8 = 0
    sb = 1
    if f >= f32(230):
        rate = f32(0); f = f32(230); sb = 0
    elif f >= f32(226):
        rate = f32(rate + f32(-0.25))
        if not (rate > f32(0.1)): rate = f32(0.1)
    trace.append((k, float(f), float(rate), float(p5c)))
    if not (r8 or sb): break
    f = f32(f + rate); k += 1
print('updates from (1, 0x14) phase 1 to G+0xcd:', k, '(the frame before:', trace[-2][:3], ')')
for row in trace[224:]: print(row)
