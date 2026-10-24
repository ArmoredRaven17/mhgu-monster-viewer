import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
for (const mon of ['em082_00','em082_04']){
  const D = S.SHELL_DATA[mon];
  for (const sh of Object.keys(D.shells)){
    const g = {};
    for (const [m, md] of Object.entries(D.shells[sh].modes)) { const k = JSON.stringify(md.ef); (g[k] = g[k] || []).push(m); }
    console.log(mon, sh, D.shells[sh].cls, JSON.stringify(g));
  }
  console.log(mon, 'actions', D.actions.map(a => a.variant + ' ' + a.clip + ' ' + JSON.stringify(a.spawns).slice(0,120)).join('\n  '));
}
