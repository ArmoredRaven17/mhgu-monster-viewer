// Compare docs/render/psl-mask.js pslMask('em081_00' / 'em081_04') with the unicorn words of emu13c081.py.
import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';
const { pslMask } = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/psl-mask.js').href);
const rows = JSON.parse(readFileSync(new URL('./emu13c081.json', import.meta.url)));
let n = 0, bad = 0, skipped = 0;
for (const r of rows){
  // the viewer's state: rage and tired never both (paintTired, 0xbcd20); tired = P+0x505 in {2, 3}
  if (r.rage && r.tired) { skipped++; continue; }
  const tired = r.tired === 2 || r.tired === 3;
  const mon = r.variant === 0 ? 'em081_00' : 'em081_04';
  const w = pslMask(mon, r.motion >> 8, r.motion & 0xff, null, { rage: r.rage, tired, charge: r.t });
  n++;
  if (w !== r.word){ bad++; if (bad < 10) console.log('MISMATCH', JSON.stringify(r), w.toString(16)); }
}
console.log(n, 'compared,', bad, 'mismatches,', skipped, 'skipped (rage and tired together)');
