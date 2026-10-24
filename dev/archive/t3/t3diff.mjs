// t3diff.mjs -- render/hit-type3.js (the line-by-line transcription of 0x167f70 / 0x7dc9a0) against the ROM's own runs (t3diff.py):
// meets / no-meets agreement and the contact point's error (bits and distance), per family, with the maxima
import { type3VsHunter } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/hit-type3.js';
import fs from 'fs';
const cases = JSON.parse(fs.readFileSync(new URL('./t3diff.json', import.meta.url)));
const U = new Uint32Array(1), F = new Float32Array(U.buffer);
const bitsOf = x => (F[0] = x, U[0]);
const fromBits = u => (U[0] = u, F[0]);
const fam = {};
let worst = 0, worstUlp = 0, mm = 0, n = 0;
for (const c of cases){
  if (c.fault){ console.log('ROM fault', c.fam, c.fault); continue; }
  const s = fam[c.fam] || (fam[c.fam] = { n: 0, meets: 0, agree: 0, pointExact: 0, maxErr: 0, maxUlp: 0 });
  s.n++; n++;
  let j;
  try { j = type3VsHunter({ p0: c.A[0], p1: c.A[1], r: c.A[2] }, { p0: c.B[0], p1: c.B[1], r: c.B[2] }); }
  catch (e){ s.throws = (s.throws || 0) + 1; if (s.throws < 3) console.log('JS throw', c.fam, e.message); continue; }
  const rm = !!c.meets;
  if (rm) s.meets++;
  if (rm === !!j) s.agree++; else { mm++; if (mm < 6) console.log('MEET MISMATCH', c.fam, JSON.stringify(c.A), JSON.stringify(c.B), rm, j); }
  if (rm && j){
    const rp = c.out.slice(0, 3).map(fromBits);
    const e = Math.hypot(...rp.map((v, i) => v - j.point[i]));
    const ulp = Math.max(...rp.map((v, i) => Math.abs(bitsOf(v) - bitsOf(j.point[i]))));
    if (ulp === 0) s.pointExact++;
    s.maxErr = Math.max(s.maxErr, e); s.maxUlp = Math.max(s.maxUlp, ulp);
    worst = Math.max(worst, e); worstUlp = Math.max(worstUlp, ulp);
  }
}
for (const [k, s] of Object.entries(fam)) console.log(k.padEnd(11), 'n', s.n, 'ROM meets', s.meets, 'agree', s.agree + '/' + s.n, 'point bit-exact', s.pointExact + '/' + s.meets, 'max err', s.maxErr, 'max ulp', s.maxUlp);
console.log('ALL', n, 'cases: meet/no-meet disagreements', mm, '; contact point max error', worst, 'max ulp', worstUlp);
