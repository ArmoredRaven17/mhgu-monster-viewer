import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const [mon, ...keys] = process.argv.slice(2);
const D = S.SHELL_DATA[mon];
for (const [n, def] of Object.entries(D.shells)) for (const [m, md] of Object.entries(def.modes || {})){
  const lists = def.lists || D.lists;
  for (const [li, k] of md.ef || []) if (keys.includes(String(k))) console.log(mon, n, 'mode', m, 'ef', li, k, lists[li] && lists[li].pel, JSON.stringify(md.ef));
}
