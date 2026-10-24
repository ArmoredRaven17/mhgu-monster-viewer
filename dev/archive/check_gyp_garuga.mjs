const m = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js');
const h = x => x.toString(16);
console.log('gyp L4M3 crest on / broken', h(m.pslMask('em009_00', 4, 3, null, {})), h(m.pslMask('em009_00', 4, 3, null, { crestBroken: true })));
console.log('gyp L4M7 (7,27) enraged', h(m.pslMask('em009_00', 4, 7, [7, 0x27], { rage: true })), ' (7,28) tired', h(m.pslMask('em009_00', 4, 7, [7, 0x28], { tired: true })));
console.log('gyp L4M9 action calm / rage', m.clipActionFor('em009_00', 4, 'Motion[9]', 1, {}), m.clipActionFor('em009_00', 4, 'Motion[9]', 1, { rage: true }));
console.log('dd L2M12 lvl2 tired', h(m.pslMask('em018_04', 2, 12, null, { breakLevel7: 2, tired: true })), ' enraged', h(m.pslMask('em018_04', 2, 12, null, { breakLevel7: 2, rage: true })));
console.log('gar L2M12 severed', h(m.pslMask('em018_00', 2, 12, null, { severed: true })), ' gar lvl2', h(m.pslMask('em018_00', 2, 12, null, { breakLevel7: 2 })));
console.log('L2M2 calm', h(m.pslMask('em018_00', 2, 2, null, {})), ' dd L0M7 (7,e3)', h(m.pslMask('em018_04', 0, 7, [7, 0xe3], {})), ' gar', h(m.pslMask('em018_00', 0, 7, [7, 0xe3], {})));
console.log('bloodbath tired arm still', JSON.stringify(m.clipActionFor('em004_00', 2, 'Motion[3]', 0, { tired: true })));
