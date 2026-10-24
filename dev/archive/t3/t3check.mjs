// t3check.mjs -- render/hit-type3.js type3VsHunter against the ROM-RUN of 0x167f70 (t3emu.py), same probes
import { type3VsHunter } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/hit-type3.js';
const A = { p0: [0, 0, 0], p1: [0, 100, 0], r: 50 };
const hb = (x, y) => ({ p0: [x, y, -20], p1: [x, y, 20], r: 10 });
const ROM = [[[40,50],[30,50,0]],[[55,50],[45,50,0]],[[59,50],[49,50,0]],[[60,50],[50,50,0]],[[61,50],null],[[70,50],null],
  [[0,105],[0,95,0]],[[0,109],[0,99,0]],[[0,110],[0,100,0]],[[0,111],null],[[0,150],null],[[0,160],null],
  [[0,-5],[0,5,0]],[[0,-10],[0,0,0]],[[0,-11],null],[[45,130],null],[[45,108],[45,98,0]],[[58,105],[49.52,99.7,0]],[[30,140],null],[[55,100],[45,100,0]]];
let bad = 0;
for (const [[x, y], want] of ROM){
  const c = type3VsHunter(A, hb(x, y)), got = c ? c.point.map(v => +v.toFixed(2)) : null;
  const ok = want ? got && got.every((v, i) => Math.abs(v - want[i]) < 0.02) : !got;
  if (!ok) bad++;
  console.log(ok ? 'ok  ' : 'FAIL', [x, y], 'rom', want, 'js', got);
}
console.log(bad ? bad + ' FAIL' : 'all ' + ROM.length + ' match the ROM-RUN');
