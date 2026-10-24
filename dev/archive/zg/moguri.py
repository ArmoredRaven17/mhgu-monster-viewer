# moguri.py: the float at file offsets 0x98..0xb0 of each dtbase (MoguriBaseOfs candidates), with the controls
import struct, glob, os
os.chdir(r'C:\MHGU-Extract\scratch-em')
for f in sorted(glob.glob('*/enemy/dt_base/*dtbase*.dtb')):
    b = open(f, 'rb').read()
    mon = f.replace(os.sep, '/').split('/')[0]
    fl = [round(struct.unpack_from('<f', b, o)[0], 1) for o in range(0x98, 0xb0, 4)]
    print(mon, fl)
