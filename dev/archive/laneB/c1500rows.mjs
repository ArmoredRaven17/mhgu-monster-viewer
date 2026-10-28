// laneB/c1500rows.mjs: per monster, the MOTION_STATES rows that make index.html stepC1500's "lying" (a sleep hold: c 1102 every /
// puffOff, or dead) -- to pick each probe's clips
import { pathToFileURL } from 'node:url';
const MS = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/motion-states.js').href);
const T = MS.MOTION_STATES;
for (const id of process.argv.slice(2)){
  const t = T[id] || {};
  const sleep = [], dead = [];
  for (const [k, v] of Object.entries(t)){
    const s = JSON.stringify(v);
    if (v.dead) dead.push(k);
    if (v.puffOff || /1102/.test(s)) sleep.push(k);
  }
  console.log(id, 'sleep', sleep.join(' '), '| dead', dead.join(' '));
}
