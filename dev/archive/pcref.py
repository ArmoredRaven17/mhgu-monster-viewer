from scan import *
import sys, pickle, os
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pcref.pkl')
def build():
    refs = {}   # target -> [(site_of_add_or_ldr, kind)]
    N = len(W)
    for i, w in enumerate(W):
        # ldr Rx,[pc,#+k]
        if (w & 0x0fff0000) == 0x059f0000:
            rx = (w >> 12) & 0xf
            k = w & 0xfff
            la = i*4 + 8 + k
            if la // 4 >= N: continue
            L = W[la // 4]
            for j in range(i + 1, min(i + 6, N)):
                v = W[j]
                if (v & 0x0fff0ff0) == 0x008f0000 and (v & 0xf) == rx:      # add Ry, pc, Rx
                    refs.setdefault((j*4 + 8 + L) & 0xffffffff, []).append((j*4, 'add'))
                    break
                if (v & 0x0fff0ff0) == 0x079f0000 and (v & 0xf) == rx:      # ldr Ry,[pc,Rx]
                    refs.setdefault((j*4 + 8 + L) & 0xffffffff, []).append((j*4, 'ldr'))
                    break
    pickle.dump(refs, open(CACHE, 'wb'))
    return refs
def load():
    if os.path.exists(CACHE): return pickle.load(open(CACHE, 'rb'))
    return build()
if __name__ == '__main__':
    refs = load()
    for t in sys.argv[1:]:
        print(t, [(hex(a), k) for a, k in refs.get(int(t, 16), [])])
