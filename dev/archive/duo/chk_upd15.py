p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
s = open(p, encoding='utf-8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)
rep("['Motion[79]', 0, 128, 1.3, 'Motion[79]_loop']]){", "['Motion[79]', 0, 79, 1.3, 'Motion[79]_loop']]){   // (to frame 79: at 80 he dies and falls, spec §21)")
rep("""  check(r.mounted && r.class === 'combined' && r.mode === 'seq' && lay.length === 5 &&
        lay[0] === 'Motion[35]_loop:wrap@0+26' && lay[1] === 'Motion[35]_loop:wrap@26+40' && lay[2] === 'Motion[79]_loop:wrap@66+187' &&
        lay[3] === 'Motion[79]_loop:hold@253+159=6' && lay[4] === 'Motion[79]_loop:hold@412+197=6',
        'S. Motion[76]-[79]: combined; his ride through her M76, his M79 loop through M77, the frozen pose (frame 6) through M78 and M79', lay);""",
"""  check(r.mounted && r.class === 'combined' && r.mode === 'seq' && lay.length === 9 &&
        lay[0] === 'Motion[35]_loop:wrap@0+26' && lay[1] === 'Motion[35]_loop:wrap@26+40' && lay[2] === 'Motion[79]_loop:wrap@66+187' &&
        lay[3] === 'Motion[79]_loop:hold@253+159=6' && lay[4] === 'Motion[79]_loop:hold@412+80=6' && lay[5].startsWith('Motion[77]_start:play@492') &&
        lay.some(x => x.startsWith('Motion[78]_start:play')),
        'S. Motion[76]-[79]: his ride through her M76, his M79 loop through M77, frozen (frame 6) through M78 and M79 to frame 80, then his death: M77 falling, M78 lying', lay);""")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
