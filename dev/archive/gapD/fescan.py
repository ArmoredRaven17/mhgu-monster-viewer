# every script op 0xfe {0xfe, arg} in main.data whose arg points at two bytes (status, number); prints those matching the wanted pairs,
# plus a count by status for the control
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
D, DA = armdis.DATA, armdis.DA_VA
want = {tuple(int(y, 0) for y in x.split(':')) for x in sys.argv[1].split(',')}
lo, hi = (int(sys.argv[2], 16), int(sys.argv[3], 16)) if len(sys.argv) > 3 else (DA, DA + len(D))
n = 0; hits = []
for o in range(0, len(D) - 8, 4):
    op, arg = struct.unpack_from('<II', D, o)
    if op == 0xfe and DA <= arg < DA + len(D) - 2:
        st, nn = D[arg - DA], D[arg - DA + 1]
        n += 1
        if (st, nn) in want: hits.append((hex(DA + o), st, hex(nn)))
print('op 0xfe records', n); print(hits)
