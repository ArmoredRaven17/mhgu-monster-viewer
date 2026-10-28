// kushwind/inv44check.mjs: replay inv44_vectors.json (the ROM's 0x232e24 on unicorn) through rom-inv44.js; bit-for-bit compare.
import fs from 'node:fs';
const { inv232e24 } = await import(process.argv[2] ? (await import('node:url')).pathToFileURL(process.argv[2]).href : '../../../docs/render/rom/effect/rom-inv44.js');
const V = JSON.parse(fs.readFileSync(new URL('./inv44_vectors.json', import.meta.url)));
const buf = new DataView(new ArrayBuffer(0x400));
const m = { f32: a => buf.getFloat32(a, true), wf32: (a, v) => buf.setFloat32(a, v, true), u32: a => buf.getUint32(a, true), w32: (a, v) => buf.setUint32(a, v >>> 0, true) };
const A = 0x0, O = 0x100, I = 0x200;
(V.identity || [0x3f800000, 0, 0, 0, 0, 0x3f800000, 0, 0, 0, 0, 0x3f800000, 0, 0, 0, 0, 0x3f800000]).forEach((x, k) => m.w32(I + 4 * k, x));
let bad = 0, worst = '';
for (const [n, v] of V.vectors.entries()){
  v.in.forEach((x, k) => m.w32(A + 4 * k, x));
  for (let k = 0; k < 16; k++) m.w32(O + 4 * k, 0xeeeeeeee);
  inv232e24(m, O, A, I);
  const got = Array.from({ length: 16 }, (_, k) => m.u32(O + 4 * k));
  if (got.some((x, k) => x !== v.out[k])){ bad++; if (!worst) worst = n + ': ' + JSON.stringify({ got, want: v.out }); }
}
console.log(V.vectors.length + ' vectors, ' + bad + ' differ' + (worst ? ' -- first ' + worst : ''));
process.exit(bad ? 1 : 0);
