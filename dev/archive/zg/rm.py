p=r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'; s=open(p,encoding='utf8').read()
BS=chr(92)
anchor="| `0x1037318..0x103749c` (vt+0x204) | Soulseer's start request:"
i=s.index(anchor); j=s.index('\n',i)+1
row="| `0xb97910` -> `0xb97b64` (lifted-gpu.js `L_b978cc`, `[sb+0xf8] == 0`) | reached by the viewer when Soulseer's u 310 (UNIQUE) is stopped ~1..19 frames into L9 M5; unrecorded (early-stop sets at 3..24 frames do not reach it: static recorder parent, I) -> runtime refusal | uEm082_00 / shared GPU draw | R (the arm) / cause I | em082 spec 6 |\n"
s=s[:j]+row+s[j:]
t="| `<scratchpad>"+BS+"zg"+BS+"allmot2.py` (CLS / EM env)"
k=s.index(t); k2=s.index('\n',k)+1
s=s[:k2]+"| `<scratchpad>"+BS+"rec_stop.py` (2026-10-18) | add_effects.py record() with `N:stop:0` appended (a held record stopped at frame N), suffix `$SUFFIX` + N (default `_stop`), VARIANTS env (`,_near`) | the 60-frame `_stop` sets it extends | static parent: a stop path that needs the parent moving is not reached (Soulseer u 310, em082 spec 6) |\n"+s[k2:]
open(p,'w',encoding='utf8',newline='').write(s)
print('ok')
