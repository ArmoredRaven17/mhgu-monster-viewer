import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
for (const mon of ['em071_00', 'em071_05', 'em072_00']){
  const D = S.SHELL_DATA[mon];
  for (const [n, def] of Object.entries(D.shells)) for (const [m, md] of Object.entries(def.modes || {})){
    const sh = md.sh; if (!sh) continue;
    console.log(mon, n, m, 'ints', JSON.stringify(sh.ints));
  }
}
