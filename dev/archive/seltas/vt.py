import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis as A
def vt(va, n=100):
    return [A.u32(va + 4*i) for i in range(n)]
names = {'em069_00':0x17e0eb8,'em076_00':0x17e5e84,'s69_00':0x17e1f40,'s69_01':0x17e20bc,'s76_00':0x17e77b0,'s76_01':0x17e792c,'s76_37':0x17e7a9c}
if __name__ == '__main__':
    cols = sys.argv[1].split(',')
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 96
    V = [vt(names[c], n) for c in cols]
    print('       ' + ' '.join('%9s' % c for c in cols))
    for i in range(n):
        print('+0x%03x ' % (4*i) + ' '.join('%9x' % v[i] for v in V))
