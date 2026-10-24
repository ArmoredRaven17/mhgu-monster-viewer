// Every whole-block binding of em057_00 / em057_04 (plan_<mon>_whole.txt) against the live psl-mask.js word, over the viewer's
// inputs: charged x rage x tired x each CLIP_ACTIONS play of the clip (or no action). Prints the bindings at bits >= 6 with the
// states that enable them, and whether the file mask had them.   node bindtable.mjs em057_00
import fs from 'fs';
import { pslMask, CLIP_ACTIONS } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js';
const mon = process.argv[2];
const rows = l => fs.readFileSync(l, 'utf8').split('\n').filter(Boolean).map(s => {
  const m = /^L(\d+) M(\d+) b(\d+) (\S+) (\S+) (\S+) on=/.exec(s); if (!m) return null;
  return { list: +m[1], slot: +m[2], bit: +m[3], pel: m[4], key: m[5], arr: m[6], norec: /no record in any array/.test(s) };
}).filter(Boolean);
const whole = rows(`plan_${mon}_whole.txt`), file = rows(`plan_${mon}_file.txt`);
const inFile = r => file.some(f => f.list === r.list && f.slot === r.slot && f.bit === r.bit && f.key === r.key);
const deviant = mon === 'em057_04';
const out = [];
for (const r of whole){
  if (r.bit < 6) continue;
  const plays = (CLIP_ACTIONS[mon] || {})[r.list + '|Motion[' + r.slot + ']'] || [{ action: null }];
  const on = [];
  for (const charged of [false, true]) for (const [rage, tired] of [[false, false], [true, false], [false, true]]){
    if (deviant && tired) continue;
    for (const p of plays){
      const w = pslMask(mon, String(r.list), r.slot, p.action, { charged, rage, tired, rank: 5 });
      if ((w >>> r.bit) & 1) on.push((charged ? 'C' : 'u') + (rage ? 'R' : tired ? 'T' : 'c') + (p.action ? '(' + p.action[0] + ',' + p.action[1].toString(16) + ')' : ''));
    }
  }
  out.push(`L${r.list} M${r.slot} b${r.bit} ${r.pel} ${r.key}${r.norec ? ' [no record]' : ''} ${inFile(r) ? 'FILE' : 'out'} -> ${on.length ? on.join(' ') : 'NEVER'}`);
}
console.log(out.join('\n'));
