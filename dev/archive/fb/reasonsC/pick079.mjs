import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
for (const mon of ['em079_00','em079_04']) for (const clip of ['Motion[12]','Motion[14]','Motion[15]','Motion[35]'])
  console.log(mon, clip, 'calm', JSON.stringify(S.pickVariantsFor(mon,'2',clip,{})), 'rage', JSON.stringify(S.pickVariantsFor(mon,'2',clip,{rage:true})));
