def patch(p, pairs):
    s = open(p, encoding='utf8', newline='').read()
    for a, b in pairs:
        assert s.count(a) == 1, (p, s.count(a), a[:80])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf8', newline='').write(s)
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render'
patch(R + r'\motion-states.js', [(
"""  '3|Motion[13]':  { dead: true },
};""",
"""  '3|Motion[13]':  { dead: true },
  // (10, 0x6c) 0x17ccb38 = L3 M18 (f0x200) -> L3 M12; (10, 0x6d) 0x17ccdd0 = L3 M14 -> L3 M15 -> L3 M17 -> L3 M18 -> L3 M12 (no other
  // status-10 / 11 script and no traced action plays L3 M12..M18). vt+0x204's arm 0xf09240 (READ): once (e+0xcb38) it stops
  // e+0xcb74 and requests c id 1001 = c 1600 (not kept) and id 1002 = c 1601 into e+0xcb74 (c table [0x169f364]); the frame
  // handler stops e+0xcb74 off those two actions and on motion 0x30c (L3 M12). Both are cm200_050_s, whose three
  // genType-20 (SizeBillboard) rows are built now (construct.js). Held per clip here (the viewer restarts a hold at a clip).
  '3|Motion[18]':   { start: [['em058_00c', 1600, 'UNIQUE']], hold: ['em058_00c', 1601, 'UNIQUE'] },
  '3|Motion[18]#B': { hold: ['em058_00c', 1601, 'UNIQUE'] },
  '3|Motion[14]':   { start: [['em058_00c', 1600, 'UNIQUE']], hold: ['em058_00c', 1601, 'UNIQUE'] },
  '3|Motion[15]':   { hold: ['em058_00c', 1601, 'UNIQUE'] },
  '3|Motion[17]':   { hold: ['em058_00c', 1601, 'UNIQUE'] },
};"""), (
"""  em058_00: { '3|Motion[4]': ['A', 'B'], '3|Motion[5]': ['A', 'B'], '1|Motion[9]': ['A', 'B'] },""",
"""  em058_00: { '3|Motion[4]': ['A', 'B'], '3|Motion[5]': ['A', 'B'], '1|Motion[9]': ['A', 'B'], '3|Motion[18]': ['A', 'B'] },""")])
patch(R + r'\psl-mask.js', [(
"""  em058_00: { '3|Motion[4]': [{ action: [10, 0x20] }, { action: [10, 0x1d], variant: 'B' }],""",
"""  em058_00: { '3|Motion[4]': [{ action: [10, 0x20] }, { action: [10, 0x1d], variant: 'B' }],
              '3|Motion[18]': [{ action: [10, 0x6c] }, { action: [10, 0x6d], variant: 'B' }],""")])
print('ok')
