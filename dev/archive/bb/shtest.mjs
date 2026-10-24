// scratch: run the held em007_04 shell data through stepShells without touching the tree
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const R = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/';
let src = readFileSync(R + 'shells.js', 'utf8');
src = src.replace(/from '\.\/(beam-[a-z]+\.js)'/g, (m, f) => "from '" + pathToFileURL(R + f).href + "'");
src = src.replace('// SHELL_DATA.em007_04 = SHELL007;', 'SHELL_DATA.em007_04 = SHELL007;');
const tmp = 'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/bb/shells_tmp.mjs';
writeFileSync(tmp, src);
const M = await import(pathToFileURL(tmp).href);
const J0 = JSON.parse(readFileSync('C:/MHGU-Extract/efx/joints/em007_04_viewer_rest.json', 'utf8'));
const J = J0.joints || J0, joints = g => J[g] ? J[g].map(Math.fround) : null;
const P = (J0.unit && J0.unit.position) || [0, 0, 0];
for (const [list, clip, v, frames, sev] of [['9', 'Motion[16]', '7:0x62', 383], ['9', 'Motion[22]', '7:0xa0', 371], ['9', 'Motion[23]', '7:0xa1', 371],
  ['9', 'Motion[30]', '7:0xc8', 263], ['9', 'Motion[10]', '7:0x77', 301], ['9', 'Motion[10]', '7:0x79', 301], ['9', 'Motion[10]', '7:0x77', 301, true]]){
  const st = M.createShellState('em007_04');
  const ev = [];
  for (let k = 0; k < frames + 200; k++){
    const fr = Math.min(k, frames - 1);
    const out = M.stepShells(st, { monId: 'em007_04', list, clip, frame: fr, dt: 1, joints, owner: { x: 0, y: 0, z: 0 },
      ownerPos: { x: P[0], y: P[1], z: P[2] }, rock: { variant: v, floorY: 0, target: { x: 0, y: 0, z: 2100 } }, hitLife: true, tailSevered: !!sev });
    for (const S of out.spawned) ev.push('f' + k + ' spawn ' + S.shell + ' m' + S.modeIndex + ' at ' + S.position.map(x => x.toFixed(0)).join(',') + (S.start ? ' u' + S.start.key : ''));
    for (const r of out.refused) ev.push('f' + k + ' REFUSED ' + JSON.stringify(r));
    for (const S of out.ended) ev.push('f' + k + ' end ' + S.shell + ' m' + S.modeIndex + ' at ' + S.position.map(x => x.toFixed(0)).join(',') + ' ' + JSON.stringify((S.events || []).filter(e => e.ev !== 'stop').map(e => e.ev + (e.start ? ' u' + e.start.key : '') + (e.type != null ? ' t' + e.type : ''))));
  }
  console.log(list, clip, v, sev ? 'SEVERED' : '', '\n  ' + ev.join('\n  '));
}
