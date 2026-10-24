p = 'C:/MHGU-Extract/efx/vecdrawsched.py'
s = open(p, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
old = "def before_move(x, f):" + nl + "    state['frame'] = f" + nl
assert s.count(old) == 1
new = ("# HUNTER_PATH='<frame>:x,y,z;<frame>:x,y,z': the hunter (efx_emu x.HUNTER +0x40, the point a mode-4 record's range test 0x328d9c" + nl +
       "# measures from) set at the start of each named frame -- a request that starts in range and then leaves it (0x3295fc's" + nl +
       "# out-of-range end 0x329650..0x3296ec; effects lane, 2026-10-21)" + nl +
       "HUNTER_PATH = {}" + nl +
       "for _hp in (os.environ.get('HUNTER_PATH') or '').split(';'):" + nl +
       "    if _hp.strip():" + nl +
       "        _f, _v = _hp.split(':', 1); HUNTER_PATH[int(_f)] = [float(c) for c in _v.split(',')]" + nl +
       "def before_move(x, f):" + nl +
       "    if f in HUNTER_PATH and getattr(x, 'HUNTER', None):" + nl +
       "        x.e.uc.mem_write(x.HUNTER + 0x40, struct.pack('<4f', *HUNTER_PATH[f], 0.0))" + nl +
       "    state['frame'] = f" + nl)
s = s.replace(old, new)
if 'import struct' not in s and not __import__('re').search(r'^import .*\bstruct\b', s, __import__('re').M):
    s = s.replace('import proofunit' + nl, 'import proofunit' + nl + 'import struct' + nl, 1)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
