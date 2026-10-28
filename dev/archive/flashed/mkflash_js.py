"""mkflash_js.py -- census.json (census.py) -> the FLASH_BLIND / FLASH_IMMUNE tables for docs/render/rom/effect/shared-states.js,
printed to stdout (paste by Edit; the shared file is never regenerated). Flashed read 2026-10-25."""
import json, os
H = os.path.dirname(os.path.abspath(__file__))
c = json.load(open(os.path.join(H, 'census.json')))
CLASS_IMMUNE = {'em071_05': "uEm071_00 vt+0x204 0xfadfd4: em 0x47 -> P+0x24a = 1 at every action start (after changeAction's 3, 0x76748)"}
blind, imm = [], []
for k, v in c.items():
    if not v['bit2']:
        imm.append("  %s: 'dtbase +0x6c = %#x, bit 2 clear'," % (k, v['flags'])); continue
    if k in CLASS_IMMUNE:
        imm.append("  %s: %s," % (k, json.dumps(CLASS_IMMUNE[k]).replace('"', "'"))); continue
    row = v['blind'] if v['blind'] else None
    blind.append('%s: %s' % (k, json.dumps(row) if row else 'null'))
print('export const FLASH_BLIND = {')
line = '  '
for b in blind:
    if len(line) + len(b) + 2 > 132: print(line.rstrip()); line = '  '
    line += b + ', '
print(line.rstrip().rstrip(','))
print('};')
print('export const FLASH_IMMUNE = {')
print('\n'.join(imm))
print('};')
print('// %d flashable, %d immune' % (len(blind), len(imm)))
