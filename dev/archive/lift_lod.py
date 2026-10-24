"""Under the shared 'lift' lock (add_effects.shared_lock, kept fresh so it is not taken as stale past 900 s): note the _lod sets'
command in lift-effects.sh's HAND-RECORDED block (comment only), then run ONE lift from a COPY of the script."""
import os, sys, shutil, subprocess, threading, time
EFX = r'C:\MHGU-Extract\efx'
SP = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, EFX)
os.chdir(EFX)
import add_effects as A

NOTE = """#   add_em056_00_u20_lodmid / _lodfar, add_em057_00_u530_lodmid / _lodfar, add_em057_00_u531_lodmid / _lodfar: the
#   model generator draw 0xa9272c's MASKED particle walk (0xa92798..0xa927c0, 0xa928f4..0xa9291c). 0xa718b8 returns the
#   generator's distance-LOD mask: 0 when [gen+0xe8] bits 8..11 == 6, else 0xb8f014's table 0x166aa50[level*3 + class],
#   class 0 / 1 / 2 for camera distance < 2000 / < 5000 / beyond (effect manager +0x1f4 / +0x1f8, ctor 0xb8c858). Every
#   older set drew from 1000 away (efx_draw.py's camera), so the mask was always 0. These are add_effects.py --record's own
#   '' runs (spec, frames, notices, rest joints) with CAMERA_AT=0,0,3500 (_lodmid, mask 1) / 0,0,7000 (_lodfar, mask 3):
#     python <scratchpad>/rec_lod.py em056_00 u20 ; python <scratchpad>/rec_lod.py em057_00 u530,u531
#   (u 530's generators are all level 6 and never take the walk; its two sets add nothing and are harmless.)
"""
ANCHOR = "#   (Gravios's gas cloud re-fires every 3 frames"

stop = threading.Event()
def keep_fresh():
    p = os.path.join(A.LOCK_DIR, 'lift.lock')
    while not stop.wait(60):
        try: os.utime(p, None)
        except OSError: pass

with A.shared_lock('lift'):
    t = threading.Thread(target=keep_fresh, daemon=True); t.start()
    sh = os.path.join(EFX, 'lift-effects.sh')
    text = open(sh, newline='').read()
    if 'add_em056_00_u20_lodmid / _lodfar' not in text:
        i = text.index(ANCHOR)
        text = text[:i] + NOTE + text[i:]
        open(sh, 'w', newline='').write(text)
    copy = os.path.join(SP, 'lift-effects.lod.sh')
    shutil.copyfile(sh, copy)
    t0 = time.time()
    print('lift from', copy, flush=True)
    r = subprocess.run(['sh', copy.replace(os.sep, '/')], cwd=EFX, capture_output=True, text=True)
    stop.set()
    print('lift rc', r.returncode, '%.0f s' % (time.time() - t0))
    print((r.stdout or '')[-3000:])
    print((r.stderr or '')[-3000:])
