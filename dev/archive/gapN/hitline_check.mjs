// the JS hitLine (RESULT.md b2) against the ROM-run (emu_hitline.json), bit for bit.  node hitline_check.mjs
import { readFileSync } from 'fs';
const f = Math.fround;
const mla = (acc, a, b) => f(acc + f(a * b));
const D = JSON.parse(readFileSync(new URL('./emu_hitline.json', import.meta.url)));

function hitLine(S, oldEnd, oldStart, delay0){
  const T = S.segs;
  if (!T || !T.on) return;
  if (delay0 > 0) return;
  T.calls = (T.calls + 1) >>> 0;
  if (T.calls < 2 || !T.n) return;
  const inv = f(1.0 / f(T.n + 1)), P = S.position, A = S.anchor;
  const dE = [0, 1, 2].map(i => f(inv * f(oldEnd[i] - P[i])));
  const dS = [0, 1, 2].map(i => f(inv * f(oldStart[i] - A[i])));
  for (let i = 0; i < T.n; i++){
    const k = f(i + 1);
    T.e[i] = { p0: [mla(P[0], dE[0], k), mla(P[1], dE[1], k), mla(P[2], dE[2], k)],
               p1: [mla(A[0], dS[0], k), mla(A[1], dS[1], k), mla(A[2], dS[2], k)] };
  }
}
const hex = v => { const b = Buffer.alloc(4); b.writeFloatLE(v); return b.toString('hex'); };
const I = D.in, SENT = 'aaaaaaaa';
const cases = { fill: [1, 0, 3, 1], first: [0, 0, 3, 1], delay: [5, 2, 3, 1], off: [5, 0, 3, 0], n16: [9, 0, 16, 1] };
let bad = 0, n = 0;
for (const base of ['base02', 'base58']) for (const [c, [calls, delay, nn, on]] of Object.entries(cases)){
  const S = { position: I.P.map(f), anchor: I.A.map(f), segs: { on: !!on, n: nn, calls, e: Array.from({ length: nn }, () => null) } };
  hitLine(S, I.oldEnd.map(f), I.oldStart.map(f), f(delay));
  const R = D.cases[base + '_' + c];
  const okCalls = S.segs.calls === R.calls;
  let okE = true;
  R.e.forEach((e, i) => {
    const js = S.segs.e[i];
    const want = js ? js.p0.map(hex).join('') + '00000000' + js.p1.map(hex).join('') + '00000000' : SENT.repeat(8);
    if (want !== e.raw){ okE = false; console.log('  diff', base, c, i, want, e.raw); }
  });
  n++; if (!(okCalls && okE)) bad++;
  console.log((okCalls && okE ? 'PASS ' : 'FAIL ') + base + ' ' + c + ' calls ' + S.segs.calls + '/' + R.calls);
}
console.log(bad ? bad + ' of ' + n + ' FAIL' : 'all ' + n + ' PASS');
