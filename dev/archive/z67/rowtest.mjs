// node: the spec's em067_00 rows through the viewer's own MotionStates (step + showParts) on the .mpm sets, at each Form rung's
// user parts -- prints the groups drawn per clip / frame
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const MS = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/motion-states.js').href);
const mons = JSON.parse(fs.readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/monsters.json', 'utf8'));
const m = (Array.isArray(mons) ? mons : mons.monsters).find(x => x && x.id === 'em067_00');
const table = m.groups;
const Z_LV = (a, b) => ({ calm: b ? [a, b] : [a], enraged: b ? [a, b] : [a] });
const Z_NOT_BLOB = [Z_LV([0, 10])];
const Z_NOICE_BRK = [Z_LV([2], [22]), Z_LV([3], [18]), Z_LV([6], [21])];
const Z_ICE_BRK = [Z_LV([14], [28]), Z_LV([15], [23]), Z_LV([32], [21])];
const Z_BLOB = { sets: [16, 17, 7, 8, 9], tables: Z_NOICE_BRK };
const Z_ARMOUR = { sets: [0, 10, 11, 12, 13], tables: Z_ICE_BRK };
MS.MOTION_STATES.em067_00 = {
  '3|Motion[4]':  { levels: [[4], [19]], fire: [null, ['em067_00u', 1010]], tables: Z_NOT_BLOB },
  '0|Motion[4]':  { rage: true, tables: Z_NOT_BLOB },
  '4|Motion[1]':  { ...Z_BLOB, hold: ['em067_00c', 1103] },
  '4|Motion[2]':  { ...Z_ARMOUR, setsFrom: [[120, [16, 17]], [130, [7, 8, 9, 2, 3, 6]]] },
  '4|Motion[3]':  { sets: [31, 17, 7, 8, 9], tables: Z_NOICE_BRK, setsFrom: [[374, [0, 10]]] },
  '4|Motion[30]': { ...Z_ARMOUR, setsFrom: [[146, [29]], [221, [11]]] },
  '2|Motion[13]': { tables: Z_NOT_BLOB, setsFrom: [[78, [31, 17]], [148, [0, 10]]] },
  '0|Motion[1]':  { tables: Z_NOT_BLOB },
  '3|Motion[103]': { dead: true, sets: [30, 16, 17, 7, 8, 9], tables: Z_NOICE_BRK },
};
// the user's parts per rung (part-review em067_00, the Blob rung as the spec gives it); tail broken at "brk"
const rung = (r, brk) => {
  const on = new Set([1, 13, 15, 17, 11, ...(brk ? [20] : [19])]);
  if (r === 0) [0, 7, 8, 9, 100, 105, 107, 109, 25].forEach(g => on.add(g));
  if (r === 1){ [0, 7, 8, 9, 100, 105, 107, 109, 25, 4, 102, 3, 28, 26, 29, 23, 27].forEach(g => on.add(g)); if (!brk) on.add(2); }
  if (r === 2) [0, 8, 10, 100, 101].forEach(g => on.add(g));
  const all = new Set(table.flat().map(([p]) => p));
  return new Map([...all].map(p => [p, on.has(p)]));
};
const show = d => [...d].filter(([, v]) => v).map(([p]) => p).sort((a, b) => a - b).join(',');
for (const [list, clip, frames] of [['4', 'Motion[1]', [0]], ['4', 'Motion[2]', [0, 119, 120, 129, 130]], ['4', 'Motion[3]', [0, 373, 374]],
                                    ['4', 'Motion[30]', [0, 146, 220, 221]], ['2', 'Motion[13]', [0, 78, 147, 148]], ['0', 'Motion[1]', [0]], ['3', 'Motion[4]', [0]],
                                    ['0', 'Motion[4]', [0]], ['3', 'Motion[103]', [0]]]){
  for (const r of [0, 1, 2]) for (const brk of [false, true]){
    const ms = new MS.MotionStates(); ms.monId = 'em067_00'; ms.showParts(rung(r, brk), table);
    const out = [];
    for (const f of frames){
      ms.step('em067_00', list, clip, f, {}, { rage: false, level: r, tired: false }, 0);
      const d = rung(r, brk); ms.showParts(d, table);
      out.push('f' + f + ':[' + show(d) + ']');
    }
    console.log(list + '|' + clip, 'rung' + r, brk ? 'tailBroken' : 'tailIntact', out.join(' '));
  }
}
