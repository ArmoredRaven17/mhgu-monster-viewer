p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\monster.js'
s = open(p, encoding='utf-8').read()
old = """    'Motion[43]':       [['0', 'Motion[2]']],
    'Motion[35]_loop':  [['0', 'Motion[1]_loop']],
    'Motion[31]':       [['0', 'Motion[1]_loop']],
    'Motion[32]':       [['0', 'Motion[1]_loop']],
    'Motion[33]':       [['0', 'Motion[1]_loop']],
    'Motion[34]':       [['0', 'Motion[1]_loop']],"""
assert s.count(old) == 1
new = """    // (2026-10-18, the static audit: these held his clip's last frame to the end of her side; at each action's end the ROM goes
    // on -- 1:0x1c / 1:0x23 (M43) `0xfc9518`, 7:0x32 (M31) `0xfd46e8`, 7:0x33 (M32) `0xfd480c`, 7:0x34 (M33) `0xfd4908`: the
    // ride (1, 0), M35 b10; 7:0x3a (M34) `0xfd5640`: (3, 0x3d), L4 M5 b0 (`0xfd00cc`), which leaves to the ride on its next update
    // when she is not in the asking action)
    'Motion[43]':       { his: 'Motion[43]', body: [['0', 'Motion[2]']],
                          hisSeq: [{ clip: 'Motion[43]' }, { clip: 'Motion[35]_loop', blend: 10 }] },
    'Motion[35]_loop':  [['0', 'Motion[1]_loop']],
    'Motion[31]':       { his: 'Motion[31]', body: [['0', 'Motion[1]_loop']], hisSeq: [{ clip: 'Motion[31]' }, { clip: 'Motion[35]_loop', blend: 10 }] },
    'Motion[32]':       { his: 'Motion[32]', body: [['0', 'Motion[1]_loop']], hisSeq: [{ clip: 'Motion[32]' }, { clip: 'Motion[35]_loop', blend: 10 }] },
    'Motion[33]':       { his: 'Motion[33]', body: [['0', 'Motion[1]_loop']], hisSeq: [{ clip: 'Motion[33]' }, { clip: 'Motion[35]_loop', blend: 10 }] },
    'Motion[34]':       { his: 'Motion[34]', body: [['0', 'Motion[1]_loop']],
                          hisSeq: [{ clip: 'Motion[34]' }, { clip: 'Motion[5]_loop', frames: 1 }, { clip: 'Motion[35]_loop', blend: 10 }] },"""
s = s.replace(old, new)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
