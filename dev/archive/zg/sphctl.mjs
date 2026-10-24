import { readFileSync } from 'node:fs';
const { Mem } = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/mem.js');
await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/bridge.js');
await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/proof.js');
const { lifted } = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/cpu.js');
const J = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const m = new Mem(); const V = 0x60000000, PL = 0x60010000, SP = 0x60020000;
for (const a of [V, PL, SP]) m.load(a, new Uint8Array(0x1000));
m.w32(V + 0xd94, PL | 7);
const f = lifted(0x881d94); let bad = 0;
for (const cs of J){
  cs.planes.forEach((x, i) => m.wf32(PL + 4 * i, x)); cs.sph.forEach((x, i) => m.wf32(SP + 4 * i, x));
  const c = { r: new Uint32Array(16), sb: new Uint32Array(32) }; c.sf = new Float32Array(c.sb.buffer);
  c.r[0] = V; c.r[1] = SP; f(m, c);
  if (c.r[0] !== cs.r0 || c.r[2] !== cs.r2){ if (bad++ < 5) console.log('diff', c.r[0], cs.r0); }
}
console.log(J.length, 'cases,', bad, 'differ; taken:', f.toString().slice(0, 40).replace(/\s+/g, ' '));
