from scan import *
import sys
def str_users(target):
    out = []
    N = len(W) * 4
    for j, L in enumerate(W):
        a = (target - 8 - L) & 0xffffffff
        if 0 <= a < N and a % 4 == 0 and abs(j*4 - a) < 0x2000:
            w = W[a // 4]
            # add Rd, pc, Rm : cond 0000 1000 1111 Rd 0000 0000 Rm
            if (w & 0x0fff0ff0) == 0x008f0000:
                out.append(a)
    return out
if __name__ == '__main__':
    for t in sys.argv[1:]:
        print(t, [hex(x) for x in str_users(int(t, 16))])
