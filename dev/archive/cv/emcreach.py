# emcreach.py -- everything the EMC interpreter 0x82ec4 and the walk start 0x82770 reach (recursive descent over all main.text, bl / b / PIC
# tables; indirect calls not followed), and every part-state read in it: bl to the break getters 0x9d36c / 0x9d384, 0x9d438, vt+0x370
# (ldr #0x370 + blx), the 0xa3bf4 body, direct #0x3b4 / P+0x3bc.. record loads.  Control: the class band's own reads found the same way.
import sys, re, json
G = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\gapF'
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.path.insert(0, G)
import armdis, rdesc
roots = [int(x, 16) for x in sys.argv[1].split(',')]
seen, ent, ext, unres, tables, fptr = rdesc.walk(roots, 0, len(armdis.TEXT))
code = sorted(seen)
print('insns', len(code), 'entries', len(ent), 'unresolved', len(unres), 'indirect tail', [k for k in ext if isinstance(k, str)][:10])
PART = {0x9d36c: 'breakLevel', 0x9d384: 'breakLevel2', 0x9d438: 'registerBreak', 0xa3bf4: 'vt370body'}
for a in code:
    m, o = seen[a]
    s = m + ' ' + o
    if m.startswith('bl') and o.startswith('#') and int(o[1:], 16) in PART: print('PARTCALL %#x %s %s' % (a, s, PART[int(o[1:], 16)]))
    if re.search(r'#0x370\]', s) and m.startswith('ldr') and not m.startswith('ldrb'): print('LDR370 %#x %s' % (a, s))
    if re.search(r'#0x3b4$', s): print('MOV3B4 %#x %s' % (a, s))
    if re.search(r'#0x3b[4-9a-f]\]|#0x3[c-f][0-9a-f]\]|#0x4[0-3][0-9a-f]\]', s): print('OFF %#x %s' % (a, s))
json.dump(code, open('emcreach_%s.json' % sys.argv[1].replace(',', '_'), 'w'))
