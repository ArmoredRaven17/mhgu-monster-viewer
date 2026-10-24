p = 'emu_fb.py'
s = open(p, encoding='utf8').read()
a = s.index("KINDS = {  # (monster, folder): ctor, init, move, timer offset")
b = s.index("def fly(kind, raw, frames, b1654=0):")
new = r'''# THE KINDS, from the shell table 0x175c3e8 (12-byte rows: class DTI, setup DTI, resource) and the booted DTIs: the class DTI's
# vt+8 is its `new` (the allocation answered with SHELL, then the ctor inline); the vtable is the one the new stores; init
# vt+0x13c, move vt+0x24; the timer field by the setup's base (base00 +0x162c, base01 / base11 +0x1614, base04 +0x15cc)
SHELLTAB = json.load(open(r'C:\MHGU-Extract\efx\agents\narga-shell-scratch\shelltable.json'))
ROWS = {r['id']: r for r in SHELLTAB}
TOFF = {'cSetupParamEmBase00': 0x162c, 'cSetupParamEmBase01': 0x1614, 'cSetupParamEmBase04': 0x15cc, 'cSetupParamEmBase13': 0x1614}
FOLDER = {}          # id -> (monster, folder), filled per case from c['folders'] {id: [mon, folder]}
def kind_of(sid):
    r = ROWS[sid]
    dti = int(r['cls']['dti'], 16)
    newf = r32(r32(dti) + 8)
    return newf, TOFF.get(r['setup']['name'].split('::')[-1], 0x162c)
def make_shell(sid):
    newf, toff = kind_of(sid)
    uc.mem_write(SHELL, b'\0' * 0x1800)
    E.call(newf, ()); assert E.fault is None, E.fault
    vt = r32(SHELL)
    return r32(vt + 0x13c), r32(vt + 0x24), toff

'''
s = s[:a] + new + s[b:]
s = s.replace('''def fly(kind, raw, frames, b1654=0):
    CUR[0] = kind
    ctor, init, move, toff = KINDS[kind]
    LOG.clear(); CREATED.clear(); next_handle[0] = S + 0x50000
    uc.mem_write(SHELL, b'\\0' * 0x1800)
    E.call(ctor, (SHELL,)); assert E.fault is None, E.fault''', '''def fly(sid, raw, frames, b1654=0):
    CUR[0] = FOLDER[sid]
    LOG.clear(); CREATED.clear(); next_handle[0] = S + 0x50000
    init, move, toff = make_shell(sid)''')
s = s.replace("def fly_tree(kind, raw, frames, depth=0, b1654=0):", "def fly_tree(sid, raw, frames, depth=0, b1654=0):")
s = s.replace("    o = fly(kind, raw, frames, b1654)", "    o = fly(sid, raw, frames, b1654)")
s = s.replace("            if cid in ID_KIND:\n                o['children'].append({'at': fr['k'], 'id': cid, 'run': fly_tree(ID_KIND[cid], b, frames, depth + 1)})",
              "            if cid in FOLDER:\n                o['children'].append({'at': fr['k'], 'id': cid, 'run': fly_tree(cid, b, frames, depth + 1)})")
s = s.replace("        sh['run'] = fly_tree(ID_KIND[sh['id']], bytes.fromhex(sh['raw']), c.get('frames', 420), 0, sh['b1654']) if sh['id'] in ID_KIND else None",
              "        sh['run'] = fly_tree(sh['id'], bytes.fromhex(sh['raw']), c.get('frames', 420), 0, sh['b1654']) if sh['id'] in FOLDER else None")
# the owner: the class's em byte and variant, the em057 id fields only for it, the case's pokes
s = s.replace("    w8(OWNER + 0xb5f4, 57); w8(OWNER + 0xb5f5, v)\n    for k, i in enumerate((0xf9, 0xfb, 0xfa) if v == 4 else (0xf7, 0xf8, 0x19d)): w32(OWNER + 0xcafc + 4 * k, i)",
              "    ANS['mon'] = c['mon']\n    load_mon(c['mon'])\n    FOLDER.clear(); FOLDER.update({int(k): tuple(v2) for k, v2 in c['folders'].items()})\n    w8(OWNER + 0xb5f4, int(c['mon'][2:5])); w8(OWNER + 0xb5f5, v)\n    if c['mon'].startswith('em057'):\n        for k, i in enumerate((0xf9, 0xfb, 0xfa) if v == 4 else (0xf7, 0xf8, 0x19d)): w32(OWNER + 0xcafc + 4 * k, i)")
s = s.replace("    w32(CTL + 0x18, c.get('heading', oY))", "    w32(CTL + 0x18, c.get('heading', oY))\n    for k, bb in (c.get('ctl') or {}).items(): uc.mem_write(CTL + int(k, 0), bytes(bb))\n    for k, bb in (c.get('block') or {}).items(): uc.mem_write(BLOCK + int(k, 0), bytes(bb))")
s = s.replace("CUR = [('em057_00', '18')]", "CUR = [('em021_00', '00')]")
s = s.replace("CMN = {('em057_04', '01'): {'ints': [0, 0, 0], 'floats': [1500.0, 1500.0, 600.0, 600.0, 600.0, 600.0]}}\n", "")
open(p, 'w', encoding='utf8').write(s)
print('ok')
