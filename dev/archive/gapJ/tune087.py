# tune087.py: locate em087_00_actiontune.fup's float array by its known run (index 0x1e 90.0, 0x1f.. 200, 90, 170: the
# rockets' tune transcribed in shells.js TUNE087_ROCKET, the control) and print the floats asked for (hex indices in argv)
import struct, sys
B = open(r'C:\MHGU-Extract\scratch-em\em087_00\enemy\action_tune\em087_00_actiontune.fup', 'rb').read()
print('size', len(B), 'head', B[:32].hex())
key = struct.pack('<4f', 90.0, 200.0, 90.0, 170.0)
for off in range(0, len(B) - 16):
    if B[off:off + 16] == key:
        base = off - 0x1e * 4
        print('float array base %#x (index 0x1e at %#x)' % (base, off))
        for a in sys.argv[1:]:
            i = int(a, 16); print('  float %#x = %r' % (i, struct.unpack('<f', B[base + 4 * i:base + 4 * i + 4])[0]))
