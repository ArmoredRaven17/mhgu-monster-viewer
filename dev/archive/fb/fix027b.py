p = 'emu_fb.py'
s = open(p, encoding='utf8').read()
a = """        su = ANS.get('slot0Until')
        kk = '%d:%d' % (r32(SETUP + 4), r32(SETUP + 8))
        if su and kk in su: w8(SHELL + 0x13ad, 1 if k <= su[kk] else 0)
"""
assert s.count(a) == 1
s = s.replace(a, """        su = ANS.get('slot0Until')
        kk = '%d:%d' % (r32(SETUP + 4), r32(SETUP + 8))
        if su and kk in su:
            # (a list: one life per flight of that key in the run's order -- Teostra's ring: the first pillar the leader makes is counted from
            # the step it is made in, before its first move, the module's line-18 order for a child of the last unit)
            u = su[kk]
            if isinstance(u, list): u = u[min(SLOTN.get(kk, 1) - 1, len(u) - 1)]
            w8(SHELL + 0x13ad, 1 if k <= u else 0)
""")
a = "def fly(sid, raw, frames, b1654=0):\n"
assert s.count(a) == 1
s = s.replace(a, "SLOTN = {}\n" + a)
a = "    init, move, toff = make_shell(sid)\n"
assert s.count(a) == 1
s = s.replace(a, a + "    kk0 = '%d:%d' % struct.unpack_from('<II', raw, 4); SLOTN[kk0] = SLOTN.get(kk0, 0) + 1\n")
a = "    ANS['actionAt'] = c.get('actionAt')\n"
assert s.count(a) == 1
s = s.replace(a, a + "    SLOTN.clear()\n")
open(p, 'w', encoding='utf8').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8').read()
a = "    S.start = S.starts[0] || null;\n"
assert s.count(a) == 1
s = s.replace(a, a + "    // a class whose init's second param is live (Teostra's sp_01 mode 1: c 31 and c 34) -- the runtime starts it as the shell's effect2\n    if (def.startEf2 && S.starts[1] && ctx && ctx.out) ctx.out.started.push({ shell: S, start: S.starts[1] });\n")
a = "    shell01: { id: 0xb9, cls: 'uShellEm027_sp_01', base: 'base01', reader: 0xe1ad60, folder: 'shell\\em\\em027_00_shell01',\n"
assert s.count(a) == 1, 'def'
s = s.replace(a, "    shell01: { id: 0xb9, cls: 'uShellEm027_sp_01', base: 'base01', reader: 0xe1ad60, folder: 'shell\\em\\em027_00_shell01', startEf2: true,\n")
open(p, 'w', encoding='utf8').write(s)

p = 'mk027spec.py'
s = open(p, encoding='utf8').read()
s = s.replace("UNTIL.update({'187:%d' % m: 11 for m in range(9)})", "UNTIL.update({'187:%d' % m: [11, 10, 11] for m in range(9)})")
s = s.replace("""    ['b03', { owner: [0, 0x3001, 0] }, 'the facing one word off'],""",
 """    ['b03', { joints: Object.assign({}, JOINTS, { 3: jointOf(0.1, 0.25, 0.05, [30.0, 640.0, 420.0]) }) }, 'joint 3 30 higher (the breath)'],
    ['p05', { owner: [0, 0x3001, 0] }, 'the facing one word off (the ring)'],""")
s = s.replace("_low', 0x2a, 4, 3)):", "_low', 0x2a, 4, 3)):  # (each: unstub 0x6fe88, the current-action test the leaders' trigger reads)")
s = s.replace('", rank: %d, actionAt:', '", unstub: [\'0x6fe88\'], rank: %d, actionAt:')
s = s.replace("""  ", actionAt: { at: 121, before: [2, 0x20], action: [7, 0x2d] }")""", """  ", unstub: ['0x6fe88'], actionAt: { at: 121, before: [2, 0x20], action: [7, 0x2d] }")""")
s = s.replace("""  ", actionAt: { at: 101, before: [7, 0x2a], action: [7, 0x2d] }")""", """  ", unstub: ['0x6fe88'], actionAt: { at: 101, before: [7, 0x2a], action: [7, 0x2d] }")""")
s = s.replace(""", owner_bytes: { '0x73e0': [1, 7], '0x4b4': [5, 0] }")""", """, unstub: ['0x6fe88'], owner_bytes: { '0x73e0': [1, 7], '0x4b4': [5, 0] }")""")
s = s.replace(""", owner_bytes: { '0x73e0': [1, 0x1b], '0x4b4': [5, 0] }, none: 1")""", """, unstub: ['0x6fe88'], owner_bytes: { '0x73e0': [1, 0x1b], '0x4b4': [5, 0] }, none: 1")""")
s = s.replace("""    if (c.actionAt) o.actionAt = c.actionAt;""", """    if (c.actionAt) o.actionAt = c.actionAt;\n    if (c.unstub) o.unstub = c.unstub;""")
open(p, 'w', encoding='utf8').write(s)
print('ok')
