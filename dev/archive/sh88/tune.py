import struct, sys
p = r'C:\MHGU-Extract\scratch-em\%s\enemy\action_tune\%s_actiontune.fup' % (sys.argv[1], sys.argv[1])
b = open(p, 'rb').read()
ver, ni, nf, nv = struct.unpack_from('<4I', b, 4)
it = list(struct.unpack_from('<%di' % ni, b, 20)); fl = list(struct.unpack_from('<%df' % nf, b, 20 + 4*ni))
o = 20 + 4*ni + 4*nf
vs = [struct.unpack_from('<3f', b, o + 12*i) for i in range(nv)]
print('ints', it); print('floats', list(enumerate(fl))); print('vecs'); [print(i, v) for i, v in enumerate(vs)]
print('len', len(b), 'end', o + 12*nv)
