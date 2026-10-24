import sys, struct
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
D = open(r'C:\MHGU-ROM\exefs\main.data', 'rb').read(); DA = 0x1728000
w = lambda va: struct.unpack_from('<I', D, va - DA)[0] if DA <= va < DA + len(D) - 4 else None
def thunk(fn):
    if fn is None or fn + 12 > len(T): return None
    a, b, c = struct.unpack_from('<3I', T, fn)
    if (a & 0xffff0000) != 0xe59f0000 or c != 0xe12fff1e: return None
    lit = fn + 8 + (a & 0xfff); off = struct.unpack_from('<I', T, lit)[0]
    got = (fn + 4 + 8 + off) & 0xffffffff
    return w(got)
