const m = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js');
for (const id of ['em002_00', 'em002_02', 'em002_04'])
  for (const [l, c] of [['4', 'Motion[32]'], ['4', 'Motion[31]'], ['4', 'Motion[38]'], ['2', 'Motion[3]'], ['2', 'Motion[4]'], ['2', 'Motion[1]'], ['0', 'Motion[16]'], ['0', 'Motion[17]']])
    for (const o of [{}, { tired: true }, { rage: true }])
      console.log(id, l, c, JSON.stringify(o), JSON.stringify(m.pickVariantsFor(id, l, c, o)));
