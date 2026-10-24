import sys
sys.argv=['x']
import emu_fb as E
for m in ('em083_00','em083_04'):
    E.load_mon(m) if hasattr(E,'load_mon') else None
    T=E.TUNE.get(m); print(m, T[0][:16] if T else None, T[1][:16] if T else None)
