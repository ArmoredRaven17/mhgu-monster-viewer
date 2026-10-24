# p15.py: HER M79 KILLS HIM (duo agent, 2026-10-22; spec §21) -- the death in the viewer
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\monster.js'
s = open(p, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:90])
    s = s.replace(old, new)
rep("""                '4|Motion[79]':       { holdAfter: 'Motion[77]', holdAt: 6, seq: [{ clip: 'Motion[79]_loop', mode: 'hold' }] },""",
"""                // HER M79 KILLS HIM (spec §21): her 1:0x24 arms record 0x23 (`0xf8fc8c`: kind 0xa, the sphere r200 on joint 200,
                // flag 0x400 = past the partner exclusion); his 1:0x21 holds the reaction lock P+0x3a2 every frame until her M79
                // frame 80 (`0xfc9980..0xfc99d0`); then the damage step sets his HP to max x P+0x380 (-1.0: 0) and asks (11, 8)
                // (`0x98f98..0x98ff0`, Seltas in the air only: em 0x4c, `0x990cc`) -- frozen on her M79 to frame 80, then his death
                '4|Motion[79]':       { holdAfter: 'Motion[77]', holdAt: 6, seq: [{ clip: 'Motion[79]_loop', mode: 'hold' }], death: { at: 80 } },""")
rep("""ROM_PARTNER_BODY.em069_00.dismounts = {""", """ROM_PARTNER_BODY.em069_00.dismounts = {
  // his death (11, 8), script 0x17e7350: posture air (op 4), L4 M77 b0 (its start, then its loop) until the ground, posture 0,
  // L4 M78 b0 (start, then its loop: he lies dead), then nothing (0xff). The script sets no velocity (op 0x34 with (0, 0, 0));
  // the fall rate of the airborne death is NOT READ -- the viewer drops him with his 1:0x22's read rate (-10 / frame, -1 /
  // frame^2) as a stand-in. Unlinked at the death's start (status 11 clears his bit 0xfc5eac; the next action start unlinks
  // 0xfc4894), upright at his + her yaw
  death: { fall: { v: -10, a: -1 }, standIn: true,
           air: [{ list: '4', clip: 'Motion[77]_start', blend: 0 }, { list: '4', clip: 'Motion[77]_loop', blend: 0 }],
           land: [{ list: '4', clip: 'Motion[78]_start', blend: 0 }, { list: '4', clip: 'Motion[78]_loop', blend: 0, rest: true }] },""")
# the joined grab goes on to her eat (her g1 s46: him dead -> 2:0x15 / 2:0x16 walk, 1:0x1c L0 M16 b4)
rep("""      pieces: [['4', 'Motion[76]_start'], ['4', 'Motion[76]_loop'], ['4', 'Motion[77]', 4], ['4', 'Motion[78]_loop'],""",
"""      pieces: [['4', 'Motion[76]_start'], ['4', 'Motion[76]_loop'], ['4', 'Motion[77]', 4], ['4', 'Motion[78]_loop'],
               // (2026-10-22: he dies at her M79 frame 80; her g1 s46 then eats him -- 1:0x1c, L0 M16 b4. Her walk to him,
               // 2:0x15 / 2:0x16 L0 M8 b12, is not shown: he falls beside her and her steering is not read)""")
open(p, 'w', encoding='utf-8').write(s)
print('monster.js ok')
