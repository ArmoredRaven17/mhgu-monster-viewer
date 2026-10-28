import { SHELL_DATA } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js';
import fs from 'fs';
const classes = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const out = {};
for (const key of Object.keys(classes)){
  const [mon, sh] = key.split('/'); const D = SHELL_DATA[mon]; const S = D && D.shells && D.shells[sh];
  if (!S || !S.modes) continue; out[key] = {};
  for (const [mi, m] of Object.entries(S.modes)) out[key][mi] = { ints: (m.sh && m.sh.ints) || [], floats: (m.sh && m.sh.floats) || [], scale: m.scale };
}
fs.writeFileSync(process.argv[3], JSON.stringify(out));
console.log(Object.keys(out).length, 'of', Object.keys(classes).length);
