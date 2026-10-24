import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const want = { em079_00: [[7,0x38]], em079_04: [[7,0x2a],[7,0x0d],[7,0x27],[7,0x28],[7,0x38]], em081_04: [[7,0xc7]], em084_00: null, em087_00: null, em049_00: null };
for (const [m, list] of Object.entries(want)){
  const A = S.SHELL_DATA[m].actions || [];
  const hit = A.filter(a => !list || list.some(([s, n]) => (a.action[0] === s && a.action[1] === n) || (a.also || []).some(x => x[0] === s && x[1] === n)));
  console.log(m, hit.map(a => a.action.map(x => x.toString(16)).join(',') + '@L' + a.list + ' ' + a.clip + (a.pick ? ' ' + a.pick : '') + (a.variant ? ' ' + a.variant : '')).join(' | ').slice(0, 1500));
}
