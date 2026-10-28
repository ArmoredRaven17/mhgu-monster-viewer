import re
s = open('C:/MHGU-Extract/MHGU-Monster-Viewer/dev/archive/zg/attexport.py').read()
s = re.sub(r'(?m)^HERE = .*$', 'HERE = "C:/MHGU-RE/offline/decode/monster-viewer-scratch/zg"', s)
s = re.sub(r'(?m)^OUT = .*$', 'OUT = "regen_all.json"', s)
open('attexport_dry.py', 'w').write(s)
