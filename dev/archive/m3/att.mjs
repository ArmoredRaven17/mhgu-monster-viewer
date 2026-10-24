import { readFileSync } from 'node:fs';
for (const s of process.argv.slice(2)){
  const j = JSON.parse(readFileSync('C:/MHGU-Extract/efx/vectors/' + s + '/draw.json', 'utf8'));
  for (const v of j.functions['0x9bba54'].vectors){
    const rd = (a, f) => { for (const [st, hx] of v.reads){ const off = a - st; if (off >= 0 && off + 4 <= hx.length / 2){ const b = Buffer.from(hx.slice(off*2, off*2+8), 'hex'); return f ? +b.readFloatLE(0).toFixed(4) : b.readUInt32LE(0); } } return null; };
    const owner = v.args[0] >>> 0, inst = v.args[1] >>> 0;
    const mode = (rd(inst + 0x10c) >>> 16) & 0xf;
    if (mode !== 2) continue;
    const par = rd(owner + 0x30), joint = rd(inst + 0x8c);
    const rows = []; for (let k = 0; k < 0x30; k += 4) rows.push(rd(owner + 0x120 + k, 1));
    console.log(s, 'parent', par && par.toString(16), 'joint', joint | 0, 'owner rows', rows.join(','));
  }
}
