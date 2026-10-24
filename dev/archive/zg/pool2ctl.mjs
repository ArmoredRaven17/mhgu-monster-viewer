import { readFileSync } from 'node:fs';
const { Mem } = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/mem.js');
await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/proof.js');
const { lifted } = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/cpu.js');
const J = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const m = new Mem(); const MGR = 0x60000000; m.load(MGR, new Uint8Array(0x2000));
for (let i = 0; i < 64; i++) m.w32(MGR + 0x770 + 4 * i, J.tab[i]);
const f = lifted(0x419e0); let bad = 0;
for (const cs of J.cases){
  const b = Buffer.from(cs.mem, 'hex'); for (let i = 0; i < b.length; i += 4) m.w32(MGR + i, b.readUInt32LE(i));
  const c = { r: new Uint32Array(16), sb: new Uint32Array(32) }; c.sf = new Float32Array(c.sb.buffer);
  c.r[0] = MGR; c.r[1] = cs.obj; c.r[2] = cs.kind; f(m, c);
  const a = Buffer.from(cs.after, 'hex'); let ok = true;
  for (let i = 0; i < a.length; i += 4) if (m.u32(MGR + i) !== a.readUInt32LE(i)){ ok = false; break; }
  if (!ok && bad++ < 3) console.log('diff', cs.kind, cs.obj);
}
console.log(J.cases.length, 'cases,', bad, 'differ');
