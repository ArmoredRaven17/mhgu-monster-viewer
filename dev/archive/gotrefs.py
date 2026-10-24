from scan import *
import sys
def got_users(slot):
    out = set()
    N = len(W) * 4
    for j, L in enumerate(W):
        a = (slot - 8 - L) & 0xffffffff
        if 0 <= a < N and a % 4 == 0:
            w = W[a // 4]
            # ldr Rt,[pc,Rm] : cond 0111 1001 1111 Rt 0000 0000 Rm  (P=1 U=1 B=0 W=0 L=1, reg offset no shift)
            if (w & 0x0fff0ff0) == 0x079f0000 and abs(j*4 - a) < 0x2000:
                out.add(a)
    return sorted(out)
if __name__ == '__main__':
    slot = int(sys.argv[1], 16)
    us = got_users(slot)
    print(len(us))
    print(' '.join(hex(x) for x in us))
