p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
s = open(p, encoding='utf-8').read()
def rep(old, new):
    global s
    assert s.count(old) == 1, old[:80]
    s = s.replace(old, new)
rep("""  // RE-READ: her M46 / M47 (7:0x0b / 0x0c), her M55..M62 moves and the other actions her LINKED streams never issue are
  // solo -- he is not on her there (no more frozen ride on her hunter grab)
  for (const [list, clip] of [['4', 'Motion[46]'], ['4', 'Motion[47]'], ['4', 'Motion[55]_loop'], ['4', 'Motion[90]'], ['0', 'Motion[10]']]){
    await play(list, clip);
    r = await P();
    check(!r.mounted && r.class === 'solo' && r.rowDisabled === true, 'L' + list + ' ' + clip + ' (issued only by her unlinked streams): solo, not mounted', { mounted: r.mounted, class: r.class });
  }""", """  // her M46 / M47 (7:0x0b / 0x0c), her M55..M62 moves, L0 M10: issued by her awareness event groups too (3 / 4 / 5, no
  // link test), asking nothing of him -- both: with the row On he is on her and follows his own logic (no frozen clip)
  for (const [list, clip] of [['4', 'Motion[46]'], ['4', 'Motion[47]'], ['4', 'Motion[55]_loop'], ['4', 'Motion[90]'], ['0', 'Motion[10]']]){
    await play(list, clip);
    r = await P();
    check(r.mounted && r.class === 'both' && r.mode === 'free', 'L' + list + ' ' + clip + ' (both, no request): mounted with the row On, his own logic', { mounted: r.mounted, class: r.class, mode: r.mode });
  }
  // REQUIRED clips (her action asks him, or her joint 200 work is aimed at him) mount him with the row Off
  await V.partner(false);
  for (const [list, clip, his] of [['4', 'Motion[83]', 'Motion[45]_loop'], ['4', 'Motion[86]', 'Motion[45]_loop'], ['4', 'Motion[93]', 'Motion[45]_loop'],
                                    ['4', 'Motion[95]', 'Motion[45]_loop'], ['4', 'Motion[82]', 'Motion[45]_loop'], ['4', 'Motion[7]', 'Motion[7]'],
                                    ['4', 'Motion[24]', 'Motion[7]'], ['4', 'Motion[10]', 'Motion[5]_loop'], ['4', 'Motion[25]', 'Motion[3]_loop'],
                                    ['3', 'Motion[23]', 'Motion[48]'], ['0', 'Motion[65]', 'Motion[33]'], ['4', 'Motion[74]', 'Motion[71]_start'],
                                    ['4', 'Motion[96]', null], ['4', 'Motion[76]_loop', 'Motion[35]_loop']]){
    await play(list, clip);
    r = await P();
    check(r.mounted && r.class === 'combined' && r.rowValue === '1' && (!his || (r.local && r.local.clip === his)),
          'REQUIRED L' + list + ' ' + clip + ': mounted with the row Off, the row reads Combined' + (his ? ', his ' + his : ''), { mounted: r.mounted, class: r.class, local: r.local });
  }
  // ...through a list change made while a load is still in flight: pick a required clip without waiting
  { listSel.value = '0'; const p1 = listSel.onchange(); listSel.value = '4'; const p2 = listSel.onchange();
    clipSel.value = 'Motion[83]'; const p3 = clipSel.onchange(); await Promise.all([p1, p2, p3]);
    await until(async () => { const q = await P(); return q.mounted && q.bodyClip === 'Motion[83]'; }, 300);
    r = await P();
    check(r.mounted && r.bodyClip === 'Motion[83]' && r.local && r.local.clip === 'Motion[45]_loop', 'a required clip picked during a list change in flight still mounts him', { mounted: r.mounted, clip: r.bodyClip, local: r.local }); }
  await V.partner(true);""")
rep("near(l.frame, b % 61), 'her L4 Motion[77] -> his Motion[79] loop from 0 (1:0x20)'", "near(l.frame, b % 60), 'her L4 Motion[77] -> his Motion[79] loop from 0 at the game period 60 (length 61 - 1, loop 0) (1:0x20)'")
rep("l.clip === 'Motion[79]_loop' && l.frame === 4, 'her L4 Motion[78] -> his Motion[79] pose HELD at 187 % 61 = 4", "l.clip === 'Motion[79]_loop' && l.frame === 6, 'her L4 Motion[78] -> his Motion[79] pose HELD at 186 mod 60 = 6")
rep("check(hs.every(x => x === 4), 'her M78: his pose stays on his M79 frame 4 at every frame", "check(hs.every(x => x === 6), 'her M78: his pose stays on his M79 frame 6 at every frame")
rep("pts[106].startsWith('Motion[35]_loop@') && pts[146] === 'Motion[33]@101',\n          'her 7:0x4e / 0x4f with his 7:0x3f: his M33 to 105 (she switches to M42 from 90), his M35 for 40, his M33 from 100'",
    "pts[106] === 'Motion[33]@106' && pts[146] === 'Motion[33]@146',\n          'her 7:0x4e / 0x4f with his 7:0x3f: his M33 to its flag frame 105 (she switches to M42 from 90) and on'")
rep("lay[3] === 'Motion[79]_loop:hold@253+159=4' && lay[4] === 'Motion[79]_loop:hold@412+197=4',\n        'S. Motion[76]-[79]: combined; his ride through her M76, his M79 loop through M77, the frozen pose (frame 4) through M78 and M79'",
    "lay[3] === 'Motion[79]_loop:hold@253+159=6' && lay[4] === 'Motion[79]_loop:hold@412+197=6',\n        'S. Motion[76]-[79]: combined; his ride through her M76, his M79 loop through M77, the frozen pose (frame 6) through M78 and M79'")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
