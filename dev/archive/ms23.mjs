import { readFileSync } from 'fs';
const MS = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/motion-states.js');
const T = MS.MOTION_STATES.em023_00;
console.log(Object.keys(T));
console.log('drool', MS.TIRED_DROOL.em023_00, 'puff', MS.RAGE_PUFF.em023_00);
const mons = JSON.parse(readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/monsters.json', 'utf8'));
const m = (mons.monsters || mons).find(e => e.id === 'em023_00');
for (const k of Object.keys(T)) { const [l, c] = k.split('|'); const L = m.lists.find(x => String(x.id) === l);
  if (!L || !L.clips.some(x => x.clip === c || x.clip === c + '_loop' || x.clip === c + '_start')) console.log('MISSING', k); }
const tbl = m.groups;
// user drawn: Calm rung, tail intact (set 5), head intact, arms 7, eyes 1
const drawnFrom = sets => { const d = new Map(); for (const s of sets) for (const [p, v] of tbl[s]) d.set(p, v); return d; };
const run = (clip, list, user, drawnSets, plays = 1) => {
  const ms = new MS.MotionStates(); ms.showParts(drawnFrom(drawnSets), tbl);
  let r;
  for (let i = 0; i < plays; i++){
    r = ms.step('em023_00', list, clip, 0, {}, user);
    const d = drawnFrom(drawnSets); ms.showParts(d, tbl);
    ms.step('em023_00', '3', 'Motion[3]', 0, {}, user);   // land between plays
    ms.step('em023_00', list, clip, 0, {}, user);
    // undo: we only want the last play -- simpler: re-run below
  }
  return ms;
};
const show = (label, list, clip, user, drawnSets, nPlays) => {
  const ms = new MS.MotionStates(); const d0 = drawnFrom(drawnSets); ms.showParts(d0, tbl);
  let out;
  for (let i = 0; i < nPlays; i++){ ms.step('em023_00', '3', 'Motion[3]', 0, {}, user); out = ms.step('em023_00', list, clip, 0, {}, user); }
  console.log(label, JSON.stringify({ fire: out.fire, holdOn: out.holdOn, sets: ms.cur && ms.cur.sets, rage: ms.rage(user.rage), tired: ms.tired(), dead: ms.dead(), puffOff: ms.puffOff() }));
};
const calm = { rage: false, level: 0 }, enr = { rage: true, level: 1 };
show('L3M1 intact', '3', 'Motion[1]', calm, [3, 4, 5, 2, 6, 7, 1], 1);
show('L3M1 lv1', '3', 'Motion[1]', calm, [9, 4, 5, 2, 6, 7, 1], 1);
show('L3M1 lv2', '3', 'Motion[1]', calm, [9, 10, 5, 2, 6, 7, 1], 1);
for (let n = 1; n <= 4; n++) show('L3M2 play' + n + ' enraged intact tail', '3', 'Motion[2]', enr, [3, 4, 14, 12, 13, 15, 1], n);
show('L3M2 play2 enraged severed tail', '3', 'Motion[2]', enr, [3, 4, 16, 12, 13, 15, 1], 2);
show('L0M5 calm intact', '0', 'Motion[5]', calm, [3, 4, 5, 2, 6, 7, 1], 1);
show('L0M5 calm severed', '0', 'Motion[5]', calm, [3, 4, 11, 2, 6, 7, 1], 1);
show('L0M17 armor', '0', 'Motion[17]', { rage: true, level: 2 }, [3, 4, 14, 12, 13, 15, 1], 1);
show('L0M23', '0', 'Motion[23]', calm, [3, 4, 5, 2, 6, 7, 1], 1);
show('L0M24', '0', 'Motion[24]', calm, [3, 4, 5, 2, 6, 7, 1], 1);
for (let n = 1; n <= 3; n++) show('L3M13 play' + n, '3', 'Motion[13]', calm, [3, 4, 5, 2, 6, 7, 1], n);
for (const c of ['Motion[11]', 'Motion[7]', 'Motion[8]']) show('L3 ' + c, '3', c, calm, [3, 4, 5, 2, 6, 7, 1], 1);
show('L3M19 enraged severed armor brokenhead', '3', 'Motion[19]', { rage: true, level: 2 }, [9, 10, 16, 12, 13, 15, 1], 1);
show('L3M18 enraged', '3', 'Motion[18]', enr, [3, 4, 14, 12, 13, 7, 1], 1);
// timers: L3M13 paralysis every 60
const ms = new MS.MotionStates(); ms.showParts(drawnFrom([3,4,5,2,6,7,1]), tbl);
let f = []; let r = ms.step('em023_00', '3', 'Motion[13]', 0, {}, calm); f.push(...r.fire.map(x => '0:' + x[1]));
for (let fr = 1; fr <= 130; fr++){ r = ms.step('em023_00', '3', 'Motion[13]', fr, {}, calm); f.push(...r.fire.map(x => fr + ':' + x[1])); }
console.log('L3M13 timer', f.join(' '));
