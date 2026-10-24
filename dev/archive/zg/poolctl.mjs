import { readFileSync } from 'node:fs';
const { Mem } = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/mem.js');
await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/bridge.js');
const { lifted } = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/cpu.js');
const J = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const m = new Mem(); const MGR = 0x60000000;
const b = new Uint8Array(0x2000); m.load(MGR, b);
for (let i = 0; i < 64; i++) m.w32(MGR + 0x770 + 4 * i, J.tab[i]);
const f = lifted(0x4187c); let bad = 0;
for (const cs of J.cases){
  cs.words.forEach((w, i) => m.w32(MGR + 0x74 + 4 * i, w));
  const c = { r: new Uint32Array(16), sb: new Uint32Array(32), sf: null };
  c.sf = new Float32Array(c.sb.buffer); c.r[0] = MGR; c.r[1] = cs.bank; c.r[4] = 0x1234;
  f(m, c);
  if (c.r[0] !== cs.r0 || c.r[4] !== cs.r4) { if (bad++ < 5) console.log('diff', cs.bank, c.r[0], cs.r0); }
}
console.log(J.cases.length, 'cases,', bad, 'differ; native is', f.name || '(anonymous)');
