import os, sys, re
EFX = r'C:\MHGU-Extract\efx'
sys.path.insert(0, EFX); os.chdir(EFX)
import add_effects as A
NAME = 'add_em024_00_c34_range'
NOTE = ("#   add_em024_00_c34_range (effects lane, 2026-10-21): 0x3295fc's OUT-OF-RANGE END 0x329650..0x3296ec -- a mode-4 record (Kushala\n"
        "#   c 34, payload +0x58 900) started with the hunter in range and the hunter moved out at frame 20 (vecdrawsched.py HUNTER_PATH):\n"
        "#     PARENT_JOINTS=joints/em024_00_viewer_rest.json MODEL_MATERIAL_STUB=1 ED4_BACKOUT=1 GPU_DRAW_ROM=1 HUNTER_PATH='0:0,0,300;20:0,0,2100' \\\n"
        "#     python vecdrawsched.py add_em024_00_c34_range 120 0.8 '0:C:/MHGU-Extract/scratch-effects-em/effect/cm/cm200_040.efl:em024_00c:34:UNIQUE'\n")
with A.shared_lock('lift'):
    sh = os.path.join(EFX, 'lift-effects.sh')
    text = open(sh, newline='').read()
    nl = '\r\n' if '\r\n' in text else '\n'
    m = re.search(r'^V=(\S+)$', text, re.M)
    have = set(m.group(1).split(','))
    if 'vectors/' + NAME not in have:
        text = text[:m.end(1)] + ',vectors/' + NAME + text[m.end(1):]
    anchor = "printf '%s' \"$V\" > vectors.list"
    if NAME + ' (effects lane' not in text:
        i = text.index(anchor)
        text = text[:i] + NOTE.replace('\n', nl) + text[i:]
    open(sh, 'w', newline='').write(text)
print('ok')
