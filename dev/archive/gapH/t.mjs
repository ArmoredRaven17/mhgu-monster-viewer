import fs from 'fs';
const M = JSON.parse(fs.readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/monsters.json', 'utf8'));
const table = M.monsters.find ? M.monsters.find(m => m.id === 'em084_00').groups : Object.values(M.monsters).find(m => m.id === 'em084_00').groups;
function userLevel(levels, table, drawn){
  if (!table || !drawn) return 0;
  const at = levels.map(sets => { const m = new Map(); for (const s of sets) for (const [p, v] of table[s] || []) m.set(p, v); return m; });
  let lv = 0;
  for (let k = 1; k < at.length; k++){
    const own = [...at[k]].filter(([p, v]) => v && at[k - 1].get(p) === false).map(([p]) => p);
    if (own.some(p => drawn.get(p) === true)) lv = k;
  }
  return lv;
}
const NAKARKOS084 = { 2: { sets: [[11], [12]], lv: [0, 3] }, 3: { sets: [[9], [10]], lv: [0, 3] }, 4: { sets: [[13], [14], [15]], lv: [0, 2, 4] } };
function nakarkosParts084(monId, table, drawn){
  if (monId !== 'em084_00') return undefined;
  const out = {};
  for (const [part, L] of Object.entries(NAKARKOS084)) out[part] = L.lv[userLevel(L.sets, table, drawn)];
  return out;
}
const all = [0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,20,24,25,26,28,100,113,114];
const show = on => new Map(all.map(p => [p, on.includes(p)]));
const base = [0,10,100,1,2,3,4,113,114];
for (const [name, on] of [['intact', [5,6,7,8]], ['row5 broken', [15,25,6,7,8]], ['row6 broken', [5,16,26,7,8]], ['row7 cracked', [5,6,8,17]], ['row7 broken', [5,6,17,18,28]], ['all broken', [15,25,16,26,17,18,28]]])
  console.log(name.padEnd(14), JSON.stringify(nakarkosParts084('em084_00', table, show([...base, ...on]))));
console.log('other', nakarkosParts084('em083_00', table, show(base)), 'nodrawn', JSON.stringify(nakarkosParts084('em084_00', table, null)));
