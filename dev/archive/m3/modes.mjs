import { readFileSync } from 'node:fs';
const sets = process.argv.slice(2);
for (const s of sets){
  let j; try { j = JSON.parse(readFileSync('C:/MHGU-Extract/efx/vectors/' + s + '/draw.json', 'utf8')); } catch(e){ console.log(s, 'none'); continue; }
  const rec = j.functions['0x9bba54']; if (!rec){ console.log(s, 'no 0x9bba54'); continue; }
  const out = [];
  for (const v of rec.vectors){
    const inst = v.args[1] >>> 0; let w = null, w110 = null;
    const rd = (a) => { for (const [st, hx] of v.reads){ const off = a - st; if (off >= 0 && off + 4 <= hx.length / 2){ const b = Buffer.from(hx.slice(off*2, off*2+8), 'hex'); return b.readUInt32LE(0); } } return null; };
    w = rd(inst + 0x10c); w110 = rd(inst + 0x110);
    out.push('m' + ((w >>> 16) & 0xf) + (w & 0xf00000 ? 's' : '') + '/110=' + (w110 >>> 0).toString(16));
  }
  console.log(s, rec.calls, out.join(' '));
}
