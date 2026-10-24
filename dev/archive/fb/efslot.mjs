import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const want = process.argv.slice(2).map(x => x.split(':'));
for (const [mon, pel, key] of want){
  const D = S.SHELL_DATA[mon]; const hits = [];
  for (const [n, def] of Object.entries(D.shells)) for (const [m, md] of Object.entries(def.modes || {})){
    const lists = def.lists || D.lists;
    (md.ef || []).forEach(([li, k], slot) => { if (lists[li] && lists[li].pel === pel && String(k) === key) hits.push(n + '(' + def.base + ') m' + m + ' ef' + slot); });
  }
  console.log(mon, pel, key, hits.slice(0, 6).join('; '));
}
