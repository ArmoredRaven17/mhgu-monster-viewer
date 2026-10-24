import { type3VsHunter } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/hit-type3.js';
import fs from 'fs';
const cases = JSON.parse(fs.readFileSync(new URL('./t3rand.json', import.meta.url)));
let bad = 0, worst = 0;
for (const c of cases){
  const A = { p0: c.A[0], p1: c.A[1], r: c.A[2] }, B = { p0: c.B[0], p1: c.B[1], r: c.B[2] };
  const j = type3VsHunter(A, B);
  if (!!j !== !!c.meets){ bad++; console.log('MEET MISMATCH', JSON.stringify(c), j); continue; }
  if (j){ const e = Math.hypot(...j.point.map((v, i) => v - c.point[i])); worst = Math.max(worst, e); if (e > 0.05){ bad++; console.log("POINT dist " + j.dist.toFixed(3), e.toFixed(3), c.point, j.point.map(v => +v.toFixed(3))); } }
}
console.log(bad ? bad + ' FAIL' : 'all ' + cases.length + ' match', 'worst point error', worst.toFixed(4));
