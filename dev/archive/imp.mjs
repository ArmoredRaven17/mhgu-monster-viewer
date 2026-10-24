const base = 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/';
const MS = await import(base + 'docs/render/motion-states.js');
const TO = await import(base + 'docs/render/tail-option.js');
const C = await import(base + 'dev/checks/em046_00.mjs');
const fs = await import('node:fs');
const mon = JSON.parse(fs.readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/monsters.json', 'utf8'));
const e = (Array.isArray(mon) ? mon : mon.monsters).find(x => x.id === 'em046_00');
const t = MS.MOTION_STATES.em046_00;
console.log(Object.keys(t).length, 'rows');
for (const [k, v] of Object.entries(t)){
  const [l, c] = k.split('|'); const L = e.lists.find(x => x.id === l);
  const ok = L && L.clips.some(x => x.clip === c || x.clip === c + '_loop' || x.clip === c + '_start');
  console.log(ok ? 'ok ' : 'MISSING ', k, JSON.stringify(v));
}
console.log('puff', JSON.stringify(MS.RAGE_PUFF.em046_00), MS.RAGE_PUFF.em046_00.pick());
console.log('drool', MS.TIRED_DROOL.em046_00, 'charge', MS.CHARGE_EFFECTS.em046_00);
console.log('cut', JSON.stringify(TO.CUT_TAIL.em046_00), typeof C.pageCheck);
console.log('em047 still', !!MS.MOTION_STATES.em047_00, !!MS.RAGE_PUFF.em047_00, MS.TIRED_DROOL.em047_00);
// every set named exists
const sets = new Set(); const walk = s => { if (!s) return; if (s.cycle) return s.cycle.forEach(walk); (s.levels||[]).flat().forEach(x=>sets.add(x)); (s.sets||[]).forEach(x=>sets.add(x)); };
Object.values(t).forEach(walk); console.log('sets', [...sets].sort((a,b)=>a-b), 'of', e.groups.length);
